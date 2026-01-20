import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// Icons Map - Using standard URL placeholders for now to match style
// Local Icons
const myPilotsIcon = require('../../../../../assets/my_pilots.png');
const jobsIcon = require('../../../../../assets/jobs.png');
const pendingTrainingIcon = require('../../../../../assets/pending_training.png');
const jobApplicationIcon = require('../../../../../assets/job_application.png');
const subscriptionIcon = require('../../../../../assets/subscription.png');
const profileIcon = require('../../../../../assets/profile_icon.png');
const verifiedDriverIcon = require('../../../../../assets/verified_driver.png');
const trustedDriverIcon = require('../../../../../assets/trusted_driver.png');
const jobReadyDriverIcon = require('../../../../../assets/job_ready_driver.png');

// Icons Map
const ICONS = {
    pilots: myPilotsIcon,
    jobs: jobsIcon,
    application: jobApplicationIcon,
    subscription: subscriptionIcon,
    training: pendingTrainingIcon,
    profile: profileIcon,
    jobReady: jobReadyDriverIcon,
    verified: verifiedDriverIcon,
    trusted: trustedDriverIcon
};

const DashboardStatsCard = ({ icon, count, title }: { icon: any, count: number | string, title: string }) => {
    const { responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    return (
        <View style={[styles.card, shadow, { width: '31%' }]}>
            <View style={{ width: 42, height: 42, backgroundColor: '#F9FAFB', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Image source={typeof icon === 'string' ? { uri: icon } : icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <Text style={[styles.cardCount, { fontSize: responsiveFontSize(2) }]}>{count}</Text>
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(1.2) }]}>{title}</Text>
        </View>
    );
};

export default function ForemanDashboard() {
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();
    const foremanName = 'Nandani Saraswat';
    const radius = 27;
    const circumference = 2 * Math.PI * radius;
    const progress = 75;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <View style={styles.container}>
            {/* Header: Back + Dashboard Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: safeAreaInsets.top + 10, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: '#fff' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 20, top: safeAreaInsets.top + 10, zIndex: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: '#1E293B' }}>Dashboard</Text>
            </View>

            {/* Profile Info Section (Below Header) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, alignItems: 'center' }}>
                <View>
                    <Text style={{ color: '#6E7CF5', fontSize: responsiveFontSize(2.2), fontWeight: 'bold', lineHeight: responsiveFontSize(3) }}>{`Hello, ${foremanName} 👋`}</Text>
                    <Text style={{ color: '#6E7CF5', fontSize: responsiveFontSize(1.6), fontWeight: 'bold', lineHeight: responsiveFontSize(2.2) }}>TM2503UPDR00003</Text>
                    <Text style={{ color: '#6E7CF5', fontSize: responsiveFontSize(1.4), fontWeight: 'bold', lineHeight: responsiveFontSize(1.8) }}>Foreman</Text>
                </View>

                {/* Profile Icon Same as Home (Right Side) */}
                <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
                        <Svg width={58} height={58} style={{ position: "absolute", top: 0, left: 0 }}>
                            <Defs>
                                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
                                    <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
                                </LinearGradient>
                            </Defs>
                            <Circle
                                cx={29}
                                cy={29}
                                r={radius}
                                stroke="url(#grad)"
                                strokeWidth={4}
                                fill="none"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                transform="rotate(-90 29 29)"
                            />
                        </Svg>
                        <Image style={{ height: 58 - 4, width: 58 - 4, borderRadius: 100, backgroundColor: '#fff' }} source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} />
                        <View style={{ backgroundColor: 'white', paddingHorizontal: responsiveFontSize(1.8), paddingVertical: responsiveFontSize(0.24), borderRadius: 100, position: 'absolute', bottom: -10, ...shadow }}>
                            <Text style={{ fontSize: responsiveFontSize(1.0), color: 'green', fontWeight: '700' }}>{`${progress}%`}</Text>
                        </View>
                    </View>
                    {/* Stars */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: responsiveFontSize(1.5), gap: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FontAwesome
                                key={i}
                                name={i < 4 ? 'star' : 'star-o'}
                                size={responsiveFontSize(1.6)}
                                color={i < 4 ? '#FFD700' : 'rgba(0,0,0,0.2)'}
                            />
                        ))}
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 20 }]} showsVerticalScrollIndicator={false}>

                {/* Work Overview */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                    <Ionicons name="briefcase-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>Work Overview</Text>
                </View>
                <View style={styles.cardRow}>
                    <DashboardStatsCard icon={ICONS.pilots} count={12} title="My Pilots" />
                    <DashboardStatsCard icon={ICONS.application} count={5} title="Job Application" />
                    <DashboardStatsCard icon={ICONS.jobs} count={8} title="Jobs" />
                </View>

                {/* Driver Readiness Status */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>Driver Readiness Status</Text>
                </View>
                <View style={styles.cardRow}>
                    <DashboardStatsCard icon={ICONS.subscription} count={'₹ 2500'} title="Subscription" />
                    <DashboardStatsCard icon={ICONS.training} count={4} title="Training" />
                    <DashboardStatsCard icon={ICONS.profile} count={1} title="Profile" />
                </View>

                {/* Subscription */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
                    <Ionicons name="card-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>Subscription</Text>
                </View>
                <View style={styles.cardRow}>
                    <DashboardStatsCard icon={ICONS.jobReady} count={10} title="Job Ready Driver" />
                    <DashboardStatsCard icon={ICONS.verified} count={15} title="Verified Driver" />
                    <DashboardStatsCard icon={ICONS.trusted} count={3} title="Trusted Driver" />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 8,
    },
    sectionUnderline: {
        height: 2,
        width: 30,
        backgroundColor: '#6E7CF5',
        marginBottom: 16,
        marginTop: 4,
        borderRadius: 2
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 120, // Same height as Home cards
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardCount: {
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
        marginTop: 2,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        marginTop: 0,
    },
    profileContainer: {
        position: 'relative',
        width: 58,
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        position: 'absolute',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    percentageBadge: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fff',
    },
    percentageText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#1E293B',
    },
});
