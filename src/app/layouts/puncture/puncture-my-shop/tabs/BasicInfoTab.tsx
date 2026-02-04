import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { Space } from '@truckmitr/src/app/components';
import { styles } from './styles';
import { InputItem, MandatoryLabel } from './components';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const BasicInfoTab = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { userEdit } = useSelector((state: any) => state?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [yearPickerVisible, setYearPickerVisible] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        fetchBasicInfo();
    }, []);

    const fetchBasicInfo = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(END_POINTS.GET_BASIC_INFO);
            if (response.data?.success && response.data.puncture) {
                const p = response.data.puncture;
                const updatedData = {
                    ...userEdit,
                    puncture_id: p.id || userEdit?.puncture_id,
                    shop_name: p.puncture_name || '',
                    owner_name: p.owner_name || '',
                    mobile: p.mobile || '',
                    email: p.email || '',
                    estimation_year: p.year_established ? moment(p.year_established, 'YYYY').format('YYYY-MM-DD') : '',
                    shop_type: p.puncture_type || ''
                };
                dispatch(userEditAction(updatedData));
            }
        } catch (error) {
            console.error('Error fetching basic info:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (key: string, value: any) => {
        dispatch(userEditAction({ ...userEdit, [key]: value }));
    };

    const handleSave = async () => {
        if (!userEdit?.shop_name || !userEdit?.owner_name || !userEdit?.mobile) {
            showToast(t('please_fill_all_mandatory_fields') || 'Please fill all mandatory fields');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('puncture_name', userEdit?.shop_name || '');
            formData.append('owner_name', userEdit?.owner_name || '');
            formData.append('mobile', userEdit?.mobile || '');
            formData.append('email', userEdit?.email || '');
            formData.append('year_established', userEdit?.estimation_year ? moment(userEdit.estimation_year).format('YYYY') : '');
            formData.append('puncture_type', userEdit?.shop_type || '');

            const response = await axiosInstance.post(END_POINTS.PUNCTURE_BASIC_INFO, formData);
            if (response.data?.success || response.data?.status) {
                showToast(response.data?.message || t('basic_info_saved_successfully') || 'Basic info saved successfully');
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

    const ShimmerPlaceholder = () => (
        <View style={styles.stepContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
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
                <InputItem
                    label={t('puncture_shop_name_label')}
                    icon="storefront-outline"
                    placeholder={t('puncture_shop_name_placeholder')}
                    value={userEdit?.shop_name}
                    onChangeText={(text: string) => updateUser('shop_name', text)}
                />

                <InputItem
                    label={t('puncture_owner_name_label')}
                    icon="person-outline"
                    placeholder={t('puncture_owner_name_placeholder')}
                    value={userEdit?.owner_name}
                    onChangeText={(text: string) => updateUser('owner_name', text)}
                />

                <InputItem
                    label={t('puncture_mobile_number_label')}
                    icon="call-outline"
                    placeholder={t('puncture_mobile_placeholder')}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={userEdit?.mobile}
                    onChangeText={(text: string) => updateUser('mobile', text.replace(/[^0-9]/g, ''))}
                />

                <InputItem
                    label={t('puncture_email_label')}
                    icon="mail-outline"
                    placeholder={t('puncture_email_placeholder')}
                    keyboardType="email-address"
                    optional
                    value={userEdit?.email}
                    onChangeText={(text: string) => updateUser('email', text)}
                />

                <InputItem
                    label={t('puncture_year_est_label')}
                    icon="calendar-outline"
                    placeholder="DD MMM YYYY"
                    optional
                    value={userEdit?.estimation_year ? moment(userEdit.estimation_year).format('DD MMM YYYY') : ''}
                    editable={false}
                    onPress={() => {
                        setTempDate(userEdit?.estimation_year ? moment(userEdit.estimation_year).toDate() : new Date());
                        setYearPickerVisible(true);
                    }}
                />

                {/* custom calendar modal */}
                <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
                    <View style={styles.yearPickerOverlay}>
                        <View style={[styles.yearPickerContainer, { alignItems: 'center' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
                                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('puncture_select_date')}</Text>
                                <TouchableOpacity onPress={() => setYearPickerVisible(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <DatePicker
                                date={tempDate}
                                onDateChange={setTempDate}
                                mode="date"
                                maximumDate={new Date()}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    updateUser('estimation_year', moment(tempDate).format('YYYY-MM-DD'));
                                    setYearPickerVisible(false);
                                }}
                                style={{ backgroundColor: '#246BFD', borderRadius: 12, paddingVertical: 14, marginTop: 20, alignItems: 'center', width: '100%' }}
                            >
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('puncture_done')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Space height={8} />
                <MandatoryLabel text={t('puncture_shop_type_label')} style={{ marginLeft: 4 }} />
                <Text style={[styles.helperText, { marginLeft: 4, marginBottom: 10 }]}>{t('puncture_shop_type_helper')}</Text>
                <View style={styles.shopTypeGrid}>
                    {[
                        { key: 'Highway Puncture Shop', label: 'puncture_highway_shop' },
                        { key: 'Roadside Puncture Shop', label: 'puncture_roadside_shop' },
                        { key: 'Garage + Puncture', label: 'puncture_garage_shop' },
                        { key: 'Mobile Puncture Van', label: 'puncture_mobile_van' }
                    ].map(item => (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.shopTypeCard, userEdit?.shop_type === item.key && styles.shopTypeCardSelected]}
                            onPress={() => updateUser('shop_type', item.key)}
                        >
                            <Text style={[styles.shopTypeText, userEdit?.shop_type === item.key && styles.shopTypeTextSelected]}>
                                {t(item.label)}
                            </Text>
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
                        <Text style={styles.saveButtonText}>{t('puncture_save_basic_info') || 'Save Basic Info'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default BasicInfoTab;

