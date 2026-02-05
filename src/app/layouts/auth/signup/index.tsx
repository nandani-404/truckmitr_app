import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Keyboard, TouchableWithoutFeedback, Modal, FlatList, TextInput, Dimensions, StatusBar } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ActivityIndicator, TextInput as PaperTextInput } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { hitSlop } from '@truckmitr/src/app/functions';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function Signup() {
    const { t } = useTranslation();
    const colors = useColor();
    const { shadow } = useShadow();
    const route = useRoute<RouteProp<NavigatorParams, typeof STACKS.SIGNUP>>();
    const preSelectedRole = route.params?.preSelectedRole;
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize, responsiveWidth, responsiveHeight } = useResponsiveScale();

    // Local states for form fields
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [mobile, setMobile] = useState<string>('');
    const [role, setRole] = useState<string>(preSelectedRole || 'driver'); // Default to driver
    const [state, setState] = useState<string>(''); // Selected state
    const [code, setCode] = useState<string>(''); // Selected state
    const [checkBoxSelect, setCheckBoxSelect] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<any[]>([]); // Fetched locations
    const { i18n } = useTranslation(); // Use translation hook from i18next
    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState('');

    // Filtered locations based on search query
    const filteredLocations = useMemo(() => {
        if (!stateSearchQuery.trim()) return locations;
        return locations.filter(item =>
            item.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
        );
    }, [locations, stateSearchQuery]);

    // Get selected state name
    const selectedStateName = useMemo(() => {
        const found = locations.find(item => item.id.toString() === state);
        return found ? found.name : '';
    }, [locations, state]);

    // State for error messages
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        mobile?: string;
        role?: string;
        state?: string;
        checkBox?: string
    }>({});

    const _goback = () => {
        navigation.goBack();
    };

    const imageColorGradient = ['#3D5EE1', '#18A9B3'];

    const _onpressCheckBox = () => {
        setCheckBoxSelect(!checkBoxSelect);
        setErrors((prevData) => ({
            ...prevData,
            checkBox: undefined,
        }));
    };

    const _navigateLogin = () => {
        navigation.navigate(STACKS.LOGIN);
    };

    const getLocation = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.GETSTATES);
            console.log('Fetched locations:', JSON.stringify(response));
            if (response?.data?.status) {
                setLocations(response?.data?.data);
            }
            console.log('Fetched locations:', JSON.stringify(response));
        } catch (error: any) {
            console.log('Error fetching locations:', error);
            showToast(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    const validate = (): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};
        if (!name) {
            newErrors.name = t(`nameRequired`);
            valid = false;
        }
        if (!mobile) {
            newErrors.mobile = t('mobileNumberRequired');
            valid = false;
        } else if (mobile.length < 10) {
            newErrors.mobile = t('mobileNumber_10_digits');
            valid = false;
        }
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = t('invalidEmailFormat');
                valid = false;
            }
        }
        if (!role) {
            newErrors.role = t('roleRequired');
            valid = false;
        }
        if (!state) {
            newErrors.state = t('stateRequired');
            valid = false;
        }
        if (!checkBoxSelect) {
            newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const onSignUpPress = async () => {
        if (!validate()) return;
        setLoading(true);
        const currentLang = i18n.language;
        const formData = new FormData();
        formData.append('name', name);
        formData.append('mobile', mobile);
        formData.append('email', email);
        formData.append('role', role);
        formData.append('states', state);
        formData.append('user_lang', currentLang)
        formData.append('code', code)
        formData.append('consent', 1)

        try {
            const response = await axiosInstance.post(END_POINTS.SIGNUP, formData);
            if (response?.data?.success) {
                showToast(t(`otpSentSuccessfully`));
                const formPayload = { name, mobile, email, role, states: state };
                // ✅ Store incomplete signup info
                await AsyncStorage.setItem('signup_incomplete', JSON.stringify({
                    ...formPayload,
                    timestamp: Date.now(),
                }));
                navigation.navigate('otp' as any, { formData: formPayload });
            } else {
                showToast(response?.data?.message)
            }
        } catch (error: any) {
            console.log('Signup error:', error);
            showToast(error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.white }}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            showsVerticalScrollIndicator={false}
            bounces={false}
            extraScrollHeight={10}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.white }}>
                    <Space height={safeAreaInsets.top} />

                    {/* Header */}
                    <View style={{ width: '100%', paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveHeight(0.5) }}>
                        <TouchableOpacity
                            hitSlop={hitSlop(10)}
                            onPress={_goback}
                            style={{
                                height: 40,
                                width: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.blackOpacity(0.05),
                                borderRadius: 12,
                            }}>
                            <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                        </TouchableOpacity>
                    </View>

                    <Space height={responsiveHeight(2)} />
                    {/* <Text style={{ color: colors.black, fontSize: responsiveFontSize(3), fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 }}>role: {role}</Text> */}
                    {/* Title Section */}
                    <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: responsiveWidth(5) }}>
                        <Text style={{
                            color: colors.black,
                            fontSize: responsiveFontSize(3),
                            fontWeight: '700',
                            textAlign: 'center',
                            letterSpacing: -0.5
                        }}>
                            {t(`welcomeToTruckMitr`)}
                        </Text>
                        <Space height={responsiveHeight(0.5)} />
                        <Text
                            style={{
                                width: responsiveWidth(80),
                                color: colors.blackOpacity(0.5),
                                fontSize: responsiveFontSize(1.6),
                                textAlign: 'center',
                                lineHeight: responsiveFontSize(2.2)
                            }}>
                            {t(`enterTheDetailsToCreateAnAccount`)}
                        </Text>
                    </View>

                    <Space height={responsiveHeight(5)} />

                    {/* Form Container */}
                    <View style={{ width: '100%', paddingHorizontal: responsiveWidth(6) }}>

                        {/* Name Input */}
                        <View style={{ marginBottom: responsiveHeight(1.2) }}>
                            <PaperTextInput
                                mode="outlined"
                                label={<Text>{t(`name`)} <Text style={{ color: colors.error }}>*</Text></Text>}
                                value={name}
                                onChangeText={(text) => {
                                    setName(text)
                                    setErrors((prevData) => ({ ...prevData, name: undefined }));
                                }}
                                keyboardType="default"
                                theme={{ colors: { primary: colors.royalBlue, background: colors.white, onSurface: colors.black } }}
                                style={{ backgroundColor: colors.white, height: 48 }}
                                contentStyle={{ paddingBottom: 11 }}
                                outlineStyle={{ borderRadius: 10, borderColor: errors.name ? colors.error : colors.blackOpacity(0.2) }}
                            />
                            {errors.name && (
                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.4), marginTop: 2, marginLeft: 4 }}>{errors.name}</Text>
                            )}
                        </View>

                        {/* Mobile Input */}
                        <View style={{ marginBottom: responsiveHeight(1.2) }}>
                            <PaperTextInput
                                left={<PaperTextInput.Affix text="+91" textStyle={{ color: colors.black, }} />}
                                mode="outlined"
                                label={<Text>{t(`mobile`)} <Text style={{ color: colors.error }}>*</Text></Text>}
                                value={mobile}
                                onChangeText={(text) => {
                                    setMobile(text)
                                    setErrors((prevData) => ({ ...prevData, mobile: undefined }));
                                }}
                                maxLength={10}
                                keyboardType="phone-pad"
                                theme={{ colors: { primary: colors.royalBlue, background: colors.white, onSurface: colors.black } }}
                                style={{ backgroundColor: colors.white, height: 48 }}
                                contentStyle={{ paddingVertical: 11 }}
                                outlineStyle={{ borderRadius: 10, borderColor: errors.mobile ? colors.error : colors.blackOpacity(0.2) }}
                            />
                            {errors.mobile && (
                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.4), marginTop: 2, marginLeft: 4 }}>{errors.mobile}</Text>
                            )}
                        </View>

                        {/* E-mail Input */}
                        <View style={{ marginBottom: responsiveHeight(1.2) }}>
                            <PaperTextInput
                                mode="outlined"
                                label={t(`e-mail`)}
                                value={email}
                                onChangeText={(text) => {
                                    const lower = text.toLowerCase();
                                    setEmail(lower)
                                    setErrors((prevData) => ({ ...prevData, email: undefined }));
                                }}
                                keyboardType="email-address"
                                theme={{ colors: { primary: colors.royalBlue, background: colors.white, onSurface: colors.black } }}
                                style={{ backgroundColor: colors.white, height: 48 }}
                                contentStyle={{ paddingBottom: 11 }}
                                outlineStyle={{ borderRadius: 10, borderColor: errors.email ? colors.error : colors.blackOpacity(0.2) }}
                            />
                            {errors.email && (
                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.4), marginTop: 2, marginLeft: 4 }}>{errors.email}</Text>
                            )}
                        </View>

                        {/* State Selector */}
                        <View style={{ marginBottom: responsiveHeight(1.5) }}>
                            <Text style={{
                                fontSize: responsiveFontSize(1.5),
                                color: colors.blackOpacity(0.6),
                                fontWeight: '500',
                                marginLeft: responsiveFontSize(0.5),
                                marginBottom: 4
                            }}>
                                {t(`state`)} <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setStateModalVisible(true)}
                                style={{
                                    height: 48,
                                    paddingHorizontal: 16,
                                    borderRadius: 10,
                                    borderColor: errors.state ? colors.error : colors.blackOpacity(0.2),
                                    borderWidth: 1,
                                    backgroundColor: colors.white,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.9),
                                    color: selectedStateName ? colors.black : colors.blackOpacity(0.5),
                                }}>
                                    {selectedStateName || t("selectState")}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.blackOpacity(0.5)} />
                            </TouchableOpacity>
                            {errors.state && (
                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.4), marginTop: 2, marginLeft: 4 }}>{errors.state}</Text>
                            )}
                        </View>

                        {/* Referral Code (Driver only) */}
                        {role == 'driver' && (
                            <View style={{ marginBottom: responsiveHeight(1.2) }}>
                                <PaperTextInput
                                    mode="outlined"
                                    label={t(`referralCode`)}
                                    value={code}
                                    onChangeText={(text) => setCode(text)}
                                    theme={{ colors: { primary: colors.royalBlue, background: colors.white, onSurface: colors.black } }}
                                    style={{ backgroundColor: colors.white, height: 48 }}
                                    contentStyle={{ paddingBottom: 11 }}
                                    outlineStyle={{ borderRadius: 10, borderColor: colors.blackOpacity(0.2) }}
                                />
                            </View>
                        )}

                        {/* Fullscreen State Picker Modal */}
                        <Modal
                            visible={stateModalVisible}
                            animationType="slide"
                            presentationStyle="fullScreen"
                            onRequestClose={() => setStateModalVisible(false)}
                        >
                            <View style={{ flex: 1, backgroundColor: colors.white }}>
                                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                                {/* Modal Header */}
                                <View style={{
                                    paddingTop: safeAreaInsets.top - 50,
                                    backgroundColor: colors.white,
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.blackOpacity(0.08),
                                }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: responsiveWidth(4),
                                        paddingVertical: responsiveHeight(1),
                                    }}>
                                        <TouchableOpacity
                                            hitSlop={hitSlop(10)}
                                            onPress={() => {
                                                setStateModalVisible(false);
                                                setStateSearchQuery('');
                                            }}
                                            style={{
                                                height: 40,
                                                width: 40,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: colors.blackOpacity(0.05),
                                                borderRadius: 12,
                                            }}>
                                            <Ionicons name="close" size={24} color={colors.royalBlue} />
                                        </TouchableOpacity>
                                        <Text style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            fontSize: responsiveFontSize(2.2),
                                            fontWeight: '700',
                                            color: colors.black,
                                            marginRight: 40, // Balance the close button
                                        }}>
                                            {t('selectState')}
                                        </Text>
                                    </View>

                                    {/* Search Bar */}
                                    <View style={{
                                        marginHorizontal: responsiveWidth(4),
                                        marginBottom: responsiveHeight(1),
                                        backgroundColor: colors.blackOpacity(0.04),
                                        borderRadius: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 14,
                                        height: 48,
                                    }}>
                                        <Ionicons name="search" size={20} color={colors.blackOpacity(0.4)} />
                                        <TextInput
                                            style={{
                                                flex: 1,
                                                marginLeft: 10,
                                                fontSize: responsiveFontSize(1.8),
                                                color: colors.black,
                                                padding: 0,
                                            }}
                                            placeholder={t('searchState') || 'Search state...'}
                                            placeholderTextColor={colors.blackOpacity(0.4)}
                                            value={stateSearchQuery}
                                            onChangeText={setStateSearchQuery}
                                            autoCorrect={false}
                                        />
                                        {stateSearchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setStateSearchQuery('')}>
                                                <Ionicons name="close-circle" size={20} color={colors.blackOpacity(0.4)} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* State List */}
                                <FlatList
                                    data={filteredLocations}
                                    keyExtractor={(item) => item.id.toString()}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{
                                        paddingHorizontal: responsiveWidth(4),
                                        paddingTop: 0,
                                        paddingBottom: safeAreaInsets.bottom + 20,
                                    }}
                                    ListEmptyComponent={() => (
                                        <View style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingVertical: responsiveHeight(10),
                                        }}>
                                            <Ionicons name="location-outline" size={48} color={colors.blackOpacity(0.2)} />
                                            <Text style={{
                                                marginTop: 12,
                                                fontSize: responsiveFontSize(1.8),
                                                color: colors.blackOpacity(0.4),
                                            }}>
                                                {t('noStatesFound') || 'No states found'}
                                            </Text>
                                        </View>
                                    )}
                                    renderItem={({ item }) => {
                                        const isSelected = item.id.toString() === state;
                                        return (
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setState(item.id.toString());
                                                    setErrors((prevData) => ({ ...prevData, state: undefined }));
                                                    setStateModalVisible(false);
                                                    setStateSearchQuery('');
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingVertical: responsiveHeight(1.8),
                                                    paddingHorizontal: 16,
                                                    marginBottom: 8,
                                                    backgroundColor: isSelected ? colors.royalBlue + '10' : colors.white,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? colors.royalBlue : colors.blackOpacity(0.08),
                                                }}>
                                                <View style={{
                                                    width: 24,
                                                    height: 24,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: 14,
                                                }}>
                                                    <MaterialCommunityIcons
                                                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                                                        size={24}
                                                        color={isSelected ? colors.royalBlue : colors.blackOpacity(0.3)}
                                                    />
                                                </View>
                                                <Text style={{
                                                    flex: 1,
                                                    fontSize: responsiveFontSize(1.9),
                                                    fontWeight: isSelected ? '600' : '500',
                                                    color: isSelected ? colors.royalBlue : colors.black,
                                                }}>
                                                    {item.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        </Modal>

                        {/* Checkbox */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <TouchableOpacity activeOpacity={0.7} onPress={_onpressCheckBox} style={{ marginTop: -2 }}>
                                <MaterialCommunityIcons
                                    name={checkBoxSelect ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                    size={22}
                                    color={checkBoxSelect ? colors.royalBlue : colors.blackOpacity(0.4)}
                                />
                            </TouchableOpacity>
                            <Text style={{ color: colors.blackOpacity(0.7), marginStart: responsiveFontSize(1), fontSize: responsiveFontSize(1.6), lineHeight: 20, flex: 1 }}>
                                {t(`iAgreeToTruckMitr`)}
                                <Text onPress={() => navigation.navigate(STACKS?.TERMS)} style={{ color: colors.royalBlue, fontWeight: '600' }}> {t(`termsOfUse`)}</Text> {'\n'}
                                <Text onPress={() => navigation.navigate(STACKS?.PRIVACY)} style={{ color: colors.royalBlue, fontWeight: '600' }}></Text>
                            </Text>
                        </View>
                        {errors.checkBox && (
                            <View style={{ flexDirection: 'row', marginTop: responsiveHeight(0.5), marginLeft: 4 }}>
                                <MaterialIcons name="error" size={14} color={colors.error} style={{ marginTop: 2 }} />
                                <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.4), marginLeft: 4 }}>
                                    {errors.checkBox}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ flex: 1 }} />

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={onSignUpPress}
                        activeOpacity={0.8}
                        style={{
                            height: 52,
                            width: responsiveWidth(88),
                            borderRadius: 14,
                            overflow: 'hidden',
                            ...shadow,
                            marginBottom: responsiveHeight(2)
                        }}>
                        <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            colors={imageColorGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(2), fontWeight: '600', letterSpacing: 0.5 }}>
                                    {t(`registerNow`)}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : responsiveHeight(2) }}>
                        <Text style={{ color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.8), fontWeight: '400' }}>
                            {t(`alreadyRegistered`)}{' '}
                        </Text>
                        <TouchableOpacity onPress={_navigateLogin}>
                            <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.9), fontWeight: '700' }}>{t(`login`)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
    );
}
