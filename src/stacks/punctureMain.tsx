import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Import actual components
import PunctureHome from '@truckmitr/src/app/layouts/puncture/puncture-home';
import PunctureAddDriver from '@truckmitr/src/app/layouts/puncture/puncture-add-driver';
import DriverKiAwazInfo from '@truckmitr/src/app/layouts/main/driver-ki-awaz-info';
import PunctureMyProfile from '@truckmitr/src/app/layouts/puncture/puncture-my-profile';
import PunctureProfileOverview from '@truckmitr/src/app/layouts/puncture/puncture-profile-overview';
import PunctureBankDetails from '@truckmitr/src/app/layouts/puncture/puncture-bank-details';
import PunctureProfileEdit from '@truckmitr/src/app/layouts/puncture/puncture-profile-edit';
import PunctureWallet from '@truckmitr/src/app/layouts/puncture/puncture-wallet';
import PunctureMyShop from '@truckmitr/src/app/layouts/puncture/puncture-my-shop';
import PunctureDriverSearch from '@truckmitr/src/app/layouts/puncture/puncture-driver-search';

// Placeholder components
const PlaceholderScreen = ({ title }: { title: string }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{title}</Text>
        <Text style={{ marginTop: 8, color: '#666' }}>Coming Soon</Text>
    </View>
);

// const PunctureAddDriver = () => <PlaceholderScreen title="Add Driver" />;
// const PunctureWallet = () => <PlaceholderScreen title="Wallet" />;
// const PunctureProfile = () => <PlaceholderScreen title="Profile" />;
// const DriverKiAwazHome = () => <PlaceholderScreen title="Driver Ki Awaz" />; // Placeholder for now

// Import shared screens
import { Settings, Rating, ContactUs, Privacy, LanguageMain } from '@truckmitr/layouts/index';
import PunctureMyReferrals from '../app/layouts/puncture/puncture-my-referrals';
import PunctureMyDrivers from '../app/layouts/puncture/puncture-my-drivers';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const colors = useColor();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();

    const tabs = [
        { name: STACKS.PUNCTURE_HOME, label: t('home') || 'Home', icon: 'home' },
        { name: STACKS.PUNCTURE_ADD_DRIVER, label: t('addDriver') || 'Add Driver', icon: 'person-add' },
        { name: STACKS.PUNCTURE_DRIVER_KI_AWAZ, label: '', icon: 'mic', isSpecial: true },
        { name: STACKS.PUNCTURE_WALLET, label: t('wallet') || 'My Wallet', icon: 'wallet' },
        { name: STACKS.PUNCTURE_PROFILE, label: t('profile') || 'Profile', icon: 'person' },
    ];

    return (
        <View
            style={[
                styles.tabBarContainer,
                {
                    backgroundColor: colors.royalBlue,
                    paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 10,
                }
            ]}
        >
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const tab = tabs[index];

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

                const getIcon = (name: string, isFocused: boolean, isMaterial?: boolean) => {
                    const iconName = isFocused ? name : `${name}-outline`;
                    // For now assuming all are Ionicons unless specified otherwise
                    return (
                        <Ionicons
                            name={iconName}
                            size={isFocused ? 28 : 24}
                            color={isFocused ? colors.white : colors.whiteOpacity(0.6)}
                        />
                    );
                };

                if (tab.isSpecial) {
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.centerButtonContainer}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#F59E0B']}
                                style={styles.centerButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="mic" size={32} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        {getIcon(tab.icon, isFocused)}
                        {isFocused && (
                            <Text style={[
                                styles.tabLabel,
                                {
                                    color: colors.white,
                                    fontSize: responsiveFontSize(1.2),
                                    fontWeight: '700',
                                }
                            ]}>
                                {tab.label}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// Bottom Tab Navigator
const PunctureBottomTabs = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name={STACKS.PUNCTURE_HOME} component={PunctureHome} />
            <Tab.Screen name={STACKS.PUNCTURE_ADD_DRIVER} component={PunctureAddDriver} />
            <Tab.Screen name={STACKS.PUNCTURE_DRIVER_KI_AWAZ} component={DriverKiAwazInfo} />
            <Tab.Screen name={STACKS.PUNCTURE_WALLET} component={PunctureWallet} />
            <Tab.Screen name={STACKS.PUNCTURE_PROFILE} component={PunctureMyProfile} />
        </Tab.Navigator>
    );
};

export default function PunctureMain() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={STACKS.PUNCTURE_BOTTOM} component={PunctureBottomTabs} />
            {/* Shared screens */}
            <Stack.Screen name={STACKS.SETTINGS} component={Settings} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.RATING} component={Rating} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.CONTACT_US} component={ContactUs} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PRIVACY} component={Privacy} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.LANGUAGE_MAIN} component={LanguageMain} options={{ animation: 'fade' }} />

            {/* Puncture specific screens */}
            <Stack.Screen name={STACKS.PUNCTURE_PROFILE_OVERVIEW} component={PunctureProfileOverview} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.PUNCTURE_BANK_DETAILS} component={PunctureBankDetails} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.PUNCTURE_PROFILE_EDIT} component={PunctureProfileEdit} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.PUNCTURE_MY_SHOP} component={PunctureMyShop} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.PUNCTURE_MY_REFERRALS} component={PunctureMyReferrals} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.PUNCTURE_MY_DRIVERS} component={PunctureMyDrivers} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.PUNCTURE_DRIVER_SEARCH} component={PunctureDriverSearch} options={{ animation: 'fade' }} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingTop: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        textAlign: 'center',
        marginTop: 2,
    },
    centerButtonContainer: {
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
    },
    centerButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
