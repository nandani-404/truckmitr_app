import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import DriverAssociation from '@truckmitr/src/app/layouts/association/driver-association-home';
import DriverAssociationAddDriver from '@truckmitr/src/app/layouts/association/driver-association-add-driver';
import { DriverAssociationEarnings, DriverAssociationProfile } from '@truckmitr/src/app/layouts/association';

const Tab = createBottomTabNavigator();

// Placeholder screens - will be replaced with actual screens
// const AssociateDashboardScreen = () => (
//     <View style={styles.placeholderContainer}>
//         <Ionicons name="home" size={64} color="#246BFD" />
//         <Text style={styles.placeholderTitle}>Associate Dashboard</Text>
//         <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
//     </View>
// );

const AssociateAddDriverScreen = () => (
    <View style={styles.placeholderContainer}>
        <Ionicons name="person-add" size={64} color="#246BFD" />
        <Text style={styles.placeholderTitle}>Add Driver</Text>
        <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
    </View>
);

const AssociateEarningsScreen = () => (
    <View style={styles.placeholderContainer}>
        <Ionicons name="wallet" size={64} color="#246BFD" />
        <Text style={styles.placeholderTitle}>Earnings</Text>
        <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
    </View>
);

const AssociateProfileScreen = () => (
    <View style={styles.placeholderContainer}>
        <Ionicons name="person" size={64} color="#246BFD" />
        <Text style={styles.placeholderTitle}>Profile</Text>
        <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
    </View>
);

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const colors = useColor();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();

    const tabs = [
        { name: STACKS.DRIVER_ASSOCIATION_HOME_TAB, label: t('home') || 'Home', icon: 'home' },
        { name: STACKS.DRIVER_ASSOCIATION_ADD_DRIVER, label: t('addDriver') || 'Add Driver', icon: 'person-add' },
        { name: STACKS.DRIVER_ASSOCIATION_EARNINGS, label: t('earnings') || 'Earnings', icon: 'wallet' },
        { name: STACKS.DRIVER_ASSOCIATION_PROFILE, label: t('profile') || 'Profile', icon: 'person' },
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

                const getIcon = (name: string, isFocused: boolean) => {
                    let iconName = name;
                    if (!isFocused) {
                        iconName = `${name}-outline`;
                    }
                    return iconName;
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={getIcon(tab.icon, isFocused)}
                            size={isFocused ? 28 : 24}
                            color={isFocused ? colors.white : colors.whiteOpacity(0.6)}
                        />
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

export default function AssociateBottomTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name={STACKS.DRIVER_ASSOCIATION_HOME_TAB} component={DriverAssociation} />
            <Tab.Screen name={STACKS.DRIVER_ASSOCIATION_ADD_DRIVER} component={DriverAssociationAddDriver} />
            <Tab.Screen name={STACKS.DRIVER_ASSOCIATION_EARNINGS} component={DriverAssociationEarnings} />
            <Tab.Screen name={STACKS.DRIVER_ASSOCIATION_PROFILE} component={DriverAssociationProfile} />
        </Tab.Navigator>
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
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
    },
    placeholderSubtitle: {
        fontSize: 16,
        color: '#666',
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
    iconContainer: {
        width: 40,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    tabLabel: {
        textAlign: 'center',
    },
});
