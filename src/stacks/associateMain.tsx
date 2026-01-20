import React, { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import AssociateBottom from './tabs/associate-bottom';
import { Settings, Notification, ContactUs, Privacy, LanguageMain, PreferredColor } from '@truckmitr/layouts/index';
import { setupFirebaseNotifications, initializeNotificationChannel } from '@truckmitr/src/utils/notification';
import { useSelector } from 'react-redux';

const Stack = createNativeStackNavigator();

export default function AssociateMain() {
    const hasSetupNotifications = React.useRef(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const { user, isAuthenticated } = useSelector((state: any) => state.user);

    console.log('🔧 AssociateMain - user:', user?.name);

    // Mark component as mounted after a delay
    useEffect(() => {
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
        }, 1000);

        return () => clearTimeout(mountTimer);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        if (hasSetupNotifications.current) return;

        const initializeNotifications = async () => {
            try {
                console.log('🔧 AssociateMain: Initializing notifications...');
                await initializeNotificationChannel();
                await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
                const token = await setupFirebaseNotifications();
                if (token) {
                    console.log('🔧 AssociateMain: Notifications initialized');
                    hasSetupNotifications.current = true;
                }
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        const timeoutId = setTimeout(() => {
            initializeNotifications();
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [isMounted]);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Associate Bottom Tabs */}
            <Stack.Screen name={STACKS.ASSOCIATE_BOTTOM_TAB} component={AssociateBottom} options={{}} />

            {/* Shared Screens */}
            <Stack.Screen name={STACKS.SETTINGS} component={Settings} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.NOTIFICATION} component={Notification} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.CONTACT_US} component={ContactUs} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PRIVACY} component={Privacy} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.LANGUAGE_MAIN} component={LanguageMain} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PREFERRED_COLOR} component={PreferredColor} options={{ animation: 'fade' }} />

            {/* TODO: Add Associate-specific screens here when created */}
            {/* <Stack.Screen name={STACKS.ASSOCIATE_REFERRALS_DETAIL} component={ReferralsDetail} /> */}
            {/* <Stack.Screen name={STACKS.ASSOCIATE_EARNINGS_DETAIL} component={EarningsDetail} /> */}
        </Stack.Navigator>
    )
}
