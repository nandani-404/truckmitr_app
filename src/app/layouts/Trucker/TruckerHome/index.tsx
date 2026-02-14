import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Switch, StatusBar, Dimensions, Animated, RefreshControl,
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
const COLORS = {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    textPrimary: '#1C1C1E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    action: '#2C5282',
    actionLight: '#EBF0F7',
    success: '#4A7C59',
    successLight: '#EDF5F0',
    danger: '#DC2626',
    white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const BellIcon = ({ color = COLORS.textPrimary }: { color?: string }) => (<Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>);
const TruckIconMini = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" /></Svg>);
const SearchIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" /></Svg>);
const MapPinIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" /></Svg>);
const WalletIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Rect x="1" y="4" width="22" height="16" rx="2" /><Path d="M1 10h22" /></Svg>);
const ChevronRightIcon = ({ color = COLORS.textTertiary }: { color?: string }) => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>);
const ArrowRightIcon = ({ color = COLORS.textTertiary }: { color?: string }) => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14M12 5l7 7-7 7" /></Svg>);
const ClockIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" /></Svg>);
const CalendarIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="4" width="18" height="18" rx="2" /><Path d="M16 2v4M8 2v4M3 10h18" /></Svg>);
const TrendUpIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M23 6l-9.5 9.5-5-5L1 18" /><Path d="M17 6h6v6" /></Svg>);
const StarIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>);
const SwitchModeIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></Svg>);
const UserPlusIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="8.5" cy="7" r="4" /><Path d="M20 8v6M23 11h-6" /></Svg>);
const BankIcon = ({ color = COLORS.textSecondary }: { color?: string }) => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 21h18" /><Path d="M3 10h18" /><Path d="M5 6l7-3 7 3" /><Path d="M4 10v11" /><Path d="M20 10v11" /><Path d="M8 14v3" /><Path d="M12 14v3" /><Path d="M16 14v3" /></Svg>);

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
}

// ─────────────────────────────────────────────
// Switch to Transporter Mode Card
// ─────────────────────────────────────────────
const SwitchToTransporterCard = () => {
    const dispatch = useDispatch();
    const isTransitioning = useSelector((state: any) => state.appMode.isTransitioning);
    const switchAnim = useRef(new Animated.Value(1)).current;

    const thumbTranslateX = switchAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
    const trackBg = switchAnim.interpolate({ inputRange: [0, 1], outputRange: ['#D1D5DB', COLORS.action] });

    const handleToggle = () => {
        if (isTransitioning) return;
        Animated.spring(switchAnim, { toValue: 0, useNativeDriver: false, friction: 7, tension: 40 }).start(() => {
            dispatch(toggleAppMode());
        });
    };

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={handleToggle} disabled={isTransitioning} style={styles.modeCard}>
            <View style={styles.modeCardLeft}>
                <View style={styles.modeIconBox}><SwitchModeIcon color={COLORS.action} /></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.modeTitle}>Transporter Mode</Text>
                    <Text style={styles.modeSub}>Switch to transporter interface</Text>
                </View>
            </View>
            <View>
                <Animated.View style={[styles.toggleTrack, { backgroundColor: trackBg }]}>
                    <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: thumbTranslateX }] }]} />
                </Animated.View>
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
        if (bid.current_status_label === 'Loaded') return 'Upload Builty & Start Transit';
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
                {bid.trucker_updated_price && (
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
        activeTrips: 0,
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
                availableLoads: payloadStats.available_loads || 0,
                activeTrips: payloadStats.my_loads || 0,
                vehicleCount: payloadStats.my_vehicles || 0,
                pendingEarnings: payloadPayments.pending_payment || 0,
                thisMonthEarnings: payloadPayments.this_month_earning || 0,
                totalEarnings: payloadPayments.total_earning || 0,
                rating: payloadStats.rating || user?.driver_rating || 0,
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
        { label: 'Pending', value: formatCurrency(dashboardData.pendingEarnings), icon: <ClockIcon color="#D97706" />, iconBg: '#FEF3C7', valueColor: '#D97706' },
        { label: 'This Month', value: formatCurrency(dashboardData.thisMonthEarnings), icon: <CalendarIcon color="#059669" />, iconBg: '#ECFDF5', valueColor: '#059669' },
        { label: 'Total', value: formatCurrency(dashboardData.totalEarnings), icon: <TrendUpIcon color={COLORS.action} />, iconBg: COLORS.actionLight, valueColor: COLORS.action },
        { label: 'Rating', value: Number(dashboardData.rating || 0).toFixed(1), icon: <StarIcon color="#B45309" />, iconBg: '#FFF7ED', valueColor: '#B45309' },
    ];

    // ── Quick Actions Data ──
    const quickActions = [
        { label: 'Find Loads', sub: `${dashboardData.availableLoads} available`, icon: <SearchIcon color={COLORS.action} />, iconBg: COLORS.actionLight, onPress: props.onNavigateToFindLoads },
        { label: 'My Bids', sub: `${dashboardData.activeTrips} active`, icon: <MapPinIcon color="#059669" />, iconBg: '#ECFDF5', onPress: props.onNavigateToMyTrips },
        { label: 'Payments', sub: `${formatCurrency(dashboardData.pendingEarnings)} pending`, icon: <WalletIcon color="#D97706" />, iconBg: '#FEF3C7', onPress: props.onNavigateToPayments },
        { label: 'My Vehicles', sub: `${dashboardData.vehicleCount} vehicles`, icon: <TruckIconMini color="#2C5282" />, iconBg: '#EBF0F7', onPress: props.onNavigateToMyVehicles },
        { label: 'Add Driver', sub: 'Add new driver', icon: <UserPlusIcon color="#8B5CF6" />, iconBg: '#F5F3FF', onPress: props.onNavigateToAddDriver },
        { label: 'Add Bank details', sub: 'Payout settings', icon: <BankIcon color="#EC4899" />, iconBg: '#FDF2F8', onPress: props.onNavigateToAddBankDetails },
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
                            <Image source={{ uri: user?.images ? `${BASE_URL}public/${user.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }} style={styles.avatar} />
                            {isAvailable && <View style={styles.onlineDot} />}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{user?.name || 'Trucker'}</Text>
                            <View style={styles.idRow}>
                                <TruckIconMini color={COLORS.textTertiary} />
                                <Text style={styles.userId}>{user?.unique_id || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notifBtn} onPress={props.onNavigateToNotifications} activeOpacity={0.7}>
                        <BellIcon color={COLORS.textPrimary} /><View style={styles.notifDot} />
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Availability Toggle ── */}
                <Animated.View style={[styles.card, styles.availCard, { opacity: fadeAnim }, isAvailable && { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.availDot, { backgroundColor: isAvailable ? '#22C55E' : '#D1D5DB' }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.availTitle}>{isAvailable ? 'Available for Loads' : 'Not Accepting Loads'}</Text>
                            <Text style={styles.availSub}>{isAvailable ? 'Receiving load notifications' : 'Turn on to receive requests'}</Text>
                        </View>
                    </View>
                    <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: '#D1D5DB', true: '#22C55E' }} thumbColor={COLORS.white} ios_backgroundColor="#D1D5DB" />
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
                    <TouchableOpacity onPress={props.onNavigateToPayments}><Text style={styles.viewAllLink}>View All</Text></TouchableOpacity>
                </View>
                <View style={styles.earningsGrid}>
                    {earningsData.map((item, index) => (
                        <View key={index} style={[styles.earningsItem, index < earningsData.length - 1 && styles.earningsItemBorder]}>
                            <View style={[styles.earningsIconBox, { backgroundColor: item.iconBg }]}>{item.icon}</View>
                            <Text style={styles.earningsLabel}>{item.label}</Text>
                            <Text style={[styles.earningsValue, { color: item.valueColor }]} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Quick Actions ── */}
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Quick Actions</Text></View>
                <View style={styles.actionsGrid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity key={index} style={styles.actionTile} onPress={action.onPress} activeOpacity={0.7}>
                            <View style={[styles.actionIconBox, { backgroundColor: action.iconBg, borderColor: 'transparent' }]}>{action.icon}</View>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                            <Text style={styles.actionSub}>{action.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Switch to Transporter Mode ── */}
                <SwitchToTransporterCard />
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingTop: 8 },
    profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarContainer: { width: 48, height: 48, marginRight: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
    onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.white },
    profileInfo: { flex: 1 },
    userName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.2 },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    userId: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '400' },
    verifiedBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 12 },
    verifiedText: { fontSize: 11, fontWeight: '600', color: COLORS.success },
    notifBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    notifDot: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.danger, borderWidth: 1.5, borderColor: COLORS.white },
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
    earningsGrid: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
    earningsItem: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
    earningsItemBorder: { borderRightWidth: 1, borderRightColor: COLORS.borderLight },
    earningsIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    earningsLabel: { fontSize: 10, color: COLORS.textTertiary, fontWeight: '400', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
    earningsValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    actionTile: { width: (width - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 20, paddingHorizontal: 16 },
    actionIconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    actionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    actionSub: { fontSize: 11, color: COLORS.textTertiary },
    modeCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
    modeCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    modeIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    modeTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    modeSub: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
    toggleTrack: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.5, elevation: 2 },

    // Accepted Bids
  acceptedBidsHorizontalContainer: {
    marginHorizontal: 0, // This creates the 16px padding on each side
},
acceptedBidsHorizontalScroll: {
    paddingRight: 0, // Remove any padding from the scroll content

    },
    acceptedBidCard: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        backgroundColor: '#F0FDF4',
        marginBottom: 16,
    },
    acceptedBidCardHorizontal: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        width: width - 40,
        marginRight: 12,
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
