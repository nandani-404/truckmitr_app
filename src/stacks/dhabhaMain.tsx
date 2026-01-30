import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
        { name: STACKS.DHABHA_MY_REFERRALS, label: t('myReferrals') || 'My Referrals', icon: 'people' },
        { name: STACKS.DHABHA_EARNINGS, label: t('earnings') || 'Earnings', icon: 'wallet' },
        { name: STACKS.DHABHA_PROFILE, label: t('profile') || 'Profile', icon: 'person' },
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
            <Tab.Screen name={STACKS.DHABHA_MY_REFERRALS} component={DhabhaMyReferralsScreen} />
            <Tab.Screen name={STACKS.DHABHA_EARNINGS} component={DhabhaWallet} />
            <Tab.Screen name={STACKS.DHABHA_PROFILE} component={DhabhaMyProfile} />
        </Tab.Navigator>
    );
};

// Main Stack Navigator
export default function DhabhaMain() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={STACKS.DHABHA_BOTTOM} component={DhabhaBottomTabs} />
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
});
