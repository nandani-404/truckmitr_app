import { Image, Text, TouchableOpacity, View, Linking, Animated, Pressable, ActivityIndicator } from 'react-native'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Space, ScreenHeader } from '@truckmitr/src/app/components';
import { isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { FlatList } from 'react-native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import GreenlinePipelineModal from './GreenlinePipelineModal';
import { useSelector } from 'react-redux';
import ProfileIncompleteModal from '@truckmitr/src/app/components/profile-completion-modal';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Info Item Component
const InfoItem = ({ icon, label, value, colors, responsiveFontSize }: any) => (
    <View style={{ flex: 1 }}>
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: responsiveFontSize(0.5)
        }}>
            {icon}
            <Text style={{
                color: colors.royalBlue,
                fontSize: responsiveFontSize(1.45),
                fontWeight: '600',
                marginLeft: responsiveFontSize(0.6),
            }}>
                {label}
            </Text>
        </View>
        <Text style={{
            color: colors.blackOpacity(0.75),
            fontSize: responsiveFontSize(1.55),
            fontWeight: '500',
        }} numberOfLines={1}>
            {value || '-'}
        </Text>
    </View>
);

// Helper: check if a job's deadline has passed
const isJobClosed = (item: any): boolean => {
    const deadline = item?.job?.Application_Deadline;
    if (!deadline) return false;
    const deadlineDate = moment(deadline, ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD MMM YYYY', 'YYYY-MM-DD HH:mm:ss'], true);
    if (!deadlineDate.isValid()) return false;
    return deadlineDate.endOf('day').isBefore(moment());
};

// Animated Job Card Component
const AppliedJobCard = ({
    item,
    index,
    expandedJobs,
    toggleExpand,
    // callToTransporter,
    colors,
    responsiveFontSize,
    responsiveHeight,
    responsiveWidth,
    onShowStatus,
    t,
}: any) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                delay: index * 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const _item = item?.job;
    const isExpanded = expandedJobs[_item?.id] || false;
    const shortDescription = _item?.Job_Description?.length > 150
        ? _item?.Job_Description.slice(0, 150) + "..."
        : _item?.Job_Description;

    let skills: string[] = [];
    try {
        const parsed = JSON.parse(_item?.Preferred_Skills);
        skills = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        skills = [_item?.Preferred_Skills];
    }

    // Status colors
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return '#10B981'; // Green
            case 'rejected':
                return '#EF4444'; // Red
            case 'pending':
            default:
                return '#F59E0B'; // Amber
        }
    };

    const statusColor = getStatusColor(item?.accept_reject_status);
    const closed = isJobClosed(item);
    const jobStatusColor = closed ? '#EF4444' : '#10B981';
    const jobStatusLabel = closed ? (t('closed', 'Closed')) : (t('open', 'Open'));

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
            <View style={{
                width: responsiveWidth(92),
                backgroundColor: colors.white,
                marginBottom: responsiveHeight(2),
                borderRadius: responsiveFontSize(2.2),
                overflow: 'hidden',
                shadowColor: colors.royalBlue,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 14,
                elevation: 6,
                alignSelf: 'center',
            }}>
                {/* Status Badge at Top */}
                <View style={{
                    backgroundColor: statusColor + '15',
                    paddingVertical: responsiveFontSize(0.8),
                    paddingHorizontal: responsiveFontSize(1.5),
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: statusColor,
                            marginRight: responsiveFontSize(0.8),
                        }} />
                        <Text style={{
                            fontSize: responsiveFontSize(1.5),
                            fontWeight: '600',
                            color: statusColor,
                            textTransform: 'capitalize',
                        }}>
                            {item?.accept_reject_status?.toLowerCase() === 'accepted'
                                ? t('acceptedByDriver')
                                : (item?.accept_reject_status?.toLowerCase() === 'pending' || !item?.accept_reject_status)
                                    ? t('pendingFromTransporter')
                                    : item?.accept_reject_status}
                        </Text>
                    </View>
                    {/* Job Open/Closed Badge */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: jobStatusColor + '18',
                        paddingHorizontal: responsiveFontSize(0.9),
                        paddingVertical: responsiveFontSize(0.3),
                        borderRadius: responsiveFontSize(0.8),
                    }}>
                        <View style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: jobStatusColor,
                            marginRight: responsiveFontSize(0.4),
                        }} />
                        <Text style={{
                            fontSize: responsiveFontSize(1.25),
                            fontWeight: '700',
                            color: jobStatusColor,
                        }}>
                            {jobStatusLabel}
                        </Text>
                    </View>
                </View>

                {/* Applied date row */}
                <View style={{
                    paddingHorizontal: responsiveFontSize(1.5),
                    paddingTop: responsiveFontSize(0.5),
                    alignItems: 'flex-end',
                }}>
                    <Text style={{
                        fontSize: responsiveFontSize(1.35),
                        fontWeight: '500',
                        color: colors.blackOpacity(0.5),
                    }}>
                        {t('applied')}: {moment(item?.Created_at).format("DD MMM YYYY")}
                    </Text>
                </View>

                {/* Gradient Accent */}
                <LinearGradient
                    colors={[colors.royalBlue + '08', 'transparent']}
                    style={{ position: 'absolute', top: responsiveFontSize(3.5), left: 0, right: 0, height: responsiveHeight(8) }}
                />

                <View style={{ padding: responsiveFontSize(2.2) }}>
                    {/* Header: Title + Job ID Badge */}
                    <View style={{ marginBottom: responsiveFontSize(1.5) }}>
                        <Text style={{
                            fontSize: responsiveFontSize(2.2),
                            color: colors.black,
                            fontWeight: '700',
                            letterSpacing: -0.3,
                            lineHeight: responsiveFontSize(3),
                        }}>
                            {_item?.job_title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveFontSize(0.8) }}>
                            <View style={{
                                backgroundColor: colors.royalBlue + '15',
                                paddingHorizontal: responsiveFontSize(0.8),
                                paddingVertical: responsiveFontSize(0.35),
                                borderRadius: responsiveFontSize(0.6),
                            }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.3),
                                    color: colors.royalBlue,
                                    fontWeight: '600'
                                }}>
                                    {_item?.job_id}
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: colors.blackOpacity(0.05),
                                paddingHorizontal: responsiveFontSize(0.8),
                                paddingVertical: responsiveFontSize(0.35),
                                borderRadius: responsiveFontSize(0.6),
                                marginLeft: responsiveFontSize(0.6),
                            }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.3),
                                    color: colors.blackOpacity(0.55),
                                    fontWeight: '500'
                                }}>
                                    {moment(_item?.Created_at).format("DD MMM YYYY")}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={{ marginBottom: responsiveFontSize(1.5) }}>
                        <Text style={{
                            fontSize: responsiveFontSize(1.65),
                            color: colors.blackOpacity(0.55),
                            fontWeight: '400',
                            lineHeight: responsiveFontSize(2.4),
                        }}>
                            {isExpanded ? _item?.Job_Description : shortDescription}
                        </Text>
                        {_item?.Job_Description?.length > 150 && (
                            <Pressable
                                onPress={() => toggleExpand(_item?.id)}
                                style={({ pressed }) => [{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: responsiveFontSize(0.8),
                                    opacity: pressed ? 0.6 : 1
                                }]}
                            >
                                <Text style={{
                                    fontSize: responsiveFontSize(1.5),
                                    color: colors.royalBlue,
                                    fontWeight: '600',
                                }}>
                                    {isExpanded ? t("showLess") : t("showMore")}
                                </Text>
                                <FontAwesome6
                                    name={!isExpanded ? 'chevron-down' : 'chevron-up'}
                                    size={10}
                                    color={colors.royalBlue}
                                    style={{ marginLeft: responsiveFontSize(0.4) }}
                                />
                            </Pressable>
                        )}
                    </View>

                    {/* Info Grid */}
                    <View style={{
                        backgroundColor: colors.blackOpacity(0.02),
                        borderRadius: responsiveFontSize(1.2),
                        padding: responsiveFontSize(1.5),
                        marginBottom: responsiveFontSize(1.5),
                    }}>
                        {/* Row 1: Salary & License */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <InfoItem
                                icon={<FontAwesome name='rupee' size={13} color={colors.royalBlue} />}
                                label={t(`salary`)}
                                value={_item?.Salary_Range}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                            />
                            <InfoItem
                                icon={<MaterialCommunityIcons name='license' size={13} color={colors.royalBlue} />}
                                label={t(`typeOfLicense`)}
                                value={_item?.Type_of_License}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                            />
                        </View>

                        {/* Row 2: Location & Experience */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: responsiveFontSize(1.2) }}>
                            <InfoItem
                                icon={<FontAwesome6 name='location-dot' size={13} color={colors.royalBlue} />}
                                label={t(`location`)}
                                value={_item?.job_location}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                            />
                            <InfoItem
                                icon={<FontAwesome name='trophy' size={13} color={colors.royalBlue} />}
                                label={t(`experience`)}
                                value={_item?.Required_Experience}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                            />
                        </View>

                        {/* Row 3: Vehicle & Deadline */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: responsiveFontSize(1.2) }}>
                            <InfoItem
                                icon={<FontAwesome6 name='car-rear' size={13} color={colors.royalBlue} />}
                                label={t(`vehicleType`)}
                                value={_item?.vehicle_type}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                            />
                            <InfoItem
                                icon={<FontAwesome name='calendar-minus-o' size={13} color={colors.royalBlue} />}
                                label={t(`lastDate`)}
                                value={_item?.Application_Deadline}
                                colors={colors}
                                responsiveFontSize={responsiveFontSize}
                            />
                        </View>
                    </View>

                    {/* Conditional Buttons based on sub_id (Only for Open jobs) */}
                    {!closed && (
                        <View style={{ marginTop: responsiveFontSize(0.5) }}>
                            {/* Show Status - Only for greenline */}
                            {_item?.sub_id === 'greenline' && (
                                <Pressable
                                    onPress={onShowStatus}
                                    style={({ pressed }) => [{
                                        height: responsiveFontSize(5.2),
                                        width: '100%',
                                        opacity: pressed ? 0.9 : 1,
                                        transform: [{ scale: pressed ? 0.98 : 1 }],
                                        marginBottom: responsiveFontSize(1),
                                    }]}
                                >
                                    <LinearGradient
                                        colors={['#10B981', '#059669']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: responsiveFontSize(1.2),
                                        }}
                                    >
                                        <Feather
                                            name='activity'
                                            size={16}
                                            color={colors.white}
                                            style={{ marginRight: responsiveFontSize(0.8) }}
                                        />
                                        <Text style={{
                                            color: colors.white,
                                            fontSize: responsiveFontSize(1.7),
                                            fontWeight: '700',
                                            letterSpacing: 0.2
                                        }}>
                                            {t(`showStatus`, 'Show Status')}
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            )}

                            {/* Call History - For greenline and null */}
                            {(_item?.sub_id === 'greenline' || _item?.sub_id === null) && (
                                <Pressable
                                    onPress={() => console.log('Call History tapped for job:', _item?.id)}
                                    style={({ pressed }) => [{
                                        height: responsiveFontSize(5.2),
                                        width: '100%',
                                        opacity: pressed ? 0.9 : 1,
                                        transform: [{ scale: pressed ? 0.98 : 1 }],
                                        marginBottom: responsiveFontSize(1),
                                    }]}
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
                                            borderRadius: responsiveFontSize(1.2),
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name='history'
                                            size={18}
                                            color={colors.white}
                                            style={{ marginRight: responsiveFontSize(0.8) }}
                                        />
                                        <Text style={{
                                            color: colors.white,
                                            fontSize: responsiveFontSize(1.7),
                                            fontWeight: '700',
                                            letterSpacing: 0.2
                                        }}>
                                            {t(`callHistory`, 'Call History')}
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

export default function AppliedJob() {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const { user, profileCompletion, isDriver, isTransporter } = useSelector((state: any) => state?.user) || { user: null, profileCompletion: 0, isDriver: false, isTransporter: false };

    const headerOpacity = useRef(new Animated.Value(0)).current;
    const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

    const _goback = () => {
        navigation.goBack()
    }
    const _navigateProfileEdit = () => {
        if (isDriver) navigation.navigate(STACKS.PROFILE_EDIT);
        if (isTransporter) navigation.navigate(STACKS.PROFILE_EDIT_TRANSPORTER);
    };

    const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>({});
    const [appliedJobsList, setappliedJobsList] = useState<any[]>([])
    const [loading, setloading] = useState(true)
    const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

    // Greenline Status Modal States
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusData, setStatusData] = useState<any>(null);
    const [fetchingStatus, setFetchingStatus] = useState(false);

    // Filter jobs into open and closed based on Application_Deadline
    const openJobs = appliedJobsList.filter(item => !isJobClosed(item));
    const closedJobs = appliedJobsList.filter(item => isJobClosed(item));
    const displayedJobs = activeTab === 'open' ? openJobs : closedJobs;

    const switchTab = (tab: 'open' | 'closed') => {
        setActiveTab(tab);
        Animated.spring(tabIndicatorAnim, {
            toValue: tab === 'open' ? 0 : 1,
            tension: 60,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const _fetchAllAvailableJobs = async () => {
                try {
                    const appliedJobs: any = await axiosInstance.get(END_POINTS?.APPLIED_JOBS);
                    if (appliedJobs?.data?.status) {
                        setappliedJobsList(appliedJobs?.data?.data);
                    }
                    console.log('appliedJobs List ------------->>>', appliedJobs);

                    isJobAccepted()
                } catch (error) {
                    console.error("Error fetching applied jobs:", error);
                } finally {
                    setloading(false)
                }
            };
            _fetchAllAvailableJobs();
        }, [])
    );

    function isJobAccepted(): boolean {
        return appliedJobsList.some(item => item.accept_reject_status?.toLowerCase() === "accepted") && profileCompletion <= 90;
    }

    const toggleExpand = (id: number) => {
        setExpandedJobs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const callToTransporter = async (item: any) => {
        try {
            Linking.openURL(`tel:${item?.transporter_mobile}`)
            console.log(item)
            const formData = new FormData();
            formData.append('id', item.transporter_id);
            formData.append('job_id', item.job_id);
            const response: any = await axiosInstance.post(END_POINTS?.CALL_TRANSPORTER, formData);
            if (response?.data?.status) {
                console.log(response, "response")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleShowStatus = async (item: any) => {
        try {
            setShowStatusModal(true);
            setFetchingStatus(true);
            setStatusData(null);

            const jobId = item?.job?.job_id;
            console.log('Fetching Greenline status for jobId:', jobId);

            const response: any = await axiosInstance.get(END_POINTS.GREENLINE_JOB_STATUS(jobId));
            if (response?.data?.status) {
                setStatusData(response.data);
            } else {
                console.error("Failed to fetch greenline status:", response?.data?.message);
            }
        } catch (error) {
            console.error("Error fetching greenline status:", error);
        } finally {
            setFetchingStatus(false);
        }
    };

    // Tab indicator translateX
    const tabWidth = responsiveWidth(44);
    const indicatorTranslateX = tabIndicatorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, tabWidth],
    });

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <ScreenHeader
                title={t('appliedJobs', 'Applied Jobs')}
                titleCount={appliedJobsList?.length || 0}
            />

            {/* Open / Closed Tab Bar */}
            <View style={{
                flexDirection: 'row',
                marginHorizontal: responsiveWidth(4),
                marginTop: responsiveHeight(1),
                marginBottom: responsiveHeight(0.5),
                backgroundColor: colors.blackOpacity(0.05),
                borderRadius: responsiveFontSize(1.4),
                padding: responsiveFontSize(0.4),
            }}>
                {/* Animated Indicator */}
                <Animated.View style={{
                    position: 'absolute',
                    top: responsiveFontSize(0.4),
                    left: responsiveFontSize(0.4),
                    width: tabWidth,
                    height: '100%',
                    borderRadius: responsiveFontSize(1.1),
                    backgroundColor: colors.white,
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    transform: [{ translateX: indicatorTranslateX }],
                }} />

                {/* Open Tab */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => switchTab('open')}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: responsiveFontSize(1.2),
                        borderRadius: responsiveFontSize(1.1),
                    }}
                >
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: activeTab === 'open' ? '#10B981' : colors.blackOpacity(0.3),
                        marginRight: responsiveFontSize(0.6),
                    }} />
                    <Text style={{
                        fontSize: responsiveFontSize(1.7),
                        fontWeight: activeTab === 'open' ? '700' : '500',
                        color: activeTab === 'open' ? colors.black : colors.blackOpacity(0.45),
                    }}>
                        {t('open', 'Open')}
                    </Text>
                    <View style={{
                        backgroundColor: activeTab === 'open' ? '#10B981' + '20' : colors.blackOpacity(0.08),
                        paddingHorizontal: responsiveFontSize(0.7),
                        paddingVertical: responsiveFontSize(0.15),
                        borderRadius: responsiveFontSize(0.6),
                        marginLeft: responsiveFontSize(0.5),
                    }}>
                        <Text style={{
                            fontSize: responsiveFontSize(1.2),
                            fontWeight: '700',
                            color: activeTab === 'open' ? '#10B981' : colors.blackOpacity(0.4),
                        }}>
                            {openJobs.length}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Closed Tab */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => switchTab('closed')}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: responsiveFontSize(1.2),
                        borderRadius: responsiveFontSize(1.1),
                    }}
                >
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: activeTab === 'closed' ? '#EF4444' : colors.blackOpacity(0.3),
                        marginRight: responsiveFontSize(0.6),
                    }} />
                    <Text style={{
                        fontSize: responsiveFontSize(1.7),
                        fontWeight: activeTab === 'closed' ? '700' : '500',
                        color: activeTab === 'closed' ? colors.black : colors.blackOpacity(0.45),
                    }}>
                        {t('closed', 'Closed')}
                    </Text>
                    <View style={{
                        backgroundColor: activeTab === 'closed' ? '#EF4444' + '20' : colors.blackOpacity(0.08),
                        paddingHorizontal: responsiveFontSize(0.7),
                        paddingVertical: responsiveFontSize(0.15),
                        borderRadius: responsiveFontSize(0.6),
                        marginLeft: responsiveFontSize(0.5),
                    }}>
                        <Text style={{
                            fontSize: responsiveFontSize(1.2),
                            fontWeight: '700',
                            color: activeTab === 'closed' ? '#EF4444' : colors.blackOpacity(0.4),
                        }}>
                            {closedJobs.length}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.royalBlue} />
                    <Text style={{
                        marginTop: responsiveHeight(2),
                        color: colors.blackOpacity(0.5),
                        fontSize: responsiveFontSize(1.6)
                    }}>
                        {t('loading')}...
                    </Text>
                </View>
            ) : displayedJobs?.length ? (
                <FlatList
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={displayedJobs}
                    renderItem={({ item, index }: any) => (
                        <AppliedJobCard
                            item={item}
                            index={index}
                            expandedJobs={expandedJobs}
                            toggleExpand={toggleExpand}
                            callToTransporter={callToTransporter}
                            onShowStatus={() => handleShowStatus(item)}
                            colors={colors}
                            responsiveFontSize={responsiveFontSize}
                            responsiveHeight={responsiveHeight}
                            responsiveWidth={responsiveWidth}
                            t={t}
                        />
                    )}
                    contentContainerStyle={{
                        paddingHorizontal: responsiveWidth(4),
                        paddingTop: responsiveHeight(2),
                        paddingBottom: responsiveHeight(5)
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
                        <View style={{
                            width: responsiveFontSize(10),
                            height: responsiveFontSize(10),
                            borderRadius: responsiveFontSize(5),
                            backgroundColor: (activeTab === 'open' ? '#10B981' : '#EF4444') + '10',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: responsiveHeight(2)
                        }}>
                            <Ionicons
                                name={activeTab === 'open' ? "briefcase-outline" : "close-circle-outline"}
                                size={responsiveFontSize(4)}
                                color={activeTab === 'open' ? '#10B981' : '#EF4444'}
                            />
                        </View>
                        <Text style={{
                            color: colors.black,
                            fontSize: responsiveFontSize(2),
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: responsiveFontSize(1)
                        }}>
                            {activeTab === 'open'
                                ? (t('noOpenJobs', 'No Open Jobs'))
                                : (t('noClosedJobs', 'No Closed Jobs'))}
                        </Text>
                        <Text style={{
                            color: colors.blackOpacity(0.5),
                            fontSize: responsiveFontSize(1.6),
                            fontWeight: '400',
                            textAlign: 'center',
                            lineHeight: responsiveFontSize(2.4)
                        }}>
                            {activeTab === 'open'
                                ? (t('noOpenJobsDesc', 'You don\'t have any open job applications right now'))
                                : (t('noClosedJobsDesc', 'No job applications have passed their deadline yet'))}
                        </Text>
                    </View>
                </View>
            )}

            {/* <ProfileIncompleteModal
                visible={isJobAccepted()}
                onClose={_goback}
                onCompleteProfile={_navigateProfileEdit}
            /> */}
            <GreenlinePipelineModal
                visible={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                data={statusData}
                loading={fetchingStatus}
                onRefresh={() => handleShowStatus({ job: { job_id: statusData?.job_info?.job_id } })}
            />
        </View>
    )
}
