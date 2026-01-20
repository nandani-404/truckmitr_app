/**
 * Driver Ki Awaz - Floating Action Button Component
 * @format
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

interface FloatingActionButtonProps {
    onPress: () => void;
    label: string;
    icon?: string;
    iconComponent?: React.ReactNode;
    gradientColors?: string[];
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onPress,
    label,
    icon = 'mic',
    iconComponent,
    gradientColors = ['#3B82F6', '#1D4ED8'],
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <View style={styles.content}>
                        {iconComponent || (
                            <Ionicons name={icon} size={20} color="#FFFFFF" />
                        )}
                        <Text style={styles.label}>{label}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default FloatingActionButton;
