import React, { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { STACKS } from '@truckmitr/stacks/stacks';
import ForemanBottom from './tabs/foreman-bottom';
import { Settings, Notification, ContactUs, Privacy, LanguageMain, PreferredColor, PaymentSuccess } from '@truckmitr/layouts/index';
import { setupFirebaseNotifications, initializeNotificationChannel } from '@truckmitr/src/utils/notification';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import * as TYPES from '@truckmitr/redux/actions/types';
import ForemanDashboard from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-dashboard';
import ForemanMyPilots from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-my-pilots';
import ForemanPendingProfiles from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-pending-profiles';
import ForemanPendingSubscription from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-pending-subscription';
import ForemanPendingTraining from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-pending-training';
import ForemanExpiringDocuments from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-expiring-documents';
import ForemanVerifiedDrivers from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-verified-drivers';
import ForemanTrustedDrivers from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-trusted-drivers';
import ForemanJobsList from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-jobs-list';
import ForemanDriverDetails from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-driver-details';
import ForemanApplications from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-applications';
import ForemanRecruitments from '@truckmitr/src/app/layouts/foreman/foreman-home/foreman-recruitments';
import BankDetails from '@truckmitr/src/app/layouts/foreman/foreman-home/bank-detils';
import ProfileOverView from '@truckmitr/src/app/layouts/foreman/foreman-overView';
import ForemanProfileEdit from '@truckmitr/src/app/layouts/foreman/foreman-profile-edit';
import ForemanSearchScreen from '@truckmitr/src/app/layouts/foreman/foreman-home/search-screen';
import ForemanEarningsInfo from '@truckmitr/src/app/layouts/foreman/foreman-home/earninig';

const Stack = createNativeStackNavigator();

export default function ForemanMain() {
    const hasSetupNotifications = React.useRef(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const { user, isAuthenticated } = useSelector((state: any) => state.user);
    const dispatch = useDispatch();

    console.log('🔧 ForemanMain - user:', user?.name);

    // Mark component as mounted after a delay
    useEffect(() => {
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
        }, 1000);

        return () => clearTimeout(mountTimer);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Fetch fresh profile data when Foreman Main stack loads
        const fetchProfile = async () => {
            try {
                const response = await axiosInstance.get(END_POINTS.GET_PROFILE);
                if (response.data && response.data.data) {
                    console.log('🔧 ForemanMain: Profile fetched successfully', response.data.data);
                    dispatch({
                        type: TYPES.FETCH_USER,
                        payload: {
                            user: response.data.data,
                            // Add other necessary payload fields if available in response
                            profile_completion: response.data.profile_completion,
                        }
                    });
                }
            } catch (error) {
                console.error('🔧 ForemanMain: Error fetching profile:', error);
            }
        };

        fetchProfile();

        if (hasSetupNotifications.current) return;

        const initializeNotifications = async () => {
            try {
                console.log('🔧 ForemanMain: Initializing notifications...');
                await initializeNotificationChannel();
                await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
                const token = await setupFirebaseNotifications();
                if (token) {
                    console.log('🔧 ForemanMain: Notifications initialized');
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
    }, [isMounted, dispatch]);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Foreman Bottom Tabs */}
            <Stack.Screen name={STACKS.FOREMAN_BOTTOM_TAB} component={ForemanBottom} options={{}} />

            {/* Shared Screens */}
            <Stack.Screen name={STACKS.SETTINGS} component={Settings} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.NOTIFICATION} component={Notification} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.CONTACT_US} component={ContactUs} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PRIVACY} component={Privacy} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.LANGUAGE_MAIN} component={LanguageMain} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PREFERRED_COLOR} component={PreferredColor} options={{ animation: 'fade' }} />

            {/* Foreman-specific screens */}
            <Stack.Screen name={STACKS.FOREMAN_DASHBOARD} component={ForemanDashboard} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_MY_PILOTS} component={ForemanMyPilots} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_PENDING_PROFILES} component={ForemanPendingProfiles} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_PENDING_SUBSCRIPTION} component={ForemanPendingSubscription} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_PENDING_TRAINING} component={ForemanPendingTraining} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_EXPIRING_DOCUMENTS} component={ForemanExpiringDocuments} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_VERIFIED_DRIVERS} component={ForemanVerifiedDrivers} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_TRUSTED_DRIVERS} component={ForemanTrustedDrivers} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_JOBS_LIST} component={ForemanJobsList} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_DRIVER_DETAILS} component={ForemanDriverDetails} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_APPLICATIONS} component={ForemanApplications} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_RECRUITMENTS} component={ForemanRecruitments} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_BANK_DETAILS} component={BankDetails} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PROFILE_OVERVIEW} component={ProfileOverView} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_PROFILE_EDIT} component={ForemanProfileEdit} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name={STACKS.FOREMAN_SEARCH} component={ForemanSearchScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.FOREMAN_EARNINGS_INFO} component={ForemanEarningsInfo} options={{ animation: 'fade' }} />
            <Stack.Screen name={STACKS.PAYMENT_SUCCESS} component={PaymentSuccess} options={{ animation: 'fade_from_bottom' }} />
        </Stack.Navigator>
    )
}
