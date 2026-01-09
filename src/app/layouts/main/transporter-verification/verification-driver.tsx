import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Linking, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop } from '@truckmitr/src/app/functions';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function VerificationDriversByTransporter() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const safeAreaInsets = useSafeAreaInsets();
    useStatusBarStyle('dark-content');

    const onVerify = () => navigation.navigate(STACKS.TRANSPORTER_VERIFICATION);
    const onContactSales = () => navigation.navigate(STACKS.CONTACT_US);
    const onBack = () => navigation.goBack();

    // Navigation to history/status if needed (preserving access)
    const onHistory = () => navigation.navigate(STACKS.PAYMENT_HISTORY_SCREEN);

    const InfoCard = ({ title, children, style }: any) => (
        <View style={[{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }, style]}>
            <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#334155', marginBottom: 12 }}>{title}</Text>
            {children}
        </View>
    );

    const CheckItem = ({ title, icon, color, details }: any) => (
        <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '600', color: '#1E293B' }}>{title}</Text>
            </View>
            <View style={{ paddingLeft: 42 }}>
                <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', marginBottom: 4 }}>{t('requiredDetailsDocuments', 'Required details/documents:')}</Text>
                {details.map((d: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#334155' }}>{d}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Space height={safeAreaInsets.top} />
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={onBack} hitSlop={hitSlop(10)} style={{ padding: 4, marginRight: 8 }}>
                        <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.royalBlue }}>
                        {t('verifyYourDrivers', 'Verify Your Drivers')}
                    </Text>
                </View>
                <TouchableOpacity onPress={onHistory} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="history" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* 1. Hero Section */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <MaterialCommunityIcons name="shield-check-outline" size={32} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                        {t('verifyYourDrivers', 'Verify Your Drivers')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#1E3A8A', textAlign: 'center', marginBottom: 12, fontWeight: '500' }}>
                        {t('hireWithConfidence', 'Hire with confidence by verifying your drivers through essential background checks.')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.5), color: '#475569', textAlign: 'center', lineHeight: 22 }}>
                        {t('verifyHeroSub', 'TruckMitr helps transporters ensure safety, compliance, and trust across operations.')}
                    </Text>
                </View>

                {/* 2. What is Driver Verification */}
                <InfoCard title={t('whatIsDriverVerification', 'What is driver verification?')}>
                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#475569', lineHeight: 24 }}>
                        {t('verificationDesc', 'TruckMitr enables transporters to verify drivers through essential background checks to build trust and ensure compliant operations.')}
                    </Text>
                </InfoCard>

                {/* 3. Verification Checks Covered */}
                <View style={{ marginBottom: responsiveHeight(2) }}>
                    <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#334155', marginBottom: 12 }}>
                        {t('verificationChecksCovered', 'Verification Checks Covered')}
                    </Text>
                    <CheckItem
                        title={t('idCheck', 'ID Check')}
                        icon="card-outline"
                        color="#2563EB"
                        details={[t('govtId', 'Government-issued Photo ID (Aadhaar / Voter ID / PAN)'), t('dl', 'Valid Driving License')]}
                    />
                    <CheckItem
                        title={t('courtCheck', 'Court Check')}
                        icon="gavel-outline"
                        color="#D97706"
                        details={[t('fullName', 'Full Name'), t('dob', 'Date of Birth'), t('address', 'Address'), t('fatherName', "Father's Name")]}
                    />
                    <CheckItem
                        title={t('digitalAddressCheck', 'Digital Address Check')}
                        icon="home-outline"
                        color="#059669"
                        details={[t('mobileNumber', 'Mobile Number'), t('fullName', 'Full Name'), t('currentAddress', 'Current Address')]}
                    />
                </View>

                {/* 4. Pricing */}
                <InfoCard title={t('pricing', 'Pricing')}>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#1E293B', fontWeight: 'bold' }}>₹1000 + GST <Text style={{ fontWeight: '400', fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('perDriver', 'per driver')}</Text></Text>
                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>{t('pricingInclude', '(Includes ID Check, Court Check & Digital Address Check)')}</Text>
                    </View>

                    <View style={{ backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.5), color: '#334155', fontWeight: '600' }}>{t('bulkVerification', 'Bulk Verification (More than 10 drivers)')}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#2563EB', fontWeight: 'bold', marginTop: 2 }}>👉 {t('contactSalesForDeals', 'Contact Sales for bulk deals')}</Text>
                    </View>
                </InfoCard>

                {/* 5. Why Verify */}
                <InfoCard title={t('whyVerify', 'Why verify your drivers')}>
                    {[
                        t('buildTrustedWorkforce', 'Build a trusted & reliable driver workforce'),
                        t('reduceRisk', 'Reduce operational & legal risks'),
                        t('improveSafety', 'Improve safety & compliance'),
                        t('enableFasterHiring', 'Enable faster & confident hiring decisions')
                    ].map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ionicons name="star" size={16} color="#EAB308" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#334155', flex: 1 }}>{item}</Text>
                        </View>
                    ))}
                </InfoCard>

                {/* 6. How It Works */}
                <InfoCard title={t('howItWorks', 'How it works')}>
                    {[
                        t('step1', 'Submit driver information'),
                        t('step2', 'Required checks are initiated'),
                        t('step3', 'Verification status is updated in the app')
                    ].map((step, i) => (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 12 }}>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</Text>
                            </View>
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#334155' }}>{step}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, padding: 8, backgroundColor: '#F0FDF4', borderRadius: 8 }}>
                        <Ionicons name="time-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#059669', fontWeight: '600' }}>{t('verificationProcessedEfficiently', 'Each verification is processed securely and efficiently.')}</Text>
                    </View>
                </InfoCard>

                {/* 7. Data Privacy */}
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#64748B" style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '700', color: '#334155', marginBottom: 4 }}>{t('dataPrivacy', 'Data privacy & security')}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B', lineHeight: 20 }}>
                            {t('dataPrivacyDesc', 'All driver data is encrypted and used only for verification purposes, following strict data protection standards.')}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky CTA */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), paddingBottom: safeAreaInsets.bottom || 20, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', ...shadow, elevation: 10 }}>
                <TouchableOpacity
                    onPress={onContactSales}
                    style={{ flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#BFDBFE' }}
                >
                    <Text style={{ color: '#2563EB', fontSize: responsiveFontSize(1.8), fontWeight: '600' }}>{t('contactSales', 'Contact Sales')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onVerify}
                    style={{ flex: 1, backgroundColor: colors.royalBlue, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.8), fontWeight: 'bold' }}>{t('verifyDriver', 'Verify Driver')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}