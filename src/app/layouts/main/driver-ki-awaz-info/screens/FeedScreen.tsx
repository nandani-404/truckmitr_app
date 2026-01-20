/**
 * Driver Ki Awaz - Feed Screen
 * Clean, simple Twitter-style feed with voice and text posts
 * @format
 */

import React, { useState, useCallback } from 'react';
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

interface PostData {
    id: string;
    type: 'VOICE' | 'TEXT';
    userName: string;
    userAvatar: string;
    userState: string;
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
}

// Helper function for time ago
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

// Mock data
const MOCK_POSTS: PostData[] = [
    {
        id: '1',
        type: 'VOICE',
        userName: 'Anil Sharma',
        userAvatar: 'https://randomuser.me/api/portraits/men/11.jpg',
        userState: 'Punjab',
        category: 'GOVT_DEMAND',
        categoryLabel: '🏛️ Govt Demand',
        hashtags: ['GovtDemand', 'DriverRights'],
        supportCount: 567,
        commentCount: 45,
        shareCount: 23,
        isSupported: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        audioDuration: 45,
    },
    {
        id: '2',
        type: 'TEXT',
        userName: 'Vijay Kumar',
        userAvatar: 'https://randomuser.me/api/portraits/men/12.jpg',
        userState: 'Haryana',
        category: 'ROAD_ISSUES',
        categoryLabel: '🛣️ Road Issues',
        hashtags: ['RoadIssue', 'Highway'],
        supportCount: 234,
        commentCount: 18,
        shareCount: 12,
        isSupported: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        content: 'NH44 pe Panipat ke paas bohot bada pothole hai. Raat ko koi bhi dekh nahi sakta. Bahut dangerous hai! 🚛',
    },
    {
        id: '3',
        type: 'VOICE',
        userName: 'Dinesh Gupta',
        userAvatar: 'https://randomuser.me/api/portraits/men/13.jpg',
        userState: 'Gujarat',
        category: 'RTO_CHALLAN',
        categoryLabel: '📋 RTO Issues',
        hashtags: ['RTO', 'Challan'],
        supportCount: 891,
        commentCount: 67,
        shareCount: 34,
        isSupported: false,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        audioDuration: 62,
    },
    {
        id: '4',
        type: 'TEXT',
        userName: 'Prakash Singh',
        userAvatar: 'https://randomuser.me/api/portraits/men/14.jpg',
        userState: 'Madhya Pradesh',
        category: 'WELFARE_RIGHTS',
        categoryLabel: '⚖️ Welfare Rights',
        hashtags: ['DriverWelfare', 'Health'],
        supportCount: 445,
        commentCount: 32,
        shareCount: 19,
        isSupported: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        content: 'Sabhi driver bhaiyoon ko request hai ki apna health check-up zaroor karwayein. Long hours driving se back pain aur diabetes ka khayal rakhna zaroori hai! 💪',
    },
    {
        id: '5',
        type: 'TEXT',
        userName: 'Rajendra Yadav',
        userAvatar: 'https://randomuser.me/api/portraits/men/15.jpg',
        userState: 'Bihar',
        category: 'DRIVER_LIFE',
        categoryLabel: '🚛 Driver Life',
        hashtags: ['DriverLife', 'Family'],
        supportCount: 1234,
        commentCount: 89,
        shareCount: 56,
        isSupported: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        content: '15 din baad ghar ja raha hoon. Bachche intezaar kar rahe hain. Yahi hai asli earning - family ke saath waqt! 🏠❤️',
    },
];

// Post Card Component
const PostCard: React.FC<{
    post: PostData;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
}> = ({ post, onSupport, onComment, onShare }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const formatCount = (count: number): string => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.postCard}>
            {/* Header */}
            <View style={styles.postHeader}>
                <Image source={{ uri: post.userAvatar }} style={styles.postAvatar} />
                <View style={styles.postUserInfo}>
                    <View style={styles.postUserRow}>
                        <Text style={styles.postUserName}>{post.userName}</Text>
                        <Text style={styles.postTime}> · {getTimeAgo(post.createdAt)}</Text>
                    </View>
                    <Text style={styles.postUserState}>{post.userState}</Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
                </TouchableOpacity>
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
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={24}
                            color="#FFFFFF"
                        />
                    </View>
                    <View style={styles.waveformContainer}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.waveBar,
                                    {
                                        height: 8 + Math.random() * 20,
                                        backgroundColor: isPlaying ? '#3B82F6' : '#CBD5E1',
                                    },
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.duration}>
                        {formatDuration(post.audioDuration || 0)}
                    </Text>
                </TouchableOpacity>
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

const FeedScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [posts, setPosts] = useState<PostData[]>(MOCK_POSTS);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    }, []);

    const toggleSupport = (postId: string) => {
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
    };

    const openComments = (postId: string) => {
        console.log('Open comments:', postId);
    };

    const sharePost = async (post: PostData) => {
        try {
            await Share.share({
                message: `${post.userName} on Driver Ki Awaz:\n\n${post.content || 'Voice message'}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}\n\n#DriverKiAwaz`,
            });
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
});

export default FeedScreen;
