import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Modal, Linking, ActivityIndicator, RefreshControl, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from 'src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import BackgroundGeolocation from 'react-native-background-geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { pick } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import { useTranslation } from 'react-i18next';
import { fetchDirections } from 'src/utils/maps/google.apis';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import ColorTrackingMap, { VehicleColorData } from './ColorTrackingMap';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import RNFS from 'react-native-fs';
// import pusherService, { LocationUpdate } from 'src/services/pusherService';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROUTE_COLORS = ['#2874F0', '#F39C12', '#26A541', '#E74C3C', '#9B59B6'];

// ── Classic Color Palette (Flipkart Style) ──
const C = {
    bg: '#ffffffff',
    surface: '#FFFFFF',
    primary: '#2874F0',
    success: '#26A541',
    text: '#212121',
    textSec: '#878787',
    border: '#E0E0E0',
    line: '#F0F0F0',
};

// ── Icons ──
const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2">
        <Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const PhoneIcon = ({ color = C.primary }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
);

const CheckCircle = ({ active }: { active?: boolean }) => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill={active ? C.success : "#CCC"} stroke="none">
        <Circle cx="12" cy="12" r="12" />
        <Path d="M17 8l-6 6-3-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
);

const PendingCircle = () => (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill={C.border}>
        <Circle cx="6" cy="6" r="6" />
    </Svg>
);

const LocationPinIcon = ({ color = C.primary }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
    </Svg>
);

const NavigationIcon = ({ color = C.primary }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 11l19-9-9 19-2-8-8-2z" />
    </Svg>
);

const RouteIcon = ({ color = C.primary }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18" />
        <Path d="M8 6H18V16" />
    </Svg>
);

const ClockIcon = ({ color = C.textSec }) => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

const DocumentIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Path d="M14 2v6h6" />
        <Path d="M16 13H8" />
        <Path d="M16 17H8" />
        <Path d="M10 9H8" />
    </Svg>
);

// Skeleton Components
const SkeletonBox = ({ width, height, style }: { width?: number | string; height?: number; style?: any }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width || '100%',
                    height: height || 16,
                    backgroundColor: C.border,
                    borderRadius: 4,
                    opacity,
                },
                style,
            ]}
        />
    );
};

interface Props {
    onBack?: () => void;
    driverId?: string;
    loadId?: string;
    navigation?: any;
}

const TransporterDriverTrackingScreen: React.FC<Props> = ({ onBack, navigation }) => {
    const { t } = useTranslation();
    const [currentStatus, setCurrentStatus] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [hasData, setHasData] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<number | null>(null);
    const [showColorTrackingMap, setShowColorTrackingMap] = useState(false);

    // Route selection states
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [decodedRoutes, setDecodedRoutes] = useState<{ latitude: number; longitude: number }[][]>([]);
    const [fetchingRoutes, setFetchingRoutes] = useState(false);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
    const [selectedTripRoute, setSelectedTripRoute] = useState<any | null>(null);
    const [selectedTripRoutePoints, setSelectedTripRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
    const routeMapRef = useRef<MapView>(null);

    // Start trip state
    const [startingTrip, setStartingTrip] = useState(false);

    // POD and Bility upload states
    const [showPODModal, setShowPODModal] = useState(false);
    const [showBilityModal, setShowBilityModal] = useState(false);
    const [builtyFile, setBilityFile] = useState<any>(null);
    const [uploadingBility, setUploadingBility] = useState(false);
    const [podFile, setPodFile] = useState<any>(null);
    const [uploadingPOD, setUploadingPOD] = useState(false);

    // Get user from Redux
    const { user } = useSelector((state: any) => state.user) || {};

    // Refs for location tracking
    const bgGeoLocationSubscriptionRef = useRef<any>(null);
    const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const lastUpdateTimeRef = useRef<number>(Date.now());
    const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastHeadingRef = useRef<number>(0);
    // Track every GPS position for bearing calculation (separate from lastLocationRef which only updates on 30m+ moves)
    const prevGpsPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
    // Store latest color tracking data from tracking dashboard for location update API
    const vehicleColorDataRef = useRef<VehicleColorData>({});

    // Trip Data
    const [trip, setTrip] = useState<any>({
        id: null, // Numeric ID from API
        load_id: 'N/A', // String load ID for display
        trip_id: null,
        trip_status: null, // Add trip_status
        trucker_id: null, // Add trucker_id
        shipper_id: null, // Add shipper_id
        origin: 'Loading...',
        destination: 'Loading...',
        origin_lat: null,
        origin_lon: null,
        destination_lat: null,
        destination_lon: null,         // Use "lon" instead of "lng" per user request
        source_lat: null,              // Keep old keys just in case
        source_lng: null,
        trackingAgent: { name: 'Support', phone: '' },
        driver: { name: '', phone: '', dl: '' },
        vehicle: '',
        payment: '',
        builty_path: null,
        pod_path: null,
        driver_id: null,
        trip_started: false,
        sim_tracking_consent: null,
    });

    useEffect(() => {
        // Call API on mount - no parameters needed as it uses auth token
        fetchActiveTripAndLocation();

        // return () => {
        //     // Cleanup: Unsubscribe from Pusher when component unmounts
        //     pusherService.unsubscribe();
        // };
    }, []);

    // Start location tracking when trip data is loaded
    useEffect(() => {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 [LOCATION TRACKING] useEffect triggered');
        console.log('🔍 [LOCATION TRACKING] trip.trip_id:', trip.trip_id);
        console.log('🔍 [LOCATION TRACKING] trip.trip_status:', trip.trip_status);
        console.log('🔍 [LOCATION TRACKING] user?.id:', user?.id);
        console.log('═══════════════════════════════════════════════════════════');

        // Only start tracking if trip is active (not completed)
        if (trip.trip_id && user?.id && trip.trip_status !== 'completed') {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🚀 [LOCATION TRACKING] Starting location tracking');
            console.log('📍 [LOCATION TRACKING] Trip ID:', trip.trip_id);
            console.log('📍 [LOCATION TRACKING] Trip Status:', trip.trip_status);
            console.log('👤 [LOCATION TRACKING] Driver ID (user.id):', user.id);
            console.log('═══════════════════════════════════════════════════════════');
            startLocationTracking();
        } else {
            console.log('⚠️ [LOCATION TRACKING] Cannot start or stopping tracking');
            if (!trip.trip_id) console.log('⚠️ [LOCATION TRACKING] Missing: trip_id');
            if (!user?.id) console.log('⚠️ [LOCATION TRACKING] Missing: user.id');
            if (trip.trip_status === 'completed') {
                console.log('🏁 [LOCATION TRACKING] Trip is completed - stopping tracking');
                stopLocationTracking();
            }
        }

        return () => {
            console.log('🛑 [LOCATION TRACKING] Stopping location tracking (cleanup)');
            stopLocationTracking();
        };
    }, [trip.trip_id, trip.trip_status, user?.id]);

    // Calculate distance between two coordinates in meters (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    // Calculate bearing (heading) between two GPS coordinates in degrees (0-360)
    const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const toDeg = (rad: number) => (rad * 180) / Math.PI;

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δλ = toRad(lon2 - lon1);

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        let bearing = toDeg(Math.atan2(y, x));
        return (bearing + 360) % 360; // Normalize to 0-360
    };

    // Get the best available heading: using GPS trajectory if moving, else GPS heading
    const getVehicleHead = (latitude: number, longitude: number, gpsHeading?: number | null): number => {
        let finalHeading = (gpsHeading !== undefined && gpsHeading !== null && gpsHeading >= 0) ? Math.round(gpsHeading) : lastHeadingRef.current;

        if (prevGpsPositionRef.current) {
            const dist = calculateDistance(
                prevGpsPositionRef.current.latitude, prevGpsPositionRef.current.longitude,
                latitude, longitude
            );

            // If moved more than 2 meters, use True GPS Trajectory (much more accurate in a moving truck)
            if (dist >= 2) {
                const bearing = Math.round(calculateBearing(
                    prevGpsPositionRef.current.latitude, prevGpsPositionRef.current.longitude,
                    latitude, longitude
                ));
                console.log(`🧭 [HEADING] Moved ${dist.toFixed(1)}m. Using True GPS Bearing: ${bearing}°`);
                finalHeading = bearing;
            } else {
                console.log(`🧭 [HEADING] Stationary. Using GPS Heading: ${finalHeading}°`);
            }
        } else {
            console.log(`🧭 [HEADING] First ping. Using GPS Heading: ${finalHeading}°`);
        }

        lastHeadingRef.current = finalHeading;
        prevGpsPositionRef.current = { latitude, longitude };
        return finalHeading;
    };

    // Update location to server
    const updateLocationToServer = async (latitude: number, longitude: number, vehicleHead: number = 0) => {
        try {
            if (!trip.trip_id || !user?.id) {
                console.warn('⚠️ [LOCATION UPDATE] Missing trip_id or driver_id');
                console.warn('⚠️ [LOCATION UPDATE] trip_id:', trip.trip_id);
                console.warn('⚠️ [LOCATION UPDATE] driver_id:', user?.id);
                return;
            }

            const payload: Record<string, any> = {
                trip_id: trip.trip_id,
                driver_id: user.id,
                latitude,
                longitude,
                vehicle_head: vehicleHead,
            };

            // Conditionally include color tracking fields if available
            const colorData = vehicleColorDataRef.current;
            if (colorData.color_code) payload.color_code = colorData.color_code;
            if (colorData.color_reason) payload.color_reason = colorData.color_reason;
            if (colorData.off_route_km != null) payload.off_route_km = colorData.off_route_km;

            console.log('═══════════════════════════════════════════════════════════');
            console.log('📤 [LOCATION UPDATE] Sending location update to server');
            console.log('� [LOCATION UPDATE] Coordinates:', {
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6)
            });
            console.log('📦 [LOCATION UPDATE] Full Payload:', JSON.stringify(payload, null, 2));
            console.log('🔗 [LOCATION UPDATE] Endpoint:', END_POINTS.TRIP_UPDATE_LOCATION);
            console.log('⏰ [LOCATION UPDATE] Timestamp:', new Date().toISOString());
            console.log('═══════════════════════════════════════════════════════════');

            const response = await axiosInstance.post(END_POINTS.TRIP_UPDATE_LOCATION, payload);

            console.log('═══════════════════════════════════════════════════════════');
            console.log('📥 [LOCATION UPDATE] Server Response:');
            console.log('📊 [LOCATION UPDATE] Status:', response.data?.status);
            console.log('📊 [LOCATION UPDATE] Message:', response.data?.message);
            console.log('📦 [LOCATION UPDATE] Full Response:', JSON.stringify(response.data, null, 2));
            console.log('═══════════════════════════════════════════════════════════');

            if (response.data?.status === true || response.data?.status === 'success') {
                console.log('✅ [LOCATION UPDATE] Location updated successfully');
                console.log('✅ [LOCATION UPDATE] Coordinates sent:', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                lastUpdateTimeRef.current = Date.now();
            } else {
                console.warn('⚠️ [LOCATION UPDATE] Failed:', response.data?.message);
            }
        } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌ [LOCATION UPDATE] Error occurred');
            console.error('❌ [LOCATION UPDATE] Error message:', error?.message);
            console.error('❌ [LOCATION UPDATE] Error details:', error?.response?.data);
            console.error('❌ [LOCATION UPDATE] Attempted coordinates:', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            console.error('═══════════════════════════════════════════════════════════');
        }
    };

    // Start location tracking
    const startLocationTracking = async () => {
        console.log('🎯 [LOCATION TRACKING] Initializing...');

        // Stop any existing tracking
        stopLocationTracking();

        const token = await AsyncStorage.getItem('@user_token');

        // Watch position changes
        bgGeoLocationSubscriptionRef.current = BackgroundGeolocation.onLocation(
            (location) => {
                const { latitude, longitude, heading } = location.coords;
                const vehicleHead = getVehicleHead(latitude, longitude, heading);
                console.log('═══════════════════════════════════════════════════════════');
                console.log('📍 [LOCATION TRACKING] New position received from GPS');
                console.log('📍 [LOCATION TRACKING] Latitude:', latitude.toFixed(6));
                console.log('📍 [LOCATION TRACKING] Longitude:', longitude.toFixed(6));
                console.log('📍 [LOCATION TRACKING] GPS Heading (raw):', heading);
                console.log('📍 [LOCATION TRACKING] Vehicle Head (final):', vehicleHead, 'degrees');
                console.log('═══════════════════════════════════════════════════════════');

                setCurrentLocation({ latitude, longitude });

                // Always update prev GPS position for bearing calculation on next tick
                prevGpsPositionRef.current = { latitude, longitude };

                // Check if we should update (moved 30m or more)
                if (lastLocationRef.current) {
                    const distance = calculateDistance(
                        lastLocationRef.current.latitude,
                        lastLocationRef.current.longitude,
                        latitude,
                        longitude
                    );

                    console.log(`📏 [LOCATION TRACKING] Distance from last update: ${distance.toFixed(2)}m`);

                    if (distance >= 30) {
                        console.log('✅ [LOCATION TRACKING] Moved 30m+, updating server');
                        updateLocationToServer(latitude, longitude, vehicleHead);
                        lastLocationRef.current = { latitude, longitude };
                    } else {
                        console.log(`⏸️ [LOCATION TRACKING] Distance < 30m, skipping update (${distance.toFixed(2)}m)`);
                    }
                } else {
                    // First location update
                    console.log('🎯 [LOCATION TRACKING] First location received, updating server');
                    updateLocationToServer(latitude, longitude, vehicleHead);
                    lastLocationRef.current = { latitude, longitude };
                }
            },
            (error) => {
                console.error('═══════════════════════════════════════════════════════════');
                console.error('❌ [LOCATION TRACKING] GPS Error', error);
                console.error('═══════════════════════════════════════════════════════════');
            }
        );

        BackgroundGeolocation.ready({
            geolocation: {
                desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.High,
                distanceFilter: 30,
                stopTimeout: 5,
            },
            logger: {
                debug: false,
                logLevel: BackgroundGeolocation.LogLevel.Verbose,
            },
            app: {
                stopOnTerminate: false,
                startOnBoot: true,
                enableHeadless: true,
            },
            http: {
                url: BASE_URL.replace(/\/$/, "") + "/" + END_POINTS.TRIP_UPDATE_LOCATION.replace(/^\//, ""),
                batchSync: false,
                autoSync: true,
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                params: {
                    trip_id: trip.trip_id,
                    driver_id: user?.id
                }
            },
            persistence: {
                locationTemplate: "{\"trip_id\": \"<%= @trip_id %>\", \"driver_id\": <%= @driver_id %>, \"latitude\": <%= location.coords.latitude %>, \"longitude\": <%= location.coords.longitude %>, \"vehicle_head\": <%= location.coords.heading %>}"
            }
        }).then((state) => {
            if (!state.enabled) {
                BackgroundGeolocation.start();
            } else {
                BackgroundGeolocation.setConfig({
                    http: {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        },
                        params: {
                            trip_id: trip.trip_id,
                            driver_id: user?.id
                        }
                    }
                });
            }
        });

        // Set up 30-second fallback timer (for testing - change to 10 minutes in production)
        fallbackIntervalRef.current = setInterval(() => {
            const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
            const thirtySeconds = 30 * 1000; // 30 seconds for testing

            if (timeSinceLastUpdate >= thirtySeconds) {
                console.log('⏰ [LOCATION TRACKING] 30 SECONDS PASSED - FORCING LOCATION UPDATE');

                // Try to get current position with relaxed settings
                BackgroundGeolocation.getCurrentPosition({
                    samples: 1,
                    persist: false,
                    timeout: 30,
                    maximumAge: 60000
                }).then((location) => {
                    const { latitude, longitude, heading } = location.coords;
                    const vehicleHead = getVehicleHead(latitude, longitude, heading);
                    console.log('✅ [LOCATION TRACKING] Fallback position obtained:', { latitude, longitude, vehicleHead });
                    updateLocationToServer(latitude, longitude, vehicleHead);
                    lastLocationRef.current = { latitude, longitude };
                    prevGpsPositionRef.current = { latitude, longitude };
                    setCurrentLocation({ latitude, longitude });
                }).catch((error) => {
                    console.error('❌ [LOCATION TRACKING] Fallback error:', error);
                });
            }
        }, 10000); // Check every 10 seconds for testing

        console.log('✅ [LOCATION TRACKING] Started successfully');
        console.log('⏰ [LOCATION TRACKING] Fallback timer: Updates every 30 seconds if no movement');
    };

    // Stop location tracking
    const stopLocationTracking = () => {
        BackgroundGeolocation.stop();
        if (bgGeoLocationSubscriptionRef.current) {
            bgGeoLocationSubscriptionRef.current.remove();
            bgGeoLocationSubscriptionRef.current = null;
            console.log('🛑 [LOCATION TRACKING] Watch cleared');
        }

        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
            console.log('🛑 [LOCATION TRACKING] Fallback interval cleared');
        }
    };

    const fetchActiveTripAndLocation = async () => {
        try {
            setLoading(true);
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🔄 [TRACKING] Starting fetchActiveTripAndLocation');
            console.log('📋 [TRACKING] Timestamp:', new Date().toISOString());
            console.log('═══════════════════════════════════════════════════════════');

            // Fetch trip details using the driver tracking API
            console.log('📡 [TRACKING] Calling Trucker Driver Tracking API...');
            console.log('🔗 [TRACKING] Endpoint: GET', END_POINTS.TRUCKER_DRIVER_TRACKING);

            const tripResponse = await axiosInstance.get(END_POINTS.TRUCKER_DRIVER_TRACKING);

            console.log('═══════════════════════════════════════════════════════════');
            console.log('📥 [TRACKING] Trucker Tracking API Response:');
            console.log('📊 [TRACKING] Status Code:', tripResponse.status);
            console.log('📊 [TRACKING] Response Status:', tripResponse.data?.status);
            console.log('📊 [TRACKING] Response Message:', tripResponse.data?.message);
            console.log('📦 [TRACKING] Full Response Data:', JSON.stringify(tripResponse.data, null, 2));
            console.log('═══════════════════════════════════════════════════════════');

            if (tripResponse.data?.status === 'success' && tripResponse.data?.data) {
                const data = tripResponse.data.data;

                console.log('✅ [TRACKING] Active Trip Found!');
                console.log('📋 [TRACKING] Trip Details:', {
                    load_id: data.load_id,
                    origin: data.origin,
                    destination: data.destination,
                    vehicle_number: data.vehicle_number,
                    driver_name: data.driver_name,
                    current_status_code: data.current_status_code
                });

                setHasData(true);
                setTrip({
                    id: data.id || null, // Numeric ID
                    load_id: data.load_id || 'N/A', // String load ID for display
                    trip_id: data.trip_id,
                    trip_status: data.trip_status, // Add trip_status
                    trucker_id: data.trucker_id, // Add trucker_id
                    shipper_id: data.shipper_id, // Add shipper_id
                    origin: data.origin || 'Unknown',
                    destination: data.destination || 'Unknown',

                    // Map new keys requested by user
                    origin_lat: data.origin_lat || data.source_lat,
                    origin_lon: data.origin_lon || data.source_lng,
                    destination_lat: data.destination_lat,
                    destination_lon: data.destination_lon || data.destination_lng,

                    // Keep old keys just in case
                    source_lat: data.source_lat,
                    source_lng: data.source_lng,
                    vehicle: data.vehicle_number || 'Not Assigned',
                    payment: data.payment_amount || 'N/A',
                    trackingAgent: {
                        name: data.tracking_agent?.name || 'Support Team',
                        phone: data.tracking_agent?.phone || ''
                    },
                    driver: {
                        name: data.driver_name || 'Not Assigned',
                        phone: data.driver_phone || '',
                        dl: data.dl_number || ''
                    },
                    material: data.material_name,
                    weight: data.material_weight,
                    builty_path: data.builty_path || null,
                    pod_path: data.pod_path || null,
                    driver_id: data.driver_id || null,
                    trip_started: data.trip_started || data.trip_status === 'active' || false,
                    sim_tracking_consent: data.sim_tracking_consent || null,
                });

                console.log('═══════════════════════════════════════════════════════════');
                console.log('🎯 [TRACKING] Trip ID extracted from API');
                console.log('🆔 [TRACKING] trip_id:', data.trip_id);
                console.log('🆔 [TRACKING] driver_id:', data.driver_id);
                console.log('🆔 [TRACKING] trip_status:', data.trip_status);
                console.log('🆔 [TRACKING] trip_started_at:', data.trip_started_at);
                console.log('═══════════════════════════════════════════════════════════');

                const statusCode = parseInt(data.current_status_code, 10);
                if (!isNaN(statusCode)) {
                    setCurrentStatus(statusCode);
                    console.log('📊 [TRACKING] Status Code Set:', statusCode);
                }

                // Check if current location data is available in the response
                if (data.current_latitude && data.current_longitude) {
                    const parsedLocation = {
                        latitude: parseFloat(data.current_latitude),
                        longitude: parseFloat(data.current_longitude),
                    };
                    setCurrentLocation(parsedLocation);
                    console.log('✅ [TRACKING] Current location set from API:', parsedLocation);
                } else {
                    console.log('ℹ️ [TRACKING] No current location data in API response');
                }

                console.log('✅ [TRACKING] Trip data loaded successfully');
            } else {
                console.warn('⚠️ [TRACKING] No active trip found or invalid response');
                console.log('📊 [TRACKING] Response Status:', tripResponse.data?.status);
                console.log('📊 [TRACKING] Response Data:', tripResponse.data);
                setHasData(false);
                showToast('No active trip found');
            }
        } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌ [TRACKING] Error in fetchActiveTripAndLocation');
            console.error('❌ [TRACKING] Error Type:', error.name);
            console.error('❌ [TRACKING] Error Message:', error.message);
            console.error('❌ [TRACKING] Error Stack:', error.stack);
            if (error.response) {
                console.error('📥 [TRACKING] Error Response Status:', error.response.status);
                console.error('📥 [TRACKING] Error Response Data:', JSON.stringify(error.response.data, null, 2));
                console.error('📥 [TRACKING] Error Response Headers:', error.response.headers);
            }
            console.error('═══════════════════════════════════════════════════════════');
            setHasData(false);
            showToast('Failed to load trip details');
        } finally {
            setLoading(false);
            setRefreshing(false);
            console.log('🏁 [TRACKING] fetchActiveTripAndLocation completed');
        }
    };

    const fetchCurrentLocation = async (tripId: string) => {
        try {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📍 [TRACKING] Starting fetchCurrentLocation');
            console.log('📋 [TRACKING] Trip ID:', tripId);
            console.log('� [TRACKING] Endpoint: GET /api/trip/current-location/' + tripId);
            console.log('═══════════════════════════════════════════════════════════');

            const locationResponse = await axiosInstance.get(`/api/trip/current-location/${tripId}`);

            console.log('═══════════════════════════════════════════════════════════');
            console.log('📥 [TRACKING] Current Location API Response:');
            console.log('📊 [TRACKING] Status Code:', locationResponse.status);
            console.log('📊 [TRACKING] Response Status:', locationResponse.data?.status);
            console.log('📊 [TRACKING] Response Message:', locationResponse.data?.message);
            console.log('📦 [TRACKING] Full Response Data:', JSON.stringify(locationResponse.data, null, 2));
            console.log('═══════════════════════════════════════════════════════════');

            if (locationResponse.data?.status === 'success' && locationResponse.data?.data) {
                const loc = locationResponse.data.data;
                console.log('📍 [TRACKING] Location Data:', {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timestamp: loc.timestamp
                });

                if (loc.latitude && loc.longitude) {
                    const parsedLocation = {
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude),
                    };
                    setCurrentLocation(parsedLocation);
                    console.log('✅ [TRACKING] Current location set successfully:', parsedLocation);
                } else {
                    console.warn('⚠️ [TRACKING] Location data missing latitude or longitude');
                }
            } else {
                console.warn('⚠️ [TRACKING] Invalid location response or no data');
                console.log('📊 [TRACKING] Response:', locationResponse.data);
            }
        } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌ [TRACKING] Error in fetchCurrentLocation');
            console.error('❌ [TRACKING] Error Type:', error.name);
            console.error('❌ [TRACKING] Error Message:', error.message);
            console.error('❌ [TRACKING] Error Stack:', error.stack);
            if (error.response) {
                console.error('📥 [TRACKING] Error Response Status:', error.response.status);
                console.error('📥 [TRACKING] Error Response Data:', JSON.stringify(error.response.data, null, 2));
            }
            console.error('═══════════════════════════════════════════════════════════');
        }
    };

    const subscribeToLocationUpdates = (tripId: string) => {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📡 [TRACKING] Starting Pusher subscription');
        console.log('📋 [TRACKING] Trip ID:', tripId);
        console.log('📡 [TRACKING] Channel:', `driver-location.${tripId}`);
        console.log('📡 [TRACKING] Event:', 'location.update');
        console.log('═══════════════════════════════════════════════════════════');

        // Connect to Pusher
        // pusherService.connect();

        // Subscribe to trip location updates
        // pusherService.subscribeToTrip(tripId, (locationUpdate: LocationUpdate) => {
        //     console.log('═══════════════════════════════════════════════════════════');
        //     console.log('📍 [TRACKING] Received location update from Pusher!');
        //     console.log('⏰ [TRACKING] Timestamp:', new Date().toISOString());
        //     console.log('📦 [TRACKING] Location Update Data:', {
        //         latitude: locationUpdate.latitude,
        //         longitude: locationUpdate.longitude
        //     });
        //     console.log('📦 [TRACKING] Full Payload:', JSON.stringify(locationUpdate, null, 2));
        //     console.log('═══════════════════════════════════════════════════════════');

        //     // Update current location state
        //     setCurrentLocation({
        //         latitude: locationUpdate.latitude,
        //         longitude: locationUpdate.longitude,
        //     });

        //     console.log('✅ [TRACKING] Location state updated successfully');
        //     console.log('📍 [TRACKING] New Location:', {
        //         latitude: locationUpdate.latitude,
        //         longitude: locationUpdate.longitude
        //     });

        //     // TODO: Animate marker on map if map component exists
        //     // This would be handled by the map component when we integrate it
        // });

        console.log('✅ [TRACKING] Pusher subscription setup complete');
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchActiveTripAndLocation();
    };

    const statuses = [
        { id: 0, label: t('status_load_accepted'), date: 'Fri, 10th Feb', sub: t('desc_load_accepted') },
        { id: 1, label: t('status_vehicle_assigned'), date: 'Fri, 10th Feb - 11:00 AM', sub: t('desc_vehicle_assigned') },
        { id: 2, label: t('status_reached_pickup'), date: 'Fri, 10th Feb - 2:00 PM', sub: t('desc_reached_pickup') },
        { id: 3, label: t('status_loaded'), date: 'Fri, 10th Feb - 4:30 PM', sub: t('desc_loaded') },
        { id: 4, label: t('status_in_transit'), date: t('expected_tomorrow'), sub: t('desc_in_transit') },
        { id: 5, label: t('status_reached_destination'), date: '--', sub: t('desc_reached_destination') },
        { id: 6, label: t('status_delivered'), date: '--', sub: t('desc_delivered') },
    ];

    const callAgent = () => {
        if (trip.trackingAgent?.phone) {
            const url = `tel:${trip.trackingAgent.phone}`;
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert(t('error_title'), t('unable_to_open_dialer'));
                }
            });
        }
    };

    const callDriver = () => {
        if (trip.driver?.phone) {
            const url = `tel:${trip.driver.phone}`;
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert(t('error_title'), t('unable_to_open_dialer'));
                }
            });
        }
    };

    const downloadBility = () => {
        if (trip.builty_path) {
            const url = `${BASE_URL}public/${trip.builty_path}`;
            console.log('📥 [BUILTY] Downloading from:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [BUILTY] Error opening URL:', err);
                showToast('Failed to open builty document');
            });
        } else {
            showToast('Bility document not available');
        }
    };

    const downloadPOD = () => {
        if (trip.pod_path) {
            const url = `${BASE_URL}public/${trip.pod_path}`;
            console.log('📥 [POD] Downloading from:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [POD] Error opening URL:', err);
                showToast('Failed to open POD document');
            });
        } else {
            showToast('POD document not available');
        }
    };

    const openMaps = () => {
        const pickupLat = trip.origin_lat || trip.source_lat;
        const pickupLng = trip.origin_lon || trip.source_lng;
        const destLat = trip.destination_lat;
        const destLng = trip.destination_lon || trip.destination_lng;

        // Use current GPS location as origin, fallback to pickup
        const originLat = currentLocation?.latitude || pickupLat;
        const originLng = currentLocation?.longitude || pickupLng;

        console.log('🗺️ [NAVIGATION] Opening Google Maps');
        console.log('🗺️ [NAVIGATION] Origin (current):', originLat, originLng);
        console.log('🗺️ [NAVIGATION] Pickup:', pickupLat, pickupLng);
        console.log('🗺️ [NAVIGATION] Destination:', destLat, destLng);

        if (destLat && destLng) {
            // Build URL: current location → pickup (waypoint) → destination
            let url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;

            // Add pickup as a waypoint if we have pickup coordinates
            if (pickupLat && pickupLng) {
                url += `&waypoints=${pickupLat},${pickupLng}`;
            }

            console.log('🗺️ [NAVIGATION] URL:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [NAVIGATION] Error opening maps:', err);
                showToast('Unable to open maps');
            });
        } else if (trip.destination && trip.destination !== 'Loading...') {
            // Fallback: use address strings
            let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination)}&travelmode=driving`;
            if (trip.origin && trip.origin !== 'Loading...' && trip.origin !== 'Unknown') {
                url += `&waypoints=${encodeURIComponent(trip.origin)}`;
            }
            console.log('🗺️ [NAVIGATION] Using address fallback URL:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [NAVIGATION] Error opening maps:', err);
                showToast('Unable to open maps');
            });
        } else {
            showToast('Destination coordinates not available');
        }
    };

    // Decode Google Maps encoded polyline to extract coordinates
    const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
        const points: { latitude: number; longitude: number }[] = [];
        let index = 0, lat = 0, lng = 0;
        while (index < encoded.length) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lat += (result & 1) ? ~(result >> 1) : (result >> 1);

            shift = 0; result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lng += (result & 1) ? ~(result >> 1) : (result >> 1);

            points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
        }
        return points;
    };

    const toNumberOrNaN = (value: any): number => {
        const num = typeof value === 'number' ? value : parseFloat(value);
        return Number.isFinite(num) ? num : NaN;
    };

    const selectRouteByIndex = (index: number) => {
        const route = availableRoutes[index];
        const points = decodedRoutes[index] || [];
        setSelectedRouteIndex(index);
        if (route) {
            setSelectedTripRoute(route);
            setSelectedTripRoutePoints(points);
            console.log('🛣️ [ROUTE SELECT] Selected route index:', index);
            console.log('🛣️ [ROUTE SELECT] Selected route summary:', route?.summary);
            console.log('🛣️ [ROUTE SELECT] Encoded polyline:', route?.overview_polyline?.points);
            console.log('🛣️ [ROUTE SELECT] Decoded polyline points:', JSON.stringify(points));
        }
    };

    // Fetch alternative routes from Google Directions API
    const fetchAvailableRoutes = async () => {
        try {
            setFetchingRoutes(true);
            setAvailableRoutes([]);
            setDecodedRoutes([]);
            setSelectedRouteIndex(null);

            const originLat = trip.origin_lat || trip.source_lat;
            const originLng = trip.origin_lon || trip.source_lng;
            const destLat = trip.destination_lat;
            const destLng = trip.destination_lon || trip.destination_lng;

            if (!originLat || !originLng || !destLat || !destLng) {
                showToast(t('route_coordinates_missing') || 'Origin or destination coordinates missing');
                return;
            }

            console.log('🗺️ [ROUTES] Fetching routes...');
            console.log('🗺️ [ROUTES] Origin:', originLat, originLng);
            console.log('🗺️ [ROUTES] Destination:', destLat, destLng);

            const response = await fetchDirections(
                { latitude: parseFloat(originLat), longitude: parseFloat(originLng) },
                { latitude: parseFloat(destLat), longitude: parseFloat(destLng) },
                true
            );

            console.log('🗺️ [ROUTES] API Response status:', response.data?.status);

            if (response.data?.status === 'OK' && response.data?.routes?.length > 0) {
                const routes = response.data.routes;
                console.log(`🗺️ [ROUTES] Found ${routes.length} route(s)`);

                const decoded: { latitude: number; longitude: number }[][] = [];
                routes.forEach((route: any, i: number) => {
                    const leg = route.legs?.[0];
                    console.log(`  Route ${i + 1}: ${route.summary} - ${leg?.distance?.text} - ${leg?.duration?.text}`);
                    const polyline = route.overview_polyline?.points;
                    decoded.push(polyline ? decodePolyline(polyline) : []);
                });

                setAvailableRoutes(routes);
                setDecodedRoutes(decoded);
                setSelectedTripRoute(null);
                setSelectedTripRoutePoints([]);

                // Fit map to show all routes after a short delay
                setTimeout(() => {
                    if (routeMapRef.current && decoded.length > 0) {
                        const allPoints = decoded.flat();
                        if (allPoints.length > 0) {
                            routeMapRef.current.fitToCoordinates(allPoints, {
                                edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
                                animated: true,
                            });
                        }
                    }
                }, 500);
            } else {
                console.warn('⚠️ [ROUTES] No routes found or API error:', response.data?.status);
                showToast(t('no_routes_found') || 'Could not fetch routes');
            }
        } catch (error) {
            console.error('❌ [ROUTES] Error fetching routes:', error);
            showToast(t('route_fetch_failed') || 'Failed to fetch routes');
        } finally {
            setFetchingRoutes(false);
        }
    };

    // Open Google Maps with strict 2-leg flow:
    // current location -> pickup(origin) -> destination
    const openMapsWithSelectedRoute = (route: any) => {
        const pickupLat = trip.origin_lat || trip.source_lat;
        const pickupLng = trip.origin_lon || trip.source_lng;
        const destLat = trip.destination_lat;
        const destLng = trip.destination_lon || trip.destination_lng;

        if (!pickupLat || !pickupLng || !destLat || !destLng) {
            showToast(t('route_coordinates_missing') || 'Location data missing');
            return;
        }

        const navOriginLat = currentLocation?.latitude || pickupLat;
        const navOriginLng = currentLocation?.longitude || pickupLng;
        const selectedPolyline = route?.overview_polyline?.points;
        const selectedPoints =
            selectedTripRoutePoints.length > 0
                ? selectedTripRoutePoints
                : (selectedPolyline ? decodePolyline(selectedPolyline) : []);

        // Keep flow: current -> pickup -> destination.
        // To force the chosen alternative, add non-stop "via:" shaping points
        // only on the pickup->destination leg.
        const shapingViaPoints: string[] = [];
        if (selectedPoints.length > 8) {
            const total = selectedPoints.length;
            const candidateIndexes = [
                Math.floor(total * 0.25),
                Math.floor(total * 0.5),
                Math.floor(total * 0.75),
            ];

            for (const idx of candidateIndexes) {
                const p = selectedPoints[idx];
                if (!p) continue;
                const distFromPickup = calculateDistance(
                    parseFloat(String(pickupLat)),
                    parseFloat(String(pickupLng)),
                    p.latitude,
                    p.longitude
                );
                const distFromDestination = calculateDistance(
                    parseFloat(String(destLat)),
                    parseFloat(String(destLng)),
                    p.latitude,
                    p.longitude
                );
                // Avoid points too close to pickup/destination to reduce rerouting noise.
                if (distFromPickup > 800 && distFromDestination > 800) {
                    shapingViaPoints.push(`via:${p.latitude},${p.longitude}`);
                }
            }
        }

        const allWaypoints = [`${pickupLat},${pickupLng}`, ...shapingViaPoints];
        const waypointParam = `&waypoints=${encodeURIComponent(allWaypoints.join('|'))}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${navOriginLat},${navOriginLng}&destination=${destLat},${destLng}${waypointParam}&travelmode=driving`;

        console.log('🧭 [NAVIGATION FLOW] Current -> Pickup -> Destination');
        console.log('🧭 [NAVIGATION FLOW] Current:', navOriginLat, navOriginLng);
        console.log('🧭 [NAVIGATION FLOW] Pickup:', pickupLat, pickupLng);
        console.log('🧭 [NAVIGATION FLOW] Destination:', destLat, destLng);
        console.log('🧭 [NAVIGATION FLOW] Selected route shaping via points:', shapingViaPoints);

        Linking.openURL(url).catch(err => {
            console.error('❌ [NAVIGATION] Error opening maps:', err);
            showToast(t('unable_to_open_maps') || 'Unable to open maps');
        });
    };

    // Handle route selection and start trip
    const handleRouteSelectAndStartTrip = async () => {
        if (selectedRouteIndex === null) {
            showToast(t('select_route_first') || 'Please select a route first');
            return;
        }
        const selectedRoute = availableRoutes[selectedRouteIndex];
        const selectedPoints = decodedRoutes[selectedRouteIndex] || [];
        if (!selectedRoute) {
            showToast(t('select_route_first') || 'Please select a route first');
            return;
        }

        // Persist selected route for Shipping Route "Navigate" button
        setSelectedTripRoute(selectedRoute);
        setSelectedTripRoutePoints(selectedPoints);
        console.log('🛣️ [START TRIP] Selected route polyline (encoded):', selectedRoute?.overview_polyline?.points);
        console.log('🛣️ [START TRIP] Selected route polyline points:', JSON.stringify(selectedPoints));

        const leg = selectedRoute?.legs?.[0];
        const tripId = trip.trip_id || null;
        const driverId = trip.driver_id || user?.id;
        const loadId = toNumberOrNaN(trip.id || trip.load_id);

        const sourceLat = toNumberOrNaN(
            trip.origin_lat ??
            trip.source_lat ??
            leg?.start_location?.lat ??
            selectedPoints?.[0]?.latitude
        );
        const sourceLng = toNumberOrNaN(
            trip.origin_lon ??
            trip.source_lng ??
            leg?.start_location?.lng ??
            selectedPoints?.[0]?.longitude
        );
        const destinationLat = toNumberOrNaN(
            trip.destination_lat ??
            leg?.end_location?.lat ??
            selectedPoints?.[selectedPoints.length - 1]?.latitude
        );
        const destinationLng = toNumberOrNaN(
            trip.destination_lon ??
            trip.destination_lng ??
            leg?.end_location?.lng ??
            selectedPoints?.[selectedPoints.length - 1]?.longitude
        );

        if (!driverId || Number.isNaN(loadId) || Number.isNaN(sourceLat) || Number.isNaN(sourceLng) || Number.isNaN(destinationLat) || Number.isNaN(destinationLng)) {
            showToast('Missing route data. Please select route again.');
            return;
        }

        const saveRoutePayload = {
            trip_id: tripId,
            load_id: loadId,
            driver_id: driverId,
            route_index: selectedRouteIndex + 1,
            route_summary: selectedRoute?.summary || '',
            distance_meters: leg?.distance?.value || 0,
            distance_text: leg?.distance?.text || '',
            duration_seconds: leg?.duration?.value || 0,
            duration_text: leg?.duration?.text || '',
            encoded_polyline: selectedRoute?.overview_polyline?.points || '',
            decoded_polyline_points: selectedPoints,
            source_lat: sourceLat,
            source_lng: sourceLng,
            destination_lat: destinationLat,
            destination_lng: destinationLng,
        };

        console.log('📤 [ROUTE SAVE] Payload:', JSON.stringify(saveRoutePayload, null, 2));
        try {
            const saveRouteResponse = await axiosInstance.post(END_POINTS.TRIP_SAVE_SELECTED_ROUTE, saveRoutePayload);
            console.log('📥 [ROUTE SAVE] Response:', JSON.stringify(saveRouteResponse.data, null, 2));
            if (!(saveRouteResponse.data?.status === true || saveRouteResponse.data?.status === 'success')) {
                showToast(saveRouteResponse.data?.message || 'Failed to save selected route');
                return;
            }
        } catch (error: any) {
            console.error('❌ [ROUTE SAVE] Error:', error?.response?.data || error);
            showToast(error?.response?.data?.message || 'Failed to save selected route');
            return;
        }

        setShowRouteModal(false);

        // Call start trip API
        await handleStartTrip();

        // Open Google Maps with the selected route
        if (selectedRoute) {
            openMapsWithSelectedRoute(selectedRoute);
        }
    };

    // Format duration text for display
    const formatRouteDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins} min`;
    };

    // Start trip API call (same as Trucker ActiveTrip)
    const handleStartTrip = async () => {
        try {
            setStartingTrip(true);
            console.log('🚀 [START TRIP] Starting trip...');

            const driverId = trip.driver_id || user?.id;
            if (!driverId) {
                showToast(t('driver_info_unavailable'));
                return;
            }

            const routeLeg = selectedTripRoute?.legs?.[0];
            const sourceLat = toNumberOrNaN(
                trip.origin_lat ??
                trip.source_lat ??
                routeLeg?.start_location?.lat ??
                selectedTripRoutePoints?.[0]?.latitude
            );
            const sourceLng = toNumberOrNaN(
                trip.origin_lon ??
                trip.source_lng ??
                routeLeg?.start_location?.lng ??
                selectedTripRoutePoints?.[0]?.longitude
            );
            const destinationLat = toNumberOrNaN(
                trip.destination_lat ??
                routeLeg?.end_location?.lat ??
                selectedTripRoutePoints?.[selectedTripRoutePoints.length - 1]?.latitude
            );
            const destinationLng = toNumberOrNaN(
                trip.destination_lon ??
                trip.destination_lng ??
                routeLeg?.end_location?.lng ??
                selectedTripRoutePoints?.[selectedTripRoutePoints.length - 1]?.longitude
            );
            const loadId = toNumberOrNaN(trip.id || trip.load_id);

            if (Number.isNaN(sourceLat) || Number.isNaN(sourceLng) || Number.isNaN(destinationLat) || Number.isNaN(destinationLng)) {
                showToast(t('trip_coordinates_unavailable'));
                return;
            }
            if (Number.isNaN(loadId)) {
                showToast('Load information not available. Please refresh and try again.');
                return;
            }

            const payload = {
                driver_id: driverId,
                load_id: loadId,
                source_lat: sourceLat,
                source_lng: sourceLng,
                destination_lat: destinationLat,
                destination_lng: destinationLng,
            };

            console.log('📤 [START TRIP] Payload:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_START_TRIP, payload);

            console.log('📥 [START TRIP] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === true || response.data?.status === 'success') {
                console.log('✅ [START TRIP] Trip started successfully');

                setTrip((prev: any) => ({
                    ...prev,
                    trip_started: true,
                }));

                showToast(response.data?.message || t('trip_started_success'));
                await fetchActiveTripAndLocation();
            } else {
                console.log('⚠️ [START TRIP] Failed:', response.data?.message);
                showToast(response.data?.message || t('trip_start_failed'));
            }
        } catch (error: any) {
            console.error('❌ [START TRIP] Error:', error);
            showToast(error?.response?.data?.message || t('trip_start_failed'));
        } finally {
            setStartingTrip(false);
        }
    };

    // Get next action button text based on current status
    const getNextActionText = () => {
        if (currentStatus >= 6) return t('completed');
        if (currentStatus === 1 && !trip.trip_started) {
            return t('start_trip');
        }
        if (currentStatus === 1 && trip.trip_started) {
            return `${t('mark_as')} ${statuses[2]?.label}`;
        }
        const nextStatus = statuses[currentStatus + 1];
        return `${t('mark_as')} ${nextStatus?.label || 'Next Status'}`;
    };

    // Get current coordinates helper
    const getCurrentCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            BackgroundGeolocation.getCurrentPosition({
                samples: 1,
                persist: false,
                timeout: 30,
                maximumAge: 60000
            }).then((location) => {
                resolve({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }).catch((error) => {
                console.error('Error getting location:', error);
                reject(error);
            });
        });
    };

    // Update status with API
    const updateStatusWithAPI = async (newStatusCode: number) => {
        try {
            setUpdatingStatus(true);

            console.log(`🔄 [STATUS UPDATE] Updating status to code ${newStatusCode} (${statuses[newStatusCode].label})`);

            // Get current location
            let latitude = 0;
            let longitude = 0;

            try {
                const location = await getCurrentCoordinates();
                latitude = location.latitude;
                longitude = location.longitude;
                console.log('📍 [STATUS UPDATE] Got coordinates:', { latitude, longitude });
            } catch (locationError) {
                console.warn('⚠️ [STATUS UPDATE] Could not get location, using default (0,0):', locationError);
            }

            // Format timestamp for MySQL (YYYY-MM-DD HH:MM:SS)
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

            const payload = {
                load_id: trip.id,
                status_code: newStatusCode,
                timestamp,
                latitude,
                longitude,
            };

            console.log('📤 [STATUS UPDATE] Sending status update:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_STATUS, payload);

            console.log('📥 [STATUS UPDATE] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [STATUS UPDATE] Status updated successfully');
                setCurrentStatus(newStatusCode);
                showToast(`${t('status_updated_success')} "${statuses[newStatusCode].label}"`);

                // Refresh tracking data
                await fetchActiveTripAndLocation();
            } else {
                console.log('⚠️ [STATUS UPDATE] Failed:', response.data?.message);
                showToast(response.data?.message || t('status_update_failed'));
            }
        } catch (error) {
            console.error('❌ [STATUS UPDATE] Error:', error);
            showToast('Failed to update status. Please try again.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Handle status update button click
    const updateStatus = () => {
        // For status 1 (Vehicle Assigned)
        if (currentStatus === 1) {
            if (!trip.trip_started) {
                // Start Trip → show route selection, then call start trip API
                setShowRouteModal(true);
                fetchAvailableRoutes();
            } else {
                // Trip already started → move to Reached Pickup
                setPendingStatusUpdate(2);
                setShowConfirmModal(true);
            }
            return;
        }

        // For status 3 (Loaded) → need builty before moving to In Transit
        if (currentStatus === 3) {
            setShowBilityModal(true);
            return;
        }

        // For status 5 (Reached Destination) → need POD before marking as Delivered
        if (currentStatus === 5) {
            setShowPODModal(true);
            return;
        }

        // For other status updates, show confirmation modal
        if (currentStatus < 6) {
            setPendingStatusUpdate(currentStatus + 1);
            setShowConfirmModal(true);
        }
    };

    // Confirm status update
    const confirmStatusUpdate = async () => {
        if (pendingStatusUpdate !== null) {
            setShowConfirmModal(false);
            await updateStatusWithAPI(pendingStatusUpdate);
            setPendingStatusUpdate(null);
        }
    };

    // POD Upload Handlers
    const handlePODPick = async () => {
        try {
            const [file] = await pick({
                type: ['*/*'],
                copyTo: 'cachesDirectory',
            });

            if (file) {
                setPodFile(file);
                console.log('📄 [POD] File selected:', file.name);
            }
        } catch (error: any) {
            if (error?.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('❌ [POD] Error picking document:', error);
                showToast('Failed to pick document');
            }
        }
    };

    const handlePODCamera = async () => {
        try {
            const hasPermission = await requestCameraPermission();

            if (!hasPermission) {
                showToast('Camera permission is required to take photos');
                return;
            }

            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setPodFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `POD_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('📷 [POD] Photo captured:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [POD] Error capturing photo:', error);
            showToast('Failed to capture photo');
        }
    };

    const handlePODGallery = async () => {
        try {
            const hasPermission = await requestPhotoLibraryPermission();

            if (!hasPermission) {
                showToast('Photo library permission is required to select images');
                return;
            }

            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setPodFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `POD_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('🖼️ [POD] Image selected from gallery:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [POD] Error selecting from gallery:', error);
            showToast('Failed to select image');
        }
    };

    const handlePODUpload = async () => {
        if (!podFile) {
            showToast(t('select_pod_error'));
            return;
        }

        try {
            setUploadingPOD(true);
            console.log('📦 [POD UPLOAD] Starting POD upload...');
            console.log('📦 [POD UPLOAD] Trip data:', {
                id: trip.id,
                load_id: trip.load_id,
                trucker_id: trip.trucker_id,
                shipper_id: trip.shipper_id
            });

            const formData = new FormData();
            formData.append('load_id', trip.id); // Use numeric ID, not string load_id
            formData.append('shipper_id', trip.shipper_id);
            formData.append('trucker_id', trip.trucker_id);
            formData.append('pod', {
                uri: podFile.fileCopyUri || podFile.uri,
                type: podFile.type,
                name: podFile.name,
            });

            console.log('📤 [POD UPLOAD] Uploading POD with numeric IDs...');
            console.log('📤 [POD UPLOAD] load_id (numeric):', trip.id);
            console.log('📤 [POD UPLOAD] shipper_id:', trip.shipper_id);
            console.log('📤 [POD UPLOAD] trucker_id:', trip.trucker_id);

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPLOAD_POD, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('📥 [POD UPLOAD] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [POD UPLOAD] POD uploaded successfully');

                // Get current location
                let latitude = 0;
                let longitude = 0;

                try {
                    const location = await getCurrentCoordinates();
                    latitude = location.latitude;
                    longitude = location.longitude;
                    console.log('📍 [POD UPLOAD] Got coordinates:', { latitude, longitude });
                } catch (locationError) {
                    console.warn('⚠️ [POD UPLOAD] Could not get location, using default (0,0):', locationError);
                }

                // Format timestamp for MySQL (YYYY-MM-DD HH:MM:SS)
                const now = new Date();
                const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

                const statusPayload = {
                    load_id: trip.id,
                    status_code: 6, // Delivered status
                    timestamp,
                    latitude,
                    longitude,
                };

                console.log('📤 [POD UPLOAD] Updating status to Delivered:', JSON.stringify(statusPayload, null, 2));

                const statusResponse = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_STATUS, statusPayload);

                console.log('📥 [POD UPLOAD] Status update response:', JSON.stringify(statusResponse.data, null, 2));

                if (statusResponse.data?.status === 'success') {
                    console.log('✅ [POD UPLOAD] Status updated to Delivered');

                    // Now complete the trip
                    console.log('🏁 [TRIP COMPLETE] Completing trip...');

                    const completePayload = {
                        trip_id: trip.trip_id,
                        driver_id: user.id,
                    };

                    console.log('📤 [TRIP COMPLETE] Payload:', JSON.stringify(completePayload, null, 2));

                    const completeResponse = await axiosInstance.post(END_POINTS.TRIP_COMPLETE, completePayload);

                    console.log('📥 [TRIP COMPLETE] Response:', JSON.stringify(completeResponse.data, null, 2));

                    if (completeResponse.data?.status === true || completeResponse.data?.status === 'success') {
                        console.log('✅ [TRIP COMPLETE] Trip completed successfully');
                        setShowPODModal(false);
                        setPodFile(null);
                        setCurrentStatus(6);

                        // Fetch latest tracking data
                        await fetchActiveTripAndLocation();

                        showToast(t('pod_trip_complete_success'));
                    } else {
                        console.log('⚠️ [TRIP COMPLETE] Failed:', completeResponse.data?.message);
                        showToast(t('trip_complete_failed'));
                    }
                } else {
                    console.log('⚠️ [POD UPLOAD] Status update failed:', statusResponse.data?.message);
                    showToast(t('pod_upload_status_failed'));
                }
            } else {
                console.log('⚠️ [POD UPLOAD] Upload failed:', response.data?.message);
                showToast(response.data?.message || t('pod_upload_failed'));
            }
        } catch (error: any) {
            console.error('❌ [POD UPLOAD] Error:', error);
            console.error('❌ [POD UPLOAD] Error response:', error?.response?.data);
            showToast('Failed to upload POD. Please try again');
        } finally {
            setUploadingPOD(false);
        }
    };

    // Bility Upload Handlers
    const handleBilityPick = async () => {
        try {
            const [file] = await pick({
                type: ['image/*'],
                copyTo: 'cachesDirectory',
            });

            if (file) {
                setBilityFile(file);
                console.log('📄 [BUILTY] File selected:', file.name);
            }
        } catch (error: any) {
            if (error?.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('❌ [BUILTY] Error picking document:', error);
                showToast('Failed to pick document');
            }
        }
    };

    const handleBilityCamera = async () => {
        try {
            const hasPermission = await requestCameraPermission();

            if (!hasPermission) {
                showToast('Camera permission is required to take photos');
                return;
            }

            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setBilityFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `Bility_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('📷 [BUILTY] Photo captured:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [BUILTY] Error capturing photo:', error);
            showToast('Failed to capture photo');
        }
    };

    const handleBilityGallery = async () => {
        try {
            const hasPermission = await requestPhotoLibraryPermission();

            if (!hasPermission) {
                showToast('Photo library permission is required to select images');
                return;
            }

            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setBilityFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `Bility_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('🖼️ [BUILTY] Image selected from gallery:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [BUILTY] Error selecting from gallery:', error);
            showToast('Failed to select image');
        }
    };

    const handleBilityUpload = async () => {
        if (!builtyFile) {
            showToast(t('select_builty_error'));
            return;
        }

        try {
            setUploadingBility(true);
            console.log('📤 [BUILTY] Verifying and Uploading builty document...');

            // --- EWB OCR Verification Block ---
            let tempOcrFilePath: string | null = null;
            try {
                let uri = builtyFile.fileCopyUri || builtyFile.uri;
                if (!uri) throw new Error('No URI found');

                console.log('🔍 [BUILTY OCR] Original URI:', uri);

                // ML Kit TextRecognition requires a file:// URI.
                // On Android, camera/gallery/document-picker may return content:// URIs
                // which ML Kit cannot read. We need to copy the file to a local path first.
                if (Platform.OS === 'android' && uri.startsWith('content://')) {
                    console.log('🔍 [BUILTY OCR] content:// URI detected, copying to temp file...');
                    const destPath = `${RNFS.CachesDirectoryPath}/builty_ocr_temp_${Date.now()}.jpg`;
                    await RNFS.copyFile(uri, destPath);
                    uri = `file://${destPath}`;
                    tempOcrFilePath = destPath;
                    console.log('🔍 [BUILTY OCR] Copied to file:// URI:', uri);
                } else if (!uri.startsWith('file://') && !uri.startsWith('/')) {
                    // If it's some other scheme, try copying
                    console.log('🔍 [BUILTY OCR] Non-file URI detected, copying to temp file...');
                    const destPath = `${RNFS.CachesDirectoryPath}/builty_ocr_temp_${Date.now()}.jpg`;
                    await RNFS.copyFile(uri, destPath);
                    uri = `file://${destPath}`;
                    tempOcrFilePath = destPath;
                    console.log('🔍 [BUILTY OCR] Copied to file:// URI:', uri);
                } else if (uri.startsWith('/')) {
                    // Absolute path without file:// prefix — add it
                    uri = `file://${uri}`;
                    console.log('🔍 [BUILTY OCR] Added file:// prefix:', uri);
                }

                console.log('🔍 [BUILTY OCR] Final OCR URI:', uri);
                showToast('Scanning Document for EWB No...');

                // Step 1: Scan QR / Extract text
                const result = await TextRecognition.recognize(uri);
                console.log('🔍 [BUILTY OCR] Raw OCR Result:', JSON.stringify(result, null, 2));

                const extractedText = result?.text || '';
                console.log('🔍 [BUILTY OCR] Extracted Text:', extractedText);

                // Step 2 & 3: Extract EWB No and Basic Format Validation (12 Digits)
                const ewbMatch = extractedText.match(/\b\d{12}\b/);
                if (!ewbMatch) {
                    console.log('⚠️ [BUILTY OCR] No 12-digit EWB numeric match found in extracted text.');
                    showToast('EWB Number not found or invalid format. Please upload a valid Bility.');
                    setUploadingBility(false);
                    return;
                }
                const ewbNo = ewbMatch[0];
                console.log('✅ [BUILTY OCR] Found EWB Match:', ewbNo);
                showToast(`Found EWB: ${ewbNo}. Verifying...`);

                // Step 4, 5, 6: Send EWB No to backend to check expiry/validity via NIC API
                const verifyPayload = {
                    ewb_no: ewbNo,
                    load_id: trip.id || trip.load_id
                };

                const verifyResponse = await axiosInstance.post(END_POINTS.TRUCKER_VERIFY_EWB, verifyPayload);
                if (verifyResponse.data?.status === 'success' || verifyResponse.data?.status === true) {
                    // Step 7: Show status to user
                    showToast('E-Way Bill Verified Successfully. Uploading...');
                } else {
                    showToast(verifyResponse.data?.message || 'E-Way Bill Verification Failed! Invalid/Fake Bility.');
                    setUploadingBility(false);
                    return; // Stop upload if fake
                }
            } catch (ocrError) {
                console.warn('❌ [BUILTY OCR] Error:', ocrError);
                showToast('Failed to scan document. Please try a clearer image or valid EWB.');
                setUploadingBility(false);
                return;
            } finally {
                // Clean up temp OCR file
                if (tempOcrFilePath) {
                    try {
                        await RNFS.unlink(tempOcrFilePath);
                        console.log('🧹 [BUILTY OCR] Cleaned up temp file:', tempOcrFilePath);
                    } catch (cleanupErr) {
                        console.warn('⚠️ [BUILTY OCR] Failed to clean up temp file:', cleanupErr);
                    }
                }
            }
            // --- End EWB OCR Verification Block ---

            console.log('📤 [BUILTY] Trip data:', {
                id: trip.id,
                load_id: trip.load_id,
                trucker_id: trip.trucker_id,
                shipper_id: trip.shipper_id
            });

            const formData = new FormData();
            formData.append('load_id', trip.id); // Use numeric ID, not string load_id
            formData.append('shipper_id', trip.shipper_id);
            formData.append('trucker_id', trip.trucker_id);
            formData.append('builty', {
                uri: builtyFile.fileCopyUri || builtyFile.uri,
                type: builtyFile.type,
                name: builtyFile.name,
            });

            console.log('📤 [BUILTY] Uploading with numeric IDs...');
            console.log('📤 [BUILTY] load_id (numeric):', trip.id);
            console.log('📤 [BUILTY] shipper_id:', trip.shipper_id);
            console.log('📤 [BUILTY] trucker_id:', trip.trucker_id);

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPLOAD_BUILTY, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('📥 [BUILTY] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [BUILTY] Bility uploaded successfully');
                setShowBilityModal(false);
                setBilityFile(null);

                // Now update status to In Transit (status 4)
                await updateStatusWithAPI(4);
            } else {
                console.log('⚠️ [BUILTY] Upload failed:', response.data?.message);
                showToast(response.data?.message || t('builty_upload_failed'));
            }
        } catch (error: any) {
            console.error('❌ [BUILTY] Error uploading:', error);
            console.error('❌ [BUILTY] Error response:', error?.response?.data);
            showToast('Failed to upload builty. Please try again');
        } finally {
            setUploadingBility(false);
        }
    };

    // Render Timeline Item
    const renderTimelineItem = (item: any, index: number) => {
        const isActive = index <= currentStatus;
        const isLast = index === statuses.length - 1;

        return (
            <View key={item.id} style={styles.timelineRow}>
                {/* Graphics Column */}
                <View style={styles.timelineGraphics}>
                    <View style={styles.dotContainer}>
                        {isActive ? (
                            <CheckCircle active={true} />
                        ) : (
                            <PendingCircle />
                        )}
                    </View>
                    {!isLast && (
                        <View style={[
                            styles.line,
                            { backgroundColor: index < currentStatus ? C.success : C.line }
                        ]} />
                    )}
                </View>

                {/* Content Column */}
                <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
                    <Text style={[styles.statusTitle, isActive && { color: C.text }]}>
                        {item.label}
                    </Text>
                    <Text style={styles.statusDate}>{isActive ? t('completed') : item.date}</Text>
                    {item.sub && <Text style={styles.statusSub}>{item.sub}</Text>}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackIcon />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Driver Tracking</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {/* Order ID Skeleton */}
                    <View style={styles.card}>
                        <View style={styles.orderIdRow}>
                            <SkeletonBox width={60} height={14} />
                            <SkeletonBox width={100} height={14} />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <SkeletonBox width={50} height={12} style={{ marginBottom: 8 }} />
                                <SkeletonBox width={80} height={14} />
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.summaryItem}>
                                <SkeletonBox width={50} height={12} style={{ marginBottom: 8 }} />
                                <SkeletonBox width={80} height={14} />
                            </View>
                        </View>
                    </View>

                    {/* Vehicle Info Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={140} height={14} style={{ marginBottom: 14 }} />
                        <SkeletonBox width="100%" height={14} style={{ marginBottom: 8 }} />
                        <SkeletonBox width="80%" height={14} />
                    </View>

                    {/* Shipping Details Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={120} height={14} style={{ marginBottom: 14 }} />
                        <SkeletonBox width="100%" height={60} style={{ marginBottom: 12 }} />
                        <SkeletonBox width="100%" height={60} />
                    </View>

                    {/* Timeline Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={100} height={14} style={{ marginBottom: 14 }} />
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={{ flexDirection: 'row', marginBottom: 20 }}>
                                <SkeletonBox width={16} height={16} style={{ marginRight: 12, borderRadius: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <SkeletonBox width="60%" height={13} style={{ marginBottom: 6 }} />
                                    <SkeletonBox width="40%" height={11} />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Contact Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={80} height={14} style={{ marginBottom: 14 }} />
                        <SkeletonBox width="100%" height={40} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Show blank screen with message when no data
    if (!hasData) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackIcon />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Driver Tracking</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.emptyScreenContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[C.primary]}
                            tintColor={C.primary}
                        />
                    }
                >
                    <View style={styles.emptyStateContainer}>
                        <LocationPinIcon color={C.textSec} />
                        <Text style={styles.emptyStateTitle}>{t('no_live_tracking')}</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            {t('no_active_trip')}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('driver_tracking_title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[C.primary]}
                        tintColor={C.primary}
                    />
                }
            >

                {/* Order ID & Basic Summary */}
                <View style={styles.card}>
                    <View style={styles.orderIdRow}>
                        <Text style={styles.orderIdLabel}>{t('load_id')}</Text>
                        <Text style={styles.orderIdValue}>{trip.load_id}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('vehicle_info')}</Text>
                            <Text style={styles.summaryValue}>{trip.vehicle}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        {/* <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('amount')}</Text>
                            <Text style={styles.summaryValue}>{trip.payment}</Text>
                        </View> */}
                    </View>
                </View>

                {/* Live Location Indicator */}
                {currentLocation && (
                    <View style={styles.card}>
                        <View style={styles.liveLocationHeader}>
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>{t('live_tracking')}</Text>
                            </View>
                        </View>
                        <Text style={styles.locationText}>
                            Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                        </Text>
                    </View>
                )}

                {/* Vehicle Information */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>{t('vehicle_information')}</Text>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, color: C.textSec }}>{t('vehicle_number_label')}</Text>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: C.text, marginTop: 2 }}>{trip.vehicle}</Text>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.contactRow} onPress={callDriver}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactName}>Driver Name: {trip.driver?.name || 'Unknown'}</Text>
                            <Text style={styles.contactPhone}>{trip.driver?.phone || 'No Phone'}</Text>
                        </View>
                        <PhoneIcon />
                    </TouchableOpacity>

                    {trip.driver?.dl ? (
                        <>
                            <View style={styles.divider} />
                            <View style={{ marginTop: 4 }}>
                                <Text style={{ fontSize: 13, color: C.textSec }}>Driving License</Text>
                                <Text style={{ fontSize: 15, fontWeight: '500', color: C.text, marginTop: 2 }}>{trip.driver.dl}</Text>
                            </View>
                        </>
                    ) : null}
                </View>

                {/* Shipping Details */}
                <View style={styles.card}>
                    <View style={styles.shippingHeader}>
                        <Text style={styles.sectionHeader}>{t('shipping_route')}</Text>
                        <TouchableOpacity
                            style={styles.colorTrackBtn}
                            onPress={() => setShowColorTrackingMap(true)}
                        >
                            <Text style={styles.colorTrackBtnText}>{t('live_color_tracking') || 'Live Color Tracking'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Modern Route Display */}
                    <View style={styles.routeContainer}>
                        {/* Origin */}
                        <View style={styles.routePoint}>
                            <View style={styles.routeIconContainer}>
                                <View style={styles.originDot} />
                            </View>
                            <View style={styles.routeContent}>
                                <Text style={styles.routeLabel}>{t('pickup_location')}</Text>
                                <Text style={styles.routeAddress}>{trip.origin}</Text>
                            </View>
                        </View>

                        {/* Connecting Line */}
                        <View style={styles.routeLine}>
                            <View style={styles.dottedLine} />
                        </View>

                        {/* Destination */}
                        <View style={styles.routePoint}>
                            <View style={styles.routeIconContainer}>
                                <LocationPinIcon color={C.primary} />
                            </View>
                            <View style={styles.routeContent}>
                                <Text style={styles.routeLabel}>{t('drop_location')}</Text>
                                <Text style={styles.routeAddress}>{trip.destination}</Text>
                                <TouchableOpacity style={styles.navigateBtnModern} onPress={openMaps}>
                                    <NavigationIcon color={C.surface} />
                                    <Text style={styles.navigateTextModern}>{t('navigate')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tracking Timeline */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>{t('load_status')}</Text>
                    <View style={styles.timelineContainer}>
                        {statuses.map(renderTimelineItem)}
                    </View>
                </View>

                {/* Documents Section */}
                {(trip.builty_path || trip.pod_path) && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeader}>{t('documents')}</Text>

                        {trip.builty_path && (
                            <TouchableOpacity style={styles.documentRow} onPress={downloadBility}>
                                <View style={styles.documentIconContainer}>
                                    <DocumentIcon />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.documentTitle}>{t('builty_document')}</Text>
                                    <Text style={styles.documentSubtitle}>{t('tap_to_view')}</Text>
                                </View>
                                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <Path d="M7 10l5 5 5-5" />
                                    <Path d="M12 15V3" />
                                </Svg>
                            </TouchableOpacity>
                        )}

                        {trip.pod_path && (
                            <TouchableOpacity style={[styles.documentRow, trip.builty_path && { marginTop: 12 }]} onPress={downloadPOD}>
                                <View style={styles.documentIconContainer}>
                                    <DocumentIcon />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.documentTitle}>{t('pod_document')}</Text>
                                    <Text style={styles.documentSubtitle}>{t('tap_to_view')}</Text>
                                </View>
                                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <Path d="M7 10l5 5 5-5" />
                                    <Path d="M12 15V3" />
                                </Svg>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Contacts Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>{t('need_help')}</Text>

                    <TouchableOpacity style={styles.contactRow} onPress={callAgent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactName}>{t('agent_label')} {trip.trackingAgent?.name}</Text>
                            <Text style={styles.contactPhone}>{trip.trackingAgent?.phone}</Text>
                        </View>
                        <PhoneIcon />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action Button */}
            {currentStatus < 6 && (
                <View style={styles.footer}>
                    {/* SIM Consent Pending - Show before Start Trip when pending */}
                    {currentStatus === 1 && !trip.trip_started && trip.sim_tracking_consent?.consent === 'PENDING' && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#F39C12', marginBottom: 10, flexDirection: 'column', paddingVertical: 8 }]}
                            onPress={() => fetchActiveTripAndLocation()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.actionButtonText}>
                                {t('consent_pending')} ({trip.sim_tracking_consent?.tel})
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                                {trip.sim_tracking_consent?.operator} • {t('tap_to_check_status')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            (updatingStatus || startingTrip || (currentStatus === 1 && !trip.trip_started && trip.sim_tracking_consent?.consent === 'PENDING')) && styles.actionButtonDisabled
                        ]}
                        onPress={updateStatus}
                        disabled={updatingStatus || startingTrip || (currentStatus === 1 && !trip.trip_started && trip.sim_tracking_consent?.consent === 'PENDING')}
                    >
                        {(updatingStatus || startingTrip) ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.actionButtonText}>
                                {getNextActionText()}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* POD Upload Modal */}
            <Modal visible={showPODModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('upload_pod_title')}</Text>
                        <Text style={styles.modalSubtitle}>{t('upload_pod_subtitle')}</Text>

                        {podFile ? (
                            <View style={styles.uploadPlaceholder}>
                                <DocumentIcon />
                                <Text style={styles.uploadText}>{podFile.name}</Text>
                                <Text style={styles.uploadSubtext}>
                                    {((podFile.size || 0) / 1024).toFixed(2)} KB
                                </Text>
                                <TouchableOpacity
                                    style={styles.changeFileBtn}
                                    onPress={() => setPodFile(null)}
                                >
                                    <Text style={styles.changeFileText}>{t('change_file')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptionsContainer}>
                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePODCamera}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <Circle cx="12" cy="13" r="4" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>{t('camera')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePODGallery}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Rect x="3" y="3" width="18" height="18" rx="2" />
                                        <Circle cx="8.5" cy="8.5" r="1.5" />
                                        <Path d="M21 15l-5-5L5 21" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>{t('gallery')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePODPick}>
                                    <DocumentIcon />
                                    <Text style={styles.uploadOptionText}>{t('document')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => {
                                    setShowPODModal(false);
                                    setPodFile(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmit, (uploadingPOD || !podFile) && styles.modalSubmitDisabled]}
                                onPress={handlePODUpload}
                                disabled={uploadingPOD || !podFile}
                            >
                                {uploadingPOD ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>{t('upload_complete')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bility Upload Modal */}
            <Modal visible={showBilityModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('upload_builty_title')}</Text>
                        <Text style={styles.modalSubtitle}>{t('upload_builty_subtitle')}</Text>

                        {builtyFile ? (
                            <View style={styles.uploadPlaceholder}>
                                <DocumentIcon />
                                <Text style={styles.uploadText}>{builtyFile.name}</Text>
                                <Text style={styles.uploadSubtext}>
                                    {((builtyFile.size || 0) / 1024).toFixed(2)} KB
                                </Text>
                                <TouchableOpacity
                                    style={styles.changeFileBtn}
                                    onPress={() => setBilityFile(null)}
                                >
                                    <Text style={styles.changeFileText}>{t('change_file')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptionsContainer}>
                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleBilityCamera}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <Circle cx="12" cy="13" r="4" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>{t('camera')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleBilityGallery}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Rect x="3" y="3" width="18" height="18" rx="2" />
                                        <Circle cx="8.5" cy="8.5" r="1.5" />
                                        <Path d="M21 15l-5-5L5 21" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>{t('gallery')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleBilityPick}>
                                    <DocumentIcon />
                                    <Text style={styles.uploadOptionText}>{t('document')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => {
                                    setShowBilityModal(false);
                                    setBilityFile(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmit, (uploadingBility || !builtyFile) && styles.modalSubmitDisabled]}
                                onPress={handleBilityUpload}
                                disabled={uploadingBility || !builtyFile}
                            >
                                {uploadingBility ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>{t('upload_continue')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Route Selection Modal - Full Screen with Map */}
            <Modal visible={showRouteModal} animationType="slide" transparent={false}>
                <View style={styles.routeModalContainer}>
                    {/* Map Section */}
                    <View style={styles.routeMapContainer}>
                        <MapView
                            ref={routeMapRef}
                            provider={PROVIDER_GOOGLE}
                            style={StyleSheet.absoluteFillObject}
                            initialRegion={{
                                latitude: parseFloat(trip.origin_lat || trip.source_lat || '28.6139'),
                                longitude: parseFloat(trip.origin_lon || trip.source_lng || '77.2090'),
                                latitudeDelta: 2,
                                longitudeDelta: 2,
                            }}
                            showsUserLocation
                            showsMyLocationButton={false}
                            mapType="standard"
                        >
                            {/* Draw all route polylines - unselected first, selected on top */}
                            {decodedRoutes.map((points, index) => {
                                if (index === selectedRouteIndex || points.length === 0) return null;
                                return (
                                    <Polyline
                                        key={`route-${index}`}
                                        coordinates={points}
                                        strokeColor={ROUTE_COLORS[index % ROUTE_COLORS.length] + '66'}
                                        strokeWidth={4}
                                        lineCap="round"
                                        lineJoin="round"
                                        tappable
                                        onPress={() => selectRouteByIndex(index)}
                                    />
                                );
                            })}
                            {/* Selected route drawn last so it's on top */}
                            {selectedRouteIndex !== null && decodedRoutes[selectedRouteIndex] && decodedRoutes[selectedRouteIndex].length > 0 && (
                                <Polyline
                                    coordinates={decodedRoutes[selectedRouteIndex]}
                                    strokeColor={ROUTE_COLORS[selectedRouteIndex % ROUTE_COLORS.length]}
                                    strokeWidth={6}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            )}

                            {/* Origin Marker */}
                            {trip.origin_lat && trip.origin_lon && (
                                <Marker
                                    coordinate={{
                                        latitude: parseFloat(trip.origin_lat),
                                        longitude: parseFloat(trip.origin_lon),
                                    }}
                                >
                                    <View style={styles.mapMarker}>
                                        <View style={[styles.mapMarkerInner, { backgroundColor: C.success }]}>
                                            <Text style={styles.mapMarkerText}>P</Text>
                                        </View>
                                    </View>
                                </Marker>
                            )}

                            {/* Destination Marker */}
                            {trip.destination_lat && trip.destination_lon && (
                                <Marker
                                    coordinate={{
                                        latitude: parseFloat(trip.destination_lat),
                                        longitude: parseFloat(trip.destination_lon),
                                    }}
                                >
                                    <View style={styles.mapMarker}>
                                        <View style={[styles.mapMarkerInner, { backgroundColor: '#000' }]}>
                                            <Text style={styles.mapMarkerText}>D</Text>
                                        </View>
                                    </View>
                                </Marker>
                            )}
                        </MapView>

                        {/* Back / Close button on map */}
                        <SafeAreaView style={styles.routeMapTopBar} edges={['top']}>
                            <TouchableOpacity
                                style={styles.routeMapBackBtn}
                                onPress={() => setShowRouteModal(false)}
                            >
                                <BackIcon />
                            </TouchableOpacity>
                            <View style={styles.routeMapTitleBadge}>
                                <Text style={styles.routeMapTitleText}>{t('choose_route_title')}</Text>
                            </View>
                        </SafeAreaView>

                        {/* Loading overlay on map */}
                        {fetchingRoutes && (
                            <View style={styles.routeMapLoading}>
                                <ActivityIndicator size="large" color={C.primary} />
                                <Text style={styles.routeMapLoadingText}>{t('fetching_routes')}</Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom Sheet - Route List */}
                    <View style={styles.routeBottomSheet}>
                        {availableRoutes.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.routeCardsScroll}
                                snapToInterval={width * 0.75 + 10}
                                decelerationRate="fast"
                            >
                                {availableRoutes.map((route: any, index: number) => {
                                    const leg = route.legs?.[0];
                                    const isSelected = selectedRouteIndex === index;
                                    const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.routeMapCard,
                                                isSelected && { borderColor: routeColor, borderWidth: 2.5 },
                                            ]}
                                            onPress={() => selectRouteByIndex(index)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.routeMapCardHeader}>
                                                <View style={[styles.routeColorDot, { backgroundColor: routeColor }]} />
                                                <Text style={[styles.routeMapCardName, isSelected && { color: C.text }]} numberOfLines={1}>
                                                    {route.summary || `${t('route')} ${index + 1}`}
                                                </Text>
                                                {index === 0 && (
                                                    <View style={styles.fastestBadge}>
                                                        <Text style={styles.fastestBadgeText}>{t('fastest_route')}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.routeMapCardStats}>
                                                <Text style={styles.routeMapCardStatValue}>{leg?.distance?.text || '--'}</Text>
                                                <View style={styles.routeDetailDivider} />
                                                <Text style={styles.routeMapCardStatValue}>{leg?.duration?.text || '--'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : !fetchingRoutes ? (
                            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                                <Text style={{ color: C.textSec, fontSize: 14 }}>{t('no_routes_found')}</Text>
                            </View>
                        ) : null}

                        <View style={styles.routeBottomActions}>
                            <TouchableOpacity
                                style={[
                                    styles.routeStartBtn,
                                    (fetchingRoutes || availableRoutes.length === 0 || selectedRouteIndex === null) && styles.actionButtonDisabled,
                                ]}
                                onPress={handleRouteSelectAndStartTrip}
                                disabled={fetchingRoutes || availableRoutes.length === 0 || selectedRouteIndex === null}
                            >
                                {startingTrip ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <NavigationIcon color={C.surface} />
                                        <Text style={styles.routeStartBtnText}>{t('start_trip')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Modal for Status Updates */}
            <Modal visible={showConfirmModal} animationType="fade" transparent>
                <View style={styles.confirmModalOverlay}>
                    <View style={styles.confirmModalContent}>
                        <View style={styles.confirmIconContainer}>
                            <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <Circle cx="12" cy="12" r="10" />
                                <Path d="M12 16v-4" />
                                <Path d="M12 8h.01" />
                            </Svg>
                        </View>
                        <Text style={styles.confirmTitle}>{t('update_status_title')}</Text>
                        <Text style={styles.confirmMessage}>
                            {t('update_status_message')} "{pendingStatusUpdate !== null ? statuses[pendingStatusUpdate].label : ''}"?
                        </Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.confirmCancelBtn}
                                onPress={() => {
                                    setShowConfirmModal(false);
                                    setPendingStatusUpdate(null);
                                }}
                            >
                                <Text style={styles.confirmCancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmOkBtn}
                                onPress={confirmStatusUpdate}
                            >
                                <Text style={styles.confirmOkText}>{t('confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ColorTrackingMap
                visible={showColorTrackingMap}
                onClose={() => setShowColorTrackingMap(false)}
                endpoint={END_POINTS.TRUCKER_TRACKING_DASHBOARD(trip.id)}
                selectedRoutePolyline={selectedTripRoute?.overview_polyline?.points}
                onVehicleDataUpdate={(data) => { vehicleColorDataRef.current = data; }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backButton: { padding: 4 },
    headerTitle: {
        flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: C.text,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 12 },
    emptyScreenContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.text,
        marginTop: 20,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: C.textSec,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Cards
    card: {
        backgroundColor: C.surface,
        borderRadius: 4,
        marginBottom: 10,
        padding: 16,
        borderWidth: 1, borderColor: '#EEE',
    },

    // Order ID Block
    orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    orderIdLabel: { fontSize: 14, color: C.textSec },
    orderIdValue: { fontSize: 14, fontWeight: '600', color: C.text },

    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
    verticalDivider: { width: 1, backgroundColor: '#EEE', height: '100%' },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: C.textSec, marginBottom: 4 },
    summaryValue: { fontSize: 14, fontWeight: '500', color: C.text },

    // Live Location
    liveLocationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFB74D',
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6F00',
        marginRight: 6,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FF6F00',
        letterSpacing: 0.5,
    },
    locationText: {
        fontSize: 13,
        color: C.text,
        fontFamily: 'monospace',
    },
    noTrackingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noTrackingText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
        marginTop: 12,
    },
    noTrackingSubtext: {
        fontSize: 12,
        color: C.textSec,
        marginTop: 4,
        textAlign: 'center',
    },

    // Section Headers
    sectionHeader: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 14 },

    // Shipping
    shippingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    colorTrackBtn: {
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    colorTrackBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: C.primary,
    },
    routeContainer: {
        paddingVertical: 4,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeIconContainer: {
        width: 32,
        alignItems: 'center',
        paddingTop: 2,
    },
    originDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: C.success,
        borderWidth: 3,
        borderColor: '#E8F5E9',
    },
    routeContent: {
        flex: 1,
        marginLeft: 12,
    },
    routeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: C.textSec,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    routeAddress: {
        fontSize: 14,
        color: C.text,
        lineHeight: 20,
        fontWeight: '500',
    },
    routeLine: {
        flexDirection: 'row',
        paddingLeft: 16,
        height: 32,
    },
    dottedLine: {
        width: 2,
        height: '100%',
        borderLeftWidth: 2,
        borderLeftColor: C.border,
        borderStyle: 'dashed',
    },
    navigateBtnModern: {
        marginTop: 10,
        alignSelf: 'flex-start',
        backgroundColor: C.primary,
        borderRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    navigateTextModern: {
        fontSize: 13,
        fontWeight: '600',
        color: C.surface,
    },

    // Timeline
    timelineContainer: { marginTop: 4 },
    timelineRow: { flexDirection: 'row' },
    timelineGraphics: { alignItems: 'center', width: 24, marginRight: 12 },
    dotContainer: { zIndex: 2, backgroundColor: C.surface },
    line: { width: 2, flex: 1, marginVertical: 4 },

    timelineContent: { flex: 1, paddingBottom: 24 },
    statusTitle: { fontSize: 13, fontWeight: '500', color: C.textSec },
    statusDate: { fontSize: 11, color: C.textSec, marginTop: 2 },
    statusSub: { fontSize: 11, color: '#999', marginTop: 2 },

    // Contacts
    contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    contactName: { fontSize: 14, color: C.text },
    contactPhone: { fontSize: 12, color: C.textSec, marginTop: 2 },

    // Documents
    documentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F5FF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#D0E0FF',
    },
    documentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    documentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
        marginBottom: 2,
    },
    documentSubtitle: {
        fontSize: 12,
        color: C.textSec,
    },

    // Footer Action Button
    footer: {
        backgroundColor: C.surface,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },
    actionButton: {
        backgroundColor: C.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    actionButtonDisabled: {
        backgroundColor: C.textSec,
        opacity: 0.6,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.surface,
    },

    // Confirmation Modal
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    confirmModalContent: {
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    confirmIconContainer: {
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 14,
        color: C.textSec,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmCancelBtn: {
        flex: 1,
        backgroundColor: C.border,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    confirmCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
    },
    confirmOkBtn: {
        flex: 1,
        backgroundColor: C.primary,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    confirmOkText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.surface,
    },

    // Upload Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: C.textSec,
        marginBottom: 20,
        lineHeight: 20,
    },
    uploadPlaceholder: {
        backgroundColor: '#F0F5FF',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: C.primary,
        borderStyle: 'dashed',
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
        marginTop: 12,
        textAlign: 'center',
    },
    uploadSubtext: {
        fontSize: 12,
        color: C.textSec,
        marginTop: 4,
    },
    changeFileBtn: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: C.surface,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
    },
    changeFileText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.primary,
    },
    uploadOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
        paddingVertical: 20,
    },
    uploadOptionBtn: {
        flex: 1,
        backgroundColor: '#F0F5FF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D0E0FF',
    },
    uploadOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.primary,
        marginTop: 8,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancel: {
        flex: 1,
        backgroundColor: C.border,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
    },
    modalSubmit: {
        flex: 1,
        backgroundColor: C.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalSubmitDisabled: {
        backgroundColor: C.textSec,
        opacity: 0.6,
    },
    modalSubmitText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.surface,
    },

    // Route Selection Modal (Full-Screen Map)
    routeModalContainer: {
        flex: 1,
        backgroundColor: C.surface,
    },
    routeMapContainer: {
        flex: 1,
    },
    routeMapTopBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    routeMapBackBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: C.surface,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    routeMapTitleBadge: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    routeMapTitleText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
        textAlign: 'center',
    },
    routeMapLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeMapLoadingText: {
        fontSize: 14,
        color: C.textSec,
        marginTop: 12,
        fontWeight: '500',
    },
    mapMarker: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapMarkerInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        elevation: 6,
    },
    mapMarkerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    routeBottomSheet: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    routeCardsScroll: {
        paddingHorizontal: 16,
        gap: 10,
    },
    routeMapCard: {
        width: width * 0.75,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: C.border,
    },
    routeMapCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    routeColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    routeMapCardName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: C.textSec,
    },
    routeMapCardStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    routeMapCardStatValue: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
    },
    routeDetailDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: C.border,
        marginHorizontal: 6,
    },
    fastestBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    fastestBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: C.success,
    },
    routeBottomActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        gap: 12,
    },
    routeSkipBtn: {
        flex: 1,
        backgroundColor: C.border,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routeSkipBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
    },
    routeStartBtn: {
        flex: 2,
        backgroundColor: C.primary,
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    routeStartBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.surface,
    },
});

export default TransporterDriverTrackingScreen;
