import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { hitSlop } from '@truckmitr/src/app/functions';
import LinearGradient from 'react-native-linear-gradient';

// Mock Data
const TRANSACTIONS = [
    {
        id: '1',
        type: 'CREDIT',
        title: 'Driver Referral Bonus',
        subtitle: 'Rajesh Kumar',
        amount: 10,
        date: '27 Jan 2024, 10:30 AM',
        status: 'Success'
    },
    {
        id: '2',
        type: 'DEBIT',
        title: 'Redemption',
        subtitle: 'Bank Transfer - HDFC ****1234',
        amount: 250,
        date: '25 Jan 2024, 02:00 PM',
        status: 'Completed'
    },
    {
        id: '3',
        type: 'CREDIT',
        title: 'Driver Referral Bonus',
        subtitle: 'Amit Singh',
        amount: 10,
        date: '24 Jan 2024, 11:15 AM',
        status: 'Success'
    },
    {
        id: '4',
        type: 'DEBIT',
        title: 'Redemption',
        subtitle: 'Bank Transfer - HDFC ****1234',
        amount: 100,
        date: '20 Jan 2024, 05:30 PM',
        status: 'Processing'
    }
];

export default function DhabhaWallet() {
    const navigation = useNavigation();
    const safeAreaInsets = useSafeAreaInsets();
    useStatusBarStyle('dark-content');

    // States
    const [balance, setBalance] = useState(240);
    const [totalEarned, setTotalEarned] = useState(320);
    const [totalRedeemed, setTotalRedeemed] = useState(80);
    const [pendingRedemption, setPendingRedemption] = useState(100);

    const [isRedeemModalVisible, setIsRedeemModalVisible] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState('');
    const [redeemStatus, setRedeemStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');

    // Constants
    const MIN_REDEEM_AMOUNT = 100;

    const handleRedeem = () => {
        const amount = parseInt(redeemAmount);
        if (isNaN(amount) || amount < MIN_REDEEM_AMOUNT || amount > balance) return;

        setRedeemStatus('PROCESSING');
        setTimeout(() => {
            setRedeemStatus('SUCCESS');
            setBalance(prev => prev - amount);
            setTotalRedeemed(prev => prev + amount);
            setPendingRedemption(prev => prev + amount); // Mocking it goes to pending
        }, 2000);
    };

    const resetRedeem = () => {
        setIsRedeemModalVisible(false);
        setRedeemStatus('IDLE');
        setRedeemAmount('');
    };

    const renderTransaction = ({ item }: { item: any }) => {
        const isCredit = item.type === 'CREDIT';
        return (
            <View style={styles.txnCard}>
                <View style={[styles.txnIcon, isCredit ? styles.iconCredit : styles.iconDebit]}>
                    <Ionicons
                        name={isCredit ? "arrow-down" : "arrow-up"}
                        size={18}
                        color={isCredit ? "#16A34A" : "#DC2626"}
                    />
                </View>
                <View style={styles.txnContent}>
                    <Text style={styles.txnTitle}>{item.title}</Text>
                    <Text style={styles.txnSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.txnDate}>{item.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmount, isCredit ? styles.amountCredit : styles.amountDebit]}>
                        {isCredit ? '+' : '-'} ₹{item.amount}
                    </Text>
                    <Text style={[styles.txnStatus,
                    item.status === 'Processing' ? { color: '#D97706' } : { color: '#059669' }
                    ]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={hitSlop(10)}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom + 20 }}>
                {/* Main Balance Card */}
                <LinearGradient
                    colors={['#EA580C', '#C2410C']}
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View>
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={styles.balanceValue}>₹{balance}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.redeemBtn}
                        activeOpacity={0.8}
                        onPress={() => setIsRedeemModalVisible(true)}
                    >
                        <Text style={styles.redeemBtnText}>Redeem</Text>
                        <Ionicons name="chevron-forward" size={16} color="#EA580C" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>₹{totalEarned}</Text>
                        <Text style={styles.statLabel}>Total Earned</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>₹{totalRedeemed}</Text>
                        <Text style={styles.statLabel}>Total Redeemed</Text>
                    </View>
                    <View style={[styles.statCard, { borderRightWidth: 0 }]}>
                        <Text style={[styles.statValue, { color: '#D97706' }]}>₹{pendingRedemption}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>

                {/* Transactions Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transactions</Text>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </View>

                {/* Transactions List */}
                <FlatList
                    data={TRANSACTIONS}
                    renderItem={renderTransaction}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                />
            </ScrollView>

            {/* Redeem Modal */}
            <Modal
                visible={isRedeemModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => { if (redeemStatus !== 'PROCESSING') resetRedeem() }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: safeAreaInsets.bottom + 20 }]}>
                        {redeemStatus === 'SUCCESS' ? (
                            <View style={styles.successState}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark" size={32} color="#FFF" />
                                </View>
                                <Text style={styles.successTitle}>Requests Submitted</Text>
                                <Text style={styles.successMsg}>
                                    Your redemption request for ₹{redeemAmount} has been submitted successfully.
                                </Text>
                                <Text style={styles.refId}>Ref ID: TXN123456789</Text>
                                <TouchableOpacity style={styles.doneBtn} onPress={resetRedeem}>
                                    <Text style={styles.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Redeem Funds</Text>
                                    <TouchableOpacity onPress={resetRedeem} disabled={redeemStatus === 'PROCESSING'}>
                                        <Ionicons name="close" size={24} color="#1F2937" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Amount to Redeem (₹)</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="Enter amount"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                    value={redeemAmount}
                                    onChangeText={setRedeemAmount}
                                    editable={redeemStatus !== 'PROCESSING'}
                                />
                                <Text style={styles.helperText}>
                                    Available: <Text style={{ fontWeight: '700' }}>₹{balance}</Text> • Min: ₹{MIN_REDEEM_AMOUNT}
                                </Text>

                                <View style={styles.bankCard}>
                                    <View style={styles.bankIcon}>
                                        <Ionicons name="business" size={20} color="#4B5563" />
                                    </View>
                                    <View>
                                        <Text style={styles.bankName}>HDFC Bank</Text>
                                        <Text style={styles.bankAccount}>**** **** **** 1234</Text>
                                    </View>
                                    <TouchableOpacity>
                                        <Text style={styles.editLink}>Edit</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.confirmBtn,
                                    (!redeemAmount || parseInt(redeemAmount) < MIN_REDEEM_AMOUNT || parseInt(redeemAmount) > balance) && styles.disabledBtn
                                    ]}
                                    onPress={handleRedeem}
                                    disabled={!redeemAmount || parseInt(redeemAmount) < MIN_REDEEM_AMOUNT || parseInt(redeemAmount) > balance || redeemStatus === 'PROCESSING'}
                                >
                                    {redeemStatus === 'PROCESSING' ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Request Redemption</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

    // Balance Card
    balanceCard: {
        margin: 20,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
    balanceValue: { fontSize: 32, color: '#FFF', fontWeight: '800', marginTop: 4 },
    redeemBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    redeemBtnText: { color: '#EA580C', fontWeight: '600', fontSize: 13, marginRight: 2 },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    statCard: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
    statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    // Txn List
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },

    txnCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    iconCredit: { backgroundColor: '#DCFCE7' },
    iconDebit: { backgroundColor: '#FEE2E2' },
    txnContent: { flex: 1 },
    txnTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    txnSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    txnDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    txnAmount: { fontSize: 14, fontWeight: '700' },
    amountCredit: { color: '#16A34A' },
    amountDebit: { color: '#DC2626' },
    txnStatus: { fontSize: 11, fontWeight: '500', marginTop: 2, textAlign: 'right' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

    inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
    amountInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 14,
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        backgroundColor: '#F9FAFB'
    },
    helperText: { fontSize: 12, color: '#6B7280', marginTop: 6, marginBottom: 20 },

    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    bankIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bankName: { fontSize: 14, fontWeight: '700', color: '#374151' },
    bankAccount: { fontSize: 13, color: '#6B7280' },
    editLink: { fontSize: 13, fontWeight: '600', color: '#EA580C', marginLeft: 'auto' },

    confirmBtn: { width: '100%', height: 50, backgroundColor: '#EA580C', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    disabledBtn: { backgroundColor: '#FED7AA' },

    // Success State
    successState: { alignItems: 'center', paddingVertical: 20 },
    successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    successTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
    successMsg: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
    refId: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 24 },
    doneBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
    doneBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' }
});
