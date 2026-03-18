/**
 * Driver Ki Awaz - My Posts Screen
 * Card-based list view with Material Top Tabs for status filtering
 * @format
 */

import React, { useState, useCallback } from 'react';
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
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

import { DriverKiAwazService } from '../services';
import { DRIVER_KI_AWAZ_BASE } from '@truckmitr/src/utils/config';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { CATEGORIES, PostStatus } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const Tab = createMaterialTopTabNavigator();

// ─── Types ──────────────────────────────────────────────
interface MyPostData {
    id: string;
    mediaType: 'video' | 'image' | 'text';
    caption: string;
    thumbnailUrl: string;
    mediaUrl: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    status: PostStatus;
    rejectionReason?: string;
    category?: string;
    userName?: string;
    userAvatar?: string;
}

// ─── Helpers ────────────────────────────────────────────
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
};

const getStatusConfig = (status: PostStatus | number, t: any) => {
    if (status === 'APPROVED' || status === 1) {
        return { label: t('approved'), color: '#10B981', bgColor: '#ECFDF5' };
    }
    if (status === 'PENDING' || status === 0) {
        return { label: t('pending'), color: '#F59E0B', bgColor: '#FFFBEB' };
    }
    return { label: t('pending'), color: '#F59E0B', bgColor: '#FFFBEB' };
};

const getCategoryLabel = (categoryId?: string): string => {
    if (!categoryId) return '';
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId;
};

const formatCategoryHashtag = (categoryId?: string): string => {
    if (!categoryId) return '';
    // Convert DRIVER_LIFE → #DriverLife
    return '#' + categoryId
        .toLowerCase()
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
};

const getMediaTypeLabel = (mediaType: string, t: any): string => {
    switch (mediaType) {
        case 'video': return t('video');
        case 'image': return t('blog');
        case 'text': return t('blog');
        default: return t('post');
    }
};

// ─── Post Card Component ────────────────────────────────
const PostCard: React.FC<{
    post: MyPostData;
    onPress: (post: MyPostData) => void;
    onOptions: (post: MyPostData) => void;
}> = ({ post, onPress, onOptions }) => {
    const { t } = useTranslation();
    const statusConfig = getStatusConfig(post.status, t);
    const hashtag = formatCategoryHashtag(post.category);
    const mediaLabel = getMediaTypeLabel(post.mediaType, t);

    return (
        <View style={cardStyles.wrapper}>
            <TouchableOpacity
                style={cardStyles.card}
                activeOpacity={0.7}
                onPress={() => onPress(post)}
                onLongPress={() => onOptions(post)}
            >
                {/* Thumbnail */}
                <View style={cardStyles.thumbnailContainer}>
                    {post.mediaType === 'video' ? (
                        <>
                            <Image
                                source={{ uri: post.thumbnailUrl }}
                                style={cardStyles.thumbnail}
                                resizeMode="cover"
                            />
                            <View style={cardStyles.playOverlay}>
                                <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                            </View>
                        </>
                    ) : post.mediaType === 'image' ? (
                        <Image
                            source={{ uri: post.thumbnailUrl }}
                            style={cardStyles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[cardStyles.thumbnail, cardStyles.textThumb]}>
                            <Ionicons name="document-text" size={28} color="#94A3B8" />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={cardStyles.info}>
                    {/* Status + Date row */}
                    <View style={cardStyles.topRow}>
                        <View style={[cardStyles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Text style={[cardStyles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                        <Text style={cardStyles.dot}>•</Text>
                        <Text style={cardStyles.date}>{formatDate(post.createdAt)}</Text>
                    </View>

                    {/* Hashtag */}
                    {hashtag ? (
                        <Text style={cardStyles.hashtag}>{hashtag}</Text>
                    ) : null}

                    {/* Caption */}
                    <Text style={cardStyles.caption} numberOfLines={2}>
                        {post.caption || t('untitled_post')}
                    </Text>

                    {/* Media Type at bottom-right */}
                    <View style={cardStyles.metaRow}>
                        <View style={{ flex: 1 }} />
                        <Text style={cardStyles.mediaTypeLabel}>{mediaLabel}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const cardStyles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    card: {
        flexDirection: 'row',
        padding: 12,
    },
    thumbnailContainer: {
        width: 80,
        height: 80,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    textThumb: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
        minHeight: 80,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    dot: {
        marginHorizontal: 6,
        color: '#94A3B8',
        fontSize: 10,
    },
    date: {
        fontSize: 12,
        color: '#64748B',
    },
    caption: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 20,
        marginBottom: 4,
    },
    hashtag: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    mediaTypeLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        fontStyle: 'italic',
    },
    rejectionBox: {
        marginHorizontal: 12,
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    rejectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    rejectionText: {
        fontSize: 12,
        color: '#7F1D1D',
        fontStyle: 'italic',
        lineHeight: 18,
    },
});

// ─── Post List Component (shared across tabs) ───────────
const PostList: React.FC<{
    filterStatus: PostStatus | 'ALL';
    posts: MyPostData[];
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onPress: (post: MyPostData) => void;
    onOptions: (post: MyPostData) => void;
}> = ({ filterStatus, posts, loading, refreshing, onRefresh, onPress, onOptions }) => {
    const { t } = useTranslation();
    const filteredPosts = filterStatus === 'ALL'
        ? posts
        : posts.filter(p => p.status === filterStatus);

    if (loading && posts.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <FlatList
            data={filteredPosts}
            renderItem={({ item }) => <PostCard post={item} onPress={onPress} onOptions={onOptions} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3B82F6']}
                    tintColor="#3B82F6"
                />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={56} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>{t('no_posts')}</Text>
                    <Text style={styles.emptySubtitle}>
                        {filterStatus === 'ALL'
                            ? t('no_posts_subtitle')
                            : t('no_filtered_posts', { status: t(filterStatus.toLowerCase()) })}
                    </Text>
                </View>
            }
        />
    );
};

// ─── Main Screen ────────────────────────────────────────
const MyPostsScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { user } = useSelector((state: any) => state.user);

    const [posts, setPosts] = useState<MyPostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<MyPostData | null>(null);
    const [editCaption, setEditCaption] = useState('');
    const [isEditing, setIsEditing] = useState(false);

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
            // Try dashboard first (has status info)
            const dashRes = await DriverKiAwazService.getUserDashboard(uid);
            const dashPosts = dashRes?.data?.posts;

            if (Array.isArray(dashPosts) && dashPosts.length > 0) {
                const userData = dashRes?.data?.user;
                const mapped = mapPosts(dashPosts, userData);
                setPosts(mapped);
            } else {
                // Fallback to user feed
                const response = await DriverKiAwazService.getUserFeed(uid);
                const feedData = Array.isArray(response.data) ? response.data : response.data?.data;

                if (Array.isArray(feedData)) {
                    const mapped = mapPosts(feedData);
                    setPosts(mapped);
                }
            }
        } catch (error) {
            console.error('Error fetching user posts:', error);
            // Try fallback
            try {
                const response = await DriverKiAwazService.getUserFeed(uid);
                const feedData = Array.isArray(response.data) ? response.data : response.data?.data;
                if (Array.isArray(feedData)) {
                    const mapped = mapPosts(feedData);
                    setPosts(mapped);
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const mapPosts = (data: any[], dashboardUser?: any): MyPostData[] => {
        return data.map((item: any) => {
            const rawUrl = item.media_url || '';
            const hasHttp = rawUrl.startsWith('http');
            const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
            const finalUrl = hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`;

            let mediaType: 'video' | 'image' | 'text' = 'text';
            if (item.media_type === 'video') mediaType = 'video';
            else if (item.media_type === 'image') mediaType = 'image';

            return {
                id: item.id.toString(),
                mediaType,
                caption: item.caption || '',
                thumbnailUrl: finalUrl,
                mediaUrl: finalUrl,
                likesCount: item.likes_count || 0,
                commentsCount: item.comments_count || 0,
                createdAt: item.created_at,
                status: (item.status === 1 || item.status === 'APPROVED' ? 'APPROVED' : 'PENDING') as PostStatus,
                category: item.category || undefined,
                userName: item.user_name || item.user?.name || dashboardUser?.name || user?.name || 'Unknown',
                userAvatar: item.user_avatar || item.user?.avatar || dashboardUser?.images || undefined,
            };
        });
    };

    const handleRefresh = () => {
        if (userId) {
            fetchPosts(userId, true);
        }
    };

    const handleEdit = (post: MyPostData) => {
        setEditingPost(post);
        setEditCaption(post.caption);
        setEditModalVisible(true);
    };

    const submitEdit = async () => {
        if (!editingPost) return;

        setIsEditing(true);
        try {
            await DriverKiAwazService.editPost(editingPost.id, editCaption);
            Alert.alert(t('success'), t('post_updated'));
            setEditModalVisible(false);
            setEditingPost(null);
            handleRefresh();
        } catch (error) {
            console.error('Edit error:', error);
            Alert.alert(t('error'), t('failed_update'));
        } finally {
            setIsEditing(false);
        }
    };

    const handleDelete = (post: MyPostData) => {
        Alert.alert(
            t('delete_post'),
            t('delete_post_confirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DriverKiAwazService.deletePost(post.id);
                            Alert.alert(t('success'), t('post_deleted'));
                            setPosts(prev => prev.filter(p => p.id !== post.id));
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert(t('error'), t('failed_delete'));
                        }
                    },
                },
            ]
        );
    };

    const showPostOptions = (post: MyPostData) => {
        Alert.alert(
            t('post_options'),
            undefined,
            [
                { text: t('edit'), onPress: () => handleEdit(post) },
                { text: t('delete'), onPress: () => handleDelete(post), style: 'destructive' },
                { text: t('cancel'), style: 'cancel' },
            ]
        );
    };

    const handleCreatePost = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_CREATE_POST);
    };

    const handlePostPress = (post: MyPostData) => {
        if (post.mediaType === 'video') {
            navigation.navigate(STACKS.SINGLE_REEL_SCREEN, { post });
        } else {
            navigation.navigate(STACKS.DRIVER_KI_AWAZ_POST_DETAIL, { post });
        }
    };

    // Tab screen components
    const AllTab = () => (
        <PostList
            filterStatus="ALL"
            posts={posts}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPress={handlePostPress}
            onOptions={showPostOptions}
        />
    );

    const PendingTab = () => (
        <PostList
            filterStatus="PENDING"
            posts={posts}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPress={handlePostPress}
            onOptions={showPostOptions}
        />
    );

    const ApprovedTab = () => (
        <PostList
            filterStatus="APPROVED"
            posts={posts}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPress={handlePostPress}
            onOptions={showPostOptions}
        />
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('my_posts')}</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tabs + Content */}
            <Tab.Navigator
                screenOptions={{
                    tabBarLabelStyle: {
                        fontSize: 13,
                        fontWeight: '600',
                        textTransform: 'none',
                    },
                    tabBarIndicatorStyle: {
                        height: 3,
                        borderRadius: 3,
                        backgroundColor: '#3B82F6',
                    },
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                    },
                    tabBarActiveTintColor: '#3B82F6',
                    tabBarInactiveTintColor: '#94A3B8',
                    tabBarPressColor: 'rgba(59, 130, 246, 0.08)',
                }}
            >
                <Tab.Screen name="All" options={{ tabBarLabel: t('all') }} component={AllTab} />
                <Tab.Screen name="Pending" options={{ tabBarLabel: t('pending') }} component={PendingTab} />
                <Tab.Screen name="Approved" options={{ tabBarLabel: t('approved') }} component={ApprovedTab} />
            </Tab.Navigator>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + 20 }]}
                activeOpacity={0.85}
                onPress={handleCreatePost}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>

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
                            <Text style={styles.modalTitle}>{t('edit_post')}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.editInput}
                            value={editCaption}
                            onChangeText={setEditCaption}
                            placeholder={t('write_caption')}
                            placeholderTextColor="#94A3B8"
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
                                <Text style={styles.saveButtonText}>{t('save_changes')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Main Styles ────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerSpacer: {
        width: 36,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
    },
    // Edit Modal
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
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
        color: '#1E293B',
    },
    editInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        color: '#1E293B',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default MyPostsScreen;
