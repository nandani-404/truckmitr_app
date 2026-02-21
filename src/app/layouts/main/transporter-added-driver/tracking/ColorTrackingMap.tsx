import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import polyline from '@mapbox/polyline';
import axiosInstance from 'src/utils/config/axiosInstance';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const LIVE_POLL_INTERVAL_MS = 15000;
const TRUCK_ANIMATION_DURATION_MS = 1500;
const TRUCK_ANIMATION_STEPS = 30;
const OFF_ROUTE_THRESHOLD_KM = 0.5;

// 3D truck PNG images by color_code
const TRUCK_IMAGES: Record<string, number> = {
    BROWN: require('src/assets/tracking_color_truck/brown.png'),
    GREEN: require('src/assets/tracking_color_truck/green.png'),
    YELLOW: require('src/assets/tracking_color_truck/yellow.png'),
    RED: require('src/assets/tracking_color_truck/red.png'),
    BLUE: require('src/assets/tracking_color_truck/blue.png'),
    BLACK: require('src/assets/tracking_color_truck/black.png'),
};

const getTruckImage = (code?: string): number => {
    const c = (code || '').toUpperCase();
    return TRUCK_IMAGES[c] ?? TRUCK_IMAGES.GREEN;
};

type LatLng = { latitude: number; longitude: number };

type VehicleTrackingItem = {
    vehicle_id: number | string;
    vehicle_number?: string;
    driver_name?: string;
    latitude: number | string;
    longitude: number | string;
    color_code?: 'GREEN' | 'RED' | 'YELLOW' | 'BROWN' | 'BLUE' | 'BLACK' | string;
    encoded_polyline?: string;
    traveled_polyline?: string;
    off_route_km?: number;
    heading?: number;
    vehicle_head?: number; // API: truck heading in degrees (0–360)
    updated_at?: string;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    endpoint: string;
    /** Selected route polyline (encoded) from Google Directions — source to destination */
    selectedRoutePolyline?: string;
};

const COLOR_BY_CODE: Record<string, string> = {
    BROWN: '#795548',
    GREEN: '#2ecc71',
    YELLOW: '#f1c40f',
    RED: '#e74c3c',
    BLUE: '#2196F3',
    BLACK: '#212121',
};

const COLOR_LABELS: Record<string, string> = {
    BROWN: 'To Pickup',
    GREEN: 'On Route (<15m)',
    YELLOW: 'Stale (15m–1h)',
    RED: 'No Update (>1h)',
    BLUE: 'At Destination',
    BLACK: 'Delivered',
};

const getMarkerColor = (code?: string) => {
    const c = (code || '').toUpperCase();
    return COLOR_BY_CODE[c] ?? '#2874F0';
};

const parseHeading = (val: unknown): number | undefined => {
    if (val == null) return undefined;
    const n = typeof val === 'number' ? val : parseFloat(String(val));
    return Number.isFinite(n) ? (n + 360) % 360 : undefined;
};

const decodePolylineToCoords = (encoded?: string): LatLng[] => {
    if (!encoded) return [];
    try {
        const decoded = polyline.decode(encoded) as [number, number][];
        return decoded.map(([latitude, longitude]) => ({ latitude, longitude }));
    } catch {
        return [];
    }
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const bearingBetween = (from: LatLng, to: LatLng): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const dLon = toRad(to.longitude - from.longitude);
    const y = Math.sin(dLon) * Math.cos(toRad(to.latitude));
    const x =
        Math.cos(toRad(from.latitude)) * Math.sin(toRad(to.latitude)) -
        Math.sin(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// ──────────────────────────────────────────────────────────────────────────────
// Off-route alert banner
// ──────────────────────────────────────────────────────────────────────────────
const OffRouteAlert: React.FC<{ vehicles: { vehicle_number?: string; off_route_km: number }[] }> = ({ vehicles }) => {
    if (vehicles.length === 0) return null;
    return (
        <View style={styles.offRouteBar}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#FFF" />
            {vehicles.map((v, i) => (
                <Text key={i} style={styles.offRouteText}>
                    {v.vehicle_number || 'Vehicle'} is {v.off_route_km.toFixed(1)} km off-route
                </Text>
            ))}
        </View>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// In-app notification for YELLOW / RED
// ──────────────────────────────────────────────────────────────────────────────
const StatusAlert: React.FC<{ alerts: { vehicle_number?: string; code: string; label: string }[] }> = ({ alerts }) => {
    if (alerts.length === 0) return null;
    return (
        <View style={styles.statusAlertBar}>
            <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#FFF" />
            {alerts.map((a, i) => (
                <Text key={i} style={styles.statusAlertText}>
                    {a.vehicle_number || 'Vehicle'}: {a.label}
                </Text>
            ))}
        </View>
    );
};

// No custom TruckMarkerView needed — using PNG image directly on Marker

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
const ColorTrackingMap: React.FC<Props> = ({ visible, onClose, endpoint, selectedRoutePolyline }) => {
    const mapRef = useRef<MapView>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const animRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
    const initialFitDone = useRef(false);
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState<VehicleTrackingItem[]>([]);
    const [lastFetchedAt, setLastFetchedAt] = useState<string>('');
    const [displayCoords, setDisplayCoords] = useState<Record<string, LatLng>>({});
    const [headings, setHeadings] = useState<Record<string, number>>({});
    const notifiedRef = useRef<Set<string>>(new Set());

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchTrackingData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(endpoint);
            const list = response?.data?.data?.vehicles || response?.data?.data?.tracking || [];
            setVehicles(Array.isArray(list) ? list : []);
            setLastFetchedAt(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Tracking fetch failed:', error);
            showToast('Failed to fetch tracking data');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        if (!visible) {
            // Reset the initial fit flag when modal is closed so it fits again on next open
            initialFitDone.current = false;
            return;
        }
        fetchTrackingData();
        pollRef.current = setInterval(fetchTrackingData, LIVE_POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            Object.values(animRef.current).forEach(id => clearInterval(id));
            animRef.current = {};
        };
    }, [visible, fetchTrackingData]);

    // ── Parse ────────────────────────────────────────────────────────────────
    const vehiclesWithParsedCoords = useMemo(() => {
        const parseTime = (value?: string) => {
            if (!value || value === '0000-00-00 00:00:00') return 0;
            const ts = new Date(value).getTime();
            return Number.isNaN(ts) ? 0 : ts;
        };

        const latestByVehicle = new Map<string, VehicleTrackingItem>();
        vehicles.forEach((v, idx) => {
            const idKey = String(v.vehicle_id ?? `${v.vehicle_number || 'vehicle'}-${idx}`);
            const prev = latestByVehicle.get(idKey);
            if (!prev || parseTime(v.updated_at) >= parseTime(prev.updated_at)) {
                latestByVehicle.set(idKey, v);
            }
        });

        return Array.from(latestByVehicle.values())
            .map(v => ({
                ...v,
                _uniqueKey: String(v.vehicle_id),
                latitudeNum: Number(v.latitude),
                longitudeNum: Number(v.longitude),
            }))
            .filter(v => !Number.isNaN(v.latitudeNum) && !Number.isNaN(v.longitudeNum));
    }, [vehicles]);

    // ── Animate truck movement ───────────────────────────────────────────────
    useEffect(() => {
        const stepMs = TRUCK_ANIMATION_DURATION_MS / TRUCK_ANIMATION_STEPS;
        vehiclesWithParsedCoords.forEach(v => {
            const key = v._uniqueKey;
            const target: LatLng = { latitude: v.latitudeNum, longitude: v.longitudeNum };
            const apiHeading = parseHeading((v as { vehicle_head?: unknown }).vehicle_head ?? v.heading);
            const start = displayCoords[key];

            if (!start) {
                setDisplayCoords(prev => ({ ...prev, [key]: target }));
                if (apiHeading !== undefined) {
                    setHeadings(prev => ({ ...prev, [key]: apiHeading }));
                }
                return;
            }

            if (Math.abs(start.latitude - target.latitude) < 1e-6 && Math.abs(start.longitude - target.longitude) < 1e-6) {
                return;
            }

            const bearing = apiHeading ?? bearingBetween(start, target);
            setHeadings(prev => ({ ...prev, [key]: bearing }));

            if (animRef.current[key]) clearInterval(animRef.current[key]);
            let step = 0;
            animRef.current[key] = setInterval(() => {
                step += 1;
                const t = step >= TRUCK_ANIMATION_STEPS ? 1 : step / TRUCK_ANIMATION_STEPS;
                const eased = t * (2 - t);
                setDisplayCoords(prev => ({
                    ...prev,
                    [key]: {
                        latitude: lerp(start.latitude, target.latitude, eased),
                        longitude: lerp(start.longitude, target.longitude, eased),
                    },
                }));
                if (step >= TRUCK_ANIMATION_STEPS) {
                    if (animRef.current[key]) clearInterval(animRef.current[key]);
                    delete animRef.current[key];
                }
            }, stepMs);
        });
    }, [vehiclesWithParsedCoords]);

    // ── In-app notification for YELLOW / RED (toast once per vehicle per poll) ─
    useEffect(() => {
        vehiclesWithParsedCoords.forEach(v => {
            const code = (v.color_code || '').toUpperCase();
            const alertKey = `${v._uniqueKey}-${code}`;
            if ((code === 'YELLOW' || code === 'RED') && !notifiedRef.current.has(alertKey)) {
                notifiedRef.current.add(alertKey);
                const label = code === 'RED' ? 'No update >1 hr' : 'No update 15m–1h';
                showToast(`${v.vehicle_number || 'Vehicle'}: ${label}`);
            }
        });
    }, [vehiclesWithParsedCoords]);

    // ── Route overlays (planned route = geo-fenced) ──────────────────────────
    const routeOverlays = useMemo(() => {
        const overlays: { key: string; color: string; points: LatLng[] }[] = [];

        // Selected route from Google Directions (source → destination)
        if (selectedRoutePolyline) {
            const pts = decodePolylineToCoords(selectedRoutePolyline);
            if (pts.length > 1) {
                overlays.push({ key: 'selected-route', color: '#2874F0', points: pts });
            }
        }

        // Per-vehicle polylines from API (when available)
        vehiclesWithParsedCoords.forEach(v => {
            const pts = decodePolylineToCoords(v.encoded_polyline);
            if (pts.length > 1) {
                overlays.push({ key: `route-${v._uniqueKey}`, color: getMarkerColor(v.color_code), points: pts });
            }
        });

        return overlays;
    }, [vehiclesWithParsedCoords, selectedRoutePolyline]);

    // ── Trail overlays (actual traveled path) ────────────────────────────────
    const trailOverlays = useMemo(() => {
        return vehiclesWithParsedCoords
            .filter(v => v.traveled_polyline)
            .map(v => ({
                key: v._uniqueKey,
                points: decodePolylineToCoords(v.traveled_polyline),
            }));
    }, [vehiclesWithParsedCoords]);

    // ── Display coordinates for markers ──────────────────────────────────────
    const vehiclesForMap = useMemo(() => {
        return vehiclesWithParsedCoords.map(v => {
            const disp = displayCoords[v._uniqueKey];
            const apiHeading = parseHeading((v as { vehicle_head?: unknown }).vehicle_head ?? v.heading);
            return {
                ...v,
                displayLat: disp?.latitude ?? v.latitudeNum,
                displayLng: disp?.longitude ?? v.longitudeNum,
                displayHeading: apiHeading ?? headings[v._uniqueKey] ?? 0,
            };
        });
    }, [vehiclesWithParsedCoords, displayCoords, headings]);

    // ── Off-route vehicles ───────────────────────────────────────────────────
    const offRouteVehicles = useMemo(() => {
        return vehiclesForMap
            .filter(v => (v.off_route_km ?? 0) >= OFF_ROUTE_THRESHOLD_KM)
            .map(v => ({ vehicle_number: v.vehicle_number, off_route_km: v.off_route_km ?? 0 }));
    }, [vehiclesForMap]);

    // ── Status alerts (YELLOW / RED currently visible) ───────────────────────
    const statusAlerts = useMemo(() => {
        return vehiclesForMap
            .filter(v => {
                const c = (v.color_code || '').toUpperCase();
                return c === 'YELLOW' || c === 'RED';
            })
            .map(v => {
                const c = (v.color_code || '').toUpperCase();
                return {
                    vehicle_number: v.vehicle_number,
                    code: c,
                    label: COLOR_LABELS[c] || c,
                };
            });
    }, [vehiclesForMap]);

    // ── Fit map to all points (only on initial load, not on every poll) ─────
    useEffect(() => {
        if (!visible || !mapRef.current || initialFitDone.current) return;
        const allPolylinePoints = routeOverlays.flatMap(r => r.points);
        const trailPoints = trailOverlays.flatMap(r => r.points);
        const markerPoints: LatLng[] = vehiclesForMap.map(v => ({
            latitude: v.displayLat,
            longitude: v.displayLng,
        }));
        const points = [...allPolylinePoints, ...trailPoints, ...markerPoints];

        if (points.length > 0) {
            initialFitDone.current = true;
            setTimeout(() => {
                mapRef.current?.fitToCoordinates(points, {
                    edgePadding: { top: 100, right: 40, bottom: 260, left: 40 },
                    animated: true,
                });
            }, 300);
        }
    }, [visible, routeOverlays, trailOverlays, vehiclesForMap]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={{
                        latitude: 28.6139,
                        longitude: 77.209,
                        latitudeDelta: 2,
                        longitudeDelta: 2,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass={true}
                    rotateEnabled={true}
                    mapType="standard"
                >
                    {/* Planned route (geo-fenced) — solid colored line */}
                    {routeOverlays.map(route =>
                        route.points.length > 1 ? (
                            <Polyline
                                key={`route-${route.key}`}
                                coordinates={route.points}
                                strokeColor={route.color}
                                strokeWidth={6}
                                lineCap="round"
                                lineJoin="round"
                            />
                        ) : null,
                    )}

                    {/* Actual traveled trail — dashed lighter line */}
                    {trailOverlays.map(trail =>
                        trail.points.length > 1 ? (
                            <Polyline
                                key={`trail-${trail.key}`}
                                coordinates={trail.points}
                                strokeColor="#1E88E5"
                                strokeWidth={4}
                                lineCap="round"
                                lineJoin="round"
                                lineDashPattern={[8, 6]}
                            />
                        ) : null,
                    )}

                    {/* Truck markers — 3D PNG, flat on map, rotates by heading */}
                    {vehiclesForMap.map((vehicle, idx) => {
                        const code = (vehicle.color_code || '').toUpperCase();
                        const statusLabel = COLOR_LABELS[code] || code;
                        const truckImg = getTruckImage(vehicle.color_code);

                        return (
                            <Marker
                                key={`truck-${vehicle._uniqueKey}`}
                                coordinate={{ latitude: vehicle.displayLat, longitude: vehicle.displayLng }}
                                image={truckImg}
                                anchor={{ x: 0.5, y: 0.5 }}
                                rotation={vehicle.displayHeading}
                                flat={true}
                                zIndex={200 + idx}
                                tracksViewChanges={false}
                                title={vehicle.vehicle_number || 'Vehicle'}
                                description={`${vehicle.driver_name || 'Driver'} • ${statusLabel}`}
                            />
                        );
                    })}
                </MapView>

                {/* Top bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={20} color="#212121" />
                    </TouchableOpacity>
                    <View style={styles.statusChip}>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                        <Text style={styles.statusText}>
                            {loading ? 'Refreshing...' : `Updated ${lastFetchedAt || '--'}`}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchTrackingData}>
                        <MaterialCommunityIcons name="refresh" size={20} color="#2874F0" />
                    </TouchableOpacity>
                </View>

                {/* Off-route alert */}
                <OffRouteAlert vehicles={offRouteVehicles} />

                {/* Status alert for YELLOW/RED */}
                <StatusAlert alerts={statusAlerts} />

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendRow}>
                        <View style={styles.legendCol}>
                            <Text style={styles.legendTitle}>Route</Text>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { backgroundColor: '#2ecc71' }]} />
                                <Text style={styles.legendText}>Planned</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { backgroundColor: '#1E88E5', borderStyle: 'dashed' }]} />
                                <Text style={styles.legendText}>Traveled</Text>
                            </View>
                        </View>
                        <View style={styles.legendCol}>
                            <Text style={styles.legendTitle}>Truck Status</Text>
                            {Object.entries(COLOR_BY_CODE).map(([label, color]) => (
                                <View key={label} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                                    <Text style={styles.legendText}>{COLOR_LABELS[label]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Initial loader */}
                {loading && vehicles.length === 0 && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#2874F0" />
                        <Text style={styles.loaderText}>Loading live tracking...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // (Truck marker uses PNG image via Marker `image` prop — no custom styles needed)

    // Top bar
    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 40,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeBtn: {
        backgroundColor: '#FFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            android: { elevation: 4 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
        }),
    },
    statusChip: {
        marginLeft: 10,
        backgroundColor: '#FFFFFFEE',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            android: { elevation: 3 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
        }),
    },
    refreshBtn: {
        backgroundColor: '#FFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        ...Platform.select({
            android: { elevation: 4 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
        }),
    },
    liveBadge: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e74c3c', marginRight: 4 },
    liveText: { fontSize: 11, fontWeight: '800', color: '#e74c3c', letterSpacing: 0.5 },
    statusText: { color: '#444', fontSize: 12, fontWeight: '600' },

    // Off-route alert bar
    offRouteBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 104 : 90,
        left: 16,
        right: 16,
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        ...Platform.select({
            android: { elevation: 5 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
        }),
    },
    offRouteText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },

    // Status alert bar (YELLOW/RED notification)
    statusAlertBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 104 : 90,
        left: 16,
        right: 16,
        backgroundColor: '#E65100',
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        ...Platform.select({
            android: { elevation: 5 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
        }),
    },
    statusAlertText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },

    // Legend
    legend: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFFEE',
        borderRadius: 14,
        padding: 14,
        ...Platform.select({
            android: { elevation: 4 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
        }),
    },
    legendRow: { flexDirection: 'row' },
    legendCol: { flex: 1 },
    legendTitle: { fontSize: 11, color: '#212121', fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendLine: { width: 18, height: 4, borderRadius: 2, marginRight: 6 },
    legendText: { fontSize: 11, color: '#444', fontWeight: '600' },

    // Loader
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderText: { marginTop: 10, fontSize: 14, color: '#444', fontWeight: '600' },
});

export default ColorTrackingMap;
