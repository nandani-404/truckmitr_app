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

const ServicesTab = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { userEdit } = useSelector((state: any) => state?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchServicesData();
    }, []);

    // Map API field names to display keys
    const serviceFieldMapping: { [key: string]: string } = {
        'tube_puncture': 'Tube Puncture',
        'tubeless_tyre_repair': 'Tubeless Tyre Repair',
        'tyre_replacement': 'Tyre Replacement',
        'nitrogen_air_filling': 'Nitrogen / Air Filling',
        'stepney_installation': 'Stepney Installation',
        'wheel_balancing': 'Wheel Balancing',
        'minor_mechanical_repair': 'Minor Mechanical Repair',
        'jump_start_battery_help': 'Jump Start / Battery Help',
        'emergency_night_service': 'Emergency Night Service'
    };

    const fetchServicesData = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(END_POINTS.GET_SERVICE_OFFERED);
            if (response.data?.success && response.data.facilities) {
                const facilities = response.data.facilities;
                // Convert individual fields to services array
                const selectedServices: string[] = [];

                Object.keys(serviceFieldMapping).forEach(apiField => {
                    if (facilities[apiField] === '1' || facilities[apiField] === 1) {
                        selectedServices.push(serviceFieldMapping[apiField]);
                    }
                });

                dispatch(userEditAction({
                    ...userEdit,
                    services: selectedServices
                }));
            }
        } catch (error) {
            console.error('Error fetching services:', error);
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

    // Reverse mapping for saving
    const displayToApiMapping: { [key: string]: string } = {
        'Tube Puncture': 'tube_puncture',
        'Tubeless Tyre Repair': 'tubeless_tyre_repair',
        'Tyre Replacement': 'tyre_replacement',
        'Nitrogen / Air Filling': 'nitrogen_air_filling',
        'Stepney Installation': 'stepney_installation',
        'Wheel Balancing': 'wheel_balancing',
        'Minor Mechanical Repair': 'minor_mechanical_repair',
        'Jump Start / Battery Help': 'jump_start_battery_help',
        'Emergency Night Service': 'emergency_night_service'
    };

    const handleSave = async () => {
        if (!userEdit?.services || userEdit.services.length === 0) {
            showToast(t('please_select_at_least_one_service') || 'Please select at least one service');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();

            // Convert services array to individual API fields
            Object.values(displayToApiMapping).forEach(apiField => {
                formData.append(apiField, '0'); // Default all to 0
            });

            userEdit.services.forEach((service: string) => {
                const apiField = displayToApiMapping[service];
                if (apiField) {
                    formData.append(apiField, '1');
                }
            });

            const response = await axiosInstance.post(END_POINTS.SERVICE_OFFERED, formData);
            if (response.data?.success || response.data?.status) {
                showToast(response.data?.message || t('services_saved_successfully') || 'Services saved successfully');
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

    const servicesList = [
        { key: 'Tube Puncture', label: 'puncture_service_tube' },
        { key: 'Tubeless Tyre Repair', label: 'puncture_service_tubeless' },
        { key: 'Tyre Replacement', label: 'puncture_service_tyre_replacement' },
        { key: 'Nitrogen / Air Filling', label: 'puncture_service_air' },
        { key: 'Stepney Installation', label: 'puncture_service_stepney' },
        { key: 'Wheel Balancing', label: 'puncture_service_balancing' },
        { key: 'Minor Mechanical Repair', label: 'puncture_service_mechanical' },
        { key: 'Jump Start / Battery Help', label: 'puncture_service_battery' },
        { key: 'Emergency Night Service', label: 'puncture_service_emergency' }
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
                <Text style={[styles.helperText, { marginBottom: 15 }]}>{t('puncture_select_services_helper')}</Text>

                <View style={styles.gridContainer}>
                    {servicesList.map(item => {
                        const isSelected = userEdit?.services?.includes(item.key);
                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                                onPress={() => toggleSelection('services', item.key)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>{t(item.label)}</Text>
                            </TouchableOpacity>
                        );
                    })}
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
                        <Text style={styles.saveButtonText}>{t('puncture_save_services') || 'Save Services'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default ServicesTab;

