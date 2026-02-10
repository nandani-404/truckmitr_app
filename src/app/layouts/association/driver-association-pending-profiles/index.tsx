import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Image, StatusBar, Dimensions, ActivityIndicator, Linking, Alert, Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color Palette
const COLORS = {
    primary: '#1E3A5F',
    secondary: '#2C3E50',
    accent: '#3498DB',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    white: '#FFFFFF',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    divider: '#F1F5F9',
};

interface Driver {
    driver_id: string;
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

interface PendingProfileResponse {
    success: boolean;
    association_id: string;
    association_name: string;
    referral_code: string;
    total_drivers: number;
    drivers: Driver[];
}

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // API format is "2026-01-28 14:32:56"
    // Some engines need space replaced with T or / for better parsing
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};

// Pending Driver Card Component
const PendingDriverCard = ({ driver, onPress, onShare, t }: { driver: Driver, onPress: () => void, onShare: () => void, t: any }) => {
    const getStatusColor = () => {
        if (driver.profile_completion_percentage >= 70) return COLORS.success;
        if (driver.profile_completion_percentage >= 40) return COLORS.warning;
        return COLORS.error;
    };

    // Circle progress calculations
    const size = 72;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = driver.profile_completion_percentage;
    const progressOffset = circumference - (progress / 100) * circumference;

    return (
        <TouchableOpacity
            style={styles.driverCard}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.cardHeader}>
                <View style={styles.driverInfoRow}>
                    <View style={styles.avatarWrapper}>
                        <Svg width={size} height={size} style={{ position: 'absolute' }}>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={COLORS.background}
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={getStatusColor()}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={progressOffset}
                                strokeLinecap="round"
                                rotation="135"
                                origin={`${size / 2}, ${size / 2}`}
                            />
                        </Svg>
                        <Image
                            source={{ uri: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                            style={styles.avatar}
                        />
                        <View style={[styles.percentageBadge, { backgroundColor: getStatusColor() }]}>
                            <Text style={styles.percentageText}>{driver.profile_completion_percentage}%</Text>
                        </View>
                    </View>
                    <View style={styles.driverDetails}>
                        <Text style={styles.driverName}>{driver.driver_name}</Text>
                        <Text style={styles.driverId}>{driver.unique_id}</Text>
                        <Text style={styles.driverPhone}>{driver.mobile}</Text>
                    </View>
                </View>
                <View style={styles.statusBadge}>
                    <Ionicons name="alert-circle" size={16} color={getStatusColor()} />
                </View>
            </View>

            {/* Pending Status Message */}
            <View style={styles.pendingStatusSection}>
                <View style={styles.pendingStatusRow}>
                    <Ionicons name="information-circle" size={16} color={COLORS.warning} />
                    <Text style={styles.pendingStatusText}>{t('profileCompletionPending')}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <View style={styles.timeInfo}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.timeText}>{t('addedOn')} : {formatDate(driver.created_at)}</Text>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                    <Ionicons name="share-social" size={16} color={COLORS.white} />
                    <Text style={styles.shareBtnText}>{t('share')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// Main Component
export default function DriverAssociationPendingProfiles() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user } = useSelector((state: any) => state?.user) || {};

    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingProfiles = useCallback(async (isRefreshing = false) => {
        if (!user?.id) return;

        try {
            if (!isRefreshing) setLoading(true);
            const response = await axiosInstance.get(END_POINTS.ASSOCIATION_DRIVERS_PENDING_PROFILE(user.id));
            if (response.data) {
                setDrivers(response.data.drivers || []);
            }
        } catch (error) {
            console.error('Error fetching pending profiles:', error);
            Alert.alert(t('error'), t('failedToFetchPendingProfiles'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchPendingProfiles();
    }, [fetchPendingProfiles]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPendingProfiles(true);
    };

    const handleDriverPress = (driver: Driver) => {
        // @ts-ignore
        navigation.navigate(STACKS.DRIVER_ASSOCIATION_DRIVER_DETAILS, {
            driver: {
                id: driver.driver_id,
                name: driver.driver_name,
                tmId: driver.unique_id,
                mobile: driver.mobile,
                image: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                status: 'Pending',
                state: '', // Add state if available in Driver type
                completion: driver.profile_completion_percentage,
                amount: 0,
                profile_completion_percentage: String(driver.profile_completion_percentage),
            }
        });
    };

    const handleShare = async (driver: Driver) => {
        const message = t('pendingProfileShareMessage', {
            name: driver.driver_name,
            percentage: driver.profile_completion_percentage,
            tmId: driver.unique_id,
        });

        try {
            await Share.share({
                message: message,
            });
        } catch (error: any) {
            console.error('Error sharing profile:', error.message);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>{t('allCaughtUp')}</Text>
            <Text style={styles.emptySubtitle}>
                {t('noPendingProfilesFound')}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('pendingProfiles')}</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={drivers}
                    keyExtractor={(item) => item.driver_id}
                    renderItem={({ item }) => (
                        <PendingDriverCard
                            driver={item}
                            onPress={() => handleDriverPress(item)}
                            onShare={() => handleShare(item)}
                            t={t}
                        />
                    )}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={renderEmptyState}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        flex: 1,
    },

    // Content
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },

    // Driver Card
    driverCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    driverInfoRow: {
        flexDirection: 'row',
        flex: 1,
    },
    avatarWrapper: {
        position: 'relative',
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.background,
    },
    percentageBadge: {
        position: 'absolute',
        bottom: -4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    percentageText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.white,
    },
    driverDetails: {
        marginLeft: 12,
        flex: 1,
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    driverId: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    driverPhone: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 1,
    },
    statusBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    // Pending Status Section
    pendingStatusSection: {
        marginBottom: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: COLORS.warning + '10',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.warning + '20',
    },
    pendingStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pendingStatusText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.warning,
        marginLeft: 8,
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginLeft: 4,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    shareBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.white,
        marginLeft: 6,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
});
