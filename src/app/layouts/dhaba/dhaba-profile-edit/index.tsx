import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Image,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/utils/config/index';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import ImagePicker from 'react-native-image-crop-picker';
import { STACKS } from '@truckmitr/stacks/stacks';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import { userAction } from '@truckmitr/redux/actions/user.action';

const DhabaProfileEdit = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const colors = useColor();
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale();
    const { shadow } = useShadow();
    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: RootState) => state.user?.user);

    // State
    const [email, setEmail] = useState(user?.email || '');
    const [name, setName] = useState(user?.name || ''); // Name is now editable
    const [loading, setLoading] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState<any>(null);

    // Derived values (Read-only)
    const mobile = user?.mobile || '';
    const profileImage = user?.profile_img || user?.image || '';

    // Update state if user changes in redux
    useEffect(() => {
        if (user?.email) setEmail(user.email);
        if (user?.name) setName(user.name);
    }, [user?.email, user?.name]);

    const handlePickImage = async (source: 'camera' | 'gallery') => {
        try {
            let hasPermission = false;
            if (source === 'camera') {
                hasPermission = await requestCameraPermission();
            } else {
                hasPermission = await requestPhotoLibraryPermission();
            }

            if (!hasPermission) return;

            const commonOptions = {
                width: 800,
                height: 800,
                cropping: false,
                cropperCircleOverlay: true,
                mediaType: 'photo' as const,
                compressImageQuality: 0.8,
            };

            const image = source === 'camera'
                ? await ImagePicker.openCamera(commonOptions)
                : await ImagePicker.openPicker(commonOptions);

            setNewProfileImage(image);
            setPickerVisible(false);
        } catch (error: any) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
                console.warn('ImagePicker Error:', error);
                showToast(t('errorPickingImage', 'Error picking image'));
            }
            setPickerVisible(false);
        }
    };

    const handleUpdate = async () => {
        // Validation
        if (!name || !name.trim()) {
            showToast(t('nameRequired', 'Name is mandatory'));
            return;
        }

        if (!email || !email.trim()) {
            showToast(t('emailRequired', 'Email is mandatory'));
            return;
        }

        // Simple email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast(t('invalidEmail', 'Please enter a valid email address'));
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('name', name);
            // formData.append('mobile', mobile); // Mobile usually not editable/sent

            if (newProfileImage) {
                const fileName = newProfileImage.path.split('/').pop() || 'profile.jpg';
                formData.append('profile_image', {
                    uri: newProfileImage.path,
                    type: newProfileImage.mime || 'image/jpeg',
                    name: fileName,
                });
            }

            const response = await axiosInstance.post(END_POINTS.DHABA_UPDATE_PROFILE, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && (response.data.status || response.data.success)) {
                console.log('DEBUG: Profile update success. Response:', response.data);
                showToast(t('profileUpdated', 'Profile updated successfully'));

                if (response.data.user) {
                    // Merge existing user with updated fields only to avoid null overwrites
                    const updatedUser = {
                        ...user,
                        name: response.data.user.name,
                        email: response.data.user.email,
                        // Only update image fields if they exist in response
                        ...(response.data.user.profile_img && { profile_img: response.data.user.profile_img }),
                        ...(response.data.user.image && { image: response.data.user.image }),
                        ...(response.data.user.images && { images: response.data.user.images }),
                    };
                    console.log('DEBUG: Dispatching updated user:', updatedUser);
                    dispatch(userAction({ user: updatedUser }));
                } else {
                    // Fallback: Optimistic update with local values
                    const updatedUser = {
                        ...user,
                        name,
                        email,
                    };
                    console.log('DEBUG: Dispatching optimistic updated user:', updatedUser);
                    dispatch(userAction({ user: updatedUser }));
                }

                console.log('DEBUG: Navigating to DHABHA_BOTTOM -> DHABHA_PROFILE');
                navigation.navigate(STACKS.DHABHA_BOTTOM as any, {
                    screen: STACKS.DHABHA_PROFILE
                });
            } else {
                console.log('DEBUG: Profile update failed. Response:', response.data);
                showToast(response.data?.message || t('updateFailed', 'Failed to update profile'));
            }

        } catch (error: any) {
            console.error('Profile update error:', error);
            showToast(error?.response?.data?.message || t('serverError', 'Server error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('editProfile', 'Edit Profile')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Image - Editable */}
                    <View style={styles.imageContainer}>
                        <View style={[styles.imageWrapper, shadow]}>
                            <Image
                                source={{
                                    uri: newProfileImage
                                        ? newProfileImage.path
                                        : (user?.images
                                            ? (user.images.startsWith('http') ? user.images : `${BASE_URL}public/${user.images}`)
                                            : (profileImage
                                                ? (profileImage.startsWith('http') ? profileImage : `${BASE_URL}storage/app/public/${profileImage}`)
                                                : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'))
                                }}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                            {/* Camera Icon Overlay */}
                            <TouchableOpacity
                                style={styles.cameraButton}
                                onPress={() => setPickerVisible(true)}
                            >
                                <Ionicons name="camera" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Name Field (Editable) */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>{t('name', 'Name')}</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('enterName', 'Enter your name')}
                        />
                    </View>

                    {/* Mobile Number (Read-Only) */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>{t('mobile', 'Mobile Number')}</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={styles.readOnlyText}>{mobile}</Text>
                            <Ionicons name="lock-closed-outline" size={16} color="#999" />
                        </View>
                    </View>

                    {/* Editable Email Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>{t('email', 'Email Address')}</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder={t('enterEmail', 'Enter your email')}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Update Button */}
                    <TouchableOpacity
                        style={[styles.updateButton, { backgroundColor: colors.primary || '#2563EB' }, shadow]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.updateButtonText}>{t('update', 'Update')}</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Image Picker Modal */}
            <Modal
                visible={pickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{t('selectPhoto', 'Select Photo')}</Text>

                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => handlePickImage('camera')}
                                >
                                    <Ionicons name="camera-outline" size={24} color="#333" />
                                    <Text style={styles.modalOptionText}>{t('takePhoto', 'Take Photo')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => handlePickImage('gallery')}
                                >
                                    <Ionicons name="images-outline" size={24} color="#333" />
                                    <Text style={styles.modalOptionText}>{t('chooseFromGallery', 'Choose from Gallery')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalCancel}
                                    onPress={() => setPickerVisible(false)}
                                >
                                    <Text style={styles.modalCancelText}>{t('cancel', 'Cancel')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        padding: 3,
        elevation: 5,
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    readOnlyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E9ECEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    readOnlyText: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#CED4DA',
    },
    updateButton: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
        fontWeight: '500',
    },
    modalCancel: {
        marginTop: 15,
        paddingVertical: 15,
        alignItems: 'center',
    },
    modalCancelText: {
        color: 'red',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default DhabaProfileEdit;