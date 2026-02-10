import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { STACKS } from '@truckmitr/stacks/stacks';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradientLib from 'react-native-linear-gradient';
import { getUserBadgeText } from '@truckmitr/src/utils/global/userBadge';
import { useTranslation } from 'react-i18next';

// Dashboard API Response Interface
interface DashboardData {
    success: boolean;
    forman_id: string; // API returns 'forman_id'
    forman_name: string;
    referral_code: string;
    total_drivers: number;
    counts: {
        job_ready: number;
        trusted: number;
        verified: number;
    };
    amounts: {
        job_ready: number;
        trusted: number;
        verified: number;
    };
    commission: {
        job_ready: number;
        trusted: number;
        verified: number;
    };
    completed_profiles_count: number;
    training: {
        complete: number;
        pending: number;
    };
    jobs: {
        total_jobs: number;
        total_applications: number;
    };
}

export default function DriverAssociationDashboard() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    // Get user data from Redux
    const { user, profileCompletion, star_rating, subscriptionDetails } = useSelector((state: any) => state?.user) || {};

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    // Check if Association is Pro (Active Subscription)
    const isAssociationPro =
        subscriptionDetails?.hasActiveSubscription ||
        subscriptionDetails?.payment_type === 'association_pro' ||
        subscriptionDetails?.subscription_plan_id === '12' ||
        subscriptionDetails?.subscription_plan_id === 12 ||
        user?.plan_id === 12 ||
        user?.payment_type === 'association_pro';

    // Get the user badge text (Association Pro / Association)
    const userBadgeText = getUserBadgeText({ user, subscriptionDetails });

    // Profile ring calculations
    const size = responsiveFontSize(8);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = profileCompletion || 10;
    const progressOffset = circumference - (progress / 100) * circumference;

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            // Fetch both dashboard stats and jobs list to get accurate job count as per user request
            const [dashboardResponse, jobsResponse] = await Promise.all([
                axiosInstance.get(END_POINTS.ASSOCIATION_DASHBOARD(user.id)),
                axiosInstance.get(END_POINTS.ALL_JOBS_AND_SEARCH(''))
            ]);

            if (dashboardResponse.data?.success) {
                const data = dashboardResponse.data;
                let jobsCount = 0;

                // If jobs API returns data, get the count
                if (jobsResponse?.data?.status && Array.isArray(jobsResponse?.data?.data)) {
                    jobsCount = jobsResponse.data.data.length;
                }

                // Create updated data object
                const updatedData = {
                    ...data,
                    jobs: {
                        ...(data.jobs || { total_applications: 0 }),
                        total_jobs: jobsCount > 0 ? jobsCount : (data.jobs?.total_jobs || 0)
                    }
                };

                setDashboardData(updatedData);
            }
        } catch (error) {
            console.error('Error fetching association dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    const ShimmerCard = () => (
        <View style={[styles.statsCard, shadow, { height: responsiveHeight(12) }]}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradientLib}
                style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 6 }}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradientLib}
                style={{ width: 30, height: 18, borderRadius: 4, marginBottom: 2 }}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradientLib}
                style={{ width: 50, height: 12, borderRadius: 4 }}
            />
        </View>
    );

    const renderSectionHeader = (title: string, iconName: string) => (
        <View style={styles.sectionHeader}>
            <Ionicons name={iconName} size={responsiveFontSize(2.0)} color={colors.royalBlue} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(1.6), fontWeight: '400', color: '#6B7280' }]}>{title}</Text>
        </View>
    );

    const renderStatsCard = (label: string, count: number | string, imageSource?: any, isVector: boolean = false, vectorIconName: string = '', iconColor: string = '', bgColor: string = '#F9FAFB', onPress?: () => void) => {
        if (loading) return <ShimmerCard />;

        return (
            <TouchableOpacity style={[styles.statsCard, shadow]} onPress={onPress}>
                <View style={[styles.cardIconContainer, { backgroundColor: bgColor }]}>
                    {isVector ? (
                        <Ionicons name={vectorIconName} size={responsiveFontSize(3.2)} color={iconColor} />
                    ) : (
                        <Image source={imageSource} style={{ width: responsiveFontSize(4), height: responsiveFontSize(4) }} resizeMode="contain" />
                    )}
                </View>
                <Text style={[styles.cardCount, { fontSize: responsiveFontSize(2.2), color: '#1F2937' }]}>{count}</Text>
                <Text style={[styles.cardLabel, { fontSize: responsiveFontSize(1.3), color: '#6B7280' }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.white }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header: Back Arrow + Title */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={'#1F2937'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: '#1F2937' }]}>{t('dashboard')}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: responsiveHeight(5) }} showsVerticalScrollIndicator={false}>
                {/* User Info Section */}
                <View style={styles.userInfoContainer}>
                    {/* Left Side: Greeting & Details */}
                    <View style={styles.userInfoLeft}>
                        {loading ? (
                            <View>
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradientLib}
                                    style={{ width: 150, height: 24, borderRadius: 4, marginBottom: 8 }}
                                />
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradientLib}
                                    style={{ width: 120, height: 18, borderRadius: 4, marginBottom: 6 }}
                                />
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradientLib}
                                    style={{ width: 180, height: 16, borderRadius: 4, marginBottom: 4 }}
                                />
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradientLib}
                                    style={{ width: 140, height: 14, borderRadius: 4 }}
                                />
                            </View>
                        ) : (
                            <View>
                                <Text style={[styles.greeting, { color: colors.royalBlue, fontSize: responsiveFontSize(2.2), lineHeight: responsiveFontSize(3) }]}>
                                    {`${t('hello')}, ${dashboardData?.forman_name || user?.name || t('module_selection_transporter')} 👋`}
                                </Text>
                                <Text style={[styles.tmId, { color: colors.royalBlue, fontSize: responsiveFontSize(1.6), lineHeight: responsiveFontSize(2.2) }]}>
                                    {user?.unique_id || 'TM2501UPTP00001'}
                                </Text>
                                {/* Association Badge - Plain Text */}
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontWeight: '600', lineHeight: responsiveFontSize(1.8) }}>
                                    {userBadgeText}
                                </Text>
                                <Text style={[styles.subTitle, { color: colors.royalBlue, fontSize: responsiveFontSize(1.2), lineHeight: responsiveFontSize(1.6) }]}>
                                    {t('manageYourFleetDrivers')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Right Side: Profile Icon & Stars */}
                    <View style={styles.userInfoRight}>
                        <TouchableOpacity style={{ alignItems: 'center' }}>
                            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                                <Svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
                                    <Defs>
                                        <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
                                            <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
                                        </SvgGradient>
                                    </Defs>
                                    <Circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke="url(#grad)"
                                        strokeWidth={4}
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={progressOffset}
                                        strokeLinecap="round"
                                        rotation={90}
                                        origin={`${size / 2}, ${size / 2}`}
                                    />
                                </Svg>
                                <Image
                                    style={{ height: size - strokeWidth, width: size - strokeWidth, borderRadius: 100, backgroundColor: colors.white }}
                                    source={{ uri: user?.images ? `${BASE_URL}public/${user?.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                                />
                                <View style={{ backgroundColor: 'white', paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(0.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${progress}%`}</Text>
                                </View>
                            </View>
                            {/* <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: responsiveFontSize(1.5), gap: 2 }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <FontAwesome
                                        key={i}
                                        name={i < (star_rating || 4) ? 'star' : 'star-o'}
                                        size={responsiveFontSize(1.6)}
                                        color={i < (star_rating || 4) ? '#FFD700' : 'rgba(0,0,0,0.2)'}
                                    />
                                ))}
                            </View> */}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Work Overview Section */}
                <View style={styles.sectionContainer}>
                    {renderSectionHeader(t('workOverview'), 'briefcase-outline')}
                    <View style={styles.cardsRow}>
                        {renderStatsCard(t('myDrivers'), dashboardData?.total_drivers || 0, require('../../../../assets/my_drivers_card_icon.png'))}
                        {renderStatsCard(t('jobApplications'), dashboardData?.jobs?.total_applications || 0, require('../../../../assets/applications_card_icon.png'))}
                        {renderStatsCard(t('jobs'), dashboardData?.jobs?.total_jobs || 0, require('../../../../assets/jobs_card_icon.png'))}
                    </View>
                </View>

                {/* Driver Readiness Status Section */}
                <View style={styles.sectionContainer}>
                    {renderSectionHeader(t('driverReadinessStatus'), 'shield-checkmark-outline')}
                    <View style={styles.cardsRow}>
                        {renderStatsCard(t('subscription'), dashboardData ? `₹ ${(dashboardData?.commission?.job_ready || 0) + (dashboardData?.commission?.trusted || 0) + (dashboardData?.commission?.verified || 0)}` : '₹ 0', require('../../../../assets/pending_subscription_icon.png'), false)}
                        {renderStatsCard(t('trainingLabel'), dashboardData?.training?.pending || 0, require('../../../../assets/pending_training_icon.png'), false)}
                        {renderStatsCard(t('profile'), dashboardData?.completed_profiles_count || 0, require('../../../../assets/pending_profile_icon.png'), false)}
                    </View>
                </View>

                {/* Subscription (Driver Types) Section */}
                <View style={styles.sectionContainer}>
                    {renderSectionHeader(t('subscription'), 'ribbon-outline')}
                    <View style={styles.cardsRow}>
                        {renderStatsCard(t('jobReadyDriver'), dashboardData?.counts?.job_ready || 0, require('../../../../assets/job_ready_driver_card_icon.png'))}
                        {renderStatsCard(t('verifiedDriver'), dashboardData?.counts?.verified || 0, require('../../../../assets/verified_driver_card_icon.png'))}
                        {renderStatsCard(t('trustedDriver'), dashboardData?.counts?.trusted || 0, require('../../../../assets/trusted_driver_card_icon.png'))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    userInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 10,
        marginBottom: 20,
    },
    userInfoLeft: {
        flex: 1,
        justifyContent: 'center',
    },
    userInfoRight: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    greeting: {
        fontWeight: 'bold',
    },
    tmId: {
        fontWeight: 'bold',
    },
    roleTitle: {
        fontWeight: 'bold',
    },
    subTitle: {
        fontStyle: 'italic',
    },
    sectionContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    // Removed sectionIconContainer styles as requested
    sectionTitle: {
        // Styles handled inline for specific font size request
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statsCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    cardCount: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardLabel: {
        textAlign: 'center',
        fontWeight: '500',
    },
});
