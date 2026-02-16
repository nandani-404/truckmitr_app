/**
 * Trucker Bottom Tab Navigator
 * 
 * Independent bottom tab navigator for Trucker Mode.
 * Completely separate from the Transporter tab navigator.
 * 
 * Tabs: Home | Find Loads | [+Add Truck] | Earnings | Profile
 * 
 * The center tab is a raised FAB (Floating Action Button) that
 * navigates to the AddTruck screen on the parent stack.
 * 
 * Each tab screen receives properly wired navigation callbacks
 * that push detail screens onto the parent TruckerMain stack.
 */

import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Animated, Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveScale } from '@truckmitr/hooks/reponsive';
import { useColor } from '@truckmitr/hooks/colors';
import { useNavigation } from '@react-navigation/native';
import { TRUCKER_STACKS } from '../../stacks';
import LinearGradient from 'react-native-linear-gradient';

// Import Trucker tab screens
import TruckerHomeScreen from '../../../app/layouts/Trucker/TruckerHome/index';
import FindLoadsScreen from '../../../app/layouts/Trucker/FindLoads/index';
import EarningsScreen from '../../../app/layouts/Trucker/Earnings/index';
import TruckerProfileScreen from '../../../app/layouts/Trucker/Profile/index';

const Tab = createBottomTabNavigator();

// Trucker tab screen names (independent from STACKS)
const TRUCKER_TABS = {
    HOME: 'truckerHome',
    FIND_LOADS: 'truckerFindLoads',
    ADD_TRUCK_PLACEHOLDER: 'truckerAddTruckPlaceholder', // Dummy tab for the FAB
    EARNINGS: 'truckerEarnings',
    PROFILE: 'truckerProfile',
} as const;

// ═══════════════════════════════════════════════════════
// Tab Screen Wrappers (wire props to parent stack navigation)
// ═══════════════════════════════════════════════════════

const HomeTabWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <TruckerHomeScreen
            onNavigateToFindLoads={() => navigation.navigate(TRUCKER_TABS.FIND_LOADS)}
            onNavigateToMyTrips={() => navigation.navigate(TRUCKER_STACKS.MY_LOADS)}
            onNavigateToPayments={() => navigation.navigate(TRUCKER_STACKS.EARNINGS)}
            onNavigateToMyVehicles={() => navigation.navigate(TRUCKER_STACKS.VEHICLE_MANAGEMENT)}
            onNavigateToTripDetails={(id: string) =>
                navigation.navigate(TRUCKER_STACKS.ACTIVE_TRIP, { tripId: id })
            }
            onNavigateToNotifications={() =>
                navigation.navigate(TRUCKER_STACKS.NOTIFICATIONS)
            }
            onNavigateToProfile={() => navigation.navigate(TRUCKER_TABS.PROFILE)}
            onNavigateToAddDriver={() => navigation.navigate(TRUCKER_STACKS.ADD_DRIVER)}
            onNavigateToAddBankDetails={() => navigation.navigate(TRUCKER_STACKS.BANK_DETAILS)}
        />
    );
};

const FindLoadsTabWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <FindLoadsScreen
            onLoadSelect={(loadId: string, loadData?: any) =>
                navigation.navigate(TRUCKER_STACKS.LOAD_DETAIL, { loadId, loadData })
            }
        />
    );
};

// Dummy placeholder — never actually rendered (FAB intercepts tap)
const AddTruckPlaceholder = () => <View style={{ flex: 1 }} />;

const EarningsTabWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <EarningsScreen
            onTransactionPress={(id: string) =>
                navigation.navigate(TRUCKER_STACKS.INVOICE_DETAIL, { invoiceId: id })
            }
        />
    );
};

const ProfileTabWrapper = () => {
    const navigation = useNavigation<any>();
    return (
        <TruckerProfileScreen
            onBack={() => navigation.navigate(TRUCKER_TABS.HOME)}
            onNavigate={(screen: string) => {
                const screenMap: Record<string, string> = {
                    'vehicleManagement': TRUCKER_STACKS.VEHICLE_MANAGEMENT,
                    'documentRenewal': TRUCKER_STACKS.DOCUMENT_RENEWAL,
                    'personalRoutes': TRUCKER_STACKS.PERSONAL_ROUTES,
                    'earnings': TRUCKER_STACKS.EARNINGS,
                    'notifications': TRUCKER_STACKS.NOTIFICATIONS,
                    'paidHistory': TRUCKER_STACKS.PAID_HISTORY,
                    'pendingPayments': TRUCKER_STACKS.PENDING_PAYMENTS,
                    'addTruck': TRUCKER_STACKS.ADD_TRUCK,
                    'profileCompletion': TRUCKER_STACKS.PROFILE_SIGNUP,
                };
                const target = screenMap[screen];
                if (target) {
                    navigation.navigate(target);
                }
            }}
        />
    );
};

// ═══════════════════════════════════════════════════════
// Custom Tab Bar with Center FAB
// ═══════════════════════════════════════════════════════

function TruckerTabBar({ state, descriptors, navigation }: { state: any; descriptors: any; navigation: any }) {
    const colors = useColor();
    const safeArea = useSafeAreaInsets();
    const { responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const animatedValues = useRef(state.routes.map(() => new Animated.Value(1))).current;
    const fabScale = useRef(new Animated.Value(1)).current;

    const getTabIcon = (routeName: string, isFocused: boolean) => {
        const iconColor = isFocused ? '#FFF' : 'rgba(255,255,255,0.5)';
        const iconStyle = { height: 22, width: 22, tintColor: iconColor };
        switch (routeName) {
            case TRUCKER_TABS.HOME:
                return <Image style={iconStyle} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png' }} />;
            case TRUCKER_TABS.FIND_LOADS:
                return <Image style={iconStyle} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3281/3281289.png' }} />;
            case TRUCKER_TABS.EARNINGS:
                return <Image style={iconStyle} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/855/855279.png' }} />;
            case TRUCKER_TABS.PROFILE:
                return <Image style={iconStyle} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/266/266033.png' }} />;
            default:
                return null;
        }
    };

    const getTabLabel = (routeName: string) => {
        switch (routeName) {
            case TRUCKER_TABS.HOME: return 'Home';
            case TRUCKER_TABS.FIND_LOADS: return 'Find Loads';
            case TRUCKER_TABS.EARNINGS: return 'Earnings';
            case TRUCKER_TABS.PROFILE: return 'Profile';
            default: return '';
        }
    };

    const handlePress = (index: number, route: any) => {
        Animated.sequence([
            Animated.timing(animatedValues[index], {
                toValue: 1.1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
        }
    };

    const handleFabPress = () => {
        // Animate the FAB
        Animated.sequence([
            Animated.timing(fabScale, {
                toValue: 0.85,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(fabScale, {
                toValue: 1,
                friction: 4,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate to AddTruck on the parent stack
        navigation.navigate(TRUCKER_STACKS.ADD_TRUCK);
    };

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: '#1E40AF',
            paddingBottom: safeArea.bottom,
            alignItems: 'flex-end',
        }}>
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;

                // ═══ CENTER FAB ═══
                if (route.name === TRUCKER_TABS.ADD_TRUCK_PLACEHOLDER) {
                    return (
                        <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                            <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleFabPress}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        marginTop: -24,
                                        marginBottom: 4,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        ...Platform.select({
                                            ios: {
                                                shadowColor: '#F59E0B',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.4,
                                                shadowRadius: 8,
                                            },
                                            android: {
                                                elevation: 10,
                                            },
                                        }),
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#F59E0B', '#F97316']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 28,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {/* Truck + Plus icon */}
                                        <Text style={{ fontSize: 26, marginTop: -2 }}>🚛</Text>
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 4,
                                            right: 4,
                                            width: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            backgroundColor: '#FFF',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '900',
                                                color: '#F59E0B',
                                                lineHeight: 16,
                                            }}>+</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                            <Text style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: responsiveFontSize(1),
                                fontWeight: '600',
                                marginBottom: 4,
                            }}>Add Truck</Text>
                        </View>
                    );
                }

                // ═══ REGULAR TABS ═══
                return (
                    <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            accessibilityRole="tab"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            onPress={() => handlePress(index, route)}
                            style={{ alignItems: 'center' }}
                        >
                            <Animated.View
                                style={[
                                    {
                                        height: responsiveHeight(7),
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 100,
                                        transform: [{ scale: animatedValues[index] }],
                                    },
                                ]}
                            >
                                <View style={{ height: responsiveFontSize(3.5), width: responsiveFontSize(3.5), alignItems: 'center', justifyContent: 'center' }}>
                                    {getTabIcon(route.name, isFocused)}
                                </View>
                                {isFocused && (
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            width: '100%',
                                            color: '#FFF',
                                            fontSize: responsiveFontSize(1.2),
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            marginTop: responsiveFontSize(0.2),
                                        }}
                                    >
                                        {getTabLabel(route.name)}
                                    </Text>
                                )}
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
}

// ═══════════════════════════════════════════════════════
// Tab Navigator Export
// ═══════════════════════════════════════════════════════

export default function TruckerBottomTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TruckerTabBar {...props} />}
            screenOptions={{ headerShown: false, animation: 'fade' }}
        >
            <Tab.Screen name={TRUCKER_TABS.HOME} component={HomeTabWrapper} />
            <Tab.Screen name={TRUCKER_TABS.FIND_LOADS} component={FindLoadsTabWrapper} />
            <Tab.Screen
                name={TRUCKER_TABS.ADD_TRUCK_PLACEHOLDER}
                component={AddTruckPlaceholder}
                listeners={{
                    tabPress: (e) => {
                        // Prevent navigation to the placeholder screen
                        e.preventDefault();
                    },
                }}
            />
            <Tab.Screen name={TRUCKER_TABS.EARNINGS} component={EarningsTabWrapper} />
            <Tab.Screen name={TRUCKER_TABS.PROFILE} component={ProfileTabWrapper} />
        </Tab.Navigator>
    );
}
