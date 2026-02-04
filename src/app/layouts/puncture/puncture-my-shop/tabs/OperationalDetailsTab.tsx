import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import { userEditAction } from '@truckmitr/src/redux/actions/user.action';
import { Space } from '@truckmitr/src/app/components';
import { styles } from './styles';
import { MandatoryLabel } from './components';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const OperationalDetailsTab = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { userEdit } = useSelector((state: any) => state?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState<{ visible: boolean, type: 'opening' | 'closing' | null }>({ visible: false, type: null });
    const [serviceTimeModal, setServiceTimeModal] = useState(false);
    const [radiusModal, setRadiusModal] = useState(false);

    useEffect(() => {
        fetchOperationalData();
    }, []);

    const fetchOperationalData = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(END_POINTS.GET_PUNCTURE_OPERATION);
            if (response.data?.success && response.data.operation) {
                const op = response.data.operation;

                // Convert time strings (HH:mm:ss) to Date objects for the time picker
                let openingTimeDate = null;
                let closingTimeDate = null;

                if (op.opening_time) {
                    const [hours, minutes] = op.opening_time.split(':');
                    openingTimeDate = new Date();
                    openingTimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
                }

                if (op.closing_time) {
                    const [hours, minutes] = op.closing_time.split(':');
                    closingTimeDate = new Date();
                    closingTimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
                }

                dispatch(userEditAction({
                    ...userEdit,
                    is_24x7: op.is_24x7 === '1' || op.is_24x7 === 1 || op.is_24x7 === true,
                    opening_time: openingTimeDate ? openingTimeDate.toISOString() : '',
                    closing_time: closingTimeDate ? closingTimeDate.toISOString() : '',
                    on_road_service: op.on_road_service === '1' || op.on_road_service === 1 || op.on_road_service === true,
                    mobile_radius: op.mobile_service || '',
                    avg_service_time: op.average_service_time || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching operational data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (key: string, value: any) => {
        dispatch(userEditAction({ ...userEdit, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('is_24x7', userEdit?.is_24x7 ? '1' : '0');
            formData.append('opening_time', userEdit?.opening_time ? moment(userEdit.opening_time).format('HH:mm') : '');
            formData.append('closing_time', userEdit?.closing_time ? moment(userEdit.closing_time).format('HH:mm') : '');
            formData.append('on_road_service', userEdit?.on_road_service ? '1' : '0');
            formData.append('mobile_service', userEdit?.mobile_radius || '');
            formData.append('average_service_time', userEdit?.avg_service_time || '');

            const response = await axiosInstance.post(END_POINTS.PUNCTURE_OPERATION, formData);
            if (response.data?.success || response.data?.status) {
                showToast(response.data?.message || t('operational_details_saved') || 'Operational details saved');
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
                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.classicLabel}>{t('puncture_is_open_24x7')}</Text>
                        <Text style={styles.helperText}>{t('puncture_all_day_service')}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => updateUser('is_24x7', !userEdit?.is_24x7)}
                    >
                        <MaterialCommunityIcons
                            name={userEdit?.is_24x7 ? "toggle-switch" : "toggle-switch-off-outline"}
                            size={48}
                            color={userEdit?.is_24x7 ? '#246BFD' : '#ccc'}
                        />
                    </TouchableOpacity>
                </View>

                {!userEdit?.is_24x7 && (
                    <Animated.View entering={FadeIn} layout={Layout.springify()}>
                        <Space height={20} />
                        <View style={styles.rowGap}>
                            <View style={{ flex: 1 }}>
                                <MandatoryLabel text={t('puncture_opening_time')} />
                                <TouchableOpacity
                                    style={styles.datetimeBox}
                                    onPress={() => setTimePickerOpen({ visible: true, type: 'opening' })}
                                >
                                    <Text style={styles.datetimeText}>
                                        {userEdit?.opening_time ? moment(userEdit.opening_time).format('hh:mm A') : '00:00'}
                                    </Text>
                                    <Ionicons name="time-outline" size={20} color="#246BFD" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <MandatoryLabel text={t('puncture_closing_time')} />
                                <TouchableOpacity
                                    style={styles.datetimeBox}
                                    onPress={() => setTimePickerOpen({ visible: true, type: 'closing' })}
                                >
                                    <Text style={styles.datetimeText}>
                                        {userEdit?.closing_time ? moment(userEdit.closing_time).format('hh:mm A') : '00:00'}
                                    </Text>
                                    <Ionicons name="time-outline" size={20} color="#246BFD" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}

                <Space height={24} />
                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.classicLabel}>{t('puncture_on_road_service')}</Text>
                        <Text style={styles.helperText}>{t('puncture_on_road_service_helper')}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => updateUser('on_road_service', !userEdit?.on_road_service)}
                    >
                        <MaterialCommunityIcons
                            name={userEdit?.on_road_service ? "toggle-switch" : "toggle-switch-off-outline"}
                            size={48}
                            color={userEdit?.on_road_service ? '#246BFD' : '#ccc'}
                        />
                    </TouchableOpacity>
                </View>

                {userEdit?.on_road_service && (
                    <Animated.View entering={FadeIn} layout={Layout.springify()}>
                        <Space height={16} />
                        <Text style={styles.classicLabel}>{t('puncture_mobile_radius')}</Text>
                        <TouchableOpacity
                            style={[styles.classicInput, { justifyContent: 'center' }]}
                            onPress={() => setRadiusModal(true)}
                        >
                            <Text style={{ color: userEdit?.mobile_radius ? '#333' : '#999', fontSize: 16 }}>
                                {userEdit?.mobile_radius ? `${userEdit.mobile_radius} KM` : t('puncture_select_radius')}
                            </Text>
                            <Ionicons name="caret-down" size={16} color="#999" style={{ position: 'absolute', right: 15 }} />
                        </TouchableOpacity>

                        <Modal visible={radiusModal} transparent animationType="fade">
                            <View style={styles.yearPickerOverlay}>
                                <View style={styles.yearPickerContainer}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('puncture_mobile_radius')}</Text>
                                        <TouchableOpacity onPress={() => setRadiusModal(false)}>
                                            <Ionicons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={['5', '10', '15', '20', '30', '40', '50', '75', '100']}
                                        keyExtractor={(item) => item}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%' }}
                                                onPress={() => {
                                                    updateUser('mobile_radius', item);
                                                    setRadiusModal(false);
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, color: userEdit?.mobile_radius === item ? '#246BFD' : '#333', fontWeight: userEdit?.mobile_radius === item ? '600' : '400' }}>
                                                    {item} KM
                                                </Text>
                                                {userEdit?.mobile_radius === item && (
                                                    <Ionicons name="checkmark" size={20} color="#246BFD" style={{ position: 'absolute', right: 0, top: 15 }} />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    />
                                </View>
                            </View>
                        </Modal>
                    </Animated.View>
                )}

                <Text style={styles.classicLabel}>{t('puncture_avg_service_time')} <Text style={styles.optionalText}>{t('puncture_optional')}</Text></Text>
                <TouchableOpacity
                    style={[styles.classicInput, { justifyContent: 'center' }]}
                    onPress={() => setServiceTimeModal(true)}
                >
                    <Text style={{ color: userEdit?.avg_service_time ? '#333' : '#999', fontSize: 16 }}>
                        {userEdit?.avg_service_time || t('puncture_select_time')}
                    </Text>
                    <Ionicons name="caret-down" size={16} color="#999" style={{ position: 'absolute', right: 15 }} />
                </TouchableOpacity>

                <Modal visible={serviceTimeModal} transparent animationType="fade">
                    <View style={styles.yearPickerOverlay}>
                        <View style={styles.yearPickerContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('puncture_avg_service_time')}</Text>
                                <TouchableOpacity onPress={() => setServiceTimeModal(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={['15 Mins', '30 Mins', '45 Mins', '1 Hour', 'More than 1 Hour']}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%' }}
                                        onPress={() => {
                                            updateUser('avg_service_time', item);
                                            setServiceTimeModal(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, color: userEdit?.avg_service_time === item ? '#246BFD' : '#333', fontWeight: userEdit?.avg_service_time === item ? '600' : '400' }}>
                                            {item}
                                        </Text>
                                        {userEdit?.avg_service_time === item && (
                                            <Ionicons name="checkmark" size={20} color="#246BFD" style={{ position: 'absolute', right: 0, top: 15 }} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

                {/* Main Time Picker Modal */}
                <Modal
                    visible={timePickerOpen.visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setTimePickerOpen({ ...timePickerOpen, visible: false })}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                Select {timePickerOpen.type === 'opening' ? 'Opening' : 'Closing'} Time
                            </Text>
                            <DatePicker
                                date={
                                    (timePickerOpen.type === 'opening' && userEdit?.opening_time) ? new Date(userEdit.opening_time) :
                                        (timePickerOpen.type === 'closing' && userEdit?.closing_time) ? new Date(userEdit.closing_time) :
                                            new Date()
                                }
                                mode="time"
                                onDateChange={(date) => {
                                    const val = date.toISOString();
                                    if (timePickerOpen.type === 'opening') updateUser('opening_time', val);
                                    else updateUser('closing_time', val);
                                }}
                            />
                            <TouchableOpacity
                                onPress={() => setTimePickerOpen({ visible: false, type: null })}
                                style={styles.modalBtn}
                            >
                                <Text style={styles.modalBtnText}>{t('puncture_confirm_time')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
                        <Text style={styles.saveButtonText}>{t('puncture_save_operational') || 'Save Operational Details'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default OperationalDetailsTab;

