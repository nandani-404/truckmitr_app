/**
 * Driver Ki Awaz - My Posts Screen
 * Instagram-like user profile with posts grid
 * @format
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    Alert,
    Dimensions,
    ActivityIndicator,
    Modal,
    TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';

import { DriverKiAwazService } from '../services';
import { DRIVER_KI_AWAZ_BASE } from '@truckmitr/src/utils/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = SCREEN_WIDTH / 3 - 2;

interface PostData {
    id: string;
    mediaType: 'video' | 'audio' | 'text';
    caption: string;
    thumbnailUrl: string;
    mediaUrl: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
}

const MyPostsScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();

    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState('My Profile');
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [lastId, setLastId] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<PostData | null>(null);
    const [editCaption, setEditCaption] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [viewingPost, setViewingPost] = useState<PostData | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadUserId();
        }, [])
    );

    const loadUserId = async () => {
        const id = await AsyncStorage.getItem('user_id');
        if (id) {
            setUserId(id);
            fetchPosts(id, true);
        }
    };

    const fetchPosts = async (uid: string, refresh = false) => {
        if (loading && !refresh) return;

        if (refresh) {
            setLoading(true);
            setRefreshing(true);
        }

        try {
            const currentCursor = refresh ? undefined : cursor;
            const currentLastId = refresh ? undefined : lastId;

            const response = await DriverKiAwazService.getUserFeed(uid, currentCursor, currentLastId);
            const feedData = Array.isArray(response.data) ? response.data : response.data?.data;

            if (Array.isArray(feedData)) {
                const mappedPosts: PostData[] = feedData.map((item: any) => {
                    const rawUrl = item.media_url || '';
                    const hasHttp = rawUrl.startsWith('http');
                    const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
                    const finalUrl = hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`;

                    return {
                        id: item.id.toString(),
                        mediaType: item.media_type || 'text',
                        caption: item.caption || '',
                        thumbnailUrl: finalUrl,
                        mediaUrl: finalUrl,
                        likesCount: item.likes_count || 0,
                        commentsCount: item.comments_count || 0,
                        createdAt: item.created_at,
                    };
                });

                if (refresh) {
                    setPosts(mappedPosts);
                } else {
                    setPosts(prev => [...prev, ...mappedPosts]);
                }

                if (mappedPosts.length > 0) {
                    const last = mappedPosts[mappedPosts.length - 1];
                    setCursor(last.createdAt);
                    setLastId(last.id);
                } else {
                    setHasMore(false);
                }
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
            Alert.alert('Success', 'Post updated successfully');
            setEditModalVisible(false);
            setEditingPost(null);
            handleRefresh();
        } catch (error) {
            console.error('Edit error:', error);
            Alert.alert('Error', 'Failed to update post');
        } finally {
            setIsEditing(false);
        }
    };

    const handleDelete = (post: PostData) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DriverKiAwazService.deletePost(post.id);
                            Alert.alert('Success', 'Post deleted');
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
        Alert.alert(
            'Post Options',
            undefined,
            [
                { text: 'Edit', onPress: () => handleEdit(post) },
                { text: 'Delete', onPress: () => handleDelete(post), style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const renderPost = ({ item }: { item: PostData }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => setViewingPost(item)}
            activeOpacity={0.8}
        >
            {item.mediaType === 'video' ? (
                <>
                    <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={styles.gridImage}
                        resizeMode="contain"
                    />
                    <View style={styles.videoOverlay}>
                        <Ionicons name="play" size={24} color="#FFFFFF" />
                    </View>
                </>
            ) : item.mediaType === 'audio' ? (
                <View style={[styles.gridImage, styles.audioPlaceholder]}>
                    <Ionicons name="mic" size={32} color="#3B82F6" />
                </View>
            ) : (
                <View style={[styles.gridImage, styles.textPlaceholder]}>
                    <Text style={styles.textPreview} numberOfLines={4}>
                        {item.caption}
                    </Text>
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
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
                <LinearGradient
                    colors={['#F59E0B', '#EF4444', '#EC4899']}
                    style={styles.avatarGradient}
                >
                    <View style={styles.avatarInner}>
                        <Image
                            source={{ uri: 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                    </View>
                </LinearGradient>
            </View>
            <View style={styles.statsContainer}>
                <View style={styles.statBlock}>
                    <Text style={styles.statNumber}>{posts.length}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statBlock}>
                    <Text style={styles.statNumber}>-</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statBlock}>
                    <Text style={styles.statNumber}>-</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{userName}</Text>
                <TouchableOpacity>
                    <Ionicons name="menu" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {loading && posts.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderPost}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
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
                            <Ionicons name="camera-outline" size={64} color="#4B5563" />
                            <Text style={styles.emptyTitle}>No Posts Yet</Text>
                            <Text style={styles.emptySubtitle}>Share your first post!</Text>
                        </View>
                    }
                />
            )}

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Post</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.editInput}
                            value={editCaption}
                            onChangeText={setEditCaption}
                            placeholder="Write a caption..."
                            placeholderTextColor="#9CA3AF"
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
                                <Text style={styles.saveButtonText}>Save Changes</Text>
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
                                    setViewingPost(null);
                                    // Small delay to allow modal to close before showing options
                                    setTimeout(() => showPostOptions(viewingPost), 300);
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
                            />
                        ) : viewingPost?.mediaType === 'audio' ? (
                            <View style={styles.audioPreviewContainer}>
                                <View style={styles.audioWaveform}>
                                    <Ionicons name="mic-circle" size={80} color="#3B82F6" />
                                </View>
                                <Text style={styles.previewCaption}>{viewingPost.caption}</Text>
                                {/* Autoplay Audio */}
                                <Video
                                    source={{ uri: viewingPost.mediaUrl }}
                                    style={{ width: 0, height: 0 }}
                                    paused={false}
                                    playInBackground={false}
                                    playWhenInactive={false}
                                    ignoreSilentSwitch="ignore"
                                />
                            </View>
                        ) : (
                            <View style={styles.textPreviewContainer}>
                                <Text style={styles.textPostContent}>{viewingPost?.caption}</Text>
                            </View>
                        )}
                    </View>

                    {/* Footer / Caption Overlay (If video) */}
                    {viewingPost?.mediaType === 'video' && (
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 100,
    },
    profileHeader: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 24,
    },
    avatarGradient: {
        width: 86,
        height: 86,
        borderRadius: 43,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statBlock: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
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
    // Preview Styles
    previewContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    previewHeader: {
        position: 'absolute',
        top: 50,
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
        textAlign: 'center',
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
        padding: 20,
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
});

export default MyPostsScreen;
