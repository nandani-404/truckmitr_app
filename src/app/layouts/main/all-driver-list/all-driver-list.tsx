import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, Modal, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import { FlatList } from 'react-native';
import { Image } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Foundation from 'react-native-vector-icons/Foundation'
import { Dropdown } from 'react-native-element-dropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;
interface FilterState {
    stateId: string;
    vehicle_type: string;
    min_experience: string;
    max_experience: string;
    type_of_license: string;
    min_rating: string;
    max_rating: string;
}

const ratingOptions = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
];

const licenseTypes = [
    { label: 'Light Motor Vehicle (LMV)', value: 'LMV' },
    { label: 'Heavy Motor Vehicle (HMV)', value: 'HMV' },
    { label: 'Heavy Goods Motor Vehicle (HGMV)', value: 'HGMV' },
    { label: 'Heavy Passenger/Transport Vehicle (HPMV/HTV)', value: 'HPMV/HTV' },
];

const drivingExperienceArray = [
    { label: '1-5 years', value: '1-5' },
    { label: '5-10 years', value: '5-10' },
    { label: '10-15 years', value: '10-15' },
    { label: '15-20 years', value: '15-20' },
    { label: '20-25 years', value: '20-25' },
    { label: '25-30 years', value: '25-30' },
    { label: '30-35 years', value: '30-35' },
    { label: '35-40 years', value: '35-40' },
    { label: '40-45 years', value: '40-45' },
    { label: '45-50 years', value: '45-50' },
];

const RenderDriverList = ({ item, fetchDriverList, job_id }: any) => {
    const { t } = useTranslation();
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const [inviteLoading, setInviteLoading] = useState(false);
    const [checkBoxSelect, setCheckBoxSelect] = useState<{ [id: number]: boolean }>({});
    const [errors, setErrors] = useState<{ [id: number]: { checkBox?: string } }>({});
    const navigation = useNavigation<NavigatorProp>();


    const validate = (id: number): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};

        if (!checkBoxSelect[id]) {
            newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
            valid = false;
        }
        setErrors(prev => ({ ...prev, [id]: newErrors }));
        return valid;
    };

    const handleInvite = async () => {
        if (!validate(item?.id)) return;
        try {
            setInviteLoading(true);
            const data = new FormData();
            data.append('driver_id', item?.id)
            data.append('job_id', job_id)
            const response = await axiosInstance.post(END_POINTS.TRANSPORTERINVITE, data)
            showToast(response?.data?.message);
            // Refresh the driver list after successful invite
            if (fetchDriverList) {
                fetchDriverList();
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const getDriverImage = () => {
        if (item?.images) return `${BASE_URL}public/${item?.images}`;
        return 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    };

    const _onpressCheckBox = (id: number) => {
        setCheckBoxSelect(prev => ({ ...prev, [id]: !prev[id] }));
        setErrors(prev => ({ ...prev, [id]: { checkBox: undefined } }));
    };

    return (
        <View style={{
            width: responsiveWidth(94),
            backgroundColor: colors.white,
            padding: responsiveFontSize(2),
            borderRadius: 12,
            marginBottom: responsiveFontSize(1.5),
            ...shadow,
            borderLeftWidth: 4,
            borderLeftColor: colors.royalBlue,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: responsiveFontSize(1.5)
            }}>
                {/* Driver Image */}
                <Image
                    style={{
                        height: responsiveFontSize(8),
                        width: responsiveFontSize(8),
                        borderRadius: 100,
                        borderWidth: 2,
                        borderColor: colors.royalBlue + '20',
                    }}
                    source={{ uri: getDriverImage() }}
                />
                <View style={{
                    flex: 1,
                    marginLeft: responsiveFontSize(2),
                }}>
                    <Text style={{
                        color: colors.black,
                        fontSize: responsiveFontSize(2.2),
                        fontWeight: '700',
                        marginBottom: responsiveFontSize(0.5)
                    }}>
                        {item?.name || t('notAvailable')}
                    </Text>
                    <Text style={{
                        color: colors.royalBlue,
                        fontSize: responsiveFontSize(1.6),
                        fontWeight: '600',
                    }}>
                        {item?.unique_id || t('notAvailable')}
                    </Text>
                </View>
            </View>

            <View style={{
                backgroundColor: colors.royalBlue + '08',
                padding: responsiveFontSize(1.3),
                borderRadius: 8,
                marginBottom: responsiveFontSize(1.3)
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: responsiveFontSize(1.2)
                }}>
                    <View style={{ flex: 1, marginRight: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='phone' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('mobile')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item.status === "accepted" ? (item?.mobile || t('notAvailable')) : '**********'}
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='star' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('rating')}
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item?.average_rating > 0 ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <FontAwesome
                                            key={i}
                                            name={'star'}
                                            size={responsiveFontSize(1.6)}
                                            color={i < (item?.average_rating || 0) ? colors.royalBlue : colors.blackOpacity(0.2)}
                                            style={{ marginRight: responsiveFontSize(0.3) }}
                                        />
                                    ))}
                                    <Text style={{
                                        color: colors.blackOpacity(0.8),
                                        fontSize: responsiveFontSize(1.4),
                                        fontWeight: '400',
                                        marginLeft: responsiveFontSize(0.5)
                                    }}>
                                        ({item.average_rating})
                                    </Text>
                                </>
                            ) : (
                                <Text style={{
                                    color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                                }}>
                                    {t('notRated')}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: responsiveFontSize(1.2)
                }}>
                    <View style={{ flex: 1, marginRight: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='map-marker' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('state')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item?.state_name || t('notAvailable')}
                        </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='car' size={responsiveFontSize(1.6)} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('experience')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item?.Driving_Experience ? `${item.Driving_Experience} years` : t('notAvailable')}
                        </Text>
                    </View>
                </View>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                }}>
                    <View style={{ flex: 1, }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='id-card' size={14} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('license')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item?.Type_of_License || t('notAvailable')}
                        </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: responsiveFontSize(1) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(0.5) }}>
                            <FontAwesome name='car' size={responsiveFontSize(1.6)} color={colors.royalBlue} />
                            <Text style={{
                                color: colors.royalBlue, fontSize: responsiveFontSize(2), fontWeight: '500', marginStart: responsiveFontSize(.5)
                            }}>
                                {t('Vehicle Type')}
                            </Text>
                        </View>
                        <Text style={{
                            color: colors.blackOpacity(.8), fontSize: responsiveFontSize(1.8), fontWeight: '400',
                            marginLeft: responsiveFontSize(2.1)
                        }}>
                            {item?.vehicle_type_name || t('notAvailable')}
                        </Text>
                    </View>
                </View>
            </View>
            <Space height={responsiveHeight(2)} />
            <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity activeOpacity={1} onPress={() => _onpressCheckBox(item.id)}>
                    <MaterialCommunityIcons
                        name={checkBoxSelect[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={colors.royalBlue}
                    />
                </TouchableOpacity>
                <Text style={{ color: colors.blackOpacity(0.7), marginStart: responsiveFontSize(1), flexShrink: 1, flexWrap: 'wrap' }}>
                    {t(`iAgreeToTruckMitr`)}
                    <Text onPress={() => navigation.navigate(STACKS?.TRANSPORTER_CONSENT)} style={{ color: colors.royalBlue, fontWeight: '500' }}> {t(`transporterConsent`)}</Text>
                    {t(`addJobPolicy`)}
                </Text>
            </View>
            {errors[item.id]?.checkBox && (
                <View style={{ flexDirection: 'row', marginTop: responsiveHeight(1) }}>
                    <Text style={{ color: colors.error, fontSize: responsiveFontSize(1.7), marginLeft: responsiveFontSize(0.5) }}>
                        {errors[item.id]?.checkBox}
                    </Text>
                </View>
            )}
            <Space height={responsiveHeight(2)} />
            <TouchableOpacity
                style={{
                    backgroundColor: inviteLoading ? colors.blackOpacity(0.3) : colors.royalBlue,
                    paddingVertical: responsiveFontSize(1.2),
                    paddingHorizontal: responsiveFontSize(2.2),
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...shadow,
                }}
                onPress={handleInvite}
                disabled={inviteLoading}
            >
                {inviteLoading ? (
                    <ActivityIndicator
                        color={colors.white}
                        size="small"
                        style={{ marginRight: responsiveFontSize(0.8) }}
                    />
                ) : (
                    <FontAwesome
                        name="user-plus"
                        size={responsiveFontSize(1.6)}
                        color={colors.white}
                        style={{ marginRight: responsiveFontSize(0.8) }}
                    />
                )}
                <Text style={{
                    color: colors.white,
                    fontSize: responsiveFontSize(1.6),
                    fontWeight: '700'
                }}>
                    {inviteLoading ? t('inviting') : t('invite')}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

// Filter Modal Component
const FilterModal = ({ visible, onClose, filters, setFilters, applyFilters, locationsList, vehicleTypeList, colors, shadow, t }: any) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const { responsiveHeight, responsiveFontSize } = useResponsiveScale();
    const handleExperienceChange = (experienceRange: string) => {
        let minExp = '';
        let maxExp = '';

        if (experienceRange) {
            const [min, max] = experienceRange.split('-').map(exp => exp.trim());
            minExp = min;
            maxExp = max;
        }

        setLocalFilters({
            ...localFilters,
            min_experience: minExp,
            max_experience: maxExp
        });
    };
    const getCurrentExperienceRange = () => {
        if (localFilters.min_experience && localFilters.max_experience) {
            return `${localFilters.min_experience}-${localFilters.max_experience}`;
        }
        return '';
    };

    const handleApply = () => {
        setFilters(localFilters);
        applyFilters();
        onClose();
    };

    const handleReset = () => {
        const resetFilters: FilterState = {
            stateId: '',
            vehicle_type: '',
            min_experience: '',
            max_experience: '',
            type_of_license: '',
            min_rating: '',
            max_rating: '',
        };
        setLocalFilters(resetFilters);
        setFilters(resetFilters);
        onClose();
        setTimeout(() => {
            applyFilters();
        }, 100);
    };

    const dropdownStyle = {
        height: responsiveHeight(6),
        borderColor: colors.blackOpacity(0.5),
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: responsiveFontSize(1.5),
        marginTop: responsiveFontSize(0.5),
    };

    const dropdownContainerStyle = {
        borderRadius: 10,
        backgroundColor: colors.white,
        ...shadow
    };

    const dropdownTextStyle = {
        fontSize: responsiveFontSize(1.9),
        color: colors.blackOpacity(0.7),
        fontWeight: '500',
    };

    const selectedTextStyle = {
        color: colors.blackOpacity(1),
        fontSize: responsiveFontSize(1.8),
        fontWeight: '500',
    };

    const iconStyle = {
        height: responsiveFontSize(2.8),
        width: responsiveFontSize(2.8)
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{
                    backgroundColor: colors.white,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: '90%',
                    padding: responsiveFontSize(2)
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: responsiveFontSize(2) }}>
                        <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.black }}>
                            {t('filterDrivers')}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color={colors.black} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: responsiveHeight(60) }}>
                        <View style={{ marginBottom: responsiveFontSize(2) }}>
                            <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600', marginBottom: responsiveFontSize(0.5) }}>
                                {t('state')}
                            </Text>
                            <Dropdown
                                style={dropdownStyle}
                                containerStyle={dropdownContainerStyle}
                                itemTextStyle={{ color: colors.blackOpacity(0.8) }}
                                placeholderStyle={dropdownTextStyle}
                                selectedTextStyle={selectedTextStyle}
                                iconStyle={iconStyle}
                                data={locationsList.map((item: any) => ({ label: item.name, value: item.id.toString() }))}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={t('selectState')}
                                value={localFilters.stateId}
                                onChange={(item) => setLocalFilters({ ...localFilters, stateId: item.value })}
                            />
                        </View>
                        <View style={{ marginBottom: responsiveFontSize(2) }}>
                            <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600', marginBottom: responsiveFontSize(0.5) }}>
                                {t('vehicleType')}
                            </Text>
                            <Dropdown
                                style={dropdownStyle}
                                containerStyle={dropdownContainerStyle}
                                itemTextStyle={{ color: colors.blackOpacity(0.8) }}
                                placeholderStyle={dropdownTextStyle}
                                selectedTextStyle={selectedTextStyle}
                                iconStyle={iconStyle}
                                data={vehicleTypeList.map((item: any) => ({ label: item.vehicle_name, value: item.id.toString() }))}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={t('selectVehicleType')}
                                value={localFilters.vehicle_type}
                                onChange={(item) => setLocalFilters({ ...localFilters, vehicle_type: item.value })}
                            />
                        </View>
                        <View style={{ marginBottom: responsiveFontSize(2) }}>
                            <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600', marginBottom: responsiveFontSize(0.5) }}>
                                {t('drivingExperience')}
                            </Text>
                            <Dropdown
                                style={dropdownStyle}
                                containerStyle={dropdownContainerStyle}
                                itemTextStyle={{ color: colors.blackOpacity(0.8) }}
                                placeholderStyle={dropdownTextStyle}
                                selectedTextStyle={selectedTextStyle}
                                iconStyle={iconStyle}
                                data={drivingExperienceArray}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={t('selectExperience')}
                                value={getCurrentExperienceRange()}
                                onChange={(item) => handleExperienceChange(item.value)}
                            />
                        </View>
                        <View style={{ marginBottom: responsiveFontSize(2) }}>
                            <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600', marginBottom: responsiveFontSize(0.5) }}>
                                {t('licenseType')}
                            </Text>
                            <Dropdown
                                style={dropdownStyle}
                                containerStyle={dropdownContainerStyle}
                                itemTextStyle={{ color: colors.blackOpacity(0.8) }}
                                placeholderStyle={dropdownTextStyle}
                                selectedTextStyle={selectedTextStyle}
                                iconStyle={iconStyle}
                                data={licenseTypes}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={t('selectLicenseType')}
                                value={localFilters.type_of_license}
                                onChange={(item) => setLocalFilters({ ...localFilters, type_of_license: item.value })}
                            />
                        </View>

                        <View style={{ marginBottom: responsiveFontSize(2) }}>
                            <Text style={{ color: colors.blackOpacity(0.9), fontSize: responsiveFontSize(1.7), fontWeight: '600', marginBottom: responsiveFontSize(0.5) }}>
                                {t('rating')}
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 0.48 }}>
                                    <Text style={{ color: colors.blackOpacity(0.7), fontSize: responsiveFontSize(1.6), marginBottom: responsiveFontSize(0.5) }}>
                                        {t('min')}
                                    </Text>
                                    <Dropdown
                                        style={{
                                            ...dropdownStyle,
                                            height: responsiveHeight(5.5),
                                        }}
                                        containerStyle={dropdownContainerStyle}
                                        itemTextStyle={{ color: colors.blackOpacity(0.8) }}
                                        placeholderStyle={{
                                            ...dropdownTextStyle,
                                            fontSize: responsiveFontSize(1.8),
                                        }}
                                        selectedTextStyle={{
                                            ...selectedTextStyle,
                                            fontSize: responsiveFontSize(1.8),
                                        }}
                                        iconStyle={iconStyle}
                                        data={ratingOptions}
                                        maxHeight={300}
                                        labelField="label"
                                        valueField="value"
                                        placeholder={t('min')}
                                        value={localFilters.min_rating}
                                        onChange={(item) => setLocalFilters({ ...localFilters, min_rating: item.value })}
                                    />
                                </View>
                                <View style={{ flex: 0.48 }}>
                                    <Text style={{ color: colors.blackOpacity(0.7), fontSize: responsiveFontSize(1.6), marginBottom: responsiveFontSize(0.5) }}>
                                        {t('max')}
                                    </Text>
                                    <Dropdown
                                        style={{
                                            ...dropdownStyle,
                                            height: responsiveHeight(5.5),
                                        }}
                                        containerStyle={dropdownContainerStyle}
                                        itemTextStyle={{ color: colors.blackOpacity(0.8) }}
                                        placeholderStyle={{
                                            ...dropdownTextStyle,
                                            fontSize: responsiveFontSize(1.8),
                                        }}
                                        selectedTextStyle={{
                                            ...selectedTextStyle,
                                            fontSize: responsiveFontSize(1.8),
                                        }}
                                        iconStyle={iconStyle}
                                        data={ratingOptions}
                                        maxHeight={300}
                                        labelField="label"
                                        valueField="value"
                                        placeholder={t('max')}
                                        value={localFilters.max_rating}
                                        onChange={(item) => setLocalFilters({ ...localFilters, max_rating: item.value })}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: responsiveFontSize(2) }}>
                        <TouchableOpacity
                            onPress={handleReset}
                            style={{
                                flex: 1,
                                padding: responsiveFontSize(1.5),
                                backgroundColor: colors.blackOpacity(0.1),
                                borderRadius: 8,
                                marginRight: responsiveFontSize(1),
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: colors.black, fontWeight: '600', fontSize: responsiveFontSize(1.8) }}>
                                {t('reset')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleApply}
                            style={{
                                flex: 1,
                                padding: responsiveFontSize(1.5),
                                backgroundColor: colors.royalBlue,
                                borderRadius: 8,
                                marginLeft: responsiveFontSize(1),
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.8) }}>
                                {t('applyFilters')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function AllDriverList({ route, job_id }: any) {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [loading, setloading] = useState(true)
    const [driverList, setdriverList] = useState([])
    const [search, setsearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [perPage] = useState(10)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [locationsList, setLocationsList] = useState<any[]>([])
    const [vehicleTypeList, setVehicleTypeList] = useState<any[]>([])

    const [filters, setFilters] = useState<FilterState>({
        stateId: '',
        vehicle_type: '',
        min_experience: '',
        max_experience: '',
        type_of_license: '',
        min_rating: '',
        max_rating: '',
    });

    const receivedJobId = job_id || route?.params?.job_id;

    // Fetch locations and vehicle types
    const fetchFilterData = async () => {
        try {
            const [locationsResponse, vehicleTypesResponse] = await Promise.all([
                axiosInstance.get(END_POINTS.GETSTATES),
                axiosInstance.get(END_POINTS.VEHICLE_TYPES)
            ]);

            if (locationsResponse?.data?.status) {
                setLocationsList(locationsResponse.data.data);
            }
            if (vehicleTypesResponse?.data?.status) {
                setVehicleTypeList(vehicleTypesResponse.data.data);
            }
        } catch (error) {
            console.error("Error fetching filter data:", error);
        }
    };

    const _fetchDriverList = async (page = 1, isLoadMore = false) => {
        try {
            if (isLoadMore) setIsLoadingMore(true);
            else setloading(true);
            let url = `api/transporter/drivers_all?per_page=${perPage}&page=${page}&jobId=${job_id}`;
            if (search) {
                url += `&search=${search}`;
            }
            if (filters.stateId) url += `&stateId=${filters.stateId}`;
            if (filters.vehicle_type) url += `&vehicle_type=${filters.vehicle_type}`;
            if (filters.min_experience) url += `&min_experience=${filters.min_experience}`;
            if (filters.max_experience) url += `&max_experience=${filters.max_experience}`;
            if (filters.type_of_license) url += `&type_of_license=${encodeURIComponent(filters.type_of_license)}`;
            if (filters.min_rating) url += `&min_rating=${filters.min_rating}`;
            if (filters.max_rating) url += `&max_rating=${filters.max_rating}`;

            const response = await axiosInstance.get(url);
            if (response?.data?.status) {
                const paginationData = response?.data?.data || {};
                const driverData = paginationData?.data || [];
                const totalPages = paginationData?.last_page || 1;

                setTotalPages(totalPages);
                setHasMore(page < totalPages);

                if (isLoadMore) {
                    setdriverList((prev) => [...prev, ...driverData]);
                } else {
                    setdriverList(driverData);
                    setCurrentPage(page);
                }
            } else {
                if (!isLoadMore) setdriverList([]);
            }
        } catch (error: any) {
            console.error("Error fetching drivers:", error);
            if (!isLoadMore) setdriverList([]);
        } finally {
            setloading(false);
            setIsLoadingMore(false);
        }
    };

    const _handleLoadMore = () => {
        if (!isLoadingMore && hasMore && driverList.length > 0) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            _fetchDriverList(nextPage, true);
        }
    };

    const _handleSearch = (text: string) => {
        setsearch(text);
        setCurrentPage(1);
    };

    // Refresh function that can be passed to child components
    const refreshDriverList = useCallback(() => {
        _fetchDriverList(1, false);
    }, [search, filters]);

    const applyFilters = () => {
        setCurrentPage(1);
        _fetchDriverList(1, false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchFilterData();
            _fetchDriverList(1, false);
        }, [])
    );
    useEffect(() => {
        const timer = setTimeout(() => {
            _fetchDriverList(1, false);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, filters]);

    const _renderFooter = () => {
        if (!isLoadingMore) return null;

        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={colors.royalBlue} size="small" />
            </View>
        );
    };

    const _renderEmptyComponent = () => {
        if (loading) return null;

        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveHeight(10) }}>
                <Image
                    style={{
                        height: responsiveHeight(15),
                        width: responsiveWidth(80),
                        tintColor: colors.blackOpacity(.1)
                    }}
                    source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
                />
                <Text style={{
                    width: responsiveWidth(80),
                    color: colors.blackOpacity(.9),
                    fontSize: responsiveFontSize(1.9),
                    textAlign: 'center',
                    fontWeight: '500',
                    marginTop: responsiveHeight(2)
                }}>
                    {search || Object.values(filters).some(filter => filter !== '')
                        ? `${t('noDriverFoundWithFilters')}`
                        : t("noDriversCurrentlyAvailable")
                    }
                </Text>
            </View>
        );
    };
    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={responsiveFontSize(1)} />
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20
            }}>
                {/* Search Input */}
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    height: responsiveHeight(6),
                    backgroundColor: colors.white,
                    alignItems: 'center',
                    borderColor: colors.blackOpacity(0.1),
                    borderWidth: 1,
                    borderRadius: 100,
                    paddingHorizontal: responsiveWidth(4),
                    marginRight: 12
                }}>
                    <Feather
                        name="search"
                        size={20}
                        color={colors.royalBlueOpacity(0.7)}
                        style={{ marginRight: 8 }}
                    />
                    <TextInput
                        value={search}
                        onChangeText={_handleSearch}
                        placeholder={t('searchDrivers')}
                        style={{
                            flex: 1,
                            padding: 0,
                            paddingVertical: 8,
                            fontSize: responsiveFontSize(1.8),
                            color: colors.black
                        }}
                        placeholderTextColor={colors.blackOpacity(0.5)}
                    />
                </View>

                {/* Filter Button */}
                <TouchableOpacity
                    style={{
                        padding: 10,
                        borderRadius: 15,
                        backgroundColor: colors.white,
                        borderWidth: 1,
                        borderColor: colors.blackOpacity(0.1)
                    }}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Foundation name="filter" size={24} color={colors.royalBlueOpacity(1)} />
                </TouchableOpacity>
            </View>
            <Space height={responsiveFontSize(1)} />

            <FlatList
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                data={driverList}
                renderItem={({ item, index }) => (
                    <RenderDriverList
                        key={index}
                        item={item}
                        index={index}
                        fetchDriverList={refreshDriverList}
                        job_id={receivedJobId}
                    />
                )}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: responsiveWidth(2.5),
                    paddingBottom: responsiveHeight(5),
                    paddingTop: responsiveHeight(1)
                }}
                keyExtractor={(item, index) => `driver-${item?.id || index}`}
                ListEmptyComponent={_renderEmptyComponent}
                ListFooterComponent={_renderFooter}
                onEndReached={_handleLoadMore}
                onEndReachedThreshold={0.3}
            />
            {/* Filter Modal */}
            <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filters}
                setFilters={setFilters}
                applyFilters={applyFilters}
                locationsList={locationsList}
                vehicleTypeList={vehicleTypeList}
                colors={colors}
                shadow={shadow}
                t={t}
            />
        </View>
    )
}