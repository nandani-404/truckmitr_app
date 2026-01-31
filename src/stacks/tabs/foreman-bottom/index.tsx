import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ForemanHome from '@truckmitr/src/app/layouts/foreman/foreman-home';
import ForemanAddDriver from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-add-driver';
import ForemanEarnings from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-earnings';
import ForemanProfile from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-profile';
import DriverKiAwazInfo from '@truckmitr/src/app/layouts/main/driver-ki-awaz-info';

const Tab = createBottomTabNavigator();

function ForemanTabBar({ state, descriptors, navigation }: any) {
    const colors = useColor();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();

    const tabs = [
        { name: STACKS.FOREMAN_HOME, icon: 'home', label: 'Home' },
        { name: STACKS.FOREMAN_ADD_DRIVER, icon: 'account-plus', label: 'Add Driver' },
        { name: STACKS.FOREMAN_DRIVER_KI_AWAZ, icon: 'mic', label: '', isSpecial: true },
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

                if (tabConfig.isSpecial) {
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
            <Tab.Screen name={STACKS.FOREMAN_DRIVER_KI_AWAZ} component={DriverKiAwazInfo} />
            <Tab.Screen name={STACKS.FOREMAN_MY_EARNINGS} component={ForemanEarnings} />
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
