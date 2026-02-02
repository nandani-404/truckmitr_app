import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Platform, PermissionsAndroid, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { MandatoryLabel, OptionalLabel } from '../components/FormComponents';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { fetchCompleteLocationDetails } from '@truckmitr/src/utils/maps/location/location.detail';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// States list for state_id lookup (matching backend IDs)
const statesList = [
    { id: '1', name: 'Andaman and Nicobar Islands' },
    { id: '2', name: 'Andhra Pradesh' },
    { id: '3', name: 'Arunachal Pradesh' },
    { id: '4', name: 'Assam' },
    { id: '5', name: 'Bihar' },
    { id: '6', name: 'Chandigarh' },
    { id: '7', name: 'Chhattisgarh' },
    { id: '8', name: 'Dadra and Nagar Haveli' },
    { id: '9', name: 'Delhi' },
    { id: '10', name: 'Goa' },
    { id: '11', name: 'Gujarat' },
    { id: '12', name: 'Haryana' },
    { id: '13', name: 'Himachal Pradesh' },
    { id: '14', name: 'Jammu and Kashmir' },
    { id: '15', name: 'Jharkhand' },
    { id: '16', name: 'Karnataka' },
    { id: '17', name: 'Kerala' },
    { id: '18', name: 'Ladakh' },
    { id: '19', name: 'Lakshadweep' },
    { id: '20', name: 'Madhya Pradesh' },
    { id: '21', name: 'Maharashtra' },
    { id: '22', name: 'Manipur' },
    { id: '23', name: 'Meghalaya' },
    { id: '24', name: 'Mizoram' },
    { id: '25', name: 'Nagaland' },
    { id: '26', name: 'Odisha' },
    { id: '27', name: 'Others' },
    { id: '28', name: 'Puducherry' },
    { id: '29', name: 'Punjab' },
    { id: '30', name: 'Rajasthan' },
    { id: '31', name: 'Sikkim' },
    { id: '32', name: 'Tamil Nadu' },
    { id: '33', name: 'Telangana' },
    { id: '34', name: 'Tripura' },
    { id: '35', name: 'Uttar Pradesh' },
    { id: '36', name: 'Uttarakhand' },
    { id: '37', name: 'West Bengal' },
    { id: '38', name: 'Daman and Diu' },
];

const LocationDetailsTab = () => {
    const { t } = useTranslation();
    // Get userEdit data from Redux (userEdit is for editing, keeps local changes)
    const { userEdit } = useSelector((state: any) => state?.user);
    const dispatch = useDispatch();
    const colors = useColor();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);  // Loading state for initial API fetch

    // Local state for form edits (initialized from Redux userEdit)
    // State is mapped from dhaba_location.state_id first, then falls back to userEdit.state
    const [formData, setFormData] = useState(() => {
        // Map state from dhaba_location.state_id first
        let mappedState = '';
        if (userEdit?.dhaba_location?.state_id) {
            const stateFromId = statesList.find(s => s.id === userEdit.dhaba_location.state_id);
            mappedState = stateFromId?.name || '';
        }
        // Fallback to userEdit.state if no state_id
        if (!mappedState && userEdit?.state) {
            const selectedState = statesList.find(s => s.name?.toLowerCase() === userEdit.state?.toLowerCase());
            mappedState = selectedState?.name || '';
        }

        return {
            address: userEdit?.dhaba_location?.full_address || '',
            landmark: userEdit?.dhaba_location?.landmark || '',
            district: userEdit?.dhaba_location?.district || '',
            state: mappedState,
            pincode: userEdit?.dhaba_location?.pincode || '',
        };
    });

    // Local location state for GPS coordinates
    const [localLocation, setLocalLocation] = useState<{ lat: string; lng: string } | null>(
        userEdit?.dhaba_location?.latitude && userEdit?.dhaba_location?.longitude
            ? {
                lat: userEdit.dhaba_location.latitude,
                lng: userEdit.dhaba_location.longitude
            }
            : null
    );

    const [pinnedAddress, setPinnedAddress] = useState<string>('');

    // NOTE: We don't sync from userEdit changes because fetchLocationData already 
    // populates the form from API. Syncing from userEdit would cause a race condition
    // where stale Redux data overwrites the fresh API data.

    // Fetch location data from API on mount
    useEffect(() => {
        fetchLocationData();
    }, []);

    const fetchLocationData = async () => {
        setLoading(true);
        try {
            console.log('LocationDetailsTab: Fetching location data from API...');
            const response: any = await axiosInstance.get(END_POINTS.GET_DHABA_BUSSINESS_LOCATION);
            // console.log('LocationDetailsTab: API Response:', response?.data);
            // console.log('success: API Response:', response?.data?.success);
            // console.log('location: API Response:', response?.data?.location);
            if (response?.data?.success && response?.data?.location) {
                const location = response.data.location;

                // Map state from state_id
                let mappedState = '';
                if (location.state_id) {
                    const stateFromId = statesList.find(s => s.id === location.state_id);
                    mappedState = stateFromId?.name || '';
                }

                // Update form data
                setFormData({
                    address: location.full_address || '',
                    landmark: location.landmark || '',
                    district: location.district || '',
                    state: mappedState,
                    pincode: location.pincode || '',
                });

                // Update local location
                if (location.latitude && location.longitude) {
                    setLocalLocation({
                        lat: location.latitude,
                        lng: location.longitude
                    });

                    // Fetch address from Maps API using stored coordinates
                    fetchCompleteLocationDetails({
                        latitude: parseFloat(location.latitude),
                        longitude: parseFloat(location.longitude)
                    }).then((details) => {
                        if (details?.displayName) {
                            setPinnedAddress(details.displayName);
                        }
                    }).catch(err => console.log('Error fetching address for stored coords:', err));
                }

                // Update Redux userEdit with fetched location
                dispatch(userEditAction({
                    ...userEdit,
                    dhaba_location: location
                }));
            }
        } catch (error: any) {
            console.error('LocationDetailsTab: Fetch Error:', error);
            // On error, fall back to userEdit data (already in form)
        } finally {
            setLoading(false);
        }
    };

    // Location State
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [locationWarningModalVisible, setLocationWarningModalVisible] = useState(false);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [autoFilled, setAutoFilled] = useState({ state: false, city: false });

    // Map Modal State
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);

    // GPS Location Functions
    const requestLocationPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'We need access to your location to pin your dhaba on the map.',
                    buttonPositive: 'OK',
                    buttonNegative: 'Cancel',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    };

    const getCurrentLocation = async () => {
        console.log('LocationDetailsTab: Starting getCurrentLocation...');
        setFetchingLocation(true);
        try {
            const locationData = await fetchCompleteLocationDetails();
            console.log('LocationDetailsTab: fetchCompleteLocationDetails result:', locationData);

            if (locationData && locationData.coords) {
                const { latitude, longitude } = locationData.coords;
                console.log('LocationDetailsTab: Got coordinates:', latitude, longitude);

                // Store in local state (coordinates only, no address)
                setLocalLocation({
                    lat: latitude.toString(),
                    lng: longitude.toString()
                });
                // Set pinned address from GPS fetch
                setPinnedAddress(locationData.displayName || '');

                // Auto-fill address if empty
                if (!formData.address && locationData.displayName) {
                    setFormData(prev => ({
                        ...prev,
                        address: locationData.displayName || ''
                    }));
                }

                showToast(t('locationFetchedSuccess'));
            } else {
                console.log('LocationDetailsTab: No coordinates found in locationData');
                showToast(t('failedToFetchLocation'));
            }
        } catch (error) {
            console.error('LocationDetailsTab: GPS Error:', error);
            showToast(t('failedToGetLocation'));
        } finally {
            setFetchingLocation(false);
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
                setAutoFilled({ state: true, city: true });
            }
        } catch (error) {
            console.error('LocationDetailsTab: Pincode Lookup Error:', error);
        } finally {
            setIsPincodeLoading(false);
        }
    };

    const handlePincodeChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, pincode: cleaned }));

        if (cleaned.length === 6) {
            fetchPincodeDetails(cleaned);
        } else {
            if (cleaned.length < 6) {
                setAutoFilled({ state: false, city: false });
            }
        }
    };

    const handleSave = async () => {
        // Validation - same as Profile Completion
        if (!formData.address || !formData.state || !formData.pincode || !formData.district) {
            showToast(t('pleaseEnterAllRequiredDetails'));
            return;
        }

        if (!localLocation?.lat || !localLocation?.lng) {
            showToast(t('pleaseFetchCurrentLocation'));
            return;
        }

        setSaving(true);
        try {
            // Find state_id: use existing dhaba_location.state_id if available, otherwise lookup from userEdit.state
            let state_id = '';
            if (userEdit?.dhaba_location?.state_id) {
                // Use existing state_id from dhaba_location
                state_id = userEdit.dhaba_location.state_id;
            } else if (userEdit?.state) {
                // Fallback: lookup state_id from userEdit.state
                const selectedState = statesList.find(s => s.name?.toLowerCase() === userEdit.state?.toLowerCase());
                state_id = selectedState ? selectedState.id : '';
            }
            console.log('LocationDetailsTab: state_id for API:', state_id);

            const apiFormData = new FormData();

            // Add dhaba_id
            if (userEdit?.dhaba?.id) {
                apiFormData.append('dhaba_id', userEdit.dhaba.id.toString());
            }

            apiFormData.append('full_address', formData.address);
            apiFormData.append('landmark', formData.landmark || '');
            apiFormData.append('district', formData.district);
            apiFormData.append('state', formData.state);
            apiFormData.append('state_id', state_id);
            apiFormData.append('pincode', formData.pincode);
            apiFormData.append('latitude', localLocation.lat);
            apiFormData.append('longitude', localLocation.lng);
            apiFormData.append('location_source', 'Pinned via GPS');

            console.log('LocationDetailsTab: Sending API request...', apiFormData);

            const response = await axiosInstance.post(END_POINTS.DHABA_BUSSINESS_LOCATION, apiFormData);

            console.log('LocationDetailsTab: API Response:', response?.data);

            if (response?.data?.status === true || response?.data?.success === true) {
                showToast(response?.data?.message || t('locationSavedSuccess'));

                // Update Redux userEdit with dhaba_location from response
                if (response?.data?.dhaba_location) {
                    console.log('LocationDetailsTab: Save successful, updating Redux userEdit.dhaba_location:', response.data.dhaba_location);

                    dispatch(userEditAction({
                        ...userEdit,
                        dhaba_location: {
                            ...userEdit?.dhaba_location,
                            ...response.data.dhaba_location
                        }
                    }));
                } else {
                    console.log('LocationDetailsTab: Save successful (no dhaba_location in response)');
                }
            } else {
                showToast(response?.data?.message || t('failedToSaveLocation'));
            }
        } catch (error: any) {
            console.error('LocationDetailsTab: Save Error:', error);
            console.error('LocationDetailsTab: Error Response:', error?.response?.data);
            showToast(error?.response?.data?.message || t('somethingWentWrong'));
        } finally {
            setSaving(false);
        }
    };

    // Shimmer component for loading state
    const ShimmerPlaceholder = () => (
        <View style={styles.sectionCard}>
            {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} style={styles.inputContainer}>
                    <View style={{ width: 80, height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ width: '100%', height: 48, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
                </View>
            ))}
            <View style={{ marginTop: 16 }}>
                <View style={{ width: 120, height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '100%', height: 80, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
            </View>
        </View>
    );

    // Show shimmer while loading
    if (loading) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <ShimmerPlaceholder />
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
                {/* Address */}
                <View style={styles.inputContainer}>
                    <MandatoryLabel text={t('address')} />
                    <TextInput
                        style={styles.input}
                        value={formData.address}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, address: text }))}
                        placeholder={t('fullAddressPlaceholder')}
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />
                </View>

                {/* Landmark */}
                <View style={styles.inputContainer}>
                    <OptionalLabel text={t('landmark')} />
                    <TextInput
                        style={styles.input}
                        value={formData.landmark}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, landmark: text }))}
                        placeholder={t('landmarkPlaceholder')}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Pincode */}
                <View style={styles.inputContainer}>
                    <MandatoryLabel text={t('pincode')} />
                    <TextInput
                        style={styles.input}
                        value={formData.pincode}
                        onChangeText={handlePincodeChange}
                        placeholder={t('pincodePlaceholder')}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={6}
                    />
                    {isPincodeLoading && (
                        <ActivityIndicator
                            size="small"
                            color={colors.royalBlue}
                            style={{ position: 'absolute', right: 10, top: 40 }}
                        />
                    )}
                </View>

                {/* District and State Row - Non-editable */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.inputContainer}>
                            <MandatoryLabel text={t('district')} />
                            <TextInput
                                style={[styles.input, { backgroundColor: '#f0f0f0', color: '#666' }]}
                                value={formData.district}
                                placeholder={t('district')}
                                placeholderTextColor="#9CA3AF"
                                editable={false}
                            />
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.inputContainer}>
                            <MandatoryLabel text={t('state')} />
                            <TextInput
                                style={[styles.input, { backgroundColor: '#f0f0f0', color: '#666' }]}
                                value={formData.state}
                                placeholder={t('state')}
                                placeholderTextColor="#9CA3AF"
                                editable={false}
                            />
                        </View>
                    </View>
                </View>

                {/* GPS Location Section */}
                <View style={{ marginTop: 8 }}>
                    <MandatoryLabel text={t('pinYourLocation')} />

                    {!localLocation ? (
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
                                        {t('fetchCurrentLocation')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : null}

                    {localLocation ? (
                        <View style={styles.gpsInfoBox}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.gpsTextTitle}>{t('locationPinned')}</Text>
                                <Text style={styles.gpsTextCoords}>
                                    Lat: {localLocation.lat}
                                </Text>
                                <Text style={styles.gpsTextCoords}>
                                    Lng: {localLocation.lng}
                                </Text>
                                {pinnedAddress ? (
                                    <Text style={[styles.gpsTextCoords, { marginTop: 4, color: '#4B5563' }]}>
                                        <Text style={{ fontWeight: '600' }}>Address:</Text> {pinnedAddress}
                                    </Text>
                                ) : null}
                            </View>
                            <TouchableOpacity onPress={() => {
                                setLocalLocation(null);
                                setPinnedAddress('');
                            }}>
                                <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            </View>

            {/* Location Warning Modal */}
            <Modal visible={locationWarningModalVisible} transparent animationType="fade" onRequestClose={() => setLocationWarningModalVisible(false)}>
                <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
                    <View style={[styles.modalContent, { borderRadius: 16, width: '85%', padding: 24 }]}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View style={{
                                width: 60, height: 60, borderRadius: 30,
                                backgroundColor: '#FFF4E5', alignItems: 'center',
                                justifyContent: 'center', marginBottom: 16
                            }}>
                                <Ionicons name="location" size={32} color="#FF9800" />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', textAlign: 'center' }}>
                                {t('useCurrentLocationQuestion')}
                            </Text>
                        </View>

                        <Text style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                            {t('useCurrentLocationDescription')}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setLocationWarningModalVisible(false)}
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563' }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setLocationWarningModalVisible(false);
                                    getCurrentLocation();
                                }}
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.royalBlue, alignItems: 'center' }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{t('allow')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Save Button */}
            <View style={{ marginTop: 24, marginBottom: 20 }}>
                <TouchableOpacity
                    onPress={handleSave}
                    style={{
                        backgroundColor: colors.royalBlue,
                        height: 50,
                        borderRadius: 25,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.royalBlue,
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4
                    }}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                            {t('saveLocationDetails')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default LocationDetailsTab;
