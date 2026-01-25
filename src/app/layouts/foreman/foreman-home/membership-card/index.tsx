import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
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
import { shouldShowMembershipCard, getUserBadgeText } from '@truckmitr/src/utils/global';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Asset Images
const LOGO_IMAGE = require('@truckmitr/src/assets/membership-card/logotrick.png');
const BACKGROUND_FOREMAN_PRO = require('@truckmitr/src/assets/membership-card/foremancard.png');

// Card tier configurations
interface TierConfig {
    background: any;
    borderColors: string[];
    chromeGradient: { offset: string; color: string }[];
    categoryText: string;
}

// State ID to Name Mapping
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
    if (STATE_ID_MAP[stateStr]) {
        return STATE_ID_MAP[stateStr];
    }
    return stateStr;
};

export default function ForemanMembershipCard() {
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

    // Check if Foreman has Pro using global utility
    const showCard = shouldShowMembershipCard({ user, subscriptionDetails, isDriver: false });
    const badgeText = getUserBadgeText({ user, subscriptionDetails, isDriver: false });

    // Extract data from Redux
    const userName = user?.name?.toUpperCase() || t('memberNameDefault')?.toUpperCase() || 'MEMBER NAME';
    const uniqueId = user?.unique_id || 'TM0000000000000';
    const stateName = user?.state_name || getStateName(user?.states) || getStateName(user?.state) || '';
    const cityName = user?.city || '';
    const userLocation = (cityName && stateName ? `${cityName}, ${stateName}` : (cityName || stateName)).toUpperCase();

    // Subscription details
    const startDate = subscriptionDetails?.start_at
        ? moment.unix(subscriptionDetails.start_at).format('DD/MM/YY')
        : moment().format('DD/MM/YY');
    const endDate = subscriptionDetails?.end_at
        ? moment.unix(subscriptionDetails.end_at).format('DD/MM/YY')
        : moment().add(1, 'year').format('DD/MM/YY');

    // Credit card aspect ratio: 1.586:1 (landscape)
    const cardWidth = responsiveWidth(92);
    const cardHeight = cardWidth / 1.586;

    // Foreman Pro tier config
    const tierConfig: TierConfig = {
        background: BACKGROUND_FOREMAN_PRO,
        borderColors: ['#1F2937', '#4B5563', '#9CA3AF', '#4B5563', '#1F2937'],
        chromeGradient: [
            { offset: '0', color: '#E0E3E7' },
            { offset: '0.25', color: '#BFC5CC' },
            { offset: '0.5', color: '#9AA0A6' },
            { offset: '0.75', color: '#BFC5CC' },
            { offset: '1', color: '#E0E3E7' },
        ],
        categoryText: t('foremanProBadge') || 'FOREMAN PRO',
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.royalBlue} />
            </View>
        );
    }

    // Check if user has an active subscription
    const hasActiveSubscription = subscriptionDetails?.hasActiveSubscription ||
        (subscriptionDetails?.subscription_id && subscriptionDetails?.payment_status === 'captured');

    if (!showCard || !hasActiveSubscription) {
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
                        {badgeText.toUpperCase()}
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

                                {/* Card Content */}
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
                                                {user?.images ? (
                                                    <Image
                                                        source={{ uri: `${BASE_URL}public/${user?.images}` }}
                                                        style={{ width: 52, height: 52, borderRadius: 26 }}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View style={{ width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' }}>
                                                        <FontAwesome name="user" size={32} color="#757575" />
                                                    </View>
                                                )}
                                            </View>
                                        </LinearGradient>
                                    </View>

                                    {/* Middle Section: Category & ID */}
                                    <View style={{ marginTop: 4 }}>
                                        {/* Category Label with SVG Gradient */}
                                        <View style={{ height: 24, width: 280 }}>
                                            <Svg height="100%" width="100%" viewBox="0 0 280 24">
                                                <Defs>
                                                    <SvgLinearGradient id="chromeGradientCat" x1="0" y1="0" x2="0" y2="1">
                                                        {tierConfig.chromeGradient.map((stop, index) => (
                                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                        ))}
                                                    </SvgLinearGradient>
                                                </Defs>
                                                {/* Shadow layer */}
                                                <SvgText fill="#000000" fillOpacity="0.7" fontSize="18" fontWeight="900" fontStyle="italic" letterSpacing="1" x="1.5" y="19">
                                                    {tierConfig.categoryText.toUpperCase()}
                                                </SvgText>
                                                {/* Main gradient text */}
                                                <SvgText fill="url(#chromeGradientCat)" stroke="#000" strokeWidth="0.5" fontSize="18" fontWeight="900" fontStyle="italic" letterSpacing="1" x="0" y="17.5">
                                                    {tierConfig.categoryText.toUpperCase()}
                                                </SvgText>
                                            </Svg>
                                        </View>

                                        {/* TM ID with SVG Gradient */}
                                        <View style={{ height: 38, width: '100%', marginTop: 2 }}>
                                            <Svg height="100%" width="100%" viewBox="0 0 340 38">
                                                <Defs>
                                                    <SvgLinearGradient id="chromeGradientId" x1="0" y1="0" x2="0" y2="1">
                                                        {tierConfig.chromeGradient.map((stop, index) => (
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
                                        {/* Left: Name, Location */}
                                        <View style={{ flex: 1 }}>
                                            {/* Name with SVG Gradient */}
                                            <View style={{ height: 20, width: 200 }}>
                                                <Svg height="100%" width="100%" viewBox="0 0 200 20">
                                                    <Defs>
                                                        <SvgLinearGradient id="chromeGradientName" x1="0" y1="0" x2="0" y2="1">
                                                            {tierConfig.chromeGradient.map((stop, index) => (
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
                                                                    {tierConfig.chromeGradient.map((stop, index) => (
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
                                                                    {tierConfig.chromeGradient.map((stop, index) => (
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
                    <Text style={[styles.infoValue, { color: tierConfig.borderColors[0] }]}>{badgeText}</Text>
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
