import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Clipboard,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// API Response Interface
interface ApiDriver {
    driver_id: string;
    driver_name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    state_name: string;
    created_at: string;
    profile_completion_percentage: number;
}

interface ApiResponse {
    forman_id: string;
    forman_name: string;
    referral_code: string;
    total_drivers: number;
    drivers: ApiDriver[];
}

// Mapped Driver Interface
interface Driver {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    image: string;
    state: string;
    createdAt: string;
    profileCompletion: number;
}

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

const mapApiToDriver = (apiDriver: ApiDriver): Driver => {
    return {
        id: String(apiDriver.driver_id),
        name: apiDriver.driver_name || 'Unknown',
        tmId: apiDriver.unique_id || 'N/A',
        mobile: apiDriver.mobile || 'N/A',
        image: apiDriver.images
            ? (apiDriver.images.startsWith('http') ? apiDriver.images : `https://devtruckmitr.in/${apiDriver.images}`)
            : DEFAULT_AVATAR,
        state: apiDriver.state_name || 'N/A',
        createdAt: apiDriver.created_at || '',
        profileCompletion: apiDriver.profile_completion_percentage || 0,
    };
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

// Colors
const COLORS = {
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    background: '#F8FAFC',
    white: '#FFFFFF',
    textDark: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    info: '#2563EB',
    infoBg: '#DBEAFE',
    whatsapp: '#22C55E',
    error: '#EF4444',
};

// Driver Card Component
const DriverCard = ({ driver }: { driver: Driver }) => {
    const { t } = useTranslation();

    const handleRemind = () => {
        const msg = `Hi ${driver.name}, please subscribe to TruckMitr to get job opportunities!\n\nTM ID: ${driver.tmId}`;
        Share.share({ message: msg });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.tmId}\nMobile: ${driver.mobile}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                {/* Profile Image with Completion Badge */}
                <View style={styles.profileWrapper}>
                    <View style={styles.profileImageContainer}>
                        <Image source={{ uri: driver.image }} style={styles.avatar} />
                    </View>
                    <View style={styles.completionBadge}>
                        <Text style={styles.completionText}>{driver.profileCompletion}%</Text>
                    </View>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{driver.name}</Text>
                    </View>
                    <Text style={styles.tmId}>{driver.tmId}</Text>

                    {/* Status Badge */}
                    <View style={styles.statusRow}>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{t('noSubscriptionText')}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.remindBtn} onPress={handleRemind}>
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Additional Info Row */}
            <View style={styles.additionalInfoContainer}>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="call-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoValue}>{driver.mobile}</Text>
                </View>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoValue}>{driver.state}</Text>
                </View>
            </View>

            {/* Added Date Row */}
            <View style={styles.addedDateRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.addedDateLabel}>{t('addedOnLabel')}</Text>
                <Text style={styles.addedDateValue}>{formatDate(driver.createdAt)}</Text>
            </View>
        </View>
    );
};

export default function ForemanPendingSubscription() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();

    // Redux
    const foremanId = useSelector((state: RootState) => state.user?.user?.id);

    // State
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [totalDrivers, setTotalDrivers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDrivers = useCallback(async (isRefresh = false) => {
        if (!foremanId) {
            setError(t('userNotAuthenticated'));
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const response = await axiosInstance.get(END_POINTS.PENDING_SUBSCRIPTIONS(foremanId));
            console.log('Pending Subscriptions API Response:', response?.data);

            if (response?.data?.drivers) {
                const apiDrivers: ApiDriver[] = response.data.drivers;
                const mapped = apiDrivers.map(mapApiToDriver);
                setDrivers(mapped);
                setTotalDrivers(response.data.total_drivers || mapped.length);
            } else {
                setDrivers([]);
                setTotalDrivers(0);
            }
        } catch (err: any) {
            console.error('Error fetching pending subscriptions:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch drivers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [foremanId]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const onRefresh = () => {
        fetchDrivers(true);
    };

    const renderDriverCard = ({ item }: { item: Driver }) => (
        <DriverCard driver={item} />
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
        );
    }

    if (error && drivers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                <Text style={styles.errorTitle}>{t('somethingWentWrong')}</Text>
                <Text style={styles.errorSubtitle}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchDrivers()}>
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{t('pendingSubscription')}</Text>
                    <Text style={styles.headerSubtitle}>{totalDrivers} {t('driversWithoutSubscription')}</Text>
                </View>
            </View>

            {/* Driver List */}
            <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={renderDriverCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                        <Text style={styles.emptyText}>All drivers have active subscriptions!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginTop: 16,
    },
    errorSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    profileWrapper: {
        marginRight: 12,
        alignItems: 'center',
    },
    profileImageContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: COLORS.info,
        overflow: 'hidden',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    completionBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: COLORS.white,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 1,
    },
    completionText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.info,
    },
    cardInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    tmId: {
        fontSize: 11,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 6,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: COLORS.infoBg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.info,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    remindBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.whatsapp,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    additionalInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    additionalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    additionalInfoValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    addedDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addedDateLabel: {
        fontSize: 11,
        color: '#64748B',
    },
    addedDateValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1E293B',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
        textAlign: 'center',
    },
});
