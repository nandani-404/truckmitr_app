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
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop } from '@truckmitr/src/app/functions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/utils/config/index';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Subscription types for styling
const SUBSCRIPTION_TYPES = {
    JOB_READY: {
        id: 'JOB_READY',
        name: 'jobReadyDriver',
        color: '#22C55E',
        bgColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    VERIFIED: {
        id: 'VERIFIED',
        name: 'verifiedDriver',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
    TRUSTED: {
        id: 'TRUSTED',
        name: 'trustedDriver',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        borderColor: '#DDD6FE',
    },
};

// API Response Interfaces
interface HiringCharges {
    payment_amount: number;
    commission_percent: number;
    commission_amount: number;
}

interface Subscription {
    payment_type: string;
    payment_amount: number;
    commission_percent: number;
    commission_amount: number;
    name: string;
    mobile: string;
    unique_id: string;
    profile_image: string;
    payment_date: string;
    hiring_charges: HiringCharges;
}

interface EarningsData {
    forman_id: number;
    forman_name: string;
    referral_code: string;
    total_payment: number;
    total_commission: number;
    subscriptions: Subscription[];
}

interface DriverCardProps {
    item: Subscription;
}

const DriverCard = ({ item }: DriverCardProps) => {
    const { t } = useTranslation();
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();

    const getSubscriptionInfo = (type: string) => {
        const norm = type.toLowerCase();
        if (norm.includes('trusted')) return SUBSCRIPTION_TYPES.TRUSTED;
        if (norm.includes('verified')) return SUBSCRIPTION_TYPES.VERIFIED;
        if (norm.includes('job ready') || norm.includes('job_ready')) return SUBSCRIPTION_TYPES.JOB_READY;
        return SUBSCRIPTION_TYPES.JOB_READY;
    };

    const subInfo = getSubscriptionInfo(item.payment_type);

    return (
        <TouchableOpacity
            style={driverCardStyles.driverCard}
            activeOpacity={0.8}
        >
            {/* Driver Info Row */}
            <View style={driverCardStyles.driverInfoRow}>
                {/* Profile Image */}
                <Image
                    source={{ uri: item.profile_image ? `${BASE_URL}/public/${item.profile_image}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                    style={driverCardStyles.driverImage}
                />

                {/* Driver Details */}
                <View style={driverCardStyles.driverDetails}>
                    <View style={driverCardStyles.nameRow}>
                        <Text style={driverCardStyles.driverName}>{item.name}</Text>
                        {item.hiring_charges.commission_amount > 0 && (
                            <View style={[driverCardStyles.miniBadge, { backgroundColor: '#F1F5F9' }]}>
                                <Text style={[driverCardStyles.miniBadgeText, { color: '#64748B' }]}>
                                    {t('hiring')}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={driverCardStyles.driverId}>{item.unique_id}</Text>
                    <Text style={driverCardStyles.driverMobile}>{item.mobile}</Text>
                </View>

                {/* Subscription Badge */}
                <View style={[
                    driverCardStyles.subscriptionBadge,
                    {
                        backgroundColor: subInfo.bgColor,
                        borderColor: subInfo.borderColor,
                    }
                ]}>
                    <Text style={[driverCardStyles.subscriptionBadgeText, { color: subInfo.color }]}>
                        {t(subInfo.name)}
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View style={driverCardStyles.divider} />

            {/* Commission Details */}
            <View style={driverCardStyles.commissionSection}>
                <Text style={driverCardStyles.commissionTitle}>{t('commissionEarned')}</Text>

                <View style={driverCardStyles.commissionRow}>
                    {/* Hiring Commission */}
                    <View style={driverCardStyles.commissionItem}>
                        <View style={[driverCardStyles.commissionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="person-add" size={14} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={driverCardStyles.commissionLabel}>{t('hiring')}</Text>
                            <Text style={[driverCardStyles.commissionAmount, { color: '#F59E0B' }]}>
                                ₹{item.hiring_charges.commission_amount}
                            </Text>
                        </View>
                    </View>

                    {/* Subscription Commission */}
                    <View style={driverCardStyles.commissionItem}>
                        <View style={[driverCardStyles.commissionIcon, { backgroundColor: subInfo.bgColor }]}>
                            <Ionicons name="card" size={14} color={subInfo.color} />
                        </View>
                        <View>
                            <Text style={driverCardStyles.commissionLabel}>{t('subscription')}</Text>
                            <Text style={[driverCardStyles.commissionAmount, { color: subInfo.color }]}>
                                ₹{item.commission_amount}
                            </Text>
                        </View>
                    </View>

                    {/* Total Commission */}
                    <View style={driverCardStyles.commissionItem}>
                        <View style={[driverCardStyles.commissionIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="wallet" size={14} color="#10B981" />
                        </View>
                        <View>
                            <Text style={driverCardStyles.commissionLabel}>{t('total')}</Text>
                            <Text style={[driverCardStyles.commissionAmount, { color: '#10B981', fontWeight: '700' }]}>
                                ₹{(item.commission_amount + item.hiring_charges.commission_amount).toFixed(1)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
            <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 8 }}>{item.payment_date}</Text>
        </TouchableOpacity>
    );
};

const driverCardStyles = StyleSheet.create({
    driverCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    driverInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
    },
    driverDetails: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    driverName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    miniBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    driverId: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    driverMobile: {
        fontSize: 12,
        color: '#94A3B8',
    },
    subscriptionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
    },
    subscriptionBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    commissionSection: {},
    commissionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    commissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    commissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    commissionIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commissionLabel: {
        fontSize: 10,
        color: '#94A3B8',
    },
    commissionAmount: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default function DriverAssociationEarnings() {
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { t } = useTranslation();

    const { user } = useSelector((state: RootState) => state.user);

    const [loading, setLoading] = useState(true);
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [requesting, setRequesting] = useState(false);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SUBSCRIPTION' | 'HIRING'>('ALL');
    const [selectedSubscription, setSelectedSubscription] = useState<'ALL' | 'JOB_READY' | 'VERIFIED' | 'TRUSTED'>('ALL');

    const fetchEarnings = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.ASSOCIATION_EARNINGS(user.id));
            if (response.data) {
                setEarningsData(response.data);
            }
        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchEarnings();
        }, [fetchEarnings])
    );

    const goBack = () => {
        navigation.goBack();
    };

    const handleWithdraw = async () => {
        const totalEarnings = earningsData?.total_commission || 0;

        if (totalEarnings < 500) {
            showToast(t('minBalanceRequired'));
            return;
        }

        try {
            setRequesting(true);
            const payload = {
                contact_reason: 'request for money',
            };
            const response = await axiosInstance.post(END_POINTS.CALLBACK_REQUEST, payload);

            if (response.data?.status) {
                showToast(t('payoutRequestSent'));
            } else {
                showToast(response.data?.message || t('payoutRequestFailed'));
            }
        } catch (error) {
            console.error('Error requesting payout:', error);
            showToast(t('payoutRequestFailed'));
        } finally {
            setRequesting(false);
        }
    };

    // Filter logic
    const filteredSubscriptions = (earningsData?.subscriptions || []).filter(sub => {
        if (selectedCategory === 'HIRING') {
            return sub.hiring_charges.commission_amount > 0;
        }
        if (selectedCategory === 'SUBSCRIPTION') {
            if (selectedSubscription === 'ALL') return true;
            const type = sub.payment_type.toLowerCase();
            if (selectedSubscription === 'TRUSTED') return type.includes('trusted');
            if (selectedSubscription === 'VERIFIED') return type.includes('verified');
            if (selectedSubscription === 'JOB_READY') return type.includes('job ready') || type.includes('job_ready');
        }
        return true;
    });

    const categories = [
        { id: 'ALL', label: t('all') },
        { id: 'SUBSCRIPTION', label: t('subscription') },
        { id: 'HIRING', label: t('hiring') },
    ];

    const subCategories = [
        { id: 'ALL', label: t('allTypes') },
        { id: 'JOB_READY', label: t('jobReady') },
        { id: 'VERIFIED', label: t('verified') },
        { id: 'TRUSTED', label: t('trusted') },
    ];

    const renderHeader = () => (
        <View>
            {/* Summary Cards */}
            <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="people" size={24} color="#3B82F6" />
                        <Text style={styles.summaryValue}>{earningsData?.subscriptions.length || 0}</Text>
                        <Text style={styles.summaryLabel}>{t('totalDrivers')}</Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="wallet" size={24} color="#10B981" />
                        <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                            ₹{earningsData?.total_commission?.toLocaleString() || 0}
                        </Text>
                        <Text style={styles.summaryLabel}>{t('totalEarnings')}</Text>
                    </View>
                </View>
            </View>

            {/* Request Payout Button - Prominent above filters */}
            <TouchableOpacity
                style={[styles.payoutButton, { backgroundColor: '#10B981', opacity: requesting ? 0.7 : 1 }]}
                onPress={handleWithdraw}
                disabled={requesting}
                activeOpacity={0.7}
            >
                {requesting ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name="cash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.payoutButtonText}>{t('requestPayout')}</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Filter Section */}
            <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{t('filterBy')}</Text>
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
        </View>
    );

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
                    {t('myEarnings2')}
                </Text>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={() => navigation.navigate(STACKS.FOREMAN_EARNINGS_INFO)}
                    style={styles.backButton}
                >
                    <Ionicons name="information-circle-outline" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.royalBlue} />
                        <Text style={{ marginTop: 10, color: '#64748B' }}>{t('loading')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredSubscriptions}
                        keyExtractor={(item, index) => `${item.unique_id}_${index}`}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderHeader}
                        renderItem={({ item }) => <DriverCard item={item} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="filter-outline" size={48} color="#94A3B8" />
                                <Text style={styles.emptyText}>{t('noDriversFoundFilter')}</Text>
                            </View>
                        }
                    />
                )}
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
        paddingBottom: 0,
        marginBottom: 16,
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
    },
    filterScroll: {
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
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
    payoutButton: {
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
