import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    StatusBar, Animated, Modal, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const C = {
    bg: '#ffffffff',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    text: '#1C1C1E',
    textSec: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#2C5282',
    accentLight: '#EBF0F7',
    success: '#059669',
    successLight: '#ECFDF5',
    danger: '#DC2626',
    white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const BackIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
);
const TruckIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);
const PackageIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </Svg>
);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return 'N/A';
    const num = parseFloat(String(price));
    if (isNaN(num)) return String(price);
    return '₹' + num.toLocaleString('en-IN');
};

const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
};

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Safely convert any value to a displayable string */
const safeString = (val: any): string => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
        return val.length_label || val.name || val.label || 'N/A';
    }
    return String(val) || 'N/A';
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
interface Props {
    onBack?: () => void;
    loadData?: any;
}

const LoadDetailScreen: React.FC<Props> = ({ onBack, loadData }) => {
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const load = loadData || {};

    // Determine if bidding should be disabled
    const loadStatus = (load.status || '').toLowerCase().replace(/[\s_-]+/g, '');
    const isBooked = loadStatus === 'booked';
    const isExpired = load.expiring_at === 'closed' || load.exact_expiring_at === '0';
    const isBidDisabled = isBooked || isExpired;
    const disabledLabel = isBooked ? 'Already Booked' : 'Load Expired';

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    // ── POST api/trucker/apply-load ──
    const handleBid = async () => {
        if (!bidAmount) {
            Alert.alert('Error', 'Please enter your bid amount');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                load_id: load.id,
                shipper_id: load.user_id || load.user?.id,
                trucker_price: parseFloat(bidAmount),
                remarks: remarks.trim() || undefined,
            };
            const response: any = await axiosInstance.post(END_POINTS.TRUCKER_APPLY_LOAD, payload);
            setShowBidModal(false);
            setBidAmount('');
            setRemarks('');
            if (response?.data?.status === 'success') {
                showToast('Your Bid is successfully Submitted our team will be reaches you very soon');
                onBack?.();
            } else {
                showToast(response?.data?.message || 'Your bid has been sent.');
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to submit bid. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Detail Row ──
    const DetailRow = ({ label, value, isLast }: { label: string; value: any; isLast?: boolean }) => (
        <View style={[s.detailRow, !isLast && s.detailRowBorder]}>
            <Text style={s.detailLabel}>{label}</Text>
            <Text style={s.detailValue}>{safeString(value)}</Text>
        </View>
    );

    // ── Empty state ──
    if (!loadData) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                    <Text style={s.headerTitle}>Load Details</Text>
                    <View style={s.headerSpacer} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: C.text }}>Load not found</Text>
                    <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Unable to load details</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <Text style={s.headerTitle}>Load Details</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }}>

                    {/* ── Load ID & Status ── */}
                    <View style={s.card}>
                        <View style={s.idRow}>
                            <View>
                                <Text style={s.idLabel}>Load ID</Text>
                                <Text style={s.idValue}>{load.load_id || 'N/A'}</Text>
                            </View>
                            {/* <View style={s.statusBadge}>
                                <View style={s.statusDot} />
                                <Text style={s.statusText}>
                                    {load.status === '1' ? 'Active' : 'Closed'}
                                </Text>
                            </View> */}
                        </View>
                        {load.unique_id ? (
                            <Text style={s.postedByIdText}>Posted by: {load.unique_id}</Text>
                        ) : null}
                        <Text style={s.postedText}>Posted {getTimeAgo(load.created_at)}</Text>
                    </View>

                    {/* ── Route ── */}
                    <View style={s.card}>
                        <Text style={s.sectionTitle}>Route</Text>
                        <View style={s.routeContainer}>
                            <View style={s.routeTimeline}>
                                <View style={s.originDot} />
                                <View style={s.routeLine} />
                                <View style={s.destDot} />
                            </View>
                            <View style={s.routeTexts}>
                                <View style={s.routePoint}>
                                    <Text style={s.routePointLabel}>Pickup</Text>
                                    <Text style={s.routeCity}>{load.origin_location}</Text>
                                    {load.exact_origin_location ? (
                                        <Text style={s.routeExact}>{load.exact_origin_location}</Text>
                                    ) : null}
                                </View>
                                <View style={[s.routePoint, { marginTop: 20 }]}>
                                    <Text style={s.routePointLabel}>Drop</Text>
                                    <Text style={s.routeCity}>{load.destination_location}</Text>
                                    {load.exact_destination_location ? (
                                        <Text style={s.routeExact}>{load.exact_destination_location}</Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ── Pricing ── */}
                    <View style={[s.card, s.priceCard]}>
                        <Text style={s.sectionTitle}>Pricing</Text>

                        <DetailRow label="Advance Price" value={parseFloat(load.adv_price) > 0 ? formatPrice(load.adv_price) : 'Nil'} />
                        <DetailRow label="Settled Price" value={parseFloat(load.setteled_price) > 0 ? formatPrice(load.setteled_price) : 'Not settled'} />
                        <DetailRow label="Settled By" value={load.setteled_by || 'N/A'} isLast />
                    </View>

                    {/* ── Cargo Details ── */}
                    <View style={s.card}>
                        <View style={s.sectionTitleRow}>
                            <PackageIcon />
                            <Text style={s.sectionTitle}>Cargo Details</Text>
                        </View>
                        <DetailRow label="Material" value={load.meterial} />
                        <DetailRow label="Material Quantity" value={load.meterial_quantity ? `${load.meterial_quantity} Ton` : 'N/A'} />
                        <DetailRow label="Load Quantity" value={load.load_qty ? `${load.load_qty} Ton` : 'N/A'} />
                        <DetailRow label="ODC" value={load.odc || 'No'} isLast />
                    </View>

                    {/* ── Vehicle Requirements ── */}
                    <View style={s.card}>
                        <View style={s.sectionTitleRow}>
                            <TruckIcon />
                            <Text style={s.sectionTitle}>Vehicle Requirements</Text>
                        </View>
                        <DetailRow label="Vehicle Body" value={load.vechicle_body || load.vehicle_body || 'N/A'} />
                        <DetailRow label="Vehicle Type" value={load.vechicle_type || 'N/A'} />
                        <DetailRow label="Container Size" value={load.container_feet} />
                        <DetailRow label="Vehicle Length" value={load.vehicle_length} isLast />
                    </View>

                    {/* ── Schedule ── */}
                    <View style={s.card}>
                        <Text style={s.sectionTitle}>Schedule</Text>
                        <DetailRow label="Pickup Date" value={formatDate(load.picup_date)} />
                        <DetailRow label="Load Time" value={load.load_time || 'Not specified'} isLast />
                    </View>

                    <View style={{ height: 100 }} />
                </Animated.View>
            </ScrollView>

            {/* ── Bottom: Single Place Bid Button ── */}
            <View style={s.bottomBar}>
                <TouchableOpacity
                    style={[s.placeBidBtn, isBidDisabled && s.placeBidBtnDisabled]}
                    onPress={() => { if (!isBidDisabled) setShowBidModal(true); }}
                    activeOpacity={isBidDisabled ? 1 : 0.8}
                >
                    <Text style={[s.placeBidBtnText, isBidDisabled && s.placeBidBtnTextDisabled]}>
                        {isBidDisabled ? disabledLabel : 'Place Bid'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Bid Modal ── */}
            <Modal visible={showBidModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>Place Your Bid</Text>
                        <Text style={s.modalSubtitle}>Enter your price and any remarks for the shipper</Text>

                        <Text style={s.inputLabel}>Your Price (₹)</Text>
                        <View style={s.bidInputBox}>
                            <Text style={s.currency}>₹</Text>
                            <TextInput
                                style={s.bidInput}
                                value={bidAmount}
                                onChangeText={setBidAmount}
                                keyboardType="numeric"
                                placeholder="Enter your bid amount"
                                placeholderTextColor={C.textMuted}
                            />
                        </View>

                        <Text style={s.inputLabel}>Remarks (Optional)</Text>
                        <View style={s.remarksInputBox}>
                            <TextInput
                                style={s.remarksInput}
                                value={remarks}
                                onChangeText={setRemarks}
                                placeholder="E.g. I can deliver by tomorrow"
                                placeholderTextColor={C.textMuted}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        <Text style={s.bidHint}>💡 Competitive bids have higher chances of acceptance</Text>
                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowBidModal(false)} activeOpacity={0.7}>
                                <Text style={s.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitBidBtn, isSubmitting && { opacity: 0.7 }]}
                                onPress={handleBid}
                                activeOpacity={0.8}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={C.white} />
                                ) : (
                                    <Text style={s.submitBidText}>Submit Bid</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: C.surfaceAlt,
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
    headerSpacer: { width: 36 },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },

    // Card
    card: {
        backgroundColor: C.surface, borderRadius: 12,
        borderWidth: 1, borderColor: C.border,
        padding: 16, marginBottom: 32, overflow: 'hidden',
    },

    // ID & Status
    idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    idLabel: { fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
    idValue: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 5,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
    statusText: { fontSize: 12, fontWeight: '600', color: C.success },
    postedText: { fontSize: 11, color: C.textMuted, marginTop: 4 },
    postedByIdText: { fontSize: 11, color: C.textSec, marginTop: 8 },

    // Section
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: -0.1 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

    // Route
    routeContainer: { flexDirection: 'row' },
    routeTimeline: { alignItems: 'center', marginRight: 14, paddingTop: 3 },
    originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
    routeLine: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 4 },
    destDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger },
    routeTexts: { flex: 1 },
    routePoint: {},
    routePointLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
    routeCity: { fontSize: 15, fontWeight: '600', color: C.text },
    routeExact: { fontSize: 12, color: C.textSec, marginTop: 1 },

    // Price
    priceCard: { borderColor: C.accentLight, borderWidth: 1.5 },

    // Detail Rows
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12 },
    detailRowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderLight },
    detailLabel: { fontSize: 13, color: C.textSec, flex: 1 },
    detailValue: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1.2, textAlign: 'right' },

    // Bottom Bar
    bottomBar: {
        padding: 16, paddingBottom: 28,
        backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    },
    placeBidBtn: {
        paddingVertical: 16, backgroundColor: C.accent, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    placeBidBtnText: { fontSize: 16, fontWeight: '700', color: C.white },
    placeBidBtnDisabled: {
        backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    },
    placeBidBtnTextDisabled: { color: C.textMuted },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, paddingBottom: 36,
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 4 },
    modalSubtitle: { fontSize: 13, color: C.textSec, textAlign: 'center', marginBottom: 20 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6 },
    bidInputBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border,
        paddingHorizontal: 14, height: 52, marginBottom: 16,
    },
    currency: { fontSize: 20, fontWeight: '700', color: C.text, marginRight: 8 },
    bidInput: { flex: 1, fontSize: 18, fontWeight: '600', color: C.text },
    remarksInputBox: {
        backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border,
        paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, minHeight: 80,
    },
    remarksInput: { fontSize: 14, color: C.text, lineHeight: 20 },
    bidHint: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, backgroundColor: C.surfaceAlt, borderRadius: 10,
        borderWidth: 1, borderColor: C.border, alignItems: 'center',
    },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.textSec },
    submitBidBtn: {
        flex: 2, paddingVertical: 14, backgroundColor: C.accent, borderRadius: 10, alignItems: 'center',
        justifyContent: 'center',
    },
    submitBidText: { fontSize: 14, fontWeight: '700', color: C.white },
});

export default LoadDetailScreen;
