import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    FlatList,
    Alert,
    Platform,
    Animated,
    TouchableWithoutFeedback
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { hitSlop } from '@truckmitr/src/app/functions';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DhabhaAddDriver() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();
    useStatusBarStyle('dark-content');

    // Redux State
    const { user } = useSelector((state: any) => state.user);
    // console.log('userData', user);

    const referralCode = user?.Referral_Code || 'TM2024DH001';

    // State
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');

    // State Dropdown
    const [state, setState] = useState('');
    const [selectedStateName, setSelectedStateName] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [isStateModalVisible, setIsStateModalVisible] = useState(false);
    const [stateSearchText, setStateSearchText] = useState('');

    // OTP Modal State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [pendingDriverData, setPendingDriverData] = useState<{
        name: string;
        mobile: string;
        email: string;
        states: string;
        stateName: string;
    } | null>(null);

    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Animation values for Success Modal
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (showSuccessModal) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [showSuccessModal]);

    const isValidMobile = (num: string) => /^[6-9]\d{9}$/.test(num);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.GETSTATES);
            if (response?.data?.status && Array.isArray(response?.data?.data)) {
                setLocations(response?.data?.data);
            } else {
                setLocations([]);
            }
        } catch (error) {
            console.log('Error fetching locations:', error);
            setLocations([]);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!fullName.trim()) newErrors.name = t('nameIsRequired');
        if (!mobileNumber.trim()) newErrors.mobile = t('mobileIsRequired');
        else if (!isValidMobile(mobileNumber)) newErrors.mobile = t('invalidMobileNumber');
        if (!state.trim()) newErrors.state = t('stateIsRequired');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', fullName);
            formData.append('mobile', mobileNumber);
            if (email) formData.append('email', email);
            formData.append('states', state);
            // formData.append('role', 'dhaba'); // Assuming role is handled by backend or implied

            const response = await axiosInstance.post(END_POINTS.DHABA_ADD_DRIVER, formData);

            if (response?.data?.status || response?.data?.success) {
                const message = response?.data?.message?.toLowerCase() || '';
                if (message.includes('otp')) {
                    setPendingDriverData({
                        name: fullName,
                        mobile: mobileNumber,
                        email: email,
                        states: state,
                        stateName: selectedStateName,
                    });
                    setShowOtpModal(true);
                    showToast(response?.data?.message || t('otpSent'));
                } else {
                    const successMessage = response?.data?.message || t('driverAddedSuccessfully');
                    showToast(`${successMessage}`);
                    setShowSuccessModal(true);
                }
            } else {
                const errorMessage = response?.data?.message || t('failedToAddDriver');
                showToast(`${errorMessage}`);
            }
        } catch (error: any) {
            console.log('Error adding driver:', error);
            const errorMessage = error?.response?.data?.message || error?.message || t('oopsSomethingWentWrong');
            showToast(`${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setOtpError(t('pleaseEnterValidOtp'));
            return;
        }

        if (!pendingDriverData) {
            setOtpError(t('oopsSomethingWentWrong'));
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const formData = new FormData();
            formData.append('mobile', pendingDriverData.mobile);
            formData.append('otp', otp);

            const response = await axiosInstance.post(END_POINTS.OTP_VERIFY, formData);

            if (response?.data?.status || response?.data?.success) {
                const successMessage = response?.data?.message || t('driverAddedSuccessfully');
                showToast(`${successMessage}`);

                setShowOtpModal(false);
                setShowSuccessModal(true);
                setOtp('');
                setOtpError('');
                setPendingDriverData(null);
            } else {
                const errorMessage = response?.data?.message || t('invalidOtp');
                setOtpError(errorMessage);
            }
        } catch (error: any) {
            console.log('Error verifying OTP:', error);
            const errorMessage = error?.response?.data?.message || error?.message || t('otpVerificationFailed');
            setOtpError(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleCloseOtpModal = () => {
        setShowOtpModal(false);
        setOtp('');
        setOtpError('');
    };

    const resetForm = () => {
        setShowSuccessModal(false);
        setFullName('');
        setMobileNumber('');
        setEmail('');
        setState('');
        setSelectedStateName('');
        setOtp('');
    };

    return (
        <View style={styles.container}>
            {/* Minimal Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={hitSlop(10)}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('addDriver')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === 'ios' ? 50 : 100}
                showsVerticalScrollIndicator={false}
            >

                {/* Clean Referral Banner */}
                <View style={styles.referralBanner}>
                    <Ionicons name="ticket-outline" size={18} color="#EA580C" />
                    <Text style={styles.referralText}>
                        {t('referralCode')}: <Text style={{ fontWeight: '700' }}>{referralCode}</Text> {t('applied')}
                    </Text>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                </View>

                {/* Form Fields - Minimal Style */}
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>{t('fullName')}</Text>
                    <TextInput
                        style={[styles.minimalInput, errors.name && styles.inputError]}
                        placeholder={t('driversName')}
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>{t('mobileNumber')}</Text>
                    <View style={[styles.minimalInput, styles.phoneInputContainer, errors.mobile && styles.inputError]}>
                        <Text style={styles.phonePrefix}>+91</Text>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder={t('enter10DigitNumber')}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={mobileNumber}
                            onChangeText={setMobileNumber}
                        />
                    </View>
                    <Text style={styles.fieldError}>{errors.mobile}</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>{t('email')} <Text style={{ fontWeight: '400', color: '#9CA3AF' }}>({t('optional')})</Text></Text>
                    <TextInput
                        style={styles.minimalInput}
                        placeholder="driver@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>{t('state')}</Text>
                    <TouchableOpacity
                        onPress={() => setIsStateModalVisible(true)}
                        style={[styles.minimalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, errors.state && styles.inputError]}
                        activeOpacity={0.7}
                    >
                        <Text style={selectedStateName ? styles.inputText : styles.placeholderText}>
                            {selectedStateName || t('selectState')}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <Text style={styles.fieldError}>{errors.state}</Text>
                </View>



            </KeyboardAwareScrollView>

            {/* Bottom Button */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.mainButton, { opacity: (fullName && mobileNumber && state) ? 1 : 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!(fullName && mobileNumber && state) || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.mainButtonText}>{t('addDriver')}</Text>
                    )}
                </TouchableOpacity>
                {/* <TouchableOpacity
                    onPress={async () => {
                        try {
                            const keys = await AsyncStorage.getAllKeys();
                            const result = await AsyncStorage.multiGet(keys);
                            console.log('\n========== AsyncStorage Data ==========');
                            result.forEach(([key, value]) => {
                                console.log(`\n[${key}]:`, value);
                            });
                            console.log('\n========================================\n');
                            Alert.alert('AsyncStorage Logged', `${keys.length} keys logged to console. Check your terminal/debugger.`);
                        } catch (error) {
                            console.error('Error reading AsyncStorage:', error);
                            Alert.alert('Error', 'Failed to read AsyncStorage');
                        }
                    }}
                    style={{
                        marginHorizontal: 16,
                        marginTop: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: '#FF9800',
                        borderRadius: 8,
                        alignItems: 'center',
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                        🐛 Log AsyncStorage Data
                    </Text>
                </TouchableOpacity> */}
            </View>

            {/* OTP Verification Modal */}
            <Modal
                visible={showOtpModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseOtpModal}
            >
                <View style={styles.otpModalOverlay}>
                    <View style={styles.otpModalContainer}>
                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={handleCloseOtpModal}
                            style={styles.otpCloseButton}
                            hitSlop={hitSlop(10)}
                        >
                            <Ionicons name="close" size={24} color={'#1F2937'} />
                        </TouchableOpacity>

                        {/* OTP Icon */}
                        <View style={styles.otpIconContainer}>
                            <MaterialCommunityIcons name="message-text-lock" size={48} color={'#EA580C'} />
                        </View>

                        {/* Title */}
                        <Text style={styles.otpTitle}>
                            {t('verifyOtp')}
                        </Text>

                        {/* Subtitle with phone number */}
                        <Text style={styles.otpSubtitle}>
                            {t('pleaseEnterOtpFor') || 'Please enter the 6-digit code sent to'}{'\n'}
                            <Text style={styles.otpPhoneNumber}>+91 {pendingDriverData?.mobile}</Text>
                        </Text>

                        {/* OTP Input */}
                        <View style={styles.otpInputContainer}>
                            <TextInput
                                value={otp}
                                onChangeText={(text) => {
                                    setOtp(text.replace(/[^0-9]/g, ''));
                                    if (otpError) setOtpError('');
                                }}
                                placeholder={t('enterOtp') || 'Enter 6-digit OTP'}
                                placeholderTextColor={'#9CA3AF'}
                                keyboardType="number-pad"
                                maxLength={6}
                                style={styles.otpInput}
                                autoFocus={true}
                            />
                        </View>

                        {/* Error Message */}
                        {otpError ? (
                            <Text style={styles.otpErrorText}>{otpError}</Text>
                        ) : null}

                        {/* Verify Button */}
                        <TouchableOpacity
                            onPress={handleVerifyOtp}
                            disabled={otpLoading || otp.length < 6}
                            style={[
                                styles.otpVerifyButton,
                                (otpLoading || otp.length < 6) && styles.otpVerifyButtonDisabled
                            ]}
                            activeOpacity={0.8}
                        >
                            {otpLoading ? (
                                <ActivityIndicator color={'#FFFFFF'} size="small" />
                            ) : (
                                <Text style={styles.otpVerifyButtonText}>
                                    {t('verifyAndAddDriver')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend OTP */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={otpLoading}
                            style={styles.resendButton}
                        >
                            <Text style={styles.resendText}>
                                {t('didntReceiveCode') || "Didn't receive code?"}{' '}
                                <Text style={styles.resendLink}>{t('resendOtp')}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Enhanced Success Modal */}
            <Modal transparent visible={showSuccessModal} animationType="fade">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.enhancedModalContent,
                        { transform: [{ scale: scaleAnim }] }
                    ]}>
                        <View style={styles.successIconContainer}>
                            <View style={styles.successRing1}>
                                <View style={styles.successRing2}>
                                    <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.enhancedTitle}>{t('driverRegistered')}</Text>
                        <Text style={styles.enhancedMessage}>
                            <Text style={{ fontWeight: '700', color: '#111827' }}>{fullName}</Text> {t('hasBeenSuccessfullyAdded')}
                        </Text>

                        {/* Reward Card */}
                        <View style={styles.rewardCard}>
                            <View style={styles.rewardIconBg}>
                                <Ionicons name="wallet" size={20} color="#EA580C" />
                            </View>
                            <View style={styles.rewardTextContainer}>
                                <Text style={styles.rewardLabel}>{t('walletCredit')}</Text>
                                <Text style={styles.rewardAmount}>{t('tenRupeesPending')}</Text>
                            </View>
                            <Ionicons name="time-outline" size={18} color="#F59E0B" />
                        </View>

                        <View style={styles.enhancedActions}>
                            <TouchableOpacity
                                style={styles.enhancedPrimaryBtn}
                                onPress={resetForm}
                            >
                                <Ionicons name="person-add" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.enhancedPrimaryBtnText}>{t('addAnotherDriver')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.enhancedSecondaryBtn}
                                onPress={resetForm}
                            >
                                <Text style={styles.enhancedSecondaryBtnText}>{t('done')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* State Selection Modal - Clean */}
            <Modal
                visible={isStateModalVisible}
                animationType="slide"
                onRequestClose={() => setIsStateModalVisible(false)}
            >
                <View style={styles.stateModalContainer}>
                    <View style={[styles.stateModalHeader, { paddingTop: safeAreaInsets.top + 10 }]}>
                        <TouchableOpacity
                            onPress={() => {
                                setIsStateModalVisible(false);
                                setStateSearchText('');
                            }}
                            hitSlop={hitSlop(10)}
                        >
                            <Ionicons name="close" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.stateModalTitle}>{t('selectState')}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.searchBarContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            value={stateSearchText}
                            onChangeText={setStateSearchText}
                            placeholder={t('search')}
                            placeholderTextColor="#9CA3AF"
                            style={styles.searchInput}
                        />
                        {stateSearchText.length > 0 && (
                            <TouchableOpacity onPress={() => setStateSearchText('')}>
                                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={locations.filter(item =>
                            item.name.toLowerCase().includes(stateSearchText.toLowerCase())
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        renderItem={({ item }) => {
                            const isSelected = state === item.id.toString();
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        setState(item.id.toString());
                                        setSelectedStateName(item.name);
                                        // setErrors(prev => ({ ...prev, state: undefined }));
                                        setIsStateModalVisible(false);
                                        setStateSearchText('');
                                    }}
                                    style={styles.stateItem}
                                >
                                    <Text style={[styles.stateText, isSelected && styles.stateTextSelected]}>
                                        {item.name}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark" size={20} color="#EA580C" />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

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

    // Content
    content: { padding: 24 },

    // Referral Banner
    referralBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FFEDD5'
    },
    referralText: { fontSize: 13, color: '#EA580C', flex: 1 },

    // Form
    formGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
    minimalInput: {
        height: 50,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1F2937'
    },
    phoneInputContainer: { flexDirection: 'row', alignItems: 'center' },
    phonePrefix: { fontSize: 15, fontWeight: '600', color: '#374151', marginRight: 12 },
    phoneInput: { flex: 1, height: '100%', fontSize: 15, color: '#1F2937' },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4, height: 16 },

    inputText: { fontSize: 15, color: '#1F2937' },
    placeholderText: { fontSize: 15, color: '#9CA3AF' },



    // Footer
    footer: { padding: 24, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    mainButton: {
        backgroundColor: '#EA580C',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },



    // Enhanced Success Modal
    enhancedModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%' },
    successIconContainer: { marginBottom: 20 },
    successRing1: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
    successRing2: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    enhancedTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
    enhancedMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },

    rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', padding: 16, borderRadius: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#FFEDD5' },
    rewardIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rewardTextContainer: { flex: 1 },
    rewardLabel: { fontSize: 12, color: '#EA580C', fontWeight: '600', textTransform: 'uppercase' },
    rewardAmount: { fontSize: 16, fontWeight: '700', color: '#1F2937' },

    enhancedActions: { width: '100%', gap: 12 },
    enhancedPrimaryBtn: { flexDirection: 'row', width: '100%', height: 50, backgroundColor: '#16A34A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
    enhancedPrimaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    enhancedSecondaryBtn: { width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' },
    enhancedSecondaryBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 16 },

    // State Modal
    stateModalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    stateModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    stateModalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
    searchBarContainer: { margin: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1F2937' },
    stateItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    stateText: { fontSize: 15, color: '#374151' },
    stateTextSelected: { fontSize: 15, color: '#EA580C', fontWeight: '600' },

    // OTP Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    otpModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    otpModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    otpCloseButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        padding: 4,
    },
    otpIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    otpTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    otpSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    otpPhoneNumber: {
        fontWeight: '700',
        color: '#1F2937',
    },
    otpInputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    otpInput: {
        width: '100%',
        height: 54,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        color: '#1F2937',
        textAlign: 'center',
        letterSpacing: 4,
        backgroundColor: '#F9FAFB',
    },
    otpErrorText: {
        fontSize: 13,
        color: '#EF4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    otpVerifyButton: {
        width: '100%',
        height: 52,
        backgroundColor: '#EA580C',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    otpVerifyButtonDisabled: {
        backgroundColor: '#FDBA74',
        shadowOpacity: 0,
    },
    otpVerifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        paddingVertical: 8,
    },
    resendText: {
        fontSize: 14,
        color: '#6B7280',
    },
    resendLink: {
        color: '#EA580C',
        fontWeight: '600',
    },
});
