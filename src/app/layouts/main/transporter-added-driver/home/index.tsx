import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    Platform,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { userAction } from '@truckmitr/src/redux/actions/user.action';
import { isIOS } from '@truckmitr/src/app/functions';
import { getUserBadgeText } from '@truckmitr/src/utils/global';
import WelcomeModal from '@truckmitr/src/app/components/welcome-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const TransporterAddedDriverHome = React.forwardRef((props, ref) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useStatusBarStyle('dark-content');

    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const { user, profileCompletion, subscriptionDetails } = useSelector((state: any) => state?.user) || {};

    const [refreshing, setRefreshing] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [recentTracking, setRecentTracking] = useState<any>(null);
    const [loadingTracking, setLoadingTracking] = useState(true);
    const scrollViewRef = useRef<any>(null);

    // TODO: Set to false to test empty state, true to test with dummy data
    const USE_DUMMY_DATA = true;

    const [popupData, setPopupData] = useState<{
        id: any;
        title: string;
        message: string;
        user_type: string;
        start_date: string;
        end_date: string;
        status: boolean;
        image: null | string;
    }>({
        id: '',
        title: '',
        message: '',
        user_type: '',
        start_date: '',
        end_date: '',
        status: false,
        image: '',
    });

    // Profile completion circle
    const progress = profileCompletion || 0;
    const size = responsiveFontSize(8);
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

    // Fetch recent tracking data
    const fetchRecentTracking = async () => {
        try {
            setLoadingTracking(true);
            
            // TODO: Remove dummy data and uncomment API call when backend is ready
            if (USE_DUMMY_DATA) {
                // Dummy data for testing
                const dummyTracking = {
                    id: 12345,
                    load_id: 'LD2024001',
                    origin_location: 'Delhi, Delhi',
                    destination_location: 'Mumbai, Maharashtra',
                    current_status_label: 'In Transit',
                    vehicle_body: 'Open Body',
                    vechicle_body: 'Open Body',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));
                setRecentTracking(dummyTracking);
            } else {
                // Empty state for testing
                await new Promise(resolve => setTimeout(resolve, 800));
                setRecentTracking(null);
            }
            
            /* UNCOMMENT THIS WHEN API IS READY:
            const response: any = await axiosInstance.get(END_POINTS.ACCEPTED_JOBS_DRIVERS);
            if (response?.data?.status) {
                const jobs = response?.data?.data || [];
                // Get the most recent active job
                if (jobs.length > 0) {
                    // Sort by created_at or updated_at to get most recent
                    const sortedJobs = jobs.sort((a: any, b: any) => {
                        const dateA = new Date(a.updated_at || a.created_at).getTime();
                        const dateB = new Date(b.updated_at || b.created_at).getTime();
                        return dateB - dateA;
                    });
                    setRecentTracking(sortedJobs[0]);
                }
            }
            */
        } catch (error) {
            console.log('Error fetching recent tracking:', error);
        } finally {
            setLoadingTracking(false);
        }
    };

    // Fetch popup message
    const fetchPopupMessage = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS.POPUP_MESSAGE);
            if (response?.data?.data) {
                const popup = response.data.data;
                let closedCount = await AsyncStorage.getItem(`welcome_popup_closed_count_${popup.id}`);
                const closedCountNum = closedCount ? parseInt(closedCount) : 0;
                if (closedCountNum >= 3) return;

                const now = new Date();
                let isWithinRange = true;
                if (popup.start_date && popup.end_date) {
                    const startDate = new Date(popup.start_date);
                    const endDate = new Date(popup.end_date);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                    isWithinRange = today >= start && today <= end;
                }

                let shouldShowPopup = false;
                if (popup.user_type === 'both' || popup.user_type === 'driver') {
                    shouldShowPopup = true;
                }

                setShowWelcome(popup.status && isWithinRange && shouldShowPopup);
                setPopupData({
                    id: popup.id,
                    title: popup.title,
                    message: popup.message,
                    user_type: popup.user_type,
                    start_date: popup.start_date,
                    end_date: popup.end_date,
                    status: popup.status,
                    image: popup.image,
                });
            }
        } catch (error: any) {
            console.log('Error fetching popup message:', error);
        }
    };

    // Auto-scroll banners - REMOVED

    // Fetch data on mount
    useFocusEffect(
        useCallback(() => {
            const _fetchUser = async () => {
                const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
                if (profile?.data?.status) {
                    dispatch(userAction(profile?.data));
                }
            };
            _fetchUser();
            fetchPopupMessage();
            fetchRecentTracking();
        }, [])
    );

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
            if (profile?.data?.status) {
                dispatch(userAction(profile?.data));
            }
            await Promise.all([fetchRecentTracking()]);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Navigation handlers
    const _navigateProfile = () => {
        navigation.navigate(STACKS.BOTTOM_TAB, { screen: STACKS.PROFILE });
    };

    const _navigateTraining = () => {
        navigation.navigate(STACKS.TRAINING);
    };

    const _navigateHealthHygiene = () => {
        navigation.navigate(STACKS.HEALTH_HYGIENE);
    };

    const _navigateQuizResult = () => {
        navigation.navigate(STACKS.QUIZ_RESULT);
    };

    const _navigateIdCheck = () => {
        navigation.navigate(STACKS.ID_CHECK_INFO);
    };

    const _navigateCourtCheck = () => {
        navigation.navigate(STACKS.COURT_CHECK_INFO);
    };

    const _navigateDigitalAddressCheck = () => {
        navigation.navigate(STACKS.DIGITAL_ADDRESS_CHECK_INFO);
    };

    const _navigateRcCheck = () => {
        navigation.navigate(STACKS.RC_CHECK_INFO);
    };

    const _navigateChallanCheck = () => {
        navigation.navigate(STACKS.CHALLAN_CHECK_INFO);
    };

    const _navigateDriverWelfare = () => {
        navigation.navigate(STACKS.DRIVER_WELFARE);
    };

    const _navigateDriverTripWallet = () => {
        navigation.navigate(STACKS.DRIVER_TRIP_WALLET);
    };

    const _navigateTruckMitrDhaba = () => {
        navigation.navigate(STACKS.TRUCKMITR_DHABA);
    };

    const _navigateTruckMitrSuvidhaKendra = () => {
        navigation.navigate(STACKS.TRUCKMITR_SUVIDHA_KENDRA);
    };

    const _navigateDriverLoan = () => {
        navigation.navigate(STACKS.DRIVER_LOAN);
    };

    const _navigateConvoy = () => {
        navigation.navigate(STACKS.CONVOY);
    };

    const closeWelcomePopup = async (Id: any) => {
        let closedCount = await AsyncStorage.getItem(`welcome_popup_closed_count_${Id}`);
        const closedCountNum = closedCount ? parseInt(closedCount) : 0;
        await AsyncStorage.setItem(`welcome_popup_closed_count_${Id}`, String(closedCountNum + 1));
        setShowWelcome(false);
    };

    React.useImperativeHandle(ref, () => ({
        scrollToTop: (): Promise<void> => {
            return new Promise(async (resolve) => {
                scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                setTimeout(() => resolve(), 200);
            });
        },
    }));

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.royalBlue}
                        colors={[colors.royalBlue]}
                        progressBackgroundColor={colors.white}
                        progressViewOffset={120}
                    />
                }
            >
                {/* Header Section */}
                <View
                    style={{
                        paddingHorizontal: responsiveWidth(4),
                        paddingTop: responsiveFontSize(2),
                        paddingBottom: responsiveFontSize(2),
                        backgroundColor: colors.royalBlue,
                        borderBottomLeftRadius: 30,
                        borderBottomRightRadius: 30,
                    }}
                >
                    <Space height={safeAreaInsets.top} />
                    <WelcomeModal
                        title={popupData.title}
                        visible={showWelcome}
                        onClose={() => closeWelcomePopup(popupData.id)}
                        welcomeMessage={popupData.message}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 0,
                        }}
                    >
                        <View>
                            <Text
                                style={{
                                    color: colors.white,
                                    fontSize: responsiveFontSize(2.2),
                                    fontFamily: 'Inter-Bold',
                                    fontWeight: 'bold',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {`${t('hi')}, ${user?.name || ''} 👋`}
                            </Text>
                            <Text
                                style={{
                                    color: colors.white,
                                    fontSize: responsiveFontSize(1.6),
                                    fontFamily: 'Inter-Bold',
                                    fontWeight: 'bold',
                                    marginTop: 0,
                                }}
                            >
                                {`${user?.unique_id || ''}`}
                            </Text>
                            <Text
                                style={{
                                    color: colors.white,
                                    fontSize: responsiveFontSize(1.4),
                                    fontFamily: 'Inter-Bold',
                                    fontWeight: 'bold',
                                    marginTop: 0,
                                }}
                            >
                                {getUserBadgeText({ user, subscriptionDetails, isDriver: true })}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={_navigateProfile}
                            activeOpacity={0.7}
                            style={{ alignItems: 'center' }}
                        >
                            <View
                                style={{
                                    width: size,
                                    height: size,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Svg
                                    width={size}
                                    height={size}
                                    style={{ position: 'absolute', top: 0, left: 0 }}
                                >
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
                                    style={{
                                        height: size - strokeWidth,
                                        width: size - strokeWidth,
                                        borderRadius: 100,
                                        backgroundColor: colors.white,
                                    }}
                                    source={{
                                        uri: user?.images
                                            ? `${BASE_URL}public/${user?.images}`
                                            : `https://cdn-icons-png.flaticon.com/512/3177/3177440.png`,
                                    }}
                                />
                                <View
                                    style={{
                                        backgroundColor: colors.whiteOpacity(1),
                                        paddingHorizontal: responsiveFontSize(1.8),
                                        paddingVertical: responsiveFontSize(0.24),
                                        borderRadius: 100,
                                        position: 'absolute',
                                        bottom: -10,
                                        ...shadow,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: responsiveFontSize(1.0),
                                            color: 'green',
                                            fontWeight: '700',
                                        }}
                                    >
                                        {`${profileCompletion}%`}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Tracking Box */}
                {loadingTracking ? (
                    <View
                        style={{
                            marginHorizontal: responsiveWidth(4),
                            marginTop: 15,
                            backgroundColor: colors.white,
                            borderRadius: 12,
                            padding: 16,
                            ...shadow,
                            shadowColor: colors.blackOpacity(0.1),
                        }}
                    >
                        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.4) }}>
                                {t('loadingTracking', 'Loading tracking...')}
                            </Text>
                        </View>
                    </View>
                ) : recentTracking ? (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate(STACKS.TRANSPORTER_DRIVER_TRACKING, { jobId: recentTracking.id })}
                        style={{
                            marginHorizontal: responsiveWidth(4),
                            marginTop: 15,
                            backgroundColor: colors.white,
                            borderRadius: 14,
                            padding: 18,
                            borderWidth: 1,
                            borderColor: colors.blackOpacity(0.08),
                            ...shadow,
                            shadowColor: colors.blackOpacity(0.12),
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '700', color: colors.text }}>
                                    {recentTracking.load_id || 'N/A'}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: colors.royalBlueOpacity(0.12),
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                    }}
                                >
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.royalBlue }} />
                                    <Text style={{ fontSize: responsiveFontSize(1.2), fontWeight: '600', color: colors.royalBlue }}>
                                        {recentTracking.current_status_label || 'Active'}
                                    </Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={22} color={colors.blackOpacity(0.3)} />
                        </View>

                        {/* Route Section */}
                        <View style={{ 
                            paddingBottom: 16, 
                            marginBottom: 16, 
                            borderBottomWidth: 1, 
                            borderBottomColor: colors.blackOpacity(0.06) 
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#059669', marginTop: 4 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 2 }}>
                                            {t('pickup', 'Pickup')}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: responsiveFontSize(1.5),
                                                fontWeight: '600',
                                                color: colors.text,
                                                lineHeight: 20,
                                            }}
                                            numberOfLines={2}
                                        >
                                            {recentTracking.origin_location || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Connecting Line */}
                            <View style={{ 
                                marginLeft: 4, 
                                width: 2, 
                                height: 16, 
                                backgroundColor: colors.blackOpacity(0.1),
                                marginVertical: 4 
                            }} />
                            
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626', marginTop: 4 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 2 }}>
                                            {t('drop', 'Drop')}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: responsiveFontSize(1.5),
                                                fontWeight: '600',
                                                color: colors.text,
                                                lineHeight: 20,
                                            }}
                                            numberOfLines={2}
                                        >
                                            {recentTracking.destination_location || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Cargo & Vehicle Info */}
                        <View style={{ 
                            paddingBottom: 16, 
                            marginBottom: 16, 
                            borderBottomWidth: 1, 
                            borderBottomColor: colors.blackOpacity(0.06) 
                        }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                {/* Material */}
                                {recentTracking.meterial && (
                                    <View style={{ width: '47%' }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 3 }}>
                                            {t('material', 'Material')}
                                        </Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.text }} numberOfLines={1}>
                                            {recentTracking.meterial}
                                        </Text>
                                    </View>
                                )}
                                
                                {/* Quantity */}
                                {recentTracking.meterial_quantity && (
                                    <View style={{ width: '47%' }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 3 }}>
                                            {t('quantity', 'Quantity')}
                                        </Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.text }}>
                                            {recentTracking.meterial_quantity} {t('ton', 'Ton')}
                                        </Text>
                                    </View>
                                )}
                                
                                {/* Vehicle Body */}
                                <View style={{ width: '47%' }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 3 }}>
                                        {t('vehicleType', 'Vehicle Type')}
                                    </Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.text }} numberOfLines={1}>
                                        {recentTracking.vehicle_body || recentTracking.vechicle_body || 'N/A'}
                                    </Text>
                                </View>
                                
                                {/* Vehicle Length */}
                                {(recentTracking.vehicle_length || recentTracking.vechicle_type || recentTracking.vehicle_type) && (
                                    <View style={{ width: '47%' }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 3 }}>
                                            {t('length', 'Length')}
                                        </Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.text }} numberOfLines={1}>
                                            {recentTracking.vehicle_length || recentTracking.vechicle_type || recentTracking.vehicle_type}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Shipper Info */}
                        {recentTracking.user?.name && (
                            <View style={{ 
                                paddingBottom: 16, 
                                marginBottom: 16, 
                                borderBottomWidth: 1, 
                                borderBottomColor: colors.blackOpacity(0.06) 
                            }}>
                                <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5), marginBottom: 4 }}>
                                    {t('shipper', 'Shipper')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.5), fontWeight: '700', color: colors.text }}>
                                    {recentTracking.user.name}
                                </Text>
                                {recentTracking.user.unique_id && (
                                    <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.5), marginTop: 2 }}>
                                        ID: {recentTracking.user.unique_id}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Schedule Info */}
                        {recentTracking.picup_date && (
                            <View style={{ 
                                paddingBottom: 16, 
                                marginBottom: 16, 
                                borderBottomWidth: 1, 
                                borderBottomColor: colors.blackOpacity(0.06) 
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="calendar-outline" size={16} color={colors.blackOpacity(0.5)} />
                                    <Text style={{ fontSize: responsiveFontSize(1.1), color: colors.blackOpacity(0.5) }}>
                                        {t('pickupDate', 'Pickup Date')}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: colors.text, marginTop: 4 }}>
                                    {new Date(recentTracking.picup_date).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>
                        )}

                        {/* Action Button */}
                        <View style={{
                            backgroundColor: colors.royalBlue,
                            paddingVertical: 12,
                            borderRadius: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}>
                            <Ionicons name="location" size={18} color={colors.white} />
                            <Text style={{ 
                                fontSize: responsiveFontSize(1.5), 
                                color: colors.white, 
                                fontWeight: '700' 
                            }}>
                                {t('viewTracking', 'View Live Tracking')}
                            </Text>
                            <Feather name="arrow-right" size={18} color={colors.white} />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View
                        style={{
                            marginHorizontal: responsiveWidth(4),
                            marginTop: 15,
                            backgroundColor: colors.white,
                            borderRadius: 12,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: colors.blackOpacity(0.08),
                            ...shadow,
                            shadowColor: colors.blackOpacity(0.05),
                        }}
                    >
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: responsiveFontSize(3), marginBottom: 8 }}>🚛</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.5), fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                                {t('noActiveJobs', 'No Active Jobs')}
                            </Text>
                            <Text style={{ fontSize: responsiveFontSize(1.3), color: colors.blackOpacity(0.5), textAlign: 'center' }}>
                                {t('noActiveJobsMessage', 'Your recent tracking will appear here')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Info Banner - Restricted Driver Notice */}
                {/* <View
                    style={{
                        marginHorizontal: responsiveWidth(4),
                        marginTop: 15,
                        marginBottom: 10,
                        backgroundColor: '#EFF6FF',
                        borderRadius: 12,
                        padding: 16,
                        borderLeftWidth: 4,
                        borderLeftColor: '#3B82F6',
                    }}
                > */}
                    {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <Text
                            style={{
                                marginLeft: 8,
                                fontSize: responsiveFontSize(1.8),
                                fontWeight: '700',
                                color: '#1E40AF',
                            }}
                        >
                            {t('restrictedDriverAccount', 'Restricted Driver Account')}
                        </Text>
                    </View>
                    <Text
                        style={{
                            fontSize: responsiveFontSize(1.4),
                            color: '#1E40AF',
                            lineHeight: 20,
                        }}
                    >
                        {t(
                            'restrictedDriverMessage',
                            'You are registered as a driver under a transporter. Job search and application features are not available for your account type.'
                        )}
                    </Text>
                </View> */}

                {/* Training & Certificate Section */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: responsiveWidth(4),
                        marginBottom: 5,
                        marginTop: 15,
                    }}
                >
                    <Ionicons name="school-outline" size={20} color={colors.royalBlue} />
                    <Text
                        style={{
                            marginLeft: 8,
                            fontSize: responsiveFontSize(2),
                            fontWeight: '700',
                            color: colors.royalBlue,
                        }}
                    >
                        {t('Training&Certificate') || 'Training & Certificate'}
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: responsiveWidth(4),
                        paddingVertical: responsiveWidth(3),
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            onPress={_navigateTraining}
                            activeOpacity={0.7}
                            style={{
                                flex: 1,
                                backgroundColor: colors.white,
                                ...shadow,
                                shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                                borderRadius: 10,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    backgroundColor: colors.white,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: responsiveFontSize(0.5),
                                    borderRadius: 10,
                                    borderColor: colors.blackOpacity(0.1),
                                    borderWidth: 1,
                                    minHeight: responsiveWidth(28),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                        marginBottom: 5,
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/11825/11825158.png',
                                    }}
                                />
                                <Text
                                    style={{
                                        color: colors.black,
                                        fontSize: responsiveFontSize(1.4),
                                        fontWeight: '600',
                                        textAlign: 'center',
                                    }}
                                >
                                    {t('trainingVideo', 'Training Video')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Space width={responsiveFontSize(1.5)} />
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            onPress={_navigateHealthHygiene}
                            activeOpacity={0.7}
                            style={{
                                flex: 1,
                                backgroundColor: colors.white,
                                ...shadow,
                                shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                                borderRadius: 10,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    backgroundColor: colors.white,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: responsiveFontSize(0.5),
                                    borderRadius: 10,
                                    borderColor: colors.blackOpacity(0.1),
                                    borderWidth: 1,
                                    minHeight: responsiveWidth(28),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                        marginBottom: 5,
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/2382/2382461.png',
                                    }}
                                />
                                <Text
                                    style={{
                                        color: colors.black,
                                        fontSize: responsiveFontSize(1.4),
                                        fontWeight: '600',
                                        textAlign: 'center',
                                    }}
                                >
                                    {t('healthHygieneVideo', 'Health & Hygiene Video')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Space width={responsiveFontSize(1.5)} />
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            onPress={_navigateQuizResult}
                            activeOpacity={0.7}
                            style={{
                                flex: 1,
                                backgroundColor: colors.white,
                                ...shadow,
                                shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                                borderRadius: 10,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    backgroundColor: colors.white,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: responsiveFontSize(0.5),
                                    borderRadius: 10,
                                    borderColor: colors.blackOpacity(0.1),
                                    borderWidth: 1,
                                    minHeight: responsiveWidth(28),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                        marginBottom: 5,
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/9913/9913576.png',
                                    }}
                                />
                                <Text
                                    style={{
                                        color: colors.black,
                                        fontSize: responsiveFontSize(1.4),
                                        fontWeight: '600',
                                        textAlign: 'center',
                                    }}
                                >
                                    {t('quizResultCertificate', 'Quiz Result & Certificate')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Driver Services Section */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: responsiveWidth(4),
                        marginBottom: 5,
                        marginTop: 15,
                    }}
                >
                    <Ionicons name="briefcase-outline" size={20} color={colors.royalBlue} />
                    <Text
                        style={{
                            marginLeft: 8,
                            fontSize: responsiveFontSize(2),
                            fontWeight: '700',
                            color: colors.royalBlue,
                        }}
                    >
                        {t('driverServices', 'Driver Services')}
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: responsiveWidth(4),
                        paddingVertical: responsiveWidth(3),
                    }}
                >
                    <TouchableOpacity
                        onPress={_navigateDriverWelfare}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            ...shadow,
                            shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                            borderRadius: 10,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: colors.white,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: responsiveFontSize(2),
                                paddingHorizontal: responsiveFontSize(0.5),
                                borderRadius: 10,
                                borderColor: colors.blackOpacity(0.1),
                                borderWidth: 1,
                                minHeight: responsiveWidth(28),
                            }}
                        >
                            <View
                                style={{
                                    height: responsiveFontSize(6),
                                    width: responsiveFontSize(6),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: responsiveFontSize(0.5),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
                                    }}
                                />
                            </View>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                {t('truckMitrDriverWelfare', 'TruckMitr Driver Welfare')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <Space width={responsiveFontSize(1.5)} />
                    <TouchableOpacity
                        onPress={_navigateDriverTripWallet}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            backgroundColor: colors.white,
                            ...shadow,
                            shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                            borderRadius: 10,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: colors.white,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: responsiveFontSize(2),
                                paddingHorizontal: responsiveFontSize(0.5),
                                borderRadius: 10,
                                borderColor: colors.blackOpacity(0.1),
                                borderWidth: 1,
                                minHeight: responsiveWidth(28),
                            }}
                        >
                            <View
                                style={{
                                    height: responsiveFontSize(6),
                                    width: responsiveFontSize(6),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: responsiveFontSize(0.5),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/855/855279.png',
                                    }}
                                />
                            </View>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                {t('driverTripWallet', 'Driver Trip Wallet')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <Space width={responsiveFontSize(1.5)} />
                    <TouchableOpacity
                        onPress={_navigateTruckMitrDhaba}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            backgroundColor: colors.white,
                            ...shadow,
                            shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                            borderRadius: 10,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: colors.white,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: responsiveFontSize(2),
                                paddingHorizontal: responsiveFontSize(0.5),
                                borderRadius: 10,
                                borderColor: colors.blackOpacity(0.1),
                                borderWidth: 1,
                                minHeight: responsiveWidth(28),
                            }}
                        >
                            <View
                                style={{
                                    height: responsiveFontSize(6),
                                    width: responsiveFontSize(6),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: responsiveFontSize(0.5),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
                                    }}
                                />
                            </View>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                {t('truckMitrDhaba', 'TruckMitr Dhaba')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Additional Services Row */}
                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: responsiveWidth(4),
                        paddingBottom: responsiveWidth(3),
                    }}
                >
                    <TouchableOpacity
                        onPress={_navigateTruckMitrSuvidhaKendra}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            backgroundColor: colors.white,
                            ...shadow,
                            shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                            borderRadius: 10,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: colors.white,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: responsiveFontSize(2),
                                paddingHorizontal: responsiveFontSize(0.5),
                                borderRadius: 10,
                                borderColor: colors.blackOpacity(0.1),
                                borderWidth: 1,
                                minHeight: responsiveWidth(28),
                            }}
                        >
                            <View
                                style={{
                                    height: responsiveFontSize(6),
                                    width: responsiveFontSize(6),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: responsiveFontSize(0.5),
                                }}
                            >
                                <Text style={{ fontSize: responsiveFontSize(4) }}>🏢</Text>
                            </View>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                {t('truckMitrSuvidhaKendra', 'TruckMitr Suvidha Kendra')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <Space width={responsiveFontSize(1.5)} />
                    <TouchableOpacity
                        onPress={_navigateConvoy}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            backgroundColor: colors.white,
                            ...shadow,
                            shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                            borderRadius: 10,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: colors.white,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: responsiveFontSize(2),
                                paddingHorizontal: responsiveFontSize(0.5),
                                borderRadius: 10,
                                borderColor: colors.blackOpacity(0.1),
                                borderWidth: 1,
                                minHeight: responsiveWidth(28),
                            }}
                        >
                            <View
                                style={{
                                    height: responsiveFontSize(6),
                                    width: responsiveFontSize(6),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: responsiveFontSize(0.5),
                                }}
                            >
                                <Text style={{ fontSize: responsiveFontSize(4) }}>🚛</Text>
                            </View>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                {t('convoyTitle', 'Convoy')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <Space width={responsiveFontSize(1.5)} />
                    <TouchableOpacity
                        onPress={_navigateDriverLoan}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            backgroundColor: colors.white,
                            ...shadow,
                            shadowColor: isIOS() ? colors.blackOpacity(0.16) : colors.blackOpacity(0.3),
                            borderRadius: 10,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: colors.white,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: responsiveFontSize(2),
                                paddingHorizontal: responsiveFontSize(0.5),
                                borderRadius: 10,
                                borderColor: colors.blackOpacity(0.1),
                                borderWidth: 1,
                                minHeight: responsiveWidth(28),
                            }}
                        >
                            <View
                                style={{
                                    height: responsiveFontSize(6),
                                    width: responsiveFontSize(6),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: responsiveFontSize(0.5),
                                }}
                            >
                                <Image
                                    style={{
                                        height: responsiveFontSize(5),
                                        width: responsiveFontSize(5),
                                    }}
                                    source={{
                                        uri: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
                                    }}
                                />
                            </View>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                {t('truckMitrDriverLoan', 'TruckMitr Driver Loan')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Space height={responsiveFontSize(4)} />
            </ScrollView>
        </View>
    );
});

export default TransporterAddedDriverHome;
