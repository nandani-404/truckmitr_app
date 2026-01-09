import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import Feather from 'react-native-vector-icons/Feather'
import { FlatList } from 'react-native';
import { Image } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { driverProfileEditAction, subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AnimatedFAB } from 'react-native-paper';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const RenderDriverList = ({ item, fetchDriverList }: any) => {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const deleteAccount = async () => {
        try {
            const response: any = await axiosInstance.delete(END_POINTS?.TRANSPORTER_DELETE_DRIVERS(item?.id));
            if (response?.data?.status) {
                fetchDriverList()
            }
        } catch (error) {

        } finally {

        }
    }

    const _onPressDeleteDriver = () => {
        Alert.alert(
            `${t(`deleteDriver`)} (${item?.name})`,
            t("areYouSureYouWantToDeleteDriver"),
            [
                {
                    text: t("cancel"),
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel",

                },
                {
                    text: t("ok"), onPress: () => deleteAccount(),
                }
            ]
        )
    }

    const _navigateEditDriver = () => {
        dispatch(driverProfileEditAction({ ...item }));
        navigation.navigate(STACKS?.DRIVER_PROFILE_EDIT_BY_TRANSPORTER)
    }

    return (
        <View style={{ width: responsiveWidth(94), backgroundColor: colors.white, padding: responsiveFontSize(1.5), borderRadius: 10, marginBottom: responsiveFontSize(5), ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.2) : colors.blackOpacity(.3) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', backgroundColor: colors.bronzeOpacity(.08), alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: responsiveFontSize(1.5), paddingVertical: responsiveFontSize(.2), marginTop: responsiveFontSize(1), borderRadius: 100, marginLeft: responsiveFontSize(.5) }}>
                    <Text style={{ color: colors.bronze, fontSize: responsiveFontSize(1.6), fontWeight: '500' }}>{item?.ranking}</Text>
                    <Image style={{ height: responsiveFontSize(2.4), width: responsiveFontSize(2.4) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11881/11881945.png' }} />
                </View>
                <Space style={{ flex: 1 }} />
                <TouchableOpacity onPress={_navigateEditDriver} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), backgroundColor: colors.blackOpacity(.04), alignItems: 'center', justifyContent: 'center', borderRadius: 100 }}>
                    <Image style={{ height: responsiveFontSize(2), width: responsiveFontSize(2), tintColor: colors.blackOpacity(.8) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2740/2740651.png' }} />
                </TouchableOpacity>
                <Space width={responsiveFontSize(1)} />
                <TouchableOpacity onPress={_onPressDeleteDriver} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), backgroundColor: colors.blackOpacity(.04), alignItems: 'center', justifyContent: 'center', borderRadius: 100 }}>
                    <Image style={{ height: responsiveFontSize(2.2), width: responsiveFontSize(2.2), tintColor: colors.blackOpacity(.8) }} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9623/9623100.png' }} />
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', marginStart: responsiveFontSize(1), marginTop: responsiveFontSize(.5) }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <FontAwesome
                        key={i}
                        name={'star'}
                        size={14}
                        color={i < item?.star_rating ? colors.royalBlue : colors.blackOpacity(.2)}
                        style={{ marginEnd: responsiveFontSize(.5) }}
                    />
                ))}

            </View>
            <Space height={responsiveHeight(2)} />
            <View style={{ flexDirection: 'row' }}>
                <Image style={{ height: responsiveFontSize(12), width: responsiveFontSize(12), borderRadius: 100 }} source={{ uri: item?.images ? `${BASE_URL}public/${item?.images}` : `https://cdn-icons-png.flaticon.com/512/3177/3177440.png` }} />
                <View style={{ padding: responsiveFontSize(.5), paddingHorizontal: responsiveFontSize(2) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome name='id-card-o' size={14} color={colors.royalBlue} />
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.8), fontWeight: '500', marginStart: responsiveFontSize(1) }}>{item?.unique_id}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(.4) }}>
                        <FontAwesome name='user' size={16} color={colors.royalBlue} />
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(1) }}>{item?.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(.4) }}>
                        <FontAwesome name='phone' size={16} color={colors.royalBlue} />
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.8), fontWeight: '500', marginStart: responsiveFontSize(1) }}>{item?.mobile}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(.4) }}>
                        <Ionicons name='mail' size={16} color={colors.royalBlue} />
                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.8), fontWeight: '500', marginStart: responsiveFontSize(1) }}>{item?.email}</Text>
                    </View>
                </View>
            </View>
            <Space height={responsiveHeight(2)} />
        </View>
    );
}

export default function DriverList() {
    const dispatch = useDispatch()
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [loading, setloading] = useState(true)
    const [driverList, setdriverList] = useState([])
    const [search, setsearch] = useState('')

    const [isExtended, setIsExtended] = useState(false);
    const [addDriverModal, setAddDriverModal] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setIsExtended(true)
        }, 500);
    }, [])

    const _fetchDriverList = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS?.TRANSPORTER_DRIVERS(search));
            if (response?.data?.status) {
                setdriverList(response?.data?.drivers);
            } else {
                setdriverList([]);
            }
        } catch (error) {
            console.error("Error searching jobs:", error);
        } finally {
            setloading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            search.length !== 0 && setloading(true);
            const timer = setTimeout(() => {

                _fetchDriverList();
            }, 500); // debounce delay

            return () => clearTimeout(timer); // cleanup
        }, [search])
    );


    const _goback = () => {
        navigation.goBack()
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={_goback} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t(`driverList`)}</Text>
            </View>
            <View style={{ width: responsiveWidth(95), flexDirection: 'row', height: responsiveHeight(6), alignSelf: 'center', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'space-between', borderColor: colors.blackOpacity(.05), borderWidth: 1, borderRadius: 100, paddingHorizontal: responsiveWidth(4), ...shadow, shadowColor: isIOS() ? colors.blackOpacity(.2) : colors.blackOpacity(.4) }}>
                <TextInput
                    value={search}
                    onChangeText={setsearch}
                    placeholder={t('searchDrivers')}
                    style={{
                        flex: 1,
                        padding: 0,
                        fontSize: responsiveFontSize(1.8),
                        color: colors.black
                    }}
                    placeholderTextColor={colors.blackOpacity(.8)}
                />
                <Feather name={'search'} size={20} color={colors.royalBlueOpacity(1)} />
            </View>
            <Space height={responsiveFontSize(1)} />
            {(loading && !search.length) ?
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Space height={responsiveHeight(20)} />
                    <Image style={{ height: responsiveHeight(15), width: responsiveWidth(80), tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
                </View>
                : loading ?
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <ActivityIndicator color={colors.royalBlue} size="small" />
                    </View>
                    :
                    !driverList?.length ?
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Space height={responsiveHeight(20)} />
                            <Image style={{ height: responsiveHeight(15), width: responsiveWidth(80), tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
                            <Text style={{ width: responsiveWidth(80), color: colors.blackOpacity(.9), fontSize: responsiveFontSize(1.9), textAlign: 'center', fontWeight: '500', }}> {search ? `${t(`noDriverFoundFor`)} "${search}" ${t(`trySearchingDifferentKeyword`)}` : t("noDriversCurrentlyAvailable")}</Text>
                        </View>
                        :
                        <View style={{ flex: 1 }}>
                            <FlatList
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                data={driverList}
                                renderItem={({ item, index }) => <RenderDriverList key={index} item={item} index={index} fetchDriverList={_fetchDriverList} />}
                                contentContainerStyle={{ paddingHorizontal: responsiveWidth(3), paddingBottom: responsiveHeight(5), paddingTop: responsiveHeight(2) }}
                                keyExtractor={(item, index) => index.toString()}
                                ListFooterComponent={() => {
                                    return (
                                        <Space height={responsiveHeight(10)} />
                                    )
                                }} />
                        </View>
            }
            <AnimatedFAB
                icon={({ size, color }) => (
                    <FontAwesome6 name="user-tie" size={size} color={color} />
                )}
                label={t('addDriver')}
                color={colors.white}
                extended={isExtended}
                onPress={() => navigation.navigate(STACKS.ADD_DRIVER)}
                visible={true}
                iconMode={'dynamic'}
                style={{
                    position: 'absolute',
                    bottom: responsiveWidth(5),
                    right: responsiveWidth(5),
                    backgroundColor: colors.royalBlue
                }}
            />

            {/* Add Driver Options Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={addDriverModal}
                onRequestClose={() => setAddDriverModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={() => setAddDriverModal(false)}
                >
                    <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 20, width: responsiveWidth(85), maxWidth: 350 }}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <FontAwesome6 name="user-plus" size={28} color={colors.royalBlue} />
                            </View>
                            <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>
                                {t('addDriver', 'Add Driver')}
                            </Text>
                            <Text style={{ fontSize: responsiveFontSize(1.5), color: '#64748B', textAlign: 'center' }}>
                                {t('chooseHowToAddDriver', 'Choose how you want to add drivers')}
                            </Text>
                        </View>

                        {/* Add Single Driver Option */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                backgroundColor: '#F8FAFC',
                                borderRadius: 12,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: '#E2E8F0'
                            }}
                            onPress={() => {
                                setAddDriverModal(false);
                                navigation.navigate(STACKS.ADD_SINGLE_DRIVER_INFO);
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <FontAwesome6 name="user" size={20} color={colors.royalBlue} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B' }}>
                                    {t('addSingleDriver', 'Add Single Driver')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>
                                    {t('addOneDriverManually', 'Add one driver manually')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </TouchableOpacity>

                        {/* Add Multiple Drivers Option */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                backgroundColor: '#F8FAFC',
                                borderRadius: 12,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: '#E2E8F0'
                            }}
                            onPress={() => {
                                setAddDriverModal(false);
                                navigation.navigate(STACKS.ADD_DRIVER);
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <FontAwesome6 name="users" size={20} color="#16A34A" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: responsiveFontSize(1.8), fontWeight: '600', color: '#1E293B' }}>
                                    {t('addMultipleDrivers', 'Add Multiple Drivers')}
                                </Text>
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>
                                    {t('bulkAddDrivers', 'Bulk add drivers via Excel')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={() => setAddDriverModal(false)}
                            style={{ padding: 14, alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: responsiveFontSize(1.7), color: '#64748B', fontWeight: '500' }}>
                                {t('cancel', 'Cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}
