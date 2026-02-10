import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Linking, TextInput, ActivityIndicator, Modal, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { hitSlop } from '@truckmitr/src/app/functions';
import { ScreenHeader } from '@truckmitr/src/app/components';
import { STACKS } from '@truckmitr/src/stacks/stacks';

// State ID to Name Mapping
const STATE_ID_MAP: Record<string, string> = {
    '1': 'Andaman and Nicobar Islands',
    '2': 'Andhra Pradesh',
    '3': 'Arunachal Pradesh',
    '4': 'Assam',
    '5': 'Bihar',
    '6': 'Chandigarh',
    '7': 'Chhattisgarh',
    '8': 'Dadra and Nagar Haveli',
    '9': 'Delhi',
    '10': 'Goa',
    '11': 'Gujarat',
    '12': 'Haryana',
    '13': 'Himachal Pradesh',
    '14': 'Jammu and Kashmir',
    '15': 'Jharkhand',
    '16': 'Karnataka',
    '17': 'Kerala',
    '18': 'Ladakh',
    '19': 'Lakshadweep',
    '20': 'Madhya Pradesh',
    '21': 'Maharashtra',
    '22': 'Manipur',
    '23': 'Meghalaya',
    '24': 'Mizoram',
    '25': 'Nagaland',
    '26': 'Odisha',
    '27': 'Others',
    '28': 'Puducherry',
    '29': 'Punjab',
    '30': 'Rajasthan',
    '31': 'Sikkim',
    '32': 'Tamil Nadu',
    '33': 'Telangana',
    '34': 'Tripura',
    '35': 'Uttar Pradesh',
    '36': 'Uttarakhand',
    '37': 'West Bengal',
    '38': 'Daman and Diu'
};

const getStateName = (stateValue: string | number | undefined): string => {
    if (!stateValue) return '';
    const stateStr = String(stateValue).trim();
    if (STATE_ID_MAP[stateStr]) return STATE_ID_MAP[stateStr];
    return stateStr;
};

interface DavHistoryItem {
    id: number;
    mobile: string;
    name: string;
    address: string;
    status: string;
    created_at: string;
    result: any;
}

interface DavProfileData {
    id: number;
    unique_id: string;
    name: string;
    mobile: string;
    address: string;
    address_type: string | null;
    verification_status: 'pending' | 'verified' | null | string;
    pdf: string | null;
}

const DigitalAddressCheckInfo = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();

    // Get subscription details and user from Redux
    // Get subscription details and user from Redux
    const { subscriptionDetails, user, profileCompletion } = useSelector((state: any) => state?.user) || {};
    const isTransporter = user?.role?.toLowerCase() === 'transporter';

    // Form State - Auto-filled from profile
    const [uniqueId, setUniqueId] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    // User Input - Address Type (Permanent or Current)
    const [addressType, setAddressType] = useState<'Permanent' | 'Current'>('Permanent');

    // UI State
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [davProfileLoading, setDavProfileLoading] = useState(true);
    const [inputModalVisible, setInputModalVisible] = useState(false);
    const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
    const [davHistory, setDavHistory] = useState<DavHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [davProfile, setDavProfile] = useState<DavProfileData | null>(null);
    const hasAutoOpenedDavFormRef = useRef(false);

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
            // Digital Address Check is available for ₹199 and ₹499 plans
            if (isTransporter) {
                return amt >= 499;
            }
            return amt >= 499;
        }
        return false;
    };

    const isSubscriptionActive = checkSubscriptionActive();

    // Fetch profile data and auto-fill form
    const fetchProfileData = async () => {
        try {
            setProfileLoading(true);
            const response: any = await axiosInstance.get(END_POINTS.GET_PROFILE);

            if (response?.data?.status && response?.data?.user) {
                const profileData = response.data.user;

                // Auto-fill form fields from profile
                setUniqueId(profileData.unique_id || '');
                setMobileNumber(profileData.mobile || '');
                setFullName(profileData.name || '');
                setCurrentAddress(profileData.address || '');
                setCity(profileData.city || '');
                // Convert state ID to state name
                setState(getStateName(profileData.states) || profileData.state_name || '');
                setPincode(profileData.pincode || '');
            }
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchDavProfile = async () => {
        try {
            setDavProfileLoading(true);
            const response: any = await axiosInstance.get(END_POINTS.DAV_PROFILE);
            if (response?.data?.status) {
                setDavProfile(response?.data?.data || null);
            } else {
                setDavProfile(null);
            }
        } catch (error) {
            console.log('Error fetching DAV profile:', error);
            setDavProfile(null);
        } finally {
            setDavProfileLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const loadScreenData = async () => {
                // Keep DAV profile as the first API call for this screen.
                await fetchDavProfile();
                await fetchProfileData();
            };

            hasAutoOpenedDavFormRef.current = false;
            loadScreenData();
        }, [])
    );

    const _goBack = () => navigation.goBack();

    const _handleStartCheck = () => {
        if (profileCompletion !== undefined && profileCompletion !== null && Number(profileCompletion) < 100) {
            setProfileModalVisible(true);
            return;
        }
        setInputModalVisible(true);
    };

    const _handleSubmit = async () => {
        if (isSubscriptionActive) {
            try {
                setLoading(true);

                // Build the primary address from profile fields
                const primaryAddress = [
                    currentAddress.trim(),
                    city.trim(),
                    state.trim(),
                    pincode.trim()
                ].filter(Boolean).join(', ');

                // Send POST request to DAV API with required payload
                const payload = {
                    unique_id: uniqueId,
                    name: fullName.trim(),
                    mobile: mobileNumber.trim(),
                    address: primaryAddress,
                    address_type: String(addressType) // Ensure it's sent as string "Permanent" or "Current"
                };

                console.log('DAV API Payload:', JSON.stringify(payload));

                const response: any = await axiosInstance.post(END_POINTS.DIGITAL_ADDRESS_VERIFY, payload);

                console.log('DAV API Response:', response?.data);

                if (response?.data?.status === 1 || response?.data?.status === true) {
                    setInputModalVisible(false);
                    showToast(response?.data?.message || t('davSubmittedSuccessfully') || 'Digital address verification submitted successfully');
                    // Refresh profile data after successful submission
                    fetchProfileData();
                    fetchDavProfile();
                } else {
                    showToast(response?.data?.message || t('davSubmissionFailed') || 'Digital address verification submission failed');
                }
            } catch (error: any) {
                console.error('DAV Submission Error:', error);
                showToast(error?.response?.data?.message || t('somethingWentWrong') || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        } else {
            // Show Subscription Required Modal
            setInputModalVisible(false);
            setTimeout(() => {
                setSubscriptionModalVisible(true);
            }, 300);
        }
    };

    const _handleViewPlans = () => {
        setSubscriptionModalVisible(false);
        dispatch(subscriptionModalAction({ visible: true, upgradeOnly: true, minPrice: 499 }));
    };

    const _contactSupport = () => {
        Linking.openURL('tel:18001024558');
    };

    const _refreshPage = () => {
        fetchDavProfile();
        fetchProfileData();
    };

    const verificationStatus = (davProfile?.verification_status || '').toString().toLowerCase() || null;
    const isVerificationPending = verificationStatus === 'pending';
    const isVerificationVerified = verificationStatus === 'verified';
    const canSubmitVerification = !verificationStatus;

    useEffect(() => {
        if (profileLoading || davProfileLoading) return;
        if (!canSubmitVerification) return;
        if (hasAutoOpenedDavFormRef.current) return;

        hasAutoOpenedDavFormRef.current = true;
        if (profileCompletion !== undefined && profileCompletion !== null && Number(profileCompletion) < 100) {
            setProfileModalVisible(true);
            return;
        }
        setInputModalVisible(true);
    }, [profileLoading, davProfileLoading, canSubmitVerification, profileCompletion]);

    const _handleDownloadDavPdf = async () => {
        if (!davProfile?.pdf) {
            showToast(t('pdfNotAvailable') || 'PDF not available yet');
            return;
        }

        const isAbsoluteUrl = /^https?:\/\//i.test(davProfile.pdf);
        const pdfUrl = isAbsoluteUrl
            ? davProfile.pdf
            : `${BASE_URL}storage/app/public/${davProfile.pdf.replace(/^\/+/, '')}`;

        try {
            const canOpen = await Linking.canOpenURL(pdfUrl);
            if (!canOpen) {
                showToast(t('unableToOpenPdf') || 'Unable to open PDF');
                return;
            }
            await Linking.openURL(pdfUrl);
        } catch (error) {
            console.log('Error opening DAV PDF:', error);
            showToast(t('unableToOpenPdf') || 'Unable to open PDF');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

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

    // Input Field Component
    const InputField = ({
        label,
        icon,
        value,
        onChangeText,
        placeholder,
        keyboardType = 'default',
        maxLength,
        multiline = false,
        editable = true
    }: {
        label: string;
        icon: string;
        value: string;
        onChangeText: (text: string) => void;
        placeholder: string;
        keyboardType?: 'default' | 'phone-pad' | 'numeric';
        maxLength?: number;
        multiline?: boolean;
        editable?: boolean;
    }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', fontWeight: '600', marginBottom: 8 }}>
                {label} <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <View style={{
                flexDirection: 'row',
                alignItems: multiline ? 'flex-start' : 'center',
                backgroundColor: editable ? colors.white : '#F1F5F9',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#CBD5E1',
                paddingHorizontal: 14,
                paddingVertical: multiline ? 12 : 0
            }}>
                <Ionicons
                    name={icon}
                    size={22}
                    color="#64748B"
                    style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }}
                />
                <TextInput
                    style={{
                        flex: 1,
                        paddingVertical: multiline ? 0 : 14,
                        fontSize: responsiveFontSize(1.8),
                        color: editable ? '#0F172A' : '#64748B',
                        minHeight: multiline ? 80 : undefined,
                        textAlignVertical: multiline ? 'top' : 'center'
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    keyboardType={keyboardType}
                    value={value}
                    onChangeText={onChangeText}
                    maxLength={maxLength}
                    multiline={multiline}
                    editable={editable}
                />
            </View>
        </View>
    );


    // State
    const [profileModalVisible, setProfileModalVisible] = useState(false);



    const _handleCompleteProfile = () => {
        setProfileModalVisible(false);
        navigation.navigate(STACKS.PROFILE_OVERVIEW);
    };

    const _handleGoBackFromProfileModal = () => {
        setProfileModalVisible(false);
        navigation.goBack();
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <ScreenHeader
                title={t('digitalAddressCheckTitle') || 'Digital Address Check'}
                rightComponent={
                    <Pressable
                        onPress={_refreshPage}
                        hitSlop={hitSlop(10)}
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

            {profileLoading || davProfileLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.royalBlue} />
                    <Text style={{ marginTop: 12, color: '#64748B', fontSize: responsiveFontSize(1.8) }}>
                        {t('loadingProfile') || 'Loading details...'}
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(8) }} showsVerticalScrollIndicator={false}>

                    {/* Verified Status - Full Card */}
                    {isVerificationVerified && (
                        <View style={{ backgroundColor: '#ECFDF5', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), borderWidth: 1.5, borderColor: '#86EFAC' }}>
                            {/* Verified Badge */}
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="shield-checkmark" size={38} color="#FFFFFF" />
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: '800', color: '#166534', textAlign: 'center' }}>
                                    {t('davAddressVerified')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#15803D', textAlign: 'center', marginTop: 6, lineHeight: 22 }}>
                                    {t('davAddressVerifiedDesc')}
                                </Text>
                            </View>

                            {/* Verified Details */}
                            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0FDF4' }}>
                                    <Ionicons name="person-outline" size={18} color="#16A34A" style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('fullName') || 'Name'}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600' }}>{davProfile?.name || fullName || '-'}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0FDF4' }}>
                                    <Ionicons name="call-outline" size={18} color="#16A34A" style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('mobileNumber') || 'Mobile'}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600' }}>{davProfile?.mobile || mobileNumber || '-'}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0FDF4' }}>
                                    <Ionicons name="location-outline" size={18} color="#16A34A" style={{ marginRight: 10, marginTop: 2 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('davVerifiedAddress') || 'Verified Address'}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#0F172A', fontWeight: '600', lineHeight: 22 }}>{davProfile?.address || '-'}</Text>
                                    </View>
                                </View>
                                {davProfile?.address_type && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="document-text-outline" size={18} color="#16A34A" style={{ marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('addressType') || 'Address Type'}</Text>
                                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#0F172A', fontWeight: '600' }}>{davProfile.address_type}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Download PDF Button */}
                            <TouchableOpacity
                                onPress={_handleDownloadDavPdf}
                                disabled={!davProfile?.pdf}
                                style={{
                                    backgroundColor: davProfile?.pdf ? '#16A34A' : '#A7F3D0',
                                    paddingVertical: responsiveHeight(2),
                                    borderRadius: 14,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    ...shadow
                                }}
                            >
                                <Ionicons name="download-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                                <Text style={{ color: '#FFFFFF', fontSize: responsiveFontSize(2), fontWeight: '700' }}>
                                    {t('davDownloadPdf')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Pending Status - Full Card */}
                    {isVerificationPending && (
                        <View style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), borderWidth: 1.5, borderColor: '#FDE68A' }}>
                            {/* Pending Badge */}
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="hourglass-outline" size={38} color="#FFFFFF" />
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: '800', color: '#92400E', textAlign: 'center' }}>
                                    {t('davVerificationPending')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#B45309', textAlign: 'center', marginTop: 6, lineHeight: 22 }}>
                                    {t('davVerificationPendingDesc')}
                                </Text>
                            </View>

                            {/* Submitted Details */}
                            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#FEF3C7' }}>
                                    <Ionicons name="person-outline" size={18} color="#F59E0B" style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('fullName') || 'Name'}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600' }}>{davProfile?.name || fullName || '-'}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#FEF3C7' }}>
                                    <Ionicons name="call-outline" size={18} color="#F59E0B" style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('mobileNumber') || 'Mobile'}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600' }}>{davProfile?.mobile || mobileNumber || '-'}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <Ionicons name="location-outline" size={18} color="#F59E0B" style={{ marginRight: 10, marginTop: 2 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('currentAddress') || 'Address'}</Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#0F172A', fontWeight: '600', lineHeight: 22 }}>{davProfile?.address || '-'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* 24 Hours Time Note */}
                            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={22} color="#92400E" style={{ marginRight: 10 }} />
                                <Text style={{ flex: 1, fontSize: responsiveFontSize(1.6), color: '#92400E', fontWeight: '600', lineHeight: 22 }}>
                                    {t('davVerificationTime')}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 🏠 Hero Card */}
                    <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Ionicons name="location" size={30} color={colors.white} />
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                            {t('digitalAddressCheckTitle') || 'Digital Address Check'}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', textAlign: 'center', lineHeight: 26 }}>
                            {t('digitalAddressCheckDesc') || 'Verify your current address digitally for enhanced trust and credibility'}
                        </Text>
                    </View>

                    {/* 24 Hours Note for New Users */}
                    {canSubmitVerification && (
                        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: responsiveHeight(2), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}>
                            <Ionicons name="time-outline" size={24} color="#2563EB" style={{ marginRight: 12 }} />
                            <Text style={{ flex: 1, fontSize: responsiveFontSize(1.7), color: '#1E40AF', fontWeight: '600', lineHeight: 22 }}>
                                {t('davVerificationTime')}
                            </Text>
                        </View>
                    )}

                    {/* ❓ What is Digital Address Check */}
                    <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                        <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 10 }}>
                            {t('whatIsDigitalAddressCheck') || 'What is Digital Address Check?'}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', marginBottom: 10, lineHeight: 24 }}>
                            {t('davDescription') || 'Digital Address Verification (DAV) is a quick and secure way to verify your current residential address without physical documentation.'}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', fontStyle: 'italic', lineHeight: 23 }}>
                            {isTransporter
                                ? (t('davAvailabilityTransporter') || 'This feature is available for transporters with an active ₹499 TruckMitr subscription.')
                                : (t('davAvailability') || 'This feature is available for drivers with an active ₹499 TruckMitr subscription.')}
                        </Text>
                    </View>

                    {/* 📝 Pre-filled Information Preview - Only for new users */}
                    {canSubmitVerification && (
                        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155' }}>
                                    {t('yourDetails') || 'Your Details'}
                                </Text>
                                <TouchableOpacity onPress={() => navigation.navigate(STACKS.PROFILE_OVERVIEW)}>
                                    <Feather name="edit-2" size={18} color={colors.royalBlue} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                <Ionicons name="phone-portrait-outline" size={20} color="#2563EB" style={{ marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('mobileNumber') || 'Mobile Number'}</Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600' }}>{mobileNumber || '-'}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                <Ionicons name="person-outline" size={20} color="#2563EB" style={{ marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('fullName') || 'Full Name'}</Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600' }}>{fullName || '-'}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}>
                                <Ionicons name="home-outline" size={20} color="#2563EB" style={{ marginRight: 12, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('currentAddress') || 'Current Address'}</Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0F172A', fontWeight: '600', lineHeight: 24 }}>
                                        {[currentAddress, city, state, pincode].filter(Boolean).join(', ') || '-'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 🔄 How It Works - Only for new users */}
                    {canSubmitVerification && (
                        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                            <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 18 }}>{t('howItWorks') || 'How it works'}</Text>
                            {[
                                t('enterMobileNameAddress') || "Enter your mobile, name & address",
                                t('receiveVerificationCall') || "Receive a verification call",
                                t('getAddressVerificationLink') || "Get address verification link",
                                t('openLinkFillForm') || "Open link and fill the form",
                                t('submitToStartVerification') || "Submit to start verification"
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
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#059669', fontWeight: '600' }}>
                                    {t('resultsSentQuickly') || 'Results are shared quickly after submission'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 💳 Subscription Requirement - Only for new users */}
                    {canSubmitVerification && (
                        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                            <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#334155', marginBottom: 14 }}>
                                {t('subscriptionRequirement') || 'Subscription Requirement'}
                            </Text>
                            <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', marginBottom: 12 }}>
                                {t('davIncludedWith') || 'Digital Address Check is included with:'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                <Ionicons name="checkmark-circle" size={22} color="#16A34A" style={{ marginRight: 10 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', fontWeight: '600' }}>₹499 {t('plan') || 'Plan'}</Text>
                            </View>
                            <View style={{ backgroundColor: '#FFF7ED', padding: 14, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#F97316' }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#9A3412', lineHeight: 23 }}>
                                    {t('ensureSubscriptionActive') || 'Please ensure your subscription is active to use this feature.'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 🔐 Data Security */}
                    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#64748B" style={{ marginRight: 14 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#334155', marginBottom: 4 }}>{t('dataSecurity') || 'Data Security'}</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', lineHeight: 22 }}>
                                {t('dataSecurityDescAddress') || 'Your data is secure and used only for address verification purposes.'}
                            </Text>
                        </View>
                    </View>

                    {/* ☎️ Support */}
                    <TouchableOpacity onPress={_contactSupport} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveHeight(1.5) }}>
                        <Ionicons name="call-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>
                            {t('needHelp') || 'Need help?'} <Text style={{ fontWeight: '600', color: '#2563EB' }}>{t('contactTruckMitrSupport') || 'Contact TruckMitr Support'}</Text>
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            )}

            {/* 📌 Sticky CTA Button - Only for new users */}
            {canSubmitVerification && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), paddingBottom: responsiveHeight(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                    <TouchableOpacity
                        onPress={_handleStartCheck}
                        disabled={profileLoading || davProfileLoading}
                        style={{
                            backgroundColor: (profileLoading || davProfileLoading) ? '#CBD5E1' : colors.royalBlue,
                            paddingVertical: responsiveHeight(2),
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.2), fontWeight: 'bold' }}>
                            {t('startDigitalAddressCheck') || 'Start Digital Address Check'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 🪟 Input Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={inputModalVisible}
                onRequestClose={() => {
                    if (!loading) setInputModalVisible(false);
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onPress={() => !loading && setInputModalVisible(false)}
                >
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                            <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>
                                {/* Header */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: 'bold', color: '#001F3F' }}>
                                        Digital Address Verification
                                    </Text>
                                    {!loading && (
                                        <TouchableOpacity onPress={() => setInputModalVisible(false)} hitSlop={hitSlop(10)}>
                                            <Ionicons name="close" size={24} color="#64748B" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Loader View */}
                                {loading ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                        <ActivityIndicator size="large" color={colors.royalBlue} style={{ marginBottom: 16 }} />
                                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#001F3F', marginBottom: 4 }}>
                                            Submitting details...
                                        </Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>
                                            Please wait
                                        </Text>
                                    </View>
                                ) : (
                                    <View>
                                        {/* Auto-filled Details Preview */}
                                        <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                                            <Text style={{ fontSize: responsiveFontSize(1.4), fontWeight: '600', color: '#64748B', marginBottom: 10 }}>
                                                Profile Details (Auto-filled)
                                            </Text>
                                            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', width: 70 }}>ID:</Text>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#0F172A', fontWeight: '600', flex: 1 }}>{uniqueId || '-'}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', width: 70 }}>Name:</Text>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#0F172A', fontWeight: '600', flex: 1 }}>{fullName || '-'}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', width: 70 }}>Mobile:</Text>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#0F172A', fontWeight: '600', flex: 1 }}>{mobileNumber || '-'}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', width: 70 }}>Address:</Text>
                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#0F172A', fontWeight: '600', flex: 1, lineHeight: 20 }}>
                                                    {[currentAddress, city, state, pincode].filter(Boolean).join(', ') || '-'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Address Type - Radio Buttons */}
                                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '600', marginBottom: 12 }}>
                                            {t('addressType') || 'Address Type'} <Text style={{ color: 'red' }}>*</Text>
                                        </Text>

                                        {/* Permanent Address Option */}
                                        <TouchableOpacity
                                            onPress={() => setAddressType('Permanent')}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: addressType === 'Permanent' ? '#EFF6FF' : '#F8FAFC',
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                borderColor: addressType === 'Permanent' ? colors.royalBlue : '#E2E8F0',
                                                padding: 16,
                                                marginBottom: 10
                                            }}
                                        >
                                            <View style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 11,
                                                borderWidth: 2,
                                                borderColor: addressType === 'Permanent' ? colors.royalBlue : '#CBD5E1',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 12
                                            }}>
                                                {addressType === 'Permanent' && (
                                                    <View style={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: 6,
                                                        backgroundColor: colors.royalBlue
                                                    }} />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#0F172A', fontWeight: '600' }}>
                                                    {t('permanentAddress') || 'Permanent Address'}
                                                </Text>
                                                <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', marginTop: 2 }}>
                                                    {t('permanentAddressDesc') || 'Address as per official documents'}
                                                </Text>
                                            </View>
                                            {addressType === 'Permanent' && (
                                                <Ionicons name="checkmark-circle" size={22} color={colors.royalBlue} />
                                            )}
                                        </TouchableOpacity>

                                        {/* Current Address Option */}
                                        <TouchableOpacity
                                            onPress={() => setAddressType('Current')}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: addressType === 'Current' ? '#EFF6FF' : '#F8FAFC',
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                borderColor: addressType === 'Current' ? colors.royalBlue : '#E2E8F0',
                                                padding: 16,
                                                marginBottom: 16
                                            }}
                                        >
                                            <View style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 11,
                                                borderWidth: 2,
                                                borderColor: addressType === 'Current' ? colors.royalBlue : '#CBD5E1',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 12
                                            }}>
                                                {addressType === 'Current' && (
                                                    <View style={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: 6,
                                                        backgroundColor: colors.royalBlue
                                                    }} />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#0F172A', fontWeight: '600' }}>
                                                    {t('currentAddress') || 'Current Address'}
                                                </Text>
                                                <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', marginTop: 2 }}>
                                                    {t('currentAddressDesc') || 'Where you currently reside'}
                                                </Text>
                                            </View>
                                            {addressType === 'Current' && (
                                                <Ionicons name="checkmark-circle" size={22} color={colors.royalBlue} />
                                            )}
                                        </TouchableOpacity>

                                        {/* Info Note */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                            <Ionicons name="information-circle-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                                            <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', flex: 1 }}>
                                                {t('addressTypeInfo') || 'Select the address type you want to verify'}
                                            </Text>
                                        </View>

                                        {/* Submit Button */}
                                        <TouchableOpacity
                                            onPress={_handleSubmit}
                                            style={{
                                                backgroundColor: colors.royalBlue,
                                                paddingVertical: 14,
                                                borderRadius: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontSize: responsiveFontSize(1.8), fontWeight: 'bold' }}>
                                                {t('submitForVerification') || 'Submit for Verification'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>

            {/* 🔐 Subscription Required Modal */}
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
                        <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: '#001F3F', marginBottom: 8, textAlign: 'center' }}>
                            {t('subscriptionRequired') || 'Subscription Required'}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', textAlign: 'center', marginBottom: 24 }}>
                            {isTransporter
                                ? (t('davAvailableForTransporterPro') || 'Digital Address Check is available only for ₹499 plan.')
                                : (t('davAvailableForTransporterPro') || 'Digital Address Check is available only for the ₹499 plan.')}
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
                    </View>
                </View>
            </Modal>

            {/* ⚠️ Profile Completion Required Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={profileModalVisible}
                onRequestClose={_handleGoBackFromProfileModal}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <MaterialCommunityIcons name="account-alert-outline" size={32} color="#2563EB" />
                        </View>
                        <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: '#001F3F', marginBottom: 8, textAlign: 'center' }}>
                            {t('completeProfileTitle') || 'Complete Your Profile'}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', textAlign: 'center', marginBottom: 24 }}>
                            {t('completeProfileDescDav') || 'Please complete your profile details (100%) to access the Digital Address Check feature.'}
                        </Text>

                        <TouchableOpacity
                            onPress={_handleCompleteProfile}
                            style={{ backgroundColor: colors.royalBlue, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
                        >
                            <Text style={{ color: 'white', fontSize: responsiveFontSize(1.8), fontWeight: 'bold' }}>{t('completeProfile') || 'Complete Profile'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={_handleGoBackFromProfileModal}
                            style={{ paddingVertical: 10 }}
                        >
                            <Text style={{ color: '#64748B', fontSize: responsiveFontSize(1.8), fontWeight: '600' }}>{t('goBack') || 'Go Back'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default DigitalAddressCheckInfo;


