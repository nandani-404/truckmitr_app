import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { styles } from './styles';
import { useColor } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PhotoSlot {
    id: any;
    uri: string | null;
    isLocal: boolean;
}

const PhotosTab = () => {
    const { t } = useTranslation();
    const { user } = useSelector((state: any) => state?.user);
    const colors = useColor();

    const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
        Array.from({ length: 7 }, () => ({ id: null, uri: null, isLocal: false }))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
    const [instructionModalVisible, setInstructionModalVisible] = useState(false);
    const [punctureId, setPunctureId] = useState<string>('');

    useEffect(() => {
        fetchPunctureId();
        fetchPhotos();
    }, []);

    const fetchPunctureId = async () => {
        try {
            if (user?.puncture_id) {
                setPunctureId(user.puncture_id);
            } else {
                const storedPunctureId = await AsyncStorage.getItem('puncture_id');
                if (storedPunctureId) {
                    setPunctureId(storedPunctureId);
                }
            }
        } catch (error) {
            console.error('Error fetching puncture_id:', error);
        }
    };

    const fetchPhotos = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS.GET_PUNCTURE_PHOTOS);
            console.log("Puncture photos response:", response?.data);

            if (response?.data?.success && response?.data?.photos) {
                // Use photos.puncture array from the API response
                const puncturePhotos = response.data.photos.puncture || [];
                const newSlots: PhotoSlot[] = Array.from({ length: 7 }, () => ({ id: null, uri: null, isLocal: false }));

                puncturePhotos.forEach((p: any, idx: number) => {
                    if (idx < 7 && p.image_url) {
                        // Handle potential double slash in URL
                        const cleanUrl = p.image_url.startsWith('/') ? p.image_url : `/${p.image_url}`;
                        // Add storage path if not present
                        const finalPath = cleanUrl.includes('storage') ? cleanUrl : `/storage/app/public${cleanUrl}`;

                        newSlots[idx] = {
                            id: p.id,
                            uri: `${BASE_URL.replace(/\/$/, '')}${finalPath}`,
                            isLocal: false
                        };
                    }
                });
                setPhotoSlots(newSlots);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();

            // Get puncture_id with fallback
            const pId = punctureId || user?.puncture_id || '';
            if (!pId) {
                const storedId = await AsyncStorage.getItem('puncture_id');
                formData.append('puncture_id', storedId || '');
            } else {
                formData.append('puncture_id', pId);
            }

            formData.append('category', 'puncture');
            formData.append('ordering_priority', '1');
            formData.append('upload_date', moment().format('YYYY-MM-DD'));

            console.log('Current Photo Slots:', JSON.stringify(photoSlots.map(s => ({ idx: photoSlots.indexOf(s), id: s.id, isLocal: s.isLocal })), null, 2));

            let photoAdded = false;
            photoSlots.forEach((slot, idx) => {
                if (slot.uri && slot.isLocal) {
                    photoAdded = true;
                    formData.append(`image_url[${idx}]`, {
                        uri: slot.uri,
                        type: 'image/jpeg',
                        name: `puncture_photo_${idx}_${Date.now()}.jpg`,
                    } as any);

                    if (slot.id) {
                        formData.append(`photo_ids[${idx}]`, String(slot.id));
                    }
                }
            });

            if (!photoAdded) {
                showToast(t('noNewPhotosToSave') || 'No new photos to save');
                setSaving(false);
                return;
            }

            console.log('formData', formData);
            const response = await axiosInstance.post(END_POINTS.PUNCTURE_PHOTO_UPLOAD, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response?.data?.status || response?.data?.success) {
                showToast(response?.data?.message || t('photos_saved_successfully') || 'Photos saved successfully');
                fetchPhotos(); // Refresh to get IDs for new photos
            } else {
                showToast(response?.data?.message || t('something_went_wrong'));
            }
        } catch (error: any) {
            console.error('Photos Save Error:', error);
            showToast(error?.response?.data?.message || error?.message || t('something_went_wrong'));
        } finally {
            setSaving(false);
        }
    };

    const handleOpenUploadModal = (index: number) => {
        setActiveSlotIndex(index);
        setUploadModalVisible(true);
    };

    const handleImagePick = async (type: 'camera' | 'gallery') => {
        setUploadModalVisible(false);
        if (activeSlotIndex === null) return;

        try {
            const options = {
                width: 1000,
                height: 1000,
                cropping: false,
                mediaType: 'photo' as const,
                compressImageQuality: 0.8,
            };

            const result = type === 'camera'
                ? await ImagePicker.openCamera(options)
                : await ImagePicker.openPicker(options);

            if (result) {
                const newSlots = [...photoSlots];
                newSlots[activeSlotIndex] = {
                    ...newSlots[activeSlotIndex],
                    uri: result.path,
                    isLocal: true
                };
                setPhotoSlots(newSlots);
            }
        } catch (error: any) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
                console.log('Image picker error:', error);
            }
        } finally {
            setActiveSlotIndex(null);
        }
    };

    const removePhoto = (index: number) => {
        const newSlots = [...photoSlots];
        // Preserve the ID so that if the user adds a new photo here, it replaces the old one
        newSlots[index] = {
            ...newSlots[index],
            uri: null,
            isLocal: false
        };
        setPhotoSlots(newSlots);
    };

    const ShimmerPlaceholder = () => (
        <View style={styles.stepContainer}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <View key={i} style={{ width: '31%', aspectRatio: 1, backgroundColor: '#e0e0e0', borderRadius: 12 }} />
                ))}
            </View>
        </View>
    );

    if (loading) return <ShimmerPlaceholder />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.stepContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <View>
                        <Text style={styles.classicLabel}>{t('interiorPhotos') || 'Shop Photos'}</Text>
                        <Text style={styles.helperText}>{t('addPhotoHelper7') || 'Add up to 7 photos of your shop'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setInstructionModalVisible(true)}>
                        <Ionicons name="information-circle-outline" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {photoSlots.map((slot, index) => (
                        <TouchableOpacity
                            key={index}
                            style={localStyles.photoSlot}
                            onPress={() => handleOpenUploadModal(index)}
                            activeOpacity={0.7}
                        >
                            {slot.uri ? (
                                <View style={{ width: '100%', height: '100%' }}>
                                    <FastImage
                                        source={{ uri: slot.uri }}
                                        style={localStyles.image}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <TouchableOpacity
                                        style={localStyles.removeBtn}
                                        onPress={() => removePhoto(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#EF4444" style={{ backgroundColor: '#fff', borderRadius: 12 }} />
                                    </TouchableOpacity>
                                    {slot.isLocal && (
                                        <View style={localStyles.newBadge}>
                                            <Text style={localStyles.newBadgeText}>{t('newPhotoBadge') || 'NEW'}</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={localStyles.placeholderContainer}>
                                    <Ionicons name="add-circle" size={32} color={colors.royalBlue} />
                                    <Text style={localStyles.placeholderText}>{t('stepLabel') || 'Slot'} {index + 1}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Save Button */}
                <View style={{ marginTop: 20 }}>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={[styles.saveButton, saving && { opacity: 0.7 }]}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>{t('puncture_save_photos') || 'Save Photos'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Instruction Modal */}
            <Modal visible={instructionModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
                        <View style={{ backgroundColor: '#F8F9FA', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' }}>
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0EAFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <Ionicons name="camera" size={32} color="#246BFD" />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>{t('puncture_photo_requirements') || 'Photo Requirements'}</Text>
                            <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>{t('puncture_photo_guidelines_sub') || 'Follow these guidelines for best results'}</Text>
                        </View>

                        <View style={{ padding: 25, width: '100%' }}>
                            {[
                                t('puncture_photo_shop_front') || 'Shop front view',
                                t('puncture_photo_service_area') || 'Service area',
                                t('puncture_photo_tools') || 'Tools and equipment',
                                t('puncture_photo_team') || 'Team/Staff',
                                t('puncture_photo_mobile_van') || 'Mobile service van (if applicable)'
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ marginRight: 12 }} />
                                    <Text style={{ fontSize: 15, color: '#333', fontWeight: '500' }}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ padding: 20, width: '100%', borderTopWidth: 1, borderTopColor: '#eee' }}>
                            <TouchableOpacity
                                style={[styles.saveButton, { marginTop: 0, width: '100%' }]}
                                onPress={() => setInstructionModalVisible(false)}
                            >
                                <Text style={styles.saveButtonText}>{t('puncture_got_it_upload') || 'Got it!'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Upload Modal */}
            <Modal
                visible={uploadModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setUploadModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setUploadModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>{t('uploadPhoto') || 'Upload Photo'} ({t('slotLabel') || 'Slot'} {(activeSlotIndex !== null) ? activeSlotIndex + 1 : ''})</Text>

                        <TouchableOpacity style={styles.photoSourceBtn} onPress={() => handleImagePick('camera')}>
                            <View style={[styles.photoSourceIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="camera" size={24} color={colors.royalBlue} />
                            </View>
                            <Text style={styles.photoSourceText}>{t('takePhoto') || 'Take Photo'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.photoSourceBtn} onPress={() => handleImagePick('gallery')}>
                            <View style={[styles.photoSourceIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="images" size={24} color="#16A34A" />
                            </View>
                            <Text style={styles.photoSourceText}>{t('chooseFromGallery') || 'Choose from Gallery'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={localStyles.modalCancelBtn} onPress={() => setUploadModalVisible(false)}>
                            <Text style={localStyles.modalCancelText}>{t('cancel') || 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
};

const localStyles = StyleSheet.create({
    photoSlot: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 10,
    },
    newBadge: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    modalCancelBtn: {
        marginTop: 15,
        paddingVertical: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        width: '100%'
    },
    modalCancelText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
    }
});

export default PhotosTab;
