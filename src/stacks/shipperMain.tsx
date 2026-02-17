import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { showToast } from '@truckmitr/src/app/hooks/toast';

// Import Screens
import ShipperHome from '../app/layouts/shipper/home';
import ShipperMyLoads from '../app/layouts/shipper/my-loads';
import ShipperPostLoad from '../app/layouts/shipper/post-load';
import ShipperTrack from '../app/layouts/shipper/track';
import ShipperProfile from '../app/layouts/shipper/profile';
import ShipperProfileEdit from '../app/layouts/shipper/shipper-profile-edit';
import ShipperActiveLoads from '../app/layouts/shipper/shipper-active-loads';
import ShipperAcceptedLoads from '../app/layouts/shipper/shipper-accepted-loads';
import ShipperInTransitLoads from '../app/layouts/shipper/inTransitLoads';
import ShipperPODPending from '../app/layouts/shipper/pod-pending';
import ShipperInProgressLoads from '../app/layouts/shipper/shipper-in-progress-loads';
import ShipperTrackDetail from '../app/layouts/shipper/track/detail';
import LocationMap from '../app/layouts/main/location/map';
import LocationSearch from '../app/layouts/main/location/search';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const colors = useColor();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();
    const { shipperKycStatus } = useSelector((state: any) => state?.user);

    const tabsSource = [
        { name: STACKS.SHIPPER_HOME, label: 'Home', icon: 'home' },
        { name: STACKS.SHIPPER_MY_LOADS, label: 'My Loads', icon: 'cube' },
        { name: STACKS.SHIPPER_POST_LOAD, label: 'Post Load', icon: 'add-circle' },
        { name: STACKS.SHIPPER_TRACK, label: 'Track', icon: 'navigate' },
        { name: STACKS.SHIPPER_PROFILE, label: 'Profile', icon: 'person' },
    ];

    return (
        <View
            style={[
                styles.tabBarContainer,
                {
                    backgroundColor: colors.royalBlue || '#1E40AF',
                    paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 10,
                }
            ]}
        >
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const tab = tabsSource[index];

                const onPress = () => {
                    const isUnderApproval = shipperKycStatus === '0' || shipperKycStatus === 0 || shipperKycStatus === false;

                    if (isUnderApproval && route.name !== STACKS.SHIPPER_HOME) {
                        showToast('KYC approval is required to access this tab');
                        return;
                    }

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
                    const iconName = isFocused ? name : `${name}-outline`;
                    return (
                        <Ionicons
                            name={iconName}
                            size={isFocused ? 28 : 24}
                            color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
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
                        <Text style={[
                            styles.tabLabel,
                            {
                                color: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                                fontSize: responsiveFontSize(1.2),
                                fontWeight: isFocused ? '700' : '400',
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

// Bottom Tab Navigator
const ShipperBottomTabs = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name={STACKS.SHIPPER_HOME} component={ShipperHome} />
            <Tab.Screen name={STACKS.SHIPPER_MY_LOADS} component={ShipperMyLoads} />
            <Tab.Screen name={STACKS.SHIPPER_POST_LOAD} component={ShipperPostLoad} />
            <Tab.Screen name={STACKS.SHIPPER_TRACK} component={ShipperTrack} />
            <Tab.Screen name={STACKS.SHIPPER_PROFILE} component={ShipperProfile} />
        </Tab.Navigator>
    );
};

export default function ShipperMain() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={STACKS.SHIPPER_BOTTOM_TAB} component={ShipperBottomTabs} />
            <Stack.Screen name={STACKS.SHIPPER_PROFILE_EDIT} component={ShipperProfileEdit} />
            <Stack.Screen name={STACKS.SHIPPER_ACTIVE_LOADS} component={ShipperActiveLoads} />
            <Stack.Screen name={STACKS.SHIPPER_ACCEPTED_LOADS} component={ShipperAcceptedLoads} />
            <Stack.Screen name={STACKS.SHIPPER_IN_TRANSIT_LOADS} component={ShipperInTransitLoads} />
            <Stack.Screen name={STACKS.SHIPPER_POD_PENDING} component={ShipperPODPending} />
            <Stack.Screen name={STACKS.SHIPPER_IN_PROGRESS_LOADS} component={ShipperInProgressLoads} />
            <Stack.Screen name={STACKS.SHIPPER_TRACK_DETAIL} component={ShipperTrackDetail} />
            <Stack.Screen name={STACKS.MAP_VIEW} component={LocationMap} />
            <Stack.Screen name={STACKS.LOCATION_SEARCH} component={LocationSearch} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
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
