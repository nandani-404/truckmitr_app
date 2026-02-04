import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    StatusBar,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
    withRepeat,
    Easing,
    FadeInDown,
    FadeInUp,
    ZoomIn,
    FadeIn,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgGradient, Stop, Polygon } from 'react-native-svg';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import { Space } from '@truckmitr/src/app/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

type CongratsRouteParams = {
    userData: {
        name: string;
        name_eng?: string;
        mobile: string;
        email?: string;
        role: string;
        unique_id: string;
    };
    message: string;
};

// Confetti Particle Component
const ConfettiParticle = ({ delay, startX, color }: { delay: number; startX: number; color: string }) => {
    const translateY = useSharedValue(-50);
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        const randomX = (Math.random() - 0.5) * 100;

        opacity.value = withDelay(delay, withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(2000, withTiming(0, { duration: 500 }))
        ));

        translateY.value = withDelay(delay,
            withTiming(height + 100, { duration: 3000, easing: Easing.out(Easing.quad) })
        );

        translateX.value = withDelay(delay,
            withSequence(
                withTiming(randomX, { duration: 500 }),
                withRepeat(
                    withSequence(
                        withTiming(randomX + 30, { duration: 400 }),
                        withTiming(randomX - 30, { duration: 400 })
                    ),
                    -1,
                    true
                )
            )
        );

        rotate.value = withDelay(delay,
            withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false)
        );

        scale.value = withDelay(delay, withSpring(1, { damping: 10 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: startX,
                    top: 0,
                    width: 12,
                    height: 12,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? 6 : 2,
                },
                animatedStyle,
            ]}
        />
    );
};

// Confetti Container
const ConfettiEffect = () => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#084489', '#18A9B3'];
    const particles = [];

    for (let i = 0; i < 50; i++) {
        particles.push(
            <ConfettiParticle
                key={i}
                delay={Math.random() * 1500}
                startX={Math.random() * width}
                color={colors[Math.floor(Math.random() * colors.length)]}
            />
        );
    }

    return <View style={StyleSheet.absoluteFill} pointerEvents="none">{particles}</View>;
};

// Animated Success Checkmark
const AnimatedCheckmark = () => {
    const scale = useSharedValue(0);
    const checkProgress = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        scale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 100 }));
        checkProgress.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
        glowOpacity.value = withDelay(800, withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1000 }),
                withTiming(0.2, { duration: 1000 })
            ),
            -1,
            true
        ));
        pulseScale.value = withDelay(1000, withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        ));
    }, []);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * pulseScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: 1.3 }],
    }));

    return (
        <Animated.View style={[styles.checkmarkContainer, containerStyle]}>
            {/* Glow effect behind */}
            <Animated.View style={[styles.checkmarkGlow, glowStyle]} />

            {/* Main checkmark circle */}
            <LinearGradient
                colors={['#084489', '#18A9B3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkmarkCircle}
            >
                <Ionicons name="checkmark" size={50} color="white" />
            </LinearGradient>
        </Animated.View>
    );
};

// Floating Stars Background
const FloatingStars = () => {
    const stars = [];

    for (let i = 0; i < 15; i++) {
        const starScale = useSharedValue(0);
        const starOpacity = useSharedValue(0);
        const starY = useSharedValue(0);

        useEffect(() => {
            const delay = Math.random() * 2000;
            starScale.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(1, { duration: 500 }),
                    withTiming(0.5, { duration: 500 })
                ),
                -1,
                true
            ));
            starOpacity.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 1000 }),
                    withTiming(0.2, { duration: 1000 })
                ),
                -1,
                true
            ));
            starY.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(-10, { duration: 2000 }),
                    withTiming(10, { duration: 2000 })
                ),
                -1,
                true
            ));
        }, []);

        const starStyle = useAnimatedStyle(() => ({
            transform: [{ scale: starScale.value }, { translateY: starY.value }],
            opacity: starOpacity.value,
        }));

        stars.push(
            <Animated.View
                key={i}
                style={[
                    {
                        position: 'absolute',
                        left: Math.random() * width,
                        top: Math.random() * height * 0.4,
                    },
                    starStyle,
                ]}
            >
                <Ionicons name="star" size={12 + Math.random() * 8} color="#FFD700" />
            </Animated.View>
        );
    }

    return <View style={StyleSheet.absoluteFill} pointerEvents="none">{stars}</View>;
};

// Sparkle Ring Animation
const SparkleRing = () => {
    const ringScale = useSharedValue(0.5);
    const ringOpacity = useSharedValue(0);

    useEffect(() => {
        ringScale.value = withDelay(500, withRepeat(
            withSequence(
                withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
                withTiming(0.5, { duration: 0 })
            ),
            -1,
            false
        ));
        ringOpacity.value = withDelay(500, withRepeat(
            withSequence(
                withTiming(0.5, { duration: 200 }),
                withTiming(0, { duration: 1800 })
            ),
            -1,
            false
        ));
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    return (
        <Animated.View style={[styles.sparkleRing, ringStyle]}>
            <View style={styles.sparkleRingInner} />
        </Animated.View>
    );
};

export default function Congratulations() {
    const { t, i18n } = useTranslation();
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const dispatch = useDispatch();
    const route = useRoute();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    const { userData, message } = route?.params as CongratsRouteParams;

    // Animations
    const logoScale = useSharedValue(0);
    const logoRotate = useSharedValue(-10);
    const cardScale = useSharedValue(0);
    const cardTranslateY = useSharedValue(50);
    const buttonOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(30);
    const shimmerPosition = useSharedValue(-width);

    useEffect(() => {
        // Logo entrance with bounce
        logoScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 80 }));
        logoRotate.value = withDelay(200, withSequence(
            withTiming(5, { duration: 150 }),
            withTiming(-5, { duration: 150 }),
            withTiming(0, { duration: 150 })
        ));

        // Card entrance
        cardScale.value = withDelay(800, withSpring(1, { damping: 12, stiffness: 100 }));
        cardTranslateY.value = withDelay(800, withSpring(0, { damping: 15 }));

        // Button entrance
        buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
        buttonTranslateY.value = withDelay(1200, withSpring(0, { damping: 12 }));

        // Shimmer effect on card
        shimmerPosition.value = withDelay(1500, withRepeat(
            withTiming(width * 2, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        ));
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: cardScale.value },
            { translateY: cardTranslateY.value },
        ],
    }));

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
        transform: [{ translateY: buttonTranslateY.value }],
    }));

    const copyToClipboard = () => {
        Clipboard.setString(userData?.unique_id || '');
        showToast(t('copied') || 'Copied!');
    };

    const handleCompleteProfile = () => {
        // Dispatch authentication - routes/index.tsx will automatically 
        // render the correct profile completion stack based on selectedModule
        dispatch(userAuthenticatedAction(true));
    };

    // Audio Playback State
    const [audioPaused, setAudioPaused] = useState(false);
    const audioRef = React.useRef<any>(null);

    // Audio file source
    const audioSource = require('@truckmitr/src/assets/voice/congrutulation-screen.mp3');

    // Play/Pause Audio Handler
    const toggleAudio = () => {
        setAudioPaused(!audioPaused);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FBFF" />

            {/* Audio Player (Hidden) - Silent for foreman, association and transporter roles */}
            {i18n.language === 'hi' && userData?.role !== 'foreman' && userData?.role !== 'association' && userData?.role !== 'transporter' && userData?.role !== 'puncture' && (
                <Video
                    source={audioSource}
                    ref={audioRef}
                    paused={audioPaused}
                    style={{ width: 0, height: 0 }}
                    resizeMode="cover"
                    repeat={false}
                    onEnd={() => setAudioPaused(true)}
                    onError={(e) => console.log('Audio Error:', e)}
                />
            )}

            {/* Play/Mute Button - Only for Hindi, hidden for foreman, association and transporter roles */}
            {i18n.language === 'hi' && userData?.role !== 'foreman' && userData?.role !== 'association' && userData?.role !== 'transporter' && userData?.role !== 'puncture' && (
                <TouchableOpacity
                    onPress={toggleAudio}
                    style={{
                        position: 'absolute',
                        top: safeAreaInsets.top + 10,
                        right: 20,
                        zIndex: 100,
                        backgroundColor: colors.white,
                        padding: 8,
                        borderRadius: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    <Ionicons
                        name={audioPaused ? "volume-mute" : "volume-high"}
                        size={24}
                        color={colors.royalBlue}
                    />
                </TouchableOpacity>
            )}

            {/* Gradient Background */}
            <LinearGradient
                colors={['#F8FBFF', '#E8F4FD', '#F0F7FF']}
                style={StyleSheet.absoluteFill}
            />

            {/* Floating Stars */}
            <FloatingStars />

            {/* Confetti Effect */}
            <ConfettiEffect />

            <Space height={safeAreaInsets.top + 20} />

            {/* Animated Checkmark with Sparkle Ring */}
            <View style={styles.checkmarkSection}>
                <SparkleRing />
                <AnimatedCheckmark />
            </View>

            <Space height={responsiveHeight(3)} />

            {/* Logo Section with Animation */}
            <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
                <Image
                    source={require('@truckmitr/src/assets/bootsplash/splash.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </Animated.View>

            <Space height={responsiveHeight(3)} />

            {/* Congratulations Text with Staggered Animation */}
            <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
                <Text style={[styles.congratsText, { color: colors.royalBlue }]}>
                    🎉 {t('congratulations') || 'Congratulations!'} 🎉
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                <Text style={[styles.subText, { color: colors.blackOpacity(0.7) }]}>
                    {message || t('successfullyRegistered') || 'You have been successfully registered.'}
                </Text>
            </Animated.View>

            <Space height={responsiveHeight(4)} />

            {/* TruckMitr ID Card with Shimmer */}
            <Animated.View style={[styles.idCardContainer, cardAnimatedStyle]}>
                <LinearGradient
                    colors={['#FFFFFF', '#F8FBFF']}
                    style={[styles.idCard, { borderColor: colors.royalBlue }]}
                >
                    <View style={styles.idCardHeader}>
                        <Ionicons name="card-outline" size={20} color={colors.royalBlue} />
                        <Text style={[styles.idLabel, { color: colors.blackOpacity(0.7) }]}>
                            {t('yourTruckMitrIdIs') || 'Your TruckMitr ID is'}
                        </Text>
                    </View>

                    <View style={styles.idValueContainer}>
                        <LinearGradient
                            colors={[colors.royalBlue, '#18A9B3']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.idBadge}
                        >
                            <Text allowFontScaling={false} style={styles.idValue}>
                                {userData?.unique_id || 'TM-XXXXXX'}
                            </Text>
                        </LinearGradient>

                        <TouchableOpacity
                            onPress={copyToClipboard}
                            style={styles.copyButton}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={['#E8F4FD', '#D0E8F9']}
                                style={styles.copyButtonInner}
                            >
                                <Ionicons name="copy-outline" size={20} color={colors.royalBlue} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.keepSafeText, { color: colors.blackOpacity(0.5) }]}>
                        Keep this ID safe for future reference
                    </Text>
                </LinearGradient>
            </Animated.View>

            <Space height={responsiveHeight(3)} />

            {/* Complete Profile Message */}
            <Animated.View entering={FadeInUp.delay(1000).duration(500)}>
                <View style={styles.completeMessageContainer}>
                    <Ionicons name="arrow-forward-circle-outline" size={24} color={colors.royalBlue} />
                    <Text allowFontScaling={false} style={[styles.completeText, { color: colors.blackOpacity(0.6) }]}>
                        {t('pleaseCompleteYourProfile') || 'Please complete your profile to continue.'}
                    </Text>
                </View>
            </Animated.View>

            <View style={styles.spacer} />

            {/* Complete Profile Button with Animation */}
            <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
                <TouchableOpacity
                    onPress={handleCompleteProfile}
                    activeOpacity={0.9}
                    style={styles.completeButtonWrapper}
                >
                    <LinearGradient
                        colors={[colors.royalBlue, '#0a5a9e']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.completeButton}
                    >
                        <Text style={styles.buttonText}>
                            {t('completeProfile')?.toUpperCase() || 'COMPLETE PROFILE'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            <Space height={safeAreaInsets.bottom + 30} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F8FBFF',
    },
    checkmarkSection: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
        width: 120,
    },
    checkmarkContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#18A9B3',
    },
    checkmarkCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 15,
    },
    sparkleRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sparkleRingInner: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#18A9B3',
    },
    logoSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: width * 0.65,
        height: 100,
    },
    congratsText: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        letterSpacing: 0.5,
    },
    subText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 24,
        paddingHorizontal: 40,
    },
    idCardContainer: {
        width: '88%',
    },
    idCard: {
        borderRadius: 16,
        borderWidth: 2,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
    },
    idCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    idLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    idValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    idBadge: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    idValue: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: 'white',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    copyButton: {
        marginLeft: 12,
    },
    copyButtonInner: {
        padding: 10,
        borderRadius: 12,
    },
    keepSafeText: {
        fontSize: 12,
        marginTop: 12,
        fontStyle: 'italic',
    },
    completeMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    completeText: {
        fontSize: 15,
        textAlign: 'center',
        marginLeft: 8,
    },
    spacer: {
        flex: 1,
    },
    buttonContainer: {
        width: '88%',
    },
    completeButtonWrapper: {
        borderRadius: 30,
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
    },
    completeButton: {
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    buttonIcon: {
        marginLeft: 10,
    },
});
