import { StatusBar, useColorScheme, View, Image, AppState, Linking, TouchableOpacity, Text, NativeModules, DeviceEventEmitter, Modal, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useRef, useState, createRef } from 'react';
import moment from 'moment';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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
import InterviewPopupModal, { InterviewData } from '../utils/interview-popup';
// import { ZegoCallInvitationDialog } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { resolveTargetScreen, resolveTargetNavigation } from '../utils/navigation/resolver';

export let isNavigationReady = false;

export const setNavigationReady = (ready: boolean) => {
  isNavigationReady = ready;
};

const routeNameRef: any = createRef();

interface ReelLivePopupProps {
  visible: boolean;
  onAcknowledge: () => void;
  t: (key: string) => string;
  loading?: boolean;
}

const ReelLivePopup = ({ visible, onAcknowledge, t, loading = false }: ReelLivePopupProps) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        {/* Main Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          width: '100%',
          overflow: 'visible',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          paddingTop: 40,
          paddingBottom: 30,
          paddingHorizontal: 25,
          alignItems: 'center',
        }}>
          {/* Top Logo - Fixed Position */}
          <Image
            source={require('../res/images/truckmitr_horizontal.png')}
            style={{
              width: 100,
              height: 40,
              position: 'absolute',
              top: 10,
              right: 15,
              opacity: 0.15,
            }}
            resizeMode="contain"
          />

          {/* Icon Container with Radiant Glow */}
          <LinearGradient
            colors={['#056CE2', '#084489']}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 25,
              shadowColor: '#084489',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 12,
            }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons
                name="play-circle"
                size={60}
                color="#fff"
              />
            </View>
          </LinearGradient>

          {/* Message Content */}
          <View style={{ alignItems: 'center', marginBottom: 25, width: '100%' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: 5,
              textAlign: 'center',
            }}>
              {t('reel_live_title')}
            </Text>

            <Text style={{
              fontSize: 16,
              color: '#333',
              textAlign: 'center',
              marginBottom: 15,
              fontWeight: '600',
            }}>
              {t('reel_live_status')}
            </Text>

            <View style={{
              backgroundColor: '#E3F2FD',
              paddingHorizontal: 20,
              paddingVertical: 15,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: '#BBDEFB',
              width: '100%',
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="gift-outline" size={24} color="#084489" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 14,
                color: '#084489',
                flex: 1,
                fontWeight: 'bold',
                lineHeight: 18,
              }}>
                {t('reel_live_benefit')}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
            }}>
              <Ionicons name="time-outline" size={14} color="#666" style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 12,
                color: '#666',
                textAlign: 'left',
                fontStyle: 'italic',
              }}>
                {t('reel_live_condition')}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onAcknowledge}
            activeOpacity={0.8}
            style={{ width: '100%' }}
            disabled={loading}
          >
            <LinearGradient
              colors={['#056CE2', '#084489']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                shadowColor: '#084489',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                  letterSpacing: 0.5,
                }}>
                  {t('reel_live_button')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function Routes() {
  // Start Global Location Tracking
  useDriverLocationTracking();

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const { responsiveWidth, responsiveHeight } = useResponsiveScale();

  const [showReelPopup, setShowReelPopup] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [reelPostData, setReelPostData] = useState<any>(null);

  // Interview Popup State
  const [showInterviewPopup, setShowInterviewPopup] = useState(false);
  const [interviewPopupData, setInterviewPopupData] = useState<InterviewData[]>([]);

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

  const userRoleStr = (user?.role || user?.data?.role || '').toLowerCase();
  const subId = user?.sub_id || user?.data?.sub_id;
  const isRestrictedDriver = userRoleStr === 'driver' && subId !== null && subId !== undefined;


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

    const isExcludedRole = userRoleStr === 'shipper';
    const isTruckerMode = appMode === 'trucker';

    if (isAuthenticated && !isExcludedRole && !isTruckerMode) {
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

  // -------------------------------
  // 🔹 Fetch Pending Popup for Drivers
  // -------------------------------
  useEffect(() => {
    const currentRole = String(user?.role || user?.data?.role || '').toLowerCase();
    const isExcludedRole = currentRole === 'shipper';
    const isTruckerMode = appMode === 'trucker';

    if (isAuthenticated && !isExcludedRole && !isTruckerMode) {
      const fetchPendingPopup = async () => {
        try {
          const response: any = await axiosInstance.get('api/jobs/posts/pending-popup');
          console.log('📋 Pending Popup API Response 2:', response?.data);
          if (response?.data?.success && response?.data?.data) {
            setReelPostData(response.data.data);
            setShowReelPopup(true);
          }
        } catch (error: any) {
          console.error('❌ Pending Popup API Error:', error?.response?.data || error?.message);
        }
      };
      fetchPendingPopup();
    }
  }, [isAuthenticated, user?.role, user?.data?.role]);

  // -------------------------------
  // 🔹 Fetch Interview Popup for Drivers
  // -------------------------------
  useEffect(() => {
    const currentRole = String(user?.role || user?.data?.role || '').toLowerCase();
    const userId = user?.id || user?.data?.id;
    if (isAuthenticated && currentRole === 'driver' && userId) {
      const fetchInterviewPopup = async () => {
        try {
          const response: any = await axiosInstance.get(
            `api/transporter/interview/popup/${userId}`
          );
          console.log('🎤 Interview Popup API Response:', response?.data);
          if (response?.data?.status && Array.isArray(response?.data?.data) && response?.data?.data?.length > 0) {
            const mappedData: InterviewData[] = response.data.data.map((item: any) => {
              const interview = item.interview || {};
              if (item.type === 'online') {
                return {
                  type: 'online',
                  interview_id: String(interview.id || item.interview_id || item.id),
                  job_id: item.job_id,
                  timing: interview.online_interview_timing || item.online_interview_timing || item.timing,
                };
              } else {
                return {
                  type: 'physical',
                  interview_id: String(interview.id || item.interview_id || item.id),
                  start_date: interview.physical_interview_start || item.physical_interview_start || item.start_date,
                  end_date: interview.physical_interview_end || item.physical_interview_end || item.end_date,
                  location: interview.physical_interview_location || item.physical_interview_location || item.location,
                  current_action: interview.physical_current_action || item.physical_current_action || item.current_action,
                };
              }
            });

            // Deduplicate by interview_id to prevent double actions in the stack
            const uniqueData = Array.from(new Map(mappedData.map(item => [item.interview_id, item])).values());

            setInterviewPopupData(uniqueData);
            setShowInterviewPopup(true);
          } else {
            setShowInterviewPopup(false);
            setInterviewPopupData([]);
          }
        } catch (error: any) {
          console.log('Interview Popup API Error:', error?.response?.data || error?.message);
          setShowInterviewPopup(false);
          setInterviewPopupData([]);
        }
      };
      fetchInterviewPopup();
    }
  }, [isAuthenticated, user?.role, user?.data?.role, user?.id, user?.data?.id]);

  const handleInterviewPopupDismiss = () => {
    setShowInterviewPopup(false);
    setInterviewPopupData([]);
  };

  const handleReelAcknowledge = async () => {
    try {
      if (reelPostData?.id) {
        setIsAcknowledging(true);
        console.log('🚀 Acknowledging reel post:', reelPostData?.id);
        await axiosInstance.post(`api/jobs/posts/${reelPostData.id}/acknowledge`, {
          acknowledged_at: moment().format('YYYY-MM-DD HH:mm:ss')
        });
      }
    } catch (error) {
      console.error('❌ Error acknowledging reel:', error);
    } finally {
      setIsAcknowledging(false);
      setShowReelPopup(false);
      // Redirect to Jobs screen after acknowledgment
      if (navigationRef.current?.isReady()) {
        navigationRef.current?.navigate(STACKS.JOB as never);
      }
    }
  };

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
    if (!isAuthenticated || !navReady) return;

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

    // Check on initial mount
    const timer = setTimeout(checkCallData, 500);

    // Also check when app comes back to foreground (e.g. after accepting call from native activity)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📞 App became active, checking for pending call data...');
        setTimeout(checkCallData, 300);
      }
    });

    // Listen for explicit accept event from native side (when app is already in foreground)
    const callAcceptedSubscription = DeviceEventEmitter.addListener('onCallAccepted', () => {
      console.log('📞 onCallAccepted event received from native, navigating to call screen...');
      setTimeout(checkCallData, 300);
    });

    return () => {
      clearTimeout(timer);
      appStateSubscription.remove();
      callAcceptedSubscription.remove();
    };
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
            // Resolve the pending screen with role validation
            const validatedScreen = resolveTargetScreen(pendingScreen, userRoleStr, selectedModule);
            console.log('🔴 Kill state: Resolved screen:', validatedScreen);

            switch (validatedScreen) {
              case 'profileEdit':
              case STACKS.PROFILE:
              case STACKS.FOREMAN_PROFILE:
              case STACKS.DHABHA_PROFILE:
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'profile' });
                break;
              case 'jobs':
              case STACKS.JOB:
              case STACKS.VIEW_JOBS:
              case STACKS.FOREMAN_JOBS_LIST:
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'job' });
                break;
              case 'home':
              case STACKS.HOME:
              case STACKS.FOREMAN_BOTTOM_TAB:
              case STACKS.DHABHA_BOTTOM:
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'home' });
                break;
              case 'training':
              case STACKS.TRAINING:
                (navigationRef.current as any)?.navigate('bottomTab', { screen: 'training' });
                break;
              case STACKS.FOREMAN_ADD_DRIVER:
                (navigationRef.current as any)?.navigate(STACKS.FOREMAN_BOTTOM_TAB, { screen: STACKS.FOREMAN_ADD_DRIVER });
                break;
              case STACKS.DHABHA_ADD_DRIVER:
                (navigationRef.current as any)?.navigate(STACKS.DHABHA_BOTTOM, { screen: STACKS.DHABHA_ADD_DRIVER });
                break;
              case STACKS.PUNCTURE_ADD_DRIVER:
                (navigationRef.current as any)?.navigate(STACKS.PUNCTURE_BOTTOM, { screen: STACKS.PUNCTURE_ADD_DRIVER });
                break;
              case STACKS.DRIVER_ASSOCIATION_ADD_DRIVER:
                (navigationRef.current as any)?.navigate(STACKS.ASSOCIATE_BOTTOM_TAB, { screen: STACKS.DRIVER_ASSOCIATION_ADD_DRIVER });
                break;
              case STACKS.SHIPPER_POST_LOAD:
                (navigationRef.current as any)?.navigate(STACKS.SHIPPER_BOTTOM_TAB, { screen: STACKS.SHIPPER_POST_LOAD });
                break;
              default:
                console.log('🔴 Direct navigation for kill state:', validatedScreen);
                (navigationRef.current as any)?.navigate(validatedScreen);
            }
            console.log('🔴 Kill state: Navigation completed for screen:', validatedScreen);
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
  // 🔹 Deep Link Processing (Handled by the main useEffect below)
  // -------------------------------



  const parseDeepLink = (url: string) => {
    let raw = url;

    // Normalize: Handle various prefixes (truckmitr://, http/https, with/without www)
    raw = raw.replace(/^truckmitr:\/\//, '');
    raw = raw.replace(/^https?:\/\/(www\.)?truckmitr\.com\//, '');
    raw = raw.replace(/^https?:\/\/awaz\.devtruckmitr\.in\/(api\/feed\/)?/, '');

    // Clean up leading slashes
    raw = raw.replace(/^\/+/, '');

    const [pathWithQuery, query = ''] = raw.split('?');
    const pathParts = pathWithQuery.split('/');
    const path = pathParts[0];
    const id = pathParts[1]; // e.g. reel/123 -> path=reel, id=123

    // Parse all query parameters
    const params: Record<string, string> = {};
    if (query) {
      query.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }

    // Special case for reelId in query string (backwards compatibility)
    const finalId = id || params.reelId || params.id;

    return {
      path,
      id: finalId,
      params,
    };
  };

  // Function to handle deep link navigation
  const handleDeepLink = (url: string) => {
    console.log('🔍 Processing deep link:', url);

    const { path, id, params } = parseDeepLink(url);
    console.log('🔍 Deep link path:', path, 'id:', id, 'params:', params);

    if (!navigationRef.current) {
      console.log('❌ Navigation ref not available');
      return;
    }

    // Referral / Signup handling (Allowed even if not authenticated)
    if (path === 'signup' || path === 'register') {
      const referralCode = params.referralCode || params.code || id;
      console.log('🎁 Redirecting to signup with referralCode:', referralCode);

      (navigationRef.current as any)?.navigate(STACKS.SIGNUP, {
        referralCode,
        preSelectedRole: 'driver' // Per user request: default to driver for referrals
      });
      return;
    }

    if (!isAuthenticated) {
      console.log('❌ User not authenticated, cannot navigate to sensitive screens');
      return;
    }

    // 1. Resolve Target Navigation
    const { stack, screen } = resolveTargetNavigation(path, userRoleStr, selectedModule);
    console.log(`🔍 Resolved target navigation: Stack: ${stack} | Screen: ${screen}`);

    if (!screen) {
      console.log('❌ Could not resolve target screen for path:', path);
      return;
    }

    // 2. Handle Navigation
    // For DKA posts/reels, we usually want to pass the ID
    const navParams: any = id ? { id, reelId: id } : undefined;

    if (stack) {
      // If it's a tab screen, navigate to the tab navigator first
      (navigationRef.current as any)?.navigate(stack, {
        screen: screen,
        params: navParams,
      });
    } else {
      // Direct navigation for non-tab screens
      (navigationRef.current as any)?.navigate(screen, navParams);
    }
  };

  useEffect(() => {
    // Handle initial URL (when app is opened from closed state)
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🌐 Initial URL received:', initialUrl);
          if (isAppReady && isNavigationReady) {
            handleDeepLink(initialUrl);
          } else {
            console.log('🌐 App not ready, storing deep link for later processing');
            pendingDeepLink.current = initialUrl;
          }
        }
      } catch (error) {
        console.log('❌ Error getting initial URL:', error);
      }
    };

    getInitialURL();

    // Handle URL when app is already running
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('🌐 Deep link received by Navigation:', url);
      handleDeepLink(url);
    });

    return () => sub.remove();
  }, [isAppReady, isNavigationReady]);

  // Handle pending deep link when app becomes ready
  useEffect(() => {
    if (pendingDeepLink.current && isAppReady && isNavigationReady) {
      console.log('🌐 Processing pending deep link:', pendingDeepLink.current);

      const url = pendingDeepLink.current;
      pendingDeepLink.current = null; // Clear pending link

      // Add extra delay for kill state stability
      setTimeout(() => {
        handleDeepLink(url);
      }, 1500); 
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
    prefixes: [
      'truckmitr://',
      'https://truckmitr.com',
      'http://truckmitr.com',
      'https://www.truckmitr.com',
      'http://www.truckmitr.com'
    ],

    // Custom getInitialURL to handle notification deep links in kill state
    async getInitialURL() {
      // 1. Check for notification deep links
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification?.data?.screen) {
        const screen = initialNotification.data.screen as string;
        await AsyncStorage.setItem('PENDING_NOTIFICATION_SCREEN', screen);
        return null;
      }

      // 2. Check for regular deep link
      const url = await Linking.getInitialURL();
      if (url) {
        console.log('🌐 Consumed initial URL:', url);
        if (!isAuthenticated || !isAppReady) {
          console.log('🌐 Storing for post-auth processing');
          pendingDeepLink.current = url;
        }
      }
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
              // Resolve screen name with role validation
              const validatedScreen = resolveTargetScreen(screen, userRoleStr, selectedModule);
              console.log('🟡 Background: Resolved screen:', validatedScreen);

              switch (validatedScreen) {
                case 'profileEdit':
                case STACKS.PROFILE:
                case STACKS.FOREMAN_PROFILE:
                case STACKS.DHABHA_PROFILE:
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'profile' });
                  break;
                case 'jobs':
                case STACKS.JOB:
                case STACKS.VIEW_JOBS:
                case STACKS.FOREMAN_JOBS_LIST:
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'job' });
                  break;
                case 'home':
                case STACKS.HOME:
                case STACKS.FOREMAN_BOTTOM_TAB:
                case STACKS.DHABHA_BOTTOM:
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'home' });
                  break;
                case 'training':
                case STACKS.TRAINING:
                  (navigationRef.current as any)?.navigate('bottomTab', { screen: 'training' });
                  break;
                case STACKS.FOREMAN_ADD_DRIVER:
                  (navigationRef.current as any)?.navigate(STACKS.FOREMAN_BOTTOM_TAB, { screen: STACKS.FOREMAN_ADD_DRIVER });
                  break;
                case STACKS.DHABHA_ADD_DRIVER:
                  (navigationRef.current as any)?.navigate(STACKS.DHABHA_BOTTOM, { screen: STACKS.DHABHA_ADD_DRIVER });
                  break;
                case STACKS.PUNCTURE_ADD_DRIVER:
                  (navigationRef.current as any)?.navigate(STACKS.PUNCTURE_BOTTOM, { screen: STACKS.PUNCTURE_ADD_DRIVER });
                  break;
                case STACKS.DRIVER_ASSOCIATION_ADD_DRIVER:
                  (navigationRef.current as any)?.navigate(STACKS.ASSOCIATE_BOTTOM_TAB, { screen: STACKS.DRIVER_ASSOCIATION_ADD_DRIVER });
                  break;
                case STACKS.SHIPPER_POST_LOAD:
                  (navigationRef.current as any)?.navigate(STACKS.SHIPPER_BOTTOM_TAB, { screen: STACKS.SHIPPER_POST_LOAD });
                  break;
                default:
                  console.log('🟡 Direct navigation for background:', validatedScreen);
                  (navigationRef.current as any)?.navigate(validatedScreen);
              }
              console.log('🟡 Background: Navigation completed for screen:', validatedScreen);
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
        signup: 'signup',
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
      ) : profileRequiredFieldsStatus === false && !isRestrictedDriver ? (
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
      ) : isRestrictedDriver ? (
        <Main />
      ) : appMode === 'trucker' ? (
        <TruckerMain />
      ) : (
        <Main />
      )}
      <InAppUpdatePopup />
      {subscriptionModal && <Subscription />}
      <ReelLivePopup
        visible={showReelPopup}
        onAcknowledge={handleReelAcknowledge}
        t={t}
        loading={isAcknowledging}
      />
      <InterviewPopupModal
        visible={showInterviewPopup}
        data={interviewPopupData}
        onDismiss={handleInterviewPopupDismiss}
        t={t}
      />
    </NavigationContainer>
  );
}
