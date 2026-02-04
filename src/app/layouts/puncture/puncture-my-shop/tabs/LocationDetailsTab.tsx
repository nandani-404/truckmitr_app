import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, PermissionsAndroid, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { Space } from '@truckmitr/src/app/components';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { styles } from './styles';
import { MandatoryLabel } from './components';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import Geolocation from 'react-native-geolocation-service';
import { fetchCompleteLocationDetails } from '@truckmitr/src/utils/maps/location/location.detail';

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
    const dispatch = useDispatch();
    const { userEdit } = useSelector((state: any) => state?.user);

    // States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [locationWarningModalVisible, setLocationWarningModalVisible] = useState(false);
    const [pinnedAddress, setPinnedAddress] = useState<string>('');

    // Local form state
    const [formData, setFormData] = useState({
        address: '',
        landmark: '',
        pincode: '',
        state: '',
        state_id: '',
        district: '',
        latitude: '',
        longitude: '',
        location_source: ''
    });

    useEffect(() => {
        fetchLocationData();
    }, []);

    // Sync local state to Redux for global submission consistency
    useEffect(() => {
        if (!loading) {
            dispatch(userEditAction({ ...userEdit, ...formData }));
        }
    }, [formData]);

    const fetchLocationData = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(END_POINTS.GET_PUNCTURE_LOCATION);
            if (response.data?.success && response.data.location) {
                const loc = response.data.location;

                // Map state from state_id
                let mappedState = '';
                if (loc.state_id) {
                    const stateFromId = statesList.find(s => s.id === loc.state_id.toString());
                    mappedState = stateFromId?.name || '';
                }

                const updatedData = {
                    address: loc.full_address || '',
                    landmark: loc.landmark || '',
                    pincode: loc.pincode || '',
                    state: mappedState || loc.state_name || loc.state || '',
                    state_id: loc.state_id || '',
                    district: loc.district || '',
                    latitude: loc.latitude || '',
                    longitude: loc.longitude || '',
                    location_source: loc.location_source || ''
                };
                setFormData(updatedData);
                dispatch(userEditAction({ ...userEdit, ...updatedData }));

                // Fetch address from Maps API using stored coordinates
                if (loc.latitude && loc.longitude) {
                    fetchCompleteLocationDetails({
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude)
                    }).then((details) => {
                        if (details?.displayName) {
                            setPinnedAddress(details.displayName);
                        }
                    }).catch(err => console.log('Error fetching address for stored coords:', err));
                }
            }
        } catch (error) {
            console.error('Error fetching location data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePincodeChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, pincode: cleaned }));

        if (cleaned.length === 6) {
            fetchPincodeDetails(cleaned);
        }
    };

    const fetchPincodeDetails = async (pincodeValue: string) => {
        setIsPincodeLoading(true);
        try {
            const response = await axiosInstance.get(`https://api.postalpincode.in/pincode/${pincodeValue}`);
            if (response?.data?.[0]?.Status === 'Success') {
                const details = response.data[0].PostOffice[0];
                if (details) {
                    // Update state and district from pincode
                    const stateName = details.State;
                    const districtName = details.District;

                    // Lookup state_id
                    const selectedState = statesList.find(s => s.name?.toLowerCase() === stateName?.toLowerCase());
                    const stateId = selectedState ? selectedState.id : '';

                    setFormData(prev => ({
                        ...prev,
                        state: stateName,
                        state_id: stateId,
                        district: districtName
                    }));
                }
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
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            showToast(t('locationPermissionDenied') || 'Location permission denied');
            return;
        }

        setFetchingLocation(true);
        try {
            const locationData = await fetchCompleteLocationDetails();
            if (locationData && locationData.coords) {
                const { latitude, longitude } = locationData.coords;

                setPinnedAddress(locationData.displayName || '');

                setFormData(prev => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    location_source: 'Pinned via GPS'
                }));

                // Auto-fill address if empty
                if (!formData.address && locationData.displayName) {
                    setFormData(prev => ({
                        ...prev,
                        address: locationData.displayName || ''
                    }));
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

    const handleSave = async () => {
        // Validation - Address, Pincode, State, District AND GPS coordinates now mandatory
        if (!formData.address || !formData.pincode || !formData.state || !formData.district) {
            showToast(t('please_fill_all_mandatory_fields'));
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            showToast(t('locationDetailsRequired') || 'Location details are mandatory. Please fetch your location.');
            return;
        }

        setSaving(true);
        try {
            const apiFormData = new FormData();
            apiFormData.append('puncture_id', userEdit?.puncture_id || '');
            apiFormData.append('full_address', formData.address);
            apiFormData.append('landmark', formData.landmark || '');
            apiFormData.append('pincode', formData.pincode);
            apiFormData.append('state', formData.state);
            apiFormData.append('state_id', formData.state_id || '');
            apiFormData.append('district', formData.district);
            apiFormData.append('latitude', formData.latitude);
            apiFormData.append('longitude', formData.longitude);
            apiFormData.append('location_source', formData.location_source || 'Pinned via GPS');

            const response = await axiosInstance.post(END_POINTS.PUNCTURE_LOCATION, apiFormData);
            if (response.data?.success || response.data?.status) {
                showToast(response.data?.message || t('location_updated_successfully'));
                dispatch(userEditAction({ ...userEdit, ...formData }));
            } else {
                showToast(response.data?.message || t('something_went_wrong'));
            }
        } catch (error: any) {
            console.error('Save Error:', error);
            showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
        } finally {
            setSaving(false);
        }
    };

    const ShimmerPlaceholder = () => (
        <View style={styles.stepContainer}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i}>
                    <View style={styles.shimmerLine} />
                    <View style={styles.shimmerBox} />
                </View>
            ))}
        </View>
    );

    if (loading) {
        return <ShimmerPlaceholder />;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.stepContainer}>
                <MandatoryLabel text={t('puncture_full_address')} />
                <TextInput
                    style={[styles.classicInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder={t('puncture_address_placeholder')}
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={formData.address}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                />

                <Space height={16} />
                <Text style={styles.classicLabel}>{t('puncture_landmark')} <Text style={styles.optionalText}>{t('puncture_optional')}</Text></Text>
                <TextInput
                    style={styles.classicInput}
                    placeholder={t('puncture_near_placeholder')}
                    placeholderTextColor="#999"
                    value={formData.landmark}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, landmark: text }))}
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
                                    color="#246BFD"
                                    style={{ position: 'absolute', right: 10, top: 15 }}
                                />
                            )}
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Space height={16} />
                        <MandatoryLabel text={t('puncture_state')} />
                        <TextInput
                            style={[styles.classicInput, { backgroundColor: '#F3F4F6' }]}
                            placeholder={t('puncture_state')}
                            placeholderTextColor="#999"
                            value={formData.state}
                            editable={false}
                        />
                    </View>
                </View>

                <Space height={16} />
                <MandatoryLabel text={t('puncture_district')} />
                <TextInput
                    style={[styles.classicInput, { backgroundColor: '#F3F4F6' }]}
                    placeholder={t('puncture_district')}
                    placeholderTextColor="#999"
                    value={formData.district}
                    editable={false}
                />

                <Space height={24} />
                <MandatoryLabel text={t('puncture_gps_location')} />

                {!formData.latitude ? (
                    <TouchableOpacity
                        style={[styles.gpsButton, fetchingLocation && { opacity: 0.7 }]}
                        activeOpacity={0.8}
                        onPress={() => setLocationWarningModalVisible(true)}
                        disabled={fetchingLocation}
                    >
                        {fetchingLocation ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="location" size={20} color="white" />
                                <Text style={styles.gpsButtonText}>{t('fetchLocation') || 'Fetch Location'}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.gpsInfoBox}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                                <Text style={[styles.gpsText, { fontWeight: '700' }]}>{t('puncture_location_pinned') || 'Location Pinned'}</Text>
                            </View>
                            <Text style={[styles.gpsText, { marginTop: 4, opacity: 0.7 }]}>
                                {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                            </Text>
                            {pinnedAddress ? (
                                <Text style={[styles.gpsText, { marginTop: 4, color: '#4B5563' }]}>
                                    <Text style={{ fontWeight: '600' }}>{t('address')}:</Text> {pinnedAddress}
                                </Text>
                            ) : null}
                        </View>
                        <TouchableOpacity onPress={() => {
                            setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
                            setPinnedAddress('');
                        }}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>{t('puncture_save_location') || 'Save Location Details'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Location Warning Modal */}
            <Modal visible={locationWarningModalVisible} transparent animationType="fade" onRequestClose={() => setLocationWarningModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="location" size={32} color="#F97316" />
                            </View>
                            <Text style={styles.modalTitle}>{t('puncture_use_gps_title') || 'Use GPS Location?'}</Text>
                        </View>

                        <Text style={styles.modalDescription}>
                            {t('puncture_gps_warning_desc') || 'We will fetch your current coordinates to pin your shop accurately on the map.'}
                        </Text>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                onPress={() => setLocationWarningModalVisible(false)}
                                style={styles.modalCancelBtn}
                            >
                                <Text style={styles.modalCancelText}>{t('puncture_cancel') || 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setLocationWarningModalVisible(false);
                                    getCurrentLocation();
                                }}
                                style={styles.modalConfirmBtn}
                            >
                                <Text style={styles.modalConfirmText}>{t('puncture_allow') || 'Allow'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default LocationDetailsTab;
