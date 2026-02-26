import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Switch, StatusBar, Dimensions, Animated, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { toggleAppMode } from '../../../../redux/slices/appModeSlice';
import { BASE_URL, END_POINTS } from 'src/utils/config';
import axiosInstance from 'src/utils/config/axiosInstance';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const COLORS = {
    primary: '#6467f2',
    bg: '#f6f6f8',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    action: '#6467f2',
    actionLight: 'rgba(100, 103, 242, 0.1)',
    success: '#10b981',
    successLight: '#ecfdf5',
    danger: '#ef4444',
    white: '#FFFFFF',
    warning: '#f59e0b',
    warningLight: '#fffbeb',
};

// ─────────────────────────────────────────────
// Icons (Matching Google Material Symbols style)
// ─────────────────────────────────────────────
const BellIcon = ({ color = COLORS.textPrimary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
);
const VerifiedIcon = ({ color = COLORS.primary }: { color?: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </Svg>
);
const TruckIconLarge = ({ color = COLORS.primary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="1" y="3" width="15" height="13" />
        <Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);
const PendingIcon = ({ color = '#f59e0b' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);
const CalendarIcon = ({ color = COLORS.primary }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
);
const PaymentIcon = ({ color = '#6366f1' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="4" width="20" height="16" rx="2" />
        <Path d="M12 11h.01" />
    </Svg>
);
const StarIcon = ({ color = '#f59e0b' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
        <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </Svg>
);
const SearchIcon = ({ color = COLORS.primary }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="11" cy="11" r="8" />
        <Path d="M21 21l-4.35-4.35" />
    </Svg>
);
const GavelIcon = ({ color = '#2563eb' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14.5 12.5l5 5M12.5 10.5l5 5M4 17.5l2-2 2 2-2 2zM9.5 7.5L4 13l3 3 5.5-5.5" />
    </Svg>
);
const WalletIcon = ({ color = '#10b981' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 12V8a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-4" />
        <Path d="M16 12h4" />
    </Svg>
);
const CarIcon = ({ color = '#8b5cf6' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 002 12v4c0 .6.4 1 1 1h2" />
        <Circle cx="7" cy="17" r="2" />
        <Circle cx="17" cy="17" r="2" />
    </Svg>
);
const UserPlusIcon = ({ color = '#ea580c' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <Circle cx="8.5" cy="7" r="4" />
        <Line x1="20" y1="8" x2="20" y2="14" />
        <Line x1="23" y1="11" x2="17" y2="11" />
    </Svg>
);
const BankIcon = ({ color = '#e11d48' }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="10" width="20" height="12" rx="2" />
        <Path d="M12 2L2 7l10 5 10-5-10-5z" />
        <Path d="M6 10v12M18 10v12M12 10v12" />
    </Svg>
);
const SwapIcon = ({ color = COLORS.white }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M7 16V4M7 4L3 8M7 4L11 8M17 8v12M17 20l4-4M17 20l-4-4" />
    </Svg>
);
const ChevronRightIcon = ({ color = COLORS.white }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
    </Svg>
);
const MapTrackingIcon = ({ color = COLORS.white }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
        <Circle cx="12" cy="10" r="3" />
    </Svg>
);

// Helper for Line in UserPlusIcon
const ArrowRightIcon = ({ color = COLORS.textTertiary }: { color?: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
);
const TruckIconMini = ({ color = COLORS.textSecondary }: { color?: string }) => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

// Helper for Line in UserPlusIcon
const Line = (props: any) => <Path d={`M${props.x1} ${props.y1}L${props.x2} ${props.y2}`} />;


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Props {
    onNavigateToFindLoads?: () => void;
    onNavigateToMyTrips?: () => void;
    onNavigateToPayments?: () => void;
    onNavigateToMyVehicles?: () => void;
    onNavigateToTripDetails?: (id: string) => void;
    onNavigateToNotifications?: () => void;
    onNavigateToProfile?: () => void;
    onNavigateToAddDriver?: () => void;
    onNavigateToAddBankDetails?: () => void;
    onNavigateToAllLiveTracking?: () => void;
}

// ─────────────────────────────────────────────
// Switch to Transporter Mode Card
// ─────────────────────────────────────────────
const SwitchToTransporterCard = () => {
    const dispatch = useDispatch();
    const isTransitioning = useSelector((state: any) => state.appMode.isTransitioning);

    const handleToggle = () => {
        if (isTransitioning) return;
        dispatch(toggleAppMode());
    };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={handleToggle} disabled={isTransitioning} style={styles.transporterBanner}>
            <View style={styles.transporterBannerLeft}>
                <View style={styles.transporterIconCircle}>
                    <SwapIcon color={COLORS.white} />
                </View>
                <View>
                    <Text style={styles.transporterTitle}>Transporter Mode</Text>
                    <Text style={styles.transporterSub}>Switch to hire other trucks</Text>
                </View>
            </View>
            <View style={styles.transporterChevron}>
                <ChevronRightIcon color={COLORS.white} />
            </View>
        </TouchableOpacity>
    );
};

// ─────────────────────────────────────────────
// Accepted Bid Card Component
// ─────────────────────────────────────────────
const AcceptedBidCard = ({ bid, index, isMultiple, onPress, fadeAnim }: any) => {
    const arrow1Anim = useRef(new Animated.Value(0)).current;
    const arrow2Anim = useRef(new Animated.Value(0)).current;
    const arrow3Anim = useRef(new Animated.Value(0)).current;
    // Show arrows for In Transit and Reached Destination (until Delivered)
    const isInTransit = bid.current_status_label === 'In Transit' || bid.current_status_label === 'Reached Destination';

    useEffect(() => {
        if (isInTransit) {
            // Stagger the arrows for a flowing effect
            const createArrowAnimation = (animValue: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            Animated.parallel([
                createArrowAnimation(arrow1Anim, 0),
                createArrowAnimation(arrow2Anim, 500),
                createArrowAnimation(arrow3Anim, 1000),
            ]).start();
        }
    }, [isInTransit]);

    const getArrowStyle = (animValue: Animated.Value) => ({
        transform: [
            {
                translateX: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 70],
                }),
            },
        ],
        opacity: animValue.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0],
        }),
    });

    const formatCurrency = (val: any) => {
        const num = Number(val) || 0;
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    const getButtonText = () => {
        if (bid.current_status_label === 'Load Accepted') return 'Add Vehicle & Driver';
        if (bid.current_status_label === 'Vehicle Assigned') return 'Mark Reached Pickup';
        if (bid.current_status_label === 'Reached Pickup') return 'Mark Loaded';
        if (bid.current_status_label === 'Loaded') return 'Upload Bility & Start Transit';
        if (bid.current_status_label === 'In Transit') return 'Mark Reached Destination';
        if (bid.current_status_label === 'Reached Destination') return 'Upload POD & Complete';
        if (bid.current_status_label === 'Delivered') return 'Completed';
        return bid.current_status_label || 'Update Status';
    };

    return (
        <Animated.View
            style={[
                isMultiple ? styles.acceptedBidCardHorizontal : styles.card,
                styles.acceptedBidCard,
                { opacity: fadeAnim },
            ]}
        >
            <View style={styles.bidCardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.bidLoadId}>{bid.load_id || 'N/A'}</Text>
                    <Text style={styles.bidStatusLabel}>Current Bid Status</Text>
                </View>
                <View style={styles.acceptedBadge}>
                    <View style={styles.acceptedDot} />
                    <Text style={styles.acceptedText}>Accepted</Text>
                </View>
            </View>

            {/* Current Status */}
            {bid.current_status_label && (
                <View style={styles.currentBidStatus}>
                    <Text style={styles.currentBidStatusLabel}>Status:</Text>
                    <Text style={styles.currentBidStatusValue}>{bid.current_status_label}</Text>
                </View>
            )}

            {/* Route */}
            <View style={styles.bidRoute}>
                <View style={styles.bidRoutePoint}>
                    <View style={[styles.bidRouteDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.bidRouteText} numberOfLines={1}>
                        {bid.origin_location?.split(',')[0] || 'N/A'}
                    </Text>
                </View>
                {isInTransit ? (
                    <View style={{ position: 'relative', flex: 1, height: 16, justifyContent: 'center', overflow: 'hidden', marginHorizontal: 6 }}>
                        <Animated.Text style={[{ position: 'absolute', left: -10, color: COLORS.success, fontSize: 14, fontWeight: 'bold' }, getArrowStyle(arrow1Anim)]}>
                            →
                        </Animated.Text>
                        <Animated.Text style={[{ position: 'absolute', left: -10, color: COLORS.success, fontSize: 14, fontWeight: 'bold' }, getArrowStyle(arrow2Anim)]}>
                            →
                        </Animated.Text>
                        <Animated.Text style={[{ position: 'absolute', left: -10, color: COLORS.success, fontSize: 14, fontWeight: 'bold' }, getArrowStyle(arrow3Anim)]}>
                            →
                        </Animated.Text>
                    </View>
                ) : (
                    <Text style={styles.bidRouteArrow}>→</Text>
                )}
                <View style={styles.bidRoutePoint}>
                    <View style={[styles.bidRouteDot, { backgroundColor: COLORS.danger }]} />
                    <Text style={styles.bidRouteText} numberOfLines={1}>
                        {bid.destination_location?.split(',')[0] || 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Price */}
            <View style={styles.bidPriceRow}>
                <View style={styles.bidPriceItem}>
                    <Text style={styles.bidPriceLabel}>Offered Price</Text>
                    <Text style={styles.bidPriceValue}>
                        {formatCurrency(bid.trucker_updated_price || bid.trucker_price)}
                    </Text>
                </View>
                {parseFloat(bid.trucker_received_amount) > 0 ? (
                    <View style={[styles.bidPriceItem, { backgroundColor: COLORS.successLight }]}>
                        <Text style={[styles.bidPriceLabel, { color: COLORS.success }]}>Received</Text>
                        <Text style={[styles.bidPriceValue, { color: COLORS.success }]}>
                            {formatCurrency(bid.trucker_received_amount)}
                        </Text>
                    </View>
                ) : bid.trucker_updated_price && (
                    <View style={styles.bidPriceItem}>
                        <Text style={styles.bidPriceLabel}>Your Bid</Text>
                        <Text
                            style={[
                                styles.bidPriceValue,
                                { fontSize: 11, textDecorationLine: 'line-through', color: COLORS.textTertiary },
                            ]}
                        >
                            {formatCurrency(bid.trucker_price)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.bidActionBtn} onPress={onPress} activeOpacity={0.7}>
                {isInTransit ? (
                    <>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M1 3h15v13H1z" />
                            <Path d="M16 8h4l3 3v5h-7V8z" />
                            <Circle cx="5.5" cy="18.5" r="2.5" />
                            <Circle cx="18.5" cy="18.5" r="2.5" />
                        </Svg>
                        <Text style={styles.bidActionText}>{getButtonText()}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.bidActionText}>{getButtonText()}</Text>
                        <ArrowRightIcon color={COLORS.white} />
                    </>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────
const TruckerHomeScreen: React.FC<Props> = (props) => {
    const [isAvailable, setIsAvailable] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(16)).current;
    const { user } = useSelector((state: any) => state.user) || {};

    // Dynamic Data State
    const [dashboardData, setDashboardData] = useState({
        availableLoads: 0,
        myLoads: 0,
        vehicleCount: 0,
        pendingEarnings: 0,
        thisMonthEarnings: 0,
        totalEarnings: 0,
        rating: 0,
    });
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [acceptedBids, setAcceptedBids] = useState<any[]>([]);

    // Status priority mapping (lower number = higher priority)
    const getStatusPriority = (statusLabel: string | null): number => {
        const statusMap: { [key: string]: number } = {
            'Load Accepted': 0,
            'Vehicle Assigned': 1,
            'Reached Pickup': 2,
            'Loaded': 3,
            'In Transit': 4,
            'Reached Destination': 5,
            'Delivered': 6,
        };
        return statusMap[statusLabel || ''] ?? 999; // Unknown statuses go to end
    };

    const safeString = (val: any) => {
        if (val === null || val === undefined) return 'N/A';
        if (typeof val === 'object') return val.length_label || val.name || val.label || 'N/A';
        return String(val);
    };

    // ── Fetch Data ──
    const fetchDashboardData = async () => {
        try {
            const [statsRes, appliedRes]: any = await Promise.allSettled([
                axiosInstance.get(END_POINTS.TRUCKER_DASHBOARD_STATS),
                axiosInstance.get(END_POINTS.TRUCKER_APPLIED_LOADS),
            ]);

            let payloadStats: any = {};
            let payloadPayments: any = {};
            let currentActiveTrip = null;

            if (statsRes.status === 'fulfilled' && statsRes.value?.data?.status === 'success') {
                const data = statsRes.value.data.data || {};
                payloadStats = data.stats || {};
                payloadPayments = data.payment_details || {};
            }

            if (appliedRes.status === 'fulfilled' && appliedRes.value?.data?.status === 'success') {
                const list = appliedRes.value.data.data?.data || appliedRes.value.data.data || [];
                // Count active trips (status '1')
                const active = list.filter((l: any) => l.status === '1');
                if (active.length > 0) {
                    const trip = active[0];
                    currentActiveTrip = {
                        id: trip.load_id,
                        origin: trip.origin_location?.split(',')[0],
                        destination: trip.destination_location?.split(',')[0],
                        status: 'In Transit',
                        progress: 0.1, // Default progress as API doesn't provide it
                        shipper: trip.user?.name || 'Unknown Shipper',
                        material: safeString(trip.meterial),
                        eta: 'In Progress',
                    };
                }

                // Get accepted bids and sort by status priority
                const accepted = list.filter((l: any) => l.shipper_status === 'accepted');
                const sortedAccepted = accepted.sort((a: any, b: any) => {
                    const priorityA = getStatusPriority(a.current_status_label);
                    const priorityB = getStatusPriority(b.current_status_label);
                    return priorityA - priorityB; // Lower priority number comes first
                });
                setAcceptedBids(sortedAccepted);
            }

            setDashboardData(prev => ({
                ...prev,
                availableLoads: payloadStats.available_loads ?? 0,
                myLoads: payloadStats.my_loads ?? 0,
                vehicleCount: payloadStats.my_vehicles ?? 0,
                pendingEarnings: payloadPayments.pending_payment ?? 0,
                thisMonthEarnings: payloadPayments.this_month_earning ?? 0,
                totalEarnings: payloadPayments.total_earning ?? 0,
                rating: payloadStats.rating ?? user?.driver_rating ?? 0,
            }));
            setActiveTrip(currentActiveTrip);

        } catch (error) {
            console.log('Error fetching dashboard data', error);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [])
    );

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatCurrency = (val: any) => {
        const num = Number(val) || 0;
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    // ── Earnings Data ──
    const earningsData = [
        { label: 'Pending', value: formatCurrency(dashboardData.pendingEarnings), icon: <PendingIcon color="#f59e0b" />, iconBg: '#fffbeb' },
        { label: 'This Month', value: formatCurrency(dashboardData.thisMonthEarnings), icon: <CalendarIcon color={COLORS.primary} />, iconBg: 'rgba(100, 103, 242, 0.1)' },
        { label: 'Total', value: formatCurrency(dashboardData.totalEarnings), icon: <PaymentIcon color="#6366f1" />, iconBg: '#eef2ff' },
        { label: 'Rating', value: Number(dashboardData.rating || 4.9).toFixed(1), icon: <StarIcon color="#f59e0b" />, iconBg: '#fffbeb' },
    ];

    // ── Quick Actions Data ──
    const quickActions = [
        { label: 'Find Loads', sub: `${dashboardData.availableLoads} available`, icon: <SearchIcon color={COLORS.primary} />, iconBg: 'rgba(100, 103, 242, 0.1)', onPress: props.onNavigateToFindLoads },
        { label: 'My Loads', sub: `${dashboardData.myLoads} loads`, icon: <GavelIcon color="#2563eb" />, iconBg: '#eff6ff', onPress: props.onNavigateToMyTrips },
        { label: 'Payments', sub: `${Number(dashboardData.pendingEarnings) > 0 ? '2' : '0'} pending`, icon: <WalletIcon color="#10b981" />, iconBg: '#ecfdf5', onPress: props.onNavigateToPayments },
        { label: 'My Vehicles', sub: `${dashboardData.vehicleCount} vehicles`, icon: <CarIcon color="#8b5cf6" />, iconBg: '#f5f3ff', onPress: props.onNavigateToMyVehicles },
        { label: 'Add Driver', sub: '0 pending', icon: <UserPlusIcon color="#ea580c" />, iconBg: '#fff7ed', onPress: props.onNavigateToAddDriver },
        { label: 'Add Bank', sub: 'Primary set', icon: <BankIcon color="#e11d48" />, iconBg: '#fff1f2', onPress: props.onNavigateToAddBankDetails },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.action]} tintColor={COLORS.action} />}
            >
                {/* ── Profile Header ── */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity style={styles.profileRow} onPress={props.onNavigateToProfile} activeOpacity={0.7}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: user?.images ? `${BASE_URL}public/${user.images}` : 'https://lh3.googleusercontent.com/a/ACg8ocL_F9u8N4q8c8d8x7z6v5c4b3a2=s96-c' }} style={styles.avatar} />
                            {isAvailable && <View style={styles.onlineDot} />}
                        </View>
                        <View style={styles.profileInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.userName}>{user?.name || 'Tarun Test'}</Text>
                                <VerifiedIcon />
                            </View>
                            <Text style={styles.verifiedSubtitle}>Verified Logistics Partner</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notifBtn} onPress={props.onNavigateToNotifications} activeOpacity={0.7}>
                        <BellIcon color={COLORS.textPrimary} />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Availability Card ── */}
                <Animated.View style={[styles.availCardNew, { opacity: fadeAnim }]}>
                    <View style={styles.availCardLeft}>
                        <View style={styles.availIconBox}>
                            <TruckIconLarge color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.availTitleNew}>Available for Loads</Text>
                            <Text style={styles.availSubNew}>Visible to 450+ shippers</Text>
                        </View>
                    </View>
                    <Switch
                        value={isAvailable}
                        onValueChange={setIsAvailable}
                        trackColor={{ false: '#e2e8f0', true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor="#e2e8f0"
                    />
                </Animated.View>

                {/* ── Active Trip Card (Only if active) ── */}
                {activeTrip && (
                    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                        <View style={styles.tripHeader}>
                            <View>
                                <Text style={styles.tripLabel}>Active Trip</Text>
                                <Text style={styles.tripId}>Load ID: {activeTrip.id}</Text>
                            </View>
                            <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>{activeTrip.status}</Text></View>
                        </View>
                        <View style={styles.routeContainer}>
                            <View style={styles.routeEndpoint}><View style={[styles.routeDot, { backgroundColor: COLORS.action }]} /><Text style={styles.routeCity}>{activeTrip.origin}</Text></View>
                            <View style={styles.routeLineContainer}>
                                <View style={styles.routeLine}><View style={[styles.routeProgress, { width: `${(activeTrip.progress || 0) * 100}%` }]} /></View>
                                <View style={[styles.truckMarker, { left: `${(activeTrip.progress || 0) * 100}%` }]}><View style={styles.truckMarkerDot} /></View>
                            </View>
                            <View style={styles.routeEndpoint}><View style={[styles.routeDot, { backgroundColor: COLORS.textTertiary }]} /><Text style={styles.routeCity}>{activeTrip.destination}</Text></View>
                        </View>
                        <View style={styles.tripDetailsRow}>
                            <View style={styles.tripDetailItem}><Text style={styles.tripDetailLabel}>Shipper</Text><Text style={styles.tripDetailValue}>{activeTrip.shipper}</Text></View>
                            <View style={styles.tripDetailDivider} />
                            <View style={styles.tripDetailItem}><Text style={styles.tripDetailLabel}>Material</Text><Text style={styles.tripDetailValue}>{activeTrip.material}</Text></View>
                            <View style={styles.tripDetailDivider} />
                            <View style={styles.tripDetailItem}><Text style={styles.tripDetailLabel}>ETA</Text><Text style={styles.tripDetailValue}>{activeTrip.eta}</Text></View>
                        </View>
                        <TouchableOpacity style={styles.viewTripBtn} onPress={() => props.onNavigateToTripDetails?.(activeTrip.id)} activeOpacity={0.7}>
                            <Text style={styles.viewTripText}>View Trip Details</Text><ArrowRightIcon color={COLORS.white} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── Accepted Bids Section ── */}
                {acceptedBids.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Accepted Bids</Text>
                            <TouchableOpacity onPress={props.onNavigateToMyTrips}>
                                <Text style={styles.viewAllLink}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {acceptedBids.length === 1 ? (
                            // Single card - display vertically
                            <AcceptedBidCard
                                key={acceptedBids[0].id}
                                bid={acceptedBids[0]}
                                index={0}
                                isMultiple={false}
                                onPress={() => props.onNavigateToTripDetails?.(acceptedBids[0].id)}
                                fadeAnim={fadeAnim}
                            />
                        ) : (
                            // Multiple cards - display horizontally
                            <View style={styles.acceptedBidsHorizontalContainer}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    pagingEnabled
                                    decelerationRate="fast"
                                    snapToAlignment="start"
                                    snapToInterval={width - 32} // Subtract total horizontal padding
                                    contentContainerStyle={styles.acceptedBidsHorizontalScroll}
                                >
                                    {acceptedBids.slice(0, 3).map((bid, index) => (
                                        <View key={bid.id} style={{ width: width - 32 }}> {/* Container with exact width */}
                                            <AcceptedBidCard
                                                bid={bid}
                                                index={index}
                                                isMultiple={true}
                                                onPress={() => props.onNavigateToTripDetails?.(bid.id)}
                                                fadeAnim={fadeAnim}
                                            />
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </>
                )}

                {/* ── Earnings Grid ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Earnings</Text>
                    <TouchableOpacity onPress={props.onNavigateToPayments}>
                        <Text style={styles.viewAllLink}>View All</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.earningsGridNew}>
                    {earningsData.map((item, index) => (
                        <View key={index} style={styles.earningsCard}>
                            <View style={styles.earningsHeader}>
                                <View style={[styles.earningsIconCircle, { backgroundColor: item.iconBg }]}>
                                    {item.icon}
                                </View>
                                {/* <View style={styles.changeBadge}>
                                    <Text style={[styles.changeText, { color: item.changeColor }]}>{item.change}</Text>
                                </View> */}
                            </View>
                            <Text style={styles.earningsLabelText}>{item.label}</Text>
                            <Text style={styles.earningsValueText}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Quick Actions ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.actionsGridNew}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress} activeOpacity={0.8}>
                            <View style={[styles.actionIconCircle, { backgroundColor: action.iconBg }]}>
                                {action.icon}
                            </View>
                            <Text style={styles.actionTitleText}>{action.label}</Text>
                            <Text style={styles.actionSubText}>{action.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Switch to Transporter Mode ── */}
                <SwitchToTransporterCard />
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── Tracking Map FAB ── */}
            <TouchableOpacity
                style={styles.trackingFab}
                onPress={props.onNavigateToAllLiveTracking}
                activeOpacity={0.8}
            >
                <MapTrackingIcon color={COLORS.white} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingVertical: 12 },
    profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarContainer: { width: 50, height: 50, marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: COLORS.primary },
    onlineDot: { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: COLORS.white },
    trackingFab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.action,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: COLORS.action,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 1000,
    },
    profileInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
    verifiedSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    notifBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(100, 103, 242, 0.1)' },
    notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger, borderWidth: 1.5, borderColor: COLORS.white },

    availCardNew: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    availCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    availIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(100, 103, 242, 0.1)', alignItems: 'center', justifyContent: 'center' },
    availTitleNew: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    availSubNew: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

    earningsGridNew: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    earningsCard: { width: (width - 52) / 2, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    earningsIconCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    changeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: '#f0fdf4' },
    changeText: { fontSize: 11, fontWeight: '700' },
    earningsLabelText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
    earningsValueText: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },

    actionsGridNew: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    actionCard: { width: (width - 52) / 2, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    actionIconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    actionTitleText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    actionSubText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

    transporterBanner: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
    transporterBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    transporterIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
    transporterTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
    transporterSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },
    transporterChevron: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },

    card: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
    availCard: { flexDirection: 'row', alignItems: 'center' },
    availDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    availTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    availSub: { fontSize: 12, color: COLORS.textTertiary },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    tripLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    tripId: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '400' },
    statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.actionLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.action },
    statusText: { fontSize: 11, fontWeight: '600', color: COLORS.action },
    routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
    routeEndpoint: { alignItems: 'center', width: 56 },
    routeDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
    routeCity: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
    routeLineContainer: { flex: 1, height: 20, marginHorizontal: 8, justifyContent: 'center' },
    routeLine: { height: 2, backgroundColor: COLORS.border, borderRadius: 1 },
    routeProgress: { height: '100%', backgroundColor: COLORS.action, borderRadius: 1 },
    truckMarker: { position: 'absolute', top: 5, marginLeft: -6 },
    truckMarkerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.action, borderWidth: 2, borderColor: COLORS.white },
    tripDetailsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 14, marginBottom: 14 },
    tripDetailItem: { flex: 1, alignItems: 'center' },
    tripDetailLabel: { fontSize: 10, color: COLORS.textTertiary, fontWeight: '400', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 },
    tripDetailValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
    tripDetailDivider: { width: 1, backgroundColor: COLORS.borderLight },
    viewTripBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.action, gap: 6 },
    viewTripText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.1 },
    viewAllLink: { fontSize: 13, fontWeight: '500', color: COLORS.action },

    // Accepted Bids
    acceptedBidsHorizontalContainer: {
        marginHorizontal: 0,
    },
    acceptedBidsHorizontalScroll: {
        paddingRight: 0,
    },
    acceptedBidCard: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        backgroundColor: '#f0fdf4',
        marginBottom: 16,
    },
    acceptedBidCardHorizontal: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        width: width - 40,
        marginRight: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    bidCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bidLoadId: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 1,
    },
    bidStatusLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    acceptedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.successLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    acceptedDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: COLORS.success,
    },
    acceptedText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.success,
    },
    currentBidStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    currentBidStatusLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginRight: 4,
    },
    currentBidStatusValue: {
        fontSize: 11,
        color: COLORS.action,
        fontWeight: '700',
    },
    bidRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    bidRoutePoint: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    bidRouteDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    bidRouteText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
    },
    bidRouteArrow: {
        fontSize: 13,
        color: COLORS.textTertiary,
        marginHorizontal: 6,
    },
    bidPriceRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    bidPriceItem: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 8,
        borderRadius: 8,
    },
    bidPriceLabel: {
        fontSize: 9,
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 3,
    },
    bidPriceValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.success,
    },
    bidActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: COLORS.action,
        gap: 6,
    },
    bidActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
    },
});

export default TruckerHomeScreen;
