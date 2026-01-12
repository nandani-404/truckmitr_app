import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    TouchableWithoutFeedback,
    AccessibilityInfo,
    FlatList,
    SafeAreaView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    ZoomIn,
    FadeInDown,
    FadeInUp,
    FadeIn,
    SlideInUp,
} from 'react-native-reanimated';
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useColor, useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS, STATICS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import RazorpayCheckout from 'react-native-razorpay';
import { jobAddAction, subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import { hitSlop } from '@truckmitr/src/app/functions';

// Truck Images
const TruckImages = {
    cargoOpen: require('@truckmitr/src/assets/trucks/open_cargo.png'),
    cargoClosed: require('@truckmitr/src/assets/trucks/close_cargo.png'),
    tipper: require('@truckmitr/src/assets/trucks/tripper.png'),
    trailer: require('@truckmitr/src/assets/trucks/tailer.png'),
    tanker: require('@truckmitr/src/assets/trucks/tainkers.png'),
    carCarrier: require('@truckmitr/src/assets/trucks/car_carrier.png'),
    container: require('@truckmitr/src/assets/trucks/container.png'),
    reefer: require('@truckmitr/src/assets/trucks/refregerator.png'),
};

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// --- Job Steps Configuration ---
const JOB_STEPS = [
    { id: 'job_title', title: 'jobTitle', subtitle: 'enterJobTitleHint', field: 'job_title', required: true, icon: 'briefcase-outline' },
    { id: 'job_location', title: 'jobLocation', subtitle: 'selectJobLocationHint', field: 'job_location', required: true, icon: 'location-outline' },
    { id: 'route', title: 'route', subtitle: 'enterRouteHint', field: null, required: false, icon: 'map-outline' },
    { id: 'vehicle_type', title: 'vehicleType', subtitle: 'selectVehicleTypeHint', field: 'vehicle_type', required: true, icon: 'car-outline' },
    { id: 'experience', title: 'experienceInYears', subtitle: 'selectExperienceHint', field: 'Required_Experience', required: true, icon: 'time-outline' },
    { id: 'license_type', title: 'typeOfLicense', subtitle: 'selectLicenseTypeHint', field: 'Type_of_License', required: true, icon: 'card-outline' },
    { id: 'preferred_skills', title: 'preferredSkills', subtitle: 'selectPreferredSkillsHint', field: 'Preferred_Skills', required: true, icon: 'construct-outline' },
    { id: 'salary_range', title: 'fixedSalary', subtitle: 'selectSalaryRangeHint', field: 'Salary_Range', required: true, icon: 'cash-outline' },
    { id: 'esi_pf', title: 'esiPf', subtitle: 'selectEsiPfHint', field: 'esi_pf_provided', required: true, icon: 'shield-checkmark-outline' },
    { id: 'food_allowance', title: 'foodAllowance', subtitle: 'selectFoodAllowanceHint', field: 'food_allowance_provided', required: true, icon: 'restaurant-outline' },
    { id: 'trip_incentive', title: 'tripIncentive', subtitle: 'selectTripIncentiveHint', field: null, required: false, icon: 'gift-outline' },
    { id: 'accommodation', title: 'accommodationFacility', subtitle: 'selectAccommodationHint', field: 'accommodation_provided', required: true, icon: 'home-outline' },
    { id: 'mileage', title: 'mileage', subtitle: 'selectMileageHint', field: 'mileage_required', required: true, icon: 'speedometer-outline' },
    { id: 'fastag', title: 'fastagRoadKharcha', subtitle: 'selectFastagHint', field: null, required: false, icon: 'card-outline' },
    { id: 'drivers_count', title: 'numberOfDrivers', subtitle: 'enterDriversCountHint', field: 'Job_Management', required: true, icon: 'people-outline' },
    { id: 'job_description', title: 'jobDescriptionTitle', subtitle: 'writeDescriptionHint', field: 'Job_Description', required: true, icon: 'document-text-outline' },
    { id: 'truck_condition', title: 'truckCondition', subtitle: 'selectTruckConditionHint', field: 'truck_condition', required: false, icon: 'build-outline' },
    { id: 'deadline', title: 'applicationDeadline', subtitle: 'selectDeadlineHint', field: 'Application_Deadline', required: true, icon: 'calendar-outline' },
    { id: 'job_summary', title: 'jobSummary', subtitle: 'reviewJobDetailsHint', field: null, required: false, icon: 'checkbox-outline' },
];

// Data Arrays
const vehicleTypes = [
    { label: 'Cargo Truck (Open)', value: 'Cargo Truck (Open)', image: TruckImages.cargoOpen },
    { label: 'Cargo Truck (Closed)', value: 'Cargo Truck (Closed)', image: TruckImages.cargoClosed },
    { label: 'Tipper Trucks', value: 'Tipper Trucks', image: TruckImages.tipper },
    { label: 'Trailer / Semi-Trailer', value: 'Trailer / Semi-Trailer Trucks', image: TruckImages.trailer },
    { label: 'Tankers', value: 'Tankers', image: TruckImages.tanker },
    { label: 'Car Carriers', value: 'Car Carriers', image: TruckImages.carCarrier },
    { label: 'Container Trucks', value: 'Container Trucks', image: TruckImages.container },
    { label: 'Reefer Trucks', value: 'Refrigerator (Reefer) Trucks', image: TruckImages.reefer },
];

const drivingExperienceArray = [
    { labelKey: 'exp1to5Years', label: '1-5 years', value: '1-5' },
    { labelKey: 'exp5to10Years', label: '5-10 years', value: '5-10' },
    { labelKey: 'exp10to15Years', label: '10-15 years', value: '10-15' },
    { labelKey: 'exp15to20Years', label: '15-20 years', value: '15-20' },
    { labelKey: 'exp20PlusYears', label: '20+ years', value: '20+' },
];

const salaryRanges = [

    { label: '₹20,000 - 25,000', value: '20000-25000' },
    { label: '₹25,000 - 30,000', value: '25000-30000' },
    { label: '₹30,000 - 35,000', value: '30000-35000' },
    { label: '₹35,000 - 40,000', value: '35000-40000' },
    { label: '₹40,000 - 45,000', value: '40000-45000' },
    { label: '₹45,000 - 50,000', value: '45000-50000' },
    { label: '₹50,000 - 55,000', value: '50000-55000' },
    { label: '₹55,000 - 60,000', value: '55000-60000' },
];

const licenseTypes = [
    { label: 'LMV (Light)', value: 'LMV', emoji: '🚗' },
    { label: 'HMV (Heavy)', value: 'HMV', emoji: '🚛' },
    { label: 'HGMV (Goods)', value: 'HGMV', emoji: '📦' },
    { label: 'HPMV/HTV', value: 'HPMV/HTV', emoji: '🚚' },
];

const operationalSegments = [
    { id: 'ecommerce', label: 'E-commerce', emoji: '📦' },
    { id: 'white_goods', label: 'White Goods', emoji: '🏠' },
    { id: 'livestock', label: 'Livestock', emoji: '🐄' },
    { id: 'perishable', label: 'Perishable', emoji: '🍎' },
    { id: 'oversized', label: 'Oversized', emoji: '📏' },
    { id: 'fuel_tanker', label: 'Fuel Tanker', emoji: '⛽' },
    { id: 'automobile', label: 'Automobile Carrier', emoji: '🚗' },
    { id: 'construction', label: 'Construction', emoji: '🏗️' },
    { id: 'refrigerator', label: 'Refrigerator Vehicle', emoji: '❄️' },
    { id: 'others', label: 'Others', emoji: '📋' },
];

export default function AddJob() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    useStatusBarStyle('dark-content');
    const colors = useColor();
    const { responsiveHeight, responsiveFontSize } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { addJob } = useSelector((state: any) => state?.job);
    const { isTransporter, subscriptionDetails, subscriptionModal, user } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [locationsList, setLocationsList] = useState<any[]>([]);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [finishing, setFinishing] = useState(false);
    const [checkBoxSelect, setCheckBoxSelect] = useState<boolean>(true);
    const [availableFreeJob, setAvailableFreeJob] = useState<boolean>(false);
    const [showSecondJobPopup, setShowSecondJobPopup] = useState<boolean>(false);
    const [calendarMonth, setCalendarMonth] = useState(moment().format('YYYY-MM-DD'));
    const [yearPickerOpen, setYearPickerOpen] = useState(false);

    // Pincode states
    const [pincode, setPincode] = useState('');
    const [pincodeAreas, setPincodeAreas] = useState<any[]>([]);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState('');
    const [selectedArea, setSelectedArea] = useState<string | null>(null);

    // ===== JOB PREMIUM PAYMENT MODAL STATE =====
    const [jobPremiumModalVisible, setJobPremiumModalVisible] = useState(false);
    const [jobPremiumPlans, setJobPremiumPlans] = useState<any[]>([]);
    const [jobPremiumLoading, setJobPremiumLoading] = useState(false);
    const [postedJobId, setPostedJobId] = useState<string | null>(null);
    const [selectedPremiumPlan, setSelectedPremiumPlan] = useState<any>(null);
    const [showSkipConfirmDialog, setShowSkipConfirmDialog] = useState(false);

    // ===== ACCESSIBILITY: REDUCED MOTION SUPPORT =====
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
            setReduceMotion(enabled);
        });
    }, []);

    // Animation config based on accessibility
    const animationConfig = useMemo(() => ({
        duration: reduceMotion ? 0 : 400,
        springDamping: reduceMotion ? 100 : 15,
        springStiffness: reduceMotion ? 1000 : 100,
    }), [reduceMotion]);

    // ===== PREMIUM ANIMATIONS =====
    // Screen entrance animation
    const screenOpacity = useSharedValue(0);
    const screenTranslateY = useSharedValue(reduceMotion ? 0 : 30);

    // Content transition animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);
    const contentScale = useSharedValue(1);

    // Progress bar animation
    const progressWidth = useSharedValue(0);

    // Button animation
    const buttonScale = useSharedValue(1);

    // Card animation
    const cardScale = useSharedValue(reduceMotion ? 1 : 0.95);
    const cardOpacity = useSharedValue(0);

    // ===== BACKGROUND GRADIENT SHIMMER =====
    const bgGradientOffset = useSharedValue(0);

    useEffect(() => {
        if (!reduceMotion) {
            bgGradientOffset.value = withRepeat(
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        }
    }, [reduceMotion]);

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        opacity: reduceMotion ? 0 : 0.03,
        transform: [{ translateX: bgGradientOffset.value * 100 }]
    }));

    const progressPercent = ((currentStep + 1) / JOB_STEPS.length) * 100;

    // Initial screen entrance
    useEffect(() => {
        if (!reduceMotion) {
            screenOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
            screenTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
        } else {
            screenOpacity.value = 1;
            screenTranslateY.value = 0;
        }
    }, [reduceMotion]);

    // Load locations
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInstance.get(END_POINTS.GETSTATES);
                if (response?.data?.status) {
                    setLocationsList(response?.data?.data);
                }
            } catch (error: any) {
                console.log('Error fetching locations:', error);
            }
        };
        fetchData();
        fetchAvailableFreeJob();

        // Initialize addJob if it's null (for new job posting)
        if (!addJob) {
            dispatch(jobAddAction({}));
        }


        // Initialize addJob if it's null (for new job posting)
        if (!addJob) {
            dispatch(jobAddAction({}));
        }

        return () => {
            dispatch(jobAddAction(null));
        };
    }, []);

    // Initialize pincode and area for edit mode (when backend returns these fields)
    useEffect(() => {
        if (addJob?.pincode) {
            setPincode(addJob.pincode);
            // Fetch areas for the pincode to populate dropdown
            fetchAreasByPincode(addJob.pincode);
        }
        if (addJob?.area) {
            setSelectedArea(addJob.area);
        }
    }, [addJob?.id]);

    const fetchAvailableFreeJob = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS?.TRANSPORTER_ALL_JOBS(''));
            if (response?.data?.hasOwnProperty('available_free_job')) {
                setAvailableFreeJob(response.data.available_free_job);
            } else {
                setAvailableFreeJob(false);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

    // Fetch areas by pincode
    const fetchAreasByPincode = async (pincodeValue: string) => {
        if (pincodeValue.length !== 6) {
            setPincodeAreas([]);
            setPincodeError('');
            return;
        }

        setPincodeLoading(true);
        setPincodeError('');
        setPincodeAreas([]);
        setSelectedArea(null);

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
            const data = await response.json();

            if (data && data[0]) {
                if (data[0].Status === 'Success' && data[0].PostOffice) {
                    const areas = data[0].PostOffice.map((po: any) => ({
                        label: po.Name,
                        value: po.Name,
                        district: po.District,
                        state: po.State
                    }));
                    setPincodeAreas(areas);
                } else {
                    setPincodeError(t('invalidPincode') || 'Invalid pincode. No areas found.');
                }
            }
        } catch (error) {
            console.error('Error fetching pincode data:', error);
            setPincodeError(t('pincodeApiError') || 'Error fetching pincode data. Please try again.');
        } finally {
            setPincodeLoading(false);
        }
    };

    // Handle pincode change
    const handlePincodeChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
        setPincode(numericText);

        if (numericText.length === 6) {
            fetchAreasByPincode(numericText);
        } else {
            setPincodeAreas([]);
            setPincodeError('');
            setSelectedArea(null);
        }
    };

    // Animate progress bar
    useEffect(() => {
        progressWidth.value = withTiming(progressPercent, {
            duration: 600,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
        });
    }, [progressPercent]);

    // ===== PROGRESS BAR SHIMMER EFFECT =====
    const shimmerOpacity = useSharedValue(0.8);

    useEffect(() => {
        shimmerOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 800 }),
                withTiming(0.8, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedShimmerStyle = useAnimatedStyle(() => ({
        opacity: shimmerOpacity.value
    }));

    // Step transition animation with horizontal slide
    useEffect(() => {
        // Fade out and slide
        contentOpacity.value = 0;
        contentTranslateX.value = 50;
        contentScale.value = 0.95;

        // Fade in and slide back
        contentOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
        contentTranslateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        contentScale.value = withSpring(1, { damping: 15, stiffness: 100 });

        // Card entrance animation
        cardOpacity.value = 0;
        cardScale.value = 0.9;
        cardOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
        cardScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));
    }, [currentStep]);

    const animatedScreenStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
        transform: [{ translateY: screenTranslateY.value }]
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [
            { translateX: contentTranslateX.value },
            { scale: contentScale.value }
        ]
    }));

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`
    }));

    const animatedCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ scale: cardScale.value }]
    }));

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    // ===== ICON PULSE ANIMATION =====
    const iconScale = useSharedValue(1);
    const iconRotate = useSharedValue(0);

    useEffect(() => {
        // Pulse and rotate icon on step change
        iconScale.value = 0.5;
        iconRotate.value = -180;

        iconScale.value = withSequence(
            withSpring(1.2, { damping: 8, stiffness: 150 }),
            withSpring(1, { damping: 10, stiffness: 100 })
        );
        iconRotate.value = withSpring(0, { damping: 12, stiffness: 80 });
    }, [currentStep]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: iconScale.value },
            { rotate: `${iconRotate.value}deg` }
        ]
    }));

    // ===== VALIDATION SHAKE ANIMATION =====
    const shakeTranslateX = useSharedValue(0);

    const triggerShake = () => {
        shakeTranslateX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
    };

    const animatedShakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeTranslateX.value }]
    }));

    // ===== HEADER SLIDE-IN ANIMATION =====
    const headerTranslateY = useSharedValue(-50);
    const headerOpacity = useSharedValue(0);

    useEffect(() => {
        headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
        headerTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }));
    }, []);

    const animatedHeaderStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ translateY: headerTranslateY.value }]
    }));

    // ===== FOOTER SLIDE-UP ANIMATION =====
    const footerTranslateY = useSharedValue(100);
    const footerOpacity = useSharedValue(0);

    useEffect(() => {
        footerOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
        footerTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 100 }));
    }, []);

    const animatedFooterStyle = useAnimatedStyle(() => ({
        opacity: footerOpacity.value,
        transform: [{ translateY: footerTranslateY.value }]
    }));

    // ===== STEP COUNTER ANIMATION =====
    const counterScale = useSharedValue(1);

    useEffect(() => {
        counterScale.value = withSequence(
            withSpring(1.3, { damping: 8, stiffness: 200 }),
            withSpring(1, { damping: 10, stiffness: 150 })
        );
    }, [currentStep]);

    const animatedCounterStyle = useAnimatedStyle(() => ({
        transform: [{ scale: counterScale.value }]
    }));

    // ===== SELECTION TILE ANIMATION =====
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const tileScale = useSharedValue(1);
    const tileGlow = useSharedValue(0);

    const animateTileSelection = (tileId: string) => {
        setSelectedTileId(tileId);

        // Bounce effect
        tileScale.value = withSequence(
            withSpring(1.1, { damping: 6, stiffness: 200 }),
            withSpring(1, { damping: 8, stiffness: 150 })
        );

        // Glow pulse
        tileGlow.value = withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(300, withTiming(0, { duration: 400 }))
        );
    };

    const createTileAnimationStyle = (tileId: string, isSelected: boolean) => {
        return useAnimatedStyle(() => {
            const isAnimating = selectedTileId === tileId;
            return {
                transform: [{ scale: isAnimating ? tileScale.value : 1 }],
                shadowOpacity: isAnimating ? tileGlow.value * 0.3 : (isSelected ? 0.15 : 0.08),
            };
        });
    };

    // ===== STAGGERED LIST ANIMATION =====
    const createStaggeredAnimation = (index: number) => {
        const opacity = useSharedValue(0);
        const translateY = useSharedValue(20);
        const scale = useSharedValue(0.9);

        useEffect(() => {
            const delay = index * 80; // 80ms stagger between items

            opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
            translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
            scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
        }, [currentStep]);

        return useAnimatedStyle(() => ({
            opacity: opacity.value,
            transform: [
                { translateY: translateY.value },
                { scale: scale.value }
            ]
        }));
    };

    // ===== INPUT FOCUS GLOW ANIMATION =====
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const inputGlow = useSharedValue(0);
    const inputBorderColor = useSharedValue(0);

    const handleInputFocus = (inputId: string) => {
        setFocusedInput(inputId);
        inputGlow.value = withSpring(1, { damping: 15, stiffness: 100 });
        inputBorderColor.value = withTiming(1, { duration: 200 });
    };

    const handleInputBlur = () => {
        setFocusedInput(null);
        inputGlow.value = withSpring(0, { damping: 15, stiffness: 100 });
        inputBorderColor.value = withTiming(0, { duration: 200 });
    };

    const createInputAnimationStyle = (inputId: string) => {
        return useAnimatedStyle(() => {
            const isFocused = focusedInput === inputId;
            return {
                shadowOpacity: isFocused ? inputGlow.value * 0.25 : 0,
                shadowRadius: isFocused ? 8 : 0,
                borderColor: isFocused ? '#246BFD' : '#CED4DA',
            };
        });
    };

    // ===== SUCCESS CHECKMARK ANIMATION =====
    const checkmarkScale = useSharedValue(0);
    const checkmarkRotate = useSharedValue(-90);

    const animateCheckmark = () => {
        checkmarkScale.value = 0;
        checkmarkRotate.value = -90;

        checkmarkScale.value = withSequence(
            withSpring(1.2, { damping: 6, stiffness: 200 }),
            withSpring(1, { damping: 10, stiffness: 150 })
        );
        checkmarkRotate.value = withSpring(0, { damping: 12, stiffness: 100 });
    };

    const animatedCheckmarkStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: checkmarkScale.value },
            { rotate: `${checkmarkRotate.value}deg` }
        ]
    }));

    const handleNext = async () => {
        const step = JOB_STEPS[currentStep];

        // Validation
        if (step.id === 'preferred_skills') {
            if (!addJob?.Preferred_Skills || addJob.Preferred_Skills.length === 0) {
                triggerShake();
                showToast(t('pleaseSelectAtLeastOne') || 'Please select at least one skill');
                return;
            }
        } else if (step.id === 'food_allowance') {
            // Validate food allowance selection is required
            if (!addJob?.food_allowance_provided) {
                triggerShake();
                showToast(t('pleaseSelectFoodAllowance') || 'Please select Yes or No for food allowance');
                return;
            }
            // Validate food allowance amount if "Yes" is selected
            if (addJob?.food_allowance_provided === 'yes' && (!addJob?.food_allowance_amount || addJob.food_allowance_amount.trim() === '')) {
                triggerShake();
                showToast(t('pleaseEnterFoodAllowanceAmount') || 'Please enter food allowance amount');
                return;
            }
        } else if (step.id === 'trip_incentive') {
            // Validate trip incentive amount if "Yes" is selected
            if (addJob?.trip_incentive_provided === 'yes' && (!addJob?.trip_incentive_amount || addJob.trip_incentive_amount.trim() === '')) {
                triggerShake();
                showToast(t('pleaseEnterTripIncentiveAmount') || 'Please enter trip incentive amount');
                return;
            }
        } else if (step.id === 'mileage') {
            // Validate mileage selection is required
            if (!addJob?.mileage_required) {
                triggerShake();
                showToast(t('pleaseSelectMileage') || 'Please select Yes or No for mileage');
                return;
            }
            // Validate mileage amount if "Yes" is selected
            if (addJob?.mileage_required === 'yes' && (!addJob?.mileage_amount || addJob.mileage_amount.trim() === '')) {
                triggerShake();
                showToast(t('pleaseEnterMileageAmount') || 'Please enter mileage amount');
                return;
            }
        } else if (step.id === 'fastag') {
            // Validate fastag amount if "Yes" is selected
            if (addJob?.fastag_provided === 'yes' && (!addJob?.fastag_amount || addJob.fastag_amount.trim() === '')) {
                triggerShake();
                showToast(t('pleaseEnterFastagAmount') || 'Please enter FASTag/Road Kharcha amount');
                return;
            }
        } else if (step.field && step.required && !addJob?.[step.field]) {
            triggerShake();
            showToast(t('pleaseEnterAllRequiredDetails') || 'Please fill in this field');
            return;
        }

        if (currentStep < JOB_STEPS.length - 1) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 200);
        } else {
            // Check subscription before final submit
            if (addJob?.id) {
                submitJob();
                return;
            }
            if (isTransporter && !availableFreeJob && subscriptionDetails?.showSubscriptionModel) {
                setShowSecondJobPopup(true);
            } else {
                submitJob();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
            }, 200);
        } else {
            navigation.goBack();
        }
    };

    const handleSecondJobPopupResponse = (proceed: boolean) => {
        setShowSecondJobPopup(false);
        if (proceed) {
            !subscriptionModal && dispatch(subscriptionModalAction(true));
        }
    };

    const toggleSkill = (label: string) => {
        const current = addJob?.Preferred_Skills || [];
        let newSkills;
        if (current.includes(label)) {
            newSkills = current.filter((i: string) => i !== label);
        } else {
            newSkills = [...current, label];
        }
        dispatch(jobAddAction({ ...addJob, Preferred_Skills: newSkills }));
    };

    const submitJob = async () => {
        if (!checkBoxSelect) {
            showToast(t('youNeedToAcceptTruckMitr') || 'Please accept the terms');
            return;
        }

        setFinishing(true);
        const FormData = require('form-data');
        let data = new FormData();
        data.append('job_title', addJob?.job_title);
        data.append('job_location', addJob?.job_location);
        data.append('pincode', addJob?.pincode || '');
        data.append('area', addJob?.area || '');
        data.append('route', addJob?.route || '');
        data.append('vehicle_type', addJob?.vehicle_type);
        data.append('Required_Experience', addJob?.Required_Experience);
        data.append('Salary_Range', addJob?.Salary_Range);
        data.append('esi_pf', addJob?.esi_pf_provided);
        data.append('food_allowance', addJob?.food_allowance_provided || 'no');
        data.append('food_allowance_desc', addJob?.food_allowance_amount || '');
        data.append('trip_incentive', addJob?.trip_incentive_provided || 'no');
        data.append('trip_incentive_desc', addJob?.trip_incentive_amount || '');
        data.append('rahane_ki_suvidha', addJob?.accommodation_provided || 'no');
        data.append('mileage', addJob?.mileage_required || 'no');
        data.append('mileage_desc', addJob?.mileage_amount || '');
        data.append('fast_tag_road_kharcha', addJob?.fastag_provided || 'no');
        data.append('fast_tag_road_kharcha_desc', addJob?.fastag_amount || '');
        data.append('Type_of_License', addJob?.Type_of_License);
        data.append('Preferred_Skills', JSON.stringify(addJob?.Preferred_Skills));
        data.append('Application_Deadline', moment(addJob?.Application_Deadline).format("DD-MM-YYYY"));
        data.append('number_of_drivers_required', addJob?.Job_Management);
        data.append('Job_Description', addJob?.Job_Description);
        data.append('truck_condition', addJob?.truck_condition || '');
        data.append('consent_visible_driver', checkBoxSelect ? 1 : 0);
        // console.log('+++++++++++++++++++++++formdata++++++++++++++++', data);

        try {
            const response = addJob?.id
                ? await axiosInstance.post(END_POINTS.TRANSPORTER_EDIT_JOB(addJob?.id), data)
                : await axiosInstance.post(END_POINTS.TRANSPORTER_ADD_JOB, data);

            if (response?.data?.status) {
                // Get the job ID from response
                const jobId = response?.data?.data?.unique_id || response?.data?.data?.id || response?.data?.job_id || addJob?.id;
                console.log('Job posted successfully, job ID:', jobId);

                // Save job ID and fetch premium plans
                if (jobId && !addJob?.id) {
                    // Only show payment modal for new jobs (not edits)
                    setPostedJobId(jobId);
                    await fetchJobPremiumPlans();
                    setFinishing(false);
                    setJobPremiumModalVisible(true);
                } else {
                    // For edits, just show success and navigate
                    setShowSuccess(true);
                    setTimeout(() => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 1,
                                routes: [
                                    {
                                        name: STACKS.BOTTOM_TAB,
                                        state: { index: 0, routes: [{ name: STACKS.HOME }] },
                                    },
                                    { name: STACKS.VIEW_JOBS },
                                ],
                            })
                        );
                        dispatch(jobAddAction(null));
                    }, 2500);
                }
            } else {
                showToast(response?.data?.message);
            }
        } catch (error) {
            console.log('Add job error:', JSON.stringify(error));
            showToast(t('somethingWentWrong') || 'Something went wrong');
        } finally {
            if (!postedJobId) {
                setFinishing(false);
            }
        }
    };

    // Fetch job premium plans from API
    const fetchJobPremiumPlans = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.SUBSCRIPTION_PLANS('transporter'));
            console.log('Job Premium Plans API response:', JSON.stringify(response?.data, null, 2));

            // Handle different API response structures
            let allPlans: any[] = [];

            if (response?.data && Array.isArray(response.data)) {
                allPlans = response.data;
            } else if (response?.data?.data && Array.isArray(response.data.data)) {
                allPlans = response.data.data;
            } else if (response?.data?.plans && Array.isArray(response.data.plans)) {
                allPlans = response.data.plans;
            }

            console.log('All plans from API:', allPlans.map((p: any) => ({ id: p.id, name: p.name, amount: p.amount })));

            // Filter for premium_job and super_premium_job plans
            const jobPlans = allPlans.filter((plan: any) =>
                plan.name === 'premium_job' || plan.name === 'super_premium_job'
            );

            // Sort so premium_job comes first (₹1,999), then super_premium_job (₹2,999)
            jobPlans.sort((a: any, b: any) => a.amount - b.amount);

            console.log('Filtered job premium plans:', jobPlans);
            setJobPremiumPlans(jobPlans);
        } catch (error) {
            console.log('Error fetching job premium plans:', error);
        }
    };

    // Handle job premium payment
    const handleJobPremiumPayment = async (plan: any) => {
        try {
            setJobPremiumLoading(true);
            setSelectedPremiumPlan(plan);

            // Create subscription order with job_id
            const orderPayload = {
                plan_id: plan.id,
                number_of_drivers: parseInt(addJob?.Job_Management) || 1,
                job_id: postedJobId
            };

            console.log('Creating job premium order with payload:', orderPayload);

            const orderResponse = await axiosInstance.post(END_POINTS.SUBSCRIPTION_ORDER, orderPayload);
            console.log('Subscription order response:', JSON.stringify(orderResponse?.data, null, 2));

            if (orderResponse?.data?.success || orderResponse?.data?.status) {
                const orderId = orderResponse?.data?.order_id ||
                    orderResponse?.data?.data?.order_id ||
                    orderResponse?.data?.id ||
                    orderResponse?.data?.data?.id;

                if (orderId) {
                    await openRazorpayCheckout(orderId, plan);
                } else {
                    throw new Error('Order ID not found in response');
                }
            } else {
                throw new Error(orderResponse?.data?.message || 'Failed to create order');
            }
        } catch (error: any) {
            console.log('Job premium payment error:', error);
            showToast(error?.response?.data?.message || error?.message || t('somethingWentWrong'));
            setJobPremiumLoading(false);
        }
    };

    // Open Razorpay checkout
    const openRazorpayCheckout = async (orderId: string, plan: any) => {
        // Format mobile number
        const rawMobile = String(user?.mobile || '').replace(/\D/g, '');
        const mobileNumber = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;

        // Get email
        const userEmail = user?.email || `user${user?.id}@truckmitr.com`;

        const options = {
            description: plan.name === 'premium_job' ? 'Premium Job Listing' : 'Semi-Premium Job Listing',
            image: 'https://truckmitr.com/public/front/assets/images/logotrick.png',
            currency: 'INR',
            key: STATICS?.RAYZORPAY_KEY_ID,
            amount: plan.amount * 100, // Amount in paise
            order_id: orderId,
            name: 'TruckMitr',
            notes: {
                user_id: Number(user?.id) || 0,
                plan_id: Number(plan.id),
                job_id: postedJobId
            },
            prefill: {
                email: userEmail,
                contact: mobileNumber,
                name: user?.name || ''
            },
            send_sms_hash: true,
            retry: {
                enabled: false,
            },
            modal: {
                confirm_close: false,
                animation: true,
            },
            theme: { color: '#246BFD' },
        } as any;

        console.log('Opening Razorpay checkout with options:', { orderId, amount: plan.amount });

        try {
            const paymentData = await RazorpayCheckout.open(options);
            console.log('=== RAZORPAY SUCCESS ===');
            console.log('Payment data:', JSON.stringify(paymentData, null, 2));

            setJobPremiumLoading(false);
            setJobPremiumModalVisible(false);

            // Show success screen (same as standard job posting)
            setShowSuccess(true);

            // Navigate after showing success animation
            setTimeout(() => {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            {
                                name: STACKS.BOTTOM_TAB,
                                state: { index: 0, routes: [{ name: STACKS.HOME }] },
                            },
                            { name: STACKS.VIEW_JOBS },
                        ],
                    })
                );
                dispatch(jobAddAction(null));
            }, 2500);
        } catch (error: any) {
            console.log('=== RAZORPAY ERROR ===');
            console.log('Error:', JSON.stringify(error, null, 2));

            setJobPremiumLoading(false);
            showToast(t('paymentFailed') || 'Payment failed. Please try again.');
        }
    };

    // Show confirmation dialog when user wants to skip premium
    const handleSkipPremium = () => {
        setShowSkipConfirmDialog(true);
    };

    // Confirm and post as standard job
    const confirmPostAsStandardJob = () => {
        setShowSkipConfirmDialog(false);
        setJobPremiumModalVisible(false);
        setShowSuccess(true);
        setTimeout(() => {
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [
                        {
                            name: STACKS.BOTTOM_TAB,
                            state: { index: 0, routes: [{ name: STACKS.HOME }] },
                        },
                        { name: STACKS.VIEW_JOBS },
                    ],
                })
            );
            dispatch(jobAddAction(null));
        }, 2500);
    };

    const renderStepContent = () => {
        const step = JOB_STEPS[currentStep];

        switch (step.id) {
            case 'job_title':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('jobTitle') || 'Job Title'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('jobTitleHintDetail') || 'Enter a clear and descriptive job title'}
                        </Text>
                        <TextInput
                            style={[styles.classicInput, styles.largeInput]}
                            placeholder={t('jobTitlePlaceholder') || "e.g. Long Haul Truck Driver for Interstate Routes"}
                            placeholderTextColor="#999"
                            value={addJob?.job_title || ''}
                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, job_title: text }))}
                            multiline
                        />
                    </View>
                );

            case 'job_location':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('jobLocation') || 'Job Location'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('jobLocationHintDetail') || 'Select the state where the job is located'}
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.classicBox}
                            onPress={() => setLocationModalOpen(true)}
                        >
                            <Text style={[styles.classicBoxText, !addJob?.job_location && { color: '#999' }]}>
                                {addJob?.job_location || t('selectLocation') || 'Select Location'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        {/* Pincode Section */}
                        <View style={styles.pincodeSection}>
                            <Text style={[styles.conditionalLabel, { marginTop: 16 }]}>{t('enterPincode') || 'Enter Pincode'}</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder={t('enter6DigitPincode') || 'Enter 6 digit pincode'}
                                placeholderTextColor="#999"
                                value={pincode}
                                onChangeText={handlePincodeChange}
                                keyboardType="numeric"
                                maxLength={6}
                            />

                            {/* Loading indicator */}
                            {pincodeLoading && (
                                <View style={styles.pincodeLoadingContainer}>
                                    <ActivityIndicator size="small" color="#246BFD" />
                                    <Text style={styles.pincodeLoadingText}>{t('fetchingAreas') || 'Fetching areas...'}</Text>
                                </View>
                            )}

                            {/* Error message */}
                            {pincodeError ? (
                                <Text style={styles.pincodeErrorText}>{pincodeError}</Text>
                            ) : null}

                            {/* Area Dropdown */}
                            {pincodeAreas.length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={styles.conditionalLabel}>{t('selectArea') || 'Select Area'}</Text>
                                    <Dropdown
                                        style={styles.dropdown}
                                        placeholderStyle={styles.dropdownPlaceholder}
                                        selectedTextStyle={styles.dropdownSelectedText}
                                        data={pincodeAreas}
                                        maxHeight={200}
                                        labelField="label"
                                        valueField="value"
                                        placeholder={t('selectArea') || 'Select Area'}
                                        value={selectedArea}
                                        onChange={item => {
                                            setSelectedArea(item.value);
                                            dispatch(jobAddAction({
                                                ...addJob,
                                                pincode: pincode,
                                                area: item.value,
                                                area_district: item.district,
                                                area_state: item.state
                                            }));
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                );

            case 'route':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('route') || 'Route'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('routeHintDetail') || 'Enter the route for this job (e.g., Delhi to Mumbai)'}
                        </Text>


                        {/* Single Route Input */}
                        <TextInput
                            style={[styles.classicInput, styles.largeInput]}
                            placeholder={t('enterRoute') || 'Enter route (e.g., Delhi to Mumbai)'}
                            placeholderTextColor="#999"
                            value={addJob?.route || ''}
                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, route: text }))}
                            multiline
                        />
                    </View>
                );

            case 'vehicle_type':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('vehicleType') || 'Vehicle Type'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('vehicleTypeHintDetail') || 'Select the type of vehicle required for this job'}
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.vehicleGrid}>
                                {vehicleTypes.map((vehicle) => {
                                    const isSelected = addJob?.vehicle_type === vehicle.value;
                                    return (
                                        <TouchableOpacity
                                            key={vehicle.value}
                                            style={[
                                                styles.vehicleTile,
                                                isSelected && styles.vehicleTileSelected
                                            ]}
                                            onPress={() => dispatch(jobAddAction({ ...addJob, vehicle_type: vehicle.value }))}
                                            activeOpacity={0.7}
                                        >
                                            <Image
                                                source={vehicle.image}
                                                style={styles.vehicleImage}
                                                resizeMode="contain"
                                            />
                                            <Text style={[
                                                styles.vehicleLabel,
                                                isSelected && styles.vehicleLabelSelected
                                            ]}>
                                                {vehicle.label}
                                            </Text>
                                            {isSelected && (
                                                <View style={styles.vehicleCheckmark}>
                                                    <Ionicons name="checkmark-circle" size={20} color="#246BFD" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                );

            case 'experience':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('experienceRequired') || 'Experience Required'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('selectExperienceHintDetail') || 'Select the minimum experience required'}
                        </Text>
                        <View style={styles.gridContainer}>
                            {drivingExperienceArray.map((exp) => (
                                <TouchableOpacity
                                    key={exp.value}
                                    style={[
                                        styles.experienceTile,
                                        addJob?.Required_Experience === exp.value && styles.experienceTileSelected
                                    ]}
                                    onPress={() => dispatch(jobAddAction({ ...addJob, Required_Experience: exp.value }))}
                                >
                                    <Text style={[
                                        styles.experienceTileText,
                                        addJob?.Required_Experience === exp.value && styles.experienceTileTextSelected
                                    ]}>
                                        {t(exp.labelKey) || exp.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'salary_range':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('fixedSalary') || 'Fixed Salary'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('selectSalaryHintDetail') || 'Select the monthly salary range for this position'}
                        </Text>
                        <View style={styles.gridContainer}>
                            {salaryRanges.map((salary) => (
                                <TouchableOpacity
                                    key={salary.value}
                                    style={[
                                        styles.salaryTile,
                                        addJob?.Salary_Range === salary.value && styles.salaryTileSelected
                                    ]}
                                    onPress={() => dispatch(jobAddAction({ ...addJob, Salary_Range: salary.value }))}
                                >
                                    <Text style={[
                                        styles.salaryTileText,
                                        addJob?.Salary_Range === salary.value && styles.salaryTileTextSelected
                                    ]}>
                                        {salary.label}
                                    </Text>
                                    {addJob?.Salary_Range === salary.value && (
                                        <Ionicons name="checkmark-circle" size={16} color="#246BFD" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'esi_pf':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('esiPf') || 'ESI/PF Benefits'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('esiPfHintDetail') || 'Will you provide ESI/PF benefits to the driver?'}
                        </Text>
                        <View style={styles.radioContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.esi_pf_provided === 'yes' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, esi_pf_provided: 'yes' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.esi_pf_provided === 'yes' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.esi_pf_provided === 'yes' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.esi_pf_provided === 'yes' && styles.radioTextSelected
                                ]}>
                                    {t('yes') || 'Yes'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.esi_pf_provided === 'no' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, esi_pf_provided: 'no' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.esi_pf_provided === 'no' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.esi_pf_provided === 'no' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.esi_pf_provided === 'no' && styles.radioTextSelected
                                ]}>
                                    {t('no') || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'food_allowance':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('foodAllowance') || 'Food Allowance'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('foodAllowanceHintDetail') || 'Will you provide food allowance to the driver?'}
                        </Text>
                        <View style={styles.radioContainer}>
                            <View>
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        addJob?.food_allowance_provided === 'yes' && styles.radioOptionSelected
                                    ]}
                                    onPress={() => dispatch(jobAddAction({ ...addJob, food_allowance_provided: 'yes' }))}
                                >
                                    <View style={[
                                        styles.radioCircle,
                                        addJob?.food_allowance_provided === 'yes' && styles.radioCircleSelected
                                    ]}>
                                        {addJob?.food_allowance_provided === 'yes' && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.radioText,
                                        addJob?.food_allowance_provided === 'yes' && styles.radioTextSelected
                                    ]}>
                                        {t('yes') || 'Yes'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Conditional Amount Input - Below Yes */}
                                {addJob?.food_allowance_provided === 'yes' && (
                                    <View style={styles.conditionalInputInline}>
                                        <Text style={styles.conditionalLabel}>{t('enterAmountPerDay') || 'Enter Amount (₹/day)'}</Text>
                                        <TextInput
                                            style={styles.amountInput}
                                            placeholder={t('enterFoodAllowanceAmount') || '₹ Enter food allowance per day'}
                                            placeholderTextColor="#999"
                                            value={addJob?.food_allowance_amount || ''}
                                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, food_allowance_amount: text }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.food_allowance_provided === 'no' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, food_allowance_provided: 'no', food_allowance_amount: '' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.food_allowance_provided === 'no' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.food_allowance_provided === 'no' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.food_allowance_provided === 'no' && styles.radioTextSelected
                                ]}>
                                    {t('no') || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'trip_incentive':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('tripIncentive') || 'Trip Incentive'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('tripIncentiveHintDetail') || 'Will you provide trip incentive to the driver?'}
                        </Text>
                        <View style={styles.radioContainer}>
                            <View>
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        addJob?.trip_incentive_provided === 'yes' && styles.radioOptionSelected
                                    ]}
                                    onPress={() => dispatch(jobAddAction({ ...addJob, trip_incentive_provided: 'yes' }))}
                                >
                                    <View style={[
                                        styles.radioCircle,
                                        addJob?.trip_incentive_provided === 'yes' && styles.radioCircleSelected
                                    ]}>
                                        {addJob?.trip_incentive_provided === 'yes' && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.radioText,
                                        addJob?.trip_incentive_provided === 'yes' && styles.radioTextSelected
                                    ]}>
                                        {t('yes') || 'Yes'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Conditional Amount Input - Below Yes */}
                                {addJob?.trip_incentive_provided === 'yes' && (
                                    <View style={styles.conditionalInputInline}>
                                        <Text style={styles.conditionalLabel}>{t('enterAmount')} (₹) </Text>
                                        <TextInput
                                            style={styles.amountInput}
                                            placeholder={t('enterTripIncentiveAmount') || '₹ Enter trip incentive per day'}
                                            placeholderTextColor="#999"
                                            value={addJob?.trip_incentive_amount || ''}
                                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, trip_incentive_amount: text }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.trip_incentive_provided === 'no' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, trip_incentive_provided: 'no', trip_incentive_amount: '' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.trip_incentive_provided === 'no' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.trip_incentive_provided === 'no' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.trip_incentive_provided === 'no' && styles.radioTextSelected
                                ]}>
                                    {t('no') || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'accommodation':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('accommodationFacility') || 'Accommodation Facility'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('accommodationHintDetail') || 'Will you provide accommodation facility to the driver?'}
                        </Text>
                        <View style={styles.radioContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.accommodation_provided === 'yes' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, accommodation_provided: 'yes' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.accommodation_provided === 'yes' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.accommodation_provided === 'yes' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.accommodation_provided === 'yes' && styles.radioTextSelected
                                ]}>
                                    {t('yes') || 'Yes'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.accommodation_provided === 'no' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, accommodation_provided: 'no' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.accommodation_provided === 'no' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.accommodation_provided === 'no' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.accommodation_provided === 'no' && styles.radioTextSelected
                                ]}>
                                    {t('no') || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'mileage':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('mileage') || 'Mileage'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('mileageHintDetail') || 'Do you require mileage tracking from the driver?'}
                        </Text>
                        <View style={styles.radioContainer}>
                            <View>
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        addJob?.mileage_required === 'yes' && styles.radioOptionSelected
                                    ]}
                                    onPress={() => dispatch(jobAddAction({ ...addJob, mileage_required: 'yes' }))}
                                >
                                    <View style={[
                                        styles.radioCircle,
                                        addJob?.mileage_required === 'yes' && styles.radioCircleSelected
                                    ]}>
                                        {addJob?.mileage_required === 'yes' && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.radioText,
                                        addJob?.mileage_required === 'yes' && styles.radioTextSelected
                                    ]}>
                                        {t('yes') || 'Yes'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Conditional Mileage Input - Below Yes */}
                                {addJob?.mileage_required === 'yes' && (
                                    <View style={styles.conditionalInputInline}>
                                        <Text style={styles.conditionalLabel}>{t('expectedMileageKmPerLiter') || 'Expected Mileage (km per 1 liter)'}</Text>
                                        <TextInput
                                            style={styles.amountInput}
                                            placeholder={t('enterMileageAmount') || 'Enter km per 1 liter'}
                                            placeholderTextColor="#999"
                                            value={addJob?.mileage_amount || ''}
                                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, mileage_amount: text }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.mileage_required === 'no' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, mileage_required: 'no', mileage_amount: '' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.mileage_required === 'no' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.mileage_required === 'no' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.mileage_required === 'no' && styles.radioTextSelected
                                ]}>
                                    {t('no') || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'fastag':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('fastagRoadKharcha') || 'FASTag/Road Kharcha'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('fastagHintDetail') || 'Will you provide FASTag/Road expenses to the driver?'}
                        </Text>
                        <View style={styles.radioContainer}>
                            <View>
                                <TouchableOpacity
                                    style={[
                                        styles.radioOption,
                                        addJob?.fastag_provided === 'yes' && styles.radioOptionSelected
                                    ]}
                                    onPress={() => dispatch(jobAddAction({ ...addJob, fastag_provided: 'yes' }))}
                                >
                                    <View style={[
                                        styles.radioCircle,
                                        addJob?.fastag_provided === 'yes' && styles.radioCircleSelected
                                    ]}>
                                        {addJob?.fastag_provided === 'yes' && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.radioText,
                                        addJob?.fastag_provided === 'yes' && styles.radioTextSelected
                                    ]}>
                                        {t('yes') || 'Yes'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Conditional Amount Input - Below Yes */}
                                {addJob?.fastag_provided === 'yes' && (
                                    <View style={styles.conditionalInputInline}>
                                        <Text style={styles.conditionalLabel}>{t('enterAmountRs') || 'Enter Amount (₹)'}</Text>
                                        <TextInput
                                            style={styles.amountInput}
                                            placeholder={t('enterFastagAmount') || '₹ Enter FASTag/Road Kharcha amount'}
                                            placeholderTextColor="#999"
                                            value={addJob?.fastag_amount || ''}
                                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, fastag_amount: text }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.radioOption,
                                    addJob?.fastag_provided === 'no' && styles.radioOptionSelected
                                ]}
                                onPress={() => dispatch(jobAddAction({ ...addJob, fastag_provided: 'no', fastag_amount: '' }))}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    addJob?.fastag_provided === 'no' && styles.radioCircleSelected
                                ]}>
                                    {addJob?.fastag_provided === 'no' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.radioText,
                                    addJob?.fastag_provided === 'no' && styles.radioTextSelected
                                ]}>
                                    {t('no') || 'No'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'license_type':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('typeOfLicense') || 'Type of License'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('selectLicenseHintDetail') || 'Select the license type required for this job'}
                        </Text>
                        <View>
                            {licenseTypes.map((license) => {
                                const isSelected = addJob?.Type_of_License === license.value;
                                return (
                                    <TouchableOpacity
                                        key={license.value}
                                        style={[
                                            styles.endorsementTile,
                                            isSelected && styles.endorsementTileSelected
                                        ]}
                                        onPress={() => dispatch(jobAddAction({ ...addJob, Type_of_License: license.value }))}
                                    >
                                        <View style={[styles.endorsementIcon, isSelected && { backgroundColor: '#246BFD' }]}>
                                            <Text style={{ fontSize: 22 }}>{license.emoji}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.endorsementLabel, isSelected && { color: '#246BFD' }]}>
                                                {license.label}
                                            </Text>
                                        </View>
                                        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#246BFD" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'preferred_skills':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('preferredSkills') || 'Preferred Skills'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('selectSkillsHintDetail') || 'Select all skills that apply to this job'}
                        </Text>
                        <View style={styles.skillsGrid}>
                            {operationalSegments.map((skill) => {
                                const isSelected = addJob?.Preferred_Skills?.includes(skill.label);
                                return (
                                    <TouchableOpacity
                                        key={skill.id}
                                        style={[
                                            styles.skillChip,
                                            isSelected && styles.skillChipSelected
                                        ]}
                                        onPress={() => toggleSkill(skill.label)}
                                    >
                                        <Text style={{ fontSize: 16, marginRight: 6 }}>{skill.emoji}</Text>
                                        <Text style={[
                                            styles.skillChipText,
                                            isSelected && styles.skillChipTextSelected
                                        ]}>
                                            {skill.label}
                                        </Text>
                                        <Ionicons
                                            name={isSelected ? "checkmark" : "add"}
                                            size={14}
                                            color={isSelected ? "#246BFD" : "#666"}
                                            style={{ marginLeft: 4 }}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'deadline':
                const deadlineDate = addJob?.Application_Deadline ? new Date(addJob.Application_Deadline) : null;
                const selectedDateString = deadlineDate ? moment(deadlineDate).format('YYYY-MM-DD') : '';
                const currentMonthName = moment(calendarMonth).format('MMMM YYYY');
                const currentYear = moment(calendarMonth).year();
                const minYear = moment().year();
                const maxYear = moment().year() + 5;
                const years = [];
                for (let y = minYear; y <= maxYear; y++) {
                    years.push(y);
                }

                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('applicationDeadline') || 'Application Deadline'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('selectDeadlineHintDetail') || 'Set the last date to accept applications'}
                        </Text>
                        <View style={styles.classicBox}>
                            <Text style={[styles.classicBoxText, !addJob?.Application_Deadline && { color: '#999' }]}>
                                {addJob?.Application_Deadline
                                    ? moment(deadlineDate).format('DD MMMM YYYY')
                                    : t('selectFromCalendarBelow') || 'Tap to select date'}
                            </Text>
                            <Ionicons name="calendar" size={20} color="#246BFD" />
                        </View>
                        <Space height={8} />
                        <View style={styles.inlineCalendarContainer}>
                            {/* Custom Header with Year Picker */}
                            <View style={styles.calendarHeader}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const prevMonth = moment(calendarMonth).subtract(1, 'month').format('YYYY-MM-DD');
                                        setCalendarMonth(prevMonth);
                                    }}
                                    style={styles.calendarArrow}
                                >
                                    <Ionicons name="chevron-back" size={24} color="#246BFD" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setYearPickerOpen(true)}
                                    style={styles.yearPickerButton}
                                >
                                    <Text style={styles.calendarHeaderText}>{currentMonthName}</Text>
                                    <Ionicons name="caret-down" size={16} color="#246BFD" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const nextMonth = moment(calendarMonth).add(1, 'month').format('YYYY-MM-DD');
                                        setCalendarMonth(nextMonth);
                                    }}
                                    style={styles.calendarArrow}
                                >
                                    <Ionicons name="chevron-forward" size={24} color="#246BFD" />
                                </TouchableOpacity>
                            </View>

                            <Calendar
                                key={calendarMonth}
                                current={calendarMonth}
                                minDate={moment().format('YYYY-MM-DD')}
                                hideArrows={true}
                                hideDayNames={false}
                                onDayPress={(day: any) => {
                                    const selectedDate = new Date(day.dateString);
                                    const today = moment().startOf('day');
                                    const selectedMoment = moment(day.dateString).startOf('day');
                                    const minAllowedDate = today.clone().add(4, 'days');

                                    // Check if selected date is before the minimum allowed date (4 days from today)
                                    if (selectedMoment.isBefore(minAllowedDate)) {
                                        showToast(t('applicationDeadlineValidation') || 'You can only select deadline after 4 days');
                                        return;
                                    }

                                    dispatch(jobAddAction({ ...addJob, Application_Deadline: selectedDate }));
                                }}
                                onMonthChange={(month: any) => {
                                    setCalendarMonth(month.dateString);
                                }}
                                markedDates={{
                                    ...(() => {
                                        const disabledDates: any = {};
                                        const today = moment();
                                        const todayString = today.format('YYYY-MM-DD');

                                        // Mark next 4 days as disabled
                                        for (let i = 0; i < 4; i++) {
                                            const date = today.clone().add(i, 'days').format('YYYY-MM-DD');

                                            if (date === todayString) {
                                                // Today's date - special styling (don't mark as disabled to keep blue color)
                                                disabledDates[date] = {
                                                    marked: true,
                                                    dotColor: '#246BFD',
                                                    // Don't set disabled: true to preserve todayTextColor from theme
                                                };
                                            } else {
                                                // Other disabled dates (next 3 days)
                                                disabledDates[date] = {
                                                    disabled: true,
                                                    disableTouchEvent: false, // Allow touch to show toast
                                                    textColor: '#ccc',
                                                };
                                            }
                                        }

                                        // Add selected date styling (override if selected)
                                        if (selectedDateString && !disabledDates[selectedDateString]) {
                                            disabledDates[selectedDateString] = {
                                                selected: true,
                                                selectedColor: '#246BFD',
                                            };
                                        }

                                        return disabledDates;
                                    })()
                                }}
                                theme={{
                                    backgroundColor: 'transparent',
                                    calendarBackground: 'transparent',
                                    textSectionTitleColor: '#666',
                                    selectedDayBackgroundColor: '#246BFD',
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: '#246BFD',
                                    dayTextColor: '#333',
                                    textDisabledColor: '#ccc',
                                    dotColor: '#246BFD',
                                    selectedDotColor: '#ffffff',
                                    arrowColor: '#246BFD',
                                    monthTextColor: '#333',
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: '800',
                                    textDayHeaderFontWeight: '600',
                                    textDayFontSize: 16,
                                    textMonthFontSize: 16,
                                    textDayHeaderFontSize: 14,
                                }}
                                style={{ borderRadius: 10, width: '100%' }}
                                renderHeader={() => null}
                            />
                        </View>

                        {/* Year Picker Modal */}
                        <Modal visible={yearPickerOpen} transparent animationType="fade">
                            <TouchableWithoutFeedback onPress={() => setYearPickerOpen(false)}>
                                <View style={styles.yearPickerOverlay}>
                                    <View style={styles.yearPickerContainer}>
                                        <Text style={styles.yearPickerTitle}>{t('selectYear') || 'Select Year'}</Text>
                                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
                                            {years.map((year) => (
                                                <TouchableOpacity
                                                    key={year}
                                                    style={[
                                                        styles.yearPickerItem,
                                                        currentYear === year && styles.yearPickerItemSelected
                                                    ]}
                                                    onPress={() => {
                                                        const newDate = moment(calendarMonth).year(year).format('YYYY-MM-DD');
                                                        setCalendarMonth(newDate);
                                                        setYearPickerOpen(false);
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.yearPickerItemText,
                                                        currentYear === year && styles.yearPickerItemTextSelected
                                                    ]}>
                                                        {year}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                    </View>
                );

            case 'drivers_count':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('numberOfDrivers') || 'Number of Drivers'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('driversCountHintDetail') || 'How many drivers do you need for this job?'}
                        </Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder={t('enterNumberOfDrivers') || "e.g. 5"}
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            value={addJob?.Job_Management || ''}
                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, Job_Management: text }))}
                        />
                    </View>
                );

            case 'job_description':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('jobDescriptionTitle') || 'Job Description'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('jobDescriptionHintDetail') || 'Describe the job responsibilities and requirements'}
                        </Text>
                        <TextInput
                            style={[styles.classicInput, { height: 150, textAlignVertical: 'top', paddingTop: 12 }]}
                            placeholder={t('writeJobDescription') || "Describe the job requirements, responsibilities..."}
                            placeholderTextColor="#999"
                            multiline
                            value={addJob?.Job_Description || ''}
                            onChangeText={(text) => dispatch(jobAddAction({ ...addJob, Job_Description: text }))}
                        />
                    </View>
                );

            case 'truck_condition':
                const truckConditions = [
                    { value: 'excellent', label: 'Excellent', description: 'New/Very well maintained' },
                    { value: 'good', label: 'Good', description: 'Regularly serviced' },
                    { value: 'average', label: 'Average', description: 'Working condition' },
                    { value: 'old_running', label: 'Old but Running', description: 'Old but running' },
                    { value: 'road_ready', label: 'Made Road Ready', description: 'Made road ready after joining' }
                ];

                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('truckCondition') || 'Overall Truck Condition'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            {t('truckConditionHintDetail') || 'Select the overall condition of the truck'}
                        </Text>
                        <View>
                            {truckConditions.map((condition) => {
                                const isSelected = addJob?.truck_condition === condition.value;
                                return (
                                    <TouchableOpacity
                                        key={condition.value}
                                        style={[
                                            styles.conditionOption,
                                            isSelected && styles.conditionOptionSelected
                                        ]}
                                        onPress={() => dispatch(jobAddAction({ ...addJob, truck_condition: condition.value }))}
                                    >
                                        <View style={[
                                            styles.radioCircle,
                                            isSelected && styles.radioCircleSelected
                                        ]}>
                                            {isSelected && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <View style={styles.conditionTextContainer}>
                                            <Text style={[
                                                styles.conditionTitle,
                                                isSelected && styles.conditionTitleSelected
                                            ]}>
                                                {t(condition.value) || condition.label}
                                            </Text>
                                            <Text style={[
                                                styles.conditionDescription,
                                                isSelected && styles.conditionDescriptionSelected
                                            ]}>
                                                {t(`${condition.value}Description`) || condition.description}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'job_summary':
                const getSalaryLabel = (value: string) => {
                    return salaryRanges.find(s => s.value === value)?.label || value;
                };
                const getExperienceLabel = (value: string) => {
                    const exp = drivingExperienceArray.find(e => e.value === value);
                    return exp ? (t(exp.labelKey) || exp.label) : value;
                };
                const getLicenseLabel = (value: string) => {
                    return licenseTypes.find(l => l.value === value)?.label || value;
                };
                const getVehicleImage = (value: string) => {
                    return vehicleTypes.find(v => v.value === value)?.image || null;
                };

                return (
                    <View style={styles.summaryContainer}>
                        {/* Header Section */}
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryHeaderTitle}>{t('reviewYourJob') || 'Review Your Job'}</Text>
                            <Text style={styles.summaryHeaderSubtitle}>
                                {t('reviewJobDetailsMessage') || 'Please review all the details before posting your job'}
                            </Text>
                        </View>

                        {/* Job Title Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F4FD' }]}>
                                    <Ionicons name="briefcase" size={18} color="#246BFD" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('jobTitle') || 'Job Title'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>{addJob?.job_title || '-'}</Text>
                        </View>

                        {/* Location Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F8F0' }]}>
                                    <Ionicons name="location" size={18} color="#10B981" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('location') || 'Location'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>{addJob?.job_location || '-'}</Text>
                        </View>

                        {/* Route Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#EBF4FF' }]}>
                                    <Ionicons name="map" size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('route') || 'Route'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue} numberOfLines={2}>
                                {addJob?.route || '-'}
                            </Text>
                        </View>

                        {/* Vehicle Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3E8' }]}>
                                    <Ionicons name="car" size={18} color="#F59E0B" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('vehicle') || 'Vehicle'}</Text>
                            </View>
                            {getVehicleImage(addJob?.vehicle_type) && (
                                <Image
                                    source={getVehicleImage(addJob?.vehicle_type)}
                                    style={styles.summaryVehicleImage}
                                    resizeMode="contain"
                                />
                            )}
                            <Text style={[styles.summaryCardValue, { fontSize: 11, marginTop: 4 }]}>
                                {addJob?.vehicle_type || '-'}
                            </Text>
                        </View>

                        {/* Experience Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#F3E8FF' }]}>
                                    <Ionicons name="time" size={18} color="#8B5CF6" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('experience') || 'Experience'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {getExperienceLabel(addJob?.Required_Experience) || '-'}
                            </Text>
                        </View>

                        {/* Salary Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#E8FDF0' }]}>
                                    <Ionicons name="cash" size={18} color="#059669" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('fixedSalary') || 'Fixed Salary'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {getSalaryLabel(addJob?.Salary_Range) || '-'}
                            </Text>
                        </View>

                        {/* ESI/PF Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#F0F9FF' }]}>
                                    <Ionicons name="shield-checkmark" size={18} color="#0EA5E9" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('esiPf') || 'ESI/PF'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.esi_pf_provided === 'yes' ? (t('yes') || 'Yes') : addJob?.esi_pf_provided === 'no' ? (t('no') || 'No') : '-'}
                            </Text>
                        </View>

                        {/* Food Allowance Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3E2' }]}>
                                    <Ionicons name="restaurant" size={18} color="#F59E0B" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('foodAllowance') || 'Food Allowance'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.food_allowance_provided === 'yes'
                                    ? `${t('yes') || 'Yes'}${addJob?.food_allowance_amount ? ` - ₹${addJob.food_allowance_amount}` : ''}`
                                    : addJob?.food_allowance_provided === 'no'
                                        ? (t('no') || 'No')
                                        : '-'}
                            </Text>
                        </View>

                        {/* Trip Incentive Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#F0FDF4' }]}>
                                    <Ionicons name="gift" size={18} color="#16A34A" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('tripIncentive') || 'Trip Incentive'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.trip_incentive_provided === 'yes'
                                    ? `${t('yes') || 'Yes'}${addJob?.trip_incentive_amount ? ` - ₹${addJob.trip_incentive_amount}` : ''}`
                                    : addJob?.trip_incentive_provided === 'no'
                                        ? (t('no') || 'No')
                                        : '-'}
                            </Text>
                        </View>

                        {/* Accommodation Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#EEF2FF' }]}>
                                    <Ionicons name="home" size={18} color="#6366F1" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('accommodationFacility') || 'Accommodation Facility'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.accommodation_provided === 'yes' ? (t('yes') || 'Yes') : addJob?.accommodation_provided === 'no' ? (t('no') || 'No') : '-'}
                            </Text>
                        </View>

                        {/* Mileage Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#F0F9FF' }]}>
                                    <Ionicons name="speedometer" size={18} color="#0EA5E9" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('mileage') || 'Mileage'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.mileage_required === 'yes'
                                    ? `${t('yes') || 'Yes'}${addJob?.mileage_amount ? ` - ${addJob.mileage_amount} km/l` : ''}`
                                    : addJob?.mileage_required === 'no'
                                        ? (t('no') || 'No')
                                        : '-'}
                            </Text>
                        </View>

                        {/* FASTag/Road Kharcha Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3E2' }]}>
                                    <Ionicons name="card" size={18} color="#F59E0B" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('fastagRoadKharcha') || 'FASTag/Road Kharcha'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.fastag_provided === 'yes'
                                    ? `${t('yes') || 'Yes'}${addJob?.fastag_amount ? ` - ₹${addJob.fastag_amount}` : ''}`
                                    : addJob?.fastag_provided === 'no'
                                        ? (t('no') || 'No')
                                        : '-'}
                            </Text>
                        </View>

                        {/* License Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#FEE8E8' }]}>
                                    <Ionicons name="card" size={18} color="#EF4444" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('license') || 'License'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {getLicenseLabel(addJob?.Type_of_License) || '-'}
                            </Text>
                        </View>

                        {/* Drivers Count Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F0FE' }]}>
                                    <Ionicons name="people" size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('drivers') || 'Drivers'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.Job_Management || '-'}
                            </Text>
                        </View>

                        {/* Deadline Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#FFF3E8' }]}>
                                    <Ionicons name="calendar" size={18} color="#F97316" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('applicationDeadline') || 'Application Deadline'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.Application_Deadline
                                    ? moment(addJob.Application_Deadline).format('DD MMMM YYYY')
                                    : '-'
                                }
                            </Text>
                        </View>

                        {/* Skills Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F4FD' }]}>
                                    <Ionicons name="construct" size={18} color="#246BFD" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('preferredSkills') || 'Preferred Skills'}</Text>
                            </View>
                            <View style={styles.summarySkillsContainer}>
                                {(addJob?.Preferred_Skills || []).map((skill: string, index: number) => {
                                    const skillData = operationalSegments.find(s => s.label === skill);
                                    return (
                                        <View key={index} style={styles.summarySkillChip}>
                                            <Text style={{ fontSize: 12 }}>{skillData?.emoji || '📋'}</Text>
                                            <Text style={styles.summarySkillText}>{skill}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Description Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#F3E8FF' }]}>
                                    <Ionicons name="document-text" size={18} color="#8B5CF6" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('jobDescriptionTitle') || 'Job Description'}</Text>
                            </View>
                            <Text style={[styles.summaryCardValue, styles.summaryDescription]}>
                                {addJob?.Job_Description || '-'}
                            </Text>
                        </View>

                        {/* Truck Condition Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryCardHeader}>
                                <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3E2' }]}>
                                    <Ionicons name="build" size={18} color="#F59E0B" />
                                </View>
                                <Text style={styles.summaryCardTitle}>{t('truckCondition') || 'Truck Condition'}</Text>
                            </View>
                            <Text style={styles.summaryCardValue}>
                                {addJob?.truck_condition ? (
                                    (() => {
                                        const conditionLabels: { [key: string]: string } = {
                                            'excellent': t('excellent') || 'Excellent (New/Very well maintained)',
                                            'good': t('good') || 'Good (Regularly serviced)',
                                            'average': t('average') || 'Average (Working condition)',
                                            'old_running': t('old_running') || 'Old but Running',
                                            'road_ready': t('road_ready') || 'Made Road Ready after joining'
                                        };
                                        return conditionLabels[addJob.truck_condition] || addJob.truck_condition;
                                    })()
                                ) : '-'}
                            </Text>
                        </View>

                        {/* Consent Checkbox */}
                        <View style={styles.summaryConsentContainer}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setCheckBoxSelect(!checkBoxSelect)}
                                style={styles.checkboxContainer}
                            >
                                <View style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: checkBoxSelect ? '#246BFD' : 'transparent',
                                        borderColor: checkBoxSelect ? '#246BFD' : '#ADB5BD'
                                    }
                                ]}>
                                    {checkBoxSelect && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                                </View>
                                <Text style={styles.checkboxText}>
                                    {t('iAgreeToTruckMitr') || 'I agree to TruckMitr '}
                                    <Text
                                        onPress={() => navigation.navigate(STACKS?.TRANSPORTER_CONSENT)}
                                        style={{ color: '#246BFD', fontWeight: '600' }}
                                    >
                                        {' '}{t('transporterConsent') || 'Transporter Consent'}
                                    </Text>
                                    {t('addJobPolicy') || ' policy for adding jobs.'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Spacing */}
                        <Space height={20} />
                    </View>
                );

            default:
                return null;
        }
    };

    if (showSuccess) {
        return (
            <View style={[styles.container, styles.successContainer]}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Confetti Background */}
                <View style={styles.confettiContainer}>
                    {[...Array(20)].map((_, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeIn.delay(i * 100).duration(500)}
                            style={[
                                styles.confettiPiece,
                                {
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 60}%`,
                                    backgroundColor: [colors.royalBlue, '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'][i % 5],
                                    transform: [{ rotate: `${Math.random() * 360}deg` }],
                                    width: 8 + Math.random() * 8,
                                    height: 8 + Math.random() * 8,
                                }
                            ]}
                        />
                    ))}
                </View>

                {/* Main Content */}
                <View style={styles.successContent}>
                    {/* Animated Success Icon with SVG */}
                    <Animated.View
                        entering={ZoomIn.duration(800).springify()}
                        style={styles.successIconWrapper}
                    >
                        {/* Outer Pulsing Ring */}
                        <Animated.View
                            entering={FadeIn.delay(300)}
                            style={styles.pulseRingOuter}
                        />

                        {/* Middle Ring */}
                        <Animated.View
                            entering={FadeIn.delay(400)}
                            style={styles.pulseRingMiddle}
                        />

                        {/* Inner Circle with Checkmark */}
                        <View style={[styles.successIconInner, { backgroundColor: colors.royalBlue }]}>
                            <Svg width="60" height="60" viewBox="0 0 24 24">
                                <Path
                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                    fill="white"
                                />
                            </Svg>
                        </View>
                    </Animated.View>

                    {/* Success Text */}
                    <Animated.View
                        entering={SlideInUp.delay(600).duration(600).springify()}
                        style={styles.successTextContainer}
                    >
                        <Text style={styles.successTitle}>
                            {addJob?.id
                                ? `🎉 ${t('jobUpdatedTitle') || 'Job Updated!'}`
                                : `🎉 ${t('jobPostedTitle') || 'Job Posted!'}`
                            }
                        </Text>
                        <Text style={styles.successSubtitle}>
                            {addJob?.id
                                ? t('jobUpdatedMessage') || 'Your job listing has been updated successfully'
                                : t('jobPostedMessage') || 'Your job is now live and visible to drivers'
                            }
                        </Text>
                    </Animated.View>

                    {/* Decorative Truck SVG */}
                    <Animated.View
                        entering={FadeInUp.delay(800).duration(600)}
                        style={styles.truckIconContainer}
                    >
                        <Svg width="120" height="70" viewBox="0 0 120 70">
                            {/* Truck Body */}
                            <Rect x="5" y="20" width="70" height="35" rx="4" fill={colors.royalBlue} />
                            {/* Cargo Lines */}
                            <Rect x="15" y="30" width="50" height="3" rx="1.5" fill="white" opacity="0.5" />
                            <Rect x="15" y="38" width="35" height="3" rx="1.5" fill="white" opacity="0.5" />
                            {/* Cabin */}
                            <Path d="M75 28 L95 28 L100 38 L100 55 L75 55 Z" fill={colors.royalBlue} />
                            {/* Window */}
                            <Path d="M78 32 L92 32 L96 38 L78 38 Z" fill="#87CEEB" />
                            {/* Wheels */}
                            <Circle cx="25" cy="58" r="8" fill="#333" />
                            <Circle cx="25" cy="58" r="4" fill="#666" />
                            <Circle cx="85" cy="58" r="8" fill="#333" />
                            <Circle cx="85" cy="58" r="4" fill="#666" />
                            {/* Headlight */}
                            <Rect x="98" y="45" width="4" height="6" rx="1" fill="#FFE66D" />
                        </Svg>
                    </Animated.View>

                    {/* Stats Card */}
                    <Animated.View
                        entering={FadeInUp.delay(1000).duration(600)}
                        style={styles.statsCard}
                    >
                        <View style={styles.statItem}>
                            <Ionicons name="briefcase" size={24} color={colors.royalBlue} />
                            <Text style={styles.statValue}>{addJob?.job_title || t('job') || 'Job'}</Text>
                            <Text style={styles.statLabel}>{t('posted') || 'Posted'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="location" size={24} color={colors.royalBlue} />
                            <Text style={styles.statValue}>{addJob?.job_location || t('location') || 'Location'}</Text>
                            <Text style={styles.statLabel}>{t('location') || 'Location'}</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* Bottom Progress */}
                <Animated.View
                    entering={FadeInUp.delay(1200).duration(600)}
                    style={styles.successBottomSection}
                >
                    <View style={styles.progressBarWrapper}>
                        <Animated.View
                            entering={FadeIn.delay(1400).duration(2000)}
                            style={styles.progressBarFill}
                        />
                    </View>
                    <View style={styles.redirectRow}>
                        <ActivityIndicator size="small" color={colors.royalBlue} />
                        <Text style={styles.redirectText}>
                            {t('redirectingToHome') || 'Taking you to dashboard...'}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.container, { backgroundColor: '#F8F9FA' }, animatedScreenStyle]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <Animated.View style={[styles.header, animatedHeaderStyle]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    hitSlop={hitSlop(10)}
                >
                    <Ionicons name="chevron-back" size={22} color="#246BFD" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{addJob?.id ? t('editJob') : t('addJob')}</Text>
                <View style={{ width: 36 }} />
            </Animated.View>



            {/* Progress Info */}
            <View style={styles.progressInfo}>
                <Animated.Text style={[styles.progressText, animatedCounterStyle]}>
                    {t('step') || 'Step'} {currentStep + 1} {t('of') || 'of'} {JOB_STEPS.length}
                </Animated.Text>
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, animatedProgressStyle, animatedShimmerStyle]} />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={animatedContentStyle}>
                    <Animated.View style={[styles.stepHeader, animatedCardStyle]}>
                        <Animated.View style={[styles.stepIconContainer, { backgroundColor: '#246BFD' }, animatedIconStyle]}>
                            <Ionicons name={JOB_STEPS[currentStep].icon as any} size={24} color="white" />
                        </Animated.View>
                        <View style={styles.stepHeaderText}>
                            <Text style={styles.stepTitle}>
                                {t(JOB_STEPS[currentStep].title)} {JOB_STEPS[currentStep].required && <Text style={{ color: 'red' }}>*</Text>}
                            </Text>
                            <Text style={styles.stepSubtitle}>{t(JOB_STEPS[currentStep].subtitle)}</Text>
                        </View>
                    </Animated.View>

                    <View style={styles.divider} />

                    <Animated.View style={animatedShakeStyle}>
                        {renderStepContent()}
                    </Animated.View>
                </Animated.View>
            </ScrollView>

            {/* Footer */}
            <Animated.View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom + 20 }, animatedFooterStyle]}>
                <TouchableOpacity
                    style={styles.classicButton}
                    onPress={handleNext}
                    disabled={finishing}
                    onPressIn={() => {
                        buttonScale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
                    }}
                    onPressOut={() => {
                        buttonScale.value = withSpring(1, { damping: 10, stiffness: 300 });
                    }}
                >
                    <Animated.View style={[StyleSheet.absoluteFillObject, animatedButtonStyle]}>
                        <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                            colors={['#084489', '#0c78f0']}
                        />
                    </Animated.View>
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.classicButtonText}>
                                {currentStep === JOB_STEPS.length - 1 ? (addJob?.id ? t('updateJob') : t('postJob')) : t('next')}
                            </Text>
                            {currentStep !== JOB_STEPS.length - 1 && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Full-screen Location Modal - Matching Registration State Selector */}
            <Modal
                visible={locationModalOpen}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setLocationModalOpen(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.white }}>
                    <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                    {/* Modal Header */}
                    <View style={{
                        paddingTop: safeAreaInsets.top,
                        backgroundColor: colors.white,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.blackOpacity(0.08),
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: responsiveFontSize(2),
                            paddingVertical: responsiveHeight(1),
                        }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setLocationModalOpen(false);
                                    setLocationSearchQuery('');
                                }}
                                style={{
                                    height: 40,
                                    width: 40,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: colors.blackOpacity(0.05),
                                    borderRadius: 12,
                                }}>
                                <Ionicons name="close" size={24} color={colors.royalBlue} />
                            </TouchableOpacity>
                            <Text style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: responsiveFontSize(2.2),
                                fontWeight: '700',
                                color: colors.black,
                                marginRight: 40, // Balance the close button
                            }}>
                                {t('selectLocation') || 'Select Location'}
                            </Text>
                        </View>

                        {/* Search Bar */}
                        <View style={{
                            marginHorizontal: responsiveFontSize(2),
                            marginBottom: responsiveHeight(1),
                            backgroundColor: colors.blackOpacity(0.04),
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 14,
                            height: 48,
                        }}>
                            <Ionicons name="search" size={20} color={colors.blackOpacity(0.4)} />
                            <TextInput
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                    fontSize: responsiveFontSize(1.8),
                                    color: colors.black,
                                    padding: 0,
                                }}
                                placeholder={t('searchLocation') || 'Search location...'}
                                placeholderTextColor={colors.blackOpacity(0.4)}
                                value={locationSearchQuery}
                                onChangeText={setLocationSearchQuery}
                                autoCorrect={false}
                            />
                            {locationSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={colors.blackOpacity(0.4)} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Location List */}
                    <FlatList
                        data={locationsList.filter(location =>
                            location.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingHorizontal: responsiveFontSize(2),
                            paddingTop: 0,
                            paddingBottom: safeAreaInsets.bottom + 20,
                        }}
                        ListEmptyComponent={() => (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: responsiveHeight(10),
                            }}>
                                <Ionicons name="location-outline" size={48} color={colors.blackOpacity(0.2)} />
                                <Text style={{
                                    marginTop: 12,
                                    fontSize: responsiveFontSize(1.8),
                                    color: colors.blackOpacity(0.4),
                                }}>
                                    {t('noLocationsFound') || 'No locations found'}
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const isSelected = item.name === addJob?.job_location;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        dispatch(jobAddAction({ ...addJob, job_location: item.name }));
                                        setLocationModalOpen(false);
                                        setLocationSearchQuery('');
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: responsiveHeight(1.8),
                                        paddingHorizontal: 16,
                                        marginBottom: 8,
                                        backgroundColor: isSelected ? colors.royalBlue + '10' : colors.white,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: isSelected ? colors.royalBlue : colors.blackOpacity(0.08),
                                    }}>
                                    <View style={{
                                        width: 24,
                                        height: 24,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 14,
                                    }}>
                                        <MaterialCommunityIcons
                                            name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24}
                                            color={isSelected ? colors.royalBlue : colors.blackOpacity(0.3)}
                                        />
                                    </View>
                                    <Text style={{
                                        flex: 1,
                                        fontSize: responsiveFontSize(1.9),
                                        fontWeight: isSelected ? '600' : '500',
                                        color: isSelected ? colors.royalBlue : colors.black,
                                    }}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>

            {/* Second Job Popup Modal */}
            <Modal
                visible={showSecondJobPopup}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSecondJobPopup(false)}
            >
                <View style={styles.popupOverlay}>
                    <View style={styles.popupContent}>
                        <View style={[styles.popupIconContainer, { backgroundColor: 'rgba(36, 107, 253, 0.1)' }]}>
                            <MaterialCommunityIcons name="briefcase-plus-outline" size={32} color="#246BFD" />
                        </View>
                        <Text style={styles.popupTitle}>
                            {t('secondJobTitle') || 'Post Another Job?'}
                        </Text>
                        <Text style={styles.popupMessage}>
                            {t('secondJobMessage') || 'You need a subscription to post more than one job.'}
                        </Text>
                        <View style={styles.popupButtons}>
                            <TouchableOpacity
                                onPress={() => handleSecondJobPopupResponse(false)}
                                style={[styles.popupButton, styles.popupButtonSecondary]}
                            >
                                <Text style={styles.popupButtonTextSecondary}>
                                    {t('cancel')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleSecondJobPopupResponse(true)}
                                style={[styles.popupButton, styles.popupButtonPrimary]}
                            >
                                <LinearGradient
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFillObject}
                                    colors={['#084489', '#0c78f0']}
                                />
                                <Text style={styles.popupButtonTextPrimary}>
                                    {t('proceed')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Job Premium Payment Modal */}
            <Modal
                visible={jobPremiumModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => { }}
                statusBarTranslucent={true}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <SafeAreaView style={jobPremiumStyles.overlay}>
                    <View style={jobPremiumStyles.container}>
                        {/* Slim Header */}
                        <View style={jobPremiumStyles.header}>
                            <View style={jobPremiumStyles.headerIcon}>
                                <MaterialCommunityIcons name="briefcase-check" size={22} color="#246BFD" />
                            </View>
                            <Text style={jobPremiumStyles.headerTitle}>
                                {t('chooseHiringPlan') || 'Choose Your Hiring Plan'}
                            </Text>
                            <View style={jobPremiumStyles.driverCountBadge}>
                                <Ionicons name="people" size={14} color="#246BFD" />
                                <Text style={jobPremiumStyles.driverCountText}>
                                    {parseInt(addJob?.Job_Management) || 1}
                                </Text>
                            </View>
                            {/* Close Button */}
                            <TouchableOpacity
                                onPress={() => setShowSkipConfirmDialog(true)}
                                style={jobPremiumStyles.closeButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={18} color="#6C757D" />
                            </TouchableOpacity>
                        </View>

                        {/* Plans */}
                        <ScrollView
                            style={jobPremiumStyles.plansContainer}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {jobPremiumPlans.map((plan, index) => {
                                const isSuperPremium = plan.name === 'super_premium_job';
                                const driverCount = parseInt(addJob?.Job_Management) || 1;
                                const totalAmount = plan.amount * driverCount;
                                const hiringDays = isSuperPremium ? 4 : 7;

                                return (
                                    <TouchableOpacity
                                        key={plan.id}
                                        activeOpacity={0.8}
                                        onPress={() => handleJobPremiumPayment(plan)}
                                        disabled={jobPremiumLoading}
                                        style={[
                                            jobPremiumStyles.planCard,
                                            isSuperPremium && jobPremiumStyles.planCardPremium,
                                            selectedPremiumPlan?.id === plan.id && jobPremiumLoading && jobPremiumStyles.planCardSelected
                                        ]}
                                    >
                                        {isSuperPremium && (
                                            <View style={jobPremiumStyles.recommendedBadge}>
                                                <Text style={jobPremiumStyles.recommendedText}>
                                                    {t('urgentHiring') || 'URGENT HIRING'}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Plan Title */}
                                        <View style={jobPremiumStyles.planHeader}>
                                            <View style={[
                                                jobPremiumStyles.planIconContainer,
                                                { backgroundColor: isSuperPremium ? '#FFF5E6' : '#E8F0FE' }
                                            ]}>
                                                <MaterialCommunityIcons
                                                    name={isSuperPremium ? "crown" : "star"}
                                                    size={28}
                                                    color={isSuperPremium ? "#F5A623" : "#246BFD"}
                                                />
                                            </View>
                                            <View style={jobPremiumStyles.planInfo}>
                                                <Text style={[
                                                    jobPremiumStyles.planName,
                                                    isSuperPremium && { color: '#F5A623' }
                                                ]}>
                                                    {isSuperPremium
                                                        ? (t('superPremiumJob') || '👑 Super Premium Job')
                                                        : (t('premiumJob') || '⭐ Premium Job')
                                                    }
                                                </Text>
                                                <Text style={jobPremiumStyles.planPricePerHiring}>
                                                    ₹{plan.amount?.toLocaleString()} / {t('perHiring') || 'per hiring'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Guarantee Badge */}
                                        <View style={[
                                            jobPremiumStyles.guaranteeBadge,
                                            isSuperPremium && { backgroundColor: '#FFF5E6', borderColor: '#F5A623' }
                                        ]}>
                                            <Ionicons
                                                name="shield-checkmark"
                                                size={18}
                                                color={isSuperPremium ? "#F5A623" : "#10B981"}
                                            />
                                            <Text style={[
                                                jobPremiumStyles.guaranteeText,
                                                isSuperPremium && { color: '#F5A623' }
                                            ]}>
                                                {isSuperPremium
                                                    ? (t('superPremiumGuarantee') || `Driver hired within ${hiringDays} days — guaranteed or money back`)
                                                    : (t('premiumGuarantee') || `Driver hired within ${hiringDays} days — or money back`)
                                                }
                                            </Text>
                                        </View>

                                        {/* Features */}
                                        <View style={jobPremiumStyles.featuresContainer}>
                                            {isSuperPremium ? (
                                                <>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#F5A623" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('priorityJobManager') || 'Priority Job Manager support'}
                                                        </Text>
                                                    </View>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#F5A623" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('fasterShortlisting') || 'Faster shortlisting & daily follow-ups'}
                                                        </Text>
                                                    </View>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#F5A623" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('highPriorityMatching') || 'High-priority driver matching'}
                                                        </Text>
                                                    </View>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#F5A623" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('verifiedTrustedDrivers') || 'Verified & trusted drivers'}
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('dedicatedJobManager') || 'Dedicated Job Manager assigned'}
                                                        </Text>
                                                    </View>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('endToEndSupport') || 'End-to-end hiring support'}
                                                        </Text>
                                                    </View>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('shortlistingHandled') || 'Shortlisting, follow-ups & coordination handled by TruckMitr'}
                                                        </Text>
                                                    </View>
                                                    <View style={jobPremiumStyles.featureRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                        <Text style={jobPremiumStyles.featureText}>
                                                            {t('verifiedDriversOnly') || 'Verified drivers only'}
                                                        </Text>
                                                    </View>
                                                </>
                                            )}
                                        </View>

                                        {/* Best For */}
                                        <View style={jobPremiumStyles.bestForContainer}>
                                            <Text style={jobPremiumStyles.bestForLabel}>
                                                {t('bestFor') || 'Best for:'}
                                            </Text>
                                            <Text style={[
                                                jobPremiumStyles.bestForText,
                                                isSuperPremium && { color: '#F5A623' }
                                            ]}>
                                                {isSuperPremium
                                                    ? (t('urgentHiringDesc') || 'Urgent hiring with zero delay tolerance.')
                                                    : (t('flexibleHiringDesc') || 'When you need a driver fast, but with flexibility.')
                                                }
                                            </Text>
                                        </View>

                                        {/* Total Calculation & Pay Button */}
                                        <View style={jobPremiumStyles.planPriceRow}>
                                            <View>
                                                <Text style={jobPremiumStyles.calculationText}>
                                                    {driverCount} {t('drivers') || 'drivers'} × ₹{plan.amount?.toLocaleString()}
                                                </Text>
                                                <Text style={[
                                                    jobPremiumStyles.planPrice,
                                                    isSuperPremium && { color: '#F5A623' }
                                                ]}>
                                                    ₹{totalAmount?.toLocaleString()}
                                                </Text>
                                            </View>
                                            <LinearGradient
                                                colors={isSuperPremium ? ['#F59E0B', '#D97706'] : ['#2563EB', '#1D4ED8']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[
                                                    jobPremiumStyles.payButton,
                                                    isSuperPremium && jobPremiumStyles.payButtonPremium,
                                                    { borderWidth: 0 } // Ensure no border on gradient
                                                ]}
                                            >
                                                {jobPremiumLoading && selectedPremiumPlan?.id === plan.id ? (
                                                    <ActivityIndicator size="small" color="#FFF" />
                                                ) : (
                                                    <>
                                                        <Text style={jobPremiumStyles.payButtonText}>
                                                            {t('payNow') || 'Pay Now'}
                                                        </Text>
                                                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Skip Option */}
                            <TouchableOpacity
                                onPress={handleSkipPremium}
                                disabled={jobPremiumLoading}
                                style={jobPremiumStyles.skipButton}
                                activeOpacity={0.7}
                            >
                                <Text style={jobPremiumStyles.skipButtonText}>
                                    {t('skipPostAsStandard') || 'Skip, post as standard job'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Skip Confirmation Dialog */}
                        {showSkipConfirmDialog && (
                            <View style={jobPremiumStyles.confirmDialogOverlay}>
                                <View style={jobPremiumStyles.confirmDialog}>
                                    <View style={jobPremiumStyles.confirmDialogIcon}>
                                        <Ionicons name="information-circle" size={48} color="#246BFD" />
                                    </View>
                                    <Text style={jobPremiumStyles.confirmDialogTitle}>
                                        {t('postAsStandardJob') || 'Post as Standard Job?'}
                                    </Text>

                                    {/* Main Message */}
                                    <Text style={jobPremiumStyles.confirmDialogMessage}>
                                        {t('transporterProBenefit') || 'Since you are a TruckMitr Transporter Pro subscriber, you can continue to post jobs and hire drivers directly through the app.'}
                                    </Text>

                                    {/* Warning Box */}
                                    <View style={jobPremiumStyles.confirmWarningBox}>
                                        <Ionicons name="warning" size={20} color="#F59E0B" />
                                        <Text style={jobPremiumStyles.confirmWarningText}>
                                            {t('noJobManagerWarning') || 'However, no dedicated Job Manager will be assigned for this job. You will manage shortlisting, calls, and hiring on your own using the in-app tools.'}
                                        </Text>
                                    </View>

                                    {/* Tip */}
                                    <View style={jobPremiumStyles.confirmTipBox}>
                                        <Text style={jobPremiumStyles.confirmTipText}>
                                            {t('upgradeTip') || '👉 If you want priority support and faster hiring, you can upgrade this job to Premium or Super Premium at any time.'}
                                        </Text>
                                    </View>

                                    <View style={jobPremiumStyles.confirmDialogButtons}>
                                        <TouchableOpacity
                                            onPress={() => setShowSkipConfirmDialog(false)}
                                            style={jobPremiumStyles.confirmDialogCancelBtn}
                                        >
                                            <Text style={jobPremiumStyles.confirmDialogCancelText}>
                                                {t('goBack') || 'Go Back'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={confirmPostAsStandardJob}
                                            style={jobPremiumStyles.confirmDialogConfirmBtn}
                                        >
                                            <Text style={jobPremiumStyles.confirmDialogConfirmText}>
                                                {t('postJob') || 'Post Job'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>
        </Animated.View >

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Success Screen Styles
    successContainer: {
        backgroundColor: '#FFFFFF',
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    confettiPiece: {
        position: 'absolute',
        borderRadius: 2,
    },
    successContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    successIconWrapper: {
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    pulseRingOuter: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#D8E4ED',
        opacity: 0.5,
    },
    pulseRingMiddle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#C5D5E8',
        opacity: 0.7,
    },
    successIconInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    successTextContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A2E',
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    truckIconContainer: {
        marginVertical: 16,
        opacity: 0.9,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginTop: 16,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A2E',
        marginTop: 6,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: '#6C757D',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#DEE2E6',
        marginHorizontal: 16,
    },
    successBottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    progressBarWrapper: {
        width: '100%',
        height: 6,
        backgroundColor: '#E9ECEF',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBarFill: {
        width: '100%',
        height: '100%',
        backgroundColor: '#084489',
        borderRadius: 3,
    },
    redirectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    redirectText: {
        fontSize: 14,
        color: '#6C757D',
        fontWeight: '500',
        marginLeft: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    navBtn: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },

    progressInfo: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    progressText: {
        fontSize: 12,
        color: '#6C757D',
        marginBottom: 8,
        fontWeight: '500',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#E9ECEF',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#246BFD',
        borderRadius: 2,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingTop: 12,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepHeaderText: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 2,
    },
    stepSubtitle: {
        fontSize: 13,
        color: '#6C757D',
    },
    divider: {
        height: 1,
        backgroundColor: '#E9ECEF',
        marginBottom: 16,
    },
    stepContainer: {
        width: '100%',
    },
    classicLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 4,
    },
    classicBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#CED4DA',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 52,
    },
    classicBoxText: {
        fontSize: 15,
        color: '#212529',
    },
    classicInput: {
        borderWidth: 1,
        borderColor: '#CED4DA',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 52,
        fontSize: 15,
        color: '#212529',
    },
    largeInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
        paddingBottom: 12,
    },
    helperText: {
        fontSize: 12,
        color: '#6C757D',
        marginTop: 6,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    // Vehicle Type Styles
    vehicleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    vehicleTile: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        position: 'relative',
    },
    vehicleTileSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    vehicleImage: {
        width: '100%',
        height: 80,
        marginBottom: 0,
    },
    vehicleLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#495057',
        textAlign: 'center',
    },
    vehicleLabelSelected: {
        color: '#246BFD',
    },
    vehicleCheckmark: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    // Experience Tile Styles
    experienceTile: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#DEE2E6',
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    experienceTileSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    experienceTileText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#495057',
        textAlign: 'center',
    },
    experienceTileTextSelected: {
        color: '#246BFD',
        fontWeight: '700',
    },
    // Salary Tile Styles
    salaryTile: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#DEE2E6',
        paddingVertical: 14,
        paddingHorizontal: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    salaryTileSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    salaryTileText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#495057',
        textAlign: 'center',
    },
    salaryTileTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },
    // Endorsement/License Type Styles
    endorsementTile: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#DEE2E6',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: 'white',
    },
    endorsementTileSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    endorsementIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    endorsementLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    // Skills Grid
    skillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 14,
        margin: 4,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    skillChipSelected: {
        backgroundColor: '#F0F5FF',
        borderColor: '#246BFD',
    },
    skillChipText: {
        fontSize: 13,
        color: '#495057',
        fontWeight: '500',
    },
    skillChipTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },
    // Checkbox
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxText: {
        flex: 1,
        fontSize: 13,
        color: '#6C757D',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
        backgroundColor: 'white',
        paddingTop: 16,
    },
    classicButton: {
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: "#246BFD",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    classicButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#F8F9FA',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    modalItemSelected: {
        backgroundColor: '#F0F5FF',
    },
    modalItemText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    // Popup Modal
    popupOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    popupContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    popupIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    popupMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    popupButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    popupButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    popupButtonSecondary: {
        backgroundColor: '#F0F0F0',
    },
    popupButtonPrimary: {},
    popupButtonTextSecondary: {
        fontWeight: '600',
        fontSize: 15,
        color: '#333',
    },
    popupButtonTextPrimary: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    // Calendar Styles
    inlineCalendarContainer: {
        backgroundColor: '#F8F9FC',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    calendarArrow: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#E8F0FE',
    },
    yearPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#E8F0FE',
    },
    calendarHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    yearPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    yearPickerContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxHeight: '60%',
    },
    yearPickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 16,
    },
    yearPickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginVertical: 2,
    },
    yearPickerItemSelected: {
        backgroundColor: '#E8F0FE',
    },
    yearPickerItemText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    yearPickerItemTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },
    // Job Summary Styles
    summaryContainer: {
        width: '100%',
    },
    summaryHeader: {
        marginBottom: 20,
    },
    summaryHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 6,
    },
    summaryHeaderSubtitle: {
        fontSize: 13,
        color: '#6C757D',
        lineHeight: 20,
    },
    summaryConsentContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    summaryCardTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6C757D',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    summaryCardValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212529',
        marginLeft: 48,
        lineHeight: 22,
    },
    summaryVehicleImage: {
        width: '100%',
        height: 45,
        marginTop: 4,
        marginBottom: 4,
    },
    summarySkillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginLeft: 48,
        marginTop: 0,
    },
    summarySkillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F5FF',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    summarySkillText: {
        fontSize: 12,
        color: '#246BFD',
        fontWeight: '500',
        marginLeft: 5,
    },
    summaryDescription: {
        fontSize: 14,
        lineHeight: 22,
        color: '#495057',
        fontWeight: '400',
    },

    // Route styles
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    routeFieldContainer: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    routeInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#FAFAFA',
    },
    routeArrow: {
        marginHorizontal: 12,
        marginTop: 20,
    },
    routeSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    routeText: {
        fontSize: 11,
        color: '#666',
        flex: 1,
        textAlign: 'center',
    },

    // Radio button styles
    radioContainer: {
        flexDirection: 'column',
        gap: 12,
        marginTop: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
        width: '100%',
        justifyContent: 'flex-start',
    },
    radioOptionSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F7FF',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioCircleSelected: {
        borderColor: '#246BFD',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#246BFD',
    },
    radioText: {
        fontSize: 18,
        color: '#374151',
        fontWeight: '500',
    },
    radioTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },

    // Truck condition styles
    conditionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    conditionOptionSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F7FF',
    },
    conditionTextContainer: {
        flex: 1,
        marginLeft: 4,
    },
    conditionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    conditionTitleSelected: {
        color: '#246BFD',
    },
    conditionDescription: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '400',
    },
    conditionDescriptionSelected: {
        color: '#246BFD',
    },

    // Conditional input styles
    conditionalInput: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    conditionalInputInline: {
        marginTop: 12,
    },
    conditionalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    amountInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: 'white',
    },

    // Pincode styles
    pincodeSection: {
        marginTop: 8,
    },
    pincodeLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    pincodeLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    pincodeErrorText: {
        marginTop: 8,
        fontSize: 14,
        color: '#EF4444',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    dropdownSelectedText: {
        fontSize: 16,
        color: '#333',
    },
});
// Job Premium Payment Modal Styles
const jobPremiumStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F0FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        flex: 1,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    plansContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6', // Very subtle border
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    planCardPremium: {
        borderColor: '#F59E0B', // Gold/Amber
        borderWidth: 1.5,
        backgroundColor: '#FFFCF5', // Very subtle warm tint
        shadowColor: '#F59E0B',
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    planCardSelected: {
        // opacity: 0.7, // Removed opacity change to keep it looking premium always
    },
    recommendedBadge: {
        position: 'absolute',
        top: -12,
        right: 16,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    planIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        backgroundColor: '#F3F4F6', // Default subtle gray
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827', // Darker gray/black
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    planDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    planPricePerHiring: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    planPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6', // Lighter divider
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2563EB', // Royal Blue
        letterSpacing: -0.5,
    },
    calculationText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
        fontWeight: '500',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payButtonPremium: {
        backgroundColor: '#F59E0B',
        shadowColor: '#F59E0B',
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    driverCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF', // Light Blue
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 6,
    },
    driverCountText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '700',
    },
    closeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    guaranteeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5', // Light Green
        // borderWidth: 1, // Remove border for cleaner look
        // borderColor: '#10B981',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 14,
        gap: 8,
    },
    guaranteeText: {
        fontSize: 12,
        color: '#059669', // Darker Green for better contrast
        fontWeight: '600',
        flex: 1,
    },
    bestForContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: 12,
    },
    bestForLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    bestForText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    featuresContainer: {
        marginTop: 4,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 10,
    },
    featureText: {
        fontSize: 13,
        color: '#4B5563', // Gray 600
        flex: 1,
        lineHeight: 18,
        fontWeight: '400',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 4,
        marginBottom: 30,
    },
    skipButtonText: {
        fontSize: 14,
        color: '#9CA3AF', // Gray 400
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    // Confirmation Dialog Styles
    confirmDialogOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    confirmDialog: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    confirmDialogIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E8F0FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    confirmDialogTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 12,
    },
    confirmDialogMessage: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'left',
        lineHeight: 20,
        marginBottom: 12,
    },
    confirmWarningBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF3E2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        gap: 10,
        alignItems: 'flex-start',
    },
    confirmWarningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
    confirmTipBox: {
        backgroundColor: '#E8F0FE',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
    },
    confirmTipText: {
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
    confirmDialogButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmDialogCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmDialogCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmDialogConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#246BFD',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmDialogConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

