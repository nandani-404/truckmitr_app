import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,

    StyleSheet,
    ActivityIndicator,
    StatusBar,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop } from '@truckmitr/src/app/functions';
import { useTranslation } from 'react-i18next';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Subscription types and their commission rates (commission = half of subscription price)
const SUBSCRIPTION_TYPES = {
    JOB_READY: {
        id: 'JOB_READY',
        name: 'Job Ready Driver',
        color: '#22C55E',
        bgColor: '#F0FDF4',
        borderColor: '#BBF7D0',
        subscriptionPrice: 99,
        commission: 49.50,
    },
    VERIFIED: {
        id: 'VERIFIED',
        name: 'Verified Driver',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        subscriptionPrice: 199,
        commission: 99.50,
    },
    TRUSTED: {
        id: 'TRUSTED',
        name: 'Trusted Driver',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        borderColor: '#DDD6FE',
        subscriptionPrice: 499,
        commission: 249.50,
    },
};

const HIRING_COMMISSION = 100; // Commission per driver hired

interface Driver {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    profileImage: string;
    subscriptionType: 'JOB_READY' | 'VERIFIED' | 'TRUSTED' | null;
    subscriptionDate: string | null;
    hiringDate: string;
    jobType: 'REGULAR' | 'PREMIUM' | 'SUPER_PREMIUM';
}

// Mock data for drivers - Replace with API call
const MOCK_DRIVERS: Driver[] = [
    {
        id: '1',
        name: 'Ramesh Kumar',
        tmId: 'TM2503UPDR00001',
        mobile: '+91 98765 43210',
        profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
        subscriptionType: 'JOB_READY',
        subscriptionDate: '2026-01-05',
        hiringDate: '2026-01-01',
        jobType: 'REGULAR',
    },
    {
        id: '2',
        name: 'Suresh Singh',
        tmId: 'TM2503UPDR00002',
        mobile: '+91 98765 43211',
        profileImage: 'https://randomuser.me/api/portraits/men/2.jpg',
        subscriptionType: 'VERIFIED',
        subscriptionDate: '2026-01-03',
        hiringDate: '2025-12-28',
        jobType: 'PREMIUM',
    },
    {
        id: '3',
        name: 'Mahesh Yadav',
        tmId: 'TM2503UPDR00003',
        mobile: '+91 98765 43212',
        profileImage: 'https://randomuser.me/api/portraits/men/3.jpg',
        subscriptionType: 'TRUSTED',
        subscriptionDate: '2026-01-08',
        hiringDate: '2026-01-02',
        jobType: 'SUPER_PREMIUM',
    },
    {
        id: '4',
        name: 'Rajesh Sharma',
        tmId: 'TM2503UPDR00004',
        mobile: '+91 98765 43213',
        profileImage: 'https://randomuser.me/api/portraits/men/4.jpg',
        subscriptionType: 'JOB_READY',
        subscriptionDate: '2026-01-06',
        hiringDate: '2026-01-04',
        jobType: 'REGULAR',
    },
    {
        id: '5',
        name: 'Anil Verma',
        tmId: 'TM2503UPDR00005',
        mobile: '+91 98765 43214',
        profileImage: 'https://randomuser.me/api/portraits/men/5.jpg',
        subscriptionType: 'VERIFIED',
        subscriptionDate: '2026-01-07',
        hiringDate: '2026-01-03',
        jobType: 'PREMIUM',
    },
    {
        id: '6',
        name: 'Dinesh Gupta',
        tmId: 'TM2503UPDR00006',
        mobile: '+91 98765 43215',
        profileImage: 'https://randomuser.me/api/portraits/men/6.jpg',
        subscriptionType: null, // No subscription yet
        subscriptionDate: null,
        hiringDate: '2026-01-09',
        jobType: 'REGULAR',
    },
];

interface DriverCardProps {
    driver: Driver;
    onPress?: () => void;
}

const DriverCard = ({ driver, onPress }: DriverCardProps) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();

    const subscription = driver.subscriptionType
        ? SUBSCRIPTION_TYPES[driver.subscriptionType]
        : null;

    const subscriptionCommission = subscription ? subscription.commission : 0;
    const totalCommission = subscriptionCommission + HIRING_COMMISSION;

    const getJobTypeLabel = (type: string) => {
        switch (type) {
            case 'PREMIUM': return { label: 'Premium Job', color: '#F59E0B', bg: '#FFFBEB' };
            case 'SUPER_PREMIUM': return { label: 'Super Premium', color: '#7C3AED', bg: '#F5F3FF' };
            default: return { label: 'Hiring', color: '#64748B', bg: '#F1F5F9' };
        }
    };

    const jobTypeInfo = getJobTypeLabel(driver.jobType);

    return (
        <TouchableOpacity
            style={styles.driverCard}
            activeOpacity={0.8}
            onPress={onPress}
        >
            {/* Driver Info Row */}
            <View style={styles.driverInfoRow}>
                {/* Profile Image */}
                <Image
                    source={{ uri: driver.profileImage }}
                    style={styles.driverImage}
                />

                {/* Driver Details */}
                <View style={styles.driverDetails}>
                    <View style={styles.nameRow}>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        {/* Job Type Badge */}
                        {driver.jobType !== 'REGULAR' && (
                            <View style={[styles.miniBadge, { backgroundColor: jobTypeInfo.bg }]}>
                                <Text style={[styles.miniBadgeText, { color: jobTypeInfo.color }]}>
                                    {jobTypeInfo.label}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.driverId}>{driver.tmId}</Text>
                    <Text style={styles.driverMobile}>{driver.mobile}</Text>
                </View>

                {/* Subscription Badge */}
                {subscription && (
                    <View style={[
                        styles.subscriptionBadge,
                        {
                            backgroundColor: subscription.bgColor,
                            borderColor: subscription.borderColor,
                        }
                    ]}>
                        <Text style={[styles.subscriptionBadgeText, { color: subscription.color }]}>
                            {subscription.name}
                        </Text>
                    </View>
                )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Commission Details */}
            <View style={styles.commissionSection}>
                <Text style={styles.commissionTitle}>Commission Earned</Text>

                <View style={styles.commissionRow}>
                    {/* Hiring Commission */}
                    <View style={styles.commissionItem}>
                        <View style={[styles.commissionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="person-add" size={14} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={styles.commissionLabel}>Hiring</Text>
                            <Text style={[styles.commissionAmount, { color: '#F59E0B' }]}>
                                ₹{HIRING_COMMISSION}
                            </Text>
                        </View>
                    </View>

                    {/* Subscription Commission */}
                    <View style={styles.commissionItem}>
                        <View style={[
                            styles.commissionIcon,
                            { backgroundColor: subscription ? subscription.bgColor : '#F1F5F9' }
                        ]}>
                            <Ionicons
                                name="card"
                                size={14}
                                color={subscription ? subscription.color : '#94A3B8'}
                            />
                        </View>
                        <View>
                            <Text style={styles.commissionLabel}>Subscription</Text>
                            <Text style={[
                                styles.commissionAmount,
                                { color: subscription ? subscription.color : '#94A3B8' }
                            ]}>
                                {subscription ? `₹${subscriptionCommission}` : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {/* Total Commission */}
                    <View style={styles.commissionItem}>
                        <View style={[styles.commissionIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="wallet" size={14} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.commissionLabel}>Total</Text>
                            <Text style={[styles.commissionAmount, { color: '#10B981', fontWeight: '700' }]}>
                                ₹{subscription ? totalCommission : HIRING_COMMISSION}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function ForemanEarnings() {
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SUBSCRIPTION' | 'HIRING' | 'PREMIUM' | 'SUPER_PREMIUM'>('ALL');
    const [selectedSubscription, setSelectedSubscription] = useState<'ALL' | 'JOB_READY' | 'VERIFIED' | 'TRUSTED'>('ALL');

    // Fetch drivers on focus
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            setTimeout(() => {
                setDrivers(MOCK_DRIVERS);
                setLoading(false);
            }, 500);
        }, [])
    );

    const goBack = () => {
        navigation.goBack();
    };

    // Filter logic
    const filteredDrivers = drivers.filter(driver => {
        // First level filter
        if (selectedCategory === 'HIRING') {
            // Hiring shows all hired drivers (which is effectively all in this context, or maybe filtering by hiring date?)
            // Assuming simplified: All drivers are hired.
            return true;
        }
        if (selectedCategory === 'PREMIUM') {
            return driver.jobType === 'PREMIUM';
        }
        if (selectedCategory === 'SUPER_PREMIUM') {
            return driver.jobType === 'SUPER_PREMIUM';
        }
        if (selectedCategory === 'SUBSCRIPTION') {
            // Check subscription type
            if (!driver.subscriptionType) return false;

            // Second level filter for subscription
            if (selectedSubscription === 'ALL') return true;
            return driver.subscriptionType === selectedSubscription;
        }
        return true;
    });

    // Calculate totals
    const totalHiringCommission = drivers.length * HIRING_COMMISSION;
    const totalSubscriptionCommission = drivers.reduce((sum, driver) => {
        if (driver.subscriptionType) {
            return sum + SUBSCRIPTION_TYPES[driver.subscriptionType].commission;
        }
        return sum;
    }, 0);
    const totalCommission = totalHiringCommission + totalSubscriptionCommission;

    const categories = [
        { id: 'ALL', label: 'All' },
        { id: 'SUBSCRIPTION', label: 'Subscription' },
        { id: 'HIRING', label: 'Hiring' },
        { id: 'PREMIUM', label: 'Premium Jobs' },
        { id: 'SUPER_PREMIUM', label: 'Super Premium' },
    ];

    const subCategories = [
        { id: 'ALL', label: 'All Types' },
        { id: 'JOB_READY', label: 'Job Ready' },
        { id: 'VERIFIED', label: 'Verified' },
        { id: 'TRUSTED', label: 'Trusted' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={goBack}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.royalBlue }]}>
                    My Earnings
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.mainContent}>
                {/* Summary Cards */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="people" size={24} color="#3B82F6" />
                            <Text style={styles.summaryValue}>{drivers.length}</Text>
                            <Text style={styles.summaryLabel}>Total Drivers</Text>
                        </View>

                        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="wallet" size={24} color="#10B981" />
                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                ₹{totalCommission.toLocaleString()}
                            </Text>
                            <Text style={styles.summaryLabel}>Total Earnings</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Section - Fixed at top of list */}
                <View style={styles.filterSection}>
                    <Text style={styles.sectionTitle}>Filter By</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScroll}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.filterChip,
                                    selectedCategory === cat.id && styles.filterChipActive
                                ]}
                                onPress={() => {
                                    setSelectedCategory(cat.id as any);
                                    if (cat.id !== 'SUBSCRIPTION') {
                                        setSelectedSubscription('ALL');
                                    }
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    selectedCategory === cat.id && styles.filterChipTextActive
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Sub-filters for Subscription */}
                    {selectedCategory === 'SUBSCRIPTION' && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.filterScroll, { marginTop: 8 }]}
                        >
                            {subCategories.map((sub) => (
                                <TouchableOpacity
                                    key={sub.id}
                                    style={[
                                        styles.subFilterChip,
                                        selectedSubscription === sub.id && styles.subFilterChipActive
                                    ]}
                                    onPress={() => setSelectedSubscription(sub.id as any)}
                                >
                                    <Text style={[
                                        styles.subFilterChipText,
                                        selectedSubscription === sub.id && styles.subFilterChipTextActive
                                    ]}>
                                        {sub.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Driver List */}
                <FlatList
                    data={filteredDrivers}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <DriverCard
                            driver={item}
                            onPress={() => console.log('Driver pressed:', item.id)}
                        />
                    )}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="filter-outline" size={48} color="#94A3B8" />
                                <Text style={styles.emptyText}>No drivers found for this filter</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.royalBlue} />
                            </View>
                        ) : <Space height={80} />
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    mainContent: {
        flex: 1,
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    // Summary Section
    summarySection: {
        padding: 16,
        paddingBottom: 0,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    // Filter Section
    filterSection: {
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#1E3A8A',
        borderColor: '#1E3A8A',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    subFilterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subFilterChipActive: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
    },
    subFilterChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    subFilterChipTextActive: {
        color: '#1E40AF',
        fontWeight: '600',
    },
    // Driver Card
    driverCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    driverInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E2E8F0',
    },
    driverDetails: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    driverName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    miniBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    driverId: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    driverMobile: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    subscriptionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    subscriptionBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    commissionSection: {
        // padding: 0,
    },
    commissionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 10,
    },
    commissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    commissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commissionIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    commissionLabel: {
        fontSize: 10,
        color: '#94A3B8',
    },
    commissionAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Loading & Empty States
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
});
