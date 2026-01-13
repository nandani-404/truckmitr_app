import { ActivityIndicator, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, Animated, Pressable, TextInput } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import moment from 'moment';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FullScreenLoader from '@truckmitr/components/fullScreenLoader';
import { playVoiceOnce, stopVoice } from '@truckmitr/src/utils/audio';


type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Premium Success Overlay Component (same as job screen)
const SuccessOverlay = ({ colors, responsiveHeight, responsiveWidth, responsiveFontSize, t }: any) => {
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0)).current;
    const checkOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textSlide = useRef(new Animated.Value(20)).current;
    const ringScale = useRef(new Animated.Value(0.5)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;

    // Confetti particles
    const particles = useRef(
        Array.from({ length: 12 }, () => ({
            x: new Animated.Value(0),
            y: new Animated.Value(0),
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0),
            rotation: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        // Backdrop fade in
        Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Ring animation
        Animated.sequence([
            Animated.delay(100),
            Animated.parallel([
                Animated.spring(ringScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(ringOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Checkmark animation
        Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
                Animated.spring(checkScale, {
                    toValue: 1,
                    tension: 80,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.timing(checkOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Text animation
        Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(textSlide, {
                    toValue: 0,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Confetti particles animation
        particles.forEach((particle, index) => {
            const angle = (index / 12) * Math.PI * 2;
            const distance = 80 + Math.random() * 40;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;

            Animated.sequence([
                Animated.delay(300 + index * 30),
                Animated.parallel([
                    Animated.timing(particle.opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.spring(particle.scale, {
                        toValue: 1,
                        tension: 100,
                        friction: 6,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.x, {
                        toValue: targetX,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.y, {
                        toValue: targetY,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particle.rotation, {
                        toValue: Math.random() * 360,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(particle.opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, []);

    const particleColors = [
        colors.royalBlue,
        '#FFD700',
        '#FF6B6B',
        '#4ECDC4',
        '#A78BFA',
        '#F472B6',
    ];

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: backdropOpacity,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                pointerEvents: 'none',
            }}
        >
            {/* Confetti Particles */}
            {particles.map((particle, index) => (
                <Animated.View
                    key={index}
                    style={{
                        position: 'absolute',
                        width: 12,
                        height: 12,
                        borderRadius: index % 2 === 0 ? 6 : 2,
                        backgroundColor: particleColors[index % particleColors.length],
                        opacity: particle.opacity,
                        transform: [
                            { translateX: particle.x },
                            { translateY: particle.y },
                            { scale: particle.scale },
                            {
                                rotate: particle.rotation.interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg'],
                                }),
                            },
                        ],
                    }}
                />
            ))}

            {/* Animated Ring */}
            <Animated.View
                style={{
                    position: 'absolute',
                    width: responsiveFontSize(18),
                    height: responsiveFontSize(18),
                    borderRadius: responsiveFontSize(9),
                    borderWidth: 3,
                    borderColor: colors.royalBlue + '30',
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                }}
            />

            {/* Success Circle */}
            <Animated.View
                style={{
                    width: responsiveFontSize(14),
                    height: responsiveFontSize(14),
                    borderRadius: responsiveFontSize(7),
                    backgroundColor: colors.royalBlue,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: checkOpacity,
                    transform: [{ scale: checkScale }],
                    shadowColor: colors.royalBlue,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 16,
                    elevation: 12,
                }}
            >
                <Ionicons name="checkmark" size={responsiveFontSize(7)} color={colors.white} />
            </Animated.View>

            {/* Success Text */}
            <Animated.View
                style={{
                    marginTop: responsiveFontSize(3),
                    alignItems: 'center',
                    opacity: textOpacity,
                    transform: [{ translateY: textSlide }],
                }}
            >
                <Text
                    style={{
                        fontSize: responsiveFontSize(2.8),
                        fontWeight: '700',
                        color: colors.black,
                        letterSpacing: -0.5,
                        marginBottom: responsiveFontSize(0.8),
                    }}
                >
                    {t('applicationSubmitted') || 'Application Submitted!'}
                </Text>
                <Text
                    style={{
                        fontSize: responsiveFontSize(1.7),
                        fontWeight: '500',
                        color: colors.blackOpacity(0.6),
                        textAlign: 'center',
                        paddingHorizontal: responsiveFontSize(4),
                    }}
                >
                    {t('applicationSuccessMessage') || 'Your job application has been sent successfully'}
                </Text>
            </Animated.View>
        </Animated.View>
    );
};

// Info Item Component
const InfoItem = ({ icon, label, value, colors, responsiveFontSize, flex }: any) => (
    <View style={{ flex }}>
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: responsiveFontSize(0.8)
        }}>
            {icon}
            <Text style={{
                color: colors.royalBlue,
                fontSize: responsiveFontSize(1.6),
                fontWeight: '600',
                marginLeft: responsiveFontSize(0.8),
                letterSpacing: 0.2
            }}>
                {label}
            </Text>
        </View>
        <Text style={{
            color: colors.blackOpacity(.75),
            fontSize: responsiveFontSize(1.75),
            fontWeight: '500',
            letterSpacing: 0.1
        }}>
            {value}
        </Text>
    </View>
);

// Job Card Component with animations
const JobCard = ({ item, expandedJobs, toggleExpand, checkBoxSelect, _onpressCheckBox, errors, loadingApplyJob, _applyJob, colors, responsiveFontSize, responsiveHeight, responsiveWidth, t, navigation }: any) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isExpanded = expandedJobs[item.id] || false;
    const shortDescription = item?.Job_Description?.length > 200
        ? item?.Job_Description.slice(0, 200) + "..."
        : item?.Job_Description;

    let skills: string[] = [];
    try {
        const parsed = JSON.parse(item?.Preferred_Skills);
        skills = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        skills = [item?.Preferred_Skills];
    }

    return (
        <Animated.View
            style={{
                transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                ],
                opacity: fadeAnim,
            }}
        >
            <View style={[styles.cardContainer, {
                width: responsiveWidth(92),
                backgroundColor: colors.white,
                marginBottom: responsiveHeight(2.5),
                borderRadius: responsiveFontSize(2),
                overflow: 'hidden',
                shadowColor: colors.royalBlue,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 8,
            }]}>
                {/* Gradient Header Accent */}
                <LinearGradient
                    colors={[colors.royalBlue + '15', colors.royalBlue + '05', 'transparent']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: responsiveHeight(15) }}
                />

                {/* Card Content */}
                <View style={{ padding: responsiveFontSize(2.5) }}>
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: responsiveFontSize(2.5),
                                color: colors.black,
                                fontWeight: '700',
                                letterSpacing: -0.5,
                                marginBottom: responsiveFontSize(0.5)
                            }}>
                                {item?.job_title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(0.5) }}>
                                <View style={{
                                    backgroundColor: colors.royalBlue + '15',
                                    paddingHorizontal: responsiveFontSize(1.2),
                                    paddingVertical: responsiveFontSize(0.5),
                                    borderRadius: responsiveFontSize(1),
                                }}>
                                    <Text style={{
                                        fontSize: responsiveFontSize(1.4),
                                        color: colors.royalBlue,
                                        fontWeight: '600'
                                    }}>
                                        ID: {item?.job_id}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={{ marginTop: responsiveFontSize(2) }}>
                        <Text style={{
                            fontSize: responsiveFontSize(1.85),
                            color: colors.blackOpacity(.65),
                            fontWeight: '400',
                            lineHeight: responsiveFontSize(2.8),
                            letterSpacing: 0.2
                        }}>
                            {isExpanded ? item?.Job_Description : shortDescription}
                        </Text>

                        {item?.Job_Description?.length > 200 && (
                            <Pressable
                                onPress={() => toggleExpand(item.id)}
                                style={({ pressed }) => [
                                    styles.expandButton,
                                    {
                                        marginTop: responsiveFontSize(1.5),
                                        opacity: pressed ? 0.6 : 1
                                    }
                                ]}
                            >
                                <Text style={{
                                    fontSize: responsiveFontSize(1.75),
                                    color: colors.royalBlue,
                                    fontWeight: '600',
                                    marginRight: responsiveFontSize(0.5)
                                }}>
                                    {isExpanded ? t("showLess") : t("showMore")}
                                </Text>
                                <FontAwesome6
                                    name={!isExpanded ? 'chevron-down' : 'chevron-up'}
                                    size={12}
                                    color={colors.royalBlue}
                                />
                            </Pressable>
                        )}
                    </View>

                    {/* Info Grid */}
                    <View style={{ marginTop: responsiveFontSize(3) }}>
                        {/* Salary & License */}
                        <View style={styles.infoRow}>
                            <InfoItem
                                icon={<FontAwesome name='rupee' size={16} color={colors.royalBlue} />}
                                label={t(`salary`)}
                                value={item?.Salary_Range}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1.5}
                            />
                            <View style={{ width: responsiveFontSize(2) }} />
                            <InfoItem
                                icon={<MaterialCommunityIcons name='license' size={16} color={colors.royalBlue} />}
                                label={t(`typeOfLicense`)}
                                value={item?.Type_of_License}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1}
                            />
                        </View>

                        {/* Location & No. of Jobs */}
                        <View style={[styles.infoRow, { marginTop: responsiveFontSize(1.5) }]}>
                            <InfoItem
                                icon={<FontAwesome6 name='location-dot' size={16} color={colors.royalBlue} />}
                                label={t(`location`)}
                                value={item?.job_location}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1.5}
                            />
                            <View style={{ width: responsiveFontSize(2) }} />
                            <InfoItem
                                icon={<FontAwesome6 name='business-time' size={16} color={colors.royalBlue} />}
                                label={t(`noOfJobs`)}
                                value={item?.Job_Management}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1}
                            />
                        </View>

                        {/* Experience & Vehicle Type */}
                        <View style={[styles.infoRow, { marginTop: responsiveFontSize(1.5) }]}>
                            <InfoItem
                                icon={<FontAwesome name='trophy' size={16} color={colors.royalBlue} />}
                                label={t(`experience`)}
                                value={item?.Required_Experience}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1.5}
                            />
                            <View style={{ width: responsiveFontSize(2) }} />
                            <InfoItem
                                icon={<FontAwesome6 name='car-rear' size={16} color={colors.royalBlue} />}
                                label={t(`vehicleType`)}
                                value={item?.vehicle_type}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1}
                            />
                        </View>

                        {/* Dates */}
                        <View style={[styles.infoRow, { marginTop: responsiveFontSize(1.5) }]}>
                            <InfoItem
                                icon={<FontAwesome name='calendar-o' size={16} color={colors.royalBlue} />}
                                label={t(`postDate`)}
                                value={moment(item?.Created_at).format("DD-MM-YYYY")}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1.5}
                            />
                            <View style={{ width: responsiveFontSize(2) }} />
                            <InfoItem
                                icon={<FontAwesome name='calendar-minus-o' size={16} color={colors.royalBlue} />}
                                label={t(`lastDate`)}
                                value={item?.Application_Deadline}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                                flex={1}
                            />
                        </View>

                        {/* Skills - Full Width */}
                        {skills?.length > 0 && skills[0] && (
                            <View style={{
                                marginTop: responsiveFontSize(2),
                                backgroundColor: colors.royalBlue + '08',
                                borderRadius: responsiveFontSize(1.5),
                                padding: responsiveFontSize(1.8),
                                borderWidth: 1,
                                borderColor: colors.royalBlue + '15'
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveFontSize(1) }}>
                                    <FontAwesome6 name='child-reaching' size={16} color={colors.royalBlue} />
                                    <Text style={{
                                        color: colors.royalBlue,
                                        fontSize: responsiveFontSize(1.7),
                                        fontWeight: '600',
                                        marginLeft: responsiveFontSize(1)
                                    }}>
                                        {t(`preferredSkills`)}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: responsiveFontSize(1) }}>
                                    {skills.map((skill, index) => (
                                        skill && (
                                            <View key={index} style={{
                                                backgroundColor: colors.white,
                                                paddingHorizontal: responsiveFontSize(1.5),
                                                paddingVertical: responsiveFontSize(0.7),
                                                borderRadius: responsiveFontSize(1.2),
                                                borderWidth: 1,
                                                borderColor: colors.royalBlue + '25'
                                            }}>
                                                <Text style={{
                                                    color: colors.royalBlue,
                                                    fontSize: responsiveFontSize(1.6),
                                                    fontWeight: '500'
                                                }}>
                                                    {skill}
                                                </Text>
                                            </View>
                                        )
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Divider */}
                    <View style={{
                        height: 1,
                        backgroundColor: colors.blackOpacity(.08),
                        marginVertical: responsiveFontSize(3)
                    }} />

                    {/* Consent Checkbox */}
                    <Pressable
                        onPress={() => _onpressCheckBox(item.id)}
                        style={({ pressed }) => [
                            styles.consentContainer,
                            {
                                backgroundColor: checkBoxSelect[item.id]
                                    ? colors.royalBlue + '08'
                                    : colors.blackOpacity(.02),
                                borderRadius: responsiveFontSize(1.5),
                                padding: responsiveFontSize(1.8),
                                borderWidth: 1.5,
                                borderColor: checkBoxSelect[item.id]
                                    ? colors.royalBlue + '30'
                                    : colors.blackOpacity(.08),
                                opacity: pressed ? 0.7 : 1
                            }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={checkBoxSelect[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={26}
                            color={colors.royalBlue}
                            style={{ marginRight: responsiveFontSize(1.5) }}
                        />
                        <Text style={{
                            color: colors.blackOpacity(0.75),
                            fontSize: responsiveFontSize(1.7),
                            flex: 1,
                            lineHeight: responsiveFontSize(2.5),
                            fontWeight: '400'
                        }}>
                            {t(`iAgreeToTruckMitr`)}
                            <Text
                                onPress={() => navigation.navigate(STACKS?.DRIVER_CONSENT)}
                                style={{
                                    color: colors.royalBlue,
                                    fontWeight: '600',
                                    textDecorationLine: 'underline'
                                }}
                            >
                                {' '}{t(`driverConsent`)}
                            </Text>
                            {t(`applyJobPolicy`)}
                        </Text>
                    </Pressable>

                    {/* Error Message */}
                    {errors[item.id]?.checkBox && (
                        <View style={{
                            marginTop: responsiveFontSize(1.5),
                            backgroundColor: colors.error + '10',
                            padding: responsiveFontSize(1.5),
                            borderRadius: responsiveFontSize(1),
                            borderLeftWidth: 3,
                            borderLeftColor: colors.error
                        }}>
                            <Text style={{
                                color: colors.error,
                                fontSize: responsiveFontSize(1.6),
                                fontWeight: '500'
                            }}>
                                {errors[item.id]?.checkBox}
                            </Text>
                        </View>
                    )}

                    {/* Apply Button - Full Width */}
                    <Pressable
                        onPress={() => _applyJob(item?.id)}
                        disabled={loadingApplyJob === item?.id}
                        style={({ pressed }) => [
                            {
                                marginTop: responsiveFontSize(2.5),
                                height: responsiveFontSize(6.5),
                                borderRadius: responsiveFontSize(1.5),
                                overflow: 'hidden',
                                width: '100%',
                                opacity: pressed ? 0.85 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={[colors.royalBlue, colors.royalBlue + 'DD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: colors.royalBlue,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            {loadingApplyJob === item?.id ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <>
                                    <Text style={{
                                        color: colors.white,
                                        fontSize: responsiveFontSize(2.1),
                                        fontWeight: '600',
                                        letterSpacing: 0.5
                                    }}>
                                        {t(`apply`)}
                                    </Text>
                                    <Ionicons
                                        name='send'
                                        size={18}
                                        color={colors.white}
                                        style={{ marginLeft: responsiveFontSize(1.2) }}
                                    />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
};

export default function SuitsJob() {
    const { t } = useTranslation();
    const hasPlayedVoiceRef = React.useRef(false);
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { profileCompletion } = useSelector((state: any) => { return state?.user }) || { profileCompletion: 0 };
    const navigation = useNavigation<NavigatorProp>();
    const dispatch = useDispatch();
    const [recommendedJobsList, setrecommendedJobsList] = useState([])
    const [checkBoxSelect, setCheckBoxSelect] = useState<{ [jobId: number]: boolean }>({});
    const [errors, setErrors] = useState<{ [jobId: number]: { checkBox?: string } }>({});
    const [loadingApplyJob, setloadingApplyJob] = useState(-1)
    const [showLottie, setshowLottie] = useState(false)
    const [isLoading, setIsLoading] = useState(true);
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const _goback = () => {
        navigation.goBack()
    }

    const validate = (jobId: number): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};

        if (!checkBoxSelect[jobId]) {
            newErrors.checkBox = t(`youNeedToAcceptTruckMitr`);
            valid = false;
        }
        setErrors(prev => ({ ...prev, [jobId]: newErrors }));
        return valid;
    };

    const _onpressCheckBox = (jobId: number) => {
        setCheckBoxSelect(prev => ({ ...prev, [jobId]: !prev[jobId] }));
        setErrors(prev => ({ ...prev, [jobId]: { checkBox: undefined } }));
    };

    const _recommendedJobs = async () => {
        try {
            setIsLoading(true);
            const recommendedJobs: any = await axiosInstance.get(
                END_POINTS?.JOB_THAT_SUITS_YOU
            );
            console.log('recommendedJobs:', recommendedJobs?.data?.data);

            if (recommendedJobs?.data?.success) {
                const jobs = recommendedJobs?.data?.data || [];
                setrecommendedJobsList(jobs);

                // Initialize all checkboxes as checked when jobs data loads
                if (jobs.length) {
                    const initialCheckboxState: { [jobId: number]: boolean } = {};
                    jobs.forEach((job: any) => {
                        initialCheckboxState[job.id] = true;
                    });
                    setCheckBoxSelect(initialCheckboxState);
                }
            }
        } catch (error) {
            console.error('Jobs API error:', error);
            showToast('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (profileCompletion < 90 && !hasPlayedVoiceRef.current) {
            hasPlayedVoiceRef.current = true;

            console.log('🔊 Playing profile incomplete voice (MP3)');
            playVoiceOnce('profile_update_voice.mp3');
        }

        return () => {
            stopVoice();
        };
    }, [profileCompletion]);

    useFocusEffect(
        React.useCallback(() => {
            if (profileCompletion >= 90) {
                console.log('🔥 Fetching jobs');
                _recommendedJobs();
            } else {
                console.log('⛔ Profile incomplete, skipping API');
                setIsLoading(false);
                setrecommendedJobsList([]);
            }
        }, [profileCompletion])
    );

    const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>({});

    const toggleExpand = (id: number) => {
        setExpandedJobs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const _applyJob = async (id: any) => {
        if (!validate(id)) return;
        try {
            setloadingApplyJob(id)
            const FormData = require('form-data');
            let data = new FormData();
            data.append('consent_visible_transporter', checkBoxSelect[id] ? 1 : 0);

            const response: any = await axiosInstance.post(END_POINTS?.APPLY_JOB(id), data);
            if (response?.data?.status) {
                setshowLottie(true)
                setTimeout(() => {
                    setshowLottie(false)
                }, 1200);
            } else {
                if (response?.data?.message === "You have reached your cumulative job application limit for your subscriptions.") {
                    dispatch(subscriptionModalAction(true));
                }
                showToast(response?.data?.message)
            }
        } catch (error: any) {
            console.error("Error searching jobs:", error);
            if (error?.response?.status === 403 || error?.response?.data?.message === "You have reached your cumulative job application limit for your subscriptions.") {
                dispatch(subscriptionModalAction(true));
            }
        } finally {
            setloadingApplyJob(-1)
        }
    }

    const _navigateProfileEdit = () => {
        navigation.navigate(STACKS.PROFILE_OVERVIEW);
    };

    // Filter jobs based on search query
    const filteredJobs = recommendedJobsList.filter((job: any) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        const jobTitle = (job?.job_title || '').toLowerCase();
        const jobLocation = (job?.job_location || '').toLowerCase();
        const jobDescription = (job?.Job_Description || '').toLowerCase();
        const vehicleType = (job?.vehicle_type || '').toLowerCase();
        const licenseType = (job?.Type_of_License || '').toLowerCase();
        let skills = '';
        try {
            const parsed = JSON.parse(job?.Preferred_Skills);
            skills = Array.isArray(parsed) ? parsed.join(' ').toLowerCase() : parsed.toLowerCase();
        } catch (e) {
            skills = (job?.Preferred_Skills || '').toLowerCase();
        }
        return (
            jobTitle.includes(query) ||
            jobLocation.includes(query) ||
            jobDescription.includes(query) ||
            vehicleType.includes(query) ||
            licenseType.includes(query) ||
            skills.includes(query)
        );
    });

    return (
        <View style={{ flex: 1, backgroundColor: colors.blackOpacity(.02) }}>
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <Animated.View
                style={{
                    opacity: headerOpacity,
                    backgroundColor: colors.white,
                    paddingHorizontal: responsiveWidth(4),
                    paddingVertical: responsiveHeight(2),
                    borderBottomWidth: 1,
                    borderBottomColor: colors.blackOpacity(.06),
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                }}
            >
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Pressable
                        hitSlop={hitSlop(10)}
                        onPress={_goback}
                        style={({ pressed }) => [{
                            position: 'absolute',
                            left: 0,
                            height: responsiveFontSize(5),
                            width: responsiveFontSize(5),
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.royalBlue + '12',
                            borderRadius: responsiveFontSize(2.5),
                            opacity: pressed ? 0.6 : 1
                        }]}
                    >
                        <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                    </Pressable>

                    <Text style={{
                        fontSize: responsiveFontSize(2.4),
                        color: colors.black,
                        fontWeight: '700',
                        letterSpacing: -0.3
                    }}>
                        {t(`jobsThatSuitsYou`)} {recommendedJobsList.length > 0 && `(${recommendedJobsList.length})`}
                    </Text>
                </View>
            </Animated.View>

            {/* Search Bar - Only show when profile is complete and jobs are loaded */}
            {profileCompletion >= 90 && !isLoading && recommendedJobsList.length > 0 && (
                <View style={{
                    paddingHorizontal: responsiveWidth(4),
                    paddingVertical: responsiveHeight(1.5),
                    backgroundColor: colors.white,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.blackOpacity(0.04),
                        borderRadius: responsiveFontSize(1.5),
                        paddingHorizontal: responsiveFontSize(1.5),
                        height: responsiveFontSize(5.5),
                        borderWidth: 1,
                        borderColor: colors.blackOpacity(0.08),
                    }}>
                        <Feather name="search" size={20} color={colors.blackOpacity(0.5)} />
                        <TextInput
                            style={{
                                flex: 1,
                                marginLeft: responsiveFontSize(1),
                                fontSize: responsiveFontSize(1.8),
                                color: colors.black,
                                paddingVertical: 0,
                            }}
                            placeholder={t('searchJobs', 'Search jobs...')}
                            placeholderTextColor={colors.blackOpacity(0.4)}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable
                                onPress={() => setSearchQuery('')}
                                hitSlop={hitSlop(10)}
                                style={({ pressed }) => [{
                                    padding: responsiveFontSize(0.5),
                                    opacity: pressed ? 0.5 : 1
                                }]}
                            >
                                <Ionicons name="close-circle" size={20} color={colors.blackOpacity(0.4)} />
                            </Pressable>
                        )}
                    </View>
                    {searchQuery.trim() !== '' && (
                        <Text style={{
                            marginTop: responsiveFontSize(1),
                            fontSize: responsiveFontSize(1.5),
                            color: colors.blackOpacity(0.6),
                        }}>
                            {filteredJobs.length} {filteredJobs.length === 1 ? t('jobFound', 'job found') : t('jobsFound', 'jobs found')}
                        </Text>
                    )}
                </View>
            )}

            {/* ================= PROFILE NOT COMPLETED ================= */}
            {profileCompletion < 90 && (
                <View style={{ flex: 1 }}>
                    {/* Profile Incomplete Card */}
                    <View
                        style={{
                            width: responsiveWidth(92),
                            alignSelf: 'center',
                            borderRadius: responsiveFontSize(2),
                            overflow: 'hidden',
                            marginTop: responsiveHeight(2.5),
                            shadowColor: colors.royalBlue,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.12,
                            shadowRadius: 16,
                            elevation: 8,
                            backgroundColor: colors.white,
                        }}
                    >
                        <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            colors={['rgba(166,205,249,0.3)', 'rgba(12,120,240,0.3)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={{ padding: responsiveFontSize(2.5) }}>
                            <Text
                                style={{
                                    color: colors.black,
                                    fontSize: responsiveFontSize(2.2),
                                    fontWeight: '700',
                                    letterSpacing: -0.3,
                                }}
                            >
                                {t('yourProfileIncomplete')}
                            </Text>

                            <View style={{ flexDirection: 'row', marginTop: responsiveFontSize(1.5), alignItems: 'flex-start' }}>
                                <Feather name="info" size={18} color={colors.royalBlue} />
                                <Text
                                    style={{
                                        marginLeft: responsiveFontSize(1),
                                        color: colors.blackOpacity(0.6),
                                        fontSize: responsiveFontSize(1.7),
                                        flex: 1,
                                        lineHeight: responsiveFontSize(2.5),
                                    }}
                                >
                                    {t('profileIncompleteTitle')}
                                </Text>
                            </View>

                            <Pressable
                                onPress={_navigateProfileEdit}
                                style={({ pressed }) => [{
                                    marginTop: responsiveFontSize(2.5),
                                    height: responsiveFontSize(6),
                                    borderRadius: responsiveFontSize(1.5),
                                    overflow: 'hidden',
                                    opacity: pressed ? 0.85 : 1,
                                    transform: [{ scale: pressed ? 0.98 : 1 }]
                                }]}
                            >
                                <LinearGradient
                                    colors={[colors.royalBlue, colors.royalBlue + 'DD']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        flex: 1,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: colors.white,
                                            fontSize: responsiveFontSize(2),
                                            fontWeight: '600',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {t('completeProfile')}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>

                    {/* Illustration + Message */}
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            backgroundColor: colors.white,
                            borderRadius: responsiveFontSize(2.5),
                            padding: responsiveFontSize(4),
                            alignItems: 'center',
                            shadowColor: colors.black,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                            elevation: 5,
                            marginHorizontal: responsiveWidth(8)
                        }}>
                            <Image
                                source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
                                style={{
                                    height: responsiveHeight(12),
                                    width: responsiveWidth(60),
                                    tintColor: colors.blackOpacity(.15),
                                    marginBottom: responsiveHeight(2)
                                }}
                            />
                            <Text
                                style={{
                                    color: colors.blackOpacity(.7),
                                    fontSize: responsiveFontSize(1.9),
                                    textAlign: 'center',
                                    fontWeight: '500',
                                    lineHeight: responsiveFontSize(2.8),
                                }}
                            >
                                {t('youNeedToUpdateYourProfileFirstToSeeJobs')}
                            </Text>
                        </View>
                    </View>
                </View>
            )}


            {profileCompletion >= 90 && isLoading && (
                <FullScreenLoader message={t('fetchingJobsForYou')} />
            )}

            {profileCompletion >= 90 && !isLoading && recommendedJobsList.length > 0 && (
                <View style={{ flex: 1 }}>
                    {filteredJobs.length > 0 ? (
                        <FlatList
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            data={filteredJobs}
                            renderItem={({ item }: any) => (
                                <JobCard
                                    item={item}
                                    expandedJobs={expandedJobs}
                                    toggleExpand={toggleExpand}
                                    checkBoxSelect={checkBoxSelect}
                                    _onpressCheckBox={_onpressCheckBox}
                                    errors={errors}
                                    loadingApplyJob={loadingApplyJob}
                                    _applyJob={_applyJob}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                    responsiveHeight={responsiveHeight}
                                    responsiveWidth={responsiveWidth}
                                    t={t}
                                    navigation={navigation}
                                />
                            )}
                            contentContainerStyle={{
                                paddingHorizontal: responsiveWidth(4),
                                paddingTop: responsiveHeight(1.5),
                                paddingBottom: responsiveHeight(10)
                            }}
                            keyExtractor={(item: any) => item.id.toString()}
                        />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{
                                backgroundColor: colors.white,
                                borderRadius: responsiveFontSize(2.5),
                                padding: responsiveFontSize(4),
                                alignItems: 'center',
                                shadowColor: colors.black,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                elevation: 5,
                                marginHorizontal: responsiveWidth(8)
                            }}>
                                <Feather name="search" size={48} color={colors.blackOpacity(0.15)} />
                                <Text style={{
                                    marginTop: responsiveHeight(2),
                                    color: colors.blackOpacity(.7),
                                    fontSize: responsiveFontSize(2),
                                    textAlign: 'center',
                                    fontWeight: '500',
                                    lineHeight: responsiveFontSize(3)
                                }}>
                                    {t('noJobsMatchSearch', 'No jobs match your search')}
                                </Text>
                                <Text style={{
                                    marginTop: responsiveFontSize(1),
                                    color: colors.blackOpacity(.5),
                                    fontSize: responsiveFontSize(1.6),
                                    textAlign: 'center',
                                }}>
                                    {t('tryDifferentKeywords', 'Try different keywords')}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {profileCompletion >= 90 && !isLoading && recommendedJobsList.length === 0 && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{
                        backgroundColor: colors.white,
                        borderRadius: responsiveFontSize(2.5),
                        padding: responsiveFontSize(4),
                        alignItems: 'center',
                        shadowColor: colors.black,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 5,
                        marginHorizontal: responsiveWidth(8)
                    }}>
                        <Image
                            source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
                            style={{
                                height: responsiveHeight(12),
                                width: responsiveWidth(60),
                                tintColor: colors.blackOpacity(.15),
                                marginBottom: responsiveHeight(2)
                            }}
                        />
                        <Text style={{
                            color: colors.blackOpacity(.7),
                            fontSize: responsiveFontSize(2),
                            textAlign: 'center',
                            fontWeight: '500',
                            lineHeight: responsiveFontSize(3)
                        }}>
                            {t('jobsThatSuitYouNotAvailable')}
                        </Text>
                    </View>
                </View>
            )}

            {/* Premium Success Animation Overlay */}
            {showLottie && (
                <SuccessOverlay
                    colors={colors}
                    responsiveHeight={responsiveHeight}
                    responsiveWidth={responsiveWidth}
                    responsiveFontSize={responsiveFontSize}
                    t={t}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    cardContainer: {
        alignSelf: 'center',
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    consentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
