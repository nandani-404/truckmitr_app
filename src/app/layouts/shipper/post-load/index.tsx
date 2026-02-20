import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
    DeviceEventEmitter,
} from 'react-native';
import { useSelector } from 'react-redux';
import Animated, {
    FadeIn,
    Easing,
    useSharedValue,
    withTiming,
    withSpring,
    useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import axiosInstance from '../../../../utils/config/axiosInstance';
import { END_POINTS } from '../../../../utils/config';
import { STACKS } from '@truckmitr/stacks/stacks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const { width } = Dimensions.get('window');

// --- Icons ---
const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const LocationPinIcon = ({ color = "#3b82f6" }: { color?: string }) => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0">
        <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </Svg>
);

// --- Load Steps Configuration ---
const LOAD_STEPS = [
    { id: 'shipping_details', title: 'Shipping Details', subtitle: 'Enter loading and unloading points', icon: 'location-outline' },
    { id: 'date_time', title: 'Pickup Date & Time', subtitle: 'When do you need the truck?', icon: 'calendar-outline' },
    { id: 'load_quantity', title: 'Load Quantity', subtitle: 'Enter quantity in Tonnes', icon: 'cube-outline' },
    { id: 'body_type', title: 'Body Type', subtitle: 'Select truck body type', icon: 'car-outline' },
    { id: 'vehicle_type', title: 'Vehicle Type', subtitle: 'Select vehicle length', icon: 'resize-outline' },
    { id: 'material_type', title: 'Material Type', subtitle: 'What are you shipping?', icon: 'pricetag-outline' },
    { id: 'offered_price', title: 'Offered Price', subtitle: 'Enter your budget', icon: 'cash-outline' },
];

// --- Custom Validation Modal Component ---
const ValidationModal = ({
    visible,
    message,
    onClose,
    title = "Validation Error"
}: {
    visible: boolean;
    message: string;
    onClose: () => void;
    title?: string;
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.validationModalCard}
                >
                    <View style={styles.modalIconContainer}>
                        <Ionicons name="alert-circle" size={40} color="#EF4444" />
                    </View>
                    <Text style={styles.modalTitleText}>{title}</Text>
                    <Text style={styles.modalMessageText}>{message}</Text>
                    <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.modalCloseBtnText}>GOT IT</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const ShipperPostLoad = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const safeAreaInsets = useSafeAreaInsets();

    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [originLocation, setOriginLocation] = useState('');
    const [destinationLocation, setDestinationLocation] = useState('');
    const [originLat, setOriginLat] = useState('');
    const [originLon, setOriginLon] = useState('');
    const [destinationLat, setDestinationLat] = useState('');
    const [destinationLon, setDestinationLon] = useState('');
    const [exactOriginLocation, setExactOriginLocation] = useState('');
    const [exactDestinationLocation, setExactDestinationLocation] = useState('');
    const [loadingCityState, setLoadingCityState] = useState('');
    const [unloadingCityState, setUnloadingCityState] = useState('');

    const [loadQuantity, setLoadQuantity] = useState('');
    const [materialType, setMaterialType] = useState('Select Material');
    const [materialId, setMaterialId] = useState<number | null>(null);

    const materialsFromRedux = useSelector((state: any) => state.shipper.materials);

    const [vehicleBodies, setVehicleBodies] = useState<any[]>([]);
    const [selectedBodyType, setSelectedBodyType] = useState('');
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [isBodiesLoading, setIsBodiesLoading] = useState(false);

    const [vehicleLengths, setVehicleLengths] = useState<any[]>([]);
    const [selectedVehicleType, setSelectedVehicleType] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [isLengthsLoading, setIsLengthsLoading] = useState(false);

    const [offeredPrice, setOfferedPrice] = useState('');
    const [pickupDate, setPickupDate] = useState<Date | null>(null);
    const [loadTime, setLoadTime] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [additionalNote, setAdditionalNote] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation Modal State
    const [validationModal, setValidationModal] = useState({
        visible: false,
        message: '',
        title: 'Missing Details'
    });

    const showAlert = (message: string, title = 'Missing Details') => {
        setValidationModal({
            visible: true,
            message,
            title
        });
    };

    // Location AutoComplete
    /*
    const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
    const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
    const [isSearchingDest, setIsSearchingDest] = useState(false);
    const locationiqKey = "pk.4cb9faeef9f32f52cfb9aecfe13f7adc";
    */
    const GOOGLE_MAPS_APIKEY = "AIzaSyCjnRRjhyPaOnsCsAuwKCCNIYfxo8Q8os0";

    // Material Modal
    const [isMaterialVisible, setMaterialVisible] = useState(false);

    // Animations
    const progressWidth = useSharedValue(0);
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);
    const contentScale = useSharedValue(1);

    const progressPercent = ((currentStep + 1) / LOAD_STEPS.length) * 100;

    useEffect(() => {
        progressWidth.value = withTiming(progressPercent, {
            duration: 600,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
        });
    }, [progressPercent]);

    useEffect(() => {
        contentOpacity.value = 0;
        contentTranslateX.value = 50;
        contentScale.value = 0.95;

        contentOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
        contentTranslateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        contentScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, [currentStep]);

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('LOCATION_SELECTED', (loc) => {
            console.log(`[PostLoad] Selected ${loc.pointType}:`, {
                city: loc.city,
                state: loc.state,
                fullAddress: loc.description
            });

            if (loc.pointType === 'destination') {
                setDestinationLocation(loc.description);
                setDestinationLat(loc.lat);
                setDestinationLon(loc.lon);
                setUnloadingCityState(loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.city || loc.state || '');
            } else {
                setOriginLocation(loc.description);
                setOriginLat(loc.lat);
                setOriginLon(loc.lon);
                setLoadingCityState(loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.city || loc.state || '');
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [
            { translateX: contentTranslateX.value },
            { scale: contentScale.value }
        ]
    }));

    // --- Helper Functions ---
    const extractCityState = (item: any) => {
        try {
            if (!item || !item.address) return '';
            const address = item.address;
            const city = address.city || address.town || address.village || address.name || '';
            const state = address.state || '';

            if (city && state) return `${city}, ${state}`;
            return city || state || '';
        } catch (error) {
            console.error('Error extracting city/state:', error);
            return '';
        }
    };

    // --- API Logic ---
    const fetchVehicleTypesByQuantity = async (qty: string) => {
        if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
        setIsBodiesLoading(true);
        try {
            const response = await axiosInstance.post(END_POINTS.POST_LOAD_VEHICLE_BODIES, {
                material_quantity: qty,
            });
            if (response?.data?.data) {
                setVehicleBodies(response.data.data);
            } else if (Array.isArray(response?.data)) {
                setVehicleBodies(response.data);
            }
        } catch (error) {
            console.error('Error fetching vehicle bodies:', error);
            setVehicleBodies([]);
        } finally {
            setIsBodiesLoading(false);
        }
    };

    const fetchVehicleLengths = async (bodyId: number, qty: string) => {
        if (!bodyId || !qty) return;
        setIsLengthsLoading(true);
        try {
            const response = await axiosInstance.post(END_POINTS.POST_LOAD_VEHICLE_LENGTHS, {
                vehicle_body: bodyId,
                material_quantity: qty,
            });
            if (response?.data?.data) {
                setVehicleLengths(response.data.data);
            } else if (Array.isArray(response?.data)) {
                setVehicleLengths(response.data);
            }
        } catch (error) {
            console.error('Error fetching vehicle lengths:', error);
            setVehicleLengths([]);
        } finally {
            setIsLengthsLoading(false);
        }
    };

    /*
    const fetchLocationIQSuggestions = async (query: string, type: 'origin' | 'destination') => {
        if (query.trim().length < 3) {
            if (type === 'origin') setOriginSuggestions([]);
            else setDestSuggestions([]);
            return;
        }
        if (type === 'origin') setIsSearchingOrigin(true);
        else setIsSearchingDest(true);
        try {
            const url = `https://api.locationiq.com/v1/autocomplete?key=${locationiqKey}&q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`;
            const response = await fetch(url);
            const data = await response.json();
            if (Array.isArray(data)) {
                if (type === 'origin') setOriginSuggestions(data);
                else setDestSuggestions(data);
            }
        } catch (error) {
            console.error('LocationIQ Error:', error);
        } finally {
            if (type === 'origin') setIsSearchingOrigin(false);
            else setIsSearchingDest(false);
        }
    };
    */

    // --- Search Timers ---
    /*
    const originSearchTimer = useRef<any>(null);
    useEffect(() => {
        if (originSearchTimer.current) clearTimeout(originSearchTimer.current);
        if (!originLocation) {
            setOriginSuggestions([]);
            return;
        }
        originSearchTimer.current = setTimeout(() => {
            if (originLocation && !originLat) {
                fetchLocationIQSuggestions(originLocation, 'origin');
            }
        }, 300);
        return () => clearTimeout(originSearchTimer.current);
    }, [originLocation]);

    const destSearchTimer = useRef<any>(null);
    useEffect(() => {
        if (destSearchTimer.current) clearTimeout(destSearchTimer.current);
        if (!destinationLocation) {
            setDestSuggestions([]);
            return;
        }
        destSearchTimer.current = setTimeout(() => {
            if (destinationLocation && !destinationLat) {
                fetchLocationIQSuggestions(destinationLocation, 'destination');
            }
        }, 300);
        return () => clearTimeout(destSearchTimer.current);
    }, [destinationLocation]);
    */

    // Auto-fetch bodies when quantity changes
    const qtyTimerRef = useRef<any>(null);
    useEffect(() => {
        if (qtyTimerRef.current) clearTimeout(qtyTimerRef.current);
        qtyTimerRef.current = setTimeout(() => {
            if (loadQuantity) fetchVehicleTypesByQuantity(loadQuantity);
        }, 500);
        return () => clearTimeout(qtyTimerRef.current);
    }, [loadQuantity]);

    // Auto-fetch lengths when body/quantity changes
    useEffect(() => {
        if (selectedBodyId && loadQuantity) {
            fetchVehicleLengths(selectedBodyId, loadQuantity);
        }
    }, [selectedBodyId, loadQuantity]);

    // --- Actions ---
    const handleNext = () => {
        const step = LOAD_STEPS[currentStep];

        if (step.id === 'shipping_details') {
            if (!originLocation || !destinationLocation || !exactOriginLocation || !exactDestinationLocation) {
                showAlert("Please fill all location fields to proceed.");
                return;
            }
        }
        if (step.id === 'date_time') {
            if (!pickupDate || !loadTime) {
                showAlert("Please select both pickup date and time.");
                return;
            }
        }
        if (step.id === 'load_quantity') {
            if (!loadQuantity) {
                showAlert("Please enter the total load quantity.");
                return;
            }
            const weight = parseFloat(loadQuantity);
            if (weight < 2.5 || weight > 45) {
                showAlert("Total weight must be between 2.5 and 45 tonnes.", "Invalid Weight");
                return;
            }
        }
        if (step.id === 'body_type') {
            if (!selectedBodyId) {
                showAlert("Please select a body type for your load.");
                return;
            }
        }
        if (step.id === 'vehicle_type') {
            if (!selectedVehicleId) {
                showAlert("Please select a vehicle length for your load.");
                return;
            }
        }
        if (step.id === 'material_type') {
            if (!materialId) {
                showAlert("Please select a material type.");
                return;
            }
        }
        if (step.id === 'offered_price') {
            if (!offeredPrice) {
                showAlert("Please enter your offered price.");
                return;
            }
        }

        if (currentStep < LOAD_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigation.goBack();
        }
    };

    const formatPrice = (value: string) => {
        if (!value) return '';
        const number = value.replace(/,/g, '');
        if (isNaN(Number(number))) return value;
        return Number(number).toLocaleString('en-IN');
    };

    const unformatPrice = (value: string) => {
        return value.replace(/,/g, '');
    };

    const resetForm = () => {
        setOriginLocation('');
        setDestinationLocation('');
        setOriginLat('');
        setOriginLon('');
        setDestinationLat('');
        setDestinationLon('');
        setExactOriginLocation('');
        setExactDestinationLocation('');
        setLoadQuantity('');
        setMaterialType('Select Material');
        setMaterialId(null);
        setVehicleBodies([]);
        setSelectedBodyType('');
        setSelectedBodyId(null);
        setVehicleLengths([]);
        setSelectedVehicleType('');
        setSelectedVehicleId(null);
        setOfferedPrice('');
        setPickupDate(null);
        setLoadTime(null);
        setAdditionalNote('');
        setLoadingCityState('');
        setUnloadingCityState('');
        setCurrentStep(0);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                origin_location: originLocation,
                destination_location: destinationLocation,
                origin_lat: originLat,
                origin_lon: originLon,
                destination_lat: destinationLat,
                destination_lon: destinationLon,
                exact_origin_location: exactOriginLocation,
                exact_destination_location: exactDestinationLocation,
                meterial: materialId,
                meterial_quantity: loadQuantity,
                vechicle_body: selectedBodyId,
                vechicle_type: selectedVehicleId,
                price: unformatPrice(offeredPrice),
                additional_note: additionalNote,
                picup_date: pickupDate ? moment(pickupDate).format('YYYY-MM-DD') : null,
                load_time: loadTime ? moment(loadTime).format('HH:mm') : null,
                loading_city_state: loadingCityState,
                unloading_city_state: unloadingCityState,
            };
            const response = await axiosInstance.post(END_POINTS.POST_LOAD_SUBMIT, payload);
            if (response.data && response.data.success) {
                Alert.alert('Success', 'Load Posted Successfully!', [
                    {
                        text: 'OK', onPress: () => {
                            resetForm();
                            navigation.navigate(STACKS.SHIPPER_MY_LOADS);
                        }
                    }
                ]);
            } else {
                const errorMsg = response.data?.message || "Failed to post load. Please try again.";
                showAlert(errorMsg, "Submission Error");
            }
        } catch (error: any) {
            console.error('Error posting load:', error);
            const serverError = error.response?.data?.message || "Failed to post load. Please try again later.";
            showAlert(serverError, "Submission Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        const step = LOAD_STEPS[currentStep];

        switch (step.id) {
            case 'shipping_details':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Loading Point</Text>
                        <TouchableOpacity
                            style={[styles.classicBox, { marginBottom: 10 }]}
                            onPress={() => navigation.navigate(STACKS.MAP_VIEW, {
                                returnScreen: STACKS.SHIPPER_POST_LOAD,
                                pointType: 'origin',
                                initialLocation: originLat && originLon ? {
                                    latitude: parseFloat(originLat),
                                    longitude: parseFloat(originLon),
                                    address: originLocation
                                } : undefined
                            })}
                        >
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    color: originLocation ? '#212529' : '#999',
                                }}
                                numberOfLines={1}
                            >
                                {originLocation || 'Tap to select Loading Point (Map)'}
                            </Text>
                            <Ionicons name="map-outline" size={20} color="#3b82f6" />
                        </TouchableOpacity>

                        {/* Commented out previous inline autocomplete for Loading Point */}
                        {/*
                        <GooglePlacesAutocomplete
                            placeholder='Search City/Area'
                            onPress={(data, details = null) => {
                                setOriginLocation(data.description);
                                if (details) {
                                    setOriginLat(String(details.geometry.location.lat));
                                    setOriginLon(String(details.geometry.location.lng));

                                    // Extract city and state from address_components
                                    let city = '';
                                    let state = '';
                                    details.address_components.forEach(component => {
                                        if (component.types.includes('locality')) city = component.long_name;
                                        if (component.types.includes('administrative_area_level_1')) state = component.long_name;
                                    });
                                    setLoadingCityState(city && state ? `${city}, ${state}` : city || state || '');
                                }
                            }}
                            query={{
                                key: GOOGLE_MAPS_APIKEY,
                                language: 'en',
                                components: 'country:in',
                            }}
                            fetchDetails={true}
                            minLength={2}
                            debounce={400}
                            onFail={(error) => console.error('Google Places Error (Origin):', error)}
                            styles={{
                                container: { flex: 1 },
                                textInput: {
                                    height: 56,
                                    color: '#333',
                                    fontSize: 15,
                                    paddingHorizontal: 16,
                                    backgroundColor: 'white',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#CED4DA',
                                },
                                listView: {
                                    backgroundColor: 'white',
                                    borderRadius: 12,
                                    elevation: 5,
                                    zIndex: 1000,
                                    marginTop: 5,
                                },
                                row: { padding: 13, height: 44, flexDirection: 'row' },
                                separator: { height: 0.5, backgroundColor: '#c8c7cc' },
                                description: { fontSize: 14, color: '#333' },
                            }}
                            enablePoweredByContainer={false}
                            textInputProps={{
                                placeholderTextColor: '#999',
                            }}
                        />
                        */}
                        {/*
                        <View style={[styles.classicBox, { marginBottom: 10 }]}>
                            <TextInput
                                style={{ flex: 1, color: '#333' }}
                                placeholder="Search City/Area"
                                placeholderTextColor="#999"
                                value={originLocation}
                                onChangeText={(text) => {
                                    setOriginLocation(text);
                                    setOriginLat(''); setOriginLon('');
                                }}
                            />
                            {originSuggestions.length > 0 && isSearchingOrigin === false && (
                                <View style={styles.suggestionOverlay}>
                                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                        {originSuggestions.map((item, index) => (
                                            <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => {
                                                setOriginLocation(item.display_name);
                                                setOriginLat(item.lat);
                                                setOriginLon(item.lon);
                                                setLoadingCityState(extractCityState(item));
                                                setOriginSuggestions([]);
                                            }}>
                                                <Text numberOfLines={2} style={styles.suggestionText}>{item.display_name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        */}

                        <Text style={styles.classicLabel}>Full Loading Address</Text>
                        <TextInput
                            style={[styles.classicInput, { marginBottom: 20 }]}
                            placeholder="Shop No, Street, Landmark..."
                            placeholderTextColor="#999"
                            value={exactOriginLocation}
                            onChangeText={setExactOriginLocation}
                        />

                        <View style={styles.divider} />

                        <Text style={[styles.classicLabel, { marginTop: 15 }]}>Unloading Point</Text>
                        <TouchableOpacity
                            style={[styles.classicBox, { marginBottom: 10 }]}
                            onPress={() => navigation.navigate(STACKS.MAP_VIEW, {
                                returnScreen: STACKS.SHIPPER_POST_LOAD,
                                pointType: 'destination',
                                initialLocation: destinationLat && destinationLon ? {
                                    latitude: parseFloat(destinationLat),
                                    longitude: parseFloat(destinationLon),
                                    address: destinationLocation
                                } : undefined
                            })}
                        >
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    color: destinationLocation ? '#212529' : '#999',
                                }}
                                numberOfLines={1}
                            >
                                {destinationLocation || 'Tap to select Unloading Point (Map)'}
                            </Text>
                            <Ionicons name="map-outline" size={20} color="#3b82f6" />
                        </TouchableOpacity>

                        {/* Commented out GooglePlacesAutocomplete for Unloading Point */}
                        {/* 
                        <GooglePlacesAutocomplete
                            placeholder='Search City/Area'
                            onPress={(data, details = null) => {
                                setDestinationLocation(data.description);
                                if (details) {
                                    setDestinationLat(String(details.geometry.location.lat));
                                    setDestinationLon(String(details.geometry.location.lng));

                                    // Extract city and state from address_components
                                    let city = '';
                                    let state = '';
                                    details.address_components.forEach(component => {
                                        if (component.types.includes('locality')) city = component.long_name;
                                        if (component.types.includes('administrative_area_level_1')) state = component.long_name;
                                    });
                                    setUnloadingCityState(city && state ? `${city}, ${state}` : city || state || '');
                                }
                            }}
                            query={{
                                key: GOOGLE_MAPS_APIKEY,
                                language: 'en',
                                components: 'country:in',
                            }}
                            fetchDetails={true}
                            minLength={2}
                            debounce={400}
                            onFail={(error) => console.error('Google Places Error (Destination):', error)}
                            styles={{
                                container: { flex: 1 },
                                textInput: {
                                    height: 56,
                                    color: '#333',
                                    fontSize: 15,
                                    paddingHorizontal: 16,
                                    backgroundColor: 'white',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#CED4DA',
                                },
                                listView: {
                                    backgroundColor: 'white',
                                    borderRadius: 12,
                                    elevation: 5,
                                    zIndex: 1000,
                                    marginTop: 5,
                                },
                                row: { padding: 13, height: 44, flexDirection: 'row' },
                                separator: { height: 0.5, backgroundColor: '#c8c7cc' },
                                description: { fontSize: 14, color: '#333' },
                            }}
                            enablePoweredByContainer={false}
                            textInputProps={{
                                placeholderTextColor: '#999',
                            }}
                        />
                        */}
                        {/* 
                        <View style={[styles.classicBox, { marginBottom: 10 }]}>
                            <TextInput
                                style={{ flex: 1, color: '#333' }}
                                placeholder="Search City/Area"
                                placeholderTextColor="#999"
                                value={destinationLocation}
                                onChangeText={(text) => {
                                    setDestinationLocation(text);
                                    setDestinationLat(''); setDestinationLon('');
                                }}
                            />
                            {destSuggestions.length > 0 && isSearchingDest === false && (
                                <View style={[styles.suggestionOverlay, { top: undefined, bottom: 60 }]}>
                                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                        {destSuggestions.map((item, index) => (
                                            <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => {
                                                setDestinationLocation(item.display_name);
                                                setDestinationLat(item.lat);
                                                setDestinationLon(item.lon);
                                                setUnloadingCityState(extractCityState(item));
                                                setDestSuggestions([]);
                                            }}>
                                                <Text numberOfLines={2} style={styles.suggestionText}>{item.display_name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        */}

                        <Text style={styles.classicLabel}>Full Unloading Address</Text>
                        <TextInput
                            style={[styles.classicInput, { marginBottom: 20 }]}
                            placeholder="Shop No, Street, Landmark..."
                            placeholderTextColor="#999"
                            value={exactDestinationLocation}
                            onChangeText={setExactDestinationLocation}
                        />
                    </View>
                );
            case 'date_time':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Pickup Date</Text>
                        <TouchableOpacity style={styles.classicBox} onPress={() => setShowDatePicker(true)}>
                            <Text style={[styles.classicBoxText, !pickupDate && { color: '#999' }]}>
                                {pickupDate ? moment(pickupDate).format('ddd, DD MMM YYYY') : 'Select Date'}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={pickupDate || new Date()}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                maximumDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
                                onChange={(e, date) => {
                                    setShowDatePicker(false);
                                    if (date) setPickupDate(date);
                                }}
                            />
                        )}

                        <View style={{ height: 24 }} />

                        <Text style={styles.classicLabel}>Pickup Time</Text>
                        <TouchableOpacity style={styles.classicBox} onPress={() => setShowTimePicker(true)}>
                            <Text style={[styles.classicBoxText, !loadTime && { color: '#999' }]}>
                                {loadTime ? moment(loadTime).format('hh:mm A') : 'Select Time'}
                            </Text>
                            <Ionicons name="time-outline" size={20} color="#666" />
                        </TouchableOpacity>

                        {showTimePicker && (
                            <DateTimePicker
                                value={loadTime || new Date()}
                                mode="time"
                                display="default"
                                onChange={(e, date) => {
                                    setShowTimePicker(false);
                                    if (date) setLoadTime(date);
                                }}
                            />
                        )}
                    </View>
                );
            case 'load_quantity':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Total Weight (Tonnes)</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            Enter the approximate weight of your goods (Min: 2.5 | Max: 45)
                        </Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="e.g. 15"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={loadQuantity}
                            onChangeText={setLoadQuantity}
                        />
                    </View>
                );
            case 'body_type':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Select Body Type</Text>
                        {isBodiesLoading ? (
                            <ActivityIndicator size="small" color="#246BFD" style={{ marginTop: 20 }} />
                        ) : (
                            <ScrollView style={{ maxHeight: 400 }}>
                                <View style={styles.vehicleGrid}>
                                    {vehicleBodies.map((body, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.vehicleTile, selectedBodyId === body.id && styles.vehicleTileSelected]}
                                            onPress={() => {
                                                setSelectedBodyType(body.name);
                                                setSelectedBodyId(body.id);
                                                setSelectedVehicleId(null);
                                            }}
                                        >
                                            <Text style={{ fontSize: 30, marginBottom: 8 }}>{body.icon || '🚛'}</Text>
                                            <Text style={[styles.vehicleLabel, selectedBodyId === body.id && styles.vehicleLabelSelected]}>
                                                {body.name}
                                            </Text>
                                            {selectedBodyId === body.id && (
                                                <View style={styles.vehicleCheckmark}>
                                                    <Ionicons name="checkmark-circle" size={20} color="#246BFD" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                    {vehicleBodies.length === 0 && (
                                        <Text style={{ textAlign: 'center', width: '100%', color: '#999', marginTop: 20 }}>
                                            Please enter load quantity first to see available trucks.
                                        </Text>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                );
            case 'vehicle_type':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Select Vehicle Length</Text>
                        {isLengthsLoading ? (
                            <ActivityIndicator size="small" color="#246BFD" style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.gridContainer}>
                                {vehicleLengths.map((len, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.experienceTile,
                                            selectedVehicleId === len.id && styles.experienceTileSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedVehicleType(len.length_label);
                                            setSelectedVehicleId(len.id);
                                        }}
                                    >
                                        <Text style={[styles.experienceTileText, selectedVehicleId === len.id && styles.experienceTileTextSelected]}>
                                            {len.length_label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {vehicleLengths.length === 0 && (
                                    <Text style={{ textAlign: 'center', width: '100%', color: '#999', marginTop: 20 }}>
                                        No lengths available for selected body type.
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                );
            case 'material_type':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Material Type</Text>
                        <TouchableOpacity style={styles.classicBox} onPress={() => setMaterialVisible(true)}>
                            <Text style={[styles.classicBoxText, materialType === 'Select Material' && { color: '#999' }]}>
                                {materialType}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        <MaterialCategoryModal
                            visible={isMaterialVisible}
                            categories={materialsFromRedux}
                            onSelect={(item: any) => {
                                setMaterialType(item.name);
                                setMaterialId(item.id);
                                setMaterialVisible(false);
                            }}
                            onClose={() => setMaterialVisible(false)}
                        />
                    </View>
                );
            case 'offered_price':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>Your Budget</Text>
                        <Text style={[styles.helperText, { marginBottom: 12, marginTop: 0 }]}>
                            Enter the price you are willing to pay (₹)
                        </Text>
                        <TextInput
                            style={[styles.classicInput, { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }]}
                            placeholder="₹ 0"
                            placeholderTextColor="#ccc"
                            keyboardType="numeric"
                            value={offeredPrice}
                            onChangeText={(val) => {
                                const raw = unformatPrice(val);
                                setOfferedPrice(formatPrice(raw));
                            }}
                        />

                        <Text style={styles.classicLabel}>Additional Note (Optional)</Text>
                        <TextInput
                            style={[styles.classicInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                            placeholder="e.g. Call before arrival, fragile goods..."
                            placeholderTextColor="#999"
                            multiline
                            value={additionalNote}
                            onChangeText={setAdditionalNote}
                        />

                        <Text style={{ marginTop: 20, color: '#666', fontSize: 13 }}>
                            Note: This price is negotiable with transporters.
                        </Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            <View style={[styles.header, { paddingTop: safeAreaInsets.top ? safeAreaInsets.top + 10 : 20 }]}>
                <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post A Load</Text>
                <View style={styles.navBtn} />
            </View>

            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                    Step {currentStep + 1} of {LOAD_STEPS.length}: {LOAD_STEPS[currentStep].title}
                </Text>
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
                </View>
            </View>

            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={100}
                enableAutomaticScroll={true}
            >
                <Animated.View style={[styles.stepHeader, animatedContentStyle]}>
                    <View style={[styles.stepIconContainer, { backgroundColor: '#E8F0FE' }]}>
                        <Ionicons name={LOAD_STEPS[currentStep].icon} size={24} color="#246BFD" />
                    </View>
                    <View style={styles.stepHeaderText}>
                        <Text style={styles.stepTitle}>{LOAD_STEPS[currentStep].title}</Text>
                        <Text style={styles.stepSubtitle}>{LOAD_STEPS[currentStep].subtitle}</Text>
                    </View>
                </Animated.View>

                <View style={styles.divider} />

                <Animated.View style={[styles.stepContainer, animatedContentStyle]}>
                    {renderStepContent()}
                </Animated.View>
            </KeyboardAwareScrollView>

            {!isKeyboardVisible && (
                <View style={[
                    styles.footer,
                    {
                        paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 10,
                        paddingTop: 8,
                        backgroundColor: '#F1F3F5',
                        borderTopWidth: 1,
                        width: '100%'
                    }
                ]}>
                    <TouchableOpacity
                        style={[styles.classicButton, { backgroundColor: '#246BFD' }]}
                        onPress={handleNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.classicButtonText}>
                                {currentStep === LOAD_STEPS.length - 1 ? 'POST LOAD' : 'NEXT STEP'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <ValidationModal
                visible={validationModal.visible}
                message={validationModal.message}
                title={validationModal.title}
                onClose={() => setValidationModal({ ...validationModal, visible: false })}
            />
        </View>
    );
};

// Material Category Modal
const MaterialCategoryModal = ({ visible, categories, onSelect, onClose }: any) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleCategory = (categoryId: number) => {
        setExpandedCategory(expandedCategory === String(categoryId) ? null : String(categoryId));
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        return categories.map((cat: any) => ({
            ...cat,
            children: (cat.children || []).filter((item: any) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter((cat: any) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || (cat.children && cat.children.length > 0)
        );
    }, [categories, searchQuery]);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={matStyles.container}>
                <View style={[matStyles.header, { paddingTop: 48 }]}>
                    <TouchableOpacity onPress={onClose}><BackIcon /></TouchableOpacity>
                    <Text style={matStyles.headerTitle}>Select Material</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={matStyles.searchContainer}>
                    <TextInput
                        style={matStyles.searchBox}
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {filteredCategories.map((category: any) => (
                        <View key={category.id} style={{ marginBottom: 8 }}>
                            <TouchableOpacity
                                style={matStyles.categoryHeader}
                                onPress={() => toggleCategory(category.id)}
                            >
                                <Text style={matStyles.categoryName}>{category.name}</Text>
                                <Ionicons name={expandedCategory === String(category.id) ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                            </TouchableOpacity>
                            {expandedCategory === String(category.id) && (
                                <View style={{ backgroundColor: '#fff', paddingLeft: 16 }}>
                                    {(category.children || []).map((item: any) => (
                                        <TouchableOpacity key={item.id} style={matStyles.itemRow} onPress={() => onSelect(item)}>
                                            <Text style={matStyles.itemText}>{item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
};

const matStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    searchContainer: { padding: 16 },
    searchBox: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, fontSize: 15 },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
    categoryName: { fontSize: 15, fontWeight: '600' },
    itemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    itemText: { fontSize: 15, color: '#333' },
});

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8F9FA' },
    navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#333', textTransform: 'uppercase', letterSpacing: 1 },
    progressInfo: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    progressText: { fontSize: 12, color: '#6C757D', marginBottom: 8, fontWeight: '500' },
    progressBarContainer: { height: 4, backgroundColor: '#E9ECEF', borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#246BFD', borderRadius: 2 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    stepIconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    stepHeaderText: { flex: 1 },
    stepTitle: { fontSize: 20, fontWeight: '700', color: '#212529', marginBottom: 4 },
    metricHighlight: {
        fontWeight: '700',
        color: '#0f172a',
    },

    // Custom Validation Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    validationModalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitleText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessageText: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalCloseBtn: {
        backgroundColor: '#246BFD',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#246BFD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalCloseBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    stepSubtitle: { fontSize: 13, color: '#6C757D' },
    divider: { height: 1, backgroundColor: '#E9ECEF', marginBottom: 24 },
    stepContainer: { width: '100%' },
    classicLabel: { fontSize: 15, fontWeight: '600', color: '#212529', marginBottom: 8 },
    classicBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#CED4DA', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 56 },
    classicBoxText: { fontSize: 15, color: '#212529' },
    classicInput: { borderWidth: 1, borderColor: '#CED4DA', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 56, fontSize: 15, color: '#212529' },
    helperText: { fontSize: 12, color: '#6C757D', marginTop: 6 },
    footer: { paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
    classicButton: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    classicButtonText: { color: 'white', fontSize: 16, fontWeight: '600', textTransform: 'uppercase' },
    vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vehicleTile: { width: '48%', backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: '#E9ECEF', padding: 16, marginBottom: 16, alignItems: 'center', position: 'relative' },
    vehicleTileSelected: { borderColor: '#246BFD', backgroundColor: '#F0F5FF' },
    vehicleLabel: { fontSize: 12, fontWeight: '600', color: '#495057', textAlign: 'center' },
    vehicleLabelSelected: { color: '#246BFD' },
    vehicleCheckmark: { position: 'absolute', top: 8, right: 8 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    experienceTile: { width: '48%', backgroundColor: 'white', borderRadius: 12, borderWidth: 1.5, borderColor: '#DEE2E6', paddingVertical: 18, paddingHorizontal: 12, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
    experienceTileSelected: { borderColor: '#246BFD', backgroundColor: '#F0F5FF' },
    experienceTileText: { fontSize: 14, fontWeight: '600', color: '#495057', textAlign: 'center' },
    experienceTileTextSelected: { color: '#246BFD', fontWeight: '700' },
    suggestionOverlay: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: 'white', borderRadius: 12, elevation: 5, zIndex: 100, borderWidth: 1, borderColor: '#EEE' },
    suggestionItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    suggestionText: { fontSize: 14, color: '#333' }
});

export default ShipperPostLoad;