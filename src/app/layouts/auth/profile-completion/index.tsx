import React, { useState, useEffect, memo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    interpolate,
    Easing,
    ZoomIn,
    cancelAnimation,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import Svg, { Path, G, Circle, LinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { useColor, useShadow, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { userAction, userEditAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import ImagePicker from 'react-native-image-crop-picker';
import { Dropdown } from 'react-native-element-dropdown';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';

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

// Voice file mapping for Hindi step descriptions - Profile Completion
const DRIVER_VOICE_FILES: { [key: string]: any } = {
    'dob': require('@truckmitr/src/assets/voice/date-of-birth.mp3'),
    'gender': require('@truckmitr/src/assets/voice/step_gender.mp3'),
    'education': require('@truckmitr/src/assets/voice/step_education.mp3'),
    'vehicle': require('@truckmitr/src/assets/voice/step_vehicle.mp3'),
    'experience': require('@truckmitr/src/assets/voice/step_experience.mp3'),
    'license': require('@truckmitr/src/assets/voice/type-of-license.mp3'),
    'endorsement': require('@truckmitr/src/assets/voice/driving-endorsement.mp3'),
    'current_salary': require('@truckmitr/src/assets/voice/monthly-salary.mp3'),
    'expected_salary': require('@truckmitr/src/assets/voice/expected-salary.mp3'),
    'avatar': require('@truckmitr/src/assets/voice/profile-photo.mp3'),
    'id_numbers': require('@truckmitr/src/assets/voice/id_details.mp3'),
};

const TRANSPORTER_VOICE_FILES: { [key: string]: any } = {
    'year_of_exp': null, // require('@truckmitr/src/assets/voice/step_experience_years.mp3'),
    'fleet_size': null, // require('@truckmitr/src/assets/voice/step_fleet_size.mp3'),
    'industry_segment': null, // require('@truckmitr/src/assets/voice/step_industry.mp3'),
    'avg_km_run': null, // require('@truckmitr/src/assets/voice/step_avg_km.mp3'),
    'vehicle': null, // require('@truckmitr/src/assets/voice/step_vehicle_transporter.mp3'),
    'operational_segment': null, // require('@truckmitr/src/assets/voice/step_preferences.mp3'),
    'pan_gst': null, // require('@truckmitr/src/assets/voice/step_pan_gst.mp3'),
};

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// --- Highly HD Truck Animation ---
const HDTruckSvg = ({ wheelRotation }: { wheelRotation: Animated.SharedValue<number> }) => {
    return (
        <Svg width="100" height="60" viewBox="0 0 100 60">
            <Defs>
                <LinearGradient id="truckBody" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FF6B00" />
                    <Stop offset="1" stopColor="#FF8F00" />
                </LinearGradient>
                <LinearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#87CEEB" />
                    <Stop offset="1" stopColor="#4682B4" />
                </LinearGradient>
            </Defs>

            {/* Shadow */}
            <Circle cx="50" cy="55" r="35" fill="black" opacity="0.3" transform="scale(1, 0.2)" />

            {/* Cargo Box */}
            <Rect x="5" y="5" width="60" height="40" rx="4" fill="url(#truckBody)" />
            {/* Branding on Box */}
            <Rect x="15" y="15" width="40" height="4" rx="2" fill="white" opacity="0.6" />
            <Rect x="15" y="23" width="25" height="4" rx="2" fill="white" opacity="0.6" />

            {/* Cab */}
            <Path d="M65 15 L85 15 L90 25 L90 45 L65 45 Z" fill="#333" />
            {/* Window */}
            <Path d="M68 18 L82 18 L86 25 L68 25 Z" fill="url(#windowGrad)" />

            {/* Headlight */}
            <Rect x="88" y="38" width="4" height="6" fill="#FFF" />
            <Path d="M92 41 L120 30 L120 52 Z" fill="yellow" opacity="0.2" />
        </Svg>
    );
};

// Separate Wheel Component for Rotation
const TruckWheel = ({ style }: { style: any }) => (
    <Animated.View style={[style, styles.wheelContainer]}>
        <Svg width="20" height="20" viewBox="0 0 20 20">
            <Circle cx="10" cy="10" r="9" fill="#111" />
            <Circle cx="10" cy="10" r="4" fill="#555" />
            <Rect x="9" y="2" width="2" height="16" fill="#333" />
            <Rect x="2" y="9" width="16" height="2" fill="#333" />
        </Svg>
    </Animated.View>
);

// Memoized Animation Component to prevent re-renders stopping animation
const MovingTruckAnimation = memo(({ progress }: { progress: number }) => {
    const truckX = useSharedValue(0);
    const bgX = useSharedValue(0);
    const wheelRot = useSharedValue(0);
    const chassisY = useSharedValue(0);

    useEffect(() => {
        // Truck moves based on progress
        const targetX = (width - 120) * (progress / 100);
        truckX.value = withSpring(targetX, { damping: 15, stiffness: 60 });
    }, [progress]);

    useEffect(() => {
        // Continuous Loops - unaffected by prop changes

        // Background parallax loop
        bgX.value = withRepeat(withTiming(-200, { duration: 4000, easing: Easing.linear }), -1, false);

        // Wheel Rotation Loop
        wheelRot.value = withRepeat(withTiming(360, { duration: 500, easing: Easing.linear }), -1, false);

        // Chassis Vibration/Bounce
        chassisY.value = withRepeat(withSequence(
            withTiming(-1.5, { duration: 100 }),
            withTiming(1.5, { duration: 100 })
        ), -1, true);
    }, []);

    const truckStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: truckX.value }, { translateY: chassisY.value }]
    }));

    const bgStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: bgX.value }]
    }));

    const wheelStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${wheelRot.value}deg` }]
    }));

    return (
        <View style={styles.animationContainer}>
            {/* Parallax Background */}
            <Animated.View style={[styles.backgroundStrip, bgStyle]}>
                <Svg height="100%" width="300%" style={{ position: 'absolute' }}>
                    {/* Sky */}
                    <Rect x="0" y="0" width="100%" height="70%" fill="#E3F2FD" />

                    {/* Clouds */}
                    <Circle cx="50" cy="20" r="15" fill="white" opacity="0.8" />
                    <Circle cx="70" cy="25" r="18" fill="white" opacity="0.8" />
                    <Circle cx="180" cy="15" r="20" fill="white" opacity="0.8" />
                    <Circle cx="350" cy="22" r="22" fill="white" opacity="0.8" />

                    {/* Ground line */}
                    <Rect x="0" y="55" width="100%" height="25" fill="#2E8B57" />

                    {/* Trees - Adjusted Y to sit ON ground (y=55 is horizon) */}
                    {[80, 150, 220, 300, 380, 450, 520, 600].map((x, i) => {
                        // Vary tree sizes
                        const treeHeight = 20 + (i % 3) * 5;
                        const trunkHeight = treeHeight * 0.4;
                        const topY = 55 - treeHeight;

                        return (
                            <G key={i}>
                                {/* Trunk - anchored at y=55 */}
                                <Rect x={x} y={55 - trunkHeight} width="6" height={trunkHeight} fill="#8B4513" />
                                {/* Leaves - Circle centered above trunk */}
                                <Circle cx={x + 3} cy={55 - trunkHeight} r={12 + (i % 3) * 3} fill={i % 2 === 0 ? "#228B22" : "#006400"} />
                            </G>
                        );
                    })}
                </Svg>
            </Animated.View>

            {/* Truck */}
            <Animated.View style={[styles.truckWrapper, truckStyle]}>
                <HDTruckSvg wheelRotation={wheelRot} />
                <TruckWheel style={[styles.rearWheel, wheelStyle]} />
                <TruckWheel style={[styles.frontWheel, wheelStyle]} />
            </Animated.View>

            {/* Road */}
            <View style={styles.roadSurface}>
                <View style={styles.roadMarkings} />
            </View>
        </View>
    );
});

// --- Fields Configuration ---
// Driver Steps
const DRIVER_STEPS = [
    { id: 'dob', title: 'dob', subtitle: 'selectYourDateOfBirth', field: 'DOB', required: true },
    { id: 'gender', title: 'gender', subtitle: 'selectYourGender', field: 'Sex', required: true },
    { id: 'education', title: 'highestEducation', subtitle: 'selectHighestEducation', field: 'education', required: true },

    { id: 'vehicle', title: 'vehicleType', subtitle: 'selectVehicleType', field: 'vehicle_type', required: true },
    { id: 'experience', title: 'drivingExperienceYears', subtitle: 'selectDrivingExperience', field: 'Driving_Experience', required: true },
    { id: 'license', title: 'typeOfLicense', subtitle: 'selectLicenseType', field: 'Type_of_License', required: true },
    { id: 'endorsement', title: 'licenseEndorsement', subtitle: 'Select License Endorsements', field: 'endorsement', required: true },
    { id: 'current_salary', title: 'currentSalary', subtitle: 'selectCurrentMonthlySalary', field: 'current_salary', required: true },
    { id: 'expected_salary', title: 'expectedSalary', subtitle: 'selectExpectedMonthlySalary', field: 'expected_salary', required: true },
    { id: 'avatar', title: 'profilePhoto', subtitle: 'addYourProfilePhoto', field: 'profilePath', required: true },
    { id: 'id_numbers', title: 'idDetails', subtitle: 'enterIdDetails', field: 'Aadhar_Number', required: true },
];

// Transporter Steps
const TRANSPORTER_STEPS = [

    { id: 'year_of_exp', title: 'yearOfOperation', subtitle: 'selectYearsOfOperation', field: 'year_of_exp', required: true },
    { id: 'fleet_size', title: 'fleetSize', subtitle: 'selectFleetSize', field: 'fleet_size', required: true },
    { id: 'industry_segment', title: 'industrySegment', subtitle: 'selectIndustrySegment', field: 'industry_segment', required: true },
    { id: 'avg_km_run', title: 'avgKmRun', subtitle: 'enterAverageKmRun', field: 'avg_km_run', required: true },
    { id: 'vehicle', title: 'vehicleType', subtitle: 'selectVehicleType', field: 'vehicle_type', required: true },
    { id: 'operational_segment', title: 'operationalSegment', subtitle: 'selectOperationalSegment', field: 'operational_segment', required: true },
    { id: 'pan_gst', title: 'panGstDetails', subtitle: 'enterPanGstDetails', field: 'pan', required: false },
];

const educationList = [
    { label: 'No Formal Education', value: 'No Formal Education' },
    { label: 'Primary School (Up to 5th)', value: 'Primary School' },
    { label: 'Middle School (Up to 8th)', value: 'Middle School' },
    { label: 'High School (10th)', value: 'High School' },
    { label: 'Intermediate (12th)', value: 'Intermediate' },
    { label: 'Graduate', value: 'Graduate' },
    { label: 'Post Graduate', value: 'Post Graduate' },
];

const drivingExperienceArray = [
    { label: '< 1 Year', value: 'less_than_1' },
    { label: '1-2 Years', value: '1-2' },
    { label: '3-5 Years', value: '3-5' },
    { label: '6-10 Years', value: '6-10' },
    { label: '10+ Years', value: '10+' },
];

const licenseTypesList = [
    { label: 'LMV (Light)', value: 'LMV' },
    { label: 'HMV (Heavy)', value: 'HMV' },
    { label: 'HGMV (Goods)', value: 'HGMV' },
    { label: 'HPMV/HTV', value: 'HPMV/HTV' },
];

const salaryRanges = ['15000-20000', '20000-25000', '25000-30000', '30000-35000', '35000-40000', '40000-45000', '45000-50000', '50000-55000', '55000-60000'];

const endorsementOptions = [
    { id: 'hill', label: 'Hill Driving', emoji: '🏔️' },
    { id: 'hazardous', label: 'Hazardous Goods', emoji: '☢️' },
    { id: 'roller', label: 'Road Roller', emoji: '🚜' },
    { id: 'tractor', label: 'Tractor-Trailer (Commercial)', emoji: '🚛' },
    { id: 'forklift', label: 'Forklift / MHE', emoji: '🏗️' },
    { id: 'other', label: 'Other', emoji: '📋' },
];

const dummyVehicleTypes = [
    { label: 'Cargo Truck (Open)', value: '1', image: TruckImages.cargoOpen },
    { label: 'Cargo Truck (Closed)', value: '2', image: TruckImages.cargoClosed },
    { label: 'Tipper Trucks', value: '3', image: TruckImages.tipper },
    { label: 'Trailer / Semi-Trailer Trucks', value: '4', image: TruckImages.trailer },
    { label: 'Tankers', value: '5', image: TruckImages.tanker },
    { label: 'Car Carriers', value: '6', image: TruckImages.carCarrier },
    { label: 'Container Trucks', value: '7', image: TruckImages.container },
    { label: 'Refrigerator (Reefer) Trucks', value: '8', image: TruckImages.reefer },
];

export default function ProfileCompletion() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { userEdit, isTransporter, isDriver, user } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [userRole, setUserRole] = useState<'driver' | 'transporter'>('driver');

    // Set user role from Redux state immediately
    useEffect(() => {
        console.log('Checking user role - isTransporter:', isTransporter, 'isDriver:', isDriver, 'user?.role:', user?.role, 'userEdit?.role:', userEdit?.role);
        if (isTransporter || user?.role === 'transporter' || userEdit?.role === 'transporter') {
            console.log('Setting userRole to TRANSPORTER');
            setUserRole('transporter');
        } else if (isDriver || user?.role === 'driver' || userEdit?.role === 'driver') {
            console.log('Setting userRole to DRIVER');
            setUserRole('driver');
        }
    }, [isTransporter, isDriver, user, userEdit]);

    // Data list states
    const [vehicleTypeList, setVehicleTypeList] = useState<any[]>(dummyVehicleTypes); // Initialize with dummy data
    const [commonStatesList, setCommonStatesList] = useState<any[]>([]);
    const [savedSignupData, setSavedSignupData] = useState<any>(null);
    const [finishing, setFinishing] = useState(false);

    // Voice playback states
    const [currentAudioSource, setCurrentAudioSource] = useState<any>(null);
    const [isVoiceMuted, setIsVoiceMuted] = useState(false);

    // Emergency Selection Modal (handles both state and city now if needed)
    const [missingFieldModalOpen, setMissingFieldModalOpen] = useState(false);
    const [missingFieldType, setMissingFieldType] = useState<'state' | 'city'>('state');
    // Local state for city input in modal to avoid redux lag before submit
    const [tempCity, setTempCity] = useState('');

    // Year picker for DOB calendar
    const [yearPickerOpen, setYearPickerOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(moment().subtract(18, 'years').format('YYYY-MM-DD'));

    // License Expiry Modal
    const [licenseExpiryModal, setLicenseExpiryModal] = useState(false);

    // Fade animation for content transition
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);

    // Dynamic steps based on user role
    const STEPS = userRole === 'transporter' ? TRANSPORTER_STEPS : DRIVER_STEPS;
    const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

    // Animated progress bar width
    const progressWidth = useSharedValue(progressPercent);

    // Update progress animation when step changes
    useEffect(() => {
        const newProgress = ((currentStep + 1) / STEPS.length) * 100;
        progressWidth.value = withSpring(newProgress, { damping: 15, stiffness: 90 });
    }, [currentStep, STEPS.length]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    // Translated data arrays
    const translatedEducationList = [
        { label: t('noFormalEducation'), value: 'No Formal Education' },
        { label: t('primarySchool'), value: 'Primary School' },
        { label: t('middleSchool'), value: 'Middle School' },
        { label: t('highSchool'), value: 'High School' },
        { label: t('intermediate'), value: 'Intermediate' },
        { label: t('graduate'), value: 'Graduate' },
        { label: t('postGraduate'), value: 'Post Graduate' },
    ];

    const translatedExperienceList = [
        { label: t('lessThan1Year'), value: 'less_than_1' },
        { label: t('1to2Years'), value: '1-2' },
        { label: t('3to5Years'), value: '3-5' },
        { label: t('6to10Years'), value: '6-10' },
        { label: t('10PlusYears'), value: '10+' },
    ];

    const translatedLicenseTypes = [
        { label: t('lmvLight'), value: 'LMV' },
        { label: t('hmvHeavy'), value: 'HMV' },
        { label: t('hgmvGoods'), value: 'HGMV' },
        { label: t('hpmvHtv'), value: 'HPMV/HTV' },
    ];

    const translatedSalaryRanges = ['15000-20000', '20000-25000', '25000-30000', '30000-35000', '35000-40000', '40000-45000', '45000-50000', '50000-55000', '55000-60000'];

    const translatedEndorsements = [
        { id: 'hill', label: t('hillDriving'), emoji: '🏔️' },
        { id: 'hazardous', label: t('hazardousGoods'), emoji: '☢️' },
        { id: 'roller', label: t('roadRoller'), emoji: '🚜' },
        { id: 'tractor', label: t('tractorTrailer'), emoji: '🚛' },
        { id: 'forklift', label: t('forkliftMHE'), emoji: '🏗️' },
        { id: 'other', label: t('other'), emoji: '📋' },
    ];

    const translatedVehicleTypes = [
        { label: t('cargoTruckOpen'), value: '1', image: TruckImages.cargoOpen },
        { label: t('cargoTruckClosed'), value: '2', image: TruckImages.cargoClosed },
        { label: t('tipperTrucks'), value: '3', image: TruckImages.tipper },
        { label: t('trailerTrucks'), value: '4', image: TruckImages.trailer },
        { label: t('tankers'), value: '5', image: TruckImages.tanker },
        { label: t('carCarriers'), value: '6', image: TruckImages.carCarrier },
        { label: t('containerTrucks'), value: '7', image: TruckImages.container },
        { label: t('reeferTrucks'), value: '8', image: TruckImages.reefer },
    ];

    // Transporter-specific translated arrays
    const translatedFleetSizes = [
        { label: '0-9', value: '0-9' },
        { label: '10-50', value: '10-50' },
        { label: '51-100', value: '51-100' },
        { label: '100+', value: '100+' },
    ];

    const translatedYearOfExp = [
        { label: t('lessThan1Year'), value: 'less_than_1' },
        { label: t('1to2Years'), value: '1-2' },
        { label: t('3to5Years'), value: '3-5' },
        { label: t('6to10Years'), value: '6-10' },
        { label: t('10PlusYears'), value: '10+' },
    ];

    const translatedOperationalSegments = [
        { label: t('localDelivery') || 'Local Delivery', value: 'local' },
        { label: t('intracity') || 'Intracity', value: 'intracity' },
        { label: t('intercity') || 'Intercity', value: 'intercity' },
        { label: t('interstate') || 'Interstate', value: 'interstate' },
        { label: t('allIndia') || 'All India', value: 'all_india' },
    ];

    const translatedAvgKmRanges = [
        { label: '< 1000 km', value: 'less_1000' },
        { label: '1000 - 3000 km', value: '1000_3000' },
        { label: '3000 - 5000 km', value: '3000_5000' },
        { label: '5000 - 10000 km', value: '5000_10000' },
        { label: '10000+ km', value: '10000_plus' },
    ];

    const translatedIndustrySegments = [
        { label: t('ecommerce') || 'E-commerce', value: 'ecommerce' },
        { label: t('whiteGoods') || 'White Goods', value: 'white_goods' },
        { label: t('livestock') || 'Livestock', value: 'livestock' },
        { label: t('perishable') || 'Perishable', value: 'perishable' },
        { label: t('oversized') || 'Oversized', value: 'oversized' },
        { label: t('fuelTanker') || 'Fuel Tanker', value: 'fuel_tanker' },
        { label: t('automobileCarrier') || 'Automobile Carrier', value: 'automobile_carrier' },
        { label: t('constructionIndustry') || 'Construction Industry', value: 'construction' },
        { label: t('refrigeratorVehicle') || 'Refrigerator Vehicle', value: 'refrigerator' },
        { label: t('others') || 'Others', value: 'others' },
    ];


    // Load initial data 
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Fetch Vehicle Types (Commented out for dummy mode, relying on state init)
                /*
                const response = await axiosInstance.get(END_POINTS.VEHICLE_TYPES);
                if (response?.data?.status) {
                    setVehicleTypeList(response?.data?.data);
                }
                */

                // 2. Fetch States (Keeping this active as it might be useful, or we can dummy this too if needed)
                const statesResponse = await axiosInstance.get(END_POINTS.GETSTATES);
                if (statesResponse?.data?.status) {
                    setCommonStatesList(statesResponse?.data?.data);
                }

                // 3. Fetch saved signup data for fallbacks
                const jsonValue = await AsyncStorage.getItem('signup_incomplete');
                if (jsonValue) {
                    const data = JSON.parse(jsonValue);
                    setSavedSignupData(data);
                    // Set user role from signup data
                    if (data?.role === 'transporter') {
                        setUserRole('transporter');
                    } else {
                        setUserRole('driver');
                    }
                }
            } catch (error: any) {
                console.log('Error initializing profile completion:', error);
            }
        };
        init();
    }, []);

    // Staggered entrance animation for fields
    useEffect(() => {
        contentOpacity.value = 0;
        contentTranslateX.value = 20;

        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateX.value = withSpring(0, { damping: 12 });

        // Play voice if not muted (for drivers regardless of language)
        if (!isVoiceMuted) {
            playStepVoice();
        }
    }, [currentStep, isVoiceMuted, userRole]);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));

    const playStepVoice = () => {
        if (userRole === 'transporter') {
            setCurrentAudioSource(null);
            return;
        }

        if (isVoiceMuted) return;

        try {
            const stepId = STEPS[currentStep].id;
            // userRole is guaranteed to be 'driver' here due to early return above
            const VOICE_FILES = DRIVER_VOICE_FILES;
            const voiceFile = VOICE_FILES[stepId];

            if (voiceFile) {
                // Stop any currently playing audio by setting to null first
                setCurrentAudioSource(null);

                // Small delay to ensure smooth transition
                setTimeout(() => {
                    setCurrentAudioSource(voiceFile);
                }, 100);
            } else {
                console.log('No voice file found for step:', stepId);
            }
        } catch (error) {
            console.log('Error playing voice:', error);
        }
    };

    const toggleVoiceMute = () => {
        setIsVoiceMuted(!isVoiceMuted);
        if (!isVoiceMuted) {
            // If muting, stop any currently playing audio
            setCurrentAudioSource(null);
        }
    };

    const handleNext = async () => {
        const step = STEPS[currentStep];

        // Strict Validation
        if (step.id === 'id_numbers') {
            if (!userEdit?.Aadhar_Number || !userEdit?.License_Number) {
                showToast(t('pleaseEnterAllRequiredDetails'));
                return;
            }
        } else if (step.id === 'avatar') {
            if (!userEdit?.profilePath) {
                showToast(t('pleaseEnterAllRequiredDetails'));
                return;
            }
        } else if (step.id === 'endorsement') {
            if (!userEdit?.endorsement) {
                showToast(t('pleaseEnterAllRequiredDetails'));
                return;
            }
        } else if (step.id === 'location') {
            if (!userEdit?.states || !userEdit?.city) {
                showToast(t('pleaseEnterAllRequiredDetails') || "State and City are required");
                return;
            }
        } else if (step.field && !userEdit?.[step.field]) {
            showToast(t('pleaseEnterAllRequiredDetails'));
            return;
        }

        if (currentStep < STEPS.length - 1) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 200);
        } else {
            submitProfile();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
            }, 200);
        }
    };

    const toggleEndorsement = (label: string) => {
        let current = userEdit?.endorsement ? userEdit.endorsement.split(', ') : [];
        if (current.includes(label)) {
            current = current.filter((i: string) => i !== label);
        } else {
            current.push(label);
        }
        dispatch(userEditAction({ ...userEdit, endorsement: current.join(', ') }));
    };

    // Cleanup any old persistence data on mount
    useEffect(() => {
        const cleanup = async () => {
            try {
                await AsyncStorage.removeItem('profile_completion_progress');
                console.log('Cleaned up old profile_completion_progress');
            } catch (e) {
                console.log('Cleanup error:', e);
            }
        };
        cleanup();
    }, []);

    // Helper function to normalize corrupted array data (handles nested JSON strings)
    const normalizeArrayField = (value: any): string[] => {
        if (!value) return [];

        // Handle numbers - convert to string array
        if (typeof value === 'number') {
            return [String(value)];
        }

        if (Array.isArray(value)) {
            const flattened: string[] = [];
            value.forEach((item: any) => {
                if (typeof item === 'number') {
                    const cleaned = String(item).trim();
                    if (cleaned && !flattened.includes(cleaned)) flattened.push(cleaned);
                } else if (typeof item === 'string') {
                    try {
                        const parsed = JSON.parse(item);
                        if (Array.isArray(parsed)) {
                            parsed.forEach((p: any) => {
                                const cleaned = String(p).replace(/[\[\]"\\]/g, '').trim();
                                if (cleaned && !flattened.includes(cleaned)) flattened.push(cleaned);
                            });
                        } else {
                            const cleaned = String(parsed).replace(/[\[\]"\\]/g, '').trim();
                            if (cleaned && !flattened.includes(cleaned)) flattened.push(cleaned);
                        }
                    } catch {
                        const cleaned = item.replace(/[\[\]"\\]/g, '').trim();
                        if (cleaned && !flattened.includes(cleaned)) flattened.push(cleaned);
                    }
                } else {
                    const cleaned = String(item).trim();
                    if (cleaned && !flattened.includes(cleaned)) flattened.push(cleaned);
                }
            });
            return flattened;
        }

        if (typeof value === 'string') {
            // First check if it's a simple comma-separated string (most common case)
            if (!value.startsWith('[') && !value.startsWith('{')) {
                return value.replace(/[\[\]"\\]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            try {
                const parsed = JSON.parse(value);
                return normalizeArrayField(parsed);
            } catch {
                return value.replace(/[\[\]"\\]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
            }
        }
        return [];
    };

    const logFormDataPayload = (formData: FormData) => {
        console.log('📦 ===== PROFILE SUBMIT PAYLOAD START =====');

        // @ts-ignore – React Native FormData internal structure
        const parts = formData?._parts;

        if (!parts || !Array.isArray(parts)) {
            console.log('⚠️ Unable to read FormData parts');
            return;
        }

        parts.forEach(([key, value]) => {
            if (typeof value === 'object' && value?.uri) {
                console.log(`🖼️ ${key}:`, {
                    uri: value.uri,
                    type: value.type,
                    name: value.name,
                });
            } else {
                console.log(`🔑 ${key}:`, value);
            }
        });

        console.log('📦 ===== PROFILE SUBMIT PAYLOAD END =====');
    };

    const profilePayloadPreview = {
        // ===== BASIC INFO =====
        name: userEdit?.name || user?.name || '',
        email: userEdit?.email || user?.email || '',
        mobile: userEdit?.mobile || user?.mobile || '',
        father_name: userEdit?.Father_Name || user?.Father_Name || '',

        dob: userEdit?.DOB
            ? moment(userEdit.DOB).format('DD-MM-YYYY')
            : '',

        sex: userEdit?.Sex || '',

        highest_education:
            userEdit?.education ||
            userEdit?.Highest_Education ||
            '',

        // ===== VEHICLE =====
        vehicle_type: normalizeArrayField(userEdit?.vehicle_type), // Array for both roles

        type_of_license: userEdit?.Type_of_License || '',

        licence_endorsement:
            userEdit?.endorsement?.split(', ').filter(Boolean) || [],

        Driving_Experience:
            ({
                'less_than_1': '0',
                '1-2': '1',
                '3-5': '3',
                '6-10': '6',
                '10+': '10',
            } as any)[userEdit?.Driving_Experience] ||
            userEdit?.Driving_Experience ||
            '0',

        // ===== DOCUMENTS =====
        Aadhar_Number: userEdit?.Aadhar_Number || '',
        License_Number:
            userEdit?.license_number ||
            userEdit?.License_Number ||
            '',

        expiry_date_of_license:
            userEdit?.Expiry_date_of_License
                ? moment(userEdit.Expiry_date_of_License).format('DD-MM-YYYY')
                : moment().add(5, 'years').format('DD-MM-YYYY'),

        // ===== SALARY =====
        current_monthly_income:
            userEdit?.current_salary ||
            userEdit?.Current_Monthly_Income ||
            '',

        expected_monthly_income:
            userEdit?.expected_salary ||
            userEdit?.Expected_Monthly_Income ||
            '',

        // ===== TAX =====
        pan_number: userEdit?.pan || userEdit?.PAN_Number || '',
        gst_number: userEdit?.gst || userEdit?.GST_Number || '',

        // ===== ADDRESS =====
        address: userEdit?.address || savedSignupData?.address || '',
        city: userEdit?.city || savedSignupData?.city || '',
        pincode: userEdit?.pincode || savedSignupData?.pincode || '',
        state:
            userEdit?.state_id ||
            userEdit?.states ||
            savedSignupData?.state ||
            '',

        // ===== TRANSPORTER ONLY =====
        ...(userRole === 'transporter'
            ? {
                transport_name:
                    userEdit?.transport_name ||
                    savedSignupData?.transport_name ||
                    '',

                year_of_exp: userEdit?.year_of_exp || '',

                year_of_establishment:
                    userEdit?.year_of_exp ||
                    userEdit?.year_of_establishment ||
                    userEdit?.establishment_year ||
                    '',

                fleet_size: userEdit?.fleet_size || '',
                average_km: userEdit?.avg_km_run || '',
                registered_id: userEdit?.registered_id || '',

                operational_segment:
                    userEdit?.industry_segment
                        ?.split(',')
                        .filter(Boolean) || [],

                routes:
                    userEdit?.operational_segment
                        ?.split(',')
                        .filter(Boolean) || [],
            }
            : {}),
    };



    const submitProfile = async () => {
        setFinishing(true);
        console.log('=== Profile Completion - Submitting to API ===');

        try {
            const formData = new FormData();

            // Common fields for both roles
            formData.append('name', userEdit?.name || user?.name || '');
            formData.append('email', userEdit?.email || user?.email || '');
            formData.append('mobile', userEdit?.mobile || user?.mobile || '');
            formData.append('father_name', userEdit?.Father_Name || user?.Father_Name || '');

            // DOB - format as d-m-Y (e.g., 29-12-2000)
            if (userEdit?.DOB) {
                formData.append('dob', moment(userEdit.DOB).format('DD-MM-YYYY'));
            }

            // Sex/Gender
            formData.append('sex', userEdit?.Sex || '');
            // formData.append('Sex', userEdit?.Sex || '');


            // Education
            formData.append('highest_education', userEdit?.education || userEdit?.Highest_Education || '');

            // Vehicle Type - Both Driver and Transporter now expect array format
            // Use helper to normalize corrupted data
            const cleanVehicleTypes = normalizeArrayField(userEdit?.vehicle_type);
            console.log('Cleaned Vehicle Types:', cleanVehicleTypes);

            if (cleanVehicleTypes.length > 0) {
                // Both roles: API expects array format with vehicle_type[]
                cleanVehicleTypes.forEach((vt: string) => {
                    formData.append('vehicle_type[]', vt.trim());
                });
            }

            // License Type
            formData.append('type_of_license', userEdit?.Type_of_License || '');

            // License Endorsements - API expects array
            const endorsements = userEdit?.endorsement?.split(', ').filter(Boolean) || [];
            if (endorsements.length > 0) {
                endorsements.forEach((end: string) => {
                    formData.append('licence_endorsement[]', end.trim());
                });
            }

            // Driving Experience - API expects CamelCase matching the missing field list
            const expMapping: { [key: string]: string } = {
                'less_than_1': '0', // If "0" is rejected, we might need to change this later
                '1-2': '1',
                '3-5': '3',
                '6-10': '6',
                '10+': '10'
            };
            formData.append('driving_experience', expMapping[userEdit?.Driving_Experience] || userEdit?.Driving_Experience || '0');

            // Aadhar Number
            formData.append('Aadhar_Number', userEdit?.Aadhar_Number || '');

            // License Number
            formData.append('license_number', userEdit?.license_number || userEdit?.License_Number || '');

            // License Expiry Date - format as d-m-Y
            if (userEdit?.Expiry_date_of_License) {
                formData.append('expiry_date_of_license', moment(userEdit.Expiry_date_of_License).format('DD-MM-YYYY'));
            } else {
                // Default to 5 years from now if not set
                formData.append('expiry_date_of_license', moment().add(5, 'years').format('DD-MM-YYYY'));
            }

            // Salary fields
            formData.append('current_monthly_income', userEdit?.current_salary || userEdit?.Current_Monthly_Income || '');
            formData.append('expected_monthly_income', userEdit?.expected_salary || userEdit?.Expected_Monthly_Income || '');

            // PAN and GST
            formData.append('pan_number', userEdit?.pan || userEdit?.PAN_Number || '');
            formData.append('gst_number', userEdit?.gst || userEdit?.GST_Number || '');

            // Address fields (from signup data or userEdit)
            formData.append('address', userEdit?.address || savedSignupData?.address || '');
            formData.append('city', userEdit?.city || savedSignupData?.city || '');
            formData.append('pincode', userEdit?.pincode || savedSignupData?.pincode || '');
            const stateValue = userEdit?.state_id || userEdit?.states || savedSignupData?.state || '';
            formData.append('states', stateValue);
            formData.append('state', stateValue);

            // Profile photo
            if (userEdit?.profilePath?.path && userEdit?.profilePath?.mime) {
                formData.append('images', {
                    uri: userEdit.profilePath.path,
                    type: userEdit.profilePath.mime,
                    name: userEdit.profilePath.filename || 'profile.jpg'
                } as any);
            }

            // Aadhar photo
            if (userEdit?.aadharImagePath?.path && userEdit?.aadharImagePath?.mime) {
                formData.append('aadhar_photo', {
                    uri: userEdit.aadharImagePath.path,
                    type: userEdit.aadharImagePath.mime,
                    name: userEdit.aadharImagePath.filename || 'aadhar.jpg'
                } as any);
            }

            // Driving License photo
            if (userEdit?.drivingLicensePath?.path && userEdit?.drivingLicensePath?.mime) {
                formData.append('driving_license', {
                    uri: userEdit.drivingLicensePath.path,
                    type: userEdit.drivingLicensePath.mime,
                    name: userEdit.drivingLicensePath.filename || 'license.jpg'
                } as any);
            }

            // ===== TRANSPORTER-SPECIFIC FIELDS =====
            if (userRole === 'transporter') {
                formData.append('transport_name', userEdit?.transport_name || savedSignupData?.transport_name || '');
                // year_of_exp collected in UI should be saved as year_of_establishment in DB
                formData.append('year_of_exp', userEdit?.year_of_exp || '');
                formData.append('year_of_establishment', userEdit?.year_of_exp || userEdit?.year_of_establishment || userEdit?.establishment_year || '');
                console.log('---------------year_of_establishment-', userEdit?.year_of_exp || userEdit?.year_of_establishment || userEdit?.establishment_year || '');

                formData.append('fleet_size', userEdit?.fleet_size || '');
                formData.append('average_km', userEdit?.avg_km_run || '');
                formData.append('registered_id', userEdit?.registered_id || '');

                // Operational Segment - UI "Industry Segment" values go here
                const opSegments = userEdit?.industry_segment?.split(',').filter(Boolean) || [];
                if (opSegments.length > 0) {
                    opSegments.forEach((seg: string) => {
                        formData.append('operational_segment[]', seg.trim());
                    });
                }

                // Routes - UI "Operational Segment" values go here
                const routeSegments = userEdit?.operational_segment?.split(',').filter(Boolean) || [];
                if (routeSegments.length > 0) {
                    routeSegments.forEach((seg: string) => {
                        formData.append('routes[]', seg.trim());
                    });
                }

                // PAN Image for transporter
                if (userEdit?.panImagePath?.path && userEdit?.panImagePath?.mime) {
                    formData.append('pan_image', {
                        uri: userEdit.panImagePath.path,
                        type: userEdit.panImagePath.mime,
                        name: userEdit.panImagePath.filename || 'pan.jpg'
                    } as any);
                }

                // GST Certificate for transporter
                if (userEdit?.gstCertificatePath?.path && userEdit?.gstCertificatePath?.mime) {
                    formData.append('gst_certificate', {
                        uri: userEdit.gstCertificatePath.path,
                        type: userEdit.gstCertificatePath.mime,
                        name: userEdit.gstCertificatePath.filename || 'gst.jpg'
                    } as any);
                }
            }

            console.log('=== Sending profile update request ===');

            console.log('=== formData ===', formData);
            logFormDataPayload(formData);



            const response = await axiosInstance.post(END_POINTS.EDIT_PROFILE, formData);
            console.log('=== Profile update response ===', response?.data);

            if (response?.data?.status) {
                // Fetch updated profile to verify gate
                const profileResponse = await axiosInstance.get(END_POINTS.GET_PROFILE);
                console.log('=== Profile GET response ===', profileResponse?.data);

                if (profileResponse?.data?.status) {
                    const isTransporter = userRole === 'transporter';
                    const isStillMissing = isTransporter
                        ? profileResponse.data.transporter_required_fields_status === false
                        : profileResponse.data.profile_required_fields_status === false;

                    const missing = isTransporter
                        ? profileResponse.data.transporter_missing_fields || []
                        : profileResponse.data.missing_required_fields || [];

                    dispatch(userAction({
                        ...profileResponse.data,
                        data: {
                            ...profileResponse.data.data,
                            profile_completed: !isStillMissing,
                        },
                    }));

                    if (isStillMissing) {
                        showToast(`${t('profileUpdated')} but still missing: ${missing.join(', ')}`);
                        console.log('⚠️ Profile remains incomplete:', missing);
                    } else {
                        showToast(response.data.message || t('profileUpdated') || 'Profile complete!');
                        // Dispatch authenticated action
                        dispatch(userAuthenticatedAction(true));
                        console.log('✅ Profile complete! Transitioning...');
                    }

                    // Clear saved signup data if complete
                    if (!isStillMissing) {
                        await AsyncStorage.removeItem('signup_incomplete');
                    }
                }
                setFinishing(false);
            } else {
                // API returned error
                showToast(response?.data?.message || t('updateFailed') || 'Profile update failed');
                setFinishing(false);
            }
        } catch (error: any) {
            console.log('=== Profile update error ===', error);
            console.log('Error response:', error?.response?.data);

            // Show specific error message from API if available
            const errorMessage = error?.response?.data?.message || error?.message || t('errorOccurred') || 'An error occurred';
            showToast(errorMessage);
            setFinishing(false);
        }
    };

    const handleMissingFieldSelection = (item: any) => {
        // State selected from dropdown
        dispatch(userEditAction({ ...userEdit, states: item.value }));
        setMissingFieldType('city'); // Prompt for city next
    };

    const handleMissingCitySubmit = () => {
        if (!tempCity.trim()) {
            showToast(t('pleaseEnterCity') || "Please enter city");
            return;
        }
        dispatch(userEditAction({ ...userEdit, city: tempCity.trim() }));
        setMissingFieldModalOpen(false);
        setTimeout(() => submitProfile(), 500); // Retry submission
    };

    const _openImageSource = async (source: 'camera' | 'library') => {
        try {
            const hasPermission = source === 'camera'
                ? await requestCameraPermission()
                : await requestPhotoLibraryPermission();

            if (!hasPermission) {
                showToast(t('permissionRequired'));
                return;
            }

            const method = source === 'camera' ? ImagePicker.openCamera : ImagePicker.openPicker;
            const image = await method({
                // cropping: true,
                width: 600,
                height: 600,
                mediaType: 'photo',
                compressImageQuality: 0.8,
            });

            if (image && image.path) {
                dispatch(userEditAction({ ...userEdit, profilePath: image }));
                setProfileModalOpen(false);
                // showToast(t('photoSelected') || "Photo selected!");
            }
        } catch (error: any) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                showToast(t('failedToSelectImage') || 'Failed to select image');
            }
        }
    };

    const renderStepContent = () => {
        const step = STEPS[currentStep];

        switch (step.id) {
            case 'dob':
                const selectedDateString = userEdit?.DOB ? moment(userEdit.DOB).format('YYYY-MM-DD') : '';
                const maxDateString = moment().subtract(18, 'years').format('YYYY-MM-DD');
                const currentYear = moment(calendarMonth).year();
                const currentMonthName = moment(calendarMonth).format('MMMM YYYY');

                // Generate years from 1950 to 18 years ago
                const minYear = 1950;
                const maxYear = moment().subtract(18, 'years').year();
                const years = [];
                for (let y = maxYear; y >= minYear; y--) {
                    years.push(y);
                }

                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('selectDateOfBirth')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.classicBox}>
                            <Text style={[styles.classicBoxText, !userEdit?.DOB && { color: '#999' }]}>
                                {userEdit?.DOB ? moment(userEdit.DOB).format('DD MMMM YYYY') : t('selectFromCalendarBelow')}
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
                                        if (moment(nextMonth).isSameOrBefore(moment(maxDateString))) {
                                            setCalendarMonth(nextMonth);
                                        }
                                    }}
                                    style={styles.calendarArrow}
                                >
                                    <Ionicons name="chevron-forward" size={24} color="#246BFD" />
                                </TouchableOpacity>
                            </View>

                            <Calendar
                                key={calendarMonth}
                                current={calendarMonth}
                                maxDate={maxDateString}
                                hideArrows={true}
                                hideDayNames={false}
                                onDayPress={(day: any) => {
                                    const selectedDate = new Date(day.dateString);
                                    dispatch(userEditAction({ ...userEdit, DOB: selectedDate }));
                                }}
                                onMonthChange={(month: any) => {
                                    setCalendarMonth(month.dateString);
                                }}
                                markedDates={{
                                    [selectedDateString]: {
                                        selected: true,
                                        selectedColor: '#246BFD',
                                    }
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
                                        <Text style={styles.yearPickerTitle}>{t('selectYear')}</Text>
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
            case 'gender':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('selectYourGender')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.radioGroup}>
                            {['Male', 'Female', 'Other'].map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    style={[
                                        styles.radioBox,
                                        userEdit?.Sex === gender && styles.radioBoxSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, Sex: gender }))}
                                >
                                    <View style={[styles.radioCircle, userEdit?.Sex === gender && styles.radioCircleSelected]}>
                                        {userEdit?.Sex === gender && <View style={styles.radioDot} />}
                                    </View>
                                    <Text style={[styles.radioText, userEdit?.Sex === gender && { color: '#246BFD' }]}>{gender}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'education':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('highestEducation')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.gridContainer}>
                            {translatedEducationList.map((edu) => (
                                <TouchableOpacity
                                    key={edu.value}
                                    style={[
                                        styles.educationTile,
                                        userEdit?.education === edu.value && styles.educationTileSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, education: edu.value }))}
                                >
                                    <Text style={[
                                        styles.educationTileText,
                                        userEdit?.education === edu.value && styles.educationTileTextSelected
                                    ]}>
                                        {edu.label}
                                    </Text>
                                    {userEdit?.education === edu.value && (
                                        <Ionicons name="checkmark-circle" size={18} color="#246BFD" style={{ marginLeft: 6 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'vehicle':
                // Get current selections using normalizeArrayField to handle corrupted data
                const currentVehicleSelections = normalizeArrayField(userEdit?.vehicle_type);

                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('vehicleType')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <Text style={[styles.helperText, { marginBottom: 12 }]}>{t('selectMultipleIfApplicable') || 'Select all that apply'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.vehicleGrid}>
                                {translatedVehicleTypes.map((vehicle) => {
                                    const isSelected = currentVehicleSelections.includes(vehicle.value);
                                    return (
                                        <TouchableOpacity
                                            key={vehicle.value}
                                            style={[
                                                styles.vehicleTile,
                                                isSelected && styles.vehicleTileSelected
                                            ]}
                                            onPress={() => {
                                                // Use normalizeArrayField to get clean current selections
                                                const cleanSelections = normalizeArrayField(userEdit?.vehicle_type);
                                                let newSelection: string[];
                                                if (isSelected) {
                                                    newSelection = cleanSelections.filter(v => v !== vehicle.value);
                                                } else {
                                                    newSelection = [...cleanSelections, vehicle.value];
                                                }
                                                dispatch(userEditAction({ ...userEdit, vehicle_type: newSelection.filter(Boolean).join(',') }));
                                            }}
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
                        <Text style={styles.classicLabel}>{t('drivingExperienceYears')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.gridContainer}>
                            {translatedExperienceList.map((exp) => (
                                <TouchableOpacity
                                    key={exp.value}
                                    style={[
                                        styles.gridBox,
                                        userEdit?.Driving_Experience === exp.value && styles.gridBoxSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, Driving_Experience: exp.value }))}
                                >
                                    <Text style={[styles.gridText, userEdit?.Driving_Experience === exp.value && styles.gridTextSelected]}>
                                        {exp.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'license':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('typeOfLicense')}<Text style={{ color: 'red' }}> *</Text></Text>
                        {translatedLicenseTypes.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.radioBox,
                                    userEdit?.Type_of_License === type.value && styles.radioBoxSelected,
                                    { marginBottom: 10 }
                                ]}
                                onPress={() => dispatch(userEditAction({ ...userEdit, Type_of_License: type.value }))}
                            >
                                <View style={[styles.radioCircle, userEdit?.Type_of_License === type.value && styles.radioCircleSelected]}>
                                    {userEdit?.Type_of_License === type.value && <View style={styles.radioDot} />}
                                </View>
                                <Text style={[styles.radioText, userEdit?.Type_of_License === type.value && { color: '#246BFD' }]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 'endorsement':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('licenseEndorsement')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <Text style={[styles.helperText, { marginBottom: 12 }]}>{t('selectMultipleIfApplicable')}</Text>
                        <View>
                            {translatedEndorsements.map((opt) => {
                                const isSelected = userEdit?.endorsement?.includes(opt.label);
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.endorsementTile,
                                            isSelected && styles.endorsementTileSelected
                                        ]}
                                        onPress={() => toggleEndorsement(opt.label)}
                                    >
                                        <View style={[styles.endorsementIcon, isSelected && { backgroundColor: '#246BFD' }]}>
                                            <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.endorsementLabel, isSelected && { color: '#246BFD' }]}>
                                                {opt.label}
                                            </Text>
                                        </View>
                                        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#246BFD" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );
            case 'current_salary':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('currentSalary') || 'Current Monthly Salary'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.gridContainer}>
                            {translatedSalaryRanges.map((salary) => (
                                <TouchableOpacity
                                    key={salary}
                                    style={[
                                        styles.salaryTile,
                                        userEdit?.current_salary === salary && styles.salaryTileSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, current_salary: salary }))}
                                >
                                    <Text style={[
                                        styles.salaryTileText,
                                        userEdit?.current_salary === salary && styles.salaryTileTextSelected
                                    ]}>
                                        ₹{salary}
                                    </Text>
                                    {userEdit?.current_salary === salary && (
                                        <Ionicons name="checkmark-circle" size={16} color="#246BFD" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'expected_salary':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('expectedSalary') || 'Expected Monthly Salary'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.gridContainer}>
                            {translatedSalaryRanges.map((salary) => (
                                <TouchableOpacity
                                    key={salary}
                                    style={[
                                        styles.salaryTile,
                                        userEdit?.expected_salary === salary && styles.salaryTileSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, expected_salary: salary }))}
                                >
                                    <Text style={[
                                        styles.salaryTileText,
                                        userEdit?.expected_salary === salary && styles.salaryTileTextSelected
                                    ]}>
                                        ₹{salary}
                                    </Text>
                                    {userEdit?.expected_salary === salary && (
                                        <Ionicons name="checkmark-circle" size={16} color="#246BFD" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'avatar':
                return (
                    <View style={[styles.stepContainer, { alignItems: 'center' }]}>
                        <Text style={[styles.classicLabel, { marginBottom: 20 }]}>{t('profilePhoto')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <TouchableOpacity onPress={() => setProfileModalOpen(true)} style={styles.classicAvatarBox}>
                            {userEdit?.profilePath?.path ? (
                                <Image source={{ uri: userEdit.profilePath.path }} style={styles.classicAvatarImage} />
                            ) : (
                                <Ionicons name="camera-outline" size={40} color="#ccc" />
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={12} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>{t('tapToUploadPhoto')}</Text>
                    </View>
                );
            case 'id_numbers':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('aadharNumber')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="0000 0000 0000"
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            maxLength={12}
                            value={userEdit?.Aadhar_Number || ''}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, Aadhar_Number: text }))}
                        />
                        <Space height={20} />
                        <Text style={styles.classicLabel}>{t('licenseNumber')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="MH01 20230000000"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                            value={userEdit?.License_Number || ''}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, License_Number: text }))}
                        />

                        <Space height={20} />
                        <Text style={styles.classicLabel}>{t('expiryDateOfLicense')}<Text style={{ color: 'red' }}> *</Text></Text>
                        <TouchableOpacity style={[styles.classicInput, { justifyContent: 'center' }]} onPress={() => setLicenseExpiryModal(true)}>
                            <Text style={{ color: userEdit?.Expiry_date_of_License ? '#333' : '#999', fontSize: 16 }}>
                                {userEdit?.Expiry_date_of_License ? moment(userEdit.Expiry_date_of_License).format('DD-MM-YYYY') : 'DD-MM-YYYY'}
                            </Text>
                            <Ionicons name="calendar" size={20} color={colors.royalBlue} style={{ position: 'absolute', right: 14, top: 14 }} />
                        </TouchableOpacity>

                        <Modal visible={licenseExpiryModal} transparent animationType="fade">
                            <TouchableWithoutFeedback onPress={() => setLicenseExpiryModal(false)}>
                                <View style={styles.modalOverlay}>
                                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>{t('expiryDateOfLicense')}</Text>
                                        <DatePicker
                                            mode="date"
                                            theme="light"
                                            date={userEdit?.Expiry_date_of_License ? new Date(userEdit.Expiry_date_of_License) : new Date()}
                                            minimumDate={new Date()}
                                            maximumDate={moment().add(30, 'years').toDate()}
                                            onDateChange={(date) => dispatch(userEditAction({ ...userEdit, Expiry_date_of_License: date }))}
                                        />
                                        <View style={{ flexDirection: 'row', marginTop: 16 }}>
                                            <TouchableOpacity
                                                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 8, marginRight: 8 }}
                                                onPress={() => setLicenseExpiryModal(false)}
                                            >
                                                <Text style={{ fontSize: 15, fontWeight: '500', color: '#666' }}>{t('cancel')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.royalBlue, borderRadius: 8 }}
                                                onPress={() => setLicenseExpiryModal(false)}
                                            >
                                                <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{t('confirm')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                    </View>
                );
            // === TRANSPORTER-SPECIFIC STEPS ===
            case 'year_of_exp':
                return (
                    <View style={styles.stepContainer}>

                        <View style={styles.gridContainer}>
                            {translatedYearOfExp.map((exp) => (
                                <TouchableOpacity
                                    key={exp.value}
                                    style={[
                                        styles.experienceTile,
                                        userEdit?.year_of_exp === exp.value && styles.experienceTileSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, year_of_exp: exp.value }))}
                                >
                                    <Text style={[
                                        styles.experienceTileText,
                                        userEdit?.year_of_exp === exp.value && styles.experienceTileTextSelected
                                    ]}>
                                        {exp.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'fleet_size':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('fleetSize') || 'Fleet Size'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.gridContainer}>
                            {translatedFleetSizes.map((fleet) => (
                                <TouchableOpacity
                                    key={fleet.value}
                                    style={[
                                        styles.experienceTile,
                                        userEdit?.fleet_size === fleet.value && styles.experienceTileSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, fleet_size: fleet.value }))}
                                >
                                    <Text style={[
                                        styles.experienceTileText,
                                        userEdit?.fleet_size === fleet.value && styles.experienceTileTextSelected
                                    ]}>
                                        {fleet.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'industry_segment':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('industrySegment') || 'Industry Segment'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <Text style={[styles.helperText, { marginBottom: 12 }]}>{t('selectMultipleIfApplicable') || 'Select all that apply'}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {translatedIndustrySegments.map((segment) => {
                                const selectedSegments = userEdit?.industry_segment?.split(',') || [];
                                const isSelected = selectedSegments.includes(segment.value);
                                return (
                                    <TouchableOpacity
                                        key={segment.value}
                                        style={[
                                            styles.segmentChip,
                                            isSelected && styles.segmentChipSelected
                                        ]}
                                        onPress={() => {
                                            let newSegments = [...selectedSegments];
                                            if (isSelected) {
                                                newSegments = newSegments.filter(s => s !== segment.value);
                                            } else {
                                                newSegments.push(segment.value);
                                            }
                                            dispatch(userEditAction({ ...userEdit, industry_segment: newSegments.filter(Boolean).join(',') }));
                                        }}
                                    >
                                        <Text style={[
                                            styles.segmentChipText,
                                            isSelected && styles.segmentChipTextSelected
                                        ]}>
                                            {segment.label}
                                        </Text>
                                        <Ionicons
                                            name={isSelected ? "checkmark" : "add"}
                                            size={16}
                                            color={isSelected ? "#246BFD" : "#666"}
                                            style={{ marginLeft: 6 }}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'avg_km_run':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('avgKmRun') || 'Average Km Run (Monthly)'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <View style={styles.gridContainer}>
                            {translatedAvgKmRanges.map((km) => (
                                <TouchableOpacity
                                    key={km.value}
                                    style={[
                                        styles.salaryTile,
                                        userEdit?.avg_km_run === km.value && styles.salaryTileSelected
                                    ]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, avg_km_run: km.value }))}
                                >
                                    <Text style={[
                                        styles.salaryTileText,
                                        userEdit?.avg_km_run === km.value && styles.salaryTileTextSelected
                                    ]}>
                                        {km.label}
                                    </Text>
                                    {userEdit?.avg_km_run === km.value && (
                                        <Ionicons name="checkmark-circle" size={16} color="#246BFD" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'operational_segment':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('operationalSegment') || 'Operational Segment'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <Text style={[styles.helperText, { marginBottom: 12 }]}>{t('selectMultipleIfApplicable')}</Text>
                        <View>
                            {translatedOperationalSegments.map((segment) => {
                                const selectedSegments = userEdit?.operational_segment?.split(',') || [];
                                const isSelected = selectedSegments.includes(segment.value);
                                return (
                                    <TouchableOpacity
                                        key={segment.value}
                                        style={[
                                            styles.endorsementTile,
                                            isSelected && styles.endorsementTileSelected
                                        ]}
                                        onPress={() => {
                                            let newSegments = [...selectedSegments];
                                            if (isSelected) {
                                                newSegments = newSegments.filter(s => s !== segment.value);
                                            } else {
                                                newSegments.push(segment.value);
                                            }
                                            dispatch(userEditAction({ ...userEdit, operational_segment: newSegments.filter(Boolean).join(',') }));
                                        }}
                                    >
                                        <View style={styles.endorsementContent}>
                                            <Text style={{ fontSize: 24, marginRight: 12 }}>🚚</Text>
                                            <Text style={[
                                                styles.endorsementLabel,
                                                isSelected && styles.endorsementLabelSelected
                                            ]}>
                                                {segment.label}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={24} color="#246BFD" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );
            case 'pan_gst':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('panNumber') || 'PAN Number'}<Text style={{ color: 'red' }}> *</Text></Text>
                        <Text style={[styles.helperText, { marginBottom: 8, color: '#28A745' }]}>

                        </Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder={t('enterPanNumber') || 'Enter PAN Number'}
                            placeholderTextColor="#999"
                            value={userEdit?.pan || ''}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, pan: text.toUpperCase() }))}
                            autoCapitalize="characters"
                            maxLength={10}
                        />
                        <Space height={20} />
                        <Text style={styles.classicLabel}>{t('gstNumber') || 'GST Number'}</Text>
                        <Text style={[styles.helperText, { marginBottom: 8, color: '#28A745' }]}>

                        </Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder={t('enterGstNumber') || 'Enter GST Number'}
                            placeholderTextColor="#999"
                            value={userEdit?.gst || ''}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, gst: text.toUpperCase() }))}
                            autoCapitalize="characters"
                            maxLength={15}
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <Space height={safeAreaInsets.top} />

            {/* --- Classic Header --- */}
            <View style={styles.header}>
                {currentStep > 0 ? (
                    <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                ) : <View style={styles.navBtn} />}

                <View style={styles.headerCenterContent}>
                    <Text style={styles.headerTitle}>{t('completeProfile')}</Text>
                    <Text style={styles.stepCounterText}>
                        {t('step') || 'Step'} {currentStep + 1} {t('of') || 'of'} {STEPS.length}
                    </Text>
                </View>
                <View style={styles.navBtn} />
            </View>

            {/* --- Progress Bar with Moving Line Animation --- */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
                </View>
            </View>

            {/* --- Main Content --- */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={animatedContentStyle}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepTitle}>{t(STEPS[currentStep].title)} </Text>
                            <Text style={styles.stepSubtitle}>{t(STEPS[currentStep].subtitle)}</Text>
                        </View>
                        {userRole === 'driver' && DRIVER_VOICE_FILES[STEPS[currentStep].id] && (
                            <TouchableOpacity
                                onPress={toggleVoiceMute}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: isVoiceMuted ? '#999' : '#246BFD',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name={isVoiceMuted ? "volume-mute" : "volume-high"} size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {renderStepContent()}
                </Animated.View>
            </ScrollView>

            {/* Hidden audio player for voice guidance */}
            {userRole === 'driver' && currentAudioSource && (
                <Video
                    source={currentAudioSource}
                    paused={false}
                    volume={1.0}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                    onEnd={() => { setCurrentAudioSource(null); }}
                    onError={(error) => {
                        console.log('Audio error:', error);
                        setCurrentAudioSource(null);
                    }}
                    style={{ height: 0, width: 0, position: 'absolute' }}
                />
            )}

            {/* --- Classic Footer --- */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom + 20 }]}>
                <TouchableOpacity
                    style={styles.classicButton}
                    onPress={handleNext}
                    disabled={finishing}
                >
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.classicButtonText}>
                                {currentStep === STEPS.length - 1 ? t('finish') : t('next')}
                            </Text>
                            {currentStep !== STEPS.length - 1 && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Photo Sources Modal */}
            <Modal visible={profileModalOpen} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setProfileModalOpen(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{t('selectSource')}</Text>
                            <TouchableOpacity style={styles.modalItem} onPress={() => _openImageSource('camera')}>
                                <Ionicons name="camera-outline" size={24} color="#333" />
                                <Text style={styles.modalItemText}>{t('camera')}</Text>
                            </TouchableOpacity>
                            <View style={styles.modalDivider} />
                            <TouchableOpacity style={styles.modalItem} onPress={() => _openImageSource('library')}>
                                <Ionicons name="image-outline" size={24} color="#333" />
                                <Text style={styles.modalItemText}>{t('gallery')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Emergency Missing Field Modal (State/City) */}
            <Modal visible={missingFieldModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '50%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={styles.modalTitle}>
                                {missingFieldType === 'state' ? t('selectState') : t('enterCity')}
                            </Text>
                            <TouchableOpacity onPress={() => setMissingFieldModalOpen(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ color: 'red', marginBottom: 15 }}>
                            {missingFieldType === 'state'
                                ? (t('stateFieldRequiredInfo') || "State missing. Please select one.")
                                : (t('cityFieldRequiredInfo') || "City missing. Please enter it.")
                            }
                        </Text>

                        {missingFieldType === 'state' ? (
                            <Dropdown
                                style={styles.classicDropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={commonStatesList.map(item => ({ label: item.name, value: item.id.toString() }))}
                                labelField="label"
                                valueField="value"
                                placeholder={t('selectState')}
                                search
                                searchPlaceholder="Search..."
                                value={userEdit?.states}
                                onChange={handleMissingFieldSelection}
                            />
                        ) : (
                            <View>
                                <TextInput
                                    style={styles.classicInput}
                                    placeholder={t('enterCity') || "Enter City"}
                                    placeholderTextColor="#999"
                                    value={tempCity}
                                    onChangeText={setTempCity}
                                />
                                <Space height={20} />
                                <TouchableOpacity
                                    style={styles.classicButton}
                                    onPress={handleMissingCitySubmit}
                                >
                                    <Text style={styles.classicButtonText}>{t('submit')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
    },
    navBtn: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerCenterContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCounterText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6C757D',
        marginTop: 2,
    },
    progressContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E9ECEF',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#246BFD',
        borderRadius: 3,
    },
    animationContainer: {
        height: 80,
        backgroundColor: '#E3F2FD',
        borderBottomWidth: 1,
        borderBottomColor: '#BBDEFB',
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundStrip: {
        position: 'absolute',
        width: '300%',
        height: '100%',
    },
    truckWrapper: {
        position: 'absolute',
        bottom: 5,
        zIndex: 5,
    },
    wheelContainer: {
        position: 'absolute',
    },
    rearWheel: {
        left: 20,
        top: 40,
    },
    frontWheel: {
        left: 70,
        top: 40,
    },
    roadSurface: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 8,
        backgroundColor: '#333',
    },
    roadMarkings: {
        width: '100%',
        height: 2,
        backgroundColor: 'white',
        opacity: 0.6,
        position: 'absolute',
        top: 3,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'white',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingTop: 12,
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
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#E9ECEF',
        marginBottom: 12,
    },
    stepContainer: {
        width: '100%',
    },
    classicLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    classicBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#CED4DA',
        backgroundColor: 'white',
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 48,
    },
    classicBoxText: {
        fontSize: 15,
        color: '#212529',
    },
    classicInput: {
        borderWidth: 1,
        borderColor: '#CED4DA',
        backgroundColor: 'white',
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 48,
        fontSize: 15,
        color: '#212529',
    },
    classicDropdown: {
        borderWidth: 1,
        borderColor: '#CED4DA',
        backgroundColor: 'white',
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 48,
    },
    placeholderStyle: {
        fontSize: 15,
        color: '#ADB5BD',
    },
    selectedTextStyle: {
        fontSize: 15,
        color: '#212529',
    },
    radioGroup: {
        marginTop: 4,
    },
    radioBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DEE2E6',
        backgroundColor: 'white',
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
    },
    radioBoxSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#ADB5BD',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: '#246BFD',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#246BFD',
    },
    radioText: {
        fontSize: 15,
        color: '#212529',
        fontWeight: '500',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridBox: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#DEE2E6',
        backgroundColor: 'white',
        borderRadius: 4,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    gridBoxSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#246BFD',
    },
    gridText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
    },
    gridTextSelected: {
        color: 'white',
    },
    helperText: {
        fontSize: 12,
        color: '#6C757D',
        marginTop: 6,
    },
    classicAvatarBox: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DEE2E6',
        position: 'relative',
    },
    classicAvatarImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    editBadge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#246BFD',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    endorsementTile: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#DEE2E6',
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: 'white',
    },
    endorsementTileSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    endorsementIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    footer: {
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
        backgroundColor: 'white',
        paddingTop: 16,
    },
    classicButton: {
        backgroundColor: '#246BFD',
        height: 50,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    classicButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    successWrapper: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginTop: 24,
        marginBottom: 8,
    },
    successSub: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    modalItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 16,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E9ECEF',
        marginVertical: 4,
    },
    // Vehicle Type Selection Styles
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
    // Education Tile Styles
    educationTile: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#DEE2E6',
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    educationTileSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F0F5FF',
    },
    educationTileText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#495057',
        textAlign: 'center',
    },
    educationTileTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
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
    inlineCalendarContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 6,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    // Calendar Header Styles
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 4,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        marginBottom: 4,
    },
    calendarArrow: {
        padding: 8,
    },
    yearPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#F0F5FF',
        borderRadius: 20,
    },
    calendarHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#246BFD',
    },
    // Year Picker Modal Styles
    yearPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    yearPickerContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxHeight: '60%',
    },
    yearPickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 16,
    },
    yearPickerItem: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 4,
    },
    yearPickerItemSelected: {
        backgroundColor: '#246BFD',
    },
    yearPickerItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    yearPickerItemTextSelected: {
        color: 'white',
        fontWeight: '600',
    },
    // Experience/Fleet Tile Styles
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
    // Endorsement Content for Operational Segment
    endorsementContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    endorsementLabelSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },
    // Segment Chip Styles
    segmentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 16,
        margin: 6,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    segmentChipSelected: {
        backgroundColor: '#F0F5FF',
        borderColor: '#246BFD',
    },
    segmentChipText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
    },
    segmentChipTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },
});
