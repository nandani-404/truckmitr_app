import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Modal, Linking, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from 'src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
// import pusherService, { LocationUpdate } from 'src/services/pusherService';

const { width } = Dimensions.get('window');

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

const TransporterDriverTrackingScreen: React.FC<Props> = ({ onBack, driverId, loadId, navigation }) => {
    const [currentStatus, setCurrentStatus] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [hasData, setHasData] = useState(false);

    // Trip Data
    const [trip, setTrip] = useState<any>({
        id: loadId || 'N/A',
        trip_id: null,
        origin: 'Loading...',
        destination: 'Loading...',
        source_lat: null,
        source_lng: null,
        destination_lat: null,
        destination_lng: null,
        trackingAgent: { name: 'Support', phone: '' },
        driver: { name: '', phone: '', dl: '' },
        vehicle: '',
        payment: '',
        builty_path: null,
        pod_path: null,
    });

    useEffect(() => {
        if (driverId && loadId) {
            fetchActiveTripAndLocation();
        } else {
            setLoading(false);
        }

        // return () => {
        //     // Cleanup: Unsubscribe from Pusher when component unmounts
        //     pusherService.unsubscribe();
        // };
    }, [driverId, loadId]);

    const fetchActiveTripAndLocation = async () => {
        try {
            setLoading(true);
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🔄 [TRACKING] Starting fetchActiveTripAndLocation');
            console.log('📋 [TRACKING] Input Parameters:', {
                driverId,
                loadId,
                timestamp: new Date().toISOString()
            });
            console.log('═══════════════════════════════════════════════════════════');

            // Fetch trip details using the same API as ActiveTrip
            console.log('📡 [TRACKING] Calling Trucker Tracking API...');
            console.log('🔗 [TRACKING] Endpoint: GET', END_POINTS.TRUCKER_TRACKING(loadId));

            const tripResponse = await axiosInstance.get(END_POINTS.TRUCKER_TRACKING(loadId));

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
                    id: data.load_id || loadId,
                    trip_id: data.trip_id,
                    origin: data.origin || 'Unknown',
                    destination: data.destination || 'Unknown',
                    source_lat: data.source_lat,
                    source_lng: data.source_lng,
                    destination_lat: data.destination_lat,
                    destination_lng: data.destination_lng,
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
                });

                const statusCode = parseInt(data.current_status_code, 10);
                if (!isNaN(statusCode)) {
                    setCurrentStatus(statusCode);
                    console.log('📊 [TRACKING] Status Code Set:', statusCode);
                }

                // Note: Location data is included in the tracking response
                // No need for separate location API call
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
        { id: 0, label: 'Load Accepted', date: 'Fri, 10th Feb', sub: 'Your request has been accepted' },
        { id: 1, label: 'Vehicle Assigned', date: 'Fri, 10th Feb - 11:00 AM', sub: 'Truck assigned for this trip' },
        { id: 2, label: 'Reached Pickup', date: 'Fri, 10th Feb - 2:00 PM', sub: 'Truck arrived at location' },
        { id: 3, label: 'Loaded', date: 'Fri, 10th Feb - 4:30 PM', sub: 'Goods loaded successfully' },
        { id: 4, label: 'In Transit', date: 'Expected Tomorrow', sub: 'On the way to destination' },
        { id: 5, label: 'Reached Destination', date: '--', sub: 'Arrived at drop location' },
        { id: 6, label: 'Delivered', date: '--', sub: 'Goods delivered & POD uploaded' },
    ];

    const callAgent = () => {
        if (trip.trackingAgent?.phone) Linking.openURL(`tel:${trip.trackingAgent.phone}`);
    };

    const callDriver = () => {
        if (trip.driver?.phone) Linking.openURL(`tel:${trip.driver.phone}`);
    };

    const downloadBuilty = () => {
        if (trip.builty_path) {
            const url = `${BASE_URL}public/${trip.builty_path}`;
            console.log('📥 [BUILTY] Downloading from:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [BUILTY] Error opening URL:', err);
                showToast('Failed to open builty document');
            });
        } else {
            showToast('Builty document not available');
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
        console.log('🗺️ [NAVIGATION] Opening in-app navigation');
        console.log('🗺️ [NAVIGATION] Origin:', trip.origin);
        console.log('🗺️ [NAVIGATION] Destination:', trip.destination);
        
        if (navigation) {
            navigation.navigate('truckerMapNavigation', {
                origin: trip.origin,
                destination: trip.destination,
            });
        } else {
            showToast('Navigation not available');
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
                    <Text style={styles.statusDate}>{isActive ? 'Completed' : item.date}</Text>
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
                        <Text style={styles.emptyStateTitle}>No Live Tracking Available</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            No active trip data found. Pull down to refresh.
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
                <Text style={styles.headerTitle}>Driver Tracking</Text>
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
                        <Text style={styles.orderIdLabel}>Load ID</Text>
                        <Text style={styles.orderIdValue}>{trip.id}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Vehicle</Text>
                            <Text style={styles.summaryValue}>{trip.vehicle}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Amount</Text>
                            <Text style={styles.summaryValue}>{trip.payment}</Text>
                        </View>
                    </View>
                </View>

                {/* Live Location Indicator */}
                {currentLocation ? (
                    <View style={styles.card}>
                        <View style={styles.liveLocationHeader}>
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE TRACKING</Text>
                            </View>
                        </View>
                        <Text style={styles.locationText}>
                            Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.noTrackingContainer}>
                            <LocationPinIcon color={C.textSec} />
                            <Text style={styles.noTrackingText}>No Live Tracking Available</Text>
                            <Text style={styles.noTrackingSubtext}>Location data will appear here once tracking starts</Text>
                        </View>
                    </View>
                )}

                {/* Vehicle Information */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Vehicle Information</Text>
                    {currentStatus > 0 ? (
                        <>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 13, color: C.textSec }}>Vehicle Number</Text>
                                <Text style={{ fontSize: 15, fontWeight: '500', color: C.text, marginTop: 2 }}>{trip.vehicle}</Text>
                            </View>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.contactRow} onPress={callDriver}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.contactName}>Driver: {trip.driver?.name || 'Unknown'}</Text>
                                    <Text style={styles.contactPhone}>{trip.driver?.phone || 'No Phone'}</Text>
                                </View>
                                <PhoneIcon />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                            <Text style={{ color: C.textSec, fontSize: 13 }}>Vehicle Not Assigned Yet</Text>
                        </View>
                    )}
                </View>

                {/* Shipping Details */}
                <View style={styles.card}>
                    <View style={styles.shippingHeader}>
                        <Text style={styles.sectionHeader}>Shipping Route</Text>
                    </View>

                    {/* Modern Route Display */}
                    <View style={styles.routeContainer}>
                        {/* Origin */}
                        <View style={styles.routePoint}>
                            <View style={styles.routeIconContainer}>
                                <View style={styles.originDot} />
                            </View>
                            <View style={styles.routeContent}>
                                <Text style={styles.routeLabel}>Pickup Location</Text>
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
                                <Text style={styles.routeLabel}>Drop Location</Text>
                                <Text style={styles.routeAddress}>{trip.destination}</Text>
                                <TouchableOpacity style={styles.navigateBtnModern} onPress={openMaps}>
                                    <NavigationIcon color={C.surface} />
                                    <Text style={styles.navigateTextModern}>Navigate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tracking Timeline */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Load Status</Text>
                    <View style={styles.timelineContainer}>
                        {statuses.map(renderTimelineItem)}
                    </View>
                </View>

                {/* Documents Section */}
                {(trip.builty_path || trip.pod_path) && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeader}>Documents</Text>
                        
                        {trip.builty_path && (
                            <TouchableOpacity style={styles.documentRow} onPress={downloadBuilty}>
                                <View style={styles.documentIconContainer}>
                                    <DocumentIcon />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.documentTitle}>Builty Document</Text>
                                    <Text style={styles.documentSubtitle}>Tap to view or download</Text>
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
                                    <Text style={styles.documentTitle}>POD Document</Text>
                                    <Text style={styles.documentSubtitle}>Tap to view or download</Text>
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
                    <Text style={styles.sectionHeader}>Need Help?</Text>

                    <TouchableOpacity style={styles.contactRow} onPress={callAgent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactName}>Agent: {trip.trackingAgent?.name}</Text>
                            <Text style={styles.contactPhone}>{trip.trackingAgent?.phone}</Text>
                        </View>
                        <PhoneIcon />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
});

export default TransporterDriverTrackingScreen;
