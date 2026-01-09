import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hitSlop } from '@truckmitr/src/app/functions';

const DriverKiAwazInfo = () => {
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();

    const _goBack = () => navigation.goBack();

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
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
                    {t('driverKiAwazTitle', 'Driver Ki Awaz')}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(4) }} showsVerticalScrollIndicator={false}>

                {/* 🚛 1️⃣ Hero Card */}
                <View style={{ backgroundColor: '#E0F2FE', borderRadius: 20, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), position: 'relative', overflow: 'hidden' }}>

                    {/* Coming Soon Badge */}
                    <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#FF6B00', paddingHorizontal: 12, paddingVertical: 6, borderBottomLeftRadius: 12 }}>
                        <Text style={{ color: '#fff', fontSize: responsiveFontSize(1.7), fontWeight: '700' }}>{t('comingSoonBadge', 'COMING SOON')}</Text>
                    </View>

                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <MaterialCommunityIcons name="bullhorn-outline" size={32} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.8), fontWeight: '800', color: '#0C4A6E', marginBottom: 8, textAlign: 'left' }}>
                        {t('driverKiAwazTitle', 'Driver Ki Awaz')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '600', color: '#0369A1', marginBottom: 12, textAlign: 'left' }}>
                        {t('comingSoonOnTruckMitr', 'Coming Soon on TruckMitr')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(2.0), color: '#334155', lineHeight: responsiveFontSize(3.0), fontStyle: 'italic', textAlign: 'left' }}>
                        {t('driverKiAwazQuote', '"Every driver has a story.\nEvery story deserves to be heard."')}
                    </Text>
                </View>

                {/* 🎤 2️⃣ What is Driver Ki Awaz */}
                <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.0), color: '#475569', lineHeight: responsiveFontSize(3.0), marginBottom: 12, textAlign: 'left' }}>
                        {t('driverKiAwazDesc', 'Driver Ki Awaz is a platform where Indian truck drivers can')} <Text style={{ fontWeight: '700', color: '#0C4A6E' }}>{t('raiseTheirVoice', 'raise their voice')}</Text>{t('driverKiAwazDesc2', ', share real-life challenges, and stand united as one community.')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(2.1), fontWeight: '800', color: '#0284C7', textAlign: 'center', lineHeight: responsiveFontSize(3.0) }}>
                        {t('yourSpaceVoice', 'This is your space. Your voice. Your Awaz.')}
                    </Text>
                </View>

                {/* 🧱 3️⃣ What You’ll Be Able To Share */}
                <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#334155', marginBottom: 16, textAlign: 'left' }}>
                        {t('whatYouShare', 'What You’ll Be Able To Share')}
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {[
                            { icon: 'chatbubble-ellipses-outline', text: t('dailyChallenges', "Your daily life challenges"), color: '#F59E0B' },
                            { icon: 'people-outline', text: t('driverUnity', "Driver unity (Driver Ekta)"), color: '#3B82F6' },
                            { icon: 'scale-outline', text: t('welfareRights', "Welfare and rights of drivers"), color: '#10B981' },
                            { icon: 'business-outline', text: t('govDemands', "Demands from Government & Authorities"), color: '#6366F1' },
                            { icon: 'warning-outline', text: t('rtoIssues', "RTO, challan, permit, and road issues"), color: '#EF4444' },
                            { icon: 'heart-outline', text: t('roadExperiences', "Experiences from life on the road"), color: '#EC4899' },
                        ].map((item, index) => (
                            <View key={index} style={{ width: '48%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' }}>
                                <Ionicons name={item.icon} size={24} color={item.color} style={{ marginBottom: 8 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.8), color: '#334155', textAlign: 'center', fontWeight: '600', lineHeight: responsiveFontSize(2.4) }}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 💡 4️⃣ Why Driver Ki Awaz Matters */}
                <View style={{ backgroundColor: '#FFF7ED', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), borderLeftWidth: 4, borderLeftColor: '#F97316' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#9A3412', marginBottom: 12, textAlign: 'left' }}>
                        {t('whyItMatters', 'Why Driver Ki Awaz Matters')}
                    </Text>
                    {[
                        t('collectiveVoice', "A collective voice of Indian truck drivers"),
                        t('realIssues', "Real issues, real stories, real impact"),
                        t('strengthensCommunity', "Strengthens driver community and unity"),
                        t('highlightsProblems', "Helps highlight problems that matter")
                    ].map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
                            <Text style={{ color: '#F97316', marginRight: 8, fontSize: responsiveFontSize(1.9), marginTop: 2 }}>•</Text>
                            <Text style={{ fontSize: responsiveFontSize(1.9), color: '#7C2D12', flex: 1, textAlign: 'left', lineHeight: responsiveFontSize(2.6) }}>{item}</Text>
                        </View>
                    ))}
                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '800', color: '#C2410C', marginTop: 8, textAlign: 'center', fontStyle: 'italic', lineHeight: responsiveFontSize(2.8) }}>
                        {t('systemListens', '"When drivers speak together, the system listens."')}
                    </Text>
                </View>

                {/* 🚀 5️⃣ Get Ready */}
                <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#334155', marginBottom: 12, textAlign: 'left' }}>
                        {t('getReady', 'Get Ready')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#475569', marginBottom: 12, textAlign: 'left', lineHeight: responsiveFontSize(2.6) }}>
                        {t('soonAbleTo', 'Soon, you’ll be able to:')}
                    </Text>

                    {[
                        t('postThoughts', "Post your thoughts"),
                        t('shareExperiences', "Share experiences"),
                        t('supportDrivers', "Support fellow drivers"),
                        t('strongerCommunity', "Be part of a stronger driver community")
                    ].map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.9), color: '#334155', fontWeight: '600', flex: 1, textAlign: 'left', lineHeight: responsiveFontSize(2.6) }}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* 📢 6️⃣ Footer */}
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <MaterialCommunityIcons name="broadcast" size={32} color={colors.royalBlue} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: '800', color: colors.royalBlue, marginBottom: 4, textAlign: 'center', lineHeight: responsiveFontSize(3.0) }}>
                        {t('driverKiAwazTitle', 'Driver Ki Awaz')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.9), color: '#64748B', fontWeight: 'bold', textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                        {t('driverKiBaat', 'Kyunki Driver Ki Baat Zaroori Hai')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                        <Ionicons name="notifications-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: '#0284C7', fontWeight: '700', textAlign: 'center' }}>{t('stayTuned', 'Stay tuned. Feature launching soon.')}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

export default DriverKiAwazInfo;
