import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    StatusBar,
    Image,
    Modal,
    ActivityIndicator,
    RefreshControl,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/utils/config';
import ShimmerText from '@truckmitr/utils/shimmerText';
import { STACKS } from '@truckmitr/stacks/stacks';
import moment from 'moment';

// ==========================================
// TRUCK ICON COMPONENT
// ==========================================

const TruckIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 3h15v13H1z" />
        <Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

// ==========================================
// INTERFACES
// ==========================================

interface AcceptedLoadData {
    id: string;
    load_id: string;
    pickupCity: string;
    pickupState: string;
    pickupAddress: string;
    dropCity: string;
    dropState: string;
    dropAddress: string;
    materialType: string;
    quantity: string;
    vehicleType: string;
    initialPrice: string;
    settledPrice: string;
    price: string; // Keep for compatibility if needed, but will prioritize the above
    acceptedDate: string;
    expectedPickupDate: string;
    truckerName: string;
    truckerPhone: string;
    truckerRating: number;
    truckerImage: string;
    vehicleNumber: string;
    status: string;
    rawItem: any;
}

// ==========================================
// COMPONENT
// ==========================================

const ShipperAcceptedLoads: React.FC = () => {
    const navigation = useNavigation<any>();
    const [selectedLoad, setSelectedLoad] = useState<AcceptedLoadData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadsData, setLoadsData] = useState<AcceptedLoadData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const extractCity = (location: string) => {
        if (!location) return 'N/A';
        return location.split(',')[0].trim();
    };

    const mapApiData = (apiData: any[]): AcceptedLoadData[] => {
        return apiData.map(item => {
            const postLoad = item.post_load || {};
            const trucker = item.trucker || {};

            const extractCityState = (location: string) => {
                if (!location) return { city: '—', state: '' };
                const parts = location.split(',').map(s => s.trim());
                return {
                    city: parts[0] || '—',
                    state: parts[parts.length > 2 ? 2 : 1] || ''
                };
            };

            const pickupStr = postLoad.loading_city_state && postLoad.loading_city_state.trim() !== ""
                ? postLoad.loading_city_state
                : (postLoad.origin_location || "");

            const dropStr = postLoad.unloading_city_state && postLoad.unloading_city_state.trim() !== ""
                ? postLoad.unloading_city_state
                : (postLoad.destination_location || "");

            const pickup = extractCityState(pickupStr);
            const drop = extractCityState(dropStr);

            const truckImage = trucker.images
                ? (trucker.images.startsWith('http') ? trucker.images : `${BASE_URL}/public/${trucker.images}`)
                : 'https://randomuser.me/api/portraits/men/32.jpg';

            return {
                id: postLoad.load_id || `#${item.id}`,
                load_id: postLoad.unique_id || '—',
                pickupCity: pickup.city,
                pickupState: pickup.state,
                pickupAddress: postLoad.origin_location || '—',
                dropCity: drop.city,
                dropState: drop.state,
                dropAddress: postLoad.destination_location || '—',
                materialType: postLoad.material?.name || '—',
                quantity: `${postLoad.load_qty || '0'} Tonnes`,
                vehicleType: postLoad.vehicle_length?.length_label || '—',
                initialPrice: postLoad.price ? `₹${parseFloat(postLoad.price).toLocaleString('en-IN')}` : '—',
                settledPrice: postLoad.setteled_price ? `₹${parseFloat(postLoad.setteled_price).toLocaleString('en-IN')}` : '—',
                price: postLoad.setteled_price ? `₹${parseFloat(postLoad.setteled_price).toLocaleString('en-IN')}` : (postLoad.price ? `₹${parseFloat(postLoad.price).toLocaleString('en-IN')}` : 'Negotiable'),
                acceptedDate: postLoad.updated_at ? moment(postLoad.updated_at).fromNow() : 'Recently',
                expectedPickupDate: postLoad.picup_date ? `${moment(postLoad.picup_date).format('DD MMM, YYYY')} ${postLoad.load_time ? moment(postLoad.load_time, 'HH:mm').format('hh:mm A') : ''}` : 'N/A',
                truckerName: trucker.name || 'Assigned Trucker',
                truckerPhone: trucker.mobile || '',
                truckerRating: 4.5,
                truckerImage: truckImage,
                vehicleNumber: item.vehicle_number || 'N/A',
                status: item.load_status || 'accepted',
                rawItem: item,
            };
        });
    };

    const fetchLoads = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await axiosInstance.get(END_POINTS.GET_ACCEPTED_LOADS);
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

    const openDetail = (load: AcceptedLoadData) => {
        setSelectedLoad(load);
        setShowDetailModal(true);
    };

    const handleCall = (phone: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };



    const renderLoadCard = (load: AcceptedLoadData) => (
        <View key={load.id} style={styles.loadCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.loadIdText}>{load.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.statusText, { color: '#22c55e' }]}>Accepted</Text>
                </View>
            </View>

            {/* Route Section */}
            <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                    <View style={styles.routeDotGreen} />
                    <Text style={styles.routeCity} numberOfLines={1}>{load.pickupCity}</Text>
                    {load.pickupState ? <Text style={styles.routeState} numberOfLines={1}>{load.pickupState}</Text> : null}
                </View>
                <View style={styles.routeMiddle}>
                    <View style={styles.routeLine} />
                    <TruckIcon />
                </View>
                <View style={styles.routePoint}>
                    <View style={styles.routeDotRed} />
                    <Text style={styles.routeCity} numberOfLines={1}>{load.dropCity}</Text>
                    {load.dropState ? <Text style={styles.routeState} numberOfLines={1}>{load.dropState}</Text> : null}
                </View>
            </View>

            {/* Info Box - Grey Background (Matching My Loads Design) */}
            <View style={styles.infoBox}>
                <View style={styles.infoBoxItem}>
                    <Text style={styles.infoBoxLabel}>Material</Text>
                    <Text style={styles.infoBoxValue} numberOfLines={1}>{load.materialType}</Text>
                </View>
                <View style={styles.infoBoxDivider} />
                <View style={styles.infoBoxItem}>
                    <Text style={styles.infoBoxLabel}>Truck</Text>
                    <Text style={styles.infoBoxValue} numberOfLines={1}>{load.vehicleType}</Text>
                </View>
                <View style={styles.infoBoxDivider} />
                <View style={styles.infoBoxItem}>
                    <Text style={styles.infoBoxLabel}>Quantity</Text>
                    <Text style={styles.infoBoxValue} numberOfLines={1}>{load.quantity}</Text>
                </View>
            </View>

            {/* Price Transition Section */}
            <View style={styles.priceStoryCard}>
                <View style={styles.priceColumn}>
                    <Text style={styles.priceLabelSmall}>You Posted</Text>
                    <Text style={styles.priceValueStrikethrough}>{load.initialPrice}</Text>
                </View>

                <View style={styles.priceArrowSection}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <Path d="M5 12h14M12 5l7 7-7 7" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </View>

                <View style={styles.priceColumn}>
                    <Text style={styles.priceLabelSmall}>Final Price</Text>
                    <Text style={styles.priceValueFinal}>{load.settledPrice}</Text>
                    <TouchableOpacity
                        style={styles.payNowInlineButton}
                        onPress={() => console.log('Pay Now pressed for load:', load.id)}
                        activeOpacity={0.8}
                    >
                        <ShimmerText
                            text=" Click to Pay Now"
                            textStyle={styles.payNowInlineText}
                            colors={['transparent', '#FFFFFF', 'transparent']}
                            duration={1000}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.managerNoteBox}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#059669" strokeWidth="2" />
                    <Path d="M12 16v-4M12 8h.01" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                </Svg>
                <Text style={styles.managerNoteText}>This final price was settled by our Sales Manager after negotiation.</Text>
            </View>

            {/* Trucker Info */}
            <View style={styles.truckerSection}>
                <Image source={{ uri: load.truckerImage }} style={styles.truckerImage} />
                <View style={styles.truckerInfo}>
                    <Text style={styles.truckerName}>{load.truckerName}</Text>
                    <Text style={styles.vehicleNumber}>{load.vehicleNumber}</Text>
                </View>
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {load.truckerRating}</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.viewDetailButton}
                    onPress={() => openDetail(load)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.viewDetailText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.callSalesButton}
                    onPress={() => handleCall(load.truckerPhone)}
                    activeOpacity={0.8}
                >
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.callSalesButtonText}>Call Trucker</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderDetailModal = () => {
        if (!selectedLoad) return null;
        return (
            <Modal
                visible={showDetailModal}
                animationType="slide"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.modalBackBtn}>
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
                        <Text style={styles.modalTitle}>Load Details</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Load ID & Status */}
                        <View style={styles.detailTopCard}>
                            <View style={styles.detailTopRow}>
                                <Text style={styles.detailLoadId}>{selectedLoad.id}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                                    <Text style={[styles.statusText, { color: '#22c55e' }]}>Accepted</Text>
                                </View>
                            </View>
                            <Text style={styles.detailPostedOn}>Accepted {selectedLoad.acceptedDate}</Text>
                        </View>

                        {/* Route Card */}
                        <View style={styles.detailCard}>
                            <Text style={styles.detailCardTitle}>📍 Route Information</Text>
                            <View style={styles.detailRouteSection}>
                                <View style={styles.detailRouteRow}>
                                    <View style={[styles.detailRouteDot, { backgroundColor: '#22c55e' }]} />
                                    <View style={styles.detailRouteInfo}>
                                        <Text style={styles.detailRouteLabel}>Pickup Location</Text>
                                        <Text style={styles.detailRouteAddress}>{selectedLoad.pickupAddress}</Text>
                                        {selectedLoad.rawItem?.post_load?.exact_origin_location && (
                                            <Text style={styles.detailExactAddress}>📌 {selectedLoad.rawItem.post_load.exact_origin_location}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.detailRouteConnector} />
                                <View style={styles.detailRouteRow}>
                                    <View style={[styles.detailRouteDot, { backgroundColor: '#ef4444' }]} />
                                    <View style={styles.detailRouteInfo}>
                                        <Text style={styles.detailRouteLabel}>Drop Location</Text>
                                        <Text style={styles.detailRouteAddress}>{selectedLoad.dropAddress}</Text>
                                        {selectedLoad.rawItem?.post_load?.exact_destination_location && (
                                            <Text style={styles.detailExactAddress}>📌 {selectedLoad.rawItem.post_load.exact_destination_location}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Load Info Card */}
                        <View style={styles.detailCard}>
                            <Text style={styles.detailCardTitle}>📦 Load Information</Text>
                            <View style={styles.detailInfoGrid}>
                                <View style={styles.detailInfoItem}>
                                    <Text style={styles.detailInfoLabel}>Material Type</Text>
                                    <Text style={styles.detailInfoValue}>{selectedLoad.materialType}</Text>
                                </View>
                                <View style={styles.detailInfoItem}>
                                    <Text style={styles.detailInfoLabel}>Quantity</Text>
                                    <Text style={styles.detailInfoValue}>{selectedLoad.quantity}</Text>
                                </View>
                                <View style={styles.detailInfoItem}>
                                    <Text style={styles.detailInfoLabel}>Vehicle Type</Text>
                                    <Text style={styles.detailInfoValue}>{selectedLoad.vehicleType}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Schedule Card */}
                        <View style={styles.detailCard}>
                            <Text style={styles.detailCardTitle}>📅 Schedule</Text>
                            <View style={styles.detailInfoGrid}>
                                <View style={styles.detailInfoItem}>
                                    <Text style={styles.detailInfoLabel}>Pickup Date</Text>
                                    <Text style={styles.detailInfoValue}>{selectedLoad.expectedPickupDate}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Trucker Info Card */}
                        <View style={styles.detailCard}>
                            <Text style={styles.detailCardTitle}>🚛 Trucker Information</Text>
                            <View style={styles.detailTruckerSection}>
                                <Image source={{ uri: selectedLoad.truckerImage }} style={styles.detailTruckerImage} />
                                <View style={styles.detailTruckerInfo}>
                                    <Text style={styles.detailTruckerName}>{selectedLoad.truckerName}</Text>
                                    <Text style={styles.detailVehicleNumber}>{selectedLoad.vehicleNumber}</Text>
                                    <View style={styles.detailRatingRow}>
                                        <Text style={styles.detailRatingText}>★ {selectedLoad.truckerRating}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.detailActions}>
                                <TouchableOpacity style={[styles.detailCallButton, { flex: 1 }]} onPress={() => handleCall(selectedLoad.truckerPhone)}>
                                    <Text style={styles.detailCallText}>📞 Call Trucker</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Price Card - Updated to match card transition */}
                        <View style={styles.detailCard}>
                            <Text style={styles.detailCardTitle}>💰 Price Negotiation</Text>
                            <View style={styles.priceStoryCard}>
                                <View style={styles.priceColumn}>
                                    <Text style={styles.priceLabelSmall}>You Posted</Text>
                                    <Text style={styles.priceValueStrikethrough}>{selectedLoad.initialPrice}</Text>
                                </View>

                                <View style={styles.priceArrowSection}>
                                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <Path d="M5 12h14M12 5l7 7-7 7" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </Svg>
                                </View>

                                <View style={styles.priceColumn}>
                                    <Text style={styles.priceLabelSmall}>Final Price</Text>
                                    <Text style={styles.priceValueFinal}>{selectedLoad.settledPrice}</Text>
                                    <TouchableOpacity
                                        style={styles.payNowInlineButton}
                                        onPress={() => console.log('Pay Now pressed for load:', selectedLoad.id)}
                                        activeOpacity={0.8}
                                    >
                                        <ShimmerText
                                            text=" Click to Pay Now"
                                            textStyle={styles.payNowInlineText}
                                            colors={['transparent', '#FFFFFF', 'transparent']}
                                            duration={1000}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.managerNoteBox, { marginBottom: 0 }]}>
                                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                                    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#059669" strokeWidth="2" />
                                    <Path d="M12 16v-4M12 8h.01" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                                </Svg>
                                <Text style={styles.managerNoteText}>This final price was settled by our Sales Manager after negotiation.</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Screen Header */}
            <View style={styles.screenHeader}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
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
                <Text style={styles.screenTitle}>Accepted Loads</Text>
                <View style={styles.loadCountChip}>
                    <Text style={styles.loadCountText} numberOfLines={1}>{loadsData.length} Loads</Text>
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
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchLoads(true)} colors={['#3b82f6']} />
                    }
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', marginTop: 100 }}>
                            <Text style={{ color: '#6b7280', fontSize: 16 }}>No accepted loads found</Text>
                        </View>
                    }
                    ListFooterComponent={<View style={{ height: 40 }} />}
                />
            )}

            {renderDetailModal()}
        </View>
    );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
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
        backgroundColor: '#dbeafe',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    loadCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3b82f6',
        lineHeight: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    loadCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    loadIdText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3b82f6',
    },
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
    priceStoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 8,
    },
    priceColumn: {
        flex: 1,
        alignItems: 'center',
    },
    priceLabelSmall: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 4,
        fontWeight: '500',
    },
    priceValueStrikethrough: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },
    priceValueFinal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#059669',
    },
    priceArrowSection: {
        paddingHorizontal: 12,
    },
    managerNoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        padding: 8,
        borderRadius: 6,
        marginBottom: 16,
    },
    managerNoteText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
        flex: 1,
    },
    truckerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    truckerImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
    },
    truckerInfo: {
        flex: 1,
        marginLeft: 10,
    },
    truckerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    vehicleNumber: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#f59e0b',
    },
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
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },
    payNowInlineButton: {
        backgroundColor: '#059669',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 4,
        marginTop: 6,
    },
    payNowInlineText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ffffff',
    },
    callSalesButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    callSalesButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
        paddingBottom: 8,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalBackBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    modalScroll: {
        flex: 1,
        padding: 16,
    },
    detailTopCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    detailTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailLoadId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    detailStatusBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    detailStatusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3b82f6',
    },
    detailPostedOn: {
        fontSize: 13,
        color: '#64748b',
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    detailCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
    },
    detailRouteSection: {
        marginBottom: 8,
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
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
    },
    detailRouteAddress: {
        fontSize: 14,
        color: '#0f172a',
        lineHeight: 20,
    },
    detailExactAddress: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontStyle: 'italic',
    },
    detailRouteConnector: {
        width: 2,
        height: 20,
        backgroundColor: '#cbd5e1',
        marginLeft: 5,
        marginVertical: 4,
    },
    detailInfoGrid: {
        gap: 8,
    },
    detailInfoItem: {
        marginBottom: 6,
    },
    detailInfoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
    },
    detailInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    detailTruckerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailTruckerImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e2e8f0',
    },
    detailTruckerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    detailTruckerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    detailVehicleNumber: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 6,
    },
    detailRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f59e0b',
    },
    detailActions: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 10,
    },
    detailCallButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    detailCallText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
});

export default ShipperAcceptedLoads;
