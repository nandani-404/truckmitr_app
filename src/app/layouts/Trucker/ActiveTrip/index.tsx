import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Modal, Linking, TextInput, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from 'src/utils/config';
import Geolocation from '@react-native-community/geolocation';
import { pick } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

// ── Classic Color Palette (Flipkart Style) ──
const C = {
    bg: '#ffffffff',          // Light grey background
    surface: '#FFFFFF',     // White surface
    primary: '#2874F0',     // Classic Blue
    success: '#26A541',     // Green
    text: '#212121',        // Black/Dark Grey
    textSec: '#878787',     // Grey text
    border: '#E0E0E0',      // Light border
    line: '#F0F0F0',
};

// ── Icons ──
const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2">
        <Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const PhoneIcon = ({ color = C.primary }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
);

const CameraIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.surface} strokeWidth="2"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></Svg>
);

const CheckCircle = ({ active }: { active?: boolean }) => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill={active ? C.success : "#CCC"} stroke="none">
        <Circle cx="12" cy="12" r="12" />
        <Path d="M17 8l-6 6-3-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
);

const PendingCircle = () => (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill={C.border}>
        <Circle cx="6" cy="6" r="6" />
    </Svg>
);

const CurrentCircle = () => (
    <Svg width="16" height="16" viewBox="0 0 16 16">
        <Circle cx="8" cy="8" r="8" fill={C.success} opacity={0.2} />
        <Circle cx="8" cy="8" r="4" fill={C.success} />
    </Svg>
);

const LocationPinIcon = ({ color = C.primary }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
    </Svg>
);

const NavigationIcon = ({ color = C.primary }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 11l19-9-9 19-2-8-8-2z" />
    </Svg>
);

const DocumentIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Path d="M14 2v6h6" />
        <Path d="M16 13H8" />
        <Path d="M16 17H8" />
        <Path d="M10 9H8" />
    </Svg>
);

// Skeleton Components
const SkeletonBox = ({ width, height, style }: { width?: number | string; height?: number; style?: any }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width || '100%',
                    height: height || 16,
                    backgroundColor: C.border,
                    borderRadius: 4,
                    opacity,
                },
                style,
            ]}
        />
    );
};

interface Props { onBack?: () => void; onComplete?: () => void; loadId?: string; navigation?: any; }

const ActiveTripScreen: React.FC<Props> = ({ onBack, onComplete, loadId, navigation }) => {
    const [currentStatus, setCurrentStatus] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPODModal, setShowPODModal] = useState(false);
    const [showBuiltyModal, setShowBuiltyModal] = useState(false);
    const [builtyFile, setBuiltyFile] = useState<any>(null);
    const [uploadingBuilty, setUploadingBuilty] = useState(false);
    const [podFile, setPodFile] = useState<any>(null);
    const [uploadingPOD, setUploadingPOD] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<number | null>(null);

    // Get user from Redux
    const { user } = useSelector((state: any) => state.user) || {};

    // Vehicle Assignment Modal State
    const [showAssignVehicleModal, setShowAssignVehicleModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [driverDL, setDriverDL] = useState('');
    const [showVehicleList, setShowVehicleList] = useState(false);
    const [showDriverList, setShowDriverList] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]); // API Data
    const [drivers, setDrivers] = useState<any[]>([]); // API Data
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Trip Data
    const [trip, setTrip] = useState<any>({
        id: loadId || 'N/A',
        origin: 'Loading...',
        destination: 'Loading...',
        trackingAgent: { name: 'Support', phone: '' },
        driver: { name: '', phone: '', dl: '' },
        vehicle: '',
        payment: '',
        builty_path: null,
        pod_path: null,
        origin_lat: null,
        origin_lon: null,
        destination_lat: null,
        destination_lon: null,
        driver_id: null,
        trip_started: false,
    });

    const [startingTrip, setStartingTrip] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger

    useEffect(() => {
        if (loadId) {
            fetchTripDetails();
        } else {
            // If no loadId is passed, stop loading immediately as there's no trip to fetch
            setLoading(false);
        }
        fetchVehicles();
        fetchDrivers();
    }, [loadId]);

    // Fetch live updates when assign vehicle modal is hidden
    useEffect(() => {
        if (!showAssignVehicleModal && loadId) {
            fetchTripDetails();
        }
    }, [showAssignVehicleModal]);

    const fetchTripDetails = async () => {
        try {
            setLoading(true);
            const idToFetch = loadId; // Use loadId directly as it's the prop
            if (!idToFetch) {
                setLoading(false);
                return;
            }

            console.log('Fetching trip details for:', idToFetch);
            const response = await axiosInstance.get(END_POINTS.TRUCKER_TRACKING(idToFetch));
            console.log('Trip details response:', response.data);

            if (response.data?.status === 'success') {
                const data = response.data.data;

                // Map API response to local state
                setTrip({
                    id: data.load_id,
                    trucker_id: data.trucker_id,
                    shipper_id: data.shipper_id,
                    origin: data.origin,
                    destination: data.destination,
                    vehicle: data.vehicle_number || 'Not Assigned',
                    payment: data.payment_amount,
                    trackingAgent: {
                        name: data.tracking_agent?.name || 'Support Team',
                        phone: data.tracking_agent?.phone || ''
                    },
                    driver: {
                        name: data.driver_name || 'Not Assigned',
                        phone: data.driver_phone || '',
                        dl: data.dl_number || ''
                    },
                    material: data.material_name,
                    weight: data.material_weight,
                    builty_path: data.builty_path || null,
                    pod_path: data.pod_path || null,
                    origin_lat: data.origin_lat || null,
                    origin_lon: data.origin_lon || null,
                    destination_lat: data.destination_lat || null,
                    destination_lon: data.destination_lon || null,
                    driver_id: data.driver_id || null,
                    trip_started: data.trip_started || data.trip_status === 'active' || false,
                });

                console.log('📊 [TRIP DATA] trip_status:', data.trip_status);
                console.log('📊 [TRIP DATA] trip_started:', data.trip_started || data.trip_status === 'active');

                // Set status
                const statusCode = parseInt(data.current_status_code, 10);
                if (!isNaN(statusCode)) {
                    setCurrentStatus(statusCode);
                }
            } else {
                showToast('Failed to load trip details');
            }
        } catch (error) {
            console.error('Error fetching trip details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTripDetails();
    };

    const fetchVehicles = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.TRUCKER_GET_VEHICLES);
            if (response?.data?.status === 'success') {
                const list = response.data.data?.data || response.data.data || [];
                setVehicles(Array.isArray(list) ? list : []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchDrivers = async () => {
        try {
            console.log('📋 [DRIVERS] Fetching drivers...');
            const response = await axiosInstance.get(END_POINTS.TRUCKER_GET_DRIVERS);
            console.log('📋 [DRIVERS] Response:', JSON.stringify(response.data, null, 2));
            
            if (response?.data?.status === 'success') {
                const list = response.data.data?.drivers || [];
                console.log('📋 [DRIVERS] Drivers list:', list);
                console.log('📋 [DRIVERS] Number of drivers:', list.length);
                setDrivers(Array.isArray(list) ? list : []);
            } else {
                console.log('⚠️ [DRIVERS] API returned non-success status');
            }
        } catch (error) {
            console.error('❌ [DRIVERS] Error fetching drivers:', error);
        }
    };

    const statuses = [
        { id: 0, label: 'Load Accepted', date: 'Fri, 10th Feb', sub: 'Your request has been accepted' },
        { id: 1, label: 'Vehicle Assigned', date: 'Fri, 10th Feb - 11:00 AM', sub: 'Truck assigned for this trip' },
        { id: 2, label: 'Reached Pickup', date: 'Fri, 10th Feb - 2:00 PM', sub: 'Truck arrived at location' },
        { id: 3, label: 'Loaded', date: 'Fri, 10th Feb - 4:30 PM', sub: 'Goods loaded successfully' },
        { id: 4, label: 'In Transit', date: 'Expected Tomorrow', sub: 'On the way to destination' },
        { id: 5, label: 'Reached Destination', date: '--', sub: 'Arrived at drop location' },
        { id: 6, label: 'Delivered', date: '--', sub: 'Goods delivered & POD uploaded' },
    ];

    // Get next action button text
    const getNextActionText = () => {
        console.log('🔍 [BUTTON TEXT] Checking button text - Status:', currentStatus, 'Trip Started:', trip.trip_started);
        
        if (currentStatus === 0) return 'Assign Vehicle & Driver';
        if (currentStatus === 1 && !trip.trip_started) {
            console.log('🔍 [BUTTON TEXT] Showing: Start Trip');
            return 'Start Trip';
        }
        if (currentStatus === 1 && trip.trip_started) {
            console.log('🔍 [BUTTON TEXT] Showing: Mark Reached Pickup');
            return 'Mark Reached Pickup';
        }
        if (currentStatus === 2) return 'Mark Loaded';
        if (currentStatus === 3) return 'Upload Builty & Start Transit';
        if (currentStatus === 4) return 'Mark Reached Destination';
        if (currentStatus === 5) return 'Upload POD & Complete';
        return 'Complete';
    };

    const handleStartTrip = async () => {
        try {
            setStartingTrip(true);
            console.log('🚀 [START TRIP] Starting trip...');

            // Validate required data
            if (!trip.origin_lat || !trip.origin_lon || !trip.destination_lat || !trip.destination_lon) {
                showToast('Trip coordinates not available. Please refresh and try again.');
                return;
            }

            // Use driver_id from trip data, or fallback to user.id
            const driverId = trip.driver_id || user?.id;
            
            if (!driverId) {
                showToast('Driver information not available. Please refresh and try again.');
                return;
            }

            const payload = {
                driver_id: driverId,
                load_id: loadId,
                source_lat: parseFloat(trip.origin_lat),
                source_lng: parseFloat(trip.origin_lon),
                destination_lat: parseFloat(trip.destination_lat),
                destination_lng: parseFloat(trip.destination_lon),
            };

            console.log('📤 [START TRIP] Payload:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_START_TRIP, payload);

            console.log('📥 [START TRIP] Response:', JSON.stringify(response.data, null, 2));

            // Check if status is true (boolean) or 'success' (string)
            if (response.data?.status === true || response.data?.status === 'success') {
                console.log('✅ [START TRIP] Trip started successfully');
                console.log('📍 [START TRIP] Trip ID:', response.data?.trip_id);
                
                // CRITICAL: Update local state immediately to change button text
                setTrip((prev: any) => {
                    const updated = {
                        ...prev,
                        trip_started: true,
                    };
                    console.log('🔄 [START TRIP] Updated trip state:', updated);
                    return updated;
                });
                
                // Force component re-render
                setForceUpdate(prev => prev + 1);
                
                console.log('🔄 [START TRIP] Updated trip_started to true in local state');
                
                showToast(response.data?.message || 'Trip started successfully');
                
                // Fetch latest tracking data in background
                await fetchTripDetails();
            } else {
                console.log('⚠️ [START TRIP] Failed:', response.data?.message);
                showToast(response.data?.message || 'Failed to start trip');
            }
        } catch (error: any) {
            console.error('❌ [START TRIP] Error:', error);
            showToast(error?.response?.data?.message || 'Failed to start trip. Please try again.');
        } finally {
            setStartingTrip(false);
        }
    };

    const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    reject(error);
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
            );
        });
    };

    const updateStatusWithAPI = async (newStatusCode: number) => {
        try {
            setUpdatingStatus(true);

            console.log(`🔄 [STATUS UPDATE] Updating status to code ${newStatusCode} (${statuses[newStatusCode].label})`);

            // Get current location
            let latitude = 0;
            let longitude = 0;
            
            try {
                const location = await getCurrentLocation();
                latitude = location.latitude;
                longitude = location.longitude;
                console.log('📍 [STATUS UPDATE] Got coordinates:', { latitude, longitude });
            } catch (locationError) {
                console.warn('⚠️ [STATUS UPDATE] Could not get location, using default (0,0):', locationError);
            }

            // Format timestamp for MySQL (YYYY-MM-DD HH:MM:SS)
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

            const payload = {
                load_id: loadId,
                status_code: newStatusCode,
                timestamp,
                latitude,
                longitude,
            };

            console.log('📤 [STATUS UPDATE] Sending status update:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_STATUS, payload);

            console.log('📥 [STATUS UPDATE] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [STATUS UPDATE] Status updated successfully');
                setCurrentStatus(newStatusCode);
                showToast(`Status updated to "${statuses[newStatusCode].label}"`);
                
                // Hit both APIs simultaneously
                console.log('📍 [STATUS UPDATE] Updating location and fetching tracking data simultaneously');
                await Promise.all([
                    updateLocationAPI(),
                    fetchTripDetails()
                ]);
            } else {
                console.log('⚠️ [STATUS UPDATE] Failed:', response.data?.message);
                showToast(response.data?.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('❌ [STATUS UPDATE] Error:', error);
            showToast('Failed to update status. Please try again.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const updateStatus = () => {
        if (currentStatus === 0) { // Moving to Vehicle Assigned
            setShowAssignVehicleModal(true);
            return;
        }
        if (currentStatus === 1) {
            if (!trip.trip_started) {
                // Start Trip first
                handleStartTrip();
            } else {
                // Trip already started, move to Reached Pickup
                setPendingStatusUpdate(2);
                setShowConfirmModal(true);
            }
            return;
        }
        if (currentStatus === 3) { // Moving from Loaded to In Transit - need builty
            setShowBuiltyModal(true);
            return;
        }
        if (currentStatus === 5) { // Moving to Delivered
            setShowPODModal(true);
            return;
        }

        // For other status updates, show confirmation modal
        if (currentStatus < 6) {
            setPendingStatusUpdate(currentStatus + 1);
            setShowConfirmModal(true);
        }
    };

    const confirmStatusUpdate = async () => {
        if (pendingStatusUpdate !== null) {
            setShowConfirmModal(false);
            await updateStatusWithAPI(pendingStatusUpdate);
            setPendingStatusUpdate(null);
        }
    };

    const handleAssignVehicle = async () => {
        if (!selectedVehicle || !driverName || !driverPhone) {
            showToast('Please fill all mandatory fields to assign vehicle');
            return;
        }

        if (!trip.trucker_id || !trip.shipper_id) {
            showToast('Trip details incomplete. Please retry');
            return;
        }

        try {
            const payload = {
                load_id: loadId,
                trucker_id: trip.trucker_id,
                shipper_id: trip.shipper_id,
                vehicle_number: selectedVehicle,
                driver_name: driverName,
                dl_number: driverDL,
                driver_phone: driverPhone
            };

            console.log('🚗 [ASSIGN VEHICLE] Assigning vehicle with payload:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_VEHICLE_NUMBER, payload);

            console.log('✅ [ASSIGN VEHICLE] Vehicle assignment response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                // Update status FIRST
                setCurrentStatus(1);
                
                // Update Trip Data locally
                setTrip((prev: any) => ({
                    ...prev,
                    vehicle: selectedVehicle,
                    driver: { name: driverName, phone: driverPhone, dl: driverDL }
                }));

                setShowAssignVehicleModal(false);
                
                // Clear form
                setSelectedVehicle('');
                setSelectedDriver(null);
                setDriverName('');
                setDriverPhone('');
                setDriverDL('');
                
                showToast('Vehicle Assigned Successfully');

                // Update status with location (this saves both status and location)
                console.log('📍 [ASSIGN VEHICLE] Updating status to 1 with location');
                await updateStatusToBackend(1);
                
                console.log('🔄 [ASSIGN VEHICLE] Fetching latest tracking data');
                await fetchTripDetails();
            } else {
                console.log('⚠️ [ASSIGN VEHICLE] Failed:', response.data?.message);
                showToast(response.data?.message || 'Failed to assign vehicle');
            }
        } catch (error) {
            console.error('❌ [ASSIGN VEHICLE] Error:', error);
            showToast('Failed to assign vehicle. Please try again.');
        }
    };

    const handleDriverSelect = (driver: any) => {
        setSelectedDriver(driver);
        setDriverName(driver.name || '');
        setDriverPhone(driver.mobile || '');
        setDriverDL(driver.License_Number || '');
        setShowDriverList(false);
    };

    // Update status to backend with location
    const updateStatusToBackend = async (statusCode: number) => {
        try {
            console.log(`🔄 [STATUS UPDATE] Updating status to code ${statusCode}`);

            // Get current location
            let latitude = 0;
            let longitude = 0;
            
            try {
                const location = await getCurrentLocation();
                latitude = location.latitude;
                longitude = location.longitude;
                console.log('📍 [STATUS UPDATE] Got coordinates:', { latitude, longitude });
            } catch (locationError) {
                console.warn('⚠️ [STATUS UPDATE] Could not get location, using default (0,0):', locationError);
            }

            // Format timestamp for MySQL (YYYY-MM-DD HH:MM:SS)
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

            const payload = {
                load_id: loadId,
                status_code: statusCode,
                timestamp,
                latitude,
                longitude,
            };

            console.log('📤 [STATUS UPDATE] Sending payload:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_STATUS, payload);

            console.log('📥 [STATUS UPDATE] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [STATUS UPDATE] Status and location updated successfully');
            } else {
                console.log('⚠️ [STATUS UPDATE] Failed:', response.data?.message);
            }
        } catch (error) {
            console.error('❌ [STATUS UPDATE] Error:', error);
        }
    };

    const updateLocationAPIWithStatus = async (statusCode: number) => {
        try {
            console.log(`📍 [LOCATION UPDATE] Starting location update with status code ${statusCode}...`);
            
            // Get current location
            let latitude = 0;
            let longitude = 0;
            
            try {
                const location = await getCurrentLocation();
                latitude = location.latitude;
                longitude = location.longitude;
                console.log('📍 [LOCATION UPDATE] Got coordinates:', { latitude, longitude });
            } catch (locationError) {
                console.warn('⚠️ [LOCATION UPDATE] Could not get location, using default (0,0):', locationError);
            }

            // Format timestamp for MySQL (YYYY-MM-DD HH:MM:SS)
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

            const payload = {
                load_id: loadId,
                status_code: statusCode,
                latitude,
                longitude,
                timestamp,
            };

            console.log('📤 [LOCATION UPDATE] Sending location update:', JSON.stringify(payload, null, 2));

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_LOCATION, payload);

            console.log('📥 [LOCATION UPDATE] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [LOCATION UPDATE] Location updated successfully');
            } else {
                console.log('⚠️ [LOCATION UPDATE] Failed:', response.data?.message);
            }
        } catch (error) {
            console.error('❌ [LOCATION UPDATE] Error:', error);
        }
    };

    const updateLocationAPI = async () => {
        await updateLocationAPIWithStatus(currentStatus);
    };

    const handleUpdateLocation = async () => {
        console.log('📍 [MANUAL UPDATE] User manually updating location');
        await Promise.all([
            updateLocationAPI(),
            fetchTripDetails()
        ]);
        showToast('Location updated successfully');
    };

    const handlePODUpload = async () => {
        if (!podFile) {
            showToast('Please select a POD document to upload');
            return;
        }

        try {
            setUploadingPOD(true);
            console.log('📦 [POD UPLOAD] Starting POD upload...');

            const formData = new FormData();
            formData.append('load_id', loadId);
            formData.append('shipper_id', trip.shipper_id);
            formData.append('trucker_id', trip.trucker_id);
            formData.append('pod', {
                uri: podFile.fileCopyUri || podFile.uri,
                type: podFile.type,
                name: podFile.name,
            });

            console.log('📤 [POD UPLOAD] Payload:', {
                load_id: loadId,
                shipper_id: trip.shipper_id,
                trucker_id: trip.trucker_id,
                file: podFile.name,
            });

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPLOAD_POD, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('📥 [POD UPLOAD] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [POD UPLOAD] POD uploaded successfully');

                // Get current location
                let latitude = 0;
                let longitude = 0;
                
                try {
                    const location = await getCurrentLocation();
                    latitude = location.latitude;
                    longitude = location.longitude;
                    console.log('📍 [POD UPLOAD] Got coordinates:', { latitude, longitude });
                } catch (locationError) {
                    console.warn('⚠️ [POD UPLOAD] Could not get location, using default (0,0):', locationError);
                }

                // Format timestamp for MySQL (YYYY-MM-DD HH:MM:SS)
                const now = new Date();
                const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

                const statusPayload = {
                    load_id: loadId,
                    status_code: 6, // Delivered status
                    timestamp,
                    latitude,
                    longitude,
                };

                console.log('📤 [POD UPLOAD] Updating status to Delivered:', JSON.stringify(statusPayload, null, 2));

                const statusResponse = await axiosInstance.post(END_POINTS.TRUCKER_UPDATE_STATUS, statusPayload);

                console.log('📥 [POD UPLOAD] Status update response:', JSON.stringify(statusResponse.data, null, 2));

                if (statusResponse.data?.status === 'success') {
                    console.log('✅ [POD UPLOAD] Delivery completed successfully');
                    setShowPODModal(false);
                    setPodFile(null);
                    setCurrentStatus(6);
                    
                    // Fetch latest tracking data
                    await fetchTripDetails();
                    
                    showToast('POD uploaded successfully. Trip completed!');
                    if (onComplete) onComplete();
                } else {
                    console.log('⚠️ [POD UPLOAD] Status update failed:', statusResponse.data?.message);
                    showToast('POD uploaded but status update failed. Please try again');
                }
            } else {
                console.log('⚠️ [POD UPLOAD] Upload failed:', response.data?.message);
                showToast(response.data?.message || 'Failed to upload POD');
            }
        } catch (error) {
            console.error('❌ [POD UPLOAD] Error:', error);
            showToast('Failed to upload POD. Please try again');
        } finally {
            setUploadingPOD(false);
        }
    };

    const handlePODPick = async () => {
        try {
            const [file] = await pick({
                type: ['*/*'],
                copyTo: 'cachesDirectory',
            });

            if (file) {
                setPodFile(file);
                console.log('📄 [POD] File selected:', file.name);
            }
        } catch (error: any) {
            if (error?.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('❌ [POD] Error picking document:', error);
                showToast('Failed to pick document');
            }
        }
    };

    const handlePODCamera = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setPodFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `POD_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('📷 [POD] Photo captured:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [POD] Error capturing photo:', error);
            showToast('Failed to capture photo');
        }
    };

    const handlePODGallery = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setPodFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `POD_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('🖼️ [POD] Image selected from gallery:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [POD] Error selecting from gallery:', error);
            showToast('Failed to select image');
        }
    };

    const handleBuiltyPick = async () => {
        try {
            const [file] = await pick({
                type: ['*/*'],
                copyTo: 'cachesDirectory',
            });

            if (file) {
                setBuiltyFile(file);
                console.log('📄 [BUILTY] File selected:', file.name);
            }
        } catch (error: any) {
            if (error?.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('❌ [BUILTY] Error picking document:', error);
                showToast('Failed to pick document');
            }
        }
    };

    const handleBuiltyCamera = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setBuiltyFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `Builty_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('📷 [BUILTY] Photo captured:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [BUILTY] Error capturing photo:', error);
            showToast('Failed to capture photo');
        }
    };

    const handleBuiltyGallery = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.assets && result.assets[0]) {
                const photo = result.assets[0];
                setBuiltyFile({
                    uri: photo.uri,
                    type: photo.type || 'image/jpeg',
                    name: photo.fileName || `Builty_${Date.now()}.jpg`,
                    size: photo.fileSize || 0,
                });
                console.log('🖼️ [BUILTY] Image selected from gallery:', photo.fileName);
            }
        } catch (error) {
            console.error('❌ [BUILTY] Error selecting from gallery:', error);
            showToast('Failed to select image');
        }
    };

    const handleBuiltyUpload = async () => {
        if (!builtyFile) {
            showToast('Please select a builty document to upload');
            return;
        }

        try {
            setUploadingBuilty(true);
            console.log('📤 [BUILTY] Uploading builty document...');

            const formData = new FormData();
            formData.append('load_id', loadId);
            formData.append('shipper_id', trip.shipper_id);
            formData.append('trucker_id', trip.trucker_id);
            formData.append('builty', {
                uri: builtyFile.fileCopyUri || builtyFile.uri,
                type: builtyFile.type,
                name: builtyFile.name,
            });

            console.log('📤 [BUILTY] Payload:', {
                load_id: loadId,
                shipper_id: trip.shipper_id,
                trucker_id: trip.trucker_id,
                file: builtyFile.name,
            });

            const response = await axiosInstance.post(END_POINTS.TRUCKER_UPLOAD_BUILTY, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('📥 [BUILTY] Response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status === 'success') {
                console.log('✅ [BUILTY] Builty uploaded successfully');
                setShowBuiltyModal(false);
                setBuiltyFile(null);
                
                // Now update status to In Transit
                await updateStatusWithAPI(4);
            } else {
                console.log('⚠️ [BUILTY] Upload failed:', response.data?.message);
                showToast(response.data?.message || 'Failed to upload builty');
            }
        } catch (error) {
            console.error('❌ [BUILTY] Error uploading:', error);
            showToast('Failed to upload builty. Please try again');
        } finally {
            setUploadingBuilty(false);
        }
    };

    const callAgent = () => {
        if (trip.trackingAgent?.phone) Linking.openURL(`tel:${trip.trackingAgent.phone}`);
    };
    const callDriver = () => {
        if (trip.driver?.phone) Linking.openURL(`tel:${trip.driver.phone}`);
    };

    const downloadBuilty = () => {
        if (trip.builty_path) {
            const url = `${BASE_URL}public/${trip.builty_path}`;
            console.log('📥 [BUILTY] Downloading from:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [BUILTY] Error opening URL:', err);
                showToast('Failed to open builty document');
            });
        } else {
            showToast('Builty document not available');
        }
    };

    const downloadPOD = () => {
        if (trip.pod_path) {
            const url = `${BASE_URL}public/${trip.pod_path}`;
            console.log('📥 [POD] Downloading from:', url);
            Linking.openURL(url).catch(err => {
                console.error('❌ [POD] Error opening URL:', err);
                showToast('Failed to open POD document');
            });
        } else {
            showToast('POD document not available');
        }
    };

    const openMaps = () => {
        // Navigate to in-app map navigation screen
        console.log('🗺️ [NAVIGATION] Opening in-app navigation');
        console.log('🗺️ [NAVIGATION] Origin:', trip.origin);
        console.log('🗺️ [NAVIGATION] Destination:', trip.destination);
        
        if (navigation) {
            navigation.navigate('truckerMapNavigation', {
                origin: trip.origin,
                destination: trip.destination,
            });
        } else {
            showToast('Navigation not available');
        }
    };

    // Render Timeline Item
    const renderTimelineItem = (item: any, index: number) => {
        const isActive = index <= currentStatus;
        const isLast = index === statuses.length - 1;

        return (
            <View key={item.id} style={styles.timelineRow}>
                {/* Graphics Column */}
                <View style={styles.timelineGraphics}>
                    <View style={styles.dotContainer}>
                        {isActive ? (
                            <CheckCircle active={true} />
                        ) : (
                            <PendingCircle />
                        )}
                    </View>
                    {!isLast && (
                        <View style={[
                            styles.line,
                            { backgroundColor: index < currentStatus ? C.success : C.line }
                        ]} />
                    )}
                </View>

                {/* Content Column */}
                <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
                    <Text style={[styles.statusTitle, isActive && { color: C.text }]}>
                        {item.label}
                    </Text>
                    {/* Date logic can be enhanced to use real timestamps from API if available */}
                    <Text style={styles.statusDate}>{isActive ? 'Completed' : item.date}</Text>
                    {item.sub && <Text style={styles.statusSub}>{item.sub}</Text>}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackIcon />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Load Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {/* Order ID Skeleton */}
                    <View style={styles.card}>
                        <View style={styles.orderIdRow}>
                            <SkeletonBox width={60} height={14} />
                            <SkeletonBox width={100} height={14} />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <SkeletonBox width={50} height={12} style={{ marginBottom: 8 }} />
                                <SkeletonBox width={80} height={14} />
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.summaryItem}>
                                <SkeletonBox width={50} height={12} style={{ marginBottom: 8 }} />
                                <SkeletonBox width={80} height={14} />
                            </View>
                        </View>
                    </View>

                    {/* Vehicle Info Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={140} height={14} style={{ marginBottom: 14 }} />
                        <SkeletonBox width="100%" height={14} style={{ marginBottom: 8 }} />
                        <SkeletonBox width="80%" height={14} />
                    </View>

                    {/* Shipping Details Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={120} height={14} style={{ marginBottom: 14 }} />
                        <SkeletonBox width="100%" height={60} style={{ marginBottom: 12 }} />
                        <SkeletonBox width="100%" height={60} />
                    </View>

                    {/* Timeline Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={100} height={14} style={{ marginBottom: 14 }} />
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={{ flexDirection: 'row', marginBottom: 20 }}>
                                <SkeletonBox width={16} height={16} style={{ marginRight: 12, borderRadius: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <SkeletonBox width="60%" height={13} style={{ marginBottom: 6 }} />
                                    <SkeletonBox width="40%" height={11} />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Contact Skeleton */}
                    <View style={styles.card}>
                        <SkeletonBox width={80} height={14} style={{ marginBottom: 14 }} />
                        <SkeletonBox width="100%" height={40} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Load Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[C.primary]}
                        tintColor={C.primary}
                    />
                }
            >

                {/* Order ID & Basic Summary */}
                <View style={styles.card}>
                    <View style={styles.orderIdRow}>
                        <Text style={styles.orderIdLabel}>Load ID</Text>
                        <Text style={styles.orderIdValue}>{trip.id}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Vehicle</Text>
                            <Text style={styles.summaryValue}>{trip.vehicle}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Amount</Text>
                            <Text style={styles.summaryValue}>{trip.payment}</Text>
                        </View>
                    </View>
                </View>

                {/* Vehicle Information (Conditionally Rendered or Placeholder if not assigned) */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Vehicle Information</Text>
                    {currentStatus > 0 ? (
                        <>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 13, color: C.textSec }}>Vehicle Number</Text>
                                <Text style={{ fontSize: 15, fontWeight: '500', color: C.text, marginTop: 2 }}>{trip.vehicle}</Text>
                            </View>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.contactRow} onPress={callDriver}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.contactName}>Driver: {trip.driver?.name || 'Unknown'}</Text>
                                    <Text style={styles.contactPhone}>{trip.driver?.phone || 'No Phone'}</Text>
                                </View>
                                <PhoneIcon />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                            <Text style={{ color: C.textSec, fontSize: 13 }}>Vehicle Not Assigned Yet</Text>
                        </View>
                    )}
                </View>

                {/* Shipping Details */}
                <View style={styles.card}>
                    <View style={styles.shippingHeader}>
                        <Text style={styles.sectionHeader}>Shipping Route</Text>
                        {/* <TouchableOpacity onPress={handleUpdateLocation} style={styles.updateLocBtn}>
                            <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5">
                                <Circle cx="12" cy="12" r="10" />
                                <Path d="M12 6v6l4 2" />
                            </Svg>
                            <Text style={styles.updateLocText}>Update Location</Text>
                        </TouchableOpacity> */}
                    </View>

                    {/* Modern Route Display */}
                    <View style={styles.routeContainer}>
                        {/* Origin */}
                        <View style={styles.routePoint}>
                            <View style={styles.routeIconContainer}>
                                <View style={styles.originDot} />
                            </View>
                            <View style={styles.routeContent}>
                                <Text style={styles.routeLabel}>Pickup Location</Text>
                                <Text style={styles.routeAddress}>{trip.origin}</Text>
                            </View>
                        </View>

                        {/* Connecting Line */}
                        <View style={styles.routeLine}>
                            <View style={styles.dottedLine} />
                        </View>

                        {/* Destination */}
                        <View style={styles.routePoint}>
                            <View style={styles.routeIconContainer}>
                                <LocationPinIcon color={C.primary} />
                            </View>
                            <View style={styles.routeContent}>
                                <Text style={styles.routeLabel}>Drop Location</Text>
                                <Text style={styles.routeAddress}>{trip.destination}</Text>
                                <TouchableOpacity style={styles.navigateBtnModern} onPress={openMaps}>
                                    <NavigationIcon color={C.surface} />
                                    <Text style={styles.navigateTextModern}>Navigate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tracking Timeline */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Load Status</Text>
                    <View style={styles.timelineContainer}>
                        {statuses.map(renderTimelineItem)}
                    </View>
                </View>

                {/* Documents Section */}
                {(trip.builty_path || trip.pod_path) && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeader}>Documents</Text>
                        
                        {trip.builty_path && (
                            <TouchableOpacity style={styles.documentRow} onPress={downloadBuilty}>
                                <View style={styles.documentIconContainer}>
                                    <DocumentIcon />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.documentTitle}>Builty Document</Text>
                                    <Text style={styles.documentSubtitle}>Tap to view or download</Text>
                                </View>
                                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <Path d="M7 10l5 5 5-5" />
                                    <Path d="M12 15V3" />
                                </Svg>
                            </TouchableOpacity>
                        )}

                        {trip.pod_path && (
                            <TouchableOpacity style={[styles.documentRow, trip.builty_path && { marginTop: 12 }]} onPress={downloadPOD}>
                                <View style={styles.documentIconContainer}>
                                    <DocumentIcon />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.documentTitle}>POD Document</Text>
                                    <Text style={styles.documentSubtitle}>Tap to view or download</Text>
                                </View>
                                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <Path d="M7 10l5 5 5-5" />
                                    <Path d="M12 15V3" />
                                </Svg>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Contacts Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Need Help?</Text>

                    <TouchableOpacity style={styles.contactRow} onPress={callAgent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactName}>Agent: {trip.trackingAgent?.name}</Text>
                            <Text style={styles.contactPhone}>{trip.trackingAgent?.phone}</Text>
                        </View>
                        <PhoneIcon />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action Button */}
            {currentStatus < 6 && (
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[
                            styles.actionButton, 
                            (updatingStatus || startingTrip) && styles.actionButtonDisabled
                        ]} 
                        onPress={updateStatus}
                        disabled={updatingStatus || startingTrip}
                    >
                        {(updatingStatus || startingTrip) ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                {currentStatus === 5 && <CameraIcon />}
                                <Text style={styles.actionButtonText}>
                                    {getNextActionText()}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* POD Modal */}
            <Modal visible={showPODModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Upload Proof of Delivery</Text>
                        <Text style={styles.modalSubtitle}>Please upload the signed POD document to complete delivery.</Text>

                        {podFile ? (
                            <View style={styles.uploadPlaceholder}>
                                <DocumentIcon />
                                <Text style={styles.uploadText}>{podFile.name}</Text>
                                <Text style={styles.uploadSubtext}>
                                    {((podFile.size || 0) / 1024).toFixed(2)} KB
                                </Text>
                                <TouchableOpacity 
                                    style={styles.changeFileBtn}
                                    onPress={() => setPodFile(null)}
                                >
                                    <Text style={styles.changeFileText}>Change File</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptionsContainer}>
                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePODCamera}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <Circle cx="12" cy="13" r="4" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>Camera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePODGallery}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Rect x="3" y="3" width="18" height="18" rx="2" />
                                        <Circle cx="8.5" cy="8.5" r="1.5" />
                                        <Path d="M21 15l-5-5L5 21" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>Gallery</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePODPick}>
                                    <DocumentIcon />
                                    <Text style={styles.uploadOptionText}>Document</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity 
                                style={styles.modalCancel} 
                                onPress={() => {
                                    setShowPODModal(false);
                                    setPodFile(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalSubmit, (uploadingPOD || !podFile) && styles.modalSubmitDisabled]} 
                                onPress={handlePODUpload}
                                disabled={uploadingPOD || !podFile}
                            >
                                {uploadingPOD ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Upload & Complete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Assign Vehicle Modal */}
            <Modal visible={showAssignVehicleModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Assign Vehicle & Driver</Text>
                        <Text style={styles.modalSubtitle}>Select a vehicle and driver for this trip.</Text>

                        {/* Vehicle Dropdown */}
                        <Text style={styles.inputLabel}>Select Vehicle</Text>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setShowVehicleList(!showVehicleList)}>
                            <Text style={{ color: selectedVehicle ? C.text : C.textSec }}>
                                {selectedVehicle || 'Select Vehicle'}
                            </Text>
                            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="2"><Path d="M6 9l6 6 6-6" /></Svg>
                        </TouchableOpacity>

                        {showVehicleList && (
                            <View style={styles.dropdownList}>
                                <ScrollView style={{ maxHeight: 150 }}>
                                    {vehicles.map((v: any, index: number) => {
                                        const vNum = typeof v === 'string' ? v : (v.registration_number || v.vehicle_number || 'Unknown Vehicle');
                                        return (
                                            <TouchableOpacity 
                                                key={index} 
                                                style={styles.dropdownItem} 
                                                onPress={() => { 
                                                    setSelectedVehicle(vNum); 
                                                    setShowVehicleList(false); 
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{vNum}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {vehicles.length === 0 && (
                                        <View style={styles.dropdownItem}>
                                            <Text style={{ color: C.textSec, fontSize: 13 }}>No vehicles found</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        {/* Driver Dropdown */}
                        <Text style={styles.inputLabel}>Select Driver</Text>
                        <TouchableOpacity 
                            style={styles.dropdown} 
                            onPress={() => {
                                console.log('📋 [DRIVERS] Opening driver dropdown. Current drivers:', drivers.length);
                                setShowDriverList(!showDriverList);
                            }}
                        >
                            <Text style={{ color: selectedDriver ? C.text : C.textSec }}>
                                {selectedDriver ? `${selectedDriver.name} - ${selectedDriver.mobile}` : 'Select Driver'}
                            </Text>
                            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="2"><Path d="M6 9l6 6 6-6" /></Svg>
                        </TouchableOpacity>

                        {showDriverList && (
                            <View style={styles.dropdownList}>
                                <ScrollView style={{ maxHeight: 200 }}>
                                    {drivers.map((driver: any, index: number) => {
                                        console.log('📋 [DRIVERS] Rendering driver:', driver.name, driver.mobile);
                                        return (
                                            <TouchableOpacity 
                                                key={index} 
                                                style={styles.dropdownItem} 
                                                onPress={() => handleDriverSelect(driver)}
                                            >
                                                <View>
                                                    <Text style={styles.dropdownItemText}>{driver.name}</Text>
                                                    <Text style={styles.dropdownItemSubtext}>
                                                        Ph: {driver.mobile}
                                                        {driver.License_Number && ` • DL: ${driver.License_Number}`}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {drivers.length === 0 && (
                                        <View style={styles.dropdownItem}>
                                            <Text style={{ color: C.textSec, fontSize: 13 }}>No drivers found</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Driver Name</Text>
                        <TextInput 
                            style={styles.input} 
                            value={driverName} 
                            onChangeText={setDriverName} 
                            placeholder="Enter Driver Name" 
                            placeholderTextColor={C.textSec} 
                        />

                        <Text style={styles.inputLabel}>Driver Phone</Text>
                        <TextInput 
                            style={styles.input} 
                            value={driverPhone} 
                            onChangeText={setDriverPhone} 
                            placeholder="Enter Driver Phone" 
                            placeholderTextColor={C.textSec} 
                            keyboardType="phone-pad" 
                        />

                        <Text style={styles.inputLabel}>Driver DL (Optional)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={driverDL} 
                            onChangeText={setDriverDL} 
                            placeholder="Enter Driving License No" 
                            placeholderTextColor={C.textSec} 
                        />

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity 
                                style={styles.modalCancel} 
                                onPress={() => {
                                    setShowAssignVehicleModal(false);
                                    setSelectedVehicle('');
                                    setSelectedDriver(null);
                                    setDriverName('');
                                    setDriverPhone('');
                                    setDriverDL('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={handleAssignVehicle}>
                                <Text style={styles.modalSubmitText}>Assign</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Builty Upload Modal */}
            <Modal visible={showBuiltyModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Upload Builty Document</Text>
                        <Text style={styles.modalSubtitle}>Please upload the builty document before marking as In Transit.</Text>

                        {builtyFile ? (
                            <View style={styles.uploadPlaceholder}>
                                <DocumentIcon />
                                <Text style={styles.uploadText}>{builtyFile.name}</Text>
                                <Text style={styles.uploadSubtext}>
                                    {((builtyFile.size || 0) / 1024).toFixed(2)} KB
                                </Text>
                                <TouchableOpacity 
                                    style={styles.changeFileBtn}
                                    onPress={() => setBuiltyFile(null)}
                                >
                                    <Text style={styles.changeFileText}>Change File</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptionsContainer}>
                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleBuiltyCamera}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <Circle cx="12" cy="13" r="4" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>Camera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleBuiltyGallery}>
                                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                                        <Rect x="3" y="3" width="18" height="18" rx="2" />
                                        <Circle cx="8.5" cy="8.5" r="1.5" />
                                        <Path d="M21 15l-5-5L5 21" />
                                    </Svg>
                                    <Text style={styles.uploadOptionText}>Gallery</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleBuiltyPick}>
                                    <DocumentIcon />
                                    <Text style={styles.uploadOptionText}>Document</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity 
                                style={styles.modalCancel} 
                                onPress={() => {
                                    setShowBuiltyModal(false);
                                    setBuiltyFile(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalSubmit, (uploadingBuilty || !builtyFile) && styles.modalSubmitDisabled]} 
                                onPress={handleBuiltyUpload}
                                disabled={uploadingBuilty || !builtyFile}
                            >
                                {uploadingBuilty ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Upload & Continue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Modal for Status Updates */}
            <Modal visible={showConfirmModal} animationType="fade" transparent>
                <View style={styles.confirmModalOverlay}>
                    <View style={styles.confirmModalContent}>
                        <View style={styles.confirmIconContainer}>
                            <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <Circle cx="12" cy="12" r="10" />
                                <Path d="M12 16v-4" />
                                <Path d="M12 8h.01" />
                            </Svg>
                        </View>
                        <Text style={styles.confirmTitle}>Update Status?</Text>
                        <Text style={styles.confirmMessage}>
                            Are you sure you want to update the status to "{pendingStatusUpdate !== null ? statuses[pendingStatusUpdate].label : ''}"?
                        </Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity 
                                style={styles.confirmCancelBtn} 
                                onPress={() => {
                                    setShowConfirmModal(false);
                                    setPendingStatusUpdate(null);
                                }}
                            >
                                <Text style={styles.confirmCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.confirmOkBtn} 
                                onPress={confirmStatusUpdate}
                            >
                                <Text style={styles.confirmOkText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backButton: { padding: 4 },
    headerTitle: {
        flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: C.text,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 12 },

    // Cards
    card: {
        backgroundColor: C.surface,
        borderRadius: 4, // Classic boxy sleek look
        marginBottom: 10,
        padding: 16,
        borderWidth: 1, borderColor: '#EEE',
    },

    // Order ID Block
    orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    orderIdLabel: { fontSize: 14, color: C.textSec },
    orderIdValue: { fontSize: 14, fontWeight: '600', color: C.text },

    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
    verticalDivider: { width: 1, backgroundColor: '#EEE', height: '100%' },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: C.textSec, marginBottom: 4 },
    summaryValue: { fontSize: 14, fontWeight: '500', color: C.text },

    // Section Headers
    sectionHeader: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 14 },

    // Shipping
    shippingHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    routeContainer: {
        paddingVertical: 4,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeIconContainer: {
        width: 32,
        alignItems: 'center',
        paddingTop: 2,
    },
    originDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: C.success,
        borderWidth: 3,
        borderColor: '#E8F5E9',
    },
    routeContent: {
        flex: 1,
        marginLeft: 12,
    },
    routeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: C.textSec,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    routeAddress: {
        fontSize: 14,
        color: C.text,
        lineHeight: 20,
        fontWeight: '500',
    },
    routeLine: {
        flexDirection: 'row',
        paddingLeft: 16,
        height: 32,
    },
    dottedLine: {
        width: 2,
        height: '100%',
        borderLeftWidth: 2,
        borderLeftColor: C.border,
        borderStyle: 'dashed',
    },
    navigateBtnModern: {
        marginTop: 10,
        alignSelf: 'flex-start',
        backgroundColor: C.primary,
        borderRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    navigateTextModern: {
        fontSize: 13,
        fontWeight: '600',
        color: C.surface,
    },
    shippingRow: { flexDirection: 'row', alignItems: 'flex-start' },
    shippingLabel: { width: 60, fontSize: 13, color: C.textSec },
    shippingValue: { flex: 1, fontSize: 13, color: C.text },

    navigateBtn: {
        marginTop: 6, alignSelf: 'flex-start',
        borderWidth: 1, borderColor: C.primary, borderRadius: 4,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    navigateText: { fontSize: 12, fontWeight: '500', color: C.primary },

    updateLocBtn: {
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    updateLocText: {
        fontSize: 11,
        fontWeight: '600',
        color: C.primary,
    },

    // Timeline
    timelineContainer: { marginTop: 4 },
    timelineRow: { flexDirection: 'row' },
    timelineGraphics: { alignItems: 'center', width: 24, marginRight: 12 },
    dotContainer: { zIndex: 2, backgroundColor: C.surface },
    line: { width: 2, flex: 1, marginVertical: 4 }, // Dynamic color inline

    timelineContent: { flex: 1, paddingBottom: 24 },
    statusTitle: { fontSize: 13, fontWeight: '500', color: C.textSec }, // Inactive is grey
    statusDate: { fontSize: 11, color: C.textSec, marginTop: 2 },
    statusSub: { fontSize: 11, color: '#999', marginTop: 2 },

    // Contacts
    contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    contactName: { fontSize: 14, color: C.text },
    contactPhone: { fontSize: 12, color: C.textSec, marginTop: 2 },

    // Documents
    documentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F5FF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#D0E0FF',
    },
    documentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    documentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
        marginBottom: 2,
    },
    documentSubtitle: {
        fontSize: 12,
        color: C.textSec,
    },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: C.surface, padding: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    actionButton: {
        backgroundColor: C.primary,
        borderRadius: 4,
        paddingVertical: 14,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    },
    actionButtonDisabled: {
        backgroundColor: '#A0C4F5',
        opacity: 0.7,
    },
    actionButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: C.textSec, marginBottom: 20 },
    uploadPlaceholder: {
        height: 150, backgroundColor: '#F0F5FF',
        borderRadius: 8, borderWidth: 1, borderColor: '#D0E0FF', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    uploadText: { fontSize: 14, color: C.primary, marginTop: 10 },
    uploadSubtext: { fontSize: 12, color: C.textSec, marginTop: 4 },
    changeFileBtn: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: C.primary,
        borderRadius: 6,
    },
    changeFileText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFF',
    },
    uploadOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    uploadOptionBtn: {
        flex: 1,
        backgroundColor: '#F0F5FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D0E0FF',
        paddingVertical: 24,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.primary,
        textAlign: 'center',
    },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalCancel: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: C.border },
    modalCancelText: { fontSize: 14, color: C.text },
    modalSubmit: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 4, backgroundColor: C.primary },
    modalSubmitDisabled: {
        backgroundColor: '#A0C4F5',
        opacity: 0.7,
    },
    modalSubmitText: { fontSize: 14, color: '#FFF', fontWeight: '600' },

    // Inputs
    inputLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: C.border, borderRadius: 4,
        paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 14, color: C.text, backgroundColor: '#FAFAFA'
    },
    dropdown: {
        borderWidth: 1, borderColor: C.border, borderRadius: 4,
        paddingHorizontal: 12, paddingVertical: 12,
        backgroundColor: '#FAFAFA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    dropdownList: {
        borderWidth: 1, borderColor: C.border, borderRadius: 4,
        marginTop: 4, backgroundColor: C.surface,
        maxHeight: 150
    },
    dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    dropdownItemText: { fontSize: 14, color: C.text },
    dropdownItemSubtext: { fontSize: 12, color: C.textSec, marginTop: 2 },

    // Confirmation Modal
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalContent: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 32,
        alignItems: 'center',
        width: '85%',
        maxWidth: 400,
    },
    confirmIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: C.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 14,
        color: C.textSec,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmCancelBtn: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface,
    },
    confirmCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
    },
    confirmOkBtn: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: C.primary,
    },
    confirmOkText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default ActiveTripScreen;
