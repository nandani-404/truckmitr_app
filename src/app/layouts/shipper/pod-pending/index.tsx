import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';

// ==========================================
// INTERFACES & DATA
// ==========================================

interface PODPendingLoadData {
    id: string;
    pickupCity: string;
    pickupAddress: string;
    dropCity: string;
    dropAddress: string;
    deliveryDate: string;
    driverName: string;
    driverPhone: string;
    driverImage: string;
    truckNumber: string;
    truckerRating: number;
    materialType: string;
    quantity: string;
    vehicleType: string;
    price: string;
    podImage: string;
    paymentStatus: 'pending' | 'paid';
    podStatus: 'uploaded' | 'pending';
}

const podPendingLoadsData: PODPendingLoadData[] = [
    {
        id: 'LID-883492',
        pickupCity: 'Mumbai',
        pickupAddress: 'Andheri East, Mumbai, Maharashtra 400069',
        dropCity: 'New Delhi',
        dropAddress: 'Connaught Place, New Delhi, Delhi 110001',
        deliveryDate: 'Jan 12, 2024 6:30 PM',
        driverName: 'Rajesh Kumar',
        driverPhone: '+91 98765 43210',
        driverImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        truckNumber: 'MH 12 AB 1234',
        truckerRating: 4.8,
        materialType: 'Electronics & Gadgets',
        quantity: '10 Tonnes',
        vehicleType: 'Closed Body / Container',
        price: '₹45,000',
        podImage: 'https://via.placeholder.com/400x600/e0f2fe/3b82f6?text=POD+Document',
        paymentStatus: 'pending',
        podStatus: 'uploaded',
    },
    {
        id: 'LID-772341',
        pickupCity: 'Bangalore',
        pickupAddress: 'Whitefield, Bangalore, Karnataka 560066',
        dropCity: 'Chennai',
        dropAddress: 'T Nagar, Chennai, Tamil Nadu 600017',
        deliveryDate: 'Jan 10, 2024 3:45 PM',
        driverName: 'Suresh Reddy',
        driverPhone: '+91 98765 12345',
        driverImage: 'https://randomuser.me/api/portraits/men/45.jpg',
        truckNumber: 'KA 05 CD 5678',
        truckerRating: 4.5,
        materialType: 'Textiles & Fabrics',
        quantity: '8 Tonnes',
        vehicleType: 'Open Body',
        price: '₹32,500',
        podImage: 'https://via.placeholder.com/400x600/e0f2fe/3b82f6?text=POD+Document+2',
        paymentStatus: 'pending',
        podStatus: 'pending',
    },
];

// ==========================================
// COMPONENT
// ==========================================

const ShipperPODPending: React.FC = () => {
    const navigation = useNavigation();
    const [selectedLoad, setSelectedLoad] = useState<PODPendingLoadData | null>(null);
    const [rating, setRating] = useState(0);
    const [confirmed, setConfirmed] = useState(false);

    const renderLoadCard = (load: PODPendingLoadData) => (
        <TouchableOpacity
            key={load.id}
            style={styles.loadCard}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.loadIdText}>{load.id}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Payment Pending</Text>
                </View>
            </View>

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

            <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Delivered on</Text>
                <Text style={styles.deliveryDate}>{load.deliveryDate}</Text>
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceValue}>{load.price}</Text>
                <View style={[styles.podBadge, load.podStatus === 'pending' && styles.podBadgePending, load.podStatus === 'uploaded' && styles.podBadgeUploaded]}>
                    {load.podStatus === 'uploaded' ? (
                        <>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                            <Text style={styles.podBadgeUploadedText}>POD Uploaded</Text>
                        </>
                    ) : (
                        <>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <Path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                            <Text style={styles.podBadgePendingText}>POD Pending</Text>
                        </>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => setSelectedLoad(load)}
                activeOpacity={0.8}
            >
                <Text style={styles.viewDetailText}>View Details</Text>
            </TouchableOpacity>

            {load.podStatus === 'uploaded' && (
                <TouchableOpacity
                    style={styles.payNowButton}
                    activeOpacity={0.8}
                >
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <Path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.payNowButtonText}>Pay Now</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    if (selectedLoad) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                <View style={styles.screenHeader}>
                    <TouchableOpacity
                        onPress={() => setSelectedLoad(null)}
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
                    <Text style={styles.screenTitle}>Delivery Confirmation</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Load Summary */}
                    <View style={[styles.summaryCard, { marginTop: 16 }]}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.loadId}>{selectedLoad.id}</Text>
                            <View style={styles.deliveredBadge}>
                                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                                <Text style={styles.deliveredText}>Delivered</Text>
                            </View>
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.summaryRouteText}>{selectedLoad.pickupCity} → {selectedLoad.dropCity}</Text>
                            <Text style={styles.deliveryDateText}>Delivered: {selectedLoad.deliveryDate}</Text>
                        </View>
                    </View>

                    {/* POD Section */}
                    <View style={styles.detailCard}>
                        <Text style={styles.sectionTitle}>Proof of Delivery</Text>

                        {selectedLoad.podStatus === 'uploaded' ? (
                            <>
                                <TouchableOpacity style={styles.podImageContainer}>
                                    <Image source={{ uri: selectedLoad.podImage }} style={styles.podImage} />
                                    <View style={styles.podOverlay}>
                                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </Svg>
                                        <Text style={styles.podOverlayText}>Tap to enlarge</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.downloadButton}
                                    onPress={() => {
                                        // Download POD logic here
                                        console.log('Downloading POD...');
                                    }}
                                >
                                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </Svg>
                                    <Text style={styles.downloadButtonText}>Download POD</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmRow}
                                    onPress={() => setConfirmed(!confirmed)}
                                >
                                    <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                                        {confirmed && (
                                            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                <Path d="M5 13l4 4L19 7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </Svg>
                                        )}
                                    </View>
                                    <Text style={styles.confirmText}>Goods received in good condition</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.podPendingContainer}>
                                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <Path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                                <Text style={styles.podPendingTitle}>POD Not Uploaded Yet</Text>
                                <Text style={styles.podPendingMessage}>
                                    The driver hasn't uploaded the Proof of Delivery document yet. You'll be notified once it's available.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Trucker Info */}
                    <View style={styles.detailCard}>
                        <Text style={styles.sectionTitle}>Trucker Details</Text>
                        <View style={styles.truckerRow}>
                            <Image source={{ uri: selectedLoad.driverImage }} style={styles.truckerImage} />
                            <View style={styles.truckerInfo}>
                                <Text style={styles.truckerName}>{selectedLoad.driverName}</Text>
                                <Text style={styles.truckNumber}>{selectedLoad.truckNumber}</Text>
                            </View>
                        </View>

                        <View style={styles.ratingSection}>
                            <Text style={styles.ratingLabel}>Rate this delivery</Text>
                            <View style={styles.ratingRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setRating(star)}
                                        style={styles.starButton}
                                    >
                                        <Text style={[styles.starText, star <= rating && styles.starActive]}>★</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Payment Section */}
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentHeader}>
                            <Text style={styles.paymentLabel}>Amount to Pay</Text>
                            <Text style={styles.paymentAmount}>{selectedLoad.price}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.payButton, selectedLoad.podStatus === 'pending' && styles.payButtonDisabled]}
                            disabled={selectedLoad.podStatus === 'pending'}
                        >
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <Path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                            <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>

                        {selectedLoad.podStatus === 'pending' && (
                            <Text style={styles.paymentNote}>Payment will be enabled once POD is uploaded</Text>
                        )}
                    </View>

                    <View style={{ height: 30 }} />
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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
                <Text style={styles.screenTitle}>POD Pending</Text>
                <View style={styles.loadCountChip}>
                    <Text style={styles.loadCountText}>2 Loads</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {podPendingLoadsData.map(renderLoadCard)}
            </ScrollView>
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
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
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
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
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
    deliveryInfo: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    deliveryLabel: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 4,
    },
    deliveryDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#047857',
    },
    podBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    podBadgeUploaded: {
        backgroundColor: '#dcfce7',
    },
    podBadgePending: {
        backgroundColor: '#fef3c7',
    },
    podBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3b82f6',
    },
    podBadgeUploadedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#16a34a',
    },
    podBadgePendingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#f59e0b',
    },
    viewDetailButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
    payNowButton: {
        flexDirection: 'row',
        backgroundColor: '#047857',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 6,
    },
    payNowButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    deliveredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    deliveredText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3b82f6',
    },
    routeInfo: {
        gap: 8,
    },
    summaryRouteText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    deliveryDateText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    detailCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 10,
    },
    loadId: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    podImageContainer: {
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 16,
    },
    podImage: {
        width: '100%',
        height: 240,
        backgroundColor: '#f8fafc',
    },
    podOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.95)',
        padding: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    podOverlayText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    podPendingContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    podPendingTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 16,
        marginBottom: 8,
    },
    podPendingMessage: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    downloadButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    confirmRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#f8fafc',
        padding: 14,
        borderRadius: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    confirmText: {
        fontSize: 14,
        color: '#0f172a',
        flex: 1,
        fontWeight: '500',
    },
    truckerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    truckerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    truckerImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e2e8f0',
    },
    truckerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    truckerName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    truckNumber: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    ratingSection: {
        gap: 12,
    },
    ratingLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 4,
    },
    starButton: {
        padding: 4,
    },
    starText: {
        fontSize: 40,
        color: '#e2e8f0',
    },
    starActive: {
        color: '#fbbf24',
    },
    paymentCard: {
        backgroundColor: '#ffffff',
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    paymentHeader: {
        marginBottom: 24,
    },
    paymentLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    paymentAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#047857',
        letterSpacing: -1,
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: '#3b82f6',
        paddingVertical: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 10,
    },
    payButtonDisabled: {
        backgroundColor: '#e2e8f0',
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    markPaidButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    markPaidButtonDisabled: {
        opacity: 0.5,
    },
    markPaidText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    paymentNote: {
        fontSize: 12,
        color: '#f59e0b',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '500',
    },
});

export default ShipperPODPending;
