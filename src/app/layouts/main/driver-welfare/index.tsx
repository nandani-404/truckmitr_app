import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';

const DriverWelfare = () => {
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();

    const _goBack = () => navigation.goBack();


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
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E11D48', marginRight: 10, marginTop: 6 }} />
            <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', flex: 1 }}>{text}</Text>
        </View>
    );

    // Welfare Section Card Component
    const WelfareSectionCard = ({
        emoji,
        title,
        benefits,
        footerText,
        accentColor = '#2563EB'
    }: {
        emoji: string;
        title: string;
        benefits: string[];
        footerText: string;
        accentColor?: string;
    }) => (
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: accentColor }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{emoji}</Text>
                <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '700', color: '#001F3F', flex: 1 }}>{title}</Text>
            </View>
            {benefits.map((benefit, index) => (
                <BenefitItem key={index} text={benefit} />
            ))}
            <View style={{ marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                    {footerText}
                </Text>
            </View>
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
                    {t('driverWelfareTitle')}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(6) }} showsVerticalScrollIndicator={false}>

                {/* ❤️ 1️⃣ Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center', ...shadow, shadowColor: 'rgba(0,0,0,0.08)' }}>
                    {/* Coming Soon Badge */}
                    <View style={{ backgroundColor: '#E11D48', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '700', color: colors.white }}>❤️ {t('comingSoon')}</Text>
                    </View>

                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="heart" size={32} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 4 }}>
                        {t('driverWelfareTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '600', color: '#E11D48', textAlign: 'center', marginBottom: 8 }}>
                        {t('becauseDriversMatter')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('driverWelfareDescription')}
                    </Text>
                </View>

                {/* 💡 2️⃣ What is Driver Welfare */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 8 }}>{t('whatIsDriverWelfareTitle')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', lineHeight: responsiveFontSize(2.6) }}>
                        {t('whatIsDriverWelfareDesc')}
                    </Text>
                    <View style={{ backgroundColor: '#FDF2F8', padding: 10, borderRadius: 8, marginTop: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#BE185D', fontWeight: '600', textAlign: 'center' }}>
                            ❤️ {t('designedForDriverCommunity')}
                        </Text>
                    </View>
                </View>

                {/* 🧩 3️⃣ What Driver Welfare Covers - Section Title */}
                <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 12, textAlign: 'left' }}>{t('whatDriverWelfareCovers')}</Text>

                {/* 🩺 Driver Medical Support */}
                <WelfareSectionCard
                    emoji="🩺"
                    title={t('driverMedicalSupport')}
                    benefits={[
                        t('medicalSupportBenefit1'),
                        t('medicalSupportBenefit2'),
                        t('medicalSupportBenefit3'),
                        t('medicalSupportBenefit4')
                    ]}
                    footerText={t('medicalSupportFooter')}
                    accentColor="#16A34A"
                />

                {/* 👨‍👩‍👧 Driver Family Care */}
                <WelfareSectionCard
                    emoji="👨‍👩‍👧"
                    title={t('driverFamilyCare')}
                    benefits={[
                        t('familyCareBenefit1'),
                        t('familyCareBenefit2'),
                        t('familyCareBenefit3'),
                        t('familyCareBenefit4')
                    ]}
                    footerText={t('familyCareFooter')}
                    accentColor="#2563EB"
                />

                {/* 🤝 Community & Welfare Initiatives */}
                <WelfareSectionCard
                    emoji="🤝"
                    title={t('communityWelfareInitiatives')}
                    benefits={[
                        t('communityBenefit1'),
                        t('communityBenefit2'),
                        t('communityBenefit3'),
                        t('communityBenefit4')
                    ]}
                    footerText={t('communityFooter')}
                    accentColor="#8B5CF6"
                />

                {/* 🌟 4️⃣ Why Driver Welfare Matters */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>🌟</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F' }}>{t('whyDriverWelfareMatters')}</Text>
                    </View>
                    <BulletItem text={t('welfareMatter1')} />
                    <BulletItem text={t('welfareMatter2')} />
                    <BulletItem text={t('welfareMatter3')} />
                    <BulletItem text={t('welfareMatter4')} />

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
                        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#16A34A', fontWeight: '600' }}>✔ {t('emotional')}</Text>
                        </View>
                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#2563EB', fontWeight: '600' }}>✔ {t('respectful')}</Text>
                        </View>
                        <View style={{ backgroundColor: '#FDF2F8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#BE185D', fontWeight: '600' }}>✔ {t('missionDriven')}</Text>
                        </View>
                    </View>
                </View>

                {/* ⏳ 5️⃣ Coming Soon */}
                <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 24, marginRight: 8 }}>⏳</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#92400E' }}>{t('comingSoon')}</Text>
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#78350F', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('welfareComingSoonDesc')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                        <Ionicons name="notifications" size={16} color="#D97706" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#92400E', fontWeight: '600' }}>{t('stayTunedForUpdates')}</Text>
                    </View>
                </View>

                {/* 📢 6️⃣ Footer Brand Message */}
                <View style={{ backgroundColor: '#1E3A5F', borderRadius: 12, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>📢</Text>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: colors.white, marginBottom: 4 }}>{t('driverWelfareTitle')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(2.0), color: '#93C5FD', fontStyle: 'italic', marginBottom: 8 }}>{t('careBeyondTheRoad')}</Text>
                    <View style={{ borderTopWidth: 1, borderTopColor: '#3B5998', paddingTop: 10, width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#A5B4FC' }}>{t('moreWelfareBenefitsLaunchingSoon')}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

export default DriverWelfare;
