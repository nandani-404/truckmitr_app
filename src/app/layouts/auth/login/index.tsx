import {
    Text,
    TouchableOpacity,
    View,
    Keyboard,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { hitSlop } from '@truckmitr/src/app/functions';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function Login() {
    const { t } = useTranslation();
    const colors = useColor();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize, responsiveWidth, responsiveHeight } = useResponsiveScale();
    const [mobile, setMobile] = useState<string>('');
    const [error, seterror] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false);
    const [noBackButton, setnoBackButton] = useState(false)

    const _goback = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    useEffect(() => {
        if (navigation.canGoBack()) {
            setnoBackButton(false)
        } else {
            setnoBackButton(true)
        }
    }, [])

    const imageColorGradient = ['#3D5EE1', '#18A9B3'];

    // Validate mobile number before API call
    const validateMobile = useCallback((): boolean => {
        if (!mobile) {
            seterror(t(`pleaseEnterYourMobileNumber`));
            return false;
        }
        // if (!/^[6-9]\d{9}$/.test(mobile)) {
        //     seterror(t(`mobileNumber_10_digits`));
        //     return false;
        // }
        return true;
    }, [mobile]);

    const _navigateOtp = useCallback(async () => {
        if (!validateMobile()) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('mobile', mobile);
        try {
            const response: any = await axiosInstance.post(END_POINTS.LOGIN, formData);
            if (response?.data?.success) {
                showToast(t(`otpSentSuccessfully`));
                navigation.navigate(STACKS.OTP as any, { formData: { mobile }, flow: 'login' });
            } else {
                seterror(response?.data?.message);
            }
        } catch (error: any) {
            console.log('Login API error:', error);
            showToast(error);
        } finally {
            setLoading(false);
        }
    }, [mobile, navigation, validateMobile]);


    const _navigateSignup = useCallback(() => {
        navigation.navigate(STACKS.MODULE_SELECTION);
    }, [navigation]);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, backgroundColor: colors.white }}>
                <Space height={safeAreaInsets.top} />

                {/* Header Back Button */}
                <View style={{ width: '100%', paddingHorizontal: responsiveWidth(4), paddingTop: responsiveHeight(1) }}>
                    {!noBackButton && (
                        <TouchableOpacity
                            hitSlop={hitSlop(10)}
                            onPress={_goback}
                            style={{
                                height: responsiveFontSize(5),
                                width: responsiveFontSize(5),
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.royalBlueOpacity(0.05),
                                borderRadius: 100,
                            }}>
                            <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                        </TouchableOpacity>
                    )}
                </View>

                <Space height={responsiveHeight(4)} />

                {/* Main Content */}
                <View style={{ flex: 1, paddingHorizontal: responsiveWidth(6) }}>

                    {/* Title Section */}
                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(3.5), fontWeight: '700', marginBottom: responsiveHeight(1) }}>
                        {t(`welcomeToTruckMitr`)}
                    </Text>
                    <Text style={{ color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.8), lineHeight: responsiveFontSize(2.6) }}>
                        {t(`enterYourMobileNumberTitle`)}
                    </Text>

                    <Space height={responsiveHeight(5)} />

                    {/* Input Section */}
                    <View>
                        <PaperTextInput
                            value={mobile}
                            onChangeText={(text) => {
                                setMobile(text)
                                seterror(null)
                            }}
                            left={<PaperTextInput.Affix text="+91" textStyle={{ color: colors.black, fontSize: responsiveFontSize(2) }} />}
                            mode="outlined"
                            label={t(`mobile`)}
                            contentStyle={{ color: colors.black, fontSize: responsiveFontSize(2) }}
                            keyboardType="phone-pad"
                            outlineColor={colors.blackOpacity(0.15)}
                            activeOutlineColor={colors.royalBlue}
                            maxLength={10}
                            theme={{
                                colors: {
                                    primary: colors.royalBlue,
                                    background: colors.white,
                                    onSurface: colors.black,
                                    outline: colors.blackOpacity(0.2)
                                },
                                roundness: 12
                            }}
                            style={{ backgroundColor: colors.white, fontSize: responsiveFontSize(2) }}
                        />
                        {error && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveHeight(0.8), marginLeft: responsiveWidth(1) }}>
                                <MaterialIcons name="error-outline" size={16} color={colors.error} />
                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.6), marginLeft: responsiveFontSize(0.8) }}>
                                    {error}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Space height={responsiveHeight(4)} />

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={_navigateOtp}
                        activeOpacity={0.8}
                        disabled={loading}
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
                            shadowRadius: 5,
                            opacity: loading ? 0.7 : 1,
                        }}>
                        {loading ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.2), fontWeight: '600' }}>
                                {t(`sendOtp`)}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <Space height={responsiveHeight(3)} />

                    {/* Register Link */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.9) }}>
                            {t(`needAnAccount`)}{' '}
                        </Text>
                        <TouchableOpacity onPress={_navigateSignup}>
                            <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '700' }}>
                                {t(`registerNow`)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}
