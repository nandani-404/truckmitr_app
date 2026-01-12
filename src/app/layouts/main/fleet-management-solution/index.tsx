import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FleetManagementSolution = () => {
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();

    const _goBack = () => navigation.goBack();

    // Benefit Item Component with checkmark
    const BenefitItem = ({ text }: { text: string }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveHeight(1.2) }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="checkmark" size={14} color="#16A34A" />
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.8), color: '#334155', flex: 1 }}>{text}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: responsiveWidth(4), paddingTop: responsiveHeight(6), paddingBottom: responsiveHeight(2), backgroundColor: colors.white, elevation: 2 }}>
                <TouchableOpacity onPress={_goBack} style={{ padding: 5 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: 'bold', color: colors.royalBlue, textAlign: 'center', flex: 1 }}>
                    {t('fleetManagementTitle')}
                </Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(6) }} showsVerticalScrollIndicator={false}>

                {/* 🚚 1️⃣ Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center', ...shadow, shadowColor: 'rgba(0,0,0,0.08)' }}>
                    {/* Coming Soon Badge */}
                    <View style={{ backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginBottom: 14 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.5), fontWeight: '700', color: colors.white }}>🔥 {t('fleetManagementComingSoonBadge')}</Text>
                    </View>

                    <View style={{ width: 65, height: 65, borderRadius: 32, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Text style={{ fontSize: 32 }}>📊</Text>
                    </View>

                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 8 }}>
                        {t('fleetManagementTitle')}
                    </Text>

                    <Text style={{ fontSize: responsiveFontSize(2.0), color: '#001F3F', textAlign: 'center', lineHeight: responsiveFontSize(3.0), fontWeight: '600' }}>
                        {t('fleetManagementHeroDesc')}
                    </Text>

                    {/* Sub-line */}
                    <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#CBD5E1', width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', textAlign: 'center', fontStyle: 'italic', lineHeight: responsiveFontSize(2.4) }}>
                            {t('fleetManagementHeroSubline')}
                        </Text>
                    </View>
                </View>

                {/* ❓ 2️⃣ What is Fleet Management Solution */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 10 }}>
                        {t('fleetManagementWhatIsTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#64748B', lineHeight: responsiveFontSize(2.7) }}>
                        {t('fleetManagementWhatIsDesc')}
                    </Text>
                    <View style={{ backgroundColor: '#EAF3FF', padding: 12, borderRadius: 8, marginTop: 14 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#2563EB', fontWeight: '600', textAlign: 'center' }}>
                            📊 {t('fleetManagementBuiltFor')}
                        </Text>
                    </View>
                </View>

                {/* ⚙️ 3️⃣ What Fleet Management Will Help You Do */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#10B981' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 14 }}>
                        {t('fleetManagementDoTitle')}
                    </Text>
                    <BenefitItem text={t('fleetManagementDo1')} />
                    <BenefitItem text={t('fleetManagementDo2')} />
                    <BenefitItem text={t('fleetManagementDo3')} />
                    <BenefitItem text={t('fleetManagementDo4')} />
                    <BenefitItem text={t('fleetManagementDo5')} />

                    {/* Footer line */}
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#0F172A', fontWeight: '700', textAlign: 'center' }}>
                            {t('fleetManagementDoFooter')}
                        </Text>
                    </View>
                </View>

                {/* 🤖 4️⃣ Powered by Smart Technology */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 14 }}>
                        {t('fleetManagementTechTitle')}
                    </Text>
                    <BenefitItem text={t('fleetManagementTech1')} />
                    <BenefitItem text={t('fleetManagementTech2')} />
                    <BenefitItem text={t('fleetManagementTech3')} />
                    <BenefitItem text={t('fleetManagementTech4')} />

                    {/* Tech value message */}
                    <View style={{ marginTop: 12, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.7), color: '#92400E', fontWeight: '700', textAlign: 'center' }}>
                            {t('fleetManagementTechFooter')}
                        </Text>
                    </View>
                </View>

                {/* 🚛 5️⃣ Built for Transporters */}
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Text style={{ fontSize: 22 }}>🚛</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '700', color: '#166534', marginBottom: 10 }}>
                            {t('fleetManagementIndustryTitle')}
                        </Text>
                        <BenefitItem text={t('fleetManagementIndustry1')} />
                        <BenefitItem text={t('fleetManagementIndustry2')} />
                        <BenefitItem text={t('fleetManagementIndustry3')} />
                        <BenefitItem text={t('fleetManagementIndustry4')} />
                    </View>
                </View>

                {/* ⏳ 6️⃣ Coming Soon for Transporters */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)', borderLeftWidth: 4, borderLeftColor: '#8B5CF6' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#001F3F', marginBottom: 10 }}>
                        ⏳ {t('fleetManagementLaunchTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#64748B', lineHeight: responsiveFontSize(2.7), marginBottom: 12 }}>
                        {t('fleetManagementLaunchDesc')}
                    </Text>

                    {/* Optional small line */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 16, marginRight: 8 }}>🔔</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#7C3AED', fontWeight: '600' }}>
                            {t('fleetManagementStayTuned')}
                        </Text>
                    </View>
                </View>

                {/* 📢 7️⃣ Footer Brand Message */}
                <View style={{ backgroundColor: '#1E3A5F', borderRadius: 12, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <Text style={{ fontSize: 30, marginBottom: 10 }}>📢</Text>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: colors.white, marginBottom: 6, textAlign: 'center' }}>
                        {t('fleetManagementTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.8), color: '#93C5FD', fontStyle: 'italic', textAlign: 'center', marginBottom: 8 }}>
                        "{t('fleetManagementTagline')}"
                    </Text>
                    <View style={{ marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#3B5A8A', width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.5), color: '#A5B4FC', textAlign: 'center' }}>
                            {t('fleetManagementFooter')}
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

export default FleetManagementSolution;
