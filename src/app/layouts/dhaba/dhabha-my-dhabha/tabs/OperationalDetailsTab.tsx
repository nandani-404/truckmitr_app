import React, { useState, useEffect } from 'react';
import { View, ScrollView, Modal, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { useDhabhaProfile } from '../DhabhaProfileContext';
import { RenderInputField, RenderSwitch, MandatoryLabel } from '../components/FormComponents';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const OperationalDetailsTab = () => {
    const { t } = useTranslation();
    const { profileData, setProfileData } = useDhabhaProfile();
    const colors = useColor();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Time picker states
    const [openingTimePickerVisible, setOpeningTimePickerVisible] = useState(false);
    const [closingTimePickerVisible, setClosingTimePickerVisible] = useState(false);

    // Fetch operational data from API on mount
    useEffect(() => {
        fetchOperationalData();
    }, []);

    const fetchOperationalData = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(END_POINTS.GET_DHABA_OPERATIONAL_DETAILS);
            if (response?.data?.success && response?.data?.operation) {
                const operation = response.data.operation;
                setProfileData(prev => ({
                    ...prev,
                    openingTime: operation.opening_time || '',
                    closingTime: operation.closing_time || '',
                    is24x7: operation.is_24x7 === '1' || operation.is_24x7 === 1,
                    peakHours: operation.peak_hours || '',
                    avgWaitTime: operation.avg_wait_time || '',
                }));
            }
        } catch (error: any) {
            console.error('OperationalDetailsTab: Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('opening_time', profileData.openingTime ? moment(profileData.openingTime, ['hh:mm A', 'HH:mm']).format('HH:mm') : '');
            formData.append('closing_time', profileData.closingTime ? moment(profileData.closingTime, ['hh:mm A', 'HH:mm']).format('HH:mm') : '');
            formData.append('is_24_7', profileData.is24x7 ? '1' : '0');
            formData.append('peak_hours', profileData.peakHours);

            const response = await axiosInstance.post(END_POINTS.DHABA_OPERATIONAL_DETAILS, formData);

            if (response?.data?.status || response?.data?.success) {
                showToast(response?.data?.message || t('operationalDetailsSavedSuccess'));
            } else {
                showToast(response?.data?.message || t('failedToSaveOperationalInfo'));
            }
        } catch (error: any) {
            console.error('Operational Save Error:', error);
            showToast(error?.response?.data?.message || t('somethingWentWrong'));
        } finally {
            setSaving(false);
        }
    };

    const ShimmerPlaceholder = () => (
        <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 100, height: 20, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                <View style={{ width: 50, height: 30, backgroundColor: '#e0e0e0', borderRadius: 15 }} />
            </View>
            {[1, 2, 3].map((item) => (
                <View key={item} style={styles.inputContainer}>
                    <View style={{ width: 80, height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ width: '100%', height: 48, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
                </View>
            ))}
            <View style={{ marginTop: 24 }}>
                <View style={{ width: '100%', height: 50, backgroundColor: '#e0e0e0', borderRadius: 25 }} />
            </View>
        </View>
    );

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
                <RenderSwitch
                    label={t('open24x7Label')}
                    value={profileData.is24x7}
                    onValueChange={(val) => setProfileData(prev => ({ ...prev, is24x7: val }))}
                    color={colors.royalBlue}
                />

                {!profileData.is24x7 && (
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                            <MandatoryLabel text={t('openingTime')} />
                            <TouchableOpacity
                                onPress={() => setOpeningTimePickerVisible(true)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 14,
                                    marginTop: 4
                                }}
                            >
                                <Text style={{ color: profileData.openingTime ? '#1F2937' : '#9CA3AF', fontSize: 15 }}>
                                    {profileData.openingTime || t('selectTime')}
                                </Text>
                                <Ionicons name="time-outline" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <MandatoryLabel text={t('closingTime')} />
                            <TouchableOpacity
                                onPress={() => setClosingTimePickerVisible(true)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 14,
                                    marginTop: 4
                                }}
                            >
                                <Text style={{ color: profileData.closingTime ? '#1F2937' : '#9CA3AF', fontSize: 15 }}>
                                    {profileData.closingTime || t('selectTime')}
                                </Text>
                                <Ionicons name="time-outline" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <RenderInputField
                    label={t('peakHours')}
                    value={profileData.peakHours}
                    onChange={(text) => setProfileData(prev => ({ ...prev, peakHours: text }))}
                />

                <View style={{ marginTop: 24, marginBottom: 20 }}>
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
                                {t('saveOperationalDetails')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <DatePicker
                modal
                open={openingTimePickerVisible}
                date={(() => {
                    if (profileData.openingTime) {
                        const parsed = moment(profileData.openingTime, ['hh:mm A', 'HH:mm']);
                        if (parsed.isValid()) return parsed.toDate();
                    }
                    return new Date();
                })()}
                mode="time"
                title={t('selectOpeningTime')}
                onConfirm={(date) => {
                    const formattedTime = moment(date).format('hh:mm A');
                    if (profileData.closingTime) {
                        const closingMoment = moment(profileData.closingTime, 'hh:mm A');
                        const openingMoment = moment(formattedTime, 'hh:mm A');
                        if (openingMoment.isSameOrAfter(closingMoment)) {
                            showToast(t('openingTimeCannotBeAfterClosing'));
                            setOpeningTimePickerVisible(false);
                            return;
                        }
                    }
                    setProfileData(prev => ({ ...prev, openingTime: formattedTime }));
                    setOpeningTimePickerVisible(false);
                }}
                onCancel={() => setOpeningTimePickerVisible(false)}
            />

            <DatePicker
                modal
                open={closingTimePickerVisible}
                date={(() => {
                    if (profileData.closingTime) {
                        const parsed = moment(profileData.closingTime, ['hh:mm A', 'HH:mm']);
                        if (parsed.isValid()) return parsed.toDate();
                    }
                    return new Date();
                })()}
                mode="time"
                title={t('selectClosingTime')}
                onConfirm={(date) => {
                    const formattedTime = moment(date).format('hh:mm A');
                    if (profileData.openingTime) {
                        const openingMoment = moment(profileData.openingTime, 'hh:mm A');
                        const closingMoment = moment(formattedTime, 'hh:mm A');
                        if (closingMoment.isSameOrBefore(openingMoment)) {
                            showToast(t('closingTimeCannotBeBeforeOpening'));
                            setClosingTimePickerVisible(false);
                            return;
                        }
                    }
                    setProfileData(prev => ({ ...prev, closingTime: formattedTime }));
                    setClosingTimePickerVisible(false);
                }}
                onCancel={() => setClosingTimePickerVisible(false)}
            />
        </ScrollView>
    );
};

export default OperationalDetailsTab;
