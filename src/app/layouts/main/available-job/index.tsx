import { ActivityIndicator, Text, TouchableOpacity, View, Animated, StyleSheet, Pressable, Easing, Share } from 'react-native'


import React, { useState, useRef, useEffect } from 'react'
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import moment from 'moment';
import { Image } from 'react-native';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Subscription from '../subscription';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import LinearGradient from 'react-native-linear-gradient';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Job Card Component with clean sectioned design
const JobCard = ({ item, expandedJobs, toggleExpand, checkBoxSelect, _onpressCheckBox, errors, loadingApplyJob, _applyJob, colors, responsiveFontSize, responsiveHeight, responsiveWidth, t, navigation, onShareJob }: any) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous glow animation for text
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();

        // Pulse animation for badge scale
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Shimmer animation
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

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
        ]).start();
    }, []);

    const isExpanded = expandedJobs[item.id] || false;
    const shortDescription = item?.Job_Description?.length > 150
        ? item?.Job_Description.slice(0, 150) + "..."
        : item?.Job_Description;

    const isSuperPremium = item?.subscription_plan_name === 'super_premium_job';
    const isPremium = item?.subscription_plan_name === 'premium_job';

    // Interpolate glow color
    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FFFFFF', '#FFD700']
    });

    const glowShadowRadius = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 12]
    });

    // Badge Component
    const renderBadge = () => {
        if (isSuperPremium) {
            return (
                <Animated.View style={{
                    alignSelf: 'center',
                    marginBottom: responsiveFontSize(1.5),
                    transform: [{ scale: pulseAnim }],
                }}>
                    <View style={{
                        shadowColor: colors.royalBlue,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 12,
                        elevation: 12,
                    }}>
                        <LinearGradient
                            colors={['#4A90D9', colors.royalBlue, '#1a5fb4', '#0d47a1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: responsiveFontSize(2.5),
                                paddingVertical: responsiveFontSize(1.2),
                                borderRadius: responsiveFontSize(3),
                                borderWidth: 1.5,
                                borderColor: '#4A90D9',
                                overflow: 'hidden',
                            }}>
                            {/* Shimmer overlay */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    width: responsiveFontSize(8),
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                    transform: [{
                                        translateX: shimmerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-responsiveFontSize(15), responsiveFontSize(25)]
                                        })
                                    }, {
                                        skewX: '-20deg'
                                    }]
                                }}
                            />
                            <Animated.View style={{
                                shadowColor: '#FFD700',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 1,
                                shadowRadius: glowShadowRadius,
                            }}>
                                <MaterialCommunityIcons name="crown" size={20} color="#FFD700" style={{ marginRight: responsiveFontSize(0.8) }} />
                            </Animated.View>
                            <Animated.Text style={{
                                fontSize: responsiveFontSize(1.6),
                                fontWeight: '800',
                                color: glowColor,
                                letterSpacing: 1.2,
                                textShadowColor: '#FFD700',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: glowShadowRadius,
                            }}>
                                SUPER PREMIUM JOB
                            </Animated.Text>
                        </LinearGradient>
                    </View>
                </Animated.View>
            );
        } else if (isPremium) {
            return (
                <View style={{
                    alignSelf: 'flex-end',
                    marginBottom: responsiveFontSize(1.5),
                    shadowColor: '#FFD700',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                }}>
                    <LinearGradient
                        colors={['#FFE066', '#FFD700', '#DAA520', '#B8860B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: responsiveFontSize(2),
                            paddingVertical: responsiveFontSize(1),
                            borderRadius: responsiveFontSize(3),
                            borderWidth: 1,
                            borderColor: '#DAA520',
                        }}>
                        <MaterialCommunityIcons name="crown" size={18} color="#5C4300" style={{ marginRight: responsiveFontSize(0.6) }} />
                        <Text style={{
                            fontSize: responsiveFontSize(1.5),
                            fontWeight: '800',
                            color: '#5C4300',
                            letterSpacing: 1,
                            textShadowColor: 'rgba(255, 255, 255, 0.4)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2,
                        }}>
                            PREMIUM JOB
                        </Text>
                    </LinearGradient>
                </View>
            );
        } else {
            return (
                <View style={{
                    alignSelf: 'center',
                    marginBottom: responsiveFontSize(1.5),
                }}>
                    <Text style={{
                        fontSize: responsiveFontSize(1.5),
                        fontWeight: '600',
                        color: colors.blackOpacity(0.4),
                        letterSpacing: 1.5,
                    }}>
                        STANDARD JOB
                    </Text>
                </View>
            );
        }
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
            }}
        >
            <View style={[styles.cardContainer, {
                width: responsiveWidth(92),
                backgroundColor: colors.white,
                marginBottom: responsiveHeight(2.5),
                borderRadius: responsiveFontSize(2),
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 5,
            }]}>
                {/* Card Content */}
                <View style={{ padding: responsiveFontSize(2.5) }}>

                    {/* Badge */}
                    {renderBadge()}

                    {/* Title Section with Truck Icon */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: responsiveFontSize(1) }}>
                        <Text style={{ fontSize: responsiveFontSize(3), marginRight: responsiveFontSize(1) }}>🚚</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: responsiveFontSize(2.2),
                                color: colors.black,
                                fontWeight: '700',
                                lineHeight: responsiveFontSize(2.8),
                            }}>
                                {item?.job_title}
                            </Text>
                            <Text style={{
                                fontSize: responsiveFontSize(1.6),
                                color: colors.blackOpacity(0.5),
                                marginTop: responsiveFontSize(0.3),
                            }}>
                                {item?.vehicle_type}
                            </Text>
                        </View>
                    </View>

                    {/* Salary Section */}
                    <View style={{ marginBottom: responsiveFontSize(1.5) }}>
                        <Text style={{
                            fontSize: responsiveFontSize(2),
                            color: colors.black,
                            fontWeight: '600',
                        }}>
                            Monthly Salary: <Text style={{ fontWeight: '700' }}>₹{item?.Salary_Range}</Text>
                        </Text>
                        {item?.Additional_Benefits && (
                            <Text style={{
                                fontSize: responsiveFontSize(1.6),
                                color: colors.blackOpacity(0.6),
                                marginTop: responsiveFontSize(0.5),
                            }}>
                                Additional Benefits: {item?.Additional_Benefits}
                            </Text>
                        )}
                    </View>

                    {/* Job Details Section */}
                    <View style={{
                        backgroundColor: colors.blackOpacity(0.02),
                        borderRadius: responsiveFontSize(1.5),
                        padding: responsiveFontSize(2),
                        marginTop: responsiveFontSize(1),
                    }}>
                        {/* Section Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: responsiveFontSize(2),
                        }}>
                            <MaterialCommunityIcons name="briefcase-outline" size={20} color={colors.royalBlue} />
                            <Text style={{
                                fontSize: responsiveFontSize(2),
                                fontWeight: '700',
                                color: colors.royalBlue,
                                marginLeft: responsiveFontSize(0.8),
                            }}>
                                {t('jobDetails') || 'Job Details'}
                            </Text>
                        </View>

                        {/* Details Grid - Using DetailItem for consistent alignment */}
                        <View style={{ gap: responsiveFontSize(1) }}>
                            {/* Row 1: Job ID & Posted On */}
                            <View style={{ flexDirection: 'row' }}>
                                <DetailItem
                                    icon={<MaterialCommunityIcons name="card-account-details-outline" size={16} color={colors.royalBlue} />}
                                    label="Job ID:"
                                    value={item?.job_id}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                                <DetailItem
                                    icon={<FontAwesome name="calendar" size={14} color={colors.royalBlue} />}
                                    label="Posted On:"
                                    value={moment(item?.Created_at).format("DD MMM YYYY")}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                            </View>

                            {/* Row 2: Location & Open Positions */}
                            <View style={{ flexDirection: 'row' }}>
                                <DetailItem
                                    icon={<FontAwesome6 name="location-dot" size={14} color={colors.royalBlue} />}
                                    label={`${t('location') || 'Location'}:`}
                                    value={item?.job_location}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                                <DetailItem
                                    icon={<FontAwesome6 name="users" size={14} color={colors.royalBlue} />}
                                    label="Open Positions:"
                                    value={item?.number_of_drivers_required || '-'}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                            </View>

                            {/* Row 3: Experience & License */}
                            <View style={{ flexDirection: 'row' }}>
                                <DetailItem
                                    icon={<FontAwesome name="star" size={14} color={colors.royalBlue} />}
                                    label="Experience Required:"
                                    value={`${item?.Required_Experience} Years`}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                                <DetailItem
                                    icon={<MaterialCommunityIcons name="license" size={16} color={colors.royalBlue} />}
                                    label="License Type:"
                                    value={item?.Type_of_License?.toUpperCase()}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                            </View>

                            {/* Row 4: Vehicle Type & Application Deadline */}
                            <View style={{ flexDirection: 'row' }}>
                                <DetailItem
                                    icon={<MaterialCommunityIcons name="truck" size={16} color={colors.royalBlue} />}
                                    label={`${t('vehicleType') || 'Vehicle Type'}:`}
                                    value={item?.vehicle_type}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                                <DetailItem
                                    icon={<FontAwesome name="calendar-check-o" size={14} color={colors.royalBlue} />}
                                    label="Application Deadline:"
                                    value={item?.Application_Deadline || '-'}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                            </View>

                            {/* Row 5: Industry (Moved to bottom to match visual flow) */}
                            <View style={{ flexDirection: 'row' }}>
                                <DetailItem
                                    icon={<MaterialCommunityIcons name="domain" size={16} color={colors.royalBlue} />}
                                    label="Industry:"
                                    value={item?.Industry || 'N/A'}
                                    colors={colors}
                                    responsiveFontSize={responsiveFontSize}
                                />
                                <View style={{ flex: 1 }} />
                            </View>
                        </View>
                    </View>

                    {/* Job Description Section */}
                    <View style={{ marginTop: responsiveFontSize(2) }}>
                        <Text style={{
                            fontSize: responsiveFontSize(1.8),
                            fontWeight: '700',
                            color: colors.royalBlue,
                            marginBottom: responsiveFontSize(1),
                        }}>
                            {t('jobDescription') || 'Job Description'}
                        </Text>
                        <Text style={{
                            fontSize: responsiveFontSize(1.7),
                            color: colors.blackOpacity(0.7),
                            lineHeight: responsiveFontSize(2.5),
                        }}>
                            {isExpanded ? item?.Job_Description : shortDescription}
                        </Text>
                        {item?.Job_Description?.length > 150 && (
                            <Pressable
                                onPress={() => toggleExpand(item.id)}
                                style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(1) }}
                            >
                                <Text style={{
                                    fontSize: responsiveFontSize(1.6),
                                    color: colors.royalBlue,
                                    fontWeight: '600',
                                }}>
                                    ▸ {isExpanded ? t("showLess") : t("readMore") || 'Read More'}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Consent Checkbox */}
                    <Pressable
                        onPress={() => _onpressCheckBox(item.id)}
                        style={({ pressed }) => [{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            backgroundColor: colors.blackOpacity(0.03),
                            borderRadius: responsiveFontSize(1.2),
                            padding: responsiveFontSize(1.5),
                            marginTop: responsiveFontSize(2),
                            opacity: pressed ? 0.7 : 1,
                        }]}
                    >
                        <MaterialCommunityIcons
                            name={checkBoxSelect[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={22}
                            color={colors.royalBlue}
                            style={{ marginRight: responsiveFontSize(1), marginTop: 2 }}
                        />
                        <Text style={{
                            color: colors.blackOpacity(0.7),
                            fontSize: responsiveFontSize(1.5),
                            flex: 1,
                            lineHeight: responsiveFontSize(2.2),
                        }}>
                            I agree to{' '}
                            <Text
                                onPress={() => navigation.navigate(STACKS?.DRIVER_CONSENT)}
                                style={{ color: colors.royalBlue, fontWeight: '600' }}
                            >
                                TruckMitr's terms & conditions
                            </Text>
                            {' '}and allow my details to be shared with the employer or TruckMitr team for job assistance.
                        </Text>
                    </Pressable>

                    {/* Error Message */}
                    {errors[item.id]?.checkBox && (
                        <Text style={{
                            color: colors.error || 'red',
                            fontSize: responsiveFontSize(1.4),
                            marginTop: responsiveFontSize(1),
                        }}>
                            {errors[item.id]?.checkBox}
                        </Text>
                    )}
                </View>

                {/* Bottom Action Buttons Row: Share (30%) + Apply (70%) */}
                <View style={{ flexDirection: 'row', width: '100%' }}>
                    {/* Share Button - 30% */}
                    <Pressable
                        onPress={() => onShareJob(item)}
                        style={({ pressed }) => [{
                            width: '30%',
                            height: responsiveFontSize(6),
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: pressed ? colors.blackOpacity(0.08) : colors.blackOpacity(0.04),
                            borderRightWidth: 1,
                            borderRightColor: colors.blackOpacity(0.1),
                        }]}
                    >
                        <Ionicons name="share-social-outline" size={20} color={colors.royalBlue} />
                        <Text style={{
                            color: colors.royalBlue,
                            fontSize: responsiveFontSize(1.5),
                            fontWeight: '600',
                            marginLeft: responsiveFontSize(0.5),
                        }}>
                            {t('share') || 'Share'}
                        </Text>
                    </Pressable>

                    {/* Apply Button - 70% */}
                    <Pressable
                        onPress={() => _applyJob(item?.id)}
                        disabled={loadingApplyJob === item?.id}
                        style={({ pressed }) => [{
                            width: '70%',
                            height: responsiveFontSize(6),
                            backgroundColor: colors.royalBlue,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            opacity: pressed ? 0.9 : 1,
                        }]}
                    >
                        {loadingApplyJob === item?.id ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <>
                                <Text style={{
                                    color: colors.white,
                                    fontSize: responsiveFontSize(2),
                                    fontWeight: '600',
                                }}>
                                    Apply Now
                                </Text>
                                <Ionicons
                                    name='chevron-forward'
                                    size={20}
                                    color={colors.white}
                                    style={{ marginLeft: responsiveFontSize(0.5) }}
                                />
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
};

// Detail Item Component for Job Details grid - improved alignment
const DetailItem = ({ icon, label, value, colors, responsiveFontSize }: any) => (
    <View style={{ flex: 1, paddingVertical: responsiveFontSize(0.8) }}>
        {/* Label Row with Icon */}
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: responsiveFontSize(0.5),
        }}>
            <View style={{ marginRight: responsiveFontSize(0.6) }}>{icon}</View>
            <Text style={{
                fontSize: responsiveFontSize(1.35),
                color: colors.royalBlue,
                fontWeight: '600',
            }}>
                {label}
            </Text>
        </View>
        {/* Value */}
        <Text style={{
            fontSize: responsiveFontSize(1.55),
            color: colors.black,
            fontWeight: '500',
            paddingLeft: responsiveFontSize(2.4),
        }}>
            {value || '-'}
        </Text>
    </View>
);

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

export default function AvailableJob() {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    const colors = useColor();
    const route = useRoute<any>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    const [loadingApplyJob, setloadingApplyJob] = useState(-1)
    const [showLottie, setshowLottie] = useState(false)
    const [checkBoxSelect, setCheckBoxSelect] = useState<{ [jobId: number]: boolean }>({});
    const [errors, setErrors] = useState<{ [jobId: number]: { checkBox?: string } }>({});
    const [deepLinkJobData, setDeepLinkJobData] = useState<any>(null);
    const [isLoadingDeepLink, setIsLoadingDeepLink] = useState(false);

    const { isDriver, subscriptionDetails, subscriptionModal } = useSelector((state: any) => { return state?.user })

    const { item, jobId: deepLinkJobId } = route?.params || {}

    // Handle deep link - fetch single job by ID using search
    useEffect(() => {
        if (deepLinkJobId && !item) {
            const fetchJobById = async () => {
                try {
                    setIsLoadingDeepLink(true);
                    // Use the search endpoint since there's no single-job endpoint
                    const response: any = await axiosInstance.get(END_POINTS?.ALL_JOBS_AND_SEARCH(deepLinkJobId));
                    if (response?.data?.status && response?.data?.data?.length > 0) {
                        const jobs = response.data.data;
                        // Find exact match by job_id or id
                        const exactMatch = jobs.find((j: any) => 
                            String(j.job_id) === String(deepLinkJobId) || 
                            String(j.id) === String(deepLinkJobId)
                        );
                        setDeepLinkJobData({
                            data: exactMatch ? [exactMatch] : [jobs[0]],
                        });
                    } else {
                        showToast(t('jobNotFound') || 'Job not found');
                    }
                } catch (error: any) {
                    console.error('Error fetching job by ID:', error);
                    showToast(error?.response?.data?.message || t('jobNotFound') || 'Job not found');
                } finally {
                    setIsLoadingDeepLink(false);
                }
            };
            fetchJobById();
        }
    }, [deepLinkJobId]);

    // Use deep link data if no item passed directly
    const jobListData = item || deepLinkJobData;

    const headerOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    // Initialize all checkboxes as checked when jobs data loads
    useEffect(() => {
        const data = jobListData?.data;
        if (data?.length) {
            const initialCheckboxState: { [jobId: number]: boolean } = {};
            data.forEach((job: any) => {
                initialCheckboxState[job.id] = true;
            });
            setCheckBoxSelect(initialCheckboxState);
        }
    }, [jobListData?.data]);

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

    const _goback = () => {
        navigation.goBack()
    }

    // Share Job Handler
    const _shareJob = async (jobItem: any) => {
        try {
            const jobTitle = jobItem?.job_title || 'Job Opening';
            const salary = jobItem?.Salary_Range || '';
            const location = jobItem?.job_location || '';
            const vehicleType = jobItem?.vehicle_type || '';
            const experience = jobItem?.Required_Experience || '';
            const jobId = jobItem?.job_id || jobItem?.id;

            // Build the deep link URL
            const jobDeepLink = `https://truckmitr.com/job/${jobId}`;

            // Build a compelling share message
            const shareMessage = `🚚 ${jobTitle}

💰 Salary: ₹${salary}/month${location ? `\n📍 Location: ${location}` : ''}${vehicleType ? `\n🚛 Vehicle: ${vehicleType}` : ''}${experience ? `\n⭐ Experience: ${experience} Years` : ''}

👉 Apply now on TruckMitr:
${jobDeepLink}

📥 Download TruckMitr: https://play.google.com/store/apps/details?id=com.truckmitr`;

            await Share.share({
                message: shareMessage,
                title: `${jobTitle} - TruckMitr Job`,
            });
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Error sharing job:', error);
            }
        }
    };

    const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>({});

    const toggleExpand = (id: number) => {
        setExpandedJobs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const _applyJob = async (id: any) => {
        if (!validate(id)) return;
        if (subscriptionDetails?.showSubscriptionModel && isDriver) {
            !subscriptionModal && dispatch(subscriptionModalAction(true))
        } else {
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
                showToast(error?.response?.data?.message);
            } finally {
                setloadingApplyJob(-1)
            }
        }
    }

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
                        {t('availableJobs', 'Available Jobs')} ({jobListData?.data?.length || 0})
                    </Text>
                </View>
            </Animated.View>

            {/* Content */}
            {isLoadingDeepLink ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.royalBlue} />
                    <Text style={{
                        color: colors.blackOpacity(0.6),
                        fontSize: responsiveFontSize(1.8),
                        marginTop: responsiveFontSize(2),
                        fontWeight: '500',
                    }}>
                        {t('loadingJob') || 'Loading job...'}
                    </Text>
                </View>
            ) : jobListData?.data?.length ? (
                <View style={{ flex: 1 }}>
                    <FlatList
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={[...jobListData.data].sort((a: any, b: any) => {
                            const getPriority = (plan: string) => {
                                if (plan === 'super_premium_job') return 3;
                                if (plan === 'premium_job') return 2;
                                return 1;
                            };
                            return getPriority(b.subscription_plan_name) - getPriority(a.subscription_plan_name);
                        })}
                        renderItem={({ item: jobItem }: any) => (
                            <JobCard
                                item={jobItem}
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
                                onShareJob={_shareJob}
                            />
                        )}
                        contentContainerStyle={{
                            paddingHorizontal: responsiveWidth(4),
                            paddingTop: responsiveHeight(2.5),
                            paddingBottom: responsiveHeight(10)
                        }}
                        keyExtractor={(item) => item.id.toString()}
                    />
                </View>
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
                        <Image
                            style={{
                                height: responsiveHeight(12),
                                width: responsiveWidth(60),
                                tintColor: colors.blackOpacity(.15),
                                marginBottom: responsiveHeight(2)
                            }}
                            source={{ uri: 'https://truckmitr.com/public/images/preview.png' }}
                        />
                        <Text style={{
                            color: colors.blackOpacity(.7),
                            fontSize: responsiveFontSize(2),
                            textAlign: 'center',
                            fontWeight: '500',
                            lineHeight: responsiveFontSize(3)
                        }}>
                            {t(`weCouldntFindAnyJobsCurrentFilters`)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Success Lottie */}
            {showLottie && (
                <View style={{
                    height: responsiveHeight(100),
                    width: responsiveWidth(100),
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    pointerEvents: 'none',
                    backgroundColor: colors.blackOpacity(0.3)
                }}>
                    <LottieView
                        style={{ height: responsiveHeight(50), width: responsiveWidth(70) }}
                        source={require('@truckmitr/res/lotties/boom.json')}
                        autoPlay
                        loop
                    />
                </View>
            )}

            <Subscription />
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
