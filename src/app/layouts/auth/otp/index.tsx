import { ActivityIndicator, Animated, BackHandler, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, AppState, Clipboard, Dimensions, Easing, Image } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/hooks/index';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Space } from '@truckmitr/components/index';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { hitSlop } from '@truckmitr/src/app/functions';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { saveUserData } from '@truckmitr/src/utils/config/token';
import { userAction, userAuthenticatedAction, subscriptionDetailsAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setupFirebaseNotifications } from '@truckmitr/src/utils/notification';
import analytics from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import messaging from '@react-native-firebase/messaging';
import RNOtpVerify from 'react-native-otp-verify';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

type OtpRouteParams = {
    formData: {
        name: string;
        mobile: string;
        email: string;
        role: string;
        states: string;
    };
    flow: string
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Otp = () => {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content');
    const dispatch = useDispatch()
    const route = useRoute();
    const { formData, flow } = route?.params as OtpRouteParams;

    // console.log("formdata", formData);

    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    const [otp, setOtp] = useState(['', '', '', '']);
    const [error, seterror] = useState<string | null>(null);
    const otpInputs = useRef<Array<TextInput | null>>([]);
    const [focusedField, setFocusedField] = useState<number | null>(null);
    const [timer, setTimer] = useState(30);
    const [loading, setloading] = useState(false);
    const [autoVerificationAttempted, setAutoVerificationAttempted] = useState(false);
    const appState = useRef(AppState.currentState);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const inputAnimations = useRef(otp.map(() => ({
        scale: new Animated.Value(1),
    }))).current;

    // Entrance animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Shake animation for errors
    const triggerShakeAnimation = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // Fill animation for each input when OTP is auto-filled
    const animateAutoFill = () => {
        inputAnimations.forEach((anim, index) => {
            setTimeout(() => {
                Animated.sequence([
                    Animated.spring(anim.scale, {
                        toValue: 1.15,
                        friction: 5,
                        tension: 100,
                        useNativeDriver: true,
                    }),
                    Animated.spring(anim.scale, {
                        toValue: 1,
                        friction: 8,
                        tension: 80,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, index * 60);
        });
    };

    useEffect(() => {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true);
        return () => backHandler.remove();
    }, []);

    /**
     * SMS Auto fill
     */
    useEffect(() => {
        const setupOtpListener = async () => {
            getHash();
            startListeningForOtp();
        };

        setupOtpListener();

        return () => {
            RNOtpVerify.removeListener();
        };
    }, [])

    const getHash = () =>
        RNOtpVerify.getHash()
            .then((hash) => {
                console.log('App Hash:', hash);
            })
            .catch((error) => {
                console.log('Error getting hash:', error);
            });

    const startListeningForOtp = () =>
        RNOtpVerify.getOtp()
            .then((p) => {
                console.log('OTP listener started:', p);
                RNOtpVerify.addListener(otpHandler);
            })
            .catch((error) => {
                console.log('Error starting OTP listener:', error);
            });

    const otpHandler = (message: string) => {
        console.log('SMS received:', message);
        if (!message) return;
        const match = /(\d{4})/.exec(message);
        if (match && match[1]) {
            const extractedOtp = match[1];
            setOtp(extractedOtp.split(""));
            animateAutoFill();
            RNOtpVerify.removeListener();
            Keyboard.dismiss();
            showToast(t('otpAutoDetected'));
        }
    };

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                checkClipboardForOtp();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Check if OTP is complete and valid, then auto-verify
    useEffect(() => {
        const fullOtp = otp.join('');
        const isComplete = fullOtp.length === otp.length && /^\d+$/.test(fullOtp);

        if (isComplete && !autoVerificationAttempted) {
            setloading(true);
            const autoVerifyTimeout = setTimeout(() => {
                setAutoVerificationAttempted(true);
                verifyOtp();
            }, 600);

            return () => clearTimeout(autoVerifyTimeout);
        }
    }, [otp]);

    const checkClipboardForOtp = async () => {
        try {
            const clipboardContent = await Clipboard.getString();
            const otpMatch = clipboardContent.match(/\b\d{4}\b/);
            if (otpMatch) {
                const extractedOtp = otpMatch[0];
                if (extractedOtp.length === otp.length) {
                    setOtp(extractedOtp.split(''));
                    animateAutoFill();
                    Keyboard.dismiss();
                    showToast(t('otpAutoDetected'));
                }
            }
        } catch (error) {
            console.log('Clipboard check error:', error);
        }
    };

    const handleOtpChange = (index: number, text: string) => {
        // Handle paste - if text has multiple digits, distribute them
        if (text.length > 1) {
            const digits = text.replace(/\D/g, '').slice(0, 4);
            if (digits.length > 0) {
                const newOtp = [...otp];
                digits.split('').forEach((digit, i) => {
                    if (index + i < 4) {
                        newOtp[index + i] = digit;
                    }
                });
                setOtp(newOtp);
                seterror(null);

                const nextEmptyIndex = newOtp.findIndex((d, i) => i >= index && d === '');
                if (nextEmptyIndex !== -1) {
                    otpInputs.current[nextEmptyIndex]?.focus();
                } else {
                    otpInputs.current[3]?.focus();
                    Keyboard.dismiss();
                }
                animateAutoFill();
                return;
            }
        }

        if (/^[0-9]*$/.test(text)) {
            seterror(null);
            setOtp(prevState => {
                const updatedOtp = [...prevState];
                updatedOtp[index] = text;
                if (text && index < otp.length - 1) {
                    otpInputs.current[index + 1]?.focus();
                } else if (text && index === otp.length - 1) {
                    Keyboard.dismiss();
                }
                return updatedOtp;
            });

            // Animate the input on change
            if (text) {
                Animated.sequence([
                    Animated.spring(inputAnimations[index].scale, {
                        toValue: 1.1,
                        friction: 5,
                        tension: 100,
                        useNativeDriver: true,
                    }),
                    Animated.spring(inputAnimations[index].scale, {
                        toValue: 1,
                        friction: 8,
                        tension: 80,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        }
    };

    const handleKeyPress = (index: number, key: string) => {
        if (key === 'Backspace') {
            if (otp[index] !== '') {
                handleOtpChange(index, '');
            }
            if (index > 0) {
                otpInputs.current[index - 1]?.focus();
            }
        } else {
            if (/^[0-9]$/.test(key) && index < otp.length - 1) {
                handleOtpChange(index, key);
            }
        }
    };

    const handleInputFocus = (index: number) => () => {
        setFocusedField(index);
    };

    const handleInputBlur = (index: number) => () => {
        if (focusedField === index) {
            setFocusedField(null);
        }
    };

    const verifyOtp = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length < otp.length) {
            seterror(t("pleaseEnterCompleteOtp"));
            triggerShakeAnimation();
            return;
        }

        if (loading) return;

        seterror(null);
        try {
            const fcmToken = await messaging().getToken();
            const data = new FormData();
            if (flow === 'login') {
                data.append('mobile', formData?.mobile);
                data.append('otp', fullOtp);
                data.append('fcm_token', fcmToken)
            } else {
                data.append('name', formData?.name);
                data.append('email', formData?.email);
                data.append('mobile', formData?.mobile);
                data.append('states', formData?.states);
                data.append('role', formData?.role);
                data.append('otp', fullOtp);
                data.append('fcm_token', fcmToken)
            }
            const endpoint = flow === 'login' ? END_POINTS?.LOGIN_OTP_VERIFY : END_POINTS?.OTP_VERIFY;
            const response: any = await axiosInstance.post(endpoint, data);
            console.log("Verify OTP response:", response);
            if (response?.data?.success) {
                showToast(t('otpVerifiedSuccessfully'))
                if (response?.data?.token) {
                    let token = response?.data?.token;

                    if (token.startsWith('Bearer ')) {
                        token = token.replace('Bearer ', '');
                    }

                    await AsyncStorage.removeItem('signup_incomplete');
                    const userinfo = {
                        id: response?.data?.user?.id ?? '',
                        unique_id: response?.data?.user?.unique_id ?? '',
                        name: response?.data?.user?.name ?? '',
                        mobile: response?.data?.user?.mobile ?? '',
                        email: response?.data?.user?.email ?? '',
                        role: response?.data?.user?.role ?? '',
                    };

                    const eventParams = {
                        method: 'mobile_otp',
                        user_id: String(userinfo.id),
                        user_unique_id: userinfo.unique_id || '',
                        user_name: userinfo.name || '',
                        user_email: userinfo.email || '',
                        user_role: userinfo.role || '',
                    };

                    if (flow === 'login') {
                        await analytics().logEvent('login', eventParams);
                        AppEventsLogger.logEvent('fb_mobile_login', eventParams)
                    } else {
                        await analytics().logEvent('sign_up', { method: 'mobile_otp' });
                        await analytics().logEvent('user_signup', eventParams);
                        AppEventsLogger.logEvent('fb_mobile_complete_registration', { method: 'mobile_otp' });
                        AppEventsLogger.logEvent('user_signup', eventParams);
                    }

                    await analytics().setUserId(userinfo.unique_id || '');
                    await analytics().setUserProperties({
                        user_id: String(userinfo.id),
                        user_unique_id: userinfo.unique_id || '',
                        user_name: userinfo.name || '',
                        user_email: userinfo.email || '',
                        user_role: userinfo.role || '',
                        login_method: 'mobile_otp',
                    });

                    await saveUserData(token);
                    await AsyncStorage.setItem('app_session_active', 'true');

                    // Save module based on role for module-based navigation
                    // Backend roles: driver, transporter → hiring module
                    // Backend roles: foreman, associate → their own modules
                    const userRole = response?.data?.user?.role;
                    let moduleToSave = 'hiring'; // default for driver/transporter
                    if (userRole === 'foreman') {
                        moduleToSave = 'foreman';
                    } else if (userRole === 'associate' || userRole === 'association') {
                        moduleToSave = 'association';
                    }
                    // driver and transporter both map to 'hiring'
                    await AsyncStorage.setItem('SELECTED_MODULE', moduleToSave);
                    dispatch({ type: 'SET_MODULE', payload: moduleToSave });
                    console.log('💾 Module saved from OTP:', moduleToSave);

                    try {
                        await new Promise<void>(resolve => setTimeout(() => resolve(), 300));

                        const profile: any = await axiosInstance.get(END_POINTS?.GET_PROFILE, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'X-Skip-Global-Logout': 'true'
                            }
                        });

                        if (profile?.data?.status) {
                            dispatch(userAction({
                                ...profile.data,
                                data: {
                                    ...profile.data.data,
                                    profile_completed: true,
                                },
                            }));
                            console.log('logging user data ------------', profile?.data);

                            // Fetch subscription details immediately after profile
                            // This ensures subscription data is available before home screen loads
                            // Fixes issue where payment modal was shown on first login even for Pro users
                            try {
                                const sub: any = await axiosInstance.get(END_POINTS?.PAYMENT_SUBSCRIPTION_DETAILS, {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                        'X-Skip-Global-Logout': 'true'
                                    }
                                });
                                const subData = sub?.data?.data || [];
                                dispatch(subscriptionDetailsAction(subData));
                                console.log('📦 Subscription details fetched during OTP verification:', subData?.length ? 'Has subscription' : 'No subscription');
                            } catch (subError) {
                                console.log('⚠️ Failed to fetch subscription details during login:', subError);
                                // Dispatch empty array to set subscriptionDetails as loaded (not null)
                                dispatch(subscriptionDetailsAction([]));
                            }

                            // For new signups, navigate to congratulations screen first
                            if (flow !== 'login') {
                                console.log("🔹 New signup - navigating to Congratulations...");
                                navigation.navigate(STACKS.CONGRATULATIONS as any, {
                                    userData: response?.data?.user,
                                    message: response?.data?.message || 'You have been successfully registered.'
                                });
                            } else {
                                dispatch(userAuthenticatedAction(true))
                            }

                            setupFirebaseNotifications();
                        } else {
                            if (profile?.status === 401 || profile?.status === 403) {
                                showToast("Session invalid. Please try logging in again.");
                                await AsyncStorage.removeItem('app_session_active');
                                await saveUserData('');
                            } else {
                                showToast("Failed to fetch profile details.");
                            }
                        }
                    } catch (profileError: any) {
                        if (profileError?.response?.status === 401 || profileError?.response?.status === 403) {
                            showToast("Authentication failed. Please retry.");
                            await AsyncStorage.removeItem('app_session_active');
                            await saveUserData('');
                        } else {
                            showToast("Error fetching profile: " + (profileError?.message || "Unknown error"));
                        }
                    }
                } else {
                    navigation.navigate(STACKS.APPROVAL as any, { response: response?.data });
                }
            } else {
                seterror(response?.data?.message);
                triggerShakeAnimation();
                setAutoVerificationAttempted(false);
            }
        } catch (error: any) {
            showToast(error?.message || "Verification failed")
            seterror(error?.message || "Verification failed");
            triggerShakeAnimation();
            setAutoVerificationAttempted(false);
        } finally {
            setloading(false);
        }
    };

    const _pressResendOtp = async () => {
        if (timer === 0) {
            setloading(true);
            try {
                if (flow === 'login') {
                    const response: any = await axiosInstance.post(END_POINTS.LOGIN, formData);
                    if (response?.data?.success) {
                        showToast(t(`otpSentSuccessfully`));
                        navigation.navigate(STACKS.OTP as any, { formData: { mobile: formData?.mobile }, flow: 'login' });
                        setTimer(30);
                        setAutoVerificationAttempted(false);
                        setOtp(['', '', '', '']);
                    } else {
                        seterror(response?.data?.message);
                    }
                } else {
                    const response = await axiosInstance.post(END_POINTS.SIGNUP, formData);
                    if (response?.data?.success) {
                        showToast(t(`otpSentSuccessfully`));
                        const formPayload = { name: formData?.name, mobile: formData?.mobile, email: formData?.email, role: formData?.role, states: formData?.states };
                        navigation.navigate('otp' as any, { formData: formPayload });
                        setTimer(30);
                        setAutoVerificationAttempted(false);
                        setOtp(['', '', '', '']);
                    } else {
                        seterror(response?.data?.message);
                    }
                }
            } catch (error: any) {
                showToast(error);
            } finally {
                setloading(false);
            }
        }
    };

    const _goback = () => {
        navigation.goBack();
    };

    const getInputStyle = (index: number) => {
        const isFilled = otp[index] !== '';
        const isFocused = focusedField === index;
        const hasError = !!error;

        return {
            borderColor: hasError
                ? colors.error
                : isFilled
                    ? colors.royalBlue
                    : isFocused
                        ? colors.royalBlue
                        : colors.blackOpacity(0.15),
            borderWidth: isFocused || isFilled ? 2 : 1.5,
            backgroundColor: isFocused ? colors.royalBlueOpacity(0.03) : colors.white,
        };
    };

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={[styles.container, { backgroundColor: colors.white }]}>
                <Space height={safeAreaInsets.top} />

                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        hitSlop={hitSlop(10)}
                        onPress={_goback}
                        style={[styles.backButton, { backgroundColor: colors.blackOpacity(0.05) }]}>
                        <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}>

                    {/* Logo */}
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('@truckmitr/src/assets/bootsplash/splash.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Space height={responsiveHeight(4)} />

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.blackOpacity(0.85) }]}>
                        {t(`OtpVerification`)}
                    </Text>

                    <Space height={responsiveHeight(1)} />

                    {/* Subtitle */}
                    <Text style={[styles.subtitle, { color: colors.blackOpacity(0.5) }]}>
                        {t(`weHaveSentVerificationCode`)} +91-{formData?.mobile}
                    </Text>

                    <Space height={responsiveHeight(5)} />

                    {/* OTP Input Fields */}
                    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.otpInputWrapper,
                                        { transform: [{ scale: inputAnimations[index].scale }] }
                                    ]}>
                                    <TextInput
                                        allowFontScaling={false}
                                        ref={(el: any) => (otpInputs.current[index] = el)}
                                        style={[
                                            styles.otpInput,
                                            getInputStyle(index),
                                            { color: error ? colors.error : colors.royalBlue },
                                        ]}
                                        keyboardType="number-pad"
                                        textContentType="oneTimeCode"
                                        autoComplete="sms-otp"
                                        selectionColor={colors.royalBlue}
                                        maxLength={1}
                                        value={digit}
                                        onChangeText={text => handleOtpChange(index, text)}
                                        onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                        onFocus={handleInputFocus(index)}
                                        onBlur={handleInputBlur(index)}
                                    />
                                </Animated.View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={16} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {error}
                            </Text>
                        </View>
                    )}

                    <Space height={responsiveHeight(5)} />

                    {/* Verify Button */}
                    <TouchableOpacity
                        onPress={verifyOtp}
                        disabled={loading}
                        activeOpacity={0.85}
                        style={[styles.verifyButton, { opacity: loading ? 0.7 : 1 }]}>
                        <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            colors={[colors.royalBlue, '#0a5a9e']}
                            style={styles.gradientButton}>
                            {loading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.verifyButtonText}>{t(`verify`)}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Space height={responsiveHeight(4)} />

                    {/* Resend Section */}
                    <View style={styles.resendSection}>
                        <Text style={[styles.resendLabel, { color: colors.blackOpacity(0.5) }]}>
                            {t(`didntGetTheOtp`)}{' '}
                        </Text>
                        {timer > 0 ? (
                            <Text style={[styles.timerText, { color: colors.blackOpacity(0.4) }]}>
                                {t(`resendSmsIn`)} {timer}s
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={_pressResendOtp} activeOpacity={0.7}>
                                <Text style={[styles.resendButtonText, { color: colors.royalBlue }]}>
                                    {t(`resendSms`)}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        height: 44,
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: SCREEN_WIDTH * 0.5,
        height: 80,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    otpInputWrapper: {
        // wrapper for animation
    },
    otpInput: {
        height: 56,
        width: 48,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    errorText: {
        fontSize: 13,
        fontWeight: '500',
    },
    verifyButton: {
        width: '100%',
    },
    gradientButton: {
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    resendSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    resendLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    resendButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default Otp;