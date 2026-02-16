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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';

// ==========================================
// INTERFACES & DATA
// ==========================================

interface InTransitLoadData {
    id: string;
    pickupCity: string;
    pickupAddress: string;
    dropCity: string;
    dropAddress: string;
    pickupDate: string;
    expectedDeliveryDate: string;
    currentStatus: 'at_pickup' | 'loading' | 'en_route' | 'unloading';
    statusLabel: string;
    driverName: string;
    driverPhone: string;
    driverImage: string;
    truckNumber: string;
    vehicleNumber: string;
    truckerRating: number;
    eta: string;
    lastUpdated: string;
    progress: number;
    materialType: string;
    quantity: string;
    vehicleType: string;
    price: string;
}

const inTransitLoadsData: InTransitLoadData[] = [
    {
        id: 'LID-883492',
        pickupCity: 'Mumbai',
        pickupAddress: 'Andheri East, Mumbai, Maharashtra 400069',
        dropCity: 'New Delhi',
        dropAddress: 'Connaught Place, New Delhi, Delhi 110001',
        pickupDate: 'Jan 10, 10:00 AM',
        expectedDeliveryDate: 'Jan 12, 6:00 PM',
        currentStatus: 'en_route',
        statusLabel: 'En Route',
        driverName: 'Rajesh Kumar',
        driverPhone: '+91 98765 43210',
        driverImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        truckNumber: 'MH 12 AB 1234',
        vehicleNumber: 'MH 12 AB 1234',
        truckerRating: 4.8,
        eta: '8 hours',
        lastUpdated: '5 mins ago',
        progress: 60,
        materialType: 'Electronics & Gadgets',
        quantity: '10 Tonnes',
        vehicleType: 'Closed Body / Container',
        price: '₹45,000',
    },
    {
        id: 'LID-775231',
        pickupCity: 'Bangalore',
        pickupAddress: 'Whitefield, Bangalore, Karnataka 560066',
        dropCity: 'Chennai',
        dropAddress: 'T Nagar, Chennai, Tamil Nadu 600017',
        pickupDate: 'Jan 11, 6:00 PM',
        expectedDeliveryDate: 'Jan 12, 2:00 AM',
        currentStatus: 'loading',
        statusLabel: 'Loading',
        driverName: 'Suresh Singh',
        driverPhone: '+91 87654 32109',
        driverImage: 'https://randomuser.me/api/portraits/men/45.jpg',
        truckNumber: 'KA 05 XY 5678',
        vehicleNumber: 'KA 05 XY 5678',
        truckerRating: 4.9,
        eta: '6 hours',
        lastUpdated: '2 mins ago',
        progress: 25,
        materialType: 'Furniture & Home Goods',
        quantity: '8 Tonnes',
        vehicleType: 'Open Body',
        price: '₹18,500',
    },
];

// ==========================================
// COMPONENT
// ==========================================

const ShipperInTransit: React.FC = () => {
    const navigation = useNavigation();
    const [selectedLoad, setSelectedLoad] = useState<InTransitLoadData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const openDetail = (load: InTransitLoadData) => {
        setSelectedLoad(load);
        setShowDetailModal(true);
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

    const renderLoadCard = (load: InTransitLoadData) => (
        <TouchableOpacity
            key={load.id}
            style={styles.loadCard}
            onPress={() => setSelectedLoad(load)}
            activeOpacity={0.7}
        >
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.loadIdText}>{load.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(load.currentStatus)}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(load.currentStatus) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(load.currentStatus) }]}>
                        {load.statusLabel}
                    </Text>
                </View>
            </View>

            {/* Route */}
            <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                    <View style={styles.routeDotGreen} />
                    <Text style={styles.routeCity} numberOfLines={1}>{load.pickupCity}</Text>
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
                    <Text style={styles.routeCity} numberOfLines={1}>{load.dropCity}</Text>
                </View>
            </View>

            {/* Driver Info */}
            <View style={styles.driverSection}>
                <Image source={{ uri: load.driverImage }} style={styles.driverImage} />
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{load.driverName}</Text>
                    <Text style={styles.truckNumber}>{load.truckNumber}</Text>
                </View>
                <TouchableOpacity style={styles.callButton}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </TouchableOpacity>
            </View>

            {/* ETA & Last Updated */}
            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>ETA</Text>
                    <Text style={styles.infoValue}>{load.eta}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Last Updated</Text>
                    <Text style={styles.infoValue}>{load.lastUpdated}</Text>
                </View>
            </View>

            {/* Track Button */}
            <TouchableOpacity style={styles.trackButton}>
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
                    <Text style={styles.loadCountText}>2 Active</Text>
                </View>
            </View>

            <FlatList
                data={inTransitLoadsData}
                keyExtractor={(item: InTransitLoadData) => item.id}
                renderItem={({ item }: { item: InTransitLoadData }) => renderLoadCard(item)}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 40 }} />}
            />

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
                                    <Text style={styles.detailLoadId}>{selectedLoad.id}</Text>
                                    <View style={styles.detailStatusBadge}>
                                        <Text style={[styles.detailStatusText, { color: getStatusColor(selectedLoad.currentStatus) }]}>
                                            {selectedLoad.statusLabel}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.detailPostedOn}>Pickup: {selectedLoad.pickupDate}</Text>
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
                                        </View>
                                    </View>
                                    <View style={styles.detailRouteConnector} />
                                    <View style={styles.detailRouteRow}>
                                        <View style={[styles.detailRouteDot, { backgroundColor: '#ef4444' }]} />
                                        <View style={styles.detailRouteInfo}>
                                            <Text style={styles.detailRouteLabel}>Drop Location</Text>
                                            <Text style={styles.detailRouteAddress}>{selectedLoad.dropAddress}</Text>
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

                            {/* Trucker Info Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.detailCardTitle}>🚛 Trucker Information</Text>
                                <View style={styles.detailTruckerSection}>
                                    <Image source={{ uri: selectedLoad.driverImage }} style={styles.detailTruckerImage} />
                                    <View style={styles.detailTruckerInfo}>
                                        <Text style={styles.detailTruckerName}>{selectedLoad.driverName}</Text>
                                        <Text style={styles.detailVehicleNumber}>{selectedLoad.vehicleNumber}</Text>
                                        <View style={styles.detailRatingRow}>
                                            <Text style={styles.detailRatingText}>★ {selectedLoad.truckerRating}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Price Card */}
                            <View style={[styles.detailCard, { marginBottom: 40 }]}>
                                <Text style={styles.detailCardTitle}>💰 Price</Text>
                                <Text style={styles.detailPriceValue}>{selectedLoad.price}</Text>
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
});

export default ShipperInTransit;
