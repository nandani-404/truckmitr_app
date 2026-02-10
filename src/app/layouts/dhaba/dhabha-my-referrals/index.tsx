import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { hitSlop } from '@truckmitr/src/app/functions';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import moment from 'moment';

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    let bg = '#F3F4F6';
    let color = '#4B5563';
    let icon = 'ellipse';

    const lowerStatus = status?.toLowerCase();

    if (lowerStatus === 'paid' || lowerStatus === 'verified' || lowerStatus === 'credited') {
        bg = '#DCFCE7';
        color = '#16A34A';
        icon = 'checkmark-circle';
    } else if (lowerStatus === 'pending') {
        bg = '#FEF3C7';
        color = '#D97706';
        icon = 'time';
    } else if (lowerStatus === 'rejected') {
        bg = '#FEE2E2';
        color = '#DC2626';
        icon = 'close-circle';
    }

    return (
        <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: color, textTransform: 'capitalize' }]}>{t(lowerStatus || status)}</Text>
        </View>
    );
};

export default function DhabhaMyReferrals() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const safeAreaInsets = useSafeAreaInsets();
    useStatusBarStyle('dark-content');

    // Filter State
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    // Criteria
    // status: 'all', 'paid', 'pending'
    const [statusFilter, setStatusFilter] = useState('all');
    // filter (date): 'today', 'last7Days', 'last30Days', 'allTime'
    const [dateRange, setDateRange] = useState('allTime');

    // Data State
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalEarned: 0,
        pendingCount: 0,
        totalReferrals: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    const fetchReferrals = useCallback(async () => {
        try {
            setLoading(true);

            // Map UI filters to API params
            let apiStatus = 'all';
            if (statusFilter === 'paid') apiStatus = 'paid';
            else if (statusFilter === 'pending') apiStatus = 'pending';

            let apiFilter = 'all';
            if (dateRange === 'today') apiFilter = 'today';
            else if (dateRange === 'last7Days') apiFilter = 'last7';
            else if (dateRange === 'last30Days') apiFilter = 'last30';

            const response = await axiosInstance.get(END_POINTS.DHABA_COMMISSION_DETAILS, {
                params: {
                    filter: apiFilter,
                    status: apiStatus
                }
            });

            if (response.data && response.data.success && response.data.data) {
                console.log(`response.data.data`, response.data.data);

                const apiData = response.data.data;
                const driversList = apiData.drivers || [];
                setReferrals(driversList);

                // Pending count: drivers with status 'pending'
                const pendingC = driversList.filter((item: any) => item?.status?.toLowerCase() === 'pending').length;

                setStats({
                    totalEarned: parseFloat(apiData.total_commission) || 0,
                    pendingCount: pendingC,
                    totalReferrals: parseInt(apiData.driver_count) || 0
                });
            } else {
                setReferrals([]);
                setStats({ totalEarned: 0, pendingCount: 0, totalReferrals: 0 });
            }
        } catch (error) {
            console.error('Error fetching referrals:', error);
            setReferrals([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, dateRange]);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReferrals();
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setDateRange('allTime');
        setIsFilterModalVisible(false);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            {/* Header Row: Name & Status */}
            <View style={styles.cardHeader}>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(item.driver_name || 'U').charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.driverName}>{item.driver_name || 'Unknown User'}</Text>
                        <View style={styles.metaRow}>
                            <Ionicons name="call-outline" size={12} color="#6B7280" />
                            <Text style={styles.metaText}>{item.driver_mobile || 'N/A'}</Text>
                        </View>
                    </View>
                </View>
                <StatusBadge status={item.status || 'Pending'} />
            </View>

            <View style={styles.divider} />

            {/* Details Row: Date & Wallet */}
            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>{t('date')}</Text>
                    <Text style={styles.value}>
                        {item.date ? moment(item.date).format('DD MMM YYYY, hh:mm A') : t('notSpecified')}
                    </Text>
                </View>

                {item.status?.toLowerCase() === 'paid' && (
                    <View style={[styles.walletStatus, styles.walletSuccess]}>
                        <Ionicons name="wallet" size={14} color="#15803D" />
                        <Text style={[styles.walletText, { color: '#15803D' }]}>
                            ₹{item.amount || 0}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={hitSlop(10)}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('myReferrals')}</Text>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setIsFilterModalVisible(true)}
                >
                    <Ionicons name="filter" size={20} color="#1F2937" />
                    {(dateRange !== 'allTime' || statusFilter !== 'all') && (
                        <View style={styles.filterBadge} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                    <Text style={styles.statLabel}>{t('totalReferrals')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>₹{stats.totalEarned}</Text>
                    <Text style={styles.statLabel}>{t('totalEarnedLabel')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.pendingCount}</Text>
                    <Text style={styles.statLabel}>{t('pending')}</Text>
                </View>
            </View>

            {/* Status Filter Chips (Quick Access) */}
            <View style={styles.filterRow}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['all', 'paid', 'pending']}
                    keyExtractor={item => item}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingVertical: 10 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setStatusFilter(item)}
                            style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterChipText, statusFilter === item && styles.filterChipTextActive]}>
                                {t(item)}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Drivers List */}
            {loading && !refreshing ? (
                <View style={[styles.listContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : (
                <FlatList
                    data={referrals}
                    keyExtractor={(item, index) => item.driver_id?.toString() || index.toString()}
                    contentContainerStyle={[styles.listContent, { paddingBottom: safeAreaInsets.bottom + 20 }]}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>{t('noReferralsFound')}</Text>
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.clearFilterLink}>{t('clearFilters')}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Comprehensive Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { paddingBottom: safeAreaInsets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('filterReferrals')}</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>

                            {/* Date Range Section */}
                            <Text style={styles.filterSectionTitle}>{t('dateRange')}</Text>
                            <View style={styles.filterOptionsGrid}>
                                {['allTime', 'today', 'last7Days', 'last30Days'].map((range) => (
                                    <TouchableOpacity
                                        key={range}
                                        style={[styles.optionChip, dateRange === range && styles.optionChipSelected]}
                                        onPress={() => setDateRange(range)}
                                    >
                                        <Text style={[styles.optionText, dateRange === range && styles.optionTextSelected]}>{t(range)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.sectionDivider} />

                            {/* Status Section */}
                            <Text style={styles.filterSectionTitle}>{t('status')}</Text>
                            <View style={styles.filterOptionsGrid}>
                                {['all', 'paid', 'pending'].map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.optionChip, statusFilter === status && styles.optionChipSelected]}
                                        onPress={() => setStatusFilter(status)}
                                    >
                                        <Text style={[styles.optionText, statusFilter === status && styles.optionTextSelected]}>{t(status)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                        </ScrollView>

                        {/* Modal Actions */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.resetBtn}
                                onPress={() => {
                                    setStatusFilter('all');
                                    setDateRange('allTime');
                                }}
                            >
                                <Text style={styles.resetBtnText}>{t('reset')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => setIsFilterModalVisible(false)}
                            >
                                <Text style={styles.applyBtnText}>{t('applyFilters')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    filterBtn: { padding: 8, position: 'relative' },
    filterBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EA580C', position: 'absolute', top: 6, right: 6 },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

    // Quick Filters
    filterRow: { height: 60 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },
    filterChipText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    filterChipTextActive: { color: '#FFFFFF' },

    // List
    listContent: { padding: 16, paddingTop: 6 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    avatarText: { fontSize: 18, fontWeight: '600', color: '#4B5563' },
    driverName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: '#6B7280' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#9CA3AF' },

    badgeContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '600' },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    dateContainer: { flex: 1 },
    label: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
    value: { fontSize: 13, color: '#374151', fontWeight: '500' },

    walletStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    walletSuccess: { backgroundColor: '#F0FDF4' },
    walletPending: { backgroundColor: '#FFFBEB' },
    walletError: { backgroundColor: '#FEF2F2' },
    walletText: { fontSize: 12, fontWeight: '600' },

    rejectReasonBox: { marginTop: 12, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8 },
    rejectReasonText: { fontSize: 12, color: '#DC2626' },

    // Empty State
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { marginTop: 16, fontSize: 15, color: '#6B7280' },
    clearFilterLink: { marginTop: 8, fontSize: 15, color: '#EA580C', fontWeight: '600' },

    // Filter Modal
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    modalBody: { marginBottom: 20 },
    filterSectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
    filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#F3F4F6' },
    optionChipSelected: { backgroundColor: '#FFF7ED', borderColor: '#EA580C' },
    optionText: { fontSize: 14, color: '#4B5563' },
    optionTextSelected: { color: '#EA580C', fontWeight: '600' },
    sectionDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },

    modalFooter: { flexDirection: 'row', gap: 12 },
    resetBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
    resetBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
    applyBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#EA580C', alignItems: 'center' },
    applyBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
