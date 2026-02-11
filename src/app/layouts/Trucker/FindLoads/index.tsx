import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    StatusBar, Animated, Modal, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';
import { useFocusEffect } from '@react-navigation/native';

// ═══════════════════════════════════════════════════
// Design Tokens — classic white, single blue accent
// ═══════════════════════════════════════════════════
const C = {
    bg: '#F8F9FA',
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
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    white: '#FFFFFF',
};

// ═══════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════
const SearchIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round">
        <Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" />
    </Svg>
);
const FilterIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round">
        <Line x1="4" y1="6" x2="20" y2="6" /><Line x1="6" y1="12" x2="18" y2="12" /><Line x1="9" y1="18" x2="15" y2="18" />
    </Svg>
);
const CloseIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
);
const TruckSmall = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" />
        <Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
);
const ChevronRight = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M9 18l6-6-6-6" />
    </Svg>
);
const ArrowRightIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
);
const CheckIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round">
        <Polyline points="20 6 9 17 4 12" />
    </Svg>
);

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════
const safeString = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return val.length_label || val.name || val.label || '';
    return String(val);
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

// ═══════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════
interface Props {
    onBack?: () => void;
    onLoadSelect?: (loadId: string, loadData?: any) => void;
}

const FindLoadsScreen: React.FC<Props> = ({ onBack, onLoadSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loads, setLoads] = useState<any[]>([]);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'nearby', label: 'Nearby' },
        { key: 'high_pay', label: 'High Pay' },
        { key: 'same_day', label: 'Same Day' },
        { key: 'long_haul', label: 'Long Haul' },
    ];

    const fetchLoads = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS.TRUCKER_AVAILABLE_LOADS);
            if (response?.data?.status === 'success') {
                setLoads(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching available loads:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchLoads();
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLoads();
    }, []);

    const activeFilterCount = selectedStates.length + selectedMaterials.length + selectedVehicles.length;

    const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const clearFilters = () => {
        setSelectedStates([]); setSelectedMaterials([]); setSelectedVehicles([]);
    };

    // ── Load Card ──
    const LoadCard = ({ load, index }: { load: any; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, {
                toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true,
            }).start();
        }, []);

        const vehicleInfo = safeString(load.vehicle_body) || safeString(load.vehicle_length) || safeString(load.vechicle_body) || safeString(load.vechicle_type);
        const qty = safeString(load.load_qty) || safeString(load.meterial_quantity);
        const material = safeString(load.meterial);

        return (
            <Animated.View style={{
                opacity: cardAnim,
                transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}>
                <TouchableOpacity
                    style={s.card}
                    activeOpacity={0.7}
                    onPress={() => onLoadSelect?.(load.load_id, load)}
                >
                    {/* Top Row: ID + Posted */}
                    <View style={s.cardTop}>
                        <View style={s.cardIdRow}>
                            <Text style={s.cardId} numberOfLines={1}>{load.load_id}</Text>
                        </View>
                        <Text style={s.cardPosted} numberOfLines={1}>{getTimeAgo(load.created_at)}</Text>
                    </View>

                    {/* Route */}
                    <View style={s.routeContainer}>
                        <View style={s.routeLeft}>
                            {/* Origin */}
                            <View style={s.routeRow}>
                                <View style={s.originDot} />
                                <View style={s.routeInfo}>
                                    <Text style={s.routeCity} numberOfLines={1}>{safeString(load.origin_location)}</Text>
                                    {load.exact_origin_location ? (
                                        <Text style={s.routeState} numberOfLines={1}>{safeString(load.exact_origin_location)}</Text>
                                    ) : null}
                                </View>
                            </View>

                            {/* Connector */}
                            <View style={s.connectorWrap}><View style={s.connectorLine} /></View>

                            {/* Destination */}
                            <View style={s.routeRow}>
                                <View style={s.destDot} />
                                <View style={s.routeInfo}>
                                    <Text style={s.routeCity} numberOfLines={1}>{safeString(load.destination_location)}</Text>
                                    {load.exact_destination_location ? (
                                        <Text style={s.routeState} numberOfLines={1}>{safeString(load.exact_destination_location)}</Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        {/* View Arrow */}
                        <View style={s.cardArrowWrap}>
                            <ChevronRight />
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={s.cardDivider} />

                    {/* Bottom Meta */}
                    <View style={s.cardBottom}>
                        <View style={s.metaTags}>
                            {material ? (
                                <View style={s.metaTag}>
                                    <Text style={s.metaTagText} numberOfLines={1}>{material}</Text>
                                </View>
                            ) : null}
                            {qty ? (
                                <View style={s.metaTag}>
                                    <Text style={s.metaTagText} numberOfLines={1}>{qty} Ton</Text>
                                </View>
                            ) : null}
                            {vehicleInfo ? (
                                <View style={s.metaTag}>
                                    <TruckSmall />
                                    <Text style={s.metaTagText} numberOfLines={1}>{vehicleInfo}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // ── Filter Chip ──
    const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
        <TouchableOpacity style={[s.filterChipModal, selected && s.filterChipModalActive]} onPress={onPress}>
            {selected && <CheckIcon />}
            <Text style={[s.filterChipModalText, selected && s.filterChipModalTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Search Bar ── */}
            <Animated.View style={[s.searchSection, { opacity: fadeAnim }]}>
                <View style={s.searchRow}>
                    <View style={s.searchBox}>
                        <SearchIcon />
                        <TextInput
                            style={s.searchInput}
                            placeholder="Search city, material, route..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={C.textMuted}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <CloseIcon />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={s.filterButton} onPress={() => setShowFilterModal(true)}>
                        <FilterIcon />
                        {activeFilterCount > 0 && (
                            <View style={s.filterBadge}>
                                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* ── Quick Filters ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickFilters} contentContainerStyle={s.quickFiltersContent}>
                {filters.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[s.quickChip, activeFilter === f.key && s.quickChipActive]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <Text style={[s.quickChipText, activeFilter === f.key && s.quickChipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ── Results Header ── */}
            <View style={s.resultsHeader}>
                <Text style={s.resultsCount}><Text style={s.resultsCountBold}>{loads.length}</Text> loads available</Text>
                <TouchableOpacity style={s.sortBtn}>
                    <Text style={s.sortText}>Nearest first</Text>
                    <ArrowRightIcon />
                </TouchableOpacity>
            </View>

            {/* ── Load Cards ── */}
            <ScrollView
                style={s.listArea}
                contentContainerStyle={s.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
            >
                {loading ? (
                    <View style={{ paddingTop: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={C.accent} />
                        <Text style={{ marginTop: 12, color: C.textMuted, fontSize: 13 }}>Loading available loads...</Text>
                    </View>
                ) : loads.length === 0 ? (
                    <View style={{ paddingTop: 60, alignItems: 'center' }}>
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 4 }}>No loads available</Text>
                        <Text style={{ fontSize: 13, color: C.textMuted }}>Pull down to refresh</Text>
                    </View>
                ) : (
                    loads.map((load, i) => <LoadCard key={load.id || i} load={load} index={i} />)
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ════════ Filter Modal ════════ */}
            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Filters</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <CloseIcon />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={s.modalSectionTitle}>Origin State</Text>
                            <View style={s.modalChipsWrap}>
                                {['Maharashtra', 'Gujarat', 'Rajasthan', 'Karnataka', 'Delhi', 'Tamil Nadu'].map(st => (
                                    <FilterChip key={st} label={st} selected={selectedStates.includes(st)} onPress={() => toggleItem(selectedStates, setSelectedStates, st)} />
                                ))}
                            </View>
                            <Text style={s.modalSectionTitle}>Material Type</Text>
                            <View style={s.modalChipsWrap}>
                                {['Electronics', 'Steel', 'FMCG', 'Auto Parts', 'Textiles', 'Chemicals', 'Cement'].map(mt => (
                                    <FilterChip key={mt} label={mt} selected={selectedMaterials.includes(mt)} onPress={() => toggleItem(selectedMaterials, setSelectedMaterials, mt)} />
                                ))}
                            </View>
                            <Text style={s.modalSectionTitle}>Vehicle Type</Text>
                            <View style={s.modalChipsWrap}>
                                {['20ft Container', '32ft Trailer', '40ft Container', 'Open Body', 'Flatbed'].map(vt => (
                                    <FilterChip key={vt} label={vt} selected={selectedVehicles.includes(vt)} onPress={() => toggleItem(selectedVehicles, setSelectedVehicles, vt)} />
                                ))}
                            </View>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                        <View style={s.modalFooter}>
                            <TouchableOpacity style={s.clearBtn} onPress={clearFilters}><Text style={s.clearBtnText}>Clear All</Text></TouchableOpacity>
                            <TouchableOpacity style={s.applyBtn} onPress={() => setShowFilterModal(false)}>
                                <Text style={s.applyBtnText}>Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ═══════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    searchSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 8 },
    searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
    filterButton: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    filterBadge: { position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
    filterBadgeText: { color: C.white, fontSize: 9, fontWeight: '700' },
    quickFilters: { maxHeight: 52, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
    quickFiltersContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    quickChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    quickChipActive: { backgroundColor: C.accent, borderColor: C.accent },
    quickChipText: { fontSize: 13, fontWeight: '500', color: C.textSec },
    quickChipTextActive: { color: C.white },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    resultsCount: { fontSize: 13, color: C.textSec },
    resultsCountBold: { fontWeight: '700', color: C.text },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sortText: { fontSize: 12, color: C.textMuted },
    listArea: { flex: 1 },
    listContent: { paddingHorizontal: 16 },
    card: {
        backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: 'hidden',
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardIdRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    cardId: { fontSize: 13, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },
    cardPosted: { fontSize: 11, color: C.textMuted, flexShrink: 0 },
    routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    routeLeft: { flex: 1, overflow: 'hidden' },
    routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, marginTop: 4, flexShrink: 0 },
    destDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger, marginTop: 4, flexShrink: 0 },
    routeInfo: { flex: 1, flexDirection: 'column', gap: 2 },
    routeCity: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 20 },
    routeState: { fontSize: 11, color: C.textMuted, fontWeight: '400', lineHeight: 15 },
    connectorWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: 4, paddingVertical: 4, gap: 8 },
    connectorLine: { width: 2, height: 16, backgroundColor: C.border, borderRadius: 1 },
    cardArrowWrap: { alignItems: 'center', justifyContent: 'center', paddingLeft: 12, flexShrink: 0 },
    cardDivider: { height: 1, backgroundColor: C.borderLight, marginBottom: 12 },
    cardBottom: { flexDirection: 'row', alignItems: 'center' },
    metaTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
    metaTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, gap: 4, maxWidth: '48%' },
    metaTagText: { fontSize: 11, color: C.textSec, fontWeight: '500', flexShrink: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { height: '80%', backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    modalBody: { flex: 1 },
    modalSectionTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 16, marginBottom: 12 },
    modalChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChipModal: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
    filterChipModalActive: { backgroundColor: C.accentLight, borderColor: C.accent },
    filterChipModalText: { fontSize: 13, color: C.textSec },
    filterChipModalTextActive: { color: C.accent, fontWeight: '600' },
    modalFooter: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border, gap: 12 },
    clearBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: C.surfaceAlt },
    clearBtnText: { color: C.textSec, fontWeight: '600' },
    applyBtn: { flex: 2, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: C.accent },
    applyBtnText: { color: C.white, fontWeight: '700' },
});

export default FindLoadsScreen;
