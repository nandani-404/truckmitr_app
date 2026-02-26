/**
 * Driver Ki Awaz - Action Buttons Component (Support, Comment, Share)
 * @format
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
} from 'react-native-reanimated';

interface ActionButtonsProps {
    supportCount: number;
    commentCount: number;
    shareCount: number;
    isSupported: boolean;
    onSupport: () => void;
    onComment: () => void;
    onShare?: () => void;
    orientation?: 'horizontal' | 'vertical';
    size?: 'small' | 'medium' | 'large';
    showLabels?: boolean;
    iconColor?: string;
    activeColor?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    supportCount,
    commentCount,
    shareCount,
    isSupported,
    onSupport,
    onComment,
    onShare,
    orientation = 'horizontal',
    size = 'medium',
    showLabels = true,
    iconColor = '#64748B',
    activeColor = '#EF4444',
}) => {
    const scale = useSharedValue(1);

    const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 28;
    const fontSize = size === 'small' ? 11 : size === 'medium' ? 13 : 15;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleSupport = () => {
        scale.value = withSequence(
            withSpring(1.3, { damping: 5 }),
            withSpring(1, { damping: 8 })
        );
        onSupport();
    };

    const handleShare = async () => {
        if (onShare) {
            onShare();
        } else {
            try {
                await Share.share({
                    message: 'Check out this post on *Driver Ki Awaz!* - *Download the TruckMitr App*',
                    title: 'Driver Ki Awaz',
                });
            } catch (error) {
                Alert.alert('Error', 'Unable to share');
            }
        }
    };

    const formatCount = (count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const containerStyle = orientation === 'vertical'
        ? styles.verticalContainer
        : styles.horizontalContainer;

    const buttonStyle = orientation === 'vertical'
        ? styles.verticalButton
        : styles.horizontalButton;

    return (
        <View style={containerStyle}>
            {/* Support Button */}
            <TouchableOpacity
                style={buttonStyle}
                onPress={handleSupport}
                activeOpacity={0.7}
            >
                <Animated.View style={animatedStyle}>
                    <Ionicons
                        name={isSupported ? 'heart' : 'heart-outline'}
                        size={iconSize}
                        color={isSupported ? activeColor : iconColor}
                    />
                </Animated.View>
                {showLabels && (
                    <Text style={[styles.count, { fontSize, color: isSupported ? activeColor : iconColor }]}>
                        {formatCount(supportCount)}
                    </Text>
                )}
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity
                style={buttonStyle}
                onPress={onComment}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="chatbubble-outline"
                    size={iconSize}
                    color={iconColor}
                />
                {showLabels && (
                    <Text style={[styles.count, { fontSize, color: iconColor }]}>
                        {formatCount(commentCount)}
                    </Text>
                )}
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
                style={buttonStyle}
                onPress={handleShare}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="arrow-redo-outline"
                    size={iconSize}
                    color={iconColor}
                />
                {showLabels && (
                    <Text style={[styles.count, { fontSize, color: iconColor }]}>
                        {formatCount(shareCount)}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    verticalContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    horizontalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    verticalButton: {
        alignItems: 'center',
        gap: 4,
    },
    count: {
        fontWeight: '600',
    },
});

export default ActionButtons;
