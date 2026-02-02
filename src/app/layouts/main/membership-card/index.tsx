import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { hitSlop } from '@truckmitr/src/app/functions';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { ImageBackground } from 'react-native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { BASE_URL } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';
import { getUserTier, getUserBadgeText } from '@truckmitr/src/utils/global';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Asset Images
const LOGO_IMAGE = require('@truckmitr/src/assets/membership-card/logotrick.png');
const PROFILE_PLACEHOLDER = require('@truckmitr/src/assets/membership-card/man.png');

// Background Images for each tier
const BACKGROUND_VERIFIED = require('@truckmitr/src/assets/membership-card/membershipbg.png');       // Silver/Gray for Verified
const BACKGROUND_TRUSTED = require('@truckmitr/src/assets/membership-card/membershipcardbg2.png');   // Gold for Trusted
const BACKGROUND_JOB_READY = require('@truckmitr/src/assets/membership-card/membershipcard3.png');   // Blue for Job Ready
const BACKGROUND_TRANSPORTER_PRO = require('@truckmitr/src/assets/membership-card/TransporterPro.png');

// Card configurations for each tier
type TierType = 'JOB READY' | 'VERIFIED' | 'TRUSTED' | 'Standard' | 'LEGACY' | 'TRANSPORTER PRO' | 'FOREMAN PRO';

interface TierConfig {
    background: any;
    borderColors: string[];
    chromeGradient: { offset: string; color: string }[];
    categoryText: string;
}

const TIER_CONFIGS: Record<TierType, TierConfig> = {
    'JOB READY': {
        background: BACKGROUND_JOB_READY,
        borderColors: ['#000b29', '#002661', '#4A90E2', '#002661', '#000b29'],
        chromeGradient: [
            { offset: '0', color: '#E0E3E7' },
            { offset: '0.25', color: '#BFC5CC' },
            { offset: '0.5', color: '#9AA0A6' },
            { offset: '0.75', color: '#BFC5CC' },
            { offset: '1', color: '#E0E3E7' },
        ],
        categoryText: 'JOB READY DRIVER',
    },
    'VERIFIED': {
        background: BACKGROUND_VERIFIED,
        borderColors: ['#404040', '#E0E3E7', '#FFFFFF', '#E0E3E7', '#404040'],
        chromeGradient: [
            { offset: '0', color: '#E0E3E7' },
            { offset: '0.25', color: '#BFC5CC' },
            { offset: '0.5', color: '#9AA0A6' },
            { offset: '0.75', color: '#BFC5CC' },
            { offset: '1', color: '#E0E3E7' },
        ],
        categoryText: 'VERIFIED DRIVER',
    },
    'TRUSTED': {
        background: BACKGROUND_TRUSTED,
        borderColors: ['#A67C00', '#C9A23F', '#FFF6C8', '#C9A23F', '#A67C00'],
        chromeGradient: [
            { offset: '0', color: '#FFF6C8' },
            { offset: '0.25', color: '#C9A23F' },
            { offset: '0.5', color: '#A67C00' },
            { offset: '0.75', color: '#C9A23F' },
            { offset: '1', color: '#FFF6C8' },
        ],
        categoryText: 'TRUSTED DRIVER',
    },
    'Standard': {
        background: BACKGROUND_JOB_READY,
        borderColors: ['#000b29', '#002661', '#4A90E2', '#002661', '#000b29'],
        chromeGradient: [
            { offset: '0', color: '#E0E3E7' },
            { offset: '0.25', color: '#BFC5CC' },
            { offset: '0.5', color: '#9AA0A6' },
            { offset: '0.75', color: '#BFC5CC' },
            { offset: '1', color: '#E0E3E7' },
        ],
        categoryText: 'STANDARD MEMBER',
    },
    'LEGACY': {
        background: BACKGROUND_VERIFIED,
        borderColors: ['#8B4513', '#CD853F', '#DEB887', '#CD853F', '#8B4513'],
        chromeGradient: [
            { offset: '0', color: '#DEB887' },
            { offset: '0.25', color: '#CD853F' },
            { offset: '0.5', color: '#8B4513' },
            { offset: '0.75', color: '#CD853F' },
            { offset: '1', color: '#DEB887' },
        ],
        categoryText: 'LEGACY MEMBER', // Will be overridden dynamically
    },
    'TRANSPORTER PRO': {
        background: BACKGROUND_TRANSPORTER_PRO,
        borderColors: ['#404040', '#E0E3E7', '#FFFFFF', '#E0E3E7', '#404040'],
        chromeGradient: [
            { offset: '0', color: '#E0E3E7' },
            { offset: '0.25', color: '#BFC5CC' },
            { offset: '0.5', color: '#9AA0A6' },
            { offset: '0.75', color: '#BFC5CC' },
            { offset: '1', color: '#E0E3E7' },
        ],
        categoryText: 'TRANSPORTER PRO',
    },
    'FOREMAN PRO': {
        background: BACKGROUND_TRANSPORTER_PRO,
        borderColors: ['#404040', '#E0E3E7', '#FFFFFF', '#E0E3E7', '#404040'],
        chromeGradient: [
            { offset: '0', color: '#E0E3E7' },
            { offset: '0.25', color: '#BFC5CC' },
            { offset: '0.5', color: '#9AA0A6' },
            { offset: '0.75', color: '#BFC5CC' },
            { offset: '1', color: '#E0E3E7' },
        ],
        categoryText: 'FOREMAN PRO',
    },
};

// State ID to Name Mapping (based on API states data)
const STATE_ID_MAP: Record<string, string> = {
    '1': 'Andaman and Nicobar Islands',
    '2': 'Andhra Pradesh',
    '3': 'Arunachal Pradesh',
    '4': 'Assam',
    '5': 'Bihar',
    '6': 'Chandigarh',
    '7': 'Chhattisgarh',
    '8': 'Dadra and Nagar Haveli',
    '9': 'Delhi',
    '10': 'Goa',
    '11': 'Gujarat',
    '12': 'Haryana',
    '13': 'Himachal Pradesh',
    '14': 'Jammu and Kashmir',
    '15': 'Jharkhand',
    '16': 'Karnataka',
    '17': 'Kerala',
    '18': 'Ladakh',
    '19': 'Lakshadweep',
    '20': 'Madhya Pradesh',
    '21': 'Maharashtra',
    '22': 'Manipur',
    '23': 'Meghalaya',
    '24': 'Mizoram',
    '25': 'Nagaland',
    '26': 'Odisha',
    '27': 'Others',
    '28': 'Puducherry',
    '29': 'Punjab',
    '30': 'Rajasthan',
    '31': 'Sikkim',
    '32': 'Tamil Nadu',
    '33': 'Telangana',
    '34': 'Tripura',
    '35': 'Uttar Pradesh',
    '36': 'Uttarakhand',
    '37': 'West Bengal',
    '38': 'Daman and Diu'
};

// Helper function to get state name from ID or return the value as-is if it's already a name
const getStateName = (stateValue: string | number | undefined): string => {
    if (!stateValue) return '';
    const stateStr = String(stateValue).trim();
    // If it's a numeric ID, look up the name
    if (STATE_ID_MAP[stateStr]) {
        return STATE_ID_MAP[stateStr];
    }
    // If it's already a name (non-numeric), return as-is
    return stateStr;
};

export default function MembershipCard() {
    const { t } = useTranslation();
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    // Get user and subscription data from Redux
    const { user, subscriptionDetails } = useSelector((state: any) => state?.user) || {};

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Small delay to ensure data is loaded
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const _goback = () => {
        navigation.goBack();
    };

    // Extract data from Redux
    const userName = user?.name?.toUpperCase() || 'MEMBER NAME';
    const uniqueId = user?.unique_id || 'TM0000000000000';
    const isTransporterRole = user?.role === 'transporter';
    const stateName = user?.state_name || getStateName(user?.states) || getStateName(user?.state) || '';
    const cityName = user?.city || '';
    const userLocation = (cityName && stateName ? `${cityName}, ${stateName}` : (cityName || stateName)).toUpperCase();

    const displayLabel = isTransporterRole ? 'TRANSPORT NAME' : (t('licenseType') || 'LICENSE TYPE');
    // Assuming transport_name is available in user object, otherwise fallback to empty or handle accordingly
    const rawTransportName = user?.Transport_Name || user?.transport_name || '';
    const displayValue = isTransporterRole ? (rawTransportName.toUpperCase() === 'N/A' ? '' : rawTransportName).toUpperCase() : (user?.Type_of_License || 'HMV')?.toUpperCase();
    const profileImage = user?.images ? { uri: `${BASE_URL}public/${user?.images}` } : PROFILE_PLACEHOLDER;

    // Subscription details - Using utility function for consistency
    // This ensures same logic as dashboard, profile, and other components
    const userRole = user?.role || 'driver';
    const isDriver = userRole === 'driver';
    const tier = getUserTier({ user, subscriptionDetails, isDriver });
    const badgeText = getUserBadgeText({ user, subscriptionDetails, isDriver });

    // Get tier config and dynamically set categoryText for LEGACY based on role
    let tierConfig = { ...TIER_CONFIGS[tier] };
    if (tier === 'LEGACY') {
        tierConfig.categoryText = userRole === 'transporter' ? (t('cardLegacyTransporter') || 'LEGACY TRANSPORTER') : (t('cardLegacyDriver') || 'LEGACY DRIVER');
    }

    const startDate = subscriptionDetails?.start_at
        ? moment.unix(subscriptionDetails.start_at).format('DD/MM/YY')
        : moment().format('DD/MM/YY');
    const endDate = subscriptionDetails?.end_at
        ? moment.unix(subscriptionDetails.end_at).format('DD/MM/YY')
        : moment().add(1, 'year').format('DD/MM/YY');

    // Credit card aspect ratio: 1.586:1 (landscape)
    const cardWidth = responsiveWidth(92);
    const cardHeight = cardWidth / 1.586;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.royalBlue} />
            </View>
        );
    }

    // Check if user has an active subscription
    const hasActiveSubscription = subscriptionDetails?.hasActiveSubscription ||
        ((subscriptionDetails?.subscription_id || subscriptionDetails?.payment_id) && subscriptionDetails?.payment_status === 'captured');

    if (!hasActiveSubscription) {
        return (
            <View style={[styles.container, { backgroundColor: colors.white }]}>
                <Space height={safeAreaInsets.top} />
                <View style={[styles.header, { padding: responsiveWidth(3) }]}>
                    <TouchableOpacity
                        hitSlop={hitSlop(10)}
                        onPress={_goback}
                        style={[styles.backButton, {
                            height: responsiveFontSize(4),
                            width: responsiveFontSize(4),
                            backgroundColor: colors.white
                        }]}
                    >
                        <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        width: responsiveWidth(100),
                        fontSize: responsiveFontSize(2.2),
                        color: colors.royalBlue
                    }]}>
                        {t('membershipCard') || 'Membership Card'}
                    </Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Ionicons name="card-outline" size={80} color={colors.blackOpacity(0.2)} />
                    <Space height={20} />
                    <Text style={{ fontSize: responsiveFontSize(2), color: colors.blackOpacity(0.6), textAlign: 'center' }}>
                        {t('noActiveSubscription') || 'No active subscription found'}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.6), color: colors.blackOpacity(0.4), textAlign: 'center', marginTop: 8 }}>
                        {t('subscribeToGetCard') || 'Subscribe to get your membership card'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.white }]}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
        >
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={[styles.header, { padding: responsiveWidth(3) }]}>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={_goback}
                    style={[styles.backButton, {
                        height: responsiveFontSize(4),
                        width: responsiveFontSize(4),
                        backgroundColor: colors.white
                    }]}
                >
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, {
                    width: responsiveWidth(100),
                    fontSize: responsiveFontSize(2.2),
                    color: colors.royalBlue
                }]}>
                    {t('membershipCard') || 'Membership Card'}
                </Text>
            </View>

            <Space height={responsiveHeight(2)} />

            {/* Tier Badge */}
            <View style={{ alignItems: 'center', marginBottom: responsiveHeight(1) }}>
                <View style={[styles.tierBadge, { backgroundColor: tierConfig.borderColors[2] + '20' }]}>
                    <Text style={[styles.tierBadgeText, { color: tierConfig.borderColors[0] }]}>
                        {tier} MEMBER
                    </Text>
                </View>
            </View>

            {/* Dynamic Membership Card */}
            <View style={styles.cardContainer}>
                <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
                    {/* Outer Metallic Border */}
                    <LinearGradient
                        colors={tierConfig.borderColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardMetallicBorder}
                    >
                        {/* Inner White Border */}
                        <View style={styles.innerBorder}>
                            {/* Background Image */}
                            <ImageBackground
                                source={tierConfig.background}
                                style={styles.gradientBackground}
                                resizeMode="cover"
                            >
                                <View style={styles.darkOverlay} />

                                {/* Card Content - Adapted from Profile Screen for consistency */}
                                <View style={{ flex: 1, padding: 12 }}>

                                    {/* Top Row: Logo and Profile Photo */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        {/* Logo */}
                                        <Image
                                            source={LOGO_IMAGE}
                                            style={{ width: 120, height: 40 }}
                                            resizeMode="contain"
                                        />

                                        {/* Profile Photo with border */}
                                        <LinearGradient
                                            colors={tierConfig.borderColors}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                padding: 2,
                                                borderRadius: 30,
                                            }}
                                        >
                                            <View style={{
                                                backgroundColor: '#fff',
                                                padding: 2,
                                                borderRadius: 28
                                            }}>
                                                <Image
                                                    source={profileImage}
                                                    style={{ width: 52, height: 52, borderRadius: 26 }}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        </LinearGradient>
                                    </View>

                                    {/* Middle Section: Category & ID */}
                                    <View style={{ marginTop: 4 }}>
                                        {/* Category Label with SVG Gradient */}
                                        <View style={{ height: 22, width: 200 }}>
                                            <Svg height="100%" width="100%" viewBox="0 0 200 22">
                                                <Defs>
                                                    <SvgLinearGradient id="chromeGradientCat" x1="0" y1="0" x2="0" y2="1">
                                                        {tierConfig.chromeGradient.map((stop: any, index: number) => (
                                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                        ))}
                                                    </SvgLinearGradient>
                                                </Defs>
                                                {/* Shadow layer */}
                                                <SvgText fill="#000000" fillOpacity="0.7" fontSize="15" fontWeight="900" fontStyle="italic" letterSpacing="1" x="1.5" y="17">
                                                    {tierConfig.categoryText}
                                                </SvgText>
                                                {/* Main gradient text */}
                                                <SvgText fill="url(#chromeGradientCat)" stroke="#000" strokeWidth="0.5" fontSize="15" fontWeight="900" fontStyle="italic" letterSpacing="1" x="0" y="15.5">
                                                    {tierConfig.categoryText}
                                                </SvgText>
                                            </Svg>
                                        </View>

                                        {/* TM ID with SVG Gradient */}
                                        <View style={{ height: 38, width: '100%', marginTop: 2 }}>
                                            <Svg height="100%" width="100%" viewBox="0 0 340 38">
                                                <Defs>
                                                    <SvgLinearGradient id="chromeGradientId" x1="0" y1="0" x2="0" y2="1">
                                                        {tierConfig.chromeGradient.map((stop: any, index: number) => (
                                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                        ))}
                                                    </SvgLinearGradient>
                                                </Defs>
                                                {/* Shadow layer */}
                                                <SvgText fill="#000000" fillOpacity="0.8" fontSize="28" fontWeight="900" letterSpacing="2" x="2" y="30">
                                                    {uniqueId}
                                                </SvgText>
                                                {/* Main gradient text */}
                                                <SvgText fill="url(#chromeGradientId)" stroke="#000" strokeWidth="0.8" fontSize="28" fontWeight="900" letterSpacing="2" x="0" y="28">
                                                    {uniqueId}
                                                </SvgText>
                                            </Svg>
                                        </View>
                                    </View>

                                    {/* Bottom Section: Name, Location, Validity */}
                                    <View style={{
                                        marginTop: 'auto',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-end',
                                    }}>
                                        {/* Left: Name, Location, License */}
                                        <View style={{ flex: 1 }}>
                                            {/* Name with SVG Gradient */}
                                            <View style={{ height: 20, width: 200 }}>
                                                <Svg height="100%" width="100%" viewBox="0 0 200 20">
                                                    <Defs>
                                                        <SvgLinearGradient id="chromeGradientName" x1="0" y1="0" x2="0" y2="1">
                                                            {tierConfig.chromeGradient.map((stop: any, index: number) => (
                                                                <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                            ))}
                                                        </SvgLinearGradient>
                                                    </Defs>
                                                    <SvgText fill="#000000" fillOpacity="0.7" fontSize="14" fontWeight="900" letterSpacing="1" x="1" y="16">
                                                        {userName}
                                                    </SvgText>
                                                    <SvgText fill="url(#chromeGradientName)" stroke="#000" strokeWidth="0.4" fontSize="14" fontWeight="900" letterSpacing="1" x="0" y="15">
                                                        {userName}
                                                    </SvgText>
                                                </Svg>
                                            </View>
                                            <Text style={{
                                                color: '#fff',
                                                fontSize: responsiveFontSize(1.3),
                                                fontWeight: '700',
                                                marginTop: 1,
                                                textShadowColor: 'rgba(0,0,0,0.8)',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 2,
                                            }}>
                                                {userLocation}
                                            </Text>
                                            <Text style={{
                                                color: 'rgba(255, 255, 255, 1)',
                                                fontSize: responsiveFontSize(1.3),
                                                fontWeight: '900',
                                                marginTop: 3,
                                                textShadowColor: 'rgba(0,0,0,0.6)',
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1,
                                            }}>
                                                {isTransporterRole ? (
                                                    <Text style={{ fontWeight: '800', fontStyle: 'italic' }}>{displayValue}</Text>
                                                ) : (
                                                    <>{displayLabel}: <Text style={{ fontWeight: '800' }}>{displayValue}</Text></>
                                                )}
                                            </Text>
                                        </View>

                                        {/* Right: Validity Dates with SVG Gradient */}
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        fontSize: responsiveFontSize(1.2),
                                                        fontWeight: '800',
                                                        letterSpacing: 0.5,
                                                    }}>
                                                        {t('validFrom')?.toUpperCase() || 'VALID FROM'}
                                                    </Text>
                                                    <View style={{ height: 16, width: 70, marginTop: 1 }}>
                                                        <Svg height="100%" width="100%" viewBox="0 0 70 16">
                                                            <Defs>
                                                                <SvgLinearGradient id="chromeGradientDate1" x1="0" y1="0" x2="0" y2="1">
                                                                    {tierConfig.chromeGradient.map((stop: any, index: number) => (
                                                                        <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                    ))}
                                                                </SvgLinearGradient>
                                                            </Defs>
                                                            <SvgText fill="url(#chromeGradientDate1)" stroke="#000" strokeWidth="0.3" fontSize="12" fontWeight="900" x="35" y="13" textAnchor="middle">
                                                                {startDate}
                                                            </SvgText>
                                                        </Svg>
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        fontSize: responsiveFontSize(1.2),
                                                        fontWeight: '800',
                                                        letterSpacing: 0.5,
                                                    }}>
                                                        {t('validUntil')?.toUpperCase() || 'VALID THRU'}
                                                    </Text>
                                                    <View style={{ height: 16, width: 70, marginTop: 1 }}>
                                                        <Svg height="100%" width="100%" viewBox="0 0 70 16">
                                                            <Defs>
                                                                <SvgLinearGradient id="chromeGradientDate2" x1="0" y1="0" x2="0" y2="1">
                                                                    {tierConfig.chromeGradient.map((stop: any, index: number) => (
                                                                        <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                    ))}
                                                                </SvgLinearGradient>
                                                            </Defs>
                                                            <SvgText fill="url(#chromeGradientDate2)" stroke="#000" strokeWidth="0.3" fontSize="12" fontWeight="900" x="35" y="13" textAnchor="middle">
                                                                {endDate}
                                                            </SvgText>
                                                        </Svg>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </ImageBackground>
                        </View>
                    </LinearGradient>
                </View>
            </View>

            <Space height={responsiveHeight(3)} />

            {/* Card Info Section */}
            <View style={{ paddingHorizontal: responsiveWidth(5) }}>
                <Text style={[styles.infoTitle, { color: colors.black }]}>
                    {t('membershipDetails') || 'Membership Details'}
                </Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('membershipType') || 'Membership Type'}</Text>
                    <Text style={[styles.infoValue, { color: tierConfig.borderColors[0] }]}>{tier}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('subscriptionAmount') || 'Subscription Amount'}</Text>
                    <Text style={styles.infoValue}>₹ {subscriptionDetails?.amount || subscriptionDetails?.plan_amount || '0'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('memberId') || 'Member ID'}</Text>
                    <Text style={styles.infoValue}>{uniqueId}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('validFrom') || 'Valid From'}</Text>
                    <Text style={styles.infoValue}>{startDate}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('validUntil') || 'Valid Until'}</Text>
                    <Text style={styles.infoValue}>{endDate}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('status') || 'Status'}</Text>
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{t('active') || 'ACTIVE'}</Text>
                    </View>
                </View>
            </View>

            <Space height={responsiveHeight(3)} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 100,
        zIndex: 10,
    },
    headerTitle: {
        position: 'absolute',
        textAlign: 'center',
        fontWeight: '600',
    },
    tierBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tierBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    cardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        borderRadius: 28,
        overflow: 'visible',
    },
    cardMetallicBorder: {
        flex: 1,
        borderRadius: 28,
        padding: 3,
        shadowColor: '#000000ff',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    innerBorder: {
        flex: 1,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
    },
    gradientBackground: {
        flex: 1,
        position: 'relative',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.17)',
        borderRadius: 25,
    },
    // Info Section Styles
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    activeBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
