import { Image, Text, TextInput, TouchableOpacity, View, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Modal, FlatList } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import { userAuthenticatedAction, userAction } from '@truckmitr/src/redux/actions/user.action';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import ImagePicker from 'react-native-image-crop-picker';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';

// Association Types
const ASSOCIATION_TYPES = [
    { id: 'Union', label: 'associate_profile_completion_union' },
    { id: 'Society', label: 'associate_profile_completion_society' },
    { id: 'Trust', label: 'associate_profile_completion_trust' },
    { id: 'Informal', label: 'associate_profile_completion_informal' },
];

// Indian States
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function DriverAssociationProfileEdit() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    // Status Bar
    useStatusBarStyle('dark-content');

    // User Data from Redux
    const { user } = useSelector((state: any) => state?.user);

    // State
    const [loading, setLoading] = useState(false);
    const [imagePickerOpen, setImagePickerOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        association_name: '',
        association_type: '',
        registration_number: '',
        office_address: '',
        operating_states: [] as string[],
        coverage_area: ''
    });

    const [initialFormData, setInitialFormData] = useState<any>(null);

    const [statePickerOpen, setStatePickerOpen] = useState(false);

    const [profileImage, setProfileImage] = useState<any>(null);

    useEffect(() => {
        if (user) {
            const initialData = {
                name: user.name || '',
                mobile: user.mobile || user.Mobile || '',
                association_name: user.association_name || '',
                association_type: user.association_type || '',
                registration_number: user.registration_number || '',
                office_address: user.office_address || '',
                operating_states: user.operating_states ? user.operating_states.split(', ') : [],
                coverage_area: user.coverage_area || ''
            };
            setFormData(initialData);
            setInitialFormData(initialData);
        }
    }, [user]);

    const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData) || profileImage !== null;

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast(t('nameRequired') || 'Name is required');
            return;
        }

        if (!formData.association_name.trim()) {
            showToast(t('associate_profile_completion_association_name_error'));
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('association_name', formData.association_name);
            data.append('association_type', formData.association_type);
            data.append('registration_number', formData.registration_number);
            data.append('office_address', formData.office_address);
            data.append('operating_states', formData.operating_states.join(', '));
            data.append('coverage_area', formData.coverage_area);

            if (profileImage) {
                data.append('images', {
                    uri: profileImage.uri,
                    type: profileImage.type,
                    name: profileImage.name,
                } as any);
            }

            const response: any = await axiosInstance.post(END_POINTS.ASSOCIATION_PROFILE_COMPLETION, data);

            if (response?.data?.status) {
                showToast(t('profileUpdated') || 'Profile updated successfully');

                // Fetch updated profile
                const profile: any = await axiosInstance.get(END_POINTS.GET_PROFILE);
                if (profile?.data?.status) {
                    dispatch(userAction(profile.data));
                }

                navigation.goBack();
            } else {
                showToast(response?.data?.message || t('profileUpdateFailed'));
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            showToast(error?.message || t('somethingWentWrong'));
        } finally {
            setLoading(false);
        }
    };

    const toggleState = (state: string) => {
        if (formData.operating_states.includes(state)) {
            setFormData({
                ...formData,
                operating_states: formData.operating_states.filter(s => s !== state)
            });
        } else {
            setFormData({
                ...formData,
                operating_states: [...formData.operating_states, state]
            });
        }
    };

    const renderStatePicker = () => (
        <Modal visible={statePickerOpen} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('associate_profile_completion_select_operating_states_modal')}</Text>
                        <TouchableOpacity onPress={() => setStatePickerOpen(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={INDIAN_STATES}
                        keyExtractor={(item) => item}
                        style={{ maxHeight: 400 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.stateItem}
                                onPress={() => toggleState(item)}
                            >
                                <Text style={styles.stateItemText}>{item}</Text>
                                {formData.operating_states.includes(item) && (
                                    <Ionicons name="checkmark-circle" size={22} color="#246BFD" />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={styles.modalDoneButton}
                        onPress={() => setStatePickerOpen(false)}
                    >
                        <Text style={styles.modalDoneButtonText}>{t('associate_profile_completion_done')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const handlePickImage = async () => {
        try {
            const hasPermission = await requestPhotoLibraryPermission();
            if (!hasPermission) { showToast('Photo permission required'); return; }
            const image = await ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.8, });
            if (image?.path) {
                setProfileImage({ uri: image.path, type: image.mime, name: image.filename || 'profile.jpg' });
            }
        } catch (error) {
            console.log('Image Picker Error:', error);
        }
    };

    const userProfileDisplay = profileImage
        ? profileImage
        : user?.images
            ? { uri: `${BASE_URL}public/${user?.images}` }
            : null;

    return (
        <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top }]}>
                <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('editProfile') || 'Edit Profile'}</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={100}
            >
                <Space height={20} />

                {/* Profile Image Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={userProfileDisplay ? userProfileDisplay : { uri: DEFAULT_AVATAR }}
                            style={styles.avatarImage}
                        />
                        <TouchableOpacity style={styles.editBadge} onPress={handlePickImage}>
                            <MaterialIcons name="camera-alt" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarHint}>{t('tapToChangePhoto') || 'Tap to change photo'}</Text>
                </View>

                <Space height={32} />

                {/* Form Fields */}
                <View style={styles.formSection}>

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('fullName') || 'Full Name'} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Enter your name"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    {/* Mobile (Read Only) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('mobileNumber') || 'Mobile Number'}</Text>
                        <View style={[styles.textInput, styles.disabledInput]}>
                            <Text style={{ color: '#64748B' }}>{formData.mobile}</Text>
                            <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                        </View>
                    </View>

                </View>

                <Space height={32} />

                {/* Association Details Section */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="business" size={24} color={colors.royalBlue} />
                    <Text style={styles.sectionTitle}>{t('association_details') || 'Association Details'}</Text>
                </View>

                <View style={styles.formSection}>
                    {/* Association Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('associate_profile_completion_association_name') || 'Association Name'} <Text style={styles.requiredAsterisk}>*</Text></Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.association_name}
                            onChangeText={(text) => setFormData({ ...formData, association_name: text })}
                            placeholder="Enter association name"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    {/* Association Type */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('associate_profile_completion_association_type') || 'Association Type'}</Text>
                        <View style={styles.typeGrid}>
                            {ASSOCIATION_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeCard,
                                        formData.association_type === type.id && styles.typeCardSelected
                                    ]}
                                    onPress={() => setFormData({ ...formData, association_type: type.id })}
                                >
                                    <Text style={[
                                        styles.typeCardText,
                                        formData.association_type === type.id && styles.typeCardTextSelected
                                    ]}>
                                        {t(type.label)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Registration Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('associate_profile_completion_reg_num_optional') || 'Registration Number'}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.registration_number}
                            onChangeText={(text) => setFormData({ ...formData, registration_number: text })}
                            placeholder="Enter registration number"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    {/* Office Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('associate_profile_completion_office_address') || 'Office Address'}</Text>
                        <TextInput
                            style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                            value={formData.office_address}
                            onChangeText={(text) => setFormData({ ...formData, office_address: text })}
                            placeholder="Enter office address"
                            placeholderTextColor="#94A3B8"
                            multiline
                        />
                    </View>

                    {/* Operating States */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('associate_profile_completion_operating_states') || 'Operating States'}</Text>
                        <TouchableOpacity
                            style={styles.classicBox}
                            onPress={() => setStatePickerOpen(true)}
                        >
                            <Text style={{ color: formData.operating_states.length > 0 ? '#1E293B' : '#94A3B8', fontWeight: '500' }}>
                                {formData.operating_states.length > 0
                                    ? t('associate_profile_completion_states_selected', { count: formData.operating_states.length }) || `${formData.operating_states.length} states selected`
                                    : t('associate_profile_completion_select_states') || 'Select operating states'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#64748B" />
                        </TouchableOpacity>
                        {formData.operating_states.length > 0 && (
                            <View style={styles.selectedStatesContainer}>
                                {formData.operating_states.map((state) => (
                                    <View key={state} style={styles.stateTag}>
                                        <Text style={styles.stateTagText}>{state}</Text>
                                        <TouchableOpacity onPress={() => toggleState(state)}>
                                            <Ionicons name="close-circle" size={16} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Coverage Area */}
                    {/* <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('associate_profile_completion_coverage_area_optional') || 'Coverage Area'}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.coverage_area}
                            onChangeText={(text) => setFormData({ ...formData, coverage_area: text })}
                            placeholder="Enter coverage area"
                            placeholderTextColor="#94A3B8"
                        />
                    </View> */}
                </View>

                <Space height={120} />
            </KeyboardAwareScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom || 20 }]}>
                <TouchableOpacity
                    style={[styles.saveButton, (!hasChanged || loading) && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={!hasChanged || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>{t('updateProfile') || 'Update Profile'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {renderStatePicker()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    navBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    scrollContent: {
        paddingBottom: 120,
        paddingHorizontal: 20,
    },
    avatarSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        position: 'relative',
        width: 110,
        height: 110,
        marginBottom: 12,
    },
    avatarImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarHint: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    formSection: {
        gap: 20,
    },
    inputGroup: {
        flexDirection: 'column',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    requiredAsterisk: {
        color: '#EF4444',
    },
    textInput: {
        height: 52,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    disabledInput: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginLeft: 8,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    typeCard: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    typeCardSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#6366F1',
    },
    typeCardText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    typeCardTextSelected: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    classicBox: {
        height: 52,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedStatesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    stateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stateTagText: {
        fontSize: 13,
        color: '#334155',
        marginRight: 6,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    saveButton: {
        height: 56,
        backgroundColor: '#2563EB',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    stateItemText: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    modalDoneButton: {
        backgroundColor: '#2563EB',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    modalDoneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
