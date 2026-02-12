import React, { useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, Image, Dimensions } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useNavigation } from '@react-navigation/native';
import { useShipperProfile } from '../ShipperProfileContext';
import { RenderFileUpload } from '../components/FormComponents';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from '../styles';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import { TouchableWithoutFeedback, StyleSheet } from 'react-native';

const ProfileUploadTab = () => {
    const { profileData, setProfileData, saveProfile, loading } = useShipperProfile();
    const navigation = useNavigation();
    const [uploadLoading, setUploadLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);

    const handleImagePick = () => {
        setPickerVisible(true);
    };

    const processImagePick = async (source: 'camera' | 'gallery') => {
        try {
            let hasPermission = false;
            if (source === 'camera') {
                hasPermission = await requestCameraPermission();
            } else {
                hasPermission = await requestPhotoLibraryPermission();
            }

            if (!hasPermission) {
                setPickerVisible(false);
                return;
            }

            const options = {
                width: 400,
                height: 400,
                cropping: false,
                mediaType: 'photo' as const,
                compressImageQuality: 0.8,
            };

            const image: any = source === 'camera'
                ? await ImagePicker.openCamera(options)
                : await ImagePicker.openPicker(options);

            if (image) {
                setUploadLoading(true);
                setProfileData(prev => ({ ...prev, profileImage: image.path }));
                setUploadLoading(false);
            }
            setPickerVisible(false);
        } catch (error: any) {
            console.log('Image picker error:', error);
            setPickerVisible(false);
        }
    };

    const handleSave = async () => {
        const success = await saveProfile();
        if (success) {
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Profile Picture</Text>

                    <View style={styles.guidelineBanner}>
                        <Ionicons name="information-circle-outline" size={20} color="#1E40AF" />
                        <Text style={styles.guidelineText}>
                            Please make sure image is clear and all details is visible in photo
                        </Text>
                    </View>

                    <RenderFileUpload
                        label="Profile Photo"
                        imageUri={profileData.profileImage}
                        onUpload={handleImagePick}
                        onDelete={() => setProfileData(prev => ({ ...prev, profileImage: null }))}
                        onImagePress={() => profileData.profileImage && setPreviewImage(profileData.profileImage)}
                    />
                </View>

                {/* Save Button */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {uploadLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Full Screen Image Preview Modal */}
            <Modal
                visible={!!previewImage}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setPreviewImage(null)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.92)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <TouchableOpacity
                        onPress={() => setPreviewImage(null)}
                        style={{
                            position: 'absolute',
                            top: Platform.OS === 'ios' ? 60 : 40,
                            right: 20,
                            zIndex: 10,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>

                    {previewImage && (
                        <Image
                            source={{ uri: previewImage }}
                            style={{
                                width: Dimensions.get('window').width - 32,
                                height: Dimensions.get('window').width - 32,
                                borderRadius: 12,
                            }}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* Image Picker Modal */}
            <Modal
                visible={pickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
                    <View style={modalStyles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={modalStyles.modalContent}>
                                <Text style={modalStyles.modalTitle}>Select Photo</Text>

                                <TouchableOpacity
                                    style={modalStyles.modalOption}
                                    onPress={() => processImagePick('camera')}
                                >
                                    <Ionicons name="camera-outline" size={24} color="#333" />
                                    <Text style={modalStyles.modalOptionText}>Take Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={modalStyles.modalOption}
                                    onPress={() => processImagePick('gallery')}
                                >
                                    <Ionicons name="images-outline" size={24} color="#333" />
                                    <Text style={modalStyles.modalOptionText}>Choose from Gallery</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={modalStyles.modalCancel}
                                    onPress={() => setPickerVisible(false)}
                                >
                                    <Text style={modalStyles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const modalStyles = StyleSheet.create({
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
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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

export default ProfileUploadTab;
