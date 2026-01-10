import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Linking, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import ImagePicker from 'react-native-image-crop-picker';
import { Image } from 'react-native';

const IdCheckInfo = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const [refreshKey, setRefreshKey] = useState(0);

    // Form State
    const [govtId] = useState('');
    const [licenseNumber] = useState('');
    const [selfie, setSelfie] = useState<any>(null);

    const _takeSelfie = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 300,
                height: 400,
                cropping: true,
                useFrontCamera: true,
                mediaType: 'photo'
            });
            setSelfie(image);
        } catch (error) {
            console.log('Camera Error:', error);
        }
    };

    const _goBack = () => navigation.goBack();
    const _navigateToSubscription = () => {
        // Navigate to DL Verification screen, ID tab
        navigation.navigate(STACKS.DL_VERIFICATION, { initialTab: 'ID' });
    };
    const _contactSupport = () => {
        Linking.openURL('tel:18001024558');
    };
    const _refreshPage = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Document Card Component
    const DocumentCard = ({ icon, iconType, title, subtitle }: { icon: string, iconType: 'ion' | 'material', title: string, subtitle: string }) => (
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(3), margin: 4, ...shadow, shadowColor: 'rgba(0,0,0,0.08)', borderWidth: 1, borderColor: '#F0F0F0' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {iconType === 'ion' ? (
                    <Ionicons name={icon} size={24} color="#2563EB" />
                ) : (
                    <MaterialCommunityIcons name={icon} size={24} color="#2563EB" />
                )}
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#001F3F', marginBottom: 4 }}>{title}</Text>
            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{subtitle}</Text>
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

    // Benefit Item Component
    const BenefitItem = ({ text }: { text: string }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveHeight(1.4) }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="checkmark" size={16} color="#16A34A" />
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.8), color: '#334155' }}>{text}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), paddingTop: responsiveHeight(6), paddingBottom: responsiveHeight(2), backgroundColor: colors.white, elevation: 2 }}>
                <TouchableOpacity onPress={_goBack} style={{ padding: 8 }}>
                    <Ionicons name="chevron-back" size={28} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: 'bold', color: colors.royalBlue, textAlign: 'center' }}>
                    {t('idCheckTitle')}
                </Text>
                <TouchableOpacity onPress={_refreshPage} style={{ padding: 8 }}>
                    <Ionicons name="refresh" size={26} color={colors.royalBlue} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(14) }} showsVerticalScrollIndicator={false}>

                {/* 🎯 Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Ionicons name="shield-checkmark" size={36} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                        {t('idVerificationTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('idVerificationDesc')}
                    </Text>
                    <TouchableOpacity
                        onPress={_navigateToSubscription}
                        style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveHeight(1.8), paddingHorizontal: responsiveWidth(8), borderRadius: 12, marginTop: responsiveHeight(2) }}
                    >
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(1.9), fontWeight: '600' }}>{t('getIdCheckNow')}</Text>
                    </TouchableOpacity>
                </View>

                {/* ❓ Why ID Check */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 10 }}>{t('whyIdCheck')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#64748B', lineHeight: responsiveFontSize(2.6) }}>
                        {t('whyIdCheckDesc')}
                    </Text>
                </View>

                {/* 📄 Required Documents - List */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 16 }}>{t('requiredDocuments')}</Text>

                    {/* Document 1: Government ID */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Ionicons name="card-outline" size={22} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B', marginBottom: 2 }}>{t('govtIdNumber')}</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('aadhaarVoterPanDesc') || 'Aadhaar Card / Voter ID / PAN Card'}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    </View>

                    {/* Document 2: Driving License */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Ionicons name="car-outline" size={22} color="#D97706" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B', marginBottom: 2 }}>{t('drivingLicenseNumber')}</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('drivingLicenseDesc') || 'Valid Driving License'}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    </View>

                    {/* Document 3: Live Selfie */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                            <Ionicons name="camera-outline" size={22} color="#16A34A" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B', marginBottom: 2 }}>{t('liveSelfie')}</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B' }}>{t('liveSelfieDesc') || 'Real-time photo for face matching'}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    </View>
                </View>

                {/* 🔄 Verification Process - Stepper */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 18 }}>{t('verificationProcess')}</Text>
                    <ProcessStep number="1" text={t('uploadRequiredDocs')} />
                    <ProcessStep number="2" text={t('identityDocCheck')} />
                    <ProcessStep number="3" text={t('photoMatching')} />
                    <ProcessStep number="4" text={t('getVerificationStatus')} isLast />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10 }}>
                        <Ionicons name="flash" size={18} color="#D97706" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#92400E', fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>{t('fastSecureProcess')}</Text>
                    </View>
                </View>

                {/* 🌟 Benefits */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 18 }}>{t('benefits')}</Text>
                    <BenefitItem text={t('trustedDriverProfile')} />
                    <BenefitItem text={t('moreTripOpportunities')} />
                    <BenefitItem text={t('fasterApprovals')} />
                    <BenefitItem text={t('trustedByTransporters')} />
                    <BenefitItem text={t('safeSecurePlatform')} />
                </View>

                {/* 🔐 Data Security */}
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Ionicons name="lock-closed" size={24} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.9), fontWeight: '700', color: '#166534', marginBottom: 4 }}>{t('dataSecurity')}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#15803D', lineHeight: responsiveFontSize(2.4) }}>
                            {t('dataSecurityDesc')}
                        </Text>
                    </View>
                </View>

                {/* ☎️ Support Access */}
                <TouchableOpacity onPress={_contactSupport} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveHeight(1.5) }}>
                    <Ionicons name="call-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B' }}>{t('needHelp')} <Text style={{ fontWeight: '600', color: '#2563EB' }}>{t('contactTruckMitrSupport')}</Text></Text>
                </TouchableOpacity>

            </ScrollView>

            {/* 📌 Sticky CTA Button */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                <TouchableOpacity
                    onPress={_navigateToSubscription}
                    style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveHeight(2), borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>{t('getIdCheckNow')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default IdCheckInfo;
