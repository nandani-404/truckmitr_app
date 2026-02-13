import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const DownloadIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Svg>);
const ShareIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" /><Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></Svg>);
const PrintIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><Path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><Rect x="6" y="14" width="12" height="8" /></Svg>);
const CheckCircle = () => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="#22C55E" stroke="#FFF" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Path d="M9 12l2 2 4-4" /></Svg>);

interface Props { onBack?: () => void; invoiceId?: string; }

const InvoiceDetailScreen: React.FC<Props> = ({ onBack, invoiceId = 'INV-2024-0875' }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({ message: `Invoice ${invoiceData.invoiceNo}\nAmount: ₹${invoiceData.charges.totalAmount}\nTrip: ${invoiceData.trip.origin} → ${invoiceData.trip.destination}` });
        } catch (e) { }
    };

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>
    );

    const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
        <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text></View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>Invoice Details</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}><ShareIcon /></TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Invoice Card */}
                <Animated.View style={[styles.invoiceCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.invoiceHeader}>
                        <View>
                            <Text style={styles.invoiceNo}>{invoiceData.invoiceNo}</Text>
                            <Text style={styles.invoiceDate}>{invoiceData.date}</Text>
                        </View>
                        <View style={styles.paidBadge}><CheckCircle /><Text style={styles.paidText}>{invoiceData.status}</Text></View>
                    </View>
                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>₹{invoiceData.charges.totalAmount.toLocaleString()}</Text>
                    </View>
                </Animated.View>

                {/* Trip Details */}
                <Section title="Trip Details">
                    <View style={styles.tripRoute}>
                        <View style={styles.tripPoint}><View style={styles.tripDotOrigin} /><Text style={styles.tripCity}>{invoiceData.trip.origin}</Text></View>
                        <View style={styles.tripLine} />
                        <View style={styles.tripPoint}><View style={styles.tripDotDest} /><Text style={styles.tripCity}>{invoiceData.trip.destination}</Text></View>
                    </View>
                    <Row label="Load ID" value={invoiceData.loadId} />
                    <Row label="Distance" value={invoiceData.trip.distance} />
                    <Row label="Load Type" value={invoiceData.trip.loadType} />
                    <Row label="Weight" value={invoiceData.trip.weight} />
                </Section>

                {/* Shipper */}
                <Section title="Shipper Details">
                    <Row label="Name" value={invoiceData.shipper.name} bold />
                    <Row label="Address" value={invoiceData.shipper.address} />
                    <Row label="GSTIN" value={invoiceData.shipper.gstin} />
                </Section>

                {/* Charges Breakdown */}
                <Section title="Charges Breakdown">
                    <Row label="Basic Freight" value={`₹${invoiceData.charges.basicFreight.toLocaleString()}`} />
                    <Row label="Toll Charges" value={`₹${invoiceData.charges.tollCharges.toLocaleString()}`} />
                    <Row label="Loading Charges" value={`₹${invoiceData.charges.loadingCharges.toLocaleString()}`} />
                    <Row label="Insurance" value={`₹${invoiceData.charges.insuranceCharges.toLocaleString()}`} />
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{invoiceData.charges.totalAmount.toLocaleString()}</Text>
                    </View>
                </Section>

                {/* Payment Info */}
                <Section title="Payment Information">
                    <Row label="Method" value={invoiceData.payment.method} />
                    <Row label="Transaction ID" value={invoiceData.payment.txnId} />
                    <Row label="Paid On" value={invoiceData.paidDate} />
                </Section>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomAction}>
                <TouchableOpacity style={styles.downloadBtn}>
                    <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.downloadBtnGradient}>
                        <DownloadIcon /><Text style={styles.downloadBtnText}>Download Invoice</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    shareBtn: { padding: 8 },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    invoiceCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    invoiceNo: { fontSize: 18, fontWeight: '800', color: '#111827' },
    invoiceDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    paidText: { fontSize: 13, fontWeight: '700', color: '#15803D' },
    amountBox: { alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC', borderRadius: 16 },
    amountLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
    amountValue: { fontSize: 36, fontWeight: '800', color: '#22C55E' },
    section: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    tripRoute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, paddingVertical: 12 },
    tripPoint: { alignItems: 'center' },
    tripDotOrigin: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', marginBottom: 6 },
    tripDotDest: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', marginBottom: 6 },
    tripCity: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    tripLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 16, marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    rowLabel: { fontSize: 14, color: '#6B7280' },
    rowValue: { fontSize: 14, color: '#1F2937', textAlign: 'right', flex: 1, marginLeft: 20 },
    rowValueBold: { fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#22C55E' },
    bottomAction: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    downloadBtn: { borderRadius: 14, overflow: 'hidden' },
    downloadBtnGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
    downloadBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default InvoiceDetailScreen;
