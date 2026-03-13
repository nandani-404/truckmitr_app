import messaging, {
    FirebaseMessagingTypes,
    AuthorizationStatus,
} from '@react-native-firebase/messaging';
import {
    checkNotifications,
    requestNotifications,
    RESULTS,
} from 'react-native-permissions';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Linking, Platform } from 'react-native';
import { navigationRef } from '../global/global.ref';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { isNavigationReady } from '@truckmitr/src/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { resolveTargetScreen } from '../navigation/resolver';
import store from '@truckmitr/redux/store';

const CHANNEL_ID = 'truckMitr_channel';
const CHANNEL_NAME = 'TruckMitr Notifications';
const SOUND_NAME = 'truck_sound';

let notificationShown = false;
let notificationNavigationHandled = false;
let pendingNotificationData: NotificationData | null = null;
const PENDING_NOTIFICATION_KEY = 'PENDING_NOTIFICATION_NAV';

type NotificationData = {
    screen?: string;
    job_id?: string;
    room_id?: string;
};

type StackRoute =
    | typeof STACKS.HOME
    | typeof STACKS.PROFILE_EDIT
    | typeof STACKS.JOB;

// ============================================
// DEEP LINKING APPROACH - Convert screen name to deep link URL
// ============================================
const getDeepLinkFromScreen = (screen?: string): string => {
    switch (screen) {
        case 'profileEdit':
            return 'truckmitr://profile';
        case 'jobs':
            return 'truckmitr://job';
        case 'home':
            return 'truckmitr://home';
        case 'training':
            return 'truckmitr://training';
        default:
            return 'truckmitr://home';
    }
};

// Navigate using deep link - React Navigation handles the rest
const navigateWithDeepLink = (data?: NotificationData) => {
    if (!data?.screen) {
        console.log('🔕 No screen in notification data');
        return;
    }

    // Get current user data from Redux for validation
    const state = store.getState();
    const { user } = state.user;
    const { selectedModule } = state.app;
    
    const userRole = user?.role || user?.data?.role || 'driver';
    
    // Resolve screen name with role validation
    const targetScreen = resolveTargetScreen(data.screen, userRole, selectedModule);
    
    const deepLink = `truckmitr://${targetScreen}`;
    console.log('🔗 Navigating with validated deep link:', deepLink);

    // Use Linking to trigger deep link - React Navigation's linking config will handle it
    Linking.openURL(deepLink).catch(err => {
        console.error('❌ Error opening deep link:', err);
    });
};

export const setupFirebaseNotifications = async () => {
    console.log('--- Setting up Firebase Notifications ---');

    // Create notification channel FIRST - this is critical for kill mode
    await createNotifeeChannel();

    // Request Android notification permission WITHOUT setTimeout to prevent app restart issues
    if (Platform.OS === 'android') {
        try {
            const { status } = await checkNotifications();
            console.log('Android Notification Permission Status (checkNotifications):', status);
            if (status !== RESULTS.GRANTED) {
                console.log('Android: Requesting POST_NOTIFICATIONS permission...');
                const requestStatus = await requestNotifications(['alert', 'sound']);
                console.log('Android POST_NOTIFICATIONS Permission Request Result:', requestStatus.status);
            }
        } catch (error) {
            console.error('Error requesting Android notification permission:', error);
        }
    }

    const currentStatus = await messaging().hasPermission();
    console.log('FCM current permission status:', currentStatus);

    let token: string | null = null;

    if (currentStatus === AuthorizationStatus.NOT_DETERMINED) {
        console.log('FCM permission not determined, requesting...');
        token = await requestFCMUserPermission();
    } else {
        console.log('FCM permission already determined, getting token...');
        token = await getFCMToken();
    }

    attachNotificationListeners();
    console.log('--- Firebase Notifications setup complete ---');
    return token;
};

// export const handleNotificationNavigation = async (data?: NotificationData) => {
//     console.log('📍 handleNotificationNavigation called with:', data);

//     if (!data?.screen) {
//         console.log('🔕 No screen in notification data');
//         return;
//     }

//     // Navigation not ready → store
//     if (!isNavigationReady || !navigationRef.current) {
//         console.log('⏳ Navigation not ready → saving to AsyncStorage');
//         await AsyncStorage.setItem(
//             PENDING_NOTIFICATION_KEY,
//             JSON.stringify(data)
//         );
//         return;
//     }

//     console.log('✅ Navigating to:', data.screen);

//     switch (data.screen) {
//         case 'profileEdit':
//             navigationRef.current.navigate(STACKS.PROFILE_EDIT);
//             break;
//         case 'jobs':
//             navigationRef.current.navigate(STACKS.JOB);
//             break;
//         default:
//             navigationRef.current.navigate(STACKS.HOME);
//     }
// };

// export const handleNotificationNavigation = (data?: NotificationData) => {
//     console.log('📍 handleNotificationNavigation:', data);

//     if (!data?.screen) return;

//     switch (data.screen) {
//         case 'profileEdit':
//             navigationRef.current?.navigate(STACKS.PROFILE_EDIT);
//             break;

//         default:
//             navigationRef.current?.navigate(STACKS.HOME);
//     }
// };




// export const handleNotificationNavigation = async (data?: NotificationData) => {
//     if (!data?.screen || !navigationRef.current) return;

//     console.log('🔁 Notification navigation:', data.screen);

//     // 1️⃣ Always reset to Main initial screen
//     navigationRef.current.dispatch(
//         CommonActions.reset({
//             index: 0,
//             routes: [{ name: STACKS.BOTTOM_TAB }],
//         })
//     );

//     // 2️⃣ Navigate AFTER reset (small delay is important)
//     setTimeout(() => {
//         if (!navigationRef.current) return;

//         switch (data.screen) {
//             case 'profileEdit':
//                 navigationRef.current.navigate(STACKS.PROFILE_EDIT);
//                 break;

//             case 'jobs':
//                 navigationRef.current.navigate(STACKS.JOB);
//                 break;

//             default:
//                 // stay on home
//                 break;
//         }
//     }, 150);
// };

// ============================================
// OLD APPROACH - Using navigationRef (COMMENTED OUT)
// ============================================
// export const handleNotificationNavigation = async (data?: NotificationData) => {
//     if (!data?.screen || !navigationRef.current) return;

//     console.log('📍 Notification navigation:', data.screen);

//     switch (data.screen) {
//         case 'profileEdit':
//             navigationRef.current.navigate(STACKS.PROFILE_OVERVIEW as never);
//             break;
//         case 'jobs':
//             navigationRef.current.navigate(STACKS.JOB as never);
//             break;
//         default:
//             navigationRef.current.navigate(STACKS.HOME as never);
//     }

//     // ✅ IMPORTANT: clear immediately after use
//     await AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);
// };

// ============================================
// NEW APPROACH - Using Deep Linking
// ============================================
export const handleNotificationNavigation = async (data?: NotificationData) => {
    if (!data?.screen) {
        console.log('🔕 No screen in notification data');
        return;
    }

    console.log('📍 Notification navigation (validated):', data.screen);

    // Get current user data from Redux for validation
    const state = store.getState();
    const { user } = state.user;
    const { selectedModule } = state.app;
    
    const userRole = user?.role || user?.data?.role || 'driver';
    
    // Resolve screen name with role validation
    const targetScreen = resolveTargetScreen(data.screen, userRole, selectedModule);
    
    // Update data with resolved screen
    const validatedData = { ...data, screen: targetScreen };

    // Clear pending notification
    await AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);

    // Navigate using deep link
    navigateWithDeepLink(validatedData);
};

const requestFCMUserPermission = async () => {
    try {
        const status = await messaging().requestPermission({
            provisional: true,
            announcement: true,
        });
        console.log('FCM Permission Request Status:', status);
        if (
            status === AuthorizationStatus.AUTHORIZED ||
            status === AuthorizationStatus.PROVISIONAL
        ) {
            return getFCMToken();
        }
        console.warn('FCM: User denied notification permission.');
        return null;
    } catch (e) {
        console.error('Error requesting FCM permission:', e);
        return null;
    }
};

const getFCMToken = async () => {
    try {
        const token = await messaging().getToken();
        console.log('FCM Token retrieved:', token);
        return token;
    } catch (e) {
        console.error('Error getting FCM token:', e);
        return null;
    }
};

const createNotifeeChannel = async () => {
    try {
        await notifee.createChannel({
            id: CHANNEL_ID,
            name: CHANNEL_NAME,
            sound: SOUND_NAME,
            importance: AndroidImportance.HIGH,
            vibration: true,
        });
        console.log('Notifee channel created or updated successfully (ID:', CHANNEL_ID + ')');
    } catch (err) {
        console.error('Error creating notifee channel:', err);
    }
};

// Function to ensure channel is created immediately on app start
export const initializeNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        await createNotifeeChannel();
        console.log('Notification channel initialized for kill mode support');
    }
};

// Helper function to display notification with custom truck sound
export const displayNotificationWithTruckSound = async (title: string, body: string, data?: any) => {
    try {
        // Generate unique notification ID based on content to prevent duplicates
        const notificationId = generateNotificationId(title, body, data);
        await notifee.displayNotification({
            id: notificationId,
            title: title,
            body: body,
            data: data,
            android: {
                channelId: CHANNEL_ID,
                smallIcon: 'ic_notification',
                sound: SOUND_NAME,
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
                vibrationPattern: [300, 500],
                autoCancel: true,
            },
        });
        return true;
    } catch (error) {
        console.error('Error displaying notification with truck sound:', error);
        return false;
    }
};

// Generate unique ID for notification to prevent duplicates
const generateNotificationId = (title: string, body: string, data?: any): string => {
    const content = `${title}-${body}-${JSON.stringify(data || {})}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
};

const attachNotificationListeners = () => {
    console.log('Attaching notification listeners...');
    // Disable FCM's auto-initialization to prevent automatic notifications
    messaging().setAutoInitEnabled(false);

    messaging().onMessage(async (msg: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('--- Foreground message received (onMessage) ---');
        console.log(`fcm message-----`, msg);

        // If it's a video call, let the native side handle it exclusively
        if (msg.data?.type === 'VIDEO_CALL') {
            console.log('✅ Video call detected in foreground, letting native handle it...');
            return;
        }

        console.log('Message:', JSON.stringify(msg, null, 2));

        // Prevent duplicate notifications
        if (notificationShown) {
            console.log('⚠️ Notification already shown, skipping UI duplicate...');
            return;
        }

        const title: any = msg.notification?.title || msg.data?.title || 'TruckMitr 🔔';
        const body: any = msg.notification?.body || msg.data?.body || 'You have a new message';

        try {
            // Set flag to prevent duplicates
            notificationShown = true;
            await displayNotificationWithTruckSound(title, body, msg.data);
            // Reset flag after a short delay to allow new notifications
            setTimeout(() => {
                notificationShown = false;
            }, 2000);

        } catch (displayError) {
            console.error('Error displaying Notifee foreground notification:', displayError);
            // Reset flag on error
            notificationShown = false;
        }
        console.log('------------------------------------------------');
    });

    // BACKGROUND STATE: Now handled by linking.subscribe() in routes/index.tsx
    // AND by the global handler in index.js for logging/kill support.
    messaging().onNotificationOpenedApp(async msg => {
        console.log('🟡 BG notification tap:', msg?.data);
        console.log('🟡 Background: Navigation will be handled by linking.subscribe()');
    });

    // KILL STATE: Handled by linking.getInitialURL() in routes/index.tsx
    // DO NOT call getInitialNotification() here - it can only be consumed once!
    // If we consume it here, linking.getInitialURL() won't get the notification data.

    // messaging()
    //     .getInitialNotification()
    //     .then(async msg => {
    //         if (msg?.data) {
    //             console.log('🚀 Kill mode notification received:', msg.data);

    //             await AsyncStorage.setItem(
    //                 'PENDING_NOTIFICATION_NAV',
    //                 JSON.stringify(msg.data)
    //             );
    //         }
    //     });

    // messaging()
    //     .getInitialNotification()
    //     .then(async msg => {
    //         if (msg?.data) {
    //             await AsyncStorage.setItem(
    //                 PENDING_NOTIFICATION_KEY,
    //                 JSON.stringify(msg.data)
    //             );
    //         }
    //     });


    notifee.onForegroundEvent(({ type, detail }) => {
        console.log('🔔 Notifee FOREGROUND event:', type);

        if (type === EventType.PRESS) {
            console.log('🟢 User tapped notification (FOREGROUND)');
            handleNotificationNavigation(detail?.notification?.data);
        }
    });

    // notifee.onBackgroundEvent(async ({ type, detail }) => {
    //     console.log('🔔 Notifee BACKGROUND event:', type);

    //     if (type === EventType.PRESS) {
    //         console.log('🟢 User tapped notification (BACKGROUND / KILL)');
    //         handleNotificationNavigation(detail?.notification?.data);
    //     }
    // });
};

// Add method to manually reset the notification flag if needed
export const resetNotificationFlag = () => {
    notificationShown = false;
    notificationNavigationHandled = false;
};

export const consumePendingNotificationNavigation = async () => {
    const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_KEY);

    if (!raw) return;

    const data: NotificationData = JSON.parse(raw);

    // ❌ do NOT keep it
    await AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);

    handleNotificationNavigation(data);
};


