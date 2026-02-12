import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Dimensions, StatusBar } from 'react-native';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import ImagePicker from 'react-native-image-crop-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useShipperProfile } from '../ShipperProfileContext';
import { RenderInputField, RenderDropdown, RenderSwitch, RenderFileUpload } from '../components/FormComponents';
import { styles } from '../styles';
import { useColor } from '@truckmitr/src/app/hooks';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import { TouchableWithoutFeedback, StyleSheet } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const registrationTypes = [
    { label: 'Proprietorship', value: 'Proprietorship' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'Private Limited', value: 'Private Limited' },
    { label: 'LLP', value: 'LLP' },
    { label: 'Public Limited', value: 'Public Limited' },
    { label: 'One Person Company', value: 'One Person Company' },
    { label: 'Section 8 Company', value: 'Section 8 Company' },
    { label: 'Other', value: 'Other' },
];

const KycDetailsTab = () => {
    const { profileData, setProfileData, saveProfile, loading } = useShipperProfile();
    const colors = useColor();
    const navigation = useNavigation();
    const [uploadLoading, setUploadLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [currentField, setCurrentField] = useState<'panImage' | 'gstImage' | null>(null);

    // GST Verification State
    const [gstVerifying, setGstVerifying] = useState(false);
    const [gstVerified, setGstVerified] = useState(false);
    const [gstVerifyError, setGstVerifyError] = useState<string | null>(null);

    const handleImagePick = (field: 'panImage' | 'gstImage') => {
        if (profileData.kycVerified === '1' && profileData[field]) {
            Alert.alert('KYC Verified', 'You cannot update KYC documents once verified.');
            return;
        }
        setCurrentField(field);
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
                width: 800,
                height: 800,
                cropping: false,
                mediaType: 'photo' as const,
                compressImageQuality: 0.8,
            };

            const image: any = source === 'camera'
                ? await ImagePicker.openCamera(options)
                : await ImagePicker.openPicker(options);

            if (image && currentField) {
                setUploadLoading(true);
                setProfileData(prev => ({ ...prev, [currentField]: image.path }));
                setUploadLoading(false);
            }
            setPickerVisible(false);
        } catch (error: any) {
            console.log('Image picker error:', error);
            setPickerVisible(false);
        }
    };

    const verifyGst = async (gstin: string) => {
        if (gstin.length !== 15) return;
        setGstVerifying(true);
        setGstVerified(false);
        setGstVerifyError(null);
        try {
            const response = await axiosInstance.post(END_POINTS.SHIPPER_VERIFY_GST, { gstin });
            const data = response?.data;
            if (data?.status === 'success') {
                const name = data?.company_name || data?.c_name || data?.full_result?.legal_name || '';

                let address = data?.address ||
                    data?.registered_address ||
                    data?.full_result?.primary_business_address?.registered_address ||
                    data?.full_result?.address ||
                    data?.full_result?.registered_address ||
                    '';

                // Fallback for second-time verified structure by joining parts
                if (!address) {
                    const details = data?.detail || data?.full_result;
                    if (details) {
                        const parts = [
                            details.building_number,
                            details.building_name,
                            details.street_name,
                            details.locality,
                            details.city,
                            details.state,
                            details.postal_code,
                            details.country
                        ].filter(val => val && val !== 'null' && val !== 'NA');
                        if (parts.length > 0) {
                            address = parts.join(', ');
                        }
                    }
                }
                setProfileData(prev => ({
                    ...prev,
                    companyNameFromGst: name,
                    addressFromGst: address,
                    gstNumber: gstin
                }));
                setGstVerified(true);
                showToast('GST Verified Successfully');
            } else {
                const errorMsg = data?.message || 'GST verification failed';
                setGstVerifyError(errorMsg);
                showToast(errorMsg);
            }
        } catch (error: any) {
            console.error('GST verify error:', error);
            const errorMsg = error?.response?.data?.message || 'Unable to verify GST. Please try again.';
            setGstVerifyError(errorMsg);
            showToast(errorMsg);
        } finally {
            setGstVerifying(false);
        }
    };

    const handleSave = async () => {
        const success = await saveProfile(true);
        if (success) {
            navigation.goBack();
        }
    };

    const renderApprovalLayout = () => (
        <View style={styles.approvalCard}>
            <View style={styles.approvalIconBg}>
                <Ionicons name="shield-checkmark" size={44} color="#10B981" />
            </View>

            <Text style={styles.approvalTitle}>Documents Under Review</Text>

            <Text style={styles.approvalDescription}>
                Your KYC documents have been successfully submitted and are currently being reviewed by our professional compliance team. This standard procedure ensures a safe and secure environment for all TruckMitr users.
            </Text>

            <View style={styles.approvalTimelineBox}>
                <Ionicons name="time-outline" size={20} color="#374151" />
                <Text style={styles.approvalTimelineText}>Expected completion: 24-48 business hours</Text>
            </View>

            <TouchableOpacity
                style={styles.completeFasterBtn}
                activeOpacity={0.8}
                onPress={() => (navigation as any).navigate('ShipperProfileEdit', { screen: 'Business Detail' })}
            >
                <Text style={styles.completeFasterBtnText}>Complete your details to get verified faster</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {profileData.shipperKycStatus === '0' ? (
                    renderApprovalLayout()
                ) : (
                    <>
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Registration Details</Text>

                            <RenderDropdown
                                label="Company Registration Type"
                                value={profileData.companyRegistrationType}
                                data={registrationTypes}
                                onChange={(item) => setProfileData(prev => ({ ...prev, companyRegistrationType: item.value }))}
                                disable={profileData.kycVerified === '1'}
                            />

                            <RenderInputField
                                label="PAN Number"
                                value={profileData.panNumber}
                                editable={false}
                                onChange={(text) => setProfileData(prev => ({ ...prev, panNumber: text }))}
                                placeholder="Enter PAN Number"
                            />



                            {!profileData.panImage && (
                                <View style={styles.guidelineBanner}>
                                    <Ionicons name="information-circle-outline" size={20} color="#1E40AF" />
                                    <Text style={styles.guidelineText}>
                                        Please make sure image is clear and all details is visible in photo
                                    </Text>
                                </View>
                            )}

                            <RenderFileUpload
                                label="PAN Upload"
                                imageUri={profileData.panImage || undefined}
                                onUpload={() => handleImagePick('panImage')}
                                onDelete={profileData.kycVerified !== '1' ? () => setProfileData(prev => ({ ...prev, panImage: null })) : undefined}
                                onImagePress={() => profileData.panImage && setPreviewImage(profileData.panImage)}
                            />
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>GST Details</Text>

                            <RenderSwitch
                                label="GST Applicable"
                                value={profileData.gstApplicable}
                                onValueChange={(val) => setProfileData(prev => ({ ...prev, gstApplicable: val }))}
                                color={colors.royalBlue}
                                disabled={profileData.kycVerified === '1'}
                            />

                            {profileData.gstApplicable && (
                                <View style={{ marginTop: 16 }}>
                                    <RenderInputField
                                        label="GST Number"
                                        value={profileData.gstNumber}
                                        onChange={(text) => {
                                            const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                            setProfileData(prev => ({ ...prev, gstNumber: cleaned }));
                                            if (gstVerified) {
                                                setGstVerified(false);
                                                setGstVerifyError(null);
                                            }
                                            if (cleaned.length === 15) {
                                                verifyGst(cleaned);
                                            }
                                        }}
                                        placeholder="Enter 15-digit GST Number"
                                        editable={profileData.kycVerified !== '1'}
                                        maxLength={15}
                                        loading={gstVerifying}
                                        success={gstVerified}
                                        error={gstVerifyError}
                                    />

                                    <RenderInputField
                                        label="Company Name from GST"
                                        value={profileData.companyNameFromGst}
                                        onChange={(text) => setProfileData(prev => ({ ...prev, companyNameFromGst: text }))}
                                        placeholder="Enter Company Name"
                                        editable={false}
                                        multiline={true}
                                    />
                                    <RenderInputField
                                        label="Address from GST"
                                        value={profileData?.addressFromGst}
                                        onChange={(text) => setProfileData(prev => ({ ...prev, addressFromGst: text }))}
                                        placeholder="Enter Address"
                                        editable={false}
                                        multiline={true}
                                    />
                                    {!profileData.gstImage && (
                                        <View style={styles.guidelineBanner}>
                                            <Ionicons name="information-circle-outline" size={20} color="#1E40AF" />
                                            <Text style={styles.guidelineText}>
                                                Please make sure image is clear and all details is visible in photo
                                            </Text>
                                        </View>
                                    )}

                                    <RenderFileUpload
                                        label="GST Upload"
                                        imageUri={profileData.gstImage || undefined}
                                        onUpload={() => handleImagePick('gstImage')}
                                        onDelete={profileData.kycVerified !== '1' ? () => setProfileData(prev => ({ ...prev, gstImage: null })) : undefined}
                                        onImagePress={() => profileData.gstImage && setPreviewImage(profileData.gstImage)}
                                    />
                                </View>
                            )}
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
                    </>
                )}

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
                    {/* Close Button */}
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

                    {/* Full Width Image */}
                    {previewImage && (
                        <Image
                            source={{ uri: previewImage || undefined }}
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
        </KeyboardAvoidingView >
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

export default KycDetailsTab;
