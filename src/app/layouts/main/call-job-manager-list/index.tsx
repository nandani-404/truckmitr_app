import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform, ToastAndroid, LayoutAnimation, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const CallJobManagerList = () => {
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();

    const _goBack = () => navigation.goBack();

    // Mock Data for "Applied Jobs" where the driver can call the manager
    const [jobs, setJobs] = useState<any[]>([]);

    const _handleCallManager = (phone: string, managerName: string) => {
        const date = new Date();
        const hour = date.getHours();
        const minute = date.getMinutes();

        // Working Hours: 9:30 AM - 6:00 PM
        const isWorkingHours = ((hour > 9) || (hour === 9 && minute >= 30)) && (hour < 18);

        if (isWorkingHours) {
            console.log(`Calling ${managerName} at ${phone}`);
            Linking.openURL(`tel:${phone}`);
        } else {
            const message = t('callAvailableWorkingHours', 'Call available during working hours (9:30 AM - 6 PM)');
            if (Platform.OS === 'android') {
                ToastAndroid.show(message, ToastAndroid.LONG);
            } else {
                console.log(message);
            }
        }
    };

    const JobCard = ({ item }: { item: any }) => (
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: responsiveWidth(4), marginBottom: responsiveHeight(2), ...shadow, shadowColor: 'rgba(0,0,0,0.06)' }}>
            {/* Header Section */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '700', color: '#001F3F', marginBottom: 4, lineHeight: responsiveFontSize(2.4), textAlign: 'left' }}>{item.jobTitle}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.5), color: '#334155', fontWeight: '600', lineHeight: responsiveFontSize(2.2), textAlign: 'left' }}>{item.company}</Text>
                </View>
                <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                    <Text style={{ color: '#1E40AF', fontWeight: 'bold', fontSize: responsiveFontSize(1.1) }}>{t('applied', 'APPLIED')}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 }}>
                    <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', lineHeight: responsiveFontSize(2.0), textAlign: 'left' }}>{item.location}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', lineHeight: responsiveFontSize(2.0), textAlign: 'left' }}>{t('appliedOn', 'Applied')}: {item.appliedDate}</Text>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', lineHeight: responsiveFontSize(1.8), textAlign: 'left' }}>{t('jobManager', 'Job Manager')}</Text>
                    <Text style={{ fontSize: responsiveFontSize(1.5), color: '#334155', fontWeight: '600', lineHeight: responsiveFontSize(2.2), textAlign: 'left' }}>{item.managerName}</Text>
                </View>

                {/* Call Button */}
                <TouchableOpacity
                    onPress={() => _handleCallManager(item.managerPhone, item.managerName)}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.royalBlue, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24 }}
                >
                    <Ionicons name="call" size={16} color="white" style={{ marginRight: 6 }} />
                    <Text style={{ color: 'white', fontSize: responsiveFontSize(1.5), fontWeight: 'bold' }}>{t('callNow', 'Call Now')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: responsiveWidth(4), paddingTop: responsiveHeight(6), backgroundColor: colors.white, elevation: 4 }}>
                <TouchableOpacity onPress={_goBack} style={{ padding: 5, marginRight: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.royalBlue, textAlign: 'left' }}>
                        {t('selectJob', 'Select Job')}
                    </Text>
                    <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', lineHeight: responsiveFontSize(1.9), textAlign: 'left' }}>
                        {t('callManagerForJob', 'Call manager for the specific job')}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(4) }} showsVerticalScrollIndicator={false}>
                {jobs.length > 0 ? (
                    jobs.map(job => <JobCard key={job.id} item={job} />)
                ) : (
                    <View style={{ alignItems: 'center', marginTop: responsiveHeight(10) }}>
                        <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
                        <Text style={{ marginTop: 12, fontSize: responsiveFontSize(1.6), color: '#64748B', textAlign: 'center', lineHeight: responsiveFontSize(2.4), paddingHorizontal: 20 }}>
                            {t('noJobManagerAssigned', "No Job Manager Assigned")}
                        </Text>
                    </View>
                )}

                {/* Data Security Note */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 20, marginBottom: 20, paddingHorizontal: 10 }}>
                    <Ionicons name="lock-closed-outline" size={12} color="#94A3B8" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: responsiveFontSize(1.2), color: '#94A3B8', textAlign: 'center', lineHeight: responsiveFontSize(1.8) }}>
                        {t('callsMonitored', 'Calls are monitored for quality and training purposes.')}
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
};

export default CallJobManagerList;
