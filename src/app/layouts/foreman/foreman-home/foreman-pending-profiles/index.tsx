import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Clipboard,
    Animated,
    ActivityIndicator,
    RefreshControl,
    FlatList,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface ApiPendingDriver {
    driver_id: string | number;
    driver_name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    DOB: string | null;
    Driving_Experience: string | null;
    License_Number: string | null;
    Expiry_date_of_License: string | null;
    PAN_Number: string | null;
    state_name: string;
    created_at: string;
    profile_completion_percentage: number;
}

interface PendingDriver {
    id: string;
    name: string;
    tmId: string;
    mobileNumber: string;
    profileImage: string;
    pendingReason: string;
    addedDate: string;
    profileCompletion: number;
}

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

const mapApiToPendingDriver = (apiDriver: ApiPendingDriver): PendingDriver => {
    // Determine pending reason based on missing data
    let reason = 'Profile incomplete';
    if (!apiDriver.images) reason = 'Profile photo missing';
    else if (!apiDriver.License_Number) reason = 'DL details missing';
    else if (!apiDriver.DOB) reason = 'DOB not provided';
    else if (apiDriver.profile_completion_percentage < 50) reason = 'Many fields pending';

    // Format date if possible
    let formattedDate = apiDriver.created_at;
    try {
        const date = new Date(apiDriver.created_at);
        formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch (e) { }

    return {
        id: String(apiDriver.driver_id),
        name: apiDriver.driver_name || 'Unknown',
        tmId: apiDriver.unique_id || 'N/A',
        mobileNumber: apiDriver.mobile || 'N/A',
        profileImage: apiDriver.images ? (apiDriver.images.startsWith('http') ? apiDriver.images : `https://devtruckmitr.in/${apiDriver.images}`) : DEFAULT_AVATAR,
        pendingReason: reason,
        addedDate: formattedDate,
        profileCompletion: apiDriver.profile_completion_percentage || 0,
    };
};

// Driver Card Component
const PendingDriverCard = ({ driver }: { driver: PendingDriver }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { t } = useTranslation();

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handleShare = async () => {
        const shareMessage = `Download TruckMitr App to get started. Use the below ID & Mobile No. to login:\n\nTM ID: ${driver.tmId}\nMobile: ${driver.mobileNumber}`;
        try {
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const handleWhatsAppShare = () => {
        const shareMessage = `Download TruckMitr App to get started. Use the below ID & Mobile No. to login:\n\nTM ID: ${driver.tmId}\nMobile: ${driver.mobileNumber}`;
        const encodedMessage = encodeURIComponent(shareMessage);

        // Format mobile number for WhatsApp link (wa.me expects international format without +)
        let cleanMobile = driver.mobileNumber.replace(/\D/g, ''); // Remove non-digits
        if (cleanMobile.startsWith('0')) cleanMobile = cleanMobile.substring(1);
        if (cleanMobile.length === 10) cleanMobile = '91' + cleanMobile;

        const whatsappUrl = `https://wa.me/${cleanMobile}?text=${encodedMessage}`;

        Linking.canOpenURL(whatsappUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(whatsappUrl);
                } else {
                    showToast(t('whatsAppNotInstalled', 'WhatsApp is not installed'));
                }
            })
            .catch((err) => {
                console.error('Error opening WhatsApp:', err);
                showToast(t('errorOpeningWhatsApp', 'Error opening WhatsApp'));
            });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.tmId}\nMobile: ${driver.mobileNumber}`);
        showToast(t('copiedToClipboard', 'Copied to clipboard!'));
    };

    // Profile circle calculations
    const size = 60;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (driver.profileCompletion / 100) * circumference;

    // Get progress color based on completion percentage
    const getProgressColor = () => {
        if (driver.profileCompletion >= 70) return { start: '#22C55E', end: '#16A34A' };
        if (driver.profileCompletion >= 40) return { start: '#F59E0B', end: '#D97706' };
        return { start: '#EF4444', end: '#DC2626' };
    };
    const progressColors = getProgressColor();

    return (
        <Animated.View style={[styles.driverCard, { transform: [{ scale: scaleAnim }] }]}>
            {/* Header with Profile */}
            <View style={styles.cardHeader}>
                <View style={styles.profileSection}>
                    <View style={styles.profileImageWrapper}>
                        {/* Progress Circle */}
                        <Svg width={size} height={size} style={styles.progressRing}>
                            <Defs>
                                <LinearGradient id={`grad-${driver.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <Stop offset="0%" stopColor={progressColors.start} />
                                    <Stop offset="100%" stopColor={progressColors.end} />
                                </LinearGradient>
                            </Defs>
                            {/* Background circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="#E5E7EB"
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            {/* Progress circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={`url(#grad-${driver.id})`}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={progressOffset}
                                strokeLinecap="round"
                                rotation="250"
                                origin={`${size / 2}, ${size / 2}`}
                            />
                        </Svg>
                        {/* Profile Image */}
                        <Image
                            source={{ uri: driver.profileImage }}
                            style={styles.profileImage}
                        />
                        {/* Percentage Badge */}
                        <View style={[styles.percentageBadge, { backgroundColor: progressColors.start }]}>
                            <Text style={styles.percentageText}>{driver.profileCompletion}%</Text>
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <View style={styles.tmIdRow}>
                            <Text style={styles.tmIdText}>{driver.tmId}</Text>
                        </View>
                        <Text style={styles.mobileText}>{driver.mobileNumber}</Text>
                    </View>
                </View>
                <View style={styles.addedDateBadge}>
                    <Text style={styles.addedDateText}>{driver.addedDate}</Text>
                </View>
            </View>

            {/* Pending Reason */}
            {/* <View style={styles.pendingReasonContainer}>
                <View style={styles.pendingReasonIcon}>
                    <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                </View>
                <Text style={styles.pendingReasonText}>{driver.pendingReason}</Text>
            </View> */}

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={handleWhatsAppShare}
                    activeOpacity={0.8}
                >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    activeOpacity={0.8}
                >
                    <Ionicons name="share-social" size={18} color="#6366F1" />
                    <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopy}
                    activeOpacity={0.8}
                >
                    <Ionicons name="copy" size={18} color="#64748B" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default function ForemanPendingProfiles() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();

    // Redux
    const foremanId = useSelector((state: RootState) => state.user?.user?.id);

    // State
    const [drivers, setDrivers] = useState<PendingDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const fetchDrivers = useCallback(async (isRefresh = false) => {
        if (!foremanId) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const response = await axiosInstance.get(END_POINTS.DRIVERS_PENDING_PROFILE(foremanId));
            console.log('Pending Profiles API Response:', response?.data);

            if (response?.data?.drivers) {
                const apiDrivers: ApiPendingDriver[] = response.data.drivers;
                const mapped = apiDrivers.map(mapApiToPendingDriver);
                setDrivers(mapped);
            } else {
                setDrivers([]);
            }
        } catch (err: any) {
            console.error('Error fetching pending profiles:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch pending profiles');
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

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading profiles...</Text>
            </View>
        );
    }

    if (error && drivers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Profiles</Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{drivers.length}</Text>
                </View>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
                <View style={styles.infoBannerIcon}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.infoBannerText}>
                    Share login credentials with drivers to help them complete their profile
                </Text>
            </View>

            {/* Driver List */}
            <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PendingDriverCard driver={item} />}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-check-outline" size={80} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptySubtitle}>No pending profiles found for your pilots.</Text>
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
        color: '#64748B',
        fontWeight: '500',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 12,
    },
    headerBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    headerBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D97706',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoBannerIcon: {
        marginRight: 10,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#1D4ED8',
        lineHeight: 18,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    driverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImageWrapper: {
        position: 'relative',
        marginRight: 12,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    percentageBadge: {
        position: 'absolute',
        bottom: -2,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    percentageText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    tmIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    tmIdText: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
    },
    mobileText: {
        fontSize: 12,
        color: '#6B7280',
    },
    addedDateBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    addedDateText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    pendingReasonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 14,
    },
    pendingReasonIcon: {
        marginRight: 8,
    },
    pendingReasonText: {
        fontSize: 13,
        color: '#B45309',
        fontWeight: '500',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    whatsappButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22C55E',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    whatsappButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    shareButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366F1',
    },
    copyButton: {
        width: 44,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
    },
});
