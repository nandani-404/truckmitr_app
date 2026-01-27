import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    interpolate,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { useColor, useImage, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import * as TYPES from '@truckmitr/redux/actions/types';
import { ModuleType } from '@truckmitr/redux/reducers/global/app.reducer';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const { width, height } = Dimensions.get('window');

interface RoleCardProps {
    role: string;
    title: string;
    subtitle: string;
    icon: string;
    gradient: string[];
    delay: number;
    isSelected: boolean;
    onSelect: () => void;
    fullWidth?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
    role,
    title,
    subtitle,
    icon,
    gradient,
    delay,
    isSelected,
    onSelect,
    fullWidth
}) => {
    // ... existing RoleCard implementation ...
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale();
    const colors = useColor();

    const translateY = useSharedValue(100);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
        opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View style={[
            styles.cardContainer,
            fullWidth && styles.cardContainerFull,
            animatedStyle
        ]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onSelect}
                style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                ]}
            >
                <LinearGradient
                    colors={isSelected ? gradient : ['#ffffff', '#f8f9fa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.cardGradient, fullWidth && styles.cardGradientFull]}
                >
                    {/* Icon Container */}
                    <View style={[
                        styles.iconContainer,
                        fullWidth && { marginBottom: 0, marginRight: 16 },
                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : gradient[0] + '20' }
                    ]}>
                        <MaterialCommunityIcons
                            name={icon}
                            size={32}
                            color={isSelected ? '#fff' : gradient[0]}
                        />
                    </View>

                    {/* Text Content */}
                    <View style={fullWidth ? { flex: 1, alignItems: 'flex-start' } : { alignItems: 'center' }}>
                        <Text style={[
                            styles.cardTitle,
                            fullWidth && { textAlign: 'left', marginBottom: 2 },
                            { color: isSelected ? '#fff' : colors.black, fontSize: responsiveFontSize(2) }
                        ]}>
                            {title}
                        </Text>
                        <Text style={[
                            styles.cardSubtitle,
                            fullWidth && { textAlign: 'left' },
                            {
                                color: isSelected ? 'rgba(255,255,255,0.8)' : colors.blackOpacity(0.5),
                                fontSize: role === 'associate' ? responsiveFontSize(1.2) : responsiveFontSize(1.4)
                            }
                        ]}>
                            {subtitle}
                        </Text>
                    </View>

                    {/* Selection Indicator */}
                    {isSelected && (
                        <View style={styles.checkContainer}>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ModuleSelection() {
    const { t } = useTranslation();
    const colors = useColor();
    const images = useImage();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale();
    const dispatch = useDispatch();

    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    // Animation values
    const headerOpacity = useSharedValue(0);
    const headerTranslateY = useSharedValue(-30);
    const buttonScale = useSharedValue(0);

    useEffect(() => {
        headerOpacity.value = withTiming(1, { duration: 600 });
        headerTranslateY.value = withSpring(0, { damping: 15 });
    }, []);

    useEffect(() => {
        if (selectedRole) {
            buttonScale.value = withSpring(1, { damping: 12, stiffness: 150 });
        } else {
            buttonScale.value = withTiming(0, { duration: 200 });
        }
    }, [selectedRole]);

    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ translateY: headerTranslateY.value }],
    }));

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
        opacity: buttonScale.value,
    }));

    const roles = [
        {
            role: 'driver',
            title: t('driver'),
            subtitle: t('driverSubtitle'),
            icon: 'steering',
            gradient: ['#3D5EE1', '#5B7CF7'],
            module: 'hiring'
        },
        {
            role: 'transporter',
            title: t('transporter'),
            subtitle: t('transporterSubtitle'),
            icon: 'truck-fast',
            gradient: ['#00C9A7', '#00E5BD'],
            module: 'hiring'
        },
        {
            role: 'foreman',
            title: t('foreman'),
            subtitle: t('foremanSubtitle'),
            icon: 'account-hard-hat',
            gradient: ['#FF6B6B', '#FF8E8E'],
            module: 'foreman'
        },
        {
            role: 'association',
            title: t('associate'),
            subtitle: t('associateSubtitle'),
            icon: 'account-group',
            gradient: ['#845EC2', '#A178DF'],
            module: 'association'
        },
    ];

    const handleContinue = async () => {
        if (selectedRole) {
            // Find the selected role's module
            const selectedRoleData = roles.find(r => r.role === selectedRole);
            if (selectedRoleData) {
                const module = selectedRoleData.module as ModuleType;
                // Persist to AsyncStorage for one-time selection
                await AsyncStorage.setItem('SELECTED_MODULE', module as string);
                // Dispatch selected module to Redux
                dispatch({ type: TYPES.SET_MODULE, payload: module });
                console.log('💾 Module saved:', module);
            }
            navigation.navigate(STACKS.SIGNUP as any, { preSelectedRole: selectedRole });
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { top: safeAreaInsets.top + 10 }]}
                onPress={handleBack}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={24} color={colors.black} />
            </TouchableOpacity>

            {/* Background Decorations */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            {/* Header */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
                <Image
                    source={images.TRUCKMITR_HORIZONTAL}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.title, { fontSize: responsiveFontSize(3), color: colors.black }]}>
                    {t('iAmA')}
                </Text>
                <Text style={[styles.subtitle, { fontSize: responsiveFontSize(1.7), color: colors.blackOpacity(0.6) }]}>
                    {t('selectYourRole')}
                </Text>
            </Animated.View>

            {/* Role Cards Grid */}
            <View style={styles.cardsContainer}>
                <View style={styles.cardsRow}>
                    {roles.slice(0, 2).map((item, index) => (
                        <RoleCard
                            key={item.role}
                            {...item}
                            delay={100 + index * 100}
                            isSelected={selectedRole === item.role}
                            onSelect={() => setSelectedRole(item.role)}
                        />
                    ))}
                </View>
                <View style={styles.cardsRow}>
                    {roles.slice(2, 4).map((item, index) => (
                        <RoleCard
                            key={item.role}
                            {...item}
                            delay={300 + index * 100}
                            isSelected={selectedRole === item.role}
                            onSelect={() => setSelectedRole(item.role)}
                        />
                    ))}
                </View>
            </View>

            {/* Continue Button */}
            <View style={[styles.buttonContainer, { paddingBottom: safeAreaInsets.bottom + responsiveHeight(2) }]}>
                <Animated.View style={buttonAnimatedStyle}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleContinue}
                        disabled={!selectedRole}
                    >
                        <LinearGradient
                            colors={['#3D5EE1', '#18A9B3']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueButton}
                        >
                            <Text style={styles.continueButtonText}>
                                {t('continue')}
                            </Text>
                            <MaterialCommunityIcons name="arrow-right" size={22} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                    <Text style={[styles.loginText, { color: colors.blackOpacity(0.6) }]}>
                        {t('alreadyRegistered')}{' '}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate(STACKS.LOGIN as any)}>
                        <Text style={[styles.loginLink, { color: colors.royalBlue }]}>
                            {t('login')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bgCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(61, 94, 225, 0.05)',
    },
    bgCircle2: {
        position: 'absolute',
        bottom: 50,
        left: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(24, 169, 179, 0.05)',
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    logo: {
        height: 50,
        width: 180,
        marginBottom: 24,
    },
    title: {
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        lineHeight: 22,
    },
    cardsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        justifyContent: 'center',
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardContainer: {
        width: (width - 44) / 2,
    },
    cardContainerFull: {
        width: '100%',
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardSelected: {
        elevation: 8,
        shadowOpacity: 0.2,
    },
    cardGradient: {
        padding: 20,
        alignItems: 'center',
        minHeight: 160,
        justifyContent: 'center',
    },
    cardGradientFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        minHeight: 100,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSubtitle: {
        textAlign: 'center',
        lineHeight: 18,
    },
    checkContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    buttonContainer: {
        paddingHorizontal: 24,
    },
    continueButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    loginText: {
        fontSize: 15,
    },
    loginLink: {
        fontSize: 16,
        fontWeight: '700',
    },
});

