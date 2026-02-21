import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    StatusBar,
    Modal,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config';
import { ActivityIndicator, RefreshControl } from 'react-native';
import moment from 'moment';
import { STACKS } from '@truckmitr/stacks/stacks';

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
    salesManagerContact?: string;
    rawPrice: any;
    rawItem: any;
}

const openLoadsData: LoadData[] = []; // Initialized as empty

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

const getStatusConfig = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'pending':
            return { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' };
        case 'accepted':
            return { label: 'Accepted', color: '#22c55e', bg: '#dcfce7' };
        case 'in_transit':
        case 'intransit':
            return { label: 'In Transit', color: '#3b82f6', bg: '#dbeafe' };
        case 'delivered':
            return { label: 'Delivered', color: '#10b981', bg: '#d1fae5' };
        case 'cancelled':
            return { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' };
        case 'completed':
            return { label: 'Completed', color: '#14b8a6', bg: '#ccfbf1' };
        default:
            return { label: status || 'Posted', color: '#3b82f6', bg: '#dbeafe' };
    }
};

const formatPrice = (price: string | number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num) || num === 0) return 'Negotiable';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    return moment(dateStr).format('DD MMM, YYYY');
};

const formatTime = (time: string): string => {
    if (!time) return '—';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const ShipperActiveLoads: React.FC = () => {
    const navigation = useNavigation<any>();
    const [selectedLoad, setSelectedLoad] = useState<LoadData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);

    const [loadsData, setLoadsData] = useState<LoadData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const extractCity = (location: string) => {
        if (!location) return 'N/A';
        return location.split(',')[0].trim();
    };

    const formatCurrency = (price: any) => {
        if (!price || parseFloat(price) === 0) return 'Negotiable';
        return `₹${parseFloat(price).toLocaleString('en-IN')}`;
    };

    const mapApiData = (apiData: any[]): LoadData[] => {
        return apiData.map(item => ({
            id: item.load_id || `#${item.id}`,
            pickupCity: item.loading_city_state ? extractCity(item.loading_city_state) : extractCity(item.origin_location),
            pickupAddress: item.origin_location,
            dropCity: item.unloading_city_state ? extractCity(item.unloading_city_state) : extractCity(item.destination_location),
            dropAddress: item.destination_location,
            materialType: item.material?.name || item.meterial || 'N/A',
            quantity: `${item.load_qty || item.meterial_quantity || '0'} Tonnes`,
            vehicleBodyType: item.vehicle_body?.name || 'N/A',
            vehicleType: item.vehicle_length?.length_label || 'N/A',
            price: item.price,
            rawPrice: item.price,
            status: item.status || 'Accepted',
            statusColor: '', // Handled by getStatusConfig
            statusBg: '', // Handled by getStatusConfig
            postedDate: item.created_at,
            pickupDate: item.picup_date,
            pickupTime: item.load_time || 'N/A',
            distance: 'N/A',
            notes: item.notes || '',
            offersCount: parseInt(item.applications_count || '0', 10),
            rawItem: item, // Keep raw for detail mapping
        }));
    };

    const fetchLoads = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await axiosInstance.post(END_POINTS.GET_LOAD_BY_STATUS, {
                status: 'open-load'
            });
            console.log('Accepted loads response:', response.data);
            if (response.data.success) {
                setLoadsData(mapApiData(response.data.data));
            }
        } catch (error) {
            console.error('Error fetching accepted loads:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchLoads();
    }, []);

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

    const renderLoadCard = (load: any) => {
        const statusCfg = getStatusConfig(load.status);
        const pickupStr = load.rawItem?.loading_city_state || load.pickupAddress;
        const dropStr = load.rawItem?.unloading_city_state || load.dropAddress;

        const [pickupCity, pickupState] = pickupStr.includes(',') ? pickupStr.split(',').map((s: string) => s.trim()) : [extractCity(pickupStr), ''];
        const [dropCity, dropState] = dropStr.includes(',') ? dropStr.split(',').map((s: string) => s.trim()) : [extractCity(dropStr), ''];

        return (
            <View key={load.id} style={mlStyles.loadCard}>
                {/* Card Header */}
                <View style={mlStyles.cardHeader}>
                    <Text style={mlStyles.loadIdText}>{load.id}</Text>
                    <View style={[mlStyles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[mlStyles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                </View>

                {/* Route */}
                <View style={mlStyles.routeContainer}>
                    <View style={mlStyles.routePoint}>
                        <View style={mlStyles.routeDotGreen} />
                        <Text style={mlStyles.routeCity} numberOfLines={1}>{pickupCity}</Text>
                        {pickupState ? <Text style={mlStyles.routeState} numberOfLines={1}>{pickupState}</Text> : null}
                    </View>
                    <View style={mlStyles.routeMiddle}>
                        <View style={mlStyles.routeLine} />
                        <MLTruckIcon />
                    </View>
                    <View style={mlStyles.routePoint}>
                        <View style={mlStyles.routeDotRed} />
                        <Text style={mlStyles.routeCity} numberOfLines={1}>{dropCity}</Text>
                        {dropState ? <Text style={mlStyles.routeState} numberOfLines={1}>{dropState}</Text> : null}
                    </View>
                </View>

                {/* Info Box - Grey Background */}
                <View style={mlStyles.infoBox}>
                    <View style={mlStyles.infoBoxItem}>
                        <Text style={mlStyles.infoBoxLabel}>Material</Text>
                        <Text style={mlStyles.infoBoxValue} numberOfLines={1}>{load.materialType}</Text>
                    </View>
                    <View style={mlStyles.infoBoxDivider} />
                    <View style={mlStyles.infoBoxItem}>
                        <Text style={mlStyles.infoBoxLabel}>Truck</Text>
                        <Text style={mlStyles.infoBoxValue} numberOfLines={1}>{load.vehicleType}</Text>
                    </View>
                    <View style={mlStyles.infoBoxDivider} />
                    <View style={mlStyles.infoBoxItem}>
                        <Text style={mlStyles.infoBoxLabel}>Shipment Price</Text>
                        <Text style={mlStyles.infoBoxValuePrice}>{formatPrice(load.rawPrice)}</Text>
                    </View>
                </View>

                {/* Interested Truckers */}
                {load.offersCount > 0 && (
                    <View style={mlStyles.interestedRow}>
                        <View style={mlStyles.interestedPill}>
                            <Text style={mlStyles.interestedText}>🔥 {load.offersCount} interested {load.offersCount === 1 ? 'trucker' : 'truckers'}</Text>
                        </View>
                    </View>
                )}

                {/* Row 1: View Detail & Call Sales Manager */}
                <View style={mlStyles.actionRow}>
                    <TouchableOpacity
                        style={[mlStyles.actionButtonBase, mlStyles.viewDetailButton]}
                        onPress={() => openDetail(load)}
                        activeOpacity={0.8}
                    >
                        <Text style={mlStyles.viewDetailButtonText}>View Detail</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[mlStyles.actionButtonBase, mlStyles.callSalesButton]}
                        onPress={callSalesManager}
                        activeOpacity={0.8}
                    >
                        <Text style={mlStyles.callSalesButtonText} numberOfLines={1}>Call Sales Manager</Text>
                    </TouchableOpacity>
                </View>

                {/* Row 2: Edit Load / Locked & Cancel Load */}
                {load.offersCount === 0 ? (
                    <View style={[mlStyles.actionRow, { marginTop: 8 }]}>
                        <TouchableOpacity
                            style={[mlStyles.actionButtonBase, { backgroundColor: '#e0f2fe', borderColor: '#e0f2fe' }]}
                            onPress={() => navigation.navigate(STACKS.SHIPPER_EDIT_LOAD, { editData: load.rawItem })}
                            activeOpacity={0.8}
                        >
                            <Text style={[mlStyles.viewDetailButtonText, { color: '#0284c7' }]}>Edit Load</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[mlStyles.actionButtonBase, mlStyles.cancelBtnCard]}
                            onPress={() => { setSelectedLoad(load); setShowCancelConfirm(true); }}
                            activeOpacity={0.8}
                        >
                            <Text style={mlStyles.cancelBtnText}>Cancel Load</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[mlStyles.actionRow, { marginTop: 8 }]}>
                        <View style={[mlStyles.lockedInfoBox, { flex: 1, marginTop: 0, marginBottom: 0 }]}>
                            <Text style={mlStyles.lockedInfoText}>🔒 Editing and cancellation are locked as interests received</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // ---- DETAIL MODAL ----
    const renderDetailModal = () => {
        if (!selectedLoad) return null;
        const statusCfg = getStatusConfig(selectedLoad.status);

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
                                <View style={[mlStyles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                                    <Text style={[mlStyles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                                </View>
                            </View>
                            <Text style={mlStyles.detailPostedOn}>Posted on {formatDate(selectedLoad.postedDate)}</Text>
                        </View>

                        {/* Route Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📍 Route Information</Text>
                            <View style={mlStyles.detailRouteSection}>
                                <View style={mlStyles.detailRouteRow}>
                                    <View style={[mlStyles.detailRouteDot, { backgroundColor: '#22c55e' }]} />
                                    <View style={mlStyles.detailRouteInfo}>
                                        <Text style={mlStyles.detailRouteLabel}>Pickup Location</Text>
                                        <Text style={mlStyles.detailRouteAddress}>{selectedLoad.pickupAddress || '—'}</Text>
                                        {selectedLoad.rawItem?.exact_origin_location && selectedLoad.rawItem?.exact_origin_location !== 'No' && (
                                            <Text style={mlStyles.detailExactAddress}>📌 {selectedLoad.rawItem.exact_origin_location}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={mlStyles.detailRouteConnector} />
                                <View style={mlStyles.detailRouteRow}>
                                    <View style={[mlStyles.detailRouteDot, { backgroundColor: '#ef4444' }]} />
                                    <View style={mlStyles.detailRouteInfo}>
                                        <Text style={mlStyles.detailRouteLabel}>Drop Location</Text>
                                        <Text style={mlStyles.detailRouteAddress}>{selectedLoad.dropAddress || '—'}</Text>
                                        {selectedLoad.rawItem?.exact_destination_location && selectedLoad.rawItem?.exact_destination_location !== 'No' && (
                                            <Text style={mlStyles.detailExactAddress}>📌 {selectedLoad.rawItem.exact_destination_location}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Load Info Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📦 Load Information</Text>
                            <View style={mlStyles.detailInfoGrid}>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Material</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.materialType || '—'}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Quantity</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.quantity || '—'}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Body Type</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicleBodyType || '—'}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Length</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicleType || '—'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Schedule Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📅 Schedule</Text>
                            <View style={mlStyles.detailScheduleRow}>
                                <View style={mlStyles.detailScheduleItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Pickup Date</Text>
                                    <Text style={mlStyles.detailInfoValue}>{formatDate(selectedLoad.pickupDate)}</Text>
                                </View>
                                <View style={mlStyles.detailScheduleItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Pickup Time</Text>
                                    <Text style={mlStyles.detailInfoValue}>{formatTime(selectedLoad.pickupTime)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Price Card */}
                        <View style={mlStyles.detailPriceCard}>
                            <View style={mlStyles.detailPriceRow}>
                                <View>
                                    <Text style={mlStyles.detailPriceLabel}>Shipment Price</Text>
                                    <Text style={mlStyles.detailPriceAmount}>{formatPrice(selectedLoad.rawPrice)}</Text>
                                </View>
                                {selectedLoad.offersCount > 0 && (
                                    <View style={mlStyles.detailOffersChip}>
                                        <Text style={mlStyles.detailOffersText}>🔥 {selectedLoad.offersCount} {selectedLoad.offersCount === 1 ? 'Trucker' : 'Truckers'} Quoted</Text>
                                    </View>
                                )}
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
                                disabled={selectedLoad?.offersCount > 0}
                                onPress={() => {
                                    setShowMenuModal(false);
                                    setShowDetailModal(false);
                                    navigation.navigate(STACKS.SHIPPER_EDIT_LOAD, { editData: selectedLoad.rawItem });
                                }}
                            >
                                <Text style={[
                                    mlStyles.menuItemText,
                                    { color: selectedLoad?.offersCount > 0 ? '#94a3b8' : '#3b82f6' }
                                ]}>
                                    ✏️ Edit Load {selectedLoad?.offersCount > 0 ? '(Locked)' : ''}
                                </Text>
                            </TouchableOpacity>
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

    return (
        <View style={mlStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Screen Header */}
            <View style={mlStyles.screenHeader}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={mlStyles.backButton}
                >
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M15 18L9 12L15 6"
                            stroke="#1e293b"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity>
                <Text style={mlStyles.screenTitle}>Active Loads</Text>
                <View style={mlStyles.loadCountChip}>
                    <Text style={mlStyles.loadCountText} numberOfLines={1}>{loadsData.length} Loads</Text>
                </View>
            </View>

            {isLoading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={loadsData}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => renderLoadCard(item)}
                    ListHeaderComponent={
                        loadsData.length > 0 ? (
                            <View style={mlStyles.infoBanner}>
                                <Text style={mlStyles.infoBannerText}>
                                    💡 Tip: You can edit load details only until a trucker shows interest.
                                </Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={mlStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchLoads(true)} colors={['#3b82f6']} />
                    }
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', marginTop: 100 }}>
                            <Text style={{ color: '#6b7280', fontSize: 16 }}>No active loads found</Text>
                        </View>
                    }
                    ListFooterComponent={<View style={{ height: 80 }} />}
                />
            )}

            {renderDetailModal()}

            {/* Cancel Confirmation Modal */}
            <Modal
                visible={showCancelConfirm}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCancelConfirm(false)}
            >
                <View style={mlStyles.confirmModalOverlay}>
                    <View style={mlStyles.confirmModalContainer}>
                        <View style={mlStyles.confirmIconContainer}>
                            <Text style={{ fontSize: 32 }}>⚠️</Text>
                        </View>
                        <Text style={mlStyles.confirmTitle}>Cancel Load?</Text>
                        <Text style={mlStyles.confirmMessage}>Are you sure you want to cancel this load? This action cannot be undo.</Text>
                        <View style={mlStyles.confirmActions}>
                            <TouchableOpacity
                                style={mlStyles.confirmNoBtn}
                                onPress={() => setShowCancelConfirm(false)}
                            >
                                <Text style={mlStyles.confirmNoText}>No, Keep It</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={mlStyles.confirmYesBtn}
                                onPress={() => {
                                    setShowCancelConfirm(false);
                                    Alert.alert("Success", "Load cancellation request sent.");
                                    // Later will call cancellation API
                                }}
                            >
                                <Text style={mlStyles.confirmYesText}>Yes, Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
        flex: 1,
        marginLeft: 12,
    },
    loadCountChip: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        flexShrink: 0,
    },
    loadCountText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3b82f6',
        lineHeight: 15,
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
        justifyContent: 'space-between',
    },
    routePoint: {
        flex: 1,
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
        fontWeight: '700',
        color: '#0f172a',
        textAlign: 'center',
    },
    routeState: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
    },
    routeMiddle: {
        width: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
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
    infoBanner: {
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    infoBannerText: {
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '500',
    },
    lockedInfoBox: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#e2e8f0',
    },
    lockedInfoText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionButtonBase: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    viewDetailButton: {
        backgroundColor: '#ffffff',
        borderColor: '#3b82f6',
    },
    callSalesButton: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    cancelBtnCard: {
        backgroundColor: '#fef2f2',
        borderColor: '#fee2e2',
    },
    viewDetailButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3b82f6',
    },
    cancelBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ef4444',
    },
    callSalesButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },

    // Legacy styles (keeping for compatibility)
    infoGrid: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
    },
    infoRowSeparator: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    infoLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },

    // Price Bar
    priceBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    priceLabel: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#059669',
    },
    offersBadge: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    offersText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ea580c',
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
    detailRouteConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#e2e8f0',
        marginLeft: 5,
        marginVertical: 4,
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
    detailDistanceBadge: {
        backgroundColor: '#e0f2fe',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailDistanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0284c7',
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
    detailExactAddress: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontStyle: 'italic',
    },
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    confirmModalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    confirmIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
    },
    confirmMessage: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    confirmActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmNoBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmNoText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    confirmYesBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmYesText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
});

export default ShipperActiveLoads;
