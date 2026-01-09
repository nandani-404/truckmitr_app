import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';

const DriverLoan = () => {
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();

    // PAN State
    const [panNumber, setPanNumber] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const _goBack = () => navigation.goBack();

    const validatePan = (pan: string) => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan.toUpperCase());
    };

    const handleUploadPan = () => {
        if (!panNumber.trim()) {
            Alert.alert(t('required'), t('pleaseEnterPan'));
            return;
        }

        if (!validatePan(panNumber)) {
            Alert.alert(t('invalidPan'), t('pleaseEnterValidPan'));
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setShowSuccessModal(true);
        }, 1500);
    };

    // Benefit Item Component (Same as ID Check)
    const BenefitItem = ({ text }: { text: string }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveHeight(1.2) }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="checkmark" size={14} color="#16A34A" />
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155' }}>{text}</Text>
        </View>
    );

    // Bullet Item Component
    const BulletItem = ({ text }: { text: string }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: responsiveHeight(1) }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB', marginRight: 10, marginTop: 6 }} />
            <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', flex: 1 }}>{text}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header (Same as ID Check) */}
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
                    {t('driverLoanTitle')}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(14) }} showsVerticalScrollIndicator={false}>

                {/* 🚛 1️⃣ Hero Card (Same Visual Weight as ID Check) */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center', ...shadow, shadowColor: 'rgba(0,0,0,0.08)' }}>
                    {/* Coming Soon Badge */}
                    <View style={{ backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '700', color: colors.white }}>🔥 {t('comingSoon')}</Text>
                    </View>

                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 28 }}>🚛</Text>
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 6 }}>
                        {t('truckMitrDriverLoan')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('driverLoanHeroDesc')}
                    </Text>

                    {/* Sub-line */}
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#CBD5E1', width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', textAlign: 'center', fontStyle: 'italic' }}>
                            {t('noAgentsNoConfusion')}
                        </Text>
                    </View>
                </View>

                {/* 💡 2️⃣ What is TruckMitr Driver Loan (Same as Why ID Check?) */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 8 }}>{t('whatIsDriverLoanTitle')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', lineHeight: responsiveFontSize(2.6) }}>
                        {t('whatIsDriverLoanDesc')}
                    </Text>
                    <View style={{ backgroundColor: '#EAF3FF', padding: 10, borderRadius: 8, marginTop: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#2563EB', fontWeight: '600', textAlign: 'center' }}>
                            💪 {t('builtForDrivers')}
                        </Text>
                    </View>
                </View>

                {/* 🪪 3️⃣ Why PAN Is Required */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 8 }}>{t('whyPanRequired')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', lineHeight: responsiveFontSize(2.6), marginBottom: 12 }}>
                        {t('panMandatoryDesc')}
                    </Text>

                    <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '600', color: '#334155', marginBottom: 10 }}>{t('panHelpsUsTo')}</Text>

                    <BenefitItem text={t('verifyIdentity')} />
                    <BenefitItem text={t('checkLoanEligibility')} />
                    <BenefitItem text={t('connectTrustedPartners')} />
                    <BenefitItem text={t('ensureFasterProcessing')} />

                    {/* Warning Note */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8 }}>
                        <Ionicons name="warning" size={18} color="#D97706" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#92400E', fontWeight: '600', fontSize: responsiveFontSize(1.8), flex: 1 }}>{t('loanApprovalNotPossible')}</Text>
                    </View>
                </View>

                {/* 🚀 4️⃣ How Sharing PAN Helps You */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 16 }}>{t('howSharingPanHelps')}</Text>
                    <BenefitItem text={t('higherApprovalChances')} />
                    <BenefitItem text={t('fasterProcessing')} />
                    <BenefitItem text={t('betterLoanOffers')} />
                    <BenefitItem text={t('trustedSecureVerification')} />

                    {/* Supporting Line */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#EAF3FF', padding: 10, borderRadius: 8 }}>
                        <Ionicons name="information-circle" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#1E40AF', fontSize: responsiveFontSize(1.7), flex: 1 }}>{t('panUsageNote')}</Text>
                    </View>
                </View>

                {/* 📄 PAN Input Section */}
                <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 10, textAlign: 'left' }}>{t('uploadYourPan')}</Text>

                <View style={{ marginBottom: responsiveHeight(2) }}>
                    {/* PAN Number Input */}
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#334155', fontWeight: '600', marginBottom: 6 }}>{t('panNumber')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12 }}>
                            <Ionicons name="card-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, paddingVertical: 12, fontSize: responsiveFontSize(2.0), color: '#0F172A', letterSpacing: 2 }}
                                placeholder={t('enterPanPlaceholder')}
                                placeholderTextColor="#94A3B8"
                                value={panNumber}
                                onChangeText={(text) => setPanNumber(text.toUpperCase())}
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                            {panNumber.length === 10 && validatePan(panNumber) && (
                                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                            )}
                        </View>
                    </View>
                </View>

                {/* 🔒 5️⃣ Data Security (Same Trust Card as ID Check) */}
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="lock-closed" size={20} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '700', color: '#166534', marginBottom: 8 }}>🔒 {t('yourDataIsSafe')}</Text>
                        <BulletItem text={t('panEncrypted')} />
                        <BulletItem text={t('usedForEligibility')} />
                        <BulletItem text={t('sharedWithPartners')} />

                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#BBF7D0' }}>
                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#15803D', fontStyle: 'italic' }}>
                                {t('privacyStandards')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ⏳ 6️⃣ Be Ready (Preparation Card) */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#8B5CF6' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 8 }}>⏳ {t('beReady')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', marginBottom: 12 }}>{t('uploadPanNowTo')}</Text>
                    <BenefitItem text={t('stayEligibleLoanOffers')} />
                    <BenefitItem text={t('earlyAccessLoans')} />
                    <BenefitItem text={t('avoidDelays')} />
                </View>

                {/* 📢 7️⃣ Brand Message (Footer Text) */}
                <View style={{ backgroundColor: '#1E3A5F', borderRadius: 12, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>📢</Text>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: colors.white, marginBottom: 4 }}>{t('truckMitrDriverLoan')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#93C5FD', fontStyle: 'italic' }}>"{t('loanTagline')}"</Text>
                </View>

            </ScrollView>

            {/* 📌 8️⃣ Sticky CTA Button (Same as ID Check) */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                <TouchableOpacity
                    onPress={handleUploadPan}
                    disabled={isSubmitting}
                    style={{ backgroundColor: isSubmitting ? '#94A3B8' : colors.royalBlue, paddingVertical: responsiveHeight(1.8), borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                    <Ionicons name="card" size={20} color={colors.white} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.2), fontWeight: 'bold' }}>
                        {isSubmitting ? t('submitting') : t('uploadPanToGetAccess')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: colors.white, borderRadius: 20, width: '100%', maxWidth: 340, padding: 24, alignItems: 'center', ...shadow }}>
                        {/* Success Icon */}
                        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
                        </View>

                        <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: '700', color: '#001F3F', marginBottom: 8, textAlign: 'center' }}>
                            {t('panUploadedSuccessfully')} 🎉
                        </Text>

                        <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', textAlign: 'center', lineHeight: responsiveFontSize(2.6), marginBottom: 16 }}>
                            {t('youAreAllSet')}
                        </Text>

                        {/* Coming Soon Notice */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginBottom: 20, width: '100%', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 18, marginRight: 8 }}>⏳</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.8), color: '#92400E' }}>
                                {t('loanFeatureComingSoon')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShowSuccessModal(false);
                                setPanNumber('');
                            }}
                            style={{ backgroundColor: colors.royalBlue, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10, width: '100%', alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>{t('gotIt')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default DriverLoan;
