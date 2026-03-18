/**
 * Driver Ki Awaz - Create Post Screen
 * Dedicated screen for creating new posts (Video, Image, Text)
 * @format
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions,
    ActivityIndicator,
    Modal,
    PermissionsAndroid,
    StatusBar,
    Animated,
    NativeEventEmitter,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import ImagePicker from 'react-native-image-crop-picker';
import VideoTrim, { showEditor } from 'react-native-video-trim';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import RNFS from 'react-native-fs';
import { createThumbnail } from 'react-native-create-thumbnail';
import { useTranslation } from 'react-i18next';

import { DriverKiAwazService, getUserId } from '../services';
import { DRIVER_KI_AWAZ_BASE } from '@truckmitr/src/utils/config';
import { useStatusBarStyle, useToast } from '@truckmitr/src/app/hooks';
import UploadManager from '../UploadManager';
import { startUpload } from '@truckmitr/redux/slices/uploadSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = SCREEN_WIDTH / 3 - 2;


type PostType = 'VIDEO' | 'TEXT' | 'IMAGE';
type CategoryType = 'DRIVER_LIFE' | 'GOVT_DEMAND' | 'ROAD_ISSUES' | 'RTO_CHALLAN' | 'WELFARE_RIGHTS';

interface RouteParams {
    defaultType?: PostType;
    initialData?: {
        id: string;
        type: PostType;
        content?: string;
        category?: CategoryType;
        media?: any;
    };
}

interface PostData {
    id: string;
    mediaType: 'video' | 'audio' | 'text' | 'image';
    caption: string;
    thumbnailUrl: string;
    mediaUrl: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    status: number; // 0 = Pending, 1 = Approved
}

interface DialogOption {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

const THEME = {
    light: {
        bg: '#F8F9FA',
        card: '#FFFFFF',
        text: '#1F2937',
        subText: '#6B7280',
        border: '#E5E7EB',
        icon: '#374151',
        tabText: '#6B7280',
        activeTab: '#2563EB',
        inputBg: '#F3F4F6',
        placeholder: '#9CA3AF',
        shadow: '#000000',
    },
    dark: {
        bg: '#000000',
        card: '#1C1C1E',
        text: '#FFFFFF',
        subText: '#9CA3AF',
        border: '#2D2D2D',
        icon: '#FFFFFF',
        tabText: '#6B7280',
        activeTab: '#FFFFFF',
        inputBg: '#2C2C2E',
        placeholder: '#9CA3AF',
        shadow: '#000000',
    }
};

const CATEGORIES = [
    { id: 'DRIVER_LIFE', label: '🚛 Driver Life', color: '#3B82F6' },
    { id: 'GOVT_DEMAND', label: '🏛️ Govt Demand', color: '#8B5CF6' },
    { id: 'ROAD_ISSUES', label: '🛣️ Road Issues', color: '#F59E0B' },
    { id: 'RTO_CHALLAN', label: '📋 RTO Issues', color: '#EF4444' },
    { id: 'WELFARE_RIGHTS', label: '⚖️ Welfare Rights', color: '#10B981' },
];

interface CreatePostProps {
    onClose?: () => void;
    defaultType?: PostType;
    initialData?: {
        id: string;
        type: PostType;
        content?: string;
        category?: CategoryType;
        media?: any;
    };
}

const CreatePostScreen: React.FC<CreatePostProps> = ({ onClose, defaultType, initialData }) => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    useStatusBarStyle('dark-content')
    const toast = useToast();

    const params = route?.params as RouteParams | undefined;
    const initData = initialData || params?.initialData;

    // Create Post State
    const [selectedType, setSelectedType] = useState<PostType | null>(
        initData?.type || defaultType || params?.defaultType || null
    );
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
        initData?.category || null
    );
    const [textContent, setTextContent] = useState(initData?.content || '');
    const [selectedMedia, setSelectedMedia] = useState<any>(null); // For video/images
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const videoRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState<number | null>(null);
    const [isPickingMedia, setIsPickingMedia] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [thumbnail, setThumbnail] = useState<any>(null);

    // Thumbnail Extraction Helper
    const generateThumbnail = async (videoPath: string) => {
        try {
            console.log('[DriverKiAwaz] Extracting thumbnail from:', videoPath);
            const thumb = await createThumbnail({
                url: videoPath,
                timeStamp: 1000, // 1 second mark
            });
            console.log('[DriverKiAwaz] Thumbnail extracted:', thumb.path);
            setThumbnail({
                uri: thumb.path,
                mime: 'image/jpeg',
                type: 'image/jpeg',
                name: `thumb_${Date.now()}.jpg`,
            });
        } catch (err) {
            console.error('[DriverKiAwaz] Thumbnail extraction failed:', err);
        }
    };

    // Video Trimming Events
    useEffect(() => {
        const listeners: any = {};

        try {
            // New Architecture Setup (TurboModule Direct Events)
            listeners.onFinishTrimming = (VideoTrim as any).onFinishTrimming((event: any) => {
                console.log('Trimming finished:', event.outputPath);
                const finalUri = Platform.OS === 'android' ? 'file://' + event.outputPath : event.outputPath;
                setSelectedMedia({
                    uri: finalUri,
                    path: event.outputPath,
                    mime: 'video/mp4',
                    type: 'video/mp4',
                });
                setSelectedType('VIDEO');
                generateThumbnail(finalUri);
            });

            listeners.onCancelTrimming = (VideoTrim as any).onCancelTrimming(() => {
                console.log('Trimming cancelled');
            });

            listeners.onError = (VideoTrim as any).onError((event: any) => {
                console.error('Trimming error:', event.message || event.errorCode);
                Alert.alert('Error', 'Failed to trim video. Please try again.');
            });
        } catch (error) {
            // Fallback for Old Architecture Setup just in case
            console.log("Falling back to Old Architecture event listener");
            const eventEmitter = new NativeEventEmitter(VideoTrim);

            listeners.videoTrim = eventEmitter.addListener('VideoTrim', (event) => {
                switch (event.name) {
                    case 'onFinishTrimming':
                        console.log('Trimming finished:', event.outputPath);
                        const finalUri = Platform.OS === 'android' ? 'file://' + event.outputPath : event.outputPath;
                        setSelectedMedia({
                            uri: finalUri,
                            path: event.outputPath,
                            mime: 'video/mp4',
                            type: 'video/mp4',
                        });
                        setSelectedType('VIDEO');
                        generateThumbnail(finalUri);
                        break;
                    case 'onCancelTrimming':
                        console.log('Trimming cancelled');
                        break;
                    case 'onError':
                    case 'onErrorTrimming':
                        console.error('Trimming error:', event.error || event.message);
                        Alert.alert('Error', 'Failed to trim video. Please try again.');
                        break;
                }
            });
        }

        return () => {
            Object.values(listeners).forEach((listener: any) => {
                if (listener && typeof listener.remove === 'function') {
                    listener.remove();
                }
            });
        };
    }, []);

    // Theme & Language State
    const [isDarkMode, setIsDarkMode] = useState(false);
    const formAnim = useRef(new Animated.Value(0)).current;
    const mediaAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedType) {
            Animated.spring(formAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        } else {
            formAnim.setValue(0);
        }
    }, [selectedType]);

    useEffect(() => {
        if (selectedMedia) {
            Animated.spring(mediaAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        }
    }, [selectedMedia]);

    // Custom Dialog State
    const [dialogState, setDialogState] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        options: DialogOption[];
    }>({ visible: false, title: '', options: [] });

    // Track submission success to skip cross-exit warning
    const isSuccessRef = useRef(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            const hasUnsavedContent = selectedMedia || textContent.trim() || selectedCategory;

            if (!hasUnsavedContent || isSuccessRef.current) {
                // If we're submitting successfully or no content, skip warning
                return;
            }

            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Prompt the user before leaving the screen
            showDialog(
                t('dka_discardTitle'),
                t('dka_discardMsg'),
                [
                    {
                        text: t('dka_discard') || 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                    { text: t('cancel') || 'Cancel', style: 'cancel' },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, selectedMedia, textContent, selectedCategory, t]);

    const showDialog = (title: string, message: string | undefined, options: DialogOption[]) => {
        setDialogState({ visible: true, title, message, options });
    };

    const hideDialog = () => {
        setDialogState(prev => ({ ...prev, visible: false }));
    };

    const theme = isDarkMode ? THEME.dark : THEME.light;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    const handleTypeChange = (type: PostType, action?: () => void) => {
        if (selectedType && selectedType !== type && (selectedMedia || (type === 'TEXT' ? false : textContent.trim()))) {
            showDialog(
                t('dka_changeType'),
                t('dka_changeTypeMsg'),
                [
                    {
                        text: t('dka_confirm'),
                        style: 'destructive',
                        onPress: () => {
                            setSelectedMedia(null);
                            setTextContent('');
                            if (action) {
                                action();
                            } else {
                                setSelectedType(type);
                            }
                        },
                    },
                    { text: t('cancel') || 'Cancel', style: 'cancel' },
                ]
            );
        } else {
            if (action) {
                action();
            } else {
                setSelectedType(type);
            }
        }
    };

    // ======= Create Post Functions =======
    const pickVideo = async () => {
        showDialog(
            t('dka_selectVideo') || 'Select Video',
            t('dka_selectSource') || 'Choose source',
            [
                {
                    text: t('camera') || 'Camera',
                    onPress: async () => {
                        setIsPickingMedia(true);
                        try {
                            const video = await ImagePicker.openCamera({
                                mediaType: 'video',
                                compressVideoPreset: 'MediumQuality',
                            });

                            setProcessingMessage(t('dka_processingVideo') || 'Processing video...');
                            setIsProcessing(true);

                            // Log video info for debugging
                            console.log('DKA: Camera Video path:', video.path);
                            const stats = await RNFS.stat(video.path);
                            console.log('DKA: Video size (bytes):', stats.size);

                            if (stats.size === 0) {
                                throw new Error('Recorded video is empty');
                            }

                            // Copy to cache for stable path
                            const cacheDir = Platform.OS === 'android' ? (RNFS.ExternalCachesDirectoryPath || RNFS.CachesDirectoryPath) : RNFS.CachesDirectoryPath;
                            const cachePath = `${cacheDir}/temp_trim_video_${Date.now()}.mp4`;
                            await RNFS.copyFile(video.path, cachePath);

                            const finalPath = Platform.OS === 'android' ? `file://${cachePath}` : cachePath;
                            console.log('DKA: Opening Trimmer with final path:', finalPath);

                            showEditor(finalPath, {
                                maxDuration: 120000,
                                type: 'video',
                                cancelButtonText: t('back') || 'Back',
                                saveButtonText: t('save') || 'Save',
                                headerText: t('dka_trimVideo') || 'Trim Video',
                                trimmerColor: '#3B82F6',
                                headerTextColor: '#000000',
                                enableSaveDialog: false,
                                enableCancelDialog: false,
                            });
                        } catch (error) {
                            console.log('Camera cancelled', error);
                        } finally {
                            setIsProcessing(false);
                            setIsPickingMedia(false);
                        }
                    }
                },
                {
                    text: t('gallery') || 'Gallery',
                    onPress: async () => {
                        setIsPickingMedia(true);
                        try {
                            const video = await ImagePicker.openPicker({
                                mediaType: 'video',
                                compressVideoPreset: 'MediumQuality',
                            });

                            setProcessingMessage(t('dka_processingVideo') || 'Preparing video...');
                            setIsProcessing(true);

                            console.log('DKA: Picker Video path:', video.path);
                            const stats = await RNFS.stat(video.path);
                            console.log('DKA: Video size (bytes):', stats.size);

                            // Copy to cache for stable path
                            const cacheDir = Platform.OS === 'android' ? (RNFS.ExternalCachesDirectoryPath || RNFS.CachesDirectoryPath) : RNFS.CachesDirectoryPath;
                            const cachePath = `${cacheDir}/temp_trim_video_${Date.now()}.mp4`;
                            await RNFS.copyFile(video.path, cachePath);

                            const finalPath = Platform.OS === 'android' ? `file://${cachePath}` : cachePath;
                            console.log('DKA: Opening Trimmer with final path:', finalPath);

                            showEditor(finalPath, {
                                maxDuration: 120000,
                                type: 'video',
                                cancelButtonText: t('back') || 'Back',
                                saveButtonText: t('save') || 'Save',
                                headerText: t('dka_trimVideo') || 'Trim Video',
                                trimmerColor: '#3B82F6',
                                headerTextColor: '#000000',
                                enableSaveDialog: false,
                                enableCancelDialog: false,
                            });
                        } catch (error) {
                            console.log('Gallery cancelled', error);
                        } finally {
                            setIsProcessing(false);
                            setIsPickingMedia(false);
                        }
                    }
                },
                { text: t('cancel') || 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleMediaCleanup = () => {
        showDialog(
            t('dka_discardTitle') || 'Discard Media?',
            t('dka_discardMsg') || 'Are you sure you want to remove this media?',
            [
                {
                    text: t('dka_discard') || 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        // Reset video player states
                        setIsPlaying(false);
                        setCurrentTime(0);
                        setTotalDuration(0);
                        setIsSeeking(false);
                        setCompressionProgress(null);

                        // Delete temporary trimmed or compressed video file if it exists
                        if (selectedMedia && selectedType === 'VIDEO') {
                            const cachePath = selectedMedia.path || selectedMedia.uri;
                            if (cachePath && (cachePath.includes('temp_trim_video_') || cachePath.includes('compressor'))) {
                                RNFS.unlink(cachePath.replace('file://', '')).catch(e => console.log('Failed to delete temp video:', e));
                            }
                        }

                        Animated.spring(mediaAnim, {
                            toValue: 0,
                            tension: 60,
                            friction: 10,
                            useNativeDriver: true,
                        }).start(() => {
                            setSelectedMedia(null);
                            setThumbnail(null);
                            setSelectedType(null);
                        });
                    },
                },
                { text: t('cancel') || 'Cancel', style: 'cancel' },
            ]
        );
    };

    const pickImage = async () => {
        showDialog(
            t('dka_selectImage') || 'Select Image',
            t('dka_selectSource') || 'Choose source',
            [
                {
                    text: t('camera') || 'Camera',
                    onPress: async () => {
                        setIsPickingMedia(true);
                        try {
                            const image = await ImagePicker.openCamera({
                                mediaType: 'photo',
                                cropping: true,
                                width: 1200,
                                height: 1500,
                            });
                            setSelectedMedia(image);
                            setSelectedType('IMAGE');
                        } catch (error) {
                            console.log('Camera cancelled', error);
                        } finally {
                            setIsPickingMedia(false);
                        }
                    }
                },
                {
                    text: t('gallery') || 'Gallery',
                    onPress: async () => {
                        setIsPickingMedia(true);
                        try {
                            const image = await ImagePicker.openPicker({
                                mediaType: 'photo',
                                cropping: true,
                                width: 1200,
                                height: 1500,
                            });
                            setSelectedMedia(image);
                            setSelectedType('IMAGE');
                        } catch (error) {
                            console.log('Gallery cancelled', error);
                        } finally {
                            setIsPickingMedia(false);
                        }
                    }
                },
                { text: t('cancel') || 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleSubmit = async () => {
        if (!selectedType) {
            toast(t('dka_postTypeReq'));
            return;
        }

        if (!selectedCategory) {
            toast(t('dka_categoryReq'));
            return;
        }

        if (selectedType === 'TEXT' && !textContent.trim()) {
            toast(t('dka_contentReq'));
            return;
        }

        // Character limit validations...
        if (selectedType === 'TEXT' && textContent.length > 2000) {
            toast(t('dka_charLimitExceeded'));
            return;
        }

        if (selectedType !== 'TEXT' && textContent.length > 2200) {
            toast(t('dka_charLimitExceeded_2200'));
            return;
        }

        if (selectedType === 'VIDEO' && !selectedMedia && !initData) {
            toast(t('dka_videoReq'));
            return;
        }

        if (selectedType === 'IMAGE' && !selectedMedia && !initData) {
            toast(t('dka_imageReq') || 'Please select an image');
            return;
        }

        try {
            if (initData?.id) {
                // EDIT POST (Fast, keep foreground for now)
                setIsSubmitting(true);
                await DriverKiAwazService.editPost(initData.id, textContent);
                Alert.alert(t('dka_success'), t('dka_updated'));
                isSuccessRef.current = true;
                handleClose();
            } else {
                // NEW POST (Background Upload)
                const userId = await getUserId();
                if (!userId) {
                    toast('Please login to share a post');
                    return;
                }

                // Gather Metadata for Background Service
                const uploadMetadata = {
                    type: selectedType,
                    category: selectedCategory,
                    caption: textContent,
                    mediaFile: selectedMedia ? {
                        uri: selectedMedia.path || selectedMedia.uri,
                        type: selectedMedia.mime || selectedMedia.type || (selectedType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
                        name: selectedMedia.filename || selectedMedia.name || `upload_${Date.now()}.${selectedType === 'VIDEO' ? 'mp4' : 'jpg'}`,
                    } : null,
                    thumbnail: thumbnail ? {
                        uri: thumbnail.uri,
                        type: thumbnail.type,
                        name: thumbnail.name,
                    } : null,
                };

                // Dispatch to Redux to show Global Progress Bar
                dispatch(startUpload({ 
                    type: selectedType, 
                    category: selectedCategory, 
                    caption: textContent 
                }));

                // Start Background Process
                UploadManager.startBackgroundUpload(uploadMetadata, userId);

                // Toast and Immediate Navigate Away
                toast(t('dka_posting') || 'Starting upload in background...');
                isSuccessRef.current = true;
                handleClose();
            }
        } catch (error: any) {
            console.error('Submit Error', error);
            Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
            setIsSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (!selectedType) return false;
        if (!selectedCategory) return false;
        if (selectedType === 'TEXT') {
            if (!textContent.trim()) return false;
        }
        if (selectedType === 'VIDEO' && !selectedMedia && !initData) return false;
        if (selectedType === 'IMAGE' && !selectedMedia && !initData) return false;
        return true;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderCreateTab = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Media Preview (Dynamic at top) */}
                {selectedMedia && (
                    <Animated.View style={{
                        opacity: mediaAnim,
                        transform: [{
                            translateY: mediaAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-20, 0]
                            })
                        }],
                        marginBottom: 24
                    }}>
                        <Text style={styles.sectionTitle}>
                            {selectedType === 'VIDEO' ? 'Video Preview' : 'Image Preview'}
                        </Text>
                        <View style={[
                            styles.mediaPreview,
                            selectedType === 'VIDEO' && styles.mediaPreviewVideo
                        ]}>
                            {selectedType === 'VIDEO' ? (
                                <View style={styles.videoPlayerContainer}>
                                    {(!isPickingMedia && isFocused) ? (
                                        <Video
                                            ref={videoRef}
                                            source={{ uri: selectedMedia.path || selectedMedia.uri }}
                                            style={styles.previewImage}
                                            resizeMode="cover"
                                            paused={!isPlaying}
                                            repeat={true}
                                            onLoad={(data) => setTotalDuration(data.duration)}
                                            onProgress={(data) => {
                                                if (!isSeeking) {
                                                    setCurrentTime(data.currentTime);
                                                }
                                            }}
                                            onEnd={() => setIsPlaying(false)}
                                        />
                                    ) : (
                                        <View style={[styles.previewImage, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]}>
                                            <ActivityIndicator color="#FFFFFF" size="large" />
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.playPauseOverlay}
                                        activeOpacity={1}
                                        onPress={() => setIsPlaying(!isPlaying)}
                                    >
                                        <View style={styles.playPauseButton}>
                                            <Ionicons
                                                name={isPlaying ? 'pause' : 'play'}
                                                size={32}
                                                color="#FFFFFF"
                                                style={{ marginLeft: isPlaying ? 0 : 4 }}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.mediaTypeOverlay}>
                                        <Ionicons name="videocam" size={20} color="#FFFFFF" />
                                        <Text style={styles.mediaTypeText}>Video</Text>
                                    </View>

                                    <View style={styles.sliderOverlay}>
                                        <View style={styles.sliderTimeContainer}>
                                            <Text style={styles.sliderTimeText}>{formatTime(currentTime)}</Text>
                                            <Text style={styles.sliderTimeText}>{formatTime(totalDuration)}</Text>
                                        </View>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0}
                                            maximumValue={totalDuration}
                                            value={currentTime}
                                            minimumTrackTintColor="#3B82F6"
                                            maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
                                            thumbTintColor="#FFFFFF"
                                            onSlidingStart={() => setIsSeeking(true)}
                                            onSlidingComplete={(value) => {
                                                videoRef.current?.seek(value);
                                                setCurrentTime(value);
                                                setIsSeeking(false);
                                            }}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <Image
                                        source={{ uri: selectedMedia.path || selectedMedia.uri }}
                                        style={styles.previewImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.mediaTypeOverlay}>
                                        <Ionicons name="image" size={20} color="#FFFFFF" />
                                        <Text style={styles.mediaTypeText}>{t('image')}</Text>
                                    </View>
                                </>
                            )}
                            <TouchableOpacity
                                style={styles.removeMedia}
                                onPress={handleMediaCleanup}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            >
                                <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {/* Post Type Selection */}
                <Text style={styles.sectionTitle}>{t('dka_postType')}</Text>
                <View style={styles.typeRow}>
                    <TouchableOpacity
                        style={[
                            styles.typeButton,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            selectedType === 'VIDEO' && styles.typeButtonActive
                        ]}
                        onPress={() => handleTypeChange('VIDEO', pickVideo)}
                    >
                        <Ionicons name="videocam" size={24} color={selectedType === 'VIDEO' ? '#3B82F6' : theme.subText} />
                        <Text style={[
                            styles.typeText,
                            { color: theme.subText },
                            selectedType === 'VIDEO' && styles.typeTextActive
                        ]}>{t('dka_video')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.typeButton,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            selectedType === 'IMAGE' && styles.typeButtonActive
                        ]}
                        onPress={() => handleTypeChange('IMAGE', pickImage)}
                    >
                        <Ionicons name="image" size={24} color={selectedType === 'IMAGE' ? '#3B82F6' : theme.subText} />
                        <Text style={[
                            styles.typeText,
                            { color: theme.subText },
                            selectedType === 'IMAGE' && styles.typeTextActive
                        ]}>{t('image')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.typeButton,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            selectedType === 'TEXT' && styles.typeButtonActive
                        ]}
                        onPress={() => handleTypeChange('TEXT')}
                    >
                        <Ionicons name="text" size={24} color={selectedType === 'TEXT' ? '#3B82F6' : theme.subText} />
                        <Text style={[
                            styles.typeText,
                            { color: theme.subText },
                            selectedType === 'TEXT' && styles.typeTextActive
                        ]}>{t('dka_text')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Dynamic Content Sections */}
                {selectedType && (
                    <Animated.View style={{
                        opacity: formAnim,
                        transform: [{
                            translateY: formAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                            })
                        }]
                    }}>
                        {/* Category Selection */}
                        <Text style={styles.sectionTitle}>{t('dka_category')}</Text>
                        <View style={styles.categoryContainer}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: theme.border, backgroundColor: theme.inputBg },
                                        selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id as CategoryType)}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        { color: theme.text },
                                        selectedCategory === cat.id && { color: '#FFFFFF' },
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Caption Input */}
                        {selectedType !== 'TEXT' && (
                            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 13 }]}>Caption</Text>
                        )}
                        <View style={[styles.captionSection, {
                            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                            backgroundColor: theme.inputBg,
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingTop: 8,
                            paddingBottom: selectedType === 'TEXT' ? 0 : 12,
                            minHeight: selectedType === 'TEXT' ? 300 : 120,
                            marginBottom: 24,
                            overflow: 'hidden'
                        }]}>
                            <TextInput
                                style={[styles.captionInput, {
                                    color: theme.text,
                                    fontSize: selectedType === 'TEXT' ? 18 : 16,
                                }]}
                                value={textContent}
                                onChangeText={setTextContent}
                                placeholder={selectedType === 'TEXT'
                                    ? "Share your experience or issue here...\nDriver ki awaz, sab tak pahochaen."
                                    : "Tell your story or voice your concern..."
                                }
                                placeholderTextColor={theme.placeholder}
                                multiline
                                textAlignVertical="top"
                            />

                            {selectedType === 'TEXT' && (
                                <View style={styles.textFooter}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        {textContent.length > 2000 && (
                                            <Text style={styles.limitError}>
                                                {t('dka_charLimitExceeded')}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.charCountBadge}>
                                        <Text style={[
                                            styles.footerText,
                                            { color: textContent.length > 2000 ? '#EF4444' : theme.subText }
                                        ]}>
                                            {textContent.length} / 2000
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Info */}
                        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>
                                {t('dka_reviewInfo')}
                            </Text>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={28} color={theme.icon} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('dka_createPost') || 'Create Post'}
                </Text>

                <View style={{ width: 28 }} />
            </View>

            {/* Content */}
            {renderCreateTab()}

            {/* Sticky Post Button */}
            {selectedType && (
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={[
                            styles.postButton,
                            (!canSubmit() || isSubmitting) && styles.postButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!canSubmit() || isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.postButtonText}>
                                {t('dka_share') || 'Post'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Custom Classic Dialog */}
            <Modal
                visible={dialogState.visible}
                transparent
                animationType="fade"
                onRequestClose={hideDialog}
            >
                <View style={styles.dialogOverlay}>
                    <View style={[styles.dialogContainer, { backgroundColor: theme.card }]}>
                        <Text style={[styles.dialogTitle, { color: theme.text }]}>
                            {dialogState.title}
                        </Text>
                        {dialogState.message ? (
                            <Text style={[styles.dialogMessage, { color: theme.subText }]}>
                                {dialogState.message}
                            </Text>
                        ) : null}
                        <View style={styles.dialogOptions}>
                            {dialogState.options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dialogButton,
                                        { borderTopColor: theme.border }
                                    ]}
                                    onPress={() => {
                                        hideDialog();
                                        option.onPress?.();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.dialogButtonText,
                                        option.style === 'destructive' && styles.dialogButtonTextDestructive,
                                        option.style === 'cancel' && styles.dialogButtonTextCancel,
                                        { color: option.style === 'destructive' ? '#EF4444' : (option.style === 'cancel' ? theme.text : '#3B82F6') }
                                    ]}>
                                        {option.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Loading Overlay (For Edit Post) */}
            <Modal visible={isSubmitting} transparent animationType="fade">
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>
                            {t('dka_posting') || 'Processing...'}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Video Processing Overlay */}
            <Modal visible={isProcessing} transparent animationType="fade">
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>
                            {processingMessage || t('dka_processingVideo') || 'Processing video...'}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2D2D2D',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    shareButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    shareButtonDisabled: {
        color: 'rgba(59, 130, 246, 0.4)',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2D2D2D',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#FFFFFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    content: {
        padding: 16,
        paddingBottom: 160,
    },
    mediaPreview: {
        width: '100%',
        aspectRatio: 4 / 5,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
        backgroundColor: '#000000',
    },
    mediaPreviewVideo: {
        width: '56%',
        aspectRatio: 9 / 16,
        alignSelf: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    mediaTypeOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    mediaTypeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    videoPlayerContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5, // ensure interaction is caught
    },
    playPauseButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    sliderOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingBottom: 16,
        paddingTop: 32,
        backgroundColor: 'rgba(0,0,0,0.4)', // Creates a dark gradient-like effect at the bottom
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    sliderTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 4,
    },
    sliderTimeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    slider: {
        width: '100%',
        height: 20,
    },
    removeMedia: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 20,
    },
    captionSection: {
        flexDirection: 'column',
    },
    textFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
    },
    charCountBadge: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    limitError: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '500',
        marginTop: 2,
    },
    captionInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    typeRow: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#1F2937',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#374151',
    },
    typeButtonActive: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    typeText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 6,
        fontWeight: '500',
    },
    typeTextActive: {
        color: '#3B82F6',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#374151',
        backgroundColor: '#1F2937',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#D1D5DB',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 14,
        borderRadius: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#93C5FD',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContent: {
        paddingBottom: 100,
    },
    gridItem: {
        width: GRID_SIZE,
        height: GRID_SIZE,
        margin: 1,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
    },
    videoOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    audioPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E3A5F',
    },
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dialogContainer: {
        width: '85%',
        borderRadius: 16,
        paddingTop: 24,
        paddingBottom: 0,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dialogTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    dialogMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
        lineHeight: 20,
    },
    dialogOptions: {
        width: '100%',
    },
    dialogButton: {
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    dialogButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dialogButtonTextCancel: {
        fontWeight: '700',
    },
    dialogButtonTextDestructive: {
        color: '#EF4444',
    },
    recordTimer: {
        fontSize: 48,
        fontWeight: '300',
        color: '#FFFFFF',
        fontVariant: ['tabular-nums'],
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingActive: {
        borderColor: '#EF4444',
    },
    recordButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EF4444',
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    postButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    postButtonDisabled: {
        backgroundColor: '#1E293B',
        shadowOpacity: 0,
        elevation: 0,
    },
    postButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    loadingText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 12,
    },
});

export default CreatePostScreen;
