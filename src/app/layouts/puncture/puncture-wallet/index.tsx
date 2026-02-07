import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { hitSlop } from '@truckmitr/src/app/functions';
import LinearGradient from 'react-native-linear-gradient';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import moment from 'moment';
import { showToast } from '@truckmitr/src/app/hooks/toast';

export default function PunctureWallet() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const safeAreaInsets = useSafeAreaInsets();
    useStatusBarStyle('dark-content');
    const { t } = useTranslation();

    // States
    const [balance, setBalance] = useState(0);
    const [totalEarned, setTotalEarned] = useState(0);
    const [totalRedeemed, setTotalRedeemed] = useState(0);
    const [pendingRedemption, setPendingRedemption] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isRedeemModalVisible, setIsRedeemModalVisible] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState('');
    const [redeemStatus, setRedeemStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');

    // Constants
    const MIN_REDEEM_AMOUNT = 500;

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.PUNCTURE_WALLET_SUMMARY);
            console.log('puncture wallet summary', response.data);

            if (response.data && response.data.success && response.data.data) {
                const data = response.data.data;
                setBalance(parseFloat(data.current_balance) || 0);
                setTotalEarned(parseFloat(data.total_earned) || 0);
                setTotalRedeemed(parseFloat(data.total_paid) || 0);
                setPendingRedemption(parseFloat(data.total_pending) || 0);
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching puncture wallet summary:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWalletData();
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            if (route.params?.openRedeem) {
                setIsRedeemModalVisible(true);
                navigation.setParams({ openRedeem: undefined } as any);
            }
        }, [route.params])
    );

    const handleRedeem = async () => {
        const amount = parseInt(redeemAmount);
        if (isNaN(amount) || amount < MIN_REDEEM_AMOUNT || amount > balance) return;

        try {
            setRedeemStatus('PROCESSING');
            const payload = {
                contact_reason: `request for money (Puncture) - Amount: ${amount}`,
            };
            const response = await axiosInstance.post(END_POINTS.CALLBACK_REQUEST, payload);

            if (response.data?.status) {
                setRedeemStatus('SUCCESS');
            } else {
                setRedeemStatus('FAILED');
                showToast(response.data?.message || 'Payout request failed');
            }
        } catch (error) {
            console.error('Error requesting payout:', error);
            setRedeemStatus('FAILED');
            showToast('Payout request failed');
        }
    };

    const resetRedeem = () => {
        setIsRedeemModalVisible(false);
        setRedeemStatus('IDLE');
        setRedeemAmount('');
    };

    const renderTransaction = ({ item }: { item: any }) => {
        const isCredit = true; // All commissions are currently credits
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
                    <Text style={styles.txnTitle}>{item.driver_name || 'Driver Commission'}</Text>
                    <Text style={styles.txnSubtitle}>{item.driver_mobile}</Text>
                    <Text style={styles.txnDate}>{item.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmount, isCredit ? styles.amountCredit : styles.amountDebit]}>
                        {isCredit ? '+' : '-'} ₹{item.amount}
                    </Text>
                    <Text style={[styles.txnStatus,
                    item.status?.toLowerCase() === 'pending' ? { color: '#D97706' } : { color: '#059669' }
                    ]}>
                        {t(item.status?.toLowerCase() === 'pending' ? 'puncture_wallet_pending' : 'puncture_wallet_paid')}
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
                <Text style={styles.headerTitle}>{t('puncture_wallet_title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom + 20 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchWalletData} colors={['#475569']} />
                }
            >
                {/* Main Balance Card */}
                <LinearGradient
                    colors={['#475569', '#334155']} // Slate Theme for Puncture Shop
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View>
                        <Text style={styles.balanceLabel}>{t('puncture_wallet_current_balance')}</Text>
                        <Text style={styles.balanceValue}>₹{balance}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.redeemBtn}
                        activeOpacity={0.8}
                        onPress={() => setIsRedeemModalVisible(true)}
                    >
                        <Text style={styles.redeemBtnText}>{t('puncture_wallet_redeem')}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>₹{totalEarned}</Text>
                        <Text style={styles.statLabel}>{t('puncture_wallet_total_earned')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>₹{totalRedeemed}</Text>
                        <Text style={styles.statLabel}>{t('puncture_wallet_total_redeemed')}</Text>
                    </View>
                    <View style={[styles.statCard, { borderRightWidth: 0 }]}>
                        <Text style={[styles.statValue, { color: '#D97706' }]}>₹{pendingRedemption}</Text>
                        <Text style={styles.statLabel}>{t('puncture_wallet_pending')}</Text>
                    </View>
                </View>

                {/* Transactions Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('puncture_wallet_transactions')}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </View>

                {/* Transactions List */}
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item, index) => item.transaction_id?.toString() || index.toString()}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <Text style={{ color: '#9CA3AF' }}>{t('noTransactionsFound') || 'No transactions found'}</Text>
                        </View>
                    }
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
                                <Text style={styles.successTitle}>{t('puncture_wallet_request_submitted')}</Text>
                                <Text style={styles.successMsg}>
                                    {t('puncture_wallet_redemption_success_msg', { amount: redeemAmount })}
                                </Text>
                                <Text style={styles.refId}>{t('puncture_wallet_ref_id')}: TXN123456789</Text>
                                <TouchableOpacity style={styles.doneBtn} onPress={resetRedeem}>
                                    <Text style={styles.doneBtnText}>{t('puncture_wallet_done')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('puncture_wallet_redeem_funds')}</Text>
                                    <TouchableOpacity onPress={resetRedeem} disabled={redeemStatus === 'PROCESSING'}>
                                        <Ionicons name="close" size={24} color="#1F2937" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>{t('puncture_wallet_amount_to_redeem')}</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder={t('puncture_wallet_enter_amount')}
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                    value={redeemAmount}
                                    onChangeText={setRedeemAmount}
                                    editable={redeemStatus !== 'PROCESSING'}
                                />
                                <Text style={styles.helperText}>
                                    {t('puncture_wallet_available')}: <Text style={{ fontWeight: '700' }}>₹{balance}</Text> • {t('puncture_wallet_min')}: ₹{MIN_REDEEM_AMOUNT}
                                </Text>

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
                                        <Text style={styles.confirmBtnText}>{t('puncture_wallet_request_redemption')}</Text>
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
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
    balanceValue: { fontSize: 32, color: '#FFF', fontWeight: '800', marginTop: 4 },
    redeemBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    redeemBtnText: { color: '#475569', fontWeight: '600', fontSize: 13, marginRight: 2 },

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

    confirmBtn: { width: '100%', height: 50, backgroundColor: '#475569', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    disabledBtn: { backgroundColor: '#94a3b8' },

    // Success State
    successState: { alignItems: 'center', paddingVertical: 20 },
    successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    successTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
    successMsg: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
    refId: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 24 },
    doneBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
    doneBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' }
});
