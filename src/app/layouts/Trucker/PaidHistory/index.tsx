import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const CheckCircle = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Path d="M22 4L12 14.01l-3-3" /></Svg>);
const DownloadIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Svg>);
const CalendarIcon = () => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><Rect x="3" y="4" width="18" height="18" rx="2" /><Path d="M16 2v4M8 2v4M3 10h18" /></Svg>);

interface Props { onBack?: () => void; onInvoicePress?: (id: string) => void; }

interface PaidTransaction { id: string; loadId: string; route: string; amount: number; paidDate: string; method: string; txnId: string; }

const PaidHistoryScreen: React.FC<Props> = ({ onBack, onInvoicePress }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('Feb 2024');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const months = ['Feb 2024', 'Jan 2024', 'Dec 2023', 'Nov 2023'];

    const paidTransactions: PaidTransaction[] = [
        { id: '1', loadId: 'LD-2024-0875', route: 'Mumbai → Pune', amount: 18500, paidDate: '3 Feb', method: 'Bank Transfer', txnId: 'TXN7891234' },
        { id: '2', loadId: 'LD-2024-0870', route: 'Delhi → Agra', amount: 12000, paidDate: '1 Feb', method: 'UPI', txnId: 'TXN7891230' },
        { id: '3', loadId: 'LD-2024-0862', route: 'Bangalore → Chennai', amount: 35000, paidDate: '28 Jan', method: 'Bank Transfer', txnId: 'TXN7891220' },
        { id: '4', loadId: 'LD-2024-0855', route: 'Hyderabad → Vizag', amount: 22500, paidDate: '25 Jan', method: 'UPI', txnId: 'TXN7891210' },
        { id: '5', loadId: 'LD-2024-0848', route: 'Ahmedabad → Surat', amount: 9800, paidDate: '22 Jan', method: 'Bank Transfer', txnId: 'TXN7891200' },
    ];

    const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const TransactionCard = ({ transaction, index }: { transaction: PaidTransaction; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
        }, []);

        return (
            <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <TouchableOpacity style={styles.txnCard} onPress={() => onInvoicePress?.(transaction.id)} activeOpacity={0.9}>
                    <View style={styles.txnLeft}>
                        <View style={styles.txnIconBox}><CheckCircle /></View>
                    </View>
                    <View style={styles.txnCenter}>
                        <Text style={styles.txnRoute}>{transaction.route}</Text>
                        <Text style={styles.txnLoadId}>{transaction.loadId}</Text>
                        <View style={styles.txnMeta}>
                            <CalendarIcon /><Text style={styles.txnDate}>{transaction.paidDate}</Text>
                            <View style={styles.txnDot} />
                            <Text style={styles.txnMethod}>{transaction.method}</Text>
                        </View>
                    </View>
                    <View style={styles.txnRight}>
                        <Text style={styles.txnAmount}>₹{transaction.amount.toLocaleString()}</Text>
                        <TouchableOpacity style={styles.downloadBtn}><DownloadIcon /></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>Payment History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary Card */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.summaryCard}>
                    <View style={styles.summaryDecor} />
                    <Text style={styles.summaryLabel}>Total Received ({selectedMonth})</Text>
                    <Text style={styles.summaryAmount}>₹{totalPaid.toLocaleString()}</Text>
                    <Text style={styles.summarySubtext}>{paidTransactions.length} completed payments</Text>
                </LinearGradient>
            </Animated.View>

            {/* Month Filter */}
            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {months.map((month) => (
                        <TouchableOpacity key={month}
                            style={[styles.filterChip, selectedMonth === month && styles.filterChipActive]}
                            onPress={() => setSelectedMonth(month)}>
                            <Text style={[styles.filterChipText, selectedMonth === month && styles.filterChipTextActive]}>{month}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#22C55E']} />}>

                <Text style={styles.sectionTitle}>Transactions</Text>
                {paidTransactions.map((txn, index) => <TransactionCard key={txn.id} transaction={txn} index={index} />)}
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    summaryCard: { marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 16, overflow: 'hidden' },
    summaryDecor: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' },
    summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
    summaryAmount: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    summarySubtext: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    filterRow: { marginBottom: 16 },
    filterContent: { paddingHorizontal: 20, gap: 10 },
    filterChip: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    filterChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    filterChipTextActive: { color: '#FFF' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 0 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 16 },
    txnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    txnLeft: { marginRight: 14 },
    txnIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
    txnCenter: { flex: 1 },
    txnRoute: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
    txnLoadId: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
    txnMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    txnDate: { fontSize: 11, color: '#6B7280' },
    txnDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB' },
    txnMethod: { fontSize: 11, color: '#6B7280' },
    txnRight: { alignItems: 'flex-end' },
    txnAmount: { fontSize: 16, fontWeight: '800', color: '#22C55E', marginBottom: 8 },
    downloadBtn: { padding: 6 },
});

export default PaidHistoryScreen;
