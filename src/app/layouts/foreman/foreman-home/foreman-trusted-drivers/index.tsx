import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Colors
const COLORS = {
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    background: '#F8FAFC',
    white: '#FFFFFF',
    textDark: '#0F172A',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    trusted: '#7E22CE', // Purple for Trusted
    trustedBg: '#F3E8FF',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    error: '#EF4444',
};

interface TrustedDriver {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    image: string;
    status: 'Trusted' | 'Expiring' | 'Expired';
    state: string;
    addedDate: string;
    completion: number;
    amount: number;
    subscriptionDate: string;
    expiryDate: string;
    daysRemaining: number;
    // Additional fields required by ForemanDriverDetails
    isNew: boolean;
    subscriptionPlan: number;
    training: number;
    healthHygiene: number;
    jobsApplied: number;
    dob: string;
    gender: string;
    education: string;
    vehicleType: string;
    drivingExp: string;
    licenseType: string;
    licenseEndorsement: string;
    currentSalary: string;
    expectedSalary: string;
    aadharNo: string;
    licenseNo: string;
    licenseExpiry: string;
    email: string;
}

// Sample data - Trusted drivers with ₹499 subscription
const TRUSTED_DRIVERS: TrustedDriver[] = [
    {
        id: '1',
        name: 'Vikram Singh',
        tmId: 'TM2503UDPR00020',
        mobile: '+91 91234 56789',
        image: 'https://randomuser.me/api/portraits/men/22.jpg',
        status: 'Trusted',
        state: 'Haryana',
        addedDate: '10 Dec 2024',
        completion: 100,
        amount: 499,
        subscriptionDate: '2024-12-10',
        expiryDate: '2025-03-10',
        daysRemaining: 54,
        isNew: false,
        subscriptionPlan: 499,
        training: 100,
        healthHygiene: 98,
        jobsApplied: 15,
        dob: '05 May 1985',
        gender: 'Male',
        education: 'Graduate',
        vehicleType: 'Heavy Truck',
        drivingExp: '10 Years',
        licenseType: 'HCV',
        licenseEndorsement: 'Hazardous',
        currentSalary: '₹ 35,000 - ₹ 40,000',
        expectedSalary: '₹ 40,000 - ₹ 50,000',
        aadharNo: '1234 5678 9012',
        licenseNo: 'DL1234567890',
        licenseExpiry: '10 Oct 2030',
        email: 'vikram.singh@example.com',
    },
    {
        id: '2',
        name: 'Rajinder Kaur',
        tmId: 'TM2503UDPR00021',
        mobile: '+91 81234 56780',
        image: 'https://randomuser.me/api/portraits/men/33.jpg',
        status: 'Trusted',
        state: 'Punjab',
        addedDate: '15 Nov 2024',
        completion: 100,
        amount: 499,
        subscriptionDate: '2024-11-15',
        expiryDate: '2025-02-15',
        daysRemaining: 31,
        isNew: false,
        subscriptionPlan: 499,
        training: 95,
        healthHygiene: 90,
        jobsApplied: 10,
        dob: '12 Sep 1988',
        gender: 'Male',
        education: '12th Pass',
        vehicleType: 'Tanker',
        drivingExp: '8 Years',
        licenseType: 'HCV',
        licenseEndorsement: 'Hill',
        currentSalary: '₹ 30,000 - ₹ 35,000',
        expectedSalary: '₹ 35,000 - ₹ 45,000',
        aadharNo: '9876 5432 1098',
        licenseNo: 'PB0987654321',
        licenseExpiry: '06 Nov 2028',
        email: 'rajinder.kaur@example.com',
    },
    {
        id: '3',
        name: 'Manoj Tiwari',
        tmId: 'TM2503UDPR00022',
        mobile: '+91 71234 56781',
        image: 'https://randomuser.me/api/portraits/men/44.jpg',
        status: 'Expiring',
        state: 'Uttar Pradesh',
        addedDate: '20 Oct 2024',
        completion: 100,
        amount: 499,
        subscriptionDate: '2024-10-20',
        expiryDate: '2025-01-20',
        daysRemaining: 5,
        isNew: false,
        subscriptionPlan: 499,
        training: 100,
        healthHygiene: 100,
        jobsApplied: 25,
        dob: '20 Jul 1982',
        gender: 'Male',
        education: '8th Pass',
        vehicleType: 'Trailer',
        drivingExp: '15 Years',
        licenseType: 'HCV',
        licenseEndorsement: 'Heavy',
        currentSalary: '₹ 40,000 - ₹ 45,000',
        expectedSalary: '₹ 50,000 - ₹ 55,000',
        aadharNo: '4567 8901 2345',
        licenseNo: 'UP5432167890',
        licenseExpiry: '15 Aug 2027',
        email: 'manoj.tiwari@example.com',
    },
];

type FilterType = 'All' | 'Active' | 'Expiring' | 'Expired';

export default function ForemanTrustedDrivers() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();

    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

    const goBack = () => navigation.goBack();

    // Filter drivers
    const filteredDrivers = activeFilter === 'All'
        ? TRUSTED_DRIVERS
        : activeFilter === 'Active'
            ? TRUSTED_DRIVERS.filter(d => d.status === 'Trusted')
            : TRUSTED_DRIVERS.filter(d => d.status === activeFilter);

    // Filter counts
    const filterCounts = {
        All: TRUSTED_DRIVERS.length,
        Active: TRUSTED_DRIVERS.filter(d => d.status === 'Trusted').length,
        Expiring: TRUSTED_DRIVERS.filter(d => d.status === 'Expiring').length,
        Expired: TRUSTED_DRIVERS.filter(d => d.status === 'Expired').length,
    };

    const filters: { key: FilterType; label: string; color: string }[] = [
        { key: 'All', label: 'All', color: COLORS.primary },
        { key: 'Active', label: 'Active', color: COLORS.trusted },
        { key: 'Expiring', label: 'Expiring', color: COLORS.warning },
        { key: 'Expired', label: 'Expired', color: COLORS.error },
    ];

    const renderDriverCard = ({ item }: { item: TrustedDriver }) => (
        <View style={styles.driverCard}>
            <View style={styles.driverMainRow}>
                {/* Profile Image with Completion Circle */}
                <View style={styles.profileImageWrapper}>
                    <View style={[styles.circularProgressContainer, {
                        borderRadius: 37,
                        borderWidth: 4,
                        borderColor: '#E2E8F0',
                        backgroundColor: 'transparent'
                    }]}>
                        {/* Simplified progress representation */}
                        <View style={{
                            position: 'absolute',
                            top: -4, left: -4, right: -4, bottom: -4,
                            borderRadius: 37,
                            borderWidth: 4,
                            borderColor: item.status === 'Trusted' ? COLORS.trusted : item.status === 'Expiring' ? COLORS.warning : COLORS.error,
                            borderLeftColor: 'transparent',
                            transform: [{ rotate: '45deg' }]
                        }} />

                        <View style={[styles.profileImageContainerInner, { top: 3, left: 3 }]}>
                            <Image source={{ uri: item.image }} style={styles.profileImage} />
                        </View>
                        {/* Completion Badge */}
                        <View style={[
                            styles.completionBadge,
                            item.status === 'Trusted' && { borderColor: '#E9D5FF', backgroundColor: '#F3E8FF' }
                        ]}>
                            <Text style={[
                                styles.completionText,
                                item.status === 'Trusted' && { color: COLORS.trusted }
                            ]}>
                                {item.completion}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Info & Status */}
                <View style={styles.driverContent}>
                    <View style={styles.driverHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.driverName}>{item.name}</Text>
                            <Text style={styles.driverTmId} numberOfLines={1} adjustsFontSizeToFit>{item.tmId}</Text>
                        </View>
                        {/* Status Badge */}
                        <View style={styles.badgesColumn}>
                            {item.status === 'Expiring' ? (
                                <View style={styles.pendingBadge}>
                                    <Ionicons name="time" size={12} color={COLORS.warning} />
                                    <Text style={styles.pendingText}>Expiring Soon</Text>
                                </View>
                            ) : item.status === 'Expired' ? (
                                <View style={styles.rejectedBadge}>
                                    <Ionicons name="alert-circle" size={12} color={COLORS.error} />
                                    <Text style={styles.rejectedText}>Expired</Text>
                                </View>
                            ) : (
                                <View style={styles.trustedBadge}>
                                    <Ionicons name="shield-checkmark" size={12} color={COLORS.trusted} />
                                    <Text style={styles.trustedText}>Trusted Driver • ₹{item.amount}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.infoText}>{item.mobile}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Additional Info Row: State, Subs Date, Days Left */}
            <View style={styles.additionalInfoContainer}>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoLabel}>State:</Text>
                    <Text style={styles.additionalInfoValue}>{item.state}</Text>
                </View>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoLabel}>Expires:</Text>
                    <Text style={styles.additionalInfoValue}>
                        {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
            </View>

            {/* Days Left Bar for Active/Expiring */}
            {(item.status === 'Trusted' || item.status === 'Expiring') && (
                <View style={styles.expiryBarContainer}>
                    <View style={styles.expiryBarRow}>
                        <Text style={styles.expiryLabel}>Subscription Validity</Text>
                        <Text style={[
                            styles.expiryValue,
                            item.daysRemaining < 30 ? { color: COLORS.warning } : { color: COLORS.trusted }
                        ]}>
                            {item.daysRemaining} days left
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${Math.min((item.daysRemaining / 365) * 100, 100)}%`,
                                    backgroundColor: item.daysRemaining < 30 ? COLORS.warning : COLORS.trusted
                                }
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* Action Button */}
            <View style={styles.actionButtonsContainer}>
                {item.status === 'Expired' || item.status === 'Expiring' ? (
                    <TouchableOpacity
                        style={[styles.viewDetailButton, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="refresh" size={16} color={COLORS.warning} />
                        <Text style={[styles.viewDetailText, { color: COLORS.warning }]}>Renew Subscription</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.viewDetailButton, { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }]}
                        activeOpacity={0.8}
                    // onPress={() => navigation.navigate(STACKS.FOREMAN_DRIVER_DETAILS, { driver: item as any })}
                    >
                        <Text style={[styles.viewDetailText, { color: COLORS.trusted }]}>View Details</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.trusted} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>{t('trustedDrivers', 'Trusted Drivers')}</Text>
                        <View style={styles.subscriptionBadge}>
                            <Text style={styles.subscriptionBadgeText}>₹499</Text>
                        </View>
                    </View>
                    <Text style={styles.headerSubtitle}>{filteredDrivers.length} {t('driversWithSubscription', 'drivers with active subscription')}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{filterCounts.Active}</Text>
                    <Text style={styles.summaryLabel}>Active</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{filterCounts.Expiring}</Text>
                    <Text style={styles.summaryLabel}>Expiring</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.error }]}>{filterCounts.Expired}</Text>
                    <Text style={styles.summaryLabel}>Expired</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterTab,
                            activeFilter === filter.key && { backgroundColor: filter.color, borderColor: filter.color }
                        ]}
                        onPress={() => setActiveFilter(filter.key)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            activeFilter === filter.key && styles.filterTabTextActive
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Driver List */}
            <FlatList
                data={filteredDrivers}
                keyExtractor={(item) => item.id}
                renderItem={renderDriverCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="shield-check" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Drivers Found</Text>
                        <Text style={styles.emptySubtitle}>No trusted drivers matching this filter</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    subscriptionBadge: {
        backgroundColor: COLORS.trustedBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    subscriptionBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.trusted,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 1,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.trusted,
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: COLORS.border,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    filterTabTextActive: {
        color: COLORS.white,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 40,
    },
    driverCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    driverMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    profileImageWrapper: {
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
    },
    circularProgressContainer: {
        width: 74,
        height: 74,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageContainerInner: {
        position: 'absolute',
        top: 7,
        left: 7,
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
    },
    completionBadge: {
        position: 'absolute',
        bottom: -4,
        backgroundColor: '#fff',
        paddingHorizontal: 1,
        paddingVertical: 0,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
    },
    completionText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#7E22CE',
    },
    driverContent: {
        flex: 1,
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
        marginTop: 6,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
        lineHeight: 20,
    },
    driverTmId: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    badgesColumn: {
        alignItems: 'flex-end',
    },
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trustedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#7E22CE',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pendingText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#92400E',
    },
    rejectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    rejectedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#991B1B',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#475569',
        marginLeft: 6,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    additionalInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    additionalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    additionalInfoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 6,
        marginRight: 4,
    },
    additionalInfoValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    expiryBarContainer: {
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 8,
    },
    expiryBarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    expiryLabel: {
        fontSize: 11,
        color: '#64748B',
    },
    expiryValue: {
        fontSize: 11,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    actionButtonsContainer: {
        marginTop: 0,
    },
    viewDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        gap: 6,
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284C7',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 8,
    },
});
