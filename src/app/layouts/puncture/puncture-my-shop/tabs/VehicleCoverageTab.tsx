import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { styles } from './styles';
import { Space } from '@truckmitr/src/app/components';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VehicleCoverageTab = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { userEdit, user } = useSelector((state: any) => state?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [punctureId, setPunctureId] = useState<string>('');

    useEffect(() => {
        fetchPunctureId();
        fetchVehicleCoverageData();
    }, []);

    const fetchPunctureId = async () => {
        try {
            // Try to get from user object first, then fallback to AsyncStorage
            if (user?.puncture_id) {
                setPunctureId(user.puncture_id);
            } else {
                const storedPunctureId = await AsyncStorage.getItem('puncture_id');
                if (storedPunctureId) {
                    setPunctureId(storedPunctureId);
                }
            }
        } catch (error) {
            console.error('Error fetching puncture_id:', error);
        }
    };

    const fetchVehicleCoverageData = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(END_POINTS.GET_VEHICLE_COVERAGE);
            if (response.data?.success && response.data.Data?.vehicle_coverage) {
                dispatch(userEditAction({
                    ...userEdit,
                    vehicle_coverage: response.data.Data.vehicle_coverage || []
                }));
            }
        } catch (error) {
            console.error('Error fetching vehicle coverage:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (key: string, value: any) => {
        dispatch(userEditAction({ ...userEdit, [key]: value }));
    };

    const toggleSelection = (key: string, item: string) => {
        let list = userEdit?.[key] ? [...userEdit[key]] : [];
        if (list.includes(item)) {
            list = list.filter((i: string) => i !== item);
        } else {
            list = [...list, item];
        }
        updateUser(key, list);
    };

    const handleSave = async () => {
        if (!userEdit?.vehicle_coverage || userEdit.vehicle_coverage.length === 0) {
            showToast(t('please_select_at_least_one_vehicle') || 'Please select at least one vehicle type');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            // Required fields for API - punctureId includes AsyncStorage fallback
            formData.append('puncture_id', punctureId || user?.puncture_id || '');
            formData.append('user_id', user?.id || user?.user_id || '');
            formData.append('unique_id', user?.unique_id || '');
            // Send vehicle_coverage as array of strings
            const selectedVehicles = userEdit?.vehicle_coverage || [];
            selectedVehicles.forEach((vehicle: string) => {
                formData.append('vehicle_coverage[]', vehicle);
            });

            const response = await axiosInstance.post(END_POINTS.VEHICLE_COVERAGE, formData);
            if (response.data?.success || response.data?.status) {
                showToast(response.data?.message || t('vehicle_coverage_saved') || 'Vehicle coverage saved');
            } else {
                showToast(response.data?.message || t('something_went_wrong'));
            }
        } catch (error: any) {
            console.error('Save Error:', error);
            showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
        } finally {
            setSaving(false);
        }
    };

    // Vehicle keys must match API values: BIKE, CAR, MINI_TRUCK, TRUCK_6_TYRE, TRUCK_10_12_14_TYRE, TRAILER, BUS
    const vehicles = [
        { key: 'BIKE', label: 'puncture_vehicle_bike' },
        { key: 'CAR', label: 'puncture_vehicle_car' },
        { key: 'MINI_TRUCK', label: 'puncture_vehicle_mini_truck' },
        { key: 'TRUCK_6_TYRE', label: 'puncture_vehicle_truck_6' },
        { key: 'TRUCK_10_12_14_TYRE', label: 'puncture_vehicle_truck_heavy' },
        { key: 'TRAILER', label: 'puncture_vehicle_trailer' },
        { key: 'BUS', label: 'puncture_vehicle_bus' }
    ];

    const ShimmerPlaceholder = () => (
        <View style={styles.stepContainer}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i}>
                    <View style={styles.shimmerLine} />
                    <View style={styles.shimmerBox} />
                </View>
            ))}
        </View>
    );

    if (loading) {
        return <ShimmerPlaceholder />;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.stepContainer}>
                <Text style={[styles.helperText, { marginBottom: 15 }]}>{t('puncture_vehicle_coverage_helper')}</Text>

                <View style={styles.chipsRow}>
                    {vehicles.map(v => (
                        <TouchableOpacity
                            key={v.key}
                            style={[styles.chip, userEdit?.vehicle_coverage?.includes(v.key) && styles.chipSelected]}
                            onPress={() => toggleSelection('vehicle_coverage', v.key)}
                        >
                            <Text style={[styles.chipText, userEdit?.vehicle_coverage?.includes(v.key) && styles.chipTextSelected]}>{t(v.label)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Space height={24} />
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>{t('puncture_save_vehicle_coverage') || 'Save Vehicle Coverage'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default VehicleCoverageTab;

