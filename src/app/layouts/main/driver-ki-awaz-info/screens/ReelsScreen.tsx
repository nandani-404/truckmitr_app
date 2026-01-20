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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
}

// Mock data
const MOCK_REELS: ReelData[] = [
    {
        id: '1',
        userName: 'Ramesh Kumar',
        userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        userState: 'Uttar Pradesh',
        category: 'DRIVER_LIFE',
        categoryLabel: '🚛 Driver Life',
        hashtags: ['DriverLife', 'Trucking', 'Highway'],
        supportCount: 1245,
        commentCount: 89,
        shareCount: 34,
        isSupported: false,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        description: 'Aaj ka safar bahut acha raha! 🛣️',
    },
    {
        id: '2',
        userName: 'Suresh Singh',
        userAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        userState: 'Rajasthan',
        category: 'RTO_CHALLAN',
        categoryLabel: '📋 RTO Issues',
        hashtags: ['RTO', 'Challan', 'DriverRights'],
        supportCount: 892,
        commentCount: 156,
        shareCount: 67,
        isSupported: true,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        description: 'RTO ke unfair challans ke baare mein baat karte hain',
    },
    {
        id: '3',
        userName: 'Mahesh Yadav',
        userAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        userState: 'Maharashtra',
        category: 'WELFARE_RIGHTS',
        categoryLabel: '⚖️ Welfare Rights',
        hashtags: ['DriverWelfare', 'Rights', 'Unity'],
        supportCount: 2341,
        commentCount: 234,
        shareCount: 112,
        isSupported: false,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        description: 'Humari awaaz, humari jeet! 💪',
    },
];

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

const ReelItem: React.FC<{
    reel: ReelData;
    isActive: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
    bottomInset: number;
}> = ({ reel, isActive, isMuted, onToggleMute, onSupport, onComment, onShare, bottomInset }) => {
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
        <View style={[styles.reelContainer, { paddingBottom: bottomInset }]}>
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
                        minBufferMs: 15000,
                        maxBufferMs: 50000,
                        bufferForPlaybackMs: 2500,
                        bufferForPlaybackAfterRebufferMs: 5000,
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
                    <Image source={{ uri: reel.userAvatar }} style={styles.avatar} />
                    <View style={styles.followBadge}>
                        <Ionicons name="add" size={12} color="#FFFFFF" />
                    </View>
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
};

const ReelsScreen: React.FC<{ isScreenFocused: boolean }> = ({ isScreenFocused }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [reels, setReels] = useState<ReelData[]>(MOCK_REELS);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isGlobalMuted, setIsGlobalMuted] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    const toggleSupport = (reelId: string) => {
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
    };

    const openComments = (reelId: string) => {
        // TODO: Implement comments bottom sheet
        console.log('Open comments:', reelId);
    };

    const shareReel = async (reel: ReelData) => {
        try {
            await Share.share({
                message: `Check out this reel by ${reel.userName} on Driver Ki Awaz! 🚛\n${reel.description}\n\n#DriverKiAwaz ${reel.hashtags.map(t => `#${t}`).join(' ')}`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    // const navigateToCreatePost = () => {
    //     navigation.navigate(STACKS.DRIVER_KI_AWAZ_CREATE_POST as any, { defaultType: 'VIDEO' });
    // };

    const getItemLayout = (_: any, index: number) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

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
                    />
                )}
                keyExtractor={item => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToAlignment="start"
                snapToInterval={SCREEN_HEIGHT}
                decelerationRate="fast"
                getItemLayout={getItemLayout}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                bounces={false}
                overScrollMode="never"
                removeClippedSubviews
                maxToRenderPerBatch={2}
                windowSize={3}
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
        height: SCREEN_HEIGHT,
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
