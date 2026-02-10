import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
    Image, FlatList, Modal, Animated, Dimensions, Linking, StatusBar,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { subscriptionModalAction } from '@truckmitr/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { getUserBadgeText } from '@truckmitr/src/utils/global/userBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color Palette - Enterprise Trucking Theme
const COLORS = {
    primary: '#1E3A5F',      // Deep Blue
    secondary: '#2C3E50',    // Charcoal Gray
    accent: '#3498DB',       // Bright Blue
    success: '#27AE60',      // Green
    warning: '#F39C12',      // Orange
    error: '#E74C3C',        // Red
    white: '#FFFFFF',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    onTrip: '#F59E0B',
    active: '#10B981',
    inactive: '#EF4444',
};

// Screen Types
type ScreenType = 'list' | 'profile' | 'addDriver' | 'pending';

// Mock Driver Data


const PENDING_DRIVERS = [
    { id: 101, name: 'Prakash Mehra', phone: '+91 99887 76655', status: 'pending', documents: ['DL', 'Aadhaar'], uploadedAt: '2 hours ago' },
    { id: 102, name: 'Sanjay Verma', phone: '+91 88776 65544', status: 'reupload', documents: ['DL'], uploadedAt: '1 day ago' },
];

interface DashboardData {
    association_id: string;
    association_name: string;
    unique_id: string;
    referral_code: string;
    level: {
        name: string;
        driver_count: number;
        bonus_percent: number;
        benefits: string;
    };
    today: {
        total_payment: number;
        commission: number;
        bonus: number;
        final_commission: number;
    };
    this_month: {
        total_payment: number;
        commission: number;
        bonus: number;
        final_commission: number;
    };
    pending_training_count: number;
    incomplete_profile_count: number;
    license_expiring_next_month_count: number;
    pending_driver_subscription_count: number;
}
// Main Component
export default function DriverAssociation() {
    const insets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    // Get user data from Redux
    const { user, profileCompletion, star_rating, rank, subscriptionDetails } = useSelector((state: any) => state?.user) || {};
    const dispatch = useDispatch();

    // Check if Association is Pro (Active Subscription)
    // The subscriptionDetails.hasActiveSubscription now properly detects association_pro subscriptions
    // Also check subscription details directly for payment_type and subscription_plan_id
    const isAssociationPro =
        subscriptionDetails?.hasActiveSubscription ||
        subscriptionDetails?.payment_type === 'association_pro' ||
        subscriptionDetails?.subscription_plan_id === '12' ||
        subscriptionDetails?.subscription_plan_id === 12 ||
        user?.is_active === 1 ||
        user?.plan_id === 12 ||
        user?.subscription_plan_id === '12' ||
        user?.payment_type === 'association_pro' ||
        user?.subscription_status === 'active';

    // Debug log to help troubleshoot subscription status
    console.log('[AssociationHome] Subscription Check:', {
        isAssociationPro,
        'subscriptionDetails?.hasActiveSubscription': subscriptionDetails?.hasActiveSubscription,
        'subscriptionDetails?.payment_type': subscriptionDetails?.payment_type,
        'subscriptionDetails?.subscription_plan_id': subscriptionDetails?.subscription_plan_id,
        'subscriptionDetails?.payment_status': subscriptionDetails?.payment_status,
    });

    // Get the user badge text (Association Pro / Association)
    const userBadgeText = getUserBadgeText({ user, subscriptionDetails });

    const handleFeatureAccess = (action: () => void) => {
        if (isAssociationPro) {
            action();
        } else {
            dispatch(subscriptionModalAction(true));
        }
    };

    // Profile ring calculations
    const size = responsiveFontSize(8);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = profileCompletion || 10;
    const progressOffset = circumference - (progress / 100) * circumference;

    const [currentScreen, setCurrentScreen] = useState<ScreenType>('list');
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [showMenuSheet, setShowMenuSheet] = useState(false);
    const [menuDriver, setMenuDriver] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [expiringDocsCount, setExpiringDocsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const navigation = useNavigation();

    // Payment modal handler
    const openPaymentModal = () => {
        dispatch(subscriptionModalAction(true));
    };

    const fetchDashboardData = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const [dashboardResponse, expiringResponse] = await Promise.all([
                axiosInstance.get(END_POINTS.ASSOCIATION_HOME_DASHBOARD(user?.id)),
                axiosInstance.get(END_POINTS.ASSOCIATION_EXPIRING_DOCUMENTS(user?.id))
            ]);

            if (dashboardResponse.data) {
                setDashboardData(dashboardResponse.data);
            }

            if (expiringResponse.data && expiringResponse.data.success) {
                setExpiringDocsCount(expiringResponse.data.total_expiring_licenses || 0);
            }
        } catch (error) {
            console.error('Error fetching association dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Track if we've already shown the modal to prevent loops
    const hasShownSubscriptionModal = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                fetchDashboardData();
            }
        }, [user?.id])
    );

    // Handle subscription modal trigger - ONE TIME ONLY
    React.useEffect(() => {
        // Only open payment modal if:
        // 1. subscriptionDetails is loaded (not null/undefined)
        // 2. showSubscriptionModel flag is true (set by reducer when no active subscription)
        // 3. User is not already recognized as AssociationPro
        // 4. We haven't shown it yet in this session
        const shouldShowModal =
            subscriptionDetails?.showSubscriptionModel === true &&
            !isAssociationPro &&
            !hasShownSubscriptionModal.current;

        if (shouldShowModal) {
            console.log('[AssociationHome] Opening subscription modal - no active subscription detected');
            dispatch(subscriptionModalAction(true));
            hasShownSubscriptionModal.current = true;
        }
    }, [isAssociationPro, subscriptionDetails?.showSubscriptionModel]);



    const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
    const handleMessage = (phone: string) => Linking.openURL(`sms:${phone}`);

    const handleDriverPress = (driver: any) => {
        setSelectedDriver(driver);
        setCurrentScreen('profile');
    };

    const handleMenuPress = (driver: any) => {
        setMenuDriver(driver);
        setShowMenuSheet(true);
    };

    const goBack = () => {
        if (currentScreen === 'profile') {
            setCurrentScreen('list');
            setSelectedDriver(null);
        } else {
            navigation.goBack();
        }
    };

    // SCREEN 1: Main List Screen
    const renderListScreen = () => (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Dashboard Cards Section */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: responsiveHeight(12) }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboardData(true)} />
                }
            >
                {/* Banner Section - Exact same as Foreman Home */}
                <View style={{ height: responsiveHeight(42), width: responsiveWidth(100), borderBottomLeftRadius: 60, borderBottomRightRadius: 60, marginBottom: responsiveHeight(4) }}>
                    {/* Banner Background */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: 60, borderBottomRightRadius: 60, overflow: 'hidden' }}>
                        <Image
                            style={{ width: '100%', height: '100%' }}
                            source={require('../../../../assets/foreman_banner_1.jpeg')}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Header Content */}
                    <View style={{ paddingTop: insets.top, paddingHorizontal: responsiveWidth(3) }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.2), fontWeight: 'bold', lineHeight: responsiveFontSize(3) }}>{`${t('hello')}, ${dashboardData?.association_name || user?.name || 'Transporter'} 👋`}</Text>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.6), fontWeight: 'bold', lineHeight: responsiveFontSize(2.2) }}>{dashboardData?.unique_id || user?.unique_id || 'TM2501UPTP00001'}</Text>
                                {/* Association Badge - Plain Text */}
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontWeight: '600', lineHeight: responsiveFontSize(1.8) }}>{userBadgeText}</Text>
                            </View>

                            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_PROFILE as never)}>
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

                    {/* Search Bar - Navigate to dedicated search screen */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_SEARCH as never)}
                        style={{
                            position: 'absolute',
                            bottom: -responsiveHeight(1.5),
                            width: responsiveWidth(92),
                            flexDirection: 'row',
                            height: responsiveHeight(6),
                            alignSelf: 'center',
                            backgroundColor: colors.white,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderColor: '#000',
                            borderWidth: 1.5,
                            borderRadius: 100,
                            paddingHorizontal: responsiveWidth(4),
                            ...shadow,
                            zIndex: 100,
                            elevation: 10
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Feather name="search" size={18} color={colors.royalBlue} style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: 'rgba(0,0,0,0.5)' }}>
                                {t('searchDrivers')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>

                {/* Dashboard Cards Content */}
                <View style={{ paddingHorizontal: responsiveWidth(4) }}>
                    {/* Quick Actions Section */}
                    <View style={styles.quickActionsSection}>
                        <View style={styles.quickActionsHeader}>
                            <Ionicons name="flash" size={18} color="#3B82F6" />
                            <Text style={styles.quickActionsLabel}>{t('association_home_quick_actions')}</Text>
                        </View>

                        <View style={styles.quickActionsRow}>
                            {/* Dashboard Card */}
                            <TouchableOpacity
                                style={[styles.quickActionCard, { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }]}
                                activeOpacity={0.8}
                                onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_DASHBOARD as never))}
                            >
                                <View style={styles.quickActionCardInner}>
                                    <View style={[styles.quickActionIconCircle, { backgroundColor: '#FFFFFF' }]}>
                                        <Svg width={16} height={16} viewBox="0 0 24 24">
                                            <Path d="M3 13h8V3H3v10z" fill="#4285F4" />
                                            <Path d="M3 21h8v-6H3v6z" fill="#34A853" />
                                            <Path d="M13 21h8V11h-8v10z" fill="#EA4335" />
                                            <Path d="M13 9h8V3h-8v6z" fill="#FBBC05" />
                                        </Svg>
                                    </View>
                                    <Text style={[styles.quickActionCardTitle, { color: '#FFFFFF' }]}>{t('dashboard')}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                                </View>
                            </TouchableOpacity>

                            {/* Add Driver Card */}
                            <TouchableOpacity
                                style={[styles.quickActionCard, { backgroundColor: '#FF7043', borderColor: '#FF7043' }]}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_ADD_DRIVER as never)}
                            >
                                <View style={styles.quickActionCardInner}>
                                    <View style={[styles.quickActionIconCircle, { backgroundColor: '#FFFFFF' }]}>
                                        <Svg width={16} height={16} viewBox="0 0 24 24">
                                            <Path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#FF7043" />
                                            <Path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#FF7043" />
                                            <Path d="M6 10V7H4v3H1v2h3v3h2v-3h3v-2H6z" fill="#34A853" />
                                        </Svg>
                                    </View>
                                    <Text style={[styles.quickActionCardTitle, { color: '#FFFFFF' }]}>{t('association_home_add_driver')}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* My Earnings Section */}
                    <View style={styles.myEarningsSection}>
                        <TouchableOpacity
                            style={[styles.sectionLabelRow, { justifyContent: 'space-between' }]}
                            activeOpacity={0.7}
                            onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_EARNINGS as never))}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="wallet" size={18} color="#10B981" />
                                <Text style={styles.sectionLabelText}>{t('myEarnings2')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#64748B" />
                        </TouchableOpacity>

                        <View style={styles.earningsCardsRow}>
                            {/* Today's Earning Card */}
                            <View style={styles.earningCard}>
                                <View style={styles.earningCardHeader}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../../../assets/todays_earning_icon.png')}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.earningCardLabel}>{t('association_home_todays_earning')}</Text>
                                </View>
                                <Text style={styles.earningCardAmount}>₹{dashboardData?.today?.final_commission.toLocaleString('en-IN') || 0}</Text>
                            </View>

                            {/* Monthly Earning Card */}
                            <View style={styles.earningCard}>
                                <View style={styles.earningCardHeader}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../../../assets/monthly_earning_icon.png')}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.earningCardLabel}>{t('association_home_monthly_earning')}</Text>
                                </View>
                                <Text style={[styles.earningCardAmount, { color: '#6366F1' }]}>₹{dashboardData?.this_month?.final_commission.toLocaleString('en-IN') || 0}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Subscription/Payment Section */}
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="card" size={18} color="#8B5CF6" />
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', marginLeft: 8 }}>{t('subscription')}</Text>
                            </View>
                            {subscriptionDetails?.hasActiveSubscription && (
                                <View style={{
                                    backgroundColor: '#10B98115',
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 12
                                }}>
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981' }}>ACTIVE</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={{
                                backgroundColor: subscriptionDetails?.hasActiveSubscription ? '#10B981' : '#F59E0B',
                                borderRadius: 16,
                                padding: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                            activeOpacity={0.8}
                            onPress={() => {
                                // Only open payment modal if user doesn't have an active subscription
                                if (isAssociationPro || subscriptionDetails?.hasActiveSubscription) {
                                    showToast(t('association_already_subscribed') || 'You already have an active subscription!');
                                } else {
                                    openPaymentModal();
                                }
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                                    {subscriptionDetails?.hasActiveSubscription ? t('association_home_premium_active') : t('association_home_upgrade_premium')}
                                </Text>
                                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
                                    {subscriptionDetails?.hasActiveSubscription
                                        ? t('association_home_enjoy_premium')
                                        : t('association_home_unlock_tools')}
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    alignSelf: 'flex-start'
                                }}>
                                    {/* <Ionicons
                                        name={subscriptionDetails?.hasActiveSubscription ? "settings" : "flash"}
                                        size={14}
                                        color="#FFFFFF"
                                    /> */}
                                    {/*  <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF', marginLeft: 4 }}>
                                        {subscriptionDetails?.hasActiveSubscription ? t('association_home_manage_plan') : t('association_home_view_plans')}
                                    </Text> */}
                                </View>
                            </View>
                            <View style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Ionicons
                                    name={subscriptionDetails?.hasActiveSubscription ? "checkmark-circle" : "arrow-forward"}
                                    size={28}
                                    color="#FFFFFF"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Action Required Section */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>{t('actionRequired')}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {/* Pending Profile Card */}
                            <TouchableOpacity
                                style={{
                                    width: '48%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    padding: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_PENDING_PROFILES as never))}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../../../assets/pending_profile_icon.png')}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('association_home_pending')}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('association_home_profile')}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#EF444415', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>{dashboardData?.incomplete_profile_count || 0}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>{t('association_home_complete_driver_profiles')}</Text>
                            </TouchableOpacity>

                            {/* Pending Subscription Card */}
                            <TouchableOpacity
                                style={{
                                    width: '48%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    padding: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_PENDING_SUBSCRIPTION as never)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../../../assets/pending_subscription_icon.png')}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('association_home_pending')}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('subscription')}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#F59E0B15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>{dashboardData?.pending_driver_subscription_count || 0}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>{t('association_home_renew_driver_plans')}</Text>
                            </TouchableOpacity>

                            {/* Pending Training Card */}
                            <TouchableOpacity
                                style={{
                                    width: '48%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    padding: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_PENDING_TRAINING as never)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../../../assets/pending_training_icon.png')}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('association_home_pending')}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('training')}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#6366F115', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#6366F1' }}>{dashboardData?.pending_training_count || 0}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>{t('association_home_assign_driver_trainings')}</Text>
                            </TouchableOpacity>
                            {/* Expiring Documents Card */}
                            <TouchableOpacity
                                style={{
                                    width: '48%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    padding: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_EXPIRING_DOCUMENTS as never)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={require('../../../../assets/expiring_documents_icon.png')}
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('association_home_expiring')}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 15 }}>{t('association_home_documents')}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#EC489915', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#EC4899' }}>{expiringDocsCount}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>{t('association_home_update_driver_docs')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* My Drivers Section */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Ionicons name="people-outline" size={18} color="#3B82F6" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>{t('association_home_my_drivers')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {/* All Drivers Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingVertical: 24,
                                    paddingHorizontal: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_MY_DRIVERS as never)}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Image
                                        source={require('../../../../assets/my_drivers_card_icon.png')}
                                        style={{ width: 42, height: 42 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 4 }}>{t('association_home_my_drivers')}</Text>
                            </TouchableOpacity>

                            {/* Verified Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingVertical: 24,
                                    paddingHorizontal: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_VERIFIED_DRIVERS as never)}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Image
                                        source={require('../../../../assets/verified_driver_card_icon.png')}
                                        style={{ width: 42, height: 42 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 4 }}>{t('association_home_verified_driver')}</Text>
                            </TouchableOpacity>

                            {/* Trusted Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingVertical: 24,
                                    paddingHorizontal: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_TRUSTED_DRIVERS as never)}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Image
                                        source={require('../../../../assets/trusted_driver_card_icon.png')}
                                        style={{ width: 42, height: 42 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 4 }}>{t('association_home_trusted_driver')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Jobs & Recruitment Section */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Ionicons name="briefcase-outline" size={18} color="#F59E0B" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>{t('association_home_jobs_recruitment')}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {/* Jobs Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingVertical: 24,
                                    paddingHorizontal: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_JOBS_LIST as never)}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Image
                                        source={require('../../../../assets/jobs_card_icon.png')}
                                        style={{ width: 42, height: 42 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 4 }}>{t('jobs')}</Text>
                            </TouchableOpacity>

                            {/* Applications Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingVertical: 24,
                                    paddingHorizontal: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_APPLICATIONS as never)}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Image
                                        source={require('../../../../assets/applications_card_icon.png')}
                                        style={{ width: 42, height: 42 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 4 }}>{t('applications')}</Text>
                            </TouchableOpacity>

                            {/* Recruitments Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingVertical: 24,
                                    paddingHorizontal: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB',
                                }}
                                activeOpacity={0.7}
                                onPress={() => showToast(t('comingSoon') || 'Coming Soon')}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Image
                                        source={require('../../../../assets/recruitments_card_icon.png')}
                                        style={{ width: 42, height: 42 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 4 }}>{t('recruitments')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView >



            {/* Add Driver Bottom Sheet */}
            < Modal visible={showAddSheet} transparent animationType="slide" onRequestClose={() => setShowAddSheet(false)
            }>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddSheet(false)}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>{t('association_home_add_driver_modal_title')}</Text>
                        <Text style={styles.sheetSubtitle}>{t('association_home_add_driver_choose_method')}</Text>

                        <TouchableOpacity style={styles.sheetOption}>
                            <View style={[styles.sheetOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="person-add" size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.sheetOptionInfo}>
                                <Text style={styles.sheetOptionTitle}>{t('association_home_add_manually')}</Text>
                                <Text style={styles.sheetOptionDesc}>{t('association_home_add_manually_desc')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sheetOption}>
                            <View style={[styles.sheetOptionIcon, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="people" size={22} color={COLORS.success} />
                            </View>
                            <View style={styles.sheetOptionInfo}>
                                <Text style={styles.sheetOptionTitle}>{t('association_home_add_from_contacts')}</Text>
                                <Text style={styles.sheetOptionDesc}>{t('association_home_add_from_contacts_desc')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sheetOption}>
                            <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="qr-code" size={22} color={COLORS.warning} />
                            </View>
                            <View style={styles.sheetOptionInfo}>
                                <Text style={styles.sheetOptionTitle}>{t('association_home_invite_via_link')}</Text>
                                <Text style={styles.sheetOptionDesc}>{t('association_home_invite_via_link_desc')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal >

            {/* Menu Bottom Sheet */}
            < Modal visible={showMenuSheet} transparent animationType="slide" onRequestClose={() => setShowMenuSheet(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenuSheet(false)}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>{t('association_home_actions_for')} {menuDriver?.name}</Text>

                        {[
                            { icon: 'car', label: 'Assign Truck', color: COLORS.primary },
                            { icon: 'map', label: 'Assign Trip', color: COLORS.success },
                            { icon: 'person', label: 'View Profile', color: COLORS.accent },
                            { icon: 'document-text', label: 'View Documents', color: COLORS.warning },
                            { icon: 'ban', label: 'Suspend Driver', color: COLORS.error },
                        ].map((action, idx) => (
                            <TouchableOpacity key={idx} style={styles.menuOption} onPress={() => setShowMenuSheet(false)}>
                                <View style={[styles.menuOptionIcon, { backgroundColor: action.color + '15' }]}>
                                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                                </View>
                                <Text style={[styles.menuOptionText, action.label === 'Suspend Driver' && { color: COLORS.error }]}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal >
        </View >
    );

    // SCREEN 2: Driver Profile Screen
    const renderProfileScreen = () => {
        if (!selectedDriver) return null;
        const d = selectedDriver;
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={[styles.profileHeader, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={styles.profileHeaderContent}>
                        <Image source={{ uri: d.image }} style={styles.profileAvatar} />
                        <View style={[styles.profileStatusDot, { backgroundColor: d.status === 'active' ? COLORS.active : d.status === 'onTrip' ? COLORS.onTrip : COLORS.inactive }]} />
                        <Text style={styles.profileName}>{d.name}</Text>
                        <Text style={styles.profileId}>{d.tmId}</Text>
                        <View style={styles.profileActionRow}>
                            <TouchableOpacity style={styles.profileActionBtn} onPress={() => handleCall(d.phone)}>
                                <Ionicons name="call" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.profileActionBtn} onPress={() => handleMessage(d.phone)}>
                                <Ionicons name="chatbubble" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                    {/* Personal Details */}
                    <View style={styles.profileSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                        </View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Name</Text><Text style={styles.detailValue}>{d.name}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{d.phone}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Experience</Text><Text style={styles.detailValue}>{d.experience}</Text></View>
                    </View>

                    {/* License & Documents */}
                    <View style={styles.profileSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="card" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>License & Documents</Text>
                        </View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>License Type</Text><Text style={styles.detailValue}>{d.licenseType}</Text></View>
                        <View style={styles.docGrid}>
                            {['Driving License', 'Aadhaar', 'PAN', 'Police Verification'].map((doc, idx) => (
                                <TouchableOpacity key={idx} style={styles.docCard}>
                                    <Ionicons name="document-text" size={24} color={COLORS.accent} />
                                    <Text style={styles.docName}>{doc}</Text>
                                    <Text style={styles.docStatus}>View</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Assigned Vehicle */}
                    {d.assignedTruck && (
                        <View style={styles.profileSection}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="truck" size={18} color={COLORS.primary} />
                                <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
                            </View>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Truck Number</Text><Text style={styles.detailValue}>{d.assignedTruck}</Text></View>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Truck Type</Text><Text style={styles.detailValue}>{d.truckType}</Text></View>
                        </View>
                    )}

                    {/* Performance */}
                    <View style={[styles.profileSection, { marginBottom: 40 }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="stats-chart" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Performance</Text>
                        </View>
                        <View style={styles.perfGrid}>
                            <View style={styles.perfCard}>
                                <Text style={styles.perfValue}>{d.totalTrips}</Text>
                                <Text style={styles.perfLabel}>Total Trips</Text>
                            </View>
                            <View style={styles.perfCard}>
                                <Text style={styles.perfValue}>{d.onTimeDelivery}%</Text>
                                <Text style={styles.perfLabel}>On-Time</Text>
                            </View>
                            <View style={styles.perfCard}>
                                <Text style={styles.perfValue}>{d.rating}</Text>
                                <Text style={styles.perfLabel}>Rating</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    };

    if (loading && !dashboardData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return currentScreen === 'list' ? renderListScreen() : renderProfileScreen();
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: { paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitleWrap: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    addDriverBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    addDriverBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14, marginLeft: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, height: 48 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.textPrimary },

    // Stats
    statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 0, marginBottom: 16 },
    statCard: { flex: 1, marginHorizontal: 4, padding: 12, borderRadius: 14, alignItems: 'center' },
    statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    statCount: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

    // Tabs
    tabsContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: COLORS.white, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    activeTabText: { color: COLORS.white },

    // Driver Card
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    driverCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    driverCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
    driverProfileRow: { flexDirection: 'row' },
    avatarContainer: { position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: COLORS.white },
    driverInfo: { marginLeft: 12, flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    driverName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    verifiedBadge: { marginLeft: 4 },
    driverId: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    driverPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
    licenseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    licenseChip: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    licenseText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
    experienceText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 8 },
    cardActions: { flexDirection: 'row', alignItems: 'flex-start' },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },

    // Badges
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, alignItems: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 4 },
    verifiedChip: { backgroundColor: '#ECFDF5' },
    topRatedChip: { backgroundColor: '#FFFBEB' },
    badgeText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    ratingText: { fontSize: 12, fontWeight: '600', color: '#B8860B', marginLeft: 3 },

    // Status Row
    statusRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider },
    statusItem: { flex: 1 },
    statusDivider: { width: 1, backgroundColor: COLORS.divider, marginHorizontal: 10 },
    statusLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
    statusValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },

    // Empty State
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
    emptyBtnText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },

    // Pending Card
    pendingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    pendingLeft: { flexDirection: 'row', alignItems: 'center' },
    pendingAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    pendingName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    pendingPhone: { fontSize: 11, color: COLORS.textSecondary },
    pendingTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    pendingActions: { flexDirection: 'row' },
    approveBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    rejectBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },

    // Bottom Sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
    sheetSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 20 },
    sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    sheetOptionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    sheetOptionInfo: { flex: 1 },
    sheetOptionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    sheetOptionDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    menuOptionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    menuOptionText: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },

    // Profile Screen
    profileHeader: { paddingHorizontal: 16, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
    profileHeaderContent: { alignItems: 'center', marginTop: 10 },
    profileAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
    profileStatusDot: { position: 'absolute', top: 70, right: '35%', width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: COLORS.white },
    profileName: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginTop: 12 },
    profileId: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    profileActionRow: { flexDirection: 'row', marginTop: 16 },
    profileActionBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
    profileContent: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    profileSection: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    detailLabel: { fontSize: 14, color: COLORS.textSecondary },
    detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    docGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    docCard: { width: '48%', backgroundColor: COLORS.background, borderRadius: 12, padding: 14, marginBottom: 8, marginRight: '4%', alignItems: 'center' },
    docName: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '500', marginTop: 8, textAlign: 'center' },
    docStatus: { fontSize: 11, color: COLORS.accent, fontWeight: '600', marginTop: 4 },
    perfGrid: { flexDirection: 'row', marginTop: 10 },
    perfCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 14, marginHorizontal: 4, alignItems: 'center' },
    perfValue: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
    perfLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

    // Dashboard Cards - Premium Fintech Style
    dashboardCard: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    // Association Status Card
    statusCardGradient: {
        padding: 20,
        borderRadius: 20,
    },
    statusCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusCardLeft: {
        flex: 1,
    },
    dashboardCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    statusBadgeRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    activeStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    activeStatusText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#22C55E',
        marginLeft: 6,
    },
    profileCompleteText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 4,
    },
    statusIconContainer: {
        marginLeft: 16,
    },
    statusIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Total Drivers Card
    driversCardGradient: {
        padding: 20,
        borderRadius: 20,
    },
    driversCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driversCardLeft: {
        flex: 1,
    },
    driversCount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    driversSubtext: {
        fontSize: 13,
        color: '#64748B',
    },
    driversIconContainer: {
        marginLeft: 16,
    },
    driversIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Add Driver CTA Card
    addDriverCardGradient: {
        padding: 24,
        borderRadius: 20,
    },
    addDriverCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addDriverCardLeft: {
        flex: 1,
    },
    addDriverCardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    addDriverCardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    addDriverCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    addDriverCardBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#3B82F6',
        marginLeft: 6,
    },
    addDriverIllustration: {
        marginLeft: 16,
    },
    truckIllustrationContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Today's Earnings Card
    earningsCardGradient: {
        padding: 20,
        borderRadius: 20,
    },
    earningsCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    earningsCardLeft: {
        flex: 1,
    },
    earningsAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    earningsSubtext: {
        fontSize: 13,
        color: '#64748B',
    },
    earningsIconContainer: {
        marginLeft: 16,
    },
    earningsIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Monthly Earnings Card
    monthlyEarningsCardGradient: {
        padding: 20,
        borderRadius: 20,
    },
    monthlyEarningsCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthlyEarningsCardLeft: {
        flex: 1,
    },
    monthlyEarningsAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        fontSize: 13,
        color: '#22C55E',
        fontWeight: '600',
        marginLeft: 4,
    },
    monthlyEarningsIconContainer: {
        marginLeft: 16,
    },
    monthlyEarningsIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom Navigation
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingBottom: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 10,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    bottomNavItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        minWidth: 60,
    },
    bottomNavText: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
        fontWeight: '500',
    },
    bottomNavTextActive: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        top: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#3B82F6',
    },

    // Quick Actions Section
    quickActionsSection: {
        marginBottom: 20,
    },
    quickActionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickActionsLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionCard: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    quickActionCardInner: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    quickActionIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionTextContainer: {
        marginLeft: 10,
        flex: 1,
    },
    quickActionCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
        marginLeft: 10,
    },
    quickActionCardSubtitle: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 1,
    },

    // My Earnings Section
    myEarningsSection: {
        marginBottom: 16,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionLabelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginLeft: 8,
    },
    earningsCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    earningCard: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    earningCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    earningIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    earningCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 8,
    },
    earningCardAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#10B981',
    },
});
