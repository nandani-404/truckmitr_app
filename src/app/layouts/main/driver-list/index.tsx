import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import { Image } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { driverProfileEditAction, subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AnimatedFAB } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';

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

    const getDriverImage = () => {
        if (item?.images) {
            return `${BASE_URL}public/${item?.images}`;
        }
        return 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    };

    return (
        <View style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            marginBottom: responsiveFontSize(2),
            ...shadow,
            shadowColor: isIOS() ? colors.blackOpacity(.15) : colors.blackOpacity(.3),
            overflow: 'hidden'
        }}>
            {/* Header with gradient */}
            <LinearGradient
                colors={[colors.royalBlue, colors.royalBlueOpacity(0.85)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: responsiveFontSize(1.5),
                    paddingVertical: responsiveFontSize(1),
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        paddingHorizontal: responsiveFontSize(1),
                        paddingVertical: responsiveFontSize(0.3),
                        borderRadius: 100
                    }}>
                        <Image
                            style={{ height: responsiveFontSize(2), width: responsiveFontSize(2) }}
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11881/11881945.png' }}
                        />
                        <Text style={{
                            color: colors.white,
                            fontSize: responsiveFontSize(1.5),
                            fontWeight: '600',
                            marginLeft: responsiveFontSize(0.4)
                        }}>
                            {item?.ranking || 'N/A'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginLeft: responsiveFontSize(1) }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FontAwesome
                                key={i}
                                name={'star'}
                                size={responsiveFontSize(1.4)}
                                color={i < item?.star_rating ? '#FFD700' : 'rgba(255,255,255,0.4)'}
                                style={{ marginRight: responsiveFontSize(0.3) }}
                            />
                        ))}
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        onPress={_navigateEditDriver}
                        style={{
                            height: responsiveFontSize(3.5),
                            width: responsiveFontSize(3.5),
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 100
                        }}
                    >
                        <Feather name="edit-2" size={responsiveFontSize(1.6)} color={colors.white} />
                    </TouchableOpacity>
                    <Space width={responsiveFontSize(1)} />
                    <TouchableOpacity
                        onPress={_onPressDeleteDriver}
                        style={{
                            height: responsiveFontSize(3.5),
                            width: responsiveFontSize(3.5),
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 100
                        }}
                    >
                        <Feather name="trash-2" size={responsiveFontSize(1.6)} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Driver Info Section */}
            <View style={{ padding: responsiveFontSize(1.5) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Driver Image */}
                    <View style={{
                        borderRadius: 100,
                        borderWidth: 3,
                        borderColor: colors.royalBlueOpacity(0.15),
                        padding: 2
                    }}>
                        <Image
                            style={{
                                height: responsiveFontSize(9),
                                width: responsiveFontSize(9),
                                borderRadius: 100
                            }}
                            source={{ uri: getDriverImage() }}
                        />
                    </View>

                    {/* Driver Details */}
                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1.5) }}>
                        {/* Name */}
                        <Text style={{
                            color: colors.black,
                            fontSize: responsiveFontSize(2.2),
                            fontWeight: '700',
                            marginBottom: responsiveFontSize(0.5)
                        }}>
                            {item?.name || 'N/A'}
                        </Text>

                        {/* Unique ID */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.royalBlueOpacity(0.08),
                            alignSelf: 'flex-start',
                            paddingHorizontal: responsiveFontSize(1),
                            paddingVertical: responsiveFontSize(0.4),
                            borderRadius: 6,
                            marginBottom: responsiveFontSize(0.8)
                        }}>
                            <FontAwesome name='id-card-o' size={responsiveFontSize(1.4)} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue,
                                fontSize: responsiveFontSize(1.5),
                                fontWeight: '600',
                                marginLeft: responsiveFontSize(0.5)
                            }}>
                                {item?.unique_id || 'N/A'}
                            </Text>
                        </View>

                        {/* Contact Info */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginRight: responsiveFontSize(2),
                                marginBottom: responsiveFontSize(0.5)
                            }}>
                                <View style={{
                                    height: responsiveFontSize(2.5),
                                    width: responsiveFontSize(2.5),
                                    backgroundColor: colors.royalBlueOpacity(0.1),
                                    borderRadius: 100,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FontAwesome name='phone' size={responsiveFontSize(1.2)} color={colors.royalBlue} />
                                </View>
                                <Text style={{
                                    color: colors.blackOpacity(0.8),
                                    fontSize: responsiveFontSize(1.6),
                                    fontWeight: '500',
                                    marginLeft: responsiveFontSize(0.5)
                                }}>
                                    {item?.mobile || 'N/A'}
                                </Text>
                            </View>
                        </View>

                        {/* Email */}
                        {item?.email && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: responsiveFontSize(0.3)
                            }}>
                                <View style={{
                                    height: responsiveFontSize(2.5),
                                    width: responsiveFontSize(2.5),
                                    backgroundColor: colors.royalBlueOpacity(0.1),
                                    borderRadius: 100,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Ionicons name='mail' size={responsiveFontSize(1.2)} color={colors.royalBlue} />
                                </View>
                                <Text style={{
                                    color: colors.blackOpacity(0.8),
                                    fontSize: responsiveFontSize(1.5),
                                    fontWeight: '500',
                                    marginLeft: responsiveFontSize(0.5),
                                    flex: 1
                                }} numberOfLines={1}>
                                    {item?.email}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
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
    const [allDrivers, setAllDrivers] = useState<any[]>([]) // Store all drivers from API
    const [search, setsearch] = useState('')

    const [isExtended, setIsExtended] = useState(false);
    const [addDriverModal, setAddDriverModal] = useState(false);

    // Client-side filtering since API doesn't filter
    const filteredDrivers = useMemo(() => {
        if (!search.trim()) {
            return allDrivers;
        }
        const searchLower = search.toLowerCase().trim();
        return allDrivers.filter((driver: any) => {
            const name = (driver?.name || '').toLowerCase();
            const uniqueId = (driver?.unique_id || '').toLowerCase();
            const mobile = (driver?.mobile || '').toLowerCase();
            const email = (driver?.email || '').toLowerCase();

            return name.includes(searchLower) ||
                uniqueId.includes(searchLower) ||
                mobile.includes(searchLower) ||
                email.includes(searchLower);
        });
    }, [allDrivers, search]);

    useEffect(() => {
        setTimeout(() => {
            setIsExtended(true)
        }, 500);
    }, [])

    const _fetchDriverList = async () => {
        try {
            setloading(true);
            // Fetch all drivers without search param - we filter client-side
            const response: any = await axiosInstance.get(END_POINTS?.TRANSPORTER_DRIVERS(''));
            if (response?.data?.status) {
                setAllDrivers(response?.data?.drivers || []);
            } else {
                setAllDrivers([]);
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
            setAllDrivers([]);
        } finally {
            setloading(false);
        }
    };

    // Fetch on screen focus
    useFocusEffect(
        useCallback(() => {
            _fetchDriverList();
        }, [])
    );

    const _goback = () => {
        navigation.goBack()
    }

    const _handleSearch = (text: string) => {
        setsearch(text);
    }

    const _clearSearch = () => {
        setsearch('');
    }

    const _renderEmptyComponent = () => {
        if (loading) return null;

        return (
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: responsiveHeight(8)
            }}>
                <View style={{
                    width: responsiveFontSize(12),
                    height: responsiveFontSize(12),
                    borderRadius: responsiveFontSize(6),
                    backgroundColor: colors.royalBlueOpacity(0.08),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: responsiveFontSize(2)
                }}>
                    <MaterialCommunityIcons
                        name={search ? "account-search" : "account-group"}
                        size={responsiveFontSize(5)}
                        color={colors.royalBlueOpacity(0.4)}
                    />
                </View>
                <Text style={{
                    color: colors.blackOpacity(0.8),
                    fontSize: responsiveFontSize(2.2),
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: responsiveFontSize(1)
                }}>
                    {search ? t('noMatchFound') : t('noDriversYet')}
                </Text>
                <Text style={{
                    color: colors.blackOpacity(0.5),
                    fontSize: responsiveFontSize(1.7),
                    textAlign: 'center',
                    paddingHorizontal: responsiveFontSize(4),
                    lineHeight: responsiveFontSize(2.4)
                }}>
                    {search
                        ? `${t('noDriverFoundFor')} "${search}". ${t('trySearchingDifferentKeyword')}`
                        : t('noDriversCurrentlyAvailable')
                    }
                </Text>
                {search && (
                    <TouchableOpacity
                        onPress={_clearSearch}
                        style={{
                            marginTop: responsiveFontSize(2),
                            paddingHorizontal: responsiveFontSize(2.5),
                            paddingVertical: responsiveFontSize(1),
                            backgroundColor: colors.royalBlueOpacity(0.1),
                            borderRadius: 100
                        }}
                    >
                        <Text style={{
                            color: colors.royalBlue,
                            fontSize: responsiveFontSize(1.7),
                            fontWeight: '600'
                        }}>
                            {t('clearSearch')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const _renderHeader = () => {
        if (!filteredDrivers.length || loading) return null;

        return (
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: responsiveFontSize(0.5),
                marginBottom: responsiveFontSize(1.5)
            }}>
                <Text style={{
                    color: colors.blackOpacity(0.6),
                    fontSize: responsiveFontSize(1.6),
                    fontWeight: '500'
                }}>
                    {filteredDrivers.length} {filteredDrivers.length === 1 ? t('driverFound') : t('driversFound')}
                </Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            {/* Header */}
            <LinearGradient
                colors={[colors.royalBlue, colors.royalBlueOpacity(0.9)]}
                style={{
                    paddingTop: safeAreaInsets.top,
                    paddingBottom: responsiveFontSize(2),
                    paddingHorizontal: responsiveWidth(4),
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                }}
            >
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: responsiveFontSize(1)
                }}>
                    <TouchableOpacity
                        hitSlop={hitSlop(10)}
                        onPress={_goback}
                        style={{
                            height: responsiveFontSize(4),
                            width: responsiveFontSize(4),
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 100,
                        }}
                    >
                        <Ionicons name={'chevron-back'} size={22} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={{
                        flex: 1,
                        fontSize: responsiveFontSize(2.4),
                        color: colors.white,
                        fontWeight: '700',
                        textAlign: 'center',
                        marginRight: responsiveFontSize(4)
                    }}>
                        {t('driverList')}
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={{
                    flexDirection: 'row',
                    height: responsiveHeight(5.5),
                    backgroundColor: colors.white,
                    alignItems: 'center',
                    borderRadius: 12,
                    paddingHorizontal: responsiveWidth(4),
                    marginTop: responsiveFontSize(1),
                    ...shadow,
                    shadowColor: 'rgba(0,0,0,0.1)'
                }}>
                    <Feather name={'search'} size={20} color={colors.royalBlueOpacity(0.6)} />
                    <TextInput
                        value={search}
                        onChangeText={_handleSearch}
                        placeholder={t('searchDrivers')}
                        style={{
                            flex: 1,
                            padding: 0,
                            marginLeft: responsiveFontSize(1),
                            fontSize: responsiveFontSize(1.8),
                            color: colors.black
                        }}
                        placeholderTextColor={colors.blackOpacity(0.4)}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={_clearSearch} hitSlop={hitSlop(10)}>
                            <Ionicons name="close-circle" size={20} color={colors.blackOpacity(0.4)} />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <Space height={responsiveFontSize(1.5)} />

            {/* Content */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={colors.royalBlue} size="large" />
                    <Text style={{
                        color: colors.blackOpacity(0.5),
                        fontSize: responsiveFontSize(1.6),
                        marginTop: responsiveFontSize(1.5)
                    }}>
                        {t('loadingDrivers')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={filteredDrivers}
                    renderItem={({ item, index }) => (
                        <RenderDriverList
                            key={index}
                            item={item}
                            index={index}
                            fetchDriverList={() => _fetchDriverList()}
                        />
                    )}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: responsiveWidth(4),
                        paddingBottom: responsiveHeight(12),
                        paddingTop: responsiveHeight(1)
                    }}
                    keyExtractor={(item, index) => `driver-${item?.id || index}`}
                    ListHeaderComponent={_renderHeader}
                    ListEmptyComponent={_renderEmptyComponent}
                />
            )}

            {/* Floating Add Button */}
            <AnimatedFAB
                icon={({ size, color }) => (
                    <FontAwesome6 name="user-plus" size={size - 4} color={color} />
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
                    backgroundColor: colors.royalBlue,
                    borderRadius: 16,
                    ...shadow
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
