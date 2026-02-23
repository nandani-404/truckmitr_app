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
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';

const PROFILE_PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Helper Components ---

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
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
                Animated.timing(opacityValue, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, { toValue: 0.8, duration: 150, useNativeDriver: true }),
                Animated.timing(opacityValue, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onCancel}>
            <Animated.View style={[styles.dialogOverlay, { opacity: opacityValue }]}>
                <Animated.View style={[styles.dialogContainer, { transform: [{ scale: scaleValue }], backgroundColor: colors.white, width: responsiveWidth(75) }]}>
                    <View style={[styles.dialogIconContainer, { backgroundColor: isDestructive ? 'rgba(255, 59, 48, 0.1)' : 'rgba(8, 68, 137, 0.1)' }]}>
                        <MaterialCommunityIcons name={isDestructive ? "alert-circle-outline" : "logout"} size={32} color={isDestructive ? "#FF3B30" : colors.royalBlue} />
                    </View>
                    <Text style={[styles.dialogTitle, { color: colors.black, fontSize: responsiveFontSize(2.2) }]}>{title}</Text>
                    <Text style={[styles.dialogMessage, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.7) }]}>{message}</Text>
                    <View style={styles.dialogButtonContainer}>
                        <TouchableOpacity activeOpacity={0.7} onPress={onCancel} disabled={loading} style={[styles.dialogButton, styles.dialogCancelButton, { backgroundColor: colors.blackOpacity(0.05) }]}>
                            <Text style={[styles.dialogButtonText, { color: colors.blackOpacity(0.8), fontSize: responsiveFontSize(1.8) }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} onPress={onConfirm} disabled={loading} style={[styles.dialogButton, styles.dialogConfirmButton, { backgroundColor: isDestructive ? '#FF3B30' : colors.royalBlue }]}>
                            {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={[styles.dialogButtonText, { color: colors.white, fontSize: responsiveFontSize(1.8) }]}>{confirmText}</Text>}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

interface MenuItemProps {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    showDivider?: boolean;
    rightElement?: React.ReactNode;
    textColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, onPress, showDivider = true, rightElement, textColor }) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={[styles.menuItem, { paddingVertical: responsiveFontSize(1.8), paddingHorizontal: responsiveFontSize(2) }]}>
            <View style={[styles.menuIconContainer, { marginRight: responsiveFontSize(1.5) }]}>
                {icon}
            </View>
            <Text style={[styles.menuItemText, { color: textColor || colors.black, fontSize: responsiveFontSize(1.9) }]}>{title}</Text>
            {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.blackOpacity(0.25)} />}
        </TouchableOpacity>
    );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();
    return (
        <Text style={[styles.sectionHeader, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.5), marginHorizontal: responsiveFontSize(2), marginTop: responsiveFontSize(3), marginBottom: responsiveFontSize(1) }]}>
            {title.toUpperCase()}
        </Text>
    );
};

const CardContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const colors = useColor();
    const { responsiveFontSize } = useResponsiveScale();
    return (
        <View style={[styles.cardContainer, { marginHorizontal: responsiveFontSize(2), backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' }]}>
            {children}
        </View>
    );
};

export default function DhabhaMyProfile() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useStatusBarStyle('dark-content');
    const { user, profileCompletion } = useSelector((state: any) => state?.user) || {};
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Profile Progress
    const progress = profileCompletion || 75;
    const size = responsiveFontSize(12);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

    // Navigation handlers
    const _navigateRating = () => navigation.navigate(STACKS.RATING as any);
    const _navigatePrivacy = () => navigation.navigate(STACKS.PRIVACY as any);
    const _navigateSetting = () => navigation.navigate(STACKS.SETTINGS as any);

    const _onPressShareProfile = async () => {
        try {
            const userName = user?.name || 'TruckMitr User';
            const userRole = (user?.role || 'member');
            const userId = user?.unique_id || '';
            const profileUrl = `https://truckmitr.com/u/${userId}`;

            const shareMessage = `👋 Hi! Check out my ${userRole} profile on TruckMitr:

👤 ${userName}
🆔 ID: ${userId}

👀 View my profile: ${profileUrl}

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

    const _onPressShareApp = async () => {
        try {
            const dhabaDisplayName = user?.dhabha_name || user?.name || 'Dhaba Partner';
            const shareMessage = `*नमस्ते भाई,*

मैं TruckMitr में *Dhaba Partner* के रूप में काम कर रहा हूँ।
आप मेरे रेफरल कोड का उपयोग करके TruckMitr App पर रजिस्टर करें और कई खास सुविधाओं का लाभ उठाएँ:

🚛 *Verified Jobs* – भरोसेमंद ट्रांसपोर्टर्स से सीधी नौकरी के अवसर
🎓 *Training Videos, Quizzes & Certificates* – सीखें और प्रमाणपत्र पाएं
🆔 *ID & Background Check* – आपकी प्रोफाइल बने ज्यादा भरोसेमंद
📢 *Driver Ki Awaz* – ड्राइवरों की आवाज़ और सुझाव के लिए मंच
🤝 *Driver Welfare* – ड्राइवरों के हित और लाभ की योजनाएँ
⭐ और भी बहुत कुछ… – बेहतर कमाई के अवसर, सीधा संपर्क, सुरक्षित और भरोसेमंद प्लेटफॉर्म

📲 आज ही TruckMitr App डाउनलोड करें
👉 https://play.google.com/store/apps/details?id=com.truckmitr

🔑 मेरा Referral Code: *${user?.Referral_Code || 'N/A'}*

रजिस्ट्रेशन में किसी भी मदद के लिए आप मुझे कभी भी कॉल कर सकते हैं।

धन्यवाद 🙏
*${dhabaDisplayName}*`;

            await Share.share({ message: shareMessage });
        } catch (error) {
            console.error('Error sharing app:', error);
        }
    };

    const _onPressLogout = () => setShowLogoutDialog(true);
    const _onPressDeleteAccount = () => setShowDeleteDialog(true);

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

        // Clear all user data and caches
        await deleteUserData();

        // Dispatch logout action to reset Redux state
        dispatch({ type: 'AUTH_LOGOUT' });
        dispatch(userAuthenticatedAction(false));

        setShowLogoutDialog(false);
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response: any = await axiosInstance.post(END_POINTS?.DELETE_ACCOUNT);
            if (response?.data?.status) {
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
                // onPress={() => navigation.navigate(STACKS.PROFILE_COMPLETION_DHABHA as any)}
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
                        uri: user?.images ? `${BASE_URL}public/${user.images}` : PROFILE_PLACEHOLDER
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
                    {user?.dhabha_name || user?.name || "Dhabha Name"}
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
                        {t('dhabaPartner') || 'Dhaba Partner'}
                    </Text>
                </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
                onPress={() => navigation.navigate(STACKS.DHABHA_MY_DHABHA as any, { initialTab: 'Profile' })}
                activeOpacity={0.7}
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
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    <Space height={safeAreaInsets.top} />

                    {/* Header */}
                    {renderHeader()}

                    {/* Account Section */}
                    <SectionHeader title={t('account') || "Account"} />
                    <CardContainer>
                        <MenuItem
                            icon={<Feather name="user" size={20} color={colors.royalBlue} />}
                            title={t('profile') || "Profile"}
                            onPress={() =>
                                // console.log('profile')

                                navigation.navigate(STACKS.DHABHA_MY_DHABHA as any, { initialTab: 'Profile' })
                            }
                        />

                        <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                        <MenuItem
                            icon={<MaterialCommunityIcons name="bank-outline" size={20} color="#D97706" />}
                            title={t('bankDetails') || "Bank Details"}
                            onPress={() => navigation.navigate(STACKS.DHABHA_BANK_DETAILS as any)}
                        />
                    </CardContainer>

                    {/* Growth Section */}
                    {/* <SectionHeader title={t('growth') || "Growth"} />
                    <CardContainer>
                        <MenuItem
                            icon={<MaterialCommunityIcons name="account-group-outline" size={20} color="#8B5CF6" />}
                            title={t('myReferrals') || "My Referrals"}
                            onPress={() =>
                                console.log('my referrals')

                                // navigation.navigate(STACKS.DHABHA_MY_REFERRALS as any)
                            }
                        />

                    </CardContainer> */}

                    {/* General Section */}
                    <SectionHeader title={t('general') || "General"} />
                    <CardContainer>
                        <MenuItem
                            icon={<FontAwesome name="star-o" size={20} color="#FFD700" />}
                            title={t('rateUs') || "Rate Us"}
                            onPress={_navigateRating}
                        />
                        <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                        <MenuItem
                            icon={<AntDesign name="customerservice" size={20} color="#34C759" />}
                            title={t('contactUs') || "Contact Us"}
                            onPress={() => navigation.navigate(STACKS.CONTACT_US as any)}
                        />
                        <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                        <MenuItem
                            icon={<Feather name="shield" size={20} color="#5856D6" />}
                            title={t('privacyPolicy') || "Privacy Policy"}
                            onPress={_navigatePrivacy}
                        />
                        <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                        <MenuItem
                            icon={<Ionicons name="settings-outline" size={20} color="#8E8E93" />}
                            title={t('settings') || "Settings"}
                            onPress={_navigateSetting}
                        />
                    </CardContainer>

                    {/* Share Section */}
                    <SectionHeader title={t('sharing') || "Sharing"} />
                    <CardContainer>
                        <MenuItem
                            icon={<Ionicons name="share-social-outline" size={20} color={colors.azureBlue} />}
                            title={t('shareTheApp') || "Share The App"}
                            onPress={_onPressShareApp}
                        />
                    </CardContainer>

                    {/* Account Actions Section */}
                    <SectionHeader title={t('logins') || "Logins"} />
                    <CardContainer>
                        <MenuItem
                            icon={<MaterialCommunityIcons name="logout" size={20} color={colors.royalBlue} />}
                            title={t('logout') || "Logout"}
                            onPress={_onPressLogout}
                        />
                    </CardContainer>

                </ScrollView>
            </View>

            {/* Dialogs */}
            <AppleConfirmDialog
                visible={showLogoutDialog}
                title={t('logout') || "Logout"}
                message={t('logoutConfirmation') || "Are you sure you want to logout?"}
                confirmText={t('logout') || "Logout"}
                cancelText={t('cancel') || "Cancel"}
                onConfirm={handleLogoutConfirm}
                onCancel={() => setShowLogoutDialog(false)}
            />

            <AppleConfirmDialog
                visible={showDeleteDialog}
                title={t('deleteAccount') || "Delete Account"}
                message={t('deleteAccountConfirmation') || "Are you sure? This action is irreversible."}
                confirmText={t('delete') || "Delete"}
                cancelText={t('cancel') || "Cancel"}
                isDestructive
                loading={isDeleting}
                onConfirm={handleDeleteAccount}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // iOS Grouped Background Color
    },
    // Profile Header Styles
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

    // Menu Styles
    cardContainer: {
        // Shared logic passed via props
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    menuIconContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    menuItemText: {
        flex: 1,
        fontWeight: '500',
    },
    sectionHeader: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginLeft: 50, // Indent divider to match text start
    },
    // Dialog Styles
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogContainer: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
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
        marginBottom: 8,
        textAlign: 'center',
    },
    dialogMessage: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    dialogButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    dialogButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogCancelButton: {
    },
    dialogConfirmButton: {
    },
    dialogButtonText: {
        fontWeight: '600',
    },
});
