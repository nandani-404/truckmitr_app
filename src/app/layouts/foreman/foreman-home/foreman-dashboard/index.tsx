import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradientLib from 'react-native-linear-gradient';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';

// Local Icons
const myPilotsIcon = require('../../../../../assets/my_pilots.png');
const jobsIcon = require('../../../../../assets/jobs.png');
const pendingTrainingIcon = require('../../../../../assets/pending_training.png');
const jobApplicationIcon = require('../../../../../assets/job_application.png');
const subscriptionIcon = require('../../../../../assets/subscription.png');
const profileIcon = require('../../../../../assets/profile_icon.png');
const verifiedDriverIcon = require('../../../../../assets/verified_driver.png');
const trustedDriverIcon = require('../../../../../assets/trusted_driver.png');
const jobReadyDriverIcon = require('../../../../../assets/job_ready_driver.png');

// Icons Map
const ICONS = {
    pilots: myPilotsIcon,
    jobs: jobsIcon,
    application: jobApplicationIcon,
    subscription: subscriptionIcon,
    training: pendingTrainingIcon,
    profile: profileIcon,
    jobReady: jobReadyDriverIcon,
    verified: verifiedDriverIcon,
    trusted: trustedDriverIcon
};

// Dashboard API Response Interface
interface DashboardData {
    success: boolean;
    forman_id: string;
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
}

// Shimmer Card Component
const ShimmerCard = () => {
    const { shadow } = useShadow();
    return (
        <View style={[styles.card, shadow, { width: '31%' }]}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradientLib}
                style={{ width: 42, height: 42, borderRadius: 10, marginBottom: 4 }}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradientLib}
                style={{ width: 40, height: 18, borderRadius: 4, marginTop: 4 }}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradientLib}
                style={{ width: 60, height: 12, borderRadius: 4, marginTop: 4 }}
            />
        </View>
    );
};

const DashboardStatsCard = ({ icon, count, title, loading }: { icon: any, count: number | string, title: string, loading?: boolean }) => {
    const { responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    if (loading) {
        return <ShimmerCard />;
    }

    return (
        <View style={[styles.card, shadow, { width: '31%' }]}>
            <View style={{ width: 42, height: 42, backgroundColor: '#F9FAFB', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Image source={typeof icon === 'string' ? { uri: icon } : icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <Text style={[styles.cardCount, { fontSize: responsiveFontSize(2) }]}>{count}</Text>
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(1.2) }]}>{title}</Text>
        </View>
    );
};

export default function ForemanDashboard() {
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    const { user, profileCompletion } = useSelector((state: RootState) => state.user);

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    // Progress ring calculations
    const radius = 27;
    const circumference = 2 * Math.PI * radius;
    const progress = Number(profileCompletion) || 0;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.FOREMAN_DASHBOARD(user.id));
            console.log('Dashboard API Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    // Format currency
    const formatCurrency = (amount: number) => {
        if (!amount) return '₹ 0';
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    // Get total commission amount for subscription display
    const getTotalSubscription = () => {
        if (!dashboardData) return '₹ 0';
        const total = (dashboardData.commission?.job_ready || 0) +
            (dashboardData.commission?.trusted || 0) +
            (dashboardData.commission?.verified || 0);
        return formatCurrency(total);
    };

    return (
        <View style={styles.container}>
            {/* Header: Back + Dashboard Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: safeAreaInsets.top + 10, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: '#fff' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 20, top: safeAreaInsets.top + 10, zIndex: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: '#1E293B' }}>{t('dashboard')}</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 20 }]} showsVerticalScrollIndicator={false}>

                {/* Profile Info Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                    {loading ? (
                        <View>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradientLib}
                                style={{ width: 180, height: 24, borderRadius: 4, marginBottom: 8 }}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradientLib}
                                style={{ width: 140, height: 18, borderRadius: 4, marginBottom: 6 }}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradientLib}
                                style={{ width: 80, height: 16, borderRadius: 4 }}
                            />
                        </View>
                    ) : (
                        <View>
                            <Text style={{ color: '#6E7CF5', fontSize: responsiveFontSize(2.2), fontWeight: 'bold', lineHeight: responsiveFontSize(3) }}>
                                {t('helloUser', { name: dashboardData?.forman_name || user?.name || 'User' })}
                            </Text>
                            <Text style={{ color: '#6E7CF5', fontSize: responsiveFontSize(1.6), fontWeight: 'bold', lineHeight: responsiveFontSize(2.2) }}>
                                {dashboardData?.referral_code || user?.unique_id || 'TMID'}
                            </Text>
                            <Text style={{ color: '#6E7CF5', fontSize: responsiveFontSize(1.4), fontWeight: 'bold', lineHeight: responsiveFontSize(1.8) }}>
                                {t('foreman')}
                            </Text>
                        </View>
                    )}

                    {/* Profile Icon (Right Side) */}
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
                            <Svg width={58} height={58} style={{ position: "absolute", top: 0, left: 0 }}>
                                <Defs>
                                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
                                        <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
                                    </LinearGradient>
                                </Defs>
                                <Circle
                                    cx={29}
                                    cy={29}
                                    r={radius}
                                    stroke="url(#grad)"
                                    strokeWidth={4}
                                    fill="none"
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform="rotate(-90 29 29)"
                                />
                            </Svg>
                            <Image
                                style={{ height: 58 - 4, width: 58 - 4, borderRadius: 100, backgroundColor: '#fff' }}
                                source={{ uri: user?.images || user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                            />
                            <View style={{ backgroundColor: 'white', paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(0.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${progress}%`}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Work Overview */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                    <Ionicons name="briefcase-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{t('workOverview')}</Text>
                </View>
                <View style={styles.cardRow}>
                    <DashboardStatsCard
                        icon={ICONS.pilots}
                        count={loading ? 0 : (dashboardData?.total_drivers || 0)}
                        title={t('myPilots')}
                        loading={loading}
                    />
                    <DashboardStatsCard
                        icon={ICONS.application}
                        count={5}
                        title={t('jobApplication')}
                        loading={loading}
                    />
                    <DashboardStatsCard
                        icon={ICONS.jobs}
                        count={8}
                        title={t('jobs')}
                        loading={loading}
                    />
                </View>

                {/* Driver Readiness Status */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{t('driverReadinessStatus')}</Text>
                </View>
                <View style={styles.cardRow}>
                    <DashboardStatsCard
                        icon={ICONS.subscription}
                        count={loading ? '₹ 0' : getTotalSubscription()}
                        title={t('commission')}
                        loading={loading}
                    />
                    <DashboardStatsCard
                        icon={ICONS.training}
                        count={loading ? 0 : (dashboardData?.training?.complete || 0)}
                        title={t('completeTraining')}
                        loading={loading}
                    />
                    <DashboardStatsCard
                        icon={ICONS.profile}
                        count={loading ? 0 : (dashboardData?.completed_profiles_count || 0)}
                        title={t('profileCompleted')}
                        loading={loading}
                    />
                </View>

                {/* Subscription */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                    <Ionicons name="card-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{t('subscription')}</Text>
                </View>
                <View style={styles.cardRow}>
                    <DashboardStatsCard
                        icon={ICONS.jobReady}
                        count={loading ? 0 : (dashboardData?.counts?.job_ready || 0)}
                        title={t('jobReady')}
                        loading={loading}
                    />
                    <DashboardStatsCard
                        icon={ICONS.verified}
                        count={loading ? 0 : (dashboardData?.counts?.verified || 0)}
                        title={t('verified')}
                        loading={loading}
                    />
                    <DashboardStatsCard
                        icon={ICONS.trusted}
                        count={loading ? 0 : (dashboardData?.counts?.trusted || 0)}
                        title={t('trusted')}
                        loading={loading}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 8,
    },
    sectionUnderline: {
        height: 2,
        width: 30,
        backgroundColor: '#6E7CF5',
        marginBottom: 16,
        marginTop: 4,
        borderRadius: 2
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 120,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardCount: {
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
        marginTop: 2,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        marginTop: 0,
    },
    profileContainer: {
        position: 'relative',
        width: 58,
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        position: 'absolute',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    percentageBadge: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fff',
    },
    percentageText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#1E293B',
    },
});
