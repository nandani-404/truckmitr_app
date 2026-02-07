import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Modal,
    FlatList,
    KeyboardAvoidingView, // Added KeyboardAvoidingView
    PermissionsAndroid,
} from 'react-native';
import FastImage from 'react-native-fast-image';
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
import { userEditAction, userAuthenticatedAction, userAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import ImagePicker from 'react-native-image-crop-picker';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { fetchCompleteLocationDetails } from '@truckmitr/src/utils/maps/location/location.detail';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const PUNCTURE_STEPS = [
    { id: 'basic_info', title: 'puncture_basic_info', subtitle: 'puncture_identity_trust' },
    { id: 'location_details', title: 'puncture_location_address', subtitle: 'puncture_nearby_discovery' },
    { id: 'operational_details', title: 'puncture_operational_details', subtitle: 'puncture_service_availability' },
    { id: 'services_offered', title: 'puncture_services_offered', subtitle: 'puncture_select_your_services' },
    { id: 'vehicle_coverage', title: 'puncture_vehicle_coverage', subtitle: 'puncture_supported_vehicles' },
    { id: 'photos', title: 'puncture_shop_photos', subtitle: 'puncture_build_trust' },
];

const MandatoryLabel = ({ text, style }: { text: string, style?: any }) => (
    <Text style={[styles.classicLabel, style]}>
        {text} <Text style={{ color: 'red' }}>*</Text>
    </Text>
);

const InputItem = ({ label, icon, placeholder, value, onChangeText, keyboardType, maxLength, optional, onPress, editable = true }: any) => {
    const { t } = useTranslation();
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={[styles.classicLabel, { marginLeft: 4, marginBottom: 6 }]}>
                {label} {optional && <Text style={styles.optionalText}>{t('puncture_optional')}</Text>}
                {!optional && <Text style={{ color: 'red' }}>*</Text>}
            </Text>
            <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
                <View style={styles.inputWrapper}>
                    <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                    <TextInput
                        style={styles.cleanInput}
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChangeText}
                        keyboardType={keyboardType}
                        maxLength={maxLength}
                        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                        editable={editable}
                        pointerEvents={editable ? 'auto' : 'none'}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default function ProfileCompletionPuncture() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { userEdit, user } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Pickers
    const [timePickerOpen, setTimePickerOpen] = useState<{ visible: boolean, type: 'opening' | 'closing' | null }>({ visible: false, type: null });
    const [photoModal, setPhotoModal] = useState<{ visible: boolean, categoryId: string | null }>({ visible: false, categoryId: null });
    const [yearPickerVisible, setYearPickerVisible] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [shopPhotoInstructionModal, setShopPhotoInstructionModal] = useState(false);
    const [establishmentYearPickerOpen, setEstablishmentYearPickerOpen] = useState(false);

    // Restored Modals
    const [serviceTimeModal, setServiceTimeModal] = useState(false);
    const [radiusModal, setRadiusModal] = useState(false);

    // Location State
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [gpsAddress, setGpsAddress] = useState(''); // New state for auto-fetched address
    const [locationWarningModalVisible, setLocationWarningModalVisible] = useState(false);

    // Local State for Form Data
    const [formData, setFormData] = useState({
        puncture_name: '',
        owner_name: '',
        mobile: user?.mobile || '',
        email: user?.email || '',
        establishment_year: null as Date | null,
        puncture_type: '',
        puncture_id: null as string | null,

        // Location
        address: '',
        landmark: '',
        state: '',
        district: '',
        pincode: '',
        latitude: '',
        longitude: '',
        location_source: '',

        // Operational
        shop_photos: {} as any,
        opening_time: '',
        closing_time: '',
        is_24x7: false,
        on_road_service: false,
        mobile_radius: '',
        avg_service_time: '',
    });

    const [statesList, setStatesList] = useState<any[]>([]);

    useEffect(() => {
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
        fetchStates();
    }, []);

    const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);
    const progressWidth = useSharedValue(0);

    const STEPS = PUNCTURE_STEPS;

    useEffect(() => {
        const newProgress = ((currentStep + 1) / STEPS.length) * 100;
        progressWidth.value = withSpring(newProgress, { damping: 15, stiffness: 90 });
    }, [currentStep]);

    useEffect(() => {
        const pincode = userEdit?.pincode;
        if (pincode?.length === 6) {
            const fetchPincodeDetails = async () => {
                try {
                    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                    const data = await response.json();
                    if (data?.[0]?.Status === 'Success') {
                        const details = data[0].PostOffice[0];
                        if (details) {
                            // Dispatch both updates at once to avoid stale state issues
                            dispatch(userEditAction({
                                ...userEdit,
                                state: details.State,
                                district: details.District
                            }));
                        }
                    }
                } catch (error) {
                    console.log('Error fetching pincode details:', error);
                }
            };
            fetchPincodeDetails();
        }
    }, [userEdit?.pincode]);

    useEffect(() => {
        contentOpacity.value = 0;
        contentTranslateX.value = 20;
        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateX.value = withSpring(0, { damping: 12 });

        if (STEPS[currentStep]?.id === 'photos') {
            setShopPhotoInstructionModal(true);
        }

        // Scroll to top when step changes
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
    }, [currentStep]);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));
    const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

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

    const handleNext = async () => {
        const step = STEPS[currentStep];

        // Validation
        if (step.id === 'basic_info') {
            if (!formData.puncture_name || !formData.owner_name || !formData.mobile) {
                showToast(t('puncture_err_shop_name')); // You might want to update this key if generic
                return;
            }
            if (!formData.puncture_type) {
                showToast(t('puncture_err_shop_type'));
                return;
            }

            setFinishing(true);
            try {
                const apiPayload = new FormData();
                apiPayload.append('puncture_name', formData.puncture_name);
                apiPayload.append('owner_name', formData.owner_name);
                apiPayload.append('mobile', formData.mobile);
                apiPayload.append('email', formData.email);
                apiPayload.append('year_established', formData.establishment_year ? moment(formData.establishment_year).format('YYYY') : '');
                apiPayload.append('puncture_type', formData.puncture_type);

                // Use the new endpoint
                const response = await axiosInstance.post(END_POINTS.PUNCTURE_BASIC_INFO, apiPayload);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('puncture_basic_info_saved'));

                    const pId = response?.data?.puncture?.id;
                    if (pId) {
                        updateFormData('puncture_id', pId);
                        await AsyncStorage.setItem('puncture_id', pId.toString());
                    }

                    if (currentStep < STEPS.length - 1) {
                        contentOpacity.value = withTiming(0, { duration: 200 });
                        setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                    } else {
                        submitProfile();
                    }
                } else {
                    showToast(response?.data?.message || t('puncture_failed_save_basic'));
                }
            } catch (error: any) {
                console.error('Basic Info API Error:', error);
                showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
            } finally {
                setFinishing(false);
            }
            return;
        }
        if (step.id === 'location_details') {
            if (!formData.address) {
                showToast(t('puncture_err_address'));
                return;
            }
            if (!formData.pincode) {
                showToast(t('puncture_err_pincode'));
                return;
            }
            if (!formData.state) {
                showToast(t('puncture_err_state'));
                return;
            }
            if (!formData.latitude || !formData.longitude) {
                showToast(t('locationDetailsRequired'));
                return;
            }

            setFinishing(true);
            try {
                const apiPayload = new FormData();
                let puncture_id = formData.puncture_id;
                if (!puncture_id) {
                    puncture_id = await AsyncStorage.getItem('puncture_id');
                }
                apiPayload.append('puncture_id', puncture_id || '');
                apiPayload.append('full_address', formData.address);
                apiPayload.append('landmark', formData.landmark);
                apiPayload.append('pincode', formData.pincode);
                // Find state_id
                const selectedState = statesList.find(s => s.name?.toLowerCase() === formData.state?.toLowerCase());
                const state_id = selectedState ? selectedState.id : '';

                apiPayload.append('state', formData.state);
                apiPayload.append('state_id', state_id || '');
                apiPayload.append('district', formData.district);
                apiPayload.append('latitude', formData.latitude);
                apiPayload.append('longitude', formData.longitude);
                apiPayload.append('location_source', 'Pinned via GPS');
                // if (formData.location_source) {
                //     apiPayload.append('location_source', formData.location_source);
                // }

                // Use the new endpoint
                const response = await axiosInstance.post(END_POINTS.PUNCTURE_LOCATION, apiPayload);

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('puncture_location_saved'));
                    if (currentStep < STEPS.length - 1) {
                        contentOpacity.value = withTiming(0, { duration: 200 });
                        setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                    }
                } else {
                    showToast(response?.data?.message || t('puncture_failed_save_location'));
                }
            } catch (error: any) {
                console.error('Location API Error:', error);
                showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
            } finally {
                setFinishing(false);
            }
            return;
        }
        if (step.id === 'operational_details') {
            if (!formData.is_24x7 && (!formData.opening_time || !formData.closing_time)) {
                showToast(t('puncture_err_time'));
                return;
            }

            setFinishing(true);
            try {
                const apiPayload = new FormData();
                let puncture_id = formData.puncture_id;
                if (!puncture_id) {
                    puncture_id = await AsyncStorage.getItem('puncture_id');
                }
                apiPayload.append('puncture_id', puncture_id || '');
                // Format times as HH:mm for the backend
                apiPayload.append('opening_time', formData.opening_time ? moment(formData.opening_time).format('HH:mm') : '');
                apiPayload.append('closing_time', formData.closing_time ? moment(formData.closing_time).format('HH:mm') : '');
                apiPayload.append('is_24x7', formData.is_24x7 ? '1' : '0');
                apiPayload.append('on_road_service', formData.on_road_service ? '1' : '0');
                apiPayload.append('mobile_service', formData.mobile_radius);
                apiPayload.append('average_service_time', formData.avg_service_time);

                console.log('apiPayload', apiPayload);
                const response = await axiosInstance.post(END_POINTS.PUNCTURE_OPERATION, apiPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('puncture_operational_details_saved'));
                    if (currentStep < STEPS.length - 1) {
                        contentOpacity.value = withTiming(0, { duration: 200 });
                        setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                    }
                } else {
                    showToast(response?.data?.message || t('puncture_failed_save_location'));
                }
            } catch (error: any) {
                console.error('Operational API Error:', error);
                showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
            } finally {
                setFinishing(false);
            }
            return;
        }
        if (step.id === 'services_offered') {
            if (!userEdit?.services || userEdit?.services.length === 0) {
                showToast(t('puncture_err_service'));
                return;
            }

            setFinishing(true);
            try {
                const apiPayload = new FormData();
                let puncture_id = formData.puncture_id;
                if (!puncture_id) {
                    puncture_id = await AsyncStorage.getItem('puncture_id');
                }
                apiPayload.append('puncture_id', puncture_id || '');

                const serviceMapping: { [key: string]: string } = {
                    'Tube Puncture': 'tube_puncture',
                    'Tubeless Tyre Repair': 'tubeless_tyre_repair',
                    'Tyre Replacement': 'tyre_replacement',
                    'Nitrogen / Air Filling': 'nitrogen_air_filling',
                    'Stepney Installation': 'stepney_installation',
                    'Wheel Balancing': 'wheel_balancing',
                    'Minor Mechanical Repair': 'minor_mechanical_repair',
                    'Jump Start / Battery Help': 'jump_start_battery_help',
                    'Emergency Night Service': 'emergency_night_service'
                };

                Object.keys(serviceMapping).forEach(uiKey => {
                    const apiKey = serviceMapping[uiKey];
                    const isSelected = userEdit?.services?.includes(uiKey);
                    apiPayload.append(apiKey, isSelected ? '1' : '0');
                });

                console.log('Services apiPayload', apiPayload);
                const response = await axiosInstance.post(END_POINTS.SERVICE_OFFERED, apiPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('puncture_services_saved') || 'Services saved successfully');
                    if (currentStep < STEPS.length - 1) {
                        contentOpacity.value = withTiming(0, { duration: 200 });
                        setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                    }
                } else {
                    showToast(response?.data?.message || t('puncture_failed_save_services') || 'Failed to save services');
                }

            } catch (error: any) {
                console.error('Services API Error:', error);
                showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
            } finally {
                setFinishing(false);
            }
            return;
        }

        if (step.id === 'vehicle_coverage') {
            if (!userEdit?.vehicle_coverage || userEdit?.vehicle_coverage.length === 0) {
                showToast(t('puncture_err_vehicle_coverage') || 'Please select at least one vehicle type');
                return;
            }

            setFinishing(true);
            try {
                const apiPayload = new FormData();
                let puncture_id = formData.puncture_id;
                if (!puncture_id) {
                    puncture_id = await AsyncStorage.getItem('puncture_id');
                }
                apiPayload.append('puncture_id', puncture_id || '');
                apiPayload.append('user_id', user?.id || user?.user_id || '');
                apiPayload.append('unique_id', user?.unique_id || '');

                const vehicleMapping: { [key: string]: string } = {
                    'Bike': 'BIKE',
                    'Car': 'CAR',
                    'Mini Truck': 'MINI_TRUCK',
                    'Truck (6 Tyre)': 'TRUCK_6_TYRE',
                    'Truck (10 / 12 / 14 Tyre)': 'TRUCK_10_12_14_TYRE',
                    'Trailer': 'TRAILER',
                    'Bus': 'BUS'
                };

                const selectedVehicles = userEdit.vehicle_coverage || [];
                selectedVehicles.forEach((v: string) => {
                    const apiValue = vehicleMapping[v];
                    if (apiValue) {
                        apiPayload.append('vehicle_coverage[]', apiValue);
                    }
                });

                console.log('Vehicle Coverage apiPayload', apiPayload);
                const response = await axiosInstance.post(END_POINTS.VEHICLE_COVERAGE, apiPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('puncture_vehicle_coverage_saved') || 'Vehicle coverage saved successfully');
                    if (currentStep < STEPS.length - 1) {
                        contentOpacity.value = withTiming(0, { duration: 200 });
                        setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                    }
                } else {
                    showToast(response?.data?.message || t('puncture_failed_save_vehicle') || 'Failed to save vehicle coverage');
                }

            } catch (error: any) {
                console.error('Vehicle Coverage API Error:', error);
                showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
            } finally {
                setFinishing(false);
            }
            return;
        }

        if (step.id === 'photos') {
            const allPhotos = formData.shop_photos?.all_photos || [];

            if (!allPhotos || allPhotos.length === 0) {
                showToast(t('pleaseUploadAtLeastOnePhoto') || 'Please upload at least one photo');
                return;
            }

            setFinishing(true);
            try {
                const apiPayload = new FormData();
                let puncture_id = formData.puncture_id;
                if (!puncture_id) {
                    puncture_id = await AsyncStorage.getItem('puncture_id');
                }
                apiPayload.append('puncture_id', puncture_id || '');
                apiPayload.append('user_id', user?.id || user?.user_id || '');
                apiPayload.append('unique_id', user?.unique_id || '');

                apiPayload.append('category', 'puncture');
                apiPayload.append('ordering_priority', '1');
                apiPayload.append('upload_date', moment().format('YYYY-MM-DD'));

                allPhotos.forEach((photoUri: string, idx: number) => {
                    const fileName = `puncture_photo_${idx}_${Date.now()}.jpg`;
                    apiPayload.append(`image_url[${idx}]`, {
                        uri: photoUri,
                        type: 'image/jpeg',
                        name: fileName,
                    } as any);
                });

                console.log('Photos apiPayload', apiPayload);
                const response = await axiosInstance.post(END_POINTS.PUNCTURE_PHOTOS, apiPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (response?.data?.status === true || response?.data?.success === true) {
                    showToast(response?.data?.message || t('photosSavedSuccess') || 'Photos saved successfully!');
                    if (currentStep < STEPS.length - 1) {
                        contentOpacity.value = withTiming(0, { duration: 200 });
                        setTimeout(() => setCurrentStep(prev => prev + 1), 200);
                    } else {
                        submitProfile();
                    }
                } else {
                    showToast(response?.data?.message || t('failedToSavePhotos') || 'Failed to save photos');
                }

            } catch (error: any) {
                console.error('Photos API Error:', error);
                showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
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
            const profileResponse = await axiosInstance.get(END_POINTS.GET_PROFILE);
            if (profileResponse?.data?.status) {
                const updatedData = { ...profileResponse.data };

                // Ensure the status flag is true at the ROOT level
                updatedData.puncture_required_fields_status = true;

                // Also set generic flags just in case
                if (updatedData.data) {
                    updatedData.data.profile_completed = true;
                }
                if (updatedData.user) {
                    updatedData.user.profile_completed = true;
                }

                dispatch(userAction(updatedData));
                dispatch(userAuthenticatedAction(true));
                showToast(t('puncture_profile_submitted'));
            } else {
                showToast(t('failedToSyncProfile'));
            }
        } catch (error: any) {
            console.error('Error submitting profile:', error);
            showToast(error?.message || t('puncture_failed_submit'));
        } finally {
            setFinishing(false);
        }
    };

    const handlePickImage = (source: 'camera' | 'gallery') => {
        const categoryId = photoModal.categoryId || 'all_photos';

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

            setFormData(prev => {
                const currentPhotos = prev.shop_photos?.[categoryId] || [];
                const newPhotoPaths = images.map((img: any) => img.path);

                // Limit check if needed (e.g. max 7 photos total or per category)
                if (currentPhotos.length + newPhotoPaths.length > 7) {
                    showToast(t('youCanAddOnly7Photos') || "You can add only 7 photos");
                    return prev;
                }

                const updatedCategoryPhotos = [...currentPhotos, ...newPhotoPaths];
                return {
                    ...prev,
                    shop_photos: {
                        ...prev.shop_photos,
                        [categoryId]: updatedCategoryPhotos
                    }
                };
            });

            setPhotoModal({ visible: false, categoryId: null });
        }).catch((err: any) => {
            if (err?.code !== 'E_PICKER_CANCELLED') {
                console.warn('ImagePicker Error:', err);
                showToast(t('errorPickingImage') || "Error picking image");
            }
            setPhotoModal({ visible: false, categoryId: null });
        });
    };

    const removePhoto = (categoryId: string, index: number) => {
        setFormData(prev => {
            const currentList = prev.shop_photos?.[categoryId] || [];
            const updated = currentList.filter((_: any, idx: number) => idx !== index);
            return {
                ...prev,
                shop_photos: {
                    ...prev.shop_photos,
                    [categoryId]: updated
                }
            };
        });
    };

    // --- Helper Functions ---

    const handlePincodeChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        updateFormData('pincode', cleaned);

        if (cleaned.length === 6) {
            fetchPincodeDetails(cleaned);
        }
    };

    const fetchPincodeDetails = async (pincodeValue: string) => {
        setIsPincodeLoading(true);
        try {
            const response = await axiosInstance.get(`https://api.postalpincode.in/pincode/${pincodeValue}`);
            if (response?.data && response.data[0]?.Status === 'Success') {
                const details = response.data[0].PostOffice[0];
                const district = details.District;
                const state = details.State;

                setFormData(prev => ({
                    ...prev,
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

    const requestLocationPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: t('locationPermission') || 'Location Permission',
                    message: t('locationPermissionMessage') || 'We need access to your location.',
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

                // If we have display name, use it if address empty? Dhaba does not auto-fill main address usually
                // but let's stick to Dhaba logic which commented it out mostly.

                updateFormData('latitude', latitude.toString());
                updateFormData('longitude', longitude.toString());
                updateFormData('latitude', latitude.toString());
                updateFormData('longitude', longitude.toString());
                updateFormData('location_source', 'Auto GPS');

                if (locationData.displayName) {
                    setGpsAddress(locationData.displayName);
                }

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

    // --- Step Renderers ---

    const renderBasicInfo = () => (
        <View style={styles.stepContainer}>
            <InputItem
                label={t('puncture_shop_name_label')}
                icon="storefront-outline"
                placeholder={t('puncture_shop_name_placeholder')}
                value={formData.puncture_name}
                onChangeText={(text: string) => updateFormData('puncture_name', text)}
            />

            <InputItem
                label={t('puncture_owner_name_label')}
                icon="person-outline"
                placeholder={t('puncture_owner_name_placeholder')}
                value={formData.owner_name}
                onChangeText={(text: string) => updateFormData('owner_name', text)}
            />

            <InputItem
                label={t('puncture_mobile_number_label')}
                icon="call-outline"
                placeholder={t('puncture_mobile_placeholder')}
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.mobile}
                editable={false}
            // onChangeText={(text: string) => updateFormData('mobile', text.replace(/[^0-9]/g, ''))}
            />

            <InputItem
                label={t('puncture_email_label')}
                icon="mail-outline"
                placeholder={t('puncture_email_placeholder')}
                keyboardType="email-address"
                optional
                value={formData.email}
                onChangeText={(text: string) => updateFormData('email', text)}
            />

            <Space height={16} />
            <Text style={styles.classicLabel}>{t('puncture_year_est_label')} <Text style={styles.optionalText}>{t('puncture_optional')}</Text></Text>
            <TouchableOpacity
                style={styles.datetimeBox}
                onPress={() => setEstablishmentYearPickerOpen(true)}
            >
                <Text style={styles.datetimeText}>
                    {formData.establishment_year
                        ? moment(formData.establishment_year).format('YYYY')
                        : t('puncture_select_date')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.royalBlue} />
            </TouchableOpacity>

            <Space height={24} />
            <MandatoryLabel text={t('puncture_shop_type_label')} style={{ marginLeft: 4 }} />
            <Text style={[styles.helperText, { marginLeft: 4, marginBottom: 10 }]}>{t('puncture_shop_type_helper')}</Text>
            <View style={styles.shopTypeGrid}>
                {[
                    { key: 'Highway Puncture Shop', label: 'puncture_highway_shop' },
                    { key: 'Roadside Puncture Shop', label: 'puncture_roadside_shop' },
                    { key: 'Garage + Puncture', label: 'puncture_garage_shop' },
                    { key: 'Mobile Puncture Van', label: 'puncture_mobile_van' }
                ].map(item => (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.shopTypeCard, formData.puncture_type === item.key && styles.shopTypeCardSelected]}
                        onPress={() => updateFormData('puncture_type', item.key)}
                    >
                        <Text style={[styles.shopTypeText, formData.puncture_type === item.key && styles.shopTypeTextSelected]}>
                            {t(item.label)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Year Picker Modal */}
            <Modal visible={establishmentYearPickerOpen} transparent animationType="fade" onRequestClose={() => setEstablishmentYearPickerOpen(false)}>
                <View style={styles.yearPickerOverlay}>
                    <View style={[styles.yearPickerContainer, { maxHeight: 400 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('puncture_select_year')}</Text>
                            <TouchableOpacity onPress={() => setEstablishmentYearPickerOpen(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={years}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => {
                                const isSelected = formData.establishment_year && moment(formData.establishment_year).year() === item;
                                return (
                                    <TouchableOpacity
                                        style={{
                                            paddingVertical: 15,
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#eee',
                                            width: '100%',
                                            backgroundColor: isSelected ? '#F0F7FF' : 'transparent'
                                        }}
                                        onPress={() => {
                                            const date = new Date(item, 0, 1);
                                            updateFormData('establishment_year', date);
                                            setEstablishmentYearPickerOpen(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 18, color: isSelected ? colors.royalBlue : '#333', fontWeight: isSelected ? '700' : '400' }}>{item}</Text>
                                        {isSelected && <Ionicons name="checkmark" size={20} color={colors.royalBlue} style={{ position: 'absolute', right: 20 }} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );

    const renderLocationDetails = () => (
        <View style={styles.stepContainer}>
            <MandatoryLabel text={t('puncture_full_address')} />
            <TextInput
                style={[styles.classicInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder={t('puncture_address_placeholder')}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={formData.address}
                onChangeText={(text) => updateFormData('address', text)}
            />

            <Space height={16} />
            <Text style={styles.classicLabel}>{t('puncture_landmark')} <Text style={styles.optionalText}>{t('puncture_optional')}</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder={t('puncture_near_placeholder')}
                placeholderTextColor="#999"
                value={formData.landmark}
                onChangeText={(text) => updateFormData('landmark', text)}
            />

            <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                    <Space height={16} />
                    <MandatoryLabel text={t('puncture_pincode')} />
                    <View style={{ position: 'relative' }}>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="000000"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            maxLength={6}
                            value={formData.pincode}
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
                    <Space height={16} />
                    <MandatoryLabel text={t('puncture_district')} />
                    <TextInput
                        style={[styles.classicInput, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                        placeholder={t('puncture_district')}
                        placeholderTextColor="#999"
                        value={formData.district}
                        editable={false}
                    />
                </View>
            </View>

            <Space height={16} />
            <MandatoryLabel text={t('puncture_state')} />
            <TextInput
                style={[styles.classicInput, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                placeholder={t('puncture_state')}
                placeholderTextColor="#999"
                value={formData.state}
                editable={false}
            />

            <Space height={24} />
            {/* <Text style={styles.classicLabel}>{t('puncture_gps_location')} <Text style={styles.optionalText}>{t('puncture_optional')}</Text></Text> */}
            <MandatoryLabel text={t('puncture_gps_location')} style={{ marginLeft: 4 }} />
            <View style={styles.gpsButtonsRow}>
                <TouchableOpacity
                    style={[styles.gpsButton, { backgroundColor: colors.royalBlue, flex: 1, marginRight: 0 }]}
                    activeOpacity={0.8}
                    onPress={() => setLocationWarningModalVisible(true)}
                    disabled={fetchingLocation}
                >
                    {fetchingLocation ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="navigate-circle-outline" size={22} color="white" />
                            <Text style={styles.gpsButtonText}>{t('fetchLocation') || 'Fetch Location'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {(formData.latitude && formData.longitude) ? (
                <View style={[styles.gpsInfoBox, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={16} color="green" />
                        <Text style={styles.gpsText}>
                            {t('puncture_location_label')}: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                        </Text>
                    </View>
                    {gpsAddress ? (
                        <Text style={[styles.gpsTextCoords, { marginLeft: 24, marginTop: 4 }]}>
                            {gpsAddress}
                        </Text>
                    ) : null}
                </View>
            ) : null}
        </View>
    );

    const renderOperationalDetails = () => (
        <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.stepContainer}>

            <View style={styles.switchRow}>
                <View>
                    <Text style={styles.classicLabel}>{t('puncture_is_open_24x7')}</Text>
                    <Text style={styles.helperText}>{t('puncture_all_day_service')}</Text>
                </View>
                <TouchableOpacity onPress={() => updateFormData('is_24x7', !formData.is_24x7)}>
                    <MaterialCommunityIcons
                        name={formData.is_24x7 ? "toggle-switch" : "toggle-switch-off-outline"}
                        size={48}
                        color={formData.is_24x7 ? '#246BFD' : '#ccc'}
                    />
                </TouchableOpacity>
            </View>

            {!formData.is_24x7 && (
                <Animated.View entering={FadeIn} layout={Layout.springify()}>
                    <Space height={16} />
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <View style={{ flex: 1 }}>
                            <MandatoryLabel text={t('puncture_opening_time')} />
                            <TouchableOpacity
                                style={styles.datetimeBox}
                                onPress={() => setTimePickerOpen({ visible: true, type: 'opening' })}
                            >
                                <Text style={styles.datetimeText}>
                                    {formData.opening_time ? moment(formData.opening_time).format('hh:mm A') : '00:00'}
                                </Text>
                                <Ionicons name="time-outline" size={20} color="#246BFD" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <MandatoryLabel text={t('puncture_closing_time')} />
                            <TouchableOpacity
                                style={styles.datetimeBox}
                                onPress={() => setTimePickerOpen({ visible: true, type: 'closing' })}
                            >
                                <Text style={styles.datetimeText}>
                                    {formData.closing_time ? moment(formData.closing_time).format('hh:mm A') : '00:00'}
                                </Text>
                                <Ionicons name="time-outline" size={20} color="#246BFD" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}

            <Space height={24} />
            <View style={styles.switchRow}>
                <View>
                    <Text style={styles.classicLabel}>{t('puncture_on_road_service')}</Text>
                    <Text style={styles.helperText}>{t('puncture_on_road_service_helper')}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => updateFormData('on_road_service', !formData.on_road_service)}
                >
                    <MaterialCommunityIcons
                        name={formData.on_road_service ? "toggle-switch" : "toggle-switch-off-outline"}
                        size={48}
                        color={formData.on_road_service ? '#246BFD' : '#ccc'}
                    />
                </TouchableOpacity>
            </View>

            {formData.on_road_service && (
                <Animated.View entering={FadeIn} layout={Layout.springify()}>
                    <Space height={16} />
                    <Text style={styles.classicLabel}>{t('puncture_mobile_radius')}</Text>
                    <TouchableOpacity
                        style={[styles.classicInput, { justifyContent: 'center' }]}
                        onPress={() => setRadiusModal(true)}
                    >
                        <Text style={{ color: formData.mobile_radius ? '#333' : '#999', fontSize: 16 }}>
                            {formData.mobile_radius ? `${formData.mobile_radius} KM` : t('puncture_select_radius')}
                        </Text>
                        <Ionicons name="caret-down" size={16} color="#999" style={{ position: 'absolute', right: 15 }} />
                    </TouchableOpacity>

                    <Modal visible={radiusModal} transparent animationType="fade">
                        <View style={styles.yearPickerOverlay}>
                            <View style={styles.yearPickerContainer}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('puncture_mobile_radius')}</Text>
                                    <TouchableOpacity onPress={() => setRadiusModal(false)}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={['5', '10', '15', '20', '30', '40', '50', '75', '100']}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%' }}
                                            onPress={() => {
                                                updateFormData('mobile_radius', item);
                                                setRadiusModal(false);
                                            }}
                                        >
                                            <Text style={{ fontSize: 16, color: formData.mobile_radius === item ? '#246BFD' : '#333', fontWeight: formData.mobile_radius === item ? '600' : '400' }}>
                                                {item} KM
                                            </Text>
                                            {formData.mobile_radius === item && (
                                                <Ionicons name="checkmark" size={20} color="#246BFD" style={{ position: 'absolute', right: 0, top: 15 }} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </Modal>
                </Animated.View>
            )}

            <Text style={styles.classicLabel}>{t('puncture_avg_service_time')} <Text style={styles.optionalText}>{t('puncture_optional')}</Text></Text>
            <TouchableOpacity
                style={[styles.classicInput, { justifyContent: 'center' }]}
                onPress={() => setServiceTimeModal(true)}
            >
                <Text style={{ color: formData.avg_service_time ? '#333' : '#999', fontSize: 16 }}>
                    {formData.avg_service_time || t('puncture_select_time')}
                </Text>
                <Ionicons name="caret-down" size={16} color="#999" style={{ position: 'absolute', right: 15 }} />
            </TouchableOpacity>

            <Modal visible={serviceTimeModal} transparent animationType="fade">
                <View style={styles.yearPickerOverlay}>
                    <View style={styles.yearPickerContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('puncture_avg_service_time')}</Text>
                            <TouchableOpacity onPress={() => setServiceTimeModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={['15 Mins', '30 Mins', '45 Mins', '1 Hour', 'More than 1 Hour']}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%' }}
                                    onPress={() => {
                                        updateFormData('avg_service_time', item);
                                        setServiceTimeModal(false);
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: formData.avg_service_time === item ? '#246BFD' : '#333', fontWeight: formData.avg_service_time === item ? '600' : '400' }}>
                                        {item}
                                    </Text>
                                    {formData.avg_service_time === item && (
                                        <Ionicons name="checkmark" size={20} color="#246BFD" style={{ position: 'absolute', right: 0, top: 15 }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </Animated.View>
    );

    const renderServices = () => {
        const servicesList = [
            { key: 'Tube Puncture', label: 'puncture_service_tube' },
            { key: 'Tubeless Tyre Repair', label: 'puncture_service_tubeless' },
            { key: 'Tyre Replacement', label: 'puncture_service_tyre_replacement' },
            { key: 'Nitrogen / Air Filling', label: 'puncture_service_air' },
            { key: 'Stepney Installation', label: 'puncture_service_stepney' },
            { key: 'Wheel Balancing', label: 'puncture_service_balancing' },
            { key: 'Minor Mechanical Repair', label: 'puncture_service_mechanical' },
            { key: 'Jump Start / Battery Help', label: 'puncture_service_battery' },
            { key: 'Emergency Night Service', label: 'puncture_service_emergency' }
        ];

        return (
            <View style={styles.stepContainer}>
                <Text style={[styles.helperText, { marginBottom: 15 }]}>{t('puncture_select_services_helper')}</Text>

                <View style={styles.gridContainer}>
                    {servicesList.map(item => {
                        const isSelected = userEdit?.services?.includes(item.key);
                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                                onPress={() => toggleSelection('services', item.key)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>{t(item.label)}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderVehicleCoverage = () => {
        const vehicles = [
            { key: 'Bike', label: 'puncture_vehicle_bike' },
            { key: 'Car', label: 'puncture_vehicle_car' },
            { key: 'Mini Truck', label: 'puncture_vehicle_mini_truck' },
            { key: 'Truck (6 Tyre)', label: 'puncture_vehicle_truck_6' },
            { key: 'Truck (10 / 12 / 14 Tyre)', label: 'puncture_vehicle_truck_heavy' },
            { key: 'Trailer', label: 'puncture_vehicle_trailer' },
            { key: 'Bus', label: 'puncture_vehicle_bus' }
        ];

        return (
            <View style={styles.stepContainer}>
                <Text style={[styles.helperText, { marginBottom: 15 }]}>{t('puncture_vehicle_coverage_helper')}</Text>

                <View style={styles.chipsRow}>
                    {vehicles.map(v => (
                        <TouchableOpacity
                            key={v.key}
                            style={[styles.chip, userEdit?.vehicle_coverage?.includes(v.key) && styles.chipSelected]}
                            onPress={() => toggleSelection('vehicle_coverage', v.key)}
                        >
                            <Text style={[styles.chipText, userEdit?.vehicle_coverage?.includes(v.key) && styles.chipTextSelected]}>{t(v.label)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderPhotos = () => {
        const categoryId = 'all_photos';
        const photos = formData.shop_photos?.[categoryId] || [];

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.classicLabel}>{t('puncture_shop_photos')}</Text>
                <Text style={[styles.helperText, { marginBottom: 20 }]}>
                    {t('puncture_upload_photos_helper')}
                </Text>

                {photos.length === 0 ? (
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
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#246BFD', marginTop: 10 }}>{t('puncture_tap_to_upload')}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ marginBottom: 20 }}>
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#E3F2FD',
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#246BFD',
                                borderStyle: 'dashed',
                                marginBottom: 20
                            }}
                            activeOpacity={0.7}
                            onPress={() => setPhotoModal({ visible: true, categoryId: categoryId })}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#246BFD" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#246BFD' }}>Add More Photos</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {photos.map((uri: string, idx: number) => (
                                <View key={idx} style={{ position: 'relative', width: '31%', aspectRatio: 1, marginBottom: 10 }}>
                                    <FastImage
                                        source={{ uri }}
                                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                    />
                                    <TouchableOpacity
                                        style={styles.removePhotoBtn}
                                        onPress={() => removePhoto(categoryId, idx)}
                                    >
                                        <Ionicons name="close" size={12} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <Modal visible={shopPhotoInstructionModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
                            <View style={{ backgroundColor: '#F8F9FA', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0EAFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="camera" size={32} color="#246BFD" />
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>{t('puncture_photo_requirements')}</Text>
                                <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>{t('puncture_photo_guidelines_sub')}</Text>
                            </View>

                            <View style={{ padding: 25, width: '100%' }}>
                                {[
                                    t('puncture_photo_shop_front'),
                                    t('puncture_photo_service_area'),
                                    t('puncture_photo_tools'),
                                    t('puncture_photo_team'),
                                    t('puncture_photo_mobile_van')
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
                                    <Text style={styles.modalBtnText}>{t('puncture_got_it_upload')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    };

    const renderCurrentStep = () => {
        switch (STEPS[currentStep]?.id) {
            case 'basic_info': return renderBasicInfo();
            case 'location_details': return renderLocationDetails();
            case 'operational_details': return renderOperationalDetails();
            case 'services_offered': return renderServices();
            case 'vehicle_coverage': return renderVehicleCoverage();
            case 'photos': return renderPhotos();
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F7FE" />
            <Space height={safeAreaInsets.top} />

            <View style={styles.header}>
                {currentStep > 0 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                )}
                <View style={[styles.progressContainer, currentStep === 0 && { marginLeft: 0 }]}>
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
                    ref={scrollViewRef}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 180 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
                        {renderCurrentStep()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom || 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                <TouchableOpacity
                    style={[styles.nextButton, { width: '100%' }]}
                    onPress={handleNext}
                    disabled={finishing}
                >
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.nextButtonText}>
                                {currentStep === STEPS.length - 1 ? t('puncture_submit_profile') : t('puncture_next') || "Next"}
                            </Text>
                            {currentStep !== STEPS.length - 1 && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Time Picker Modal */}
            <Modal
                visible={timePickerOpen.visible}
                transparent
                animationType="fade"
                onRequestClose={() => setTimePickerOpen({ ...timePickerOpen, visible: false })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Select {timePickerOpen.type === 'opening' ? 'Opening' : 'Closing'} Time
                        </Text>
                        <DatePicker
                            date={
                                (timePickerOpen.type === 'opening' && formData.opening_time) ? new Date(formData.opening_time) :
                                    (timePickerOpen.type === 'closing' && formData.closing_time) ? new Date(formData.closing_time) :
                                        new Date()
                            }
                            mode="time"
                            // @ts-ignore
                            textColor="#000000"
                            theme="light"
                            onDateChange={(date) => {
                                const val = date.toISOString();
                                if (timePickerOpen.type === 'opening') updateFormData('opening_time', val);
                                else updateFormData('closing_time', val);
                            }}
                        />
                        <TouchableOpacity
                            onPress={() => setTimePickerOpen({ visible: false, type: null })}
                            style={styles.modalBtn}
                        >
                            <Text style={styles.modalBtnText}>{t('puncture_confirm_time')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
                            {t('punctureLocationWarningMessage') || 'Before doing share location please stay near or at your puncture shop to get perfect location.'}
                        </Text>
                        <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                                onPress={() => setLocationWarningModalVisible(false)}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563' }}>{t('puncture_cancel')}</Text>
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

            {/* Photo Selection Modal */}
            <Modal
                transparent={true}
                visible={photoModal.visible}
                animationType="slide"
                onRequestClose={() => setPhotoModal({ visible: false, categoryId: null })}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPhotoModal({ visible: false, categoryId: null })}
                >
                    <View style={[styles.modalContent, { width: '90%', padding: 20 }]}>
                        <Text style={[styles.modalTitle, { marginBottom: 10, textAlign: 'left' }]}>{t('puncture_choose_photo_source')}</Text>
                        <Text style={{ color: '#666', marginBottom: 20 }}>{t('puncture_photo_source_subtitle')}</Text>

                        <View style={{ flexDirection: 'row', gap: 20, width: '100%' }}>
                            <TouchableOpacity style={styles.photoSourceBtn} onPress={() => handlePickImage('camera')}>
                                <View style={[styles.photoSourceIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Ionicons name="camera" size={30} color="#1976D2" />
                                </View>
                                <Text style={styles.photoSourceText}>{t('puncture_camera')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoSourceBtn} onPress={() => handlePickImage('gallery')}>
                                <View style={[styles.photoSourceIcon, { backgroundColor: '#E8F5E9' }]}>
                                    <Ionicons name="images" size={30} color="#2E7D32" />
                                </View>
                                <Text style={styles.photoSourceText}>{t('puncture_gallery')}</Text>
                            </TouchableOpacity>
                        </View>
                        <Space height={20} />
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: '#f0f0f0', elevation: 0, marginTop: 0, width: '100%' }]}
                            onPress={() => setPhotoModal({ visible: false, categoryId: null })}
                        >
                            <Text style={[styles.modalBtnText, { color: '#333' }]}>{t('puncture_cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', paddingVertical: 10, borderRadius: 12, marginTop: 5 },
    gpsButtonText: { color: 'white', fontWeight: '600', marginLeft: 10, fontSize: 14 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    gpsInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, marginTop: 12 },
    gpsText: { fontSize: 13, color: '#2E7D32', marginLeft: 8, fontWeight: '500' },
    gpsTextCoords: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    gpsButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    datetimeBox: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0' },
    datetimeText: { fontSize: 16, color: '#333', fontWeight: '500' },

    // Grid (Facilities/Services)
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '48%', backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
    gridItemSelected: { borderColor: '#246BFD', backgroundColor: '#246BFD' }, // Solid blue background
    gridItemText: { marginLeft: 10, fontSize: 14, color: '#555', flex: 1 },
    gridItemTextSelected: { color: 'white', fontWeight: '600' }, // White text
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    radioCircleSelected: { borderColor: 'white' }, // White border on blue bg
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'white' }, // White dot

    // Photo Upload
    photoCategoryBlock: { marginBottom: 15 },
    photoUploadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
    photoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
    photoCatLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
    photoCatSub: { fontSize: 12, color: '#999', marginTop: 2 },
    uploadActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f9f9f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
    thumbnailScroll: { marginTop: 8, paddingLeft: 10 },
    thumbnailContainer: { marginRight: 10, position: 'relative' },
    thumbnail: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    removePhotoBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF3B30', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25, width: '85%', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 20 },
    modalBtn: { marginTop: 25, backgroundColor: '#246BFD', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
    modalBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    modalCancelBtn: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalCancelText: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
    photoSourceBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
    photoSourceIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    photoSourceText: { fontSize: 16, fontWeight: '600', color: '#333' },

    // Minimal Input Styles
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB', height: 52 },
    cleanInput: { flex: 1, height: 50, fontSize: 16, color: '#333' },

    // Year Picker Modal
    yearPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    yearPickerContainer: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '80%', maxHeight: '60%' },

    // Shop Type Grid
    shopTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
    shopTypeCard: { width: '48%', backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 30, borderWidth: 1, borderColor: '#eee', marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
    shopTypeCardSelected: { borderColor: '#246BFD', backgroundColor: '#246BFD' },
    shopTypeText: { color: '#666', fontWeight: '500', fontSize: 13, textAlign: 'center' },
    shopTypeTextSelected: { color: 'white', fontWeight: '600' },
});
