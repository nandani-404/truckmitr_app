/**
 * Driver Ki Awaz - Reels Screen
 * Clean, simple full-screen vertical video feed
 * @format
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Dimensions,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    Share,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';
import CommentsModal from '../components/CommentsModal';

import { DriverKiAwazService } from '../services';
import { DRIVER_KI_AWAZ_BASE } from '@truckmitr/src/utils/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 40; // Approximate tab bar height

interface ReelData {
    id: string;
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
    videoUrl: string;
    description: string;
    createdAt?: string;
}



const GradientHeart: React.FC<{
    onComplete: () => void;
    rotation: string;
}> = ({ onComplete, rotation }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1.2,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Exit animation after delay
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(onComplete);
            }, 600);
        });
    }, []);

    return (
        <Animated.View
            style={[
                styles.doubleTapHeart,
                {
                    opacity,
                    transform: [
                        { scale },
                        { rotate: rotation },
                        { translateY },
                    ],
                },
            ]}
        >
            <LinearGradient
                colors={['#EC4899', '#EF4444', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    padding: 20,
                    borderRadius: 100,
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                }}
            >
                <Ionicons name="heart" size={80} color="#FFFFFF" />
            </LinearGradient>
        </Animated.View>
    );
};

const ReelItem = React.memo(({ reel, isActive, isMuted, onToggleMute, onSupport, onComment, onShare, bottomInset, contentHeight }: {
    reel: ReelData;
    isActive: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
    bottomInset: number;
    contentHeight: number;
}) => {
    const [isPaused, setIsPaused] = useState(!isActive);
    const [showMuteIndicator, setShowMuteIndicator] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number; rotation: string }[]>([]);
    const isFirstMount = useRef(true);
    const lastTapRef = useRef<number>(0);

    React.useEffect(() => {
        setIsPaused(!isActive);
    }, [isActive]);

    React.useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        setShowMuteIndicator(true);
        const timer = setTimeout(() => {
            setShowMuteIndicator(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [isMuted]);

    const formatCount = (count: number): string => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    };

    const handleDoubleTapLike = () => {
        const newHeart = {
            id: Date.now(),
            x: 0, // Center
            y: 0, // Center
            rotation: `${Math.random() * 60 - 30}deg`, // Random rotation -30 to 30
        };

        setHearts(prev => [...prev, newHeart]);

        // Like the video if not already liked
        if (!reel.isSupported) {
            onSupport();
        }
    };

    const handleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap - Like
            handleDoubleTapLike();
            lastTapRef.current = 0; // Reset to prevent triple tap
        } else {
            // Single tap - Mute/Unmute (with delay to check for double tap)
            lastTapRef.current = now;
            setTimeout(() => {
                if (lastTapRef.current === now) {
                    // Single tap confirmed - toggle mute
                    onToggleMute();
                }
            }, DOUBLE_TAP_DELAY);
        }
    };

    const handleBuffer = ({ isBuffering: buffering }: { isBuffering: boolean }) => {
        setIsBuffering(buffering);
    };

    const handleLoad = () => {
        setIsBuffering(false);
    };

    const removeHeart = (id: number) => {
        setHearts(prev => prev.filter(heart => heart.id !== id));
    };

    return (
        <View style={[styles.reelContainer, { height: contentHeight, paddingBottom: bottomInset }]}>
            {/* Video Background */}
            <TouchableOpacity
                activeOpacity={1}
                style={styles.videoWrapper}
                onPress={handleTap}
                onLongPress={() => setIsPaused(true)}
                onPressOut={() => setIsPaused(!isActive)}
                delayLongPress={250}
            >
                <Video
                    source={{ uri: reel.videoUrl }}
                    style={styles.video}
                    resizeMode="cover"
                    repeat
                    paused={isPaused}
                    muted={isMuted}
                    onBuffer={handleBuffer}
                    onLoad={handleLoad}
                    bufferConfig={{
                        minBufferMs: 2000,
                        maxBufferMs: 30000,
                        bufferForPlaybackMs: 100,
                        bufferForPlaybackAfterRebufferMs: 500,
                    }}
                    playInBackground={false}
                    playWhenInactive={false}
                />

                {/* Loading Indicator */}
                {isBuffering && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                )}

                {/* Dark Gradient Overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={styles.gradient}
                />

                {/* Double Tap Heart Animations */}
                {hearts.map(heart => (
                    <GradientHeart
                        key={heart.id}
                        onComplete={() => removeHeart(heart.id)}
                        rotation={heart.rotation}
                    />
                ))}

                {/* Mute Indicator - Shows briefly when mute state changes */}
                {showMuteIndicator && (
                    <View style={styles.muteIndicator}>
                        <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-high'}
                            size={24}
                            color="#FFFFFF"
                        />
                    </View>
                )}
            </TouchableOpacity>

            {/* Right Side Actions */}
            <View style={[styles.actionsContainer, { bottom: bottomInset + 100 }]}>
                {/* User Avatar */}
                <TouchableOpacity style={styles.avatarContainer}>
                    {reel.userAvatar && !reel.userAvatar.includes('placeholder') ? (
                        <Image source={{ uri: reel.userAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: '#333333', alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="person" size={24} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Support Button */}
                <TouchableOpacity style={styles.actionButton} onPress={onSupport}>
                    <Ionicons
                        name={reel.isSupported ? 'heart' : 'heart-outline'}
                        size={28}
                        color={reel.isSupported ? '#EF4444' : '#FFFFFF'}
                    />
                    <Text style={styles.actionText}>{formatCount(reel.supportCount)}</Text>
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                    <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
                    <Text style={styles.actionText}>{formatCount(reel.commentCount)}</Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                    <Ionicons name="share-social-outline" size={26} color="#FFFFFF" />
                    <Text style={styles.actionText}>{formatCount(reel.shareCount)}</Text>
                </TouchableOpacity>

                {/* Mute Button */}
                <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
                    <Ionicons
                        name={isMuted ? 'volume-mute' : 'volume-high'}
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

            {/* Bottom Info */}
            <View style={[styles.bottomInfo, { bottom: bottomInset + 20 }]}>
                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>@{reel.userName}</Text>
                    <Text style={styles.userState}>{reel.userState}</Text>
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>
                    {reel.description}
                </Text>

                {/* Category & Hashtags */}
                <View style={styles.tagsContainer}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{reel.categoryLabel}</Text>
                    </View>
                </View>
                <Text style={styles.hashtags}>
                    {reel.hashtags.map(tag => `#${tag}`).join(' ')}
                </Text>
            </View>
        </View>
    );
});

const ReelsScreen: React.FC<{ isScreenFocused: boolean; tabBarHeight?: number }> = ({ isScreenFocused, tabBarHeight = TAB_BAR_HEIGHT }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const CONTENT_HEIGHT = SCREEN_HEIGHT - tabBarHeight - insets.top; // Adjust for tab bar and status bar
    const [reels, setReels] = useState<ReelData[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isGlobalMuted, setIsGlobalMuted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [lastId, setLastId] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [activeReelId, setActiveReelId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Lock Orientation to Portrait
    useEffect(() => {
        Orientation.lockToPortrait();
        return () => {
            Orientation.unlockAllOrientations();
        };
    }, []);

    // Initial Fetch
    useEffect(() => {
        fetchFeed(true);
    }, []);



    // ... (existing imports)

    // Inside ReelsScreen component

    // ...

    const fetchFeed = async (refresh = false) => {
        if (loading || (!hasMore && !refresh)) return;

        setLoading(true);
        try {
            const currentCursor = refresh ? undefined : cursor;
            const currentLastId = refresh ? undefined : lastId;

            const response = await DriverKiAwazService.getFeed(currentCursor, currentLastId);

            // Determine if data is directly the array or nested in .data
            const feedData = Array.isArray(response.data) ? response.data : response.data?.data;

            if (Array.isArray(feedData)) {
                const newReels: ReelData[] = feedData
                    .filter((item: any) => item.media_type === 'video')
                    .map((item: any) => {
                        // Check if URL is already absolute
                        const rawUrl = item.media_url || '';
                        const hasHttp = rawUrl.startsWith('http');
                        // Clean leading slash if appending
                        const cleanPath = rawUrl && rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
                        // Construct final URL
                        const finalUrl = hasHttp ? rawUrl : `${DRIVER_KI_AWAZ_BASE}${cleanPath}`;

                        // Avatar Logic
                        const rawAvatar = item.user_avatar || item.user?.avatar || '';
                        const hasAvatarHttp = rawAvatar.startsWith('http');
                        const cleanAvatarPath = rawAvatar && rawAvatar.startsWith('/') ? rawAvatar.substring(1) : rawAvatar;
                        const finalAvatarUrl = !rawAvatar
                            ? 'https://via.placeholder.com/150'
                            : (hasAvatarHttp ? rawAvatar : `https://devtruckmitr.in/public/${cleanAvatarPath}`);

                        return {
                            id: item.id.toString(),
                            userName: item.user_name || item.user?.name || `Driver ${item.user_id || ''}`,
                            userAvatar: finalAvatarUrl,
                            userState: item.user?.state || '',
                            category: item.media_type || 'VIDEO',
                            categoryLabel: item.category ? `#${item.category}` : (item.media_type === 'video' ? '🎬 Video' : '🎵 Audio'),
                            hashtags: [],
                            supportCount: item.likes_count || 0,
                            commentCount: item.comments_count || 0,
                            shareCount: item.shares_count || 0,
                            isSupported: item.is_liked === 1,
                            videoUrl: finalUrl,
                            description: item.caption || '',
                            createdAt: item.created_at,
                        };
                    });

                if (refresh) {
                    setReels(newReels);
                } else {
                    setReels(prev => [...prev, ...newReels]);
                }

                if (newReels.length > 0) {
                    const lastItem = newReels[newReels.length - 1];
                    setCursor(lastItem.createdAt);
                    setLastId(lastItem.id);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Fetch feed error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchFeed();
        }
    };

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    const toggleSupport = async (reelId: string) => {
        setReels(prev =>
            prev.map(reel =>
                reel.id === reelId
                    ? {
                        ...reel,
                        isSupported: !reel.isSupported,
                        supportCount: reel.isSupported
                            ? reel.supportCount - 1
                            : reel.supportCount + 1,
                    }
                    : reel
            )
        );

        try {
            await DriverKiAwazService.likePost(reelId);
        } catch (error) {
            console.error('Like failed', error);
        }
    };

    const openComments = (reelId: string) => {
        setActiveReelId(reelId);
        setShowComments(true);
    };

    const shareReel = async (reel: ReelData) => {
        try {
            await Share.share({
                message: `Check out this reel by ${reel.userName} on Driver Ki Awaz! 🚛\n${reel.description}\n\n#DriverKiAwaz ${reel.hashtags.map(t => `#${t}`).join(' ')}`,
            });
            await DriverKiAwazService.sharePost(reel.id);
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const getItemLayout = (_: any, index: number) => ({
        length: CONTENT_HEIGHT,
        offset: CONTENT_HEIGHT * index,
        index,
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor="black" translucent={true} />

            <FlatList
                ref={flatListRef}
                data={reels}
                renderItem={({ item, index }) => (
                    <ReelItem
                        reel={item}
                        isActive={index === activeIndex && isScreenFocused}
                        isMuted={isGlobalMuted}
                        onToggleMute={() => setIsGlobalMuted(prev => !prev)}
                        onSupport={() => toggleSupport(item.id)}
                        onComment={() => openComments(item.id)}
                        onShare={() => shareReel(item)}
                        bottomInset={insets.bottom}
                        contentHeight={CONTENT_HEIGHT}
                    />
                )}
                keyExtractor={item => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToAlignment="start"
                snapToInterval={CONTENT_HEIGHT}
                decelerationRate="fast"
                getItemLayout={getItemLayout}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                bounces={false}
                overScrollMode="never"
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
                initialNumToRender={3}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: CONTENT_HEIGHT }}>
                            <Text style={{ color: 'white' }}>No posts available</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    loading && reels.length > 0 ? (
                        <View style={{ position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' }}>
                            <ActivityIndicator color="white" size="small" />
                        </View>
                    ) : null
                }
            />
            {loading && reels.length === 0 && (
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                    <ActivityIndicator color="white" size="large" />
                </View>
            )}
            <CommentsModal
                visible={showComments}
                postId={activeReelId}
                onClose={() => setShowComments(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    reelContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: '#000000',
    },
    videoWrapper: {
        flex: 1,
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.5,
    },
    playIndicator: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionsContainer: {
        position: 'absolute',
        right: 12,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    followBadge: {
        position: 'absolute',
        bottom: -6,
        alignSelf: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        alignItems: 'center',
        marginBottom: 16,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    bottomInfo: {
        position: 'absolute',
        left: 16,
        right: 80,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    userState: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginLeft: 8,
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    hashtags: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
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
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    doubleTapHeart: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    muteIndicator: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.45,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
});

export default ReelsScreen;
