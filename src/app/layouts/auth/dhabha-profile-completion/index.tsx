import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    FlatList,
    Switch,
    PermissionsAndroid,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeIn,
    Layout,
} from 'react-native-reanimated';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { userAction, userEditAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { fetchCompleteLocationDetails } from '@truckmitr/src/utils/maps/location/location.detail';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Dhabha Steps
const DHABHA_STEPS = [
    { id: 'basic_info', title: 'basicBusinessInfo', subtitle: 'enterBasicInfo' },
    { id: 'location_details', title: 'locationAddress', subtitle: 'enterLocationDetails' },
    { id: 'operational_details', title: 'operationalDetails', subtitle: 'enterOperationalDetails' },
    { id: 'facilities', title: 'facilitiesAmenities', subtitle: 'selectFacilities' },
    { id: 'food_menu', title: 'foodMenuInfo', subtitle: 'enterFoodDetails' },
    { id: 'photos', title: 'dhabhaPhotos', subtitle: 'uploadPhotos' },
    // { id: 'offers_for_drivers', title: 'offersForDrivers', subtitle: 'addOffersSubtitle' },
];

const MandatoryLabel = ({ text, style }: { text: string, style?: any }) => (
    <Text style={[styles.classicLabel, style]}>
        {text} <Text style={{ color: 'red' }}>*</Text>
    </Text>
);

export default function ProfileCompletionDhabha() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { userEdit, user } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const [activeOfferType, setActiveOfferType] = useState<string | null>(null);

    // Pickers
    const [timePickerOpen, setTimePickerOpen] = useState<{ visible: boolean, type: 'opening' | 'closing' | null }>({ visible: false, type: null });
    const [photoModal, setPhotoModal] = useState<{ visible: boolean, categoryId: string | null }>({ visible: false, categoryId: null });
    const [shopPhotoInstructionModal, setShopPhotoInstructionModal] = useState(false);
    const [establishmentYearPickerOpen, setEstablishmentYearPickerOpen] = useState(false);

    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [statesList, setStatesList] = useState<any[]>([]);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState('');
    const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});
    const [localPhotos, setLocalPhotos] = useState<any>({});

    // Food Menu Section
    const [specialDishes, setSpecialDishes] = useState<string[]>([]);
    const [newDish, setNewDish] = useState('');
    const [priceRangeFrom, setPriceRangeFrom] = useState('');
    const [priceRangeTo, setPriceRangeTo] = useState('');

    // Animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);
    const progressWidth = useSharedValue(0);

    const STEPS = DHABHA_STEPS;

    useEffect(() => {
        const newProgress = ((currentStep + 1) / STEPS.length) * 100;
        progressWidth.value = withSpring(newProgress, { damping: 15, stiffness: 90 });
    }, [currentStep]);

    useEffect(() => {
        contentOpacity.value = 0;
        contentTranslateX.value = 20;
        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateX.value = withSpring(0, { damping: 12 });
    }, [currentStep]);

    useEffect(() => {
        fetchStates();
    }, []);

    // Initialize local photos from Redux if available (for editing existing profile)
    useEffect(() => {
        if (userEdit?.shop_photos) {
            setLocalPhotos(userEdit.shop_photos);
        }
    }, []);

    // Show photo instruction modal when entering photos step
    useEffect(() => {
        if (STEPS[currentStep]?.id === 'photos') {
            setShopPhotoInstructionModal(true);
        }
    }, [currentStep]);

    const fetchStates = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.GETSTATES);
            if (response?.data?.status) {
                setStatesList(response?.data?.data);
            }
        } catch (error) {
            console.error('Error fetching states:', error);
        }
    };

    // Filtered states based on search query
    const filteredStates = useMemo(() => {
        if (!stateSearchQuery.trim()) return statesList;
        return statesList.filter(item =>
            item.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
        );
    }, [statesList, stateSearchQuery]);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));
    const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

    // Helper to update Redux safely
    const updateUser = (key: string, value: any) => {
        dispatch(userEditAction({ ...userEdit, [key]: value }));
    };

    const toggleSelection = (key: string, item: string) => {
        let list = userEdit?.[key] ? [...userEdit[key]] : [];
        if (list.includes(item)) {
            list = list.filter((i: string) => i !== item);
        } else {
            list = [...list, item];
        }
        updateUser(key, list);
    };

    const handlePincodeChange = (pincode: string) => {
        const cleaned = pincode.replace(/[^0-9]/g, '');
        updateUser('pincode', cleaned);

        if (cleaned.length === 6) {
            fetchPincodeDetails(cleaned);
        }
    };

    const handleStateSelect = (state: any) => {
        updateUser('state', state.name);
        setStateModalVisible(false);
    };

    const fetchPincodeDetails = async (pincodeValue: string) => {
        setIsPincodeLoading(true);
        try {
            const response = await axiosInstance.get(`https://api.postalpincode.in/pincode/${pincodeValue}`);
            if (response?.data && response.data[0]?.Status === 'Success') {
                const details = response.data[0].PostOffice[0];
                const district = details.District;
                const state = details.State;

                dispatch(userEditAction({
                    ...userEdit,
                    pincode: pincodeValue,
                    district: district,
                    state: state
                }));
            }
        } catch (error) {
            console.error('Pincode Lookup Error:', error);
        } finally {
            setIsPincodeLoading(false);
        }
    };

    const handleNext = async () => {
        const step = STEPS[currentStep];

        // Basic Validation
        if (step.id === 'basic_info') {
            if (!userEdit?.dhabha_name || !userEdit?.owner_name || !userEdit?.mobile) {
                showToast(t('pleaseEnterAllRequiredDetails'));
                return;
            }
            if (userEdit?.mobile?.length !== 10) {
                showToast(t('enter10DigitMobile'));
                return;
            }

            // Call API for Step 1
            setFinishing(true);
            try {
                const formData = new FormData();
                // formData.append('user_id', user?.id || user?.user_id || '');
                // formData.append('unique_id', user?.unique_id || '');
                formData.append('dhaba_name', userEdit?.dhabha_name || '');
                formData.append('owner_name', userEdit?.owner_name || '');
                formData.append('mobile', userEdit?.mobile || '');
                formData.append('email', userEdit?.email || '');
                formData.append('year_established', userEdit?.establishment_year ? moment(userEdit.establishment_year).format('YYYY') : '');
                formData.append('dhaba_type', userEdit?.dhabha_type || '');

                const response = await axiosInstance.post(END_POINTS.DHABA_BUSSINESS_INFO, formData);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('businessInfoSavedSuccess'));

                    // Store dhaba.id as dhaba_id in Redux state
                    const dhabaId = response?.data?.dhaba?.id;
                    if (dhabaId) {
                        dispatch(userEditAction({
                            ...userEdit,
                            dhaba_id: dhabaId
                        }));
                        // Also store in AsyncStorage
                        await AsyncStorage.setItem('dhaba_id', dhabaId.toString());
                    }

                    // Proceed to next step
                    contentOpacity.value = withTiming(0, { duration: 200 });
                    setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                } else {
                    showToast(response?.data?.message || t('failedToSaveBusinessInfo'));
                }
            } catch (error: any) {
                console.error('Step 1 API Error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || t('somethingWentWrong');
                showToast(errorMessage);
            } finally {
                setFinishing(false);
            }
            return;
        }

        if (step.id === 'location_details') {
            if (!userEdit?.address || !userEdit?.state || !userEdit?.pincode || !userEdit?.district) {
                showToast(t('pleaseEnterAllRequiredDetails'));
                return;
            }
            if (!localLocation?.lat || !localLocation?.lng) {
                showToast(t('pleaseFetchCurrentLocation') || 'Please fetch current location');
                return;
            }

            setFinishing(true);
            try {
                // Find state_id
                const selectedState = statesList.find(s => s.name?.toLowerCase() === userEdit.state?.toLowerCase());
                const state_id = selectedState ? selectedState.id : '';

                const formData = new FormData();
                let dhaba_id = userEdit?.dhaba_id;
                if (!dhaba_id) {
                    dhaba_id = await AsyncStorage.getItem('dhaba_id');
                }
                formData.append('dhaba_id', dhaba_id || '');
                formData.append('full_address', userEdit?.address || '');
                formData.append('landmark', userEdit?.landmark || '');
                formData.append('district', userEdit?.district || '');
                formData.append('state', userEdit?.state || '');
                formData.append('state_id', state_id || '');
                formData.append('pincode', userEdit?.pincode || '');
                formData.append('latitude', localLocation?.lat || '');
                formData.append('longitude', localLocation?.lng || '');
                formData.append('location_source', 'Pinned via GPS');


                // return console.log('formData', formData);

                const response = await axiosInstance.post(END_POINTS.DHABA_BUSSINESS_LOCATION, formData);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('locationDetailsSavedSuccess'));
                    // Proceed to next step
                    contentOpacity.value = withTiming(0, { duration: 200 });
                    setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                } else {
                    showToast(response?.data?.message || t('failedToSaveLocationInfo'));
                }
            } catch (error: any) {
                console.error('Step 2 API Error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || t('somethingWentWrong');
                showToast(errorMessage);
            } finally {
                setFinishing(false);
            }
            return;
        }

        if (step.id === 'facilities') {
            setFinishing(true);
            try {
                const formData = new FormData();
                let dhaba_id = userEdit?.dhaba_id;
                if (!dhaba_id) {
                    dhaba_id = await AsyncStorage.getItem('dhaba_id');
                }
                formData.append('dhaba_id', dhaba_id || '');
                formData.append('sitting_facility', userEdit?.sitting_facility ? '1' : '0');
                formData.append('clean_restrooms', userEdit?.clean_restrooms ? '1' : '0');
                formData.append('drinking_water', userEdit?.drinking_water ? '1' : '0');
                formData.append('parking_small', userEdit?.parking_small ? '1' : '0');
                formData.append('parking_large', userEdit?.parking_large ? '1' : '0');
                formData.append('sleeping_area', userEdit?.sleeping_area ? '1' : '0');
                formData.append('washing_area', userEdit?.washing_area ? '1' : '0');
                formData.append('electric_point', userEdit?.electric_point ? '1' : '0');
                formData.append('cctv', userEdit?.cctv ? '1' : '0');
                formData.append('security_staff', userEdit?.security_staff ? '1' : '0');
                formData.append('wheel_alignment', userEdit?.wheel_alignment ? '1' : '0');
                formData.append('mechanic', userEdit?.mechanic ? '1' : '0');

                const response = await axiosInstance.post(END_POINTS.DHABA_FACILITIES, formData);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('facilitiesSavedSuccess') || "Facilities saved!");
                    contentOpacity.value = withTiming(0, { duration: 200 });
                    setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                } else {
                    showToast(response?.data?.message || t('failedToSaveFacilities'));
                }
            } catch (error: any) {
                console.error('Step 4 API Error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || t('somethingWentWrong');
                showToast(errorMessage);
            } finally {
                setFinishing(false);
            }
            return;
        }
        if (step.id === 'operational_details') {
            const newErrors: { [key: string]: string } = {};

            if (!userEdit?.is_24x7) {
                if (!userEdit?.opening_time) {
                    newErrors.opening_time = t('openingTimeRequired') || "Opening time is required";
                }
                if (!userEdit?.closing_time) {
                    newErrors.closing_time = t('closingTimeRequired') || "Closing time is required";
                }
                if (userEdit?.opening_time && userEdit?.closing_time) {
                    const openTimeStr = moment(userEdit.opening_time).format('HH:mm');
                    const closeTimeStr = moment(userEdit.closing_time).format('HH:mm');

                    if (openTimeStr === closeTimeStr) {
                        newErrors.closing_time = t('timesCannotBeSame') || "Opening and closing times cannot be the same";
                    }
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setStepErrors(newErrors);
                return;
            }
            setStepErrors({}); // Clear errors

            setFinishing(true);
            try {
                const formData = new FormData();
                let dhaba_id = userEdit?.dhaba_id;
                if (!dhaba_id) {
                    dhaba_id = await AsyncStorage.getItem('dhaba_id');
                }
                formData.append('dhaba_id', dhaba_id || '');
                formData.append('is_24x7', userEdit?.is_24x7 ? '1' : '0');
                // Only send opening/closing times if not 24x7
                if (!userEdit?.is_24x7) {
                    formData.append('opening_time', userEdit?.opening_time ? moment(userEdit.opening_time).format('HH:mm') : '');
                    formData.append('closing_time', userEdit?.closing_time ? moment(userEdit.closing_time).format('HH:mm') : '');
                }
                formData.append('peak_hours', userEdit?.peak_hours || '');
                formData.append('avg_wait_time', "15-20 mins");
                console.log('formData', formData);

                const response = await axiosInstance.post(END_POINTS.DHABA_OPERATIONAL_DETAILS, formData);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('operationalDetailsSavedSuccess') || "Operational details saved!");
                    // Proceed to next step
                    contentOpacity.value = withTiming(0, { duration: 200 });
                    setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                } else {
                    showToast(response?.data?.message || t('failedToSaveOperationalInfo'));
                }
            } catch (error: any) {
                console.error('Step 3 API Error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || t('somethingWentWrong');
                showToast(errorMessage);
            } finally {
                setFinishing(false);
            }
            return;
        }

        if (step.id === 'food_menu') {
            // Validation
            if (!userEdit?.food_type || userEdit?.food_type?.length === 0) {
                showToast(t('pleaseSelectFoodType') || 'Please select food type');
                return;
            }
            if (!userEdit?.meal_availability || userEdit?.meal_availability?.length === 0) {
                showToast(t('pleaseSelectMealAvailability') || 'Please select meal availability');
                return;
            }
            // Validate price range - from should be lower than to
            if (priceRangeFrom && priceRangeTo && parseInt(priceRangeFrom) >= parseInt(priceRangeTo)) {
                showToast(t('priceRangeFromMustBeLower') || 'Price range "from" must be lower than "to"');
                return;
            }

            setFinishing(true);
            try {
                const formData = new FormData();
                let dhaba_id = userEdit?.dhaba_id;
                if (!dhaba_id) {
                    dhaba_id = await AsyncStorage.getItem('dhaba_id');
                }
                formData.append('dhaba_id', dhaba_id || '');

                // Food type - convert to API format and append as array
                const foodTypeValue = userEdit?.food_type || [];
                let apiFood: string[] = [];
                if (foodTypeValue.includes('Veg Only')) apiFood.push('Veg');
                if (foodTypeValue.includes('Non-Veg Only')) apiFood.push('Non-Veg');
                if (foodTypeValue.includes('Both Veg & Non-Veg')) apiFood = ['Veg', 'Non-Veg'];
                // Append each food type individually for proper array handling
                apiFood.forEach(item => formData.append('food_type[]', item));

                // Special dishes - join array with comma
                formData.append('special_dishes', specialDishes.join(', '));

                // Meal availability
                const meals = userEdit?.meal_availability || [];
                formData.append('meal_breakfast', meals.includes('Breakfast') ? 1 : 0);
                formData.append('meal_lunch', meals.includes('Lunch') ? 1 : 0);
                formData.append('meal_dinner', meals.includes('Dinner') ? 1 : 0);
                formData.append('meal_night', meals.includes('Late Night') ? 1 : 0);

                // Average price range
                const avgPriceRange = priceRangeFrom && priceRangeTo ? `₹${priceRangeFrom}-₹${priceRangeTo}` : '';
                formData.append('avg_price_range', avgPriceRange);
                console.log('formData', formData);

                const response = await axiosInstance.post(END_POINTS.DHABA_FOOD, formData);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('foodMenuSavedSuccess') || 'Food menu saved!');
                    contentOpacity.value = withTiming(0, { duration: 200 });
                    setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                } else {
                    showToast(response?.data?.message || t('failedToSaveFoodMenu') || 'Failed to save food menu');
                }
            } catch (error: any) {
                console.error('Food Menu API Error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || t('somethingWentWrong');
                showToast(errorMessage);
            } finally {
                setFinishing(false);
            }
            return;
        }

        // Photos Step Handler
        if (step.id === 'photos') {
            const allPhotos = localPhotos?.all_photos || [];

            // Check if at least one photo is uploaded
            if (!allPhotos || allPhotos.length === 0) {
                showToast(t('pleaseUploadAtLeastOnePhoto') || 'Please upload at least one photo');
                return;
            }

            setFinishing(true);
            try {
                const formData = new FormData();
                let dhaba_id = userEdit?.dhaba_id;
                if (!dhaba_id) {
                    dhaba_id = await AsyncStorage.getItem('dhaba_id');
                }
                formData.append('dhaba_id', dhaba_id || '');

                // New Payload Structure
                formData.append('category', 'Interior'); // As requested
                formData.append('ordering_priority', '1');
                formData.append('upload_date', moment().format('YYYY-MM-DD'));

                // Append all photos using key 'image_url[]' as requested
                allPhotos.forEach((photoUri: string, idx: number) => {
                    const fileName = `dhaba_photo_${idx}_${Date.now()}.jpg`;
                    formData.append(`image_url[${idx}]`, {
                        uri: photoUri,
                        type: 'image/jpeg',
                        name: fileName,
                    } as any);
                });

                console.log('formData photos', formData);
                const response = await axiosInstance.post(END_POINTS.DHABA_PHOTO_UPLOAD, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('photosSavedSuccess') || 'Photos saved successfully!');
                    contentOpacity.value = withTiming(0, { duration: 200 });
                    setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                } else {
                    showToast(response?.data?.message || t('failedToSavePhotos') || 'Failed to save photos');
                }
            } catch (error: any) {
                console.error('Photos API Error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || t('somethingWentWrong');
                showToast(errorMessage);
            } finally {
                setFinishing(false);
            }
            return;
        }

        if (currentStep < STEPS.length - 1) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev + 1), 200);
        } else {
            submitProfile();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev - 1), 200);
        } else {
            navigation.goBack();
        }
    };

    const submitProfile = async () => {
        setFinishing(true);
        try {
            // Reconstruct payload as per API needs
            const formData = new FormData();

            // Map Redux state to FormData
            const fields = [
                'dhabha_name', 'owner_name', 'mobile', 'email', 'establishment_year', 'dhabha_type',
                'address', 'landmark', 'state', 'district', 'pincode', 'latitude', 'longitude',
                'peak_hours', 'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'upi_id', 'special_dishes'
            ];

            fields.forEach(field => {
                if (userEdit?.[field]) formData.append(field, userEdit[field]);
            });

            // Times
            if (userEdit?.opening_time) formData.append('opening_time', moment(userEdit.opening_time).format('HH:mm'));
            if (userEdit?.closing_time) formData.append('closing_time', moment(userEdit.closing_time).format('HH:mm'));
            formData.append('is_24x7', userEdit?.is_24x7 ? '1' : '0');

            // Arrays
            if (userEdit?.facilities) formData.append('facilities', JSON.stringify(userEdit.facilities));
            if (userEdit?.food_type) formData.append('food_type', JSON.stringify(userEdit.food_type));
            if (userEdit?.meal_availability) formData.append('meal_availability', JSON.stringify(userEdit.meal_availability));

            console.log('Submitting Profile:', formData);

            // SIMULATED API CALL
            // const response = await axiosInstance.post(END_POINTS.EDIT_PROFILE, formData);

            setTimeout(() => {
                setFinishing(false);
                showToast(t('profileSubmittedSuccess'));
                dispatch(userAuthenticatedAction(true));
                navigation.navigate(STACKS.DHABHA_BOTTOM as any);
            }, 1500);

        } catch (error: any) {
            setFinishing(false);
            showToast(error?.message || "Failed to submit profile");
        }
    };
    const [locationWarningModalVisible, setLocationWarningModalVisible] = useState(false);
    const [localLocation, setLocalLocation] = useState<{ lat: string, lng: string, address: string } | null>(null);

    // --- Handlers ---
    const handlePickImage = (source: 'camera' | 'gallery') => {
        if (!photoModal.categoryId) return;

        const isCamera = source === 'camera';
        const commonOptions = {
            width: 1000,
            height: 1000,
            compressImageQuality: 0.8,
            mediaType: 'photo' as const,
            cropping: false,
        };

        const pickerAction = isCamera
            ? ImagePicker.openCamera(commonOptions)
            : ImagePicker.openPicker({ ...commonOptions, multiple: true, maxFiles: 7 });

        pickerAction.then((response: any) => {
            const images = Array.isArray(response) ? response : [response];

            setLocalPhotos((prev: any) => {
                const currentPhotos = prev?.[photoModal.categoryId!] || [];
                const newPhotoPaths = images.map((img: any) => img.path);

                if (currentPhotos.length + newPhotoPaths.length > 7) {
                    showToast(t('youCanAddOnly7Photos') || "You can add only 7 photos");
                    return prev;
                }

                const updatedCategoryPhotos = [...currentPhotos, ...newPhotoPaths];

                return {
                    ...prev,
                    [photoModal.categoryId!]: updatedCategoryPhotos
                };
            });

            setPhotoModal({ visible: false, categoryId: null });
        }).catch(err => {
            if (err?.code !== 'E_PICKER_CANCELLED') {
                console.warn('ImagePicker Error:', err);
                showToast(t('errorPickingImage') || "Error picking image");
            }
            setPhotoModal({ visible: false, categoryId: null });
        });
    };

    const removePhoto = (categoryId: string, index: number) => {
        const currentPhotos = { ...userEdit?.dhabha_photos };
        if (currentPhotos[categoryId]) {
            const updated = [...currentPhotos[categoryId]];
            updated.splice(index, 1);
            currentPhotos[categoryId] = updated;
            updateUser('dhabha_photos', currentPhotos);
        }
    };

    // GPS Location Functions
    const requestLocationPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: t('locationPermission') || 'Location Permission',
                    message: t('locationPermissionMessage') || 'We need access to your location to pin your dhaba on the map.',
                    buttonPositive: t('ok') || 'OK',
                    buttonNegative: t('cancel') || 'Cancel',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    };

    const getCurrentLocation = async () => {
        setFetchingLocation(true);
        console.log('Fetching location...');
        try {
            const locationData = await fetchCompleteLocationDetails();
            console.log('Location Data:', locationData);

            if (locationData && locationData.coords) {
                const { latitude, longitude } = locationData.coords;
                // setTempMarker({ latitude, longitude }); // Not using tempMarker here for direct fetch

                // Fix: Dispatch both updates together to avoid state overwrite due to closure staleness
                /* dispatch(userEditAction({
                    ...userEdit,
                    latitude: latitude.toString(),
                    longitude: longitude.toString()
                })); */

                if (locationData.displayName) {
                    // updateUser('address', locationData.displayName); // Don't auto-fill main address
                }

                setLocalLocation({
                    lat: latitude.toString(),
                    lng: longitude.toString(),
                    address: locationData.displayName || ''
                });

                showToast(t('locationFetchedSuccess') || 'Location fetched successfully!');
            } else {
                showToast(t('failedToGetLocation') || 'Failed to get location. Please try again.');
            }
        } catch (error) {
            console.error('GPS Error:', error);
            showToast(t('failedToGetLocation') || 'Failed to get location. Please try again.');
        } finally {
            setFetchingLocation(false);
        }
    };

    const openMapWithCurrentLocation = async () => {
        setFetchingLocation(true);
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            setFetchingLocation(false);
            showToast(t('locationPermissionDenied') || 'Location permission denied');
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setTempMarker({ latitude, longitude });
                setFetchingLocation(false);
                setMapModalVisible(true);
            },
            (error) => {
                console.error('GPS Error:', error);
                setFetchingLocation(false);
                // Open map with default India center if GPS fails
                setTempMarker({ latitude: 20.5937, longitude: 78.9629 });
                setMapModalVisible(true);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000
            }
        );
    };

    const confirmMapLocation = () => {
        if (tempMarker) {
            updateUser('latitude', tempMarker.latitude.toString());
            updateUser('longitude', tempMarker.longitude.toString());
            showToast(t('locationPinnedSuccess') || 'Location pinned successfully!');
        }
        setMapModalVisible(false);
    };

    // --- Step Renderers ---


    const renderBasicInfo = () => (
        <View style={styles.stepContainer}>
            <MandatoryLabel text={t('dhabhaName')} />
            <TextInput
                style={styles.classicInput}
                placeholder="e.g. Sher-e-Punjab Dhaba"
                placeholderTextColor="#999"
                value={userEdit?.dhabha_name}
                onChangeText={(text) => updateUser('dhabha_name', text)}
            />

            <Space height={16} />
            <MandatoryLabel text={t('ownerName')} />
            <TextInput
                style={styles.classicInput}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={userEdit?.owner_name}
                onChangeText={(text) => updateUser('owner_name', text)}
            />

            <Space height={16} />
            <MandatoryLabel text={t('mobileNumber')} />
            <TextInput
                style={[styles.classicInput, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                placeholder="10-digit number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                value={userEdit?.mobile}
                editable={false}
            />

            <Space height={16} />
            <Text style={styles.classicLabel}>{t('emailID')} <Text style={styles.optionalText}>({t('optional')})</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="email@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={userEdit?.email}
                onChangeText={(text) => updateUser('email', text)}
            />

            <Space height={16} />
            <Text style={styles.classicLabel}>{t('yearOfEstablishment')} <Text style={styles.optionalText}>({t('optional')})</Text></Text>
            <TouchableOpacity
                style={styles.datetimeBox}
                onPress={() => setEstablishmentYearPickerOpen(true)}
            >
                <Text style={styles.datetimeText}>
                    {userEdit?.establishment_year
                        ? moment(userEdit.establishment_year).format('DD MMM YYYY')
                        : t('selectDate')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.royalBlue} />
            </TouchableOpacity>

            <Space height={16} />
            <Text style={styles.classicLabel}>{t('dhabhaType')} <Text style={styles.optionalText}>({t('selectOne')})</Text></Text>
            <View style={styles.chipsRow}>
                {[
                    { key: 'Highway Dhaba', label: t('highwayDhaba') },
                    { key: '24x7 Dhaba', label: t('twentyFourSevenDhaba') },
                    { key: 'Family Dhaba', label: t('familyDhaba') },
                    { key: 'Veg Dhaba', label: t('vegDhaba') }
                ].map(type => (
                    <TouchableOpacity
                        key={type.key}
                        style={[styles.chip, userEdit?.dhabha_type === type.key && styles.chipSelected]}
                        onPress={() => updateUser('dhabha_type', type.key)}
                    >
                        <Text style={[styles.chipText, userEdit?.dhabha_type === type.key && styles.chipTextSelected]}>{type.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>


        </View>
    );

    const renderLocationDetails = () => (
        <View style={styles.stepContainer}>
            <MandatoryLabel text={t('fullAddress')} />
            <TextInput
                style={[styles.classicInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder="Shop No, Road, Area, City..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={userEdit?.address}
                onChangeText={(text) => updateUser('address', text)}
            />

            <Space height={16} />
            <Text style={styles.classicLabel}>{t('landmark')} <Text style={styles.optionalText}>({t('optional')})</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="Near..."
                placeholderTextColor="#999"
                value={userEdit?.landmark}
                onChangeText={(text) => updateUser('landmark', text)}
            />

            <Space height={16} />

            {/* Pincode & District & State Section */}
            <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                    <MandatoryLabel text={t('pincode')} />
                    <View style={{ position: 'relative' }}>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="000000"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            maxLength={6}
                            value={userEdit?.pincode}
                            onChangeText={handlePincodeChange}
                        />
                        {isPincodeLoading && (
                            <ActivityIndicator
                                size="small"
                                color={colors.royalBlue}
                                style={{ position: 'absolute', right: 10, top: 15 }}
                            />
                        )}
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <MandatoryLabel text={t('district')} />
                    <TextInput
                        style={[styles.classicInput, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                        placeholder={t('district')}
                        placeholderTextColor="#999"
                        value={userEdit?.district}
                        editable={false}
                    />
                </View>
            </View>

            <Space height={16} />
            <MandatoryLabel text={t('state')} />
            <TextInput
                style={[styles.classicInput, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                placeholder={t('state')}
                placeholderTextColor="#999"
                value={userEdit?.state}
                editable={false}
            />

            <Space height={24} />

            {/* GPS Location Section */}
            <Space height={16} />
            <Text style={styles.classicLabel}>{t('pinYourLocation') || 'Pin Your Location'}</Text>

            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.royalBlue,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginTop: 8
                }}
                activeOpacity={0.8}
                onPress={() => setLocationWarningModalVisible(true)}
                disabled={fetchingLocation}
            >
                {fetchingLocation ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <>
                        <Ionicons name="location" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                            {t('fetchCurrentLocation') || 'Fetch Current Location'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {localLocation && (
                <View style={[styles.gpsInfoBox, { marginTop: 12 }]}>
                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.gpsTextTitle}>{t('locationPinned') || 'Location Pinned'}</Text>
                        <Text style={styles.gpsTextCoords}>
                            {parseFloat(localLocation.lat).toFixed(6)}, {parseFloat(localLocation.lng).toFixed(6)}
                        </Text>
                        {localLocation.address ? (
                            <View style={{ marginTop: 4 }}>
                                <Text style={[styles.gpsTextCoords, { fontWeight: '700', color: '#16A34A' }]}>
                                    {t('currentAccessedLocation') || 'Current Accessed Location:'}
                                </Text>
                                <Text style={[styles.gpsTextCoords, { height: 'auto' }]} numberOfLines={2}>
                                    {localLocation.address}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={() => {
                        updateUser('latitude', '');
                        updateUser('longitude', '');
                        setLocalLocation(null);
                    }}>
                        <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}


        </View>
    );

    const renderOperationalDetails = () => (
        <View style={styles.stepContainer}>
            <View style={styles.switchRow}>
                <View>
                    <Text style={styles.classicLabel}>{t('isOpen24x7')}</Text>
                    <Text style={styles.helperText}>{t('allDayServiceAvailability')}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => updateUser('is_24x7', !userEdit?.is_24x7)}
                >
                    <MaterialCommunityIcons
                        name={userEdit?.is_24x7 ? "toggle-switch" : "toggle-switch-off-outline"}
                        size={48}
                        color={userEdit?.is_24x7 ? colors.royalBlue : '#ccc'}
                    />
                </TouchableOpacity>
            </View>

            {!userEdit?.is_24x7 && (
                <Animated.View entering={FadeIn} layout={Layout.springify()}>
                    <Space height={20} />
                    <View style={styles.rowGap}>
                        <View style={{ flex: 1 }}>
                            <MandatoryLabel text={t('openingTime')} />
                            <TouchableOpacity
                                style={[styles.datetimeBox, stepErrors.opening_time ? { borderColor: '#FF5252' } : {}]}
                                onPress={() => setTimePickerOpen({ visible: true, type: 'opening' })}
                            >
                                <Text style={styles.datetimeText}>
                                    {userEdit?.opening_time ? moment(userEdit.opening_time).format('hh:mm A') : '00:00'}
                                </Text>
                                <Ionicons name="time-outline" size={20} color={colors.royalBlue} />
                            </TouchableOpacity>
                            {stepErrors.opening_time && <Text style={styles.errorTextSmall}>{stepErrors.opening_time}</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                            <MandatoryLabel text={t('closingTime')} />
                            <TouchableOpacity
                                style={[styles.datetimeBox, stepErrors.closing_time ? { borderColor: '#FF5252' } : {}]}
                                onPress={() => setTimePickerOpen({ visible: true, type: 'closing' })}
                            >
                                <Text style={styles.datetimeText}>
                                    {userEdit?.closing_time ? moment(userEdit.closing_time).format('hh:mm A') : '00:00'}
                                </Text>
                                <Ionicons name="time-outline" size={20} color={colors.royalBlue} />
                            </TouchableOpacity>
                            {stepErrors.closing_time && <Text style={styles.errorTextSmall}>{stepErrors.closing_time}</Text>}
                        </View>
                    </View>
                </Animated.View>
            )}

            <Space height={24} />
            <Text style={styles.classicLabel}>{t('peakHours')} <Text style={styles.optionalText}>({t('optional')})</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="e.g. 12 PM - 3 PM, 8 PM - 11 PM"
                placeholderTextColor="#999"
                value={userEdit?.peak_hours}
                onChangeText={(text) => updateUser('peak_hours', text)}
            />
        </View>
    );

    const renderFacilities = () => {
        const facilitiesList = [
            { id: 'sitting_facility', label: t('sitting_facility'), key: 'sitting_facility' },
            { id: 'clean_restrooms', label: t('clean_restrooms'), key: 'clean_restrooms' },
            { id: 'drinking_water', label: t('drinking_water'), key: 'drinking_water' },
            { id: 'parking_small', label: t('parking_small'), key: 'parking_small' },
            { id: 'parking_large', label: t('parking_large'), key: 'parking_large' },
            { id: 'sleeping_area', label: t('sleeping_area'), key: 'sleeping_area' },
            { id: 'washing_area', label: t('washing_area'), key: 'washing_area' },
            { id: 'electric_point', label: t('electric_point'), key: 'electric_point' },
            { id: 'cctv', label: t('cctv'), key: 'cctv' },
            { id: 'security_staff', label: t('security_staff'), key: 'security_staff' },
            { id: 'wheel_alignment', label: t('wheel_alignment'), key: 'wheel_alignment' },
            { id: 'mechanic', label: t('mechanic'), key: 'mechanic' },
        ];

        const renderFacilityItem = (item: any) => {
            const isSelected = !!userEdit?.[item.key];
            return (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                    onPress={() => updateUser(item.key, !isSelected)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
            );
        };

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.classicLabel}>{t('selectAvailableFacilities')}</Text>
                <Text style={[styles.helperText, { marginBottom: 15 }]}>{t('selectAllThatApply')}</Text>

                <View style={styles.gridContainer}>
                    {facilitiesList.map(renderFacilityItem)}
                </View>

            </View>
        );
    };

    const renderFoodMenu = () => (
        <View style={styles.stepContainer}>
            <MandatoryLabel text={t('foodType')} />
            <View style={styles.chipsRow}>
                {[
                    { key: 'Veg Only', label: t('vegOnly') },
                    { key: 'Non-Veg Only', label: t('nonVegOnly') },
                    { key: 'Both Veg & Non-Veg', label: t('bothVegNonVeg') }
                ].map(type => (
                    <TouchableOpacity
                        key={type.key}
                        style={[styles.chip, userEdit?.food_type?.includes(type.key) && styles.chipSelected]}
                        onPress={() => updateUser('food_type', [type.key])}
                    >
                        <Text style={[styles.chipText, userEdit?.food_type?.includes(type.key) && styles.chipTextSelected]}>{type.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Space height={24} />
            <MandatoryLabel text={t('mealAvailability')} />
            <View style={styles.chipsRow}>
                {[
                    { key: 'Breakfast', label: t('breakfast') },
                    { key: 'Lunch', label: t('lunch') },
                    { key: 'Dinner', label: t('dinner') },
                    { key: 'Late Night', label: t('lateNight') }
                ].map(meal => (
                    <TouchableOpacity
                        key={meal.key}
                        style={[styles.chip, userEdit?.meal_availability?.includes(meal.key) && styles.chipSelected]}
                        onPress={() => toggleSelection('meal_availability', meal.key)}
                    >
                        <Text style={[styles.chipText, userEdit?.meal_availability?.includes(meal.key) && styles.chipTextSelected]}>{meal.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Space height={24} />
            <Text style={styles.classicLabel}>{t('avgPriceRange')} <Text style={styles.optionalText}>({t('optional')})</Text></Text>
            <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={styles.classicInput}
                        placeholder="₹100"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={priceRangeFrom}
                        onChangeText={(text) => setPriceRangeFrom(text.replace(/[^0-9]/g, ''))}
                        maxLength={5}
                    />
                </View>
                <Text style={{ alignSelf: 'center', marginHorizontal: 10, fontSize: 16, color: '#666' }}>to</Text>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={styles.classicInput}
                        placeholder="₹300"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={priceRangeTo}
                        onChangeText={(text) => setPriceRangeTo(text.replace(/[^0-9]/g, ''))}
                        maxLength={5}
                    />
                </View>
            </View>

            <Space height={24} />
            <Text style={styles.classicLabel}>{t('specialDishes')} <Text style={styles.optionalText}>({t('recommended')})</Text></Text>
            <View style={styles.dishInputRow}>
                <TextInput
                    style={[styles.classicInput, { flex: 1, marginRight: 10, marginBottom: 0 }]}
                    placeholder={t('enterDishName') || "Enter dish name"}
                    placeholderTextColor="#999"
                    value={newDish}
                    onChangeText={setNewDish}
                    onSubmitEditing={() => {
                        if (newDish.trim()) {
                            setSpecialDishes([...specialDishes, newDish.trim()]);
                            setNewDish('');
                        }
                    }}
                />
                <TouchableOpacity
                    style={styles.addDishButton}
                    onPress={() => {
                        if (newDish.trim()) {
                            setSpecialDishes([...specialDishes, newDish.trim()]);
                            setNewDish('');
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>
            {specialDishes.length > 0 && (
                <View style={styles.dishChipsContainer}>
                    {specialDishes.map((dish, index) => (
                        <View key={index} style={styles.dishChip}>
                            <Text style={styles.dishChipText}>{dish}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    const updated = [...specialDishes];
                                    updated.splice(index, 1);
                                    setSpecialDishes(updated);
                                }}
                                style={styles.removeDishButton}
                            >
                                <Ionicons name="close-circle" size={18} color="#666" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderPhotos = () => {
        const categoryId = 'all_photos';
        const photos = localPhotos?.[categoryId] || [];

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.classicLabel}>{t('dhabhaPhotos') || 'Dhaba Photos'}</Text>
                <Text style={[styles.helperText, { marginBottom: 20 }]}>
                    {t('uploadPhotosHelper') || 'Upload photos of your dhaba to attract more drivers'}
                </Text>

                <TouchableOpacity
                    style={{
                        backgroundColor: '#F5F9FF',
                        borderWidth: 1.5,
                        borderColor: '#246BFD',
                        borderStyle: 'dashed',
                        borderRadius: 16,
                        height: 120,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20
                    }}
                    activeOpacity={0.7}
                    onPress={() => setPhotoModal({ visible: true, categoryId: categoryId })}
                >
                    <Ionicons name="cloud-upload-outline" size={40} color="#246BFD" />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#246BFD', marginTop: 10 }}>{t('tapToUpload') || 'Tap to Upload'}</Text>
                </TouchableOpacity>

                {photos.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {photos.map((uri: string, idx: number) => (
                            <View key={uri} style={{ position: 'relative', width: '31%', aspectRatio: 1, marginBottom: 10 }}>
                                <FastImage
                                    source={{ uri }}
                                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                />
                                <TouchableOpacity
                                    style={styles.removePhotoBtn}
                                    onPress={() => {
                                        const updatedList = photos.filter((_: string, i: number) => i !== idx);
                                        setLocalPhotos({ ...localPhotos, [categoryId]: updatedList });
                                    }}
                                >
                                    <Ionicons name="close" size={12} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <Modal visible={shopPhotoInstructionModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
                            <View style={{ backgroundColor: '#F8F9FA', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0EAFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="camera" size={32} color="#246BFD" />
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>{t('photoRequirements') || 'Photo Requirements'}</Text>
                                <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>{t('photoGuidelinesSub') || 'Follow these guidelines for best results'}</Text>
                            </View>

                            <View style={{ padding: 25, width: '100%' }}>
                                {[
                                    t('photoDhabhaFront') || 'Dhaba front view',
                                    t('photoSeatingArea') || 'Seating area',
                                    t('photoKitchen') || 'Kitchen area',
                                    t('photoFoodItems') || 'Popular food items',
                                    t('photoParkingArea') || 'Parking area'
                                ].map((item, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ marginRight: 12 }} />
                                        <Text style={{ fontSize: 15, color: '#333', fontWeight: '500' }}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={{ padding: 20, width: '100%', borderTopWidth: 1, borderTopColor: '#eee' }}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { marginTop: 0, width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' }]}
                                    onPress={() => setShopPhotoInstructionModal(false)}
                                >
                                    <Text style={styles.modalBtnText}>{t('gotItUpload') || 'Got it, let me upload'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    };

    const renderOffers = () => {
        const offerTypes = [
            { id: 'discount_offer', label: t('discountOffer'), icon: 'cash-outline', subtitle: t('percentOrRupeeReduction') },
            { id: 'combo_deal', label: t('comboDeal'), icon: 'restaurant-outline', subtitle: 'e.g. 4 Drivers @ ₹99' },
            { id: 'group_offer', label: t('groupOffer'), icon: 'people-outline', subtitle: t('forDriverGroups') },
            { id: 'free_facility', label: t('freeFacility'), icon: 'gift-outline', subtitle: t('freeAmenities') },
            { id: 'time_offer', label: t('timeBasedOffer'), icon: 'time-outline', subtitle: t('limitedHours') },
            { id: 'custom_offer', label: t('customOffer'), icon: 'create-outline', subtitle: t('personalized') },
        ];

        const selectedOffers = userEdit?.driver_offers || [];
        const currentOfferDetails = userEdit?.offer_details || {};

        const toggleOffer = (offerId: string) => {
            if (activeOfferType === offerId) {
                setActiveOfferType(null);
            } else {
                setActiveOfferType(offerId);
                if (!selectedOffers.includes(offerId)) {
                    const newOffers = [...selectedOffers, offerId];
                    updateUser('driver_offers', newOffers);

                    if (!currentOfferDetails[offerId]) {
                        updateUser('offer_details', {
                            ...currentOfferDetails,
                            [offerId]: { visible: true, title: '', description: '' }
                        });
                    }
                }
            }
        };

        const updateOfferDetails = (offerId: string, updates: any) => {
            const newDetails = {
                ...currentOfferDetails,
                [offerId]: {
                    ...currentOfferDetails[offerId],
                    ...updates,
                },
            };
            updateUser('offer_details', newDetails);
        };

        // Helper to get subtitle (summary)
        const getOfferSubtitle = (offerId: string) => {
            if (!selectedOffers.includes(offerId)) {
                return offerTypes.find(o => o.id === offerId)?.subtitle;
            }
            const details = currentOfferDetails[offerId] || {};
            switch (offerId) {
                case 'discount_offer':
                    if (details.value) {
                        const type = details.discount_type === 'amount' ? '₹' : '%';
                        return `${details.value}${type} Off${details.min_bill ? ' *' : ''}`;
                    }
                    return 'Discount Added';
                case 'combo_deal':
                    if (details.title && details.title.length > 3) return details.title;
                    if (details.num_drivers && details.price) return `${details.num_drivers} Drivers @ ₹${details.price}`;
                    return 'Combo Added';
                case 'time_offer':
                    return details.title || 'Time Offer Active';
                default:
                    return details.title || 'Offer Added';
            }
        };

        const renderOfferForm = (typeId: string) => {
            const details = currentOfferDetails[typeId] || {};

            switch (typeId) {
                case 'combo_deal':
                    return (
                        <View>
                            <Text style={styles.inputLabel}>{t('comboTitle')}</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.classicInput}
                                    placeholder="e.g. 4 Drivers Combo @ ₹99"
                                    placeholderTextColor="#999"
                                    value={details.title}
                                    onChangeText={(t) => updateOfferDetails(typeId, { title: t })}
                                />
                                {(!details.title || details.title.length < 5) && (
                                    <TouchableOpacity
                                        style={styles.suggestionPill}
                                        onPress={() => updateOfferDetails(typeId, { title: '4 Drivers Combo @ ₹99' })}
                                    >
                                        <Text style={styles.suggestionText}>Auto-suggest: 4 Drivers @ ₹99</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Space height={12} />
                            <View style={styles.rowGap}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>{t('numDrivers')}</Text>
                                    <TextInput
                                        style={styles.classicInput}
                                        placeholder="4"
                                        keyboardType="numeric"
                                        placeholderTextColor="#999"
                                        value={details.num_drivers}
                                        onChangeText={(t) => updateOfferDetails(typeId, { num_drivers: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>{t('price')} (₹)</Text>
                                    <TextInput
                                        style={styles.classicInput}
                                        placeholder="99"
                                        keyboardType="numeric"
                                        placeholderTextColor="#999"
                                        value={details.price}
                                        onChangeText={(t) => updateOfferDetails(typeId, { price: t })}
                                    />
                                </View>
                            </View>

                            <Space height={12} />
                            <Text style={styles.inputLabel}>{t('details')}</Text>
                            <TextInput
                                style={[styles.classicInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                                placeholder="Describe the meal..."
                                multiline
                                placeholderTextColor="#999"
                                value={details.description}
                                onChangeText={(t) => updateOfferDetails(typeId, { description: t })}
                            />
                        </View>
                    );

                case 'discount_offer':
                    return (
                        <View>
                            <View style={styles.rowGap}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>{t('type')}</Text>
                                    <View style={styles.segmentControl}>
                                        <TouchableOpacity
                                            style={[styles.segmentBtn, details.discount_type !== 'amount' && styles.segmentBtnActive]}
                                            onPress={() => updateOfferDetails(typeId, { discount_type: 'percent' })}
                                        >
                                            <Text style={[styles.segmentText, details.discount_type !== 'amount' && styles.segmentTextActive]}>%</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segmentBtn, details.discount_type === 'amount' && styles.segmentBtnActive]}
                                            onPress={() => updateOfferDetails(typeId, { discount_type: 'amount' })}
                                        >
                                            <Text style={[styles.segmentText, details.discount_type === 'amount' && styles.segmentTextActive]}>₹</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>{t('value')}</Text>
                                    <TextInput
                                        style={styles.classicInput}
                                        placeholder={details.discount_type === 'amount' ? "50" : "10"}
                                        keyboardType="numeric"
                                        placeholderTextColor="#999"
                                        value={details.value}
                                        onChangeText={(t) => updateOfferDetails(typeId, { value: t })}
                                    />
                                </View>
                            </View>

                            <Space height={12} />
                            <Text style={styles.inputLabel}>{t('minimumBillAmount')} ({t('optional')})</Text>
                            <TextInput
                                style={styles.classicInput}
                                placeholder="e.g. 500"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                                value={details.min_bill}
                                onChangeText={(t) => updateOfferDetails(typeId, { min_bill: t })}
                            />
                        </View>
                    );

                default:
                    return (
                        <View>
                            <Text style={styles.inputLabel}>{t('offerTitle')}</Text>
                            <TextInput
                                style={styles.classicInput}
                                placeholder={`Enter ${offerTypes.find(o => o.id === typeId)?.label}`}
                                placeholderTextColor="#999"
                                value={details.title}
                                onChangeText={(t) => updateOfferDetails(typeId, { title: t })}
                            />
                            <Space height={12} />
                            <Text style={styles.inputLabel}>{t('description')}</Text>
                            <TextInput
                                style={[styles.classicInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                                placeholder="Details about this offer..."
                                multiline
                                placeholderTextColor="#999"
                                value={details.description}
                                onChangeText={(t) => updateOfferDetails(typeId, { description: t })}
                            />
                        </View>
                    );
            }
        };

        // Chunk offers into pairs
        const pairs = [];
        for (let i = 0; i < offerTypes.length; i += 2) {
            pairs.push(offerTypes.slice(i, i + 2));
        }

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.classicLabel}>{t('addOfferForDrivers')}</Text>
                <Text style={[styles.helperText, { marginBottom: 20 }]}>
                    {t('createAttractiveOffers')}
                </Text>

                <View style={{ gap: 12 }}>
                    {pairs.map((pair, pairIndex) => {
                        const activeInPair = pair.find(o => o.id === activeOfferType);

                        return (
                            <View key={pairIndex} style={{ zIndex: activeInPair ? 10 : 1 }}>
                                {/* Row of cards */}
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {pair.map((offer) => {
                                        const isConfiguring = activeOfferType === offer.id;
                                        const isAdded = selectedOffers.includes(offer.id);

                                        return (
                                            <TouchableOpacity
                                                key={offer.id}
                                                style={[
                                                    styles.offerTypeCard,
                                                    { flex: 1, zIndex: 1 },
                                                    isConfiguring && styles.offerTypeCardActive,
                                                    isAdded && !isConfiguring && styles.offerTypeCardAdded
                                                ]}
                                                onPress={() => toggleOffer(offer.id)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={[styles.offerTypeIconBox, isConfiguring && styles.offerTypeIconBoxActive]}>
                                                    <Ionicons
                                                        name={(isAdded && !isConfiguring) ? "checkmark-circle" : offer.icon as any}
                                                        size={24}
                                                        color={isConfiguring ? 'white' : (isAdded ? '#4CAF50' : '#246BFD')}
                                                    />
                                                </View>
                                                <View style={styles.offerTypeTextContent}>
                                                    <Text style={[styles.offerTypeLabel, isConfiguring && styles.offerTypeLabelActive]}>
                                                        {offer.label}
                                                    </Text>
                                                    <Text style={[styles.offerTypeSub, isConfiguring && styles.offerTypeSubActive]} numberOfLines={1}>
                                                        {getOfferSubtitle(offer.id)}
                                                    </Text>
                                                </View>
                                                {isAdded && <View style={styles.addedBadge} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {/* Spacer for single item last row */}
                                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                                </View>

                                {/* Inline Expansion Form */}
                                {activeInPair && (
                                    <Animated.View entering={FadeIn} style={{ marginTop: 0 }}>
                                        <View style={[
                                            styles.formArrowUp, // Reusing existing arrow style
                                            {
                                                marginTop: -1, // Overlap slightly
                                                marginLeft: activeInPair.id === pair[0].id ? '25%' : '75%'
                                            }
                                        ]} />
                                        <View style={[styles.formContentBox, { marginTop: -8 }]}>
                                            {renderOfferForm(activeInPair.id)}

                                            <Space height={16} />
                                            {/* Common Fields */}
                                            <Text style={styles.inputLabel}>{t('validTill')} ({t('optional')})</Text>
                                            <TextInput
                                                style={styles.classicInput}
                                                placeholder="e.g. 31st Dec or Anytime"
                                                placeholderTextColor="#999"
                                                value={currentOfferDetails[activeInPair.id]?.validity}
                                                onChangeText={(t) => updateOfferDetails(activeInPair.id, { validity: t })}
                                            />

                                            <Space height={16} />
                                            <TouchableOpacity
                                                style={[styles.saveOfferBtn, { marginTop: 0, width: '100%' }]}
                                                onPress={() => {
                                                    if (!selectedOffers.includes(activeInPair.id)) {
                                                        const newOffers = [...selectedOffers, activeInPair.id];
                                                        updateUser('driver_offers', newOffers);
                                                    }
                                                    setActiveOfferType(null);
                                                }}
                                            >
                                                <Text style={styles.saveOfferBtnText}>{t('saveOffer')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Added Offers Summary */}
                <View style={{ marginTop: 30, paddingBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={styles.classicLabel}>{t('activeOffersSummary')}</Text>
                        {selectedOffers && selectedOffers.length > 0 && <Text style={{ color: '#246BFD', fontWeight: '600' }}>{selectedOffers.length} {t('active')}</Text>}
                    </View>

                    {(!selectedOffers || selectedOffers.length === 0) ? (
                        <View style={{ padding: 20, backgroundColor: '#f9f9f9', borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' }}>
                            <Text style={{ color: '#888' }}>{t('offersAppearHere')}</Text>
                        </View>
                    ) : (
                        selectedOffers.map((offerId: any) => {
                            const offer = offerTypes.find(o => o.id === offerId);
                            const details = currentOfferDetails[offerId] || {};

                            return (
                                <View key={offerId} style={[styles.summaryCard, { backgroundColor: '#fff', borderColor: '#246BFD', borderWidth: 1 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.offerTypeIconBox, { width: 40, height: 40, marginBottom: 0, backgroundColor: '#E3F2FD' }]}>
                                            <Ionicons name={offer?.icon as any} size={20} color="#246BFD" />
                                        </View>
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>{offer?.label}</Text>
                                            <Text style={{ fontSize: 14, color: '#246BFD', marginTop: 2, fontWeight: '500' }}>
                                                {getOfferSubtitle(offerId)}
                                            </Text>
                                            {details.validity ? (
                                                <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                                    {t('valid')}: {details.validity}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const newOffers = selectedOffers.filter((id: any) => id !== offerId);
                                                updateUser('driver_offers', newOffers);
                                            }}
                                            style={{ padding: 10 }}
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#FF5252" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>
        );
    };

    const renderCurrentStep = () => {
        switch (STEPS[currentStep].id) {
            case 'basic_info': return renderBasicInfo();
            case 'location_details': return renderLocationDetails();
            case 'operational_details': return renderOperationalDetails();
            case 'facilities': return renderFacilities();
            case 'food_menu': return renderFoodMenu();
            case 'photos': return renderPhotos();
            case 'offers_for_drivers': return renderOffers();
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F7FE" />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
                </View>
                <Text style={styles.stepCount}>{currentStep + 1} / {STEPS.length}</Text>
            </View>

            {/* Title Block */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{t(STEPS[currentStep].title)}</Text>
                <Text style={styles.subtitle}>{t(STEPS[currentStep].subtitle)}</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 180 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
                        {renderCurrentStep()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom || 20 }]}>
                <TouchableOpacity
                    onPress={handleNext}
                    style={styles.nextButton}
                    disabled={finishing}
                    activeOpacity={0.8}
                >
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.nextButtonText}>
                                {currentStep === STEPS.length - 1 ? (t('submitProfile') || 'Submit Profile') : (t('saveAndNext') || 'Save & Next')}
                            </Text>
                            {currentStep !== STEPS.length - 1 && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Location Warning Modal */}
            <Modal
                transparent
                visible={locationWarningModalVisible}
                animationType="fade"
                onRequestClose={() => setLocationWarningModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="warning" size={32} color="#D97706" />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12, textAlign: 'center' }}>
                            {t('importantNotice') || 'Important Notice'}
                        </Text>
                        <Text style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
                            {t('locationWarningMessage') || 'Before doing share location please stay near or at your dhaba to get perfect location of your dhaba.'}
                        </Text>
                        <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                                onPress={() => setLocationWarningModalVisible(false)}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563' }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.royalBlue, alignItems: 'center' }}
                                onPress={() => {
                                    setLocationWarningModalVisible(false);
                                    getCurrentLocation();
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{t('shareLocation') || 'Share Location'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={timePickerOpen.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {timePickerOpen.type === 'opening' ? t('selectOpeningTime') : t('selectClosingTime')}
                        </Text>
                        <DatePicker
                            date={userEdit?.[timePickerOpen.type === 'opening' ? 'opening_time' : 'closing_time'] || new Date()}
                            mode="time"
                            onDateChange={(date) => {
                                if (timePickerOpen.type === 'opening') updateUser('opening_time', date);
                                if (timePickerOpen.type === 'closing') updateUser('closing_time', date);
                            }}
                        />
                        <TouchableOpacity
                            onPress={() => setTimePickerOpen({ visible: false, type: null })}
                            style={styles.modalBtn}
                        >
                            <Text style={styles.modalBtnText}>{t('confirmTime')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Year of Establishment Picker Modal */}
            <Modal visible={establishmentYearPickerOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {t('selectYearOfEstablishment')}
                        </Text>
                        <DatePicker
                            date={userEdit?.establishment_year || new Date()}
                            mode="date"
                            maximumDate={new Date()}
                            onDateChange={(date) => updateUser('establishment_year', date)}
                        />
                        <TouchableOpacity
                            onPress={() => setEstablishmentYearPickerOpen(false)}
                            style={styles.modalBtn}
                        >
                            <Text style={styles.modalBtnText}>{t('confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Photo Source Selection Modal */}
            <Modal visible={photoModal.visible} transparent animationType="fade" onRequestClose={() => setPhotoModal({ visible: false, categoryId: null })}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPhotoModal({ visible: false, categoryId: null })}
                >
                    <View style={[styles.modalContent, { width: '90%', padding: 20 }]}>
                        <Text style={[styles.modalTitle, { marginBottom: 10 }]}>{t('choosePhotoSource')}</Text>
                        <Text style={{ color: '#666', marginBottom: 20 }}>{t('selectHowToAddPhotos')}</Text>

                        <View style={{ flexDirection: 'row', gap: 20, width: '100%' }}>
                            <TouchableOpacity
                                style={styles.photoSourceBtn}
                                onPress={() => handlePickImage('camera')}
                            >
                                <View style={[styles.photoSourceIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Ionicons name="camera" size={30} color="#1976D2" />
                                </View>
                                <Text style={styles.photoSourceText}>{t('camera')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.photoSourceBtn}
                                onPress={() => handlePickImage('gallery')}
                            >
                                <View style={[styles.photoSourceIcon, { backgroundColor: '#E8F5E9' }]}>
                                    <Ionicons name="images" size={30} color="#2E7D32" />
                                </View>
                                <Text style={styles.photoSourceText}>{t('gallery')}</Text>
                            </TouchableOpacity>
                        </View>

                        <Space height={20} />
                        <TouchableOpacity
                            onPress={() => setPhotoModal({ visible: false, categoryId: null })}
                            style={[styles.modalBtn, { backgroundColor: '#f0f0f0', elevation: 0 }]}
                        >
                            <Text style={[styles.modalBtnText, { color: '#333' }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Map Location Picker Modal */}
            <Modal visible={mapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    {/* Header */}
                    <View style={[styles.header, { paddingTop: safeAreaInsets.top + 10, height: 'auto', paddingBottom: 12 }]}>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.backButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('pinYourLocation') || 'Pin Your Location'}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Map */}
                    {tempMarker && (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: tempMarker.latitude,
                                longitude: tempMarker.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            showsUserLocation
                            showsMyLocationButton={false}
                        >
                            <Marker
                                draggable
                                coordinate={tempMarker}
                                onDragEnd={(e) => {
                                    setTempMarker({
                                        latitude: e.nativeEvent.coordinate.latitude,
                                        longitude: e.nativeEvent.coordinate.longitude,
                                    });
                                }}
                            />
                        </MapView>
                    )}

                    {/* Instructions */}
                    <View style={{ position: 'absolute', top: 80 + safeAreaInsets.top, left: 16, right: 16 }}>
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 10 }}>
                            <Text style={{ color: 'white', fontSize: 13, textAlign: 'center' }}>
                                {t('dragMarkerToLocation') || 'Drag the pin to your dhaba\'s exact location'}
                            </Text>
                        </View>
                    </View>

                    {/* Re-center GPS Button */}
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 140 + safeAreaInsets.bottom,
                            right: 16,
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: 'white',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                        onPress={getCurrentLocation}
                    >
                        <Ionicons name="locate" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>

                    {/* Bottom Action Bar */}
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        paddingHorizontal: 20,
                        paddingTop: 16,
                        paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom + 10 : 20,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -3 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 10,
                    }}>
                        {tempMarker && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 12, color: '#6B7280' }}>{t('selectedCoordinates') || 'Selected Coordinates'}:</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
                                    {tempMarker.latitude.toFixed(6)}, {tempMarker.longitude.toFixed(6)}
                                </Text>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                                onPress={() => setMapModalVisible(false)}
                            >
                                <Text style={{ fontWeight: '600', color: '#4B5563' }}>{t('cancel') || 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.royalBlue, alignItems: 'center' }}
                                onPress={confirmMapLocation}
                            >
                                <Text style={{ fontWeight: '600', color: 'white' }}>{t('confirmLocation') || 'Confirm Location'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* State Selection Modal (Matches Signup Screen UI) */}
            <Modal
                visible={stateModalVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setStateModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'white' }}>
                    <StatusBar barStyle="dark-content" backgroundColor="white" />
                    {/* Modal Header */}
                    <View style={{
                        paddingTop: safeAreaInsets.top,
                        backgroundColor: 'white',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(0,0,0,0.08)',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                        }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setStateModalVisible(false);
                                    setStateSearchQuery('');
                                }}
                                style={{
                                    height: 40,
                                    width: 40,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    borderRadius: 12,
                                }}>
                                <Ionicons name="close" size={24} color={colors.royalBlue} />
                            </TouchableOpacity>
                            <Text style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: 18,
                                fontWeight: '700',
                                color: '#333',
                                marginRight: 40,
                            }}>
                                {t('selectState')}
                            </Text>
                        </View>

                        {/* Search Bar */}
                        <View style={{
                            marginHorizontal: 20,
                            marginBottom: 12,
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 14,
                            height: 48,
                        }}>
                            <Ionicons name="search" size={20} color="rgba(0,0,0,0.4)" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                    fontSize: 16,
                                    color: '#333',
                                    padding: 0,
                                }}
                                placeholder={t('searchState') || 'Search state...'}
                                placeholderTextColor="rgba(0,0,0,0.4)"
                                value={stateSearchQuery}
                                onChangeText={setStateSearchQuery}
                                autoCorrect={false}
                            />
                            {stateSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setStateSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="rgba(0,0,0,0.4)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* State List */}
                    <FlatList
                        data={filteredStates}
                        keyExtractor={(item) => item.id.toString()}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingTop: 10,
                            paddingBottom: safeAreaInsets.bottom + 20,
                        }}
                        ListEmptyComponent={() => (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 50,
                            }}>
                                <Ionicons name="location-outline" size={48} color="rgba(0,0,0,0.2)" />
                                <Text style={{
                                    marginTop: 12,
                                    fontSize: 16,
                                    color: 'rgba(0,0,0,0.4)',
                                }}>
                                    {t('noStatesFound') || 'No states found'}
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const isSelected = userEdit?.state === item.name;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => handleStateSelect(item)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 15,
                                        paddingHorizontal: 16,
                                        marginBottom: 8,
                                        backgroundColor: isSelected ? colors.royalBlue + '10' : 'white',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: isSelected ? colors.royalBlue : 'rgba(0,0,0,0.08)',
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
                                            color={isSelected ? colors.royalBlue : 'rgba(0,0,0,0.3)'}
                                        />
                                    </View>
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 16,
                                        fontWeight: isSelected ? '600' : '500',
                                        color: isSelected ? colors.royalBlue : '#333',
                                    }}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FE' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, height: 50 },
    backButton: { marginRight: 15, padding: 5 },
    progressContainer: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#246BFD', borderRadius: 3 },
    stepCount: { marginLeft: 15, fontSize: 14, fontWeight: '700', color: '#666' },
    titleContainer: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.5 },
    subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
    stepContainer: { paddingHorizontal: 20 },
    contentContainer: { paddingBottom: 20 },
    classicLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
    optionalText: { fontSize: 12, fontWeight: '400', color: '#999' },
    helperText: { fontSize: 13, color: '#888', marginBottom: 5 },
    classicInput: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 5, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', elevation: 20 },
    nextButton: { backgroundColor: '#246BFD', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#246BFD', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    nextButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'white', borderRadius: 25, borderWidth: 1, borderColor: '#ddd' },
    chipSelected: { backgroundColor: '#246BFD', borderColor: '#246BFD' },
    chipText: { color: '#666', fontWeight: '500', fontSize: 14 },
    chipTextSelected: { color: 'white', fontWeight: '600' },
    rowGap: { flexDirection: 'row', gap: 12 },
    gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 12, marginTop: 5 },
    gpsButtonText: { color: 'white', fontWeight: '600', marginLeft: 10, fontSize: 16 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    gpsInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#C8E6C9' },
    gpsText: { fontSize: 13, color: '#2E7D32', marginLeft: 8, fontWeight: '500' },
    gpsButtonsRow: { flexDirection: 'row', gap: 8 },
    gpsTextTitle: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
    gpsTextCoords: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    datetimeBox: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0' },
    datetimeText: { fontSize: 16, color: '#333', fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25, width: '85%', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 20 },
    modalBtn: { marginTop: 25, backgroundColor: '#246BFD', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
    modalBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '48%', backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
    gridItemSelected: { borderColor: '#246BFD', backgroundColor: '#F0F7FF' },
    gridItemText: { marginLeft: 10, fontSize: 14, color: '#555', flex: 1 },
    gridItemTextSelected: { color: '#246BFD', fontWeight: '600' },
    checkboxCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    errorTextSmall: { color: '#FF5252', fontSize: 11, marginTop: 4, marginLeft: 4 },
    checkboxCircleSelected: { borderColor: '#246BFD', backgroundColor: '#246BFD' },
    facilityIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
    facilityIconBoxSelected: { backgroundColor: '#246BFD' },
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    radioCircleSelected: { borderColor: '#246BFD' },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#246BFD' },
    photoUploadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
    photoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
    photoCatLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
    photoCatSub: { fontSize: 12, color: '#999', marginTop: 2 },
    uploadActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f9f9f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4EDDA', padding: 12, borderRadius: 8, borderColor: '#C3E6CB', borderWidth: 1 },
    infoBannerText: { marginLeft: 10, color: '#155724', fontSize: 13, flex: 1 },
    photoCategoryBlock: { marginBottom: 15 },
    thumbnailScroll: { marginTop: 8, paddingLeft: 10 },
    thumbnailContainer: { marginRight: 10, position: 'relative' },
    thumbnail: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    removePhotoBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF3B30', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
    photoSourceBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
    photoSourceIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    photoSourceText: { fontSize: 16, fontWeight: '600', color: '#333' },

    // Offers Section Styles (Modern Grid)
    offerTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    offerTypeWrapper: { width: '50%', padding: 6 },
    offerTypeCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee', height: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
    offerTypeCardActive: { borderColor: '#246BFD', backgroundColor: '#F0F7FF', borderWidth: 2 },
    offerTypeCardAdded: { borderColor: '#4CAF50', backgroundColor: '#F6FFF7' },

    offerTypeIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    offerTypeIconBoxActive: { backgroundColor: '#246BFD' },

    offerTypeTextContent: { alignItems: 'center' },
    offerTypeLabel: { fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 4 },
    offerTypeLabelActive: { color: '#246BFD' },
    offerTypeSub: { fontSize: 10, color: '#999', textAlign: 'center' },
    offerTypeSubActive: { color: '#246BFD' },

    addedBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },

    // Expanded Form Area
    expandedFormContainer: { width: '200%', position: 'absolute', top: 135, zIndex: 100, marginLeft: 6, left: 0 },

    formArrowUp: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#246BFD', alignSelf: 'center', marginTop: -8 },
    formContentBox: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#246BFD', shadowColor: '#246BFD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },

    inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },

    suggestionPill: { position: 'absolute', right: 8, top: 8, backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    suggestionText: { fontSize: 10, fontWeight: '600', color: '#246BFD' },

    segmentControl: { flexDirection: 'row', backgroundColor: '#F0F2F5', borderRadius: 10, padding: 4 },
    segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
    segmentBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    segmentText: { fontSize: 13, fontWeight: '600', color: '#888' },
    segmentTextActive: { color: '#333' },

    saveOfferBtn: { backgroundColor: '#246BFD', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveOfferBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
    summaryCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },

    // Dish Input Styles
    dishInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    addDishButton: { backgroundColor: '#246BFD', width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    dishChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    dishChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F4FD', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#BAD6F7' },
    dishChipText: { fontSize: 14, color: '#246BFD', fontWeight: '500', marginRight: 4 },
    removeDishButton: { marginLeft: 2 },
});
