import analytics from '@react-native-firebase/analytics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { NavigatorParams, STACKS } from '@truckmitr/src/stacks/stacks';
import { STATICS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<
  NavigatorParams,
  keyof NavigatorParams
>;

// --- Constants & Colors ---
const COLORS = {
  background: '#FAFBFC',
  white: '#FFFFFF',
  text: '#1A202C',
  textMuted: '#718096',
  border: '#E2E8F0',
  primary: '#4F46E5', // Indigo
  success: '#089720ff', // Emerald
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  base: '#f2a50bff', // Orange
  verified: '#348f02ff', // Green
  trusted: '#2563EB', // Royal Blue
  verifiedBg: '#ECFDF5',
  trustedBg: '#EFF6FF',
  baseBg: '#FFF7ED',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// --- Plan Data Configuration (with translations) ---
const getPlanData = (t: (key: string) => string) => [
  {
    id: 99,
    tier: 'base',
    name: t('subJobReadyDriver'),
    subtitle: t('subJobReadySubtitle'),
    tagline: t('subJobReadyTagline'),
    badge: '🚛',
    price: 99,
    duration: t('subYear'),
    intro: t('subJobReadyIntro'),
    benefits: [
      t('subBenefitCreateProfileDrive'),
      t('subBrowse5Jobs'),
      t('subBenefitContactInApp'),
      t('subBenefitBasicTraining'),
      t('subBenefitStayJobReady'),
    ],
    footerNotes: [
      t('subFooterNoVerification'),
      t('subFooterChooseJobs')
    ],
    ctaText: t('subGetJobReady'),
    color: COLORS.base,
    bgColor: COLORS.baseBg,
    gradient: ['#ccc207ff', '#f5fb3cff'],
  },
  {
    id: 199,
    tier: 'verified',
    name: t('subVerifiedDriverName'),
    subtitle: t('subVerifiedSubtitle'),
    tagline: t('subVerifiedTagline'),
    badge: '✅',
    price: 199,
    duration: t('subYear'),
    intro: t('subVerifiedIntro'),
    benefits: [
      t('subBenefitCreateProfileDrive'),
      t('subBrowse20Jobs'),
      t('subBenefitOneTimeVerification'),
      t('subBenefitVerifiedBadge'),
      t('subBenefitHigherTrust'),
      t('subBenefitBetterShortlisting'),
      t('subBenefitSupportTruckMitr'),
    ],
    footerNotes: [
      t('subFooterVerifyAfterUpload'),
      t('subFooterOtpVerify'),
      t('subFooterNoJobGuarantee')
    ],
    ctaText: t('subBecomeVerified'),
    color: COLORS.verified,
    bgColor: COLORS.verifiedBg,
    gradient: ['#348f02ff', '#34D399'],
  },
  {
    id: 499,
    tier: 'trusted',
    name: t('subTrustedName'),
    subtitle: t('subTrustedSubtitle'),
    tagline: t('subTrustedTagline'),
    badge: '🛡️',
    price: 499,
    duration: t('subYear'),
    intro: t('subTrustedIntro'),
    benefits: [
      t('subBenefitCreateProfileDrive'),
      t('subBrowseUnlimitedJobs'),
      t('subBenefitDigitalCourtCheck'),
      t('subBenefitDigitalAddressVerify'),
      t('subBenefitHomePhotoGeo'),
      t('subBenefitTrustedBadge'),
      t('subBenefitHighestCredibility'),
      t('subBenefitPriorityPremium'),
    ],
    footerNotes: [
      t('subFooterDigitalProcess'),
      t('subFooterFollowInstructions'),
      t('subFooterImproveConfidence')
    ],
    ctaText: t('subBecomeTrusted'),
    color: COLORS.trusted,
    bgColor: COLORS.trustedBg,
    gradient: ['#2563EB', '#60A5FA'],
  },
];

const getComparisonData = (t: (key: string) => string) => ({
  columns: [t('subFeature'), t('subJobReadyName'), t('subVerifiedName'), t('subTrustedName')],
  rows: [
    { label: t('subJobAccess'), values: ['5', '20', t('subUnlimited')] },
    { label: t('subProfileVisibility'), values: [t('subBasic'), t('subHigher'), t('subHighest')] },
    { label: t('subIdVerification'), values: [false, true, true] },
    { label: t('subCourtCheck'), values: [false, false, true] },
    { label: t('subAddressVerification'), values: [false, false, true] },
    { label: t('subTransporterTrust'), values: [t('subLow'), t('subMedium'), t('subHigh')] },
    { label: t('subPrice'), values: ['₹99', '₹199', '₹499'] },
  ],
});

// --- Loading Overlay Component ---
const LoadingOverlay = ({ visible, t }: { visible: boolean; t: (key: string) => string }) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.loadingOverlay}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('subOpeningPaymentGateway')}</Text>
      </View>
    </Animated.View>
  );
};

// --- Consent Modal Component ---
const ConsentModal = ({
  visible,
  onClose,
  safeAreaInsets,
}: {
  visible: boolean;
  onClose: () => void;
  safeAreaInsets: { top: number; bottom: number };
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      fetchConsentContent();
    }
  }, [visible]);

  const fetchConsentContent = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(END_POINTS.SUBSCRIPTION_CONSENT);
      const data = response?.data;

      // Try different response structures
      let htmlContent = '';
      if (data?.data?.content) {
        htmlContent = data.data.content;
      } else if (data?.content) {
        htmlContent = data.content;
      } else if (data?.data?.description) {
        htmlContent = data.data.description;
      } else if (data?.description) {
        htmlContent = data.description;
      } else if (data?.data?.html) {
        htmlContent = data.data.html;
      } else if (data?.html) {
        htmlContent = data.html;
      } else if (typeof data?.data === 'string') {
        htmlContent = data.data;
      } else if (typeof data === 'string') {
        htmlContent = data;
      }

      setContent(htmlContent || '<p>No content available.</p>');
    } catch (error) {
      console.error('Error fetching consent content:', error);
      setContent('<p>Unable to load content. Please try again later.</p>');
    } finally {
      setLoading(false);
    }
  };

  const tagsStyles = {
    body: {
      color: COLORS.text,
      fontSize: 15,
      lineHeight: 24,
    },
    p: {
      marginBottom: 12,
      color: COLORS.text,
    },
    h1: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: COLORS.text,
      marginBottom: 16,
      marginTop: 20,
    },
    h2: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: COLORS.text,
      marginBottom: 12,
      marginTop: 16,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: COLORS.text,
      marginBottom: 10,
      marginTop: 14,
    },
    ul: {
      marginBottom: 12,
      paddingLeft: 8,
    },
    ol: {
      marginBottom: 12,
      paddingLeft: 8,
    },
    li: {
      marginBottom: 6,
      color: COLORS.text,
    },
    strong: {
      fontWeight: '700' as const,
      color: COLORS.text,
    },
    a: {
      color: COLORS.primary,
    },
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={[styles.consentModalContainer, { paddingTop: safeAreaInsets.top }]}>
        {/* Header */}
        <View style={styles.consentModalHeader}>
          <Text style={styles.consentModalTitle}>{t('subTermsDisclaimer')}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.consentModalCloseBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.consentModalLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.consentModalLoadingText}>{t('loading')}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.consentModalScroll}
            contentContainerStyle={[
              styles.consentModalScrollContent,
              { paddingBottom: safeAreaInsets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={true}
          >
            {content ? (
              <RenderHtml
                contentWidth={screenWidth - 48}
                source={{ html: content }}
                tagsStyles={tagsStyles}
              />
            ) : (
              <Text style={{ color: COLORS.text, fontSize: 15 }}>{t('subNoContentAvailable')}</Text>
            )}
          </ScrollView>
        )}

        {/* Close Button at Bottom */}
        <View style={[styles.consentModalFooter, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={styles.consentModalDoneBtn}
          >
            <LinearGradient
              colors={[COLORS.primary, '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.consentModalDoneBtnGradient}
            >
              <Text style={styles.consentModalDoneBtnText}>{t('subIUnderstand')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- Sub-Components ---

const FeatureTable = React.memo(({ responsiveFontSize, t }: { responsiveFontSize: (s: number) => number; t: (key: string) => string }) => {
  const comparisonData = getComparisonData(t);

  return (
    <View style={styles.tableContainer}>
      <Text style={[styles.tableTitle, { fontSize: responsiveFontSize(2.2) }]}>
        {t('subComparePlans')}
      </Text>

      {/* Header Row */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'left' }]}>{comparisonData.columns[0]}</Text>
        <Text style={[styles.tableHeaderCell, { color: COLORS.base }]}>{comparisonData.columns[1]}</Text>
        <Text style={[styles.tableHeaderCell, { color: COLORS.verified }]}>{comparisonData.columns[2]}</Text>
        <Text style={[styles.tableHeaderCell, { color: COLORS.trusted }]}>{comparisonData.columns[3]}</Text>
      </View>

      {/* Data Rows */}
      {comparisonData.rows.map((row: { label: string; values: (string | boolean)[] }, idx: number) => (
        <View key={idx} style={[styles.tableRow, idx === comparisonData.rows.length - 1 && styles.tableRowLast]}>
          <Text style={[
            styles.tableCellLabel,
            { fontSize: responsiveFontSize(1.5) },
          ]}>
            {row.label}
          </Text>

          {row.values.map((val: string | boolean, vIdx: number) => (
            <View key={vIdx} style={styles.tableCell}>
              {typeof val === 'boolean' ? (
                val ? <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  : <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
              ) : (
                <Text style={[
                  styles.tableCellValue,
                  { fontSize: responsiveFontSize(1.5) },
                ]}>
                  {val}
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

const BulletPoint = ({ text, color }: { text: string; color: string }) => (
  <View style={styles.bulletRow}>
    <Ionicons name="checkmark-circle" size={18} color={color} style={{ marginTop: 1 }} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

// --- Transporter Subscription Modal Component (Clean White UI) ---
const TransporterSubscriptionModal = ({
  visible,
  onClose,
  onSubscribe,
  isLoading,
  safeAreaInsets,
  responsiveFontSize,
  consentChecked,
  onConsentToggle,
  onOpenConsent,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  isLoading: boolean;
  safeAreaInsets: { top: number; bottom: number };
  responsiveFontSize: (s: number) => number;
  consentChecked: boolean;
  onConsentToggle: () => void;
  onOpenConsent: () => void;
  t: (key: string) => string;
}) => {
  const benefits = [
    {
      icon: '✔',
      title: t('transporterFeatureVerifiedDrivers') || 'Verified Drivers',
      desc: t('transporterFeatureVerifiedDriversDesc') || 'Driving License, ID & Face verification. Court & address checks (where applicable). Hire with confidence.',
    },
    {
      icon: '✔',
      title: t('transporterFeatureSmartHiring') || 'Smart Driver Hiring',
      desc: t('transporterFeatureSmartHiringDesc') || 'View detailed driver profiles. Shortlist and hire faster. No brokers, no fake calls.',
    },
    {
      icon: '✔',
      title: t('transporterFeatureInAppCall') || 'In-App Call & Video Interview',
      desc: t('transporterFeatureInAppCallDesc') || 'Call or video interview drivers securely. Take hiring decisions instantly.',
    },
    {
      icon: '✔',
      title: t('transporterFeatureFullAccess') || 'Full Platform Access',
      desc: t('transporterFeatureFullAccessDesc') || 'Post driver jobs. Contact and manage drivers. Browse a large pool of drivers.',
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[tStyles.container, { paddingTop: safeAreaInsets.top }]}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={tStyles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[tStyles.scrollContent, { paddingBottom: safeAreaInsets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={tStyles.header}>
            <Text style={[tStyles.badge, { fontSize: responsiveFontSize(1.8) }]}>🚚 {t('transporterProBadge') || 'TRANSPORTER PRO'}</Text>
            <Text style={[tStyles.title, { fontSize: responsiveFontSize(2.8) }]}>
              {t('transporterHeroSubtitle') || 'Hire Drivers Without Worry'}
            </Text>
            <View style={tStyles.priceRow}>
              <Text style={[tStyles.price, { fontSize: responsiveFontSize(4.2) }]}>₹499</Text>
              <Text style={[tStyles.duration, { fontSize: responsiveFontSize(1.8) }]}> / {t('quarterly') || 'Quarterly'}</Text>
            </View>
            <Text style={[tStyles.tagline, { fontSize: responsiveFontSize(1.6) }]}>
              {t('transporterTagline') || 'One subscription that gives you verified drivers, secure hiring, and complete peace of mind.'}
            </Text>
          </View>

          {/* What You Get Section */}
          <View style={tStyles.section}>
            <Text style={[tStyles.sectionTitle, { fontSize: responsiveFontSize(2.2) }]}>
              🔐 {t('transporterWhatYouGet') || 'What You Get'}
            </Text>

            {benefits.map((item, index) => (
              <View key={index} style={tStyles.benefitRow}>
                <Text style={[tStyles.checkIcon, { fontSize: responsiveFontSize(1.8) }]}>{item.icon}</Text>
                <View style={tStyles.benefitContent}>
                  <Text style={[tStyles.benefitTitle, { fontSize: responsiveFontSize(1.8) }]}>{item.title}</Text>
                  <Text style={[tStyles.benefitDesc, { fontSize: responsiveFontSize(1.5) }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Additional Benefits */}
          <View style={tStyles.section}>
            <View style={tStyles.benefitRow}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={[tStyles.simpleBenefit, { fontSize: responsiveFontSize(1.7) }]}>
                {t('transporterBenefit1') || 'Hire faster, with less dependency on brokers'}
              </Text>
            </View>
            <View style={tStyles.benefitRow}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={[tStyles.simpleBenefit, { fontSize: responsiveFontSize(1.7) }]}>
                {t('transporterBenefit2') || 'Use all current & future features'}
              </Text>
            </View>
          </View>

          {/* Trust Section */}
          <View style={tStyles.trustBox}>
            <Text style={[tStyles.trustTitle, { fontSize: responsiveFontSize(1.8) }]}>
              💼 {t('transporterTrustTitle') || 'Built for Transporters Who Value Safety'}
            </Text>
            <Text style={[tStyles.trustDesc, { fontSize: responsiveFontSize(1.5) }]}>
              {t('transporterTrustDesc') || 'Reduce risk. Save time. Build a trusted driver network.'}
            </Text>
          </View>

          {/* Consent */}
          <View style={tStyles.consentRow}>
            <TouchableOpacity onPress={onConsentToggle} activeOpacity={0.7}>
              <View style={[tStyles.checkbox, consentChecked && tStyles.checkboxChecked]}>
                {consentChecked && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
              </View>
            </TouchableOpacity>
            <Text style={[tStyles.consentText, { fontSize: responsiveFontSize(1.5) }]}>
              {t('subTransporterConsentText') || 'I agree to the '}{' '}
              <Text style={tStyles.consentLink} onPress={onOpenConsent}>
                {t('subTermsAndConditions') || 'subscription terms and disclaimer'}
              </Text>
              {' '}{t('subAuthorizePayments') || 'and authorize payments'}
            </Text>
          </View>
        </ScrollView>

        {/* CTA Button */}
        <View style={[tStyles.ctaContainer, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={onSubscribe}
            activeOpacity={consentChecked ? 0.9 : 1}
            disabled={!consentChecked || isLoading}
            style={[tStyles.ctaButton, { opacity: consentChecked ? 1 : 0.5 }]}
          >
            <LinearGradient
              colors={[COLORS.trusted, '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tStyles.ctaGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={[tStyles.ctaText, { fontSize: responsiveFontSize(2.0) }]}>
                  👉 {t('transporterSubscribeNow') || 'Subscribe Now'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={tStyles.secureRow}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.success} />
            <Text style={[tStyles.secureText, { fontSize: responsiveFontSize(1.4) }]}>
              {t('subSecurePayment') || 'Secure payment powered by Razorpay'}
            </Text>
          </View>
        </View>

        <LoadingOverlay visible={isLoading} t={t} />
      </View>
    </Modal>
  );
};

// --- Clean Transporter Modal Styles ---
const tStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    color: COLORS.trusted,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontWeight: '900',
    color: COLORS.trusted,
  },
  duration: {
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tagline: {
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  checkIcon: {
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  benefitDesc: {
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  simpleBenefit: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  trustBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  trustTitle: {
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  trustDesc: {
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentText: {
    flex: 1,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  consentLink: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 14,
    shadowColor: COLORS.trusted,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaGradient: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontWeight: '700',
    color: COLORS.white,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  secureText: {
    color: COLORS.textMuted,
  },
});

// Plan data type definition
interface PlanDataType {
  id: number;
  tier: string;
  name: string;
  subtitle: string;
  tagline: string;
  badge: string;
  price: number;
  duration: string;
  intro: string;
  benefits: string[];
  ctaText: string;
  color: string;
  bgColor: string;
  gradient: string[];
  is_recurring?: number | boolean;
  footerNotes?: string[];
}

const PlanCard = React.memo(({
  plan,
  isExpanded,
  onToggle,
  onSelect,
  responsiveFontSize,
  isPopular,
  consentChecked,
  onConsentToggle,
  onOpenConsent,
  isCurrentPlan
}: {
  plan: PlanDataType;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  responsiveFontSize: (s: number) => number;
  isPopular?: boolean;
  consentChecked: boolean;
  onConsentToggle: () => void;
  onOpenConsent: () => void;
  isCurrentPlan?: boolean;
}) => {
  const { t } = useTranslation();
  const rotation = useSharedValue(isExpanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 250 });
  }, [isExpanded]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[
      styles.cardContainer,
      { borderColor: plan.tier === 'base' ? plan.color : styles.cardContainer.borderColor },
      isExpanded && styles.cardContainerExpanded,
      isExpanded && { borderColor: plan.color },
      isPopular && styles.cardPopular
    ]}>
      {isCurrentPlan ? (
        <View style={[styles.popularBadge, { backgroundColor: COLORS.success }]}>
          <Text style={styles.popularBadgeText}>{t('currentPlan') || 'Current Plan'}</Text>
        </View>
      ) : isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>{t('subMostPopular')}</Text>
        </View>
      )}

      {/* Header (Always Visible) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onToggle}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderContent}>
          <View style={styles.cardHeaderTop}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.badgeContainer, { backgroundColor: plan.bgColor }]}>
                <Text style={styles.cardBadgeEmoji}>{plan.badge}</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(2), textTransform: 'uppercase' }]}>{plan.name}</Text>
                <Text style={[styles.cardSubtitle, { fontSize: responsiveFontSize(1.2) }]}>{plan.subtitle}</Text>
              </View>
            </View>
            <Animated.View style={animatedIconStyle}>
              <Ionicons name="chevron-down" size={24} color={COLORS.textMuted} />
            </Animated.View>
          </View>

          {/* Price and Pay Now button always visible */}
          <View style={styles.priceAndPayContainer}>
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, { color: plan.color, fontSize: responsiveFontSize(3) }]}>
                  ₹{plan.price}
                </Text>
                <Text style={styles.priceDuration}>/{plan.duration}</Text>
              </View>
              <Text style={[styles.priceTagline, { fontSize: responsiveFontSize(1.2) }]}>
                {plan.tagline}
              </Text>
            </View>

            {/* Quick Pay Button (always visible) */}
            {isCurrentPlan ? (
              <View
                style={[
                  styles.quickPayButton,
                  { backgroundColor: COLORS.success, opacity: 1 }
                ]}
              >
                <Text style={styles.quickPayButtonText}>{t('active') || 'Active'}</Text>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
              </View>
            ) : (
              <TouchableOpacity
                onPress={onSelect}
                activeOpacity={consentChecked ? 0.8 : 1}
                disabled={!consentChecked}
                style={[
                  styles.quickPayButton,
                  { backgroundColor: plan.color, opacity: consentChecked ? 1 : 0.5 }
                ]}
              >
                <Text style={styles.quickPayButtonText}>{t('payNowButton')}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.cardItinerary}>
          <View style={styles.separator} />

          {/* Intro */}
          <Text style={[styles.introText, { fontSize: responsiveFontSize(1.35) }]}>
            {plan.intro}
          </Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>{t('subWhatsIncluded')}</Text>
            {plan.benefits.map((benefit, idx) => (
              <BulletPoint key={idx} text={benefit} color={plan.color} />
            ))}
          </View>

          {/* Footer Notes */}
          {plan.footerNotes && plan.footerNotes.length > 0 && (
            <View style={styles.planFooterNotesContainer}>
              {plan.footerNotes.map((note, idx) => (
                <View key={idx} style={styles.planFooterNoteRow}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} style={{ marginTop: 2 }} />
                  <Text style={[styles.planFooterNoteText, { fontSize: responsiveFontSize(1.2) }]}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Consent Checkbox */}
          <View style={styles.consentRow}>
            <TouchableOpacity
              onPress={onConsentToggle}
              activeOpacity={0.7}
              style={styles.checkboxTouchable}
            >
              <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                {consentChecked && (
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.consentText}>
              {t('subConsentAgree')}{' '}
              <Text
                style={styles.consentLink}
                onPress={onOpenConsent}
              >
                {t('subTermsAndConditions')}
              </Text>
              {' '}{t('subAuthorizePayments')}
            </Text>
          </View>

          {/* CTA */}
          {isCurrentPlan ? (
            <View
              style={[
                styles.ctaButtonContainer,
                { shadowColor: plan.color, opacity: 0.9 }
              ]}
            >
              <View
                style={[
                  styles.ctaButton,
                  { backgroundColor: COLORS.success }
                ]}
              >
                <Text style={styles.ctaButtonText}>{t('currentlyActive') || 'Currently Active'}</Text>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onSelect}
              activeOpacity={consentChecked ? 0.9 : 1}
              disabled={!consentChecked}
              style={[styles.ctaButtonContainer, { shadowColor: plan.color, opacity: consentChecked ? 1 : 0.5 }]}
            >
              <LinearGradient
                colors={plan.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaButtonText}>{plan.ctaText}</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
});

// --- Main Component ---
export default function Subscription({ }: any) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const colors = useColor();
  const safeAreaInsets = useSafeAreaInsets();
  const { responsiveFontSize } = useResponsiveScale();
  const navigation = useNavigation<NavigatorProp>();
  const { user, subscriptionModal, subscriptionModalOptions, subscriptionDetails } = useSelector((state: any) => state?.user);

  const getCurrentPlanPrice = () => {
    if (subscriptionDetails?.amount) {
      return parseFloat(subscriptionDetails.amount);
    }
    // Fallback to payment_details.amount (in paise, needs /100)
    if (subscriptionDetails?.payment_details?.amount) {
      return subscriptionDetails.payment_details.amount / 100;
    }
    return 0;
  };
  const currentPrice = getCurrentPlanPrice();

  // Check if we should only show upgrade plans (₹199 and ₹499)
  const upgradeOnly = subscriptionModalOptions?.upgradeOnly || false;

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState<PlanDataType[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch subscription plans from API based on user role
  useEffect(() => {
    if (subscriptionModal) {
      fetchSubscriptionPlans();
    }
  }, [subscriptionModal, user?.role]);

  const fetchSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      const role = user?.role || 'driver';
      console.log('Fetching subscription plans for role:', role);

      const response = await axiosInstance.get(END_POINTS.PAYMENT_SUBSCRIPTION_UPDATE(role));
      console.log('Subscription plans API response:', JSON.stringify(response?.data, null, 2));

      if (response?.data?.success && Array.isArray(response?.data?.data)) {
        const apiPlans = response.data.data;

        // Transform API plans to our PlanDataType format
        const transformedPlans: PlanDataType[] = apiPlans.map((apiPlan: any, index: number) => {
          // Determine tier based on plan name or amount
          let tier = 'base';
          let color = COLORS.base;
          let bgColor = COLORS.baseBg;
          let gradient = ['#F97316', '#FB923C'];
          let badge = '🚛';

          const planName = (apiPlan.name || '').toLowerCase();
          const amount = apiPlan.amount || apiPlan.price || 0;

          if (planName.includes('trusted') || planName.includes('premium') || amount >= 400) {
            tier = 'trusted';
            color = COLORS.trusted;
            bgColor = COLORS.trustedBg;
            gradient = ['#2563EB', '#60A5FA'];
            badge = '🛡️';
          } else if (planName.includes('verified') || planName.includes('standard') || amount >= 150) {
            tier = 'verified';
            color = COLORS.verified;
            bgColor = COLORS.verifiedBg;
            gradient = ['#10B981', '#34D399'];
            badge = '✅';
          }

          // Special override for 99 Plan to be "JOB READY"
          if (amount === 99 || (amount >= 90 && amount <= 100)) {
            tier = 'base';
            color = COLORS.base;
            bgColor = COLORS.baseBg;
            gradient = ['#f9c416ff', '#eaca15ff'];
            badge = '🚛';
          }

          // Extract benefits from API or use defaults based on tier  
          let benefits: string[] = [];

          // Helper for Job Ready Benefits
          const jobReadyBenefits = [
            t('subBenefitCreateProfileDrive'),
            t('subBrowse5Jobs'),
            t('subBenefitContactInApp'),
            t('subBenefitBasicTraining'),
            t('subBenefitStayJobReady'),
          ];

          if (tier === 'base') {
            // Force benefits for Job Ready
            benefits = jobReadyBenefits;
          } else if (apiPlan.features && Array.isArray(apiPlan.features)) {
            benefits = apiPlan.features.map((f: any) => typeof f === 'string' ? f : f.name || f.feature || '');
          } else if (apiPlan.benefits && Array.isArray(apiPlan.benefits)) {
            benefits = apiPlan.benefits.map((b: any) => typeof b === 'string' ? b : b.name || b.benefit || '');
          } else if (apiPlan.description) {
            benefits = [apiPlan.description];
          } else {
            // Default benefits based on tier
            if (tier === 'trusted') {
              benefits = [
                t('subBenefitCreateProfileDrive'),
                t('subBrowseUnlimitedJobs'),
                t('subBenefitDigitalCourtCheck'),
                t('subBenefitDigitalAddressVerify'),
                t('subBenefitHomePhotoGeo'),
                t('subBenefitTrustedBadge'),
                t('subBenefitHighestCredibility'),
                t('subBenefitPriorityPremium'),
              ];
            } else if (tier === 'verified') {
              benefits = [
                t('subBenefitCreateProfileDrive'),
                t('subBrowse20Jobs'),
                t('subBenefitOneTimeVerification'),
                t('subBenefitVerifiedBadge'),
                t('subBenefitHigherTrust'),
                t('subBenefitBetterShortlisting'),
                t('subBenefitSupportTruckMitr'),
              ];
            } else {
              benefits = jobReadyBenefits;
            }
          }

          let footerNotes: string[] | undefined = undefined;
          if (tier === 'base') {
            footerNotes = [
              t('subFooterNoVerification'),
              t('subFooterChooseJobs')
            ];
          } else if (tier === 'verified') {
            footerNotes = [
              t('subFooterVerifyAfterUpload'),
              t('subFooterOtpVerify'),
              t('subFooterNoJobGuarantee')
            ];
          } else if (tier === 'trusted') {
            footerNotes = [
              t('subFooterDigitalProcess'),
              t('subFooterFollowInstructions'),
              t('subFooterImproveConfidence')
            ];
          }

          return {
            id: apiPlan.id,
            tier,
            name: (role === 'transporter' && (amount === 99 || (amount >= 90 && amount <= 100))) ? t('cardLegacyTransporter') : (tier === 'base' ? t('subJobReadyDriver') : (apiPlan.name || `Plan ${index + 1}`)),
            subtitle: tier === 'base' ? t('subJobReadySubtitle') : (role === 'transporter' ? t('subTransporterSubtitle') || 'For Transporters' : (tier === 'verified' ? t('subVerifiedSubtitle') : t('subTrustedSubtitle'))),
            tagline: tier === 'base' ? t('subJobReadyTagline') : (apiPlan.tagline || (tier === 'trusted' ? t('subTrustedTagline') : tier === 'verified' ? t('subVerifiedTagline') : t('subStartYourJourney'))),
            badge,
            price: amount,
            duration: apiPlan.duration || t('subYear'),
            intro: tier === 'base' ? t('subJobReadyIntro') : (apiPlan.description || apiPlan.intro || ''),
            benefits,
            footerNotes,
            is_recurring: apiPlan.is_recurring,
            ctaText: tier === 'trusted' ? t('subBecomeTrusted') : (tier === 'verified' ? t('subBecomeVerified') : t('subGetJobReady')),
            color,
            bgColor,
            gradient,
          };
        });

        // Sort plans by price (ascending)
        transformedPlans.sort((a, b) => a.price - b.price);

        console.log('Transformed plans:', transformedPlans);
        setDynamicPlans(transformedPlans);

        // Don't auto-expand any plan - let user tap to expand
      } else {
        // Fallback to hardcoded plans if API fails
        console.log('API response invalid, using fallback plans');
        setDynamicPlans(getPlanData(t));
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      // Fallback to hardcoded plans
      setDynamicPlans(getPlanData(t));
    } finally {
      setPlansLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleSelectPlan = async (plan: PlanDataType) => {
    try {
      setIsLoading(true);
      await _generateOrderId(plan);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const _generateOrderId = async (plan: PlanDataType) => {
    try {
      const amount = plan.price * 100;
      const serverPlanId: number = plan.id;
      const isRecurring = plan.is_recurring === 1 || plan.is_recurring === true;

      console.log(`Using plan: id=${serverPlanId}, price=${plan.price}, name=${plan.name}, recurring=${isRecurring}`);

      if (isRecurring) {
        // Try creating a subscription
        try {
          console.log(`Attempting to create subscription for plan ${serverPlanId}`);
          const payload = { plan_id: serverPlanId };
          console.log('=== PAYMENT_SUBSCRIPTION_CREATE PAYLOAD ===', JSON.stringify(payload, null, 2));
          const response = await axiosInstance.post(END_POINTS.PAYMENT_SUBSCRIPTION_CREATE, payload);

          console.log('=== SUBSCRIPTION CREATE RESPONSE ===');
          console.log('Full response.data:', JSON.stringify(response?.data, null, 2));

          let subscriptionId =
            response?.data?.subscription_id ||
            response?.data?.data?.subscription_id ||
            response?.data?.data?.id ||
            response?.data?.id;

          // If success
          if (subscriptionId) {
            console.log('Subscription created successfully:', subscriptionId);
            const subscriptionDates = {
              start_date: response?.data?.start_at || response?.data?.data?.start_at || response?.data?.current_start || response?.data?.data?.current_start,
              end_date: response?.data?.end_at || response?.data?.data?.end_at || response?.data?.current_end || response?.data?.data?.current_end
            };
            await _onPressPayNow(subscriptionId, true, String(amount), plan, serverPlanId, subscriptionDates);
            return;
          }

          // If specific error "not recurring", proceed to fallback (Create Order)
          if (response?.data?.message === 'This plan is not recurring') {
            console.log('API returned "not recurring" error. Switching to order creation.');
            // Fall through to order creation below
          } else {
            // Other error
            throw new Error(response?.data?.message || 'Failed to create subscription');
          }
        } catch (subError: any) {
          const isNotRecurringError = subError.message === 'NOT_RECURRING' ||
            subError?.response?.data?.message === 'This plan is not recurring';

          if (isNotRecurringError) {
            console.log('Caught "not recurring" error. Switching to order creation.');
            // Fall through
          } else {
            // Genuine error
            console.error('Subscription creation failed:', subError);
            showToast(subError?.response?.data?.message || t('subUnableToLoadContent'));
            setIsLoading(false);
            return;
          }
        }
      }

      // Create Order Logic (Reached if !isRecurring OR "not recurring" error occurred)
      try {
        console.log('Creating standard order for plan:', serverPlanId);
        const orderPayload = {
          amount: amount,
          currency: 'INR',
          notes: {
            plan_id: serverPlanId,
            role: user?.role || 'driver'
          }
        };

        const orderResponse = await axiosInstance.post(END_POINTS.CREATE_ORDER, orderPayload);
        console.log('Order creation response:', orderResponse?.data);

        let orderId = orderResponse?.data?.id || orderResponse?.data?.order_id || (orderResponse?.data?.data ? orderResponse?.data?.data?.id : null);

        if (orderResponse?.data?.success || (orderId && String(orderId).startsWith('order_'))) {
          if (orderId) {
            console.log('Order created successfully:', orderId);
            await _onPressPayNow(orderId, false, String(amount), plan, serverPlanId);
          } else {
            throw new Error('Order ID not found in response');
          }
        } else {
          throw new Error(orderResponse?.data?.message || 'Failed to create order');
        }
      } catch (orderError: any) {
        console.error('Order creation failed:', orderError);
        showToast(t('subUnableToLoadContent') || 'Unable to initiate payment');
        setIsLoading(false);
      }

    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const _onPressPayNow = async (id: string, isSubscription: boolean, amount: string, plan: PlanDataType, serverPlanId: number, subscriptionDates?: any) => {
    // Format mobile number - ensure it's just 10 digits for prefill
    const rawMobile = String(user?.mobile || '').replace(/\D/g, '');
    const mobileNumber = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;

    // Get email - use a default if not available
    const userEmail = user?.email || `user${user?.id}@truckmitr.com`;

    const options = {
      description: plan.name || 'TruckMitr Subscription',
      image: 'https://truckmitr.com/public/front/assets/images/logotrick.png',
      currency: 'INR',
      key: STATICS?.RAYZORPAY_KEY_ID,
      amount: !isSubscription ? amount : undefined, // Amount needed for non-subscription
      name: 'TruckMitr',
      subscription_id: isSubscription ? id : undefined,
      order_id: !isSubscription ? id : undefined,
      notes: {
        user_id: Number(user?.id) || 0,
        plan_id: Number(serverPlanId)
      },
      prefill: {
        email: userEmail,
        contact: mobileNumber,
        name: user?.name || ''
      },
      readonly: {
        email: true,
        contact: true,
        name: true
      },
      hidden: {
        email: true, // Hide email field completely
        contact: false // Show contact but make it readonly
      },
      send_sms_hash: true,
      retry: {
        enabled: false,
      },
      modal: {
        confirm_close: false,
        animation: true,
      },
      theme: { color: plan.color },
    } as any;

    console.log(`Opening Razorpay checkout (${isSubscription ? 'Subscription' : 'One-time'}):`, id);
    console.log('=== RAZORPAY CHECKOUT OPTIONS ===', JSON.stringify({
      description: options.description,
      currency: options.currency,
      amount: options.amount,
      name: options.name,
      subscription_id: options.subscription_id,
      order_id: options.order_id,
      notes: options.notes,
      prefill: options.prefill,
    }, null, 2));

    await RazorpayCheckout.open(options)
      .then(async (data: any) => {
        console.log('=== RAZORPAY SUCCESS ===');
        console.log('Razorpay response data:', JSON.stringify(data, null, 2));
        setIsLoading(false);
        const eventData = {
          user_id: String(user?.id ?? ''),
          user_unique_id: user?.unique_id ?? '',
          payment_amount: amount,
          payment_method: 'razorpay',
          status: 'success',
          plan_id: serverPlanId,
          payment_id: data.razorpay_payment_id,
          subscription_id: data.razorpay_subscription_id,
          order_id: data.razorpay_order_id,
          payment_type: isSubscription ? 'subscription' : 'one-time'
        };
        try {
          if (analytics) await analytics().logEvent('payment_success', eventData as any);
          AppEventsLogger.logEvent('payment_success', eventData);
        } catch (e) { console.log('Analytics error', e) }

        dispatch(subscriptionModalAction(false));
        setTimeout(() => navigation.navigate(STACKS.PAYMENT_SUCCESS, {
          options,
          data,
          plan,
          serverPlanId: serverPlanId,
          subscriptionDates
        }), 100);
      })
      .catch(async error => {
        console.log('=== RAZORPAY ERROR ===');
        console.log('Error object:', JSON.stringify(error, null, 2));

        // Check if it's actually a success (some SDK versions have this bug)
        if (error?.code === 0 || error?.description?.includes('success')) {
          console.log('Payment might have succeeded despite error callback. Check dashboard.');
        }

        setIsLoading(false);
        showToast(t('oopsPaymentUnsuccessful'));
      });
  };

  // Handle transporter subscription
  const handleTransporterSubscribe = useCallback(async () => {
    // Find the 499 plan for transporter
    const transporterPlan = dynamicPlans.find(plan => plan.price === 499) || dynamicPlans[0];
    if (transporterPlan) {
      await handleSelectPlan(transporterPlan);
    }
  }, [dynamicPlans]);

  // Show TransporterSubscriptionModal for transporter role
  if (user?.role === 'transporter') {
    return (
      <>
        <TransporterSubscriptionModal
          visible={subscriptionModal}
          onClose={() => dispatch(subscriptionModalAction(false))}
          onSubscribe={handleTransporterSubscribe}
          isLoading={isLoading}
          safeAreaInsets={safeAreaInsets}
          responsiveFontSize={responsiveFontSize}
          consentChecked={consentChecked}
          onConsentToggle={() => setConsentChecked(!consentChecked)}
          onOpenConsent={() => setConsentModalVisible(true)}
          t={t}
        />
        <ConsentModal
          visible={consentModalVisible}
          onClose={() => setConsentModalVisible(false)}
          safeAreaInsets={safeAreaInsets}
        />
      </>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={subscriptionModal}
      statusBarTranslucent
      onRequestClose={() => dispatch(subscriptionModalAction(false))}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>

        {/* Close Button */}
        <TouchableOpacity
          onPress={() => dispatch(subscriptionModalAction(false))}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* Top Banner - Limited Time Offer */}
        <View style={styles.topBanner}>
          <Text style={styles.headerTag}>⏰ {t('subLimitedTimeOffer')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: safeAreaInsets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1️⃣ Plan Cards Section - Now at the TOP */}
          <View style={styles.cardsStack}>
            {plansLoading ? (
              <View style={styles.plansLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.plansLoadingText}>{t('loading') || 'Loading plans...'}</Text>
              </View>
            ) : dynamicPlans.length > 0 ? (
              // Filter plans based on upgradeOnly option (exclude ₹99 plan when upgrading)
              dynamicPlans
                .filter((plan: PlanDataType) => {
                  const minPrice = subscriptionModalOptions?.minPrice;
                  if (minPrice) return plan.price >= minPrice;
                  return !upgradeOnly || plan.price >= 199;
                })
                .map((plan: PlanDataType, index: number, filteredPlans: PlanDataType[]) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isExpanded={expandedId === plan.id}
                    onToggle={() => handleToggle(plan.id)}
                    onSelect={() => handleSelectPlan(plan)}
                    responsiveFontSize={responsiveFontSize}
                    isPopular={filteredPlans.length > 1 && index === Math.floor(filteredPlans.length / 2)} // Middle plan is popular
                    consentChecked={consentChecked}
                    onConsentToggle={() => setConsentChecked(!consentChecked)}
                    onOpenConsent={() => setConsentModalVisible(true)}
                    isCurrentPlan={Math.abs(plan.price - currentPrice) < 1}
                  />
                ))
            ) : (
              <View style={styles.plansLoadingContainer}>
                <Text style={styles.plansLoadingText}>{t('subNoPlansAvailable') || 'No plans available'}</Text>
              </View>
            )}
          </View>

          {/* 2️⃣ Heading Section - Now BELOW the plans */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(2.2) }]}>
              {t('subHeaderTagline')}
            </Text>
            <Text style={[styles.headerSubtitle, { fontSize: responsiveFontSize(1.5) }]}>
              {t('subHeaderDesc')}
            </Text>

            {/* Benefits List */}
            <View style={styles.headerBenefitsList}>
              <View style={styles.headerBenefitRow}>
                <Text style={styles.headerBenefitCheck}>✔</Text>
                <Text style={styles.headerBenefitText}>{t('subHeaderBenefit1')}</Text>
              </View>
              <View style={styles.headerBenefitRow}>
                <Text style={styles.headerBenefitCheck}>✔</Text>
                <Text style={styles.headerBenefitText}>{t('subHeaderBenefit2')}</Text>
              </View>
              <View style={styles.headerBenefitRow}>
                <Text style={styles.headerBenefitCheck}>✔</Text>
                <Text style={styles.headerBenefitText}>{t('subHeaderBenefit3')}</Text>
              </View>
              <View style={styles.headerBenefitRow}>
                <Text style={styles.headerBenefitCheck}>✔</Text>
                <Text style={styles.headerBenefitText}>{t('subHeaderBenefit4')}</Text>
              </View>
            </View>

            {/* CTA Message */}
            <Text style={styles.headerCTA}>
              👉 {t('subHeaderCTA')}
            </Text>
          </View>

          {/* 3️⃣ Feature Comparison Table */}
          <FeatureTable responsiveFontSize={responsiveFontSize} t={t} />

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.footerNoteText}>
              {t('subSecurePayment')}
            </Text>
          </View>

        </ScrollView>

        {/* Loading Overlay */}
        <LoadingOverlay visible={isLoading} t={t} />

        {/* Consent Modal */}
        <ConsentModal
          visible={consentModalVisible}
          onClose={() => setConsentModalVisible(false)}
          safeAreaInsets={safeAreaInsets}
        />
      </View >
    </Modal >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  plansLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginVertical: 8,
  },
  plansLoadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 7,
  },
  headerTitle: {
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  topBanner: {
    backgroundColor: '#fefefeff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // borderBottomWidth: 2,
    borderBottomColor: COLORS.success,
  },
  headerTag: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerBenefitsList: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 12,
  },
  headerBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerBenefitCheck: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '700',
    marginRight: 10,
  },
  headerBenefitText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  headerCTA: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Cards
  cardsStack: {
    gap: 16,
    marginBottom: 32,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  cardContainerExpanded: {
    shadowOpacity: 0.1,
    borderColor: COLORS.primary,
  },
  cardPopular: {
    borderColor: COLORS.primary,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHeader: {
    padding: 20,
  },
  cardHeaderContent: {
    gap: 16,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badgeContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // Price
  priceContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceAmount: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  priceDuration: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceTagline: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Price and Pay Container
  priceAndPayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quickPayButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Expanded Content
  cardItinerary: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
    width: '100%',
  },
  introText: {
    color: COLORS.textMuted,
    marginBottom: 20,
    fontWeight: '500',
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  ctaButtonContainer: {
    width: '100%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  ctaButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  checkboxTouchable: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontWeight: '500',
  },
  consentLink: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Global Consent
  globalConsentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  globalConsentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  globalConsentText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  consentHint: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 10,
    marginLeft: 34,
    fontWeight: '600',
  },

  // Table
  tableContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCellLabel: {
    flex: 1.2,
    color: COLORS.text,
    fontWeight: '600',
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellValue: {
    fontWeight: '600',
    color: COLORS.text,
  },

  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerNoteText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Consent Modal
  consentModalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  consentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  consentModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  consentModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentModalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentModalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  consentModalScroll: {
    flex: 1,
  },
  consentModalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  consentModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  consentModalDoneBtn: {
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 14,
  },
  consentModalDoneBtnGradient: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentModalDoneBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  planFooterNotesContainer: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  planFooterNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  planFooterNoteText: {
    flex: 1,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});