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
    ImageBackground,
    StatusBar,
} from 'react-native'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { userAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { showToast } from '@truckmitr/src/app/hooks/toast';

import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import ViewShot from 'react-native-view-shot';

// Membership Card Asset Images
const LOGO_IMAGE = require('@truckmitr/assets/membership-card/logotrick.png');
const BACKGROUND_IMAGE = require('@truckmitr/assets/membership-card/membershipbg.png');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const useSafeColor = () => {
    const rawColors = useColor() as any;
    return {
        ...rawColors,
        royalBlue: rawColors.royalBlue || '#084489',
        royalBlueOpacity: rawColors.royalBlueOpacity || ((v: number) => `rgba(8, 68, 137, ${v})`),
        blackOpacity: rawColors.blackOpacity || ((v: number) => `rgba(0, 0, 0, ${v})`),
        whiteOpacity: rawColors.whiteOpacity || ((v: number) => `rgba(255, 255, 255, ${v})`),
        azureBlue: rawColors.azureBlue || '#056CE2',
        background: rawColors.background || '#f2f2f2',
        white: rawColors.white || '#ffffff',
        black: rawColors.black || '#000000',
    } as any;
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
    const colors = useSafeColor();
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();
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
    const colors = useSafeColor();
    const { responsiveFontSize } = useResponsiveScale();

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
    const colors = useSafeColor();
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
            {(title || '').toUpperCase()}
        </Text>
    );
};

// Card Container Component
interface CardContainerProps {
    children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({ children }) => {
    const colors = useSafeColor();
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

export default function ShipperProfile() {

    const dispatch = useDispatch()
    useStatusBarStyle('dark-content')
    const { user, profileCompletion } = useSelector((state: any) => state?.user) || {};
    const colors = useSafeColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveHeight } = useResponsiveScale();
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    // Explicit reference to verify stacks usage
    const nav = navigation;

    // Constants for placeholder text
    const PROFILE_PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    const progress = profileCompletion || 0;
    const size = Math.max(1, responsiveFontSize(12));
    const strokeWidth = 4;
    const radius = Math.max(1, (size - strokeWidth) / 2);
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
    const membershipCardRef = useRef<ViewShot>(null);

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

    // Navigation Actions
    const _navigateProfileEdit = () => {
        console.log('Navigating to shipperProfileEdit...');
        navigation.navigate('shipperProfileEdit' as any);
    }

    const _navigateRating = () => {
        console.log('Navigating to Rating...');
        nav.navigate(STACKS.RATING as any);
    };

    const _navigateContactUs = () => {
        console.log('Navigating to Contact Us...');
        nav.navigate(STACKS.CONTACT_US as any)
    };

    const _navigatePrivacy = () => {
        nav.navigate(STACKS.PRIVACY as any)
    };

    const _navigateSetting = () => {
        console.log('Navigating to Settings...');
        nav.navigate(STACKS.SETTINGS as any)
    };

    const _navigateBankDetails = () => Alert.alert('Coming Soon', 'Bank Details for Shipper is under development.');
    const _navigateReferrals = () => Alert.alert('Coming Soon', 'Referrals for Shipper is under development.');


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
                message: '🚛 At TruckMitr, we\'re more than just a platform – we\'re the driving force behind a revolution in the Indian trucking industry. \n👷‍♂️ For Drivers: Apply for verified jobs, watch training videos, and take quizzes to enhance your skills. \n🏢 For Transporters: Post jobs and instantly connect with skilled, reliable drivers. Join the movement that\'s transforming Indian logistics – download the TruckMitr app now! \n\n👉 https://play.google.com/store/apps/details?id=com.truckmitr',
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

            const shareMessage = `👋 Hi! Check out my Shipper profile on TruckMitr:

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
    }

    const _onLogout = () => {
        dispatch(userAuthenticatedAction(false));
        deleteUserData();
        showToast('Logged out successfully');
    };

    const renderHeader = () => (
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
                            <Stop offset="0%" stopColor="#22c55e" />
                            <Stop offset="100%" stopColor="#22c55e" />
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
                        rotation="-260"
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
                            : PROFILE_PLACEHOLDER
                    }}
                    resizeMode="cover"
                />
                <View style={[
                    styles.completionBadge,
                    {
                        backgroundColor: colors.white,
                        position: 'absolute',
                        bottom: -10,
                        paddingHorizontal: responsiveFontSize(1.8),
                        paddingVertical: responsiveFontSize(0.24),
                        borderRadius: 100,
                        ...shadow,
                        shadowColor: colors.blackOpacity(0.15),
                    }
                ]}>
                    <Text style={[
                        styles.completionText,
                        {
                            fontSize: responsiveFontSize(1.0),
                            color: 'green',
                        }
                    ]}>
                        {`${progress}%`}
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
                    {user?.name || "Shipper Name"}
                </Text>

                <Text style={[
                    styles.userId,
                    {
                        color: colors.blackOpacity(0.5),
                        fontSize: responsiveFontSize(1.5),
                    }
                ]}>
                    {`${user?.unique_id || 'TM000000000'}`}
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
                        Shipper
                    </Text>
                </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
                onPress={_navigateProfileEdit}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                style={[
                    styles.editButton,
                    { backgroundColor: colors.blackOpacity(0.05) }
                ]}
            >
                <Feather name="edit-2" size={18} color={colors.blackOpacity(0.6)} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <Space height={safeAreaInsets.top} />



                {/* Header Profile Info */}
                {renderHeader()}

                {/* Account Section */}
                <SectionHeader title="Account" />
                <CardContainer>
                    <MenuItem
                        icon={<Ionicons name="person-outline" size={22} color={colors.royalBlue} />}
                        title="Profile"
                        onPress={_navigateProfileEdit}
                    />

                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Ionicons name="card-outline" size={22} color="#f9d107ff" />}
                        title="Bank Detail"
                        onPress={_navigateBankDetails}
                    />
                </CardContainer>


                {/* General Section */}
                <SectionHeader title="General" />
                <CardContainer>
                    <MenuItem
                        icon={<FontAwesome name="star-o" size={20} color="#FFD700" />}
                        title="Rate Us"
                        onPress={_navigateRating}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Ionicons name="headset-outline" size={20} color="#34C759" />}
                        title="Contact Us"
                        onPress={_navigateContactUs}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Feather name="shield" size={20} color="#5856D6" />}
                        title="Privacy Policy"
                        onPress={_navigatePrivacy}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Ionicons name="settings-outline" size={20} color="#8E8E93" />}
                        title="Settings"
                        onPress={_navigateSetting}
                    />
                </CardContainer>

                {/* Share Section */}
                <SectionHeader title="Sharing" />
                <CardContainer>
                    <MenuItem
                        icon={<Ionicons name="share-social-outline" size={20} color={colors.azureBlue} />}
                        title="Share The App"
                        onPress={_onPressShareApp}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<Ionicons name="person-circle-outline" size={20} color={colors.royalBlue} />}
                        title="Share My Profile"
                        onPress={_onPressShareProfile}
                    />
                </CardContainer>

                {/* Account Actions Section */}
                <SectionHeader title="Logins" />
                <CardContainer>
                    <MenuItem
                        icon={<MaterialCommunityIcons name="logout" size={20} color={colors.royalBlue} />}
                        title="Logout"
                        onPress={() => setShowLogoutDialog(true)}
                    />
                    <View style={styles.divider} />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />}
                        title="Delete Account"
                        textColor="#EF4444"
                        onPress={() => setShowDeleteDialog(true)}
                        showDivider={false}
                        rightElement={<View />}
                    />
                </CardContainer>


            </ScrollView>

            <AppleConfirmDialog
                visible={showLogoutDialog}
                title="Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                cancelText="Cancel"
                onConfirm={() => {
                    setShowLogoutDialog(false);
                    _onLogout();
                }}
                onCancel={() => setShowLogoutDialog(false)}
            />

            <AppleConfirmDialog
                visible={showDeleteDialog}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
                loading={isDeleting}
                onConfirm={deleteAccount}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
    // Missing Profile Header styles
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
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginLeft: 50, // Indent divider to match text start
    },
});
