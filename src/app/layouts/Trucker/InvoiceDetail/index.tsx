import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

// Classic Flipkart Color Palette
const C = {
    bg: '#ffffffff',
    surface: '#FFFFFF',
    primary: '#2874F0',
    success: '#26A541',
    text: '#212121',
    textSec: '#878787',
    border: '#E0E0E0',
    line: '#F0F0F0',
};

// Icons
const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2">
        <Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const DownloadIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
        <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Svg>
);

const ShareIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
        <Circle cx="18" cy="5" r="3" />
        <Circle cx="6" cy="12" r="3" />
        <Circle cx="18" cy="19" r="3" />
        <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </Svg>
);

const CheckCircle = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill={C.success} stroke="none">
        <Circle cx="12" cy="12" r="12" />
        <Path d="M17 8l-6 6-3-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
);

interface Props { onBack?: () => void; invoiceId?: string; }

const InvoiceDetailScreen: React.FC<Props> = ({ onBack, invoiceId = 'INV-2024-0875' }) => {
    const invoiceData = {
        invoiceNo: invoiceId,
        loadId: 'LD-2024-0875',
        date: '3 Feb 2024',
        dueDate: '10 Feb 2024',
        status: 'Paid',
        paidDate: '3 Feb 2024',
        shipper: { name: 'Tata Steel Ltd', address: 'Industrial Area, Jamshedpur, Jharkhand - 831001', gstin: '20AABCT1332L1ZW' },
        trucker: { name: 'Rajesh Kumar', vehicleNo: 'MH-12-AB-1234', licenseNo: 'MH01-1234567890' },
        trip: { origin: 'Mumbai', destination: 'Pune', distance: '148 km', loadType: 'Steel Coils', weight: '12 Tons' },
        charges: { basicFreight: 16000, tollCharges: 1200, loadingCharges: 800, insuranceCharges: 500, totalAmount: 18500 },
        payment: { method: 'Bank Transfer', txnId: 'TXN7891234', bankName: 'HDFC Bank' },
    };

    const handleShare = async () => {
        try {
            await Share.share({ 
                message: `Invoice ${invoiceData.invoiceNo}\nAmount: ₹${invoiceData.charges.totalAmount}\nTrip: ${invoiceData.trip.origin} → ${invoiceData.trip.destination}` 
            });
        } catch (e) { }
    };

    const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Invoice Details</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <ShareIcon />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                {/* Invoice Header Card */}
                <View style={styles.card}>
                    <View style={styles.invoiceHeader}>
                        <View>
                            <Text style={styles.invoiceLabel}>Invoice Number</Text>
                            <Text style={styles.invoiceNo}>{invoiceData.invoiceNo}</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <CheckCircle />
                            <Text style={styles.statusText}>{invoiceData.status}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.dateRow}>
                        <View style={styles.dateItem}>
                            <Text style={styles.dateLabel}>Invoice Date</Text>
                            <Text style={styles.dateValue}>{invoiceData.date}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.dateItem}>
                            <Text style={styles.dateLabel}>Paid On</Text>
                            <Text style={styles.dateValue}>{invoiceData.paidDate}</Text>
                        </View>
                    </View>
                </View>

                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>₹{invoiceData.charges.totalAmount.toLocaleString()}</Text>
                </View>

                {/* Trip Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Trip Details</Text>
                    
                    <View style={styles.routeContainer}>
                        <View style={styles.routePoint}>
                            <View style={styles.originDot} />
                            <Text style={styles.cityName}>{invoiceData.trip.origin}</Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routePoint}>
                            <View style={styles.destDot} />
                            <Text style={styles.cityName}>{invoiceData.trip.destination}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />
                    
                    <Row label="Load ID" value={invoiceData.loadId} />
                    <Row label="Distance" value={invoiceData.trip.distance} />
                    <Row label="Load Type" value={invoiceData.trip.loadType} />
                    <Row label="Weight" value={invoiceData.trip.weight} />
                </View>

                {/* Shipper Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Shipper Details</Text>
                    <Row label="Name" value={invoiceData.shipper.name} bold />
                    <Row label="GSTIN" value={invoiceData.shipper.gstin} />
                    <View style={styles.addressRow}>
                        <Text style={styles.addressLabel}>Address</Text>
                        <Text style={styles.addressValue}>{invoiceData.shipper.address}</Text>
                    </View>
                </View>

                {/* Charges Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Charges Breakdown</Text>
                    <Row label="Basic Freight" value={`₹${invoiceData.charges.basicFreight.toLocaleString()}`} />
                    <Row label="Toll Charges" value={`₹${invoiceData.charges.tollCharges.toLocaleString()}`} />
                    <Row label="Loading Charges" value={`₹${invoiceData.charges.loadingCharges.toLocaleString()}`} />
                    <Row label="Insurance" value={`₹${invoiceData.charges.insuranceCharges.toLocaleString()}`} />
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{invoiceData.charges.totalAmount.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Payment Information */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>
                    <Row label="Payment Method" value={invoiceData.payment.method} />
                    <Row label="Transaction ID" value={invoiceData.payment.txnId} />
                    <Row label="Bank Name" value={invoiceData.payment.bankName} />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.downloadButton}>
                    <DownloadIcon />
                    <Text style={styles.downloadButtonText}>Download Invoice</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backButton: { padding: 4 },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: C.text,
    },
    shareButton: { padding: 4 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 12 },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 4,
        marginBottom: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },

    // Invoice Header
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    invoiceLabel: {
        fontSize: 11,
        color: C.textSec,
        marginBottom: 4,
    },
    invoiceNo: {
        fontSize: 16,
        fontWeight: '600',
        color: C.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        gap: 5,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.success,
    },

    divider: { height: 1, backgroundColor: C.line, marginVertical: 12 },
    verticalDivider: { width: 1, backgroundColor: C.line, height: '100%' },

    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateItem: { flex: 1, alignItems: 'center' },
    dateLabel: { fontSize: 11, color: C.textSec, marginBottom: 4 },
    dateValue: { fontSize: 13, fontWeight: '500', color: C.text },

    // Amount Card
    amountCard: {
        backgroundColor: C.primary,
        borderRadius: 4,
        padding: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 6,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
    },

    // Section
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
        marginBottom: 14,
    },

    // Route
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    routePoint: {
        alignItems: 'center',
        gap: 6,
    },
    originDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: C.success,
        borderWidth: 2,
        borderColor: '#E8F5E9',
    },
    destDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FEE2E2',
    },
    cityName: {
        fontSize: 13,
        fontWeight: '600',
        color: C.text,
    },
    routeLine: {
        flex: 1,
        height: 2,
        backgroundColor: C.line,
        marginHorizontal: 12,
    },

    // Row
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    rowLabel: { fontSize: 13, color: C.textSec },
    rowValue: { fontSize: 13, color: C.text, textAlign: 'right', flex: 1, marginLeft: 20 },
    rowValueBold: { fontWeight: '600' },

    // Address
    addressRow: {
        paddingTop: 8,
    },
    addressLabel: {
        fontSize: 13,
        color: C.textSec,
        marginBottom: 4,
    },
    addressValue: {
        fontSize: 13,
        color: C.text,
        lineHeight: 18,
    },

    // Total
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 4,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: C.success,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.surface,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    downloadButton: {
        backgroundColor: C.primary,
        borderRadius: 4,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    downloadButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default InvoiceDetailScreen;
