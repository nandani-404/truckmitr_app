import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDhabhaProfile, FacilityState } from '../DhabhaProfileContext';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FacilitiesTab = () => {
    const { t } = useTranslation();
    const { profileData, setProfileData } = useDhabhaProfile();
    const colors = useColor();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const response: any = await axiosInstance.get(END_POINTS.GET_DHABA_FACILITIES);
                console.log('GET_DHABA_FACILITIES response:', response?.data);
                if (response?.data?.success && response?.data?.facilities) {
                    // console.log('Facilities:', response.data);

                    const f = response.data.facilities;
                    console.log('Facilities:', f);

                    setProfileData(prev => ({
                        ...prev,
                        facilities: {
                            sitting_facility: f?.sitting_facility === 1,
                            clean_restrooms: f?.clean_restrooms === 1,
                            drinking_water: f?.drinking_water === 1,
                            parking_small: f?.parking_small === 1,
                            parking_large: f?.parking_large === 1,
                            sleeping_area: f?.sleeping_area === 1,
                            washing_area: f?.washing_area === 1,
                            electric_point: f?.electric_point === 1,
                            cctv: f?.cctv === 1,
                            security_staff: f?.security_staff === 1,
                            wheel_alignment: f?.wheel_alignment === 1,
                            mechanic: f?.mechanic === 1,
                            wifi: f?.wifi === 1
                        }
                    }));
                }
            } catch (error) {
                console.error('Error fetching facilities:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    const toggleFacility = (key: keyof FacilityState) => {
        setProfileData(prev => ({
            ...prev,
            facilities: { ...prev.facilities, [key]: !prev.facilities[key] }
        }));
    };

    const ShimmerPlaceholder = () => (
        <View style={styles.sectionCard}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <View key={item} style={{ marginBottom: 15 }}>
                    <View style={{ width: 100, height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ width: '100%', height: 40, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
                </View>
            ))}
        </View>
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            const f = profileData.facilities;

            let dhabaId = profileData.dhabaId;
            if (!dhabaId) {
                dhabaId = await AsyncStorage.getItem('dhaba_id') || '';
            }
            formData.append('dhaba_id', dhabaId);

            const fields: (keyof FacilityState)[] = [
                'sitting_facility', 'clean_restrooms', 'drinking_water',
                'parking_small', 'parking_large', 'sleeping_area',
                'washing_area', 'electric_point', 'cctv',
                'security_staff', 'wheel_alignment', 'mechanic', 'wifi'
            ];

            fields.forEach(field => {
                formData.append(field, f[field] ? '1' : '0');
            });

            const response = await axiosInstance.post(END_POINTS.DHABA_FACILITIES, formData);

            if (response?.data?.status || response?.data?.success) {
                showToast(response?.data?.message || t('facilitiesSavedSuccess'));
            } else {
                showToast(response?.data?.message || t('failedToSaveFacilities'));
            }
        } catch (error: any) {
            console.error('Facilities Save Error:', error);
            showToast(error?.response?.data?.message || t('somethingWentWrong'));
        } finally {
            setSaving(false);
        }
    };

    const facilityList: { key: keyof FacilityState; label: string }[] = [
        { key: 'sitting_facility', label: t('sitting_facility') },
        { key: 'clean_restrooms', label: t('clean_restrooms') },
        { key: 'drinking_water', label: t('drinking_water') },
        { key: 'parking_small', label: t('parking_small') },
        { key: 'parking_large', label: t('parking_large') },
        { key: 'sleeping_area', label: t('sleeping_area') },
        { key: 'washing_area', label: t('washing_area') },
        { key: 'electric_point', label: t('electric_point') },
        { key: 'cctv', label: t('cctv') },
        { key: 'security_staff', label: t('security_staff') },
        { key: 'wheel_alignment', label: t('wheel_alignment') },
        { key: 'mechanic', label: t('mechanic') },
        { key: 'wifi', label: t('wifi') },
    ];

    const renderFacilityItem = (item: { key: keyof FacilityState; label: string }) => {
        const isSelected = !!profileData.facilities[item.key];
        return (
            <TouchableOpacity
                key={item.key}
                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                onPress={() => toggleFacility(item.key)}
                activeOpacity={0.7}
            >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <ShimmerPlaceholder />
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
                <Text style={[styles.inputLabel, { marginBottom: 15 }]}>{t('selectAvailableFacilities')}</Text>
                <View style={styles.gridContainer}>
                    {facilityList.map(renderFacilityItem)}
                </View>
            </View>

            {/* Save Button */}
            <View style={{ marginTop: 10, marginBottom: 20 }}>
                <TouchableOpacity
                    onPress={handleSave}
                    style={{
                        backgroundColor: colors.royalBlue,
                        height: 50,
                        borderRadius: 25,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.royalBlue,
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4
                    }}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                            {t('saveFacilities')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView >
    );
};

export default FacilitiesTab;
