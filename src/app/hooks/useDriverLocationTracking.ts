/**
 * useDriverLocationTracking Hook
 *
 * Global location tracking hook for drivers that works across all screens.
 * Automatically starts tracking when driver has an active trip.
 *
 * Usage:
 *   useDriverLocationTracking(); // Just call it in your component
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { Platform, PermissionsAndroid } from 'react-native';

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

export function useDriverLocationTracking() {
    const userState = useSelector((state: any) => state?.user);
    const user = userState?.user || null;

    // Refs for location tracking
    const watchIdRef = useRef<number | null>(null);
    const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const lastUpdateTimeRef = useRef<number>(Date.now());
    const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tripIdRef = useRef<string | null>(null);
    const isTrackingRef = useRef<boolean>(false);
    const tripStatusCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Update location to server
    const updateLocationToServer = async (latitude: number, longitude: number) => {
        try {
            if (!tripIdRef.current || !user?.id) {
                console.warn('⚠️ [GLOBAL TRACKING] Missing trip_id or driver_id');
                return;
            }

            const payload = {
                trip_id: tripIdRef.current,
                driver_id: user.id,
                latitude,
                longitude,
            };

            console.log('═══════════════════════════════════════════════════════════');
            console.log('📤 [GLOBAL TRACKING] Sending location update');
            console.log('📍 [GLOBAL TRACKING] Coordinates:', {
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6)
            });
            console.log('📦 [GLOBAL TRACKING] Payload:', JSON.stringify(payload, null, 2));
            console.log('═══════════════════════════════════════════════════════════');

            const response = await axiosInstance.post(END_POINTS.TRIP_UPDATE_LOCATION, payload);

            if (response.data?.status === true || response.data?.status === 'success') {
                console.log('✅ [GLOBAL TRACKING] Location updated successfully');
                lastUpdateTimeRef.current = Date.now();
            }
        } catch (error: any) {
            console.error('❌ [GLOBAL TRACKING] Error:', error?.message);
        }
    };

    // Start location tracking
    const startLocationTracking = async () => {
        try {
            if (isTrackingRef.current) {
                console.log('ℹ️ [GLOBAL TRACKING] Already tracking, skipping start');
                return;
            }

            // Request permissions safely
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('❌ [GLOBAL TRACKING] Location permission denied');
                    return;
                }
            } else {
                const authStatus = await Geolocation.requestAuthorization('always');
                if (authStatus !== 'granted') {
                    console.log('❌ [GLOBAL TRACKING] Location permission denied');
                    return;
                }
            }

            console.log('🚀 [GLOBAL TRACKING] Starting location tracking');
            console.log('📍 [GLOBAL TRACKING] Trip ID:', tripIdRef.current);
            console.log('👤 [GLOBAL TRACKING] Driver ID:', user?.id);

            isTrackingRef.current = true;

            // Watch position changes
            const locationOptions = Platform.OS === 'ios'
                ? {
                    enableHighAccuracy: true,
                    distanceFilter: 10,
                    showsBackgroundLocationIndicator: true,
                    allowsBackgroundLocationUpdates: true,
                    pausesLocationUpdatesAutomatically: false,
                    activityType: 'automotiveNavigation',
                }
                : {
                    enableHighAccuracy: true,
                    distanceFilter: 10,
                    interval: 10000,
                    fastestInterval: 5000,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                    // Android specific: explicitly disable iOS keys just in case
                };

            watchIdRef.current = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    console.log('📍 [GLOBAL TRACKING] New position:', {
                        lat: latitude.toFixed(6),
                        lng: longitude.toFixed(6),
                        accuracy: position.coords.accuracy?.toFixed(2)
                    });

                    // Check if we should update (moved 30m or more)
                    if (lastLocationRef.current) {
                        const distance = calculateDistance(
                            lastLocationRef.current.latitude,
                            lastLocationRef.current.longitude,
                            latitude,
                            longitude
                        );

                        console.log(`📏 [GLOBAL TRACKING] Distance: ${distance.toFixed(2)}m`);

                        if (distance >= 30) {
                            console.log('✅ [GLOBAL TRACKING] Moved 30m+, updating server');
                            updateLocationToServer(latitude, longitude);
                            lastLocationRef.current = { latitude, longitude };
                        } else {
                            console.log(`⏸️ [GLOBAL TRACKING] Distance < 30m, skipping (${distance.toFixed(2)}m)`);
                        }
                    } else {
                        // First location update
                        console.log('🎯 [GLOBAL TRACKING] First location, updating server');
                        updateLocationToServer(latitude, longitude);
                        lastLocationRef.current = { latitude, longitude };
                    }
                },
                (error) => {
                    console.error('❌ [GLOBAL TRACKING] GPS Error:', error.message);
                },
                locationOptions as any
            );

            // Set up 30-second fallback timer
            fallbackIntervalRef.current = setInterval(() => {
                const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
                const thirtySeconds = 30 * 1000;

                if (timeSinceLastUpdate >= thirtySeconds) {
                    console.log('⏰ [GLOBAL TRACKING] 30 seconds passed, forcing update');

                    try {
                        // Android options for getCurrentPosition
                        const fallbackOptions = Platform.OS === 'ios'
                            ? {
                                enableHighAccuracy: true,
                                timeout: 20000,
                                maximumAge: 10000
                            }
                            : {
                                enableHighAccuracy: true,
                                timeout: 30000,
                                maximumAge: 60000,
                                forceRequestLocation: true,
                                showLocationDialog: true
                            };

                        Geolocation.getCurrentPosition(
                            (position) => {
                                const { latitude, longitude } = position.coords;
                                // Validating coordinates before update
                                if (latitude && longitude) {
                                    updateLocationToServer(latitude, longitude);
                                    lastLocationRef.current = { latitude, longitude };
                                } else {
                                    console.warn('⚠️ [GLOBAL TRACKING] Invalid fallback coordinates received');
                                }
                            },
                            (error) => {
                                console.error('❌ [GLOBAL TRACKING] Fallback error:', error.message);
                                // Do not use last location blindly on error to avoid stale data loops
                            },
                            fallbackOptions
                        );
                    } catch (err) {
                        console.error('❌ [GLOBAL TRACKING] Fallback exception:', err);
                    }
                }
            }, 10000);

            console.log('✅ [GLOBAL TRACKING] Tracking started successfully');
        } catch (error: any) {
            console.error('❌ [GLOBAL TRACKING] Error starting tracking:', error?.message);
            isTrackingRef.current = false;
        }
    };

    // Stop location tracking
    const stopLocationTracking = () => {
        if (!isTrackingRef.current) {
            return;
        }

        console.log('🛑 [GLOBAL TRACKING] Stopping location tracking');

        if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
        }

        if (tripStatusCheckIntervalRef.current) {
            clearInterval(tripStatusCheckIntervalRef.current);
            tripStatusCheckIntervalRef.current = null;
        }

        isTrackingRef.current = false;
        tripIdRef.current = null;
        console.log('✅ [GLOBAL TRACKING] Tracking stopped');
    };

    // Fetch active trip and start tracking if available
    const checkAndStartTracking = async () => {
        try {
            if (!user?.id) {
                console.log('⚠️ [GLOBAL TRACKING] No user logged in');
                return;
            }

            console.log('🔍 [GLOBAL TRACKING] Checking for active trip...');

            const response = await axiosInstance.get(END_POINTS.TRUCKER_DRIVER_TRACKING);

            if (response.data?.status === 'success' && response.data?.data?.trip_id) {
                const tripId = response.data.data.trip_id;
                const tripStatus = response.data.data.trip_status;

                console.log('✅ [GLOBAL TRACKING] Active trip found');
                console.log('🆔 [GLOBAL TRACKING] Trip ID:', tripId);
                console.log('📊 [GLOBAL TRACKING] Trip Status:', tripStatus);

                if (tripStatus === 'active') {
                    tripIdRef.current = tripId;
                    await startLocationTracking();

                    // Start periodic trip status check (every 30 seconds)
                    if (!tripStatusCheckIntervalRef.current) {
                        tripStatusCheckIntervalRef.current = setInterval(async () => {
                            try {
                                console.log('🔄 [GLOBAL TRACKING] Checking trip status...');
                                const statusResponse = await axiosInstance.get(END_POINTS.TRUCKER_DRIVER_TRACKING);

                                if (statusResponse.data?.status === 'success' && statusResponse.data?.data) {
                                    const currentStatus = statusResponse.data.data.trip_status;
                                    console.log('📊 [GLOBAL TRACKING] Current trip status:', currentStatus);

                                    if (currentStatus === 'completed') {
                                        console.log('🏁 [GLOBAL TRACKING] Trip completed - stopping tracking');
                                        stopLocationTracking();
                                    }
                                } else {
                                    console.log('ℹ️ [GLOBAL TRACKING] No active trip - stopping tracking');
                                    stopLocationTracking();
                                }
                            } catch (error: any) {
                                console.error('❌ [GLOBAL TRACKING] Error checking trip status:', error?.message);
                            }
                        }, 30000); // Check every 30 seconds

                        console.log('✅ [GLOBAL TRACKING] Trip status check interval started');
                    }
                } else if (tripStatus === 'completed') {
                    console.log('🏁 [GLOBAL TRACKING] Trip is completed, not starting tracking');
                    stopLocationTracking();
                } else {
                    console.log('ℹ️ [GLOBAL TRACKING] Trip not active, skipping tracking');
                }
            } else {
                console.log('ℹ️ [GLOBAL TRACKING] No active trip found');
                stopLocationTracking();
            }
        } catch (error: any) {
            console.error('❌ [GLOBAL TRACKING] Error checking trip:', error?.message);
        }
    };

    // Main effect - check for active trip on mount with delay
    // useEffect(() => {
    //     let mounted = true;

    //     console.log('═══════════════════════════════════════════════════════════');
    //     console.log('🎬 [GLOBAL TRACKING] Hook mounted');
    //     console.log('👤 [GLOBAL TRACKING] User ID:', user?.id);
    //     console.log('═══════════════════════════════════════════════════════════');

    //     // Add delay to prevent immediate execution on mount
    //     const timer = setTimeout(() => {
    //         if (mounted && user?.id) {
    //             checkAndStartTracking();
    //         }
    //     }, 2000);

    //     return () => {
    //         mounted = false;
    //         clearTimeout(timer);
    //         console.log('🎬 [GLOBAL TRACKING] Hook unmounting, stopping tracking');
    //         stopLocationTracking();
    //     };
    // }, [user?.id]);

    // Return nothing - this is a side-effect only hook
    return null;
}

export default useDriverLocationTracking;
