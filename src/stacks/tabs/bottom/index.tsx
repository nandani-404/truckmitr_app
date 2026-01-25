import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColor } from '@truckmitr/hooks/colors';
import { useResponsiveScale } from '@truckmitr/hooks/reponsive';
import { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { STACKS } from '@truckmitr/stacks/stacks';
import { DriverList, HealthHygiene, Home, Job, Profile, Training, TransporterAppliedJob, TransporterVerificationScreen, ViewJobs, DLVerification, DriverKiAwazInfo } from '@truckmitr/layouts/index';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { TourGuideZone, useTourGuideController, Tooltip } from 'rn-tourguide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import Verification from '@truckmitr/src/app/layouts/main/verification/verification-screen';
import ProfileOverview from '@truckmitr/src/app/layouts/main/profile-overview';


const Tab = createBottomTabNavigator();

function TabBarTransporter({ state, descriptors, navigation }: { state: any, descriptors: any, navigation: any }) {
    const { t } = useTranslation();
    const colors = useColor();
    const safeArea = useSafeAreaInsets();
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale();
    const { user, isDriver, isTransporter, dashboard, profileCompletion, subscriptionDetails, subscriptionModal, rank, star_rating } = useSelector((state: any) => { return state?.user })
    const dispatch = useDispatch()

    const animatedValues = useRef(state.routes.map(() => new Animated.Value(1))).current;

    const _tabIcon = (screen: string, isFocused: boolean) => {
        const homeProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const trainingProps = { height: 27, width: 27, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const jobProps = { height: 22, width: 22, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const healthProps = { height: 24, width: 24, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const profileProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        switch (screen) {
            case STACKS.HOME:
                return <Image style={homeProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png' }} />
            case STACKS.TRANSPORTER_APPLIED_JOB:
                return <Image style={trainingProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11179/11179793.png' }} />
            case STACKS.VIEW_JOBS:
                return <Image style={jobProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4121/4121106.png' }} />
            case STACKS.DRIVER_LIST:
                return <Image style={healthProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/18571/18571937.png' }} />
            case STACKS.TRANSPORTER_VERIFICATION:
                return <Image style={healthProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11831/11831511.png' }} />
            case STACKS.PROFILE:
                return <Image style={profileProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/266/266033.png' }} />
            case STACKS.DRIVER_KI_AWAZ_INFO:
                return <Image style={{ height: 40, width: 40 }} source={require('@truckmitr/assets/logo/speaker.png')} />
            default:
                return null;
        }
    };

    const isSubscriptionActive = (item: any) => {
        if (!item) return false;
        if (!item.end_at) return false;
        const endDate = new Date(item.end_at * 1000);
        const now = new Date();
        return endDate > now;
    };

    const handlePress = (index: number, route: any) => {
        let hasPremium = false;

        const checkAmt = (details: any) => {
            if (isSubscriptionActive(details)) {
                const amt = details.amount ? parseFloat(details.amount) : 0;
                const floorAmt = Math.floor(amt);
                if ([499, 99, 100, 1].includes(floorAmt)) {
                    return true;
                }
            }
            return false;
        }

        if (Array.isArray(subscriptionDetails)) {
            hasPremium = subscriptionDetails.some(checkAmt);
        } else if (subscriptionDetails && typeof subscriptionDetails === 'object') {
            hasPremium = checkAmt(subscriptionDetails);
        }

        if (subscriptionDetails?.showSubscriptionModel && index === 1 && !hasPremium) {
            !subscriptionModal && dispatch(subscriptionModalAction(true))
            return

        }


        // Trigger the zoom animation
        Animated.sequence([
            Animated.timing(animatedValues[index], {
                toValue: 1.1, // Zoom in
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
                toValue: 1, // Zoom out
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

    // Use Hooks to control!
    const {
        canStart, // a boolean indicate if you can start tour guide
        start, // a function to start the tourguide
        stop, // a function  to stopping it
        eventEmitter, // an object for listening some events
    } = useTourGuideController() as any

    const _start = async () => {
        const value = await AsyncStorage.getItem(`@stop_tour_guide_transporter`);
        if (value !== 'STOP_TRANSPORTER') {
            // start() // Disabled tour guide
        }
    }

    // Can start at mount 🎉
    // you need to wait until everything is registered 😁
    useEffect(() => {
        if (canStart) {
            // 👈 test if you can start otherwise nothing will happen
            _start()
        }
    }, [canStart]) // 👈 don't miss it!

    const handleOnStart = () => console.log('start')
    const handleOnStop = async () => {
        console.log('stop')
        try {
            await AsyncStorage.setItem(`@stop_tour_guide_transporter`, 'STOP_TRANSPORTER');
        } catch (error) {
            console.error('Failed to cache language', error);
        }
    }
    const handleOnStepChange = () => console.log(`stepChange`)

    useEffect(() => {
        eventEmitter.on('start', handleOnStart)
        eventEmitter.on('stop', handleOnStop)
        eventEmitter.on('stepChange', handleOnStepChange)

        return () => {
            eventEmitter.off('start', handleOnStart)
            eventEmitter.off('stop', handleOnStop)
            eventEmitter.off('stepChange', handleOnStepChange)
        }
    }, [])

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
                        case STACKS.TRANSPORTER_APPLIED_JOB:
                            return t('viewApplications');
                        case STACKS.DRIVER_KI_AWAZ_INFO:
                            return t('driverKiAwaz');
                        case STACKS.VIEW_JOBS:
                            return t('jobs');
                        case STACKS.DRIVER_LIST:
                            return t('drivers');
                        case STACKS.PROFILE:
                            return t('profile');
                        default:
                            return label;
                    }
                };
                const tourTitle = [
                    { title: t(`youCanFindAndHireVerifiedAndSkilledDriversThroughTheTruckMitrApp`) },
                    { title: t(`hereYouCanSeeTheListOfDriversWhoHaveAppliedForTheJobs`) },
                    { title: t(`hereYouCanWatchCommunityPostsAndUpdates`) },
                    { title: t(`hereYouCanPostDriverJobs`) },
                    { title: t(`hereYouCanUpdateYourProfile`) },
                ];

                return (
                    <View key={route.key} style={{ flex: 1, backgroundColor: colors.transparent, alignItems: 'center' }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            accessibilityRole="tab"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={() => handlePress(index, route)} // Use the new press handler
                            onLongPress={onLongPress}
                            style={{ alignItems: 'center' }}>
                            {
                                // <TourGuideZone
                                //     zone={index + 7}
                                //     text={tourTitle[index]?.title}
                                //     shape='circle'
                                //     tooltipBottomOffset={50}>
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
                                // </TourGuideZone>
                            }
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
}

function TabBarDriver({ state, descriptors, navigation, homeRef }: { state: any, descriptors: any, navigation: any, homeRef: any }) {
    const { t } = useTranslation();
    const colors = useColor();
    const safeArea = useSafeAreaInsets();
    const { responsiveFontSize, responsiveHeight } = useResponsiveScale();

    const animatedValues = useRef(state.routes.map(() => new Animated.Value(1))).current;

    const _tabIcon = (screen: string, isFocused: boolean) => {
        const homeProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const trainingProps = { height: 22, width: 22, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const jobProps = { height: 22, width: 22, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const healthProps = { height: 26, width: 26, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const profileProps = { height: 20, width: 20, tintColor: isFocused ? colors.white : colors.whiteOpacity(0.5) };
        const driverKiAwazProps = { height: 40, width: 40 };
        switch (screen) {
            case STACKS.HOME:
                return <Image style={homeProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png' }} />
            case STACKS.JOB:
                return <Image style={jobProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4121/4121106.png' }} />
            case STACKS.DRIVER_KI_AWAZ_INFO:
                return <Image style={driverKiAwazProps} source={require('@truckmitr/assets/logo/speaker.png')} />
            case STACKS.DL_VERIFICATION:
                return <Image style={healthProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11831/11831511.png' }} />
            case STACKS.VERIFICATION:
                return <Image style={healthProps} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11831/11831511.png' }} />
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
                toValue: 1.1, // Zoom in
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
                toValue: 1, // Zoom out
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
            navigation.navigate(route.name, route.params !== STACKS.TRAINING ? undefined : route.params);
        }
    };

    // Use Hooks to control!
    const {
        canStart, // a boolean indicate if you can start tour guide
        start, // a function to start the tourguide
        stop, // a function  to stopping it
        eventEmitter, // an object for listening some events
    } = useTourGuideController() as any

    // Can start at mount 🎉
    // you need to wait until everything is registered 😁
    const _start = async () => {
        const value = await AsyncStorage.getItem(`@stop_tour_guide`);
        if (value !== 'STOP') {
            // start() // Disabled tour guide
        }
    }
    useEffect(() => {
        if (canStart) {
            // 👈 test if you can start otherwise nothing will happen
            _start()
        }
    }, [canStart]) // 👈 don't miss it!

    const handleOnStart = () => console.log('start')
    const handleOnStop = async () => {
        console.log('stop')
        try {
            await AsyncStorage.setItem(`@stop_tour_guide`, 'STOP');
        } catch (error) {
            console.error('Failed to cache language', error);
        }
    }
    const hasHandledStepFive = useRef(false); // 👈 Lock to avoid repeated triggering

    const handleOnStepChange = async (step: any) => {
        if (
            step &&
            step.order === 5 &&
            homeRef.current &&
            homeRef.current.scrollToTop &&
            !hasHandledStepFive.current // ✅ Only once
        ) {
            hasHandledStepFive.current = true; // 🔒 lock
            stop(); // stop current tour
            await homeRef.current.scrollToTop();
            if (canStart) {
                // start(5); // Disabled restart tour
            }
        }
    };

    useEffect(() => {
        eventEmitter.on('start', handleOnStart)
        eventEmitter.on('stop', handleOnStop)
        eventEmitter.on('stepChange', handleOnStepChange)

        return () => {
            eventEmitter.off('start', handleOnStart)
            eventEmitter.off('stop', handleOnStop)
            eventEmitter.off('stepChange', handleOnStepChange)
        }
    }, [stop])
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
                        case STACKS.JOB:
                            return t('job');
                        case STACKS.DRIVER_KI_AWAZ_INFO:
                            return t('driverKiAwaz');
                        case STACKS.DL_VERIFICATION:
                            return t('idCheck');
                        case STACKS.PROFILE:
                            return t('profile');
                        default:
                            return label;
                    }
                };

                const tourTitle = [
                    { title: t(`getExclusiveVideoTrainingAnswerQuizzesToGetRatingsAndReviews`) },
                    { title: t(`hereYouCanWatchAllTheTrainingVideosAndAnswerTheQuiz`) },
                    { title: t(`hereYouCanSeeAllTheJobsAndApply`) },
                    { title: t(`hereYouCanWatchTrainingVideosRelatedToHealthAndHygiene`) },
                    { title: t(`hereYouCanUpdateYourProfile`) },
                ];

                return (
                    <View key={route.key} style={{ flex: 1, backgroundColor: colors.transparent, alignItems: 'center' }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            accessibilityRole="tab"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={() => handlePress(index, route)} // Use the new press handler
                            onLongPress={onLongPress}
                            style={{ alignItems: 'center' }}>

                            {
                                // <TourGuideZone
                                // zone={index + 8}
                                // text={tourTitle[index]?.title}
                                // shape='circle'
                                // tooltipBottomOffset={50}>
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
                                // </TourGuideZone>
                            }
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
}

export default function Bottom() {
    const homeRef = useRef<any>(null);
    const { isTransporter } = useSelector((state: any) => { return state?.user })
    useEffect(() => {
        SystemNavigationBar.setNavigationColor('translucent');
    }, []);

    return (
        <>
            {isTransporter ? <Tab.Navigator tabBar={props => <TabBarTransporter {...props} />} screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Tab.Screen name={STACKS.HOME} component={Home} />
                <Tab.Screen name={STACKS.TRANSPORTER_APPLIED_JOB} component={TransporterAppliedJob} />
                <Tab.Screen name={STACKS.DRIVER_KI_AWAZ_INFO} component={DriverKiAwazInfo} />
                <Tab.Screen name={STACKS.VIEW_JOBS} component={ViewJobs} />
                {/* <Tab.Screen name={STACKS.DRIVER_LIST} component={DriverList} /> */}
                {/* <Tab.Screen name={STACKS.TRANSPORTER_VERIFICATION} component={TransporterVerificationScreen} /> */}
                <Tab.Screen name={STACKS.PROFILE} component={Profile} />
            </Tab.Navigator> :
                <Tab.Navigator tabBar={props => <TabBarDriver {...props} homeRef={homeRef} />} screenOptions={{ headerShown: false, animation: 'fade' }} >
                    <Tab.Screen name={STACKS.HOME}>
                        {() => <Home ref={homeRef} />}
                    </Tab.Screen>
                    <Tab.Screen name={STACKS.JOB} component={Job} />
                    <Tab.Screen name={STACKS.DRIVER_KI_AWAZ_INFO} component={DriverKiAwazInfo} />
                    <Tab.Screen name={STACKS.DL_VERIFICATION} component={DLVerification} />
                    {/* <Tab.Screen name={STACKS.VERIFICATION} component={Verification} /> */}
                    <Tab.Screen name={STACKS.PROFILE} component={Profile} />
                </Tab.Navigator>}
        </>
    );
}
