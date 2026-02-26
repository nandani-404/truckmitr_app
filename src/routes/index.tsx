import { StatusBar, useColorScheme, View, Image, AppState, Linking, TouchableOpacity, Text, NativeModules } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { darkTheme, lightTheme } from '@truckmitr/res/colors';
import { Auth, Main, TruckerMain, ForemanMain, AssociateMain, DhabhaMain, ProfileCompletionStack, ForemanProfileCompletionStack, AssociateProfileCompletionStack, DhabhaProfileCompletionStack, PunctureMain, ShipperMain, ShipperProfileCompletionStack } from '@truckmitr/stacks/index';
import AnimatedLayoutSwitcher from '../components/AnimatedLayoutSwitcher';
import { hydrateAppMode } from '../redux/slices/appModeSlice';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import BootSplash from 'react-native-bootsplash';
import { navigationRef } from '@truckmitr/utils/global/global.ref';
import { useDispatch, useSelector } from 'react-redux';
import { getUserData, deleteUserData } from '../utils/config/token';
import { validateToken } from '../utils/config/tokenValidator';
import { CommonActions } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import { onTokenExpired } from '../utils/config/authEvents';
import { END_POINTS, STATICS } from '../utils/config';
import {
  subscriptionDetailsAction,
  userAction,
  userAuthenticatedAction,
} from '../redux/actions/user.action';
import axiosInstance from '../utils/config/axiosInstance';
import { useResponsiveScale, useDriverLocationTracking } from '../app/hooks';
import Subscription from '../app/layouts/main/subscription';
import InAppUpdatePopup from '../utils/update';
import analytics from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import { consumePendingNotificationNavigation, resetNotificationFlag } from '../utils/notification';
import messaging from '@react-native-firebase/messaging';
import * as TYPES from '@truckmitr/redux/actions/types';
import PunctureProfileCompletionStack from '../stacks/punctureProfileCompletion';
import { agoraService } from '../services/agora';
// import { ZegoCallInvitationDialog } from '@zegocloud/zego-uikit-prebuilt-call-rn';

export let isNavigationReady = false;

export const setNavigationReady = (ready: boolean) => {
  isNavigationReady = ready;
};


export default function Routes() {
  // Start Global Location Tracking
  useDriverLocationTracking();

  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const { responsiveWidth, responsiveHeight } = useResponsiveScale();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { isAuthenticated, subscriptionModal, user, profileRequiredFieldsStatus } = useSelector((state: any) => state?.user);
  const { selectedModule } = useSelector((state: any) => state?.app);
  const [isAppReady, setIsAppReady] = useState(false);

  // App Mode (Trucker Mode switching) - via Redux
  const { mode: appMode, isHydrated: isAppModeHydrated } = useSelector((state: any) => state.appMode);

  useEffect(() => {
    dispatch(hydrateAppMode() as any);
  }, []);

  console.log('🛡️ AUTH GATE STATUS:', {
    isAuthenticated,
    profileRequiredFieldsStatus,
    hasUser: !!user,
    userRole: user?.role || user?.data?.role
  });
  const [isInitializing, setIsInitializing] = useState(true);

  const routeNameRef = useRef<string | undefined>(undefined);
  const userIdRef = useRef<string | undefined>(undefined);
  const appState = useRef(AppState.currentState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitialized = useRef(false);
  const hasInitializedAgora = useRef(false);
  const lastBackgroundTime = useRef<number>(0);
  const pendingDeepLink = useRef<string | null>(null); // Store pending deep link
  const isProfileCompleted = Boolean(
    user?.data?.profile_completed
  );

  console.log('--------------------------user data------------------', user);
  console.log('--------------------------is profile completed------------------', isProfileCompleted);

  // -------------------------------
  // 🔹 Logout and Redirect to Login
  // -------------------------------
  const logoutUser = async () => {
    console.log('🚪 Logging out user - token expired or invalid. Stack:', new Error().stack);

    // Clear token from storage
    await deleteUserData();

    // Clear session flag
    await AsyncStorage.removeItem('app_session_active');

    // Update Redux state
    dispatch(userAuthenticatedAction(false));

    // Reset navigation to login screen
    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: STACKS.LOGIN }],
        })
      );
    }
  };

  // -------------------------------
  // 🔹 Get Logged-in User ID
  // -------------------------------
  const getLoggedInUserId = () => {
    return userIdRef.current || user?.data?.id?.toString() || user?.id?.toString() || 'UNKNOWN';
  };

  // -------------------------------
  // 🔹 Log User Event to Backend
  // -------------------------------
  const logUserEventBackend = async (screenName: string) => {
    try {
      const token = await getUserData();
      console.log('🔑 EVENT LOG TOKEN:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token,
        screenName
      });
      if (!token) {
        console.log("⚠️ No token found, skipping event log for:", screenName);
        return;
      }

      const payload = {
        event_type: screenName,
        description: `${screenName} from mobile app`,
      };

      const response = await axiosInstance.post(END_POINTS.LOG_USER_EVENT, payload);

      console.log("✅ logUserEvent saved:", payload, "Response:", response.data);
    } catch (err: any) {
      console.error("❌ logUserEvent error for", screenName, ":", err.response?.data || err.message || err);
    }
  };

  // -------------------------------
  // 🔹 Refresh User Data
  // -------------------------------
  const refreshUserData = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);

      // Don't validate token on every refresh - just try to fetch data
      // If token is invalid, the API will return 401/403
      const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE, {
        headers: {
          'X-Skip-Global-Logout': 'true' // Prevent auto-logout during refresh
        }
      });

      if (profile?.data?.status && profile?.status === 200) {
        // Don't overwrite user data during refresh to preserve local edits
        // Only update if this is initial load or explicit refresh
        console.log('Profile refreshed successfully');
        dispatch(userAction(profile?.data));
        userIdRef.current = profile?.data?.data?.id?.toString();

        const sub: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS, {
          headers: {
            'X-Skip-Global-Logout': 'true'
          }
        });
        // Always dispatch subscription data - even empty array to clear stale data
        const subData = sub?.data?.data || [];
        dispatch(subscriptionDetailsAction(subData));
      } else if (profile?.status === 401 || profile?.status === 403) {
        // Only logout on explicit auth failure, not on network errors
        console.log('Auth failed during refresh - logging out');
        await logoutUser();
      }
      // For other errors (network, timeout), just log and continue - don't logout
    } catch (error: any) {
      console.error("Refresh user data error:", error);
      // Only logout if it's an authentication error, not a network/timeout error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('Auth error during refresh - logging out');
        await logoutUser();
      } else {
        console.log('Network error during refresh - keeping user logged in');
        // Network error or timeout - don't logout, user can retry
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // -------------------------------
  // 🔹 Listen for Token Expiration Events
  // -------------------------------
  useEffect(() => {
    const handleTokenExpired = async () => {
      console.log('🔴 Token expired event received - logging out');
      await logoutUser();
    };

    // Listen for token expiration events from axios interceptor
    const subscription = onTokenExpired(handleTokenExpired);

    return () => {
      subscription.remove();
    };
  }, []);

  // -------------------------------
  // 🔹 Handle App State Changes
  // -------------------------------
  useEffect(() => {
    const currentRole = String(user?.role || user?.data?.role || '').toLowerCase();
    const isDriver = currentRole === 'driver';
    const agoraUserId = String(user?.unique_id || user?.id || user?.data?.id || '');
    const agoraUserName = String(user?.name || user?.data?.name || 'Driver');

    console.log('[Agora][Gate] Auth/role check at root.', {
      isAuthenticated,
      currentRole,
      isDriver,
      hasInitializedAgoraRef: hasInitializedAgora.current,
      serviceInitialized: agoraService.isInitialized(),
      agoraUserId,
      hasAgoraAppId: Boolean(STATICS.AGORA_APP_ID?.trim()),
    });

    if (isAuthenticated && isDriver) {
      if (hasInitializedAgora.current && agoraService.isInitialized()) {
        console.log('[Agora][Gate] Skip initialize: already initialized for current session.');
        return;
      }

      console.log('[Agora][Gate] Starting Agora initialization from root effect...');
      const initialized = agoraService.initialize({
        appId: STATICS.AGORA_APP_ID,
        userId: agoraUserId,
        userName: agoraUserName,
      });

      hasInitializedAgora.current = initialized;
      console.log('[Agora][Gate] Root init result:', initialized);
      return;
    }

    if (hasInitializedAgora.current || agoraService.isInitialized()) {
      console.log('[Agora][Gate] Conditions not met. Destroying Agora engine if active...');
      agoraService.destroy();
      hasInitializedAgora.current = false;
    } else {
      console.log('[Agora][Gate] Conditions not met and no active Agora engine.');
    }
  }, [
    isAuthenticated,
    user?.role,
    user?.data?.role,
    user?.id,
    user?.data?.id,
    user?.unique_id,
    user?.name,
    user?.data?.name
  ]);

  useEffect(() => {
    return () => {
      console.log('[Agora][Gate] Routes unmount cleanup triggered.');
      if (agoraService.isInitialized()) {
        agoraService.destroy();
      }
      hasInitializedAgora.current = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Track when app goes to background
      if (nextAppState.match(/inactive|background/)) {
        lastBackgroundTime.current = Date.now();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isAuthenticated
      ) {
        // Calculate how long the app was in background
        const timeInBackground = Date.now() - lastBackgroundTime.current;

        // Only refresh if app was in background for more than 5 seconds
        // This prevents refresh when returning from image picker or other quick actions
        if (timeInBackground > 5000) {
          console.log('App has come to the foreground - refreshing user data');
          // Use setTimeout to avoid blocking the UI
          setTimeout(() => {
            refreshUserData();
          }, 500);
        } else {
          console.log('App returned quickly, skipping refresh to preserve local changes');
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // -------------------------------
  // 🔹 Load Module Selection from Storage
  // -------------------------------
  useEffect(() => {
    const loadModule = async () => {
      try {
        const storedModule = await AsyncStorage.getItem('SELECTED_MODULE');
        if (storedModule) {
          dispatch({ type: TYPES.SET_MODULE, payload: storedModule });
          console.log('📦 Module loaded from storage:', storedModule);
        }
      } catch (error) {
        console.error('❌ Error loading module:', error);
      }
    };
    loadModule();
  }, []);

  // -------------------------------
  // 🔹 Check incomplete signup
  // -------------------------------
  useEffect(() => {
    const checkIncompleteSignup = async () => {
      const raw = await AsyncStorage.getItem('signup_incomplete');
      if (raw) {
        const data = JSON.parse(raw);
        const timeElapsed = Date.now() - data.timestamp;
        if (timeElapsed > 2 * 60 * 1000) {
          await analytics().logEvent('signup_incomplete', data);
          AppEventsLogger.logEvent('signup_incomplete', data);
          await AsyncStorage.removeItem('signup_incomplete');
        }
      }
    };
    checkIncompleteSignup();
  }, []);

  // -------------------------------
  // 🔹 Load User + Profile + Subscription
  // -------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we're in the middle of a session (prevents re-init on activity restart)
        const sessionActive = await AsyncStorage.getItem('app_session_active');

        if (hasInitialized.current && sessionActive === 'true') {
          console.log('App already initialized and session active, skipping re-init');
          // Just hide splash and mark as ready
          await BootSplash.hide({ fade: true });
          setIsAppReady(true);
          setIsInitializing(false);
          return;
        }

        setIsInitializing(true);
        const token = await getUserData();
        console.log('🔑 TOKEN STATUS:', {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenPreview: token
        });
        if (token) {
          // Validate token before setting authenticated
          const isTokenValid = await validateToken();

          if (!isTokenValid) {
            console.log('Stored token is invalid - user needs to login again');
            await deleteUserData();
            await AsyncStorage.removeItem('app_session_active');
            dispatch(userAuthenticatedAction(false));
          } else {
            const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE, {
              headers: {
                'X-Skip-Global-Logout': 'true' // Prevent auto-logout during init
              }
            });
            if (profile?.data?.status) {
              dispatch(userAction(profile?.data));
              userIdRef.current = profile?.data?.data?.id?.toString();

              // Determine and set module from user's role
              // This ensures correct navigation for returning users
              const userRole = profile?.data?.user?.role;
              // console.log('USER ROLE:', profile);

              let moduleFromRole = 'hiring'; // default for driver/transporter
              if (userRole === 'foreman') {
                moduleFromRole = 'foreman';
              } else if (userRole === 'associate' || userRole === 'association') {
                moduleFromRole = 'association';
              } else if (userRole === 'puncture') {
                moduleFromRole = 'puncture_shop';
              } else if (userRole === 'shipper') {
                moduleFromRole = 'shipper';
              }
              // Update both AsyncStorage and Redux
              await AsyncStorage.setItem('SELECTED_MODULE', moduleFromRole);
              dispatch({ type: TYPES.SET_MODULE, payload: moduleFromRole });
              console.log('📦 Module set from user role:', moduleFromRole);

              const sub: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS, {
                headers: {
                  'X-Skip-Global-Logout': 'true'
                }
              });
              // Always dispatch subscription data - even empty array to clear stale data
              const subData = sub?.data?.data || [];
              dispatch(subscriptionDetailsAction(subData));

              // Mark session as active
              await AsyncStorage.setItem('app_session_active', 'true');

              // Set authenticated AFTER module is set to prevent wrong stack flashing
              dispatch(userAuthenticatedAction(true));
            } else if (profile?.status === 401 || profile?.status === 403) {
              // Token became invalid
              await deleteUserData();
              await AsyncStorage.removeItem('app_session_active');
              dispatch(userAuthenticatedAction(false));
            }
          }
        } else {
          // No token, clear session
          await AsyncStorage.removeItem('app_session_active');
        }
      } catch (error) {
        console.error("Init error:", error);
        // On init error, ensure we're not stuck in authenticated state with bad token
        const isTokenValid = await validateToken();
        if (!isTokenValid) {
          await deleteUserData();
          await AsyncStorage.removeItem('app_session_active');
          dispatch(userAuthenticatedAction(false));
        }

        // Fetch Popup Data (Pre-load for splash)
        try {
          const popupRes = await axiosInstance.get(END_POINTS.MOBILE_POPUP, {
            headers: { 'X-Skip-Global-Logout': 'true' }
          });
          if (popupRes?.data?.status && popupRes?.data?.data) {
            dispatch({ type: TYPES.SET_POPUP_DATA, payload: popupRes.data.data });
          }
        } catch (e) {
          console.log('Error fetching popup data during init:', e);
        }

      } finally {
        hasInitialized.current = true;
        setIsInitializing(false);
        setTimeout(async () => {
          await BootSplash.hide({ fade: true });
          setIsAppReady(true);
        }, 1200);
      }
    };
    init();
    SystemNavigationBar.setNavigationColor('translucent');
  }, []);

  const [navReady, setNavReady] = useState(false);

  // -------------------------------
  // 🔹 Handle Incoming Call Navigation (from Native Bridge)
  // -------------------------------
  useEffect(() => {
    if (isAuthenticated && navReady) {
      const checkCallData = async () => {
        try {
          const { IncomingCallModule } = NativeModules;
          if (!IncomingCallModule) return;

          const callData = await IncomingCallModule.getCallData();

          if (callData) {
            console.log('📞 Accepted Call Data found:', callData);
            // Navigate to IncomingCallScreen
            if (navigationRef.current) {
              (navigationRef.current as any)?.navigate(STACKS.INCOMING_CALL, callData);
            }
          }
        } catch (error) {
          console.error('❌ Error checking call data:', error);
        }
      };

      // Small delay to ensure the UI is rendered
      const timer = setTimeout(checkCallData, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navReady]);

  // -------------------------------
  // 🔹 Handle Pending Notification Navigation (after auth)
  // -------------------------------
  useEffect(() => {
    // Only run when user is authenticated and navigation is ready
    if (isAuthenticated && isNavigationReady) {
      // Small delay to ensure Main stack is fully mounted
      const timer = setTimeout(async () => {
        console.log('🔔 Checking for pending notification navigation...');

        // Check for kill state pending screen first
        const pendingScreen = await AsyncStorage.getItem('PENDING_NOTIFICATION_SCREEN');
        if (pendingScreen) {
          console.log('🔴 Kill state: Processing pending screen:', pendingScreen);
          await AsyncStorage.removeItem('PENDING_NOTIFICATION_SCREEN');

          // Navigate based on screen
          if (navigationRef.current) {
            switch (pendingScreen) {
              case 'profileEdit':
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'profile' });
                break;
              case 'jobs':
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'job' });
                break;
              case 'home':
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'home' });
                break;
              case 'training':
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'training' });
                break;
              default:
                console.log('🔴 Unknown pending screen:', pendingScreen);
            }
            console.log('🔴 Kill state: Navigation completed for screen:', pendingScreen);
          }
          return;
        }

        // Otherwise check for regular pending notification
        consumePendingNotificationNavigation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isNavigationReady]);

  // -------------------------------
  // 🔹 Process Pending Deep Link (after auth)
  // -------------------------------
  useEffect(() => {
    if (isAuthenticated && isNavigationReady && pendingDeepLink.current) {
      console.log('🌐 Processing pending deep link:', pendingDeepLink.current);
      const url = pendingDeepLink.current;
      pendingDeepLink.current = null; // Clear it

      // Small delay to ensure Main stack is mounted
      setTimeout(() => {
        // Parse and navigate
        const urlParts = url.replace('truckmitr://', '').split('/');
        const path = urlParts[0];

        switch (path) {
          case 'profile':
            (navigationRef.current as any)?.navigate('bottomTab', { screen: 'profile' });
            break;
          case 'job':
          case 'jobs':
            (navigationRef.current as any)?.navigate('bottomTab', { screen: 'job' });
            break;
          case 'home':
            (navigationRef.current as any)?.navigate('bottomTab', { screen: 'home' });
            break;
          case 'training':
            (navigationRef.current as any)?.navigate('bottomTab', { screen: 'training' });
            break;
          default:
            console.log('🔍 Pending deep link path not recognized:', path);
        }
      }, 500);
    }
  }, [isAuthenticated, isNavigationReady]);

  const parseDeepLink = (url: string) => {
    let raw = url;
    if (raw.startsWith('truckmitr://')) {
      raw = raw.replace('truckmitr://', '');
    } else if (raw.startsWith('https://truckmitr.com')) {
      raw = raw.replace('https://truckmitr.com', '');
      raw = raw.replace(/^\/+/, '');
    }

    const [path, query = ''] = raw.split('?');
    const reelIdMatch = query.split('&').find(p => p.startsWith('reelId='));
    const reelId = reelIdMatch ? decodeURIComponent(reelIdMatch.split('=')[1]) : undefined;
    return { path, reelId };
  };

  useEffect(() => {
    // Handle initial URL (when app is opened from closed state)
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🌐 Initial URL received:', initialUrl);
          console.log('🌐 App ready status:', isAppReady);
          console.log('🌐 Navigation ready status:', isNavigationReady);
          console.log('🌐 Is authenticated:', isAuthenticated);

          if (isAppReady && isNavigationReady && isAuthenticated) {
            // App is fully ready, process immediately
            handleDeepLink(initialUrl);
          } else {
            // App not ready yet, store for later
            console.log('🌐 App not ready, storing deep link for later processing');
            pendingDeepLink.current = initialUrl;
          }
        } else {
          console.log('🌐 No initial URL found');
        }
      } catch (error) {
        console.log('❌ Error getting initial URL:', error);
      }
    };

    // Handle URL when app is already running
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('🌐 Deep link received by Navigation:', url);
      console.log('🌐 Navigation ready status:', isNavigationReady);
      handleDeepLink(url);
    });



    // Function to handle deep link navigation
    const handleDeepLink = (url: string) => {
      console.log('🔍 Processing deep link:', url);
      console.log('🔍 Current navigation state:', navigationRef.current?.getRootState());

      const { path, reelId } = parseDeepLink(url);
      console.log('🔍 Deep link path:', path, 'reelId:', reelId);

      if (!navigationRef.current) {
        console.log('❌ Navigation ref not available');
        return;
      }

      if (!isAuthenticated) {
        console.log('❌ User not authenticated, cannot navigate');
        return;
      }

      // Handle different deep link paths
      switch (path) {
        case 'profile':
          (navigationRef.current as any)?.navigate('bottomTab', { screen: 'profile' });
          break;
        case 'job':
        case 'jobs':
          (navigationRef.current as any)?.navigate('bottomTab', { screen: 'job' });
          break;
        case 'home':
          (navigationRef.current as any)?.navigate('bottomTab', { screen: 'home' });
          break;
        case 'training':
          (navigationRef.current as any)?.navigate('bottomTab', { screen: 'training' });
          break;
        case 'driverKiAwazInfo':
        case 'driver-ki-awaz':
          (navigationRef.current as any)?.navigate('bottomTab', {
            screen: 'driverKiAwazInfo',
            params: reelId ? { reelId } : undefined,
          });
          break;
        default:
          console.log('🔍 Deep link path not recognized:', path);
      }
    };

    // Check for initial URL
    getInitialURL();

    return () => sub.remove();
  }, [isAuthenticated]);

  // Handle pending deep link when app becomes ready
  useEffect(() => {
    if (pendingDeepLink.current && isAppReady && isNavigationReady && isAuthenticated) {
      console.log('🌐 Processing pending deep link:', pendingDeepLink.current);

      const url = pendingDeepLink.current;
      pendingDeepLink.current = null; // Clear pending link

      // Add extra delay for kill state to ensure everything is fully loaded
      setTimeout(() => {
        const { path, reelId } = parseDeepLink(url);

        if (path === 'profile') {
          console.log('🎯 Processing pending profile navigation');

          const attemptNavigation = (attempt = 1) => {
            console.log(`🎯 Pending navigation attempt ${attempt}`);

            try {
              navigationRef.current?.navigate('bottomTab', {
                screen: 'profile'
              });
              console.log('✅ Pending navigation successful');
            } catch (error) {
              console.log(`❌ Pending navigation attempt ${attempt} failed:`, error);

              if (attempt < 5) {
                setTimeout(() => attemptNavigation(attempt + 1), 1000);
              }
            }
          };

          attemptNavigation();
        } else if (path === 'driverKiAwazInfo' || path === 'driver-ki-awaz') {
          console.log('🎯 Processing pending Driver Ki Awaz navigation');
          navigationRef.current?.navigate('bottomTab', {
            screen: 'driverKiAwazInfo',
            params: reelId ? { reelId } : undefined,
          });
        }
      }, 2000); // Extra delay for kill state
    }
  }, [isAppReady, isNavigationReady, isAuthenticated]);

  // Only show loading screen during initial app load, not during refresh
  if (!isAppReady && isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Image
          style={{ height: responsiveHeight(18), width: responsiveWidth(88), top: responsiveHeight(.4) }}
          source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
        />
      </View>
    );
  }

  const linking = {
    prefixes: ['truckmitr://', 'https://truckmitr.com'],

    // Custom getInitialURL to handle notification deep links in kill state
    async getInitialURL() {
      // First, check if app was opened from a notification (kill state)
      const initialNotification = await messaging().getInitialNotification();

      if (initialNotification?.data?.screen) {
        const screen = initialNotification.data.screen as string;
        console.log('🔴 Kill state: Got notification screen:', screen);

        // Store the screen for manual navigation after auth
        await AsyncStorage.setItem('PENDING_NOTIFICATION_SCREEN', screen);
        console.log('🔴 Kill state: Stored pending screen for manual navigation');

        // Return null - we'll handle navigation manually after Main stack mounts
        return null;
      }

      // Otherwise, check for regular deep link
      const url = await Linking.getInitialURL();
      console.log('🌐 Regular initial URL:', url);
      return url;
    },

    // Subscribe to incoming links (foreground/background)
    subscribe(listener: (url: string) => void) {
      // Listen for deep links
      const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        console.log('🌐 Deep link received:', url);
        listener(url);
      });

      // Listen for notification taps (background state)
      const unsubscribeNotification = messaging().onNotificationOpenedApp(msg => {
        if (msg?.data?.screen) {
          const screen = msg.data.screen as string;
          console.log('🟡 Background notification tap, screen:', screen);

          // Navigate directly using navigationRef instead of deep link
          // This avoids the "Main" screen not found issue
          setTimeout(() => {
            if (navigationRef.current) {
              switch (screen) {
                case 'profileEdit':
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'profile' });
                  break;
                case 'jobs':
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'job' });
                  break;
                case 'home':
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'home' });
                  break;
                case 'training':
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'training' });
                  break;
                default:
                  console.log('🟡 Unknown screen:', screen);
              }
              console.log('🟡 Background: Navigation completed for screen:', screen);
            } else {
              console.log('🟡 Background: navigationRef not ready');
            }
          }, 500);
        }
      });

      return () => {
        linkingSubscription.remove();
        unsubscribeNotification();
      };
    },

    config: {
      screens: {
        // Bottom Tab Navigator (direct, no Main wrapper)
        bottomTab: {
          screens: {
            // Driver tabs
            home: 'home',
            training: 'training',
            job: 'job',
            healthHygiene: 'health-hygiene',
            profile: 'profile',
            // Transporter tabs
            transporterAppliedJob: 'applied-jobs',
            viewJobs: 'view-jobs',
            driverList: 'drivers',
          },
        },
        // Main Stack Screens (outside bottom tabs)
        dashboard: 'dashboard',
        modules: 'modules',
        quiz: 'quiz',
        quizResult: 'quiz-result',
        player: 'player',
        availableJob: 'available-job',
        suitsJob: 'suits-job',
        appliedJob: 'applied-job',
        search: 'search',
        profileEdit: 'profile-edit',
        profileEditNew: 'profile-edit-new',
        drivingDetails: 'driving-details',
        uploadDocuments: 'upload-documents',
        settings: 'settings',
        notification: 'notification',
        rating: 'rating',
        contactUs: 'contact-us',
        privacy: 'privacy',
        addJob: 'add-job',
        jobStep2: 'job-step2',
        jobStep3: 'job-step3',
        addDriver: 'add-driver',
        excelImport: 'excel-import',
        // Auth screens
        login: 'login',
        // Profile completion
        profileCompletion: 'profile-completion',
      },
    },
  };



  // -------------------------------
  // 🔹 Navigation Tracking
  // -------------------------------
  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      theme={theme}
      onReady={async () => {
        setNavReady(true);
        setNavigationReady(true);
        console.log('🟢 NavigationContainer READY');
        // Note: Pending notification navigation is handled by useEffect when isAuthenticated becomes true
        console.log(
          '🟢 Initial route:',
          navigationRef.current?.getCurrentRoute()?.name
        );

        const initialScreen = navigationRef.current?.getCurrentRoute()?.name;
        routeNameRef.current = initialScreen;

        console.log(`🚀 App Ready → User ID: ${getLoggedInUserId()} | Screen: ${initialScreen}`);
        logUserEventBackend(initialScreen!); // log initial screen
      }}
      onStateChange={async () => {
        const currentScreen = navigationRef.current?.getCurrentRoute()?.name;
        if (routeNameRef.current !== currentScreen && currentScreen) {
          console.log(`➡️ User ID: ${getLoggedInUserId()} | Screen Opened: ${currentScreen}`);

          await analytics().logScreenView({
            screen_name: currentScreen,
            screen_class: currentScreen,
          });

          AppEventsLogger.logEvent("screen_view", { screen_name: currentScreen });
          await logUserEventBackend(currentScreen); // log every screen change

          routeNameRef.current = currentScreen;
          resetNotificationFlag();
        }
      }}
    >
      <StatusBar translucent backgroundColor="transparent" />
      {/* <ZegoCallInvitationDialog /> */}
      {/* <AssociateMain /> */}
      {/* <AssociateProfileCompletionStack /> */}
      {/* <DhabhaMain /> */}
      {/* <Auth /> */}
      {/* <DhabhaProfileCompletionStack /> */}
      {/* <PunctureProfileCompletionStack /> */}
      {/* <PunctureMain /> */}
      {/* <ShipperProfileCompletionStack /> */}
      {/* <ForemanMain /> */}
      {!isAuthenticated ? (
        <Auth />
      ) : profileRequiredFieldsStatus === false ? (
        // Module-specific profile completion
        user?.data?.role?.toLowerCase() === 'foreman' || user?.role?.toLowerCase() === 'foreman' ? (
          <ForemanProfileCompletionStack />
        ) : user?.data?.role?.toLowerCase() === 'dhaba' || user?.role?.toLowerCase() === 'dhaba' || selectedModule === 'dhaba' ? (
          <DhabhaProfileCompletionStack />
        ) : selectedModule === 'association' || user?.data?.role?.toLowerCase() === 'association' || user?.role?.toLowerCase() === 'association' ? (
          <AssociateProfileCompletionStack />
        ) : selectedModule === 'puncture_shop' || user?.data?.role?.toLowerCase() === 'puncture' || user?.role?.toLowerCase() === 'puncture' ? (
          <PunctureProfileCompletionStack />
        ) : selectedModule === 'shipper' || user?.data?.role?.toLowerCase() === 'shipper' || user?.role?.toLowerCase() === 'shipper' ? (
          <ShipperProfileCompletionStack />
        ) : (
          <ProfileCompletionStack />
        )
      ) : user?.data?.role?.toLowerCase() === 'foreman' || user?.role?.toLowerCase() === 'foreman' ? (
        <ForemanMain />
      ) : user?.data?.role?.toLowerCase() === 'dhaba' || user?.role?.toLowerCase() === 'dhaba' || selectedModule === 'dhaba' ? (
        <DhabhaMain />
      ) : selectedModule === 'association' || user?.data?.role?.toLowerCase() === 'association' || user?.role?.toLowerCase() === 'association' ? (
        <AssociateMain />
      ) : selectedModule === 'puncture_shop' || user?.data?.role?.toLowerCase() === 'puncture' || user?.role?.toLowerCase() === 'puncture' ? (
        <PunctureMain />
      ) : selectedModule === 'shipper' || user?.data?.role?.toLowerCase() === 'shipper' || user?.role?.toLowerCase() === 'shipper' ? (
        <ShipperMain />
      ) : appMode === 'trucker' ? (
        <TruckerMain />
      ) : (
        <Main />
      )}
      {subscriptionModal && <Subscription />}
      <InAppUpdatePopup />
    </NavigationContainer>
  );
}
