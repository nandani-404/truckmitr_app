import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Design System — "Enterprise / Meta / Google"
// Clean, minimal, whitespace-heavy, borders over shadows
// ─────────────────────────────────────────────
const C = {
    bg: '#FFFFFF',
    text: '#1F1F1F',       // Charcoal Black
    textSec: '#757575',    // Google Gray
    textTer: '#9AA0A6',    // Disabled Gray
    border: '#E0E0E0',     // Light Seperator
    surface: '#F8F9FA',    // Lightest Gray
    accent: '#1976D2',     // Enterprise Blue
    success: '#137333',    // Google Green
    successBg: '#E6F4EA',
    danger: '#C5221F',     // Google Red
    dangerBg: '#FCE8E6',
    warning: '#EA8600',
    warningBg: '#FEF7E0',
    white: '#FFFFFF',
    black: '#000000',
};

// ─────────────────────────────────────────────
// Icons (Minimal Stroke)
// ─────────────────────────────────────────────
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const DownloadIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><Polyline points="7 10 12 15 17 10" /><Line x1="12" y1="15" x2="12" y2="3" /></Svg>);
const FilterIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Svg>);
const ArrowUpRight = () => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="7" y1="17" x2="17" y2="7" /><Polyline points="7 7 17 7 17 17" /></Svg>);
const CheckIcon = () => (<Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12" /></Svg>);
const ClockIcon = () => (<Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
interface Props {
    onBack?: () => void;
    onTransactionPress?: (id: string) => void;
}

const EarningsScreen: React.FC<Props> = ({ onBack, onTransactionPress }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const stats = {
        available: 18450,
        pending: 12000,
        total: 245000,
        growth: 12.5,
    };

    const transactions = [
        { id: '1', title: 'Load #LM-34921', sub: 'Mumbai → Delhi', date: 'Feb 18, 10:30 AM', amount: 15450, status: 'paid', type: 'credit' },
        { id: '2', title: 'Load #LM-34920', sub: 'Pune → Surat', date: 'Feb 17, 02:15 PM', amount: 8000, status: 'pending', type: 'credit' },
        { id: '3', title: 'Withdrawal', sub: 'HDFC Bank **** 4821', date: 'Feb 15, 09:00 AM', amount: 20000, status: 'paid', type: 'debit' },
        { id: '4', title: 'Load #LM-34919', sub: 'Nashik → Indore', date: 'Feb 14, 06:45 PM', amount: 12000, status: 'paid', type: 'credit' },
        { id: '5', title: 'Load #LM-34918', sub: 'Mumbai → Jaipur', date: 'Feb 12, 11:20 AM', amount: 4000, status: 'paid', type: 'credit' },
        { id: '6', title: 'Bonus', sub: 'Monthly Performance', date: 'Feb 10, 10:00 AM', amount: 1500, status: 'paid', type: 'credit' },
    ];

    const filteredTxns = transactions.filter(t => activeTab === 'all' || t.status === activeTab);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    // ── Simple Bar Chart (Mock Data for "Weekly") ──
    const chartData = [45, 70, 30, 85, 50, 90, 60];
    const maxVal = 100;

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity onPress={onBack} style={s.backBtn}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Earnings</Text>
                <TouchableOpacity style={s.downloadBtn}>
                    <DownloadIcon />
                </TouchableOpacity>
            </View>

            <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }}>

                    {/* ── Main Balance Card ── */}
                    <View style={s.balanceCard}>
                        <View style={s.balanceTop}>
                            <Text style={s.balanceLabel}>Total Balance</Text>
                            <View style={s.growthBadge}>
                                <ArrowUpRight />
                                <Text style={s.growthText}>+{stats.growth}%</Text>
                            </View>
                        </View>
                        <Text style={s.balanceValue}>₹{stats.available.toLocaleString('en-IN')}</Text>

                        <View style={s.divider} />

                        <View style={s.balanceRow}>
                            <View style={s.balanceItem}>
                                <Text style={s.statLabel}>Pending</Text>
                                <Text style={s.statValue}>₹{stats.pending.toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={s.vDivider} />
                            <View style={s.balanceItem}>
                                <Text style={s.statLabel}>Total Earned</Text>
                                <Text style={s.statValue}>₹{(stats.total / 1000).toFixed(1)}k</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={s.withdrawBtn} activeOpacity={0.8}>
                            <Text style={s.withdrawText}>Withdraw funds</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Weekly Overview (Chart) ── */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Weekly Overview</Text>
                        <View style={s.chartContainer}>
                            {chartData.map((val, i) => (
                                <View key={i} style={s.barWrapper}>
                                    <View style={[s.bar, { height: `${val}%`, opacity: val === 90 ? 1 : 0.4 }]} />
                                    <Text style={s.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Transactions ── */}
                    <View style={s.section}>
                        <View style={s.txnHeader}>
                            <Text style={s.sectionTitle}>History</Text>
                            <TouchableOpacity style={s.filterBtn}>
                                <FilterIcon />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={s.tabs}>
                            {(['all', 'pending', 'paid'] as const).map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[s.tab, activeTab === tab && s.tabActive]}
                                    onPress={() => setActiveTab(tab)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* List */}
                        <View style={s.list}>
                            {filteredTxns.map((txn, i) => (
                                <TouchableOpacity
                                    key={txn.id}
                                    style={s.txnRow}
                                    onPress={() => onTransactionPress?.(txn.id)}
                                    activeOpacity={0.6}
                                >
                                    <View style={s.txnLeft}>
                                        <View style={[s.txnIcon, { backgroundColor: txn.type === 'debit' ? C.textTer + '20' : C.accent + '15' }]}>
                                            <Text style={{ fontSize: 16 }}>{txn.type === 'debit' ? '🏦' : '🚛'}</Text>
                                        </View>
                                        <View>
                                            <Text style={s.txnTitle}>{txn.title}</Text>
                                            <Text style={s.txnSub}>{txn.sub} • {txn.date}</Text>
                                        </View>
                                    </View>
                                    <View style={s.txnRight}>
                                        <Text style={[s.txnAmount, { color: txn.type === 'debit' ? C.text : C.success }]}>
                                            {txn.type === 'debit' ? '-' : '+'} ₹{txn.amount.toLocaleString('en-IN')}
                                        </Text>
                                        <View style={[s.statusBadge, { backgroundColor: txn.status === 'paid' ? C.successBg : C.warningBg }]}>
                                            {txn.status === 'paid' ? <CheckIcon /> : <ClockIcon />}
                                            <Text style={[s.statusText, { color: txn.status === 'paid' ? C.success : C.warning }]}>
                                                {txn.status === 'paid' ? 'Paid' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    content: { padding: 20, paddingTop: 12 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.surface },
    headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    downloadBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: 20 },

    // Balance Card
    balanceCard: { backgroundColor: C.white, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.border },
    balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    balanceLabel: { fontSize: 13, color: C.textSec, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
    growthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
    growthText: { color: C.success, fontSize: 11, fontWeight: '700' },
    balanceValue: { fontSize: 36, fontWeight: '700', color: C.text, marginBottom: 20, letterSpacing: -1 },
    divider: { height: 1, backgroundColor: C.surface, marginBottom: 16 },
    balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    balanceItem: { flex: 1 },
    vDivider: { width: 1, height: 32, backgroundColor: C.border, marginHorizontal: 20 },
    statLabel: { fontSize: 12, color: C.textSec, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '600', color: C.text },
    withdrawBtn: { backgroundColor: C.text, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    withdrawText: { color: C.white, fontSize: 14, fontWeight: '600' },

    // Chart
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 },
    chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, paddingHorizontal: 10 },
    barWrapper: { alignItems: 'center', gap: 8, flex: 1 },
    bar: { width: 8, backgroundColor: C.accent, borderRadius: 4 },
    barLabel: { fontSize: 11, color: C.textSec, fontWeight: '500' },

    // Transactions
    txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    filterBtn: { padding: 4 },
    tabs: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
    tabActive: { backgroundColor: C.text, borderColor: C.text },
    tabText: { fontSize: 13, color: C.textSec, fontWeight: '500' },
    tabTextActive: { color: C.white },

    list: { gap: 16 },
    txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    txnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    txnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txnTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
    txnSub: { fontSize: 12, color: C.textSec },
    txnRight: { alignItems: 'flex-end', gap: 4 },
    txnAmount: { fontSize: 14, fontWeight: '700' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '600' },
});

export default EarningsScreen;
