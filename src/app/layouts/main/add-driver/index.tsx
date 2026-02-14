import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, FlatList, StatusBar, Platform } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS, TRUCKER_STACKS } from '@truckmitr/src/stacks/stacks';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { hitSlop } from '@truckmitr/src/app/functions';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons'
import Feather from 'react-native-vector-icons/Feather'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { AnimatedFAB } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useDispatch, useSelector } from 'react-redux';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function AddDriver() {
    const { t: translate, i18n } = useTranslation();
    const dispatch = useDispatch()
    const appMode = useSelector((state: any) => state.appMode.mode);

    // Force English if appMode is trucker
    const t = (key: string, options?: any): string => {
        if (appMode === 'trucker') {
            const translationOptions = typeof options === 'object' ? { ...options, lng: 'en' } : { lng: 'en' };
            return translate(key, translationOptions) as any;
        }
        return translate(key, options) as any;
    };

    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    // Form State
    const [fullName, setfullName] = useState<string>('');
    const [email, setemail] = useState<string>('');
    const [mobile, setmobile] = useState<string>('');
    const [state, setstate] = useState<string>('')
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // State modal
    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState('');

    // FAB State
    const [isExtended, setIsExtended] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Focused input state for UI polish
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

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

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setIsExtended(false);
            setIsVisible(false);
        });

        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setIsExtended(true);
            setIsVisible(true);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setIsExtended(true)
        }, 500);
    }, [])

    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        mobile?: string;
        state?: string;
    }>({});

    const validate = (): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};
        if (!fullName) {
            newErrors.fullName = t(`nameRequired`);
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
        if (!state) {
            newErrors.state = t('stateRequired');
            valid = false;
        }
        setErrors(newErrors);
        return valid;
    };

    const getLocation = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.GETSTATES);
            if (response?.data?.status) {
                setLocations(response?.data?.data);
            }
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

    const _onPressAddDriver = async () => {
        if (!validate()) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('name', fullName);
        formData.append('mobile', mobile);
        formData.append('email', email);
        formData.append('states', state);
        try {
            const response = await axiosInstance.post(END_POINTS.TRANSPORTER_DRIVER_CREATE, formData);
            if (response?.data?.success) {
                if (appMode === 'transporter') {
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [
                                {
                                    name: STACKS.BOTTOM_TAB,
                                    state: {
                                        index: 0,
                                        routes: [
                                            {
                                                name: STACKS.DRIVER_LIST,
                                            },

                                        ],
                                    },
                                },
                            ],
                        })
                    );
                }

            } else {
                showToast(response?.data?.message)
            }
        } catch (error: any) {
            console.log('Signup error:', error);
            showToast(error);
        } finally {
            navigation.goBack()
            setLoading(false);
        }
    };

    const _goback = () => {
        navigation.goBack()
    }

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
                zIndex: 10
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
                        {t('addDriver')}
                    </Text>
                </View>
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.white, paddingBottom: responsiveHeight(12) }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={responsiveHeight(10)}>

                <View style={{ paddingHorizontal: responsiveWidth(5), paddingTop: responsiveHeight(3) }}>

                    {/* Header Info */}
                    <View style={{ marginBottom: responsiveHeight(3) }}>
                        <Text style={{
                            fontSize: responsiveFontSize(2.2),
                            fontWeight: '700',
                            color: colors.black,
                            marginBottom: 4
                        }}>
                            {t('driverDetails') || 'Driver Details'}
                        </Text>
                        <Text style={{
                            fontSize: responsiveFontSize(1.7),
                            color: colors.blackOpacity(0.5),
                            lineHeight: responsiveFontSize(2.2)
                        }}>
                            {t('fillDriverDetails') || 'Please fill in the details below to add a new driver to your network.'}
                        </Text>
                    </View>

                    <InputField
                        id="name"
                        label={t('fullName')}
                        value={fullName}
                        onChangeText={(text: string) => {
                            setfullName(text)
                            setErrors((prevData) => ({ ...prevData, fullName: undefined }));
                        }}
                        placeholder={t('enterFullName')}
                        icon="user"
                        error={errors?.fullName}
                        required
                        colors={colors}
                        responsiveFontSize={responsiveFontSize}
                        responsiveHeight={responsiveHeight}
                        focusedInput={focusedInput}
                        setFocusedInput={setFocusedInput}
                    />

                    <InputField
                        id="mobile"
                        label={t('mobile')}
                        value={mobile}
                        onChangeText={(text: string) => {
                            const numericText = text.replace(/[^0-9]/g, '');
                            setmobile(numericText)
                            setErrors((prevData) => ({ ...prevData, mobile: undefined }));
                        }}
                        placeholder={t('enterMobile')}
                        icon="phone"
                        keyboardType="number-pad"
                        maxLength={10}
                        error={errors?.mobile}
                        required
                        colors={colors}
                        responsiveFontSize={responsiveFontSize}
                        responsiveHeight={responsiveHeight}
                        focusedInput={focusedInput}
                        setFocusedInput={setFocusedInput}
                    />

                    <InputField
                        id="email"
                        label={t('e-mail')}
                        value={email}
                        onChangeText={(text: string) => {
                            setemail(text.toLowerCase())
                            setErrors((prevData) => ({ ...prevData, email: undefined }));
                        }}
                        placeholder={t('enterE-mail')}
                        icon="mail"
                        keyboardType="email-address"
                        error={errors?.email}
                        colors={colors}
                        responsiveFontSize={responsiveFontSize}
                        responsiveHeight={responsiveHeight}
                        focusedInput={focusedInput}
                        setFocusedInput={setFocusedInput}
                    />

                    {/* State Selector */}
                    <View style={{ marginBottom: responsiveFontSize(2) }}>
                        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                            <Text style={{
                                color: colors.blackOpacity(0.7),
                                fontSize: responsiveFontSize(1.7),
                                fontWeight: '600'
                            }}>
                                {t('state')}
                            </Text>
                            <Text style={{ color: colors.roseRed, fontWeight: 'bold', marginLeft: 2 }}>*</Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setStateModalVisible(true)}
                            style={{
                                backgroundColor: colors.blackOpacity(0.02),
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: errors.state ? colors.roseRed : colors.blackOpacity(0.08),
                                flexDirection: 'row',
                                alignItems: 'center',
                                height: responsiveHeight(6.5),
                                paddingHorizontal: responsiveFontSize(1.5),
                            }}>
                            <View style={{
                                width: responsiveFontSize(4.5),
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRightWidth: 1,
                                borderRightColor: colors.blackOpacity(0.05),
                                paddingRight: responsiveFontSize(1),
                                marginRight: responsiveFontSize(1)
                            }}>
                                <Feather
                                    name="map-pin"
                                    size={20}
                                    color={errors.state ? colors.roseRed : colors.blackOpacity(0.4)}
                                />
                            </View>

                            <Text style={{
                                flex: 1,
                                fontSize: responsiveFontSize(2),
                                color: selectedStateName ? colors.black : colors.blackOpacity(0.4),
                                fontWeight: selectedStateName ? '500' : '400',
                            }}>
                                {selectedStateName || t("selectState")}
                            </Text>

                            <Feather name="chevron-down" size={20} color={colors.blackOpacity(0.5)} />
                        </TouchableOpacity>

                        {errors.state && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingLeft: 4 }}>
                                <Feather name="alert-circle" size={12} color={colors.roseRed} />
                                <Text style={{ color: colors.roseRed, fontSize: responsiveFontSize(1.5), marginLeft: 4 }}>{errors.state}</Text>
                            </View>
                        )}
                    </View>

                    <Space height={responsiveFontSize(4)} />

                    <TouchableOpacity
                        onPress={_onPressAddDriver}
                        activeOpacity={0.8}
                        style={{
                            height: responsiveHeight(6.5),
                            width: '100%',
                            backgroundColor: colors.royalBlue,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 14,
                            ...shadow,
                            shadowColor: colors.royalBlue,
                            shadowOpacity: 0.3,
                        }}>
                        {loading ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="plus-circle" size={20} color={colors.white} style={{ marginRight: 8 }} />
                                <Text style={{ color: colors.white, fontSize: responsiveFontSize(2.1), fontWeight: '600' }}>
                                    {t('addDriver')}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                </View>

                {/* Conditional Button: Excel Import or My Drivers */}
                {appMode === 'trucker' ? (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(TRUCKER_STACKS.DRIVER_LIST as any)}
                        style={{
                            position: 'absolute',
                            bottom: responsiveHeight(4),
                            right: responsiveWidth(5),
                            backgroundColor: colors.royalBlue,
                            paddingHorizontal: responsiveWidth(5),
                            height: 56,
                            borderRadius: 28,
                            flexDirection: 'row',
                            alignItems: 'center',
                            ...shadow,
                            elevation: 5,
                        }}
                    >
                        <MaterialCommunityIcons name="account-group" size={24} color={colors.white} />
                        <Text style={{
                            color: colors.white,
                            fontSize: responsiveFontSize(1.8),
                            fontWeight: '700',
                            marginLeft: 10
                        }}>
                            {t('myDrivers') || 'My Drivers'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <AnimatedFAB
                        icon={({ size, color }) => (
                            <MaterialCommunityIcons name="microsoft-excel" size={24} color={color} />
                        )}
                        extended={isExtended}
                        label={t('uploadExcel')}
                        color={colors.white}
                        onPress={() => navigation.navigate(STACKS.EXCEL_IMPORT)}
                        visible={isVisible}
                        animateFrom={'right'}
                        iconMode={'dynamic'}
                        style={{
                            position: 'absolute',
                            bottom: responsiveHeight(4),
                            right: responsiveWidth(5),
                            backgroundColor: '#1D6F42', // Excel green color
                            borderRadius: 30,
                        }}
                    />
                )}
            </KeyboardAwareScrollView>

            {/* Fullscreen State Picker Modal */}
            <Modal
                visible={stateModalVisible}
                animationType="slide"
                presentationStyle="pageSheet" // Better on iOS
                onRequestClose={() => setStateModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.white }}>

                    {/* Modal Header */}
                    <View style={{
                        paddingTop: Platform.OS === 'ios' ? responsiveHeight(2) : 0,
                        backgroundColor: colors.white,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.blackOpacity(0.08),
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: responsiveWidth(4),
                            paddingVertical: responsiveHeight(2),
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
                                <Feather name="x" size={24} color={colors.black} />
                            </TouchableOpacity>
                            <Text style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: responsiveFontSize(2.2),
                                fontWeight: '700',
                                color: colors.black,
                                marginRight: 40,
                            }}>
                                {t('selectState')}
                            </Text>
                        </View>

                        {/* Modern Search Bar */}
                        <View style={{
                            marginHorizontal: responsiveWidth(4),
                            marginBottom: responsiveHeight(1.5),
                            backgroundColor: colors.blackOpacity(0.04),
                            borderRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            height: 54,
                            borderWidth: 1,
                            borderColor: colors.blackOpacity(0.04)
                        }}>
                            <Feather name="search" size={20} color={colors.blackOpacity(0.4)} />
                            <TextInput
                                style={{
                                    flex: 1,
                                    marginLeft: 12,
                                    fontSize: responsiveFontSize(2),
                                    color: colors.black,
                                    height: '100%',
                                }}
                                placeholder={t('searchState') || 'Search state...'}
                                placeholderTextColor={colors.blackOpacity(0.4)}
                                value={stateSearchQuery}
                                onChangeText={setStateSearchQuery}
                                autoCorrect={false}
                            />
                            {stateSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setStateSearchQuery('')}>
                                    <Feather name="x-circle" size={20} color={colors.blackOpacity(0.4)} />
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
                            paddingTop: 16,
                            paddingBottom: safeAreaInsets.bottom + 40,
                        }}
                        ListEmptyComponent={() => (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: responsiveHeight(10),
                            }}>
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: colors.blackOpacity(0.03),
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16
                                }}>
                                    <Feather name="map-pin" size={40} color={colors.blackOpacity(0.2)} />
                                </View>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.8),
                                    color: colors.blackOpacity(0.4),
                                    fontWeight: '500'
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
                                        setstate(item.id.toString());
                                        setErrors((prevData) => ({ ...prevData, state: undefined }));
                                        setStateModalVisible(false);
                                        setStateSearchQuery('');
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: responsiveHeight(2),
                                        paddingHorizontal: 20,
                                        marginBottom: 10,
                                        backgroundColor: isSelected ? colors.royalBlue + '08' : colors.white,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: isSelected ? colors.royalBlue : colors.blackOpacity(0.06),
                                    }}>
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: isSelected ? colors.royalBlue : colors.blackOpacity(0.05),
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 16,
                                    }}>
                                        {isSelected ? (
                                            <Feather name="check" size={20} color={colors.white} />
                                        ) : (
                                            <Text style={{
                                                color: colors.blackOpacity(0.4),
                                                fontSize: responsiveFontSize(2),
                                                fontWeight: '600'
                                            }}>
                                                {item.name.charAt(0)}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            fontSize: responsiveFontSize(2),
                                            fontWeight: isSelected ? '700' : '600',
                                            color: isSelected ? colors.royalBlue : colors.black,
                                        }}>
                                            {item.name}
                                        </Text>
                                    </View>

                                    {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.royalBlue }} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    )
}

// Custom Input Component
const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    keyboardType = 'default',
    maxLength,
    icon,
    id,
    required = false,
    colors,
    responsiveFontSize,
    responsiveHeight,
    focusedInput,
    setFocusedInput
}: any) => {
    const isFocused = focusedInput === id;

    return (
        <View style={{ marginBottom: responsiveFontSize(2) }}>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Text style={{
                    color: colors.blackOpacity(0.7),
                    fontSize: responsiveFontSize(1.7),
                    fontWeight: '600'
                }}>
                    {label}
                </Text>
                {required && <Text style={{ color: colors.roseRed, fontWeight: 'bold', marginLeft: 2 }}>*</Text>}
            </View>

            <View style={{
                backgroundColor: isFocused ? colors.royalBlue + '08' : colors.blackOpacity(0.02),
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: error ? colors.roseRed : (isFocused ? colors.royalBlue : colors.blackOpacity(0.08)),
                flexDirection: 'row',
                alignItems: 'center',
                height: responsiveHeight(6.5),
                paddingHorizontal: responsiveFontSize(1.5),
            }}>
                <View style={{
                    width: responsiveFontSize(4.5),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRightWidth: 1,
                    borderRightColor: colors.blackOpacity(0.05),
                    paddingRight: responsiveFontSize(1),
                    marginRight: responsiveFontSize(1)
                }}>
                    <Feather
                        name={icon}
                        size={20}
                        color={error ? colors.roseRed : (isFocused ? colors.royalBlue : colors.blackOpacity(0.4))}
                    />
                </View>

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.blackOpacity(0.4)}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    style={{
                        flex: 1,
                        color: colors.black,
                        fontSize: responsiveFontSize(2),
                        fontWeight: '500',
                        height: '100%',
                    }}
                    onFocus={() => setFocusedInput(id)}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>
            {error && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingLeft: 4 }}>
                    <Feather name="alert-circle" size={12} color={colors.roseRed} />
                    <Text style={{ color: colors.roseRed, fontSize: responsiveFontSize(1.5), marginLeft: 4 }}>{error}</Text>
                </View>
            )}
        </View>
    );
};
