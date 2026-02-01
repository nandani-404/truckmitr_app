import { Image, Modal, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import ImagePicker from 'react-native-image-crop-picker';
import { Dropdown } from 'react-native-element-dropdown';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { userAction, userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Calendar } from 'react-native-calendars';
import DatePicker from 'react-native-date-picker';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;
type ProfileEditNewRouteProp = RouteProp<NavigatorParams, 'profileEditNew'>;

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
    pickUp: require('@truckmitr/src/assets/trucks/pickup_truck.png'),
};

// Driver Steps - Profile photo first
const DRIVER_STEPS = [
    { id: 'avatar', title: 'profilePhotoStep', subtitle: 'profilePhotoStepDesc' },
    { id: 'personal_info', title: 'personalInfoStep', subtitle: 'personalInfoStepDesc' },
    { id: 'dob', title: 'dateOfBirthStep', subtitle: 'dateOfBirthStepDesc' },
    { id: 'gender', title: 'genderMaritalStep', subtitle: 'genderMaritalStepDesc' },
    { id: 'education', title: 'educationStep', subtitle: 'educationStepDesc' },
    { id: 'address', title: 'addressStep', subtitle: 'addressStepDesc' },
    { id: 'vehicle', title: 'vehicleTypeStep', subtitle: 'vehicleTypeStepDesc' },
    { id: 'experience', title: 'experienceStep', subtitle: 'experienceStepDesc' },
    { id: 'license_type', title: 'licenseTypeStep', subtitle: 'licenseTypeStepDesc' },
    { id: 'endorsement', title: 'licenseEndorsement', subtitle: 'selectLicenseEndorsementsDesc' },
    { id: 'salary', title: 'salaryStep', subtitle: 'salaryStepDesc' },
    { id: 'preferences', title: 'preferencesStep', subtitle: 'preferencesStepDesc' },
    { id: 'aadhar_details', title: 'aadharStep', subtitle: 'aadharStepDesc' },
    { id: 'license_details', title: 'licenseStep', subtitle: 'licenseStepDesc' },
    { id: 'pan_details', title: 'panStep', subtitle: 'panStepDesc' },
];

// Transporter Steps - Profile photo first
const TRANSPORTER_STEPS = [
    { id: 'avatar', title: 'profilePhotoStep', subtitle: 'profilePhotoStepDesc' },
    { id: 'personal_info', title: 'personalInfoStep', subtitle: 'personalInfoStepDesc' },
    { id: 'transport_details', title: 'transportDetailsStep', subtitle: 'transportDetailsStepDesc' },
    { id: 'address', title: 'addressStep', subtitle: 'addressStepDesc' },
    { id: 'year_of_exp', title: 'selectYearsOfOperation', subtitle: 'selectYearsOfOperationDesc' },
    { id: 'fleet_size', title: 'fleetSizeStep', subtitle: 'fleetSizeStepDesc' },
    { id: 'industry_segment', title: 'selectOperationalSegment', subtitle: 'selectOperationalSegmentDesc' },
    { id: 'operational_segment', title: 'routes', subtitle: 'selectRoutesDesc' },
    { id: 'avg_km_run', title: 'avgKmStep', subtitle: 'avgKmStepDesc' },
    { id: 'vehicle', title: 'vehicleTypeStep', subtitle: 'vehicleTypeStepDescTransporter' },
    { id: 'pan_gst', title: 'panGstStep', subtitle: 'panGstStepDesc' },
];
/**
 * ProfileEditNew Component
 * 
 * IMPORTANT: Image Upload Bug Fix (Option 3 - Separate Image State Management)
 * 
 * Problem: Images were getting replaced after 1-2 seconds due to normalization useEffect
 * overwriting local image state with API data.
 * 
 * Solution: Separated image upload state from main userEdit state to avoid conflicts:
 * - imageState: Manages local image uploads (profilePath, panImagePath, etc.)
 * - userEdit: Manages form data and existing images from API
 * - Normalization effects no longer touch image paths
 * - Image display uses imageState for new uploads, userEdit for existing images
 * - Form submission uses imageState for file uploads
 * 
 * This prevents the Redux re-hydration bug where normalization overwrites local images.
 */
export default function ProfileEditNew() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { shadow } = useShadow();
    const safeAreaInsets = useSafeAreaInsets();
    const isDriverHydratedRef = useRef(false);
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const route = useRoute<ProfileEditNewRouteProp>();
    const { userEdit, isTransporter, user } = useSelector((state: any) => state?.user);

    const userRole = isTransporter || user?.role === 'transporter' || userEdit?.role === 'transporter' ? 'transporter' : 'driver';
    const STEPS = userRole === 'transporter' ? TRANSPORTER_STEPS : DRIVER_STEPS;

    // Get initial step from route params or default to 0
    const initialStepId = route.params?.stepId;
    const initialStepIndex = initialStepId ? STEPS.findIndex(step => step.id === initialStepId) : 0;

    // Fixed step - no navigation between steps
    const currentStep = initialStepIndex >= 0 ? initialStepIndex : 0;
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    const [activeField, setActiveField] = useState<string>('');
    const [locations, setLocations] = useState<any[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
    const [yearPickerOpen, setYearPickerOpen] = useState(false);
    const [licenseExpiryModal, setLicenseExpiryModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(moment().subtract(18, 'years').format('YYYY-MM-DD'));
    const [loadingPincode, setLoadingPincode] = useState(false);
    const [postOffices, setPostOffices] = useState<any[]>([]);
    const [selectedPostOffice, setSelectedPostOffice] = useState<string>('');

    // Separate image state management to avoid conflicts with normalization
    const [imageState, setImageState] = useState<{
        profilePath?: any;
        panImagePath?: any;
        gstCertificatePath?: any;
        aadharImagePath?: any;
        drivingLicensePath?: any;
    }>({});

    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);

    // Data arrays
    const drivingExperienceArray = [
        { label: t('lessThan1Year'), value: '0-1' },
        { label: t('1to2Years'), value: '1-2' },
        { label: t('3to5Years'), value: '3-5' },
        { label: t('6to10Years'), value: '6-10' },
        { label: t('10PlusYears'), value: '10+' },
    ];

    const salaryRanges = ['15000-20000', '20000-25000', '25000-30000', '30000-35000', '35000-40000', '40000-45000', '45000-50000', '50000-55000', '55000-60000'];
    const currentSalaryRanges = ['15000-20000', '20000-25000', '25000-30000', '30000-35000', '35000-40000', '40000-45000', '45000-50000', '50000-55000',];
    const expectedSalaryRanges = ['20000-25000', '25000-30000', '30000-35000', '35000-40000', '40000-45000', '45000-50000', '50000-55000', '55000-60000'];

    const translatedEducationList = [
        { label: t('noFormalEducation') || 'No Formal Education', value: 'No Formal Education' },
        { label: t('primarySchool') || 'Primary School', value: 'Primary School' },
        { label: t('middleSchool') || 'Middle School', value: 'Middle School' },
        { label: t('highSchool') || 'High School', value: 'High School' },
        { label: t('intermediate') || 'Intermediate', value: 'Intermediate' },
        { label: t('graduate') || 'Graduate', value: 'Graduate' },
        { label: t('postGraduate') || 'Post Graduate', value: 'Post Graduate' },
    ];

    const licenseTypes = ['LMV', 'HMV', 'HGMV', 'HPMV/HTV'];

    const translatedFleetSizes = [{ label: '0-9', value: '0-9' }, { label: '10-50', value: '10-50' }, { label: '51-100', value: '51-100' }, { label: t('fleetSize_100_plus') || '100+', value: '100+' }];

    const translatedAvgKmRanges = [
        { label: t('avgKm_less_1000') || '< 1000 km', value: 'less_1000' },
        { label: t('avgKm_1000_3000') || '1000 - 3000 km', value: '1000_3000' },
        { label: t('avgKm_3000_5000') || '3000 - 5000 km', value: '3000_5000' },
        { label: t('avgKm_5000_10000') || '5000 - 10000 km', value: '5000_10000' },
        { label: t('avgKm_10000_plus') || '10000+ km', value: '10000_plus' },
    ];

    const translatedIndustrySegments = [
        { label: t('ecommerce') || 'E-commerce', value: 'ecommerce' },
        { label: t('whiteGoods') || 'White Goods', value: 'white_goods' },
        { label: t('livestock') || 'Livestock', value: 'livestock' },
        { label: t('perishable') || 'Perishable', value: 'perishable' },
        { label: t('oversized') || 'Oversized', value: 'oversized' },
        { label: t('fuelTanker') || 'Fuel Tanker', value: 'fuel_tanker' },
        { label: t('automobileCarrier') || 'Automobile Carrier', value: 'automobile_carrier' },
        { label: t('constructionIndustry') || 'Construction', value: 'construction' },
        { label: t('refrigeratorVehicle') || 'Refrigerator', value: 'refrigerator' },
        { label: t('others') || 'Others', value: 'others' },
    ];

    const translatedOperationalSegments = [
        { label: t('localDelivery') || 'Local Delivery', value: 'Local Delivery' },
        { label: t('intracity') || 'Intracity', value: 'Intracity' },
        { label: t('intercity') || 'Intercity', value: 'Intercity' },
        { label: t('interstate') || 'Interstate', value: 'Interstate' },
        { label: t('allIndia') || 'All India', value: 'All India' },
    ];

    const translatedEndorsements = [
        { id: 'hill', label: t('hillDriving') || 'Hill Driving', emoji: '🏔️' },
        { id: 'hazardous', label: t('hazardousGoods') || 'Hazardous Goods', emoji: '☢️' },
        { id: 'roller', label: t('roadRoller') || 'Road Roller', emoji: '🚜' },
        { id: 'tractor', label: t('tractorTrailer') || 'Tractor-Trailer (Commercial)', emoji: '🚛' },
        { id: 'forklift', label: t('forkliftMHE') || 'Forklift / MHE', emoji: '🏗️' },
        { id: 'other', label: t('other') || 'Other', emoji: '📋' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [locRes, vehRes] = await Promise.all([
                    axiosInstance.get(END_POINTS.GETSTATES),
                    axiosInstance.get(END_POINTS.VEHICLE_TYPES)
                ]);
                if (locRes?.data?.status) setLocations(locRes.data.data);
                if (vehRes?.data?.status) setVehicleTypes(vehRes.data.data);
            } catch (error) {
                console.log('Error fetching data:', error);
            }
        };
        fetchData();
        fetchData();
    }, []);

    // Initialize image state from userEdit when component mounts or userEdit changes
    useEffect(() => {
        if (userEdit) {
            setImageState(prev => ({
                ...prev,
                // Only update if we don't already have a local image for this field
                profilePath: prev.profilePath || userEdit.profilePath,
                panImagePath: prev.panImagePath || userEdit.panImagePath,
                gstCertificatePath: prev.gstCertificatePath || userEdit.gstCertificatePath,
                aadharImagePath: prev.aadharImagePath || userEdit.aadharImagePath,
                drivingLicensePath: prev.drivingLicensePath || userEdit.drivingLicensePath,
            }));
        }
    }, [userEdit?.profilePath, userEdit?.panImagePath, userEdit?.gstCertificatePath, userEdit?.aadharImagePath, userEdit?.drivingLicensePath]);

    // Sync ref for async access
    const userEditRef = useRef(userEdit);
    useEffect(() => { userEditRef.current = userEdit; }, [userEdit]);

    // Debounced Pincode API Call
    useEffect(() => {
        const pincode = userEdit?.pincode;
        if (pincode?.length === 6) {
            const timer = setTimeout(async () => {
                setLoadingPincode(true);
                try {
                    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                    const data = await response.json();
                    if (data?.[0]?.Status === 'Success' && data?.[0]?.PostOffice) {
                        const postOfficeList = data[0].PostOffice;
                        setPostOffices(postOfficeList);

                        // Check if current city matches any post office, but don't auto-select
                        if (userEdit?.city) {
                            const matchingPostOffice = postOfficeList.find((po: any) =>
                                po.Name.toLowerCase() === userEdit.city.toLowerCase()
                            );
                            if (matchingPostOffice) {
                                setSelectedPostOffice(matchingPostOffice.Name);
                            } else {
                                // Current city doesn't match any post office, clear selection and let user choose
                                setSelectedPostOffice('');
                                dispatch(userEditAction({ ...(userEditRef.current || {}), city: '' }));
                            }
                        } else {
                            // No city selected, don't auto-select anything
                            setSelectedPostOffice('');
                        }
                    } else {
                        // Clear post offices and city if API fails or no data
                        setPostOffices([]);
                        setSelectedPostOffice('');
                        dispatch(userEditAction({ ...(userEditRef.current || {}), city: '' }));
                    }
                } catch (error) {
                    console.log('Error fetching post offices from pincode:', error);
                    setPostOffices([]);
                    setSelectedPostOffice('');
                    dispatch(userEditAction({ ...(userEditRef.current || {}), city: '' }));
                } finally {
                    setLoadingPincode(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            // Clear post offices when pincode is invalid or empty
            setPostOffices([]);
            setSelectedPostOffice('');
            // Don't clear city if pincode is being typed (less than 6 digits)
            if (pincode?.length === 0) {
                dispatch(userEditAction({ ...(userEditRef.current || {}), city: '' }));
            }
        }
    }, [userEdit?.pincode]);

    // Sync selectedPostOffice with userEdit.city when component loads or city changes
    useEffect(() => {
        if (userEdit?.city && postOffices.length > 0) {
            const matchingPostOffice = postOffices.find((po: any) =>
                po.Name.toLowerCase() === userEdit.city.toLowerCase()
            );
            if (matchingPostOffice) {
                setSelectedPostOffice(matchingPostOffice.Name);
            }
        } else if (userEdit?.city && postOffices.length === 0) {
            // If user has a city but no post offices loaded, keep the city as is
            setSelectedPostOffice(userEdit.city);
        }
    }, [userEdit?.city, postOffices]);

    // Normalize transporter fields from API response (handle casing mismatches)
    useEffect(() => {
        // Debug logs to see what we're receiving
        console.log('=== Normalization Effect Triggered ===');
        console.log('User Role:', userRole);
        console.log('User Object Keys:', user ? Object.keys(user) : 'null');

        if (userRole === 'transporter' && user) {
            const updates: any = {};
            let shouldUpdate = false;

            const checkAndSet = (targetKey: string, sourceValues: any[], mapping?: Record<string, string>) => {
                // Determine source value first
                let sourceValue = sourceValues.find(v => v !== undefined && v !== null && v !== '');

                // key specific handling
                if (targetKey === 'avg_km_run' && !sourceValue && sourceValues.some(v => v)) {
                    const raw = String(sourceValues.find(v => v) || '');
                    if (raw.includes('1000') && raw.includes('3000')) sourceValue = '1000_3000';
                    else if (raw.includes('3000') && raw.includes('5000')) sourceValue = '3000_5000';
                    else if (raw.includes('5000') && raw.includes('10000')) sourceValue = '5000_10000';
                    else if (raw.includes('1000') && !raw.includes('3000') && (raw.includes('<') || raw.includes('less'))) sourceValue = 'less_1000';
                    else if (raw.includes('10000') && (raw.includes('+') || raw.includes('Above'))) sourceValue = '10000_plus';
                }

                // Fallback for fleetsize if purely numeric
                if (targetKey === 'fleet_size' && !sourceValue && sourceValues.some(v => v !== null)) {
                    const rawNum = parseInt(String(sourceValues.find(v => v !== null)), 10);
                    if (!isNaN(rawNum)) {
                        if (rawNum <= 9) sourceValue = '0-9';
                        else if (rawNum <= 50) sourceValue = '10-50';
                        else if (rawNum <= 100) sourceValue = '51-100';
                        else sourceValue = '100+';
                    }
                }

                if (sourceValue) {
                    // Apply mapping if exists
                    if (mapping && mapping[sourceValue]) {
                        sourceValue = mapping[sourceValue];
                    }

                    // Get current value in edit state
                    const currentValue = userEdit?.[targetKey];

                    // Update if missing or different
                    if (!currentValue || currentValue !== sourceValue) {
                        updates[targetKey] = sourceValue;
                        shouldUpdate = true;
                    }
                }
            };

            // Mappings for Fleet Size (Legacy -> New UI)
            const fleetMapping: Record<string, string> = {
                '0-9': '0-9',
                '10-50': '10-50',
                '51-100': '51-100',
                '101-250': '100+',
                '251-500': '100+',
                '501-1000': '100+',
                'Above 1000': '100+',
                '100+': '100+'
            };

            // Mappings for Avg Km (Legacy -> New UI)
            const avgKmMapping: Record<string, string> = {
                '< 1000 km': 'less_1000',
                'less_1000': 'less_1000',
                '1000 - 3000 km': '1000_3000',
                '1000-3000': '1000_3000',
                '1000_3000': '1000_3000',
                '3000 - 5000 km': '3000_5000',
                '3000-5000': '3000_5000',
                '3000_5000': '3000_5000',
                '5000 - 10000 km': '5000_10000',
                '5000-10000': '5000_10000',
                '5000_10000': '5000_10000',
                '10000+ km': '10000_plus',
                'Above 10000': '10000_plus',
                '10000_plus': '10000_plus'
            };

            // Map API fields (PascalCase/snake_case) to UI fields (snake_case)
            checkAndSet('fleet_size', [user.Fleet_Size, user.fleet_size], fleetMapping);
            checkAndSet('industry_segment', [user.Operational_Segment, user.Industry_Segment, user.industry_segment, user.operational_segment]);
            checkAndSet('routes', [user.routes, user.Routes]);
            checkAndSet('avg_km_run', [user.Average_KM, user.Average_Km, user.average_km, user.avg_km_run, user.average_run], avgKmMapping);
            checkAndSet('transport_name', [user.Transport_Name, user.transport_name]);

            // Vehicle Type Normalization
            if (!userEdit?.vehicle_type) {
                let vType = user.Vehicle_Type || user.vehicle_type;
                if (vType) {
                    // Ensure vType is array
                    const vList = Array.isArray(vType) ? vType : typeof vType === 'string' ? vType.split(',') : [vType];

                    // Map to IDs if vehicleTypes list is available
                    if (vehicleTypes.length > 0) {
                        const mappedIds = vList.map((v: any) => {
                            const match = vehicleTypes.find((vt: any) =>
                                String(vt.id) === String(v) || // Match by ID
                                vt.name?.toLowerCase() === String(v).toLowerCase() || // Match by Name
                                vt.label?.toLowerCase() === String(v).toLowerCase() // Match by Label
                            );
                            return match ? match.id : v; // use id if found, else keep original
                        });
                        updates.vehicle_type = mappedIds.join(',');
                        shouldUpdate = true;
                    } else if (typeof vType === 'string') {
                        // Fallback if vehicleTypes not loaded yet
                        updates.vehicle_type = vType;
                        shouldUpdate = true;
                    } else {
                        updates.vehicle_type = vList.join(',');
                        shouldUpdate = true;
                    }
                }
            }

            // Industry Segment (mapped from Operational_Segment in user data)
            if (!userEdit?.industry_segment) {
                const opSeg = user.Operational_Segment || user.operational_segment;
                console.log('=== Industry Segment Mapping ===');
                console.log('Operational Segment from User:', opSeg);

                if (Array.isArray(opSeg)) {
                    // Map display names to internal values
                    const mapping: { [key: string]: string } = {
                        'E-commerce': 'ecommerce',
                        'White Goods': 'white_goods',
                        'Livestock': 'livestock',
                        'Perishable': 'perishable',
                        'Oversized': 'oversized',
                        'Fuel Tanker': 'fuel_tanker',
                        'Automobile Carrier': 'automobile_carrier',
                        'Construction': 'construction',
                        'Refrigerator Vehicle': 'refrigerator',
                        'Refrigerator': 'refrigerator',
                        'Others': 'others'
                    };

                    const mappedValues = opSeg.map((item: string) => {
                        const mappedValue = mapping[item] || item.toLowerCase().replace(/\s+/g, '_');
                        console.log(`Mapping "${item}" -> "${mappedValue}"`);
                        return mappedValue;
                    }).filter(Boolean);

                    if (mappedValues.length > 0) {
                        console.log('Final mapped values:', mappedValues);
                        console.log('Joined string:', mappedValues.join(','));
                        updates.industry_segment = mappedValues.join(',');
                        shouldUpdate = true;
                    }
                } else if (typeof opSeg === 'string') {
                    // Handle single string value
                    const mapping: { [key: string]: string } = {
                        'E-commerce': 'ecommerce',
                        'White Goods': 'white_goods',
                        'Livestock': 'livestock',
                        'Perishable': 'perishable',
                        'Oversized': 'oversized',
                        'Fuel Tanker': 'fuel_tanker',
                        'Automobile Carrier': 'automobile_carrier',
                        'Construction': 'construction',
                        'Refrigerator Vehicle': 'refrigerator',
                        'Refrigerator': 'refrigerator',
                        'Others': 'others'
                    };
                    const mappedValue = mapping[opSeg] || opSeg.toLowerCase().replace(/\s+/g, '_');
                    console.log(`Mapping single value "${opSeg}" -> "${mappedValue}"`);
                    updates.industry_segment = mappedValue;
                    shouldUpdate = true;
                }
            }

            // Year of Experience / Establishment
            let expVal = user.Year_of_Exp || user.year_of_exp || user.Year_of_Establishment || user.year_of_establishment || user.establishment_year;
            console.log('Experience Value from User:', expVal);

            // Map API/DB values to UI values
            const reverseExpMapping: { [key: string]: string } = {
                '0': 'less_than_1',
                '1': '1-2',
                '2': '1-2',
                '3': '3-5',
                '4': '3-5',
                '5': '3-5',
                '6': '6-10',
                '7': '6-10',
                '8': '6-10',
                '9': '6-10',
                '10': '10+',
                '10+': '10+'
            };

            // Apply mapping if value matches
            if (expVal && reverseExpMapping[String(expVal)]) {
                expVal = reverseExpMapping[String(expVal)];
            }

            if (expVal && (!userEdit?.year_of_exp || userEdit.year_of_exp !== expVal)) {
                updates.year_of_exp = typeof expVal === 'number' ? String(expVal) : expVal;
                shouldUpdate = true;
            }
            // Ensure year_of_establishment is consistent
            if (expVal && (!userEdit?.year_of_establishment || userEdit.year_of_establishment !== expVal)) {
                updates.year_of_establishment = typeof expVal === 'number' ? String(expVal) : expVal;
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                console.log('Normalizing transporter data with updates:', updates);
                // We must spread userEdit to preserve other fields
                // DO NOT touch image paths - they are managed separately now
                const currentUserEdit = userEditRef.current || {};
                dispatch(userEditAction({ ...currentUserEdit, ...updates }));
            } else {
                console.log('No normalization updates needed');
            }
        }
    }, [user, userRole, vehicleTypes]);

    // Driver Data Normalization
    useEffect(() => {
        if (userRole === 'driver' && user) {
            let shouldUpdate = false;
            const updates: any = {};

            // Normalize endorsement
            // Check if we have licence_endorsement (Array) or endorsement (String) in user object
            const rawEndorsement = user.licence_endorsement || user.Licence_Endorsement || user.endorsement;

            if (rawEndorsement) {
                let normEndorsement = '';
                if (Array.isArray(rawEndorsement)) {
                    normEndorsement = rawEndorsement.join(',');
                } else if (typeof rawEndorsement === 'string') {
                    normEndorsement = rawEndorsement;
                }

                // If userEdit doesn't have endorsement set yet, populate it from user data
                if (normEndorsement && !userEdit?.endorsement) {
                    updates.endorsement = normEndorsement;
                    shouldUpdate = true;
                }
            }

            // Normalize Driving Experience (numeric to range buckets)
            const rawExp = user.Driving_Experience || user.driving_experience;
            if (rawExp && !userEdit?.Driving_Experience) {
                let normExp = String(rawExp).trim();
                const numExp = parseInt(normExp);

                // Check if it's already a valid range string, if not map it
                const validRanges = ['0-1', '1-2', '3-5', '6-10', '10+'];
                if (!validRanges.includes(normExp)) {
                    if (!isNaN(numExp)) {
                        if (numExp === 0) normExp = '0-1'; // or less_than_1 depending on value set
                        else if (numExp >= 1 && numExp <= 2) normExp = '1-2';
                        else if (numExp >= 3 && numExp <= 5) normExp = '3-5';
                        else if (numExp >= 6 && numExp <= 10) normExp = '6-10';
                        else if (numExp > 10) normExp = '10+';
                    } else if (normExp === 'less_than_1') {
                        normExp = '0-1';
                    }
                }

                if (normExp) {
                    updates.Driving_Experience = normExp;
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                console.log('Normalizing driver data:', updates);
                // DO NOT touch image paths - they are managed separately now
                const currentUserEdit = userEditRef.current || {};
                dispatch(userEditAction({ ...currentUserEdit, ...updates }));
            }
        }
    }, [user, userRole]);

    // Initialize animation values
    useEffect(() => {
        contentOpacity.value = withTiming(1, { duration: 300 });
        contentTranslateX.value = withSpring(0, { damping: 12 });
    }, []);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));

    const validateCurrentStep = () => {
        const step = STEPS[currentStep];

        switch (step.id) {
            case 'avatar':
                if (!imageState.profilePath && !userEdit?.images) {
                    showToast(t('pleaseUploadProfilePhoto') || 'Please upload your profile photo');
                    return false;
                }
                break;

            case 'personal_info':
                if (!userEdit?.name?.trim()) {
                    showToast(t('fullNameRequired') || 'Full name is required');
                    return false;
                }
                // Email is optional
                // Mobile is already set and disabled
                if (userRole === 'driver' && !userEdit?.Father_Name?.trim()) {
                    showToast(t('fatherNameRequired') || 'Father name is required');
                    return false;
                }
                break;

            case 'dob':
                if (!userEdit?.DOB) {
                    showToast(t('dobRequired') || 'Date of birth is required');
                    return false;
                }
                break;

            case 'gender':
                if (!userEdit?.Sex) {
                    showToast(t('genderRequired') || 'Gender is required');
                    return false;
                }
                if (!userEdit?.Marital_Status) {
                    showToast(t('maritalStatusRequired') || 'Marital status is required');
                    return false;
                }
                break;

            case 'education':
                if (!userEdit?.education && !userEdit?.Highest_Education) {
                    showToast(t('educationRequired') || 'Education is required');
                    return false;
                }
                break;

            case 'address':
                if (!userEdit?.address?.trim()) {
                    showToast(t('addressRequired') || 'Address is required');
                    return false;
                }
                if (!userEdit?.pincode || userEdit.pincode.length !== 6) {
                    showToast(t('pincodeRequired') || 'Valid Pincode is required');
                    return false;
                }
                // District/city is required when pincode is entered (6 digits)
                if (userEdit?.pincode?.length === 6 && !userEdit?.city?.trim()) {
                    showToast(t('cityRequired') || 'District is required');
                    return false;
                }
                if (!userEdit?.states && !userEdit?.state_id) {
                    showToast(t('stateRequired') || 'State is required');
                    return false;
                }
                break;

            case 'vehicle':
                if (!userEdit?.vehicle_type) {
                    showToast(t('vehicleTypeRequired') || 'Vehicle type is required');
                    return false;
                }
                break;

            case 'experience':
                if (!userEdit?.Driving_Experience) {
                    showToast(t('drivingExperienceRequired') || 'Driving experience is required');
                    return false;
                }
                if (!userEdit?.Preferred_Location) {
                    showToast(t('preferredLocationRequired') || 'Preferred location is required');
                    return false;
                }
                break;

            case 'license_type':
                if (!userEdit?.Type_of_License) {
                    showToast(t('licenseTypeRequired') || 'License type is required');
                    return false;
                }
                break;

            case 'endorsement':
                if (!userEdit?.endorsement) {
                    showToast(t('pleaseSelectEndorsement') || 'Please select at least one endorsement');
                    return false;
                }
                break;

            case 'salary':
                if (!userEdit?.Current_Monthly_Income) {
                    showToast(t('currentMonthlyIncomeRequired') || 'Current monthly income is required');
                    return false;
                }
                if (!userEdit?.Expected_Monthly_Income) {
                    showToast(t('expectedMonthlyIncomeRequired') || 'Expected monthly income is required');
                    return false;
                }
                break;

            case 'preferences':
                if (!userEdit?.job_placement) {
                    showToast(t('pleaseSelectJobPlacement') || 'Please select job placement preference');
                    return false;
                }
                if (!userEdit?.previous_employer) {
                    showToast(t('pleaseSelectPreviousEmployer') || 'Please select previous employer preference');
                    return false;
                }
                break;

            case 'aadhar_details':
                if (!userEdit?.Aadhar_Number || userEdit.Aadhar_Number.length !== 12) {
                    showToast(t('aadharNumberRequired') || 'Valid Aadhar number is required');
                    return false;
                }
                if (!imageState.aadharImagePath && !userEdit?.Aadhar_Photo) {
                    showToast(t('AadharPhotoRequired') || 'Aadhar photo is required');
                    return false;
                }
                break;

            case 'license_details':
                if (!userEdit?.License_Number?.trim()) {
                    showToast(t('licenseNumberRequired') || 'License number is required');
                    return false;
                }
                if (!imageState.drivingLicensePath && !userEdit?.Driving_License) {
                    showToast(t('drivingLicenseRequired') || 'Driving license photo is required');
                    return false;
                }
                break;

            case 'pan_details':
                // Optional step
                break;

            // Transporter steps
            case 'transport_details':
                if (!userEdit?.transport_name?.trim()) {
                    showToast(t('transportNameRequired') || 'Transport name is required');
                    return false;
                }
                // Year of establishment and referral code are optional
                break;

            case 'year_of_exp':
                if (!userEdit?.year_of_exp) {
                    showToast(t('experienceRequired') || 'Experience is required');
                    return false;
                }
                break;

            case 'fleet_size':
                if (!userEdit?.fleet_size) {
                    showToast(t('fleetSizeRequired') || 'Fleet size is required');
                    return false;
                }
                break;

            case 'industry_segment':
                if (!userEdit?.industry_segment) {
                    showToast(t('industrySegmentRequired') || 'Industry segment is required');
                    return false;
                }
                break;

            case 'operational_segment':
                if (!userEdit?.routes) {
                    showToast(t('routesRequired') || 'Routes is required');
                    return false;
                }
                break;

            case 'avg_km_run':
                if (!userEdit?.avg_km_run) {
                    showToast(t('avgKmRequired') || 'Average km run is required');
                    return false;
                }
                break;

            case 'pan_gst':
                if (!userEdit?.pan && !userEdit?.PAN_Number) {
                    showToast(t('panNumberRequired') || 'PAN number is required');
                    return false;
                }
                if (!imageState.panImagePath && !userEdit?.PAN_Image) {
                    showToast(t('panImageRequired') || 'PAN image is required');
                    return false;
                }
                // GST is optional
                break;
        }

        return true;
    };

    const handleUpdate = () => {
        // Validate current step before updating
        if (!validateCurrentStep()) {
            return;
        }

        // Submit the profile update
        submitProfile();
    };

    const handleBack = () => {
        navigation.goBack();
    };

    // Helper function to normalize corrupted array data (handles nested JSON strings)
    const normalizeArrayField = (value: any): string[] => {
        if (!value) return [];

        // Handle numbers - convert to string array
        if (typeof value === 'number') {
            return [String(value)];
        }

        // If it's already an array, flatten and clean it
        if (Array.isArray(value)) {
            const flattened: string[] = [];
            value.forEach((item: any) => {
                if (typeof item === 'number') {
                    const cleaned = String(item).trim();
                    if (cleaned && !flattened.includes(cleaned)) flattened.push(cleaned);
                } else if (typeof item === 'string') {
                    // Try to parse if it looks like JSON
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

        // If it's a string
        if (typeof value === 'string') {
            // First check if it's a simple comma-separated string (most common case)
            // Only try JSON parsing if it starts with [ or {
            if (!value.startsWith('[') && !value.startsWith('{')) {
                return value.replace(/[\[\]"\\]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            // Try to parse as JSON
            try {
                const parsed = JSON.parse(value);
                return normalizeArrayField(parsed);
            } catch {
                // Clean and split by comma
                return value.replace(/[\[\]"\\]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
            }
        }

        return [];
    };

    const submitProfile = async () => {
        setLoading(true);
        try {
            const formData = new FormData();

            formData.append('name', userEdit?.name || '');
            formData.append('email', userEdit?.email || '');
            formData.append('mobile', userEdit?.mobile || '');
            formData.append('father_name', userEdit?.Father_Name || '');
            formData.append('dob', userEdit?.DOB ? moment(userEdit.DOB).format('DD-MM-YYYY') : '');
            formData.append('sex', userEdit?.Sex || '');
            formData.append('marital_status', userEdit?.Marital_Status || '');
            formData.append('highest_education', userEdit?.Highest_Education || userEdit?.education || '');
            formData.append('address', userEdit?.address || '');
            formData.append('city', userEdit?.city || '');
            formData.append('pincode', userEdit?.pincode || '');
            // API requires BOTH 'state' and 'states' fields
            const stateValue = userEdit?.state_id || userEdit?.states || '';
            formData.append('states', stateValue);
            formData.append('state', stateValue);
            // Vehicle Type - Driver expects array, Transporter expects string
            // Use helper to normalize corrupted data
            const cleanVehicleTypes = normalizeArrayField(userEdit?.vehicle_type);
            console.log('Cleaned Vehicle Types:', cleanVehicleTypes);

            if (cleanVehicleTypes.length > 0) {
                // Both Driver and Transporter: API expects array format with vehicle_type[]
                cleanVehicleTypes.forEach((vt: string) => {
                    formData.append('vehicle_type[]', vt.trim());
                });
            }
            // If no vehicle types selected, don't append anything - let server handle validation
            formData.append('driving_experience', userEdit?.Driving_Experience || '');
            formData.append('preferred_location', userEdit?.Preferred_Location || '');
            formData.append('current_monthly_income', userEdit?.Current_Monthly_Income || '');
            formData.append('expected_monthly_income', userEdit?.Expected_Monthly_Income || '');
            formData.append('type_of_license', userEdit?.Type_of_License || '');

            // License Endorsements - API expects array
            const endorsements = userEdit?.endorsement?.split(',').filter(Boolean) || [];
            if (endorsements.length > 0) {
                endorsements.forEach((end: string) => {
                    formData.append('licence_endorsement[]', end.trim());
                });
            }

            formData.append('Aadhar_Number', userEdit?.Aadhar_Number || '');
            formData.append('license_number', userEdit?.License_Number || '');
            formData.append('expiry_date_of_license', userEdit?.Expiry_date_of_License ? moment(userEdit.Expiry_date_of_License).format('DD-MM-YYYY') : '');
            formData.append('job_placement', userEdit?.job_placement || '');
            formData.append('previous_employer', userEdit?.previous_employer || '');

            // Transporter fields
            formData.append('year_of_exp', userEdit?.year_of_exp || '');
            formData.append('fleet_size', userEdit?.fleet_size || '');
            formData.append('operational_segment', userEdit?.industry_segment || '');
            // Routes - send as array format like profile-completion
            const routeSegments = Array.isArray(userEdit?.routes)
                ? userEdit.routes
                : userEdit?.routes?.split(',').filter(Boolean) || [];
            if (routeSegments.length > 0) {
                routeSegments.forEach((seg: string) => {
                    formData.append('routes[]', seg.trim());
                });
            }
            formData.append('average_km', userEdit?.avg_km_run || '');
            formData.append('pan_number', userEdit?.pan || userEdit?.PAN_Number || '');
            formData.append('gst_number', userEdit?.gst || userEdit?.GST_Number || '');
            formData.append('transport_name', userEdit?.transport_name || '');
            formData.append('year_of_establishment', userEdit?.year_of_exp || userEdit?.year_of_establishment || userEdit?.establishment_year || '');
            formData.append('Referral_Code', userEdit?.Referral_Code || '');

            // Profile photo
            if (imageState.profilePath?.path && imageState.profilePath?.mime) {
                formData.append('images', {
                    uri: imageState.profilePath.path,
                    type: imageState.profilePath.mime,
                    name: imageState.profilePath.filename || 'profile.jpg'
                });
                console.log('✅ PROFILE PHOTO - Added to FormData:', {
                    uri: imageState.profilePath.path,
                    type: imageState.profilePath.mime,
                    name: imageState.profilePath.filename || 'profile.jpg'
                });
            } else {
                console.log('❌ PROFILE PHOTO - Not added (missing path or mime)');
            }

            // PAN image
            if (imageState.panImagePath?.path && imageState.panImagePath?.mime) {
                formData.append('pan_image', {
                    uri: imageState.panImagePath.path,
                    type: imageState.panImagePath.mime,
                    name: imageState.panImagePath.filename || 'pan.jpg'
                });
                console.log('✅ PAN IMAGE - Added to FormData:', {
                    uri: imageState.panImagePath.path,
                    type: imageState.panImagePath.mime,
                    name: imageState.panImagePath.filename || 'pan.jpg'
                });
            } else {
                console.log('❌ PAN IMAGE - Not added (missing path or mime)');
            }

            // GST Certificate
            if (imageState.gstCertificatePath?.path && imageState.gstCertificatePath?.mime) {
                formData.append('gst_certificate', {
                    uri: imageState.gstCertificatePath.path,
                    type: imageState.gstCertificatePath.mime,
                    name: imageState.gstCertificatePath.filename || 'gst.jpg'
                });
                console.log('✅ GST CERTIFICATE - Added to FormData:', {
                    uri: imageState.gstCertificatePath.path,
                    type: imageState.gstCertificatePath.mime,
                    name: imageState.gstCertificatePath.filename || 'gst.jpg'
                });
            } else {
                console.log('❌ GST CERTIFICATE - Not added (missing path or mime)');
            }

            // Aadhar photo
            if (imageState.aadharImagePath?.path && imageState.aadharImagePath?.mime) {
                formData.append('aadhar_photo', {
                    uri: imageState.aadharImagePath.path,
                    type: imageState.aadharImagePath.mime,
                    name: imageState.aadharImagePath.filename || 'aadhar.jpg'
                });
                console.log('✅ AADHAR PHOTO - Added to FormData:', {
                    uri: imageState.aadharImagePath.path,
                    type: imageState.aadharImagePath.mime,
                    name: imageState.aadharImagePath.filename || 'aadhar.jpg'
                });
            } else {
                console.log('❌ AADHAR PHOTO - Not added (missing path or mime)');
            }

            // Driving license photo
            if (imageState.drivingLicensePath?.path && imageState.drivingLicensePath?.mime) {
                formData.append('Driving_License', {
                    uri: imageState.drivingLicensePath.path,
                    type: imageState.drivingLicensePath.mime,
                    name: imageState.drivingLicensePath.filename || 'license.jpg'
                });
                console.log('✅ DRIVING LICENSE - Added to FormData:', {
                    uri: imageState.drivingLicensePath.path,
                    type: imageState.drivingLicensePath.mime,
                    name: imageState.drivingLicensePath.filename || 'license.jpg'
                });
            } else {
                console.log('❌ DRIVING LICENSE - Not added (missing path or mime)');
            }

            // Debug: Log what's being sent
            console.log('=== Profile Update Request ===');
            console.log('User Role:', userRole);
            console.log('Vehicle Type:', userEdit?.vehicle_type);
            console.log('Sending to:', END_POINTS.EDIT_PROFILE);

            // Summary of images being uploaded
            const imagesSummary = {
                profilePhoto: !!(imageState.profilePath?.path && imageState.profilePath?.mime),
                aadharPhoto: !!(imageState.aadharImagePath?.path && imageState.aadharImagePath?.mime),
                panImage: !!(imageState.panImagePath?.path && imageState.panImagePath?.mime),
                drivingLicense: !!(imageState.drivingLicensePath?.path && imageState.drivingLicensePath?.mime),
                gstCertificate: !!(imageState.gstCertificatePath?.path && imageState.gstCertificatePath?.mime)
            };
            console.log('📸 IMAGES SUMMARY:', imagesSummary);
            console.log('📸 Total images being uploaded:', Object.values(imagesSummary).filter(Boolean).length);

            // Debug: Log driving license details
            // console.log('=== Driving License Debug ===');
            // console.log('drivingLicensePath:', JSON.stringify(userEdit?.drivingLicensePath, null, 2));
            // console.log('Driving_License (existing):', userEdit?.Driving_License);
            if (userEdit?.drivingLicensePath?.path) {
                console.log('UPLOADING driving_license with:', {
                    uri: userEdit.drivingLicensePath.path,
                    type: userEdit.drivingLicensePath.mime,
                    name: userEdit.drivingLicensePath.filename || 'license.jpg'
                });
            } else {
                console.log('NOT uploading driving_license - no new image selected');
            }
            console.log('=== OPERATIONAL SEGMENT UPDATE DEBUG ===');
            console.log('userEdit.industry_segment:', userEdit?.industry_segment);
            console.log('Sending to API as industry_segment:', userEdit?.industry_segment || '');

            console.log('=======================formdata==================', formData);

            const response = await axiosInstance.post(END_POINTS.EDIT_PROFILE, formData);

            console.log('=== API RESPONSE DEBUG ===');
            console.log('Response status:', response?.data?.status);
            console.log('Response message:', response?.data?.message);
            console.log('Full response data:', JSON.stringify(response?.data, null, 2));

            if (response?.data?.status) {
                showToast(response.data.message || t('profileUpdated') || 'Profile updated');

                console.log('=== FETCHING UPDATED PROFILE ===');
                const profile = await axiosInstance.get(END_POINTS.GET_PROFILE);

                console.log('=== PROFILE FETCH RESPONSE ===');
                console.log('Profile fetch status:', profile?.data?.status);
                console.log('Profile data keys:', profile?.data?.data ? Object.keys(profile.data.data) : 'No data');
                console.log('Operational_Segment in response:', profile?.data?.data?.Operational_Segment);
                console.log('operational_segment in response:', profile?.data?.data?.operational_segment);
                console.log('Industry_Segment in response:', profile?.data?.data?.Industry_Segment);
                console.log('industry_segment in response:', profile?.data?.data?.industry_segment);
                console.log('Full profile data:', JSON.stringify(profile?.data?.data, null, 2));

                if (profile?.data?.status) {
                    console.log('=== DISPATCHING UPDATED USER DATA ===');
                    dispatch(userAction(profile.data));
                    // dispatch(userAction({
                    //     ...profile.data,
                    //     data: {
                    //         ...profile.data.data,
                    //         profile_completed: true,
                    //     },
                    // }));
                    navigation.goBack(); // Go back to previous screen
                }
            } else {
                console.log('=== API UPDATE FAILED ===');
                console.log('Error response:', JSON.stringify(response?.data, null, 2));
                showToast(response?.data?.message || t('updateFailed') || 'Update failed');
            }
        } catch (error: any) {
            console.log('Profile update error:', error);
            console.log('Error response data:', error?.response?.data);
            console.log('Error response status:', error?.response?.status);
            const errorMessage = error?.response?.data?.message || error?.message || t('errorOccurred') || 'An error occurred';
            showToast(errorMessage);
        } finally {
            setLoading(false);
        }
    };



    const toggleMultiSelect = (field: string, value: string) => {
        console.log('=== toggleMultiSelect called ===');
        console.log('Field:', field);
        console.log('Value to toggle:', value);
        console.log('Current userEdit[field]:', userEdit?.[field]);

        // Normalize the current values first (handles corrupted data)
        const currentValues = normalizeArrayField(userEdit?.[field]);
        console.log('Normalized current values:', currentValues);

        const newValues = currentValues.includes(value)
            ? currentValues.filter((v: string) => v !== value)
            : [...currentValues, value];
        console.log('New values:', newValues);
        console.log('New values joined:', newValues.join(','));

        dispatch(userEditAction({ ...userEdit, [field]: newValues.join(',') }));
    };

    const pickImage = async (field: string) => {
        try {
            const hasPermission = await requestPhotoLibraryPermission();
            if (!hasPermission) { showToast(t('photoPermissionRequired')); return; }
            const image = await ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.8 });
            if (image?.path) {
                // Update separate image state
                setImageState(prev => ({ ...prev, [field]: image }));

                // Clear existing image key in userEdit to ensure new image is uploaded
                const fieldMap: { [key: string]: string } = {
                    'profilePath': 'images',
                    'aadharImagePath': 'Aadhar_Photo',
                    'drivingLicensePath': 'Driving_License',
                    'panImagePath': 'PAN_Image',
                    'gstCertificatePath': 'GST_Certificate'
                };

                if (fieldMap[field]) {
                    dispatch(userEditAction({ ...(userEditRef.current || {}), [fieldMap[field]]: null }));
                }

                setImagePickerOpen(false);
            }
        } catch (error: any) {
            if (error.code !== 'E_PICKER_CANCELLED') showToast(t('failedToSelectImage'));
        }
    };

    const openCamera = async (field: string) => {
        try {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) { showToast(t('cameraPermissionRequired')); return; }
            const image = await ImagePicker.openCamera({ mediaType: 'photo', compressImageQuality: 0.8 });
            if (image?.path) {
                // Update separate image state
                setImageState(prev => ({ ...prev, [field]: image }));

                // Clear existing image key in userEdit to ensure new image is uploaded
                const fieldMap: { [key: string]: string } = {
                    'profilePath': 'images',
                    'aadharImagePath': 'Aadhar_Photo',
                    'drivingLicensePath': 'Driving_License',
                    'panImagePath': 'PAN_Image',
                    'gstCertificatePath': 'GST_Certificate'
                };

                if (fieldMap[field]) {
                    dispatch(userEditAction({ ...(userEditRef.current || {}), [fieldMap[field]]: null }));
                }

                setImagePickerOpen(false);
            }
        } catch (error: any) {
            if (error.code !== 'E_PICKER_CANCELLED') showToast(t('failedToOpenCamera'));
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const profileImageUri = imageState.profilePath?.path || (userEdit?.images ? `${BASE_URL}public/${userEdit.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png');
    const dateOfBirth = userEdit?.DOB ? new Date(userEdit.DOB) : moment().subtract(18, 'years').toDate();
    const licenseExpiry = userEdit?.Expiry_date_of_License ? new Date(userEdit.Expiry_date_of_License) : new Date();

    // Selection Chip Component
    const Chip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
        <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    // Document Upload Component
    const DocumentUpload = ({ label, imagePath, existingImage, fieldName, existingImageKey }: any) => {
        const imageUri = imagePath?.path || (existingImage ? `${BASE_URL}public/${existingImage}` : null);
        return (
            <View style={styles.documentBox}>
                <Text style={styles.inputLabel}>{label}</Text>
                {imageUri ? (
                    <View style={styles.documentPreview}>
                        <Image source={{ uri: imageUri }} style={styles.documentImage} />
                        <TouchableOpacity style={styles.documentDelete} onPress={() => {
                            // Clear from separate image state
                            setImageState(prev => ({ ...prev, [fieldName]: null }));
                            // Clear from userEdit as well
                            const updates: any = {};
                            if (existingImageKey) updates[existingImageKey] = null;
                            dispatch(userEditAction({ ...(userEditRef.current || {}), ...updates }));
                        }}>
                            <Ionicons name="close-circle" size={28} color="#dc3545" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.uploadBox} onPress={() => { setActiveField(fieldName); setImagePickerOpen(true); }}>
                        <MaterialCommunityIcons name="file-upload-outline" size={40} color={colors.royalBlue} />
                        <Text style={styles.uploadText}>{t('tapToUpload') || 'Tap to upload'}</Text>
                        <Text style={styles.uploadHint}>.jpg, .jpeg, .png</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderStepContent = () => {
        const step = STEPS[currentStep];
        if (!step) return null;

        switch (step.id) {
            case 'personal_info':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('fullName')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput style={styles.textInput} placeholder={t('enterFullName')} placeholderTextColor="#999" value={userEdit?.name || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, name: text }))} />
                        <Space height={16} />
                        <Text style={styles.inputLabel}>{t('e-mail')}</Text>
                        <TextInput style={styles.textInput} placeholder={t('enterE-mail')} placeholderTextColor="#999" keyboardType="email-address" value={userEdit?.email || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, email: text.toLowerCase() }))} />
                        <Space height={16} />
                        <Text style={styles.inputLabel}>{t('mobile')}</Text>
                        <TextInput style={[styles.textInput, { opacity: 0.6 }]} editable={false} value={userEdit?.mobile || ''} />
                        {userRole === 'driver' && (<><Space height={16} /><Text style={styles.inputLabel}>{t('fatherName')} <Text style={styles.requiredAsterisk}>*</Text></Text><TextInput style={styles.textInput} placeholder={t('enterFatherName')} placeholderTextColor="#999" value={userEdit?.Father_Name || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, Father_Name: text }))} /></>)}
                    </View>
                );

            case 'dob':
                const selectedDate = userEdit?.DOB ? moment(userEdit.DOB).format('YYYY-MM-DD') : '';
                const maxDate = moment().subtract(18, 'years').format('YYYY-MM-DD');
                const years = Array.from({ length: 70 }, (_, i) => moment().subtract(18 + i, 'years').year());
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.dateDisplay}><Text style={[styles.dateText, !userEdit?.DOB && { color: '#999' }]}>{userEdit?.DOB ? moment(userEdit.DOB).format('DD MMMM YYYY') : t('selectFromCalendar')}</Text><Ionicons name="calendar" size={22} color={colors.royalBlue} /></View>
                        <Space height={12} />
                        <View style={styles.calendarBox}>
                            <View style={styles.calendarHeader}>
                                <TouchableOpacity onPress={() => setCalendarMonth(moment(calendarMonth).subtract(1, 'month').format('YYYY-MM-DD'))}><Ionicons name="chevron-back" size={22} color={colors.royalBlue} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => setYearPickerOpen(true)} style={styles.yearBtn}><Text style={styles.yearBtnText}>{moment(calendarMonth).format('MMMM YYYY')}</Text><Ionicons name="caret-down" size={12} color={colors.royalBlue} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => { if (moment(calendarMonth).add(1, 'month').isSameOrBefore(moment(maxDate))) setCalendarMonth(moment(calendarMonth).add(1, 'month').format('YYYY-MM-DD')); }}><Ionicons name="chevron-forward" size={22} color={colors.royalBlue} /></TouchableOpacity>
                            </View>
                            <Calendar key={calendarMonth} current={calendarMonth} maxDate={maxDate} hideArrows renderHeader={() => null} onDayPress={(day: any) => dispatch(userEditAction({ ...userEdit, DOB: new Date(day.dateString) }))} markedDates={{ [selectedDate]: { selected: true, selectedColor: colors.royalBlue } }} theme={{ selectedDayBackgroundColor: colors.royalBlue, todayTextColor: colors.royalBlue, dayTextColor: '#333' }} />
                        </View>
                        <Modal visible={yearPickerOpen} transparent animationType="fade"><TouchableWithoutFeedback onPress={() => setYearPickerOpen(false)}><View style={styles.modalOverlay}><View style={styles.yearPickerBox}><Text style={styles.yearPickerTitle}>{t('selectYear')}</Text><ScrollView>{years.map(y => (<TouchableOpacity key={y} style={[styles.yearItem, moment(calendarMonth).year() === y && styles.yearItemSelected]} onPress={() => { setCalendarMonth(moment(calendarMonth).year(y).format('YYYY-MM-DD')); setYearPickerOpen(false); }}><Text style={[styles.yearItemText, moment(calendarMonth).year() === y && { color: 'white' }]}>{y}</Text></TouchableOpacity>))}</ScrollView></View></View></TouchableWithoutFeedback></Modal>
                    </View>
                );

            case 'gender':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>
                            {t('gender')}
                            <Text style={{ color: 'red' }}> *</Text>
                        </Text>
                        <View style={styles.radioGroup}>{['Male', 'Female', 'Other'].map(g => (<TouchableOpacity key={g} style={[styles.radioBox, userEdit?.Sex === g && styles.radioBoxSelected]} onPress={() => dispatch(userEditAction({ ...userEdit, Sex: g }))}><View style={[styles.radioCircle, userEdit?.Sex === g && styles.radioCircleSelected]}>{userEdit?.Sex === g && <View style={styles.radioDot} />}</View><Text style={[styles.radioText, userEdit?.Sex === g && { color: colors.royalBlue }]}>{g}</Text></TouchableOpacity>))}</View>
                        <Space height={24} />
                        <Text style={styles.inputLabel}>
                            {t('maritalStatus')}
                            <Text style={{ color: 'red' }}> *</Text>
                        </Text>
                        <View style={styles.chipContainer}>{['Single', 'Married', 'Widowed', 'Divorced'].map(s => (<Chip key={s} label={s} selected={userEdit?.Marital_Status === s} onPress={() => dispatch(userEditAction({ ...userEdit, Marital_Status: s }))} />))}</View>
                    </View>
                );

            case 'education':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.gridContainer}>{translatedEducationList.map(e => (<TouchableOpacity key={e.value} style={[styles.gridTile, (userEdit?.education === e.value || userEdit?.Highest_Education === e.value) && styles.gridTileSelected]} onPress={() => dispatch(userEditAction({ ...userEdit, education: e.value, Highest_Education: e.value }))}><Text style={[styles.gridTileText, (userEdit?.education === e.value || userEdit?.Highest_Education === e.value) && styles.gridTileTextSelected]}>{e.label}</Text></TouchableOpacity>))}</View>
                    </View>
                );

            case 'address':
                // Find the matching state - handle both name and ID stored values
                const getStateDisplayName = () => {
                    // First check if we have a state_name directly
                    if (userEdit?.state_name) return userEdit.state_name;
                    if (!userEdit?.states) return '';

                    // If locations are loaded, try to find the name
                    if (locations.length > 0) {
                        // Try to find by ID first (numeric value)
                        const byId = locations.find(s => s.id === Number(userEdit.states));
                        if (byId) return byId.name;
                        // Try to find by name (string value)
                        const byName = locations.find(s => s.name?.toLowerCase() === userEdit.states?.toLowerCase());
                        if (byName) return byName.name;
                        // Try to find by state_id field
                        if (userEdit?.state_id) {
                            const byStateId = locations.find(s => s.id === Number(userEdit.state_id));
                            if (byStateId) return byStateId.name;
                        }
                    }
                    // If it's a non-numeric value, it might be the state name itself
                    if (isNaN(Number(userEdit.states))) {
                        return userEdit.states;
                    }
                    // Return empty for ID that we can't resolve
                    return '';
                };
                const stateDisplayName = getStateDisplayName();
                const hasState = Boolean(userEdit?.states || userEdit?.state_name || userEdit?.state_id);

                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('address')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} placeholder={t('enterCompleteAddress')} placeholderTextColor="#999" multiline value={userEdit?.address || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, address: text }))} />
                        <Space height={16} />
                        <Text style={styles.inputLabel}>{t('pincode')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                            <TextInput
                                style={[styles.textInput, { paddingRight: 40 }]}
                                placeholder={t('enterPincode')}
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                                maxLength={6}
                                value={userEdit?.pincode || ''}
                                onChangeText={(text) => dispatch(userEditAction({ ...(userEdit || {}), pincode: text }))}
                            />
                            {loadingPincode && (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.royalBlue}
                                    style={{ position: 'absolute', right: 12 }}
                                />
                            )}
                        </View>
                        <Space height={16} />
                        {postOffices.length > 0 && (
                            <>
                                <Text style={styles.inputLabel}>{t('city')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                                <Dropdown
                                    style={styles.dropdown}
                                    placeholderStyle={{ color: '#999', fontSize: 15 }}
                                    selectedTextStyle={{ color: '#333', fontSize: 15 }}
                                    data={postOffices.map(po => ({ label: po.Name, value: po.Name }))}
                                    labelField="label"
                                    valueField="value"
                                    placeholder={t('selectPostOffice') || 'Select Post Office'}
                                    value={selectedPostOffice}
                                    onChange={item => {
                                        setSelectedPostOffice(item.value);
                                        dispatch(userEditAction({ ...userEdit, city: item.value }));
                                    }}
                                />
                                <Space height={16} />
                            </>
                        )}
                        <Text style={styles.inputLabel}>{t('state')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        {hasState ? (
                            <View style={[styles.textInput, { justifyContent: 'center', backgroundColor: '#F5F5F5' }]}>
                                <Text style={{ color: '#333', fontSize: 15 }}>{stateDisplayName || t('stateSelected') || 'State Selected'}</Text>
                            </View>
                        ) : (

                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={{ color: '#999', fontSize: 15 }}
                                selectedTextStyle={{ color: '#333', fontSize: 15 }}
                                data={locations.map(l => ({ label: l.name, value: l.id.toString() }))}
                                labelField="label"
                                valueField="value"
                                placeholder={t('selectState')}
                                search
                                searchPlaceholder={t('search')}
                                value={''}
                                onChange={item => dispatch(userEditAction({ ...userEdit, states: item.value }))}
                            />
                        )}
                        {hasState && <Text style={styles.helperText}>{t('stateCannotBeChanged') || 'State captured during signup'}</Text>}
                    </View>
                );

            case 'vehicle':
                // Use only 8 predefined trucks with images (matching profile-completion)
                // IDs match the vehicle_type database table:
                // 1=Container Trucks, 3=Heavy Open Body Trucks, 4=Light Commercial Vehicles,
                // 8=Refrigerated Trucks, 9=Special Purpose Trucks, 10=Tankers, 11=Tippers, 22=Trailer Trucks
                const VEHICLE_TYPES_WITH_IMAGES = [
                    { id: '3', name: t('cargoTruckOpen') || 'Heavy Commercial Vehicles', imgKey: 'cargoOpen' },
                    { id: '1', name: t('containerTrucks') || 'Container Trucks', imgKey: 'container' },
                    { id: '11', name: t('tipperTrucks') || 'Tipper Trucks', imgKey: 'tipper' },
                    { id: '22', name: t('trailerTrucks') || 'Trailer Trucks', imgKey: 'trailer' },
                    { id: '10', name: t('tankers') || 'Tankers', imgKey: 'tanker' },
                    { id: '26', name: t('carCarriers') || 'Car Carriers', imgKey: 'carCarrier' },
                    { id: '4', name: t('lightCommercialVehicle') || 'Light Commercial Vehicles', imgKey: 'pickUp' },
                    { id: '8', name: t('reeferTrucks') || 'Refrigerator Trucks', imgKey: 'reefer' },
                ];

                const VEHICLE_TYPE_MAP: Record<string, string> = {
                    '1': 'Container Trucks',
                    '2': 'Heavy Commercial Vehicles',
                    '3': 'Heavy Open Body Trucks',
                    '4': 'Light Commercial Vehicles',
                    '5': 'Light Open Body Trucks',
                    '6': 'Medium Commercial Vehicles',
                    '7': 'Multi-Axle Trucks',
                    '8': 'Refrigerated Trucks',
                    '9': 'Special Purpose Trucks',
                    '10': 'Tankers',
                    '11': 'Tippers',
                    '13': 'Crane Mounted Lorries',
                    '14': 'Curtainsiders',
                    '15': 'Flatbeds',
                    '16': 'Light Commercial Vehicles (LCVs)',
                    '17': 'Medium and Heavy Commercial Vehicles (MHCVs)',
                    '18': 'Mini Trucks',
                    '19': 'Moffett Lorries',
                    '20': 'Pickups',
                    '21': 'Three-Wheelers',
                    '22': 'Trailer Trucks',
                    '23': 'Transporters',
                    '24': 'Trucks',
                    '25': 'Walking Floor Lorries',
                    '26': 'Car Carrier',
                }

                // Get current selections using normalizeArrayField to handle corrupted data
                const currentVehicleSelections = normalizeArrayField(userEdit?.vehicle_type);

                return (
                    <View style={styles.stepContent}>
                        <View style={styles.vehicleGrid}>
                            {VEHICLE_TYPES_WITH_IMAGES.map((v) => {
                                const selected = currentVehicleSelections.includes(v.id);
                                return (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={[styles.vehicleTile, selected && styles.vehicleTileSelected]}
                                        onPress={() => toggleMultiSelect('vehicle_type', v.id)}
                                    >
                                        <Image source={(TruckImages as any)[v.imgKey]} style={styles.vehicleImage} resizeMode="contain" />
                                        <Text style={[styles.vehicleLabel, selected && { color: colors.royalBlue }]}>{v.name}</Text>
                                        {selected && <View style={styles.vehicleCheck}><Ionicons name="checkmark-circle" size={20} color={colors.royalBlue} /></View>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'experience':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('selectYourDrivingExperience')}</Text>
                        <Dropdown style={styles.dropdown} data={drivingExperienceArray} labelField="label" valueField="value" placeholder={t('selectExperience')} value={userEdit?.Driving_Experience} onChange={item => dispatch(userEditAction({ ...userEdit, Driving_Experience: item.value }))} />
                        <Space height={16} />
                        <Text style={styles.inputLabel}>{t('preferredLocation')}</Text>
                        <Dropdown style={styles.dropdown} data={locations.map(l => ({ label: l.name, value: l.id.toString() }))} labelField="label" valueField="value" placeholder={t('selectPreferredLocation')} search searchPlaceholder={t('search')} value={userEdit?.Preferred_Location} onChange={item => dispatch(userEditAction({ ...userEdit, Preferred_Location: item.value }))} />
                    </View>
                );

            case 'license_type':
                return (
                    <View style={styles.stepContent}>
                        {licenseTypes.map(l => (<TouchableOpacity key={l} style={[styles.radioBox, userEdit?.Type_of_License === l && styles.radioBoxSelected, { marginBottom: 10 }]} onPress={() => dispatch(userEditAction({ ...userEdit, Type_of_License: l }))}><View style={[styles.radioCircle, userEdit?.Type_of_License === l && styles.radioCircleSelected]}>{userEdit?.Type_of_License === l && <View style={styles.radioDot} />}</View><Text style={[styles.radioText, userEdit?.Type_of_License === l && { color: colors.royalBlue }]}>{l}</Text></TouchableOpacity>))}
                    </View>
                );

            case 'endorsement':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('selectLicenseEndorsements') || 'Select License Endorsements'} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <Text style={[styles.helperText, { marginBottom: 12 }]}>{t('selectMultipleIfApplicable') || 'Select all that apply'}</Text>
                        <View>
                            {translatedEndorsements.map(item => {
                                const current = userEdit?.endorsement ? userEdit.endorsement.split(',') : [];
                                const isSelected = current.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.endorsementTile,
                                            isSelected && styles.endorsementTileSelected
                                        ]}
                                        onPress={() => toggleMultiSelect('endorsement', item.id)}
                                    >
                                        <View style={[styles.endorsementIcon, isSelected && { backgroundColor: '#246BFD' }]}>
                                            <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.endorsementLabel, isSelected && { color: '#246BFD' }]}>
                                                {item.label}
                                            </Text>
                                        </View>
                                        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#246BFD" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'salary':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('currentMonthlyIncome')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <View style={styles.chipContainer}>{currentSalaryRanges.map(s => (<Chip key={s} label={`₹${s}`} selected={userEdit?.Current_Monthly_Income === s} onPress={() => dispatch(userEditAction({ ...userEdit, Current_Monthly_Income: s }))} />))}</View>
                        <Space height={20} />
                        <Text style={styles.inputLabel}>{t('expectedMonthlyIncome')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <View style={styles.chipContainer}>{expectedSalaryRanges.map(s => (<Chip key={s} label={`₹${s}`} selected={userEdit?.Expected_Monthly_Income === s} onPress={() => dispatch(userEditAction({ ...userEdit, Expected_Monthly_Income: s }))} />))}</View>
                    </View>
                );

            case 'preferences':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('jobPlacementsTitle')}</Text>
                        <View style={styles.chipContainer}><Chip label={t('yes') || 'Yes'} selected={userEdit?.job_placement === 'yes'} onPress={() => dispatch(userEditAction({ ...userEdit, job_placement: 'yes' }))} /><Chip label={t('no') || 'No'} selected={userEdit?.job_placement === 'no'} onPress={() => dispatch(userEditAction({ ...userEdit, job_placement: 'no' }))} /></View>
                        <Space height={20} />
                        <Text style={styles.inputLabel}>{t('previousEmployerTitle')}</Text>
                        <View style={styles.chipContainer}><Chip label={t('yes') || 'Yes'} selected={userEdit?.previous_employer === 'yes'} onPress={() => dispatch(userEditAction({ ...userEdit, previous_employer: 'yes' }))} /><Chip label={t('no') || 'No'} selected={userEdit?.previous_employer === 'no'} onPress={() => dispatch(userEditAction({ ...userEdit, previous_employer: 'no' }))} /></View>
                    </View>
                );

            case 'avatar':
                return (
                    <View style={[styles.stepContent, { alignItems: 'center' }]}>
                        <TouchableOpacity onPress={() => { setActiveField('profilePath'); setImagePickerOpen(true); }} style={styles.avatarBox}>
                            {imageState.profilePath?.path || userEdit?.images ? <Image source={{ uri: profileImageUri }} style={styles.avatarImage} /> : <Ionicons name="camera-outline" size={50} color="#ccc" />}
                            <View style={styles.avatarBadge}><Ionicons name="pencil" size={14} color="white" /></View>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>{t('tapToChangePhoto') || 'Tap to change photo'}</Text>
                    </View>
                );

            case 'aadhar_details':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('aadharNumber')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput style={styles.textInput} placeholder="0000 0000 0000" placeholderTextColor="#999" keyboardType="number-pad" maxLength={12} value={userEdit?.Aadhar_Number || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, Aadhar_Number: text }))} />
                        <Space height={20} />
                        <DocumentUpload label={<Text>{t('uploadAadharPhoto')} <Text style={styles.requiredAsterisk}>*</Text></Text>} imagePath={imageState.aadharImagePath} existingImage={userEdit?.Aadhar_Photo} fieldName="aadharImagePath" existingImageKey="Aadhar_Photo" />
                    </View>
                );

            case 'license_details':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('licenseNumber')} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput style={styles.textInput} placeholder="MH0120230000000" placeholderTextColor="#999" autoCapitalize="characters" maxLength={16} value={userEdit?.License_Number || ''} onChangeText={(text) => { const formattedText = text.replace(/[^a-zA-Z0-9]/g, ''); dispatch(userEditAction({ ...userEdit, License_Number: formattedText })); }} />
                        <Space height={16} />
                        <Text style={styles.inputLabel}>{t('expiryDateOfLicense')}</Text>
                        <TouchableOpacity style={styles.dateDisplay} onPress={() => setLicenseExpiryModal(true)}><Text style={styles.dateText}>{userEdit?.Expiry_date_of_License ? moment(licenseExpiry).format('DD-MM-YYYY') : 'DD-MM-YYYY'}</Text><Ionicons name="calendar" size={20} color={colors.royalBlue} /></TouchableOpacity>
                        <Space height={20} />
                        <DocumentUpload
                            label={<Text>{t('uploadDrivingLicense')} <Text style={styles.requiredAsterisk}>*</Text></Text>}
                            imagePath={imageState.drivingLicensePath}
                            existingImage={userEdit?.Driving_License}
                            fieldName="drivingLicensePath"
                            existingImageKey="Driving_License"
                        />
                        <Modal visible={licenseExpiryModal} transparent animationType="fade"><View style={styles.modalOverlay}><View style={styles.datePickerBox}><Text style={styles.datePickerTitle}>{t('expiryDateOfLicense')}</Text><DatePicker mode="date" theme="light" date={licenseExpiry} minimumDate={new Date()} maximumDate={moment().add(30, 'years').toDate()} onDateChange={(date) => dispatch(userEditAction({ ...userEdit, Expiry_date_of_License: date }))} /><View style={styles.datePickerButtons}><TouchableOpacity style={styles.cancelBtn} onPress={() => setLicenseExpiryModal(false)}><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.royalBlue }]} onPress={() => setLicenseExpiryModal(false)}><Text style={styles.confirmBtnText}>{t('confirm')}</Text></TouchableOpacity></View></View></View></Modal>
                    </View>
                );

            case 'pan_details':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('panNumber') || 'PAN Number'}</Text>
                        <TextInput style={styles.textInput} placeholder="ABCDE1234F" placeholderTextColor="#999" autoCapitalize="characters" maxLength={10} value={userEdit?.pan || userEdit?.PAN_Number || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, pan: text.toUpperCase(), PAN_Number: text.toUpperCase() }))} />
                        <Space height={16} />
                        <DocumentUpload
                            label={t('uploadPanDocument') || 'Upload PAN Document'}
                            imagePath={imageState.panImagePath}
                            existingImage={userEdit?.PAN_Image}
                            fieldName="panImagePath"
                            existingImageKey="PAN_Image"
                        />
                    </View>
                );

            // Transporter steps
            case 'year_of_exp':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.gridContainer}>
                            {[
                                { label: t('lessThan1Year') || '< 1 Year', value: '0-1' },
                                { label: t('1to2Years') || '1-2 Years', value: '1-2' },
                                { label: t('3to5Years') || '3-5 Years', value: '3-5' },
                                { label: t('6to10Years') || '6-10 Years', value: '6-10' },
                                { label: t('10PlusYears') || '10+ Years', value: '10+' }
                            ].map(e => (
                                <TouchableOpacity key={e.value} style={[styles.gridTile, (userEdit?.year_of_exp === e.value || userEdit?.year_of_establishment === e.value) && styles.gridTileSelected]} onPress={() => dispatch(userEditAction({ ...userEdit, year_of_exp: e.value, year_of_establishment: e.value }))}>
                                    <Text style={[styles.gridTileText, (userEdit?.year_of_exp === e.value || userEdit?.year_of_establishment === e.value) && styles.gridTileTextSelected]}>{e.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'fleet_size':
                return (<View style={styles.stepContent}><View style={styles.gridContainer}>{translatedFleetSizes.map(f => (<TouchableOpacity key={f.value} style={[styles.gridTile, userEdit?.fleet_size === f.value && styles.gridTileSelected]} onPress={() => dispatch(userEditAction({ ...userEdit, fleet_size: f.value }))}><Text style={[styles.gridTileText, userEdit?.fleet_size === f.value && styles.gridTileTextSelected]}>{f.label}</Text></TouchableOpacity>))}</View></View>);

            case 'industry_segment':
                const industrySegmentArray = Array.isArray(userEdit?.industry_segment)
                    ? userEdit.industry_segment
                    : userEdit?.industry_segment?.split(',')?.filter(Boolean) || [];
                return (<View style={styles.stepContent}><View style={styles.chipContainer}>{translatedIndustrySegments.map(s => { const selected = industrySegmentArray.includes(s.value) || industrySegmentArray.includes(s.label); return <Chip key={s.value} label={s.label} selected={selected} onPress={() => toggleMultiSelect('industry_segment', s.value)} />; })}</View></View>);

            case 'operational_segment':
                // Routes selection (local, intracity, intercity, etc.) - Same UI as profile-completion
                const currentRoutes = Array.isArray(userEdit?.routes)
                    ? userEdit.routes
                    : userEdit?.routes?.split(',')?.filter(Boolean) || [];
                return (
                    <View style={styles.stepContent}>
                        <Text style={[styles.helperText, { marginBottom: 12 }]}>{t('selectMultipleIfApplicable')}</Text>
                        <View>
                            {translatedOperationalSegments.map((segment) => {
                                const isSelected = currentRoutes.includes(segment.label) || currentRoutes.includes(segment.value);
                                return (
                                    <TouchableOpacity
                                        key={segment.value}
                                        style={[
                                            styles.endorsementTile,
                                            isSelected && styles.endorsementTileSelected
                                        ]}
                                        onPress={() => {
                                            let newSegments = [...currentRoutes];
                                            if (isSelected) {
                                                newSegments = newSegments.filter((s: string) => s !== segment.label && s !== segment.value);
                                            } else {
                                                newSegments.push(segment.label);
                                            }
                                            dispatch(userEditAction({ ...userEdit, routes: newSegments.filter(Boolean).join(',') }));
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

            case 'avg_km_run':
                return (<View style={styles.stepContent}><View style={styles.gridContainer}>{translatedAvgKmRanges.map(k => (<TouchableOpacity key={k.value} style={[styles.gridTile, userEdit?.avg_km_run === k.value && styles.gridTileSelected]} onPress={() => dispatch(userEditAction({ ...userEdit, avg_km_run: k.value }))}><Text style={[styles.gridTileText, userEdit?.avg_km_run === k.value && styles.gridTileTextSelected]}>{k.label}</Text></TouchableOpacity>))}</View></View>);

            case 'transport_details':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('transportName') || 'Transport Name'} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput style={styles.textInput} placeholder={t('enterTransportName')} placeholderTextColor="#999" value={userEdit?.transport_name || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, transport_name: text }))} />
                        {/* <Space height={16} />
                        <Text style={styles.inputLabel}>{t('referralCode') || 'Referral Code'}</Text>
                        <TextInput style={styles.textInput} placeholder={t('enterReferralCode')} placeholderTextColor="#999" value={userEdit?.Referral_Code || ''} onChangeText={(text) => dispatch(userEditAction({ ...userEdit, Referral_Code: text }))} /> */}
                    </View>
                );

            case 'pan_gst':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.inputLabel}>{t('panNumber') || 'PAN Number'} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput style={styles.textInput} placeholder="ABCDE1234F" placeholderTextColor="#999" autoCapitalize="characters" maxLength={10} value={userEdit?.pan || userEdit?.PAN_Number || ''} onChangeText={(text) => { const formattedText = text.toUpperCase().replace(/[^a-zA-Z0-9]/g, ''); dispatch(userEditAction({ ...userEdit, pan: formattedText, PAN_Number: formattedText })); }} />
                        <Space height={16} />
                        <DocumentUpload
                            label={<Text>{t('uploadPanDocument')} <Text style={styles.requiredAsterisk}>*</Text></Text>}
                            imagePath={imageState.panImagePath}
                            existingImage={userEdit?.PAN_Image}
                            fieldName="panImagePath"
                            existingImageKey="PAN_Image"
                        />
                        <Space height={20} />
                        <Text style={styles.inputLabel}>{t('gstNumber') || 'GST Number'}</Text>
                        <TextInput style={styles.textInput} placeholder="22AAAAA0000A1Z5" placeholderTextColor="#999" autoCapitalize="characters" maxLength={15} value={userEdit?.gst || userEdit?.GST_Number || ''} onChangeText={(text) => { const formattedText = text.toUpperCase().replace(/[^a-zA-Z0-9]/g, ''); dispatch(userEditAction({ ...userEdit, gst: formattedText, GST_Number: formattedText })); }} />
                        <Space height={16} />
                        <DocumentUpload
                            label={t('uploadGstCertificate')}
                            imagePath={imageState.gstCertificatePath}
                            existingImage={userEdit?.GST_Certificate}
                            fieldName="gstCertificatePath"
                            existingImageKey="GST_Certificate"
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
            <Space height={safeAreaInsets.top} />
            <View style={styles.header}><TouchableOpacity onPress={handleBack} style={styles.navBtn}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity><Text style={styles.headerTitle}>{STEPS[currentStep] ? t(STEPS[currentStep].title) : t('profileEdit')}</Text><View style={styles.navBtn} /></View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <KeyboardAwareScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    extraScrollHeight={100}
                    enableOnAndroid={false}
                >
                    <Animated.View style={animatedContentStyle}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>{STEPS[currentStep] ? t(STEPS[currentStep].title) : ''}</Text>
                                <Text style={styles.stepSubtitle}>{STEPS[currentStep] ? t(STEPS[currentStep].subtitle) : ''}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        {renderStepContent()}
                    </Animated.View>
                </KeyboardAwareScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.royalBlue }]} onPress={handleUpdate} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.nextButtonText}>{t('update')}</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={imagePickerOpen} transparent animationType="slide"><TouchableWithoutFeedback onPress={() => setImagePickerOpen(false)}><View style={styles.bottomModalOverlay}><View style={styles.bottomModalContent}><Text style={styles.modalTitle}>{t('chooseAction')}</Text><TouchableOpacity style={styles.modalOption} onPress={() => openCamera(activeField)}><Ionicons name="camera-outline" size={24} color="#333" /><Text style={styles.modalOptionText}>{t('camera')}</Text></TouchableOpacity><View style={styles.modalDivider} /><TouchableOpacity style={styles.modalOption} onPress={() => pickImage(activeField)}><Ionicons name="image-outline" size={24} color="#333" /><Text style={styles.modalOptionText}>{t('gallery')}</Text></TouchableOpacity><Space height={safeAreaInsets.bottom} /></View></View></TouchableWithoutFeedback></Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    navBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#333', textTransform: 'uppercase' },
    progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    progressBar: { flex: 1, height: 6, backgroundColor: '#E9ECEF', borderRadius: 3, marginRight: 12 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 12, color: '#6C757D', fontWeight: '600' },
    scrollContent: { flexGrow: 1, padding: 16 },
    stepTitle: { fontSize: 20, fontWeight: '700', color: '#212529', marginBottom: 4 },
    stepSubtitle: { fontSize: 13, color: '#6C757D', marginBottom: 12 },
    divider: { height: 1, backgroundColor: '#E9ECEF', marginBottom: 16 },
    stepContent: { flex: 1 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 8 },
    textInput: { borderWidth: 1, borderColor: '#CED4DA', backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#212529' },
    dropdown: { borderWidth: 1, borderColor: '#CED4DA', backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 14, height: 48 },
    helperText: { fontSize: 12, color: '#6C757D', marginTop: 12 },
    dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#CED4DA', backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 14, height: 48 },
    dateText: { fontSize: 15, color: '#212529' },
    calendarBox: { backgroundColor: 'white', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#E9ECEF' },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    yearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F5FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    yearBtnText: { fontSize: 14, fontWeight: '600', color: '#246BFD' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    yearPickerBox: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '80%', maxHeight: '60%' },
    yearPickerTitle: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 16 },
    yearItem: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginBottom: 4 },
    yearItemSelected: { backgroundColor: '#246BFD' },
    yearItemText: { fontSize: 16, fontWeight: '500', color: '#333', textAlign: 'center' },
    radioGroup: {},
    radioBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DEE2E6', backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 },
    radioBoxSelected: { borderColor: '#246BFD', backgroundColor: '#F0F5FF' },
    radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ADB5BD', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    radioCircleSelected: { borderColor: '#246BFD' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#246BFD' },
    radioText: { fontSize: 15, color: '#212529', fontWeight: '500' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { backgroundColor: '#F8F9FA', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, margin: 4, borderWidth: 1, borderColor: '#DEE2E6' },
    chipSelected: { backgroundColor: '#F0F5FF', borderColor: '#246BFD' },
    chipText: { fontSize: 14, color: '#495057', fontWeight: '500' },
    chipTextSelected: { color: '#246BFD', fontWeight: '600' },
    segmentChipTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
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
    endorsementLabelSelected: {
        color: '#246BFD',
    },
    endorsementContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridTile: { width: '48%', backgroundColor: 'white', borderRadius: 8, borderWidth: 1.5, borderColor: '#DEE2E6', paddingVertical: 14, paddingHorizontal: 10, marginBottom: 10, alignItems: 'center' },
    gridTileSelected: { borderColor: '#246BFD', backgroundColor: '#F0F5FF' },
    gridTileText: { fontSize: 13, fontWeight: '500', color: '#495057', textAlign: 'center' },
    gridTileTextSelected: { color: '#246BFD', fontWeight: '600' },
    vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vehicleTile: { width: '48%', backgroundColor: 'white', borderRadius: 12, borderWidth: 2, borderColor: '#E9ECEF', padding: 10, marginBottom: 12, alignItems: 'center', position: 'relative' },
    vehicleTileSelected: { borderColor: '#246BFD', backgroundColor: '#F0F5FF' },
    vehicleImage: { width: '100%', height: 60, marginBottom: 4 },
    vehicleLabel: { fontSize: 11, fontWeight: '600', color: '#495057', textAlign: 'center' },
    vehicleCheck: { position: 'absolute', top: 6, right: 6 },
    avatarBox: { width: 140, height: 140, borderRadius: 16, backgroundColor: '#E9ECEF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#DEE2E6', position: 'relative' },
    avatarImage: { width: 140, height: 140, borderRadius: 16 },
    avatarBadge: { position: 'absolute', bottom: -8, right: -8, backgroundColor: '#246BFD', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
    documentBox: { marginBottom: 16 },
    documentPreview: { position: 'relative', borderRadius: 10, overflow: 'hidden' },
    documentImage: { width: '100%', height: 180, borderRadius: 10 },
    documentDelete: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 14 },
    uploadBox: { borderWidth: 2, borderColor: '#DEE2E6', borderStyle: 'dashed', borderRadius: 10, padding: 30, alignItems: 'center', backgroundColor: '#FAFBFC' },
    uploadText: { fontSize: 14, fontWeight: '600', color: '#246BFD', marginTop: 8 },
    uploadHint: { fontSize: 12, color: '#6C757D', marginTop: 4 },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF', backgroundColor: 'white' },
    nextButton: { height: 50, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    nextButtonText: { color: 'white', fontSize: 16, fontWeight: '600', textTransform: 'uppercase' },
    bottomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomModalContent: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 20 },
    modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    modalOptionText: { fontSize: 16, color: '#333', marginLeft: 16, fontWeight: '500' },
    modalDivider: { height: 1, backgroundColor: '#E9ECEF' },
    datePickerBox: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '90%', alignItems: 'center' },
    datePickerTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
    datePickerButtons: { flexDirection: 'row', marginTop: 16 },
    cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 8, marginRight: 8 },
    cancelBtnText: { fontSize: 15, fontWeight: '500', color: '#666' },
    confirmBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    confirmBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
    requiredAsterisk: { color: 'red', fontSize: 13, fontWeight: '600' },
});