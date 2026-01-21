import {
    Image,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, AppleConfirmDialog } from '@truckmitr/src/app/components';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { userAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { useTranslation } from 'react-i18next';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import LinearGradient from 'react-native-linear-gradient';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

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

export default function ForemanProfile() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useStatusBarStyle('dark-content');
    const { user, profileCompletion } = useSelector((state: any) => state?.user) || {};
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const progress = profileCompletion || 0;
    const size = responsiveFontSize(12);
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

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
                                {t('foreman') || 'Foreman'}
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

                {/* Account Section */}
                <SectionHeader title={t('account')} />
                <CardContainer>
                    <MenuItem
                        icon={<Feather name="user" size={20} color={colors.royalBlue} />}
                        title={t('profile')}
                        onPress={() => { }}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
                    <MenuItem
                        icon={<MaterialCommunityIcons name="account-group-outline" size={20} color="#059669" />}
                        title={t('myDrivers') || 'My Drivers'}
                        onPress={() =>
                            //  navigation.navigate(STACKS.FOREMAN_MY_PILOTS)
                            console.log('My Drivers')
                        }
                    />
                </CardContainer>

                {/* General Section */}
                <SectionHeader title={t('general')} />
                <CardContainer>
                    <MenuItem
                        icon={<FontAwesome name="star-o" size={20} color="#FFD700" />}
                        title={t('rateUs')}
                        onPress={() => navigation.navigate(STACKS.RATING)}
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
});