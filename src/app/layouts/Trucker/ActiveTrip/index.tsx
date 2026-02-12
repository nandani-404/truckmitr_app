import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Modal, Alert, Linking, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';

const { width } = Dimensions.get('window');

// ── Classic Color Palette (Flipkart Style) ──
const C = {
    bg: '#F1F3F6',          // Light grey background
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

interface Props { onBack?: () => void; onComplete?: () => void; loadId?: string; }

const ActiveTripScreen: React.FC<Props> = ({ onBack, onComplete, loadId }) => {
    const [currentStatus, setCurrentStatus] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [showPODModal, setShowPODModal] = useState(false);

    // Vehicle Assignment Modal State
    const [showAssignVehicleModal, setShowAssignVehicleModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [driverDL, setDriverDL] = useState('');
    const [showVehicleList, setShowVehicleList] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]); // API Data

    // Trip Data
    const [trip, setTrip] = useState<any>({
        id: loadId || 'N/A',
        origin: 'Loading...',
        destination: 'Loading...',
        trackingAgent: { name: 'Support', phone: '' },
        driver: { name: '', phone: '', dl: '' },
        vehicle: '',
        payment: '',
    });

    useEffect(() => {
        if (loadId) {
            fetchTripDetails();
        } else {
            // If no loadId is passed, stop loading immediately as there's no trip to fetch
            setLoading(false);
        }
        fetchVehicles();
    }, [loadId]);

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
                        dl: ''
                    },
                    material: data.material_name,
                    weight: data.material_weight
                });

                // Set status
                const statusCode = parseInt(data.current_status_code, 10);
                if (!isNaN(statusCode)) {
                    setCurrentStatus(statusCode);
                }
            } else {
                Alert.alert('Error', 'Failed to load trip details.');
            }
        } catch (error) {
            console.error('Error fetching trip details:', error);
            // Alert.alert('Error', 'Failed to fetch trip details.'); 
            // Commenting out alert to avoid spam if it fails on mount for dev
        } finally {
            setLoading(false);
        }
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

    const statuses = [
        { id: 0, label: 'Load Accepted', date: 'Fri, 10th Feb', sub: 'Your request has been accepted' },
        { id: 1, label: 'Vehicle Assigned', date: 'Fri, 10th Feb - 11:00 AM', sub: 'Truck assigned for this trip' },
        { id: 2, label: 'Reached Pickup', date: 'Fri, 10th Feb - 2:00 PM', sub: 'Truck arrived at location' },
        { id: 3, label: 'Loaded', date: 'Fri, 10th Feb - 4:30 PM', sub: 'Goods loaded successfully' },
        { id: 4, label: 'In Transit', date: 'Expected Tomorrow', sub: 'On the way to destination' },
        { id: 5, label: 'Reached Destination', date: '--', sub: 'Arrived at drop location' },
        { id: 6, label: 'Delivered', date: '--', sub: 'Goods delivered & POD uploaded' },
    ];

    const updateStatus = () => {
        if (currentStatus === 0) { // Moving to Vehicle Assigned
            setShowAssignVehicleModal(true);
            return;
        }
        if (currentStatus === 5) { // Moving to Delivered
            setShowPODModal(true);
            return;
        }

        if (currentStatus < 6) {
            Alert.alert(
                'Update Status',
                `Mark as "${statuses[currentStatus + 1].label}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => setCurrentStatus(currentStatus + 1) }
                ]
            );
        }
    };

    const handleAssignVehicle = () => {
        if (!selectedVehicle || !driverName || !driverPhone) {
            Alert.alert('Incomplete Details', 'Please fill all mandatory fields to assign vehicle.');
            return;
        }

        // Update Trip Data locally
        setTrip((prev: any) => ({
            ...prev,
            vehicle: selectedVehicle,
            driver: { name: driverName, phone: driverPhone, dl: driverDL }
        }));

        setCurrentStatus(1);
        setShowAssignVehicleModal(false);
        // TODO: Call API to assign vehicle
    };

    const handleUpdateLocation = () => {
        Alert.alert('Location Updated', 'Your current location has been shared with the tracking agent.');
    };

    const handlePODUpload = () => {
        setShowPODModal(false);
        setCurrentStatus(6);
        Alert.alert('Trip Completed', 'POD uploaded successfully.', [{ text: 'OK', onPress: onComplete }]);
    };

    const callAgent = () => {
        if (trip.trackingAgent?.phone) Linking.openURL(`tel:${trip.trackingAgent.phone}`);
    };
    const callDriver = () => {
        if (trip.driver?.phone) Linking.openURL(`tel:${trip.driver.phone}`);
    };
    const openMaps = () => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(trip.destination)}`);

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
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={{ marginTop: 10, color: C.textSec }}>Loading Trip Details...</Text>
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

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>Shipping Details</Text>
                        <TouchableOpacity onPress={handleUpdateLocation} style={styles.updateLocBtn}>
                            <Text style={styles.updateLocText}>📍 Update Location</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.shippingRow}>
                        <Text style={styles.shippingLabel}>From</Text>
                        <Text style={styles.shippingValue}>{trip.origin}</Text>
                    </View>
                    <View style={[styles.shippingRow, { marginTop: 12 }]}>
                        <Text style={styles.shippingLabel}>To</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shippingValue}>{trip.destination}</Text>
                            <TouchableOpacity style={styles.navigateBtn} onPress={openMaps}>
                                <Text style={styles.navigateText}>Get Directions</Text>
                            </TouchableOpacity>
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
                    <TouchableOpacity style={styles.actionButton} onPress={updateStatus}>
                        {currentStatus === 5 && <CameraIcon />}
                        <Text style={styles.actionButtonText}>
                            {currentStatus === 0 ? 'Mark as Vehicle Assigned' :
                                currentStatus === 5 ? 'Upload POD & Complete' :
                                    `Mark as ${statuses[currentStatus + 1]?.label}`}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* POD Modal */}
            <Modal visible={showPODModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Upload Proof of Delivery</Text>
                        <Text style={styles.modalSubtitle}>Please upload a clear picture of the signed POD.</Text>

                        <TouchableOpacity style={styles.uploadPlaceholder}>
                            <CameraIcon />
                            <Text style={styles.uploadText}>Tap to Capture</Text>
                        </TouchableOpacity>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPODModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={handlePODUpload}>
                                <Text style={styles.modalSubmitText}>Submit</Text>
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
                        <Text style={styles.modalSubtitle}>Select a vehicle and provide driver details.</Text>

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
                                {vehicles.map((v: any, index: number) => {
                                    const vNum = typeof v === 'string' ? v : (v.registration_number || v.vehicle_number || 'Unknown Vehicle');
                                    return (
                                        <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => { setSelectedVehicle(vNum); setShowVehicleList(false); }}>
                                            <Text style={styles.dropdownItemText}>{vNum}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                {vehicles.length === 0 && (
                                    <View style={styles.dropdownItem}>
                                        <Text style={{ color: C.textSec, fontSize: 13 }}>No vehicles found</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Driver Name</Text>
                        <TextInput style={styles.input} value={driverName} onChangeText={setDriverName} placeholder="Enter Driver Name" placeholderTextColor={C.textSec} />

                        <Text style={styles.inputLabel}>Driver Phone</Text>
                        <TextInput style={styles.input} value={driverPhone} onChangeText={setDriverPhone} placeholder="Enter Driver Phone" placeholderTextColor={C.textSec} keyboardType="phone-pad" />

                        <Text style={styles.inputLabel}>Driver DL (Optional)</Text>
                        <TextInput style={styles.input} value={driverDL} onChangeText={setDriverDL} placeholder="Enter Driving License No" placeholderTextColor={C.textSec} />

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAssignVehicleModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={handleAssignVehicle}>
                                <Text style={styles.modalSubmitText}>Assign</Text>
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
        borderRadius: 4,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    updateLocText: {
        fontSize: 11, fontWeight: '600', color: C.primary,
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
    modalActions: { flexDirection: 'row', gap: 10 },
    modalCancel: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: C.border },
    modalCancelText: { fontSize: 14, color: C.text },
    modalSubmit: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 4, backgroundColor: C.primary },
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
    dropdownItemText: { fontSize: 14, color: C.text }
});

export default ActiveTripScreen;
