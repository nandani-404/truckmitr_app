import {
    Image,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Platform,
    ImageBackground,
    ActivityIndicator,
} from 'react-native';
import React, { useCallback, useState, useRef } from 'react';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, AppleConfirmDialog } from '@truckmitr/src/app/components';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { userAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { useTranslation } from 'react-i18next';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import RNFetchBlob from 'react-native-blob-util';
import moment from 'moment';
import { shouldShowMembershipCard, getUserTier, getUserBadgeText, getMembershipShareText } from '@truckmitr/src/utils/global';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const LOGO_IMAGE = require('@truckmitr/src/assets/membership-card/logotrick.png');
const BACKGROUND_FOREMAN_PRO = require('@truckmitr/src/assets/membership-card/foremancardnew.jpeg');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Card tier configurations
interface TierConfig {
    background: any;
    borderColors: string[];
    chromeGradient: { offset: string; color: string }[];
    categoryText: string;
}

// Menu Item Component for Apple-style list
interface MenuItemProps {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    showDivider?: boolean;
    isLast?: boolean;
    rightElement?: React.ReactNode;
    textColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    title,
    onPress,
    showDivider = true,
    isLast = false,
    rightElement,
    textColor,
}) => {
    const colors = useColor();
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.6}
            style={[
                styles.menuItem,
                {
                    paddingVertical: responsiveFontSize(1.8),
                    paddingHorizontal: responsiveFontSize(2),
                }
            ]}
        >
            <View style={[styles.menuIconContainer, { marginRight: responsiveFontSize(1.5) }]}>
                {icon}
            </View>
            <Text style={[
                styles.menuItemText,
                {
                    color: textColor || colors.black,
                    fontSize: responsiveFontSize(1.9),
                }
            ]}>
                {title}
            </Text>
            {rightElement || (
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.blackOpacity(0.25)}
                />
            )}
        </TouchableOpacity>
    );
};

// Section Header Component
interface SectionHeaderProps {
    title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();

    return (
        <Text style={[
            styles.sectionHeader,
            {
                color: colors.blackOpacity(0.5),
                fontSize: responsiveFontSize(1.5),
                marginHorizontal: responsiveFontSize(2),
                marginTop: responsiveFontSize(3),
                marginBottom: responsiveFontSize(1),
            }
        ]}>
            {title.toUpperCase()}
        </Text>
    );
};

// Card Container Component
interface CardContainerProps {
    children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({ children }) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    return (
        <View style={[
            styles.cardContainer,
            {
                marginHorizontal: responsiveFontSize(2),
                backgroundColor: colors.white,
                borderRadius: 14,
                ...shadow,
                shadowColor: colors.blackOpacity(0.08),
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 3,
            }
        ]}>
            {children}
        </View>
    );
};

// State ID to Name Mapping
const STATE_ID_MAP: Record<string, string> = {
    '1': 'Andaman and Nicobar Islands', '2': 'Andhra Pradesh', '3': 'Arunachal Pradesh', '4': 'Assam', '5': 'Bihar',
    '6': 'Chandigarh', '7': 'Chhattisgarh', '8': 'Dadra and Nagar Haveli', '9': 'Delhi', '10': 'Goa',
    '11': 'Gujarat', '12': 'Haryana', '13': 'Himachal Pradesh', '14': 'Jammu and Kashmir', '15': 'Jharkhand',
    '16': 'Karnataka', '17': 'Kerala', '18': 'Ladakh', '19': 'Lakshadweep', '20': 'Madhya Pradesh',
    '21': 'Maharashtra', '22': 'Manipur', '23': 'Meghalaya', '24': 'Mizoram', '25': 'Nagaland',
    '26': 'Odisha', '27': 'Others', '28': 'Puducherry', '29': 'Punjab', '30': 'Rajasthan',
    '31': 'Sikkim', '32': 'Tamil Nadu', '33': 'Telangana', '34': 'Tripura', '35': 'Uttar Pradesh',
    '36': 'Uttarakhand', '37': 'West Bengal', '38': 'Daman and Diu'
};

const getStateName = (stateValue: string | number | undefined): string => {
    if (!stateValue) return '';
    const stateStr = String(stateValue).trim();
    return STATE_ID_MAP[stateStr] || stateStr;
};

export default function ForemanProfile() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    useStatusBarStyle('dark-content');
    const { user, profileCompletion, subscriptionDetails } = useSelector((state: any) => state?.user) || {};

    // Check if Foreman is Pro using global utility
    // We mock isDriver=false because this is Foreman
    const showCard = shouldShowMembershipCard({ user, subscriptionDetails, isDriver: false });

    // For badge display in header, we use the explicit check or the badge text
    const badgeText = getUserBadgeText({ user, subscriptionDetails, isDriver: false });
    const isForemanPro = badgeText === 'Foreman Pro';

    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const progress = profileCompletion || 0;
    const size = responsiveFontSize(12);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

    // Card State & Refs
    const membershipCardRef = useRef<ViewShot>(null);
    const [sharingCard, setSharingCard] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    // Dialog States
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const _fetchUser = async () => {
                try {
                    const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
                    if (profile?.data?.status) {
                        dispatch(userAction(profile?.data));
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            };
            _fetchUser();
        }, [])
    );

    const _navigateContactUs = () => navigation.navigate(STACKS.CONTACT_US);
    const _navigatePrivacy = () => navigation.navigate(STACKS.PRIVACY);
    const _navigateSetting = () => navigation.navigate(STACKS.SETTINGS);

    const _onPressShareApp = async () => {
        try {
            await Share.share({
                message: t('shareAppMessage'),
            });
        } catch (error) {
            console.error('Error sharing the app:', error);
        }
    };

    const _onPressLogout = async () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = async () => {
        const userinfo = {
            id: user?.id ?? '',
            unique_id: user?.unique_id ?? '',
            name: user?.name ?? '',
            mobile: user?.mobile ?? '',
            email: user?.email ?? '',
            role: user?.role ?? '',
        };

        try {
            const eventParams = {
                method: 'manual_logout',
                user_id: String(userinfo.id),
                user_unique_id: userinfo.unique_id,
                user_name: userinfo.name,
                user_email: userinfo.email,
                user_role: userinfo.role,
            };
            await analytics().logEvent('user_logout', eventParams);
            AppEventsLogger.logEvent('user_logout', eventParams);
            await new Promise<void>(res => setTimeout(() => res(), 500));
            await axiosInstance.post(END_POINTS?.LOGOUT);
        } catch (error) {
            console.warn('Analytics logout error:', error);
        }

        dispatch(userAuthenticatedAction(false));
        deleteUserData();
        setShowLogoutDialog(false);
    };

    const downloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            const paymentId = subscriptionDetails?.payment_id || subscriptionDetails?.id;
            if (!paymentId) {
                showToast(t('unableToDownloadInvoicePaymentIdNotFound'));
                return;
            }

            const getPDFLink: any = await axiosInstance.get(END_POINTS?.INVOICE_DOWNLOAD(paymentId));

            if (getPDFLink?.data?.status && getPDFLink?.data?.invoice_url) {
                const { config, fs, android } = RNFetchBlob;
                const timestamp = new Date().getTime();
                const filePath = `${fs.dirs.DownloadDir}/Invoice${timestamp}.pdf`;

                await config({
                    addAndroidDownloads: {
                        useDownloadManager: true,
                        notification: true,
                        path: filePath,
                        description: t('downloadingInvoiceStatus'),
                        title: t('truckMitrInvoice'),
                        mime: 'application/pdf',
                        mediaScannable: true,
                    },
                })
                    .fetch('GET', getPDFLink?.data?.invoice_url)
                    .then((res) => {
                        android.actionViewIntent(res.path(), 'application/pdf');
                        showToast(t('invoiceDownloadedSuccessfully'));
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            } else {
                showToast(getPDFLink?.data?.message || t('unableToDownloadInvoice'));
            }
        } catch (error: any) {
            console.error('Download invoice error:', error);
            showToast(error?.message || t('failedToDownloadInvoice'));
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const shareMembershipCard = async (action: 'share' | 'download' = 'share') => {
        try {
            setSharingCard(true);

            if (!membershipCardRef.current?.capture) {
                showToast(t('unableToCaptureMembershipCard'));
                return;
            }

            const uri = await membershipCardRef.current.capture();
            if (!uri) {
                showToast(t('failedToCaptureMembershipCard'));
                return;
            }

            if (action === 'share') {
                const currentLang = i18n.language === 'hi' ? 'hi' : 'en';
                const shareMessage = getMembershipShareText({ user, subscriptionDetails, isDriver: false }, currentLang);

                const shareOptions = {
                    title: t('truckMitrMembershipCard'),
                    message: shareMessage,
                    url: Platform.OS === 'android' ? `file://${uri}` : uri,
                    type: 'image/png',
                };

                await RNShare.open(shareOptions);
                showToast(t('membershipCardSharedSuccessfully'));
            } else {
                const { fs } = RNFetchBlob;
                const timestamp = new Date().getTime();
                const destPath = `${fs.dirs.DownloadDir}/TruckMitr_Foreman_Card_${timestamp}.png`;
                await fs.cp(uri, destPath);
                showToast(t('membershipCardSavedToDownloads'));
            }
        } catch (error: any) {
            if (error?.message?.includes('User did not share')) return;
            console.error('Share membership card error:', error);
            showToast(error?.message || t('failedToShareMembershipCard'));
        } finally {
            setSharingCard(false);
        }
    };

    // Helper for tier config
    const getForemanTierConfig = (): TierConfig => ({
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
    });

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Space height={safeAreaInsets.top} />

            {/* Apple-style Confirmation Dialogs */}
            <AppleConfirmDialog
                visible={showLogoutDialog}
                title={t('logout')}
                message={t('areYouSureLogout') || 'Are you sure you want to logout from your account?'}
                confirmText={t('logout')}
                cancelText={t('cancel')}
                isDestructive={false}
                onConfirm={handleLogoutConfirm}
                onCancel={() => setShowLogoutDialog(false)}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: responsiveHeight(4) }}
            >
                {/* Profile Header Section */}
                <View style={[
                    styles.profileHeader,
                    {
                        paddingHorizontal: responsiveFontSize(2),
                        paddingTop: responsiveFontSize(2),
                        paddingBottom: responsiveFontSize(3),
                    }
                ]}>
                    {/* Profile Avatar with Progress Ring */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.avatarContainer}
                        onPress={() => navigation.navigate(STACKS.PROFILE_OVERVIEW)}
                    >
                        <Svg width={size} height={size} style={styles.progressRing}>
                            <Defs>
                                <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <Stop offset="0%" stopColor="#FFD700" />
                                    <Stop offset="100%" stopColor="#FFA500" />
                                </SvgLinearGradient>
                            </Defs>
                            {/* Background Circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={colors.blackOpacity(0.06)}
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            {/* Progress Circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="url(#progressGradient)"
                                strokeWidth={3}
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={progressOffset}
                                strokeLinecap="round"
                                rotation="-90"
                                origin={`${size / 2}, ${size / 2}`}
                            />
                        </Svg>
                        <Image
                            style={[
                                styles.avatarImage,
                                {
                                    height: size - strokeWidth * 4,
                                    width: size - strokeWidth * 4,
                                    backgroundColor: colors.white,
                                }
                            ]}
                            source={{
                                uri: user?.images
                                    ? `${BASE_URL}public/${user?.images}`
                                    : `https://cdn-icons-png.flaticon.com/512/3177/3177440.png`
                            }}
                        />
                        {/* Completion Badge */}
                        <View style={[
                            styles.completionBadge,
                            {
                                backgroundColor: colors.white,
                                ...shadow,
                                shadowColor: colors.blackOpacity(0.15),
                            }
                        ]}>
                            <Text style={[
                                styles.completionText,
                                {
                                    fontSize: responsiveFontSize(1.3),
                                    color: progress >= 80 ? '#34C759' : progress >= 50 ? '#FF9500' : '#FF3B30',
                                }
                            ]}>
                                {`${profileCompletion || 0}%`}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* User Info */}
                    <View style={styles.userInfoContainer}>
                        <Text style={[
                            styles.userName,
                            {
                                color: colors.black,
                                fontSize: responsiveFontSize(2.6),
                            }
                        ]}>
                            {user?.name || ''}
                        </Text>

                        <Text style={[
                            styles.userId,
                            {
                                color: colors.blackOpacity(0.5),
                                fontSize: responsiveFontSize(1.5),
                            }
                        ]}>
                            {`${user?.unique_id || ''}`}
                        </Text>

                        {/* Role Badge */}
                        <View style={[
                            styles.roleBadge,
                            { backgroundColor: colors.royalBlueOpacity(0.08) }
                        ]}>
                            <Text style={[
                                styles.roleText,
                                {
                                    color: colors.royalBlue,
                                    fontSize: responsiveFontSize(1.4),
                                }
                            ]}>
                                {badgeText.toLowerCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                            styles.editButton,
                            { backgroundColor: colors.blackOpacity(0.05) }
                        ]}
                        onPress={() => navigation.navigate(STACKS.PROFILE_OVERVIEW)}
                    >
                        <Feather name="edit-2" size={18} color={colors.blackOpacity(0.6)} />
                    </TouchableOpacity>
                </View>

                {/* Profile Incomplete Card */}
                {Number(profileCompletion) !== 100 && (
                    <>
                        <View style={[
                            styles.incompleteCard,
                            {
                                marginHorizontal: responsiveFontSize(2),
                                borderRadius: 16,
                                overflow: 'hidden',
                            }
                        ]}>
                            <LinearGradient
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBackground}
                                colors={['rgba(8, 68, 137, 0.08)', 'rgba(12, 120, 240, 0.12)']}
                            />
                            <View style={styles.incompleteCardContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[
                                        styles.alertIconContainer,
                                        { backgroundColor: colors.royalBlueOpacity(0.15) }
                                    ]}>
                                        <Ionicons name="alert-circle" size={24} color={colors.royalBlue} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1.5) }}>
                                        <Text style={[
                                            styles.incompleteTitle,
                                            {
                                                color: colors.black,
                                                fontSize: responsiveFontSize(1.9),
                                            }
                                        ]}>
                                            {t('yourProfileIncomplete')}
                                        </Text>
                                        <Text style={[
                                            styles.incompleteSubtitle,
                                            {
                                                color: colors.blackOpacity(0.5),
                                                fontSize: responsiveFontSize(1.5),
                                            }
                                        ]}>
                                            {t('profileIncompleteTitle')}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.completeButton,
                                        { backgroundColor: colors.royalBlue }
                                    ]}
                                    onPress={() => navigation.navigate(STACKS.PROFILE_OVERVIEW)}
                                >
                                    <Text style={[
                                        styles.completeButtonText,
                                        {
                                            color: colors.white,
                                            fontSize: responsiveFontSize(1.7),
                                        }
                                    ]}>
                                        {t('completeProfile')}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={16} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Space height={responsiveFontSize(1)} />
                    </>
                )}

                {/* Membership Card for Foreman Pro */}
                {showCard && (() => {
                    const tierConfig = getForemanTierConfig();

                    const userName = user?.name?.toUpperCase() || t('memberNameDefault').toUpperCase();
                    const uniqueId = user?.unique_id || 'TM0000000000000';
                    const stateName = user?.state_name || getStateName(user?.states) || getStateName(user?.state) || '';
                    const cityName = user?.city || '';
                    const userLocation = (cityName && stateName ? `${cityName}, ${stateName}` : (cityName || stateName)).toUpperCase();
                    const displayLabel = 'FOREMAN';
                    const displayValue = 'PRO';

                    const startDate = subscriptionDetails?.start_at
                        ? moment.unix(subscriptionDetails.start_at).format('DD/MM/YY')
                        : moment().format('DD/MM/YY');
                    const endDate = subscriptionDetails?.end_at
                        ? moment.unix(subscriptionDetails.end_at).format('DD/MM/YY')
                        : moment().add(1, 'year').format('DD/MM/YY');

                    // Card dimensions
                    const cardWidth = responsiveWidth(92);
                    const cardHeight = cardWidth / 1.586;

                    return (
                        <>
                            <SectionHeader title={t('membership')} />
                            <ViewShot
                                ref={membershipCardRef}
                                options={{ format: 'png', quality: 1.0 }}
                                style={{ marginHorizontal: responsiveFontSize(1) }}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => { }}
                                >
                                    {/* Card with metallic border */}
                                    <LinearGradient
                                        colors={tierConfig.borderColors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            borderRadius: 16,
                                            padding: 3,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 6 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 10,
                                            elevation: 8,
                                        }}
                                    >
                                        {/* Inner white border */}
                                        <View style={{
                                            borderRadius: 14,
                                            borderWidth: 2,
                                            borderColor: 'rgba(255,255,255,0.8)',
                                            overflow: 'hidden',
                                        }}>
                                            {/* Background Image */}
                                            <ImageBackground
                                                source={tierConfig.background}
                                                style={{ flex: 1, height: cardHeight }}
                                                resizeMode="cover"
                                            >
                                                {/* Dark overlay */}
                                                <View style={{
                                                    ...StyleSheet.absoluteFillObject,
                                                    backgroundColor: 'rgba(0,0,0,0.15)'
                                                }} />

                                                {/* Card Content */}
                                                <View style={{ flex: 1, padding: 12 }}>

                                                    {/* Top Row: Logo and Profile Photo */}
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                                                    <View style={{ marginTop: 12 }}>
                                                        {/* Category Label with SVG Gradient */}
                                                        {/* Increased container width to fit FOREMAN PRO */}
                                                        <View style={{ height: 24, width: 280 }}>
                                                            <Svg height="100%" width="100%" viewBox="0 0 280 24">
                                                                <Defs>
                                                                    <SvgLinearGradient id="chromeGradientCat" x1="0" y1="0" x2="0" y2="1">
                                                                        {tierConfig.chromeGradient.map((stop, index) => (
                                                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                        ))}
                                                                    </SvgLinearGradient>
                                                                </Defs>
                                                                <SvgText fill="#000000" fillOpacity="0.7" fontSize="18" fontWeight="900" fontStyle="italic" letterSpacing="1" x="1.5" y="19">
                                                                    {tierConfig.categoryText.toUpperCase()}
                                                                </SvgText>
                                                                <SvgText fill="url(#chromeGradientCat)" stroke="#000" strokeWidth="0.5" fontSize="18" fontWeight="900" fontStyle="italic" letterSpacing="1" x="0" y="17.5">
                                                                    {tierConfig.categoryText.toUpperCase()}
                                                                </SvgText>
                                                            </Svg>
                                                        </View>

                                                        {/* TM ID with SVG Gradient */}
                                                        <View style={{ height: 38, width: '100%', marginTop: 8 }}>
                                                            <Svg height="100%" width="100%" viewBox="0 0 340 38">
                                                                <Defs>
                                                                    <SvgLinearGradient id="chromeGradientId" x1="0" y1="0" x2="0" y2="1">
                                                                        {tierConfig.chromeGradient.map((stop, index) => (
                                                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                        ))}
                                                                    </SvgLinearGradient>
                                                                </Defs>
                                                                <SvgText fill="#000000" fillOpacity="0.8" fontSize="24" fontWeight="900" letterSpacing="2" x="2" y="30">
                                                                    {uniqueId}
                                                                </SvgText>
                                                                <SvgText fill="url(#chromeGradientId)" stroke="#000" strokeWidth="0.8" fontSize="24" fontWeight="900" letterSpacing="2" x="0" y="28">
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
                                                            <Text style={{
                                                                color: 'rgba(255, 255, 255, 1)',
                                                                fontSize: responsiveFontSize(1.3),
                                                                fontWeight: '900',
                                                                marginTop: 3,
                                                                textShadowColor: 'rgba(0,0,0,0.6)',
                                                                textShadowOffset: { width: 1, height: 1 },
                                                                textShadowRadius: 1,
                                                            }}>
                                                                {/* {displayLabel}: <Text style={{ fontWeight: '800' }}>{displayValue}</Text> */}
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
                                                                        {t('validFrom')?.toUpperCase()}
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
                                                                        {t('validUntil')?.toUpperCase()}
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
                                </TouchableOpacity>
                            </ViewShot>

                            {/* Action Buttons - Invoice and Membership Card (Horizontal) */}
                            <View style={{ paddingHorizontal: responsiveFontSize(1), marginTop: responsiveFontSize(1.5), flexDirection: 'row', gap: responsiveFontSize(1) }}>
                                {/* Download Invoice Button */}
                                <TouchableOpacity
                                    onPress={downloadInvoice}
                                    activeOpacity={0.85}
                                    disabled={downloadingInvoice}
                                    style={[
                                        styles.premiumInvoiceButton,
                                        {
                                            opacity: downloadingInvoice ? 0.7 : 1,
                                            flex: 1,
                                            backgroundColor: colors.royalBlue,
                                        }
                                    ]}
                                >
                                    {downloadingInvoice ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="receipt" size={18} color="#FFFFFF" />
                                            <Text style={[
                                                styles.premiumInvoiceButtonText,
                                                { fontSize: responsiveFontSize(1.5), marginLeft: 6, color: '#FFFFFF' }
                                            ]}>
                                                {t('downloadInvoice')}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Share Membership Card Button */}
                                <TouchableOpacity
                                    onPress={() => shareMembershipCard('share')}
                                    activeOpacity={0.85}
                                    disabled={sharingCard}
                                    style={[
                                        styles.premiumInvoiceButton,
                                        {
                                            opacity: sharingCard ? 0.7 : 1,
                                            flex: 1,
                                            backgroundColor: colors.royalBlue,
                                        }
                                    ]}
                                >
                                    {sharingCard ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="share-social" size={18} color="#FFFFFF" />
                                            <Text style={[
                                                styles.premiumInvoiceButtonText,
                                                { fontSize: responsiveFontSize(1.5), marginLeft: 6, color: '#FFFFFF' }
                                            ]}>
                                                {t('shareCard')}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    );
                })()}

                {/* Account Section */}
                <SectionHeader title={t('account')} />
                <CardContainer>
                    <MenuItem
                        icon={<Feather name="user" size={20} color={colors.royalBlue} />}
                        title={t('profile')}
                        onPress={() => navigation.navigate(STACKS.PROFILE_OVERVIEW)}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    {/* <MenuItem
                        icon={<MaterialCommunityIcons name="account-group-outline" size={20} color="#059669" />}
                        title={t('myDrivers') || 'My Drivers'}
                        onPress={() =>
                            //  navigation.navigate(STACKS.FOREMAN_MY_PILOTS)
                            console.log('My Drivers')
                        }
                    /> */}
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="bank-outline" size={20} color="#D97706" />}
                        title={t('bankDetails')}
                        onPress={() =>
                            navigation.navigate(STACKS.FOREMAN_BANK_DETAILS)
                        }
                    />
                </CardContainer>

                {/* General Section */}
                <SectionHeader title={t('general')} />
                <CardContainer>
                    {/* <MenuItem
                        icon={<FontAwesome name="star-o" size={20} color="#FFD700" />}
                        title={t('rateUs')}
                        onPress={() => navigation.navigate(STACKS.RATING)}
                    /> */}
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<AntDesign name="customerservice" size={20} color="#34C759" />}
                        title={t('contactUs')}
                        onPress={_navigateContactUs}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<Feather name="shield" size={20} color="#5856D6" />}
                        title={t('privacyPolicy')}
                        onPress={_navigatePrivacy}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<Ionicons name="settings-outline" size={20} color="#8E8E93" />}
                        title={t('settings')}
                        onPress={_navigateSetting}
                    />
                </CardContainer>

                {/* Share Section */}
                <SectionHeader title={t('sharing')} />
                <CardContainer>
                    <MenuItem
                        icon={<Ionicons name="share-social-outline" size={20} color={colors.azureBlue} />}
                        title={t('shareTheApp')}
                        onPress={_onPressShareApp}
                    />
                </CardContainer>

                {/* Account Actions Section */}
                <SectionHeader title={t('logins')} />
                <CardContainer>
                    <MenuItem
                        icon={<MaterialCommunityIcons name="logout" size={20} color={colors.royalBlue} />}
                        title={t('logout')}
                        onPress={_onPressLogout}
                    />
                </CardContainer>

                <Space height={responsiveHeight(8)} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Profile Header
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
    },
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        position: 'absolute',
    },
    avatarImage: {
        borderRadius: 100,
    },
    completionBadge: {
        position: 'absolute',
        bottom: -4,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    completionText: {
        fontWeight: '700',
    },
    userInfoContainer: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    userName: {
        fontWeight: '600',
        marginBottom: 2,
    },
    userId: {
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        fontWeight: '600',
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Incomplete Card
    incompleteCard: {
        overflow: 'hidden',
    },
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    incompleteCardContent: {
        padding: 16,
    },
    alertIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    incompleteTitle: {
        fontWeight: '600',
        marginBottom: 2,
    },
    incompleteSubtitle: {
        flex: 1,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 14,
        gap: 8,
    },
    completeButtonText: {
        fontWeight: '600',
    },

    // Section & Menu
    sectionHeader: {
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    cardContainer: {
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconContainer: {
        width: 32,
        alignItems: 'center',
    },
    menuItemText: {
        flex: 1,
        fontWeight: '400',
    },
    divider: {
        height: 1,
        marginLeft: 56,
    },
    premiumInvoiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    premiumInvoiceButtonText: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});