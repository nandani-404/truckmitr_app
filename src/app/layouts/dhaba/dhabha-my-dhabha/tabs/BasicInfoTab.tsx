import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { RenderRadioButton, MandatoryLabel, OptionalLabel } from '../components/FormComponents';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';

const dhabaTypes = [
    { label: 'highwayDhaba', value: 'Highway Dhaba' },
    { label: 'twentyFourSevenDhaba', value: '24x7 Dhaba' },
    { label: 'familyDhaba', value: 'Family Dhaba' },
    { label: 'vegDhaba', value: 'Veg Dhaba' },
];

const BasicInfoTab = () => {
    const { t } = useTranslation();
    // Get userEdit data from Redux (userEdit is for editing, keeps local changes)
    const { userEdit } = useSelector((state: any) => state?.user);
    const dispatch = useDispatch();
    const colors = useColor();
    const [openDate, setOpenDate] = useState(false);
    const [saving, setSaving] = useState(false);

    // Local state for form edits (initialized from Redux userEdit.dhaba)
    const [formData, setFormData] = useState({
        dhabaName: userEdit?.dhaba?.dhaba_name || '',
        ownerName: userEdit?.dhaba?.owner_name || '',
        mobile: userEdit?.dhaba?.mobile || userEdit?.mobile || '',
        email: userEdit?.dhaba?.email || userEdit?.email || '',
        establishmentYear: userEdit?.dhaba?.year_established || '',
        dhabaType: userEdit?.dhaba?.dhaba_type || '',
    });

    // Sync form data when userEdit.dhaba changes (e.g., after navigation or API update)
    useEffect(() => {
        setFormData({
            dhabaName: userEdit?.dhaba?.dhaba_name || '',
            ownerName: userEdit?.dhaba?.owner_name || '',
            mobile: userEdit?.dhaba?.mobile || userEdit?.mobile || '',
            email: userEdit?.dhaba?.email || userEdit?.email || '',
            establishmentYear: userEdit?.dhaba?.year_established || '',
            dhabaType: userEdit?.dhaba?.dhaba_type || '',
        });
    }, [userEdit?.dhaba]);

    // Initial Date Logic
    const getInitialDate = () => {
        if (!formData.establishmentYear) return new Date();
        const date = moment(formData.establishmentYear, ['YYYY', 'DD MMM YYYY', 'DD/MM/YYYY'], true);
        if (date.isValid()) return date.toDate();
        return new Date();
    };

    const handleSave = async () => {
        if (!formData.dhabaName || !formData.ownerName || !formData.mobile) {
            showToast(t('pleaseEnterAllRequiredDetails'));
            return;
        }

        if (formData.mobile?.length !== 10) {
            showToast(t('enter10DigitMobile'));
            return;
        }

        setSaving(true);
        try {
            const apiFormData = new FormData();

            if (userEdit?.dhaba?.id) {
                apiFormData.append('dhaba_id', userEdit.dhaba.id.toString());
            }

            apiFormData.append('dhaba_name', formData.dhabaName);
            apiFormData.append('owner_name', formData.ownerName);
            apiFormData.append('mobile', formData.mobile);
            apiFormData.append('email', formData.email || '');
            apiFormData.append('year_established', formData.establishmentYear || '');
            apiFormData.append('dhaba_type', formData.dhabaType || '');

            const response = await axiosInstance.post(END_POINTS.DHABA_BUSSINESS_INFO, apiFormData);

            if (response?.data?.status === true || response?.data?.success === true) {
                showToast(response?.data?.message || t('businessInfoSavedSuccess'));

                if (response?.data?.dhaba) {
                    dispatch(userEditAction({
                        ...userEdit,
                        dhaba: {
                            ...userEdit?.dhaba,
                            ...response.data.dhaba
                        }
                    }));

                    setFormData({
                        dhabaName: response.data.dhaba.dhaba_name || '',
                        ownerName: response.data.dhaba.owner_name || '',
                        mobile: response.data.dhaba.mobile || '',
                        email: response.data.dhaba.email || '',
                        establishmentYear: response.data.dhaba.year_established || '',
                        dhabaType: response.data.dhaba.dhaba_type || '',
                    });
                }
            } else {
                if (response?.data?.message) {
                    showToast(response?.data?.message);
                } else {
                    showToast(t('failedToSaveBusinessInfo'));
                }
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message || t('somethingWentWrong'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
                <View style={styles.inputContainer}>
                    <MandatoryLabel text={t('dhabhaName')} />
                    <TextInput
                        style={styles.input}
                        value={formData.dhabaName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, dhabaName: text }))}
                        placeholder={t('placeholderDhabhaName')}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MandatoryLabel text={t('ownerName')} />
                    <TextInput
                        style={styles.input}
                        value={formData.ownerName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, ownerName: text }))}
                        placeholder={t('enterFullName')}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MandatoryLabel text={t('mobile')} />
                    <TextInput
                        style={[styles.input, { backgroundColor: '#f0f0f0', color: '#666' }]}
                        value={formData.mobile}
                        editable={false}
                        placeholder={t('placeholder10Digit')}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <OptionalLabel text={t('email')} />
                    <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
                        placeholder={t('placeholderEmailExample')}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <OptionalLabel text={t('yearOfEstablishment')} />
                <TouchableOpacity
                    style={[styles.inputContainer, styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }]}
                    onPress={() => setOpenDate(true)}
                >
                    <Text style={{ color: formData.establishmentYear ? '#000' : '#999', flex: 1, fontSize: 14 }}>
                        {formData.establishmentYear || t('selectYear')}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.royalBlue} />
                </TouchableOpacity>

                <Modal visible={openDate} transparent animationType="fade" onRequestClose={() => setOpenDate(false)}>
                    <View style={styles.yearPickerOverlay}>
                        <View style={[styles.yearPickerContainer, { alignItems: 'center' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
                                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('selectYear')}</Text>
                                <TouchableOpacity onPress={() => setOpenDate(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <DatePicker
                                date={getInitialDate()}
                                onDateChange={(date) => {
                                    setFormData(prev => ({ ...prev, establishmentYear: moment(date).format('YYYY') }));
                                }}
                                mode="date"
                                maximumDate={new Date()}
                                theme="light"
                            />

                            <TouchableOpacity
                                onPress={() => setOpenDate(false)}
                                style={styles.modalDoneBtn}
                            >
                                <Text style={styles.modalDoneBtnText}>{t('done')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={{ height: 16 }} />

                <OptionalLabel text={t('dhabhaType') + ' (' + t('selectOne') + ')'} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
                    {dhabaTypes.map((type) => (
                        <View key={type.value} style={{ width: '48%', marginBottom: 16 }}>
                            <RenderRadioButton
                                label={t(type.label)}
                                selected={formData.dhabaType === type.value}
                                onPress={() => setFormData(prev => ({ ...prev, dhabaType: type.value }))}
                                color={colors.royalBlue}
                            />
                        </View>
                    ))}
                </View>

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
                                {t('saveBasicInfo')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default BasicInfoTab;
