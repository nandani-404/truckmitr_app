import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';

// ─────────────────────────────────────────────
// Design Tokens (matching app-wide tokens)
// ─────────────────────────────────────────────
const C = {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F9FAFB',
    border: '#E5E7EB',
    text: '#1C1C1E',
    textSec: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#2C5282',
    accentLight: '#EBF0F7',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Icons (minimal line-art, 1.5px stroke)
// ─────────────────────────────────────────────
const ArrowLeftIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" /><Polyline points="12 19 5 12 12 5" />
    </Svg>
);

const TruckIconLarge = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Props {
    route: any;
    navigation: any;
    onBack: () => void;
}

// ─────────────────────────────────────────────
// Reusable Components
// ─────────────────────────────────────────────

/** Detail row – label on top (muted, uppercase), value below (dark, semi-bold) */
const InfoItem = ({ label, value, half = false }: { label: string; value: string | number | null; half?: boolean }) => (
    <View style={[s.infoItem, half && { width: '50%' }]}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value ? String(value) : '—'}</Text>
    </View>
);

/** Horizontal key-value row – label left, value right */
const DetailRow = ({ label, value, last = false }: { label: string; value: string | number | null; last?: boolean }) => (
    <View style={[s.detailRow, !last && s.detailRowBorder]}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue}>{value ? String(value) : '—'}</Text>
    </View>
);

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────
const VehicleDetailsScreen: React.FC<Props> = ({ route, navigation, onBack }) => {
    const { vehicle } = route.params || {};

    if (!vehicle) {
        return (
            <SafeAreaView style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity onPress={onBack} style={s.backBtn}><ArrowLeftIcon /></TouchableOpacity>
                    <Text style={s.headerTitle}>Vehicle Details</Text>
                    <View style={{ width: 38 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: C.textMuted }}>No vehicle data found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isActive = vehicle.rc_status === 'ACTIVE';

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
                    <ArrowLeftIcon />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Vehicle Details</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView
                style={s.scrollView}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Vehicle Overview Card ── */}
                <View style={s.card}>
                    <View style={s.overviewTop}>
                        <View style={s.truckIconBox}>
                            <TruckIconLarge />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.regNumber}>{vehicle.registration_number}</Text>
                            <Text style={s.modelText} numberOfLines={2}>
                                {vehicle.manufacturer} {vehicle.model}
                            </Text>
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: isActive ? C.successLight : C.warningLight }]}>
                            <Text style={[s.statusText, { color: isActive ? C.success : C.warning }]}>
                                {isActive ? '✓ Active' : '⚠ Inactive'}
                            </Text>
                        </View>
                    </View>
                    <View style={s.overviewGrid}>
                        <InfoItem label="BODY TYPE" value={vehicle.body_type} half />
                        <InfoItem label="FUEL" value={vehicle.fuel_type} half />
                        <InfoItem label="COLOR" value={vehicle.color} half />
                        <InfoItem label="CLASS" value={vehicle.vehicle_class} half />
                    </View>
                </View>

                {/* ── Owner Details ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Owner Details</Text>
                    <View style={s.card}>
                        <DetailRow label="Owner Name" value={vehicle.owner_name} />
                        <DetailRow label="Father / Care Of" value={vehicle.father_name} />
                        <DetailRow label="Address" value={vehicle.permanent_address} />
                        <DetailRow label="Hypothecation" value={vehicle.hypothecation} last />
                    </View>
                </View>

                {/* ── Registration ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Registration</Text>
                    <View style={s.card}>
                        <DetailRow label="Registration Date" value={vehicle.registration_date} />
                        <DetailRow label="RTO" value={vehicle.rto_name} />
                        <DetailRow label="RC Status" value={vehicle.rc_status} />
                        <DetailRow label="Registration Valid Upto" value={vehicle.registration_valid_upto} last />
                    </View>
                </View>

                {/* ── Specifications ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Specifications</Text>
                    <View style={s.card}>
                        <DetailRow label="Chassis Number" value={vehicle.chassis_number} />
                        <DetailRow label="Engine Number" value={vehicle.engine_number} />
                        <DetailRow label="Cubic Capacity" value={vehicle.cubic_capacity} />
                        <DetailRow label="Gross Vehicle Weight" value={vehicle.gross_vehicle_weight ? `${vehicle.gross_vehicle_weight} kg` : null} />
                        <DetailRow label="Unladen Weight" value={vehicle.unladen_weight ? `${vehicle.unladen_weight} kg` : null} />
                        <DetailRow label="Seating Capacity" value={vehicle.seating_capacity} last />
                    </View>
                </View>

                {/* ── Validity & Insurance ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Validity & Insurance</Text>
                    <View style={s.card}>
                        <DetailRow label="Fitness Valid Upto" value={vehicle.fitness_valid_upto} />
                        <DetailRow label="Pollution Valid Upto" value={vehicle.pollution_valid_upto} />
                        <DetailRow label="Insurance Company" value={vehicle.insurance_company} />
                        <DetailRow label="Policy Number" value={vehicle.insurance_policy_number} />
                        <DetailRow label="Insurance Valid Upto" value={vehicle.insurance_validity} />
                        <DetailRow label="Road Tax Paid Upto" value={vehicle.road_tax_paid_upto} last />
                    </View>
                </View>

                {/* ── Permits ── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Permits</Text>
                    <View style={s.card}>
                        <DetailRow label="National Permit No." value={vehicle.national_permit_number} />
                        <DetailRow label="National Permit Valid" value={vehicle.national_permit_validity} />
                        <DetailRow label="State Permit No." value={vehicle.state_permit_number} />
                        <DetailRow label="State Permit Valid" value={vehicle.state_permit_validity} last />
                    </View>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.bg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '700',
        color: C.text,
        letterSpacing: -0.2,
    },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },

    // Cards
    card: {
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
    },

    // Sections
    section: { marginTop: 16 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: C.text,
        marginBottom: 8,
        letterSpacing: -0.1,
    },

    // Overview Card Top
    overviewTop: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    truckIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: C.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    regNumber: {
        fontSize: 17,
        fontWeight: '700',
        color: C.text,
        marginBottom: 2,
    },
    modelText: {
        fontSize: 12,
        color: C.textSec,
        lineHeight: 16,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Overview Grid (2-column)
    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
    },
    infoItem: {
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 11,
        color: C.textMuted,
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
    },

    // Detail Rows
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 13,
        paddingHorizontal: 16,
    },
    detailRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabel: {
        fontSize: 13,
        color: C.textSec,
        flex: 1,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: C.text,
        flex: 1.2,
        textAlign: 'right',
    },
});

export default VehicleDetailsScreen;
