import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';

interface RcHistoryItem {
    id: number;
    registration_number: string;
    user_name: string;
    vehicle_make_model: string;
    status: string;
    created_at: string;
    result: any;
}

const RcCheckInfo = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const safeAreaInsets = useSafeAreaInsets();

    // Get subscription details and user from Redux
    const { subscriptionDetails, user } = useSelector((state: any) => state?.user) || {};
    const isTransporter = user?.role?.toLowerCase() === 'transporter';

    // Check if subscription is active (₹199 or ₹499 plan)
    const checkSubscriptionActive = () => {
        if (!subscriptionDetails) return false;

        const isActive = (item: any) => {
            if (!item || !item.end_at) return false;
            const endDate = new Date(item.end_at * 1000);
            const now = new Date();
            return endDate > now;
        };

        let activeSub = null;
        if (Array.isArray(subscriptionDetails)) {
            activeSub = subscriptionDetails.find((item: any) => isActive(item));
        } else if (isActive(subscriptionDetails)) {
            activeSub = subscriptionDetails;
        }

        if (activeSub) {
            const amt = activeSub.amount ? parseFloat(activeSub.amount) : 0;
            // RC Check is available for ₹199 and ₹499 plans
            if (isTransporter) {
                return amt >= 499;
            }
            return amt >= 199;
        }
        return false;
    };

    const isSubscriptionActive = checkSubscriptionActive();

    // State
    const [rcInputModalVisible, setRcInputModalVisible] = useState(false);
    const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
    const [rcNumber, setRcNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [rcHistory, setRcHistory] = useState<RcHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const _goBack = () => navigation.goBack();

    // Fetch RC History
    const fetchRcHistory = async () => {
        try {
            setHistoryLoading(true);
            const response: any = await axiosInstance.get(END_POINTS.RC_HISTORY);
            if (response?.data?.status && response?.data?.data) {
                setRcHistory(response.data.data);
            }
        } catch (error) {
            console.log('Error fetching RC history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRcHistory();
        }, [])
    );

    // 1. Open Input Modal
    const _handleCheckRc = () => {
        setRcInputModalVisible(true);
    };

    // 2. Verify Logic
    const _handleVerify = async () => {
        if (!rcNumber.trim()) {
            showToast(t('pleaseEnterVehicleNumber') || 'Please enter vehicle number');
            return;
        }

        if (isSubscriptionActive) {
            try {
                setLoading(true);

                // Send JSON body with vehicle_no
                const response: any = await axiosInstance.post(END_POINTS.RC_VERIFY, {
                    vehicle_no: rcNumber.toUpperCase().trim()
                });

                if (response?.data?.status === 1) {
                    setRcInputModalVisible(false);
                    setRcNumber('');
                    // Navigate to result screen with the API response
                    navigation.navigate(STACKS.RC_CHECK_RESULT, {
                        rcNumber: rcNumber.toUpperCase(),
                        rcData: response.data
                    });
                } else {
                    showToast(response?.data?.message || t('rcVerificationFailed') || 'RC verification failed');
                }
            } catch (error: any) {
                console.error('RC Verification Error:', error);
                showToast(error?.response?.data?.message || t('somethingWentWrong') || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        } else {
            // Show Subscription Required Modal
            setRcInputModalVisible(false);
            setTimeout(() => {
                setSubscriptionModalVisible(true);
            }, 300);
        }
    };

    const _handleViewPlans = () => {
        setSubscriptionModalVisible(false);
        dispatch(subscriptionModalAction(true));
    };

    const _viewHistoryItem = (item: RcHistoryItem) => {
        navigation.navigate(STACKS.RC_CHECK_RESULT, {
            rcNumber: item.registration_number,
            rcData: {
                status: 1,
                message: 'Vehicle verified',
                rc_id: item.id,
                result: item.result
            }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderHistoryItem = ({ item }: { item: RcHistoryItem }) => (
        <TouchableOpacity
            onPress={() => _viewHistoryItem(item)}
            activeOpacity={0.7}
            style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                padding: responsiveWidth(4),
                marginBottom: responsiveHeight(1.5),
                ...shadow,
                shadowColor: 'rgba(0,0,0,0.06)'
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Ionicons name="car-outline" size={18} color="#2563EB" />
                    </View>
                    <View>
                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '700', color: '#001F3F' }}>
                            {item.registration_number}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>
                            {item.vehicle_make_model || 'Vehicle'}
                        </Text>
                    </View>
                </View>
                <View style={{ backgroundColor: item.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: item.status === 'ACTIVE' ? '#166534' : '#DC2626', fontWeight: '600', fontSize: responsiveFontSize(1.4) }}>
                        {item.status || 'VERIFIED'}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>
                    {item.user_name}
                </Text>
                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#94A3B8' }}>
                    {formatDate(item.created_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );

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
                    {t('rcCheck') || 'RC Check'}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(14) }} showsVerticalScrollIndicator={false}>

                {/* 🚗 1️⃣ Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="car-outline" size={30} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                        {t('vehicleRcCheck') || 'Vehicle RC Check'}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#475569', textAlign: 'center', lineHeight: 26 }}>
                        {t('verifyVehicleRcInstantly') || 'Verify your vehicle RC details instantly by entering your vehicle number'}
                    </Text>
                </View>

                {/* ❓ 2️⃣ What is RC Check */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 10 }}>{t('whatIsRcCheck') || 'What is RC Check?'}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', marginBottom: 10, lineHeight: 24 }}>
                        {t('rcCheckDescription') || 'Check your vehicle RC details instantly by entering your vehicle number.'}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', fontStyle: 'italic', lineHeight: 23 }}>
                        {isTransporter
                            ? (t('rcCheckAvailabilityTransporter') || 'This feature is available for transporters with an active TruckMitr subscription.')
                            : (t('rcCheckAvailability') || 'This feature is available for drivers with an active TruckMitr subscription.')}
                    </Text>
                </View>

                {/* 🔄 3️⃣ How It Works */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 18 }}>{t('howItWorks') || 'How it works'}</Text>
                    {[
                        t('enterVehicleNumber') || "Enter your vehicle number",
                        t('startRcVerification') || "Start RC verification",
                        t('viewRcDetails') || "View RC check status and details"
                    ].map((step, index) => (
                        <View key={index} style={{ flexDirection: 'row', marginBottom: 18, alignItems: 'center' }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: responsiveFontSize(1.8) }}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155' }}>{step}</Text>
                            </View>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingLeft: 4 }}>
                        <Ionicons name="time-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#059669', fontWeight: '600' }}>{t('resultsSentQuickly') || 'Results are shared quickly after submission'}</Text>
                    </View>
                </View>

                {/* 💳 4️⃣ Subscription Requirement */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 14 }}>{t('subscriptionRequirement') || 'Subscription Requirement'}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', marginBottom: 12 }}>{t('rcCheckIncludedWith') || 'RC Check is included with:'}</Text>
                    {!isTransporter && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Ionicons name="checkmark-circle" size={22} color="#16A34A" style={{ marginRight: 10 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', fontWeight: '600' }}>₹199 {t('plan') || 'Plan'}</Text>
                    </View>}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <Ionicons name="checkmark-circle" size={22} color="#16A34A" style={{ marginRight: 10 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', fontWeight: '600' }}>₹499 {t('plan') || 'Plan'}</Text>
                    </View>
                    <View style={{ backgroundColor: '#FFF7ED', padding: 14, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#F97316' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#9A3412', lineHeight: 23 }}>
                            ⚠️ {t('ensureSubscriptionActive') || 'Please ensure your subscription is active to use this feature.'}
                        </Text>
                    </View>
                </View>

                {/* 📜 5️⃣ RC Check History */}
                {rcHistory.length > 0 && (
                    <View style={{ marginBottom: responsiveHeight(2) }}>
                        <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 14 }}>
                            {t('rcCheckHistory') || 'RC Check History'}
                        </Text>
                        {historyLoading ? (
                            <ActivityIndicator size="small" color={colors.royalBlue} />
                        ) : (
                            rcHistory.slice(0, 5).map((item, index) => (
                                <View key={item.id || index}>
                                    {renderHistoryItem({ item })}
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* 🔐 6️⃣ Data Security */}
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#64748B" style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#334155', marginBottom: 4 }}>{t('dataSecurity') || 'Data Security'}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', lineHeight: 22 }}>
                            {t('dataSecurityDescription') || 'Your data is secure and used only for RC verification purposes.'}
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* 📌 Sticky CTA Button */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), paddingBottom: responsiveHeight(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                <TouchableOpacity
                    onPress={_handleCheckRc}
                    style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveHeight(2), borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.2), fontWeight: 'bold' }}>
                        {t('checkVehicleRc') || 'Check Vehicle RC'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 🪟 1️⃣ RC Input Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={rcInputModalVisible}
                onRequestClose={() => {
                    if (!loading) setRcInputModalVisible(false);
                }}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: responsiveWidth(5), paddingBottom: responsiveHeight(5) }}>
                            {/* Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: '#001F3F' }}>{t('vehicleRcVerification') || 'Vehicle RC Verification'}</Text>
                                {!loading && (
                                    <TouchableOpacity onPress={() => setRcInputModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#64748B" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Loader Specific View */}
                            {loading ? (
                                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <ActivityIndicator size="large" color={colors.royalBlue} style={{ marginBottom: 16 }} />
                                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '600', color: '#001F3F', marginBottom: 8 }}>{t('verifyingRcDetails') || 'Verifying RC details...'}</Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('pleaseWait') || 'Please wait, this may take a moment'}</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', marginBottom: 8 }}>{t('enterVehicleNumber') || 'Enter Vehicle Number'}</Text>
                                    <TextInput
                                        value={rcNumber}
                                        onChangeText={setRcNumber}
                                        placeholder="MH12AB1234"
                                        placeholderTextColor="#94A3B8"
                                        autoCapitalize="characters"
                                        style={{
                                            borderWidth: 1,
                                            borderColor: '#E2E8F0',
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            fontSize: responsiveFontSize(2.0),
                                            color: '#001F3F',
                                            backgroundColor: '#F8FAFC',
                                            marginBottom: 8
                                        }}
                                    />
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                        <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('enterVehicleNumberCorrectly') || 'Please enter the vehicle number correctly'}</Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={_handleVerify}
                                        style={{
                                            backgroundColor: rcNumber.trim() ? colors.royalBlue : '#CBD5E1',
                                            paddingVertical: responsiveHeight(1.8),
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        disabled={!rcNumber.trim()}
                                    >
                                        <Text style={{ color: 'white', fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>{t('verifyRc') || 'Verify RC'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* 🔐 2️⃣ Subscription Required Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={subscriptionModalVisible}
                onRequestClose={() => setSubscriptionModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <MaterialCommunityIcons name="crown-outline" size={32} color="#F97316" />
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: '#001F3F', marginBottom: 8, textAlign: 'center' }}>{t('subscriptionRequired') || 'Subscription Required'}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', textAlign: 'center', marginBottom: 24 }}>
                            {isTransporter
                                ? (t('rcCheckAvailableForTransporterPro') || 'RC Check is available only for ₹499 plan.')
                                : (t('rcCheckAvailableForPlans') || 'RC Check is available only for ₹199 and ₹499 plans.')}
                        </Text>

                        <TouchableOpacity
                            onPress={_handleViewPlans}
                            style={{ backgroundColor: colors.royalBlue, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
                        >
                            <Text style={{ color: 'white', fontSize: responsiveFontSize(1.8), fontWeight: 'bold' }}>{t('viewPlans') || 'View Plans'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSubscriptionModalVisible(false)}
                            style={{ paddingVertical: 10 }}
                        >
                            <Text style={{ color: '#64748B', fontSize: responsiveFontSize(1.8), fontWeight: '600' }}>{t('cancel') || 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View >
                </View >
            </Modal >

        </View >
    );
};

export default RcCheckInfo;
