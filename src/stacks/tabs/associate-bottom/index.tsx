import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

// Placeholder screens - will be replaced with actual screens
const AssociateDashboardScreen = () => (
    <View style={styles.placeholderContainer}>
        <MaterialCommunityIcons name="view-dashboard" size={64} color="#246BFD" />
        <Text style={styles.placeholderTitle}>Associate Dashboard</Text>
        <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
    </View>
);

const AssociateReferralsScreen = () => (
    <View style={styles.placeholderContainer}>
        <MaterialCommunityIcons name="account-group" size={64} color="#246BFD" />
        <Text style={styles.placeholderTitle}>My Referrals</Text>
        <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
    </View>
);

const AssociateEarningsScreen = () => (
    <View style={styles.placeholderContainer}>
        <MaterialCommunityIcons name="currency-inr" size={64} color="#246BFD" />
        <Text style={styles.placeholderTitle}>Earnings</Text>
        <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
    </View>
);

const AssociateProfileScreen = () => (
    <View style={styles.placeholderContainer}>
        <MaterialCommunityIcons name="account-circle" size={64} color="#246BFD" />
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
        { name: STACKS.ASSOCIATE_DASHBOARD, label: t('dashboard') || 'Dashboard', icon: 'view-dashboard' },
        { name: STACKS.ASSOCIATE_REFERRALS, label: t('referrals') || 'Referrals', icon: 'account-group' },
        { name: STACKS.ASSOCIATE_EARNINGS, label: t('earnings') || 'Earnings', icon: 'currency-inr' },
        { name: STACKS.ASSOCIATE_PROFILE, label: t('profile') || 'Profile', icon: 'account-circle' },
    ];

    return (
        <View style={[
            styles.tabBarContainer,
            {
                backgroundColor: colors.white,
                paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 10,
                borderTopColor: colors.blackOpacity(0.08),
            }
        ]}>
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

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconContainer,
                            isFocused && { backgroundColor: colors.royalBlueOpacity(0.1) }
                        ]}>
                            <MaterialCommunityIcons
                                name={tab.icon}
                                size={24}
                                color={isFocused ? colors.royalBlue : colors.blackOpacity(0.4)}
                            />
                        </View>
                        <Text style={[
                            styles.tabLabel,
                            {
                                color: isFocused ? colors.royalBlue : colors.blackOpacity(0.4),
                                fontSize: responsiveFontSize(1.3),
                                fontWeight: isFocused ? '600' : '500',
                            }
                        ]}>
                            {tab.label}
                        </Text>
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
            <Tab.Screen name={STACKS.ASSOCIATE_DASHBOARD} component={AssociateDashboardScreen} />
            <Tab.Screen name={STACKS.ASSOCIATE_REFERRALS} component={AssociateReferralsScreen} />
            <Tab.Screen name={STACKS.ASSOCIATE_EARNINGS} component={AssociateEarningsScreen} />
            <Tab.Screen name={STACKS.ASSOCIATE_PROFILE} component={AssociateProfileScreen} />
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
