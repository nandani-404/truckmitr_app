import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    Platform,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { hitSlop } from '@truckmitr/src/app/functions';

// Mock Data
const MOCK_REFERRALS = [
    {
        id: '1',
        name: 'Rajesh Kumar',
        mobile: '98******12',
        state: 'Haryana',
        date: '27 Jan 2024, 10:30 AM',
        timestamp: new Date('2024-01-27T10:30:00').getTime(),
        status: 'Verified',
        walletStatus: 'Credited',
        amount: 10
    },
    {
        id: '2',
        name: 'Amit Singh',
        mobile: '99******45',
        state: 'Punjab',
        date: '26 Jan 2024, 02:15 PM',
        timestamp: new Date('2024-01-26T14:15:00').getTime(),
        status: 'Pending',
        walletStatus: 'Pending',
        amount: 10
    },
    {
        id: '3',
        name: 'Vikram Yadav',
        mobile: '88******99',
        state: 'Rajasthan',
        date: '25 Jan 2024, 11:00 AM',
        timestamp: new Date('2024-01-25T11:00:00').getTime(),
        status: 'Rejected',
        walletStatus: 'Not Eligible',
        amount: 0,
        rejectReason: 'Duplicate Entry'
    },
    {
        id: '4',
        name: 'Suresh Patel',
        mobile: '91******23',
        state: 'Gujarat',
        date: '24 Jan 2024, 04:45 PM',
        timestamp: new Date('2024-01-24T16:45:00').getTime(),
        status: 'Verified',
        walletStatus: 'Credited',
        amount: 10
    },
    {
        id: '5',
        name: 'Dinesh Karthik',
        mobile: '78******56',
        state: 'Tamil Nadu',
        date: '23 Jan 2024, 09:20 AM',
        timestamp: new Date('2024-01-23T09:20:00').getTime(),
        status: 'Pending',
        walletStatus: 'Pending',
        amount: 10
    }
];

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    let bg = '#F3F4F6';
    let color = '#4B5563';
    let icon = 'ellipse';

    if (status === 'Verified') {
        bg = '#DCFCE7';
        color = '#16A34A';
        icon = 'checkmark-circle';
    } else if (status === 'Pending') {
        bg = '#FEF3C7';
        color = '#D97706';
        icon = 'time';
    } else if (status === 'Rejected') {
        bg = '#FEE2E2';
        color = '#DC2626';
        icon = 'close-circle';
    }

    return (
        <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: color }]}>{status}</Text>
        </View>
    );
};

export default function DhabhaMyReferrals() {
    const navigation = useNavigation();
    const safeAreaInsets = useSafeAreaInsets();
    useStatusBarStyle('dark-content');

    // Filter State
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    // Criteria
    const [statusFilter, setStatusFilter] = useState('All'); // For Quick Chips
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [dateRange, setDateRange] = useState('All Time');

    // All Indian States
    const ALL_STATES = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
        'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
        'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
        'Lakshadweep', 'Puducherry'
    ];

    // Filter Logic
    const filteredData = useMemo(() => {
        return MOCK_REFERRALS.filter(item => {
            // 1. Status Check
            if (statusFilter !== 'All' && item.status !== statusFilter) return false;

            // 2. State Check
            if (selectedStates.length > 0 && !selectedStates.includes(item.state)) return false;

            // 3. Date Check (Mock Logic)
            const now = new Date().getTime();
            const OneDay = 24 * 60 * 60 * 1000;
            const diff = now - item.timestamp;

            if (dateRange === 'Today') {
                if (diff > OneDay) return false; // Rough check
            } else if (dateRange === 'Last 7 Days') {
                if (diff > 7 * OneDay) return false;
            } else if (dateRange === 'Last 30 Days') {
                if (diff > 30 * OneDay) return false;
            }

            return true;
        });
    }, [statusFilter, selectedStates, dateRange]);

    // Calculate Stats based on filtered data OR total data? Usually total stats shown, but filtered list.
    // Let's show Total stats always.
    const totalReferrals = MOCK_REFERRALS.length;
    const totalEarned = MOCK_REFERRALS.reduce((sum, item) => sum + (item.amount || 0), 0);
    const pendingCount = MOCK_REFERRALS.filter(item => item.status === 'Pending').length;

    const toggleStateSelection = (state: string) => {
        setSelectedStates(prev =>
            prev.includes(state)
                ? prev.filter(s => s !== state)
                : [...prev, state]
        );
    };

    const clearFilters = () => {
        setStatusFilter('All');
        setSelectedStates([]);
        setIsStateDropdownOpen(false);
        setDateRange('All Time');
        setIsFilterModalVisible(false);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            {/* Header Row: Name & Status */}
            <View style={styles.cardHeader}>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <View style={styles.metaRow}>
                            <Ionicons name="call-outline" size={12} color="#6B7280" />
                            <Text style={styles.metaText}>{item.mobile}</Text>
                            <View style={styles.dot} />
                            <Text style={styles.metaText}>{item.state}</Text>
                        </View>
                    </View>
                </View>
                <StatusBadge status={item.status} />
            </View>

            <View style={styles.divider} />

            {/* Details Row: Date & Wallet */}
            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Registered On</Text>
                    <Text style={styles.value}>{item.date}</Text>
                </View>

                <View style={[styles.walletStatus,
                item.walletStatus === 'Credited' ? styles.walletSuccess :
                    item.walletStatus === 'Pending' ? styles.walletPending : styles.walletError
                ]}>
                    <Ionicons
                        name={item.walletStatus === 'Credited' ? 'wallet' : 'wallet-outline'}
                        size={14}
                        color={
                            item.walletStatus === 'Credited' ? '#15803D' :
                                item.walletStatus === 'Pending' ? '#B45309' : '#B91C1C'
                        }
                    />
                    <Text style={[styles.walletText, {
                        color: item.walletStatus === 'Credited' ? '#15803D' :
                            item.walletStatus === 'Pending' ? '#B45309' : '#B91C1C'
                    }]}>
                        {item.walletStatus === 'Credited' ? `₹${item.amount} Credited` : item.walletStatus}
                    </Text>
                </View>
            </View>

            {item.rejectReason && (
                <View style={styles.rejectReasonBox}>
                    <Text style={styles.rejectReasonText}>Reason: {item.rejectReason}</Text>
                </View>
            )}
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
                <Text style={styles.headerTitle}>My Referrals</Text>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setIsFilterModalVisible(true)}
                >
                    <Ionicons name="filter" size={20} color="#1F2937" />
                    {(selectedStates.length > 0 || dateRange !== 'All Time' || statusFilter !== 'All') && (
                        <View style={styles.filterBadge} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalReferrals}</Text>
                    <Text style={styles.statLabel}>Total Referrals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>₹{totalEarned}</Text>
                    <Text style={styles.statLabel}>Total Earned</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

            {/* Status Filter Chips (Quick Access) */}
            <View style={styles.filterRow}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['All', 'Verified', 'Pending', 'Rejected']}
                    keyExtractor={item => item}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingVertical: 10 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setStatusFilter(item)}
                            style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterChipText, statusFilter === item && styles.filterChipTextActive]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Drivers List */}
            <FlatList
                data={filteredData}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: safeAreaInsets.bottom + 20 }]}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No drivers found matching filters.</Text>
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearFilterLink}>Clear Filters</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

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
                            <Text style={styles.modalTitle}>Filter Drivers</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>

                            {/* Date Range Section */}
                            <Text style={styles.filterSectionTitle}>Date Range</Text>
                            <View style={styles.filterOptionsGrid}>
                                {['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'].map((range) => (
                                    <TouchableOpacity
                                        key={range}
                                        style={[styles.optionChip, dateRange === range && styles.optionChipSelected]}
                                        onPress={() => setDateRange(range)}
                                    >
                                        <Text style={[styles.optionText, dateRange === range && styles.optionTextSelected]}>{range}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.sectionDivider} />

                            {/* Status Section */}
                            <Text style={styles.filterSectionTitle}>Status</Text>
                            <View style={styles.filterOptionsGrid}>
                                {['All', 'Verified', 'Pending', 'Rejected'].map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.optionChip, statusFilter === status && styles.optionChipSelected]}
                                        onPress={() => setStatusFilter(status)}
                                    >
                                        <Text style={[styles.optionText, statusFilter === status && styles.optionTextSelected]}>{status}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.sectionDivider} />

                            {/* State Section */}
                            {/* State Section */}
                            <Text style={styles.filterSectionTitle}>State</Text>
                            <View>
                                <TouchableOpacity
                                    style={styles.dropdownHeader}
                                    onPress={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dropdownHeaderText, { color: selectedStates.length > 0 ? '#111827' : '#6B7280' }]} numberOfLines={1}>
                                        {selectedStates.length > 0 ? selectedStates.join(', ') : 'Select State'}
                                    </Text>
                                    <Ionicons name={isStateDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                                </TouchableOpacity>

                                {isStateDropdownOpen && (
                                    <View style={styles.dropdownList}>
                                        {ALL_STATES.map((state, index) => (
                                            <TouchableOpacity
                                                key={state}
                                                style={[
                                                    styles.dropdownItem,
                                                    index === ALL_STATES.length - 1 && { borderBottomWidth: 0 }
                                                ]}
                                                onPress={() => toggleStateSelection(state)}
                                            >
                                                <Text style={[styles.dropdownItemText, selectedStates.includes(state) && styles.dropdownItemTextSelected]}>
                                                    {state}
                                                </Text>
                                                {selectedStates.includes(state) && (
                                                    <Ionicons name="checkmark" size={18} color="#EA580C" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                        </ScrollView>

                        {/* Modal Actions */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.resetBtn}
                                onPress={() => {
                                    setStatusFilter('All');
                                    setSelectedStates([]);
                                    setDateRange('All Time');
                                }}
                            >
                                <Text style={styles.resetBtnText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => setIsFilterModalVisible(false)}
                            >
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
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

    // Dropdown Styles
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
    },
    dropdownHeaderText: {
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    dropdownList: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#374151',
    },
    dropdownItemTextSelected: {
        color: '#EA580C',
        fontWeight: '600',
    },
});
