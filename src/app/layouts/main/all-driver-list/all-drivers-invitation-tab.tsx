import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColor, useImage, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import AllDriverList from './all-driver-list';
import TransporterInvites from './invitation-status';
import { hitSlop } from '@truckmitr/src/app/functions';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

type TabType = 'all' | 'myInvites';

interface InviteCounts {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
}

export default function AllDriverListWithTabs({ route }: any) {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const images = useImage();
    const { job_id, initialTab } = route?.params || {};

    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'all');
    const [inviteCounts, setInviteCounts] = useState<InviteCounts>({
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0
    });

    // Fetch invitation counts
    const fetchInviteCounts = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS?.TRANSPORTER_INVITES);
            if (response.data.status) {
                const acceptedCount = response.data.accepted?.length || 0;
                const pendingCount = response.data.pending?.length || 0;
                const rejectedCount = response.data.rejected?.length || 0;
                const totalCount = acceptedCount + pendingCount + rejectedCount;

                setInviteCounts({
                    total: totalCount,
                    accepted: acceptedCount,
                    pending: pendingCount,
                    rejected: rejectedCount
                });
            }
        } catch (error) {
            console.error('Error fetching invite counts:', error);
        }
    };

    // Fetch counts on focus
    useFocusEffect(
        useCallback(() => {
            fetchInviteCounts();
        }, [])
    );

    const _goback = () => {
        navigation.goBack()
    }

    // Tab Header Component
    const TabHeader = () => (
        <View style={{
            flexDirection: 'row',
            marginHorizontal: responsiveWidth(3),
            marginBottom: responsiveFontSize(1),
            justifyContent: 'space-between',
        }}>
            {(['all', 'myInvites'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                const count = tab === 'myInvites' ? inviteCounts.total : null;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={{
                            flex: 1,
                            marginHorizontal: 4,
                            paddingVertical: responsiveFontSize(1.6),
                            alignItems: 'center',
                            borderRadius: 8,
                            backgroundColor: isActive ? colors.royalBlue : colors.whiteOpacity(1),
                            borderWidth: 1,
                            borderColor: isActive ? colors.royalBlue : colors.blackOpacity(0.2),
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={{
                            color: isActive ? colors.white : colors.blackOpacity(0.5),
                            fontSize: responsiveFontSize(1.8),
                            fontWeight: isActive ? '600' : '500'
                        }}>
                            {tab === 'all' ? t('allDrivers') : t('myInvites')}
                        </Text>
                        {count !== null && count > 0 && (
                            <View style={{
                                backgroundColor: isActive ? colors.white : colors.royalBlue,
                                borderRadius: 12,
                                minWidth: responsiveFontSize(2.4),
                                height: responsiveFontSize(2.4),
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: responsiveFontSize(0.6),
                                paddingHorizontal: responsiveFontSize(0.5),
                            }}>
                                <Text style={{
                                    color: isActive ? colors.royalBlue : colors.white,
                                    fontSize: responsiveFontSize(1.4),
                                    fontWeight: '700'
                                }}>
                                    {count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.white,
                paddingTop: safeAreaInsets.top + responsiveHeight(1),
                paddingHorizontal: responsiveWidth(4),
                paddingVertical: responsiveHeight(2),
                borderBottomWidth: 1,
                borderBottomColor: colors.blackOpacity(0.06),
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <TouchableOpacity
                        hitSlop={hitSlop(10)}
                        onPress={_goback}
                        style={{
                            position: 'absolute',
                            left: 0,
                            height: responsiveFontSize(5),
                            width: responsiveFontSize(5),
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.royalBlue + '12',
                            borderRadius: responsiveFontSize(2.5),
                        }}
                    >
                        <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                    </TouchableOpacity>

                    <Text style={{
                        fontSize: responsiveFontSize(2.4),
                        color: colors.black,
                        fontWeight: '700',
                        letterSpacing: -0.3
                    }}>
                        {t('inviteDrivers')}
                    </Text>
                </View>
            </View>
            <Space height={responsiveFontSize(1)} />

            {/* Tab Header */}
            <TabHeader />

            {/* Render Active Screen */}
            <View style={{ flex: 1 }}>
                {activeTab === 'all' ? (
                    <AllDriverList job_id={job_id} />
                ) : (
                    <TransporterInvites />
                )}
            </View>
        </View>
    );
};
