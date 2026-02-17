import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator, Image, Platform, Linking, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import { SECURE_CONFIG } from '@truckmitr/src/utils/static';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config';
import useTruckLocation from '@truckmitr/src/app/hooks/useTruckLocation';

const { width, height } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TRACKING_DATA = {
    load_id: 'LID45293',
    status: 'In Transit',
    origin: 'Gurgaon, Haryana',
    destination: 'Mumbai, Maharashtra',
    driver: {
        name: 'Rajesh Kumar',
        phone: '+91 9876543210',
        rating: 4.8,
        image: 'https://i.pravatar.cc/150?u=rajesh'
    },
    vehicle: {
        number: 'HR 55 AH 1234',
        type: '32ft Open SXL',
        capacity: '15 Tons'
    },
    location: {
        latitude: 23.0225, // Ahmedabad (midway example)
        longitude: 72.5714,
        lastUpdated: '2 mins ago'
    },
    route: [
        { latitude: 28.4595, longitude: 77.0266 }, // Gurgaon
        { latitude: 26.9124, longitude: 75.7873 }, // Jaipur
        { latitude: 23.0225, longitude: 72.5714 }, // Ahmedabad
        { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
    ]
};

const C = {
    primary: '#1E40AF',
    primaryLight: '#3B82F6',
    success: '#10B981',
    text: '#1F2937',
    textSec: '#6B7280',
    white: '#FFFFFF',
    border: '#E5E7EB',
    bg: '#F8FAFC',
    traveled: '#94A3B8', // Slate-400 for traveled path
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Haversine formula to calculate distance between two coordinates in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

// Find the closest point index on the route
const findClosestPointIndex = (point: { latitude: number, longitude: number }, route: any[]) => {
    let minDistance = Infinity;
    let closestIndex = 0;

    route.forEach((coord, index) => {
        const dist = getDistance(point.latitude, point.longitude, coord.latitude, coord.longitude);
        if (dist < minDistance) {
            minDistance = dist;
            closestIndex = index;
        }
    });

    return closestIndex;
};

// Polyline Decoder logic
const decodePolyline = (encoded: string) => {
    const points: any[] = [];
    let index = 0, len = encoded.length, lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
};

// ── Components ───────────────────────────────────────────────────────────────

const ShipperTrackDetail = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const routeParams = useRoute<any>().params;
    const load = routeParams?.load || MOCK_TRACKING_DATA;

    const mapRef = useRef<MapView>(null);
    const [loading, setLoading] = useState(true);
    const [roadRoute, setRoadRoute] = useState<any[]>(MOCK_TRACKING_DATA.route);
    const [initialLocation, setInitialLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const hasPointedByAPI = useRef(false);
    const hasPointedByPusher = useRef(false);

    // 🔍 Live Truck Tracking
    const channelId = load?.trip_id || '13';
    const { location: liveLocation, isTracking } = useTruckLocation(`driver-location.${channelId}`);
    // Effective truck position (live > initial API > load data > fallback)
    const truckPosition = liveLocation ? {
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude
    } : (initialLocation ? initialLocation : {
        latitude: parseFloat(load?.origin_lat || 28.6139), // Better fallback
        longitude: parseFloat(load?.origin_lon || 77.2090)
    });

    // 🛣️ Dynamic Route Segments
    const closestIdx = findClosestPointIndex(truckPosition, roadRoute);
    const traveledRoute = roadRoute.slice(0, closestIdx + 1);
    const remainingRoute = roadRoute.slice(closestIdx);

    // 📏 Distance tracking
    const calculateDistance = (route: any[]) => {
        let total = 0;
        for (let i = 0; i < route.length - 1; i++) {
            total += getDistance(route[i].latitude, route[i].longitude, route[i + 1].latitude, route[i + 1].longitude);
        }
        return total;
    };

    const distanceTraveled = calculateDistance(traveledRoute).toFixed(1);
    const distanceRemaining = calculateDistance(remainingRoute).toFixed(1);
    const totalDistance = (parseFloat(distanceTraveled) + parseFloat(distanceRemaining)).toFixed(1);
    const progressPercent = (parseFloat(distanceTraveled) / parseFloat(totalDistance) || 0) * 100;

    // 🏎️ Animation for Truck Marker Pulse
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    // 🎯 Sequential Camera Pointing
    useEffect(() => {
        // Point by API first (if no live location yet)
        if (initialLocation && !hasPointedByAPI.current && !liveLocation) {
            console.log('📍 Pointing map by API location');
            mapRef.current?.animateToRegion({
                ...initialLocation,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
            hasPointedByAPI.current = true;
        }
    }, [initialLocation, liveLocation]);

    useEffect(() => {
        // Point by Pusher (once it arrives)
        if (liveLocation && !hasPointedByPusher.current) {
            console.log('🛰️ Pointing map by Pusher location');
            mapRef.current?.animateToRegion({
                latitude: liveLocation.latitude,
                longitude: liveLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
            hasPointedByPusher.current = true;
        }
    }, [liveLocation]);

    const [tracksView, setTracksView] = useState(true);

    // Diagnostic logging for coordinate priority
    useEffect(() => {
        console.log('📍 [Truck Position] liveLocation:', !!liveLocation, 'initialLocation:', !!initialLocation, 'loadFallback:', !liveLocation && !initialLocation);
        console.log('📍 [Truck Position] Current Latitude:', truckPosition.latitude, 'Longitude:', truckPosition.longitude);
    }, [liveLocation, initialLocation, truckPosition]);

    // Stop tracking view changes after 3 seconds to prevent flickering
    // but keep it true initially to ensure custom markers render
    useEffect(() => {
        const timer = setTimeout(() => setTracksView(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const lastUpdatedText = liveLocation
        ? 'Live'
        : (load?.location?.lastUpdated || load?.last_update || 'N/A');

    useEffect(() => {
        const fetchInitialLocation = async () => {
            console.log('📡 [Initial Location] Fetching for channelId:', channelId);
            try {
                const response = await axiosInstance.get(END_POINTS.TRIP_CURRENT_LOCATION(channelId));
                console.log('📡 [Initial Location] Response:', JSON.stringify(response?.data));
                if (response?.data?.status && response?.data?.latitude) {
                    setInitialLocation({
                        latitude: parseFloat(response.data.latitude),
                        longitude: parseFloat(response.data.longitude)
                    });
                } else if (response?.data?.latitude) {
                    // Handle cases where 'status' might be missing but coordinates are present
                    setInitialLocation({
                        latitude: parseFloat(response.data.latitude),
                        longitude: parseFloat(response.data.longitude)
                    });
                }
            } catch (error) {
                console.error('❌ [Initial Location] Error:', error);
            }
        };

        const fetchRoadFollowingRoute = async () => {
            try {
                // Fetch initial location first
                await fetchInitialLocation();

                const origin = load?.loading_city_state || load?.origin || MOCK_TRACKING_DATA.origin;
                const destination = load?.unloading_city_state || load?.destination || MOCK_TRACKING_DATA.destination;

                const apiKey = SECURE_CONFIG.GOOGLE_API_KEY;
                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.status === 'OK' && data.routes[0]) {
                    const points = decodePolyline(data.routes[0].overview_polyline.points);
                    setRoadRoute(points);

                    setTimeout(() => {
                        mapRef.current?.fitToCoordinates(points, {
                            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
                            animated: true,
                        });
                    }, 500);
                }
            } catch (error) {
                console.error('Error fetching road route:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoadFollowingRoute();
    }, [load]);

    const callDriver = () => {
        const phone = load?.driver_info?.driver_phone || load?.driver?.phone || load?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Map Section */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: truckPosition.latitude,
                        longitude: truckPosition.longitude,
                        latitudeDelta: 10,
                        longitudeDelta: 10,
                    }}
                >
                    {/* Traveled Route (Slate-400) */}
                    <Polyline
                        coordinates={traveledRoute}
                        strokeColor={C.traveled}
                        strokeWidth={4}
                        lineDashPattern={[5, 5]} // Dashed line for traveled path
                    />

                    {/* Remaining Route (Blue-800) */}
                    <Polyline
                        coordinates={remainingRoute}
                        strokeColor={C.primary}
                        strokeWidth={4}
                    />

                    {/* Origin Marker */}
                    {roadRoute && roadRoute.length > 0 && (
                        <Marker
                            coordinate={roadRoute[0]}
                            tracksViewChanges={tracksView}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[styles.markerDot, { backgroundColor: C.success }]} />
                            </View>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {roadRoute && roadRoute.length > 1 && (
                        <Marker
                            coordinate={roadRoute[roadRoute.length - 1]}
                            tracksViewChanges={tracksView}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[styles.markerDot, { backgroundColor: '#EF4444' }]} />
                            </View>
                        </Marker>
                    )}

                    {/* Truck Marker */}
                    {truckPosition && !isNaN(truckPosition.latitude) && !isNaN(truckPosition.longitude) && (
                        <Marker
                            coordinate={truckPosition}
                            tracksViewChanges={tracksView || isTracking}
                            zIndex={100}
                            anchor={{ x: 0.5, y: 0.5 }} // Centered for best visibility at small sizes
                        >
                            <View style={styles.truckMarkerWrapper}>
                                <Animated.View style={[
                                    styles.pulseCircle,
                                    { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.6, 0] }) }
                                ]} />
                                <View style={styles.truckLabelContainer}>
                                    <Text style={styles.truckLabelText}>YOUR TRUCK</Text>
                                </View>
                                <View style={styles.truckIconContainer}>
                                    <Ionicons name="bus" size={14} color={C.white} />
                                </View>
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={C.primary} />
                    </View>
                )}
            </View>

            {/* Bottom Info Sheet */}
            <View style={styles.infoSheet}>
                <View style={styles.dragBar} />

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header Info */}
                    <View style={styles.sheetHeader}>
                        <View>
                            <Text style={styles.loadIdText}>{load?.load_id || 'N/A'}</Text>
                            <Text style={styles.statusText}>
                                <Text style={{ color: C.success }}>●</Text> {load?.status || 'Unknown'}
                            </Text>
                        </View>
                        <View style={styles.etaContainer}>
                            <Text style={styles.etaLabel}>Status</Text>
                            <Text style={[styles.etaValue, { color: C.success }]}>Live Tracking</Text>
                        </View>
                    </View>

                    {/* Progress Stats */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Journey Progress</Text>
                            <Text style={styles.progressValue}>{progressPercent.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>COVERED</Text>
                                <Text style={styles.statValue}>{distanceTraveled} <Text style={styles.unitText}>km</Text></Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>REMAINING</Text>
                                <Text style={styles.statValue}>{distanceRemaining} <Text style={styles.unitText}>km</Text></Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TOTAL</Text>
                                <Text style={styles.statValue}>{totalDistance} <Text style={styles.unitText}>km</Text></Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Locations */}
                    <View style={styles.locationSection}>
                        <View style={styles.locationRow}>
                            <View style={styles.iconCol}>
                                <View style={[styles.dot, { backgroundColor: C.success }]} />
                                <View style={styles.line} />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locLabel}>Origin</Text>
                                <Text style={styles.locValue}>
                                    {load?.origin_location || load?.loading_city_state || load?.origin || 'N/A'}
                                </Text>
                                {load?.exact_origin_location && (
                                    <Text style={styles.detailExactAddress}>📌 {load.exact_origin_location}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.locationRow}>
                            <View style={styles.iconCol}>
                                <Ionicons name="location" size={16} color="#EF4444" />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locLabel}>Destination</Text>
                                <Text style={styles.locValue}>
                                    {load?.destination_location || load?.unloading_city_state || load?.destination || 'N/A'}
                                </Text>
                                {load?.exact_destination_location && (
                                    <Text style={styles.detailExactAddress}>📌 {load.exact_destination_location}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Agent & Support Info */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <View style={styles.driverRow}>
                                {load?.agent_info?.profile_img ? (
                                    <Image source={{ uri: load.agent_info.profile_img }} style={styles.driverAvatar} />
                                ) : (
                                    <View style={[styles.driverAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' }]}>
                                        <Ionicons name="headset" size={24} color="#3b82f6" />
                                    </View>
                                )}
                                <View style={styles.driverInfo}>
                                    <Text style={styles.detailLabel}>Dedicated Support</Text>
                                    <Text style={styles.detailValue}>{load?.agent_info?.name || 'Support Agent'}</Text>
                                    <Text style={styles.supportText}>Need help? Contact your agent</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.callFab}
                            onPress={() => {
                                const phone = load?.agent_info?.number;
                                if (phone) Linking.openURL(`tel:${phone}`);
                            }}
                        >
                            <Ionicons name="call" size={24} color={C.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { marginTop: 12 }]} />

                    <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleRow}>
                            <MaterialIcons name="local-shipping" size={20} color={C.textSec} />
                            <Text style={styles.vehicleText}>
                                {load?.driver_info?.vehicle_number || 'TRUCK UNKNOWN'} • {load?.vehicle_type?.vehicle_name || 'In-Transit'}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    mapContainer: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: C.white,
    },
    markerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    truckMarkerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
    },
    pulseCircle: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: C.primary,
    },
    truckIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: C.white,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    truckLabelContainer: {
        backgroundColor: C.primary,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        marginBottom: 1,
        borderWidth: 0.5,
        borderColor: C.white,
    },
    truckLabelText: {
        color: C.white,
        fontSize: 7,
        fontWeight: '700',
    },
    infoSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: height * 0.45,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    dragBar: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    loadIdText: {
        fontSize: 18,
        fontWeight: '700',
        color: C.text,
    },
    statusText: {
        fontSize: 14,
        color: C.textSec,
        marginTop: 2,
        fontWeight: '600',
    },
    etaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: C.primary,
    },
    etaContainer: {
        alignItems: 'flex-end',
    },
    etaLabel: {
        fontSize: 12,
        color: C.textSec,
    },
    progressContainer: {
        marginVertical: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: C.textSec,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '700',
        color: C.primary,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: C.primary,
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        color: C.textSec,
        fontWeight: '700',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: C.text,
    },
    unitText: {
        fontSize: 10,
        color: C.textSec,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: C.border,
    },
    divider: {
        height: 1,
        backgroundColor: C.border,
        marginVertical: 12,
    },
    locationSection: {
        marginTop: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconCol: {
        alignItems: 'center',
        width: 24,
        marginRight: 12,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
    },
    line: {
        width: 2,
        height: 30,
        backgroundColor: C.border,
        marginVertical: 4,
    },
    locationInfo: {
        flex: 1,
        paddingBottom: 4,
    },
    locLabel: {
        fontSize: 11,
        color: C.textSec,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    locValue: {
        fontSize: 15,
        color: C.text,
        marginTop: 2,
        fontWeight: '500',
    },
    detailExactAddress: {
        fontSize: 11,
        color: '#3b82f6',
        fontWeight: '600',
        marginTop: 4,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    detailsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
    },
    driverInfo: {
        marginLeft: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: C.textSec,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
    },
    supportText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    callFab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    vehicleInfo: {
        marginTop: 4, marginBottom: 50
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleText: {
        marginLeft: 8,
        fontSize: 14,
        color: C.text,
        fontWeight: '500',
    }
});

export default ShipperTrackDetail;
