import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, ScrollView, TouchableOpacity, Platform, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { useTranslation } from 'react-i18next';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';

interface ChallanHistoryItem {
    id: number;
    user_id: number;
    unique_id: string;
    txn_id: string;
    pdfUrl: string;
    recieptUrl: string;
    number: string;
    challan_number: string;
    offense_details: string;
    offence_details_list: string;
    challan_place: string;
    challan_date_time: string;
    state: string;
    rto: string;
    accused_name: string;
    amount: string;
    challan_status: string;
    court_challan: number;
    upstream_code: string;
    created_at: string;
    updated_at: string;
}

const ChallanCheckInfo = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();

    const { subscriptionDetails, user } = useSelector((state: any) => state?.user);
    const isTransporter = user?.role?.toLowerCase() === 'transporter';

    const checkSubscriptionStatus = () => {
        if (!subscriptionDetails) return false;

        // Ensure we have an array, even if API returns a single object
        const subs = Array.isArray(subscriptionDetails) ? subscriptionDetails : [subscriptionDetails];

        console.log('[ChallanCheck] Checking subscriptions:', JSON.stringify(subs));

        // Check for active subscription with amount 199 or 499
        const validSubscription = subs.find((sub: any) => {
            if (!sub) return false;

            // Check expiry
            if (!sub.end_at) return false;
            const endDate = new Date(sub.end_at * 1000);
            const now = new Date();

            // If expired
            if (endDate <= now) return false;

            // Check amount (handle string or number)
            const amount = parseFloat(sub.amount);

            console.log(`[ChallanCheck] Sub Amount: ${amount}, EndDate: ${endDate}`);

            // Allow 199, 499 (and handle potential variations like 199.00)
            // also checking payment_status if available
            const isAmountValid = Math.floor(amount) === 199 || Math.floor(amount) === 499;

            return isAmountValid;
        });

        return !!validSubscription;
    };

    const hasActivePlan = checkSubscriptionStatus();

    // State
    const [inputModalVisible, setInputModalVisible] = useState(false);
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [loading, setLoading] = useState(false);

    // History State
    const [historyData, setHistoryData] = useState<ChallanHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    // Fetch challan history
    const fetchChallanHistory = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setHistoryLoading(true);
        }

        try {
            const response = await axiosInstance.get(END_POINTS.CHALLAN_HISTORY);
            console.log('[ChallanHistory] Response:', JSON.stringify(response.data));

            if (response.data.status === 1 && response.data.result) {
                setHistoryData(response.data.result);
            } else {
                setHistoryData([]);
            }
        } catch (error: any) {
            console.error('[ChallanHistory] Error:', error);
            // Don't show toast on initial load failure, just set empty
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch history on screen focus
    useFocusEffect(
        useCallback(() => {
            if (hasActivePlan) {
                fetchChallanHistory();
            }
        }, [hasActivePlan])
    );

    const toggleExpandItem = (id: number) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { bg: '#FEE2E2', text: '#DC2626' };
            case 'disposed':
            case 'paid':
                return { bg: '#DBF4E6', text: '#16A34A' };
            default:
                return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const _goBack = () => navigation.goBack();

    const _handleCheckChallan = () => {
        setInputModalVisible(true);
    };

    const _handleVerify = async () => {
        if (!vehicleNumber.trim()) return;

        if (hasActivePlan) {
            setLoading(true);
            try {
                const payload = {
                    vehicle_no: vehicleNumber.toUpperCase(),
                    consent: "Y",
                    consent_text: "I give my consent to challan-details api to check my challan details"
                };

                const response = await axiosInstance.post(END_POINTS.CHALLAN_VERIFY, payload);

                if (response.data.status === 1) {
                    setInputModalVisible(false);
                    setVehicleNumber('');
                    // Refresh history after successful check
                    fetchChallanHistory();
                    navigation.navigate(STACKS.CHALLAN_CHECK_RESULT, {
                        vehicleNumber: vehicleNumber.toUpperCase(),
                        results: response.data.result
                    });
                } else {
                    showToast(response.data.message || t('somethingWentWrong'));
                }
            } catch (error: any) {
                console.error("Challan check error:", error);
                showToast(error?.response?.data?.message || t('somethingWentWrong'));
            } finally {
                setLoading(false);
            }
        } else {
            setInputModalVisible(false);
            setTimeout(() => {
                // Open global subscription modal with only ₹199 and ₹499 plans
                dispatch(subscriptionModalAction({ visible: true, upgradeOnly: true }));
            }, 300);
        }
    };

    const StepItem = ({ number, text }: { number: number; text: string }) => (
        <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: responsiveFontSize(1.8) }}>{number}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: responsiveFontSize(1.8), color: '#334155', lineHeight: responsiveFontSize(2.6), textAlign: 'left' }}>{text}</Text>
            </View>
        </View>
    );

    const HistoryCard = ({ item }: { item: ChallanHistoryItem }) => {
        const isExpanded = expandedItems.has(item.id);
        const statusColors = getStatusColor(item.challan_status);
        const amount = parseFloat(item.amount);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleExpandItem(item.id)}
                style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    marginBottom: 12,
                    ...shadow,
                    shadowColor: 'rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <View style={{
                    padding: responsiveWidth(4),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottomWidth: isExpanded ? 1 : 0,
                    borderBottomColor: '#F1F5F9'
                }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="car-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '700', color: '#001F3F' }}>
                                {item.number || '-'}
                            </Text>
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(1.45), color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                            {item.offense_details || t('noOffenceDetails', 'No offence details')}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{
                            backgroundColor: statusColors.bg,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 8,
                            marginBottom: 4
                        }}>
                            <Text style={{
                                fontSize: responsiveFontSize(1.4),
                                color: statusColors.text,
                                fontWeight: '600',
                                textTransform: 'capitalize'
                            }}>
                                {item.challan_status || 'pending'}
                            </Text>
                        </View>
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#94A3B8"
                        />
                    </View>
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                    <View style={{ padding: responsiveWidth(4), backgroundColor: '#FAFBFC' }}>
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', marginBottom: 2 }}>
                                {t('challanNumber', 'Challan Number')}
                            </Text>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '600' }}>
                                {item.challan_number || '-'}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', marginBottom: 2 }}>
                                    {t('challanPlace', 'Place')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '500' }}>
                                    {item.challan_place || '-'}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', marginBottom: 2 }}>
                                    {t('state', 'State')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '500' }}>
                                    {item.state || '-'}
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', marginBottom: 2 }}>
                                    {t('challanDate', 'Date & Time')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '500' }}>
                                    {formatDate(item.challan_date_time)}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', marginBottom: 2 }}>
                                    {t('accusedName', 'Accused Name')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '500' }}>
                                    {item.accused_name || '-'}
                                </Text>
                            </View>
                        </View>

                        <View style={{
                            backgroundColor: amount > 0 ? '#FEF2F2' : '#F0FDF4',
                            padding: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', fontWeight: '500' }}>
                                {t('challanAmount', 'Challan Amount')}
                            </Text>
                            <Text style={{
                                fontSize: responsiveFontSize(2.0),
                                color: amount > 0 ? '#DC2626' : '#16A34A',
                                fontWeight: 'bold'
                            }}>
                                ₹{amount.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                marginTop: safeAreaInsets.top,
                paddingHorizontal: responsiveFontSize(2),
                backgroundColor: colors.white,
                borderBottomWidth: 1,
                borderBottomColor: colors.blackOpacity(0.05)
            }}>
                <TouchableOpacity
                    onPress={_goBack}
                    hitSlop={hitSlop(10)}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.blackOpacity(0.05)
                    }}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{
                    fontSize: responsiveFontSize(2.2),
                    color: colors.black,
                    fontWeight: '700'
                }}>
                    {t('challanCheckTitle', 'Challan Check')}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(14) }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    hasActivePlan ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchChallanHistory(true)}
                            colors={[colors.royalBlue]}
                            tintColor={colors.royalBlue}
                        />
                    ) : undefined
                }
            >

                {/* Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="receipt-outline" size={30} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                        {t('challanCheckTitle', 'Challan Check')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.8), paddingHorizontal: 8 }}>
                        {t('challanCheckHeroDesc', 'Check pending traffic challans for your vehicle by entering the vehicle number')}
                    </Text>
                </View>

                {/* Challan History Section - Only show for active plan users */}
                {hasActivePlan && (
                    <View style={{ marginBottom: responsiveHeight(2) }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="history" size={22} color="#2563EB" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155' }}>
                                    {t('challanHistory', 'Challan History')}
                                </Text>
                            </View>
                            {historyData.length > 0 && (
                                <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#2563EB', fontWeight: '600' }}>
                                        {historyData.length} {t('records', 'records')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {historyLoading ? (
                            <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(6), alignItems: 'center', ...shadow }}>
                                <ActivityIndicator size="small" color={colors.royalBlue} />
                                <Text style={{ fontSize: responsiveFontSize(1.8), color: '#64748B', marginTop: 12 }}>
                                    {t('loadingHistory', 'Loading history...')}
                                </Text>
                            </View>
                        ) : historyData.length > 0 ? (
                            historyData.map((item) => (
                                <HistoryCard key={item.id} item={item} />
                            ))
                        ) : (
                            <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(6), alignItems: 'center', ...shadow }}>
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="document-text-outline" size={24} color="#94A3B8" />
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '600', color: '#334155', marginBottom: 4, textAlign: 'center' }}>
                                    {t('noHistoryFound', 'No History Found')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', textAlign: 'center' }}>
                                    {t('noHistoryDesc', 'Your checked challans will appear here')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* What is Challan Check */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 10 }}>
                        {t('whatIsChallanCheck', 'What is Challan Check?')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', lineHeight: responsiveFontSize(2.6), marginBottom: 10, textAlign: 'left' }}>
                        {t('whatIsChallanCheckDesc', 'Check pending traffic challans for your vehicle by entering the vehicle number.')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', fontStyle: 'italic', lineHeight: responsiveFontSize(2.4), textAlign: 'left' }}>
                        {isTransporter
                            ? (t('challanFeatureNoteTransporter') || 'This feature is available for transporters with an active TruckMitr subscription.')
                            : (t('challanFeatureNote') || 'This feature is available for drivers with an active TruckMitr subscription.')}
                    </Text>
                </View>

                {/* How It Works */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 16 }}>
                        {t('howItWorks', 'How it works')}
                    </Text>
                    <StepItem number={1} text={t('challanStep1', 'Enter your vehicle number')} />
                    <StepItem number={2} text={t('challanStep2', 'Start challan verification')} />
                    <StepItem number={3} text={t('challanStep3', 'View challan status and details')} />
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
                        <Ionicons name="time-outline" size={18} color="#059669" style={{ marginRight: 6, marginTop: 2 }} />
                        <Text style={{ flex: 1, fontSize: responsiveFontSize(1.7), color: '#059669', fontWeight: '600', lineHeight: responsiveFontSize(2.4), textAlign: 'left' }}>
                            {t('challanResultTime', 'Results are shown shortly after submission')}
                        </Text>
                    </View>
                </View>

                {/* Subscription Requirement */}
                {!hasActivePlan && (
                    <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                        <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 12 }}>
                            {t('subscriptionRequirement', 'Subscription Requirement')}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', marginBottom: 10, lineHeight: responsiveFontSize(2.4), textAlign: 'left' }}>
                            {t('challanIncludedWith', 'Challan Check is included with:')}
                        </Text>
                        {!isTransporter && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', fontWeight: '600' }}>{t('plan199', '₹199 Plan')}</Text>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600' }}>{t('plan499', '₹499 Plan')}</Text>
                        </View>
                        <View style={{ backgroundColor: '#FFF7ED', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#F97316' }}>
                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#9A3412', lineHeight: responsiveFontSize(2.4), textAlign: 'left' }}>
                                ⚠️ {t('ensureSubscriptionActive', 'Please ensure your subscription is active to use this feature.')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Data Security */}
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={26} color="#64748B" style={{ marginRight: 12, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#334155', marginBottom: 4, textAlign: 'left' }}>
                            {t('dataSecurity', 'Data Security')}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', lineHeight: responsiveFontSize(2.4), textAlign: 'left' }}>
                            {t('dataSecurityDesc', 'Your data is secure and used only for challan verification purposes.')}
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Sticky CTA Button */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                <TouchableOpacity
                    onPress={_handleCheckChallan}
                    style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveHeight(1.8), borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.2), fontWeight: 'bold' }}>
                        {t('checkChallanBtn', 'Check Challan')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Input Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={inputModalVisible}
                onRequestClose={() => { if (!loading) setInputModalVisible(false); }}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: responsiveWidth(5), paddingBottom: responsiveHeight(5) }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: '#001F3F' }}>
                                    {t('challanVerification', 'Challan Verification')}
                                </Text>
                                {!loading && (
                                    <TouchableOpacity onPress={() => setInputModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#64748B" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {loading ? (
                                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <ActivityIndicator size="large" color={colors.royalBlue} style={{ marginBottom: 16 }} />
                                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '600', color: '#001F3F', marginBottom: 8, textAlign: 'center' }}>
                                        {t('verifyingDetails', 'Verifying details...')}
                                    </Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', textAlign: 'center' }}>
                                        {t('pleaseWaitMoment', 'Please wait, this may take a moment')}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', marginBottom: 8, textAlign: 'left' }}>
                                        {t('enterVehicleNumber', 'Enter Vehicle Number')}
                                    </Text>
                                    <TextInput
                                        value={vehicleNumber}
                                        onChangeText={setVehicleNumber}
                                        placeholder="MH12AB1234"
                                        placeholderTextColor="#94A3B8"
                                        autoCapitalize="characters"
                                        style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: responsiveFontSize(2.0), color: '#001F3F', backgroundColor: '#F8FAFC', marginBottom: 8, textAlign: 'left' }}
                                    />
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 }}>
                                        <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginRight: 6, marginTop: 2 }} />
                                        <Text style={{ flex: 1, fontSize: responsiveFontSize(1.4), color: '#64748B', lineHeight: responsiveFontSize(2.0), textAlign: 'left' }}>
                                            {t('enterVehicleCorrectly', 'Please enter the vehicle number correctly')}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={_handleVerify}
                                        style={{ backgroundColor: vehicleNumber.trim() ? colors.royalBlue : '#CBD5E1', paddingVertical: responsiveHeight(1.8), borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                        disabled={!vehicleNumber.trim()}
                                    >
                                        <Text style={{ color: 'white', fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>
                                            {t('verifyChallan', 'Verify Challan')}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

        </View>
    );
};

export default ChallanCheckInfo;
