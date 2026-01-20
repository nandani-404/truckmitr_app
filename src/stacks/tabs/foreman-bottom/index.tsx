import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { userAuthenticatedAction } from '@truckmitr/redux/actions/user.action';
import { AppleConfirmDialog } from '@truckmitr/src/app/components/apple-confirm-dialog';
import { BASE_URL } from '@truckmitr/src/utils/config';
import ForemanHome from '@truckmitr/src/app/layouts/foreman/foreman-home';
import ForemanAddDriver from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-add-driver';

// Placeholder screens - will be replaced with actual screens


const ForemanDriverKiAwaz = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialCommunityIcons name="microphone" size={80} color="#FF6B6B" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>Driver Ki Awaz</Text>
        <Text style={{ color: '#666', marginTop: 8 }}>Coming Soon</Text>
    </View>
);

const ForemanMyEarnings = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialCommunityIcons name="cash-multiple" size={80} color="#845EC2" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>My Earnings</Text>
        <Text style={{ color: '#666', marginTop: 8 }}>Coming Soon</Text>
    </View>
);

const ForemanProfile = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const insets = useSafeAreaInsets();
    const { user } = useSelector((state: any) => state?.user) || {};

    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const _onPressLogout = () => {
        setShowLogoutDialog(true);
    };

    const _onPressDeleteAccount = () => {
        setShowDeleteDialog(true);
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

        // Clear session and module selection
        await AsyncStorage.removeItem('app_session_active');
        await AsyncStorage.removeItem('SELECTED_MODULE');

        dispatch(userAuthenticatedAction(false));
        deleteUserData();
        setShowLogoutDialog(false);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        const userinfo = {
            id: user?.id ?? '',
            unique_id: user?.unique_id ?? '',
            name: user?.name ?? '',
            mobile: user?.mobile ?? '',
            email: user?.email ?? '',
            role: user?.role ?? '',
        };

        const eventParams = {
            user_id: String(userinfo.id),
            user_unique_id: userinfo.unique_id,
            user_name: userinfo.name,
            user_email: userinfo.email,
            user_role: userinfo.role,
            method: 'user_requested',
        };

        try {
            const response: any = await axiosInstance.post(END_POINTS?.DELETE_ACCOUNT);

            if (response?.data?.status) {
                await analytics().logEvent('delete_account', eventParams);
                AppEventsLogger.logEvent('delete_account', eventParams);
                await new Promise<void>(res => setTimeout(() => res(), 500));

                // Clear session and module selection
                await AsyncStorage.removeItem('app_session_active');
                await AsyncStorage.removeItem('SELECTED_MODULE');

                dispatch(userAuthenticatedAction(false));
                deleteUserData();
            }
        } catch (error) {
            console.warn('Delete account error:', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ height: insets.top, backgroundColor: colors.background }} />

            {/* Apple-style Confirmation Dialog */}
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

            {/* Delete Account Dialog */}
            <AppleConfirmDialog
                visible={showDeleteDialog}
                title={t('deleteAccount')}
                message={t('areYouSureDeleteAccount') || 'This action cannot be undone. All your data will be permanently deleted.'}
                confirmText={t('delete') || 'Delete'}
                cancelText={t('cancel')}
                isDestructive={true}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteDialog(false)}
                loading={isDeleting}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: responsiveHeight(4) }}
            >
                {/* Profile Header */}
                <View style={{
                    alignItems: 'center',
                    paddingVertical: responsiveHeight(4),
                    paddingHorizontal: responsiveWidth(4),
                }}>
                    <View style={{
                        width: responsiveFontSize(12),
                        height: responsiveFontSize(12),
                        borderRadius: responsiveFontSize(6),
                        backgroundColor: colors.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...shadow,
                        marginBottom: responsiveHeight(2),
                    }}>
                        <Image
                            style={{
                                width: responsiveFontSize(11),
                                height: responsiveFontSize(11),
                                borderRadius: responsiveFontSize(5.5),
                            }}
                            source={{
                                uri: user?.images
                                    ? `${BASE_URL}public/${user?.images}`
                                    : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'
                            }}
                        />
                    </View>
                    <Text style={{
                        fontSize: responsiveFontSize(2.4),
                        fontWeight: '700',
                        color: colors.black,
                        marginBottom: 4,
                    }}>
                        {user?.name || 'Foreman User'}
                    </Text>
                    <Text style={{
                        fontSize: responsiveFontSize(1.5),
                        color: colors.blackOpacity(0.5),
                    }}>
                        {user?.unique_id || 'TM0000000000000'}
                    </Text>
                    <View style={{
                        backgroundColor: '#3D5EE1',
                        paddingHorizontal: 16,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginTop: 12,
                    }}>
                        <Text style={{
                            color: '#fff',
                            fontSize: responsiveFontSize(1.4),
                            fontWeight: '600',
                        }}>
                            FOREMAN
                        </Text>
                    </View>
                </View>

                {/* Coming Soon Card */}
                <View style={{
                    marginHorizontal: responsiveWidth(4),
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    padding: responsiveWidth(5),
                    alignItems: 'center',
                    ...shadow,
                    marginBottom: responsiveHeight(3),
                }}>
                    <MaterialCommunityIcons name="hammer-wrench" size={48} color="#3D5EE1" />
                    <Text style={{
                        fontSize: responsiveFontSize(2),
                        fontWeight: '600',
                        color: colors.black,
                        marginTop: 16,
                        marginBottom: 8,
                    }}>
                        Profile Settings Coming Soon
                    </Text>
                    <Text style={{
                        fontSize: responsiveFontSize(1.5),
                        color: colors.blackOpacity(0.5),
                        textAlign: 'center',
                    }}>
                        We're working on bringing you a full-featured profile management experience.
                    </Text>
                </View>

                {/* Logout Section */}
                <View style={{
                    marginHorizontal: responsiveWidth(4),
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    ...shadow,
                    overflow: 'hidden',
                }}>
                    <TouchableOpacity
                        onPress={_onPressLogout}
                        activeOpacity={0.6}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: responsiveFontSize(2),
                            paddingHorizontal: responsiveFontSize(2),
                        }}
                    >
                        <View style={{ marginRight: responsiveFontSize(1.5) }}>
                            <MaterialCommunityIcons name="logout" size={22} color={colors.royalBlue} />
                        </View>
                        <Text style={{
                            flex: 1,
                            fontSize: responsiveFontSize(1.9),
                            color: colors.black,
                            fontWeight: '500',
                        }}>
                            {t('logout')}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.blackOpacity(0.25)} />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: colors.blackOpacity(0.06), marginHorizontal: responsiveFontSize(2) }} />

                    {/* Delete Account Button */}
                    <TouchableOpacity
                        onPress={_onPressDeleteAccount}
                        activeOpacity={0.6}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: responsiveFontSize(2),
                            paddingHorizontal: responsiveFontSize(2),
                        }}
                    >
                        <View style={{ marginRight: responsiveFontSize(1.5) }}>
                            {isDeleting
                                ? <ActivityIndicator size="small" color="#FF3B30" />
                                : <MaterialCommunityIcons name="delete-outline" size={22} color="#FF3B30" />
                            }
                        </View>
                        <Text style={{
                            flex: 1,
                            fontSize: responsiveFontSize(1.9),
                            color: '#FF3B30',
                            fontWeight: '500',
                        }}>
                            {t('deleteAccount')}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.blackOpacity(0.25)} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const Tab = createBottomTabNavigator();

function ForemanTabBar({ state, descriptors, navigation }: any) {
    const colors = useColor();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();

    const tabs = [
        { name: STACKS.FOREMAN_HOME, icon: 'home', label: 'Home' },
        { name: STACKS.FOREMAN_ADD_DRIVER, icon: 'account-plus', label: 'Add Driver' },
        { name: STACKS.FOREMAN_DRIVER_KI_AWAZ, icon: 'microphone', label: 'Driver Ki Awaz' },
        { name: STACKS.FOREMAN_MY_EARNINGS, icon: 'cash-multiple', label: 'Earnings' },
        { name: STACKS.FOREMAN_PROFILE, icon: 'account-circle', label: 'Profile' },
    ];

    return (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8, backgroundColor: colors.royalBlue }]}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const tabConfig = tabs[index];

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={tabConfig.icon}
                            size={30}
                            color={isFocused ? colors.white : colors.whiteOpacity(0.5)}
                        />
                        {isFocused && (
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.tabLabel,
                                    {
                                        color: isFocused ? colors.white : colors.whiteOpacity(0.5),
                                        fontSize: responsiveFontSize(1.2)
                                    }
                                ]}
                            >
                                {tabConfig.label}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function ForemanBottom() {
    return (
        <Tab.Navigator
            tabBar={props => <ForemanTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name={STACKS.FOREMAN_HOME} component={ForemanHome} />
            <Tab.Screen name={STACKS.FOREMAN_ADD_DRIVER} component={ForemanAddDriver} />
            <Tab.Screen name={STACKS.FOREMAN_DRIVER_KI_AWAZ} component={ForemanDriverKiAwaz} />
            <Tab.Screen name={STACKS.FOREMAN_MY_EARNINGS} component={ForemanMyEarnings} />
            <Tab.Screen name={STACKS.FOREMAN_PROFILE} component={ForemanProfile} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        // backgroundColor: colors.royalBlue,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    tabLabel: {
        marginTop: 4,
        fontWeight: '500',
    },
});
