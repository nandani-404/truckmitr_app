import React, { useState, useEffect } from 'react';
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
    Linking,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config';
import { STACKS } from '@truckmitr/stacks/stacks';

const { height } = Dimensions.get('window');

// ── Components ───────────────────────────────────────────────────────────────

// ==========================================
// COMPONENT
// ==========================================

const ShipperInTransit: React.FC = () => {
    const navigation = useNavigation<any>();
    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loads, setLoads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLoads = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await axiosInstance.post(END_POINTS.GET_LOAD_BY_STATUS, {
                status: 'in-transit'
            });
            if (response?.data?.success) {
                setLoads(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching transit loads:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLoads();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLoads(false);
    };

    const openDetail = (load: any) => {
        setSelectedLoad(load);
        setShowDetailModal(true);
    };

    const callDriver = (phone: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'at_pickup':
                return '#3b82f6';
            case 'loading':
                return '#f59e0b';
            case 'en_route':
                return '#10b981';
            case 'unloading':
                return '#8b5cf6';
            default:
                return '#64748b';
        }
    };

    const renderLoadCard = (load: any) => (
        <TouchableOpacity
            key={load.id}
            style={styles.loadCard}
            onPress={() => setSelectedLoad(load)}
            activeOpacity={0.7}
        >
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.loadIdText}>{load.load_id || 'N/A'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor('en_route')}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor('en_route') }]} />
                    <Text style={[styles.statusText, { color: getStatusColor('en_route') }]}>
                        In Transit
                    </Text>
                </View>
            </View>

            {/* Route */}
            <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                    <View style={styles.routeDotGreen} />
                    <Text style={styles.routeCity} numberOfLines={1}>{load.loading_city_state || 'N/A'}</Text>
                </View>
                <View style={styles.routeMiddle}>
                    <View style={styles.routeLine} />
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                        <Path d="M1 3h15v13H1z" />
                        <Path d="M16 8h4l3 3v5h-7V8z" />
                        <Circle cx="5.5" cy="18.5" r="2.5" />
                        <Circle cx="18.5" cy="18.5" r="2.5" />
                    </Svg>
                </View>
                <View style={styles.routePoint}>
                    <View style={styles.routeDotRed} />
                    <Text style={styles.routeCity} numberOfLines={1}>{load.unloading_city_state || 'N/A'}</Text>
                </View>
            </View>

            {/* Agent Info (Support Section) */}
            <View style={styles.driverSection}>
                {load.agent_info?.profile_img ? (
                    <Image source={{ uri: load.agent_info?.profile_img }} style={styles.driverImage} />
                ) : (
                    <View style={[styles.driverImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' }]}>
                        <Ionicons name="headset" size={20} color="#3b82f6" />
                    </View>
                )}
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{load.agent_info?.name || 'Support Agent'}</Text>
                    <Text style={styles.truckNumber}>Contact agent for any assistance</Text>
                </View>
                <TouchableOpacity
                    style={[styles.callButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => callDriver(load.agent_info?.number)}
                >
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </TouchableOpacity>
            </View>

            {/* Price & Payment Summary on Card */}
            <View style={styles.priceSummaryCard}>
                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.priceLabelSmall}>Final Settled Price</Text>
                        <Text style={styles.priceValueFinal}>₹{parseFloat(load.setteled_price || '0').toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.paymentStatusBadge}>
                        <Text style={styles.paymentStatusText}>90% Paid</Text>
                    </View>
                </View>
            </View>

            {/* Track Button */}
            <TouchableOpacity
                style={styles.trackButton}
                onPress={() => navigation.navigate(STACKS.SHIPPER_TRACK_DETAIL, { load })}
            >
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M12 13a3 3 0 100-6 3 3 0 000 6z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.trackButtonText}>Track on Map</Text>
            </TouchableOpacity>

            {/* View Detail Button */}
            <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => openDetail(load)}
                activeOpacity={0.8}
            >
                <Text style={styles.viewDetailText}>View Detail</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

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
                <Text style={styles.screenTitle}>In-Transit Loads</Text>
                <View style={styles.loadCountChip}>
                    <Text style={styles.loadCountText}>{loads.length} Active</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={loads}
                    keyExtractor={(item: any) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }: { item: any }) => renderLoadCard(item)}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
                    }
                    ListFooterComponent={<View style={{ height: 40 }} />}
                    ListEmptyComponent={
                        <View style={{ marginTop: 100, alignItems: 'center' }}>
                            <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 16 }}>No in-transit loads</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            {selectedLoad && (
                <Modal
                    visible={showDetailModal}
                    animationType="slide"
                    onRequestClose={() => setShowDetailModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            {/* Load ID & Status */}
                            <View style={styles.detailTopCard}>
                                <View style={styles.detailTopRow}>
                                    <Text style={styles.detailLoadId}>{selectedLoad.load_id || 'N/A'}</Text>
                                    <View style={[styles.detailStatusBadge, { backgroundColor: `${getStatusColor('en_route')}15` }]}>
                                        <Text style={[styles.detailStatusText, { color: getStatusColor('en_route') }]}>
                                            In Transit
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.detailPostedOn}>Date: {selectedLoad.date || 'N/A'}</Text>
                            </View>

                            {/* Route Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.detailCardTitle}>📍 Route Information</Text>
                                <View style={styles.detailRouteSection}>
                                    <View style={styles.detailRouteRow}>
                                        <View style={[styles.detailRouteDot, { backgroundColor: '#22c55e' }]} />
                                        <View style={styles.detailRouteInfo}>
                                            <Text style={styles.detailRouteLabel}>Pickup Location</Text>
                                            <Text style={styles.detailRouteAddress}>{selectedLoad.origin_location || selectedLoad.loading_city_state || 'N/A'}</Text>
                                            {selectedLoad.exact_origin_location && (
                                                <Text style={styles.detailExactAddress}>📌 {selectedLoad.exact_origin_location}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.detailRouteConnector} />
                                    <View style={styles.detailRouteRow}>
                                        <View style={[styles.detailRouteDot, { backgroundColor: '#ef4444' }]} />
                                        <View style={styles.detailRouteInfo}>
                                            <Text style={styles.detailRouteLabel}>Drop Location</Text>
                                            <Text style={styles.detailRouteAddress}>{selectedLoad.destination_location || selectedLoad.unloading_city_state || 'N/A'}</Text>
                                            {selectedLoad.exact_destination_location && (
                                                <Text style={styles.detailExactAddress}>📌 {selectedLoad.exact_destination_location}</Text>
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
                                        <Text style={styles.detailInfoValue}>{selectedLoad.material?.name || selectedLoad.meterial || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailInfoItem}>
                                        <Text style={styles.detailInfoLabel}>Quantity</Text>
                                        <Text style={styles.detailInfoValue}>{selectedLoad.meterial_quantity || 'N/A'} Tons</Text>
                                    </View>
                                    <View style={styles.detailInfoItem}>
                                        <Text style={styles.detailInfoLabel}>Vehicle Type</Text>
                                        <Text style={styles.detailInfoValue}>{selectedLoad.vehicle_type?.vehicle_name || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Agent Info Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.detailCardTitle}>🤝 Dedicated Support</Text>
                                <View style={styles.detailTruckerSection}>
                                    {selectedLoad.agent_info?.profile_img ? (
                                        <Image source={{ uri: selectedLoad.agent_info?.profile_img }} style={styles.detailTruckerImage} />
                                    ) : (
                                        <View style={[styles.detailTruckerImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' }]}>
                                            <Ionicons name="headset" size={32} color="#3b82f6" />
                                        </View>
                                    )}
                                    <View style={styles.detailTruckerInfo}>
                                        <Text style={styles.detailTruckerName}>{selectedLoad.agent_info?.name || 'Support Agent'}</Text>
                                        <Text style={styles.detailVehicleNumber}>Your dedicated assistant for this load</Text>
                                        <TouchableOpacity
                                            style={styles.detailRatingRow}
                                            onPress={() => callDriver(selectedLoad.agent_info?.number)}
                                        >
                                            <Ionicons name="call" size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                                            <Text style={styles.detailDriverPhone}>{selectedLoad.agent_info?.number || 'Contact Support'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Price Negotiation Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.detailCardTitle}>💰 Price Negotiation</Text>

                                <View style={styles.priceStoryCard}>
                                    <View style={styles.priceColumn}>
                                        <Text style={styles.priceLabelSmall}>You Posted</Text>
                                        <Text style={styles.priceValueStrikethrough}>₹{parseFloat(selectedLoad.price || '0').toLocaleString('en-IN')}</Text>
                                    </View>

                                    <View style={styles.priceArrowSection}>
                                        <Ionicons name="arrow-forward" size={16} color="#64748b" />
                                    </View>

                                    <View style={styles.priceColumn}>
                                        <Text style={styles.priceLabelSmall}>Settled Price</Text>
                                        <Text style={styles.priceValueFinal}>₹{parseFloat(selectedLoad.setteled_price || '0').toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>

                                {/* Payment Breakdown */}
                                <View style={styles.paymentBreakdownCard}>
                                    <View style={styles.paymentRow}>
                                        <View>
                                            <Text style={styles.paymentLabel}>Advance Paid (90%)</Text>
                                            <Text style={styles.paymentValue}>₹{parseFloat(selectedLoad.payment_settlement?.shipper_paid_amount || '0').toLocaleString('en-IN')}</Text>
                                        </View>
                                        <View style={[styles.paymentStatusBadge, { backgroundColor: '#dcfce7' }]}>
                                            <Text style={[styles.paymentStatusText, { color: '#166534' }]}>PAID</Text>
                                        </View>
                                    </View>

                                    <View style={styles.paymentDivider} />

                                    <View style={styles.paymentRow}>
                                        <View>
                                            <Text style={[styles.paymentLabel, { color: '#64748b' }]}>Balance Due (10%)</Text>
                                            <Text style={[styles.paymentValue, { color: '#64748b' }]}>₹{parseFloat(selectedLoad.payment_settlement?.shipper_due_amount || '0').toLocaleString('en-IN')}</Text>
                                        </View>
                                        <Text style={styles.payLaterText}>Due after delivery</Text>
                                    </View>
                                </View>

                                <View style={styles.managerNoteBox}>
                                    <Ionicons name="information-circle" size={14} color="#059669" />
                                    <Text style={styles.managerNoteText}>This final price was settled by our Sales Manager after negotiation.</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            )}
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
        backgroundColor: '#f8fafc',
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
        borderColor: '#e2e8f0',
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 6,
    },
    routePoint: {
        alignItems: 'center',
        flex: 1,
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
        position: 'relative',
    },
    routeLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#e5e7eb',
    },
    progressLine: {
        position: 'absolute',
        left: 0,
        height: 2,
        backgroundColor: '#10b981',
    },
    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    driverImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 10,
    },
    driverName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    truckNumber: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0f172a',
    },
    infoDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 12,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    trackButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },
    viewDetailButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    detailStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },
    detailStatusText: {
        fontSize: 12,
        fontWeight: '600',
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
        color: '#3b82f6',
        fontWeight: '600',
        marginTop: 4,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    detailRouteConnector: {
        width: 2,
        height: 20,
        backgroundColor: '#cbd5e1',
        marginLeft: 5,
        marginVertical: 4,
    },
    detailTruckerSection: {
        flexDirection: 'row',
        alignItems: 'center',
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
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    detailRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    detailRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f59e0b',
    },
    detailPriceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#047857',
    },
    detailDriverPhone: {
        fontSize: 13,
        color: '#3b82f6',
        fontWeight: '600',
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
    priceSummaryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabelSmall: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    priceValueFinal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    priceValueStrikethrough: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },
    paymentStatusBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paymentStatusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#166534',
    },
    priceStoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    priceColumn: {
        flex: 1,
    },
    priceArrowSection: {
        paddingHorizontal: 12,
    },
    paymentBreakdownCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 2,
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    paymentDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 10,
    },
    payLaterText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        fontStyle: 'italic',
    },
    managerNoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        padding: 10,
        borderRadius: 8,
        marginTop: 4,
    },
    managerNoteText: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
        marginLeft: 6,
        flex: 1,
    },
});

export default ShipperInTransit;
