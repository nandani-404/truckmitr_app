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
const ClockIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" /></Svg>);
const TruckIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" /></Svg>);
const ChevronRight = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><Path d="M9 18l6-6-6-6" /></Svg>);

interface Props { onBack?: () => void; onPaymentPress?: (id: string) => void; }

interface PendingPayment { id: string; loadId: string; route: string; amount: number; dueDate: string; daysRemaining: number; shipper: string; }

const PendingPaymentsScreen: React.FC<Props> = ({ onBack, onPaymentPress }) => {
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const pendingPayments: PendingPayment[] = [
        { id: '1', loadId: 'LD-2024-0891', route: 'Mumbai → Delhi', amount: 45000, dueDate: '8 Feb', daysRemaining: 3, shipper: 'Reliance Industries' },
        { id: '2', loadId: 'LD-2024-0889', route: 'Pune → Bangalore', amount: 32000, dueDate: '10 Feb', daysRemaining: 5, shipper: 'Tata Steel Ltd' },
        { id: '3', loadId: 'LD-2024-0884', route: 'Chennai → Hyderabad', amount: 28500, dueDate: '12 Feb', daysRemaining: 7, shipper: 'Asian Paints' },
        { id: '4', loadId: 'LD-2024-0879', route: 'Ahmedabad → Jaipur', amount: 21000, dueDate: '15 Feb', daysRemaining: 10, shipper: 'Hindustan Unilever' },
    ];

    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const PaymentCard = ({ payment, index }: { payment: PendingPayment; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
        }, []);

        const urgentStyle = payment.daysRemaining <= 3;

        return (
            <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <TouchableOpacity style={[styles.paymentCard, urgentStyle && styles.paymentCardUrgent]} onPress={() => onPaymentPress?.(payment.id)} activeOpacity={0.9}>
                    <View style={styles.paymentHeader}>
                        <View style={styles.loadIdBadge}><TruckIcon /><Text style={styles.loadIdText}>{payment.loadId}</Text></View>
                        {urgentStyle && <View style={styles.urgentBadge}><Text style={styles.urgentText}>Due Soon</Text></View>}
                    </View>
                    <Text style={styles.routeText}>{payment.route}</Text>
                    <Text style={styles.shipperText}>From: {payment.shipper}</Text>
                    <View style={styles.paymentFooter}>
                        <View>
                            <Text style={styles.amountLabel}>Amount</Text>
                            <Text style={styles.amountValue}>₹{payment.amount.toLocaleString()}</Text>
                        </View>
                        <View style={styles.dueDateBox}>
                            <ClockIcon /><Text style={[styles.dueDateText, urgentStyle && styles.dueDateTextUrgent]}>{payment.dueDate} ({payment.daysRemaining} days)</Text>
                        </View>
                        <ChevronRight />
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
                <Text style={styles.headerTitle}>Pending Payments</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary Card */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.summaryCard}>
                    <View style={styles.summaryDecor} />
                    <Text style={styles.summaryLabel}>Total Pending</Text>
                    <Text style={styles.summaryAmount}>₹{totalPending.toLocaleString()}</Text>
                    <Text style={styles.summarySubtext}>{pendingPayments.length} payments awaited</Text>
                </LinearGradient>
            </Animated.View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}>

                <Text style={styles.sectionTitle}>Awaiting Payment</Text>
                {pendingPayments.map((payment, index) => <PaymentCard key={payment.id} payment={payment} index={index} />)}
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
    summaryCard: { marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 20, overflow: 'hidden' },
    summaryDecor: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' },
    summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
    summaryAmount: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    summarySubtext: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 0 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 16 },
    paymentCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
    paymentCardUrgent: { borderColor: '#FBBF24', backgroundColor: '#FFFBEB' },
    paymentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    loadIdBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    loadIdText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
    urgentBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    urgentText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
    routeText: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    shipperText: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
    paymentFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    amountLabel: { fontSize: 11, color: '#9CA3AF' },
    amountValue: { fontSize: 20, fontWeight: '800', color: '#22C55E' },
    dueDateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dueDateText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    dueDateTextUrgent: { color: '#F59E0B' },
});

export default PendingPaymentsScreen;
