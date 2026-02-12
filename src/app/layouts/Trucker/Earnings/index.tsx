import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, Dimensions, RefreshControl, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Design System — Classic & Simple
// ─────────────────────────────────────────────
const C = {
    bg: '#FFFFFF',         // White background
    card: '#FFFFFF',       // White cards
    text: '#1C1C1E',       // Almost Black
    textSec: '#8E8E93',    // Secondary Text (Gray)
    border: '#E5E5EA',     // Light Border
    primary: '#007AFF',    // Classic Blue
    success: '#34C759',    // Green
    warning: '#FF9500',    // Orange
    danger: '#FF3B30',     // Red
    shadow: '#000000',
    accent: '#1976D2',
};

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M15 18l-6-6 6-6" /></Svg>);
const CalendarIcon = () => (<Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></Path><Path d="M16 2v4"></Path><Path d="M8 2v4"></Path><Path d="M3 10h18"></Path></Svg>);
const DownloadIcon = () => (<Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><Polyline points="7 10 12 15 17 10" /><Line x1="12" y1="15" x2="12" y2="3" /></Svg>);
const ArrowUpRight = () => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="7" y1="17" x2="17" y2="7" /><Polyline points="7 7 17 7 17 17" /></Svg>);

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────
interface PaymentStats {
    pending_payment: number;
    this_month_earning: number;
    last_month_earning: number;
    total_earning: number;
    remaining_balance: number;
    growth_percentage: number;
    growth_status: string;
}

interface LoadHistoryItem {
    load_id: string;
    origin_location: string;
    destination_location: string;
    load_date: string;
    amount: string;
    received_amount: string;
    due_amount: string;
    payment_status: string | null;
    partial_payment_date?: string | null;
    full_payment_date?: string | null;
    payment_date: string | null;
}

const EarningsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [history, setHistory] = useState<LoadHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchData = useCallback(async (pageNum = 1, shouldRefresh = false) => {
        if (!shouldRefresh && pageNum > 1 && !hasMore) return;

        try {
            const response = await axiosInstance.get(END_POINTS.TRUCKER_PAYMENT_HISTORY(pageNum));
            if (response.data.status === 'success') {
                const { payment_stats, load_history } = response.data.data;

                setStats(payment_stats);

                if (shouldRefresh || pageNum === 1) {
                    setHistory(load_history.data);
                } else {
                    setHistory(prev => [...prev, ...load_history.data]);
                }

                setHasMore(load_history.current_page < load_history.last_page);
                setPage(pageNum);
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [hasMore, fadeAnim]);

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchData(page + 1);
        }
    };

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const renderHeader = () => (
        <View style={s.headerContainer}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Earnings & History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Stats Cards */}
            {stats && (
                <View style={s.statsContainer}>
                    <View style={s.mainStatCard}>
                        <Text style={s.mainStatLabel}>Total Earnings</Text>
                        <Text style={s.mainStatValue}>{formatCurrency(stats.total_earning)}</Text>
                        <View style={[s.growthBadge, { backgroundColor: stats.growth_status === 'profit' ? '#E8F5E9' : '#FFEBEE' }]}>
                            <ArrowUpRight />
                            <Text style={[s.growthText, { color: stats.growth_status === 'profit' ? C.success : C.danger }]}>
                                {stats.growth_status === 'profit' ? '+' : ''}{stats.growth_percentage}%
                            </Text>
                            <Text style={s.growthLabel}> vs last month</Text>
                        </View>
                    </View>

                    <View style={s.secondaryStatsRow}>
                        <View style={s.statCard}>
                            <Text style={s.statLabel}>This Month</Text>
                            <Text style={s.statValue}>{formatCurrency(stats.this_month_earning)}</Text>
                        </View>
                        <View style={s.statCard}>
                            <Text style={s.statLabel}>Pending</Text>
                            <Text style={[s.statValue, { color: C.warning }]}>{formatCurrency(stats.pending_payment)}</Text>
                        </View>
                    </View>
                </View>
            )}

            <Text style={s.sectionTitle}>Transaction History</Text>
        </View>
    );

    const renderItem = ({ item }: { item: LoadHistoryItem }) => {
        const amount = parseFloat(item.amount) || 0;
        const received = parseFloat(item.received_amount) || 0;
        const due = parseFloat(item.due_amount) || 0;

        const total = amount;
        const paid = received;
        const pending = due;

        const progress = total > 0 ? (paid / total) * 100 : 0;

        let statusText = 'Pending';
        let statusColor = C.warning;
        let badgeBg = '#FFF3E0';
        let badgeDot = '#FFA000';

        if (due <= 0) {
            statusText = 'Fully Paid';
            statusColor = '#2E7D32'; // Dark Green
            badgeBg = '#E8F5E9';
            badgeDot = '#4CAF50';
        } else if (received > 0) {
            statusText = 'Partial Payment';
            statusColor = '#E65100'; // Dark Orange
            badgeBg = '#FFF3E0';
            badgeDot = '#FB8C00';
        } else {
            statusText = 'Payment Pending';
            statusColor = C.danger;
            badgeBg = '#FFEBEE';
            badgeDot = C.danger;
        }

        const cityOrigin = item.origin_location?.split(',')[0].trim() || 'Origin';
        const cityDest = item.destination_location?.split(',')[0].trim() || 'Dest';

        return (
            <View style={s.card}>
                {/* Header: Load ID and Route */}
                <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={s.headerTopRow}>
                            <Text style={s.loadIdLabel}> <Text style={s.loadIdValue}>{item.load_id || 'N/A'}</Text></Text>
                            <Text style={s.routeArrow}> › </Text>
                            <Text style={s.routeText} numberOfLines={1}>{cityOrigin} → {cityDest}</Text>
                        </View>
                        <Text style={s.dateText}>{formatDate(item.load_date)}</Text>
                    </View>

                    <View style={[s.statusBadge, { backgroundColor: badgeBg }]}>
                        <View style={[s.statusDot, { backgroundColor: badgeDot }]} />
                        <Text style={[s.statusText, { color: statusColor }]}>
                            {statusText}
                        </Text>
                    </View>
                </View>

                {/* Separator */}
                <View style={s.headerDivider} />

                {/* Payment Breakdown Box */}
                <View style={s.breakdownContainer}>
                    <Text style={s.breakdownTitle}>Payment Breakdown</Text>

                    <View style={s.breakdownRow}>
                        <Text style={s.breakdownLabel}>Total Cost:</Text>
                        <Text style={s.breakdownValue}>{formatCurrency(total)}</Text>
                    </View>

                    <View style={s.breakdownRow}>
                        <Text style={s.breakdownLabel}>Recieved Amount:</Text>
                        <Text style={[s.breakdownValue, { color: C.success }]}>{formatCurrency(paid)}</Text>
                    </View>

                    <View style={s.breakdownRow}>
                        <Text style={s.breakdownLabel}>Due Amount:</Text>
                        <Text style={[s.breakdownValue, { color: C.danger }]}>{formatCurrency(pending)}</Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={s.progressContainer}>
                        <View style={s.progressBarBg}>
                            <View style={[s.progressBarFill, { width: `${progress}%`, backgroundColor: progress === 100 ? C.success : C.warning }]} />
                        </View>
                        <Text style={s.progressText}>{progress.toFixed(0)}% Paid</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={s.actionRow}>
                    <TouchableOpacity style={s.btnOutline}>
                        <Text style={s.btnOutlineText}>View Details ›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.btnOutlineGray}>
                        <DownloadIcon />
                        <Text style={s.btnOutlineGrayText}>Invoice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.btnSolidBlue}>
                        <Text style={s.btnSolidText}>Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading && page === 1) {
        return (
            <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.load_id + index}
                contentContainerStyle={s.listContent}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    !loading ? (
                        <View style={s.emptyContainer}>
                            <Text style={s.emptyText}>No transaction history found.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { paddingVertical: 16, paddingHorizontal: 16 },
    listContent: { paddingBottom: 20, paddingHorizontal: 0 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: C.text },
    backBtn: { padding: 8, marginLeft: -8 },

    // Stats
    statsContainer: { gap: 12, marginBottom: 24 },
    mainStatCard: {
        backgroundColor: C.card, borderRadius: 12, padding: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2
    },
    mainStatLabel: { fontSize: 14, color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    mainStatValue: { fontSize: 32, fontWeight: '700', color: C.text, marginBottom: 8 },
    growthBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    growthText: { fontSize: 12, fontWeight: '700', marginRight: 4 },
    growthLabel: { fontSize: 12, color: C.textSec },

    secondaryStatsRow: { flexDirection: 'row', gap: 12 },
    statCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 16,
        shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 1
    },
    statLabel: { fontSize: 12, color: C.textSec, marginBottom: 6 },
    statValue: { fontSize: 18, fontWeight: '600', color: C.text },

    // Section Title
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8, marginTop: 16 },

    // NEW CARD STYLES
    card: {
        backgroundColor: C.card,
        paddingVertical: 12,
        paddingHorizontal: 0,
        marginBottom: 0, // No margin, border acts as gap
        borderBottomWidth: 9, // Thicker separator like Flipkart
        borderBottomColor: '#F1F5F9',
        // Removed border, shadow, radius for flat look
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingHorizontal: 16 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
    loadIdLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    loadIdValue: { fontSize: 13, color: '#111827', fontWeight: '700' },
    routeArrow: { fontSize: 14, color: '#9CA3AF', marginHorizontal: 4 },
    routeText: { fontSize: 13, color: '#111827', fontWeight: '600', flexShrink: 1 },
    dateText: { fontSize: 12, color: '#9CA3AF' },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#FFF7ED', gap: 6, maxWidth: '45%' },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
    statusText: { fontSize: 10, fontWeight: '500', color: '#B45309', flexShrink: 1 },

    headerDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12, marginHorizontal: 16 },

    breakdownContainer: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 12, marginHorizontal: 16 },
    breakdownTitle: { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase' },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    breakdownLabel: { fontSize: 12, color: '#6B7280' },
    breakdownValue: { fontSize: 13, fontWeight: '600', color: '#111827' },

    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    progressBarBg: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
    progressBarFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 3 },
    progressText: { fontSize: 11, fontWeight: '600', color: '#374151' },

    actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
    btnOutline: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: C.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.primary },
    btnOutlineGray: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    btnOutlineGrayText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    btnSolidBlue: { flex: 1, paddingVertical: 8, backgroundColor: C.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    btnSolidText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
    emptyText: { color: C.textSec, fontSize: 14 },
});

export default EarningsScreen;
