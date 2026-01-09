import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, FlatList, StatusBar } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/src/stacks/stacks';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { hitSlop } from '@truckmitr/src/app/functions';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { AnimatedFAB } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function AddDriver() {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [fullName, setfullName] = useState<string>('');
    const [email, setemail] = useState<string>('');
    const [mobile, setmobile] = useState<string>('');
    const [state, setstate] = useState<string>('')
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // State modal
    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState('');

    // Inside your component
    const [isExtended, setIsExtended] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

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
            setIsExtended(false); // Optional: shrink FAB
            setIsVisible(false);  // Hide FAB
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
        <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center' }}>
            <Space height={safeAreaInsets.top} />
            {/* Apple-style Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: responsiveFontSize(2),
                width: '100%',
            }}>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={_goback}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.blackOpacity(0.05)
                    }}
                >
                    <Ionicons name={'chevron-back'} size={22} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{
                    fontSize: responsiveFontSize(2.2),
                    color: colors.black,
                    fontWeight: '700'
                }}>
                    {t('addDriver')}
                </Text>
                <View style={{ width: responsiveFontSize(4) }} />
            </View>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.white, alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={responsiveHeight(30)}>
                <View style={{ flex: 1, width: responsiveWidth(100), paddingHorizontal: responsiveWidth(5) }}>
                    <Space height={responsiveFontSize(4)} />
                    <View>
                        {/*  */}
                        <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600' }}>{t('fullName')} <Text style={{ color: colors.roseRed, fontWeight: 'bold' }}>*</Text>
                        </Text>
                        <TextInput
                            value={fullName}
                            onChangeText={(text) => {
                                setfullName(text)
                                setErrors((prevData) => ({
                                    ...prevData,
                                    fullName: undefined,
                                }));
                            }}
                            placeholder={t('enterFullName')}
                            placeholderTextColor={colors.blackOpacity(0.4)}
                            style={{
                                color: colors.black,
                                fontSize: responsiveFontSize(2),
                                fontWeight: '500',
                                height: responsiveHeight(5.5),
                                borderColor: colors.blackOpacity(0.2),
                                borderWidth: 1,
                                borderRadius: 10,
                                marginTop: responsiveFontSize(0.5),
                                paddingHorizontal: responsiveFontSize(2),
                            }}
                        />
                        {errors?.fullName && (
                            <Text style={{ color: 'red', fontSize: responsiveFontSize(1.6), marginTop: responsiveFontSize(.5), }}>{errors?.fullName}</Text>
                        )}
                    </View>
                    <Space height={responsiveFontSize(2.5)} />

                    {/* E-mail */}
                    <View>
                        <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600' }}>{t('e-mail')}</Text>
                        <TextInput
                            value={email}
                            onChangeText={(text) => {
                                const lower = text.toLowerCase(); // lowercase all
                                setemail(lower)
                                setErrors((prevData) => ({
                                    ...prevData,
                                    email: undefined,
                                }));
                            }}
                            placeholder={t('enterE-mail')}
                            placeholderTextColor={colors.blackOpacity(0.4)}
                            keyboardType={'email-address'}
                            style={{
                                color: colors.black,
                                fontSize: responsiveFontSize(2),
                                fontWeight: '500',
                                height: responsiveHeight(5.5),
                                borderColor: colors.blackOpacity(0.2),
                                borderWidth: 1,
                                borderRadius: 10,
                                marginTop: responsiveFontSize(0.5),
                                paddingHorizontal: responsiveFontSize(2),
                            }}
                        />
                        {errors?.email && (
                            <Text style={{ color: 'red', fontSize: responsiveFontSize(1.6), marginTop: responsiveFontSize(.5), }}>{errors?.email}</Text>
                        )}
                    </View>
                    <Space height={responsiveFontSize(2.5)} />

                    {/* Mobile */}
                    <View>
                        <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600' }}>{t(`mobile`)} <Text style={{ color: colors.roseRed, fontWeight: 'bold' }}>*</Text>
                        </Text>
                        <TextInput
                            value={mobile}
                            placeholder={t('enterMobile')}
                            placeholderTextColor={colors.blackOpacity(0.4)}
                            keyboardType='number-pad'
                            maxLength={10}
                            onChangeText={(text) => {
                                // Only allow numeric characters
                                const numericText = text.replace(/[^0-9]/g, '');
                                setmobile(numericText)
                                setErrors((prevData) => ({
                                    ...prevData,
                                    mobile: undefined,
                                }));
                            }}
                            style={{
                                color: colors.black,
                                fontSize: responsiveFontSize(2),
                                fontWeight: '500',
                                height: responsiveHeight(5.5),
                                borderColor: colors.blackOpacity(0.2),
                                borderWidth: 1,
                                borderRadius: 10,
                                marginTop: responsiveFontSize(0.5),
                                paddingHorizontal: responsiveFontSize(2),
                            }}
                        />
                        {errors?.mobile && (
                            <Text style={{ color: 'red', fontSize: responsiveFontSize(1.6), marginTop: responsiveFontSize(.5), }}>{errors?.mobile}</Text>
                        )}
                    </View>
                    <Space height={responsiveFontSize(2.5)} />

                    {/* State Selector */}
                    <View>
                        <Text style={{ fontSize: responsiveFontSize(1.8), color: colors.black, fontWeight: '500', marginLeft: responsiveFontSize(0.5) }}>{t(`state`)} <Text style={{ color: 'red' }}>*</Text></Text>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setStateModalVisible(true)}
                            style={{
                                height: responsiveHeight(5.5),
                                paddingHorizontal: responsiveFontSize(2),
                                borderRadius: 10,
                                borderColor: errors.state ? colors.roseRed : colors.blackOpacity(0.2),
                                borderWidth: 1,
                                backgroundColor: colors.white,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: responsiveFontSize(0.5),
                            }}>
                            <Text style={{
                                fontSize: responsiveFontSize(1.9),
                                color: selectedStateName ? colors.black : colors.blackOpacity(0.4),
                                fontWeight: '500',
                            }}>
                                {selectedStateName || t("selectState")}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.blackOpacity(0.5)} />
                        </TouchableOpacity>
                        {errors.state && (
                            <Text style={{ color: 'red', fontSize: responsiveFontSize(1.6), marginTop: 4 }}>{errors.state}</Text>
                        )}
                    </View>
                    {/*  */}
                    <Space height={responsiveFontSize(6)} />
                    <TouchableOpacity
                        onPress={_onPressAddDriver}
                        activeOpacity={0.7}
                        style={{
                            height: responsiveHeight(5.8),
                            width: responsiveWidth(90),
                            backgroundColor: colors.royalBlue,
                            alignItems: 'center',
                            justifyContent: 'center',
                            alignSelf: 'center',
                            borderRadius: 8,
                        }}>
                        {loading ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <Text style={{ color: colors.white, fontSize: responsiveFontSize(2), fontWeight: '500' }}>{t(`addDriver`)}</Text>
                        )}
                    </TouchableOpacity>
                    <Space height={responsiveFontSize(10)} />
                    <AnimatedFAB
                        icon={({ size, color }) => (
                            <MaterialCommunityIcons name="microsoft-excel" size={size} color={color} />
                        )}
                        extended={isExtended}
                        label={t('uploadExcel')}
                        color={colors.white}
                        onPress={() => navigation.navigate(STACKS.EXCEL_IMPORT)}
                        visible={isVisible}
                        iconMode={'dynamic'}
                        style={{
                            position: 'absolute',
                            bottom: responsiveHeight(10),
                            right: responsiveWidth(5),
                            backgroundColor: colors.royalBlue
                        }}
                    />
                </View>
            </KeyboardAwareScrollView>

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
                        paddingTop: safeAreaInsets.top,
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
                            paddingTop: 10,
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
                                        setstate(item.id.toString());
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
        </View>
    )
}
