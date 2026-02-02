
import {
    Alert,
    Image,
    ScrollView,
    Share,
    Platform,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Modal,
    Animated,
    Dimensions,
    StyleSheet,
} from 'react-native'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { subscriptionDetailsAction, userAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import LinearGradient from 'react-native-linear-gradient';
import { ImageBackground } from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import RNFetchBlob from 'react-native-blob-util';
import { getUserBadgeText } from '@truckmitr/src/utils/global/userBadge';
import moment from 'moment';

// Membership Card Asset Images
const LOGO_IMAGE = require('@truckmitr/src/assets/membership-card/logotrick.png');
// Reusing the background image currently used, or we could switch to a proactive "Pro" background if it exists
const BACKGROUND_IMAGE = require('@truckmitr/src/assets/membership-card/msc.png');
// const BACKGROUND_FOREMAN_PRO = require('@truckmitr/src/assets/membership-card/foremancardnew.jpeg'); // Optional if we want to match Foreman exactly

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const capitalizeFirst = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Association Card Config (mimicking the PRO tier from profile/index)
const ASSOCIATION_CARD_CONFIG = {
    borderColors: ['#1F2937', '#4B5563', '#9CA3AF', '#4B5563', '#1F2937'], // Gunmetal/Silver style
    chromeGradient: [
        { offset: '0', color: '#E0E3E7' },
        { offset: '0.25', color: '#BFC5CC' },
        { offset: '0.5', color: '#9AA0A6' },
        { offset: '0.75', color: '#BFC5CC' },
        { offset: '1', color: '#E0E3E7' },
    ],
};

// Apple-style Confirmation Dialog Component
interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const AppleConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = false,
    onConfirm,
    onCancel,
    loading = false,
}) => {
    const colors = useColor();
    const { responsiveFontSize, responsiveWidth, responsiveHeight } = useResponsiveScale();
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <Animated.View style={[styles.dialogOverlay, { opacity: opacityValue }]}>
                <Animated.View
                    style={[
                        styles.dialogContainer,
                        {
                            transform: [{ scale: scaleValue }],
                            backgroundColor: colors.white,
                            width: responsiveWidth(75),
                        }
                    ]}
                >
                    <View style={[styles.dialogIconContainer, { backgroundColor: isDestructive ? 'rgba(255, 59, 48, 0.1)' : 'rgba(8, 68, 137, 0.1)' }]}>
                        {isDestructive ? (
                            <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#FF3B30" />
                        ) : (
                            <MaterialCommunityIcons name="logout" size={32} color={colors.royalBlue} />
                        )}
                    </View>

                    <Text style={[styles.dialogTitle, { color: colors.black, fontSize: responsiveFontSize(2.2) }]}>
                        {title}
                    </Text>

                    <Text style={[styles.dialogMessage, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.7) }]}>
                        {message}
                    </Text>

                    <View style={styles.dialogButtonContainer}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onCancel}
                            disabled={loading}
                            style={[styles.dialogButton, styles.dialogCancelButton, { backgroundColor: colors.blackOpacity(0.05) }]}
                        >
                            <Text style={[styles.dialogButtonText, { color: colors.blackOpacity(0.8), fontSize: responsiveFontSize(1.8) }]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onConfirm}
                            disabled={loading}
                            style={[styles.dialogButton, styles.dialogConfirmButton, { backgroundColor: isDestructive ? '#FF3B30' : colors.royalBlue }]}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={[styles.dialogButtonText, { color: colors.white, fontSize: responsiveFontSize(1.8) }]}>
                                    {confirmText}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// Menu Item Component
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
            style={[styles.menuItem, { paddingVertical: responsiveFontSize(1.8), paddingHorizontal: responsiveFontSize(2) }]}
        >
            <View style={[styles.menuIconContainer, { marginRight: responsiveFontSize(1.5) }]}>
                {icon}
            </View>
            <Text style={[styles.menuItemText, { color: textColor || colors.black, fontSize: responsiveFontSize(1.9) }]}>
                {title}
            </Text>
            {rightElement || (
                <Ionicons name="chevron-forward" size={20} color={colors.blackOpacity(0.25)} />
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
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();

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
    const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
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

export default function DriverAssociationProfile() {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    useStatusBarStyle('dark-content')
    const { user, profileCompletion, star_rating, subscriptionDetails } = useSelector((state: any) => state?.user) || {};
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    // Check if Association is Pro (Active Subscription)
    const isAssociationPro =
        subscriptionDetails?.hasActiveSubscription ||
        subscriptionDetails?.payment_type === 'association_pro' ||
        subscriptionDetails?.subscription_plan_id === '12' ||
        subscriptionDetails?.subscription_plan_id === 12 ||
        user?.plan_id === 12 ||
        user?.payment_type === 'association_pro';

    // Get the user badge text (Association Pro / Association)
    const userBadgeText = getUserBadgeText({ user, subscriptionDetails });

    const progress = profileCompletion || 0;
    const size = responsiveFontSize(12);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;
    const membershipCardRef = useRef<ViewShot>(null);
    const [sharingCard, setSharingCard] = useState(false);

    // Dialog States
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const _fetchUser = async () => {
                const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
                if (profile?.data?.status) {
                    dispatch(userAction(profile?.data))
                }
            }
            _fetchUser()
        }, [])
    );

    const _navigateProfileEdit = () => {
        navigation.navigate(STACKS.ASSOCIATION_PROFILE_EDIT)
    }

    const _navigateRating = () => navigation.navigate(STACKS.RATING)
    const _navigateContactUs = () => navigation.navigate(STACKS.CONTACT_US)
    const _navigatePrivacy = () => navigation.navigate(STACKS.PRIVACY)
    const _navigateSetting = () => navigation.navigate(STACKS.SETTINGS)

    const deleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response: any = await axiosInstance.post(END_POINTS?.DELETE_ACCOUNT);
            if (response?.data?.status) {
                await analytics().logEvent('delete_account', {
                    user_id: String(user?.id),
                    user_unique_id: user?.unique_id,
                    method: 'user_requested',
                });
                AppEventsLogger.logEvent('delete_account', { user_id: String(user?.id) });
                dispatch(userAuthenticatedAction(false));
                deleteUserData();
                showToast(response?.data?.message);
            }
        } catch (error) {
            console.warn('Delete account error:', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const _onPressShareApp = async () => {
        try {
            await Share.share({
                message: t('shareAppMessage'),
            });
        } catch (error) {
            console.error('Error sharing the app:', error);
        }
    };

    const _onPressShareProfile = async () => {
        try {
            const userName = user?.name || 'TruckMitr User';
            const userId = user?.unique_id || '';
            const profileUrl = `https://truckmitr.com/u/${userId}`;

            const shareMessage = `👋 Hi! Check out my Driver Association Manager profile on TruckMitr:

👤 ${userName}
🆔 ID: ${userId}

📲 View my profile: ${profileUrl}

📥 Download TruckMitr: https://play.google.com/store/apps/details?id=com.truckmitr`;

            await Share.share({
                message: shareMessage,
                url: profileUrl,
                title: `${userName}'s TruckMitr Profile`,
            });
        } catch (error) {
            console.error('Error sharing profile:', error);
        }
    };

    const _onPressDeleteAccount = () => {
        setShowDeleteDialog(true);
    }

    const _onPressLogout = async () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await analytics().logEvent('user_logout', {
                method: 'manual_logout',
                user_id: String(user?.id),
                user_unique_id: user?.unique_id,
            });
            AppEventsLogger.logEvent('user_logout', { user_id: String(user?.id) });
            await axiosInstance.post(END_POINTS?.LOGOUT);
        } catch (error) {
            console.warn('Analytics logout error:', error);
        }

        dispatch(userAuthenticatedAction(false));
        deleteUserData();
        setShowLogoutDialog(false);
    };

    const shareMembershipCard = async () => {
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

            const shareOptions = {
                title: t('truckMitrMembershipCard'),
                message: t('checkOutMyMembershipCard'),
                url: Platform.OS === 'android' ? `file://${uri}` : uri,
                type: 'image/png',
            };

            await RNShare.open(shareOptions);
            showToast(t('membershipCardSharedSuccessfully'));
        } catch (error: any) {
            if (error?.message?.includes('User did not share')) {
                return;
            }
            console.error('Share membership card error:', error);
            showToast(error?.message || t('failedToShareMembershipCard'));
        } finally {
            setSharingCard(false);
        }
    };

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

            <AppleConfirmDialog
                visible={showDeleteDialog}
                title={t('deleteAccount')}
                message={t('areYouSureDeleteAccount') || 'This action cannot be undone. All your data will be permanently deleted.'}
                confirmText={t('delete') || 'Delete'}
                cancelText={t('cancel')}
                isDestructive={true}
                onConfirm={deleteAccount}
                onCancel={() => setShowDeleteDialog(false)}
                loading={isDeleting}
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
                        onPress={_navigateProfileEdit}
                        activeOpacity={0.9}
                        style={styles.avatarContainer}
                    >
                        <Svg width={size} height={size} style={styles.progressRing}>
                            <Defs>
                                <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <Stop offset="0%" stopColor="#FFD700" />
                                    <Stop offset="100%" stopColor="#FFA500" />
                                </SvgLinearGradient>
                            </Defs>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={colors.blackOpacity(0.06)}
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
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
                                {`${profileCompletion}%`}
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
                            {` ${user?.unique_id || ''}`}
                        </Text>

                        {/* Role Badge */}
                        <View style={[styles.roleBadge, { backgroundColor: colors.royalBlueOpacity(0.08) }]}>
                            <Text style={[styles.roleText, { color: colors.royalBlue, fontSize: responsiveFontSize(1.4) }]}>
                                {userBadgeText}
                            </Text>
                        </View>

                        {/* Star Rating */}
                        {/* <View style={styles.starContainer}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FontAwesome
                                    key={i}
                                    name={i < star_rating ? 'star' : 'star-o'}
                                    size={14}
                                    color={i < star_rating ? '#FFD700' : colors.blackOpacity(0.2)}
                                    style={{ marginRight: 3 }}
                                />
                            ))}
                        </View> */}
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                        onPress={_navigateProfileEdit}
                        activeOpacity={0.7}
                        style={[styles.editButton, { backgroundColor: colors.blackOpacity(0.05) }]}
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
                                    <View style={[styles.alertIconContainer, { backgroundColor: colors.royalBlueOpacity(0.15) }]}>
                                        <Ionicons name="alert-circle" size={24} color={colors.royalBlue} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1.5) }}>
                                        <Text style={[styles.incompleteTitle, { color: colors.black, fontSize: responsiveFontSize(1.9) }]}>
                                            {t('yourProfileIncomplete')}
                                        </Text>
                                        <Text style={[styles.incompleteSubtitle, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.5) }]}>
                                            {t('profileIncompleteTitle')}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={_navigateProfileEdit}
                                    activeOpacity={0.8}
                                    style={[styles.completeButton, { backgroundColor: colors.royalBlue }]}
                                >
                                    <Text style={[styles.completeButtonText, { color: colors.white, fontSize: responsiveFontSize(1.7) }]}>
                                        {t('completeProfile')}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={16} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Membership Card Section */}

                <SectionHeader title={t('membership')} />
                <View style={{ marginHorizontal: responsiveFontSize(2) }}>
                    {(() => {
                        // --- Data Preparation for Card ---
                        // Badge Text
                        const badgeText = "DRIVER ASSOCIATION PRESIDENT"; // Hardcoded specific title or use userBadgeText

                        // User Info
                        const userName = user?.name?.toUpperCase() || t('memberNameDefault').toUpperCase();
                        const uniqueId = user?.unique_id || 'TM2501UPTP00001';

                        // Location
                        const stateName = user?.state_name || user?.state || '';
                        const cityName = user?.city || '';
                        const userLocation = (cityName && stateName ? `${cityName}, ${stateName}` : (cityName || stateName)).toUpperCase();

                        // Dates - Default to Today and 1 year later if not available (as requested)
                        const startDate = subscriptionDetails?.start_at
                            ? moment.unix(subscriptionDetails.start_at).format('DD/MM/YY')
                            : moment().format('DD/MM/YY'); // Default: Today
                        const endDate = subscriptionDetails?.end_at
                            ? moment.unix(subscriptionDetails.end_at).format('DD/MM/YY')
                            : moment().add(1, 'year').format('DD/MM/YY'); // Default: 1 Year later

                        // Dimensions matching profile/index.tsx
                        const cardWidth = responsiveWidth(92);
                        const cardHeight = cardWidth / 1.586;

                        return (
                            <ViewShot ref={membershipCardRef} options={{ format: 'png', quality: 1 }}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 6 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 10,
                                        elevation: 8,
                                    }}
                                >
                                    {/* Outer Metallic Border */}
                                    <LinearGradient
                                        colors={ASSOCIATION_CARD_CONFIG.borderColors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            borderRadius: 16,
                                            padding: 3,
                                        }}
                                    >
                                        {/* Inner White Border Container */}
                                        <View style={{
                                            borderRadius: 14,
                                            borderWidth: 2,
                                            borderColor: 'rgba(255,255,255,0.8)',
                                            overflow: 'hidden',
                                            height: cardHeight, // Fixed height based on aspect ratio
                                        }}>
                                            <ImageBackground
                                                source={BACKGROUND_IMAGE}
                                                style={{ flex: 1 }}
                                                resizeMode="cover"
                                            >
                                                {/* Dark Overlay for readability */}
                                                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' }} />

                                                <View style={{ flex: 1, padding: 12 }}>
                                                    {/* Top Row: Logo & Photo */}
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Image source={LOGO_IMAGE} style={{ width: 120, height: 40 }} resizeMode="contain" />

                                                        {/* Profile Photo with Metallic Border */}
                                                        <LinearGradient
                                                            colors={ASSOCIATION_CARD_CONFIG.borderColors}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 1 }}
                                                            style={{ padding: 2, borderRadius: 30 }}
                                                        >
                                                            <View style={{ backgroundColor: '#fff', padding: 2, borderRadius: 28 }}>
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

                                                    {/* Middle Section: Badge & ID */}
                                                    <View style={{ marginTop: 4 }}>
                                                        {/* Badge Text with Gradient */}
                                                        <View style={{ height: 22, width: 250 }}> {/* Increased width for longer title */}
                                                            <Svg height="100%" width="100%" viewBox="0 0 250 22">
                                                                <Defs>
                                                                    <SvgLinearGradient id="chromeGradientCat" x1="0" y1="0" x2="0" y2="1">
                                                                        {ASSOCIATION_CARD_CONFIG.chromeGradient.map((stop, index) => (
                                                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                        ))}
                                                                    </SvgLinearGradient>
                                                                </Defs>
                                                                <SvgText fill="#000000" fillOpacity="0.7" fontSize="13" fontWeight="900" fontStyle="italic" letterSpacing="1" x="1.5" y="17">
                                                                    {badgeText.toUpperCase()}
                                                                </SvgText>
                                                                <SvgText fill="url(#chromeGradientCat)" stroke="#000" strokeWidth="0.5" fontSize="13" fontWeight="900" fontStyle="italic" letterSpacing="1" x="0" y="15.5">
                                                                    {badgeText.toUpperCase()}
                                                                </SvgText>
                                                            </Svg>
                                                        </View>

                                                        {/* ID with Gradient */}
                                                        <View style={{ height: 38, width: '100%', marginTop: 2 }}>
                                                            <Svg height="100%" width="100%" viewBox="0 0 340 38">
                                                                <Defs>
                                                                    <SvgLinearGradient id="chromeGradientId" x1="0" y1="0" x2="0" y2="1">
                                                                        {ASSOCIATION_CARD_CONFIG.chromeGradient.map((stop, index) => (
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

                                                    {/* Bottom Section: Name, Loc, Dates */}
                                                    <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                        {/* Left: Name & Location */}
                                                        <View style={{ flex: 1 }}>
                                                            {/* Name with Gradient */}
                                                            <View style={{ height: 20, width: 200 }}>
                                                                <Svg height="100%" width="100%" viewBox="0 0 200 20">
                                                                    <Defs>
                                                                        <SvgLinearGradient id="chromeGradientName" x1="0" y1="0" x2="0" y2="1">
                                                                            {ASSOCIATION_CARD_CONFIG.chromeGradient.map((stop, index) => (
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

                                                        {/* Right: Dates */}
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                                {/* Valid From */}
                                                                <View style={{ alignItems: 'center' }}>
                                                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' }}>{t('validFrom')?.toUpperCase() || 'VALID FROM'}</Text>
                                                                    <View style={{ height: 16, width: 60, marginTop: 1 }}>
                                                                        <Svg height="100%" width="100%" viewBox="0 0 60 16">
                                                                            <Defs>
                                                                                <SvgLinearGradient id="chromeGradientDate1" x1="0" y1="0" x2="0" y2="1">
                                                                                    {ASSOCIATION_CARD_CONFIG.chromeGradient.map((stop, index) => (
                                                                                        <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                                    ))}
                                                                                </SvgLinearGradient>
                                                                            </Defs>
                                                                            <SvgText fill="url(#chromeGradientDate1)" stroke="#000" strokeWidth="0.3" fontSize="11" fontWeight="900" x="30" y="13" textAnchor="middle">
                                                                                {startDate}
                                                                            </SvgText>
                                                                        </Svg>
                                                                    </View>
                                                                </View>
                                                                {/* Valid Until */}
                                                                <View style={{ alignItems: 'center' }}>
                                                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' }}>{t('validUntil')?.toUpperCase() || 'VALID UNTIL'}</Text>
                                                                    <View style={{ height: 16, width: 60, marginTop: 1 }}>
                                                                        <Svg height="100%" width="100%" viewBox="0 0 60 16">
                                                                            <Defs>
                                                                                <SvgLinearGradient id="chromeGradientDate2" x1="0" y1="0" x2="0" y2="1">
                                                                                    {ASSOCIATION_CARD_CONFIG.chromeGradient.map((stop, index) => (
                                                                                        <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                                                                    ))}
                                                                                </SvgLinearGradient>
                                                                            </Defs>
                                                                            <SvgText fill="url(#chromeGradientDate2)" stroke="#000" strokeWidth="0.3" fontSize="11" fontWeight="900" x="30" y="13" textAnchor="middle">
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
                        );
                    })()}


                    {/* Card Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#1E3A5F' }]}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="receipt-long" size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>{t('downloadInvoice')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.royalBlue }]}
                            activeOpacity={0.8}
                            onPress={shareMembershipCard}
                            disabled={sharingCard}
                        >
                            {sharingCard ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="share-social" size={18} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>{t('shareCard')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Section */}
                <SectionHeader title={t('account')} />
                <CardContainer>
                    <MenuItem
                        icon={<Feather name="user" size={20} color={colors.royalBlue} />}
                        title={t('profile')}
                        onPress={_navigateProfileEdit}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="bank-outline" size={20} color="#D97706" />}
                        title={t('bankDetails')}
                        onPress={() =>
                            navigation.navigate(STACKS.ASSOCIATION_BANK_DETAILS)
                        }
                    />

                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="chart-bar" size={20} color="#8B5CF6" />}
                        title={t('earningsChart') || 'Earning Chart'}
                        onPress={() => navigation.navigate(STACKS.DRIVER_ASSOCIATION_EARNINGS_INFO)}
                    />
                </CardContainer>

                {/* General Section */}
                <SectionHeader title={t('general')} />
                <CardContainer>
                    <MenuItem
                        icon={<FontAwesome name="star-o" size={20} color="#FFD700" />}
                        title={t('rateUs')}
                        onPress={_navigateRating}
                    />
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
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<Ionicons name="person-circle-outline" size={20} color={colors.royalBlue} />}
                        title={t('shareMyProfile')}
                        onPress={_onPressShareProfile}
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
    )
}

const styles = StyleSheet.create({
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
    starContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    membershipCard: {
        position: 'relative',
        overflow: 'hidden',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
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
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogContainer: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    dialogIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    dialogTitle: {
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    dialogMessage: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    dialogButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    dialogButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogCancelButton: {},
    dialogConfirmButton: {},
    dialogButtonText: {
        fontWeight: '600',
    },
});
