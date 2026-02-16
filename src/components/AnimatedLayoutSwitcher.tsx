/**
 * AnimatedLayoutSwitcher — Curtain Drop Transition
 * 
 * Implements a "Curtain Drop" transition between Transporter (bottom) and Trucker (top) modes.
 * The Trucker layout slides down (height 0 -> 100%) like a curtain over the Transporter layout.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate
} from 'react-native-reanimated';
import type { AppMode } from '../redux/slices/appModeSlice';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    transporterLayout: React.ReactNode;
    truckerLayout: React.ReactNode;
}

const AnimatedLayoutSwitcher: React.FC<Props> = ({
    transporterLayout,
    truckerLayout,
}) => {
    // We listen to the global app mode
    const mode = useSelector((state: any) => state.appMode.mode) as AppMode;
    const isTruckerMode = mode === 'trucker';

    // Shared value for animation: 0 = Transporter, 1 = Trucker
    const transitionProgress = useSharedValue(isTruckerMode ? 1 : 0);

    useEffect(() => {
        transitionProgress.value = withTiming(isTruckerMode ? 1 : 0, {
            duration: 600,
            easing: Easing.bezier(0.33, 1, 0.68, 1),
        });
    }, [isTruckerMode]);

    // Animated style for the curtain (Trucker Layout)
    const curtainStyle = useAnimatedStyle(() => {
        const height = interpolate(transitionProgress.value, [0, 1], [0, SCREEN_HEIGHT]);
        return {
            height,
        };
    });

    return (
        <View style={styles.container}>
            {/* Transporter Layout (Bottom Layer) */}
            <View style={styles.transporterContainer}>
                {transporterLayout}
            </View>

            {/* Trucker Layout (Top Layer / Curtain) */}
            <Reanimated.View style={[styles.curtainContainer, curtainStyle]}>
                <View style={styles.curtainInner}>
                    {truckerLayout}
                </View>

                {/* Seam Line (The "Curtain Rod" visual at the bottom) */}
                <View style={styles.seamLine} />
            </Reanimated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    transporterContainer: {
        width: '100%',
        height: '100%',
        zIndex: 0,
    },
    curtainContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        overflow: 'hidden',
        zIndex: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    curtainInner: {
        width: '100%',
        height: SCREEN_HEIGHT, // Fixed height specifically for the reveal effect
    },
    seamLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#CBD5E1',
        zIndex: 11,
    },
});

export default AnimatedLayoutSwitcher;