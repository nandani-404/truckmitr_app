import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Alert,
    Image,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@truckmitr/src/redux/store';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import ImagePicker from 'react-native-image-crop-picker';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { userAction } from '@truckmitr/src/redux/actions/user.action';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';

const EXPERIENCE_OPTIONS = [
    { label: '0-1', value: '0-1' },
    { label: '1-2', value: '1-2' },
    { label: '3-5', value: '3-5' },
    { label: '6-10', value: '6-10' },
    { label: '10+', value: '10+' },
];

const DRIVER_COUNT_OPTIONS = [
    { label: '1–10', value: '1-10' },
    { label: '11–25', value: '11-25' },
    { label: '26–50', value: '26-50' },
    { label: '50+', value: '50+' },
];

const ForemanProfileEdit = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const dispatch = useDispatch();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();
    const user = useSelector((state: RootState) => state.user?.user);

    const stepId = route.params?.stepId || 1;
    const [saving, setSaving] = useState(false);
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [formData, setFormData] = useState({
        DOB: user?.DOB || '',
        Driving_Experience: (() => {
            const exp = user?.Driving_Experience?.toString();
            if (exp === '0' || exp === '1') return '0-1';
            if (exp === '2') return '1-2';
            // If it's single digit representing start of range (old logic), map to new
            if (exp === '3') return '3-5';
            if (exp === '6') return '6-10';
            if (exp === '10') return '10+';
            return exp || '';
        })(),
        License_Number: user?.License_Number || '',
        Expiry_date_of_License: user?.Expiry_date_of_License || '',
        PAN_Number: user?.PAN_Number || '',
        driver_poll_size: user?.driver_poll_size || user?.foreman_bank_detail?.driver_poll_size || '',
    });

    const [dateType, setDateType] = useState<'dob' | 'dl_expiry' | null>(null);

    const handleConfirmDate = () => {
        const formattedDate = moment(tempDate).format('YYYY-MM-DD');
        if (dateType === 'dob') {
            setFormData({ ...formData, DOB: formattedDate });
        } else if (dateType === 'dl_expiry') {
            setFormData({ ...formData, Expiry_date_of_License: formattedDate });
        }
        setDatePickerVisibility(false);
    };

    const openCamera = async () => {
        setImagePickerOpen(false);
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: false,
                mediaType: 'photo',
            });
            if (image) setSelectedImage(image);
        } catch (error) {
            console.log('Camera error:', error);
        }
    };

    const pickImage = async () => {
        setImagePickerOpen(false);
        const hasPermission = await requestPhotoLibraryPermission();
        if (!hasPermission) return;

        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: false,
                mediaType: 'photo',
            });
            if (image) setSelectedImage(image);
        } catch (error) {
            console.log('Gallery error:', error);
        }
    };

    const refreshProfile = async () => {
        try {
            const profile: any = await axiosInstance.get(END_POINTS.GET_PROFILE);
            if (profile?.data?.status) {
                dispatch(userAction(profile.data));
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (stepId === 'avatar' && !selectedImage) {
            Alert.alert('Required', 'Please select a photo first.');
            return;
        }
        if (stepId === 1 && (!formData.DOB || !formData.Driving_Experience)) {
            Alert.alert('Required', 'Please enter your Date of Birth and foreman experience.');
            return;
        }
        if (stepId === 2 && (!formData.License_Number || !formData.Expiry_date_of_License)) {
            Alert.alert('Required', 'Please enter your License Number and Expiry Date.');
            return;
        }
        if (stepId === 3 && !formData.PAN_Number) {
            Alert.alert('Required', 'Please enter your PAN Number.');
            return;
        }
        if (stepId === 4 && !formData.driver_poll_size) {
            Alert.alert('Required', 'Please select the number of drivers managed.');
            return;
        }

        setSaving(true);
        try {
            let response: any;

            if (stepId === 'avatar') {
                const imageData = new FormData();
                imageData.append('images', {
                    uri: selectedImage.path,
                    type: selectedImage.mime,
                    name: selectedImage.path.split('/').pop() || 'profile.jpg',
                } as any);

                response = await axiosInstance.post(END_POINTS.UPDATE_PROFILE_FOREMAN, imageData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                // Align keys with Driver module API and formatting
                const submitData: any = {
                    dob: formData.DOB ? moment(formData.DOB).format('DD-MM-YYYY') : '',
                    driving_experience: formData.Driving_Experience,
                    license_number: formData.License_Number,
                    expiry_date_of_license: formData.Expiry_date_of_License ? moment(formData.Expiry_date_of_License).format('DD-MM-YYYY') : '',
                    pan_number: formData.PAN_Number,
                    driver_poll_size: formData.driver_poll_size,
                };
                console.log('Profile Update Submit Data:', submitData);

                response = await axiosInstance.post(END_POINTS.UPDATE_PROFILE_FOREMAN, submitData);
            }

            if (response?.data?.success || response?.data?.status) {
                showToast('Changes saved successfully!');
                await refreshProfile();
                navigation.goBack();
            } else {
                Alert.alert('Error', response?.data?.message || 'Failed to save changes');
            }
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Something went wrong while saving changes.');
        } finally {
            setSaving(false);
        }
    };

    const getHeaderTitle = () => {
        switch (stepId) {
            case 'avatar': return 'Edit Profile Photo';
            case 1: return 'Edit Personal Details';
            case 2: return 'Edit License Details';
            case 3: return 'Edit PAN Details';
            case 4: return 'Edit Work Details';
            default: return 'Edit Profile';
        }
    };

    const renderInput = (label: string, value: string, placeholder: string, onChangeText: (text: string) => void, keyboardType: any = 'default', autoCapitalize: any = 'none') => (
        <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.6) }]}>{label}</Text>
            <TextInput
                style={[styles.input, {
                    backgroundColor: colors.blackOpacity(0.04),
                    color: colors.black,
                    fontSize: responsiveFontSize(1.8)
                }]}
                placeholder={placeholder}
                placeholderTextColor={colors.blackOpacity(0.3)}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );

    const renderDatePickerTrigger = (label: string, value: string, placeholder: string, type: 'dob' | 'dl_expiry') => (
        <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.6) }]}>{label}</Text>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    setDateType(type);
                    const currentDate = type === 'dob'
                        ? (formData.DOB ? new Date(formData.DOB) : moment().subtract(18, 'years').toDate())
                        : (formData.Expiry_date_of_License ? new Date(formData.Expiry_date_of_License) : new Date());
                    setTempDate(currentDate);
                    setDatePickerVisibility(true);
                }}
                style={[styles.input, {
                    backgroundColor: colors.blackOpacity(0.04),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }]}
            >
                <Text style={{
                    color: value ? colors.black : colors.blackOpacity(0.3),
                    fontSize: responsiveFontSize(1.8)
                }}>
                    {value ? moment(value).format('DD MMM YYYY') : placeholder}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.blackOpacity(0.4)} />
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        switch (stepId) {
            case 'avatar':
                return (
                    <View style={styles.contentCenter}>
                        <View style={styles.photoContainer}>
                            <Image
                                source={{
                                    uri: selectedImage
                                        ? selectedImage.path
                                        : user?.images
                                            ? `${BASE_URL}public/${user.images}`
                                            : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'
                                }}
                                style={[styles.largeAvatar, { borderColor: colors.royalBlue }]}
                            />
                            {saving && (
                                <View style={[styles.uploadOverlay, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                                    <ActivityIndicator color={colors.royalBlue} />
                                </View>
                            )}
                        </View>
                        <Space height={30} />
                        <TouchableOpacity
                            onPress={() => setImagePickerOpen(true)}
                            style={[styles.uploadBtn, { backgroundColor: colors.royalBlue + '10' }]}
                        >
                            <Feather name="camera" size={20} color={colors.royalBlue} />
                            <Text style={[styles.uploadBtnText, { color: colors.royalBlue }]}>Change Photo</Text>
                        </TouchableOpacity>
                        <Text style={[styles.photoTip, { color: colors.blackOpacity(0.4) }]}>
                            A clear photo helps in verifying your profile.
                        </Text>
                    </View>
                );
            case 1:
                return (
                    <View style={styles.sectionContainer}>
                        {renderDatePickerTrigger('Date of Birth', formData.DOB, 'Select DOB', 'dob')}
                        <Text style={[styles.label, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.6), marginBottom: 12 }]}>Year of Experience</Text>
                        <View style={styles.optionsRow}>
                            {EXPERIENCE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => setFormData({ ...formData, Driving_Experience: opt.value })}
                                    style={[styles.optionBtn, {
                                        borderColor: formData.Driving_Experience === opt.value ? colors.royalBlue : colors.blackOpacity(0.1),
                                        backgroundColor: formData.Driving_Experience === opt.value ? colors.royalBlue + '08' : 'transparent',
                                        minWidth: '30%'
                                    }]}
                                >
                                    <Text style={[styles.optionText, { color: formData.Driving_Experience === opt.value ? colors.royalBlue : colors.blackOpacity(0.7) }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.sectionContainer}>
                        {renderInput('Driving License Number', formData.License_Number, 'Enter DL No', (text) => setFormData({ ...formData, License_Number: text.toUpperCase() }), 'default', 'characters')}
                        {renderDatePickerTrigger('License Expiry Date', formData.Expiry_date_of_License, 'Select Expiry Date', 'dl_expiry')}
                    </View>
                );
            case 3:
                return (
                    <View style={styles.sectionContainer}>
                        {renderInput('PAN Number', formData.PAN_Number, 'Enter PAN No', (text) => setFormData({ ...formData, PAN_Number: text.toUpperCase() }), 'default', 'characters')}
                        <View style={[styles.msgBox, { backgroundColor: colors.royalBlue + '08', borderColor: colors.royalBlue + '20' }]}>
                            <Ionicons name="information-circle-outline" size={20} color={colors.royalBlue} />
                            <Text style={[styles.msgText, { color: colors.royalBlue }]}>PAN is required for commission payouts</Text>
                        </View>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.label, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.6), marginBottom: 12 }]}>Drivers Managed</Text>
                        <View style={styles.optionsRow}>
                            {DRIVER_COUNT_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => setFormData({ ...formData, driver_poll_size: opt.value })}
                                    style={[styles.optionBtn, {
                                        borderColor: formData.driver_poll_size === opt.value ? colors.royalBlue : colors.blackOpacity(0.1),
                                        backgroundColor: formData.driver_poll_size === opt.value ? colors.royalBlue + '08' : 'transparent',
                                        minWidth: '45%'
                                    }]}
                                >
                                    <Text style={[styles.optionText, { color: formData.driver_poll_size === opt.value ? colors.royalBlue : colors.blackOpacity(0.7) }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.white }]}>
            <StatusBar barStyle="dark-content" />
            <Space height={safeAreaInsets.top} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black, fontSize: responsiveFontSize(2) }]}>{getHeaderTitle()}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {renderContent()}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom + 20 }]}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={[styles.saveBtn, { backgroundColor: colors.royalBlue, ...shadow }]}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={[styles.saveBtnText, { color: colors.white, fontSize: responsiveFontSize(2) }]}>
                                {stepId === 'avatar' ? 'Update Photo' : 'Save Changes'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={isDatePickerVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.datePickerBox, shadow]}>
                        <Text style={[styles.datePickerTitle, { color: colors.black }]}>
                            {dateType === 'dob' ? 'Select Date of Birth' : 'Select Expiry Date'}
                        </Text>
                        <DatePicker
                            mode="date"
                            theme="light"
                            date={tempDate}
                            onDateChange={setTempDate}
                            maximumDate={dateType === 'dob' ? moment().subtract(18, 'years').toDate() : undefined}
                            minimumDate={dateType === 'dl_expiry' ? new Date() : undefined}
                        />
                        <View style={styles.datePickerButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDatePickerVisibility(false)}>
                                <Text style={[styles.cancelBtnText, { color: colors.blackOpacity(0.6) }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.royalBlue }]} onPress={handleConfirmDate}>
                                <Text style={styles.confirmBtnText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={imagePickerOpen} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setImagePickerOpen(false)}>
                    <View style={styles.bottomModalOverlay}>
                        <View style={styles.bottomModalContent}>
                            <Text style={[styles.modalTitle, { color: colors.black }]}>Choose Action</Text>
                            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
                                <Ionicons name="camera-outline" size={24} color={colors.black} />
                                <Text style={[styles.modalOptionText, { color: colors.black }]}>Camera</Text>
                            </TouchableOpacity>
                            <View style={[styles.modalDivider, { backgroundColor: colors.blackOpacity(0.05) }]} />
                            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                                <Ionicons name="image-outline" size={24} color={colors.black} />
                                <Text style={[styles.modalOptionText, { color: colors.black }]}>Gallery</Text>
                            </TouchableOpacity>
                            <Space height={safeAreaInsets.bottom + 10} />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { fontWeight: '700' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    scrollContent: { padding: 20 },
    sectionContainer: { flex: 1 },
    contentCenter: { flex: 1, alignItems: 'center', paddingTop: 40 },
    photoContainer: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden' },
    largeAvatar: { width: 160, height: 160, borderRadius: 80, borderWidth: 4 },
    uploadOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
    uploadBtnText: { fontWeight: '700', fontSize: 15 },
    photoTip: { marginTop: 16, fontSize: 13, textAlign: 'center' },
    inputWrapper: { marginBottom: 20 },
    label: { fontWeight: '600', marginBottom: 8 },
    input: { height: 52, borderRadius: 12, paddingHorizontal: 16, fontWeight: '500' },
    msgBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 10 },
    msgText: { marginLeft: 8, fontSize: 13, fontWeight: '600' },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    optionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minWidth: '45%', alignItems: 'center' },
    optionText: { fontSize: 15, fontWeight: '600' },
    footer: { paddingHorizontal: 20, paddingTop: 10 },
    saveBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontWeight: 'bold' },
    bottomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    bottomModalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    modalOptionText: { fontSize: 16, marginLeft: 16, fontWeight: '500' },
    modalDivider: { height: 1 },
    datePickerBox: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: '90%', alignItems: 'center' },
    datePickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    datePickerButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontWeight: '600', fontSize: 15 },
    confirmBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

export default ForemanProfileEdit;