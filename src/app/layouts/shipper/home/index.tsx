import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
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

// --- Component ---
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

    // Calculate progress for ring
    const progress = parseInt(profileCompletion || '0', 10);
    const radius = 33;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        // Fetch Material Data
        const getPostLoadData = async () => {
            try {
                const response = await axiosInstance.get(END_POINTS.SHIPPER_POST_LOAD_GET);
                if (response?.data?.success) {
                    const materials = response.data.data.meterial || [];
                    console.log('Fetched materials:', materials.length);
                    dispatch(setMaterials(materials));
                }
            } catch (error) {
                console.error('Error fetching shipper post-load data:', error);
            }
        };

        getPostLoadData();

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
    }, []);

    const isUnderApproval = shipperKycStatus === '0' || shipperKycStatus === 0 || shipperKycStatus === false;

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
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.notifBtn}
                    onPress={isUnderApproval ? undefined : () => {
                        // navigation.navigate(STACKS.SHIPPER_NOTIFICATIONS);
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
                    isUnderApproval && { justifyContent: 'center', flexGrow: 1, paddingBottom: 100 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {isUnderApproval ? (
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

                        {/* Hero Card - Post a Load */}
                        <TouchableOpacity
                            activeOpacity={0.95}
                            onPress={() => (navigation).navigate('shipperPostLoad')}
                        >
                            <Animated.View style={[
                                styles.heroCard,
                                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                            ]}>
                                {/* Background blobs */}
                                <View style={styles.heroBlob} />
                                <View style={styles.heroBlob2} />

                                {/* Content Row */}
                                <View style={styles.heroRow}>
                                    {/* Left: Text Content */}
                                    <View style={styles.heroTextContainer}>
                                        <View style={styles.heroBadge}>
                                            <Text style={styles.heroBadgeText}>⚡ Quick & Easy</Text>
                                        </View>
                                        <Text style={styles.heroTitle}>Post a Load</Text>
                                        <Text style={styles.heroSubtitle}>Get the best rates</Text>
                                        <Text style={styles.heroDesc}>Find verified trucks in minutes</Text>
                                        <View style={styles.heroBtn}>
                                            <Text style={styles.heroBtnText}>POST NOW</Text>
                                            <View style={styles.heroBtnArrow}>
                                                <ArrowIcon />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Right: Truck Image */}
                                    <View style={styles.heroImageContainer}>
                                        <Image
                                            source={require('@truckmitr/assets/loadmandal/red-truck-front-view-isolated-white-background-75125639-removebg-preview.png')}
                                            style={styles.heroImg}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Stats */}
                        <Text style={styles.sectionTitle}>Your Dashboard</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.statsScrollContent}
                            style={styles.statsScroll}
                        >
                            <TouchableOpacity style={styles.statCard} onPress={() => onNavigateToLoadDetails?.()}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>Active Loads</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
                                        <Text style={styles.statIconText}>📦</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#3b82f6' }]}>12</Text>
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
                                onPress={() => (navigation).navigate('shipperAcceptedLoads')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>Accepted</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#e0f2fe' }]}>
                                        <Text style={styles.statIconText}>🤝</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#0284c7' }]}>05</Text>
                                <View style={styles.statBarChartContainer}>
                                    {[18, 26, 20, 32, 24, 38, 34].map((h, i) => (
                                        <View key={i} style={[styles.statBar, { height: h, backgroundColor: '#6366f1' }]} />
                                    ))}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.statCard} onPress={() => (navigation).navigate('shipperInTransit')}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>In Transit</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#ecfdf5' }]}>
                                        <Text style={styles.statIconText}>🚚</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#10b981' }]}>08</Text>
                                <View style={styles.statProgressContainer}>
                                    <Svg width="56" height="56" viewBox="0 0 40 40">
                                        <Circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="5" fill="none" />
                                        <Circle cx="20" cy="20" r="16" stroke="#22c55e" strokeWidth="5" fill="none" strokeDasharray="85 100" strokeLinecap="round" transform="rotate(-90 20 20)" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.statCard} onPress={() => (navigation).navigate('shipperPodPending')}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>POD Pending</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#fff7ed' }]}>
                                        <Text style={styles.statIconText}>📄</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#f97316' }]}>03</Text>
                                <View style={styles.statChartContainer}>
                                    <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                                        <Path d="M0,15 C10,35 25,35 35,20 C45,5 60,35 75,30 C85,25 90,10 100,18" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.statCard} onPress={() => (navigation).navigate('shipperPaymentPending')}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>Payment</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#fef2f2' }]}>
                                        <Text style={styles.statIconText}>💰</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#ef4444' }]}>02</Text>
                                <View style={styles.statBarChartContainer}>
                                    {[10, 15, 20, 12, 18, 14, 22].map((h, i) => (
                                        <View key={i} style={[styles.statBar, { height: h, backgroundColor: '#f97316' }]} />
                                    ))}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.statCard} onPress={() => (navigation).navigate('shipperCompletedLoads')}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statLabel}>Completed</Text>
                                    <View style={[styles.statIconBadge, { backgroundColor: '#f0fdfa' }]}>
                                        <Text style={styles.statIconText}>🎉</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statNum, { color: '#14b8a6' }]}>24</Text>
                                <View style={styles.statProgressContainer}>
                                    <Svg width="40" height="40" viewBox="0 0 40 40">
                                        <Circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                        <Circle cx="20" cy="20" r="16" stroke="#14b8a6" strokeWidth="4" fill="none" strokeDasharray="95 100" strokeLinecap="round" transform="rotate(-90 20 20)" />
                                    </Svg>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Insight Strip */}
                        <TouchableOpacity style={styles.insight} onPress={() => (navigation).navigate('shipperInTransit')} activeOpacity={0.7}>
                            <View style={styles.insightBar} />
                            <View style={styles.insightIconBox}>
                                <TruckIcon />
                            </View>
                            <View style={styles.insightText}>
                                <Text style={styles.insightTitle}>2 loads currently in transit</Text>
                                <Text style={styles.insightSub}>Expected delivery today: 1</Text>
                            </View>

                            {/* Optional Arrow to indicate clickability */}
                            <ArrowIcon />
                        </TouchableOpacity>

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
                                    <Text style={[styles.glanceValue, { color: '#1e40af' }]}>4</Text>
                                    <Text style={styles.glanceLabel}>Picked</Text>
                                </View>

                                {/* Card 2: Delivered */}
                                <View style={[styles.glanceCard, { backgroundColor: '#f0fdf4' }]}>
                                    <View style={[styles.glanceIconCircle, { backgroundColor: '#dcfce7' }]}>
                                        <Text style={styles.glanceEmoji}>✅</Text>
                                    </View>
                                    <Text style={[styles.glanceValue, { color: '#166534' }]}>2</Text>
                                    <Text style={styles.glanceLabel}>Delivered</Text>
                                </View>

                                {/* Card 3: Earned/Spent */}
                                <View style={[styles.glanceCard, { backgroundColor: '#faf5ff' }]}>
                                    <View style={[styles.glanceIconCircle, { backgroundColor: '#f3e8ff' }]}>
                                        <Text style={styles.glanceEmoji}>💰</Text>
                                    </View>
                                    <Text style={[styles.glanceValue, { color: '#6b21a8' }]}>₹32k</Text>
                                    <Text style={styles.glanceLabel}>Paid</Text>
                                </View>
                            </View>
                        </View>

                        {/* My Posted Loads */}
                        <View style={styles.loadsHeader}>
                            <Text style={styles.sectionTitle}>My Posted Loads</Text>
                            <TouchableOpacity onPress={() => (navigation).navigate('shipperMyLoads')}>
                                <Text style={styles.seeAll}>See all →</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Load Card 1 - Posted */}
                        <TouchableOpacity style={styles.loadCard} onPress={() => onNavigateToLoadDetails?.()}>
                            <View style={styles.loadHeader}>
                                <Text style={styles.loadId}>LID-883492</Text>
                                <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                                    <View style={[styles.badgeDot, { backgroundColor: '#3b82f6' }]} />
                                    <Text style={[styles.badgeText, { color: '#2563eb' }]}>🟢 Posted</Text>
                                </View>
                            </View>
                            <View style={styles.route}>
                                <View style={styles.routePoint}>
                                    <View style={[styles.routeDot, { backgroundColor: '#22c55e' }]} />
                                    <Text style={styles.routeCity}>Mumbai</Text>
                                </View>
                                <View style={styles.routeMid}>
                                    <View style={styles.routeLine} />
                                    <TruckIcon />
                                </View>
                                <View style={styles.routePoint}>
                                    <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
                                    <Text style={styles.routeCity}>New Delhi</Text>
                                </View>
                            </View>
                            <View style={styles.loadMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Material</Text>
                                    <Text style={styles.metaValue}>Electronics</Text>
                                </View>
                                <View style={styles.metaDivider} />
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Truck</Text>
                                    <Text style={styles.metaValue}>20ft Trailer</Text>
                                </View>
                                <View style={styles.metaDivider} />
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Budget</Text>
                                    <Text style={styles.metaPrice}>₹15,000</Text>
                                </View>
                            </View>
                            <View style={styles.loadFooter}>
                                <View style={styles.offersBadge}>
                                    <Text style={styles.offersText}>🔥 3 offers</Text>
                                </View>
                                <View style={styles.viewBtn}>
                                    <Text style={styles.viewBtnText}>View Offers</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
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
    greeting: { fontSize: 15, color: '#6b7280', marginBottom: -4, marginTop: 6 },
    userName: { fontSize: 20, fontWeight: '700', color: '#1f2937', lineHeight: 28, paddingBottom: 2 },
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
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 12,
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
        fontSize: 12,
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
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
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
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a', // Slate 900
        marginTop: 4,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b', // Slate 500
        maxWidth: '80%',
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
    loadId: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    route: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingVertical: 8 },
    routePoint: { alignItems: 'center' },
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
    routeDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 6, borderWidth: 2, borderColor: '#fff' },
    routeCity: { fontSize: 13, fontWeight: '600', color: '#374151' },
    routeMid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
    routeLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#e5e7eb' },
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
    recentItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16,
        padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    recentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    recentInfo: { flex: 1 },
    recentId: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    recentRoute: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    recentBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    recentBadgeText: { fontSize: 11, fontWeight: '600' },

    // Today at a Glance Styles
    glanceSection: {
        marginTop: 10,
        marginBottom: 24,
        paddingHorizontal: 0,
    },
    glanceTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    glanceSubtitle: {
        fontSize: 13,
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
        fontSize: 20,
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
});

export default ShipperHome;


