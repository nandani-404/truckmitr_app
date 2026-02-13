/**
 * AnimatedLayoutSwitcher — Premium Light-Themed Truck Transition
 * 
 * Inspired by Google/Meta level animations:
 * 1. Smooth blur fade to bright daytime highway
 * 2. Road with flowing dashed lines appears with elastic spring
 * 3. Truck with shadow and motion blur drives across
 * 4. Mode badge fades in with scale and blur
 * 5. Seamless crossfade to new layout with subtle parallax
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Easing, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setAppModeTransitioning } from '../redux/slices/appModeSlice';
import type { AppMode } from '../redux/slices/appModeSlice';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
    transporterLayout: React.ReactNode;
    truckerLayout: React.ReactNode;
}

const AnimatedLayoutSwitcher: React.FC<Props> = ({
    transporterLayout,
    truckerLayout,
}) => {
    const dispatch = useDispatch();
    const mode = useSelector((state: any) => state.appMode.mode) as AppMode;
    const [activeMode, setActiveMode] = useState<AppMode>(mode);
    const [showOverlay, setShowOverlay] = useState(false);
    const isFirst = useRef(true);

    // Animation values
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const blurIntensity = useRef(new Animated.Value(0)).current;
    const roadSlide = useRef(new Animated.Value(SCREEN_H * 0.5)).current;
    const roadOpacity = useRef(new Animated.Value(0)).current;
    const truckX = useRef(new Animated.Value(-150)).current;
    const truckY = useRef(new Animated.Value(0)).current;
    const truckRotation = useRef(new Animated.Value(0)).current;
    const truckScale = useRef(new Animated.Value(0.8)).current;
    const dashOffset = useRef(new Animated.Value(0)).current;
    const labelOpacity = useRef(new Animated.Value(0)).current;
    const labelScale = useRef(new Animated.Value(0.85)).current;
    const shadowOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const contentScale = useRef(new Animated.Value(1)).current;
    const skyParallax = useRef(new Animated.Value(0)).current;
    const cloudsMove = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            setActiveMode(mode);
            return;
        }
        if (mode === activeMode) return;

        dispatch(setAppModeTransitioning(true));
        setShowOverlay(true);

        // Reset all values
        overlayOpacity.setValue(0);
        blurIntensity.setValue(0);
        roadSlide.setValue(SCREEN_H * 0.5);
        roadOpacity.setValue(0);
        truckX.setValue(-150);
        truckY.setValue(0);
        truckRotation.setValue(0);
        truckScale.setValue(0.8);
        dashOffset.setValue(0);
        labelOpacity.setValue(0);
        labelScale.setValue(0.85);
        shadowOpacity.setValue(0);
        skyParallax.setValue(0);
        cloudsMove.setValue(0);

        // Continuous animations
        const dashLoop = Animated.loop(
            Animated.timing(dashOffset, {
                toValue: 1,
                duration: 600,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const cloudLoop = Animated.loop(
            Animated.timing(cloudsMove, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Very subtle truck oscillation (reduced amplitude and slower)
        const truckOscillate = Animated.loop(
            Animated.sequence([
                Animated.timing(truckY, {
                    toValue: -2,
                    duration: 300,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(truckY, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // PHASE 1: Blur and fade current content (350ms)
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 350,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
                toValue: 0,
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(contentScale, {
                toValue: 0.96,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(blurIntensity, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Start continuous loops
            dashLoop.start();
            cloudLoop.start();

            // PHASE 2: Road enters with elastic spring (600ms)
            Animated.parallel([
                Animated.spring(roadSlide, {
                    toValue: 0,
                    friction: 9,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(roadOpacity, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(skyParallax, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true,
                }),
            ]).start(() => {

                truckOscillate.start();

                // PHASE 3: Truck drives across with realistic physics (2200ms - slower, professional pace)
                Animated.parallel([
                    // Truck enters with smooth, realistic deceleration
                    Animated.timing(truckX, {
                        toValue: SCREEN_W + 100,
                        duration: 2200,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                        useNativeDriver: true,
                    }),
                    // Truck scales up as it enters
                    Animated.sequence([
                        Animated.spring(truckScale, {
                            toValue: 1,
                            friction: 7,
                            tension: 50,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Very subtle rotation for realism (reduced movement)
                    Animated.sequence([
                        Animated.timing(truckRotation, {
                            toValue: -0.5,
                            duration: 600,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(truckRotation, {
                            toValue: 0.3,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.timing(truckRotation, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Shadow fades in/out (adjusted for slower truck)
                    Animated.sequence([
                        Animated.timing(shadowOpacity, {
                            toValue: 0.3,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                        Animated.delay(900),
                        Animated.timing(shadowOpacity, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Label appears with scale + fade (adjusted timing)
                    Animated.sequence([
                        Animated.delay(400),
                        Animated.parallel([
                            Animated.spring(labelScale, {
                                toValue: 1,
                                friction: 8,
                                tension: 80,
                                useNativeDriver: true,
                            }),
                            Animated.timing(labelOpacity, {
                                toValue: 1,
                                duration: 400,
                                easing: Easing.out(Easing.ease),
                                useNativeDriver: true,
                            }),
                        ]),
                    ]),
                ]).start(() => {
                    // Stop loops
                    dashLoop.stop();
                    cloudLoop.stop();
                    truckOscillate.stop();

                    // Swap layout
                    setActiveMode(mode);

                    // PHASE 4: Dissolve transition with crossfade (500ms)
                    setTimeout(() => {
                        contentOpacity.setValue(0);
                        contentScale.setValue(1.03);

                        Animated.parallel([
                            Animated.timing(overlayOpacity, {
                                toValue: 0,
                                duration: 500,
                                easing: Easing.bezier(0.4, 0, 0.2, 1),
                                useNativeDriver: true,
                            }),
                            Animated.timing(contentOpacity, {
                                toValue: 1,
                                duration: 450,
                                easing: Easing.bezier(0.4, 0, 0.2, 1),
                                useNativeDriver: true,
                            }),
                            Animated.spring(contentScale, {
                                toValue: 1,
                                friction: 10,
                                tension: 60,
                                useNativeDriver: true,
                            }),
                            Animated.timing(roadSlide, {
                                toValue: -SCREEN_H * 0.5,
                                duration: 450,
                                easing: Easing.bezier(0.4, 0, 0.6, 1),
                                useNativeDriver: true,
                            }),
                            Animated.timing(roadOpacity, {
                                toValue: 0,
                                duration: 400,
                                useNativeDriver: true,
                            }),
                            Animated.timing(labelOpacity, {
                                toValue: 0,
                                duration: 250,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blurIntensity, {
                                toValue: 0,
                                duration: 500,
                                useNativeDriver: true,
                            }),
                        ]).start(() => {
                            setShowOverlay(false);
                            dispatch(setAppModeTransitioning(false));
                        });
                    }, 120);
                });
            });
        });
    }, [mode]);

    const isTrucker = mode === 'trucker';
    const modeLabel = isTrucker ? '🚛  Trucker Mode' : '🏢  Transporter Mode';
    const accentColor = isTrucker ? '#2563EB' : '#F97316';
    const accentLight = isTrucker ? '#DBEAFE' : '#FFEDD5';

    // Interpolations
    const dashTranslate = dashOffset.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 50],
    });

    const cloudTranslate = cloudsMove.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -SCREEN_W * 0.3],
    });

    const skyParallaxY = skyParallax.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
    });

    return (
        <View style={styles.container}>
            {/* Active Layout */}
            <Animated.View style={[styles.content, {
                opacity: contentOpacity,
                transform: [{ scale: contentScale }],
            }]}>
                {activeMode === 'transporter' ? transporterLayout : truckerLayout}
            </Animated.View>

            {/* Transition Overlay */}
            {showOverlay && (
                <Animated.View
                    style={[styles.overlay, { opacity: overlayOpacity }]}
                    pointerEvents="auto"
                >
                    {/* Sky Gradient - Bright Daylight */}
                    <Animated.View style={[styles.skyGradient, {
                        transform: [{ translateY: skyParallaxY }],
                    }]}>
                        <View style={styles.skyTop} />
                        <View style={styles.skyMiddle} />
                        <View style={styles.skyHorizon} />
                    </Animated.View>

                    {/* Animated Clouds */}
                    <Animated.View style={[styles.cloudsContainer, {
                        transform: [{ translateX: cloudTranslate }],
                    }]}>
                        <Text style={[styles.cloud, { top: SCREEN_H * 0.15, left: SCREEN_W * 0.2 }]}>☁️</Text>
                        <Text style={[styles.cloud, { top: SCREEN_H * 0.22, left: SCREEN_W * 0.6, fontSize: 32 }]}>☁️</Text>
                        <Text style={[styles.cloud, { top: SCREEN_H * 0.18, left: SCREEN_W * 1.1, fontSize: 28 }]}>☁️</Text>
                        <Text style={[styles.cloud, { top: SCREEN_H * 0.25, left: SCREEN_W * 1.4 }]}>☁️</Text>
                    </Animated.View>

                    {/* Sun */}
                    <View style={styles.sun}>
                        <View style={styles.sunGlow} />
                    </View>

                    {/* Highway Road */}
                    <Animated.View style={[styles.roadContainer, {
                        opacity: roadOpacity,
                        transform: [{ translateY: roadSlide }],
                    }]}>
                        {/* Road perspective effect */}
                        <View style={styles.roadPerspective}>
                            {/* Asphalt surface */}
                            <View style={styles.road}>
                                {/* Yellow edge lines */}
                                <View style={styles.yellowLineTop} />
                                <View style={styles.yellowLineBottom} />

                                {/* White dashed center line */}
                                <Animated.View style={[styles.dashContainer, {
                                    transform: [{ translateX: dashTranslate }],
                                }]}>
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <View key={i} style={styles.dash} />
                                    ))}
                                </Animated.View>

                                {/* Road texture overlay */}
                                <View style={styles.roadTexture} />
                            </View>

                            {/* Road shadow gradient */}
                            <View style={styles.roadShadow} />
                        </View>

                        {/* Truck with shadow */}
                        <Animated.View style={[styles.truckContainer, {
                            transform: [
                                { translateX: truckX },
                                { translateY: truckY },
                                { scale: truckScale },
                            ],
                        }]}>
                            {/* Truck shadow */}
                            <Animated.View style={[styles.truckShadow, {
                                opacity: shadowOpacity,
                            }]} />

                            {/* Truck body */}
                            <Animated.View style={{
                                transform: [{
                                    rotate: truckRotation.interpolate({
                                        inputRange: [-0.5, 0, 0.3],
                                        outputRange: ['-0.5deg', '0deg', '0.3deg'],
                                    })
                                }],
                            }}>
                                {/* Realistic Professional Truck */}
                                <View style={styles.realisticTruck}>
                                    {/* Truck Cabin */}
                                    <View style={styles.truckCabin}>
                                        <View style={styles.cabinTop} />
                                        <View style={styles.cabinWindow} />
                                        <View style={styles.cabinBody} />
                                        <View style={[styles.cabinHighlight, { backgroundColor: accentColor }]} />
                                    </View>

                                    {/* Truck Trailer */}
                                    <View style={styles.truckTrailer}>
                                        <View style={styles.trailerBody} />
                                        <View style={styles.trailerRoof} />
                                        <View style={[styles.trailerStripe, { backgroundColor: accentColor }]} />
                                        <View style={styles.trailerShadow} />

                                        {/* Trailer details */}
                                        <View style={styles.trailerRibs}>
                                            {[...Array(8)].map((_, i) => (
                                                <View key={i} style={styles.trailerRib} />
                                            ))}
                                        </View>
                                    </View>

                                    {/* Front Wheels */}
                                    <View style={[styles.wheel, styles.wheelFront]}>
                                        <View style={styles.wheelRim} />
                                        <View style={styles.wheelHub} />
                                    </View>

                                    {/* Back Wheels (dual) */}
                                    <View style={[styles.wheel, styles.wheelBack]}>
                                        <View style={styles.wheelRim} />
                                        <View style={styles.wheelHub} />
                                    </View>
                                    <View style={[styles.wheel, styles.wheelBack, { left: 30 }]}>
                                        <View style={styles.wheelRim} />
                                        <View style={styles.wheelHub} />
                                    </View>

                                    {/* Headlights */}
                                    <View style={[styles.headlightRealistic, {
                                        backgroundColor: '#FEF08A',
                                    }]} />
                                    <View style={[styles.headlightRealistic, {
                                        backgroundColor: '#FEF08A',
                                        top: 24,
                                    }]} />

                                    {/* Front Grill */}
                                    <View style={styles.frontGrill} />

                                    {/* Exhaust pipe */}
                                    <View style={styles.exhaustPipe} />
                                </View>
                            </Animated.View>

                            {/* Motion lines for speed effect */}
                            <View style={styles.motionLines}>
                                <View style={[styles.motionLine, { width: 20, opacity: 0.3 }]} />
                                <View style={[styles.motionLine, { width: 15, opacity: 0.2, marginTop: 4 }]} />
                                <View style={[styles.motionLine, { width: 25, opacity: 0.25, marginTop: 4 }]} />
                            </View>
                        </Animated.View>
                    </Animated.View>

                    {/* Mode Label Badge */}
                    <Animated.View style={[styles.labelContainer, {
                        opacity: labelOpacity,
                        transform: [{ scale: labelScale }],
                    }]}>
                        <View style={[styles.labelPill, {
                            backgroundColor: '#FFFFFF',
                            borderColor: accentColor,
                            shadowColor: accentColor,
                        }]}>
                            <View style={[styles.labelDot, { backgroundColor: accentColor }]} />
                            <Text style={[styles.labelText, { color: accentColor }]}>
                                {modeLabel}
                            </Text>
                        </View>
                        <View style={[styles.subLabelContainer, { backgroundColor: accentLight }]}>
                            <Text style={[styles.sublabel, { color: accentColor }]}>
                                {isTrucker ? 'Loading your trucks and routes' : 'Finding available loads'}
                            </Text>
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Sky layers
    skyGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    skyTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '35%',
        backgroundColor: '#BFDBFE',
    },
    skyMiddle: {
        position: 'absolute',
        top: '35%',
        left: 0,
        right: 0,
        height: '25%',
        backgroundColor: '#DBEAFE',
    },
    skyHorizon: {
        position: 'absolute',
        top: '60%',
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: '#EFF6FF',
    },

    // Sun
    sun: {
        position: 'absolute',
        top: SCREEN_H * 0.15,
        right: SCREEN_W * 0.2,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FCD34D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sunGlow: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF3C7',
        opacity: 0.4,
        position: 'absolute',
    },

    // Clouds
    cloudsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCREEN_W * 2,
        height: SCREEN_H * 0.4,
    },
    cloud: {
        position: 'absolute',
        fontSize: 36,
        opacity: 0.85,
    },

    // Road
    roadContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 120,
        top: SCREEN_H * 0.42,
    },
    roadPerspective: {
        height: '100%',
        width: '100%',
    },
    road: {
        height: 85,
        backgroundColor: '#52525B',
        justifyContent: 'center',
        overflow: 'hidden',
        borderTopWidth: 3,
        borderBottomWidth: 3,
        borderColor: '#3F3F46',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    yellowLineTop: {
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#FBBF24',
    },
    yellowLineBottom: {
        position: 'absolute',
        bottom: 4,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#FBBF24',
    },
    dashContainer: {
        flexDirection: 'row',
        position: 'absolute',
        left: -50,
        alignItems: 'center',
    },
    dash: {
        width: 30,
        height: 4,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 10,
        borderRadius: 2,
    },
    roadTexture: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    roadShadow: {
        position: 'absolute',
        top: -15,
        left: 0,
        right: 0,
        height: 15,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },

    // Truck
    truckContainer: {
        position: 'absolute',
        top: -25,
        alignItems: 'center',
    },
    truckShadow: {
        position: 'absolute',
        bottom: -35,
        width: 90,
        height: 25,
        borderRadius: 45,
        backgroundColor: '#000',
        opacity: 0.25,
        transform: [{ scaleX: 1.2 }],
    },

    // Realistic Professional Truck Design
    realisticTruck: {
        width: 120,
        height: 50,
        position: 'relative',
    },

    // Truck Cabin (front part)
    truckCabin: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 35,
        height: 40,
        zIndex: 3,
    },
    cabinTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
        backgroundColor: '#1E3A8A',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cabinWindow: {
        position: 'absolute',
        top: 2,
        left: 3,
        right: 3,
        height: 8,
        backgroundColor: '#7DD3FC',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 3,
        opacity: 0.85,
    },
    cabinBody: {
        position: 'absolute',
        top: 12,
        left: 0,
        right: 0,
        height: 28,
        backgroundColor: '#1D4ED8',
        borderBottomRightRadius: 3,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: -1, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
        }),
    },
    cabinHighlight: {
        position: 'absolute',
        top: 14,
        right: 2,
        width: 3,
        height: 20,
        backgroundColor: '#60A5FA',
        borderRadius: 1.5,
        opacity: 0.5,
    },

    // Truck Trailer (container part)
    truckTrailer: {
        position: 'absolute',
        left: 0,
        top: 8,
        width: 90,
        height: 38,
        zIndex: 2,
    },
    trailerBody: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 2,
        bottom: 0,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    trailerRoof: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 3,
        backgroundColor: '#E5E7EB',
        borderTopLeftRadius: 2,
    },
    trailerStripe: {
        position: 'absolute',
        left: 5,
        right: 5,
        top: 14,
        height: 5,
        backgroundColor: '#3B82F6',
        borderRadius: 2.5,
        opacity: 0.9,
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
        }),
    },
    trailerShadow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 8,
        backgroundColor: '#000',
        opacity: 0.08,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
    },
    trailerRibs: {
        position: 'absolute',
        left: 8,
        right: 8,
        top: 4,
        bottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    trailerRib: {
        width: 1,
        height: '100%',
        backgroundColor: '#D1D5DB',
        opacity: 0.5,
    },

    // Wheels
    wheel: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#27272A',
        bottom: -8,
        zIndex: 4,
        borderWidth: 2,
        borderColor: '#18181B',
    },
    wheelFront: {
        right: 8,
    },
    wheelBack: {
        left: 20,
    },
    wheelRim: {
        position: 'absolute',
        top: 2,
        left: 2,
        right: 2,
        bottom: 2,
        borderRadius: 6,
        backgroundColor: '#71717A',
        borderWidth: 1,
        borderColor: '#52525B',
    },
    wheelHub: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#A1A1AA',
        marginTop: -2,
        marginLeft: -2,
    },

    // Headlights
    headlightRealistic: {
        position: 'absolute',
        right: -2,
        top: 18,
        width: 8,
        height: 6,
        borderRadius: 3,
        opacity: 0.9,
        shadowColor: '#FEF08A',
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 20,
        zIndex: 5,
    },

    // Front Grill
    frontGrill: {
        position: 'absolute',
        right: 0,
        top: 26,
        width: 6,
        height: 10,
        backgroundColor: '#18181B',
        borderRadius: 1,
        opacity: 0.8,
    },

    // Exhaust Pipe
    exhaustPipe: {
        position: 'absolute',
        right: 32,
        top: 0,
        width: 3,
        height: 12,
        backgroundColor: '#52525B',
        borderRadius: 1.5,
        borderTopWidth: 1,
        borderTopColor: '#71717A',
    },

    // Motion lines (keep existing)
    motionLines: {
        position: 'absolute',
        left: -40,
        top: 20,
    },
    motionLine: {
        height: 2,
        backgroundColor: '#94A3B8',
        borderRadius: 1,
    },

    // Label
    labelContainer: {
        position: 'absolute',
        bottom: SCREEN_H * 0.25,
        alignItems: 'center',
    },
    labelPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 40,
        borderWidth: 2,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    labelDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    labelText: {
        fontSize: 22,
        fontWeight: '700',
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
        letterSpacing: -0.3,
    },
    subLabelContainer: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    sublabel: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
        letterSpacing: -0.2,
    },
});

export default AnimatedLayoutSwitcher;