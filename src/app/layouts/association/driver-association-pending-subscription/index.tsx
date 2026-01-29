import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Alert,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams>;

interface Driver {
    driver_id: string;
    driver_name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    state_name: string;
    created_at: string;
    profile_completion_percentage: number;
}

// Helper to format date: 28 Jan 2026
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

// Simple Driver Card
const DriverCard = ({ driver }: { driver: Driver }) => {
    const navigation = useNavigation<NavigatorProp>();
    const { t } = useTranslation();

    const handleRemind = () => {
        const msg = `Hi ${driver.driver_name}, please subscribe to TruckMitr to get job opportunities!\n\nTM ID: ${driver.unique_id}`;
        Share.share({ message: msg });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.unique_id}\nMobile: ${driver.mobile}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    const handleViewProfile = () => {
        // @ts-ignore
        navigation.navigate(STACKS.DRIVER_ASSOCIATION_DRIVER_DETAILS, {
            driver: {
                id: driver.driver_id,
                name: driver.driver_name,
                tmId: driver.unique_id,
                mobile: driver.mobile,
                image: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                status: t('association_subscription_pending'),
                state: driver.state_name,
                completion: driver.profile_completion_percentage,
                amount: 0,
                profile_completion_percentage: String(driver.profile_completion_percentage),
            }
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Image
                    source={{ uri: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                    style={styles.avatar}
                />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{driver.driver_name}</Text>
                    <Text style={styles.tmId}>{driver.unique_id}</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusTypeBadge}>
                            <Text style={styles.statusTypeText}>{t('association_no_subscription')}</Text>
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

            <View style={styles.cardFooter}>
                <Text style={styles.addedOnText}>{t('association_added_on')} {formatDate(driver.created_at)}</Text>
                <TouchableOpacity style={styles.viewProfileBtn} onPress={handleViewProfile}>
                    <Text style={styles.viewProfileBtnText}>{t('association_view_profile')}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#6366F1" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function DriverAssociationPendingSubscription() {
    const navigation = useNavigation<NavigatorProp>();
    const { t } = useTranslation();
    const { user } = useSelector((state: any) => state?.user) || {};

    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingSubscriptions = useCallback(async (isRefreshing = false) => {
        if (!user?.id) return;

        try {
            if (!isRefreshing) setLoading(true);
            const response = await axiosInstance.get(END_POINTS.ASSOCIATION_DRIVERS_PENDING_SUBSCRIPTION(user.id));

            if (response.data) {
                setDrivers(response.data.drivers || []);
            }
        } catch (error) {
            console.error('Error fetching pending subscriptions:', error);
            Alert.alert('Error', 'Failed to fetch pending subscriptions.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchPendingSubscriptions();
    }, [fetchPendingSubscriptions]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPendingSubscriptions(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <ScreenHeader
                title={t('association_pending_subscription')}
                titleCount={drivers.length > 0 ? drivers.length : undefined}
            />

            {/* Driver List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={drivers}
                    keyExtractor={(item) => item.driver_id}
                    renderItem={({ item }) => <DriverCard driver={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366F1']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                            <Text style={styles.emptyText}>{t('association_all_drivers_subscribed')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 12,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    tmId: {
        fontSize: 11,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 3,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    statusTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#DBEAFE',
    },
    statusTypeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#2563EB',
    },
    statusInfo: {
        fontSize: 10,
        color: '#64748B',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    remindBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#22C55E',
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
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    addedOnText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    viewProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewProfileBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6366F1',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
    },
});

