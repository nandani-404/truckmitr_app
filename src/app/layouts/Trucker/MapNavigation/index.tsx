import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { locationPermission } from '@truckmitr/src/utils/maps/location/permission';
import { SECURE_CONFIG } from '@truckmitr/src/utils/static';

interface Props {
    onBack?: () => void;
    origin?: string;
    destination?: string;
    originCoords?: { latitude: number; longitude: number };
    destinationCoords?: { latitude: number; longitude: number };
}

const MapNavigationScreen: React.FC<Props> = ({ onBack, origin = '', destination = '', originCoords, destinationCoords }) => {
    const mapRef = useRef<MapView>(null);
    const watchId = useRef<number | null>(null);
    const mounted = useRef(true);

    const [loading, setLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [pickupLocation, setPickupLocation] = useState<any>(originCoords);
    const [dropLocation, setDropLocation] = useState<any>(destinationCoords);
    const [route, setRoute] = useState<any[]>([]);
    const [fullRoute, setFullRoute] = useState<any[]>([]); // Full route: current → pickup → drop
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [totalDistance, setTotalDistance] = useState('');
    const [totalDuration, setTotalDuration] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [navStep, setNavStep] = useState<'pickup' | 'drop'>('pickup');
    const [heading, setHeading] = useState(0); // User's heading/bearing
    const [nextTurn, setNextTurn] = useState<string>(''); // Next turn instruction
    const [isSheetVisible, setIsSheetVisible] = useState(true);

    useEffect(() => {
        mounted.current = true;
        initialize();
        return () => {
            mounted.current = false;
            if (watchId.current) Geolocation.clearWatch(watchId.current);
        };
    }, []);

    const initialize = async () => {
        const hasPermission = await locationPermission();
        if (!hasPermission) {
            setLoading(false);
            showToast('Location permission required');
            return;
        }

        fetchCurrentLocation();

        if (!originCoords && origin) geocode(origin, 'pickup');
        if (!destinationCoords && destination) geocode(destination, 'drop');
    };

    const fetchCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            (pos) => {
                const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                if (mounted.current) {
                    setCurrentLocation(loc);
                    setLoading(false);
                }
            },
            (err) => {
                console.log('Location error:', err);
                if (mounted.current) setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
    };

    const geocode = async (address: string, type: 'pickup' | 'drop') => {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:IN&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'OK' && data.results[0]) {
                const coords = {
                    latitude: data.results[0].geometry.location.lat,
                    longitude: data.results[0].geometry.location.lng,
                };
                if (mounted.current) {
                    if (type === 'pickup') setPickupLocation(coords);
                    else setDropLocation(coords);
                }
            }
        } catch (e) {
            console.log('Geocode error:', e);
        }
    };

    const fetchRoute = useCallback(async (from: any, to: any) => {
        if (!from || !to) return;

        try {
            // Use more accurate routing parameters with snap to roads
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&mode=driving&alternatives=false&traffic_model=best_guess&departure_time=now&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            console.log('🗺️ Route API response:', data.status);

            if (data.status === 'OK' && data.routes[0]) {
                const route = data.routes[0];

                // Decode polyline - Google uses encoded polyline for efficiency
                const points = decode(route.overview_polyline.points);
                console.log('🗺️ Route points decoded:', points.length);

                const leg = route.legs[0];

                // Get first step for turn instruction
                const firstStep = leg.steps?.[0];
                const instruction = firstStep?.html_instructions?.replace(/<[^>]*>/g, '') || 'Continue straight';

                if (mounted.current) {
                    setRoute(points);
                    setDistance(leg.distance?.text || '');
                    setDuration(leg.duration?.text || '');
                    setNextTurn(instruction);
                }

                setTimeout(() => {
                    if (isNavigating) {
                        // Google Maps style: 3D tilted view following user
                        mapRef.current?.animateCamera({
                            center: from,
                            pitch: 60,
                            heading: heading,
                            altitude: 300,
                            zoom: 18,
                        }, { duration: 500 });
                    } else {
                        // Overview mode - show full route
                        mapRef.current?.fitToCoordinates([from, to], {
                            edgePadding: { top: 150, right: 50, bottom: 350, left: 50 },
                            animated: true,
                        });
                    }
                }, 300);
            } else {
                console.error('🗺️ Route error:', data.status, data.error_message);
                if (data.status === 'ZERO_RESULTS') {
                    showToast('No route found between locations');
                } else if (data.status === 'REQUEST_DENIED') {
                    showToast('API key error. Please contact support.');
                } else {
                    showToast('Could not fetch route. Please try again.');
                }
            }
        } catch (e) {
            console.error('🗺️ Route fetch error:', e);
            showToast('Network error. Please check your connection.');
        }
    }, [isNavigating, heading]);

    const fetchFullRoute = useCallback(async () => {
        if (!currentLocation || !pickupLocation || !dropLocation) return;

        try {
            // Fetch route with waypoint: current → pickup → drop
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${dropLocation.latitude},${dropLocation.longitude}&waypoints=${pickupLocation.latitude},${pickupLocation.longitude}&mode=driving&key=${SECURE_CONFIG.GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'OK' && data.routes[0]) {
                const points = decode(data.routes[0].overview_polyline.points);

                // Calculate total distance and duration
                let totalDist = 0;
                let totalDur = 0;

                if (data.routes[0].legs) {
                    data.routes[0].legs.forEach((leg: any) => {
                        totalDist += leg.distance?.value || 0;
                        totalDur += leg.duration?.value || 0;
                    });

                    const distKm = (totalDist / 1000).toFixed(1);
                    const hours = Math.floor(totalDur / 3600);
                    const minutes = Math.floor((totalDur % 3600) / 60);

                    if (mounted.current) {
                        setFullRoute(points);
                        setTotalDistance(`${distKm} km`);
                        setTotalDuration(hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`);
                    }
                }
            }
        } catch (e) {
            console.log('Full route error:', e);
        }
    }, [currentLocation, pickupLocation, dropLocation]);

    const decode = (encoded: string) => {
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

    useEffect(() => {
        if (pickupLocation && dropLocation && !isNavigating) {
            fetchRoute(pickupLocation, dropLocation);
        }
    }, [pickupLocation, dropLocation, isNavigating, fetchRoute]);

    useEffect(() => {
        if (currentLocation && pickupLocation && dropLocation && !isNavigating) {
            fetchFullRoute();
        }
    }, [currentLocation, pickupLocation, dropLocation, isNavigating, fetchFullRoute]);

    useEffect(() => {
        // Update camera position when location changes during navigation
        if (isNavigating && currentLocation) {
            mapRef.current?.animateCamera({
                center: currentLocation,
                pitch: 60,
                heading: heading,
                altitude: 300,
                zoom: 18,
            }, { duration: 500 });
        }
    }, [currentLocation, isNavigating, heading]);

    const startNavigation = () => {
        if (!currentLocation) {
            showToast('Getting your location...');
            fetchCurrentLocation();
            setTimeout(() => {
                if (currentLocation && pickupLocation) {
                    setIsNavigating(true);
                    setNavStep('pickup');
                    fetchRoute(currentLocation, pickupLocation);
                    startTracking();
                }
            }, 2000);
            return;
        }

        setIsNavigating(true);
        setNavStep('pickup');
        if (pickupLocation) fetchRoute(currentLocation, pickupLocation);
        startTracking();
        showToast('Navigation started');
    };

    const startTracking = () => {
        if (watchId.current) Geolocation.clearWatch(watchId.current);
        watchId.current = Geolocation.watchPosition(
            (pos) => {
                const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                const newHeading = pos.coords.heading || 0; // Get user's direction

                if (mounted.current) {
                    setCurrentLocation(loc);
                    setHeading(newHeading);

                    // Update route and camera as user moves
                    if (isNavigating) {
                        // Update camera to follow user with rotation
                        mapRef.current?.animateCamera({
                            center: loc,
                            pitch: 60,
                            heading: newHeading,
                            altitude: 300,
                            zoom: 18,
                        }, { duration: 500 });

                        // Recalculate rouet
                        if (navStep === 'pickup' && pickupLocation) {
                            fetchRoute(loc, pickupLocation);
                        } else if (navStep === 'drop' && dropLocation) {
                            fetchRoute(loc, dropLocation);
                        }
                    }
                }
            },
            (error) => {
                console.log('Watch position error:', error);
            },
            {
                enableHighAccuracy: true, // High accuracy for better heading
                distanceFilter: 5, // Update every 5 meters for smoother tracking
                interval: 2000, // Update every 2 seconds
                useSignificantChanges: false,
            }
        );
    };

    const reachedPickup = () => {
        setNavStep('drop');
        if (currentLocation && dropLocation) fetchRoute(currentLocation, dropLocation);
        showToast('Navigating to drop');
    };

    const openGoogleMaps = () => {
        if (!pickupLocation || !dropLocation) {
            showToast('Locations not available');
            return;
        }

        const origin = currentLocation
            ? `${currentLocation.latitude},${currentLocation.longitude}`
            : `${pickupLocation.latitude},${pickupLocation.longitude}`;
        const destination = `${dropLocation.latitude},${dropLocation.longitude}`;
        const waypoint = currentLocation
            ? `${pickupLocation.latitude},${pickupLocation.longitude}`
            : '';

        // Google Maps URL with waypoints for full route
        const url = Platform.select({
            ios: waypoint
                ? `comgooglemaps://?saddr=${origin}&daddr=${destination}&waypoints=${waypoint}&directionsmode=driving`
                : `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`,
            android: waypoint
                ? `google.navigation:q=${destination}&waypoints=${waypoint}&mode=d`
                : `google.navigation:q=${destination}&mode=d`,
        });

        const fallbackUrl = waypoint
            ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoint}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

        Linking.canOpenURL(url!).then((supported) => {
            if (supported) {
                Linking.openURL(url!);
            } else {
                Linking.openURL(fallbackUrl);
            }
        }).catch(() => {
            Linking.openURL(fallbackUrl);
        });
    };

    const centerLocation = () => {
        if (currentLocation) {
            if (isNavigating) {
                // Google Maps style zoomed view
                mapRef.current?.animateCamera({
                    center: currentLocation,
                    pitch: 60,
                    heading: heading,
                    altitude: 300,
                    zoom: 18,
                }, { duration: 500 });
            } else {
                // Normal view
                mapRef.current?.animateToRegion({
                    ...currentLocation,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 500);
            }
        }
    };

    const initialRegion = pickupLocation || { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.5, longitudeDelta: 0.5 };

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={s.map}
                initialRegion={{ ...initialRegion, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsBuildings={true}
                showsIndoors={true}
                showsTraffic={true}
                pitchEnabled={true}
                rotateEnabled={true}
                zoomEnabled={true}
                scrollEnabled={true}
                mapType="standard"
                customMapStyle={[
                    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                ]}
            >
                {/* Full route in background (gray dashed) when navigating */}
                {isNavigating && fullRoute.length > 0 && (
                    <Polyline
                        coordinates={fullRoute}
                        strokeColor="#9CA3AF"
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                        lineDashPattern={[10, 5]}
                    />
                )}

                {/* Active route (green when navigating, blue otherwise) */}
                {route.length > 0 && (
                    <Polyline
                        coordinates={route}
                        strokeColor={isNavigating ? '#00D856' : '#276EF1'}
                        strokeWidth={6}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}

                {pickupLocation && (
                    <Marker coordinate={pickupLocation}>
                        <View style={s.marker}>
                            <View style={[s.markerInner, { backgroundColor: '#00D856' }]}>
                                <Text style={s.markerText}>P</Text>
                            </View>
                        </View>
                    </Marker>
                )}

                {dropLocation && (
                    <Marker coordinate={dropLocation}>
                        <View style={s.marker}>
                            <View style={[s.markerInner, { backgroundColor: '#000' }]}>
                                <Text style={s.markerText}>D</Text>
                            </View>
                        </View>
                    </Marker>
                )}
            </MapView>

            {loading && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={s.loadingText}>Loading map...</Text>
                </View>
            )}

            <SafeAreaView style={s.topBar} edges={['top']}>
                <TouchableOpacity onPress={onBack} style={s.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>

                {isNavigating && nextTurn && (
                    <View style={s.turnBanner}>
                        <View style={s.turnIcon}>
                            <MaterialIcons name="arrow-upward" size={32} color="#FFF" />
                        </View>
                        <View style={s.turnInfo}>
                            <Text style={s.turnText} numberOfLines={2}>{nextTurn}</Text>
                            <Text style={s.turnDistance}>{distance}</Text>
                        </View>
                    </View>
                )}

                {isNavigating && !nextTurn && (
                    <View style={s.navBadge}>
                        <MaterialIcons name="navigation" size={20} color="#FFF" />
                        <Text style={s.navBadgeText}>{navStep === 'pickup' ? 'To Pickup' : 'To Drop'}</Text>
                    </View>
                )}
            </SafeAreaView>

            {!loading && currentLocation && (
                <TouchableOpacity style={[s.locationBtn, { bottom: isSheetVisible ? 380 : 100 }]} onPress={centerLocation}>
                    <MaterialIcons name="my-location" size={24} color="#276EF1" />
                </TouchableOpacity>
            )}

            {!loading && (
                <View style={[s.bottomSheet, !isSheetVisible && { paddingBottom: Platform.OS === 'ios' ? 20 : 10 }]}>
                    <TouchableOpacity
                        style={s.dragHandleContainer}
                        onPress={() => setIsSheetVisible(!isSheetVisible)}
                        activeOpacity={0.7}
                    >
                        <View style={s.dragHandle} />
                    </TouchableOpacity>

                    {isSheetVisible && (
                        <View>
                            {/* Open in Google Maps Button */}
                            <TouchableOpacity style={s.googleMapsBtn} onPress={openGoogleMaps}>
                                <MaterialIcons name="map" size={20} color="#276EF1" />
                                <Text style={s.googleMapsBtnText}>Open in Google Maps</Text>
                            </TouchableOpacity>

                            {/* Show total distance/duration before navigation, current segment during */}
                            {!isNavigating && (totalDistance || totalDuration) ? (
                                <View style={s.routeInfo}>
                                    <View style={s.routeInfoItem}>
                                        <Text style={s.routeInfoValue}>{totalDuration || '--'}</Text>
                                        <Text style={s.routeInfoLabel}>Total Time</Text>
                                    </View>
                                    <View style={s.divider} />
                                    <View style={s.routeInfoItem}>
                                        <Text style={s.routeInfoValue}>{totalDistance || '--'}</Text>
                                        <Text style={s.routeInfoLabel}>Total Distance</Text>
                                    </View>
                                </View>
                            ) : (distance || duration) ? (
                                <View style={s.routeInfo}>
                                    <View style={s.routeInfoItem}>
                                        <Text style={s.routeInfoValue}>{duration || '--'}</Text>
                                        <Text style={s.routeInfoLabel}>{navStep === 'pickup' ? 'To Pickup' : 'To Drop'}</Text>
                                    </View>
                                    <View style={s.divider} />
                                    <View style={s.routeInfoItem}>
                                        <Text style={s.routeInfoValue}>{distance || '--'}</Text>
                                        <Text style={s.routeInfoLabel}>Distance</Text>
                                    </View>
                                </View>
                            ) : null}

                            <View style={s.locations}>
                                {/* Show current location when navigating */}
                                {isNavigating && (
                                    <>
                                        <View style={s.locationRow}>
                                            <View style={[s.dot, { backgroundColor: '#276EF1' }]} />
                                            <View style={s.locationContent}>
                                                <Text style={s.locationLabel}>YOUR LOCATION</Text>
                                                <Text style={s.locationText}>Current Position</Text>
                                            </View>
                                        </View>
                                        <View style={s.connector} />
                                    </>
                                )}

                                <View style={s.locationRow}>
                                    <View style={[s.dot, { backgroundColor: '#00D856' }]} />
                                    <View style={s.locationContent}>
                                        <Text style={s.locationLabel}>PICKUP</Text>
                                        <Text style={s.locationText} numberOfLines={2}>{origin || 'Pickup Location'}</Text>
                                    </View>
                                    {isNavigating && navStep === 'pickup' && (
                                        <View style={s.activeBadge}>
                                            <Text style={s.activeBadgeText}>ACTIVE</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={s.connector} />

                                <View style={s.locationRow}>
                                    <View style={[s.dot, { backgroundColor: '#000' }]} />
                                    <View style={s.locationContent}>
                                        <Text style={s.locationLabel}>DROP</Text>
                                        <Text style={s.locationText} numberOfLines={2}>{destination || 'Drop Location'}</Text>
                                    </View>
                                    {isNavigating && navStep === 'drop' && (
                                        <View style={s.activeBadge}>
                                            <Text style={s.activeBadgeText}>ACTIVE</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {!isNavigating ? (
                                <TouchableOpacity style={s.startBtn} onPress={startNavigation}>
                                    <MaterialIcons name="navigation" size={24} color="#FFF" />
                                    <Text style={s.startBtnText}>Start Navigation</Text>
                                </TouchableOpacity>
                            ) : navStep === 'pickup' ? (
                                <TouchableOpacity style={s.reachedBtn} onPress={reachedPickup}>
                                    <Text style={s.reachedBtnText}>Reached Pickup</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={s.navStatus}>
                                    <MaterialIcons name="local-shipping" size={24} color="#000" />
                                    <Text style={s.navStatusText}>Navigating to drop location...</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    map: { ...StyleSheet.absoluteFillObject },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
    navBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', marginLeft: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, elevation: 4 },
    navBadgeText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#FFF' },
    turnBanner: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#00796B', marginLeft: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16, elevation: 6 },
    turnIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    turnInfo: { flex: 1 },
    turnText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 4 },
    turnDistance: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    locationBtn: { position: 'absolute', right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingHorizontal: 20, elevation: 16 },
    dragHandleContainer: { width: '100%', alignItems: 'center', paddingVertical: 16 },
    dragHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 },
    googleMapsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#276EF1' },
    googleMapsBtnText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#276EF1' },
    routeInfo: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 20 },
    routeInfoItem: { flex: 1, alignItems: 'center' },
    routeInfoValue: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 4 },
    routeInfoLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    divider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
    locations: { marginBottom: 20 },
    locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
    locationContent: { flex: 1 },
    locationLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
    locationText: { fontSize: 15, color: '#000', fontWeight: '500', lineHeight: 20 },
    connector: { width: 2, height: 24, backgroundColor: '#E5E7EB', marginLeft: 5, marginVertical: 4 },
    startBtn: { flexDirection: 'row', backgroundColor: '#00D856', paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    startBtnText: { marginLeft: 8, fontSize: 17, fontWeight: '700', color: '#FFF' },
    reachedBtn: { backgroundColor: '#276EF1', paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    reachedBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
    navStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#F9FAFB', borderRadius: 16 },
    navStatusText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#000' },
    activeBadge: { backgroundColor: '#00D856', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
    activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
    marker: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    markerInner: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF', elevation: 6 },
    markerText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

export default MapNavigationScreen;
