import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColor } from '@truckmitr/hooks/colors';
import { useResponsiveScale } from '@truckmitr/hooks/reponsive';
import { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { STACKS } from '@truckmitr/stacks/stacks';
import { Profile, DriverKiAwazInfo } from '@truckmitr/layouts/index';
import { useTranslation } from 'react-i18next';
import TransporterAddedDriverHome from '@truckmitr/src/app/layouts/main/transporter-added-driver/home';
import TransporterDriverTrackingScreen from '@truckmitr/src/app/layouts/main/transporter-added-driver/tracking';

const Tab = createBottomTabNavigator();

function TabBarRestrictedDriver({ state, descriptors, navigation, homeRef }: { state: any, descriptors: any, navigation: any, homeRef: any }) {
    const { t } = useTranslation();
    const colors = useColor();
    const safeArea = useSafeAreaInsets();
    const { responsiveFontSize, responsiveHeight } = useResponsiveScale();

    const animatedValues = useRef(state.routes.map(() => new Animated.Value(1))).current;

    const _tabIcon = (screen: string, isFocused: boolean) => {
        const homeProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const trackingProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const driverKiAwazProps = { height: 40, width: 40 };
        const profileProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        
        switch (screen) {
            case STACKS.HOME:
                return <Image style={homeProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png' }} />
            case STACKS.TRANSPORTER_DRIVER_TRACKING:
                return <Image style={trackingProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }} />
            case STACKS.DRIVER_KI_AWAZ_INFO:
                return <Image style={driverKiAwazProps} source={require('@truckmitr/assets/logo/speaker.png')} />
            case STACKS.PROFILE:
                return <Image style={profileProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/266/266033.png' }} />
            default:
                return null;
        }
    };

    const handlePress = (index: number, route: any) => {
        // Trigger the zoom animation
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

    return (
        <View style={{ flexDirection: 'row', backgroundColor: colors.royalBlue, paddingBottom: safeArea.bottom }}>
            {state.routes.map((route: any, index: any) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
                const isFocused = state.index === index;

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                const getLabelText = () => {
                    switch (label) {
                        case STACKS.HOME:
                            return t('home');
                        case STACKS.TRANSPORTER_DRIVER_TRACKING:
                            return t('tracking');
                        case STACKS.DRIVER_KI_AWAZ_INFO:
                            return t('driverKiAwaz');
                        case STACKS.PROFILE:
                            return t('profile');
                        default:
                            return label;
                    }
                };

                return (
                    <View key={route.key} style={{ flex: 1, backgroundColor: colors.transparent, alignItems: 'center' }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            accessibilityRole="tab"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={() => handlePress(index, route)}
                            onLongPress={onLongPress}
                            style={{ alignItems: 'center' }}>
                            <Animated.View style={[
                                {
                                    height: responsiveHeight(7),
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 100,
                                    transform: [{ scale: animatedValues[index] }],
                                },
                            ]}>
                                <View style={{ height: responsiveFontSize(3.5), width: responsiveFontSize(3.5), alignItems: 'center', justifyContent: 'center' }}>
                                    {_tabIcon(label, isFocused)}
                                </View>
                                {isFocused && <Text numberOfLines={1} style={{ width: '100%', color: isFocused ? colors.white : colors.whiteOpacity(0.5), fontSize: responsiveFontSize(1.3), fontWeight: isFocused ? '600' : '400', textTransform: 'capitalize', marginTop: responsiveFontSize(.2), textAlign: 'center' }}>{getLabelText()}</Text>}
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
}

export default function RestrictedDriverBottom() {
    const homeRef = useRef<any>(null);
    
    useEffect(() => {
        SystemNavigationBar.setNavigationColor('translucent');
    }, []);

    return (
        <Tab.Navigator tabBar={props => <TabBarRestrictedDriver {...props} homeRef={homeRef} />} screenOptions={{ headerShown: false, animation: 'fade' }} >
            <Tab.Screen name={STACKS.HOME}>
                {() => <TransporterAddedDriverHome ref={homeRef} />}
            </Tab.Screen>
            <Tab.Screen name={STACKS.TRANSPORTER_DRIVER_TRACKING} component={TransporterDriverTrackingScreen} />
            <Tab.Screen name={STACKS.DRIVER_KI_AWAZ_INFO} component={DriverKiAwazInfo} />
            <Tab.Screen name={STACKS.PROFILE} component={Profile} />
        </Tab.Navigator>
    );
}
