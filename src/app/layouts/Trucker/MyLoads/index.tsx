import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Animated, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';

// ─────────────────────────────────────────────
// Design Tokens (matches app design system)
// ─────────────────────────────────────────────
const C = {
    bg: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    text: '#1C1C1E',
    textSec: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#2C5282',
    accentLight: '#EBF0F7',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',
    white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const BackIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
);
const ChevronRight = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M9 18l6-6-6-6" />
    </Svg>
);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return 'N/A';
    const num = parseFloat(String(price));
    if (isNaN(num)) return String(price);
    return '₹' + num.toLocaleString('en-IN');
};

const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
};

const safeString = (val: any): string => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') return val.length_label || val.name || val.label || 'N/A';
    return String(val) || 'N/A';
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
interface Props {
    onBack?: () => void;
    onLoadPress?: (loadId: string, loadData?: any) => void;
}

const MyLoadsScreen: React.FC<Props> = ({ onBack, onLoadPress }) => {
    const [loads, setLoads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchAppliedLoads = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const response: any = await axiosInstance.get(END_POINTS.TRUCKER_APPLIED_LOADS);
            if (response?.data?.status === 'success') {
                const loadList = response.data.data?.data || response.data.data || [];
                setLoads(Array.isArray(loadList) ? loadList : []);
            }
        } catch (error) {
            console.log('Error fetching applied loads:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAppliedLoads();
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAppliedLoads(true);
    };

    // ── Load Card ──
    const LoadCard = ({ load, index }: { load: any; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
        }, []);

        const isActive = load.status === '1';

        return (
            <Animated.View style={{
                opacity: cardAnim,
                transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }}>
                <TouchableOpacity
                    style={s.loadCard}
                    activeOpacity={0.7}
                    onPress={() => onLoadPress?.(load.load_id, load)}
                >
                    {/* Header Row */}
                    <View style={s.cardHeader}>
                        <View style={s.loadIdRow}>
                            <Text style={s.loadId}>{load.load_id || 'N/A'}</Text>
                            <View style={[s.statusBadge, { backgroundColor: isActive ? C.successLight : C.dangerLight }]}>
                                <View style={[s.statusDot, { backgroundColor: isActive ? C.success : C.danger }]} />
                                <Text style={[s.statusText, { color: isActive ? C.success : C.danger }]}>
                                    {isActive ? 'Active' : 'Closed'}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight />
                    </View>

                    {/* Route */}
                    <View style={s.routeSection}>
                        <View style={s.routeRow}>
                            <View style={s.routePointContainer}>
                                <View style={s.dotGreen} />
                                <Text style={s.routeCity} numberOfLines={1}>
                                    {load.origin_location?.split(',')[0] || 'N/A'}
                                </Text>
                            </View>
                            <View style={s.routeArrow}>
                                <View style={s.routeLine} />
                                <Text style={s.arrowText}>→</Text>
                                <View style={s.routeLine} />
                            </View>
                            <View style={s.routePointContainer}>
                                <View style={s.dotRed} />
                                <Text style={s.routeCity} numberOfLines={1}>
                                    {load.destination_location?.split(',')[0] || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Your Bid */}
                    <View style={s.bidSection}>
                        <View style={s.bidRow}>
                            <Text style={s.bidLabel}>Your Bid</Text>
                            <Text style={s.bidValue}>{formatPrice(load.trucker_price)}</Text>
                        </View>

                    </View>

                    {/* Footer */}
                    <View style={s.cardFooter}>
                        <View style={s.metaRow}>
                            <Text style={s.metaText}>📦 {safeString(load.vehicle_body)}</Text>
                            <View style={s.metaDot} />
                            <Text style={s.metaText}>{safeString(load.vehicle_length)}</Text>
                        </View>
                        <Text style={s.appliedAt}>Applied {getTimeAgo(load.applied_at)}</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <Text style={s.headerTitle}>My Loads</Text>
                <View style={s.headerSpacer} />
            </View>

            {/* Count Badge */}
            {!loading && loads.length > 0 && (
                <View style={s.countBar}>
                    <Text style={s.countText}>
                        {loads.length} applied load{loads.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            {/* Loading */}
            {loading ? (
                <View style={s.centerState}>
                    <ActivityIndicator size="large" color={C.accent} />
                    <Text style={s.loadingText}>Loading your loads...</Text>
                </View>
            ) : loads.length === 0 ? (
                /* Empty State */
                <View style={s.centerState}>
                    <Text style={s.emptyEmoji}>📋</Text>
                    <Text style={s.emptyTitle}>No Applied Loads</Text>
                    <Text style={s.emptyText}>Loads you bid on will appear here</Text>
                </View>
            ) : (
                /* Loads List */
                <ScrollView
                    style={s.scrollView}
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
                    }
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {loads.map((load: any, index: number) => (
                            <LoadCard key={load.id || index} load={load} index={index} />
                        ))}
                    </Animated.View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceAlt,
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
    headerSpacer: { width: 36 },

    // Count bar
    countBar: {
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: C.accentLight,
    },
    countText: { fontSize: 13, fontWeight: '600', color: C.accent },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },

    // States
    centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 14, color: C.textSec, marginTop: 12 },
    emptyEmoji: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
    emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },

    // Load Card
    loadCard: {
        backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
        padding: 16, marginBottom: 12, overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    loadIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    loadId: { fontSize: 15, fontWeight: '700', color: C.text },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 5,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '600' },

    // Route
    routeSection: {
        paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight,
    },
    routeRow: { flexDirection: 'row', alignItems: 'center' },
    routePointContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
    dotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },
    routeCity: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },
    routeArrow: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 6,
    },
    routeLine: { width: 12, height: 1.5, backgroundColor: C.border },
    arrowText: { fontSize: 12, color: C.textMuted, marginHorizontal: 2 },

    // Bid
    bidSection: {
        paddingBottom: 14, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight,
    },
    bidRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
    },
    bidLabel: { fontSize: 12, color: C.textSec },
    bidValue: { fontSize: 16, fontWeight: '800', color: C.accent },
    offeredValue: { fontSize: 14, fontWeight: '600', color: C.textSec },

    // Footer
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 11, color: C.textMuted },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.border, marginHorizontal: 6 },
    appliedAt: { fontSize: 11, color: C.textMuted },
});

export default MyLoadsScreen;
