import React, { FC, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, LayoutChangeEvent, ViewStyle, Text, TextStyle, DimensionValue } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface ShimmerTextProps {
    children?: React.ReactNode;
    text?: string;
    shimmerColor?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    duration?: number;
    width?: DimensionValue;
    colors?: string[];
    opacity?: number;
}

const ShimmerText: FC<ShimmerTextProps> = ({
    children,
    text,
    shimmerColor = '#FFFFFF',
    style,
    textStyle,
    duration = 1500,
    colors = ['transparent', 'rgba(255, 255, 255, 0.8)', 'transparent'],
    opacity = 1,
    width = '100%',
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [layoutWidth, setLayoutWidth] = useState(0);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [animatedValue, duration]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-layoutWidth, layoutWidth],
    });

    const onLayout = (event: LayoutChangeEvent) => {
        // Only update if width changes significantly to avoid loops
        if (Math.abs(event.nativeEvent.layout.width - layoutWidth) > 1) {
            setLayoutWidth(event.nativeEvent.layout.width);
        }
    };

    const renderContent = () => {
        if (text) {
            return <Text style={[styles.text, textStyle]}>{text}</Text>;
        }
        return children;
    };

    // Scenario 1: Text shimmer implementation using MaskedView as a parent wrapper
    if (text || (children && React.isValidElement(children) && children.type === Text)) {
        return (
            <MaskedView
                style={[styles.container, { width }, style]}
                maskElement={
                    <View style={styles.contentContainer} onLayout={onLayout}>
                        {renderContent()}
                    </View>
                }
            >
                {/* Base Layer - The visible text under the shimmer */}
                {/* We use a slightly lower opacity for the base text so the shimmer "shines" */}
                <View style={[styles.contentContainer, { opacity: opacity * 0.7 }]}>
                    {renderContent()}
                </View>

                {/* Shimmer Layer - The gradient moving across */}
                <Animated.View
                    style={[
                        styles.shimmerContainer,
                        {
                            width: layoutWidth * 1.5, // Extra width for smoother flow
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </MaskedView>
        );
    }

    // Scenario 2: Generic wrapper for complex children
    // We render the children normally, then overlay a MaskedView containing the shimmer.
    // The MaskedView uses the same children as the mask.
    return (
        <View style={[styles.container, { width }, style]}>
            {/* Base Layer */}
            <View style={styles.contentContainer} onLayout={onLayout}>
                {renderContent()}
            </View>

            {/* Overlay Shimmer Layer */}
            <MaskedView
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
                maskElement={
                    <View style={styles.contentContainer}>
                        {renderContent()}
                    </View>
                }
            >
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </MaskedView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        alignSelf: 'flex-start', // Important to wrap text width
    },
    contentContainer: {
        alignSelf: 'flex-start',
    },
    shimmerContainer: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    text: {
        fontSize: 14,
        color: '#000',
    },
});

export default ShimmerText;
