/**
 * Driver Ki Awaz - Text Post Card Component
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TextPost, CATEGORIES } from '../types';
import ActionButtons from './ActionButtons';

interface TextPostCardProps {
    post: TextPost;
    onSupport: () => void;
    onComment: () => void;
    onShare: () => void;
    onPress?: () => void;
}

const TextPostCard: React.FC<TextPostCardProps> = ({
    post,
    onSupport,
    onComment,
    onShare,
    onPress,
}) => {
    const category = CATEGORIES.find(c => c.id === post.category);

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

            {/* Content */}
            <Text style={styles.content}>{post.content}</Text>

            {/* Hashtags */}
            {post.hashtags.length > 0 && (
                <View style={styles.hashtagsContainer}>
                    {post.hashtags.map((tag, index) => (
                        <Text key={index} style={styles.hashtag}>#{tag}</Text>
                    ))}
                </View>
            )}

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
        marginBottom: 12,
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
    content: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 12,
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

export default TextPostCard;
