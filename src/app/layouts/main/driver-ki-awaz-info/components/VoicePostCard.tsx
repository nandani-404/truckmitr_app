/**
 * Driver Ki Awaz - Voice Post Card Component
 * @format
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { VoicePost, CATEGORIES } from '../types';
import ActionButtons from './ActionButtons';

interface VoicePostCardProps {
    post: VoicePost;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
    onPress?: () => void;
}

const VoicePostCard: React.FC<VoicePostCardProps> = ({
    post,
    onSupport,
    onComment,
    onShare,
    onPress,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const category = CATEGORIES.find(c => c.id === post.category);

    // Animation for waveform
    const waveScale = useSharedValue(1);

    const waveAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: waveScale.value }],
    }));

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    const togglePlayback = () => {
        if (isPlaying) {
            waveScale.value = withTiming(1);
        } else {
            waveScale.value = withRepeat(
                withTiming(1.3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        }
        setIsPlaying(!isPlaying);
        // TODO: Implement actual audio playback
    };

    // Generate random waveform bars
    const waveformBars = Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.95}
        >
            {/* Header */}
            <View style={styles.header}>
                <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{post.userName}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.userState}>{post.userState}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
                    </View>
                </View>
                {category && (
                    <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon as any} size={10} color="#FFFFFF" />
                        <Text style={styles.categoryLabel}>{category.label}</Text>
                    </View>
                )}
            </View>

            {/* Audio Player */}
            <View style={styles.playerContainer}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayback}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>

                {/* Waveform */}
                <View style={styles.waveformContainer}>
                    {waveformBars.map((height, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.waveformBar,
                                waveAnimatedStyle,
                                {
                                    height: height * 30,
                                    backgroundColor: index / waveformBars.length <= progress
                                        ? '#3B82F6'
                                        : '#CBD5E1',
                                },
                            ]}
                        />
                    ))}
                </View>

                <Text style={styles.duration}>{formatDuration(post.duration)}</Text>
            </View>

            {/* Hashtags */}
            <View style={styles.hashtagsContainer}>
                {post.hashtags.map((tag, index) => (
                    <Text key={index} style={styles.hashtag}>#{tag}</Text>
                ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
                <ActionButtons
                    supportCount={post.supportCount}
                    commentCount={post.commentCount}
                    shareCount={post.shareCount}
                    isSupported={post.isSupported}
                    onSupport={onSupport}
                    onComment={onComment}
                    onShare={onShare}
                    orientation="horizontal"
                    size="small"
                    iconColor="#64748B"
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E2E8F0',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    userState: {
        fontSize: 12,
        color: '#64748B',
    },
    dot: {
        fontSize: 12,
        color: '#94A3B8',
        marginHorizontal: 4,
    },
    timeAgo: {
        fontSize: 12,
        color: '#94A3B8',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveformContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        height: 40,
        marginHorizontal: 12,
    },
    waveformBar: {
        width: 3,
        borderRadius: 2,
    },
    duration: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        minWidth: 36,
        textAlign: 'right',
    },
    hashtagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    hashtag: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
    },
    actionsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginTop: 4,
        paddingTop: 8,
    },
});

export default VoicePostCard;
