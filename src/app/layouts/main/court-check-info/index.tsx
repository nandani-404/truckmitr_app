import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Linking, TextInput, ActivityIndicator, Pressable } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { ScreenHeader } from '@truckmitr/src/app/components';

const CourtCheckInfo = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const [refreshKey, setRefreshKey] = useState(0);

    // Get user data from Redux
    const { user, subscriptionDetails } = useSelector((state: any) => state?.user) || {};

    // Form State
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [address, setAddress] = useState('');
    const [fathersName, setFathersName] = useState('');

    // Period of Stay - From and To dates
    const [stayFromDate, setStayFromDate] = useState<Date | null>(null);
    const [stayToDate, setStayToDate] = useState<Date | null>(null);
    const [showStayFromPicker, setShowStayFromPicker] = useState(false);
    const [showStayToPicker, setShowStayToPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [courtCheckData, setCourtCheckData] = useState<any>(null);

    useEffect(() => {
        const getCourtCheckStatus = async () => {
            if (!user?.id) return;
            try {
                const res: any = await axiosInstance.get(END_POINTS.COURT_CHECK_AND_REPORT);
                if (res?.data?.statusCode === 201) {
                    setCourtCheckData(res.data);
                }
            } catch (err) {
                console.log('Court check status error', err);
            }
        };
        getCourtCheckStatus();
    }, [user?.id, refreshKey]);

    // Check if subscription is active (₹499 plan for Court Check)
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
            // Court Check is available for ₹499 plan
            return amt >= 499;
        }
        return false;
    };

    const isSubscriptionActive = checkSubscriptionActive();

    const _goBack = () => navigation.goBack();

    // Format date to d-m-Y (dd-mm-yyyy with leading zeros)
    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Format period of stay from dates
    const formatPeriodOfStay = (): string => {
        if (!stayFromDate && !stayToDate) return 'Not specified';
        const fromStr = stayFromDate ? formatDate(stayFromDate) : 'N/A';
        const toStr = stayToDate ? formatDate(stayToDate) : 'Present';
        return `${fromStr} to ${toStr}`;
    };

    // Submit Court Check API
    const _submitCourtCheck = async () => {
        // Validate form fields
        if (!fullName.trim()) {
            showToast(t('pleaseEnterFullName') || 'Please enter full name');
            return;
        }
        if (!dob) {
            showToast(t('pleaseEnterDob') || 'Please enter date of birth');
            return;
        }
        if (!address.trim()) {
            showToast(t('pleaseEnterAddress') || 'Please enter address');
            return;
        }
        if (!fathersName.trim()) {
            showToast(t('pleaseEnterFatherName') || "Please enter father's name");
            return;
        }

        try {
            setLoading(true);

            // Prepare the request payload
            const payload = {
                name: fullName.trim(),
                unique_id: user?.unique_id || '',
                addresses: [{
                    address: address.trim(),
                    periodOfStay: formatPeriodOfStay()
                }],
                dob: formatDate(dob),
                father_name: fathersName.trim(),
                type: user?.role === 'transporter' ? 'transporter' : 'driver'
            };

            const response: any = await axiosInstance.post(END_POINTS.COURT_CHECK_CASE_STATUS, payload);

            if (response?.data?.status === 1) {
                showToast(response?.data?.message || t('courtCheckSuccess') || 'Case created successfully');
                // Clear form
                setFullName('');
                setDob(null);
                setAddress('');
                setFathersName('');
                setStayFromDate(null);
                setStayToDate(null);
                // Navigate back or show success
                navigation.goBack();
            } else {
                showToast(response?.data?.message || t('courtCheckFailed') || 'Court check submission failed');
            }
        } catch (error: any) {
            console.error('Court Check API Error:', error);
            showToast(error?.response?.data?.message || t('somethingWentWrong') || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const _startCourtCheck = () => {
        if (isSubscriptionActive) {
            _submitCourtCheck();
        } else {
            // Show only ₹499 plan for Court Check feature
            dispatch(subscriptionModalAction({ visible: true, minPrice: 499 }));
        }
    };
    const _contactSupport = () => {
        Linking.openURL('tel:18001024558');
    };
    const _refreshPage = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Detail Card Component
    const DetailCard = ({ icon, title }: { icon: string, title: string }) => (
        <View style={{ width: '48%', backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(3), marginBottom: 12, ...shadow, shadowColor: 'rgba(0,0,0,0.08)', borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={22} color="#2563EB" />
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '600', color: '#001F3F', flex: 1 }}>{title}</Text>
        </View>
    );

    // Process Step Component
    const ProcessStep = ({ number, text, isLast }: { number: string, text: string, isLast?: boolean }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ alignItems: 'center', marginRight: 14 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: '700', color: colors.white }}>{number}</Text>
                </View>
                {!isLast && <View style={{ width: 2, height: 28, backgroundColor: '#E0E7FF', marginTop: 4 }} />}
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', flex: 1, paddingTop: 6 }}>{text}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <ScreenHeader
                title={t('courtCheckTitle')}
                rightComponent={
                    <Pressable
                        onPress={_refreshPage}
                        style={({ pressed }) => [{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.blackOpacity(0.05),
                            opacity: pressed ? 0.6 : 1
                        }]}
                    >
                        <Ionicons name="refresh" size={20} color={colors.royalBlue} />
                    </Pressable>
                }
            />

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(14) }} showsVerticalScrollIndicator={false}>

                {/* ⚖️ Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <MaterialCommunityIcons name="scale-balance" size={36} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                        {t('courtCheckTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('courtCheckDesc')}
                    </Text>
                    <TouchableOpacity
                        onPress={courtCheckData?.report ? undefined : _startCourtCheck}
                        disabled={!!courtCheckData?.report}
                        style={{ backgroundColor: courtCheckData?.report ? '#10B981' : colors.royalBlue, paddingVertical: responsiveHeight(1.8), paddingHorizontal: responsiveWidth(8), borderRadius: 12, marginTop: responsiveHeight(2) }}
                    >
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.9), fontWeight: '600' }}>
                            {courtCheckData?.report ? t('courtCheckIsDone') : t('checkCourtCheckNow')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ❓ Why Court Check? */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 10 }}>{t('whyCourtCheck')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#64748B', lineHeight: responsiveFontSize(2.6) }}>
                        {t('whyCourtCheckDesc')}
                    </Text>
                </View>

                {/* 📋 Court Check Status - Display if data exists */}
                {courtCheckData ? (
                    <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 12 }}>{t('caseDetails') || 'Case Details'}</Text>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', marginBottom: 4 }}>{t('status') || 'Status'}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: courtCheckData.report ? '#10B981' : '#F59E0B', marginRight: 8 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: courtCheckData.report ? '#059669' : '#D97706' }}>
                                    {courtCheckData.statusMsg || (courtCheckData.report ? (t('verified') || 'Verified') : (t('pending') || 'Pending'))}
                                </Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', marginBottom: 4 }}>{t('applicantName') || 'Applicant Name'}</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#0F172A' }}>{courtCheckData.name}</Text>
                        </View>

                        {courtCheckData.report && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', marginBottom: 4 }}>{t('reportStatus') || 'Report Result'}</Text>
                                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: courtCheckData.report === 'Green' ? '#16A34A' : '#DC2626' }}>
                                    {courtCheckData.report}
                                </Text>
                            </View>
                        )}

                        {courtCheckData.reportUrl && (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(courtCheckData.reportUrl)}
                                style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8 }}
                            >
                                <Ionicons name="document-text-outline" size={20} color={colors.royalBlue} style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: colors.royalBlue, fontWeight: '600' }}>
                                    {t('downloadReport') || 'Download Report'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <>
                        {/* 📝 Required Details - Input Form */}
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 12 }}>{t('requiredDetails')}</Text>
                        <View style={{ marginBottom: responsiveHeight(2) }}>
                            <View style={{ marginBottom: 18 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600', marginBottom: 8 }}>{t('fullName')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14 }}>
                                    <Ionicons name="person-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, paddingVertical: 14, fontSize: responsiveFontSize(1.8), color: '#0F172A' }}
                                        placeholder={t('enterFullName')}
                                        placeholderTextColor="#94A3B8"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View style={{ marginBottom: 18 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600', marginBottom: 8 }}>{t('dateOfBirth')}</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDobPicker(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, paddingVertical: 14 }}
                                >
                                    <Ionicons name="calendar-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                                    <Text style={{ flex: 1, fontSize: responsiveFontSize(1.8), color: dob ? '#0F172A' : '#94A3B8' }}>
                                        {dob ? formatDate(dob) : 'dd-mm-yyyy'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginBottom: 18 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600', marginBottom: 8 }}>{t('address')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14 }}>
                                    <Ionicons name="home-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, paddingVertical: 14, fontSize: responsiveFontSize(1.8), color: '#0F172A' }}
                                        placeholder={t('enterCompleteAddress')}
                                        placeholderTextColor="#94A3B8"
                                        value={address}
                                        onChangeText={setAddress}
                                    />
                                </View>
                            </View>

                            <View style={{ marginBottom: 18 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600', marginBottom: 8 }}>{t('periodOfStay') || 'Period of Stay'}</Text>

                                {/* From Date */}
                                <TouchableOpacity
                                    onPress={() => setShowStayFromPicker(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10 }}
                                >
                                    <Ionicons name="calendar-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                                    <Text style={{ flex: 1, fontSize: responsiveFontSize(1.8), color: stayFromDate ? '#0F172A' : '#94A3B8' }}>
                                        {stayFromDate ? `${t('from') || 'From'}: ${formatDate(stayFromDate)}` : `${t('from') || 'From'}: ${t('selectDate') || 'Select Date'}`}
                                    </Text>
                                </TouchableOpacity>

                                {/* To Date */}
                                <TouchableOpacity
                                    onPress={() => setShowStayToPicker(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, paddingVertical: 14 }}
                                >
                                    <Ionicons name="calendar-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                                    <Text style={{ flex: 1, fontSize: responsiveFontSize(1.8), color: stayToDate ? '#0F172A' : '#94A3B8' }}>
                                        {stayToDate ? `${t('to') || 'To'}: ${formatDate(stayToDate)}` : `${t('to') || 'To'}: ${t('selectDate') || 'Select Date'}`}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginBottom: 18 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600', marginBottom: 8 }}>{t('fathersName')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14 }}>
                                    <Ionicons name="people-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, paddingVertical: 14, fontSize: responsiveFontSize(1.8), color: '#0F172A' }}
                                        placeholder={t('enterFatherName')}
                                        placeholderTextColor="#94A3B8"
                                        value={fathersName}
                                        onChangeText={setFathersName}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* 🔄 Verification Process - Stepper */}
                        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                            <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 18 }}>{t('verificationProcess')}</Text>
                            <ProcessStep number="1" text={t('enterRequiredDetails')} />
                            <ProcessStep number="2" text={t('verificationStarts')} />
                            <ProcessStep number="3" text={t('statusShown')} isLast />
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, backgroundColor: '#E0F2FE', padding: 12, borderRadius: 10 }}>
                                <Ionicons name="time-outline" size={18} color="#0369A1" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#075985', fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>{t('verificationTakes72Hours')}</Text>
                            </View>
                        </View>
                    </>
                )
                }

                {/* 🔐 Data Security */}
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Ionicons name="lock-closed" size={24} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#166534', marginBottom: 4 }}>{t('dataSecurity')}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#15803D', lineHeight: responsiveFontSize(2.4) }}>
                            {t('dataSecurityDescCourt')}
                        </Text>
                    </View>
                </View>

                {/* ☎️ Support Access */}
                <TouchableOpacity onPress={_contactSupport} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveHeight(1.5) }}>
                    <Ionicons name="call-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('needHelp')} <Text style={{ fontWeight: '600', color: '#2563EB' }}>{t('contactTruckMitrSupport')}</Text></Text>
                </TouchableOpacity>

            </ScrollView >


            {/* 📌 Sticky CTA Button */}
            {
                !courtCheckData && (
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                        <TouchableOpacity
                            onPress={_startCourtCheck}
                            disabled={loading}
                            style={{ backgroundColor: loading ? '#94A3B8' : colors.royalBlue, paddingVertical: responsiveHeight(2), borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                        >
                            {loading ? (
                                <>
                                    <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
                                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>{t('submitting') || 'Submitting...'}</Text>
                                </>
                            ) : (
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>{t('checkCourtCheckNow')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* Date Pickers using react-native-date-picker */}
            <DatePicker
                modal
                open={showDobPicker}
                date={dob || new Date(2000, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                title={t('dateOfBirth') || 'Date of Birth'}
                confirmText={t('confirm') || 'Confirm'}
                cancelText={t('cancel') || 'Cancel'}
                onConfirm={(selectedDate) => {
                    setShowDobPicker(false);
                    setDob(selectedDate);
                }}
                onCancel={() => {
                    setShowDobPicker(false);
                }}
                theme='light'
                
            />

            <DatePicker
                modal
                open={showStayFromPicker}
                date={stayFromDate || new Date()}
                mode="date"
                maximumDate={stayToDate || new Date()}
                title={`${t('periodOfStay') || 'Period of Stay'} - ${t('from') || 'From'}`}
                confirmText={t('confirm') || 'Confirm'}
                cancelText={t('cancel') || 'Cancel'}
                onConfirm={(selectedDate) => {
                    setShowStayFromPicker(false);
                    setStayFromDate(selectedDate);
                }}
                onCancel={() => {
                    setShowStayFromPicker(false);
                }}
            />

            <DatePicker
                modal
                open={showStayToPicker}
                date={stayToDate || new Date()}
                mode="date"
                minimumDate={stayFromDate || undefined}
                maximumDate={new Date()}
                title={`${t('periodOfStay') || 'Period of Stay'} - ${t('to') || 'To'}`}
                confirmText={t('confirm') || 'Confirm'}
                cancelText={t('cancel') || 'Cancel'}
                onConfirm={(selectedDate) => {
                    setShowStayToPicker(false);
                    setStayToDate(selectedDate);
                }}
                onCancel={() => {
                    setShowStayToPicker(false);
                }}
            />
        </View >
    );
};

export default CourtCheckInfo;
