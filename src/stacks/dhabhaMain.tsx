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
import DhabhaHome from '@truckmitr/src/app/layouts/dhaba/dhabha-home';
import DhabhaAddDriver from '@truckmitr/src/app/layouts/dhaba/dhabha-add-driver';
import DhabhaWallet from '@truckmitr/src/app/layouts/dhaba/dhabha-wallet';
import DhabhaMyReferralsScreen from '@truckmitr/src/app/layouts/dhaba/dhabha-my-referrals';
import DhabhaMyProfile from '@truckmitr/src/app/layouts/dhaba/dhabha-my-profile';
import DhabaProfileEdit from '@truckmitr/src/app/layouts/dhaba/dhaba-profile-edit';
import DriverKiAwazHome from '@truckmitr/src/app/layouts/main/driver-ki-awaz-info/DriverKiAwazHome';

// Import shared screens
import { Settings, Rating, ContactUs, Privacy, LanguageMain } from '@truckmitr/layouts/index';
import DhabaBankDetails from '@truckmitr/src/app/layouts/dhaba/dhaba-bank-details';
import DhabhaMyDhabha from '@truckmitr/src/app/layouts/dhaba/dhabha-my-dhabha';
import DhabhaMyDrivers from '@truckmitr/src/app/layouts/dhaba/dhaba-my-drivers';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// const DhabhaMyReferralsScreen = () => (
//     <View style={styles.placeholderContainer}>
//         <Ionicons name="people-outline" size={64} color="#ccc" />
//         <Text style={styles.placeholderTitle}>My Referrals</Text>
//         <Text style={styles.placeholderText}>Driver referrals coming soon</Text>
//     </View>
// );

// DhabhaEarningsScreen is now replaced by DhabhaWallet

// DhabhaProfileScreen is now replaced by DhabhaMyProfile

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const colors = useColor();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();

    const tabs = [
        { name: STACKS.DHABHA_HOME, label: t('home') || 'Home', icon: 'home' },
        { name: STACKS.DHABHA_ADD_DRIVER, label: t('addDriver') || 'Add Driver', icon: 'person-add' },
        { name: STACKS.DHABHA_DRIVER_KI_AWAZ, label: '', icon: 'mic', isSpecial: true },
        { name: STACKS.DHABHA_EARNINGS, label: t('wallet') || 'My Wallet', icon: 'wallet' },
        { name: STACKS.DHABHA_PROFILE, label: t('account') || 'Account', icon: 'person' },
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
                    if (isMaterial) {
                        const iconName = isFocused ? name : `${name}-outline`;
                        return (
                            <MaterialCommunityIcons
                                name={iconName}
                                size={isFocused ? 28 : 24}
                                color={isFocused ? colors.white : colors.whiteOpacity(0.6)}
                            />
                        );
                    }
                    const iconName = isFocused ? name : `${name}-outline`;
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
const DhabhaBottomTabs = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name={STACKS.DHABHA_HOME} component={DhabhaHome} />
            <Tab.Screen name={STACKS.DHABHA_ADD_DRIVER} component={DhabhaAddDriver} />
            <Tab.Screen name={STACKS.DHABHA_DRIVER_KI_AWAZ} component={DriverKiAwazHome} />
            <Tab.Screen name={STACKS.DHABHA_EARNINGS} component={DhabhaWallet} />
            <Tab.Screen name={STACKS.DHABHA_PROFILE} component={DhabhaMyProfile} />
        </Tab.Navigator>
    );
};

// Main Stack Navigator
import DhabhaNearby from '@truckmitr/src/app/layouts/dhaba/dhabha-nearby';
import DhabhaDriverSearch from '@truckmitr/src/app/layouts/dhaba/dhabha-driver-search';

// ... imports

export default function DhabhaMain() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={STACKS.DHABHA_BOTTOM} component={DhabhaBottomTabs} />
            {/* Shared screens */}
            <Stack.Screen name={STACKS.SETTINGS} component={Settings} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.RATING} component={Rating} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.CONTACT_US} component={ContactUs} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PRIVACY} component={Privacy} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.DHABHA_BANK_DETAILS} component={DhabaBankDetails} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.DHABHA_MY_DHABHA} component={DhabhaMyDhabha} options={{ animation: 'fade' }} />
            {/* <Stack.Screen name={STACKS.DHABHA_NEARBY} component={DhabhaNearby} options={{ animation: 'fade' }} /> */}
            <Stack.Screen name={STACKS.DHABHA_DRIVER_SEARCH} component={DhabhaDriverSearch} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.DHABHA_PROFILE_EDIT} component={DhabaProfileEdit} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.DHABHA_MY_REFERRALS} component={DhabhaMyReferralsScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.DHABHA_MY_DRIVERS} component={DhabhaMyDrivers} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.LANGUAGE_MAIN} component={LanguageMain} options={{ animation: 'fade' }} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F7FE',
    },
    placeholderTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
    },
    placeholderText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
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
