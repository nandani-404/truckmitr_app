/**
 * Driver Ki Awaz - Post Detail Screen
 * Shows full post details with user info, media, stats, and caption
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

import { DRIVER_KI_AWAZ_BASE, AWAZ_URL } from '@truckmitr/src/utils/config';
import { CATEGORIES, PostStatus } from '../types';
import { Share, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DriverKiAwazService } from '../services';
import CommentsModal from '../components/CommentsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostDetailParams {
    post: {
        id: string;
        type: 'VIDEO' | 'IMAGE' | 'TEXT';
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
    };
}

const getTimeAgo = (dateString: string, t: any): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return t('published_just_now');
    if (diffMins < 60) {
        return diffMins === 1 
            ? t('published_minute_ago') 
            : t('published_minutes_ago', { count: diffMins });
    }
    if (diffHours < 24) {
        return diffHours === 1 
            ? t('published_hour_ago') 
            : t('published_hours_ago', { count: diffHours });
    }
    
    // Absolute date formatting: published on 12 March, 2026
    const day = date.getDate();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${day} ${month}, ${year}`;
    
    return t('published_on', { date: formattedDate });
};

const getStatusConfig = (status: PostStatus | number, t: any) => {
    if (status === 'APPROVED' || status === 1) {
        return { label: t('approved'), color: '#10B981', bgColor: '#ECFDF5' };
    }
    return { label: t('pending'), color: '#F59E0B', bgColor: '#FFFBEB' };
};

const PostDetailScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [post, setPost] = useState<any>(route.params?.post);
    const { t, i18n } = useTranslation();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
    const [commentsCount, setCommentsCount] = useState(post?.commentsCount || 0);
    const [likeLoading, setLikeLoading] = useState(false);

    useEffect(() => {
        if (route.params?.id) {
            fetchPost(route.params.id);
        }
    }, [route.params?.id]);


    const fetchPost = async (id: string) => {
        try {
            setLoading(true);
            const response = await DriverKiAwazService.getPostById(id);
            if ((response.data?.status || response.data?.success) && response.data?.data) {
                // Map API response to expected post structure if needed
                const rawPost = response.data.data;
                
                // Align with FeedScreen.tsx: Media on awaz subdomain, Avatars on main domain public/
                const rawMediaUrl = rawPost.media_url || rawPost.mediaUrl || '';
                const hasMediaHttp = rawMediaUrl.startsWith('http');
                const cleanMediaPath = rawMediaUrl.startsWith('/') ? rawMediaUrl.substring(1) : rawMediaUrl;
                const finalMediaUrl = hasMediaHttp ? rawMediaUrl : (rawMediaUrl ? `${DRIVER_KI_AWAZ_BASE}${cleanMediaPath}` : '');

                const rawAvatar = rawPost.user_avatar || rawPost.avatar || (rawPost.user?.avatar) || '';
                const hasAvatarHttp = rawAvatar.startsWith('http');
                const cleanAvatarPath = rawAvatar.startsWith('/') ? rawAvatar.substring(1) : rawAvatar;
                const finalAvatarUrl = !rawAvatar ? 'https://via.placeholder.com/150' : (hasAvatarHttp ? rawAvatar : `${AWAZ_URL}public/${cleanAvatarPath}`);

                setPost({
                    id: rawPost.id.toString(),
                    type: (rawPost.media_type || 'text').toUpperCase(),
                    caption: rawPost.caption || '',
                    mediaUrl: finalMediaUrl,
                    thumbnailUrl: (rawPost.thumbnail_url || rawPost.thumbnail) 
                        ? ( (rawPost.thumbnail_url || rawPost.thumbnail).startsWith('http') 
                            ? (rawPost.thumbnail_url || rawPost.thumbnail) 
                            : `${DRIVER_KI_AWAZ_BASE}${(rawPost.thumbnail_url || rawPost.thumbnail).replace(/^\/+/, '')}`
                          ) 
                        : '',
                    likesCount: rawPost.likes_count || 0,
                    commentsCount: rawPost.comments_count || 0,
                    createdAt: rawPost.created_at,
                    status: Number(rawPost.status) === 1 ? 'APPROVED' : 'PENDING',
                    userName: rawPost.user_name || rawPost.name || (rawPost.user?.name) || t('unknown_user'),
                    userAvatar: finalAvatarUrl,
                });
            } else {
                Alert.alert(t('error'), t('post_not_found'));
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            Alert.alert(t('error'), t('failed_fetch_post'));
        } finally {
            setLoading(false);
        }
    };

    const [videoPaused, setVideoPaused] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // Sync likes/comments count when post data changes (e.g. after fetch)
    useEffect(() => {
        if (post) {
            setLikesCount(post.likesCount || 0);
            setCommentsCount(post.commentsCount || 0);
        }
    }, [post?.id]);

    const handleLike = async () => {
        if (likeLoading || !post) return;
        setLikeLoading(true);
        // Optimistic update
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikesCount((prev: number) => wasLiked ? Math.max(0, prev - 1) : prev + 1);
        try {
            await DriverKiAwazService.likePost(post.id);
        } catch (error) {
            // Revert on error
            console.log('Like error:', error);
            setIsLiked(wasLiked);
            setLikesCount((prev: number) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
        } finally {
            setLikeLoading(false);
        }
    };

    const handleCommentAdded = () => {
        setCommentsCount((prev: number) => prev + 1);
    };

    const handleShare = async () => {
        if (!post) return;
        try {
            const isVideo = (post.type || post.mediaType) === 'VIDEO';
            const typePath = isVideo ? 'reel' : 'post';
            const shareUrl = `https://truckmitr.com/${typePath}/${post.id}`;
            const isHindi = i18n.language === 'hi' || i18n.language === 'hn';

            const message = isHindi
                ? `🚛 मैंने अपनी आवाज *Driver Ki Awaz!* पर शेयर की है!\n\nयह TruckMitr का खास प्लेटफॉर्म है जहाँ ड्राइवर अपनी समस्या, अनुभव और कहानी खुलकर बता सकते हैं।\n\nआप भी अपनी आवाज उठाइए।\nआज ही *TruckMitr ऐप डाउनलोड करें* और रजिस्टर करें。\n\n📲 *अभी जुड़ें:* ${shareUrl}`
                : `🚛 I have shared my voice on *Driver Ki Awaz!*\n\nThis is a special platform by TruckMitr where drivers can openly share their problems, experiences, and personal stories.\n\nNow it’s your turn to raise your voice.\n*Download the TruckMitr App* today and register to be part of the community.\n\n📲 *Join now:* ${shareUrl}`;

            await Share.share({
                message: message,
            });
            await DriverKiAwazService.sharePost(post.id);
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{t('post_not_found')}</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: 20 }}
                    >
                        <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>{t('go_back')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

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
                <Text style={styles.headerTitle}>{t('post')}</Text>
                {post.status === 'APPROVED' ? (
                    <TouchableOpacity
                        onPress={handleShare}
                        style={styles.shareHeaderButton}
                    >
                        <Ionicons name="share-outline" size={24} color="#1E293B" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerSpacer} />
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Under Review Banner */}
                {post.status === 'PENDING' && (
                    <View style={styles.reviewBanner}>
                        <Text style={styles.reviewBannerIcon}>🕐</Text>
                        <Text style={styles.reviewBannerText}>
                            {t('under_review_banner')}
                        </Text>
                    </View>
                )}

                {/* User Info Row */}
                <View style={styles.userRow}>
                    {post.userAvatar && post.userAvatar !== 'https://via.placeholder.com/150' ? (
                        <FastImage
                            source={{ uri: post.userAvatar, priority: FastImage.priority.normal }}
                            style={styles.userAvatar}
                        />
                    ) : (
                        <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={24} color="#94A3B8" />
                        </View>
                    )}
                    <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                            <Text style={styles.userName}>{post.userName || t('unknown_user')}</Text>
                        </View>
                        <Text style={styles.publishDate}>{getTimeAgo(post.createdAt, t)}</Text>
                    </View>
                </View>

                {/* Media */}
                {(post.type || post.mediaType) !== 'TEXT' && (post.mediaUrl || post.thumbnailUrl) && (
                    <View style={styles.mediaContainer}>
                        {(post.type || post.mediaType) === 'VIDEO' ? (
                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={() => setVideoPaused(!videoPaused)}
                                style={styles.videoWrapper}
                            >
                                <Video
                                    source={{ uri: post.mediaUrl }}
                                    style={styles.media}
                                    resizeMode="cover"
                                    paused={videoPaused}
                                    controls={true}
                                    repeat
                                />
                                {videoPaused && (
                                    <View style={styles.playOverlay}>
                                        <View style={styles.playButton}>
                                            <Ionicons name="play" size={32} color="#FFFFFF" />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <FastImage
                                source={{ uri: post.mediaUrl || post.thumbnailUrl, priority: FastImage.priority.high }}
                                style={styles.media}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        )}
                    </View>
                )}

                {/* Stats Row */}
                {post.status === 'APPROVED' && (
                    <View style={styles.statsRow}>
                        <TouchableOpacity 
                            style={styles.statItem}
                            onPress={handleLike}
                            activeOpacity={0.7}
                            disabled={likeLoading}
                        >
                            <Ionicons 
                                name={isLiked ? "heart" : "heart-outline"} 
                                size={22} 
                                color={isLiked ? "#EF4444" : "#64748B"} 
                            />
                            <Text style={[styles.statText, isLiked && { color: '#EF4444' }]}>
                                {likesCount} {t('likes')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.statItem}
                            onPress={() => setShowComments(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
                            <Text style={styles.statText}>{commentsCount} {t('comments')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Caption */}
                {post.caption ? (
                    <View style={styles.captionContainer}>
                        <Text style={styles.caption}>{post.caption}</Text>
                    </View>
                ) : null}
            </ScrollView>

            <CommentsModal
                visible={showComments}
                postId={post.id}
                onClose={() => setShowComments(false)}
                onCommentAdded={handleCommentAdded}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#94A3B8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
    shareHeaderButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    // User Row
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    publishDate: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    // Review Banner
    reviewBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    reviewBannerIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    reviewBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
    // Media
    mediaContainer: {
        marginHorizontal: 16,
        aspectRatio: 4 / 5,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        overflow: 'hidden',
    },
    videoWrapper: {
        width: '100%',
        height: '100%',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 4,
    },
    textMediaPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    textMediaLabel: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    statText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 16,
    },
    // Caption
    captionContainer: {
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    caption: {
        fontSize: 15,
        color: '#1E293B',
        lineHeight: 24,
    },
});

export default PostDetailScreen;
