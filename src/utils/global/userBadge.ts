/**
 * Utility function to get user badge text based on role and subscription
 */

export interface UserBadgeParams {
  user: {
    role?: string;
    plan_id?: number | string;
    subscription_plan_id?: string | number;
    payment_type?: string;
    is_active?: number | boolean;
    subscription_status?: string;
  };
  subscriptionDetails?: {
    id?: string;
    payment_id?: string;
    amount?: string | number;
    hasActiveSubscription?: boolean;
    showSubscriptionModel?: boolean;
    payment_details?: {
      amount?: number;
    };
    payment_type?: string;
    subscription_plan_id?: string | number;
  };
  isDriver?: boolean;
}

/**
 * Get the actual paid amount from subscription
 */
const getPaidAmount = (subscriptionDetails: any, isDriver: boolean): number => {
  // Amount is stored directly on subscription object as string (e.g., "99.00")
  if (subscriptionDetails?.amount) {
    return parseFloat(subscriptionDetails.amount);
  }
  // Fallback to payment_details.amount (in paise, needs /100)
  if (subscriptionDetails?.payment_details?.amount) {
    return subscriptionDetails.payment_details.amount / 100;
  }
  // Default fallback
  return isDriver ? 199 : 499;
};

/**
 * Capitalize first letter of a string
 */
const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Get user badge text based on role and subscription
 * 
 * Logic:
 * - Transporter:
 *   - No subscription: show role only
 *   - Amount 99/100/1: "Legacy Transporter"
 *   - Amount 499: "Transporter Pro"
 * 
 * - Driver:
 *   - No subscription: show role only
 *   - Amount 1/49/100: "Legacy Driver"
 *   - Amount 199: "Verified Driver"
 *   - Amount 499: "Trusted Driver"
 */
export const getUserBadgeText = ({ user, subscriptionDetails, isDriver }: UserBadgeParams): string => {
  const userRole = capitalizeFirst(user?.role || '');

  // Check if user has subscription
  const hasSub = subscriptionDetails && (subscriptionDetails?.id || subscriptionDetails?.payment_id);

  if (!hasSub) {
    // No subscription - show role only
    return userRole;
  }

  // Get paid amount
  const paidAmount = getPaidAmount(subscriptionDetails, isDriver || false);
  const role = user?.role?.toLowerCase();

  if (role === 'transporter') {
    // Transporter logic
    if (paidAmount === 99 || paidAmount === 100 || paidAmount === 1) {
      return 'Legacy Transporter';
    }
    if (paidAmount === 499) {
      return 'Transporter Pro';
    }
    // Default for transporter with subscription but unrecognized amount
    return userRole;
  }

  if (role === 'driver') {
    // Driver logic
    if (paidAmount === 1 || paidAmount === 49 || paidAmount === 100) {
      return 'Legacy Driver';
    }
    if (paidAmount === 99) {
      return 'Job Ready Driver';
    }
    if (paidAmount === 199) {
      return 'Verified Driver';
    }
    if (paidAmount === 499) {
      return 'Trusted Driver';
    }
    // Default for driver with subscription but unrecognized amount
    return userRole;
  }

  if (role === 'foreman') {
    // Foreman logic
    // Check amounts or explicit plan indicators
    const isPro =
      paidAmount === 999 ||
      user?.plan_id == 11 ||
      user?.subscription_plan_id == 11 ||
      user?.payment_type === 'foreman_pro' ||
      subscriptionDetails?.payment_type === 'foreman_pro' ||
      subscriptionDetails?.subscription_plan_id == 11;

    if (isPro) {
      return 'Foreman Pro';
    }
    return userRole;
  }

  // Fallback for unknown roles
  return userRole;
};

/**
 * Get user tier type for internal use
 */
export type TierType = 'JOB READY' | 'VERIFIED' | 'TRUSTED' | 'LEGACY' | 'TRANSPORTER PRO' | 'FOREMAN PRO';

export const getUserTier = ({ user, subscriptionDetails, isDriver }: UserBadgeParams): TierType => {
  const hasSub = subscriptionDetails && (subscriptionDetails?.id || subscriptionDetails?.payment_id);

  if (!hasSub) {
    return 'JOB READY';
  }

  const paidAmount = getPaidAmount(subscriptionDetails, isDriver || false);
  const role = user?.role?.toLowerCase();

  if (role === 'transporter') {
    if (paidAmount === 99 || paidAmount === 100 || paidAmount === 1) {
      return 'LEGACY';
    }
    if (paidAmount === 499) {
      return 'TRANSPORTER PRO';
    }
    return 'JOB READY';
  }

  if (role === 'driver') {
    if (paidAmount === 1 || paidAmount === 49 || paidAmount === 100) {
      return 'LEGACY';
    }
    if (paidAmount === 199) {
      return 'VERIFIED';
    }
    if (paidAmount === 499) {
      return 'TRUSTED';
    }
    return 'JOB READY';
  }

  if (role === 'foreman') {
    if (paidAmount === 999) {
      return 'FOREMAN PRO';
    }
    return 'JOB READY';
  }

  return 'JOB READY';
};

/**
 * Check if user should show membership card
 * Currently only drivers get cards, but future-ready for transporters
 */
export const shouldShowMembershipCard = ({ user, subscriptionDetails, isDriver }: UserBadgeParams): boolean => {
  const role = user?.role?.toLowerCase();

  // Check if user has subscription
  const hasSub = subscriptionDetails && (subscriptionDetails?.id || subscriptionDetails?.payment_id);
  const hasActiveSubscription = Boolean(subscriptionDetails?.hasActiveSubscription || !subscriptionDetails?.showSubscriptionModel);

  if (role === 'driver') {
    // Drivers get cards when they have active subscription and subscription ID
    return Boolean(isDriver && hasActiveSubscription && hasSub);
  }

  if (role === 'transporter') {
    // Future: Transporters will get cards based on similar logic
    // To enable transporter cards, simply change this to:
    // return Boolean(hasActiveSubscription && hasSub);
    return Boolean(hasActiveSubscription && hasSub);
  }

  if (role === 'foreman') {
    return Boolean(hasActiveSubscription && hasSub);
  }

  return false;
};

/**
 * Get membership card tier configuration
 * Maps our utility tiers to card display properties
 */
export interface MembershipCardConfig {
  tier: TierType;
  displayName: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
}

/**
 * Get membership card share text for sharing on social media
 * Dynamically inserts the user's badge text into the message
 */
export const getMembershipShareText = (params: UserBadgeParams, language: 'en' | 'hi' = 'en'): string => {
  const badgeText = getUserBadgeText(params);
  const role = params.user?.role?.toLowerCase();
  const isDriver = role === 'driver';
  const isForeman = role === 'foreman';

  if (language === 'hi') {
    if (isDriver) {
      return `🚛 मुझे TruckMitr के साथ एक ${badgeText} होने पर गर्व है! 🇮🇳

अब मेरी पहचान सिर्फ एक ड्राइवर की नहीं, बल्कि एक Verified और Trusted Driver की है।
TruckMitr ने मुझे एक Digital Driver Card दिया है, जिससे ट्रांसपोर्टर मुझ पर आसानी से भरोसा कर सकते हैं।

✅ ज्यादा नौकरी के मौके
✅ पहचान और सम्मान
✅ ट्रेनिंग और ग्रोथ
✅ ट्रांसपोर्टर्स से सीधा संपर्क

अगर आप भी एक ड्राइवर हैं और चाहते हैं
👉 बेहतर नौकरी
👉 पहचान
👉 और भरोसा

तो आज ही TruckMitr App डाउनलोड करें 👇
📲 https://play.google.com/store/apps/details?id=com.truckmitr

TruckMitr – ड्राइवर का साथी, हर सफर में भरोसा 🚚💪`;
    } else if (isForeman) {
      return `👷 मुझे TruckMitr के साथ एक ${badgeText} होने पर गर्व है! 🇮🇳

अब मैं सिर्फ एक फोरमैन नहीं, बल्कि एक प्रोफेशनल और विश्वसनीय लीडर हूँ।
TruckMitr ने मुझे एक Digital Pro Card दिया है।

✅ बेहतर प्रोजेक्ट अवसर
✅ पेशेवर पहचान
✅ विशेष टूल्स तक पहुंच
✅ बेहतर कमाई

यदि आप भी एक फोरमैन हैं और आगे बढ़ना चाहते हैं,
तो आज ही TruckMitr App डाउनलोड करें 👇
📲 https://play.google.com/store/apps/details?id=com.truckmitr`;
    } else {
      // Transporter
      return `🚛 मुझे TruckMitr के साथ एक ${badgeText} होने पर गर्व है! 🇮🇳

अब मेरा बिज़नेस सिर्फ ट्रांसपोर्ट नहीं, बल्कि Trust और Reliability का प्रतीक है।
TruckMitr ने मुझे एक Digital Business Card दिया है, जिससे ड्राइवर और क्लाइंट मुझ पर आसानी से भरोसा कर सकते हैं।

✅ Verified ड्राइवरों तक पहुंच
✅ बिज़नेस की विश्वसनीयता और पहचान
✅ आसान ड्राइवर मैनेजमेंट
✅ भरोसेमंद ड्राइवरों से सीधा संपर्क

अगर आप भी एक ट्रांसपोर्टर हैं और चाहते हैं
👉 Verified ड्राइवर
👉 बिज़नेस ग्रोथ
👉 और भरोसा

तो आज ही TruckMitr App डाउनलोड करें 👇
📲 https://play.google.com/store/apps/details?id=com.truckmitr

TruckMitr – ट्रांसपोर्टर्स को भरोसेमंद ड्राइवरों से जोड़ता है 🚚💪`;
    }
  }

  // English
  if (isDriver) {
    return `🚛 I am proud to be a ${badgeText} with TruckMitr! 🇮🇳

Now my identity is not just that of a driver, but a Verified & Trusted Driver.
TruckMitr has given me a Digital Driver Card, which helps transporters trust me easily.

✅ More job opportunities
✅ Identity and respect
✅ Training and growth
✅ Direct connection with transporters

If you are also a driver and want
👉 Better jobs
👉 Recognition
👉 And trust

then download the TruckMitr App today 👇
📲 https://play.google.com/store/apps/details?id=com.truckmitr

TruckMitr – A Driver's Companion, Trust for Every Journey 🚚💪`;
  } else if (isForeman) {
    return `👷 I am proud to be a ${badgeText} with TruckMitr! 🇮🇳

I am not just a foreman anymore, but a professional and trusted leader.
TruckMitr has given me a Digital Pro Card.

✅ Better project opportunities
✅ Professional recognition
✅ Access to exclusive tools
✅ Higher earnings

If you are also a foreman and want to grow,
download the TruckMitr App today 👇
📲 https://play.google.com/store/apps/details?id=com.truckmitr`;
  } else {
    // Transporter
    return `🚛 I am proud to be a ${badgeText} with TruckMitr! 🇮🇳

Now my business is not just about transport, but about Trust & Reliability.
TruckMitr has given me a Digital Business Card, which helps drivers and clients trust me easily.

✅ Access to verified drivers
✅ Business credibility and recognition
✅ Easy driver management
✅ Direct connection with trusted drivers

If you are also a transporter and want
👉 Verified drivers
👉 Business growth
👉 And trust

then download the TruckMitr App today 👇
📲 https://play.google.com/store/apps/details?id=com.truckmitr

TruckMitr – Connecting Transporters with Trusted Drivers 🚚💪`;
  }
};

export const getMembershipCardConfig = (params: UserBadgeParams): MembershipCardConfig | null => {
  if (!shouldShowMembershipCard(params)) {
    return null;
  }

  const tier = getUserTier(params);
  const role = params.user?.role?.toLowerCase();

  // Driver card configurations
  if (role === 'driver') {
    switch (tier) {
      case 'TRUSTED':
        return {
          tier,
          displayName: 'Trusted Driver',
          backgroundColor: '#1a237e', // Deep blue
          textColor: '#ffffff',
          borderColor: '#ffd700' // Gold border
        };
      case 'VERIFIED':
        return {
          tier,
          displayName: 'Verified Driver',
          backgroundColor: '#2e7d32', // Green
          textColor: '#ffffff',
          borderColor: '#4caf50'
        };
      case 'LEGACY':
        return {
          tier,
          displayName: 'Legacy Driver',
          backgroundColor: '#5d4037', // Brown
          textColor: '#ffffff',
          borderColor: '#8d6e63'
        };
      default:
        return {
          tier: 'JOB READY',
          displayName: 'Job Ready Driver',
          backgroundColor: '#1976d2', // Blue
          textColor: '#ffffff',
          borderColor: '#42a5f5'
        };
    }
  }

  if (role === 'foreman') {
    switch (tier) {
      case 'FOREMAN PRO':
        return {
          tier,
          displayName: 'Foreman Pro',
          backgroundColor: '#374151', // Dark Gray
          textColor: '#ffffff',
          borderColor: '#FCD34D' // Amber
        };
      default:
        return {
          tier: 'JOB READY',
          displayName: 'Foreman',
          backgroundColor: '#4B5563',
          textColor: '#ffffff',
          borderColor: '#9CA3AF'
        };
    }
  }

  // Future: Transporter card configurations
  if (role === 'transporter') {
    switch (tier) {
      case 'TRANSPORTER PRO':
        return {
          tier,
          displayName: 'Transporter Pro',
          backgroundColor: '#4a148c', // Purple
          textColor: '#ffffff',
          borderColor: '#ffd700'
        };
      case 'LEGACY':
        return {
          tier,
          displayName: 'Legacy Transporter',
          backgroundColor: '#5d4037', // Brown
          textColor: '#ffffff',
          borderColor: '#8d6e63'
        };
      default:
        return {
          tier: 'JOB READY',
          displayName: 'Transporter',
          backgroundColor: '#1976d2',
          textColor: '#ffffff',
          borderColor: '#42a5f5'
        };
    }
  }

  return null;
};