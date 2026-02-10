import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    StyleSheet,
    Animated,
    TouchableWithoutFeedback,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { subscriptionModalAction, subscriptionDetailsAction } from '@truckmitr/src/redux/actions/user.action';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import PollSurveyModal from '@truckmitr/src/utils/poll-survey';
import { setPilots, setPilotsLoading } from '@truckmitr/redux/slices/pilotsSlice';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import Toast from 'react-native-simple-toast';
import ReactNativeBlobUtil from 'react-native-blob-util';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Category Card Component
interface CategoryCardProps {
    title: string;
    subtitle: string;
    icon: any;
    iconType?: 'ionicons' | 'feather' | 'material' | 'image' | 'localImage';
    iconColor?: string;
    onPress: () => void;
    style?: any;
    iconSize?: number;
    titleStyle?: any;
    subtitleStyle?: any;
}

interface CategoryData {
    id: number;
    title: string;
    subtitle: string;
    icon: any;
    iconType: 'ionicons' | 'feather' | 'material' | 'image' | 'localImage';
    iconColor: string;
}

const CategoryCard = ({ title, subtitle, icon, iconType = 'ionicons', iconColor = '#6E7CF5', onPress, style, iconSize = 28, titleStyle, subtitleStyle }: CategoryCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const renderIcon = () => {
        switch (iconType) {
            case 'feather':
                return <Feather name={icon} size={iconSize} color={iconColor} />;
            case 'material':
                return <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />;
            case 'image':
                return <Image source={{ uri: icon }} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />;
            case 'localImage':
                return <Image source={icon} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />;
            default:
                return <Ionicons name={icon} size={iconSize} color={iconColor} />;
        }
    };

    return (
        <TouchableWithoutFeedback onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
            <Animated.View style={[styles.categoryCard, style, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.iconContainer, { width: iconSize * 1.5, height: iconSize * 1.5, borderRadius: iconSize / 2.5 }]}>
                    {renderIcon()}
                </View>
                <Text style={[styles.cardTitle, titleStyle]}>{title}</Text>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

// Bottom Tab Item Component
interface BottomTabItemProps {
    icon: string;
    label: string;
    isActive: boolean;
    onPress: () => void;
}

// const BottomTabItem = ({ icon, label, isActive, onPress, customIcon }: BottomTabItemProps & { customIcon?: React.ReactNode }) => {
//     return (
//         <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
//             <View style={[styles.tabIconContainer, isActive && styles.tabIconContainerActive]}>
//                 {customIcon ? customIcon : (
//                     <Ionicons
//                         name={isActive ? icon : `${icon}-outline`}
//                         size={22}
//                         color={isActive ? '#6E7CF5' : '#64748B'}
//                     />
//                 )}
//                 {isActive && <Text style={styles.tabLabel}>{label}</Text>}
//             </View>
//         </TouchableOpacity>
//     );
// };



const myPilotsIcon = require('../../../../assets/my_pilots.png');
const pendingTrainingIcon = require('../../../../assets/pending_training_icon.png');
const pendingSubscriptionIcon = require('../../../../assets/pending_subscription_icon.png');
const jobsIcon = require('../../../../assets/jobs.png');
const expiringDocumentsIcon = require('../../../../assets/expiring_documents.png');
const pendingProfileIcon = require('../../../../assets/pending_profile.png');
const thisMonthEarningIcon = require('../../../../assets/this_month_earning.png');
const todaysEarningIcon = require('../../../../assets/todays_earning.png');
const verifiedDriverIcon = require('../../../../assets/verified_driver.png');
const trustedDriverIcon = require('../../../../assets/trusted_driver.png');
const jobApplicationIcon = require('../../../../assets/job_application.png');

import { useTranslation } from 'react-i18next';
import ShimmerText from '@truckmitr/src/utils/shimmerText';

export default function ForemanHome() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const [activeTab, setActiveTab] = React.useState('categories');

    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    const { user, profileCompletion, subscriptionDetails } = useSelector((state: RootState) => state.user);

    const foremanName = user?.name || 'User';
    const dynamicTMID = user?.unique_id || 'TMID';
    const dynamicProfileCompletion = Number(profileCompletion) || 0;
    const star_rating = user?.star_rating || 0;
    const rank = user?.rank || 'No Rank';

    // Check if Foreman is Pro (Active Subscription)
    // Checking is_active flag, specific plan_id (11) or payment_type for Foreman Pro
    // console.log("user unique_id", user?.unique_id);

    // Check if subscription details have been loaded (not null)
    // This prevents showing the modal before subscription data is fetched from API
    const isSubscriptionDataLoaded = subscriptionDetails !== null;

    const isForemanPro =
        user?.is_active === 1 ||
        user?.plan_id === 11 ||
        user?.subscription_plan_id === '11' ||
        user?.payment_type === 'foreman_pro' ||
        user?.subscription_status === 'active' ||
        // Check subscriptionDetails for active foreman_pro subscription
        (subscriptionDetails?.hasActiveSubscription === true) ||
        (subscriptionDetails?.payment_type === 'foreman_pro' && subscriptionDetails?.payment_status === 'captured') ||
        (subscriptionDetails?.subscription_plan_id == 11) ||
        // Also check if amount is 999 (foreman_pro price)
        (parseFloat(subscriptionDetails?.amount) === 999 && subscriptionDetails?.payment_status === 'captured');

    // // DEBUG: Log subscription details for foreman
    // console.log('=== FOREMAN HOME DEBUG ===');
    // console.log('subscriptionDetails:', JSON.stringify(subscriptionDetails, null, 2));
    // console.log('isForemanPro:', isForemanPro);
    // console.log('user?.is_active:', user?.is_active);
    // console.log('user?.plan_id:', user?.plan_id);
    // console.log('user?.payment_type:', user?.payment_type);
    // console.log('subscriptionDetails?.hasActiveSubscription:', subscriptionDetails?.hasActiveSubscription);
    // console.log('subscriptionDetails?.payment_type:', subscriptionDetails?.payment_type);
    // console.log('subscriptionDetails?.payment_status:', subscriptionDetails?.payment_status);
    // console.log('subscriptionDetails?.amount:', subscriptionDetails?.amount);
    // console.log('=== END DEBUG ===');

    const handleFeatureAccess = (action: () => void) => {
        if (isForemanPro) {
            action();
        } else {
            dispatch(subscriptionModalAction(true));
        }
    };

    // Dashboard API data state
    const [dashboardData, setDashboardData] = useState({
        todayEarning: '',
        thisMonthEarning: '',
        levelName: '',
        driverCount: 0,
        bonusPercent: 0,
        pendingTrainingCount: '',
        incompleteProfileCount: '',
        licenseExpiringCount: '',
    });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return '₹ 0';
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const response = await axiosInstance.get(`${END_POINTS.FOREMAN_HOME_DASHBOARD(user.id)}`);
            console.log('Dashboard response:', JSON.stringify(response.data, null, 2));

            if (response.data) {
                const data = response.data;
                setDashboardData({
                    todayEarning: formatCurrency(data.today?.final_commission || 0),
                    thisMonthEarning: formatCurrency(data.this_month?.final_commission || 0),
                    levelName: data.level?.name || '',
                    driverCount: data.level?.driver_count || 0,
                    bonusPercent: data.level?.bonus_percent || 0,
                    pendingTrainingCount: data.pending_training_count?.toString() || '',
                    incompleteProfileCount: data.incomplete_profile_count?.toString() || '',
                    licenseExpiringCount: data.license_expiring_next_month_count?.toString() || '',
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }, [user?.id]);

    // Fetch pilots and store in Redux
    const fetchPilots = useCallback(async () => {
        try {
            dispatch(setPilotsLoading(true));
            const response = await axiosInstance.get(END_POINTS.FOREMAN_MY_PILOTS);
            console.log('My Pilots API Response (Home):', response?.data);
            if (response?.data?.success) {
                dispatch(setPilots(response.data.drivers || []));
            }
        } catch (error) {
            console.error('Error fetching pilots in Home:', error);
        } finally {
            dispatch(setPilotsLoading(false));
        }
    }, [dispatch]);

    // Initial fetch on mount
    React.useEffect(() => {
        fetchPilots();
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            setLoading(true);

            const fetchData = async () => {
                const startTime = Date.now();
                await fetchDashboardData();
                const endTime = Date.now();
                const duration = endTime - startTime;

                // If data fetch was faster than 1000ms, wait out the remaining time
                // to prevent flashing. If it was slower, don't wait extra.
                const delay = duration < 1000 ? 1000 - duration : 0;

                if (isMounted) {
                    setTimeout(() => {
                        if (isMounted) setLoading(false);
                    }, delay);
                }
            };

            // Fetch subscription details for foreman
            const fetchSubscriptionDetails = async () => {
                try {
                    console.log('=== FETCHING FOREMAN SUBSCRIPTION ===');
                    const response = await axiosInstance.get(END_POINTS.PAYMENT_SUBSCRIPTION_DETAILS);
                    console.log('Foreman subscription response:', JSON.stringify(response?.data, null, 2));

                    if (response?.data?.data) {
                        dispatch(subscriptionDetailsAction(response.data.data));

                        // Check if foreman has active subscription after fetching
                        const subData = response.data.data;
                        const hasActiveForeman = Array.isArray(subData) && subData.some((sub: any) =>
                            (sub.payment_type === 'foreman_pro' && sub.payment_status === 'captured') ||
                            (parseFloat(sub.amount) === 999 && sub.payment_status === 'captured')
                        );

                        console.log('hasActiveForeman after fetch:', hasActiveForeman);

                        // Only open payment modal if no active subscription found
                        if (!hasActiveForeman && isMounted) {
                            dispatch(subscriptionModalAction(true));
                        }
                    } else {
                        // No subscription data - show modal
                        if (isMounted) {
                            dispatch(subscriptionModalAction(true));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching foreman subscription:', error);
                    // On error, show payment modal to be safe
                    if (isMounted) {
                        dispatch(subscriptionModalAction(true));
                    }
                }
            };

            fetchData();
            fetchSubscriptionDetails();

            return () => { isMounted = false; };
        }, [fetchDashboardData])
    );

    // Pull to refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    // Level tiers configuration
    // Bronze: 0-49 drivers, Silver: 50-149 drivers, Gold: 150-299 drivers, Platinum: 300+ drivers
    const LEVEL_TIERS = [
        { name: 'Bronze', minDrivers: 0, maxDrivers: 49, bonus: 0 },
        { name: 'Silver', minDrivers: 50, maxDrivers: 149, bonus: 2 },
        { name: 'Gold', minDrivers: 150, maxDrivers: 299, bonus: 5 },
        { name: 'Platinum', minDrivers: 300, maxDrivers: Infinity, bonus: 8 },
    ];

    // Calculate progress towards next level
    const getLevelProgress = () => {
        const currentDrivers = dashboardData.driverCount;
        const currentLevelName = dashboardData.levelName || 'Bronze'; // Localization if needed for fallback, but API returns it.

        // Find current level index based on driver count
        let currentLevelIndex = LEVEL_TIERS.findIndex(tier =>
            currentDrivers >= tier.minDrivers && currentDrivers <= tier.maxDrivers
        );

        // Fallback to first tier if not found
        if (currentLevelIndex === -1) currentLevelIndex = 0;

        const currentLevel = LEVEL_TIERS[currentLevelIndex];

        // Check if at max level (Platinum)
        if (currentLevelIndex >= LEVEL_TIERS.length - 1) {
            return {
                currentLevel: currentLevel.name,
                nextLevel: 'Max Level',
                progress: 100,
                driversNeeded: 0,
                nextBonus: currentLevel.bonus,
                isMaxLevel: true,
            };
        }

        const nextLevel = LEVEL_TIERS[currentLevelIndex + 1];
        const driversForNextLevel = nextLevel.minDrivers;

        // Calculate progress percentage within current tier
        // Progress = how far into current tier / total tier range
        const tierStart = currentLevel.minDrivers;
        const tierEnd = currentLevel.maxDrivers;
        const driversInTier = currentDrivers - tierStart;
        const tierRange = tierEnd - tierStart + 1;
        const progress = Math.min((driversInTier / tierRange) * 100, 100);

        const driversNeeded = driversForNextLevel - currentDrivers;

        return {
            currentLevel: currentLevel.name,
            nextLevel: nextLevel.name,
            progress: Math.max(0, progress),
            driversNeeded: Math.max(0, driversNeeded),
            nextBonus: nextLevel.bonus,
            isMaxLevel: false,
        };
    };

    const levelProgress = getLevelProgress();

    // SVG circle calculations
    const size = responsiveFontSize(8);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (dynamicProfileCompletion / 100) * circumference;


    // Category data for Foreman
    const categories: CategoryData[] = [
        {
            id: 1,
            title: t('myPilots').replace(' ', '\n'), // Assuming My Pilots in en, mapped keys need flexibility
            subtitle: t('viewAllPilots'),
            icon: myPilotsIcon,
            iconType: 'localImage',
            iconColor: '#4A90D9',
        },
        {
            id: 2,
            title: t('verifiedDrivers').replace(' ', '\n'),
            subtitle: t('verifiedDrivers'),
            icon: verifiedDriverIcon,
            iconType: 'localImage',
            iconColor: '#22C55E',
        },
        {
            id: 3,
            title: t('trustedDrivers').replace(' ', '\n'),
            subtitle: t('trustedDrivers'),
            icon: trustedDriverIcon,
            iconType: 'localImage',
            iconColor: '#3B82F6',
        },
        {
            id: 4,
            title: t('jobs'),
            subtitle: t('availableJobs'),
            icon: jobsIcon,
            iconType: 'localImage',
            iconColor: '#27AE60',
        },
        {
            id: 5,
            title: t('applications'),
            subtitle: t('viewApplications'),
            icon: jobApplicationIcon,
            iconType: 'localImage',
            iconColor: '#9B59B6',
        },
        {
            id: 6,
            title: t('recruitments'),
            subtitle: t('hireNewPilots'),
            icon: 'https://cdn-icons-png.flaticon.com/512/3207/3207604.png',
            iconType: 'image',
            iconColor: '#9B59B6',
        },
    ];

    // Effect to refetch when user ID becomes available if fetch was missed
    React.useEffect(() => {
        if (user?.id) {
            console.log('User ID now available, triggering dashboard fetch');
            fetchDashboardData();
        }
    }, [user?.id]);

    // if (loading) {
    //     return (
    //         <View style={{ flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}>
    //             <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
    //             <ActivityIndicator size="large" color={colors.primary || '#6E7CF5'} />
    //             <Text style={{ marginTop: 10, color: '#666', fontSize: 14 }}>{t('loading')}</Text>
    //         </View>
    //     );
    // }

    const handleCopy = () => {
        if (user?.Referral_Code) {
            Clipboard.setString(user.Referral_Code);
            Toast.showWithGravity(t('referralCodeCopied') || 'Referral Code Copied', Toast.SHORT, Toast.BOTTOM);
        }
    };

    const handleShare = async () => {
        console.log('user clicked');

        if (user?.Referral_Code) {
            try {
                let imageUrl = 'https://truckmitr.com/public/front/assets/images/logotrick.png';
                let imagePath = null;
                try {
                    // Using PROFILE_PLACEHOLDER as a fallback if no specific banner URL is provided
                    const imageToShare = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
                    const res = await ReactNativeBlobUtil.config({
                        fileCache: true,
                    }).fetch('GET', imageToShare);
                    imagePath = res.path();
                    const base64Data = await res.readFile('base64');
                    imageUrl = `data:image/png;base64,${base64Data}`;
                } catch (err) {
                    console.log('Error preparing image for share:', err);
                }

                const options: { message: string; url?: string } = {
                    message: `${t('shareReferralMessage') || 'Use my referral code to join TruckMitr:'} ${user.Referral_Code}`,
                };

                if (imageUrl) {
                    options.url = imageUrl;
                }

                await Share.open(options);

                if (imagePath) {
                    ReactNativeBlobUtil.fs.unlink(imagePath).catch(() => { });
                }
            } catch (error) {
                console.log('Error sharing:', error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <PollSurveyModal />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6E7CF5']}
                        tintColor="#6E7CF5"
                    />
                }
            >
                <View style={{ height: responsiveHeight(42), width: responsiveWidth(100), borderBottomLeftRadius: 60, borderBottomRightRadius: 60, marginBottom: responsiveHeight(1.5) }}>
                    {/* Banner Background */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: 60, borderBottomRightRadius: 60, overflow: 'hidden' }}>
                        <Image
                            style={{ width: '100%', height: '100%' }}
                            source={require('../../../../assets/foreman_banner_1.jpeg')}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Header Content */}
                    <View style={{ paddingTop: safeAreaInsets.top, paddingHorizontal: responsiveWidth(3) }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.2), fontWeight: 'bold', lineHeight: responsiveFontSize(3) }}>{`${t('hello')}, ${foremanName} 👋`}</Text>
                                {user?.Referral_Code && (
                                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontWeight: 'bold', lineHeight: responsiveFontSize(2) }}>
                                        {`${t('referralCode')}: ${user.Referral_Code}`}
                                    </Text>
                                )}
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.6), fontWeight: 'bold', lineHeight: responsiveFontSize(2.2) }}>{dynamicTMID}</Text>

                                {/* <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), fontWeight: 'bold', lineHeight: responsiveFontSize(1.8) }}>{rank}</Text> */}
                                <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.2), fontStyle: 'italic', lineHeight: responsiveFontSize(1.6) }}>
                                    {isForemanPro ? 'Foreman Pro 👷' : 'foreman'}
                                </Text>
                            </View>

                            <TouchableOpacity style={{ alignItems: 'center' }}
                                onPress={() => navigation.navigate(STACKS.FOREMAN_PROFILE as any)}
                            >
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
                                            rotation="90"
                                            origin={`${size / 2}, ${size / 2}`}
                                        />
                                    </Svg>
                                    <Image
                                        style={{ height: size - strokeWidth, width: size - strokeWidth, borderRadius: 100, backgroundColor: colors.white }}
                                        source={{ uri: user?.images ? `${BASE_URL}/public/${user.images}` : (user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png') }}
                                    />
                                    <View style={{ backgroundColor: 'white', paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(0.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${dynamicProfileCompletion}%`}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: responsiveFontSize(1.5), gap: 2 }}>
                                    {/* {Array.from({ length: 5 }).map((_, i) => (
                                    <FontAwesome
                                        key={i}
                                        name={i < star_rating ? 'star' : 'star-o'}
                                        size={responsiveFontSize(1.6)}
                                        color={i < star_rating ? '#FFD700' : 'rgba(0,0,0,0.2)'}
                                    />
                                ))} */}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar */}
                    {/* Search Bar - Floating with cleaner UI */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate(STACKS.FOREMAN_SEARCH as any)}
                        style={{
                            position: 'absolute',
                            bottom: -28, // Adjusted to float nicely
                            left: responsiveWidth(4),
                            right: responsiveWidth(4),
                            flexDirection: 'row',
                            height: 56, // Standard touch height
                            backgroundColor: colors.white,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: 16, // Smoother corners
                            paddingHorizontal: 16,
                            // Soft shadow for elevation
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 5,
                            borderWidth: 1,
                            borderColor: '#F1F5F9', // Very subtle border
                            zIndex: 100,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="search" size={20} color="#64748B" style={{ marginRight: 12 }} />
                            <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '400' }}>
                                {t('searchProDrivers') || "Search drivers by name, ID..."}
                            </Text>
                        </View>
                        <View style={{ backgroundColor: '#F1F5F9', padding: 6, borderRadius: 8 }}>
                            <Ionicons name="options-outline" size={18} color={colors.royalBlue} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.referralBanner}>
                    <View style={styles.referralContent}>
                        <View style={styles.referralIconBox}>
                            <Ionicons name="ticket-outline" size={24} color="#EA580C" />
                        </View>
                        <View style={styles.referralInfo}>
                            <ShimmerText
                                text={t('yourReferralCode')}
                                textStyle={styles.referralLabel}
                                colors={['#EA580C', '#FFFFFF', '#EA580C']}
                            />
                            <ShimmerText
                                text={user?.Referral_Code || 'N/A'}
                                textStyle={styles.referralCode}
                                colors={['#EA580C', '#FFFFFF', '#EA580C']}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={handleCopy} style={{ padding: 8 }}>
                                <Ionicons name="copy-outline" size={20} color="#EA580C" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
                                <Ionicons name="share-social-outline" size={20} color="#EA580C" />
                            </TouchableOpacity>
                        </View>
                        {/* <TouchableOpacity style={styles.copyButton} onPress={() => { showToast('Code Copied'); }}>
                            <Ionicons name="copy-outline" size={20} color="#EA580C" />
                        </TouchableOpacity> */}
                    </View>
                </View>
                {/* Content Section */}
                <View style={styles.contentContainer}>
                    {/* Quick Action Section */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 0 }}>
                        <Ionicons name="flash-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{t('quickAction')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
                        {/* Dashboard Card */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_DASHBOARD as any))}
                            style={{
                                width: '48%',
                                backgroundColor: '#F5A623',
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                elevation: 4,
                                shadowColor: '#F5A623',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                    <Svg width={18} height={18} viewBox="0 0 24 24">
                                        <Path d="M3 13h8V3H3v10z" fill="#4285F4" />
                                        <Path d="M3 21h8v-6H3v6z" fill="#34A853" />
                                        <Path d="M13 21h8V11h-8v10z" fill="#EA4335" />
                                        <Path d="M13 9h8V3h-8v6z" fill="#FBBC05" />
                                    </Svg>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{t('dashboard')}</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color="#fff" />
                        </TouchableOpacity>

                        {/* Add Driver Card */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(STACKS.FOREMAN_ADD_DRIVER as any)}
                            style={{
                                width: '48%',
                                backgroundColor: '#6E7CF5',
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                elevation: 4,
                                shadowColor: '#6E7CF5',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                    <Svg width={18} height={18} viewBox="0 0 24 24">
                                        {/* Head */}
                                        <Path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#6E7CF5" />
                                        {/* Body */}
                                        <Path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#6E7CF5" />
                                        {/* Plus Sign */}
                                        <Path d="M6 10V7H4v3H1v2h3v3h2v-3h3v-2H6z" fill="#34A853" />
                                    </Svg>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{t('addDriver')}</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* My Earnings Section */}
                    <View style={{ marginBottom: 32 }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_MY_EARNINGS as any))}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="wallet-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{t('earning')}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#64748B" />
                        </TouchableOpacity>

                        {/* Earnings Cards Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                            {/* Today's Earning Card */}
                            <View style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={todaysEarningIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('todays')}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('earning')}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#22C55E' }}>{dashboardData.todayEarning || '₹ 0'}</Text>
                            </View>

                            {/* This Month Earning Card */}
                            <View style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={thisMonthEarningIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('thisMonth')}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('earning')}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#3B82F6' }}>{dashboardData.thisMonthEarning || '₹ 0'}</Text>
                            </View>
                        </View>

                        {/* Progress Bar Section */}
                        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12 }}>
                            {/* Level Labels */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 6 }} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>{levelProgress.currentLevel}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#B45309' }}>{levelProgress.nextLevel}</Text>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706', marginLeft: 6 }} />
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={{ height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                                <View style={{ width: `${levelProgress.progress}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: 5 }} />
                            </View>

                            {/* Driver Count & Status */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                <Text style={{ fontSize: 11, color: '#92400E' }}>
                                    {dashboardData.driverCount} {t('drivers')}
                                </Text>
                                {!levelProgress.isMaxLevel && (
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#92400E' }}>
                                        {levelProgress.driversNeeded} {t('moreFor')} {levelProgress.nextLevel}
                                    </Text>
                                )}
                            </View>

                            {/* Bonus Info */}
                            {!levelProgress.isMaxLevel ? (
                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#B45309', marginTop: 4 }}>
                                    🎁 {t('reachLevelBonus', { level: levelProgress.nextLevel, bonus: levelProgress.nextBonus })}
                                </Text>
                            ) : (
                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#16A34A', marginTop: 4 }}>
                                    🏆 {t('highestLevel')}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Action Required Section */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="warning-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{t('actionRequired')}</Text>
                        </View>

                        {/* Row 1 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            {/* Card 1: Pending Profile */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_PENDING_PROFILES as any))}
                                style={{ width: '48%', backgroundColor: '#FFF7ED', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={pendingProfileIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('pending')}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('profile')}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#F59E0B" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>{dashboardData.incompleteProfileCount ? `${dashboardData.incompleteProfileCount} ${t('profilesNeedReview')}` : t('loading')}</Text>
                            </TouchableOpacity>

                            {/* Card 2: Pending Subscription */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_PENDING_SUBSCRIPTION as any))}
                                style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={pendingSubscriptionIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('pending')}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('subscription')}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#6366F1" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>{t('renewalDueSoon')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 2 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {/* Card 3: Pending Training */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_PENDING_TRAINING as any))}
                                style={{ width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={pendingTrainingIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('pending')}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('training')}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#6366F1" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>{dashboardData.pendingTrainingCount ? `${dashboardData.pendingTrainingCount} ${t('trainingsPending')}` : t('loading')}</Text>
                            </TouchableOpacity>

                            {/* Card 4: Expiring Documents */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_EXPIRING_DOCUMENTS as any))}
                                style={{ width: '48%', backgroundColor: '#FEF2F2', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                        <Image source={expiringDocumentsIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('expiring')}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 16 }}>{t('documents')}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color="#EF4444" />
                                </View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>{dashboardData.licenseExpiringCount ? `${dashboardData.licenseExpiringCount} ${t('documentsExpiringSoon')}` : t('loading')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Category Grid */}
                    {/* Account Status Section */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={colors.royalBlue} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{t('myDrivers')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {categories.slice(0, 3).map((item) => (
                                <CategoryCard
                                    key={item.id}
                                    {...item}
                                    style={{ width: '30%', padding: 8, height: 120, justifyContent: 'flex-start', paddingTop: 16 }}
                                    iconSize={36}
                                    titleStyle={{ fontSize: 10, textAlign: 'center', marginTop: 0, lineHeight: 14 }}
                                    onPress={() => {
                                        if (item.id === 1) {
                                            handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_MY_PILOTS as any));
                                        } else if (item.id === 2) {
                                            handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_VERIFIED_DRIVERS as any));
                                        } else if (item.id === 3) {
                                            handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_TRUSTED_DRIVERS as any));
                                        } else {
                                            console.log(item.title);
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Jobs Section */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="briefcase-outline" size={18} color={colors.royalBlue} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{t('jobsAndRecruitments')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {categories.slice(3, 6).map((item) => (
                                <CategoryCard
                                    key={item.id}
                                    {...item}
                                    style={{ width: '30%', padding: 8, height: 120, justifyContent: 'flex-start', paddingTop: 16 }}
                                    iconSize={36}
                                    titleStyle={{ fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 }}
                                    onPress={() => {
                                        if (item.id === 4) {
                                            handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_JOBS_LIST as any));
                                        } else if (item.id === 5) {
                                            handleFeatureAccess(() => navigation.navigate(STACKS.FOREMAN_APPLICATIONS as any));
                                        } else if (item.id === 6) {
                                            showToast('Coming Soon');
                                        } else {
                                            console.log(item.title);
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    </View>


                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            {/* <View style={[styles.bottomNav, { paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 8 }]}>
                <BottomTabItem
                    icon="grid"
                    label="Categories"
                    isActive={activeTab === 'categories'}
                    onPress={() => setActiveTab('categories')}
                />
                <BottomTabItem
                    icon="person"
                    label="Profile"
                    isActive={activeTab === 'profile'}
                    onPress={() => setActiveTab('profile')}
                />
                <BottomTabItem
                    icon="person-add"
                    label="Add Driver"
                    isActive={activeTab === 'addDriver'}
                    onPress={() => {
                        setActiveTab('addDriver');
                        navigation.navigate(STACKS.FOREMAN_ADD_DRIVER as any);
                    }}
                />
                <BottomTabItem
                    icon="wallet"
                    label="My Earning"
                    isActive={activeTab === 'earning'}
                    onPress={() => {
                        // setActiveTab('earning');
                        // navigation.navigate(STACKS.FOREMAN_EARNINGS as any);
                    }}
                />
                <BottomTabItem
                    icon="bookmark"
                    label="Saved"
                    isActive={activeTab === 'saved'}
                    onPress={() => setActiveTab('saved')}
                />
            </View> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Header Styles
    headerWrapper: {
        position: 'relative',
    },
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    archContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        transform: [{ translateY: 39 }],
    },
    profileDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    referralBanner: {
        marginTop: 25,
        // marginHorizontal: 4,
        backgroundColor: '#FFF7ED', // Orange 50
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FDBA74', // Orange 300
        borderStyle: 'dashed',
    },
    referralContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    referralIconBox: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFEDD5', // Orange 100
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    referralInfo: {
        flex: 1,
    },
    referralLabel: {
        fontSize: 12,
        color: '#9A3412', // Orange 800
        fontWeight: '600',
        marginBottom: 2,
    },
    referralCode: {
        fontSize: 16,
        color: '#EA580C', // Orange 600
        fontWeight: '800',
        letterSpacing: 1,
    },
    copyButton: {
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // referralText: { fontSize: 13, color: '#EA580C', flex: 1, },
    // Profile Section with Status
    profileSection: {
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    statusText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#fff',
    },

    // Profile with Progress Ring
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

    // Greeting Styles
    greetingContainer: {
        flex: 1,
    },
    greetingLine1: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '400',
    },
    greetingName: {
        fontWeight: '700',
    },
    greetingLine2: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },

    // Search Bar Styles
    searchWrapper: {
        paddingHorizontal: 20,
        marginTop: 20,
        zIndex: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        paddingVertical: 0,
    },

    // Curve Styles
    curveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        transform: [{ translateY: 29 }],
    },

    // Content Styles
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },

    // Category Grid Styles
    addDriverCard: {
        backgroundColor: '#6E7CF5',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#6E7CF5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    addDriverIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    addDriverTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    addDriverSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    categoryCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F8FAFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
    },

    // Bottom Navigation Styles
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    tabIconContainerActive: {
        backgroundColor: 'rgba(110, 124, 245, 0.1)',
        paddingHorizontal: 16,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6E7CF5',
    },
});
