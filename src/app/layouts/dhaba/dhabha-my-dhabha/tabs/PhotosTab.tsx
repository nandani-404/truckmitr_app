import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import { useDhabhaProfile } from '../DhabhaProfileContext';
import { styles } from '../styles';
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
    const { profileData } = useDhabhaProfile();
    const colors = useColor();

    const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
        Array.from({ length: 7 }, () => ({ id: null, uri: null, isLocal: false }))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            const response: any = await axiosInstance.get(END_POINTS.DHABA_PHOTOS);
            if (response?.data?.success && response?.data?.photos) {
                const interiorPhotos = response.data.photos.Interior || [];
                const newSlots: PhotoSlot[] = Array.from({ length: 7 }, () => ({ id: null, uri: null, isLocal: false }));

                interiorPhotos.forEach((p: any, idx: number) => {
                    if (idx < 7) {
                        // Handle potential double slash in URL
                        const cleanUrl = p.image_url.startsWith('/') ? p.image_url : `/${p.image_url}`;
                        newSlots[idx] = {
                            id: p.id,
                            uri: `${BASE_URL.replace(/\/$/, '')}${cleanUrl}`,
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
            let dhabaId = profileData.dhabaId;
            if (!dhabaId) {
                dhabaId = await AsyncStorage.getItem('dhaba_id') || '';
            }
            formData.append('dhaba_id', dhabaId);
            formData.append('category', 'Interior');
            formData.append('ordering_priority', '1');
            formData.append('upload_date', moment().format('YYYY-MM-DD'));

            let photoAdded = false;
            photoSlots.forEach((slot, idx) => {
                if (slot.uri && slot.isLocal) {
                    photoAdded = true;
                    formData.append(`image_url[${idx}]`, {
                        uri: slot.uri,
                        type: 'image/jpeg',
                        name: `dhaba_photo_${idx}_${Date.now()}.jpg`,
                    } as any);

                    if (slot.id) {
                        formData.append(`id[${idx}]`, slot.id);
                    }
                }
            });

            if (!photoAdded) {
                showToast(t('noNewPhotosToSave') || 'No new photos to save');
                setSaving(false);
                return;
            }

            const response = await axiosInstance.post(END_POINTS.DHABA_PHOTO_UPLOAD, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response?.data?.status || response?.data?.success) {
                showToast(response?.data?.message || t('photosSavedSuccess'));
                fetchPhotos(); // Refresh to get IDs for new photos
            } else {
                showToast(response?.data?.message || t('failedToSavePhotos'));
            }
        } catch (error: any) {
            console.error('Photos Save Error:', error);
            showToast(t('somethingWentWrong'));
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
        // If it was existing, we might need a way to track deletion if the backend supports it.
        // For now, just clear the UI slot.
        newSlots[index] = { id: null, uri: null, isLocal: false };
        setPhotoSlots(newSlots);
    };

    const ShimmerPlaceholder = () => (
        <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <View key={i} style={{ width: '31%', aspectRatio: 1, backgroundColor: '#e0e0e0', borderRadius: 12 }} />
                ))}
            </View>
        </View>
    );

    if (loading) return <ShimmerPlaceholder />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
                <View style={{ marginBottom: 15 }}>
                    <Text style={styles.categoryTitle}>{t('interiorPhotos')}</Text>
                    <Text style={styles.categoryCount}>{t('addPhotoHelper7')}</Text>
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
                                            <Text style={localStyles.newBadgeText}>{t('newPhotoBadge')}</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={localStyles.placeholderContainer}>
                                    <Ionicons name="add-circle" size={32} color={colors.royalBlue} />
                                    <Text style={localStyles.placeholderText}>{t('stepLabel')} {index + 1}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Save Button */}
            <View style={{ marginTop: 20, marginBottom: 20 }}>
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
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('saveAllPhotos')}</Text>
                    )}
                </TouchableOpacity>
            </View>

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
                        <Text style={styles.modalTitle}>{t('uploadPhoto')} ({t('slotLabel')} {(activeSlotIndex !== null) ? activeSlotIndex + 1 : ''})</Text>

                        <TouchableOpacity style={styles.modalOption} onPress={() => handleImagePick('camera')}>
                            <View style={[styles.modalIconBg, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="camera" size={24} color={colors.royalBlue} />
                            </View>
                            <Text style={styles.modalOptionText}>{t('takePhoto')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={() => handleImagePick('gallery')}>
                            <View style={[styles.modalIconBg, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="images" size={24} color="#16A34A" />
                            </View>
                            <Text style={styles.modalOptionText}>{t('chooseFromGallery')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={localStyles.modalCancelBtn} onPress={() => setUploadModalVisible(false)}>
                            <Text style={localStyles.modalCancelText}>{t('cancel')}</Text>
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
