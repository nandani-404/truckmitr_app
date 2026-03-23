import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { useColor, useImage, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStatusBarStyle } from '@truckmitr/src/app/hooks/index';
import { Space } from '@truckmitr/src/app/components';
type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;
import LinearGradient from 'react-native-linear-gradient'
import { useTranslation } from 'react-i18next';
import { setupFirebaseNotifications } from '@truckmitr/src/utils/notification';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { fetchCompleteLocationDetails } from '@truckmitr/src/utils/maps/location/location.detail';

export default function Welcome() {
    const { t } = useTranslation();
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale()
    const safeAreaInsets = useSafeAreaInsets()
    const navigation = useNavigation<NavigatorProp>();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const images = useImage()
    const imageColorGradient = ['#3D5EE1', '#18A9B3']

    const _currentLocationDetails = async () => {
        const locationData = await fetchCompleteLocationDetails();
        console.log(locationData, '------------- locationData')
    };

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                await _currentLocationDetails();
                const token = await setupFirebaseNotifications();
                if (!isMounted) return;
                if (token) {
                    const formData = new FormData();
                    formData.append('fcm_token', token);
                    formData.append('device_type', Platform.OS);
                    await axiosInstance.post(END_POINTS.PUBLIC_SAVE_FCM_TOKEN, formData);
                }
            } catch (err) {
                console.log('[FCM] token fetch/save failed:', err);
            }
        })();
        return () => { isMounted = false; }
    }, []);



    const _navigateLogin = () => {
        navigation.navigate(STACKS.LOGIN)
    }
    const _navigateSignup = () => {
        navigation.navigate(STACKS.MODULE_SELECTION_NEW)
    }
    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: responsiveWidth(8) }}>
                <Image
                    style={{ height: responsiveHeight(15), width: responsiveWidth(70), resizeMode: 'contain', marginBottom: responsiveHeight(3) }}
                    source={images.TRUCKMITR_HORIZONTAL}
                />
                <Text style={{ fontSize: responsiveFontSize(3.5), fontWeight: '700', color: colors.royalBlue, textAlign: 'center', marginBottom: responsiveHeight(1) }}>
                    {t('welcomeToTruckMitr')}
                </Text>
                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '400', color: colors.blackOpacity(0.6), textAlign: 'center', lineHeight: responsiveFontSize(2.6) }}>
                    {t('indiasOnlydigitaltruckingEcosystem')}
                </Text>
            </View>

            <View style={{ width: '100%', paddingHorizontal: responsiveWidth(6), paddingBottom: safeAreaInsets.bottom + responsiveHeight(4) }}>
                <TouchableOpacity
                    onPress={_navigateLogin}
                    activeOpacity={0.8}
                    style={{
                        height: responsiveHeight(6.5),
                        width: '100%',
                        borderRadius: 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.royalBlue,
                        elevation: 5,
                        shadowColor: colors.royalBlue,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 5
                    }}
                >
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.2), fontWeight: '600' }}>{t(`login`)}</Text>
                </TouchableOpacity>

                <Space height={responsiveHeight(2)} />

                <TouchableOpacity
                    onPress={_navigateSignup}
                    activeOpacity={0.8}
                    style={{
                        height: responsiveHeight(6.5),
                        width: '100%',
                        borderRadius: 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.white,
                        borderWidth: 1.5,
                        borderColor: colors.royalBlue
                    }}
                >
                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2.2), fontWeight: '600' }}>{t(`registerNow`)}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
