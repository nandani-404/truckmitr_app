/**
 * Driver Ki Awaz - Reel Item Component
 * @format
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Image,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { VideoPost, CATEGORIES } from '../types';
import ActionButtons from './ActionButtons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItemProps {
    reel: VideoPost;
    isActive: boolean;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
}

const ReelItem: React.FC<ReelItemProps> = ({
    reel,
    isActive,
    onSupport,
    onComment,
    onShare,
}) => {
    const videoRef = useRef<any>(null);
    const [isPaused, setIsPaused] = useState(!isActive);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayIcon, setShowPlayIcon] = useState(false);

    const category = CATEGORIES.find(c => c.id === reel.category);

    useEffect(() => {
        setIsPaused(!isActive);
    }, [isActive]);

    const togglePlayPause = () => {
        setIsPaused(prev => !prev);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 800);
    };

    const handleVideoLoad = () => {
        setIsLoading(false);
    };

    const handleVideoError = (error: any) => {
        console.error('Video Error:', error);
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            {/* Video Player */}
            <TouchableWithoutFeedback onPress={togglePlayPause}>
                <View style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: reel.videoUrl }}
                        style={[styles.video, { opacity: isLoading ? 0 : 1 }]}
                        resizeMode="cover"
                        repeat={true}
                        paused={isPaused}
                        onLoad={handleVideoLoad}
                        onReadyForDisplay={() => setIsLoading(false)}
                        onError={handleVideoError}
                        poster={reel.thumbnailUrl}
                        posterResizeMode="cover"
                        controls={false}
                    />

                    {/* Loading Indicator */}
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.8)" />
                        </View>
                    )}

                    {/* Play/Pause Icon */}
                    {showPlayIcon && (
                        <View style={styles.playIconOverlay}>
                            <View style={styles.playIconBackground}>
                                <Ionicons
                                    name={isPaused ? 'play' : 'pause'}
                                    size={40}
                                    color="#FFFFFF"
                                />
                            </View>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* Bottom Gradient */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bottomGradient}
            />

            {/* User Info (Bottom Left) */}
            <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                    <Image
                        source={{ uri: reel.userAvatar }}
                        style={styles.avatar}
                    />
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{reel.userName}</Text>
                        <Text style={styles.userState}>{reel.userState}</Text>
                    </View>
                </View>

                {/* Category Badge */}
                {category && (
                    <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon as any} size={12} color="#FFFFFF" />
                        <Text style={styles.categoryLabel}>{category.label}</Text>
                    </View>
                )}

                {/* Hashtags */}
                <View style={styles.hashtagsContainer}>
                    {reel.hashtags.slice(0, 3).map((tag, index) => (
                        <Text key={index} style={styles.hashtag}>#{tag}</Text>
                    ))}
                </View>
            </View>

            {/* Action Buttons (Right Side) */}
            <View style={styles.actionsContainer}>
                <ActionButtons
                    supportCount={reel.supportCount}
                    commentCount={reel.commentCount}
                    shareCount={reel.shareCount}
                    isSupported={reel.isSupported}
                    onSupport={onSupport}
                    onComment={onComment}
                    onShare={onShare}
                    orientation="vertical"
                    iconColor="#FFFFFF"
                    activeColor="#EF4444"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#000000',
    },
    videoContainer: {
        flex: 1,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playIconOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIconBackground: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 250,
    },
    userInfo: {
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 80,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userDetails: {
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userState: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 10,
        gap: 4,
    },
    categoryLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    hashtagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hashtag: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    actionsContainer: {
        position: 'absolute',
        right: 12,
        bottom: 140,
    },
});

export default ReelItem;
