import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Clipboard,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import Svg, { Circle, Path, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface RouteParams {
    driverName?: string;
    tmId?: string;
    mobileNumber?: string;
    profileImage?: string;
}

// Professional Success Badge
const AnimatedSuccessBadge = () => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const checkAnim = useRef(new Animated.Value(0)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            // Circle expands
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            // Checkmark appears
            Animated.spring(checkAnim, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Subtle continuous ripple
        Animated.loop(
            Animated.sequence([
                Animated.timing(rippleAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(rippleAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.successBadgeContainer}>
            {/* Subtle Ripple */}
            <Animated.View
                style={[
                    styles.ripple,
                    {
                        opacity: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0],
                        }),
                        transform: [
                            {
                                scale: rippleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 2],
                                }),
                            },
                        ],
                        backgroundColor: '#10B981', // Emerald green ripple
                    },
                ]}
            />

            {/* Main Success Circle */}
            <Animated.View
                style={[
                    styles.successCircle,
                    {
                        transform: [{ scale: scaleAnim }],
                        backgroundColor: '#10B981', // Solid professional green
                        shadowColor: '#10B981',
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        elevation: 8,
                    },
                ]}
            >
                <Animated.View
                    style={{
                        opacity: checkAnim,
                        transform: [
                            {
                                scale: checkAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            },
                        ],
                    }}
                >
                    <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                </Animated.View>
            </Animated.View>
        </View>
    );
};

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};

// Animated Button Component
const AnimatedButton = ({
    onPress,
    style,
    children,
    delay = 0
}: {
    onPress: () => void;
    style: any;
    children: React.ReactNode;
    delay?: number;
}) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={{ flex: 1 }}
        >
            <Animated.View
                style={[
                    style,
                    {
                        opacity: opacityAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};



// Celebration Particle Component
const CelebrationParticle = ({ delay, startX, color, size, duration }: {
    delay: number;
    startX: number;
    color: string;
    size: number;
    duration: number;
}) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                top: 0,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: animValue.interpolate({
                    inputRange: [0, 0.1, 0.8, 1],
                    outputRange: [0, 1, 0.6, 0],
                }),
                transform: [
                    {
                        translateY: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, SCREEN_WIDTH * 0.8],
                        }),
                    },
                    {
                        translateX: animValue.interpolate({
                            inputRange: [0, 0.3, 0.6, 1],
                            outputRange: [0, 30, -20, 10],
                        }),
                    },
                    {
                        rotate: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '720deg'],
                        }),
                    },
                ],
            }}
        />
    );
};

// Celebration Confetti Background
const CelebrationBackground = () => {
    const particles = [
        { delay: 0, startX: SCREEN_WIDTH * 0.1, color: '#00D26A', size: 10, duration: 3000 },
        { delay: 200, startX: SCREEN_WIDTH * 0.25, color: '#FF9500', size: 12, duration: 3500 },
        { delay: 400, startX: SCREEN_WIDTH * 0.4, color: '#5856D6', size: 8, duration: 2800 },
        { delay: 600, startX: SCREEN_WIDTH * 0.55, color: '#FF2D92', size: 11, duration: 3200 },
        { delay: 800, startX: SCREEN_WIDTH * 0.7, color: '#00CED1', size: 9, duration: 3100 },
        { delay: 1000, startX: SCREEN_WIDTH * 0.85, color: '#AF52DE', size: 10, duration: 2900 },
        { delay: 300, startX: SCREEN_WIDTH * 0.15, color: '#FF3B30', size: 8, duration: 3300 },
        { delay: 500, startX: SCREEN_WIDTH * 0.35, color: '#32D74B', size: 12, duration: 3400 },
        { delay: 700, startX: SCREEN_WIDTH * 0.6, color: '#FF9F0A', size: 9, duration: 2700 },
        { delay: 900, startX: SCREEN_WIDTH * 0.8, color: '#30D158', size: 11, duration: 3000 },
        { delay: 100, startX: SCREEN_WIDTH * 0.05, color: '#64D2FF', size: 10, duration: 3100 },
        { delay: 450, startX: SCREEN_WIDTH * 0.45, color: '#BF5AF2', size: 9, duration: 2900 },
        { delay: 750, startX: SCREEN_WIDTH * 0.75, color: '#FFD60A', size: 11, duration: 3200 },
        { delay: 350, startX: SCREEN_WIDTH * 0.2, color: '#FF453A', size: 8, duration: 3000 },
        { delay: 650, startX: SCREEN_WIDTH * 0.9, color: '#5AC8FA', size: 10, duration: 3300 },
    ];

    return (
        <View style={styles.celebrationContainer}>
            {particles.map((particle, index) => (
                <CelebrationParticle key={index} {...particle} />
            ))}
        </View>
    );
};

export default function DriverAddedSuccess() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const route = useRoute();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    useStatusBarStyle('dark-content');

    // Get params from route or use defaults
    const params = (route.params as RouteParams) || {};
    const driverName = params.driverName || 'Nandan Kumar';
    const tmId = params.tmId || 'TM2503UDPR00021';
    const mobileNumber = params.mobileNumber || '+91 98765 43210';
    const profileImage = params.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg';

    const shareMessage = `Download TruckMitr App to get started. Use the below ID & Mobile No. to login:\n\nTM ID: ${tmId}\nMobile: ${mobileNumber}`;

    const handleShareDetails = async () => {
        try {
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const handleCopyDetails = () => {
        Clipboard.setString(`TM ID: ${tmId}\nMobile: ${mobileNumber}`);
        showToast(t('copiedToClipboard', 'Copied to clipboard!'));
    };

    const handleAddAnotherDriver = () => {
        navigation.navigate(STACKS.FOREMAN_ADD_DRIVER as any);
    };

    const handleDone = () => {
        navigation.navigate(STACKS.FOREMAN_HOME as any);
    };

    const handleWhatsAppShare = () => {
        showToast(t('openingWhatsApp', 'Opening WhatsApp...'));
    };

    const handleSMSShare = () => {
        showToast(t('openingSMS', 'Opening SMS...'));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <CelebrationBackground />



            <Space height={safeAreaInsets.top} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Badge */}
                <AnimatedSuccessBadge />

                {/* Title Section */}
                <AnimatedCard delay={300} style={styles.titleContainer}>
                    <Text style={styles.title}>
                        {t('driverAddedSuccessfully', 'Driver Added Successfully!')}
                    </Text>
                    <Text style={styles.subtitle}>
                        Share the details with your driver to get them started on TruckMitr
                    </Text>
                </AnimatedCard>

                {/* Driver Profile Card */}
                <AnimatedCard delay={500} style={styles.driverCard}>
                    <View style={styles.driverInfoRow}>
                        <View style={[styles.profileImageWrapper, { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }]}>
                            <Ionicons name="person" size={32} color="#CBD5E1" />
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            </View>
                        </View>

                        <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>{driverName}</Text>
                            <View style={styles.tmIdBadge}>
                                <Text style={styles.tmIdText}>{tmId}</Text>
                            </View>
                        </View>
                    </View>
                </AnimatedCard>

                {/* Credentials Card */}
                <AnimatedCard delay={700} style={styles.credentialsCard}>


                    <View style={styles.credentialItem}>
                        <View style={[styles.credentialIconBg, { backgroundColor: '#D1FAE5' }]}>
                            <MaterialCommunityIcons
                                name="card-account-details-outline"
                                size={18}
                                color="#059669"
                            />
                        </View>
                        <View style={styles.credentialInfo}>
                            <Text style={styles.credentialLabel}>TruckMitr ID</Text>
                            <Text style={styles.credentialValue}>{tmId}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.copyIconBtn}
                            onPress={() => {
                                Clipboard.setString(tmId);
                                showToast(t('tmIdCopied', 'TM ID copied!'));
                            }}
                        >
                            <Ionicons name="copy-outline" size={18} color="#6366F1" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.credentialDivider} />

                    <View style={styles.credentialItem}>
                        <View style={[styles.credentialIconBg, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="call-outline" size={18} color="#D97706" />
                        </View>
                        <View style={styles.credentialInfo}>
                            <Text style={styles.credentialLabel}>Mobile Number</Text>
                            <Text style={styles.credentialValue}>{mobileNumber}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.copyIconBtn}
                            onPress={() => {
                                Clipboard.setString(mobileNumber);
                                showToast(t('mobileNocopied', 'Mobile No. copied!'));
                            }}
                        >
                            <Ionicons name="copy-outline" size={18} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                </AnimatedCard>

                {/* Share Options Card */}
                <AnimatedCard delay={900} style={styles.shareCard}>
                    <Text style={styles.shareTitle}>Share via</Text>

                    <View style={styles.shareButtonsRow}>
                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={handleWhatsAppShare}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.shareIconWrapper, { backgroundColor: '#BBFACC' }]}>
                                <Ionicons name="logo-whatsapp" size={26} color="#22C55E" />
                            </View>
                            <Text style={styles.shareOptionText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={handleSMSShare}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.shareIconWrapper, { backgroundColor: '#BAE6FD' }]}>
                                <Ionicons name="chatbubble" size={24} color="#0284C7" />
                            </View>
                            <Text style={styles.shareOptionText}>SMS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={handleShareDetails}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.shareIconWrapper, { backgroundColor: '#E9D5FF' }]}>
                                <Ionicons name="share-social" size={24} color="#9333EA" />
                            </View>
                            <Text style={styles.shareOptionText}>More</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOption}
                            onPress={handleCopyDetails}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.shareIconWrapper, { backgroundColor: '#FECACA' }]}>
                                <Ionicons name="copy" size={24} color="#DC2626" />
                            </View>
                            <Text style={styles.shareOptionText}>Copy All</Text>
                        </TouchableOpacity>
                    </View>
                </AnimatedCard>

                {/* Quick Info */}
                <AnimatedCard delay={1100} style={styles.infoCard}>
                    <View style={styles.infoItem}>
                        <View style={styles.infoIconBg}>
                            <Ionicons name="download-outline" size={18} color="#6366F1" />
                        </View>
                        <Text style={styles.infoText}>
                            Driver can download TruckMitr app and login with the shared credentials
                        </Text>
                    </View>
                </AnimatedCard>

                <Space height={120} />
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={[styles.bottomContainer, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
                <View style={styles.buttonRow}>
                    <AnimatedButton
                        onPress={handleDone}
                        style={styles.doneButton}
                        delay={1200}
                    >
                        <Text style={styles.doneButtonText}>Go to Dashboard</Text>
                        <View style={styles.doneButtonIcon}>
                            <Ionicons name="home" size={16} color="#FFFFFF" />
                        </View>
                    </AnimatedButton>

                    <AnimatedButton
                        onPress={handleAddAnotherDriver}
                        style={styles.addAnotherButton}
                        delay={1300}
                    >
                        <Ionicons name="add-circle" size={18} color="#00D26A" />
                        <Text style={styles.addAnotherButtonText}>Add Another Driver</Text>
                    </AnimatedButton>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        alignItems: 'center',
    },
    celebrationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 400,
        overflow: 'hidden',
        pointerEvents: 'none',
    },

    successBadgeContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    ripple: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#00D26A',
    },
    successCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#00D26A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00D26A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    titleContainer: {
        alignItems: 'center',
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    driverCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    driverInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 1,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    tmIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    tmIdText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6366F1',
        marginLeft: 4,
    },
    credentialsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    credentialsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    credentialsIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#C7D2FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    credentialsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    credentialItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    credentialIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    credentialInfo: {
        flex: 1,
    },
    credentialLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    credentialValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    copyIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    credentialDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 14,
    },
    shareCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    shareTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    shareButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    shareOption: {
        alignItems: 'center',
        flex: 1,
    },
    shareIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    shareOptionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
    },
    infoCard: {
        width: '100%',
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#166534',
        lineHeight: 20,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    addAnotherButton: {
        flex: 1,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#00D26A',
        marginLeft: 8,
    },
    addAnotherButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#00D26A',
        marginLeft: 4,
    },
    doneButton: {
        flex: 1,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        borderRadius: 14,
        marginRight: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    doneButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    doneButtonIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
});
