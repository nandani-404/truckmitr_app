import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    Alert,
} from 'react-native';
import WebView from 'react-native-webview';
import ImagePicker from 'react-native-image-crop-picker';
import RNFetchBlob from 'react-native-blob-util';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useColor, useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/src/stacks/stacks';
type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction, userAction } from '@truckmitr/src/redux/actions/user.action';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    FadeIn,
    FadeInDown,
    FadeInUp,
    ZoomIn,
} from 'react-native-reanimated';
import { hitSlop } from '@truckmitr/src/app/functions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Modern Colors
const COLORS = {
    primary: '#1E3A8A',
    primaryLight: '#3B82F6',
    success: '#059669',
    successLight: '#10B981',
    successBg: '#ECFDF5',
    gold: '#D97706',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    white: '#FFFFFF',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    inputBg: '#F1F5F9',
    inactiveTab: '#F1F5F9',
    inactiveTabText: '#64748B',
};

// Response Interfaces
interface DLVerificationResponse {
    status: number;
    message: string;
    txn_id?: string;
    result?: {
        name?: string;
        user_full_name?: string;
        dob?: string;
        user_dob?: string;
        img?: string;
        father_name?: string;
        father_or_husband?: string;
        cov_details?: {
            cov: string;
            issue_date: string;
            expiry_date: string;
        }[];
        validity?: {
            non_transport: string;
            transport: string;
        };
        user_address?: {
            addressLine1: string;
            completeAddress: string;
            country: string;
            district: string;
            pin: string;
            state: string;
            type: string;
        }[];
        issue_date?: string;
        issued_date?: string;
        blood_group?: string;
        user_blood_group?: string;
        status?: string;
        expiry_date?: string;
    };
}

interface PANVerificationResponse {
    status: number;
    message: string;
    txn_id?: string;
    result?: {
        pan: string;
        full_name: string;
        first_name: string;
        last_name: string;
        gender: string;
        dob: string;
        email: string;
        mobile: string;
        address: {
            state: string;
            pin_code: string;
            [key: string]: string;
        };
        category: string;
    };
}

// Pre-verified DL check response (from GET API)
interface DLVerificationCheckResponse {
    status: number;
    dl_number_verified?: boolean;
    user_full_name?: string;
    father_or_husband?: string;
    user_blood_group?: string;
    issued_date?: string;
    expiry_date?: string;
    user_address?: {
        line1?: string;
        complete_address?: string;
        district?: string;
        state?: string;
        country?: string;
        pin?: string;
    };
    dl_number?: string;
}

// Pre-verified PAN check response (from GET API)
interface PANVerificationCheckResponse {
    status: number;
    pan_verified: boolean;
    pan: string;
    txn_id: string;
    full_name: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    gender: string;
    dob?: string;
    email: string | null;
    mobile: string | null;
    aadhaar: string;
    aadharlink: boolean;
    tax: string;
    category: string;
    address: {
        address_line_1: string;
        address_line_2: string;
        address_line_3: string;
        address_line_4: string;
        address_line_5: string;
        pin_code: string;
        state: string;
    };
    pin_code: string;
    state: string;
    verified_at: string;
}

interface AadhaarVerificationResponse {
    status: number;
    message: string;
    txn_id?: string;
    result?: {
        url?: string; // DigiLocker redirect URL
        [key: string]: any;
    };
}

interface VoterVerificationResponse {
    status: number;
    message: string;
    result?: any;
}

// Face Match Verification Response
interface FaceMatchResponse {
    status: number;
    message: string;
    txn_id?: string;
    similarity?: number;
    threshold?: number;
    verified?: boolean;
}

interface FaceMatchStatusResponse {
    status: number;
    user_id: string;
    verification_status: string;
}

interface AadhaarVerificationCheckResponse {
    status: number;
    message: string;
    result?: {
        txn_id?: string;
        card_number?: string;
        name_on_card?: string;
        gender?: string;
        date_of_birth?: string;
        address?: string;
        front_image_status?: boolean;
        back_image_status?: boolean;
        verified_at?: string;
        [key: string]: any;
    };
}

interface AadhaarPanMatchResponse {
    status: number;
    message: string;
    aadhar_verified?: boolean;
    pan_verified?: boolean;
    match_results?: {
        aadhar_number_match: boolean;
        name_match: boolean;
        dob_match: boolean;
        overall_match: boolean;
    };
    details?: {
        aadhar_last_4: string;
        pan_linked_aadhar_last_4: string;
        aadhar_name: string;
        pan_name: string;
        aadhar_dob: string;
        pan_dob: string;
    };
}

type TabType = 'DL' | 'PAN' | 'FACE' | 'AADHAAR';

export default function DocumentVerification() {
    const route: any = useRoute();
    const { t } = useTranslation();
    useStatusBarStyle('dark-content');
    const dispatch = useDispatch();
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const { user, isDriver, subscriptionDetails } = useSelector((state: any) => state?.user);

    // Check if user has 199+ subscription for ID verification access
    const canAccessIdVerification = React.useMemo(() => {
        if (!subscriptionDetails) return false;

        // Handle both array and single object structures
        const subs = Array.isArray(subscriptionDetails) ? subscriptionDetails : [subscriptionDetails];

        for (const sub of subs) {
            if (!sub) continue;

            // Check amount (handle string or number)
            const amount = parseFloat(sub.amount) || 0;

            // Allow 199+ plans for ID verification
            if (Math.floor(amount) >= 199) return true;

            // Also check plan name for verified/trusted tier
            const planName = String(sub.payment_type || sub.plan_name || sub.name || '').toLowerCase();
            if (planName.includes('verified') || planName.includes('trusted') || planName.includes('premium')) return true;
        }

        return false;
    }, [subscriptionDetails]);

    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>(route.params?.initialTab || 'DL');

    // Form State
    const [dlNumber, setDlNumber] = useState('');
    const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
    const [govtIdNumber, setGovtIdNumber] = useState('');
    const [idSelfie, setIdSelfie] = useState<any>(null);
    const [panNumber, setPanNumber] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [voterIdNumber, setVoterIdNumber] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);

    // DigiLocker WebView State
    const [digiLockerUrl, setDigiLockerUrl] = useState<string | null>(null);
    const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
    const [aadhaarConsentChecked, setAadhaarConsentChecked] = useState(false);
    const [digiLockerVerified, setDigiLockerVerified] = useState(false);

    // Face Verification State
    const [faceImage1, setFaceImage1] = useState<any>(null);
    const [faceImage2, setFaceImage2] = useState<any>(null);
    const [faceThreshold, setFaceThreshold] = useState('80');

    // Aadhaar Verification State
    const [aadhaarFrontImage, setAadhaarFrontImage] = useState<any>(null);
    const [aadhaarBackImage, setAadhaarBackImage] = useState<any>(null);
    const [aadhaarPanMatchResult, setAadhaarPanMatchResult] = useState<AadhaarPanMatchResponse | null>(null);

    // Loading & Result States
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);

    // Results
    const [dlResult, setDlResult] = useState<DLVerificationResponse | null>(null);
    const [panResult, setPanResult] = useState<PANVerificationResponse | null>(null);
    const [aadhaarResult, setAadhaarResult] = useState<AadhaarVerificationResponse | null>(null);
    const [voterResult, setVoterResult] = useState<VoterVerificationResponse | null>(null);
    const [faceResult, setFaceResult] = useState<FaceMatchResponse | null>(null);

    const [error, setError] = useState<string | null>(null);

    // Validation Errors
    const [inputError, setInputError] = useState<string | null>(null);
    const [isUpgradeError, setIsUpgradeError] = useState(false);

    // Animation
    const cardScale = useSharedValue(0);

    // Scroll ref
    const scrollViewRef = useRef<ScrollView>(null);

    // Check if error requires subscription upgrade
    const isUpgradeRequired = useCallback((errorMsg: string | null): boolean => {
        if (!errorMsg) return false;
        const lowerError = errorMsg.toLowerCase();
        return lowerError.includes('active plan required') ||
            lowerError.includes('active subscription required') ||
            lowerError.includes('subscription required') ||
            lowerError.includes('plan required') ||
            lowerError.includes('upgrade') ||
            lowerError.includes('subscribe');
    }, []);

    // Format error message - show custom message for subscription required errors
    // Process error and determine if upgrade is needed
    const processError = useCallback((errorMsg: string) => {
        const upgradeNeeded = isUpgradeRequired(errorMsg);
        setIsUpgradeError(upgradeNeeded);
        setError(upgradeNeeded ? (t('upgradeForAccess') || 'Upgrade your plan for accessing this feature') : errorMsg);
    }, [isUpgradeRequired, t]);

    // Immediate initialization from Redux user state (before API fetch completes)
    useEffect(() => {
        if (user) {
            // Pre-fill Aadhaar from Redux user state (profile-edit saves as Aadhar_Number)
            const existingAadhaar = user?.Aadhar_Number || user?.aadhaar_number || user?.Aadhaar_Number || user?.aadhaar || '';
            if (existingAadhaar && !aadhaarNumber) {
                setAadhaarNumber(existingAadhaar.trim());
            }

            // Pre-fill PAN
            const existingPan = user?.pan || user?.PAN_Number || user?.pan_number || '';
            if (existingPan && !panNumber) {
                setPanNumber(existingPan.trim().toUpperCase());
            }

            // Pre-fill DL
            const existingDl = user?.License_Number || user?.license_number || '';
            if (existingDl && !dlNumber) {
                setDlNumber(existingDl.trim().toUpperCase());
            }
        }
    }, [user]);

    // Auto-fill from user profile and fetch for Face Verification
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsFetchingProfile(true);
                // Always fetch profile to get the latest data including images
                const response = await axiosInstance.get(END_POINTS.GET_PROFILE);

                if (response?.data?.status) {
                    // Dispatch the full response data (not just data.data) to match profile/index.tsx
                    dispatch(userAction(response.data));

                    // Extract the user object for local use
                    const profileData = response.data.data;

                    // Auto-fill text fields
                    const licenseNumber = profileData?.License_Number || profileData?.license_number || '';
                    if (licenseNumber) setDlNumber(licenseNumber.trim().toUpperCase());

                    const pan = profileData?.pan || profileData?.PAN_Number || profileData?.pan_number || profileData?.Pan_Number ||
                        user?.pan || user?.PAN_Number || user?.pan_number || '';
                    if (pan) setPanNumber(pan.trim().toUpperCase());

                    // Check both profileData (from API) and user (from Redux) for Aadhaar
                    // profile-edit saves as Aadhar_Number (single 'a')
                    const aadhaar = profileData?.aadhaar_number || profileData?.Aadhaar_Number || profileData?.aadhaar ||
                        profileData?.Aadhar_Number || user?.Aadhar_Number || user?.aadhaar_number ||
                        user?.Aadhaar_Number || user?.aadhaar || '';
                    if (aadhaar) setAadhaarNumber(aadhaar.trim());

                    const voter = profileData?.voter_id || profileData?.Voter_Id || profileData?.voter_id_number ||
                        user?.voter_id || user?.Voter_Id || '';
                    if (voter) setVoterIdNumber(voter.trim().toUpperCase());

                    // Preload License Image for Face Verification
                    // Check both API response and Redux user state for the license image
                    const drivingLicense = profileData?.Driving_License || profileData?.driving_license ||
                        user?.Driving_License || user?.driving_license || '';

                    if (drivingLicense && !faceImage2) {
                        // Construct full URL
                        const licenseImgUrl = `${BASE_URL}public/${drivingLicense}`;
                        console.log('Preloading driving license image from:', licenseImgUrl);

                        try {
                            // Fetch and convert to base64 for API usage
                            const res = await RNFetchBlob.config({ fileCache: true }).fetch('GET', licenseImgUrl);
                            const base64 = await res.base64();
                            // Clean up the temp file
                            res.flush();

                            setFaceImage2({
                                data: base64,
                                path: licenseImgUrl, // Use full URL for display
                                mime: 'image/jpeg'
                            });
                            console.log('Driving license image preloaded successfully');
                        } catch (e) {
                            console.warn('Error downloading license image for face verification', e);
                        }
                    }
                } else {
                    // API call failed or returned no data - try to use existing Redux user state
                    const drivingLicense = user?.Driving_License || user?.driving_license || '';
                    if (drivingLicense && !faceImage2) {
                        const licenseImgUrl = `${BASE_URL}public/${drivingLicense}`;
                        console.log('Preloading driving license from Redux user state:', licenseImgUrl);

                        try {
                            const res = await RNFetchBlob.config({ fileCache: true }).fetch('GET', licenseImgUrl);
                            const base64 = await res.base64();
                            res.flush();

                            setFaceImage2({
                                data: base64,
                                path: licenseImgUrl,
                                mime: 'image/jpeg'
                            });
                            console.log('Driving license image preloaded from Redux state');
                        } catch (e) {
                            console.warn('Error downloading license image from Redux state', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Profile fetch error', error);
                // On API error, try to use existing Redux user state as fallback
                const drivingLicense = user?.Driving_License || user?.driving_license || '';
                if (drivingLicense && !faceImage2) {
                    const licenseImgUrl = `${BASE_URL}public/${drivingLicense}`;
                    console.log('Fallback: Preloading driving license from Redux user state:', licenseImgUrl);

                    try {
                        const res = await RNFetchBlob.config({ fileCache: true }).fetch('GET', licenseImgUrl);
                        const base64 = await res.base64();
                        res.flush();

                        setFaceImage2({
                            data: base64,
                            path: licenseImgUrl,
                            mime: 'image/jpeg'
                        });
                    } catch (e) {
                        console.warn('Fallback: Error downloading license image', e);
                    }
                }
            } finally {
                setIsFetchingProfile(false);
            }
        };

        fetchProfileData();
    }, [user?.Driving_License]);

    // Check if DL is already verified on screen load
    useEffect(() => {
        const checkDLVerificationStatus = async () => {
            // Get user ID - check multiple possible field names
            const userId = user?.id || user?.user_id || user?.userId;
            const licenseNumber = user?.License_Number || user?.license_number || dlNumber || '';

            if (!userId || !licenseNumber) {
                return;
            }
            try {
                setIsFetchingProfile(true);
                const apiUrl = END_POINTS.DRIVERVERIFICATIONDLVERIFICATION(userId, licenseNumber.trim().toUpperCase());

                const response = await axiosInstance.get(apiUrl);
                const data: DLVerificationCheckResponse = response?.data;

                // If DL is already verified, transform the response and show success screen
                if (data?.status === 1 && data?.dl_number_verified === true) {
                    console.log('DL is verified! Showing success screen...');

                    // Transform API response to match DLVerificationResponse format
                    const transformedResult: DLVerificationResponse = {
                        status: 1,
                        message: 'DL already verified',
                        result: {
                            user_full_name: data.user_full_name,
                            name: data.user_full_name,
                            father_or_husband: data.father_or_husband,
                            father_name: data.father_or_husband,
                            user_blood_group: data.user_blood_group,
                            blood_group: data.user_blood_group,
                            issued_date: data.issued_date,
                            issue_date: data.issued_date,
                            expiry_date: data.expiry_date,
                            validity: {
                                non_transport: data.expiry_date || '',
                                transport: data.expiry_date || '',
                            },
                            user_address: data.user_address ? [{
                                addressLine1: data.user_address.line1 || '',
                                completeAddress: data.user_address.complete_address || '',
                                district: data.user_address.district || '',
                                state: data.user_address.state || '',
                                country: data.user_address.country || '',
                                pin: data.user_address.pin || '',
                                type: 'permanent',
                            }] : undefined,
                        },
                    };

                    setDlResult(transformedResult);
                    setDlNumber(data.dl_number || licenseNumber.trim().toUpperCase());
                }
            } catch (err: any) {
                console.log('DL Verification Check Error:', err?.response?.data || err?.message || err);
                // Silently fail - user can still verify manually
            } finally {
                setIsFetchingProfile(false);
            }
        };

        // Only run if we have a user
        if (user) {
            checkDLVerificationStatus();
        }
    }, [user]);

    // Check if PAN is already verified on screen load
    useEffect(() => {
        const checkPANVerificationStatus = async () => {
            // Get user ID
            const userId = user?.id || user?.user_id || user?.userId;
            const panNo = user?.pan || user?.PAN_Number || user?.pan_number || user?.Pan_Number || panNumber || '';

            if (!userId || !panNo) {
                return;
            }

            try {
                // Determine if we need to show loading (only if DL is not loading)
                if (!isFetchingProfile) setIsFetchingProfile(true);

                const apiUrl = END_POINTS.DRIVERVERIFICATIONPANVERIFICATION(userId, panNo.trim().toUpperCase());

                const response = await axiosInstance.get(apiUrl);
                const data: PANVerificationCheckResponse = response?.data;

                // If PAN is already verified
                if (data?.status === 1 && data?.pan_verified === true) {
                    console.log('PAN is verified! Showing success screen...');

                    // Transform API response to match PANVerificationResponse format
                    const transformedResult: PANVerificationResponse = {
                        status: 1,
                        message: 'PAN already verified',
                        txn_id: data.txn_id,
                        result: {
                            pan: data.pan,
                            full_name: data.full_name,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            gender: data.gender,
                            dob: data.dob || '', // DOB not returned in check API
                            email: data.email || '',
                            mobile: data.mobile || '',
                            address: {
                                state: data.state || data.address?.state || '',
                                pin_code: data.pin_code || data.address?.pin_code || '',
                                address_line_1: data.address?.address_line_1 || '',
                                address_line_2: data.address?.address_line_2 || '',
                            },
                            category: data.category,
                        },
                    };

                    setPanResult(transformedResult);
                    setPanNumber(data.pan || panNo.trim().toUpperCase());
                }
            } catch (err: any) {
                console.log('PAN Verification Check Error:', err?.response?.data || err?.message || err);
                // Silently fail
            } finally {
                setIsFetchingProfile(false);
            }
        };

        if (user && activeTab === 'PAN') {
            checkPANVerificationStatus();
        }
    }, [user, activeTab]);

    // Check if Face Match is already verified on screen load
    useEffect(() => {
        const checkFaceMatchStatus = async () => {
            if (!user) return;

            try {
                // Determine if we need to show loading (only if DL/PAN are not loading)
                if (!isFetchingProfile) setIsFetchingProfile(true);

                const response = await axiosInstance.get('/api/kyc/face-match/status');
                const data: FaceMatchStatusResponse = response?.data;

                if (data?.status === 1 && data?.verification_status === 'verified') {
                    console.log('Face Match is verified! Showing success screen...');
                    const transformedResult: FaceMatchResponse = {
                        status: 1,
                        message: 'Face match already verified',
                        verified: true,
                        similarity: 100, // Default to 100% since it's already verified
                        threshold: 80
                    };
                    setFaceResult(transformedResult);
                }
            } catch (err: any) {
                console.log('Face Match Status Check Error:', err?.response?.data || err?.message || err);
                // Silently fail
            } finally {
                setIsFetchingProfile(false);
            }
        };

        checkFaceMatchStatus();
    }, [user]);

    // Check Aadhaar Verification Status on Load
    useEffect(() => {
        const checkAadhaarStatus = async () => {
            if (!user) return;
            try {
                if (!isFetchingProfile) setIsFetchingProfile(true);
                const response = await axiosInstance.get(END_POINTS.AADHAAR_VERIFICATION_STATUS);
                const data: AadhaarVerificationCheckResponse = response?.data;

                if (data?.status === 1) { // User is fully verified or has history
                    console.log('Aadhaar Verification Status:', data);
                    const transformedResult: AadhaarVerificationResponse = {
                        status: 1,
                        message: 'Aadhar already verified',
                        result: data.result
                    };
                    setAadhaarResult(transformedResult);
                }
            } catch (err: any) {
                console.log('Aadhaar Status Check Error:', err?.response?.data || err?.message);
            } finally {
                setIsFetchingProfile(false);
            }
        };

        const checkAadhaarPanMatch = async () => {
            if (!user) return;
            try {
                const response = await axiosInstance.get(END_POINTS.AADHAAR_PAN_MATCH);
                setAadhaarPanMatchResult(response?.data);
            } catch (err: any) {
                console.log('Aadhaar PAN Match Error:', err?.response?.data || err?.message);
            }
        };

        if (activeTab === 'AADHAAR') {
            checkAadhaarStatus();
            checkAadhaarPanMatch();
        }
    }, [user, activeTab]);

    // Animate success card
    // Animate success card
    useEffect(() => {
        const isSuccess = activeTab === 'DL' ? !!(dlResult?.status === 1) :
            activeTab === 'PAN' ? !!(panResult?.status === 1) :
                activeTab === 'FACE' ? !!(faceResult?.status === 1) : false;

        if (isSuccess) {
            setError(null);
            cardScale.value = withDelay(200, withSpring(1, { damping: 12 }));
        }
    }, [dlResult, panResult, faceResult, activeTab]);

    // Reset error when tab changes
    useEffect(() => {
        setError(null);
        setInputError(null);
        setIsUpgradeError(false);
        setConsentChecked(false);
    }, [activeTab]);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    // Validators
    const validateDL = (value: string): boolean => {
        if (!value || value.trim().length === 0) {
            setInputError(t('dlNumberRequired') || 'Driving License number is required');
            return false;
        }
        if (value.length < 10 || value.length > 20) {
            setInputError(t('dlNumberLengthError') || 'DL number must be between 10-20 characters');
            return false;
        }
        setInputError(null);
        return true;
    };

    const validatePAN = (value: string): boolean => {
        if (!value || value.trim().length === 0) {
            setInputError(t('panNumberRequired') || 'PAN number is required');
            return false;
        }
        // Basic PAN Pattern: 5 letters, 4 digits, 1 letter
        const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panPattern.test(value)) {
            setInputError(t('invalidPanFormat') || 'Invalid PAN format (e.g., ABCPD1234E)');
            return false;
        }
        setInputError(null);
        return true;
    };

    const validateAadhaar = (value: string): boolean => {
        if (!value || value.trim().length === 0) {
            setInputError(t('aadhaarNumberRequired') || 'Aadhaar number is required');
            return false;
        }
        if (value.length !== 12 || !/^\d+$/.test(value)) {
            setInputError(t('invalidAadhaarFormat') || 'Aadhaar number must be 12 digits');
            return false;
        }
        setInputError(null);
        return true;
    };

    const validateVoterId = (value: string): boolean => {
        if (!value || value.trim().length === 0) {
            setInputError(t('voterIdRequired') || 'Voter ID is required');
            return false;
        }
        // Basic Voter ID pattern (usually 3 chars + 7 digits, but can vary)
        if (value.length < 10) {
            setInputError(t('invalidVoterIdFormat') || 'Invalid Voter ID format');
            return false;
        }
        setInputError(null);
        return true;
    };

    // Handlers
    const handleDLChange = (value: string) => {
        const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        setDlNumber(cleanedValue);
        if (inputError) validateDL(cleanedValue);
    };

    const handlePanChange = (value: string) => {
        const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        setPanNumber(cleanedValue);
        if (inputError) validatePAN(cleanedValue);
    };

    const handleAadhaarChange = (value: string) => {
        const cleanedValue = value.replace(/[^0-9]/g, '');
        setAadhaarNumber(cleanedValue);
        if (inputError) validateAadhaar(cleanedValue);
    };

    const handleVoterIdChange = (value: string) => {
        const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        setVoterIdNumber(cleanedValue);
        if (inputError) validateVoterId(cleanedValue);
    };

    const handleTakeSelfie = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 300,
                height: 400,
                cropping: false,
                useFrontCamera: true,
                mediaType: 'photo'
            });
            setIdSelfie(image);
        } catch (error) {
            console.log('Camera Error:', error);
        }
    };

    // Face Verification Handlers
    const handleCaptureFaceImage1 = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: false,
                useFrontCamera: true,
                mediaType: 'photo',
                includeBase64: true,
            });
            setFaceImage1(image);
        } catch (error) {
            console.log('Camera Error (Image 1):', error);
        }
    };

    const handleCaptureFaceImage2 = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: false,
                useFrontCamera: true,
                mediaType: 'photo',
                includeBase64: true,
            });
            setFaceImage2(image);
        } catch (error) {
            console.log('Camera Error (Image 2):', error);
        }
    };

    const handlePickFaceImage1 = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: false,
                mediaType: 'photo',
                includeBase64: true,
            });
            setFaceImage1(image);
        } catch (error) {
            console.log('Gallery Error (Image 1):', error);
        }
    };

    const handlePickFaceImage2 = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: false,
                mediaType: 'photo',
                includeBase64: true,
            });
            setFaceImage2(image);
        } catch (error) {
            console.log('Gallery Error (Image 2):', error);
        }
    };

    // Aadhaar Camera Handlers
    const handleCaptureAadhaarFront = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 800,
                height: 500,
                cropping: false, // User requested raw camera capture mostly, but cropping usually helps. "Camera capture... not from gallery".
                mediaType: 'photo',
                includeBase64: true,
                compressImageQuality: 0.8,
            });
            setAadhaarFrontImage(image);
            setInputError(null);
        } catch (error) {
            console.log('Camera Error (Aadhaar Front):', error);
        }
    };

    const handleCaptureAadhaarBack = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 800,
                height: 500,
                cropping: false,
                mediaType: 'photo',
                includeBase64: true,
                compressImageQuality: 0.8,
            });
            setAadhaarBackImage(image);
            setInputError(null);
        } catch (error) {
            console.log('Camera Error (Aadhaar Back):', error);
        }
    };

    const validateFaceVerification = (): boolean => {
        if (!faceImage1) {
            setInputError(t('sourceImageRequired') || 'Source face image is required');
            return false;
        }
        if (!faceImage2) {
            setInputError(t('targetImageRequired') || 'Target face image is required');
            return false;
        }
        setInputError(null);
        return true;
    };

    // API Call
    const handleVerify = async () => {
        setError(null);
        setIsUpgradeError(false);

        if (activeTab === 'DL') {
            if (!validateDL(dlNumber)) return;
            if (!consentChecked) {
                showToast(t('dlConsentRequired') || 'Please provide consent to proceed');
                return;
            }

            try {
                setIsLoading(true);
                const payload = {
                    dl_no: dlNumber,
                    consent: 'Y',
                    consent_text: 'We confirm obtaining valid customer consent to access/process their dl data. Consent remains valid, informed, and unwithdrawn.',
                };

                const config = { headers: { 'Content-Type': 'application/json' } };
                const response = await axiosInstance.post(END_POINTS.DL_VERIFY, payload, config);

                if (response?.data?.status === 1) {
                    setDlResult(response.data);
                    cardScale.value = 0;
                } else {
                    const apiError = response?.data?.message || t('verificationFailed') || 'Verification failed';
                    processError(apiError);
                }
            } catch (err: any) {
                const apiError = err?.response?.data?.message || t('errorOccurred') || 'An error occurred';
                processError(apiError);
            } finally {
                setIsLoading(false);
            }

        } else if (activeTab === 'PAN') {
            if (!validatePAN(panNumber)) return;

            try {
                setIsLoading(true);
                const payload = { pan: panNumber };
                const config = { headers: { 'Content-Type': 'application/json' } };
                const response = await axiosInstance.post(END_POINTS.PAN_VERIFY, payload, config);

                if (response?.data?.status === 1) {
                    setPanResult(response.data);
                    cardScale.value = 0;
                } else {
                    const apiError = response?.data?.message || t('verificationFailed') || 'Verification failed';
                    processError(apiError);
                }
            } catch (err: any) {
                const msg = err?.response?.data?.message || err?.response?.data?.error || t('errorOccurred') || 'An error occurred';
                processError(msg);
            } finally {
                setIsLoading(false);
            }
        } else if (activeTab === 'FACE') {
            if (!validateFaceVerification()) return;

            try {
                setIsLoading(true);

                // Get base64 data from images
                const image1Base64 = faceImage1?.data || faceImage1?.base64 || '';
                const image2Base64 = faceImage2?.data || faceImage2?.base64 || '';

                const payload = {
                    image1: image1Base64,
                    image2: image2Base64,
                    threshold: parseInt(faceThreshold, 10) || 80,
                };

                const config = { headers: { 'Content-Type': 'application/json' } };
                const response = await axiosInstance.post(END_POINTS.FACE_MATCH_VERIFY, payload, config);

                if (response?.data?.status === 1) {
                    setFaceResult(response.data);
                    cardScale.value = 0;
                } else {
                    const apiError = response?.data?.message || t('faceVerificationFailed') || 'Face verification failed';
                    processError(apiError);
                }
            } catch (err: any) {
                const msg = err?.response?.data?.message || t('errorOccurred') || 'An error occurred';
                processError(msg);
            } finally {
                setIsLoading(false);
            }
        } else if (activeTab === 'AADHAAR') {
            if (!aadhaarFrontImage) {
                showToast('Front Aadhaar image is required');
                return;
            }
            if (!aadhaarBackImage) {
                showToast('Back Aadhaar image is required');
                return;
            }
            if (!consentChecked) {
                showToast('Consent is mandatory to proceed');
                return;
            }

            try {
                setIsLoading(true);
                // Ensure base64 string is clean and available
                const frontBase64 = aadhaarFrontImage?.data || aadhaarFrontImage?.base64 || '';
                const backBase64 = aadhaarBackImage?.data || aadhaarBackImage?.base64 || '';

                const payload = {
                    doc_front: `data:${aadhaarFrontImage?.mime || 'image/jpeg'};base64,${frontBase64}`,
                    doc_back: `data:${aadhaarBackImage?.mime || 'image/jpeg'};base64,${backBase64}`,
                    consent: 'Y',
                    consent_text: "We confirm obtaining valid customer consent to access/process their aadhaar data. Consent remains valid, informed, and unwithdrawn."
                };

                const config = { headers: { 'Content-Type': 'application/json' } };
                console.log('Aadhaar Payload:', JSON.stringify({ ...payload, doc_front: payload.doc_front.substring(0, 50) + '...', doc_back: payload.doc_back.substring(0, 50) + '...' }, null, 2));
                console.log('Full Aadhaar Payload (without truncation):', JSON.stringify(payload));
                const response = await axiosInstance.post(END_POINTS.AADHAAR_MASKING, payload, config);

                if (response?.data?.status === 1) {
                    setAadhaarResult(response.data);
                    cardScale.value = 0;
                    // Refresh match check
                    try {
                        const matchResp = await axiosInstance.get(END_POINTS.AADHAAR_PAN_MATCH);
                        setAadhaarPanMatchResult(matchResp?.data);
                    } catch (e) { }
                } else {
                    const apiError = response?.data?.message || 'Unable to verify Aadhaar';
                    processError(apiError);
                }
            } catch (err: any) {
                const msg = err?.response?.data?.message || 'Unable to verify Aadhaar';
                processError(msg);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGoBack = () => navigation.goBack();

    // Open Subscription Modal (existing global modal) with upgradeOnly option
    // This will show only ₹199 and ₹499 plans, not the ₹99 plan
    const handleOpenUpgradeModal = useCallback(() => {
        dispatch(subscriptionModalAction({ visible: true, upgradeOnly: true }));
    }, [dispatch]);

    // Render Logic
    const isSuccess = activeTab === 'DL' ? !!(dlResult?.status === 1) :
        activeTab === 'PAN' ? !!(panResult?.status === 1) :
            activeTab === 'FACE' ? !!(faceResult?.status === 1) :
                activeTab === 'AADHAAR' ? (!!(aadhaarResult?.status === 1) || !!aadhaarResult?.message?.includes('verified')) : false;

    const renderSuccessView = () => {
        if (activeTab === 'DL' && dlResult?.result) {
            const data = dlResult.result;
            const address = data.user_address && data.user_address[0] ? data.user_address[0] : null;
            const vehicleCats = data.cov_details?.map(cov => cov.cov) || [];

            return (
                <View>
                    {/* Driver Details Card */}
                    <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.detailsCard}>
                        <View style={styles.detailsHeader}>
                            <MaterialCommunityIcons name="card-account-details" size={24} color={COLORS.primary} />
                            <Text style={styles.detailsTitle}>{t('dlDriverDetails') || 'Driver Details'}</Text>
                        </View>
                        <View style={styles.detailsGrid}>
                            <DetailRow icon="person" label={t('fullName') || 'Full Name'} value={data.name || data.user_full_name || '-'} />
                            <DetailRow icon="person-add" label={t('fatherName') || 'Father Name'} value={data.father_name || data.father_or_husband || '-'} />
                            <DetailRow icon="calendar" label={t('dob') || 'Date of Birth'} value={data.dob || data.user_dob || '-'} />
                            <DetailRow icon="shield-checkmark" label={t('status') || 'Status'} value={data.status || 'Active'} isStatus statusType={data.status?.toLowerCase() === 'active' ? 'success' : 'warning'} />

                            {/* Additional Details */}
                            <DetailRow icon="water" label={t('bloodGroup') || 'Blood Group'} value={data.blood_group || data.user_blood_group || '-'} />
                            <DetailRow icon="calendar-outline" label={t('issueDate') || 'Issue Date'} value={data.issue_date || data.issued_date || '-'} />

                            {/* Validity / Expiry */}
                            {data.validity ? (
                                <DetailRow
                                    icon="time"
                                    label={t('dlValidity') || 'Validity'}
                                    value={data.validity.transport || data.validity.non_transport || '-'}
                                />
                            ) : (
                                <DetailRow icon="time" label={t('dlExpiryDate') || 'Expiry Date'} value={data.expiry_date || '-'} />
                            )}

                            {address && (
                                <DetailRow
                                    icon="location"
                                    label={t('address') || 'Address'}
                                    value={address.completeAddress}
                                    multiline
                                />
                            )}
                        </View>

                        {vehicleCats.length > 0 && (
                            <View style={styles.categoriesSection}>
                                <Text style={styles.categoriesTitle}><Ionicons name="car" size={16} color={COLORS.textMuted} />  {t('dlVehicleCategories') || 'Vehicle Categories'}</Text>
                                <View style={styles.categoriesList}>
                                    {vehicleCats.map((cat, idx) => (
                                        <View key={idx} style={styles.categoryBadge}><Text style={styles.categoryText}>{cat}</Text></View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </View>
            );
        } else if (activeTab === 'AADHAAR' && aadhaarResult?.result) {
            const data = aadhaarResult.result;
            return (
                <View>
                    {/* Aadhaar Details Card */}
                    <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.detailsCard}>
                        <View style={styles.detailsHeader}>
                            <MaterialCommunityIcons name="card-account-details" size={24} color={COLORS.primary} />
                            <Text style={styles.detailsTitle}>{t('aadhaarDetails') || 'Aadhaar Details / आधार विवरण'}</Text>
                        </View>
                        <View style={styles.detailsGrid}>
                            <DetailRow icon="person" label={t('name') || 'Name / नाम'} value={data.name_on_card || '-'} />
                            <DetailRow icon="card" label={t('aadhaarNumber') || 'Aadhaar Number / आधार संख्या'} value={data.card_number || '-'} highlight />
                            <DetailRow icon="male-female" label={t('gender') || 'Gender / लिंग'} value={data.gender || '-'} />
                            <DetailRow icon="calendar" label={t('dateOfBirth') || 'Date of Birth / जन्म तिथि'} value={data.date_of_birth || '-'} />
                            <DetailRow icon="time" label={t('verifiedAt') || 'Verified At / सत्यापित समय'} value={data.verified_at || '-'} />

                            <DetailRow
                                icon="location"
                                label={t('address') || 'Address / पता'}
                                value={data.address || [data.address_line_one, data.address_line_two, data.city, data.state, data.pin].filter(Boolean).join(', ') || '-'}
                                multiline
                            />

                            {/* Image Verification Status */}
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8 }}>{t('documentQuality') || 'Document Quality / दस्तावेज़ गुणवत्ता'}</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="image" size={14} color={COLORS.textMuted} />
                                        <Text style={{ fontSize: 13, color: COLORS.text }}>{t('front') || 'Front / सामने'}: </Text>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: data.front_image_status ? COLORS.success : COLORS.error }}>
                                            {data.front_image_status ? 'Clear' : 'Failed'}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="image" size={14} color={COLORS.textMuted} />
                                        <Text style={{ fontSize: 13, color: COLORS.text }}>{t('back') || 'Back / पीछे'}: </Text>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: data.back_image_status ? COLORS.success : COLORS.error }}>
                                            {data.back_image_status ? 'Clear' : 'Failed'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Aadhaar-PAN Match Status */}
                            {aadhaarPanMatchResult && (
                                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted }}>Aadhaar-PAN Link</Text>
                                        <Text style={{
                                            fontSize: 15,
                                            fontWeight: '700',
                                            color: (aadhaarPanMatchResult.match_results?.overall_match || aadhaarPanMatchResult.pan_verified) ? COLORS.success : COLORS.warning,
                                            marginTop: 2
                                        }}>
                                            {(aadhaarPanMatchResult.match_results?.overall_match || aadhaarPanMatchResult.pan_verified) ? 'Verified & Linked' : 'Verification Pending / Mismatch'}
                                        </Text>

                                        {/* Detailed Status Message */}
                                        {!(aadhaarPanMatchResult.match_results?.overall_match || aadhaarPanMatchResult.pan_verified) && (
                                            <View style={{ marginTop: 4 }}>
                                                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                                                    {aadhaarPanMatchResult.match_results
                                                        ? 'Details do not match perfectly. Please check PAN details.'
                                                        : (aadhaarPanMatchResult.message || 'Both documents must be verified')}
                                                </Text>

                                                {/* Specific Mismatches if available */}
                                                {aadhaarPanMatchResult.match_results && !aadhaarPanMatchResult.match_results.overall_match && (
                                                    <View style={{ marginTop: 2 }}>
                                                        {!aadhaarPanMatchResult.match_results.name_match && <Text style={{ fontSize: 10, color: COLORS.error }}>• Name mismatch</Text>}
                                                        {!aadhaarPanMatchResult.match_results.dob_match && <Text style={{ fontSize: 10, color: COLORS.error }}>• DOB mismatch</Text>}
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    {!(aadhaarPanMatchResult.match_results?.overall_match || aadhaarPanMatchResult.pan_verified) && (
                                        <TouchableOpacity
                                            onPress={() => setActiveTab('PAN')}
                                            style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginLeft: 8 }}
                                        >
                                            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>Check PAN</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                        </View>
                    </Animated.View>
                </View>
            );
        } else if (activeTab === 'PAN' && panResult?.result) {
            const data = panResult.result;
            return (
                <View>
                    {/* PAN Details Card */}
                    <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.detailsCard}>
                        <View style={styles.detailsHeader}>
                            <MaterialCommunityIcons name="card-account-details" size={24} color={COLORS.primary} />
                            <Text style={styles.detailsTitle}>{t('panDetails') || 'PAN Details'}</Text>
                        </View>
                        <View style={styles.detailsGrid}>
                            <DetailRow icon="person" label={t('fullName') || 'Full Name'} value={data.full_name} />
                            <DetailRow icon="card" label="PAN Number" value={data.pan} highlight />
                            <DetailRow icon="male-female" label={t('gender') || 'Gender'} value={data.gender} />
                            <DetailRow icon="calendar" label={t('dob') || 'Date of Birth'} value={data.dob} />
                            <DetailRow icon="call" label={t('mobile') || 'Mobile'} value={data.mobile} />
                            {data.address && (
                                <DetailRow
                                    icon="location"
                                    label={t('address') || 'Address'}
                                    value={`${data.address.address_line_1}, ${data.address.address_line_2 || ''}, ${data.address.state} - ${data.address.pin_code}`}
                                    multiline
                                />
                            )}
                        </View>
                    </Animated.View>
                </View>
            );
        } else if (activeTab === 'FACE' && faceResult) {
            return (
                <View>
                    <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.detailsCard}>
                        <View style={styles.detailsHeader}>
                            <MaterialCommunityIcons name="face-recognition" size={24} color={COLORS.primary} />
                            <Text style={styles.detailsTitle}>{t('faceMatchDetails') || 'Face Match Details'}</Text>
                        </View>
                        <View style={styles.detailsGrid}>
                            <DetailRow
                                icon="shield-checkmark"
                                label={t('matchStatus') || 'Match Status'}
                                value={faceResult.verified ? (t('facesMatch') || 'Faces Match') : (t('facesDoNotMatch') || 'Faces Do Not Match')}
                                isStatus
                                statusType={faceResult.verified ? 'success' : 'warning'}
                            />
                            <DetailRow
                                icon="analytics"
                                label={t('similarity') || 'Similarity'}
                                value={`${faceResult.similarity?.toFixed(1) || '0'}%`}
                                highlight
                            />
                        </View>

                        {/* Visual Result Indicator */}
                        <View style={[styles.faceResultIndicator, { backgroundColor: faceResult.verified ? COLORS.successBg : COLORS.warningBg }]}>
                            <Ionicons
                                name={faceResult.verified ? "checkmark-circle" : "alert-circle"}
                                size={24}
                                color={faceResult.verified ? COLORS.success : COLORS.warning}
                            />
                            <Text style={[styles.faceResultText, { color: faceResult.verified ? COLORS.success : COLORS.warning }]}>
                                {faceResult.verified
                                    ? (t('faceVerificationPassed') || 'Face verification passed! The two images match.')
                                    : (t('faceVerificationFailed') || 'Face verification failed. The images do not match sufficiently.')
                                }
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            );
        }
        return null;
    };

    const TabButton = ({ type, label, icon }: any) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === type && styles.activeTab, { flex: 1, margin: 0, borderWidth: 1, borderColor: activeTab === type ? COLORS.primaryLight : COLORS.border }]}
            onPress={() => setActiveTab(type)}
            disabled={isLoading}
        >
            <Ionicons name={icon} size={18} color={activeTab === type ? COLORS.primary : COLORS.inactiveTabText} />
            <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderTabs = () => (
        <View style={{ marginBottom: 16 }}>
            {/* Required Documents Title */}
            <Text style={styles.requiredDocsTitle}>{t('requiredDocuments') || 'Required Documents'}</Text>

            {/* Tab Buttons Row 1 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TabButton type='DL' label='DL' icon='car-outline' />
                <TabButton type='AADHAAR' label='Aadhaar' icon='finger-print-outline' />
            </View>

            {/* Tab Buttons Row 2 */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TabButton type='PAN' label='PAN' icon='card-outline' />
                <TabButton type='FACE' label={t('face') || 'Face'} icon='scan-outline' />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Slim Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 4 }]}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={handleGoBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerText}>{t('documentVerification') || 'Document Verification'}</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 250 }]} // Extra padding for button visibility with keyboard
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={true}
                    scrollEventThrottle={16}
                >
                    {/* Header Card */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.headerCard}>
                        <View style={styles.headerRow}>
                            <View style={styles.kycIconContainer}>
                                <MaterialCommunityIcons name="shield-check-outline" size={28} color={COLORS.primary} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>{t('kycVerification') || 'KYC Verification'}</Text>
                                <Text style={styles.headerSubtitle}>{t('kycSubtitle') || 'Verify your documents to build trust'}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Tabs */}
                    {renderTabs()}

                    {/* Main Content Area - Hide for ID and FACE tabs (they navigate to ID Check Info screen) */}
                    {/* Main Content Area */}
                    {isSuccess ? (
                        <View>
                            {/* Success Card */}
                            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.successCard, cardAnimatedStyle]}>
                                <View style={styles.successIconContainer}>
                                    <View style={[styles.successIconBg, activeTab === 'FACE' && faceResult && !faceResult.verified && { backgroundColor: COLORS.warningBg }]}>
                                        <Ionicons
                                            name={activeTab === 'FACE' && faceResult && !faceResult.verified ? "alert-circle" : "checkmark-circle"}
                                            size={56}
                                            color={activeTab === 'FACE' && faceResult && !faceResult.verified ? COLORS.warning : COLORS.success}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.successTitle}>
                                    {activeTab === 'FACE'
                                        ? (faceResult?.verified
                                            ? (t('faceMatchSuccess') || 'Faces Match!')
                                            : (t('faceMatchFailed') || 'Faces Do Not Match'))
                                        : (t('verificationSuccessful') || 'Verified Successfully!')}
                                </Text>
                                <Text style={styles.successSubtitle}>
                                    {activeTab === 'FACE'
                                        ? (faceResult?.verified
                                            ? (t('faceMatchSuccessDesc') || `Similarity: ${faceResult?.similarity?.toFixed(1)}% - Above threshold`)
                                            : (t('faceMatchFailedDesc') || `Similarity: ${faceResult?.similarity?.toFixed(1)}% - Below threshold`))
                                        : (t('verificationSuccessDesc') || `Your ${activeTab === 'DL' ? 'driving license' : 'PAN card'} has been verified`)}
                                </Text>
                            </Animated.View>

                            {renderSuccessView()}


                        </View>
                    ) : (
                        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.formCard}>
                            {activeTab === 'DL' && (
                                canAccessIdVerification ? (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}><Ionicons name="card" size={14} color={COLORS.textMuted} />  {t('drivingLicenseNumber') || 'Driving License Number'}</Text>
                                        <View style={[styles.inputContainer, inputError ? styles.inputError : null]}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter DL Number"
                                                placeholderTextColor={COLORS.textLight}
                                                value={dlNumber}
                                                onChangeText={handleDLChange}
                                                maxLength={20}
                                                autoCapitalize="characters"
                                                editable={!isFetchingProfile}
                                            />
                                            {isFetchingProfile && <ActivityIndicator size="small" color={COLORS.primary} style={styles.inputLoader} />}
                                        </View>
                                        <Text style={styles.inputHint}>Format: 10-20 alphanumeric characters</Text>
                                    </View>
                                ) : (
                                    // Upgrade Prompt for users without 199 subscription
                                    <Animated.View entering={FadeInDown.duration(500).springify()} style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                        <Animated.View
                                            entering={ZoomIn.delay(200).duration(400).springify()}
                                            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 }}
                                        >
                                            <Ionicons name="card" size={50} color="#1E3A8A" />
                                        </Animated.View>
                                        <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 12 }}>
                                            {t('dlVerificationLocked') || 'DL Verification Locked'}
                                        </Animated.Text>
                                        <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 10 }}>
                                            {t('dlVerificationUpgradeMessage') || 'Upgrade to the Verified Driver plan (₹199/year) or higher to unlock DL Verification.'}
                                        </Animated.Text>
                                        <Animated.View entering={FadeInUp.delay(500).duration(400).springify()} style={{ width: '100%' }}>
                                            <TouchableOpacity
                                                onPress={() => dispatch(subscriptionModalAction({ visible: true, minPrice: 199 }))}
                                                activeOpacity={0.9}
                                                style={{ width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 }}
                                            >
                                                <LinearGradient
                                                    colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={{ paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                                >
                                                    <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.white} />
                                                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                                        {t('upgradeToVerified') || 'Upgrade to Verified Driver @ ₹199'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>
                                        <Animated.View entering={FadeIn.delay(600).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                                            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                                            <Text style={{ marginLeft: 8, fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>
                                                {t('verifiedBenefits') || 'Includes DL Check, PAN Check & Face Match'}
                                            </Text>
                                        </Animated.View>
                                    </Animated.View>
                                )
                            )}

                            {activeTab === 'PAN' && (
                                canAccessIdVerification ? (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}><Ionicons name="card" size={14} color={COLORS.textMuted} />  {t('panNumber') || 'PAN Number'}</Text>
                                        <View style={[styles.inputContainer, inputError ? styles.inputError : null]}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter PAN Number (e.g. ABCDE1234F)"
                                                placeholderTextColor={COLORS.textLight}
                                                value={panNumber}
                                                onChangeText={handlePanChange}
                                                maxLength={10}
                                                autoCapitalize="characters"
                                                editable={!isFetchingProfile}
                                            />
                                        </View>
                                        <Text style={styles.inputHint}>Format: 5 Letters, 4 Digits, 1 Letter</Text>
                                    </View>
                                ) : (
                                    // Upgrade Prompt for users without 199 subscription
                                    <Animated.View entering={FadeInDown.duration(500).springify()} style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                        <Animated.View
                                            entering={ZoomIn.delay(200).duration(400).springify()}
                                            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 }}
                                        >
                                            <Ionicons name="card" size={50} color="#1E3A8A" />
                                        </Animated.View>
                                        <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 12 }}>
                                            {t('panVerificationLocked') || 'PAN Verification Locked'}
                                        </Animated.Text>
                                        <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 10 }}>
                                            {t('panVerificationUpgradeMessage') || 'Upgrade to the Verified Driver plan (₹199/year) or higher to unlock PAN Verification.'}
                                        </Animated.Text>
                                        <Animated.View entering={FadeInUp.delay(500).duration(400).springify()} style={{ width: '100%' }}>
                                            <TouchableOpacity
                                                onPress={() => dispatch(subscriptionModalAction({ visible: true, minPrice: 199 }))}
                                                activeOpacity={0.9}
                                                style={{ width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 }}
                                            >
                                                <LinearGradient
                                                    colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={{ paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                                >
                                                    <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.white} />
                                                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                                        {t('upgradeToVerified') || 'Upgrade to Verified Driver @ ₹199'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>
                                        <Animated.View entering={FadeIn.delay(600).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                                            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                                            <Text style={{ marginLeft: 8, fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>
                                                {t('verifiedBenefits') || 'Includes DL Check, PAN Check & Face Match'}
                                            </Text>
                                        </Animated.View>
                                    </Animated.View>
                                )
                            )}





                            {activeTab === 'FACE' && (
                                canAccessIdVerification ? (
                                    <View>
                                        {/* Face Verification Header */}
                                        <View style={styles.faceVerifyHeader}>
                                            <MaterialCommunityIcons name="face-recognition" size={28} color={COLORS.primary} />
                                            <View style={{ marginLeft: 12, flex: 1 }}>
                                                <Text style={styles.faceVerifyTitle}>{t('faceVerification') || 'Face Verification'}</Text>
                                                <Text style={styles.faceVerifySubtitle}>{t('faceVerifyDesc') || 'Compare two face images to verify identity match'}</Text>
                                            </View>
                                        </View>

                                        {/* Source Face Image - Live Selfie Only */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>
                                                <Ionicons name="camera" size={14} color={COLORS.textMuted} />  {t('liveSelfie') || 'Live Selfie'}
                                            </Text>
                                            <View style={styles.faceImageContainer}>
                                                {faceImage1 ? (
                                                    <View style={styles.faceImagePreviewWrapper}>
                                                        <Image source={{ uri: faceImage1.path }} style={styles.faceImagePreview} />
                                                        <TouchableOpacity
                                                            onPress={() => setFaceImage1(null)}
                                                            style={styles.faceImageRemoveBtn}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Ionicons name="close" size={14} color={COLORS.white} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <View style={styles.faceImageActions}>
                                                        <TouchableOpacity onPress={handleCaptureFaceImage1} style={[styles.faceImageActionBtn, { flex: 1, borderRightWidth: 0 }]}>
                                                            <View style={styles.faceImageActionIconBg}>
                                                                <Ionicons name="camera" size={24} color={COLORS.primary} />
                                                            </View>
                                                            <Text style={styles.faceImageActionText}>{t('takeSelfie') || 'Take Selfie'}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Target Face Image - Preloaded License Image */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>
                                                <Ionicons name="card" size={14} color={COLORS.textMuted} />  {t('licenseImage') || 'License Image (Preloaded)'}
                                            </Text>
                                            <View style={styles.faceImageContainer}>
                                                {faceImage2 ? (
                                                    <View style={styles.faceImagePreviewWrapper}>
                                                        <Image source={{ uri: faceImage2.path }} style={styles.faceImagePreview} />
                                                        {/* No remove button for preloaded image */}
                                                    </View>
                                                ) : (
                                                    <View style={[styles.faceImageActions, { opacity: 0.6 }]}>
                                                        <View style={styles.faceImageActionBtn}>
                                                            {isFetchingProfile ? (
                                                                <ActivityIndicator size="small" color={COLORS.primary} />
                                                            ) : (
                                                                <Ionicons name="image-outline" size={24} color={COLORS.textLight} />
                                                            )}
                                                            <Text style={[styles.faceImageActionText, { color: COLORS.textLight, marginTop: 4 }]}>
                                                                {isFetchingProfile ? (t('loading') || 'Loading...') : (t('noLicenseImage') || 'No License Image Found')}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Info Card */}
                                        <View style={styles.faceInfoCard}>
                                            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                                            <Text style={styles.faceInfoText}>
                                                {t('faceVerifyInfo') || 'Upload or capture two face images to compare. The system will analyze facial features and return a similarity score.'}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    // Upgrade Prompt for users without 199 subscription
                                    <Animated.View entering={FadeInDown.duration(500).springify()} style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                        <Animated.View
                                            entering={ZoomIn.delay(200).duration(400).springify()}
                                            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 }}
                                        >
                                            <MaterialCommunityIcons name="face-recognition" size={50} color="#1E3A8A" />
                                        </Animated.View>
                                        <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 12 }}>
                                            {t('faceVerificationLocked') || 'Face Verification Locked'}
                                        </Animated.Text>
                                        <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 10 }}>
                                            {t('faceVerificationUpgradeMessage199') || 'Upgrade to the Verified Driver plan (₹199/year) or higher to unlock Face Verification.'}
                                        </Animated.Text>
                                        <Animated.View entering={FadeInUp.delay(500).duration(400).springify()} style={{ width: '100%' }}>
                                            <TouchableOpacity
                                                onPress={() => dispatch(subscriptionModalAction({ visible: true, minPrice: 199 }))}
                                                activeOpacity={0.9}
                                                style={{ width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 }}
                                            >
                                                <LinearGradient
                                                    colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={{ paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                                >
                                                    <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.white} />
                                                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                                        {t('upgradeToVerified') || 'Upgrade to Verified Driver @ ₹199'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>
                                        <Animated.View entering={FadeIn.delay(600).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                                            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                                            <Text style={{ marginLeft: 8, fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>
                                                {t('verifiedBenefits') || 'Includes DL Check, PAN Check & Face Match'}
                                            </Text>
                                        </Animated.View>
                                    </Animated.View>
                                )
                            )}

                            {activeTab === 'AADHAAR' && (
                                canAccessIdVerification ? (
                                    <View>
                                        <View style={styles.faceVerifyHeader}>
                                            <MaterialCommunityIcons name="fingerprint" size={28} color={COLORS.primary} />
                                            <View style={{ marginLeft: 12, flex: 1 }}>
                                                <Text style={styles.faceVerifyTitle}>{t('aadhaarVerification') || 'Aadhaar Verification / आधार सत्यापन'}</Text>
                                                <Text style={styles.faceVerifySubtitle}>{t('captureAadhaarDesc') || 'Capture front and back of your Aadhaar card / अपने आधार कार्ड के आगे और पीछे की फोटो लें'}</Text>
                                            </View>
                                        </View>

                                        {/* Front Image */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>
                                                <Ionicons name="camera" size={14} color={COLORS.textMuted} /> {t('frontAadhaar') || 'Front Aadhaar / आधार का सामने का भाग'}
                                            </Text>
                                            <View style={styles.faceImageContainer}>
                                                {aadhaarFrontImage ? (
                                                    <View style={styles.faceImagePreviewWrapper}>
                                                        <Image source={{ uri: aadhaarFrontImage.path }} style={[styles.faceImagePreview, { width: 220, height: 140, resizeMode: 'cover' }]} />
                                                        <TouchableOpacity
                                                            onPress={() => setAadhaarFrontImage(null)}
                                                            style={styles.faceImageRemoveBtn}
                                                        >
                                                            <Ionicons name="close" size={14} color={COLORS.white} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity onPress={handleCaptureAadhaarFront} style={styles.faceImageActionBtn}>
                                                        <View style={styles.faceImageActionIconBg}>
                                                            <Ionicons name="camera" size={24} color={COLORS.primary} />
                                                        </View>
                                                        <Text style={styles.faceImageActionText}>{t('captureFrontSide') || 'Capture Front Side / सामने का हिस्सा कैप्चर करें'}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        {/* Back Image */}
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>
                                                <Ionicons name="camera" size={14} color={COLORS.textMuted} /> {t('backAadhaar') || 'Back Aadhaar / आधार का पीछे का भाग'}
                                            </Text>
                                            <View style={styles.faceImageContainer}>
                                                {aadhaarBackImage ? (
                                                    <View style={styles.faceImagePreviewWrapper}>
                                                        <Image source={{ uri: aadhaarBackImage.path }} style={[styles.faceImagePreview, { width: 220, height: 140, resizeMode: 'cover' }]} />
                                                        <TouchableOpacity
                                                            onPress={() => setAadhaarBackImage(null)}
                                                            style={styles.faceImageRemoveBtn}
                                                        >
                                                            <Ionicons name="close" size={14} color={COLORS.white} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity onPress={handleCaptureAadhaarBack} style={styles.faceImageActionBtn}>
                                                        <View style={styles.faceImageActionIconBg}>
                                                            <Ionicons name="camera" size={24} color={COLORS.primary} />
                                                        </View>
                                                        <Text style={styles.faceImageActionText}>{t('captureBackSide') || 'Capture Back Side / पीछे का हिस्सा कैप्चर करें'}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    // Upgrade Prompt for Aadhaar
                                    <Animated.View entering={FadeInDown.duration(500).springify()} style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                        <Animated.View
                                            entering={ZoomIn.delay(200).duration(400).springify()}
                                            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 }}
                                        >
                                            <MaterialCommunityIcons name="fingerprint" size={50} color="#1E3A8A" />
                                        </Animated.View>
                                        <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 12 }}>
                                            Aadhaar Verification Locked
                                        </Animated.Text>
                                        <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 10 }}>
                                            Upgrade to the Verified Driver plan (₹199/year) or higher to unlock Aadhaar Verification.
                                        </Animated.Text>
                                        <Animated.View entering={FadeInUp.delay(500).duration(400).springify()} style={{ width: '100%' }}>
                                            <TouchableOpacity
                                                onPress={() => dispatch(subscriptionModalAction({ visible: true, minPrice: 199 }))}
                                                activeOpacity={0.9}
                                                style={{ width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 }}
                                            >
                                                <LinearGradient
                                                    colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={{ paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                                >
                                                    <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.white} />
                                                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                                        {t('upgradeToVerified') || 'Upgrade to Verified Driver @ ₹199'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>
                                        <Animated.View entering={FadeIn.delay(600).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                                            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                                            <Text style={{ marginLeft: 8, fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>
                                                {t('verifiedBenefits') || 'Includes DL Check, PAN Check & Face Match'}
                                            </Text>
                                        </Animated.View>
                                    </Animated.View>
                                )
                            )}

                            {inputError && <Text style={styles.errorText}>{inputError}</Text>}

                            {activeTab === 'DL' && canAccessIdVerification && (
                                <TouchableOpacity onPress={() => setConsentChecked(!consentChecked)} activeOpacity={0.7} style={styles.consentRow}>
                                    <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                                        {consentChecked && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                                    </View>
                                    <Text style={styles.consentText}>{t('dlConsentText') || 'I consent to verify my driving license for KYC purposes.'}</Text>
                                </TouchableOpacity>
                            )}

                            {activeTab === 'AADHAAR' && canAccessIdVerification && (
                                <TouchableOpacity onPress={() => setConsentChecked(!consentChecked)} activeOpacity={0.7} style={styles.consentRow}>
                                    <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                                        {consentChecked && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                                    </View>
                                    <Text style={styles.consentText}>
                                        {t('aadhaarConsent') || 'We confirm obtaining valid customer consent to access/process their Aadhaar data. / हम पुष्टि करते हैं कि हमें उनके आधार डेटा तक पहुंचने/संसाधित करने के लिए वैध ग्राहक सहमति प्राप्त हुई है।'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {error && (
                                <Animated.View entering={FadeIn.duration(300)} style={styles.errorCard}>
                                    <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                                    <Text style={styles.errorCardText}>{error}</Text>
                                </Animated.View>
                            )}

                            {/* Button Section - Show Upgrade or Verify based on error - Only show when user has access */}
                            {canAccessIdVerification && (
                                isUpgradeError ? (
                                    <TouchableOpacity
                                        onPress={handleOpenUpgradeModal}
                                        activeOpacity={0.9}
                                        style={styles.verifyButtonContainer}
                                    >
                                        <LinearGradient colors={['#F59E0B', '#FBBF24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyButton}>

                                            <Text style={styles.verifyButtonText}>{t('upgradeSubscription') || 'Upgrade Subscription'} </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={handleVerify}
                                        activeOpacity={0.9}
                                        disabled={isLoading || (activeTab === 'DL' && !consentChecked) || (activeTab === 'AADHAAR' && (!consentChecked || !aadhaarFrontImage || !aadhaarBackImage))}
                                        style={[
                                            styles.verifyButtonContainer,
                                            (isLoading || (activeTab === 'DL' && !consentChecked) || (activeTab === 'AADHAAR' && (!consentChecked || !aadhaarFrontImage || !aadhaarBackImage))) && styles.verifyButtonDisabled
                                        ]}
                                    >
                                        <LinearGradient colors={['#1E3A8A', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyButton}>
                                            {isLoading ? (
                                                <>
                                                    <ActivityIndicator size="small" color={COLORS.white} />
                                                    <Text style={styles.verifyButtonText}>{t('verifying') || 'Verifying...'}</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.white} />
                                                    <Text style={styles.verifyButtonText}>{t('verifyNow') || 'Verify Now'}</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )
                            )}
                        </Animated.View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Subscription Prompt Modal */}
            <Modal
                transparent
                visible={showSubscriptionPrompt}
                animationType="fade"
                onRequestClose={() => setShowSubscriptionPrompt(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center' }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <MaterialCommunityIcons name="shield-crown" size={32} color={COLORS.primary} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>{t('unlockIdVerification') || 'Unlock ID Verification'}</Text>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                            {t('idCheckPremiumFeature') || 'Advanced ID verification is a premium feature available with the Trusted Driver plan.'}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                setShowSubscriptionPrompt(false);
                                dispatch(subscriptionModalAction({ visible: true, minPrice: 499 }));
                            }}
                            activeOpacity={0.9}
                            style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
                        >
                            <LinearGradient colors={['#1E3A8A', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
                                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>Subscribe @ ₹499/Year</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowSubscriptionPrompt(false)} style={{ marginTop: 16, padding: 8 }}>
                            <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: '500' }}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* DigiLocker WebView Modal */}
            <Modal
                visible={showDigiLockerModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => {
                    // Show confirmation when trying to close with back button
                    Alert.alert(
                        t('cancelVerification') || 'Cancel Verification?',
                        t('cancelVerificationMessage') || 'You have not completed Aadhaar verification. Are you sure you want to cancel?',
                        [
                            { text: t('no') || 'No', style: 'cancel' },
                            {
                                text: t('yes') || 'Yes',
                                style: 'destructive',
                                onPress: () => {
                                    setShowDigiLockerModal(false);
                                    setDigiLockerUrl(null);
                                    setDigiLockerVerified(false);
                                }
                            }
                        ]
                    );
                }}
            >
                <View style={styles.digiLockerModalContainer}>
                    {/* Modal Header - No close button until verification is complete */}
                    <View style={[styles.digiLockerHeader, { paddingTop: safeAreaInsets.top, justifyContent: 'center' }]}>
                        <Text style={styles.digiLockerTitle}>{t('digiLockerVerification') || 'DigiLocker Verification'}</Text>
                    </View>

                    {/* Info Banner */}
                    <View style={styles.digiLockerInfoBanner}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.digiLockerInfoText}>
                            {t('completeVerificationToClose') || 'Please complete OTP verification to continue'}
                        </Text>
                    </View>

                    {/* WebView with incognito mode to clear session on each use */}
                    {digiLockerUrl && (
                        <WebView
                            source={{ uri: digiLockerUrl }}
                            style={{ flex: 1 }}
                            incognito={true}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.webViewLoading}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.webViewLoadingText}>{t('loadingDigiLocker') || 'Loading DigiLocker...'}</Text>
                                </View>
                            )}
                            onNavigationStateChange={(navState) => {
                                console.log('DigiLocker Navigation:', navState.url);
                                // Check if redirected to success/callback URL
                                // Using startsWith to avoid matching the redirect_uri param in the initial URL
                                if (navState.url.startsWith('https://secure.befisc.com') ||
                                    navState.url.includes('truckmitr.com/callback') ||
                                    navState.url.includes('success=true')) {
                                    // Mark as verified and close modal after successful verification
                                    setDigiLockerVerified(true);
                                    setTimeout(() => {
                                        setShowDigiLockerModal(false);
                                        setDigiLockerUrl(null);
                                        showToast(t('aadhaarVerificationSuccess') || 'Aadhaar verification initiated successfully!');
                                    }, 2000);
                                }
                            }}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                console.warn('DigiLocker WebView error:', nativeEvent);
                            }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            thirdPartyCookiesEnabled={true}
                            sharedCookiesEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            mixedContentMode="compatibility"
                        />
                    )}
                </View>
            </Modal>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Verifying...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

// Detail Row
const DetailRow = ({ icon, label, value, highlight = false, isStatus = false, statusType = 'success', multiline = false }: any) => (
    <View style={styles.detailRow}>
        <View style={styles.detailLabelContainer}>
            <Ionicons name={icon} size={16} color={COLORS.textMuted} />
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        {isStatus ? (
            <View style={[styles.statusBadge, statusType === 'success' ? styles.statusSuccess : styles.statusWarning]}>
                <Text style={[styles.statusText, statusType === 'success' ? styles.statusTextSuccess : styles.statusTextWarning]}>{value}</Text>
            </View>
        ) : (
            <Text style={[styles.detailValue, highlight && styles.detailValueHighlight, multiline && { flex: 1, textAlign: 'right' }]}>{value || '-'}</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 8, backgroundColor: COLORS.white,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
    },
    backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.inputBg },
    headerText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    headerCard: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    headerTextContainer: { flex: 1, marginLeft: 12 },
    kycIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    headerSubtitle: { fontSize: 13, color: COLORS.textMuted },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
    activeTab: { backgroundColor: '#EFF6FF', borderColor: COLORS.primaryLight, borderWidth: 1 },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.inactiveTabText },
    activeTabText: { color: COLORS.primary },

    // Form
    formCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowOpacity: 0.04, elevation: 1 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.inputBg, paddingHorizontal: 16 },
    inputError: { borderColor: COLORS.error },
    input: { flex: 1, height: 48, fontSize: 15, fontWeight: '600', color: COLORS.text, letterSpacing: 0.3 },
    inputLoader: { marginLeft: 8 },
    inputHint: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
    errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },

    // Consent
    consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
    checkboxChecked: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    consentText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

    // Buttons
    verifyButtonContainer: { borderRadius: 14, overflow: 'hidden', shadowColor: COLORS.primary, shadowOpacity: 0.2, elevation: 4 },
    verifyButtonDisabled: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
    verifyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
    verifyButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
    secondaryButton: { marginTop: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12 },
    secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.text },

    // Error
    errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.errorBg, borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
    errorCardText: { flex: 1, fontSize: 13, color: COLORS.error, fontWeight: '500' },

    // Result
    successCard: { alignItems: 'center', marginBottom: 24, backgroundColor: COLORS.white, padding: 24, borderRadius: 16 },
    successIconContainer: { marginBottom: 16 },
    successIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.successBg, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    successSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

    detailsCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 16, shadowOpacity: 0.04, elevation: 1 },
    detailsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
    detailsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    detailsGrid: { gap: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
    detailLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '40%' },
    detailLabel: { fontSize: 13, color: COLORS.textMuted },
    detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1, textAlign: 'right' },
    detailValueHighlight: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusSuccess: { backgroundColor: COLORS.successBg },
    statusWarning: { backgroundColor: COLORS.warningBg },
    statusText: { fontSize: 12, fontWeight: '700' },
    statusTextSuccess: { color: COLORS.success },
    statusTextWarning: { color: COLORS.warning },

    categoriesSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
    categoriesTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 10 },
    categoriesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryBadge: { backgroundColor: COLORS.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    categoryText: { fontSize: 12, fontWeight: '600', color: COLORS.text },

    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    loadingCard: { backgroundColor: COLORS.white, padding: 24, borderRadius: 16, alignItems: 'center', shadowOpacity: 0.1, elevation: 5 },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: COLORS.primary },

    // Required Documents Section
    requiredDocsSection: { marginBottom: 20 },
    requiredDocsTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },

    // Document Type Grid (3x2)
    docTypeGrid: { marginBottom: 20 },
    docTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
    docTypeButton: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    docTypeIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    docTypeLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

    // Placeholder Inputs Section
    placeholderInputsSection: { marginTop: 8 },
    placeholderInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    placeholderText: { fontSize: 14, color: COLORS.textLight },
    selfieInputPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        paddingHorizontal: 16,
        paddingVertical: 14
    },

    // Verification Process
    verificationProcessCard: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    verificationProcessTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
    processStepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    processStepNumberText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
    processStepLine: { width: 2, height: 24, backgroundColor: '#E0E7FF', marginTop: 4 },
    processStepText: { fontSize: 14, color: COLORS.textMuted, flex: 1, paddingTop: 6 },

    // ID Check Button with Glow Effect
    idCheckButtonContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    idCheckButtonGlow: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 12,
    },
    idCheckButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16
    },
    idCheckButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },

    // Face Verification Styles
    faceVerifyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    faceVerifyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    faceVerifySubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

    faceImageContainer: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
    },
    faceImagePreviewWrapper: {
        position: 'relative',
        alignItems: 'center',
    },
    faceImagePreview: {
        width: 120,
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    faceImageRemoveBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.error,
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    faceImageActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    faceImageActionBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    faceImageActionIconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    faceImageActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    faceImageDivider: {
        width: 1,
        height: 60,
        backgroundColor: COLORS.border,
        marginHorizontal: 16,
    },
    faceInfoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        gap: 10,
    },
    faceInfoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 19,
    },
    faceResultIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: 14,
        marginTop: 16,
        gap: 12,
    },
    faceResultText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 19,
    },

    // DigiLocker Modal Styles
    digiLockerModalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    digiLockerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border,
    },
    digiLockerCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.inputBg,
    },
    digiLockerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    digiLockerInfoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF4E5', // Light orange background for warning/info
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#FFE0B2',
    },
    digiLockerInfoText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        color: '#E65100', // Darker orange text
        fontWeight: '500',
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    webViewLoadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
});
