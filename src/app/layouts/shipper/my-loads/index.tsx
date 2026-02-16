import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
    FlatList,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config';
import moment from 'moment';

// ==========================================
// HELPERS
// ==========================================

/** Extract city name (first segment) from a full address string */
const extractCity = (address: string): string => {
    if (!address) return '—';
    const parts = address.split(',');
    return parts[0]?.trim() || '—';
};

/** Format price number to ₹XX,XXX */
const formatPrice = (price: string | number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '₹0';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

/** Format ISO date to readable string */
const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    return moment(dateStr).format('DD MMM, YYYY');
};

/** Format 24h time to 12h */
const formatTime = (time: string): string => {
    if (!time) return '—';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

/** Get status badge config from status text */
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

// ==========================================
// COMPONENT
// ==========================================

const ShipperMyLoads: React.FC = () => {
    const [loads, setLoads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const fetchMyLoads = useCallback(async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.SHIPPER_MY_LOADS);
            if (response?.data?.success) {
                console.log(`My Loads Data:`, response.data.data);

                setLoads(response.data.data || []);
            } else {
                setLoads([]);
            }
        } catch (error) {
            console.error('Error fetching my loads:', error);
            setLoads([]);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchMyLoads();
            setLoading(false);
        };
        init();
    }, [fetchMyLoads]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMyLoads();
        setRefreshing(false);
    }, [fetchMyLoads]);

    const openDetail = (load: any) => {
        setSelectedLoad(load);
        setShowDetailModal(true);
    };

    const callSalesManager = () => {
        Alert.alert('Call Sales Manager', 'Calling Sales Manager...');
    };

    // ---- RENDER LOAD CARD ----
    const renderLoadCard = (load: any) => {
        const statusCfg = getStatusConfig(load.status);
        const pickupStr = load.loading_city_state || extractCity(load.origin_location);
        const dropStr = load.unloading_city_state || extractCity(load.destination_location);

        const [pickupCity, pickupState] = pickupStr.includes(',') ? pickupStr.split(',').map((s: string) => s.trim()) : [pickupStr, ''];
        const [dropCity, dropState] = dropStr.includes(',') ? dropStr.split(',').map((s: string) => s.trim()) : [dropStr, ''];

        return (
            <View key={load.id} style={mlStyles.loadCard}>
                {/* Card Header */}
                <View style={mlStyles.cardHeader}>
                    <Text style={mlStyles.loadIdText}>{load.load_id || `#${load.id}`}</Text>
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
                        <Text style={mlStyles.infoBoxValue} numberOfLines={1}>{load.material?.name || '—'}</Text>
                    </View>
                    <View style={mlStyles.infoBoxDivider} />
                    <View style={mlStyles.infoBoxItem}>
                        <Text style={mlStyles.infoBoxLabel}>Truck</Text>
                        <Text style={mlStyles.infoBoxValue} numberOfLines={1}>{load.vehicle_length?.length_label || '—'}</Text>
                    </View>
                    <View style={mlStyles.infoBoxDivider} />
                    <View style={mlStyles.infoBoxItem}>
                        <Text style={mlStyles.infoBoxLabel}>Shipment Price</Text>
                        <Text style={mlStyles.infoBoxValuePrice}>{formatPrice(load.price)}</Text>
                    </View>
                </View>

                {/* Interested Truckers */}
                {parseInt(load.applications_count || '0') > 0 && (
                    <View style={mlStyles.interestedRow}>
                        <View style={mlStyles.interestedPill}>
                            <Text style={mlStyles.interestedText}>🔥 {load.applications_count} interested truckers</Text>
                        </View>
                    </View>
                )}

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
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        style={mlStyles.modalScroll}
                        contentContainerStyle={mlStyles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Load ID & Status */}
                        <View style={mlStyles.detailTopCard}>
                            <View style={mlStyles.detailTopRow}>
                                <Text style={mlStyles.detailLoadId}>{selectedLoad.load_id || `#${selectedLoad.id}`}</Text>
                                <View style={[mlStyles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                                    <Text style={[mlStyles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                                </View>
                            </View>
                            <Text style={mlStyles.detailPostedOn}>Posted on {formatDate(selectedLoad.created_at)}</Text>
                        </View>

                        {/* Route Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📍 Route Information</Text>
                            <View style={mlStyles.detailRouteSection}>
                                <View style={mlStyles.detailRouteRow}>
                                    <View style={[mlStyles.detailRouteDot, { backgroundColor: '#22c55e' }]} />
                                    <View style={mlStyles.detailRouteInfo}>
                                        <Text style={mlStyles.detailRouteLabel}>Pickup Location</Text>
                                        <Text style={mlStyles.detailRouteAddress}>{selectedLoad.origin_location || '—'}</Text>
                                        {selectedLoad.exact_origin_location && selectedLoad.exact_origin_location !== 'No' && (
                                            <Text style={mlStyles.detailExactAddress}>📌 {selectedLoad.exact_origin_location}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={mlStyles.detailRouteConnector} />
                                <View style={mlStyles.detailRouteRow}>
                                    <View style={[mlStyles.detailRouteDot, { backgroundColor: '#ef4444' }]} />
                                    <View style={mlStyles.detailRouteInfo}>
                                        <Text style={mlStyles.detailRouteLabel}>Drop Location</Text>
                                        <Text style={mlStyles.detailRouteAddress}>{selectedLoad.destination_location || '—'}</Text>
                                        {selectedLoad.exact_destination_location && selectedLoad.exact_destination_location !== 'No' && (
                                            <Text style={mlStyles.detailExactAddress}>📌 {selectedLoad.exact_destination_location}</Text>
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
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.material?.name || '—'}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Quantity</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.meterial_quantity || selectedLoad.load_qty || '—'} Tonnes</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Body Type</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicle_body?.name || '—'}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Length</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicle_length?.length_label || '—'}</Text>
                                </View>
                                <View style={mlStyles.detailInfoItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Vehicle Type</Text>
                                    <Text style={mlStyles.detailInfoValue}>{selectedLoad.vehicle_type?.vehicle_name || '—'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Schedule Card */}
                        <View style={mlStyles.detailCard}>
                            <Text style={mlStyles.detailCardTitle}>📅 Schedule</Text>
                            <View style={mlStyles.detailScheduleRow}>
                                <View style={mlStyles.detailScheduleItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Pickup Date</Text>
                                    <Text style={mlStyles.detailInfoValue}>{formatDate(selectedLoad.picup_date)}</Text>
                                </View>
                                <View style={mlStyles.detailScheduleItem}>
                                    <Text style={mlStyles.detailInfoLabel}>Pickup Time</Text>
                                    <Text style={mlStyles.detailInfoValue}>{formatTime(selectedLoad.load_time)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Price Card */}
                        <View style={mlStyles.detailPriceCard}>
                            <View style={mlStyles.detailPriceRow}>
                                <View>
                                    <Text style={mlStyles.detailPriceLabel}>Shipment Price</Text>
                                    <Text style={mlStyles.detailPriceAmount}>{formatPrice(selectedLoad.price)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ height: 30 }} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    // ---- EMPTY STATE ----
    const renderEmpty = () => (
        <View style={mlStyles.emptyContainer}>
            <Text style={mlStyles.emptyEmoji}>�</Text>
            <Text style={mlStyles.emptyTitle}>No Loads Posted Yet</Text>
            <Text style={mlStyles.emptySub}>Your posted loads will appear here.</Text>
        </View>
    );

    return (
        <View style={mlStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Screen Header */}
            <View style={mlStyles.screenHeader}>
                <Text style={mlStyles.screenTitle}>My Loads</Text>
                <View style={mlStyles.loadCountChip}>
                    <Text style={mlStyles.loadCountText}>{loads.length} Loads</Text>
                </View>
            </View>

            {loading ? (
                <View style={mlStyles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={loads}
                    renderItem={({ item }) => renderLoadCard(item)}
                    keyExtractor={(item) => item.id.toString()}
                    style={mlStyles.scrollView}
                    contentContainerStyle={mlStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
                    }
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={<View style={{ height: 80 }} />}
                />
            )}

            {renderDetailModal()}
        </View>
    );
};

const mlStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    screenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#f8fafc',
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
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },

    // --- Empty State ---
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    emptySub: {
        fontSize: 14,
        color: '#94a3b8',
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
        paddingTop: 48,
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
    detailExactAddress: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontStyle: 'italic',
    },
    detailRouteConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#e2e8f0',
        marginLeft: 5,
        marginVertical: 4,
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
});

export default ShipperMyLoads;
