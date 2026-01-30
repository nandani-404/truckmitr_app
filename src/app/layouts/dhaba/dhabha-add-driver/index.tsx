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

export default function DhabhaAddDriver() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize } = useResponsiveScale();
    useStatusBarStyle('dark-content');

    // State
    const [referralCode, setReferralCode] = useState('TM2024DH001');
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');

    // State Dropdown
    const [state, setState] = useState('');
    const [selectedStateName, setSelectedStateName] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [isStateModalVisible, setIsStateModalVisible] = useState(false);
    const [stateSearchText, setStateSearchText] = useState('');

    // OTP
    const otpInputRef = useRef<TextInput>(null);
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [timer, setTimer] = useState(30);
    const [showOtpConfirmModal, setShowOtpConfirmModal] = useState(false);
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

    const handleSendOtp = () => {
        if (!validateForm()) return;
        if (mobileNumber === '9999999999') {
            setErrors({ mobile: t('mobileAlreadyRegistered') });
            return;
        }
        setShowOtpConfirmModal(true);
    };

    const confirmSendOtp = () => {
        setShowOtpConfirmModal(false);
        setIsOtpSent(true);
        setTimer(30);
        // Delay focus slightly to ensure modal closes and input is ready
        setTimeout(() => {
            otpInputRef.current?.focus();
        }, 500);
    };

    const handleVerify = () => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            if (otp.length === 6) {
                setShowSuccessModal(true);
            } else {
                showToast(t('invalidOtp'));
            }
        }, 1500);
    };

    useEffect(() => {
        let interval: any;
        if (isOtpSent && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isOtpSent, timer]);

    const resetForm = () => {
        setShowSuccessModal(false);
        setFullName('');
        setMobileNumber('');
        setEmail('');
        setState('');
        setSelectedStateName('');
        setIsOtpSent(false);
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
                        editable={!isOtpSent}
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
                            editable={!isOtpSent}
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
                        editable={!isOtpSent}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>{t('state')}</Text>
                    <TouchableOpacity
                        onPress={() => !isOtpSent && setIsStateModalVisible(true)}
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

                {/* OTP Section - Overlay Input Method */}
                {isOtpSent && (
                    <View style={styles.otpSection}>
                        <Text style={styles.otpLabel}>{t('enterOtp')}</Text>
                        <Text style={styles.otpSubLabel}>{t('sentTo')} +91 {mobileNumber}</Text>

                        <View style={styles.otpContainer}>
                            {/* Visual Boxes */}
                            <View style={styles.otpBoxesContainer}>
                                {[...Array(6)].map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.otpBox,
                                            otp.length === i && styles.otpBoxActive,
                                            otp.length > i && styles.otpBoxFilled
                                        ]}
                                    >
                                        <Text style={styles.otpBoxText}>{otp[i] || ''}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Transparent Overlay Input */}
                            <TextInput
                                ref={otpInputRef}
                                style={styles.hiddenOtpInput}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={(text) => {
                                    if (/^\d*$/.test(text)) {
                                        setOtp(text);
                                        // Auto-verify optional
                                        if (text.length === 6) {
                                            // Keyboard.dismiss();
                                        }
                                    }
                                }}
                                autoFocus
                                // Only hide caret/context menu if needed, but opacity 0 does it mostly
                                caretHidden={true}
                                contextMenuHidden={true}
                            />
                        </View>

                        <View style={styles.timerRow}>
                            <Text style={styles.timerText}>
                                {timer > 0 ? `${t('resendIn')} 00:${timer < 10 ? `0${timer}` : timer}` : ''}
                            </Text>
                            {timer === 0 && (
                                <TouchableOpacity onPress={() => { setTimer(30); }}>
                                    <Text style={styles.resendLink}>{t('resendOtp')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

            </KeyboardAwareScrollView>

            {/* Bottom Button */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
                {!isOtpSent ? (
                    <TouchableOpacity
                        style={[styles.mainButton, { opacity: (fullName && mobileNumber && state) ? 1 : 0.5 }]}
                        onPress={handleSendOtp}
                        disabled={!(fullName && mobileNumber && state)}
                    >
                        <Text style={styles.mainButtonText}>{t('getOtp')}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.mainButton, { opacity: otp.length === 6 ? 1 : 0.5 }]}
                        onPress={handleVerify}
                        disabled={isVerifying || otp.length < 6}
                    >
                        {isVerifying ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.mainButtonText}>{t('verifyAndAddDriver')}</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* OTP Confirmation Modal - Clean */}
            <Modal transparent visible={showOtpConfirmModal} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.alertBox}>
                        <Text style={styles.alertTitle}>{t('confirmNumber')}</Text>
                        <Text style={styles.alertMessage}>
                            {t('sendOtpTo')} <Text style={{ fontWeight: '700', color: '#1F2937' }}>+91 {mobileNumber}</Text>?
                        </Text>
                        <View style={styles.alertButtons}>
                            <TouchableOpacity onPress={() => setShowOtpConfirmModal(false)} style={styles.alertBtnCancel}>
                                <Text style={styles.alertBtnTextCancel}>{t('edit')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmSendOtp} style={styles.alertBtnConfirm}>
                                <Text style={styles.alertBtnTextConfirm}>{t('send')}</Text>
                            </TouchableOpacity>
                        </View>
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
                                onPress={() => navigation.goBack()}
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

    // OTP
    otpSection: { marginTop: 16, alignItems: 'center' },
    otpLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    otpSubLabel: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
    otpContainer: { width: '100%', alignItems: 'center', marginBottom: 16, justifyContent: 'center' },
    otpBoxesContainer: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    otpBox: {
        width: 45,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpBoxActive: {
        borderColor: '#EA580C',
        backgroundColor: '#FFF7ED',
        borderWidth: 1.5,
    },
    otpBoxFilled: {
        borderColor: '#EA580C',
        backgroundColor: '#FFF',
    },
    otpBoxText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    hiddenOtpInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        zIndex: 20,
    },
    timerRow: { marginTop: 0, flexDirection: 'row', justifyContent: 'center' },
    timerText: { fontSize: 13, color: '#6B7280' },
    resendLink: { fontSize: 13, color: '#EA580C', fontWeight: '600' },

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

    // Alerts
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    alertBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center' },
    alertTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
    alertMessage: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 24 },
    alertButtons: { flexDirection: 'row', width: '100%', gap: 12 },
    alertBtnCancel: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center' },
    alertBtnConfirm: { flex: 1, padding: 12, backgroundColor: '#EA580C', borderRadius: 8, alignItems: 'center' },
    alertBtnTextCancel: { color: '#374151', fontWeight: '500' },
    alertBtnTextConfirm: { color: '#FFF', fontWeight: '600' },

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
});
