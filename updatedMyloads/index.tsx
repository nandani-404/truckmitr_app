import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// ==========================================
// INTERFACES & DATA
// ==========================================

interface LoadData {
    id: string;
    pickupCity: string;
    pickupAddress: string;
    dropCity: string;
    dropAddress: string;
    materialType: string;
    quantity: string;
    vehicleBodyType: string;
    vehicleType: string;
    price: string;
    status: string;
    statusColor: string;
    statusBg: string;
    postedDate: string;
    pickupDate: string;
    pickupTime: string;
    distance: string;
    notes: string;
    offersCount: number;
    interestedTruckers: TruckerData[];
    salesManagerContact?: string;
}

interface TruckerData {
    id: string;
    name: string;
    phone: string;
    rating: number;
    tripsCompleted: number;
    truckNumber: string;
    truckType: string;
    offeredPrice: string;
    experience: string;
    avatar: string;
}

const myLoadsData: LoadData[] = [
    {
        id: 'LID-883492',
        pickupCity: 'Mumbai',
        pickupAddress: 'Andheri East, Mumbai, Maharashtra 400069',
        dropCity: 'New Delhi',
        dropAddress: 'Connaught Place, New Delhi, Delhi 110001',
        materialType: 'Electronics & Gadgets',
        quantity: '10 Tonnes',
        vehicleBodyType: 'Closed Body / Container',
        vehicleType: '10 Wheeler Truck',
        price: '₹15,000',
        status: 'Posted',
        statusColor: '#3b82f6',
        statusBg: '#dbeafe',
        postedDate: 'Feb 10, 2026',
        pickupDate: 'Feb 14, 2026',
        pickupTime: '09:00 AM',
        distance: '1,420 km',
        notes: 'Handle with care. Fragile electronic items.',
        offersCount: 3,
        interestedTruckers: [
            {
                id: 'T001',
                name: 'Rajesh Kumar',
                phone: '+91 98765 43210',
                rating: 4.8,
                tripsCompleted: 245,
                truckNumber: 'MH 04 AB 1234',
                truckType: '10 Wheeler Truck',
                offeredPrice: '₹14,500',
                experience: '8 years',
                avatar: '👤',
            },
            {
                id: 'T002',
                name: 'Suresh Yadav',
                phone: '+91 87654 32109',
                rating: 4.5,
                tripsCompleted: 180,
                truckNumber: 'RJ 14 CD 5678',
                truckType: '12 Wheeler Truck',
                offeredPrice: '₹13,800',
                experience: '6 years',
                avatar: '👤',
            },
            {
                id: 'T003',
                name: 'Amit Singh',
                phone: '+91 76543 21098',
                rating: 4.9,
                tripsCompleted: 312,
                truckNumber: 'DL 01 EF 9012',
                truckType: '10 Wheeler Truck',
                offeredPrice: '₹15,200',
                experience: '10 years',
                avatar: '👤',
            },
        ],
    },
    {
        id: 'LID-774201',
        pickupCity: 'Pune',
        pickupAddress: 'Hinjewadi, Pune, Maharashtra 411057',
        dropCity: 'Bangalore',
        dropAddress: 'Whitefield, Bangalore, Karnataka 560066',
        materialType: 'Machinery & Equipment',
        quantity: '18 Tonnes',
        vehicleBodyType: 'Flatbed Truck',
        vehicleType: '12 Wheeler Truck',
        price: '₹28,500',
        status: 'Posted',
        statusColor: '#3b82f6',
        statusBg: '#dbeafe',
        postedDate: 'Feb 09, 2026',
        pickupDate: 'Feb 13, 2026',
        pickupTime: '07:00 AM',
        distance: '840 km',
        notes: 'Heavy machinery. Requires proper lashing.',
        offersCount: 5,
        interestedTruckers: [
            {
                id: 'T004',
                name: 'Vikram Patel',
                phone: '+91 65432 10987',
                rating: 4.7,
                tripsCompleted: 198,
                truckNumber: 'KA 01 GH 3456',
                truckType: '12 Wheeler Truck',
                offeredPrice: '₹27,000',
                experience: '7 years',
                avatar: '👤',
            },
            {
                id: 'T005',
                name: 'Deepak Sharma',
                phone: '+91 54321 09876',
                rating: 4.6,
                tripsCompleted: 156,
                truckNumber: 'MH 12 IJ 7890',
                truckType: '12 Wheeler Truck',
                offeredPrice: '₹26,500',
                experience: '5 years',
                avatar: '👤',
            },
            {
                id: 'T006',
                name: 'Ganesh Reddy',
                phone: '+91 43210 98765',
                rating: 4.4,
                tripsCompleted: 122,
                truckNumber: 'AP 09 KL 2345',
                truckType: 'Flatbed Truck',
                offeredPrice: '₹28,000',
                experience: '4 years',
                avatar: '👤',
            },
            {
                id: 'T007',
                name: 'Ravi Deshmukh',
                phone: '+91 32109 87654',
                rating: 4.9,
                tripsCompleted: 287,
                truckNumber: 'MH 20 MN 6789',
                truckType: '12 Wheeler Truck',
                offeredPrice: '₹27,800',
                experience: '9 years',
                avatar: '👤',
            },
            {
                id: 'T008',
                name: 'Prakash Jadhav',
                phone: '+91 21098 76543',
                rating: 4.3,
                tripsCompleted: 95,
                truckNumber: 'GJ 05 OP 0123',
                truckType: 'Flatbed Truck',
                offeredPrice: '₹29,000',
                experience: '3 years',
                avatar: '👤',
            },
        ],
    },
    {
        id: 'LID-665310',
        pickupCity: 'Ahmedabad',
        pickupAddress: 'SG Highway, Ahmedabad, Gujarat 380054',
        dropCity: 'Chennai',
        dropAddress: 'Ambattur, Chennai, Tamil Nadu 600053',
        materialType: 'Cement',
        quantity: '25 Tonnes',
        vehicleBodyType: 'Bulker',
        vehicleType: '32ft Multi-Axle Trailer',
        price: '₹42,000',
        status: 'Posted',
        statusColor: '#3b82f6',
        statusBg: '#dbeafe',
        postedDate: 'Feb 11, 2026',
        pickupDate: 'Feb 15, 2026',
        pickupTime: '06:00 AM',
        distance: '1,850 km',
        notes: 'Bulk cement delivery. Ensure proper tarpaulin cover.',
        offersCount: 2,
        interestedTruckers: [
            {
                id: 'T009',
                name: 'Manoj Tiwari',
                phone: '+91 10987 65432',
                rating: 4.6,
                tripsCompleted: 210,
                truckNumber: 'GJ 01 QR 4567',
                truckType: 'Bulker',
                offeredPrice: '₹40,000',
                experience: '6 years',
                avatar: '👤',
            },
            {
                id: 'T010',
                name: 'Santosh Naik',
                phone: '+91 09876 54321',
                rating: 4.8,
                tripsCompleted: 278,
                truckNumber: 'TN 09 ST 8901',
                truckType: 'Bulker',
                offeredPrice: '₹41,500',
                experience: '8 years',
                avatar: '👤',
            },
        ],
    },
];

// --- SVG Icons for My Loads ---
const MLBackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const MLTruckIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 3h15v13H1z" />
        <Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

const ShipperMyLoads: React.FC = () => {
    const [selectedLoad, setSelectedLoad] = useState<LoadData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showInterestModal, setShowInterestModal] = useState(false);
    
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);

    const cancelReasons = [
        'Shipper Cancelled / Plan Changed',
        'Vehicle Not Available / Trucker Cancelled',
        'Pickup Delayed / Loading Not Ready',
        'Rate / Payment Issue',
    ];

    const openDetail = (load: LoadData) => {
        setSelectedLoad(load);
        setShowDetailModal(true);
    };

    const callSalesManager = () => {
        Alert.alert('Call Sales Manager', `Calling Sales Manager...`);
        // linking enabled not used here for simplicity as per request
    };

    const handleCancelLoad = () => {
        if (!selectedCancelReason) {
            Alert.alert('Select Reason', 'Please select a cancellation reason');
            return;
        }
        Alert.alert('Load Cancelled', `Load cancelled. Reason: ${selectedCancelReason}`);
        setShowCancelModal(false);
        setShowMenuModal(false);
        setShowDetailModal(false);
        setSelectedCancelReason(null);
    };

    const renderLoadCard = (load: LoadData) => (
        <View key={load.id} style={mlStyles.loadCard}>
            {/* Card Header */}
            <View style={mlStyles.cardHeader}>
                <Text style={mlStyles.loadIdText}>{load.id}</Text>
                <View style={[mlStyles.statusBadge, { backgroundColor: load.statusBg }]}>
                    <Text style={[mlStyles.statusText, { color: load.statusColor }]}>{load.status}</Text>
                </View>
            </View>

            {/* Route */}
            <View style={mlStyles.routeContainer}>
                <View style={mlStyles.routePoint}>
                    <View style={[mlStyles.routeDotGreen]} />
                    <Text style={mlStyles.routeCity}>{load.pickupCity}</Text>
                </View>
                <View style={mlStyles.routeMiddle}>
                    <View style={mlStyles.routeLine} />
                    <MLTruckIcon />
                </View>
                <View style={mlStyles.routePoint}>
                    <View style={[mlStyles.routeDotRed]} />
                    <Text style={mlStyles.routeCity}>{load.dropCity}</Text>
                </View>
            </View>

            {/* Info Box - Grey Background */}
            <View style={mlStyles.infoBox}>
                <View style={mlStyles.infoBoxItem}>
                    <Text style={mlStyles.infoBoxLabel}>Material</Text>
                    <Text style={mlStyles.infoBoxValue}>{load.materialType}</Text>
                </View>
                <View style={mlStyles.infoBoxDivider} />
                <View style={mlStyles.infoBoxItem}>
                    <Text style={mlStyles.infoBoxLabel}>Truck</Text>
                    <Text style={mlStyles.infoBoxValue}>{load.vehicleType}</Text>
                </View>
                <View style={mlStyles.infoBoxDivider} />
                <View style={mlStyles.infoBoxItem}>
                    <Text style={mlStyles.infoBoxLabel}>Shipment Price</Text>
                    <Text style={mlStyles.infoBoxValuePrice}>{load.price}</Text>
                </View>
            </View>

            {/* Interested Truckers */}
            <View style={mlStyles.interestedRow}>
                <View style={mlStyles.interestedPill}>
                    <Text style={mlStyles.interestedText}>🔥 {load.interestedTruckers.length} interested truckers</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={mlStyles.actionButtons}>
                <TouchableOpacity
                    style={mlStyles.viewDetailButton}
                    onPress={() => openDetail(load)}
                    activeOpacity={0.8}
                >
                    <Text style={mlStyles.viewDetailButtonText}>View Detail</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={mlStyles.callSalesButton}
                    onPress={callSalesManager}
                    activeOpacity={0.8}
                >
                    <Text style={mlStyles.callSalesButtonText}>Call Sales Manager</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ---- DETAIL MODAL ----
    const renderDetailModal = () => {
        if (!selectedLoad) return null;
        return (
            <Modal
                visible={showDetailModal}
                animationType="slide"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={mlStyles.modalContainer}>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                    {/* Modal Header */}
                    <View style={mlStyles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowDetailModal(false)} style={mlStyles.modalBackBtn}>
                            <MLBackIcon />
                        </TouchableOpacity>
                        <Text style={mlStyles.modalTitle}>Load Details</Text>
                        <TouchableOpacity onPress={() => setShowMenuModal(true)} style={mlStyles.menuBtn}>
                            <Text style={mlStyles.menuDots}>⋮</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={mlStyles.modalScroll}
                        contentContainerStyle={mlStyles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Load ID & Status */}
                        <View style={mlStyles.detailTopCard}>
                            <View style={mlStyles.detailTopRow}>
                                <Text style={mlStyles.detailLoadId}>{selectedLoad.id}</Text>
                                <View style={[mlStyles.statusBadge, { backgroundColor: selectedLoad.statusBg }]}>
                                    <Text style={[mlStyles.statusText, { color: selectedLoad.statusColor }]}>{selectedLoad.status}</Text>
                                </View>
                            </View>
                            <Text style={mlStyles.detailPostedOn}>Posted on {selectedLoad.postedDate}</Text>
                        </View>

                        {/* Route Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📍 Route Information</Text>
                            <View style={mlStyles.detailRouteSection}>
                                <View style={mlStyles.detailRouteRow}>
                                    <View style={[mlStyles.detailRouteDot, { backgroundColor: '#22c55e' }]} />
                                    <View style={mlStyles.detailRouteInfo}>
                                        <Text style={mlStyles.detailRouteLabel}>Pickup Location</Text>
                                        <Text style={mlStyles.detailRouteAddress}>{selectedLoad.pickupAddress}</Text>
                                    </View>
                                </View>
                                <View style={mlStyles.detailRouteConnector} />
                                <View style={mlStyles.detailRouteRow}>
                                    <View style={[mlStyles.detailRouteDot, { backgroundColor: '#ef4444' }]} />
                                    <View style={mlStyles.detailRouteInfo}>
                                        <Text style={mlStyles.detailRouteLabel}>Drop Location</Text>
                                        <Text style={mlStyles.detailRouteAddress}>{selectedLoad.dropAddress}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Load Info Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📦 Load Information</Text>
                            <View style={mlStyles.detailInfoGrid}>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Material Type</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.materialType}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Quantity</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.quantity}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Body Type</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicleBodyType}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Type</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicleType}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Schedule Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📅 Schedule</Text>
                            <View style={mlStyles.detailScheduleRow}>
                                <View style={mlStyles.detailScheduleItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Pickup Date</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.pickupDate}</Text>
                                </View>
                                <View style={mlStyles.detailScheduleItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Pickup Time</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.pickupTime}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Price Card */}
                        <View style={mlStyles.detailPriceCard}>
                            <View style={mlStyles.detailPriceRow}>
                                <View>
                                    <Text style={mlStyles.detailPriceLabel}>Shipment Price</Text>
                                    <Text style={mlStyles.detailPriceAmount}>{selectedLoad.price}</Text>
                                </View>
                                <View style={mlStyles.detailOffersChip}>
                                    <Text style={mlStyles.detailOffersText}>🔥 {selectedLoad.interestedTruckers.length} Interested Truckers</Text>
                                </View>
                            </View>
                        </View>

                        {/* Notes Card */}
                        {selectedLoad.notes ? (
                            <View style={mlStyles.detailCard}>
                                <Text style={mlStyles.detailCardTitle}>📝 Notes</Text>
                                <Text style={mlStyles.detailNotesText}>{selectedLoad.notes}</Text>
                            </View>
                        ) : null}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Sticky Call Sales Manager Button */}
                    <View style={mlStyles.stickyButtonContainer}>
                        <TouchableOpacity
                            style={mlStyles.callSalesManagerBtn}
                            onPress={callSalesManager}
                            activeOpacity={0.8}
                        >
                            <Text style={mlStyles.callSalesManagerBtnText}>📞 Call Sales Manager</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Menu Modal */}
                <Modal
                    visible={showMenuModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowMenuModal(false)}
                >
                    <TouchableOpacity
                        style={mlStyles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setShowMenuModal(false)}
                    >
                        <View style={mlStyles.menuContainer}>
                            <TouchableOpacity
                                style={mlStyles.menuItem}
                                onPress={() => {
                                    setShowMenuModal(false);
                                    setShowCancelModal(true);
                                }}
                            >
                                <Text style={mlStyles.menuItemText}>❌ Cancel Load</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Cancel Reason Modal */}
                <Modal
                    visible={showCancelModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowCancelModal(false)}
                >
                    <View style={mlStyles.cancelOverlay}>
                        <View style={mlStyles.cancelContainer}>
                            <Text style={mlStyles.cancelTitle}>Shipment Cancel Reason</Text>
                            
                            {cancelReasons.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        mlStyles.reasonItem,
                                        selectedCancelReason === reason && mlStyles.reasonItemSelected
                                    ]}
                                    onPress={() => setSelectedCancelReason(reason)}
                                >
                                    <Text style={mlStyles.reasonCheckbox}>
                                        {selectedCancelReason === reason ? '✅' : '☐'}
                                    </Text>
                                    <Text style={mlStyles.reasonText}>{reason}</Text>
                                </TouchableOpacity>
                            ))}

                            <View style={mlStyles.cancelActions}>
                                <TouchableOpacity
                                    style={mlStyles.cancelCancelBtn}
                                    onPress={() => {
                                        setShowCancelModal(false);
                                        setSelectedCancelReason(null);
                                    }}
                                >
                                    <Text style={mlStyles.cancelCancelBtnText}>Close</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={mlStyles.cancelConfirmBtn}
                                    onPress={handleCancelLoad}
                                >
                                    <Text style={mlStyles.cancelConfirmBtnText}>Confirm Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </Modal>
        );
    };

    const renderInterestModal = () => {
        return null;
    };


    return (
        <View style={mlStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Screen Header */}
            <View style={mlStyles.screenHeader}>
                <Text style={mlStyles.screenTitle}>My Loads</Text>
                <View style={mlStyles.loadCountChip}>
                    <Text style={mlStyles.loadCountText}>{myLoadsData.length} Loads</Text>
                </View>
            </View>

            <ScrollView
                style={mlStyles.scrollView}
                contentContainerStyle={mlStyles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {myLoadsData.map(renderLoadCard)}
                <View style={{ height: 80 }} />
            </ScrollView>

            {renderDetailModal()}
            {renderInterestModal()}
        </View>
    );

};

const mlStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    screenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    loadCountChip: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    loadCountText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3b82f6',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },

    // --- Load Card ---
    loadCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    loadIdText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Route
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 6,
    },
    routePoint: {
        alignItems: 'center',
    },
    routeDotGreen: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22c55e',
        marginBottom: 6,
        borderWidth: 2,
        borderColor: '#dcfce7',
    },
    routeDotRed: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#ef4444',
        marginBottom: 6,
        borderWidth: 2,
        borderColor: '#fee2e2',
    },
    routeCity: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    routeMiddle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    routeLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#e5e7eb',
    },

    // Info Box - Grey Background
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    infoBoxItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoBoxDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
    },
    infoBoxLabel: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 4,
    },
    infoBoxValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        textAlign: 'center',
    },
    infoBoxValuePrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#047857',
        textAlign: 'center',
    },

    // Interested Truckers Row
    interestedRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    interestedPill: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    interestedText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ea580c',
    },

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    viewDetailButton: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewDetailButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },
    callSalesButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    callSalesButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },

    // Action Button (legacy)
    viewDetailBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },

    // ---- MODALS ----
    modalContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    menuBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuDots: {
        fontSize: 24,
        fontWeight: '700',
        color: '#64748b',
        lineHeight: 24,
    },
    modalScroll: {
        flex: 1,
    },
    modalScrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    // Detail Modal
    detailTopCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    detailTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLoadId: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
    },
    detailPostedOn: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    detailCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 14,
    },
    detailRouteSection: {
        marginLeft: 4,
    },
    detailRouteRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailRouteDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: 12,
    },
    detailRouteInfo: {
        flex: 1,
    },
    detailRouteLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailRouteAddress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginTop: 2,
    },
    detailRouteConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#e2e8f0',
        marginLeft: 5,
        marginVertical: 4,
    },
    detailDistanceBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    detailDistanceText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#16a34a',
    },
    detailInfoGrid: {
        gap: 12,
    },
    detailInfoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    detailInfoLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    detailInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    detailScheduleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    detailScheduleItem: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    detailPriceCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    detailPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailPriceLabel: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '500',
    },
    detailPriceAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#059669',
        marginTop: 2,
    },
    detailOffersChip: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    detailOffersText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ea580c',
    },
    detailNotesText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    callSalesManagerBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    callSalesManagerBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    stickyButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },

    // Menu Modal
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    menuContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ef4444',
    },

    // Cancel Modal
    cancelOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    cancelContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    cancelTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 20,
        textAlign: 'center',
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f8fafc',
    },
    reasonItemSelected: {
        backgroundColor: '#dbeafe',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    reasonCheckbox: {
        fontSize: 18,
        marginRight: 12,
    },
    reasonText: {
        fontSize: 14,
        color: '#334155',
        flex: 1,
    },
    cancelActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelCancelBtn: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelCancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    cancelConfirmBtn: {
        flex: 1,
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelConfirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },

    // Interest Modal Header
    interestHeaderCenter: {
        alignItems: 'center',
        flex: 1,
    },
    interestSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    interestCountBar: {
        backgroundColor: '#eff6ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    interestCountText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },

    // Trucker Card
    truckerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    truckerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    truckerAvatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    truckerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    truckerAvatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    truckerVerifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    truckerInfo: {
        flex: 1,
    },
    truckerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    truckerRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    truckerRating: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f59e0b',
        marginLeft: 4,
    },
    truckerDividerDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 6,
    },
    truckerTrips: {
        fontSize: 12,
        color: '#64748b',
    },
    truckerExp: {
        fontSize: 12,
        color: '#64748b',
    },

    // Trucker Details
    truckerDetails: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    truckerDetailItem: {
        flex: 1,
        alignItems: 'center',
    },
    truckerDetailLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    truckerDetailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    truckerDetailDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
    },

    // Trucker Footer
    truckerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    truckerPriceLabel: {
        fontSize: 11,
        color: '#94a3b8',
    },
    truckerPriceValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#059669',
    },
    truckerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    acceptBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    acceptBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
});

export default ShipperMyLoads;
