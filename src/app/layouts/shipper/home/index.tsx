import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/utils/config';
import { setMaterials } from '@truckmitr/redux/slices/shipperSlice';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    TextInput,
    Image,
    Animated,
    Alert,
    ActivityIndicator,
    RefreshControl,
    DeviceEventEmitter,
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import moment from 'moment';
import { connectPusher, addPusherStateListener } from '@truckmitr/src/services/pusher';
import { useTruckLocation } from '@truckmitr/src/app/hooks/useTruckLocation';
import LottieView from 'lottie-react-native';

const BlueTruckLottie = require('../../../../res/lotties/BlueTruck.json');
// import BottomBarComponent from '../../../../../stacks/tabs/shipper-bottom-bar';

// --- Icons ---
const SearchIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="11" cy="11" r="8" />
        <Path d="M21 21L16.65 16.65" />
    </Svg>
);

const BoxIcon = ({ color = "#ffffff", size = 20 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
        <Path d="M12 22.08V12" />
    </Svg>
);

const NotificationIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
);

const TruckIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 3h15v13H1z" />
        <Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

const ArrowIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
);

const STATIC_TRACKING_TRUCKS = [
    {
        id: '1',
        load_id: 'LID-7729',
        status: 'En route to Pickup',
        truck_number: 'RJ 14 GB 1234',
        driver_name: 'Suresh Kumar',
        eta: '12 mins',
        origin: 'Noida, UP',
        destination: 'Jaipur, Rajasthan',
        trip_id: '13',
    },
    {
        id: '2',
        load_id: 'LID-8830',
        status: 'En route to Pickup',
        truck_number: 'MH 01 AB 5678',
        driver_name: 'Anil Singh',
        eta: '24 mins',
        origin: 'Pune, Maharashtra',
        destination: 'Bangalore, Karnataka',
        trip_id: '14',
    },
    {
        id: '3',
        load_id: 'LID-9941',
        status: 'En route to Pickup',
        truck_number: 'DL 1C EF 9012',
        driver_name: 'Vikram Das',
        eta: '35 mins',
        origin: 'Delhi, NCR',
        destination: 'Kolkata, WB',
        trip_id: '15',
    }
];
const MOCK_RECENT_LOADS = [
    {
        id: 'rec_1',
        origin: {
            address: 'Sector 62, Noida, Uttar Pradesh, India',
            lat: '28.6219',
            lon: '77.3639',
            cityState: 'Noida, UP'
        },
        destination: {
            address: 'Malviya Nagar, Jaipur, Rajasthan, India',
            lat: '26.8530',
            lon: '75.8047',
            cityState: 'Jaipur, RJ'
        }
    },
    {
        id: 'rec_2',
        origin: {
            address: 'Bandra West, Mumbai, Maharashtra, India',
            lat: '19.0607',
            lon: '72.8362',
            cityState: 'Mumbai, MH'
        },
        destination: {
            address: 'Hitech City, Hyderabad, Telangana, India',
            lat: '17.4483',
            lon: '78.3915',
            cityState: 'Hyderabad, TS'
        }
    }
];
interface ShipperDashboardProps {
    navigation?: any;
    onNavigateToPostLoad?: () => void;
    onNavigateToLoadDetails?: () => void;
    onNavigateToMyLoads?: () => void;
    onNavigateToConfirmedLoad?: () => void;
    onNavigateToInTransit?: () => void;
    onNavigateToPODPending?: () => void;
    onNavigateToCompletedLoads?: () => void;
    onNavigateToPaymentPending?: () => void;
    onNavigateToAcceptedLoads?: () => void;
    onNavigateToNotifications?: () => void;
}

const ShipperHome: React.FC<ShipperDashboardProps> = ({
    navigation: navProp,
    onNavigateToPostLoad,
    onNavigateToLoadDetails,
    onNavigateToMyLoads,
    onNavigateToConfirmedLoad,
    onNavigateToInTransit,
    onNavigateToPODPending,
    onNavigateToCompletedLoads,
    onNavigateToPaymentPending,
    onNavigateToAcceptedLoads,
    onNavigateToNotifications
}) => {
    const dispatch = useDispatch();
    const { user, profileCompletion, shipperKycStatus } = useSelector((state: any) => state?.user);
    const hookNav = useNavigation<any>();
    const navigation = navProp || hookNav;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const trackingPulseAnim = useRef(new Animated.Value(1)).current;
    const trackingHeightAnim = useRef(new Animated.Value(60)).current;

    const [isLoading, setIsLoading] = useState(true);
    const [isTrackingExpanded, setIsTrackingExpanded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [glanceData, setGlanceData] = useState<any>(null);
    const [latestLoad, setLatestLoad] = useState<any>(null);

    // --- Post Load Quick Form State ---
    const [originLocation, setOriginLocation] = useState('');
    const [destinationLocation, setDestinationLocation] = useState('');
    const [originLat, setOriginLat] = useState('');
    const [originLon, setOriginLon] = useState('');
    const [destinationLat, setDestinationLat] = useState('');
    const [destinationLon, setDestinationLon] = useState('');
    const [exactOriginLocation, setExactOriginLocation] = useState('');
    const [exactDestinationLocation, setExactDestinationLocation] = useState('');
    const [loadingCityState, setLoadingCityState] = useState('');
    const [unloadingCityState, setUnloadingCityState] = useState('');
    const [showRecentModal, setShowRecentModal] = useState(false);
    const [pendingPointType, setPendingPointType] = useState<'origin' | 'destination' | null>(null);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('LOCATION_SELECTED', (loc: any) => {
            if (loc.pointType === 'destination') {
                setDestinationLocation(loc.description);
                setDestinationLat(loc.lat);
                setDestinationLon(loc.lon);
                setUnloadingCityState(loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.city || loc.state || '');
            } else {
                setOriginLocation(loc.description);
                setOriginLat(loc.lat);
                setOriginLon(loc.lon);
                setLoadingCityState(loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.city || loc.state || '');
            }
        });

        return () => subscription.remove();
    }, []);

    // 🔍 DEBUG: Listen to driver-location.1 channel
    const { location: driverLocation, connectionStatus, error: pusherError, isTracking } = useTruckLocation('driver-location.13');

    useEffect(() => {
        console.log('🔌 [Pusher Debug] Connection Status:', connectionStatus);
        if (pusherError) console.log('❌ [Pusher Debug] Error:', pusherError);
    }, [connectionStatus, pusherError]);

    useEffect(() => {
        if (driverLocation) {
            console.log('📍 [Pusher Debug] Location Event Received!', JSON.stringify(driverLocation));
        }
        console.log('🛰️ [Pusher Debug] isTracking:', isTracking);
    }, [driverLocation, isTracking]);

    // Calculate progress for ring
    const progress = parseInt(profileCompletion || '0', 10);
    const radius = 33;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const fetchHomeData = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await axiosInstance.get(END_POINTS.SHIPPER_HOME);
            console.log("response", response);

            if (response?.data?.success) {
                setDashboardData(response.data.data.your_dashboard);
                setGlanceData(response.data.data.today_at_glance);
                setLatestLoad(response.data.data.latest_load);
            }
        } catch (error) {
            console.error('Error fetching shipper home data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // Fetch Material Data
        const getPostLoadData = async () => {
            try {
                const response = await axiosInstance.get(END_POINTS.SHIPPER_POST_LOAD_GET);
                if (response?.data?.success) {
                    const materials = response.data.data.meterial || [];
                    dispatch(setMaterials(materials));
                }
            } catch (error) {
                console.error('Error fetching shipper post-load data:', error);
            }
        };

        getPostLoadData();
        fetchHomeData();

        // 🔥 Test Pusher connection (remove after testing)
        connectPusher().then(() => {
            console.log('[TEST] Pusher connect called');
        }).catch((err: any) => {
            console.error('[TEST] Pusher connect error:', err);
        });

        const removeListener = addPusherStateListener((state, error) => {
            console.log(`[TEST] Pusher state: ${state}`, error || '');
        });

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for Post Load card
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.95,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            { iterations: 3 }
        ).start();

        // Pulse animation for Tracking list
        Animated.loop(
            Animated.sequence([
                Animated.timing(trackingPulseAnim, {
                    toValue: 0.97,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(trackingPulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
            { iterations: 6 }
        ).start();

        return () => removeListener();
    }, []);

    const toggleTrackingExpand = () => {
        const toValue = isTrackingExpanded ? 60 : 180;
        setIsTrackingExpanded(!isTrackingExpanded);
        Animated.spring(trackingHeightAnim, {
            toValue,
            friction: 8,
            tension: 40,
            useNativeDriver: false, // Height cannot be animated with native driver
        }).start();
    };

    const onRefresh = useCallback(() => {
        fetchHomeData(true);
    }, []);

    const formatPrice = (price: any) => {
        if (!price) return 'Negotiable';
        const num = parseFloat(price);
        if (num >= 100000) {
            return `₹${(num / 100000).toFixed(1)}L`;
        } else if (num >= 1000) {
            return `₹${(num / 1000).toFixed(1)}k`;
        }
        return `₹${num}`;
    };

    const extractCity = (location: string) => {
        if (!location) return '';
        const parts = location.split(',');
        return parts[0].trim();
    };

    const extractState = (location: string) => {
        if (!location) return '';
        const parts = location.split(',');
        return parts.length > 1 ? parts[1].trim() : '';
    };

    const formatDate = (date: string) => {
        if (!date) return '';
        return moment(date).format('DD MMM, YYYY');
    };

    const isUnderApproval = shipperKycStatus === '0' || shipperKycStatus === 0 || shipperKycStatus === false;
    const handleSelectRecentLoad = (recent: any) => {
        setOriginLocation(recent.origin.address);
        setOriginLat(recent.origin.lat);
        setOriginLon(recent.origin.lon);
        setLoadingCityState(recent.origin.cityState);

        setDestinationLocation(recent.destination.address);
        setDestinationLat(recent.destination.lat);
        setDestinationLon(recent.destination.lon);
        setUnloadingCityState(recent.destination.cityState);

        setShowRecentModal(false);

        // Auto navigate to post load
        navigation.navigate('shipperPostLoad', {
            originLocation: recent.origin.address,
            destinationLocation: recent.destination.address,
            originLat: recent.origin.lat,
            originLon: recent.origin.lon,
            destinationLat: recent.destination.lat,
            destinationLon: recent.destination.lon,
            loadingCityState: recent.origin.cityState,
            unloadingCityState: recent.destination.cityState
        });
    };

    const handleOpenRecentModal = (type: 'origin' | 'destination') => {
        setPendingPointType(type);
        setShowRecentModal(true);
    };

    const handleNewLocation = () => {
        setShowRecentModal(false);
        navigation.navigate(STACKS.MAP_VIEW, {
            returnScreen: 'shipperHome',
            pointType: pendingPointType || 'origin',
            initialLocation: pendingPointType === 'destination' ? (
                destinationLat && destinationLon ? {
                    latitude: parseFloat(destinationLat),
                    longitude: parseFloat(destinationLon),
                    address: destinationLocation
                } : undefined
            ) : (
                originLat && originLon ? {
                    latitude: parseFloat(originLat),
                    longitude: parseFloat(originLon),
                    address: originLocation
                } : undefined
            )
        });
    };

    const renderRecentLoadsModal = () => (
        <Modal
            visible={showRecentModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowRecentModal(false)}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalDismiss}
                    activeOpacity={1}
                    onPress={() => setShowRecentModal(false)}
                />
                <View style={styles.recentLoadsSheet}>
                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Repeat Recent Load</Text>
                        <Text style={styles.sheetSubtitle}>Choose from your previous routes</Text>
                    </View>

                    <ScrollView style={styles.recentList} showsVerticalScrollIndicator={false}>
                        {MOCK_RECENT_LOADS.map((recent) => (
                            <TouchableOpacity
                                key={recent.id}
                                style={styles.recentItem}
                                onPress={() => handleSelectRecentLoad(recent)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.recentRouteRow}>
                                    <View style={styles.recentPoint}>
                                        <View style={[styles.recentDot, { backgroundColor: '#10b981' }]} />
                                        <Text style={styles.recentCityText}>{recent.origin.cityState}</Text>
                                    </View>
                                    <View style={styles.recentArrowBox}>
                                        <Ionicons name="arrow-forward" size={14} color="#94a3b8" />
                                    </View>
                                    <View style={styles.recentPoint}>
                                        <View style={[styles.recentDot, { backgroundColor: '#ef4444' }]} />
                                        <Text style={styles.recentCityText}>{recent.destination.cityState}</Text>
                                    </View>
                                </View>
                                <View style={styles.recentAddressRow}>
                                    <Text style={styles.recentAddressText} numberOfLines={1}>
                                        {recent.origin.address}
                                    </Text>
                                    <View style={styles.addressDot} />
                                    <Text style={styles.recentAddressText} numberOfLines={1}>
                                        {recent.destination.address}
                                    </Text>
                                </View>
                                <View style={styles.repeatBadge}>
                                    <Text style={styles.repeatBadgeText}>Repeat</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.newLocationBtn}
                        onPress={handleNewLocation}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="map-outline" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                        <Text style={styles.newLocationBtnText}>Pick New Location on Map</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
    const renderApprovalUI = () => (
        <View style={styles.approvalCard}>
            <View style={styles.approvalIconBg}>
                <Ionicons name="shield-checkmark" size={44} color="#10B981" />
            </View>

            <Text style={styles.approvalTitle}>Details Under Review</Text>

            <Text style={styles.approvalDescription}>
                Your KYC Details have been successfully submitted and are currently being reviewed by our professional compliance team. This standard procedure ensures a safe and secure environment for all TruckMitr users.
            </Text>

            <View style={styles.approvalTimelineBox}>
                <Ionicons name="time-outline" size={20} color="#374151" />
                <Text style={styles.approvalTimelineText}>Expected completion: 24-48 business hours</Text>
            </View>

            <TouchableOpacity
                style={styles.completeFasterBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(STACKS.SHIPPER_PROFILE_EDIT, { screen: 'Business Detail' })}
            >
                <Text style={styles.completeFasterBtnText}>Complete your details to get verified faster</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.userInfo, { flex: 1, marginRight: 12 }]}>
                    <TouchableOpacity
                        style={styles.profileContainer}
                        onPress={isUnderApproval ? undefined : () => navigation.navigate('shipperProfile')}
                        activeOpacity={isUnderApproval ? 1 : 0.7}
                    >
                        {/* Progress Bar SVG */}
                        <Svg width="70" height="70" viewBox="0 0 70 70" style={styles.progressRing}>
                            <Circle cx="35" cy="35" r="33" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                            <Circle
                                cx="35"
                                cy="35"
                                r="33"
                                stroke="#22c55e"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                transform="rotate(-90 35 35)"
                            />
                        </Svg>

                        <Image
                            source={{
                                uri: user?.images
                                    ? `${BASE_URL}public/${user?.images}`
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                            }}
                            style={styles.avatarImg}
                        />

                        {/* Badge Center Bottom */}
                        <View style={styles.centerBadge}>
                            <Text style={styles.badgeTextSmall}>{progress}%</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.greeting}>Hello! 👋</Text>
                        <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                            {user?.name || 'Shipper'}
                        </Text>
                        <Text style={styles.tmidText}>
                            {user?.unique_id || '—'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.notifBtn}
                    onPress={isUnderApproval ? undefined : () => {
                        navigation.navigate(STACKS.SHIPPER_NOTIFICATIONS);
                    }}
                    activeOpacity={isUnderApproval ? 1 : 0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <NotificationIcon />
                    <View style={styles.notifBadge}>
                        <Text style={styles.notifCount}>3</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    (isUnderApproval || isLoading) && { justifyContent: 'center', flexGrow: 1, paddingBottom: 100 }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
                }
            >
                {isLoading && !refreshing ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : isUnderApproval ? (
                    renderApprovalUI()
                ) : (
                    <>
                        {/* Search */}
                        <TouchableOpacity
                            style={styles.searchBox}
                            activeOpacity={0.9}
                            onPress={() => (navigation).navigate(STACKS.SEARCH)}
                        >
                            <SearchIcon />
                            <Text style={styles.searchInput}>Track your shipment...</Text>
                        </TouchableOpacity>

                        <Animated.View style={[styles.quickFormContainer, { transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.quickFormHeader}>
                                <Text style={styles.quickFormTitle}>Post a Load</Text>
                            </View>

                            {/* Loading Point */}
                            <Text style={styles.quickFormLabel}>Loading Point</Text>
                            <TouchableOpacity
                                style={[styles.quickFormField, { marginBottom: 12 }]}
                                onPress={() => handleOpenRecentModal('origin')}
                            >
                                <Text style={[styles.quickFormValue, !originLocation && { color: '#94a3b8' }]} numberOfLines={1}>
                                    {originLocation || 'Select Loading Point (Map)'}
                                </Text>
                                <Ionicons name="map-outline" size={18} color="#3b82f6" />
                            </TouchableOpacity>

                            {/* Unloading Point */}
                            <Text style={[styles.quickFormLabel, { marginTop: 4 }]}>Unloading Point</Text>
                            <TouchableOpacity
                                style={styles.quickFormField}
                                onPress={() => handleOpenRecentModal('destination')}
                            >
                                <Text style={[styles.quickFormValue, !destinationLocation && { color: '#94a3b8' }]} numberOfLines={1}>
                                    {destinationLocation || 'Select Unloading Point (Map)'}
                                </Text>
                                <Ionicons name="map-outline" size={18} color="#3b82f6" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickFormBtn}
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (!originLocation || !destinationLocation) {
                                        Alert.alert('Missing Locations', 'Please select both loading and unloading points.');
                                        return;
                                    }
                                    navigation.navigate('shipperPostLoad', {
                                        originLocation,
                                        destinationLocation,
                                        originLat,
                                        originLon,
                                        destinationLat,
                                        destinationLon,
                                        loadingCityState,
                                        unloadingCityState
                                    });
                                }}
                            >
                                <Text style={styles.quickFormBtnText}>POST NOW</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Commented out original banner */}
                        {/* 
                        <TouchableOpacity
                            activeOpacity={0.95}
                            onPress={() => (navigation).navigate('shipperPostLoad')}
                        >
                            <Animated.View style={[
                                styles.heroCard,
                                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                            ]}>
                                ...
                            </Animated.View>
                        </TouchableOpacity>
                        */}

                        {/* Stats */}
                        <Text style={styles.sectionTitle}>Your Dashboard</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.statsScrollContent}
                            style={styles.statsScroll}
                        >
                            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate(STACKS.SHIPPER_ACTIVE_LOADS)}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>{'Active\nLoads'}</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
                                        <Text style={styles.statIconText}>📦</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#3b82f6' }]}>{dashboardData?.['open-load'] || 0}</Text>
                                <View style={styles.statChartContainer}>
                                    <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                                        <Defs>
                                            <LinearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <Stop offset="0" stopColor="#3b82f6" stopOpacity="0.2" />
                                                <Stop offset="1" stopColor="#3b82f6" stopOpacity="0.0" />
                                            </LinearGradient>
                                        </Defs>
                                        <Path d="M0,35 C15,35 25,20 35,28 C50,40 60,10 75,15 C85,18 90,10 100,12" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                        <Path d="M0,35 C15,35 25,20 35,28 C50,40 60,10 75,15 C85,18 90,10 100,12 L100,48 L0,48 Z" fill="url(#blueAreaGrad)" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => navigation.navigate(STACKS.SHIPPER_ACCEPTED_LOADS)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>{`Accepted\nLoads`}</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#e0f2fe' }]}>
                                        <Text style={styles.statIconText}>🤝</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#0284c7' }]}>{dashboardData?.accepted || 0}</Text>
                                <View style={styles.statBarChartContainer}>
                                    {[18, 26, 20, 32, 24, 38, 34].map((h, i) => (
                                        <View key={i} style={[styles.statBar, { height: h, backgroundColor: '#6366f1' }]} />
                                    ))}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => (navigation).navigate(STACKS.SHIPPER_IN_PROGRESS_LOADS)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>{`In Progress\nLoads`}</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#fdf2f8' }]}>
                                        <Text style={styles.statIconText}>⚡</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#db2777' }]}>{dashboardData?.in_progress || 0}</Text>
                                <View style={styles.statBarChartContainer}>
                                    {[25, 18, 30, 22, 35, 28, 40].map((h, i) => (
                                        <View key={i} style={[styles.statBar, { height: h, backgroundColor: '#db2777' }]} />
                                    ))}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate(STACKS.SHIPPER_IN_TRANSIT_LOADS)}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>In Transit Loads</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#ecfdf5' }]}>
                                        <Text style={styles.statIconText}>🚚</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#10b981' }]}>{dashboardData?.['in-transit'] || 0}</Text>
                                <View style={styles.statProgressContainer}>
                                    <Svg width="56" height="56" viewBox="0 0 40 40">
                                        <Circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="5" fill="none" />
                                        <Circle cx="20" cy="20" r="16" stroke="#22c55e" strokeWidth="5" fill="none" strokeDasharray="85 100" strokeLinecap="round" transform="rotate(-90 20 20)" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate(STACKS.SHIPPER_POD_PENDING)}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>POD Pending</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#fff7ed' }]}>
                                        <Text style={styles.statIconText}>📄</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#f97316' }]}>{dashboardData?.['pod-pending'] || 0}</Text>
                                <View style={styles.statChartContainer}>
                                    <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                                        <Path d="M0,15 C10,35 25,35 35,20 C45,5 60,35 75,30 C85,25 90,10 100,18" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.statCard} onPress={() => (navigation).navigate('shipperPaymentPending')}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>{`Payment\nPending`}</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#fef2f2' }]}>
                                        <Text style={styles.statIconText}>💰</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#ef4444' }]}>{dashboardData?.['payment-pending'] || 0}</Text>
                                <View style={styles.statBarChartContainer}>
                                    {[10, 15, 20, 12, 18, 14, 22].map((h, i) => (
                                        <View key={i} style={[styles.statBar, { height: h, backgroundColor: '#f97316' }]} />
                                    ))}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.statCard} onPress={() => (navigation).navigate('shipperCompletedLoads')}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>Completed Loads</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#f0fdfa' }]}>
                                        <Text style={styles.statIconText}>🎉</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#14b8a6' }]}>{dashboardData?.completed || 0}</Text>
                                <View style={styles.statProgressContainer}>
                                    <Svg width="40" height="40" viewBox="0 0 40 40">
                                        <Circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                        <Circle cx="20" cy="20" r="16" stroke="#14b8a6" strokeWidth="4" fill="none" strokeDasharray="95 100" strokeLinecap="round" transform="rotate(-90 20 20)" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Insight Strip */}
                        {dashboardData?.['in-transit'] > 0 && (
                            <TouchableOpacity style={styles.insight} onPress={() => navigation.navigate(STACKS.SHIPPER_IN_TRANSIT_LOADS)} activeOpacity={0.7}>
                                <View style={styles.insightBar} />
                                <View style={styles.insightIconBox}>
                                    <TruckIcon />
                                </View>
                                <View style={styles.insightText}>
                                    <Text style={styles.insightTitle}>{dashboardData?.['in-transit'] || 0} {dashboardData?.['in-transit'] === 1 ? 'load currently in transit' : 'loads currently in transit'}</Text>
                                    {/* <Text style={styles.insightSub}>Expected delivery today: 1</Text> */}
                                </View>

                                {/* Optional Arrow to indicate clickability */}
                                <ArrowIcon />
                            </TouchableOpacity>
                        )}

                        {/* Today at a Glance Section */}
                        <View style={styles.glanceSection}>
                            <Text style={styles.glanceTitle}>Today at a Glance</Text>
                            <Text style={styles.glanceSubtitle}>Quick summary of today's performance</Text>

                            <View style={styles.glanceRow}>
                                {/* Card 1: Picked */}
                                <View style={[styles.glanceCard, { backgroundColor: '#eff6ff' }]}>
                                    <View style={[styles.glanceIconCircle, { backgroundColor: '#dbeafe' }]}>
                                        <Text style={styles.glanceEmoji}>🚚</Text>
                                    </View>
                                    <Text style={[styles.glanceValue, { color: '#1e40af' }]}>{glanceData?.picked || 0}</Text>
                                    <Text style={styles.glanceLabel}>Picked</Text>
                                </View>

                                {/* Card 2: Delivered */}
                                <View style={[styles.glanceCard, { backgroundColor: '#f0fdf4' }]}>
                                    <View style={[styles.glanceIconCircle, { backgroundColor: '#dcfce7' }]}>
                                        <Text style={styles.glanceEmoji}>✅</Text>
                                    </View>
                                    <Text style={[styles.glanceValue, { color: '#166534' }]}>{glanceData?.delivered || 0}</Text>
                                    <Text style={styles.glanceLabel}>Delivered</Text>
                                </View>

                                {/* Card 3: Earned/Spent */}
                                <View style={[styles.glanceCard, { backgroundColor: '#faf5ff' }]}>
                                    <View style={[styles.glanceIconCircle, { backgroundColor: '#f3e8ff' }]}>
                                        <Text style={styles.glanceEmoji}>💰</Text>
                                    </View>
                                    <Text style={[styles.glanceValue, { color: '#6b21a8' }]}>{glanceData?.paid || 0}</Text>
                                    <Text style={styles.glanceLabel}>Paid</Text>
                                </View>
                            </View>
                        </View>

                        {/* My Posted Loads */}
                        {latestLoad && (
                            <>
                                <View style={styles.loadsHeader}>
                                    <Text style={styles.sectionTitle}>My Posted Loads</Text>
                                    <TouchableOpacity onPress={() => (navigation).navigate(STACKS.SHIPPER_MY_LOADS)}>
                                        <Text style={styles.seeAll}>See all →</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Modern Load Card */}
                                <TouchableOpacity
                                    style={styles.loadCard}
                                    onPress={() => (navigation).navigate(STACKS.SHIPPER_MY_LOADS)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.loadHeader}>
                                        <Text style={styles.loadId}>{latestLoad.load_id || `#${latestLoad.id}`}</Text>
                                        <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                                            <View style={[styles.badgeDot, { backgroundColor: '#3b82f6' }]} />
                                            <Text style={[styles.badgeText, { color: '#2563eb' }]}>🟢 Posted</Text>
                                        </View>
                                    </View>
                                    <View style={styles.route}>
                                        {/* Origin */}
                                        <View style={styles.routePoint}>
                                            <View style={[styles.routeDot, { backgroundColor: '#22c55e', marginRight: 10 }]} />
                                            <View style={styles.routeTextCol}>
                                                <Text numberOfLines={1} style={styles.routeCity}>
                                                    {extractCity(latestLoad.loading_city_state || latestLoad.origin_location)}
                                                </Text>
                                                <Text numberOfLines={1} style={styles.routeState}>
                                                    {extractState(latestLoad.loading_city_state || latestLoad.origin_location)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Truck Link */}
                                        <View style={styles.routeMid}>
                                            <View style={styles.routeLine} />
                                            <View style={styles.truckIconWrapper}>
                                                <TruckIcon />
                                            </View>
                                        </View>

                                        {/* Destination */}
                                        <View style={styles.routePoint}>
                                            <View style={[styles.routeTextCol, { alignItems: 'flex-end' }]}>
                                                <Text numberOfLines={1} style={[styles.routeCity, { textAlign: 'right' }]}>
                                                    {extractCity(latestLoad.unloading_city_state || latestLoad.destination_location)}
                                                </Text>
                                                <Text numberOfLines={1} style={[styles.routeState, { textAlign: 'right' }]}>
                                                    {extractState(latestLoad.unloading_city_state || latestLoad.destination_location)}
                                                </Text>
                                            </View>
                                            <View style={[styles.routeDot, { backgroundColor: '#ef4444', marginLeft: 10 }]} />
                                        </View>
                                    </View>
                                    <View style={styles.loadMeta}>
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Material</Text>
                                            <Text style={styles.metaValue} numberOfLines={1}>{latestLoad.material?.name || latestLoad.meterial}</Text>
                                        </View>
                                        <View style={styles.metaDivider} />
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Truck</Text>
                                            <Text style={styles.metaValue}>{latestLoad.vehicle_length?.length_label || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.metaDivider} />
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Budget</Text>
                                            <Text style={styles.metaPrice}>{formatPrice(latestLoad.price)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.loadFooter}>
                                        <View style={styles.offersBadge}>
                                            <Text style={styles.offersText}>🔥 {latestLoad.applications_count || 0} offers</Text>
                                        </View>
                                        <View style={styles.viewBtn}>
                                            <Text style={styles.viewBtnText}>View Offers</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            {/* Floating Collapsible Tracking List */}
            {!isLoading && !isUnderApproval && (
                <Animated.View style={[
                    styles.floatingTrackingWrapper,
                    { height: trackingHeightAnim }
                ]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={toggleTrackingExpand}
                        style={styles.trackingHeaderTouch}
                    >
                        {!isTrackingExpanded && (
                            <View style={styles.collapsedContent}>
                                <View style={styles.lottieBox}>
                                    <LottieView
                                        source={BlueTruckLottie}
                                        autoPlay
                                        loop
                                        style={styles.truckLottie}
                                    />
                                </View>
                                <View style={styles.trackingInfoStack}>
                                    <View style={styles.liveIndicator}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>LIVE TRACKING</Text>
                                    </View>
                                    <Text style={styles.statusMainText}>3 Trucks reaching pickup point</Text>
                                </View>
                                <View style={styles.expandChevron}>
                                    <Ionicons name="chevron-up" size={20} color="#3b82f6" />
                                </View>
                            </View>
                        )}
                        {isTrackingExpanded && (
                            <View style={[styles.expandChevron, { marginRight: 0 }]}>
                                <Ionicons name="chevron-down" size={20} color="#3b82f6" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {isTrackingExpanded && (
                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={[styles.trackingScroll, { transform: [{ scale: trackingPulseAnim }] }]}
                            contentContainerStyle={styles.trackingScrollContent}
                        >
                            {STATIC_TRACKING_TRUCKS.map((truck) => (
                                <TouchableOpacity
                                    key={truck.id}
                                    style={styles.trackingCard}
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate(STACKS.SHIPPER_TRACK_DETAIL, {
                                        load: {
                                            load_id: truck.load_id,
                                            status: truck.status,
                                            origin: truck.origin,
                                            destination: truck.destination,
                                            trip_id: truck.trip_id,
                                            driver_info: {
                                                driver_name: truck.driver_name,
                                                vehicle_number: truck.truck_number
                                            }
                                        }
                                    })}
                                >
                                    <View style={styles.trackCardTop}>
                                        <View style={styles.truckIconBox}>
                                            <Ionicons name="bus" size={18} color="#374151" />
                                        </View>
                                        <View style={styles.truckInfoMain}>
                                            <Text style={styles.truckNumText}>{truck.truck_number}</Text>
                                            <Text style={styles.truckEtaText}>ETA: {truck.eta}</Text>
                                        </View>
                                        <View style={styles.arrowIconBox}>
                                            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                                        </View>
                                    </View>
                                    <View style={styles.trackCardStatus}>
                                        <Text style={styles.trackStatusText}>{truck.status}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </Animated.ScrollView>
                    )}
                </Animated.View>
            )}
            {renderRecentLoadsModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 12,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    profileContainer: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4
    },
    progressRing: {
        position: 'absolute',
    },
    avatarImg: {
        width: 58,
        height: 58,
        borderRadius: 29
    },
    centerBadge: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        backgroundColor: '#22c55e',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff'
    },
    badgeTextSmall: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold'
    },
    greeting: { fontSize: 13, color: '#6b7280', marginBottom: -4, marginTop: 6 },
    userName: { fontSize: 18, fontWeight: '700', color: '#1f2937', lineHeight: 26 },
    tmidText: { fontSize: 11, color: '#6b7280', fontWeight: '500', marginTop: 1 },
    notifBtn: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    notifBadge: {
        position: 'absolute', top: 6, right: 6,
        minWidth: 18, height: 18, borderRadius: 9,
        backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center',
    },
    notifCount: { color: '#fff', fontSize: 10, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingBottom: 160 }, // Increased padding to clear navbar
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16,
        paddingHorizontal: 16, height: 52, marginBottom: 20,
        marginTop: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1f2937' },
    heroCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
        height: 170,
        backgroundColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    heroBlob: {
        position: 'absolute',
        top: -60,
        left: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroBlob2: {
        position: 'absolute',
        bottom: -40,
        right: 80,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 18,
        paddingRight: 0, // Removed right padding to let truck go to edge
        paddingVertical: 12,
    },
    heroTextContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 4,
        paddingRight: 6,
    },
    heroImageContainer: {
        width: 180, // Even wider container
        height: '100%',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 0,
    },
    heroContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        zIndex: 2,
    },
    heroText: {
        maxWidth: '60%',
    },
    heroBadge: {
        backgroundColor: 'rgba(251,191,36,0.25)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 6,
    },
    heroBadgeText: {
        color: '#fcd34d',
        fontSize: 10,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#93c5fd',
        marginTop: 1,
        marginBottom: 2,
    },
    heroDesc: {
        display: 'none',
    },
    heroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f97316',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 10,
        alignSelf: 'flex-start',
        gap: 6,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
        marginTop: 6,
    },
    heroBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    heroBtnArrow: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImg: {
        width: 220, // MASSIVE
        height: 190,
        marginRight: -25, // Push it out
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
    statsScroll: {
        marginLeft: -12, // Pull left to counteract screen padding
        marginRight: -12, // Pull right
        marginBottom: 20,
    },
    statsScrollContent: {
        paddingHorizontal: 12, // Restore padding inside scroll
        gap: 10,
    },
    statCard: {
        width: 150,
        height: 135,
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 14,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
        marginRight: 12,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statIconText: {
        fontSize: 12,
    },
    statNum: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a', // Slate 900
        marginTop: 4,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b', // Slate 500
        lineHeight: 14,
    },
    statChartContainer: {
        marginTop: -19,
        marginBottom: 200, // Shift up significantly
        height: 49,
        width: '115%',
        marginLeft: -10,
    },
    statBarChartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 32,
        marginTop: -4,
        marginBottom: 40, // Shift up significantly
        paddingHorizontal: 2,
    },
    statBar: {
        width: 10,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        backgroundColor: '#6366f1', // Indigo 500
    },
    statProgressContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -21,
        marginBottom: 40, // Shift up significantly
    },
    // Removed statContext style
    insight: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16,
        padding: 14, marginBottom: 20, borderWidth: 1.5, borderColor: '#fed7aa',
        overflow: 'hidden',
    },
    insightBar: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 4, backgroundColor: '#f97316',
    },
    insightIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#fff7ed', justifyContent: 'center',
        alignItems: 'center', marginRight: 12,
    },
    insightText: { flex: 1 },
    insightTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    insightSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    storyFlow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    storyStep: { alignItems: 'center' },
    storyIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    storyEmoji: { fontSize: 22 },
    storyLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
    storyLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 16, marginBottom: 20 },
    loadsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    seeAll: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginTop: -14 },
    loadCard: {
        backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    loadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    loadId: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    // KYC Approval Status Styles
    approvalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    approvalIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    approvalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    approvalDescription: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
    },
    approvalTimelineBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 30,
        width: '100%',
    },
    approvalTimelineText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    completeFasterBtn: {
        backgroundColor: '#084489',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    completeFasterBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
    route: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 4,
        justifyContent: 'space-between',
        width: '100%'
    },
    routePoint: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    routeDot: { width: 8, height: 8, borderRadius: 4, elevation: 1 },
    routeTextCol: { flex: 1, minWidth: 60 },
    routeCity: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
    routeState: { fontSize: 10, color: '#6b7280', marginTop: 1, fontWeight: '500' },
    routeMid: { width: 50, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    routeLine: { position: 'absolute', height: 1.5, width: '100%', backgroundColor: '#f1f5f9' },
    truckIconWrapper: { backgroundColor: '#fff', padding: 4, zIndex: 1 },
    loadMeta: { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, marginBottom: 14 },
    metaItem: { flex: 1, alignItems: 'center' },
    metaLabel: { fontSize: 10, color: '#9ca3af', marginBottom: 3 },
    metaValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
    metaPrice: { fontSize: 14, fontWeight: '700', color: '#059669' },
    metaDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 10 },
    loadFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    offersBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    offersText: { fontSize: 12, fontWeight: '600', color: '#ea580c' },
    viewBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    viewBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    transitBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12 },
    transitDriver: { fontSize: 13, fontWeight: '500', color: '#166534' },
    transitEta: { fontSize: 12, color: '#15803d', marginTop: 4 },

    // Today at a Glance Styles
    glanceSection: {
        marginTop: 10,
        marginBottom: 24,
        paddingHorizontal: 0,
    },
    glanceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    glanceSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 16,
    },
    glanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: -4, // Counteract card margins for flush alignment
    },
    glanceCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    glanceIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    glanceEmoji: { fontSize: 16 },
    glanceValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    glanceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4b5563',
        textAlign: 'center',
    },

    // Metric Footer
    metricCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    metricEmoji: { fontSize: 14, marginRight: 6 },
    metricText: {
        fontSize: 13,
        color: '#475569',
    },
    metricHighlight: {
        fontWeight: '700',
        color: '#0f172a',
    },

    // In Progress Section Styles
    inProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    inProgressScroll: {
        marginLeft: -12,
        marginRight: -12,
        marginBottom: 24,
    },
    inProgressScrollContent: {
        paddingHorizontal: 12,
        gap: 12,
    },
    inProgressCard: {
        width: 280,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    ipCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ipLoadId: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    ipBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ipBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    ipRouteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ipCity: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    ipArrowBox: {
        marginHorizontal: 10,
    },
    ipDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 12,
    },
    ipDetailsSection: {
        gap: 6,
    },
    ipDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ipLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    ipValue: {
        fontSize: 12,
        color: '#1e293b',
        fontWeight: '600',
        maxWidth: '70%',
    },
    ipHighlightText: {
        color: '#3b82f6',
    },
    ipPendingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        padding: 10,
        borderRadius: 12,
        marginTop: 4,
    },
    ipPendingText: {
        fontSize: 11,
        color: '#9a3412',
        fontWeight: '500',
        flex: 1,
    },
    ipTrackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 6,
        gap: 4,
    },
    ipTrackText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3b82f6',
    },

    // --- Quick Form Styles ---
    quickFormContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    quickFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    quickFormTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    quickFormLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
    },
    quickFormField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 10,
    },
    quickFormValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
        flex: 1,
    },
    quickFormBtn: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: 14,
        marginTop: 20,
        gap: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    quickFormBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // --- Floating Tracking Styles ---
    floatingTrackingWrapper: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        right: 14,
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 10,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    trackingHeaderTouch: {
        paddingHorizontal: 12,
    },
    collapsedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    lottieBox: {
        width: 70,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    truckLottie: {
        width: '100%',
        height: '100%',
    },
    trackingInfoStack: {
        flex: 1,
        marginLeft: 4,
        gap: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#ef4444',
        marginRight: 4,
    },
    liveText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#3b82f6',
        letterSpacing: 0.8,
    },
    statusMainText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
    },
    expandChevron: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    trackingScroll: {
        paddingVertical: 10,
    },
    trackingScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 6,
    },
    trackingCard: {
        width: 220,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 12,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    trackCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    truckIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    truckInfoMain: {
        flex: 1,
    },
    truckNumText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
    },
    truckEtaText: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: '700',
    },
    arrowIconBox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackCardStatus: {
        backgroundColor: '#f8fafc',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    trackStatusText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
    },
    // --- Recent Loads Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalDismiss: {
        flex: 1,
    },
    recentLoadsSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    sheetHeader: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    sheetSubtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    recentList: {
        marginTop: 10,
    },
    recentItem: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        position: 'relative',
    },
    recentRouteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    recentPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 0.45,
    },
    recentDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    recentCityText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    recentArrowBox: {
        flex: 0.1,
        alignItems: 'center',
    },
    recentAddressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recentAddressText: {
        fontSize: 11,
        color: '#64748b',
        flex: 1,
    },
    addressDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 8,
    },
    repeatBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    repeatBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3b82f6',
        textTransform: 'uppercase',
    },
    newLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#3b82f6',
        borderRadius: 14,
        height: 52,
        marginTop: 10,
    },
    newLocationBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#3b82f6',
    },
});

export default ShipperHome;


