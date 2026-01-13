import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Linking, Image, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { useDispatch } from 'react-redux';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { ScreenHeader } from '@truckmitr/src/app/components';

const VideoInterviewInfo = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const [refreshKey, setRefreshKey] = useState(0);
    const [scheduledCount, setScheduledCount] = useState(0);

    // Mock State: 'none', 'scheduled', 'live', 'missed'
    const [interviewStatus, setInterviewStatus] = useState<'none' | 'scheduled' | 'live' | 'missed'>('scheduled');

    const fetchInterviews = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.DRIVER_INTERVIEW);
            if (response?.data?.status) {
                setScheduledCount(response.data.data.length);
            }
        } catch (error) {
            console.error("Error fetching interviews:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchInterviews();
        }, [])
    );

    const _goBack = () => navigation.goBack();
    const _refreshPage = () => {
        setRefreshKey(prev => prev + 1);
        fetchInterviews();
    };
    const _contactSupport = () => {
        Linking.openURL('tel:18001024558');
    };
    const _handleCTA = () => {
        if (interviewStatus === 'live') {
            // Join interview logic
            console.log('Joining Interview');
        } else if (interviewStatus === 'scheduled') {
            navigation.navigate(STACKS.SCHEDULED_INTERVIEWS);
        }
    };

    // Checklist Item Component
    const ChecklistItem = ({ text, type }: { text: string, type: 'good' | 'bad' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: type === 'good' ? '#DCFCE7' : '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name={type === 'good' ? "checkmark" : "close"} size={14} color={type === 'good' ? "#16A34A" : "#DC2626"} />
            </View>
            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#334155', flex: 1 }}>{text}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <ScreenHeader
                title={t('videoInterviewTitle')}
                rightComponent={
                    <Pressable
                        onPress={_refreshPage}
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

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(14) }} showsVerticalScrollIndicator={false}>

                {/* 🎥 Hero Card */}
                <View style={{ backgroundColor: '#EAF3FF', borderRadius: 16, padding: responsiveWidth(5), marginBottom: responsiveHeight(2), alignItems: 'center' }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="videocam" size={32} color={colors.white} />
                    </View>
                    <Text style={{ fontSize: responsiveFontSize(2.6), fontWeight: '700', color: '#001F3F', textAlign: 'center', marginBottom: 6 }}>
                        {t('videoInterviewTitle')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.7), color: '#475569', textAlign: 'center', lineHeight: responsiveFontSize(2.4) }}>
                        {t('videoInterviewDesc')}
                    </Text>
                </View>


                {/* ✅ Before the Interview (Do’s) */}
                <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '700', color: '#001F3F', marginBottom: 12 }}>{t('beforeInterview')}</Text>
                    <ChecklistItem type="good" text={t('keepPhoneCharged')} />
                    <ChecklistItem type="good" text={t('ensureGoodInternet')} />
                    <ChecklistItem type="good" text={t('sitQuietPlace')} />
                    <ChecklistItem type="good" text={t('keepDocumentsReady')} />
                    <ChecklistItem type="good" text={t('joinOnTime')} />
                </View>

                {/* ❌ During the Interview (Don’ts) */}
                <View style={{ backgroundColor: '#FDF2F2', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2) }}>
                    <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '700', color: '#991B1B', marginBottom: 12 }}>{t('duringInterview')}</Text>
                    <ChecklistItem type="bad" text={t('dontMissScheduledTime')} />
                    <ChecklistItem type="bad" text={t('avoidNoisyPlaces')} />
                    <ChecklistItem type="bad" text={t('dontDisconnectCall')} />
                    <ChecklistItem type="bad" text={t('avoidCasualBehavior')} />
                </View>

                {/* 📞 Important Information */}
                <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: responsiveWidth(4), marginBottom: responsiveHeight(2) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Ionicons name="information-circle" size={22} color="#475569" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '700', color: '#334155' }}>{t('importantInformation')}</Text>
                    </View>
                    <View style={{ marginLeft: 6 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#475569', marginBottom: 6 }}>• {t('receiveAssistance')}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#475569', marginBottom: 6 }}>• {t('answerTeamCall')}</Text>
                        <Text style={{ fontSize: responsiveFontSize(1.6), color: '#475569' }}>• {t('followInstructions')}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* 📌 Sticky CTA Button */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: responsiveWidth(4), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...shadow }}>
                {interviewStatus === 'none' ? (
                    <TouchableOpacity
                        disabled={true}
                        style={{ backgroundColor: '#94A3B8', paddingVertical: responsiveHeight(1.8), borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>{t('waitingForInterview')}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={_handleCTA}
                        style={{ backgroundColor: colors.royalBlue, paddingVertical: responsiveHeight(1.8), borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.0), fontWeight: 'bold' }}>
                            {interviewStatus === 'live' ? t('joinInterview') : `${t('viewScheduledInterview')} (${scheduledCount})`}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View >
    );
};

export default VideoInterviewInfo;
