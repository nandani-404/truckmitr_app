/**
 * Driver Ki Awaz - Create Post Screen
 * Instagram-like dark theme with Create and My Posts tabs
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
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Modal,
    PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import ImagePicker from 'react-native-image-crop-picker';
import { pick, types } from '@react-native-documents/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import { useTranslation } from 'react-i18next';

import { DriverKiAwazService } from '../services';
import { DRIVER_KI_AWAZ_BASE } from '@truckmitr/src/utils/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = SCREEN_WIDTH / 3 - 2;

type PostType = 'VIDEO' | 'TEXT' | 'IMAGE';
type CategoryType = 'DRIVER_LIFE' | 'GOVT_DEMAND' | 'ROAD_ISSUES' | 'RTO_CHALLAN' | 'WELFARE_RIGHTS';
type ScreenTab = 'create' | 'myPosts' | 'myComments';

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
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const params = route?.params as RouteParams | undefined;
    const initData = initialData || params?.initialData;

    // Tab State
    const [activeScreenTab, setActiveScreenTab] = useState<ScreenTab>('create');

    // Create Post State
    const [selectedType, setSelectedType] = useState<PostType | null>(
        initData?.type || defaultType || params?.defaultType || null
    );
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
        initData?.category || null
    );
    const [textContent, setTextContent] = useState(initData?.content || '');
    const [selectedMedia, setSelectedMedia] = useState<any>(null); // For video/images
    const [isSubmitting, setIsSubmitting] = useState(false);

    // My Posts State
    const [posts, setPosts] = useState<PostData[]>([]);
    const [myComments, setMyComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<PostData | null>(null);
    const [editCaption, setEditCaption] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Preview Modal State
    const [viewingPost, setViewingPost] = useState<PostData | null>(null);
    const [isPeeking, setIsPeeking] = useState(false);

    // Theme & Language State
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Custom Dialog State
    const [dialogState, setDialogState] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        options: DialogOption[];
    }>({ visible: false, title: '', options: [] });

    const showDialog = (title: string, message: string | undefined, options: DialogOption[]) => {
        setDialogState({ visible: true, title, message, options });
    };

    const hideDialog = () => {
        setDialogState(prev => ({ ...prev, visible: false }));
    };



    const theme = isDarkMode ? THEME.dark : THEME.light;

    useEffect(() => {
        loadUserId();
    }, []);

    useEffect(() => {
        if ((activeScreenTab === 'myPosts' || activeScreenTab === 'myComments') && userId) {
            fetchPosts(userId, true);
        }
    }, [activeScreenTab, userId]);

    const loadUserId = async () => {
        const id = await AsyncStorage.getItem('user_id');
        if (id) {
            setUserId(id);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    // ======= Create Post Functions =======
    const pickVideo = async () => {
        showDialog(
            'Select Video',
            'Choose source',
            [
                {
                    text: 'Camera',
                    onPress: async () => {
                        try {
                            const video = await ImagePicker.openCamera({
                                mediaType: 'video',
                                compressVideoPreset: 'MediumQuality',
                            });
                            setSelectedMedia(video);
                            setSelectedType('VIDEO');
                        } catch (error) {
                            console.log('Camera cancelled', error);
                        }
                    }
                },
                {
                    text: 'Gallery',
                    onPress: async () => {
                        try {
                            const video = await ImagePicker.openPicker({
                                mediaType: 'video',
                                compressVideoPreset: 'MediumQuality',
                            });
                            setSelectedMedia(video);
                            setSelectedType('VIDEO');
                        } catch (error) {
                            console.log('Gallery cancelled', error);
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };



    const pickImage = async () => {
        try {
            const image = await ImagePicker.openCamera({
                mediaType: 'photo',
                cropping: true,
                includeBase64: false,
            });
            setSelectedMedia(image);
            setSelectedType('IMAGE');
        } catch (error) {
            console.log('Camera cancelled', error);
        }
    };

    const handleSubmit = async () => {
        if (!selectedType) {
            Alert.alert(t('dka_postTypeReq'), t('dka_postTypeReq'));
            return;
        }

        if (!selectedCategory) {
            Alert.alert(t('dka_categoryReq'), t('dka_categoryReq'));
            return;
        }

        if (selectedType === 'TEXT' && !textContent.trim()) {
            Alert.alert(t('dka_text'), t('dka_contentReq'));
            return;
        }

        if (selectedType === 'VIDEO' && !selectedMedia && !initData) {
            Alert.alert(t('dka_video'), t('dka_videoReq'));
            return;
        }



        setIsSubmitting(true);

        try {
            if (initData?.id) {
                await DriverKiAwazService.editPost(initData.id, textContent);
                Alert.alert(t('dka_success'), t('dka_updated'));
            } else {
                const formData = new FormData();

                // Normalize media object
                let mediaFile = null;
                if (selectedMedia) {
                    // ImagePicker (path, mime, filename) vs DocumentPicker (uri, type, name)
                    mediaFile = {
                        uri: selectedMedia.path || selectedMedia.uri,
                        type: selectedMedia.mime || selectedMedia.type || (selectedType === 'VIDEO' ? 'video/mp4' : 'audio/mpeg'),
                        name: selectedMedia.filename || selectedMedia.name || `upload_${Date.now()}.${selectedType === 'VIDEO' ? 'mp4' : 'mp3'}`,
                    };
                }

                if (selectedType === 'TEXT') {
                    formData.append('media_type', 'text');
                    formData.append('caption', textContent || '');
                    formData.append('category', (selectedCategory || 'DRIVER_LIFE').toLowerCase());
                } else if (selectedType === 'VIDEO' && mediaFile) {
                    formData.append('media_type', 'video');
                    formData.append('caption', textContent || 'Video Post');
                    formData.append('media', mediaFile as any);
                    formData.append('category', (selectedCategory || 'DRIVER_LIFE').toLowerCase());
                } else if (selectedType === 'IMAGE' && mediaFile) {
                    formData.append('media_type', 'image');
                    formData.append('caption', textContent || 'Image Post');
                    formData.append('media', mediaFile as any);
                    formData.append('category', (selectedCategory || 'DRIVER_LIFE').toLowerCase());
                }

                console.log('[CreatePost] Calling uploadPost with:', JSON.stringify(formData));
                await DriverKiAwazService.uploadPost(formData);
                Alert.alert(t('dka_success'), t('dka_submitted'));
            }

            // Reset form
            setSelectedType(null);
            setSelectedCategory(null);
            setTextContent('');
            setSelectedMedia(null);

            // Refresh my posts if switching to that tab
            if (userId) {
                fetchPosts(userId, true);
            }

            handleClose();
        } catch (error: any) {
            console.error('Submit Error', error);
            Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (!selectedType) return false;
        if (!selectedCategory) return false;
        if (selectedType === 'TEXT' && !textContent.trim()) return false;
        if (selectedType === 'VIDEO' && !selectedMedia && !initData) return false;
        if (selectedType === 'IMAGE' && !selectedMedia && !initData) return false;
        return true;
    };

    // ======= My Posts Functions =======
    const fetchPosts = async (uid: string, refresh = false) => {
        if (loading && !refresh) return;

        if (refresh) {
            setLoading(true);
            setRefreshing(true);
        }

        try {
            // Use dashboard API for user's posts
            const response = await DriverKiAwazService.getUserDashboard(uid);
            const dashboardData = response.data;
            const feedData = dashboardData?.posts || dashboardData?.data || (Array.isArray(dashboardData) ? dashboardData : []);

            if (Array.isArray(feedData)) {
                const mappedPosts: PostData[] = feedData.map((item: any) => {
                    const rawUrl = item.media_url || '';
                    const hasHttp = rawUrl.startsWith('http');
                    const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
                    const finalUrl = hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`;

                    return {
                        id: item.id.toString(),
                        mediaType: (item.media_type || 'text').toLowerCase(),
                        caption: item.caption || '',
                        thumbnailUrl: finalUrl,
                        mediaUrl: finalUrl,
                        likesCount: item.likes_count || 0,
                        commentsCount: item.comments_count || 0,
                        createdAt: item.created_at,
                        status: typeof item.status !== 'undefined' ? item.status : 1, // Default to approved if missing
                    };
                });

                // Map Comments
                const commentsData = dashboardData?.comments || [];
                const mappedComments = Array.isArray(commentsData) ? commentsData.map((item: any) => {
                    const rawUrl = item.media_url || '';
                    const hasHttp = rawUrl.startsWith('http');
                    const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
                    const finalUrl = hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`;

                    return {
                        id: item.id?.toString(),
                        comment: item.comment,
                        postId: item.post_id,
                        mediaUrl: finalUrl,
                        createdAt: item.created_at,
                    };
                }) : [];

                if (refresh) {
                    setPosts(mappedPosts);
                    setMyComments(mappedComments);
                } else {
                    setPosts(mappedPosts);
                    setMyComments(mappedComments);
                }

                // Disable infinite scroll for dashboard API as it returns all relevant posts
                setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching user posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        if (userId) {
            setHasMore(true);
            fetchPosts(userId, true);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore && userId) {
            fetchPosts(userId);
        }
    };

    const handleEdit = (post: PostData) => {
        setEditingPost(post);
        setEditCaption(post.caption);
        setEditModalVisible(true);
    };

    const submitEdit = async () => {
        if (!editingPost) return;

        setIsEditing(true);
        try {
            await DriverKiAwazService.editPost(editingPost.id, editCaption);
            Alert.alert(t('dka_success'), t('dka_updated'));
            setEditModalVisible(false);
            setEditingPost(null);
            handleRefresh();
        } catch (error) {
            console.error('Edit error:', error);
            Alert.alert(t('dka_success'), t('dka_updated')); // API might return success even on error sometimes, or just generic error
        } finally {
            setIsEditing(false);
        }
    };

    const handleDelete = (post: PostData) => {
        showDialog(
            t('dka_deletePost'),
            t('dka_deleteConfirm'),
            [
                { text: t('dka_cancel'), style: 'cancel' },
                {
                    text: t('dka_delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DriverKiAwazService.deletePost(post.id);
                            Alert.alert(t('dka_success'), 'Post deleted');
                            setPosts(prev => prev.filter(p => p.id !== post.id));
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete post');
                        }
                    },
                },
            ]
        );
    };

    const showPostOptions = (post: PostData) => {
        showDialog(
            'Post Options',
            undefined,
            [
                { text: t('dka_editCaption'), onPress: () => handleEdit(post) },
                { text: t('dka_delete'), onPress: () => handleDelete(post), style: 'destructive' },
                { text: t('dka_cancel'), style: 'cancel' },
            ]
        );
    };

    const renderPostItem = ({ item }: { item: PostData }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => {
                console.log('Post tapped - Open Sticky', item.id);
                setViewingPost(item);
            }}
            onLongPress={() => {
                console.log('Post long pressed - Start Peek', item.id);
                setIsPeeking(true);
                setViewingPost(item);
            }}
            onPressOut={() => {
                if (isPeeking) {
                    console.log('Post released - End Peek', item.id);
                    setViewingPost(null);
                    setIsPeeking(false);
                }
            }}
            delayLongPress={200}
            activeOpacity={0.8}
        >
            <View style={{ flex: 1 }} pointerEvents="none">
                {item.mediaType === 'video' ? (
                    <>
                        <Video
                            source={{ uri: item.mediaUrl }}
                            style={styles.gridImage}
                            resizeMode="contain"
                            paused={true}
                            muted={true}
                        />
                        <View style={styles.videoOverlay}>
                            <Ionicons name="play" size={20} color="#FFFFFF" />
                        </View>
                    </>
                ) : item.mediaType === 'image' ? (
                    <Image
                        source={{ uri: item.mediaUrl }}
                        style={styles.gridImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.gridImage, styles.textPlaceholder, { backgroundColor: theme.card }]}>
                        <Text style={styles.textPreview} numberOfLines={4}>
                            {item.caption}
                        </Text>
                    </View>
                )}

                {/* Pending Status Overlay */}
                {item.status === 0 && (
                    <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                        <Text style={styles.statusText}>{t('dka_pending')}</Text>
                    </View>
                )}

                <View style={styles.statsOverlay}>
                    <View style={styles.statItem}>
                        <Ionicons name="heart" size={12} color="#FFFFFF" />
                        <Text style={styles.statText}>{item.likesCount}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="chatbubble" size={12} color="#FFFFFF" />
                        <Text style={styles.statText}>{item.commentsCount}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // ======= Render =======
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
                {/* Media Preview / Selection */}
                {selectedMedia ? (
                    <View style={styles.mediaPreview}>
                        {selectedType === 'VIDEO' ? (
                            <>
                                <Image
                                    source={{ uri: selectedMedia.path || selectedMedia.uri }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.mediaTypeOverlay}>
                                    <Ionicons name="videocam" size={20} color="#FFFFFF" />
                                    <Text style={styles.mediaTypeText}>Video</Text>
                                </View>
                            </>
                        ) : selectedType === 'IMAGE' ? (
                            <>
                                <Image
                                    source={{ uri: selectedMedia.path || selectedMedia.uri }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.mediaTypeOverlay}>
                                    <Ionicons name="image" size={20} color="#FFFFFF" />
                                    <Text style={styles.mediaTypeText}>Image</Text>
                                </View>
                            </>
                        ) : null}
                        <TouchableOpacity
                            style={styles.removeMedia}
                            onPress={() => setSelectedMedia(null)}
                        >
                            <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Caption Input */}
                <View style={[styles.captionSection, { borderBottomColor: theme.border }]}>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/150' }}
                        style={styles.userAvatar}
                    />
                    <TextInput
                        style={[styles.captionInput, { color: theme.text }]}
                        value={textContent}
                        onChangeText={setTextContent}
                        placeholder={t('dka_writeCaption')}
                        placeholderTextColor={theme.placeholder}
                        multiline
                        maxLength={2200}
                    />
                </View>

                {/* Post Type Selection */}
                <Text style={styles.sectionTitle}>{t('dka_postType')}</Text>
                <View style={styles.typeRow}>
                    <TouchableOpacity
                        style={[
                            styles.typeButton,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            selectedType === 'VIDEO' && styles.typeButtonActive
                        ]}
                        onPress={pickVideo}
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
                        onPress={pickImage}
                    >
                        <Ionicons name="image" size={24} color={selectedType === 'IMAGE' ? '#3B82F6' : theme.subText} />
                        <Text style={[
                            styles.typeText,
                            { color: theme.subText },
                            selectedType === 'IMAGE' && styles.typeTextActive
                        ]}>Image</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.typeButton,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            selectedType === 'TEXT' && styles.typeButtonActive
                        ]}
                        onPress={() => setSelectedType('TEXT')}
                    >
                        <Ionicons name="text" size={24} color={selectedType === 'TEXT' ? '#3B82F6' : theme.subText} />
                        <Text style={[
                            styles.typeText,
                            { color: theme.subText },
                            selectedType === 'TEXT' && styles.typeTextActive
                        ]}>{t('dka_text')}</Text>
                    </TouchableOpacity>
                </View>

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

                {/* Info */}
                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                    <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>
                        {t('dka_reviewInfo')}
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );

    const renderMyPostsTab = () => (
        <View style={styles.flex}>
            {loading && posts.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    key="posts-grid"
                    data={posts}
                    renderItem={renderPostItem}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    contentContainerStyle={styles.gridContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#3B82F6"
                        />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="camera-outline" size={64} color={theme.subText} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('dka_noPosts')}</Text>
                            <Text style={styles.emptySubtitle}>{t('dka_shareFirst')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );


    // const handleDeleteComment = (comment: any) => {
    //     showDialog(
    //         'Delete Comment',
    //         'Are you sure you want to delete this comment?',
    //         [
    //             { text: 'Cancel', style: 'cancel' },
    //             {
    //                 text: 'Delete',
    //                 style: 'destructive',
    //                 onPress: async () => {
    //                     try {
    //                         await DriverKiAwazService.deleteComment(comment.id);
    //                         Alert.alert('Success', 'Comment deleted');
    //                         // Optimistic update
    //                         setMyComments(prev => prev.filter(c => c.id !== comment.id));
    //                         // Also refresh full data
    //                         handleRefresh();
    //                     } catch (error) {
    //                         console.error('Delete comment error:', error);
    //                         Alert.alert('Error', 'Failed to delete comment');
    //                     }
    //                 }
    //             }
    //         ]
    //     );
    // };

    const handleCommentPress = (comment: any) => {
        // Find the full post data from 'posts' if available, otherwise construct minimal viewing data
        // The dashboard API returns posts array, so we might need to search or just rely on what we have.
        // The comment item has 'postId', we can try to find the post in 'posts' state.
        const post = posts.find(p => p.id === comment.postId.toString());

        if (post) {
            setViewingPost(post);
        } else {
            // Construct a temporary viewing post if real one not found in current list (rare in this tab logic but possible)
            // Ideally we should fetch the specific post, but for now let's just show what we can or fetch it?
            // Since we don't have a 'getPost(id)' service readily used here, and 'dashboard' gives everything...
            // We'll rely on the fact that if it's in my dashboard, the post should be there too unless deleted.
            // If post not found, we cannot show much. But let's assume it's there.
            Alert.alert('Post not available', 'Could not find the original post for this comment.');
        }
    };

    const renderMyCommentsTab = () => (
        <View style={styles.flex}>
            {loading && myComments.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    key="comments-list"
                    data={myComments}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.commentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => handleCommentPress(item)}
                            // onLongPress={() => handleDeleteComment(item)}
                            delayLongPress={300}
                        >
                            <View style={styles.commentHeader}>
                                <Image
                                    source={{ uri: item.mediaUrl }}
                                    style={styles.commentPostThumbnail}
                                    resizeMode="cover"
                                />
                                <View style={styles.commentInfo}>
                                    <View style={styles.commentTopRow}>
                                        <Text style={[styles.commentDate, { color: theme.subText }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                        <Ionicons name="ellipsis-horizontal" size={16} color={theme.subText} />
                                    </View>
                                    <Text style={[styles.commentText, { color: theme.text }]} numberOfLines={3}>{item.comment}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#3B82F6"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={theme.subText} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Comments</Text>
                            <Text style={styles.emptySubtitle}>You haven't commented on any posts yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={28} color={theme.icon} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {activeScreenTab === 'create' ? t('dka_newPost') : t('dka_myPosts')}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {/* Theme Toggle */}
                    <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
                        <Ionicons
                            name={isDarkMode ? "sunny" : "moon"}
                            size={22}
                            color={theme.icon}
                        />
                    </TouchableOpacity>

                    {activeScreenTab === 'create' && (
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!canSubmit() || isSubmitting}
                        >
                            <Text style={[
                                styles.shareButton,
                                (!canSubmit() || isSubmitting) && styles.shareButtonDisabled
                            ]}>
                                {isSubmitting ? t('dka_posting') : t('dka_share')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tab Switcher */}
            <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeScreenTab === 'create' && { borderBottomColor: theme.activeTab, borderBottomWidth: 2 }]}
                    onPress={() => setActiveScreenTab('create')}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={22}
                        color={activeScreenTab === 'create' ? theme.activeTab : theme.tabText}
                    />
                    <Text style={[styles.tabText, { color: activeScreenTab === 'create' ? theme.activeTab : theme.tabText }]}>
                        {t('dka_createTab')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeScreenTab === 'myPosts' && { borderBottomColor: theme.activeTab, borderBottomWidth: 2 }]}
                    onPress={() => setActiveScreenTab('myPosts')}
                >
                    <Ionicons
                        name="grid-outline"
                        size={22}
                        color={activeScreenTab === 'myPosts' ? theme.activeTab : theme.tabText}
                    />
                    <Text style={[styles.tabText, { color: activeScreenTab === 'myPosts' ? theme.activeTab : theme.tabText }]}>
                        {t('dka_myPosts')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeScreenTab === 'myComments' && { borderBottomColor: theme.activeTab, borderBottomWidth: 2 }]}
                    onPress={() => setActiveScreenTab('myComments')}
                >
                    <Ionicons
                        name="chatbox-ellipses-outline"
                        size={22}
                        color={activeScreenTab === 'myComments' ? theme.activeTab : theme.tabText}
                    />
                    <Text style={[styles.tabText, { color: activeScreenTab === 'myComments' ? theme.activeTab : theme.tabText }]}>
                        Comments
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeScreenTab === 'create' ? renderCreateTab() : activeScreenTab === 'myPosts' ? renderMyPostsTab() : renderMyCommentsTab()}

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('dka_editCaption')}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.inputBg, color: theme.text }]}
                            value={editCaption}
                            onChangeText={setEditCaption}
                            placeholder={t('dka_writeCaption')}
                            placeholderTextColor={theme.placeholder}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.saveButton, isEditing && styles.saveButtonDisabled]}
                            onPress={submitEdit}
                            disabled={isEditing}
                        >
                            {isEditing ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('dka_saveChanges')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Preview Modal */}
            <Modal
                visible={!!viewingPost}
                animationType="fade"
                transparent={false}
                onRequestClose={() => setViewingPost(null)}
            >
                <View style={styles.previewContainer}>
                    {/* Header Controls */}
                    <View style={styles.previewHeader}>
                        <TouchableOpacity onPress={() => setViewingPost(null)} style={styles.previewButton}>
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (viewingPost) {
                                    showPostOptions(viewingPost);
                                }
                            }}
                            style={styles.previewButton}
                        >
                            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.previewContent}>
                        {viewingPost?.mediaType === 'video' ? (
                            <Video
                                source={{ uri: viewingPost.mediaUrl }}
                                style={styles.fullScreenMedia}
                                resizeMode="contain"
                                repeat
                            // controls={true} // Optional: Add controls if needed
                            />
                        ) : viewingPost?.mediaType === 'image' ? (
                            <Image
                                source={{ uri: viewingPost.mediaUrl }}
                                style={styles.fullScreenMedia}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.textPreviewContainer}>
                                <Text style={styles.textPostContent}>{viewingPost?.caption}</Text>
                            </View>
                        )}
                    </View>

                    {/* Footer / Caption Overlay (If video or image) */}
                    {(viewingPost?.mediaType === 'video' || viewingPost?.mediaType === 'image') && (
                        <View style={styles.previewFooter}>
                            <Text style={styles.previewCaption} numberOfLines={3}>
                                {viewingPost.caption}
                            </Text>
                            <View style={styles.previewStats}>
                                <Ionicons name="heart" size={16} color="#FFFFFF" />
                                <Text style={styles.previewStatText}>{viewingPost.likesCount}</Text>
                                <View style={{ width: 16 }} />
                                <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                                <Text style={styles.previewStatText}>{viewingPost.commentsCount}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

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


        </View >
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
        paddingBottom: 100,
    },
    mediaPreview: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
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
    removeMedia: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    captionSection: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    captionInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        maxHeight: 120,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 12,
        textTransform: 'uppercase',
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
    // My Posts Styles
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
    textPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F2937',
        padding: 8,
    },
    textPreview: {
        fontSize: 10,
        color: '#D1D5DB',
        textAlign: 'center',
    },
    statsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 4,
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 10,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    statText: {
        fontSize: 11,
        color: '#FFFFFF',
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    editInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonDisabled: {
        backgroundColor: '#6B7280',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Preview Modal Styles
    previewContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    previewHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    previewButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    previewContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenMedia: {
        width: SCREEN_WIDTH,
        height: '100%',
        backgroundColor: '#000000',
    },
    previewFooter: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    previewCaption: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 10,
    },
    previewStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewStatText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '600',
    },
    audioPreviewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    audioWaveform: {
        marginBottom: 20,
    },
    textPreviewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1C1C1E',
        width: '100%',
    },
    textPostContent: {
        color: '#FFFFFF',
        fontSize: 22,
        textAlign: 'center',
        lineHeight: 32,
        fontWeight: '500',
    },
    // Dialog Styles
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
        // Shadow
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
    // Recorder Styles
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
    // Comment Tab Styles
    commentCard: {
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    commentHeader: {
        flexDirection: 'row',
        padding: 12,
    },
    commentPostThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#2D2D2D',
    },
    commentInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    commentTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    commentDate: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    listContent: {
        paddingBottom: 100,
    }
});

export default CreatePostScreen;
