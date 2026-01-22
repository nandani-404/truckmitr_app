/**
 * Driver Ki Awaz - Feed Screen
 * Clean, simple Twitter-style feed with voice and text posts
 * @format
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    Text,
    Image,
    TouchableOpacity,
    Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { STACKS } from '@truckmitr/src/stacks/stacks';

import CommentsModal from '../components/CommentsModal';
import { DriverKiAwazService } from '../services';
import { DRIVER_KI_AWAZ_BASE } from '@truckmitr/src/utils/config';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface PostData {
    id: string;
    type: 'VOICE' | 'TEXT' | 'VIDEO' | 'IMAGE';
    userName: string;
    userAvatar: string;
    userState: string;
    userId: string;
    category: string;
    categoryLabel: string;
    hashtags: string[];
    supportCount: number;
    commentCount: number;
    shareCount: number;
    isSupported: boolean;
    createdAt: string;
    content?: string;
    audioDuration?: number;
    videoUrl?: string; // Added for completeness, though Feed usually TEXT/VOICE
    audioUrl?: string;
    mediaUrl?: string;
}

const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Abhi abhi';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
};

// Post Card Component
const PostCard: React.FC<{
    post: PostData;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
}> = ({ post, onSupport, onComment, onShare }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(post.audioDuration || 0);
    const [currentTime, setCurrentTime] = useState(0);

    const formatCount = (count: number): string => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.postCard}>
            {/* Header */}
            <View style={styles.postHeader}>
                {post.userAvatar && post.userAvatar !== 'https://via.placeholder.com/150' ? (
                    <Image source={{ uri: post.userAvatar }} style={styles.postAvatar} />
                ) : (
                    <View style={[styles.postAvatar, { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={24} color="#94A3B8" />
                    </View>
                )}
                <View style={styles.postUserInfo}>
                    <View style={styles.postUserRow}>
                        <Text style={styles.postUserName}>{post.userName}</Text>
                        <Text style={styles.postTime}> · {getTimeAgo(post.createdAt)}</Text>
                    </View>
                    <Text style={styles.postUserState}>{post.userState}</Text>
                </View>
            </View>

            {/* Category Badge */}
            <View style={styles.categoryContainer}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{post.categoryLabel}</Text>
                </View>
            </View>

            {/* Content */}
            {post.type === 'VOICE' ? (
                <TouchableOpacity
                    style={styles.voicePlayer}
                    onPress={() => setIsPlaying(!isPlaying)}
                    activeOpacity={0.8}
                >
                    <View style={styles.playButton}>
                        {isPlaying ? (
                            <Ionicons name="pause" size={24} color="#FFFFFF" />
                        ) : (
                            <Ionicons name="play" size={24} color="#FFFFFF" />
                        )}
                    </View>
                    <View style={styles.waveformContainer}>
                        {/* Audio Progress Bar */}
                        <View style={{ flex: 1, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                            <View
                                style={{
                                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                    height: '100%',
                                    backgroundColor: '#3B82F6'
                                }}
                            />
                        </View>
                    </View>
                    <Text style={styles.duration}>
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                    </Text>
                    {/* Audio Player Logic */}
                    {(post.type === 'VOICE' && (post.audioUrl || post.mediaUrl)) && (
                        <Video
                            source={{ uri: post.audioUrl || post.mediaUrl }}
                            paused={!isPlaying}
                            playInBackground={false}
                            playWhenInactive={false}
                            ignoreSilentSwitch="ignore"
                            onEnd={() => {
                                setIsPlaying(false);
                                setCurrentTime(0);
                            }}
                            onLoad={(data) => setDuration(data.duration)}
                            onProgress={(data) => setCurrentTime(data.currentTime)}
                            style={{ width: 0, height: 0 }}
                        />
                    )}
                </TouchableOpacity>
            ) : post.type === 'IMAGE' ? (
                <View>
                    {post.content ? (
                        <Text style={styles.postContent}>{post.content}</Text>
                    ) : null}
                    <Image
                        source={{ uri: post.mediaUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                </View>
            ) : post.type === 'VIDEO' ? (
                <View>
                    {post.content ? (
                        <Text style={styles.postContent}>{post.content}</Text>
                    ) : null}
                    <View style={styles.videoContainer}>
                        <Video
                            source={{ uri: post.videoUrl || post.mediaUrl }}
                            style={styles.postVideo}
                            resizeMode="cover"
                            paused={true} // Start paused
                            controls={true}
                        />
                    </View>
                </View>
            ) : (
                <Text style={styles.postContent}>{post.content}</Text>
            )}

            {/* Hashtags */}
            <Text style={styles.hashtags}>
                {post.hashtags.map(tag => `#${tag}`).join(' ')}
            </Text>

            {/* Actions */}
            <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={onSupport}>
                    <Ionicons
                        name={post.isSupported ? 'heart' : 'heart-outline'}
                        size={22}
                        color={post.isSupported ? '#EF4444' : '#64748B'}
                    />
                    <Text style={[styles.actionCount, post.isSupported && styles.supportedCount]}>
                        {formatCount(post.supportCount)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
                    <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
                    <Text style={styles.actionCount}>{formatCount(post.commentCount)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
                    <Ionicons name="share-outline" size={22} color="#64748B" />
                    <Text style={styles.actionCount}>{formatCount(post.shareCount)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="bookmark-outline" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const FeedScreen: React.FC<{ userId?: string }> = ({ userId }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [posts, setPosts] = useState<PostData[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [lastId, setLastId] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(false);
    const [activePostId, setActivePostId] = useState<string | null>(null);

    useEffect(() => {
        const getUserId = async () => {
            const id = await AsyncStorage.getItem('user_id');
            setCurrentUserId(id);
        };
        getUserId();
        fetchFeed(true);
    }, [userId]); // Re-fetch if userId changes

    const fetchFeed = async (refresh = false) => {
        if (loading || (!hasMore && !refresh)) return;

        setLoading(true);
        if (refresh) setRefreshing(true);

        try {
            const currentCursor = refresh ? undefined : cursor;
            const currentLastId = refresh ? undefined : lastId;

            const response = userId
                ? await DriverKiAwazService.getUserFeed(userId, currentCursor, currentLastId)
                : await DriverKiAwazService.getFeed(currentCursor, currentLastId);

            if (response.data) {
                // Check if response has valid data structure
                const feedData = response.data.data || (Array.isArray(response.data) ? response.data : []);

                if (feedData.length > 0) {
                    const newPosts: PostData[] = feedData
                        .map((item: any) => {
                            // Media URL Logic
                            const rawUrl = item.media_url || '';
                            const hasHttp = rawUrl.startsWith('http');
                            const cleanPath = rawUrl && rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;

                            // Avatar Logic
                            const rawAvatar = item.user_avatar || item.user?.avatar || '';
                            const hasAvatarHttp = rawAvatar.startsWith('http');
                            const cleanAvatarPath = rawAvatar && rawAvatar.startsWith('/') ? rawAvatar.substring(1) : rawAvatar;
                            const finalAvatarUrl = !rawAvatar
                                ? 'https://via.placeholder.com/150'
                                : (hasAvatarHttp ? rawAvatar : `https://devtruckmitr.in/public/${cleanAvatarPath}`);

                            let postType: 'VOICE' | 'TEXT' | 'VIDEO' | 'IMAGE' = 'TEXT';
                            if (item.media_type === 'audio') postType = 'VOICE';
                            else if (item.media_type === 'image') postType = 'IMAGE';
                            else if (item.media_type === 'video') postType = 'VIDEO';

                            return {
                                id: item.id.toString(),
                                type: postType,
                                userName: item.user_name || item.user?.name || 'Unknown',
                                userAvatar: finalAvatarUrl,
                                userState: item.user?.state || '',
                                userId: item.user?.id?.toString() || item.user_id?.toString(),
                                category: item.category || 'GENERAL',
                                categoryLabel: item.category ? `#${item.category}` : 'General',
                                hashtags: [],
                                supportCount: item.likes_count || 0,
                                commentCount: item.comments_count || 0,
                                shareCount: item.shares_count || 0,
                                isSupported: item.is_liked === 1,
                                createdAt: item.created_at,
                                content: item.caption,
                                audioDuration: item.duration || 0,
                                audioUrl: hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`,
                                mediaUrl: hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`,
                                videoUrl: hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`,
                            };
                        });

                    if (refresh) {
                        setPosts(newPosts);
                    } else {
                        setPosts(prev => [...prev, ...newPosts]);
                    }

                    // Use API provided pagination info if available
                    if (response.data.nextCursor) {
                        setCursor(response.data.nextCursor);
                        setLastId(response.data.nextId?.toString());
                        setHasMore(response.data.hasMore !== false); // Default to true if missing, unless explicitly false
                    } else {
                        // Fallback for older API structure
                        if (newPosts.length > 0) {
                            const lastItem = newPosts[newPosts.length - 1];
                            setCursor(lastItem.createdAt);
                            setLastId(lastItem.id);
                        } else {
                            setHasMore(false);
                        }
                    }
                } else {
                    if (refresh) {
                        setPosts([]);
                    }
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            await DriverKiAwazService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            Alert.alert('Deleted', 'Post deleted successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
        }
    };

    const onRefresh = () => {
        setHasMore(true);
        fetchFeed(true);
    };

    const toggleSupport = async (postId: string) => {
        setPosts(prev =>
            prev.map(post =>
                post.id === postId
                    ? {
                        ...post,
                        isSupported: !post.isSupported,
                        supportCount: post.isSupported
                            ? post.supportCount - 1
                            : post.supportCount + 1,
                    }
                    : post
            )
        );
        try {
            await DriverKiAwazService.likePost(postId);
        } catch (e) {
            console.error(e);
        }
    };

    const openComments = (postId: string) => {
        setActivePostId(postId);
        setShowComments(true);
    };

    const sharePost = async (post: PostData) => {
        try {
            await Share.share({
                message: `${post.userName} on Driver Ki Awaz:\n\n${post.content || 'Voice message'}\n\n#DriverKiAwaz`,
            });
            await DriverKiAwazService.sharePost(post.id);
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, shareCount: p.shareCount + 1 } : p));
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const navigateToCreatePost = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_CREATE_POST as any, { defaultType: 'TEXT' });
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onSupport={() => toggleSupport(item.id)}
                        onComment={() => openComments(item.id)}
                        onShare={() => sharePost(item)}
                    />
                )}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                    />
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>Koi post nahi hai</Text>
                        <Text style={styles.emptySubtitle}>Pehle post karne wale banein!</Text>
                    </View>
                }
            />
            <CommentsModal
                visible={showComments}
                postId={activePostId}
                onClose={() => setShowComments(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 100,
    },
    separator: {
        height: 8,
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    postAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    postUserInfo: {
        flex: 1,
        marginLeft: 12,
    },
    postUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postUserName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    postTime: {
        fontSize: 14,
        color: '#94A3B8',
    },
    postUserState: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 1,
    },
    moreButton: {
        padding: 8,
    },
    categoryContainer: {
        marginBottom: 10,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
    },
    voicePlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    waveformContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        gap: 2,
    },
    waveBar: {
        width: 3,
        borderRadius: 2,
    },
    duration: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginLeft: 12,
    },
    postContent: {
        fontSize: 15,
        color: '#1E293B',
        lineHeight: 22,
        marginBottom: 10,
    },
    hashtags: {
        fontSize: 14,
        color: '#3B82F6',
        marginBottom: 12,
    },
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    actionCount: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '500',
    },
    supportedCount: {
        color: '#EF4444',
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
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    createButton: {
        position: 'absolute',
        right: 16,
    },
    createButtonGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    postImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginTop: 8,
        backgroundColor: '#E2E8F0',
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    postVideo: {
        width: '100%',
        height: '100%',
    },
});

export default FeedScreen;
