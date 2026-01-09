

import {
  Alert,
  Image,
  ScrollView,
  Share,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { deleteUserData } from '@truckmitr/src/utils/config/token';
import { subscriptionDetailsAction, subscriptionModalAction, userAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { getUserBadgeText, shouldShowMembershipCard, getMembershipCardConfig, getUserTier } from '@truckmitr/src/utils/global';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import RNFetchBlob from 'react-native-blob-util';
import LinearGradient from 'react-native-linear-gradient';
import { ImageBackground } from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Membership Card Asset Images
const LOGO_IMAGE = require('@truckmitr/src/assets/membership-card/logotrick.png');

const BACKGROUND_VERIFIED = require('@truckmitr/src/assets/membership-card/membershipbg.png');
const BACKGROUND_TRUSTED = require('@truckmitr/src/assets/membership-card/membershipcardbg2.png');
const BACKGROUND_JOB_READY = require('@truckmitr/src/assets/membership-card/membershipcard3.png');
const BACKGROUND_TRANSPORTER_PRO = require('@truckmitr/src/assets/membership-card/TransporterPro.png');

// Card tier configurations
type TierType = 'JOB READY' | 'VERIFIED' | 'TRUSTED' | 'Standard' | 'LEGACY' | 'TRANSPORTER PRO' | 'LEGACY TRANSPORTER';

interface TierConfig {
  background: any;
  borderColors: string[];
  chromeGradient: { offset: string; color: string }[];
  categoryText: string;
}

const getTierConfigs = (t: any): Record<TierType, TierConfig> => ({
  'JOB READY': {
    background: BACKGROUND_JOB_READY,
    borderColors: ['#000b29', '#002661', '#4A90E2', '#002661', '#000b29'],
    chromeGradient: [
      { offset: '0', color: '#E0E3E7' },
      { offset: '0.25', color: '#BFC5CC' },
      { offset: '0.5', color: '#9AA0A6' },
      { offset: '0.75', color: '#BFC5CC' },
      { offset: '1', color: '#E0E3E7' },
    ],
    categoryText: t('cardJobReadyDriver'),
  },
  'VERIFIED': {
    background: BACKGROUND_VERIFIED,
    borderColors: ['#404040', '#E0E3E7', '#FFFFFF', '#E0E3E7', '#404040'],
    chromeGradient: [
      { offset: '0', color: '#E0E3E7' },
      { offset: '0.25', color: '#BFC5CC' },
      { offset: '0.5', color: '#9AA0A6' },
      { offset: '0.75', color: '#BFC5CC' },
      { offset: '1', color: '#E0E3E7' },
    ],
    categoryText: t('cardVerifiedDriver'),
  },
  'TRUSTED': {
    background: BACKGROUND_TRUSTED,
    borderColors: ['#A67C00', '#C9A23F', '#FFF6C8', '#C9A23F', '#A67C00'],
    chromeGradient: [
      { offset: '0', color: '#FFF6C8' },
      { offset: '0.25', color: '#C9A23F' },
      { offset: '0.5', color: '#A67C00' },
      { offset: '0.75', color: '#C9A23F' },
      { offset: '1', color: '#FFF6C8' },
    ],
    categoryText: t('cardTrustedDriver'),
  },
  'Standard': {
    background: BACKGROUND_JOB_READY,
    borderColors: ['#000b29', '#002661', '#4A90E2', '#002661', '#000b29'],
    chromeGradient: [
      { offset: '0', color: '#E0E3E7' },
      { offset: '0.25', color: '#BFC5CC' },
      { offset: '0.5', color: '#9AA0A6' },
      { offset: '0.75', color: '#BFC5CC' },
      { offset: '1', color: '#E0E3E7' },
    ],
    categoryText: t('cardJobReady'),
  },
  'LEGACY': {
    background: BACKGROUND_VERIFIED,
    borderColors: ['#8B4513', '#CD853F', '#DEB887', '#CD853F', '#8B4513'],
    chromeGradient: [
      { offset: '0', color: '#DEB887' },
      { offset: '0.25', color: '#CD853F' },
      { offset: '0.5', color: '#8B4513' },
      { offset: '0.75', color: '#CD853F' },
      { offset: '1', color: '#DEB887' },
    ],
    categoryText: t('cardLegacyDriver'),
  },
  'TRANSPORTER PRO': {
    background: BACKGROUND_TRANSPORTER_PRO,
    borderColors: ['#404040', '#E0E3E7', '#FFFFFF', '#E0E3E7', '#404040'],
    chromeGradient: [
      { offset: '0', color: '#E0E3E7' },
      { offset: '0.25', color: '#BFC5CC' },
      { offset: '0.5', color: '#9AA0A6' },
      { offset: '0.75', color: '#BFC5CC' },
      { offset: '1', color: '#E0E3E7' },
    ],
    categoryText: 'TRANSPORTER PRO',
  },
  'LEGACY TRANSPORTER': {
    background: BACKGROUND_VERIFIED,
    borderColors: ['#8B4513', '#CD853F', '#DEB887', '#CD853F', '#8B4513'],
    chromeGradient: [
      { offset: '0', color: '#DEB887' },
      { offset: '0.25', color: '#CD853F' },
      { offset: '0.5', color: '#8B4513' },
      { offset: '0.75', color: '#CD853F' },
      { offset: '1', color: '#DEB887' },
    ],
    categoryText: t('cardLegacyTransporter'),
  },
});

// Helper function to get tier from payment_type
// Now also accepts amount to detect legacy drivers (Rs 49 payment) and legacy transporters (Rs 100/99 payment)
const getTierFromPaymentType = (paymentType: string, amount?: number, role?: string): TierType => {
  const isTransporter = role?.toLowerCase() === 'transporter';

  // Transporter Pro detection: Rs 499 payment for transporters
  if (isTransporter && (amount === 499 || amount === 499.00)) {
    return 'TRANSPORTER PRO';
  }

  // Legacy transporter detection: Rs 99, 100, or 1 payment for TRANSPORTERS
  if (isTransporter && (amount === 99 || amount === 99.00 || amount === 100 || amount === 100.00 || amount === 1 || amount === 1.00)) {
    return 'LEGACY TRANSPORTER';
  }

  // Legacy driver detection: Rs 49 or 1 payment for DRIVERS (implicitly, or explicitly check !isTransporter)
  if (amount === 49 || amount === 49.00 || amount === 1 || amount === 1.00) {
    return 'LEGACY';
  }

  const normalizedType = paymentType?.toUpperCase().replace(/\s+/g, ' ').trim();
  if (normalizedType === 'TRUSTED') return 'TRUSTED';
  if (normalizedType === 'VERIFIED') return 'VERIFIED';
  if (normalizedType === 'JOB READY' || normalizedType === 'JOBREADY') return 'JOB READY';
  if (normalizedType === 'STANDARD') return 'Standard';
  if (normalizedType === 'LEGACY') return 'LEGACY';
  return 'JOB READY';
};
type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// State ID to Name Mapping (based on API states data)
const STATE_ID_MAP: Record<string, string> = {
  '1': 'Andaman and Nicobar Islands',
  '2': 'Andhra Pradesh',
  '3': 'Arunachal Pradesh',
  '4': 'Assam',
  '5': 'Bihar',
  '6': 'Chandigarh',
  '7': 'Chhattisgarh',
  '8': 'Dadra and Nagar Haveli',
  '9': 'Delhi',
  '10': 'Goa',
  '11': 'Gujarat',
  '12': 'Haryana',
  '13': 'Himachal Pradesh',
  '14': 'Jammu and Kashmir',
  '15': 'Jharkhand',
  '16': 'Karnataka',
  '17': 'Kerala',
  '18': 'Ladakh',
  '19': 'Lakshadweep',
  '20': 'Madhya Pradesh',
  '21': 'Maharashtra',
  '22': 'Manipur',
  '23': 'Meghalaya',
  '24': 'Mizoram',
  '25': 'Nagaland',
  '26': 'Odisha',
  '27': 'Puducherry',
  '28': 'Punjab',
  '29': 'Rajasthan',
  '30': 'Sikkim',
  '31': 'Tamil Nadu',
  '32': 'Telangana',
  '33': 'Tripura',
  '34': 'Uttar Pradesh',
  '35': 'Uttarakhand',
  '36': 'West Bengal',
};

// Helper function to get state name from ID or return the value as-is if it's already a name
const getStateName = (stateValue: string | number | undefined): string => {
  if (!stateValue) return '';
  const stateStr = String(stateValue).trim();
  // If it's a numeric ID, look up the name
  if (STATE_ID_MAP[stateStr]) {
    return STATE_ID_MAP[stateStr];
  }
  // If it's already a name (non-numeric), return as-is
  return stateStr;
};

// Apple-style Confirmation Dialog Component
interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const AppleConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const colors = useColor();
  const { responsiveFontSize, responsiveWidth, responsiveHeight } = useResponsiveScale();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[
          styles.dialogOverlay,
          { opacity: opacityValue }
        ]}
      >
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [{ scale: scaleValue }],
              backgroundColor: colors.white,
              width: responsiveWidth(75),
            }
          ]}
        >
          {/* Icon */}
          <View style={[
            styles.dialogIconContainer,
            { backgroundColor: isDestructive ? 'rgba(255, 59, 48, 0.1)' : 'rgba(8, 68, 137, 0.1)' }
          ]}>
            {isDestructive ? (
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={32}
                color="#FF3B30"
              />
            ) : (
              <MaterialCommunityIcons
                name="logout"
                size={32}
                color={colors.royalBlue}
              />
            )}
          </View>

          {/* Title */}
          <Text style={[
            styles.dialogTitle,
            {
              color: colors.black,
              fontSize: responsiveFontSize(2.2),
            }
          ]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[
            styles.dialogMessage,
            {
              color: colors.blackOpacity(0.6),
              fontSize: responsiveFontSize(1.7),
            }
          ]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.dialogButtonContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCancel}
              disabled={loading}
              style={[
                styles.dialogButton,
                styles.dialogCancelButton,
                { backgroundColor: colors.blackOpacity(0.05) }
              ]}
            >
              <Text style={[
                styles.dialogButtonText,
                {
                  color: colors.blackOpacity(0.8),
                  fontSize: responsiveFontSize(1.8),
                }
              ]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onConfirm}
              disabled={loading}
              style={[
                styles.dialogButton,
                styles.dialogConfirmButton,
                { backgroundColor: isDestructive ? '#FF3B30' : colors.royalBlue }
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[
                  styles.dialogButtonText,
                  {
                    color: colors.white,
                    fontSize: responsiveFontSize(1.8),
                  }
                ]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Menu Item Component for Apple-style list
interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  showDivider?: boolean;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  textColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  onPress,
  showDivider = true,
  isLast = false,
  rightElement,
  textColor,
}) => {
  const colors = useColor();
  const { responsiveFontSize, responsiveWidth } = useResponsiveScale();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[
        styles.menuItem,
        {
          paddingVertical: responsiveFontSize(1.8),
          paddingHorizontal: responsiveFontSize(2),
        }
      ]}
    >
      <View style={[styles.menuIconContainer, { marginRight: responsiveFontSize(1.5) }]}>
        {icon}
      </View>
      <Text style={[
        styles.menuItemText,
        {
          color: textColor || colors.black,
          fontSize: responsiveFontSize(1.9),
        }
      ]}>
        {title}
      </Text>
      {rightElement || (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.blackOpacity(0.25)}
        />
      )}
    </TouchableOpacity>
  );
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const colors = useColor();
  const { responsiveFontSize, responsiveWidth } = useResponsiveScale();

  return (
    <Text style={[
      styles.sectionHeader,
      {
        color: colors.blackOpacity(0.5),
        fontSize: responsiveFontSize(1.5),
        marginHorizontal: responsiveFontSize(2),
        marginTop: responsiveFontSize(3),
        marginBottom: responsiveFontSize(1),
      }
    ]}>
      {title.toUpperCase()}
    </Text>
  );
};

// Card Container Component
interface CardContainerProps {
  children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({ children }) => {
  const colors = useColor();
  const { responsiveWidth, responsiveFontSize } = useResponsiveScale();
  const { shadow } = useShadow();

  return (
    <View style={[
      styles.cardContainer,
      {
        marginHorizontal: responsiveFontSize(2),
        backgroundColor: colors.white,
        borderRadius: 14,
        ...shadow,
        shadowColor: colors.blackOpacity(0.08),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      }
    ]}>
      {children}
    </View>
  );
};

export default function Profile() {
  const { t } = useTranslation();
  const dispatch = useDispatch()
  useStatusBarStyle('dark-content')
  const { user, isDriver, isTransporter, profileCompletion, subscriptionDetails, rank, star_rating, subscriptionModal, su } = useSelector((state: any) => { return state?.user }) || {};
  const colors = useColor();
  const safeAreaInsets = useSafeAreaInsets();
  const { shadow } = useShadow()
  const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
  const navigation = useNavigation<NavigatorProp>();

  const progress = profileCompletion || 0;
  const size = responsiveFontSize(12);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const membershipCardRef = useRef<ViewShot>(null);

  // Dialog States
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDuration()
      const _fetchUser = async () => {
        const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE);
        if (profile?.data?.status) {
          dispatch(userAction(profile?.data))

          // Always fetch subscription details
          try {
            const subscriptionResponse: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS);
            console.log('Subscription API Response:', JSON.stringify(subscriptionResponse?.data, null, 2));

            // Always dispatch - even if data is empty array
            // The reducer will handle empty arrays correctly
            if (subscriptionResponse?.data?.status) {
              const subscriptionData = subscriptionResponse?.data?.data || [];
              console.log('Dispatching subscription data, length:', subscriptionData.length);
              dispatch(subscriptionDetailsAction(subscriptionData));
            } else {
              // API returned status: false, clear subscription data
              console.log('Subscription API returned status: false, clearing data');
              dispatch(subscriptionDetailsAction([]));
            }
          } catch (error) {
            console.error('Error fetching subscription details:', error);
            // On error, clear subscription data to be safe
            dispatch(subscriptionDetailsAction([]));
          }
        }
      }
      _fetchUser()
    }, [])
  );

  const getDuration = () => {
    const startDate = moment.unix(subscriptionDetails?.start_at);
    const endDate = moment.unix(subscriptionDetails?.end_at);
    const years = endDate.diff(startDate, 'years');
    return years;
  };

  // Get the actual paid amount from subscription
  // Get the actual paid amount from subscription
  const getPaidAmount = (): number => {
    // If no subscription details valid-like object, return 0
    if (!subscriptionDetails || Object.keys(subscriptionDetails).length === 0) {
      return 0;
    }

    // Amount is stored directly on subscription object as string (e.g., "99.00")
    if (subscriptionDetails?.amount) {
      return parseFloat(subscriptionDetails.amount);
    }
    // Fallback to payment_details.amount (in paise, needs /100)
    if (subscriptionDetails?.payment_details?.amount) {
      return subscriptionDetails.payment_details.amount / 100;
    }
    // Default fallback
    return 0;
  };

  // Get original price based on the paid amount
  const getOriginalPrice = (): string => {
    const paidAmount = getPaidAmount();

    // Map paid amounts to original prices based on subscription tiers
    // Job Ready: ₹99 → ₹249 original
    // Verified: ₹199 → ₹499 original  
    // Trusted: ₹499 → ₹999 original
    if (paidAmount <= 99) return '249';
    if (paidAmount <= 199) return '499';
    if (paidAmount <= 499) return '999';

    // Fallback to membership_amount if available in payment_details
    if (subscriptionDetails?.payment_details?.membership_amount) {
      return subscriptionDetails.payment_details.membership_amount.toLocaleString('en-IN');
    }

    // Default fallback
    return isDriver ? '599' : '999';
  };

  // Calculate savings percentage
  const getSavingsPercent = (): string => {
    const paidAmount = getPaidAmount();
    const originalPrice = parseFloat(getOriginalPrice().replace(/,/g, ''));
    if (originalPrice <= 0 || isNaN(originalPrice)) return '0';
    const savings = ((originalPrice - paidAmount) / originalPrice) * 100;
    return savings.toFixed(0);
  };

  const _navigateProfileEdit = () => {
    isDriver && navigation.navigate(STACKS.PROFILE_EDIT)
    isTransporter && navigation.navigate(STACKS.PROFILE_EDIT_TRANSPORTER)
  }

  const _navigateProfileOverview = () => {
    navigation.navigate(STACKS.PROFILE_OVERVIEW)
  }

  const logAllAsyncStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();

      if (!keys || keys.length === 0) {
        console.log('📦 AsyncStorage is empty');
        return;
      }

      const items = await AsyncStorage.multiGet(keys);

      console.log('📦 AsyncStorage contents:');
      items.forEach(([key, value]) => {
        try {
          const parsedValue = value ? JSON.parse(value) : value;
          console.log(`🔑 ${key}:`, parsedValue);
        } catch (e) {
          console.log(`🔑 ${key}:`, value);
        }
      });
    } catch (error) {
      console.error('❌ Error reading AsyncStorage:', error);
    }
  };

  const _navigateRating = () => navigation.navigate(STACKS.RATING)
  const _navigateContactUs = () => navigation.navigate(STACKS.CONTACT_US)
  const _navigatePrivacy = () => navigation.navigate(STACKS.PRIVACY)
  const _navigateSetting = () => navigation.navigate(STACKS.SETTINGS)
  const _navigateDLVerification = () => navigation.navigate(STACKS.DL_VERIFICATION)

  const _handleUpgradePlan = () => {
    dispatch(subscriptionModalAction(true));
  }

  const deleteAccount = async () => {
    setIsDeleting(true);
    const userinfo = {
      id: user?.id ?? '',
      unique_id: user?.unique_id ?? '',
      name: user?.name ?? '',
      mobile: user?.mobile ?? '',
      email: user?.email ?? '',
      role: user?.role ?? '',
    };

    const eventParams = {
      user_id: String(userinfo.id),
      user_unique_id: userinfo.unique_id,
      user_name: userinfo.name,
      user_email: userinfo.email,
      user_role: userinfo.role,
      method: 'user_requested',
    };

    try {
      const response: any = await axiosInstance.post(END_POINTS?.DELETE_ACCOUNT);

      if (response?.data?.status) {
        await analytics().logEvent('delete_account', eventParams);
        AppEventsLogger.logEvent('delete_account', eventParams);
        await new Promise<void>(res => setTimeout(() => res(), 500));
        dispatch(userAuthenticatedAction(false));
        deleteUserData();
        showToast(response?.data?.message);
      }
    } catch (error) {
      console.warn('Delete account error:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const _onPressShareApp = async () => {
    try {
      const result = await Share.share({
        message: t('shareAppMessage'),
      });

      console.log('📤 Share app result:', result);
    } catch (error) {
      console.error('❌ Error sharing the app:', error);
    }
  };

  const _onPressShareProfile = async () => {
    try {
      const userName = user?.name || 'TruckMitr User';
      const userRole = capitalizeFirst(user?.role || 'member');
      const userId = user?.unique_id || '';

      // Create a web URL that will be clickable and redirect to the app
      // This follows the same pattern as Instagram, Twitter, etc.
      const profileUrl = `https://truckmitr.com/u/${userId}`;

      const shareMessage = `👋 Hi! Check out my ${userRole} profile on TruckMitr:

� O${userName}
🆔 ID: ${userId}

� Vienw my profile: ${profileUrl}

📥 Download TruckMitr: https://play.google.com/store/apps/details?id=com.truckmitr`;

      const result = await Share.share({
        message: shareMessage,
        url: profileUrl, // This makes it clickable on iOS
        title: `${userName}'s TruckMitr Profile`,
      });

      console.log('📤 Share profile result:', result);
    } catch (error) {
      console.error('❌ Error sharing profile:', error);
    }
  };

  const _onPressDeleteAccount = () => {
    setShowDeleteDialog(true);
  }

  const _onPressLogout = async () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    const userinfo = {
      id: user?.id ?? '',
      unique_id: user?.unique_id ?? '',
      name: user?.name ?? '',
      mobile: user?.mobile ?? '',
      email: user?.email ?? '',
      role: user?.role ?? '',
    };

    try {
      const eventParams = {
        method: 'manual_logout',
        user_id: String(userinfo.id),
        user_unique_id: userinfo.unique_id,
        user_name: userinfo.name,
        user_email: userinfo.email,
        user_role: userinfo.role,
      };

      await analytics().logEvent('user_logout', eventParams);
      AppEventsLogger.logEvent('user_logout', eventParams);
      await new Promise<void>(res => setTimeout(() => res(), 500));
      await axiosInstance.post(END_POINTS?.LOGOUT);
    } catch (error) {
      console.warn('Analytics logout error:', error);
    }

    dispatch(userAuthenticatedAction(false));
    deleteUserData();
    setShowLogoutDialog(false);
  };

  const downloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);

      // Get payment_id from subscriptionDetails
      const paymentId = subscriptionDetails?.payment_id || subscriptionDetails?.id;

      if (!paymentId) {
        showToast(t('unableToDownloadInvoicePaymentIdNotFound'));
        return;
      }

      const getPDFLink: any = await axiosInstance.get(END_POINTS?.INVOICE_DOWNLOAD(paymentId));

      if (getPDFLink?.data?.status && getPDFLink?.data?.invoice_url) {
        const { config, fs, android } = RNFetchBlob;
        const timestamp = new Date().getTime();
        const filePath = `${fs.dirs.DownloadDir}/Invoice${timestamp}.pdf`;

        await config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: filePath,
            description: t('downloadingInvoiceStatus'),
            title: t('truckMitrInvoice'),
            mime: 'application/pdf',
            mediaScannable: true,
          },
        })
          .fetch('GET', getPDFLink?.data?.invoice_url)
          .then((res) => {
            android.actionViewIntent(res.path(), 'application/pdf');
            showToast(t('invoiceDownloadedSuccessfully'));
          })
          .catch((e) => {
            Alert.alert('Error', e.message);
          });
      } else {
        showToast(getPDFLink?.data?.message || t('unableToDownloadInvoice'));
      }
    } catch (error: any) {
      console.error('Download invoice error:', error);
      showToast(error?.message || t('failedToDownloadInvoice'));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const shareMembershipCard = async (action: 'share' | 'download' = 'share') => {
    try {
      setSharingCard(true);

      if (!membershipCardRef.current?.capture) {
        showToast(t('unableToCaptureMembershipCard'));
        return;
      }

      // Capture the membership card as an image
      const uri = await membershipCardRef.current.capture();

      if (!uri) {
        showToast(t('failedToCaptureMembershipCard'));
        return;
      }

      if (action === 'share') {
        // Share the membership card
        const shareOptions = {
          title: t('truckMitrMembershipCard'),
          message: t('checkOutMyMembershipCard'),
          url: Platform.OS === 'android' ? `file://${uri}` : uri,
          type: 'image/png',
        };

        await RNShare.open(shareOptions);
        showToast(t('membershipCardSharedSuccessfully'));
      } else {
        // Download/save the membership card
        const { fs } = RNFetchBlob;
        const timestamp = new Date().getTime();
        const destPath = `${fs.dirs.DownloadDir}/TruckMitr_Membership_Card_${timestamp}.png`;

        // Copy the file to Downloads folder
        await fs.cp(uri, destPath);

        showToast(t('membershipCardSavedToDownloads'));
      }
    } catch (error: any) {
      // User cancelled the share dialog
      if (error?.message?.includes('User did not share')) {
        return;
      }
      console.error('Share membership card error:', error);
      showToast(error?.message || t('failedToShareMembershipCard'));
    } finally {
      setSharingCard(false);
    }
  };

  console.log('-----------driver rank-------------', rank);


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Space height={safeAreaInsets.top} />

      {/* Apple-style Confirmation Dialogs */}
      <AppleConfirmDialog
        visible={showLogoutDialog}
        title={t('logout')}
        message={t('areYouSureLogout') || 'Are you sure you want to logout from your account?'}
        confirmText={t('logout')}
        cancelText={t('cancel')}
        isDestructive={false}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutDialog(false)}
      />

      <AppleConfirmDialog
        visible={showDeleteDialog}
        title={t('deleteAccount')}
        message={t('areYouSureDeleteAccount') || 'This action cannot be undone. All your data will be permanently deleted.'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel')}
        isDestructive={true}
        onConfirm={deleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
        loading={isDeleting}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsiveHeight(4) }}
      >
        {/* Profile Header Section */}
        <View style={[
          styles.profileHeader,
          {
            paddingHorizontal: responsiveFontSize(2),
            paddingTop: responsiveFontSize(2),
            paddingBottom: responsiveFontSize(3),
          }
        ]}>
          {/* Profile Avatar with Progress Ring */}
          <TouchableOpacity
            onPress={_navigateProfileEdit}
            activeOpacity={0.9}
            style={styles.avatarContainer}
          >
            <Svg width={size} height={size} style={styles.progressRing}>
              <Defs>
                <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FFD700" />
                  <Stop offset="100%" stopColor="#FFA500" />
                </SvgLinearGradient>
              </Defs>
              {/* Background Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.blackOpacity(0.06)}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth={3}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <Image
              style={[
                styles.avatarImage,
                {
                  height: size - strokeWidth * 4,
                  width: size - strokeWidth * 4,
                  backgroundColor: colors.white,
                }
              ]}
              source={{
                uri: user?.images
                  ? `${BASE_URL}public/${user?.images}`
                  : `https://cdn-icons-png.flaticon.com/512/3177/3177440.png`
              }}
            />
            {/* Completion Badge */}
            <View style={[
              styles.completionBadge,
              {
                backgroundColor: colors.white,
                ...shadow,
                shadowColor: colors.blackOpacity(0.15),
              }
            ]}>
              <Text style={[
                styles.completionText,
                {
                  fontSize: responsiveFontSize(1.3),
                  color: progress >= 80 ? '#34C759' : progress >= 50 ? '#FF9500' : '#FF3B30',
                }
              ]}>
                {`${profileCompletion}%`}
              </Text>
            </View>
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <Text style={[
              styles.userName,
              {
                color: colors.black,
                fontSize: responsiveFontSize(2.6),
              }
            ]}>
              {user?.name || ''}
            </Text>

            <Text style={[
              styles.userId,
              {
                color: colors.blackOpacity(0.5),
                fontSize: responsiveFontSize(1.5),
              }
            ]}>
              {`${user?.unique_id || ''}`}
            </Text>

            {/* Role Badge */}
            <View style={[
              styles.roleBadge,
              { backgroundColor: colors.royalBlueOpacity(0.08) }
            ]}>
              <Text style={[
                styles.roleText,
                {
                  color: colors.royalBlue,
                  fontSize: responsiveFontSize(1.4),
                }
              ]}>
                {getUserBadgeText({ user, subscriptionDetails, isDriver })}
              </Text>
            </View>

            {/* Star Rating for Drivers */}
            {isDriver && (
              <View style={styles.starContainer}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FontAwesome
                    key={i}
                    name={i < star_rating ? 'star' : 'star-o'}
                    size={14}
                    color={i < star_rating ? '#FFD700' : colors.blackOpacity(0.2)}
                    style={{ marginRight: 3 }}
                  />
                ))}
              </View>
            )}

            {/* Rank Badge for Drivers */}
            {isDriver && rank && (
              <View style={[
                styles.rankBadge,
                { backgroundColor: 'rgba(255, 215, 0, 0.15)' }
              ]}>
                <Text style={[
                  styles.rankText,
                  {
                    color: colors.bronze,
                    fontSize: responsiveFontSize(1.4),
                  }
                ]}>
                  {rank}
                </Text>
                <Text style={{ fontSize: responsiveFontSize(1.5) }}>🏆</Text>
              </View>
            )}
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            onPress={_navigateProfileEdit}
            activeOpacity={0.7}
            style={[
              styles.editButton,
              { backgroundColor: colors.blackOpacity(0.05) }
            ]}
          >
            <Feather name="edit-2" size={18} color={colors.blackOpacity(0.6)} />
          </TouchableOpacity>
        </View>

        {/* Profile Incomplete Card */}
        {Number(profileCompletion) !== 100 && (
          <>
            <View style={[
              styles.incompleteCard,
              {
                marginHorizontal: responsiveFontSize(2),
                borderRadius: 16,
                overflow: 'hidden',
              }
            ]}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
                colors={['rgba(8, 68, 137, 0.08)', 'rgba(12, 120, 240, 0.12)']}
              />
              <View style={styles.incompleteCardContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[
                    styles.alertIconContainer,
                    { backgroundColor: colors.royalBlueOpacity(0.15) }
                  ]}>
                    <Ionicons name="alert-circle" size={24} color={colors.royalBlue} />
                  </View>
                  <View style={{ flex: 1, marginLeft: responsiveFontSize(1.5) }}>
                    <Text style={[
                      styles.incompleteTitle,
                      {
                        color: colors.black,
                        fontSize: responsiveFontSize(1.9),
                      }
                    ]}>
                      {t('yourProfileIncomplete')}
                    </Text>
                    <Text style={[
                      styles.incompleteSubtitle,
                      {
                        color: colors.blackOpacity(0.5),
                        fontSize: responsiveFontSize(1.5),
                      }
                    ]}>
                      {t('profileIncompleteTitle')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={_navigateProfileEdit}
                  activeOpacity={0.8}
                  style={[
                    styles.completeButton,
                    { backgroundColor: colors.royalBlue }
                  ]}
                >
                  <Text style={[
                    styles.completeButtonText,
                    {
                      color: colors.white,
                      fontSize: responsiveFontSize(1.7),
                    }
                  ]}>
                    {t('completeProfile')}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
            <Space height={responsiveFontSize(1)} />
          </>
        )}

        {/* Dynamic Membership Card - Show based on utility function logic */}
        {/* 
          Future: To enable transporter cards, just update shouldShowMembershipCard 
          in userBadge.ts to return true for transporters 
        */}
        {shouldShowMembershipCard({ user, subscriptionDetails, isDriver }) && (() => {
          // Get tier and card configuration using utility functions
          const tier = getUserTier({ user, subscriptionDetails, isDriver });
          const badgeText = getUserBadgeText({ user, subscriptionDetails, isDriver });
          const cardConfig = getMembershipCardConfig({ user, subscriptionDetails, isDriver });

          if (!cardConfig) return null;

          // Get tier configuration for existing card styling (backward compatibility)
          const paymentType = subscriptionDetails?.payment_type || 'JOB READY';
          const amount = parseFloat(subscriptionDetails?.amount) || 0;
          const tierConfig = getTierConfigs(t)[tier];

          // User data
          const userName = user?.name?.toUpperCase() || t('memberNameDefault').toUpperCase();
          const uniqueId = user?.unique_id || 'TM0000000000000';
          // Build location string: "City, State" if city present, otherwise just "State"
          const stateName = user?.state_name || getStateName(user?.states) || getStateName(user?.state) || '';
          const cityName = user?.city || '';
          const userLocation = (cityName && stateName ? `${cityName}, ${stateName}` : (cityName || stateName)).toUpperCase();
          const isTransporterRole = user?.role === 'transporter';
          const displayLabel = isTransporterRole ? 'TRANSPORT NAME' : (t('licenseType') || 'LICENSE TYPE');
          const displayValue = isTransporterRole ? (user?.Transport_Name || user?.transport_name || '')?.toUpperCase() : (user?.Type_of_License || 'HMV')?.toUpperCase();
          const licenseType = user?.Type_of_License || 'HMV'; // Keeping for backward compatibility if needed elsewhere



          const startDate = subscriptionDetails?.start_at
            ? moment.unix(subscriptionDetails.start_at).format('DD/MM/YY')
            : moment().format('DD/MM/YY');
          const endDate = subscriptionDetails?.end_at
            ? moment.unix(subscriptionDetails.end_at).format('DD/MM/YY')
            : moment().add(1, 'year').format('DD/MM/YY');

          // Card dimensions
          const cardWidth = responsiveWidth(92);
          const cardHeight = cardWidth / 1.586;

          return (
            <>
              <SectionHeader title={t('membership')} />

              {/* Membership ID Card - Wrapped with ViewShot for capture */}
              <ViewShot
                ref={membershipCardRef}
                options={{ format: 'png', quality: 1.0 }}
                style={{ marginHorizontal: responsiveFontSize(1) }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(STACKS.MEMBERSHIP_CARD)}
                >
                  {/* Card with metallic border */}
                  <LinearGradient
                    colors={tierConfig.borderColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      padding: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 8,
                    }}
                  >
                    {/* Inner white border */}
                    <View style={{
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.8)',
                      overflow: 'hidden',
                    }}>
                      {/* Background Image */}
                      <ImageBackground
                        source={tierConfig.background}
                        style={{ flex: 1, height: cardHeight }}
                        resizeMode="cover"
                      >
                        {/* Dark overlay */}
                        <View style={{
                          ...StyleSheet.absoluteFillObject,
                          backgroundColor: 'rgba(0,0,0,0.15)'
                        }} />

                        {/* Card Content */}
                        <View style={{ flex: 1, padding: 12 }}>

                          {/* Top Row: Logo and Profile Photo */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {/* Logo */}
                            <Image
                              source={LOGO_IMAGE}
                              style={{ width: 120, height: 40 }}
                              resizeMode="contain"
                            />

                            {/* Profile Photo with border */}
                            <LinearGradient
                              colors={tierConfig.borderColors}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                padding: 2,
                                borderRadius: 30,
                              }}
                            >
                              <View style={{
                                backgroundColor: '#fff',
                                padding: 2,
                                borderRadius: 28
                              }}>
                                {user?.images ? (
                                  <Image
                                    source={{ uri: `${BASE_URL}public/${user?.images}` }}
                                    style={{ width: 52, height: 52, borderRadius: 26 }}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={{ width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' }}>
                                    <FontAwesome name="user" size={32} color="#757575" />
                                  </View>
                                )}
                              </View>
                            </LinearGradient>
                          </View>

                          {/* Middle Section: Category & ID */}
                          <View style={{ marginTop: 4 }}>
                            {/* Category Label with SVG Gradient */}
                            <View style={{ height: 22, width: 200 }}>
                              <Svg height="100%" width="100%" viewBox="0 0 200 22">
                                <Defs>
                                  <SvgLinearGradient id="chromeGradientCat" x1="0" y1="0" x2="0" y2="1">
                                    {tierConfig.chromeGradient.map((stop, index) => (
                                      <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                    ))}
                                  </SvgLinearGradient>
                                </Defs>
                                {/* Shadow layer */}
                                <SvgText fill="#000000" fillOpacity="0.7" fontSize="15" fontWeight="900" fontStyle="italic" letterSpacing="1" x="1.5" y="17">
                                  {badgeText.toUpperCase()}
                                </SvgText>
                                {/* Main gradient text */}
                                <SvgText fill="url(#chromeGradientCat)" stroke="#000" strokeWidth="0.5" fontSize="15" fontWeight="900" fontStyle="italic" letterSpacing="1" x="0" y="15.5">
                                  {badgeText.toUpperCase()}
                                </SvgText>
                              </Svg>
                            </View>

                            {/* TM ID with SVG Gradient */}
                            <View style={{ height: 38, width: '100%', marginTop: 2 }}>
                              <Svg height="100%" width="100%" viewBox="0 0 340 38">
                                <Defs>
                                  <SvgLinearGradient id="chromeGradientId" x1="0" y1="0" x2="0" y2="1">
                                    {tierConfig.chromeGradient.map((stop, index) => (
                                      <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                    ))}
                                  </SvgLinearGradient>
                                </Defs>
                                {/* Shadow layer */}
                                <SvgText fill="#000000" fillOpacity="0.8" fontSize="28" fontWeight="900" letterSpacing="2" x="2" y="30">
                                  {uniqueId}
                                </SvgText>
                                {/* Main gradient text */}
                                <SvgText fill="url(#chromeGradientId)" stroke="#000" strokeWidth="0.8" fontSize="28" fontWeight="900" letterSpacing="2" x="0" y="28">
                                  {uniqueId}
                                </SvgText>
                              </Svg>
                            </View>
                          </View>

                          {/* Bottom Section: Name, Location, Validity */}
                          <View style={{
                            marginTop: 'auto',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                          }}>
                            {/* Left: Name, Location, License */}
                            <View style={{ flex: 1 }}>
                              {/* Name with SVG Gradient */}
                              <View style={{ height: 20, width: 200 }}>
                                <Svg height="100%" width="100%" viewBox="0 0 200 20">
                                  <Defs>
                                    <SvgLinearGradient id="chromeGradientName" x1="0" y1="0" x2="0" y2="1">
                                      {tierConfig.chromeGradient.map((stop, index) => (
                                        <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                      ))}
                                    </SvgLinearGradient>
                                  </Defs>
                                  <SvgText fill="#000000" fillOpacity="0.7" fontSize="14" fontWeight="900" letterSpacing="1" x="1" y="16">
                                    {userName}
                                  </SvgText>
                                  <SvgText fill="url(#chromeGradientName)" stroke="#000" strokeWidth="0.4" fontSize="14" fontWeight="900" letterSpacing="1" x="0" y="15">
                                    {userName}
                                  </SvgText>
                                </Svg>
                              </View>
                              <Text style={{
                                color: '#fff',
                                fontSize: responsiveFontSize(1.3),
                                fontWeight: '700',
                                marginTop: 1,
                                textShadowColor: 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                              }}>
                                {userLocation}
                              </Text>
                              <Text style={{
                                color: 'rgba(255, 255, 255, 1)',
                                fontSize: responsiveFontSize(1.3),
                                fontWeight: '900',
                                marginTop: 3,
                                textShadowColor: 'rgba(0,0,0,0.6)',
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 1,
                              }}>
                                {isTransporterRole ? (
                                  <Text style={{ fontWeight: '800', fontStyle: 'italic' }}>{displayValue}</Text>
                                ) : (
                                  <>{displayLabel}: <Text style={{ fontWeight: '800' }}>{displayValue}</Text></>
                                )}
                              </Text>
                            </View>

                            {/* Right: Validity Dates with SVG Gradient */}
                            <View style={{ alignItems: 'flex-end' }}>
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ alignItems: 'center' }}>
                                  <Text style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: responsiveFontSize(1.2),
                                    fontWeight: '800',
                                    letterSpacing: 0.5,
                                  }}>
                                    {t('validFrom')?.toUpperCase()}
                                  </Text>
                                  <View style={{ height: 16, width: 70, marginTop: 1 }}>
                                    <Svg height="100%" width="100%" viewBox="0 0 70 16">
                                      <Defs>
                                        <SvgLinearGradient id="chromeGradientDate1" x1="0" y1="0" x2="0" y2="1">
                                          {tierConfig.chromeGradient.map((stop, index) => (
                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                          ))}
                                        </SvgLinearGradient>
                                      </Defs>
                                      <SvgText fill="url(#chromeGradientDate1)" stroke="#000" strokeWidth="0.3" fontSize="12" fontWeight="900" x="35" y="13" textAnchor="middle">
                                        {startDate}
                                      </SvgText>
                                    </Svg>
                                  </View>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                  <Text style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: responsiveFontSize(1.2),
                                    fontWeight: '800',
                                    letterSpacing: 0.5,
                                  }}>
                                    {t('validUntil')?.toUpperCase()}
                                  </Text>
                                  <View style={{ height: 16, width: 70, marginTop: 1 }}>
                                    <Svg height="100%" width="100%" viewBox="0 0 70 16">
                                      <Defs>
                                        <SvgLinearGradient id="chromeGradientDate2" x1="0" y1="0" x2="0" y2="1">
                                          {tierConfig.chromeGradient.map((stop, index) => (
                                            <Stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                                          ))}
                                        </SvgLinearGradient>
                                      </Defs>
                                      <SvgText fill="url(#chromeGradientDate2)" stroke="#000" strokeWidth="0.3" fontSize="12" fontWeight="900" x="35" y="13" textAnchor="middle">
                                        {endDate}
                                      </SvgText>
                                    </Svg>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </ImageBackground>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </ViewShot>

              {/* Action Buttons - Invoice and Membership Card (Horizontal) */}
              <View style={{ paddingHorizontal: responsiveFontSize(1), marginTop: responsiveFontSize(1.5), flexDirection: 'row', gap: responsiveFontSize(1) }}>
                {/* Download Invoice Button */}
                <TouchableOpacity
                  onPress={downloadInvoice}
                  activeOpacity={0.85}
                  disabled={downloadingInvoice}
                  style={[
                    styles.premiumInvoiceButton,
                    {
                      opacity: downloadingInvoice ? 0.7 : 1,
                      flex: 1,
                      backgroundColor: colors.royalBlue,
                    }
                  ]}
                >
                  {downloadingInvoice ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="receipt" size={18} color="#FFFFFF" />
                      <Text style={[
                        styles.premiumInvoiceButtonText,
                        { fontSize: responsiveFontSize(1.5), marginLeft: 6, color: '#FFFFFF' }
                      ]}>
                        {t('downloadInvoice')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Share Membership Card Button */}
                <TouchableOpacity
                  onPress={() => shareMembershipCard('share')}
                  activeOpacity={0.85}
                  disabled={sharingCard}
                  style={[
                    styles.premiumInvoiceButton,
                    {
                      opacity: sharingCard ? 0.7 : 1,
                      flex: 1,
                      backgroundColor: colors.royalBlue,
                    }
                  ]}
                >
                  {sharingCard ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="share-social" size={18} color="#FFFFFF" />
                      <Text style={[
                        styles.premiumInvoiceButtonText,
                        { fontSize: responsiveFontSize(1.5), marginLeft: 6, color: '#FFFFFF' }
                      ]}>
                        {t('shareCard')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          );
        })()}

        {/* Account Section */}
        <SectionHeader title={t('account')} />
        <CardContainer>
          <MenuItem
            icon={<Feather name="user" size={20} color={colors.royalBlue} />}
            title={t('profile')}
            onPress={_navigateProfileOverview}
          />
          <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
          <MenuItem
            icon={<Feather name="edit-2" size={20} color={colors.royalBlue} />}
            title={t('editProfile') || 'Edit Profile'}
            onPress={_navigateProfileEdit}
          />
          {isDriver && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
              <MenuItem
                icon={<MaterialCommunityIcons name="card-account-details-outline" size={20} color="#059669" />}
                title={t('dlVerification')}
                onPress={_navigateDLVerification}
              />
              <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />

              {/* Upgrade Plan Logic */}
              {(() => {
                const amount = getPaidAmount();

                // If amount is >= 499, hide the button completely
                if (amount >= 499) return null;

                // Determine title based on subscription status
                const buttonTitle = amount > 0
                  ? t('upgradePlan')
                  : t('becomeTruckMitrMember');

                const iconName = amount > 0 ? "trophy-variant-outline" : "crown-outline";
                const iconColor = amount > 0 ? colors.royalBlue : "#FFD700"; // Gold for become member

                return (
                  <MenuItem
                    icon={<MaterialCommunityIcons name={iconName} size={20} color={iconColor} />}
                    title={buttonTitle}
                    onPress={_handleUpgradePlan}
                  />
                );
              })()}
            </>
          )}
        </CardContainer>
        {/* <TouchableOpacity
onPress={()=>{
  openOverlayPermission()
  console.log('pressed');
 
}}
>
  <Text>Enable Appear on Top</Text>
</TouchableOpacity> */}

        {/* <ZegoSendCallInvitationButton
          invitees={[{ userID: 'TM2512UPDR23435', userName: '"Abhishek"' }]}
          isVideoCall={true}
          resourceID={"TruckMitr"} // Please fill in the resource ID name that has been configured in the ZEGOCLOUD's console here.
        /> */}

        {/* General Section */}
        <SectionHeader title={t('general')} />
        <CardContainer>
          <MenuItem
            icon={<FontAwesome name="star-o" size={20} color="#FFD700" />}
            title={t('rateUs')}
            onPress={_navigateRating}
          />
          <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
          <MenuItem
            icon={<AntDesign name="customerservice" size={20} color="#34C759" />}
            title={t('contactUs')}
            onPress={_navigateContactUs}
          />
          <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
          <MenuItem
            icon={<Feather name="shield" size={20} color="#5856D6" />}
            title={t('privacyPolicy')}
            onPress={_navigatePrivacy}
          />
          <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
          <MenuItem
            icon={<Ionicons name="settings-outline" size={20} color="#8E8E93" />}
            title={t('settings')}
            onPress={_navigateSetting}
          />
        </CardContainer>

        {/* Share Section */}
        <SectionHeader title={t('sharing')} />
        <CardContainer>
          <MenuItem
            icon={<Ionicons name="share-social-outline" size={20} color={colors.azureBlue} />}
            title={t('shareTheApp')}
            onPress={_onPressShareApp}
          />
          <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
          {/* <MenuItem
            icon={<Ionicons name="person-circle-outline" size={20} color={colors.royalBlue} />}
            title={t('shareMyProfile')}
            onPress={_onPressShareProfile}
          /> */}
        </CardContainer>

        {/* Account Actions Section */}
        <SectionHeader title={t('logins')} />
        <CardContainer>
          <MenuItem
            icon={<MaterialCommunityIcons name="logout" size={20} color={colors.royalBlue} />}
            title={t('logout')}
            onPress={_onPressLogout}
          />
          <View style={[styles.divider, { backgroundColor: colors.blackOpacity(0.06) }]} />
          <MenuItem
            icon={<MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />}
            title={t('deleteAccount')}
            onPress={_onPressDeleteAccount}
            textColor="#FF3B30"
          />
        </CardContainer>

        <Space height={responsiveHeight(8)} />
      </ScrollView >
    </View>
  )
}

const styles = StyleSheet.create({
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  avatarImage: {
    borderRadius: 100,
  },
  completionBadge: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  completionText: {
    fontWeight: '700',
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  userName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  userId: {
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontWeight: '600',
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    gap: 4,
  },
  rankText: {
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Incomplete Card
  incompleteCard: {
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  incompleteCardContent: {
    padding: 16,
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  incompleteSubtitle: {
    flex: 1,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  completeButtonText: {
    fontWeight: '600',
  },

  // Membership Card
  membershipCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  subscribedRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomRightRadius: 10,
    gap: 4,
  },
  subscribedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  membershipTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  membershipSubtitle: {},
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  priceText: {
    fontWeight: '800',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  durationText: {
    marginTop: 2,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  dateContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {},
  dateValue: {
    fontWeight: '500',
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  invoiceButtonText: {
    fontWeight: '600',
  },

  // Premium Membership Card Styles
  premiumCardBorder: {
    borderRadius: 20,
    padding: 3,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  premiumMembershipCard: {
    borderRadius: 17,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumSubscribedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  premiumSubscribedText: {
    color: '#1a1a2e',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  premiumMembershipTitle: {
    color: '#D4AF37',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  premiumMembershipSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  premiumPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  premiumPriceText: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  premiumOriginalPrice: {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
    fontWeight: '400',
    marginLeft: 6,
  },
  premiumDurationText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  premiumSavingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  premiumSavingsText: {
    color: '#0a1628',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumDateContainer: {
    alignItems: 'flex-start',
  },
  premiumDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumDateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumDateLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  premiumDateValue: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  premiumInvoiceButtonWrapper: {
    borderRadius: 14,
    padding: 3,
    overflow: 'hidden',
  },
  premiumInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 11,
    overflow: 'hidden',
  },
  premiumInvoiceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
    overflow: 'hidden',
  },
  premiumInvoiceButtonText: {
    color: '#0a1628',
    fontWeight: '700',
  },

  // New Dynamic Membership Card Styles
  membershipCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dynamicMembershipCard: {
    borderRadius: 28,
    overflow: 'visible',
  },
  cardMetallicBorder: {
    flex: 1,
    borderRadius: 28,
    padding: 3,
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  cardInnerBorder: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardGradientBackground: {
    flex: 1,
    position: 'relative',
  },
  cardDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.17)',
    borderRadius: 25,
  },
  cardContentRow: {
    flex: 1,
    flexDirection: 'row',
    padding: 18,
  },
  cardLeftSection: {
    flex: 65,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  cardRightSection: {
    position: 'absolute',
    top: 4,
    right: 4,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: -4,
  },
  cardLogoArea: {
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  cardLogoImage: {
    width: 120,
    height: 40,
  },
  cardIdCodeSection: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
  cardMemberInfo: {
    marginTop: 'auto',
  },
  cardMemberLocation: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardPhotoMetallicBorder: {
    padding: 2,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  cardPhotoInnerFrame: {
    backgroundColor: '#FFFFFF',
    padding: 2,
    borderRadius: 28,
  },
  cardPhotoImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  cardValidityAbsContainer: {
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  cardDatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardValidityBlock: {
    alignItems: 'center',
  },
  cardValidityLabelAbs: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: -2,
    lineHeight: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  // Section & Menu
  sectionHeader: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  cardContainer: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },

  // Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelButton: {},
  dialogConfirmButton: {},
  dialogButtonText: {
    fontWeight: '600',
  },
});