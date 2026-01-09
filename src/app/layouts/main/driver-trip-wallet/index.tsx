import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';

const DriverTripWallet = () => {
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
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0EA5E9', marginRight: 10, marginTop: 6 }} />
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
                    {t('driverTripWalletTitle')}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(6) }} showsVerticalScrollIndicator={false}>

                {/* 💼 1️⃣ Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center', ...shadow, shadowColor: 'rgba(0,0,0,0.08)' }}>
                    {/* Coming Soon Badge */}
                    <View style={{ backgroundColor: '#0EA5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), fontWeight: '700', color: colors.white }}>💼 {t('comingSoon')}</Text>
                    </View>

                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="wallet" size={32} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 6 }}>
                        {t('driverTripWalletTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('driverTripWalletHeroDesc')}
                    </Text>

                    {/* Sub-line */}
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#CBD5E1', width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#0EA5E9', textAlign: 'center', fontWeight: '600' }}>
                            {t('designedForDriverBenefit')}
                        </Text>
                    </View>
                </View>

                {/* 💡 2️⃣ What is Driver Trip Wallet */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 8 }}>{t('whatIsDriverTripWallet')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', lineHeight: responsiveFontSize(2.6) }}>
                        {t('whatIsDriverTripWalletDesc')}
                    </Text>
                    <View style={{ backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8, marginTop: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0369A1', fontWeight: '600', textAlign: 'center' }}>
                            📝 {t('noMoreConfusion')}
                        </Text>
                    </View>
                </View>

                {/* 🧾 3️⃣ What You Can Do with Trip Wallet */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#0EA5E9' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>🧾</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F' }}>{t('whatYouCanDoWallet')}</Text>
                    </View>
                    <BenefitItem text={t('recordTripExpenses')} />
                    <BenefitItem text={t('trackTotalSpending')} />
                    <BenefitItem text={t('understandWhereMoneyGoes')} />
                    <BenefitItem text={t('planExpensesBetter')} />

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
                        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#16A34A', fontWeight: '600' }}>✔ {t('easyToScan')}</Text>
                        </View>
                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#2563EB', fontWeight: '600' }}>✔ {t('veryPractical')}</Text>
                        </View>
                    </View>
                </View>

                {/* ⭐ 4️⃣ Why Trip Wallet Is Important */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>⭐</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F' }}>{t('whyTripWalletImportant')}</Text>
                    </View>
                    <BulletItem text={t('controlUnnecessaryExpenses')} />
                    <BulletItem text={t('transparentRoadKharcha')} />
                    <BulletItem text={t('buildsTrustTransporters')} />
                    <BulletItem text={t('fasterSettlement')} />
                    <BulletItem text={t('improvesProfessionalImage')} />

                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.9), color: '#001F3F', fontWeight: '700', textAlign: 'center' }}>
                            {t('expensesClearTrustStronger')}
                        </Text>
                    </View>
                </View>

                {/* 🛠️ 5️⃣ Built for Drivers */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#16A34A' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 24, marginRight: 10 }}>🛠️</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F' }}>{t('designedForDrivers')}</Text>
                    </View>
                    <BenefitItem text={t('simpleAndEasy')} />
                    <BenefitItem text={t('dailyDriverNeeds')} />
                    <BenefitItem text={t('financialDiscipline')} />
                    <BenefitItem text={t('smarterDecisions')} />
                </View>

                {/* ⏳ 6️⃣ Coming Soon for Driver Benefit */}
                <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 24, marginRight: 8 }}>⏳</Text>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#92400E' }}>{t('comingSoonDriverBenefit')}</Text>
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#78350F', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('walletComingSoonDesc')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                        <Ionicons name="notifications" size={16} color="#D97706" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#92400E', fontWeight: '600' }}>{t('stayConnected')}</Text>
                    </View>
                </View>

                {/* 📢 7️⃣ Footer Brand Message */}
                <View style={{ backgroundColor: '#1E3A5F', borderRadius: 12, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>📢</Text>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: colors.white, marginBottom: 4 }}>{t('driverTripWalletTitle')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(2.0), color: '#93C5FD', fontStyle: 'italic', marginBottom: 8 }}>{t('safarKaKharcha')}</Text>
                    <View style={{ borderTopWidth: 1, borderTopColor: '#3B5998', paddingTop: 10, width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#A5B4FC' }}>{t('launchingSoonWallet')}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

export default DriverTripWallet;
