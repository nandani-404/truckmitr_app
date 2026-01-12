import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, Modal, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const RenderDriverList = ({ item, fetchDriverList, job_id, onSelectJob }: any) => {
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

    const handleInvite = async (selectedJobId?: string) => {
        if (!validate(item?.id)) return;

        // If no job_id is provided and no selectedJobId, show job selection
        const jobIdToUse = selectedJobId || job_id;
        if (!jobIdToUse) {
            if (onSelectJob) {
                onSelectJob(item?.id);
            } else {
                showToast(t('pleaseSelectJob') || 'Please select a job first');
            }
            return;
        }

        try {
            setInviteLoading(true);
            const data = new FormData();
            data.append('driver_id', item?.id)
            data.append('job_id', jobIdToUse)
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
                onPress={() => handleInvite()}
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

// Filter Modal Component - Modern Premium Design with Fullscreen Selectors
const FilterModal = ({ visible, onClose, filters, setFilters, applyFilters, locationsList, vehicleTypeList, colors, shadow, t }: any) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const { responsiveHeight, responsiveFontSize, responsiveWidth } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();

    // Selector modal states
    const [activeSelector, setActiveSelector] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Get selected state name
    const getSelectedStateName = () => {
        const selected = locationsList.find((item: any) => item.id.toString() === localFilters.stateId);
        return selected?.name || '';
    };

    // Get selected vehicle name
    const getSelectedVehicleName = () => {
        const selected = vehicleTypeList.find((item: any) => item.id.toString() === localFilters.vehicle_type);
        return selected?.vehicle_name || '';
    };

    // Filter states by search
    const filteredStates = locationsList.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get selected labels
    const getSelectedExperienceLabel = () => {
        const selected = drivingExperienceArray.find(item => item.value === getCurrentExperienceRange());
        return selected?.label || '';
    };

    const getSelectedLicenseLabel = () => {
        const selected = licenseTypes.find(item => item.value === localFilters.type_of_license);
        return selected?.label || '';
    };

    const getSelectedRatingLabel = () => {
        if (localFilters.min_rating || localFilters.max_rating) {
            const min = localFilters.min_rating || '1';
            const max = localFilters.max_rating || '5';
            return `${min} - ${max} ⭐`;
        }
        return '';
    };

    // Count active filters
    const activeFilterCount = Object.values(localFilters).filter(v => v !== '').length;

    // Selection Card Component
    const SelectionCard = ({ label, value, placeholder, onPress, icon }: any) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={{
                backgroundColor: value ? colors.royalBlue + '08' : colors.blackOpacity(0.02),
                borderRadius: 16,
                padding: responsiveFontSize(2),
                marginBottom: responsiveFontSize(1.5),
                borderWidth: 1.5,
                borderColor: value ? colors.royalBlue + '30' : colors.blackOpacity(0.08),
                flexDirection: 'row',
                alignItems: 'center',
            }}
        >
            <View style={{
                width: responsiveFontSize(5),
                height: responsiveFontSize(5),
                borderRadius: responsiveFontSize(2.5),
                backgroundColor: value ? colors.royalBlue + '15' : colors.blackOpacity(0.06),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: responsiveFontSize(1.5),
            }}>
                <Feather name={icon} size={20} color={value ? colors.royalBlue : colors.blackOpacity(0.4)} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: responsiveFontSize(1.4),
                    color: colors.blackOpacity(0.5),
                    fontWeight: '500',
                    marginBottom: 2,
                }}>
                    {label}
                </Text>
                <Text style={{
                    fontSize: responsiveFontSize(1.8),
                    color: value ? colors.black : colors.blackOpacity(0.4),
                    fontWeight: value ? '600' : '500',
                }}>
                    {value || placeholder}
                </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.blackOpacity(0.3)} />
        </TouchableOpacity>
    );

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={onClose}
                statusBarTranslucent={true}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: colors.white,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingBottom: safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : responsiveFontSize(2),
                    }}>
                        {/* Handle Bar */}
                        <View style={{ alignItems: 'center', paddingTop: responsiveFontSize(1.2) }}>
                            <View style={{
                                width: 36,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: colors.blackOpacity(0.15),
                            }} />
                        </View>

                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: responsiveFontSize(2),
                            paddingTop: responsiveFontSize(1.5),
                            paddingBottom: responsiveFontSize(1),
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                    width: responsiveFontSize(4.5),
                                    height: responsiveFontSize(4.5),
                                    borderRadius: responsiveFontSize(1.2),
                                    backgroundColor: colors.royalBlue + '15',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: responsiveFontSize(1),
                                }}>
                                    <Feather name="sliders" size={18} color={colors.royalBlue} />
                                </View>
                                <View>
                                    <Text style={{
                                        fontSize: responsiveFontSize(2),
                                        fontWeight: '700',
                                        color: colors.black,
                                    }}>
                                        {t('filterDrivers')}
                                    </Text>
                                    {activeFilterCount > 0 && (
                                        <Text style={{
                                            fontSize: responsiveFontSize(1.3),
                                            color: colors.royalBlue,
                                            fontWeight: '500',
                                        }}>
                                            {activeFilterCount} {t('filtersApplied') || 'filters applied'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: colors.blackOpacity(0.06),
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Feather name="x" size={20} color={colors.black} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: responsiveHeight(58) }}
                            contentContainerStyle={{
                                paddingHorizontal: responsiveFontSize(2),
                                paddingTop: responsiveFontSize(1),
                                paddingBottom: responsiveFontSize(1),
                            }}
                        >
                            {/* State Selection */}
                            <SelectionCard
                                label={t('state')}
                                value={getSelectedStateName()}
                                placeholder={t('selectState')}
                                onPress={() => setActiveSelector('state')}
                                icon="map-pin"
                            />

                            {/* Vehicle Type Selection */}
                            <SelectionCard
                                label={t('vehicleType')}
                                value={getSelectedVehicleName()}
                                placeholder={t('selectVehicleType')}
                                onPress={() => setActiveSelector('vehicle')}
                                icon="truck"
                            />

                            {/* Experience Selection */}
                            <SelectionCard
                                label={t('drivingExperience')}
                                value={getSelectedExperienceLabel()}
                                placeholder={t('selectExperience')}
                                onPress={() => setActiveSelector('experience')}
                                icon="award"
                            />

                            {/* License Type Selection */}
                            <SelectionCard
                                label={t('licenseType')}
                                value={getSelectedLicenseLabel()}
                                placeholder={t('selectLicenseType')}
                                onPress={() => setActiveSelector('license')}
                                icon="file-text"
                            />

                            {/* Rating Selection */}
                            <SelectionCard
                                label={t('rating')}
                                value={getSelectedRatingLabel()}
                                placeholder={t('selectRating') || 'Select Rating'}
                                onPress={() => setActiveSelector('rating')}
                                icon="star"
                            />
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingHorizontal: responsiveFontSize(2),
                            paddingTop: responsiveFontSize(1.5),
                            borderTopWidth: 1,
                            borderTopColor: colors.blackOpacity(0.06),
                        }}>
                            <TouchableOpacity
                                onPress={handleReset}
                                style={{
                                    flex: 1,
                                    paddingVertical: responsiveFontSize(1.6),
                                    backgroundColor: colors.blackOpacity(0.04),
                                    borderRadius: 12,
                                    marginRight: responsiveFontSize(1),
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}
                            >
                                <Feather name="refresh-cw" size={16} color={colors.black} style={{ marginRight: 6 }} />
                                <Text style={{ color: colors.black, fontWeight: '600', fontSize: responsiveFontSize(1.7) }}>
                                    {t('reset')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleApply}
                                style={{
                                    flex: 1.5,
                                    paddingVertical: responsiveFontSize(1.6),
                                    backgroundColor: colors.royalBlue,
                                    borderRadius: 12,
                                    marginLeft: responsiveFontSize(1),
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    ...shadow,
                                }}
                            >
                                <Feather name="check" size={16} color={colors.white} style={{ marginRight: 6 }} />
                                <Text style={{ color: colors.white, fontWeight: '700', fontSize: responsiveFontSize(1.7) }}>
                                    {t('applyFilters')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Generic Fullscreen Selector */}
            <Modal
                visible={activeSelector !== null}
                transparent={false}
                animationType="slide"
                onRequestClose={() => {
                    setActiveSelector(null);
                    setSearchQuery('');
                }}
            >
                <View style={{ flex: 1, backgroundColor: colors.white }}>
                    {/* Header */}
                    <View style={{
                        backgroundColor: colors.white,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.blackOpacity(0.08),
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: responsiveWidth(4),
                            paddingVertical: responsiveHeight(1.5),
                        }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setActiveSelector(null);
                                    setSearchQuery('');
                                }}
                                style={{
                                    height: 44,
                                    width: 44,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: colors.royalBlue + '12',
                                    borderRadius: 12,
                                }}
                            >
                                <Feather name="x" size={22} color={colors.royalBlue} />
                            </TouchableOpacity>
                            <Text style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: responsiveFontSize(2.1),
                                fontWeight: '700',
                                color: colors.black,
                                marginRight: 44,
                            }}>
                                {activeSelector === 'state' && t('selectState')}
                                {activeSelector === 'vehicle' && t('selectVehicleType')}
                                {activeSelector === 'experience' && (t('selectExperience') || 'Select Experience')}
                                {activeSelector === 'license' && (t('selectLicenseType') || 'Select License Type')}
                                {activeSelector === 'rating' && (t('selectRating') || 'Select Rating')}
                            </Text>
                        </View>

                        {/* Search Bar - only for state and vehicle */}
                        {(activeSelector === 'state' || activeSelector === 'vehicle') && (
                            <View style={{
                                marginHorizontal: responsiveWidth(4),
                                marginBottom: responsiveHeight(1.5),
                                backgroundColor: colors.blackOpacity(0.04),
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                height: 48,
                            }}>
                                <Feather name="search" size={18} color={colors.blackOpacity(0.4)} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        marginLeft: 10,
                                        fontSize: responsiveFontSize(1.7),
                                        color: colors.black,
                                        padding: 0,
                                    }}
                                    placeholder={t('search') || 'Search...'}
                                    placeholderTextColor={colors.blackOpacity(0.4)}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Feather name="x-circle" size={18} color={colors.blackOpacity(0.4)} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* List */}
                    <FlatList
                        data={
                            activeSelector === 'state' ? filteredStates :
                                activeSelector === 'vehicle' ? vehicleTypeList.filter((item: any) =>
                                    item.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase())
                                ) :
                                    activeSelector === 'experience' ? drivingExperienceArray :
                                        activeSelector === 'license' ? licenseTypes :
                                            activeSelector === 'rating' ? [
                                                { label: '1 - 2 ⭐', value: '1-2' },
                                                { label: '2 - 3 ⭐', value: '2-3' },
                                                { label: '3 - 4 ⭐', value: '3-4' },
                                                { label: '4 - 5 ⭐', value: '4-5' },
                                                { label: '3+ ⭐ (Recommended)', value: '3-5' },
                                                { label: '4+ ⭐ (Top Rated)', value: '4-5' },
                                            ] : []
                        }
                        keyExtractor={(item: any, index) => `${activeSelector}-${item.id || item.value}-${index}`}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingHorizontal: responsiveWidth(4),
                            paddingTop: 12,
                            paddingBottom: safeAreaInsets.bottom + 20,
                            flexGrow: 1,
                        }}
                        ListEmptyComponent={() => (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: responsiveHeight(10),
                            }}>
                                <Feather name="search" size={48} color={colors.blackOpacity(0.15)} />
                                <Text style={{
                                    marginTop: 16,
                                    fontSize: responsiveFontSize(1.7),
                                    color: colors.blackOpacity(0.4),
                                }}>
                                    {t('noResultsFound') || 'No results found'}
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const itemValue = activeSelector === 'state' ? item.id?.toString() :
                                activeSelector === 'vehicle' ? item.id?.toString() :
                                    item.value;
                            const itemLabel = activeSelector === 'state' ? item.name :
                                activeSelector === 'vehicle' ? item.vehicle_name :
                                    item.label;

                            let isSelected = false;
                            if (activeSelector === 'state') {
                                isSelected = item.id?.toString() === localFilters.stateId;
                            } else if (activeSelector === 'vehicle') {
                                isSelected = item.id?.toString() === localFilters.vehicle_type;
                            } else if (activeSelector === 'experience') {
                                isSelected = item.value === getCurrentExperienceRange();
                            } else if (activeSelector === 'license') {
                                isSelected = item.value === localFilters.type_of_license;
                            } else if (activeSelector === 'rating') {
                                const currentRating = localFilters.min_rating && localFilters.max_rating
                                    ? `${localFilters.min_rating}-${localFilters.max_rating}`
                                    : '';
                                isSelected = item.value === currentRating;
                            }

                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (activeSelector === 'state') {
                                            setLocalFilters({ ...localFilters, stateId: item.id?.toString() || '' });
                                        } else if (activeSelector === 'vehicle') {
                                            setLocalFilters({ ...localFilters, vehicle_type: item.id?.toString() || '' });
                                        } else if (activeSelector === 'experience') {
                                            handleExperienceChange(item.value);
                                        } else if (activeSelector === 'license') {
                                            setLocalFilters({ ...localFilters, type_of_license: item.value });
                                        } else if (activeSelector === 'rating') {
                                            const [min, max] = item.value.split('-');
                                            setLocalFilters({ ...localFilters, min_rating: min, max_rating: max });
                                        }
                                        setActiveSelector(null);
                                        setSearchQuery('');
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: responsiveFontSize(1.5),
                                        paddingHorizontal: responsiveFontSize(1.6),
                                        marginBottom: 8,
                                        backgroundColor: isSelected ? colors.royalBlue + '10' : colors.white,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: isSelected ? colors.royalBlue + '40' : colors.blackOpacity(0.06),
                                    }}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        backgroundColor: isSelected ? colors.royalBlue + '20' : colors.blackOpacity(0.04),
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12,
                                    }}>
                                        <Text style={{
                                            fontSize: responsiveFontSize(1.7),
                                            fontWeight: '700',
                                            color: isSelected ? colors.royalBlue : colors.blackOpacity(0.3),
                                        }}>
                                            {(itemLabel || '').charAt(0)?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        flex: 1,
                                        fontSize: responsiveFontSize(1.7),
                                        color: isSelected ? colors.royalBlue : colors.black,
                                        fontWeight: isSelected ? '600' : '500',
                                    }}>
                                        {itemLabel}
                                    </Text>
                                    <View style={{ marginLeft: 10 }}>
                                        <Feather
                                            name={isSelected ? "disc" : "circle"}
                                            size={22}
                                            color={isSelected ? colors.royalBlue : colors.blackOpacity(0.3)}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </>
    );
};



export default function AllDriverList({ route, job_id }: any) {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const { shadow } = useShadow()
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const [loading, setloading] = useState(true)
    const [driverList, setdriverList] = useState<any[]>([])
    const [search, setsearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [perPage] = useState(10)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [locationsList, setLocationsList] = useState<any[]>([])
    const [vehicleTypeList, setVehicleTypeList] = useState<any[]>([])

    // Job selection modal state
    const [showJobModal, setShowJobModal] = useState(false);
    const [jobsList, setJobsList] = useState<any[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
    const [invitingWithJob, setInvitingWithJob] = useState(false);

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

    // Fetch transporter's jobs for selection
    const fetchTransporterJobs = async () => {
        try {
            setLoadingJobs(true);
            const response = await axiosInstance.get(END_POINTS.TRANSPORTER_ALL_JOBS(''));
            console.log('Fetched jobs response:', response?.data);
            if (response?.data?.status && response?.data?.data) {
                // Filter to only show active jobs (active_inactive === 1 means active)
                const allJobs = response.data.data;
                console.log('All jobs:', allJobs?.length, 'jobs');
                const activeJobs = allJobs.filter((job: any) => {
                    // Check both active_inactive (1 = active) and status field possibilities
                    const isActive = job.active_inactive === 1 || job.active_inactive === '1' || job.status === 'active';
                    return isActive;
                });
                console.log('Active jobs:', activeJobs?.length, 'jobs');
                setJobsList(activeJobs);
            } else {
                setJobsList([]);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobsList([]);
        } finally {
            setLoadingJobs(false);
        }
    };

    // Handle job selection for invite
    const handleSelectJobForInvite = (driverId: number) => {
        setSelectedDriverId(driverId);
        fetchTransporterJobs();
        setShowJobModal(true);
    };

    // Handle invite with selected job
    const handleInviteWithJob = async (jobId: string) => {
        if (!selectedDriverId) return;

        try {
            setInvitingWithJob(true);
            const data = new FormData();
            data.append('driver_id', selectedDriverId.toString());
            data.append('job_id', jobId);
            const response = await axiosInstance.post(END_POINTS.TRANSPORTERINVITE, data);
            showToast(response?.data?.message);
            setShowJobModal(false);
            setSelectedDriverId(null);
            refreshDriverList();
        } catch (error: any) {
            showToast(error?.response?.data?.message || t('inviteFailed'));
        } finally {
            setInvitingWithJob(false);
        }
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
                        onSelectJob={handleSelectJobForInvite}
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

            {/* Job Selection Modal */}
            <Modal
                visible={showJobModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowJobModal(false)}
                statusBarTranslucent={true}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowJobModal(false)}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                            <View style={{
                                backgroundColor: colors.white,
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                paddingTop: responsiveFontSize(2.5),
                                paddingHorizontal: responsiveFontSize(2),
                                paddingBottom: Math.max(safeAreaInsets.bottom, responsiveFontSize(2)),
                            }}>
                                {/* Header */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: responsiveFontSize(2) }}>
                                    <Text style={{ fontSize: responsiveFontSize(2.2), fontWeight: 'bold', color: colors.black }}>
                                        {t('selectJobForInvite') || 'Select Job for Invite'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowJobModal(false)}>
                                        <Feather name="x" size={24} color={colors.black} />
                                    </TouchableOpacity>
                                </View>

                                {loadingJobs ? (
                                    <View style={{ paddingVertical: responsiveHeight(10), alignItems: 'center' }}>
                                        <ActivityIndicator color={colors.royalBlue} size="large" />
                                        <Text style={{ color: colors.blackOpacity(0.6), marginTop: 10 }}>
                                            {t('loadingJobs') || 'Loading jobs...'}
                                        </Text>
                                    </View>
                                ) : jobsList.length === 0 ? (
                                    <View style={{ paddingVertical: responsiveHeight(10), alignItems: 'center' }}>
                                        <Text style={{ color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.8), textAlign: 'center' }}>
                                            {t('noActiveJobsToInvite') || 'No active jobs available.\nPlease post a job first.'}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                marginTop: responsiveFontSize(2),
                                                backgroundColor: colors.royalBlue,
                                                paddingVertical: responsiveFontSize(1.2),
                                                paddingHorizontal: responsiveFontSize(3),
                                                borderRadius: 8
                                            }}
                                            onPress={() => {
                                                setShowJobModal(false);
                                                navigation.navigate(STACKS.ADD_JOB);
                                            }}
                                        >
                                            <Text style={{ color: colors.white, fontWeight: '600' }}>
                                                {t('postNewJob') || 'Post New Job'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        style={{ maxHeight: responsiveHeight(50) }}
                                        contentContainerStyle={{ paddingBottom: responsiveFontSize(1) }}
                                    >
                                        {jobsList.map((job: any) => (
                                            <TouchableOpacity
                                                key={job.id}
                                                style={{
                                                    backgroundColor: colors.white,
                                                    padding: responsiveFontSize(1.5),
                                                    borderRadius: 12,
                                                    marginBottom: responsiveFontSize(1),
                                                    borderWidth: 1,
                                                    borderColor: colors.blackOpacity(0.1),
                                                    ...shadow
                                                }}
                                                onPress={() => handleInviteWithJob(job.id.toString())}
                                                disabled={invitingWithJob}
                                            >
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ color: colors.black, fontSize: responsiveFontSize(1.8), fontWeight: '600' }} numberOfLines={2}>
                                                            {job.job_title || job.title || 'Job'}
                                                        </Text>
                                                        <Text style={{ color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.4), marginTop: 4 }}>
                                                            {job.job_location || job.location || 'Location N/A'}
                                                        </Text>
                                                        <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.4), marginTop: 2 }}>
                                                            {job.Salary_Range ? `₹${job.Salary_Range}` : 'Salary N/A'}
                                                        </Text>
                                                    </View>
                                                    <View style={{
                                                        backgroundColor: colors.royalBlue + '15',
                                                        paddingVertical: responsiveFontSize(0.5),
                                                        paddingHorizontal: responsiveFontSize(1),
                                                        borderRadius: 6
                                                    }}>
                                                        <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.2), fontWeight: '600' }}>
                                                            {t('invite')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}