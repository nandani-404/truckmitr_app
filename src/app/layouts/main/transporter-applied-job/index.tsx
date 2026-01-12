import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View, Linking, ScrollView, BackHandler, Pressable, Animated, SectionList } from 'react-native'
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConfirmationModal, Space } from '@truckmitr/src/app/components';
import { hitSlop, isIOS } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { FlatList } from 'react-native';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionModalAction } from '@truckmitr/src/redux/actions/user.action';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ZegoSendCallInvitationButton } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Svg, { Circle } from 'react-native-svg';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Default profile image
const DEFAULT_MALE_PROFILE = require('@truckmitr/src/assets/trucks/car_carrier.png');



export default function TransporterAppliedJob() {
    const dispatch = useDispatch()
    const { t } = useTranslation();
    useStatusBarStyle('dark-content')
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { shadow } = useShadow()
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();
    const { user } = useSelector((state: any) => state?.user);
    const [loading, setloading] = useState(true)
    const [appliedJobList, setappliedJobList] = useState<any[]>([])
    const [search, setsearch] = useState('')
    const [acceptJobId, setacceptJobId] = useState<any>(-1)
    const [rejectJobId, setrejectJobId] = useState<any>(-1)
    const [infoModalType, setInfoModalType] = useState<string | null>(null);
    const [accpetRejectLoading, setaccpetRejectLoading] = useState(false)
    const [showVideoInterviewModal, setShowVideoInterviewModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleJob, setScheduleJob] = useState<any>(null);
    const MIN_OFFSET_MINUTES = 15;
    const [selectedInterviewDate, setSelectedInterviewDate] = useState<Date | null>(null);
    const [isDateSelected, setIsDateSelected] = useState(false);
    const [isTimeSelected, setIsTimeSelected] = useState(false);
    const [tempInterviewDate, setTempInterviewDate] = useState<Date | null>(null);
    const [tempIsDateSelected, setTempIsDateSelected] = useState(false);
    const [tempIsTimeSelected, setTempIsTimeSelected] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
    const [jobFilters, setJobFilters] = useState<Record<string, string>>({});
    const [callLoading, setCallLoading] = useState(false);
    const [videoCallLoading, setVideoCallLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const setFilter = (jobId: string, filter: string) => {
        setJobFilters(prev => ({ ...prev, [jobId]: filter }));
    };

    // Bottom Sheet Modal State
    const bottomSheetModalRef = useRef<BottomSheet>(null);
    const [selectedDriverForModal, setSelectedDriverForModal] = useState<any>(null);
    const snapPoints = useMemo(() => ['85%'], []);
    const [sheetIndex, setSheetIndex] = useState(-1);

    // Initial Back Handler
    useEffect(() => {
        const backAction = () => {
            if (sheetIndex >= 0) {
                bottomSheetModalRef.current?.close();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [sheetIndex]);



    // Masking Utility Functions
    const maskAadhar = (aadhar: string) => {
        if (!aadhar || aadhar.length < 4) return 'N/A';
        return `XXXX XXXX ${aadhar.slice(-4)}`;
    };

    const maskLicense = (license: string) => {
        if (!license || license.length < 4) return 'N/A';
        return `${'X'.repeat(Math.max(0, license.length - 4))}${license.slice(-4)}`;
    };

    const maskMobile = (mobile: string) => {
        if (!mobile || mobile.length < 4) return 'N/A';
        return `XXXXXX${mobile.slice(-4)}`;
    };

    const maskEmail = (email: string) => {
        if (!email) return 'N/A';
        const parts = email.split('@');
        if (parts.length !== 2) return 'N/A';
        return `${parts[0][0]}***@${parts[1]}`;
    };

    const maskPan = (pan: string) => {
        if (!pan || pan.length < 4) return 'N/A';
        return `${pan.slice(0, 2)}${'X'.repeat(Math.max(0, pan.length - 4))}${pan.slice(-2)}`;
    };

    // Open Bottom Sheet Modal
    const openDriverProfileModal = useCallback((item: any) => {
        setSelectedDriverForModal(item);
        bottomSheetModalRef.current?.snapToIndex(0); // ✅ fixed height
    }, []);

    // Close Bottom Sheet Modal
    const closeDriverProfileModal = useCallback(() => {
        bottomSheetModalRef.current?.close();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior={'close'}
            />
        ),
        []
    );


    const safeInterviewDate = selectedInterviewDate ?? moment().add(15, 'minutes').toDate();

    const _fetchJobs = async (page: number = 1, isLoadMore: boolean = false) => {
        // return setappliedJobList(MOCK_APPLIED_JOBS as any);
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            }
            const response: any = await axiosInstance.get(`${END_POINTS?.TRANSPORTER_APPLIED_JOBS_LIST}?page=${page}`);
            if (response?.data?.status) {
                const newData = response?.data?.data || [];
                const pagination = response?.data?.pagination;

                if (isLoadMore && page > 1) {
                    // Append to existing list
                    setappliedJobList((prev: any) => [...prev, ...newData]);
                } else {
                    // Replace list
                    setappliedJobList(newData);
                }

                // Update pagination state
                if (pagination) {
                    setCurrentPage(pagination.current_page || 1);
                    setLastPage(pagination.last_page || 1);
                    setTotalCount(pagination.total || 0);
                }

                console.log('data-------------', newData, 'Page:', page, 'Pagination:', pagination);
            } else {
                if (!isLoadMore) {
                    setappliedJobList([]);
                }
            }
        } catch (error) {
            console.error("Error searching jobs:", error);
        } finally {
            setloading(false);
            setLoadingMore(false);
        }
    };

    const _loadMoreJobs = () => {
        if (!loadingMore && currentPage < lastPage) {
            _fetchJobs(currentPage + 1, true);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setloading(true);
            setCurrentPage(1);
            _fetchJobs(1, false);
        }, [])
    );

    const _goback = () => {
        navigation.goBack()
    }


    const _onPressAcceptApplication = async () => {
        try {
            setaccpetRejectLoading(true)
            const formData = new FormData();
            formData.append('status', `Accepted`);  // {`Pending`} {`Accepted`} {`Rejected`}
            const response: any = await axiosInstance.post(END_POINTS?.TRANSPORTER_JOB_ACCEPT_REJECT(acceptJobId), formData);
            if (response?.data?.status) {
                _fetchJobs()
            } else {
                showToast(response?.data?.message)
            }
        } catch (error) {

        } finally {
            setaccpetRejectLoading(false)
            setacceptJobId(-1)
        }
    }
    const _onPressRejectApplication = async () => {
        try {
            setaccpetRejectLoading(true)
            const formData = new FormData();
            formData.append('status', `Rejected`);  // {`Pending`} {`Accepted`} {`Rejected`}
            const response: any = await axiosInstance.post(END_POINTS?.TRANSPORTER_JOB_ACCEPT_REJECT(rejectJobId), formData);
            if (response?.data?.status) {
                _fetchJobs()
            } else {
                showToast(response?.data?.message)
            }
        } catch (error) {

        } finally {
            setaccpetRejectLoading(false)
            setrejectJobId(-1)
        }
    }

    const callToDriver = async (item: any) => {
        console.log('------------------call initiated==========');
        console.log('logged data-------------', 'id', item.driver_details?.driver_id, 'job_id', item.job_id);

        try {
            setCallLoading(true);

            const formData = new FormData();
            formData.append('id', item.driver_details?.driver_id);
            formData.append('job_id', item.job_id);

            const response: any = await axiosInstance.post(END_POINTS?.CALL_TRANSPORTER, formData);
            console.log("response of call driver", response);

            if (response?.data?.success) {
                // Success: Navigate to dial pad with phone number from response
                const phoneNumber = response.data.phone;
                console.log('Call logged successfully, dialing:', phoneNumber);
                // console.log('Call logged successfully, dialing:', phoneNumber);

                Linking.openURL(`tel:${phoneNumber}`);
                showToast(response.data.message || 'Call logged successfully');
            } else {
                // Failed: Still navigate to dial pad with driver's original number
                console.log('Call logging failed, using driver mobile:', item?.driver_details?.driver_mobile);
                Linking.openURL(`tel:${item?.driver_details?.driver_mobile}`);
                showToast(response?.data?.message || 'Call logging failed, but call initiated');
            }

            // Close modal after API response (success or failure)
            closeDriverProfileModal();

        } catch (error) {
            console.log('Error in callToDriver:', error);
            // Error: Navigate to dial pad with driver's original number as fallback
            Linking.openURL(`tel:${item?.driver_details?.driver_mobile}`);
            showToast('Something went wrong, but call initiated');

            // Close modal after error
            closeDriverProfileModal();
        } finally {
            setCallLoading(false);
        }
    }

    // Add useEffect to handle video call logging when call starts
    useEffect(() => {
        // This will run when the component mounts and when selectedDriver changes
        if (showVideoInterviewModal && selectedDriver) {
            console.log('🎥 Video Interview Modal opened for:', selectedDriver?.driver_details?.driver_name);
        }
    }, [showVideoInterviewModal, selectedDriver]);

    const logVideoCallStart = async (driver: any) => {
        try {
            console.log('🎥 Logging video call start for:', driver?.driver_details?.driver_name);
            console.log('🎥 Driver data structure:', driver);
            console.log('🎥 Application ID:', driver?.application_id);
            console.log('🎥 Job ID:', driver?.job_id);

            const formData = new FormData();
            formData.append('id', driver?.application_id?.toString()); // ✅ Fixed: use application_id
            formData.append('job_id', driver?.job_id);
            formData.append('start_at', moment().format('YYYY-MM-DD HH:mm:ss')); // ✅ Added: current timestamp

            console.log('🎥 API Call Data (UPDATED VERSION):', {
                id: driver?.application_id, // application_id
                job_id: driver?.job_id,
                start_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                endpoint: END_POINTS.VIDEO_CALL_TRANSPORTER
            });

            const response = await axiosInstance.post(END_POINTS.VIDEO_CALL_TRANSPORTER, formData);
            console.log('🎥 Video call API response:', response?.data);

            if (response?.data?.success) {
                showToast(response?.data?.message || 'Video call logged successfully');
            } else {
                console.log('🎥 API returned success: false', response?.data);
                showToast(response?.data?.message || 'Failed to log video call');
            }
        } catch (error) {
            console.log('🎥 Error logging video call:', error);
            // if (error) {
            //     console.log('🎥 Error response:', error);
            //     // console.log('🎥 Error status:', error.response.status);
            // }
        }
    };


    const getInterviewUIState = (interviewAt?: string) => {
        if (!interviewAt) {
            return { type: 'NOT_SCHEDULED' };
        }

        const now = moment();
        const interviewTime = moment(interviewAt, 'YYYY-MM-DD HH:mm:ss');

        if (now.isBefore(interviewTime)) {
            return {
                type: 'SCHEDULED_FUTURE',
                label: t('interviewScheduledAt', {
                    dateTime: moment(interviewAt).format('DD MMM YYYY, h:mm A'),
                }),
            };
        }

        return { type: 'READY' };
    };


    const getMinimumTime = () => {
        const nowPlus15 = moment().add(MIN_OFFSET_MINUTES, 'minutes');

        const isToday =
            moment(safeInterviewDate).format('YYYY-MM-DD') ===
            moment().format('YYYY-MM-DD');

        return isToday ? nowPlus15.toDate() : undefined;
    };

    const openScheduleModal = () => {
        setTempInterviewDate(selectedInterviewDate);
        setTempIsDateSelected(isDateSelected);
        setTempIsTimeSelected(isTimeSelected);
        setShowScheduleModal(true);
    };

    const onConfirm = async () => {
        if (!tempIsDateSelected || !tempIsTimeSelected) return;

        // Combine selected date + time into one moment
        const selectedDateTime = moment(tempInterviewDate);

        // Compare with current time
        if (selectedDateTime.isBefore(moment())) {
            showToast(t('pleaseSelectFutureDateAndTime'));
            return;
        }

        try {
            setScheduleLoading(true);
            const formData = new FormData();
            formData.append('applyjobs_id', scheduleJob?.application_id);
            formData.append('job_id', scheduleJob?.job_id);
            formData.append('transporter_id', user?.id || '');
            formData.append('driver_id', scheduleJob?.driver_details?.driver_id || '');
            formData.append('interview_at', selectedDateTime.format('YYYY-MM-DD HH:mm:ss'));

            console.log('----------formdata-------', formData);

            const response: any = await axiosInstance.post(END_POINTS.TRANSPORTER_SCHEDULE_INTERVIEW, formData);
            console.log('Schedule interview API response:', response?.data);

            if (response?.data?.status) {
                showToast(response?.data?.message || 'Interview scheduled successfully');
                // Reset states
                setSelectedInterviewDate(null);
                setIsDateSelected(false);
                setIsTimeSelected(false);
                setTempInterviewDate(null);
                setTempIsDateSelected(false);
                setTempIsTimeSelected(false);

                // Close modal and refresh data
                setShowScheduleModal(false);
                setloading(true);
                _fetchJobs();
            } else {
                showToast(response?.data?.message || 'Failed to schedule interview');
                // Close modal even if API returns error status
                setShowScheduleModal(false);
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
            showToast('Something went wrong');
            // Close modal even on error
            setShowScheduleModal(false);
        } finally {
            setScheduleLoading(false);
        }
    };

    // Helper function to get priority for sorting (higher = shown first)
    const getPaymentPriority = useCallback((item: any) => {
        const driver = item?.driver_details;
        const paymentType = driver?.payments_type || driver?.payment_type || item?.payment_type;
        if (paymentType === 'trusted') return 3;
        if (paymentType === 'verified') return 2;
        if (paymentType === 'job_ready') return 1;
        return 0;
    }, []);

    const groupedJobs = useMemo(() => {
        const grouped = appliedJobList.reduce((acc: any, item: any) => {
            const jobId = item?.job_id;

            if (!acc[jobId]) {
                acc[jobId] = {
                    job_id: jobId,
                    job_title: item?.job_title,
                    applications: [],
                };
            }

            acc[jobId].applications.push(item);
            return acc;
        }, {});

        // Sort applications within each job by payment priority
        Object.values(grouped).forEach((job: any) => {
            job.applications.sort((a: any, b: any) => getPaymentPriority(b) - getPaymentPriority(a));
        });

        return grouped;
    }, [appliedJobList, getPaymentPriority]);

    const jobGroups = useMemo(() => Object.values(groupedJobs), [groupedJobs]);

    const toggleJob = useCallback((jobId: string) => {
        setExpandedJobIds(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    }, []);

    const getDriverTag = useCallback((item: any, index = 0) => {
        // Check subscription data at both item and driver_details level
        const driver = item?.driver_details;

        // Priority order: driver_details level -> item level (payments_type from API)
        const paymentType = (driver?.payments_type || driver?.payment_type || item?.payment_type || '').toString().toLowerCase().trim();
        const amount = item?.amount || item?.subscription_amount || driver?.amount || driver?.subscription_amount;

        // Legacy driver detection (Rs 49 payment or 'subscription' type)
        if (amount === 49 || amount === 49.00 || paymentType === 'subscription') {
            return { label: 'Legacy Driver', color: '#8B4513', isPremium: false, premiumLevel: 0 };
        }

        // Trusted driver (Premium look - Highest tier)
        if (paymentType === 'trusted') {
            return { label: 'Trusted Driver', color: '#7C3AED', isPremium: true, premiumLevel: 2 };
        }

        // Verified driver (Premium look - Lower tier)
        if (paymentType === 'verified') {
            return { label: 'Verified Driver', color: '#2563EB', isPremium: true, premiumLevel: 1 };
        }

        // Job Ready driver
        if (paymentType === 'job_ready' || paymentType === 'job ready' || paymentType === 'jobready') {
            return { label: 'Job Ready Driver', color: '#16A34A', isPremium: false, premiumLevel: 0 };
        }

        // Default fallback - New Driver
        return { label: 'New Driver', color: '#6B7280', isPremium: false, premiumLevel: 0 };
    }, []);



    const DriverApplicationCard = React.memo(({ item, index = 0 }: any) => {
        const [tooltipVisible, setTooltipVisible] = useState(false);
        const fadeAnim = useRef(new Animated.Value(0)).current;
        const timerRef = useRef<any>(null);

        const showTooltip = useCallback(() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setTooltipVisible(true);
            Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true }).start();
            timerRef.current = setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setTooltipVisible(false));
            }, 5000);
        }, [fadeAnim]);

        useEffect(() => {
            const paymentType = (item?.driver_details?.payments_type || item?.payment_type || '').toString().toLowerCase().trim();
            if (paymentType === 'trusted') {
                showTooltip();
            }
            return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        }, [item, showTooltip]);

        const driver = item?.driver_details;

        // ❌ HARD STOP: no TM ID → no UI
        if (!driver?.unique_id) {
            return null;
        }

        const driverName = driver?.driver_name || driver?.name || 'Driver';
        const tmId = driver.unique_id;
        const rating = Number(driver?.rating) || 0;
        const reviewCount = driver?.review_count || 0;
        const driverType = driver?.driver_type || 'Driver';
        const city = driver?.city || '—';
        const state = driver?.states || driver?.state || '—';
        const drivingExp = driver?.driving_exp || driver?.driving_experience || driver?.Driver_Experience || '—';
        const licenseType = (driver?.license_type || driver?.Type_of_License || '—').toUpperCase();
        const licenseNo = driver?.license_no || driver?.License_number || '';
        const licenseExpiry = driver?.license_expiry || driver?.Expiry_date_of_license
            ? moment(driver?.license_expiry || driver?.Expiry_date_of_license).format('DD MMM YYYY')
            : '—';

        // Training status - check if training is fully completed
        const trainingCompleted = driver?.training_completed || driver?.is_training_completed || driver?.training_status === 'completed' || false;

        // Profile image - use UI Avatar if no image available
        const profileImageUri = driver?.driver_picture
            ? `${BASE_URL}public/${driver.driver_picture}`
            : driver?.images
                ? `${BASE_URL}public/${driver.images}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=0D8ABC&color=fff&size=128`;

        // Debug log to see API data
        console.log('Driver API data:', {
            name: driverName,
            profileImageUri,
            driver_picture: driver?.driver_picture,
            ranking: driver?.ranking,
            Driver_Experience: driver?.Driver_Experience,
            Type_of_License: driver?.Type_of_License,
            License_number: driver?.License_number,
            Expiry_date_of_license: driver?.Expiry_date_of_license,
            payments_type: driver?.payments_type,
            // Verification status fields
            dl_name_verified: driver?.dl_name_verified,
            face_match_verified: driver?.face_match_verified,
            court_check_status: driver?.court_check_status,
            address_verification_status: driver?.address_verification_status,
        });

        // Pass full item to check subscription at both levels
        const tag = getDriverTag(item, index);

        // Profile completion - use available data or fallback based on status
        const profileCompletion = driver?.profile_completion ||
            (tag.label === 'Trusted Driver' ? 100 :
                tag.label === 'Verified Driver' ? 85 :
                    tag.label === 'Job Ready Driver' ? 60 : 40);

        // Circular Progress Constants
        const radius = 21;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (profileCompletion / 100) * circumference;

        // Detail Row Component
        const DetailRow = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
            <View style={{ flex: 1, marginBottom: 10 }}>
                <Text style={{ fontSize: responsiveFontSize(1.3), color: colors.blackOpacity(0.5), marginBottom: 2 }}>
                    {label}
                </Text>
                <Text style={{ fontSize: responsiveFontSize(1.5), color: colors.black, fontWeight: '500' }} numberOfLines={1}>
                    {value}
                </Text>
            </View>
        );

        // Premium card wrapper for trusted/verified drivers
        const cardContent = (
            <View style={{
                backgroundColor: colors.white,
                borderRadius: 16,
                padding: 12,
                marginBottom: tag.isPremium ? 0 : 16,
                ...shadow,
                shadowColor: tag.isPremium ? tag.color : colors.blackOpacity(0.1),
                shadowOpacity: tag.isPremium ? (tag.premiumLevel === 2 ? 0.3 : 0.2) : 0.1,
                shadowRadius: tag.isPremium ? (tag.premiumLevel === 2 ? 8 : 6) : 4,
                marginHorizontal: 2,
                borderWidth: tag.isPremium ? (tag.premiumLevel === 2 ? 2 : 1.5) : 0,
                borderColor: tag.isPremium ? tag.color : 'transparent',
            }}>
                {/* Status Badge - Top Right (Hide for premium drivers who have ribbon) */}
                {!tag.isPremium && tag.label !== 'New Driver' && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            if (tag.label === 'Job Ready Driver') setInfoModalType('job_ready');
                            if (tag.label === 'Legacy Driver') setInfoModalType('legacy');
                        }}
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: tag.color,
                            borderRadius: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            zIndex: 1
                        }}>
                        <MaterialIcons name="verified-user" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                            {tag.label}
                        </Text>
                    </TouchableOpacity>
                )}
                {/* UPPER SECTION: Profile + Name + Ribbon Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Profile Image Column */}
                    <View style={{ alignItems: 'center', marginRight: 6 }}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => openDriverProfileModal(item)}
                            style={{ alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}
                        >
                            {/* SVG Ring */}
                            <View style={{ position: 'absolute' }}>
                                <Svg width={48} height={48} viewBox="0 0 48 48">
                                    <Circle cx="24" cy="24" r={radius} stroke="#E5E5E5" strokeWidth="2" fill="none" />
                                    <Circle cx="24" cy="24" r={radius} stroke="#F5A623" strokeWidth="2" fill="none" strokeDasharray={`${circumference}`} strokeDashoffset={`${strokeDashoffset}`} strokeLinecap="round" rotation="-90" origin="24, 24" />
                                </Svg>
                            </View>

                            <Image
                                source={{ uri: profileImageUri }}
                                defaultSource={DEFAULT_MALE_PROFILE}
                                style={{ height: 38, width: 38, borderRadius: 19, resizeMode: 'cover' }}
                            />

                            {/* Percentage Badge */}
                            <View style={{ position: 'absolute', bottom: -3, backgroundColor: '#F5A623', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff', zIndex: 10 }}>
                                <Text style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>{profileCompletion}%</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Star Rating under profile */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesome key={star} name={star <= Math.round(rating) ? 'star' : 'star-o'} size={10} color="#F5A623" style={{ marginHorizontal: 0.5 }} />
                            ))}
                        </View>
                    </View>

                    {/* Name and Rating Info */}
                    <View style={{ flex: 1, marginLeft: 4 }}>
                        {/* Name */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#222222',
                        }} numberOfLines={1}>
                            {driverName}
                        </Text>

                        {/* TM ID */}
                        <Text style={{ fontSize: 10, color: '#666666', marginTop: 0 }}>
                            {tmId}
                        </Text>

                        {/* Training Row - Diamond if completed + Experience */}

                    </View>
                </View >

                {/* DETAILS SECTION - Values only on separate lines */}
                <View style={{ marginTop: 8 }}>
                    {/* Location */}
                    <Text style={{ fontSize: 13, color: '#222222', lineHeight: 18 }}>
                        <Text style={{ fontWeight: '500' }}>Location: </Text>
                        {city !== '—' ? city : ''}{city !== '—' && state !== '—' ? ', ' : ''}{state !== '—' ? state : 'N/A'}
                    </Text>
                    {/* License */}
                    <Text style={{ fontSize: 13, color: '#222222', lineHeight: 18 }}>
                        <Text style={{ fontWeight: '500' }}>License: </Text>
                        {licenseType !== '—' ? licenseType : 'N/A'}
                    </Text>
                    {/* Number */}
                    <Text style={{ fontSize: 13, color: '#222222', lineHeight: 18 }}>
                        <Text style={{ fontWeight: '500' }}>License No.: </Text>
                        {licenseNo ? maskLicense(licenseNo) : 'N/A'}
                    </Text>
                    {/* Exp */}
                    <Text style={{ fontSize: 13, color: '#222222', lineHeight: 18 }}>
                        <Text style={{ fontWeight: '500' }}>License Exp: </Text>
                        {licenseExpiry !== '—' ? licenseExpiry : 'N/A'}
                    </Text>
                </View>

                {/* VERIFICATION + TRUST ROW - Dynamic based on API response */}
                {(() => {
                    // Get verification statuses from driver_details
                    const isIdVerified = driver?.dl_name_verified === 'verified';
                    const isFaceVerified = driver?.face_match_verified === 'verified' || driver?.face_match_verified === true;
                    const isCourtVerified = driver?.court_check_status === 'verified' || driver?.court_check_status?.status === 'verified';
                    const isAddressVerified = driver?.address_verification_status === 'verified' || driver?.address_verification_status?.status === 'verified';

                    // Check if all verifications are complete
                    const isFullyVerified = isIdVerified && isFaceVerified && isCourtVerified && isAddressVerified;

                    return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                            {/* ID Verification */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
                                <MaterialIcons
                                    name={isIdVerified ? "check-circle" : "cancel"}
                                    size={14}
                                    color={isIdVerified ? "#1FA84F" : "#EF4444"}
                                />
                                <Text style={{ marginLeft: 3, fontSize: 12, color: '#222222' }}>ID</Text>
                            </View>

                            {/* Face Verification */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
                                <MaterialIcons
                                    name={isFaceVerified ? "check-circle" : "cancel"}
                                    size={14}
                                    color={isFaceVerified ? "#1FA84F" : "#EF4444"}
                                />
                                <Text style={{ marginLeft: 3, fontSize: 12, color: '#222222' }}>Face</Text>
                            </View>

                            {/* Court Verification */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
                                <MaterialIcons
                                    name={isCourtVerified ? "check-circle" : "cancel"}
                                    size={14}
                                    color={isCourtVerified ? "#1FA84F" : "#EF4444"}
                                />
                                <Text style={{ marginLeft: 3, fontSize: 12, color: '#222222' }}>Court</Text>
                            </View>

                            {/* Digital Address Verification */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
                                <MaterialIcons
                                    name={isAddressVerified ? "check-circle" : "cancel"}
                                    size={14}
                                    color={isAddressVerified ? "#1FA84F" : "#EF4444"}
                                />
                                <Text style={{ marginLeft: 3, fontSize: 12, color: '#222222' }}>Digital Address</Text>
                            </View>

                            {/* Fully Verified Badge - Only show when all 4 verifications are complete */}
                            {isFullyVerified && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="verified-user" size={14} color="#2E7D32" />
                                    <Text style={{ marginLeft: 4, fontSize: 12, color: '#2E7D32' }}>
                                        Fully verified
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })()}

                {/* DIVIDER */}
                < View style={{ height: 1, backgroundColor: '#E5E5E5', marginVertical: 10 }} />



                {/* ACTION BUTTONS */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    {item?.current_status === 'Accepted' ? (
                        item?.interview_at ? (
                            (() => {
                                const isTimeForInterview = moment().isSameOrAfter(moment(item?.interview_at));
                                return (
                                    <TouchableOpacity
                                        activeOpacity={isTimeForInterview ? 0.8 : 1}
                                        onPress={() => {
                                            if (isTimeForInterview) {
                                                setSelectedDriver(item);
                                                setShowVideoInterviewModal(true);
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        <LinearGradient
                                            colors={isTimeForInterview ? ['#8B5CF6', '#6D28D9'] : ['#1E5EFF', '#3B82F6']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                height: 48,
                                                borderRadius: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                paddingHorizontal: 12,
                                            }}
                                        >
                                            <Ionicons name="videocam" size={18} color={colors.white} style={{ marginRight: 8 }} />
                                            <View>
                                                <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.3) }}>
                                                    {isTimeForInterview
                                                        ? (t('startInterview') || 'Start Interview')
                                                        : (t('interviewScheduled') || 'Interview Scheduled')}
                                                </Text>
                                                <Text style={{ color: colors.white, fontWeight: '700', fontSize: responsiveFontSize(1.5) }}>
                                                    {moment(item?.interview_at).format('DD MMM, hh:mm A')}
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })()
                        ) : (
                            <TouchableOpacity
                                activeOpacity={1}
                                style={{ flex: 1 }}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        height: 44,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        opacity: 0.9
                                    }}
                                >
                                    <Ionicons name="checkmark-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
                                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>
                                        {t('accepted')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )
                    ) : item?.current_status === 'Rejected' ? (
                        <TouchableOpacity
                            activeOpacity={1}
                            style={{ flex: 1 }}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    height: 44,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    opacity: 0.9
                                }}
                            >
                                <Ionicons name="close-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
                                <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>
                                    {t('rejected') || 'Rejected'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={() => setrejectJobId(item.application_id)}
                                style={{ flex: 1, marginRight: 12 }}
                            >
                                <LinearGradient
                                    colors={['#FF6B6B', '#E63946']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        height: 44,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <Ionicons name="close-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
                                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>
                                        {t('reject')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setacceptJobId(item.application_id)}
                                style={{ flex: 1 }}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        height: 44,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <Ionicons name="checkmark-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
                                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>
                                        {t('accept')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* VIEW DRIVER DETAILS */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openDriverProfileModal(item)}
                    style={{
                        marginTop: 10,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: colors.blueOpacity(0.08),
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        borderWidth: 1,
                        borderColor: colors.blueOpacity(0.15),
                    }}
                >
                    <Ionicons name="person-circle-outline" size={20} color={colors.royalBlue} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.royalBlue, fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>
                        {t('viewDriverDetails')}
                    </Text>
                </TouchableOpacity>
            </View >
        );

        // Return with premium wrapper if trusted/verified driver
        if (tag.isPremium) {
            // Different gradient colors based on premium level
            const gradientColors = tag.premiumLevel === 2
                ? ['#7C3AED', '#9333EA', '#7C3AED'] // Trusted - Purple
                : ['#2563EB', '#3B82F6', '#2563EB']; // Verified - Blue

            const ribbonText = tag.premiumLevel === 2 ? 'Trusted\nDriver' : 'Verified\nDriver';
            // Ribbon gradient: light blue at top to purple at bottom
            const ribbonGradientColors = tag.premiumLevel === 2
                ? ['#8B5CF6', '#7C3AED', '#5B21B6'] // Royal Purple Gradient
                : ['#60A5FA', '#3B82F6', '#2563EB']; // Light blue -> Blue

            const onCardPress = () => {
                if (tag.premiumLevel === 2) {
                    showTooltip();
                }
            };

            return (
                <Pressable onPress={onCardPress} style={{ marginBottom: 16, overflow: 'visible' }}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            borderRadius: 18,
                            padding: tag.premiumLevel === 2 ? 2 : 1.5,
                        }}
                    >
                        {cardContent}
                    </LinearGradient>

                    {/* Simple Classic Ribbon Badge */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            if (tag.premiumLevel === 2) {
                                setTooltipVisible(false);
                            }
                            if (tag.isPremium) {
                                setInfoModalType(tag.premiumLevel === 2 ? 'trusted' : 'verified');
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: 0, // Flush with top edge
                            right: 16,
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >
                        {tag.premiumLevel === 2 && tooltipVisible && (
                            <Animated.View style={{
                                position: 'absolute',
                                right: 62,
                                top: 18,
                                opacity: fadeAnim,
                                transform: [{ scale: fadeAnim }],
                                backgroundColor: '#FFF',
                                paddingHorizontal: 2,
                                paddingVertical: 4,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#F59E0B',
                                shadowColor: '#F59E0B',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 8,
                                elevation: 8,
                                zIndex: 20,
                            }}>
                                <Text numberOfLines={1} style={{ color: '#F59E0B', fontSize: 10, fontWeight: '700' }}>
                                    Why Trusted?
                                </Text>
                                {/* Arrow pointing right */}
                                <View style={{
                                    position: 'absolute',
                                    right: -5,
                                    top: 6,
                                    width: 0,
                                    height: 0,
                                    borderStyle: 'solid',
                                    borderTopWidth: 4,
                                    borderBottomWidth: 4,
                                    borderLeftWidth: 5,
                                    borderTopColor: 'transparent',
                                    borderBottomColor: 'transparent',
                                    borderLeftColor: '#F59E0B',
                                }} />
                                <View style={{
                                    position: 'absolute',
                                    right: -3.5,
                                    top: 6,
                                    width: 0,
                                    height: 0,
                                    borderStyle: 'solid',
                                    borderTopWidth: 4,
                                    borderBottomWidth: 4,
                                    borderLeftWidth: 5,
                                    borderTopColor: 'transparent',
                                    borderBottomColor: 'transparent',
                                    borderLeftColor: '#FFF',
                                }} />
                            </Animated.View>
                        )}
                        {/* Ribbon Body with Gradient */}
                        <LinearGradient
                            colors={ribbonGradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }} // Vertical gradient for classic look
                            style={{
                                width: 56, // Classic width
                                paddingTop: tag.premiumLevel === 2 ? 6 : 8,
                                paddingBottom: 10,
                                paddingHorizontal: 2,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: tag.premiumLevel === 2 ? '#5B21B6' : '#2563EB',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                elevation: 4,
                            }}
                        >
                            {tag.premiumLevel === 2 && (
                                <MaterialCommunityIcons name="crown" size={14} color="#FFD700" style={{ marginBottom: 2 }} />
                            )}
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: '700',
                                textAlign: 'center',
                                lineHeight: 15,
                                textShadowColor: 'rgba(0, 0, 0, 0.25)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                                fontFamily: isIOS() ? 'System' : 'Roboto',
                            }}>{ribbonText}</Text>
                        </LinearGradient>

                        {/* V-Notch at bottom */}
                        <View style={{
                            flexDirection: 'row',
                            marginTop: -1, // Overlap slightly to avoid gaps
                        }}>
                            {/* Left Cut */}
                            <View style={{
                                width: 0,
                                height: 0,
                                borderStyle: 'solid',
                                borderLeftWidth: 0,
                                borderRightWidth: 28, // Half of 56
                                borderTopWidth: 14,
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderTopColor: tag.premiumLevel === 2 ? '#5B21B6' : '#2563EB', // Match bottom gradient color
                            }} />
                            {/* Right Cut */}
                            <View style={{
                                width: 0,
                                height: 0,
                                borderStyle: 'solid',
                                borderLeftWidth: 28, // Half of 56
                                borderRightWidth: 0,
                                borderTopWidth: 14,
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderTopColor: tag.premiumLevel === 2 ? '#5B21B6' : '#2563EB', // Match bottom gradient color
                            }} />
                        </View>
                    </TouchableOpacity>
                </Pressable>
            );
        }

        return cardContent;
    });

    const sections = useMemo(() => {
        if (!jobGroups || !Array.isArray(jobGroups)) return [];
        return jobGroups.map((job: any) => {
            const isExpanded = expandedJobIds.includes(job.job_id);
            const activeFilter = jobFilters[job.job_id] || 'All';
            const allFiltered = Array.isArray(job.applications) ? job.applications.filter((app: any) => {
                if (!app?.driver_details?.unique_id) return false;
                if (activeFilter === 'Accepted') return app?.current_status === 'Accepted';
                if (activeFilter === 'Rejected') return app?.current_status === 'Rejected';
                return app?.current_status !== 'Rejected';
            }) : [];
            return {
                ...job,
                data: isExpanded ? allFiltered : [],
                displayCount: allFiltered.length,
                activeFilter,
                isExpanded
            };
        });
    }, [jobGroups, expandedJobIds, jobFilters]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: responsiveFontSize(2)
            }}>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={_goback}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.blackOpacity(0.05)
                    }}
                >
                    <Ionicons name={'chevron-back'} size={22} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{
                    color: colors.black,
                    fontSize: responsiveFontSize(2.2),
                    fontWeight: '700'
                }}>
                    {t('viewApplications')}
                </Text>
                <View style={{ width: responsiveFontSize(4) }} />
            </View>
            {(loading && !search.length) ?
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Space height={responsiveHeight(20)} />
                    <Image style={{ height: responsiveHeight(15), width: responsiveWidth(80), tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
                </View>
                : loading ?
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <ActivityIndicator color={colors.royalBlue} size="small" />
                    </View>
                    :
                    !appliedJobList?.length ?
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Space height={responsiveHeight(20)} />
                            <Image style={{ height: responsiveHeight(15), width: responsiveWidth(80), tintColor: colors.blackOpacity(.1) }} source={{ uri: 'https://truckmitr.com/public/images/preview.png' }} />
                            <Text style={{ width: responsiveWidth(80), color: colors.blackOpacity(.9), fontSize: responsiveFontSize(1.9), textAlign: 'center', fontWeight: '500', }}> {search ? `${t(`noDriverFoundFor`)} "${search}" ${t(`trySearchingDifferentKeyword`)}` : t("driverHaventAppliedYetApplicationsMayComeSoon")}</Text>
                        </View>
                        :
                        <View style={{ flex: 1 }}>

                            <SectionList
                                sections={sections}
                                keyExtractor={(item: any) => item.application_id}
                                stickySectionHeadersEnabled={false}
                                showsVerticalScrollIndicator={false}
                                onEndReached={_loadMoreJobs}
                                onEndReachedThreshold={0.3}
                                contentContainerStyle={{
                                    paddingHorizontal: responsiveWidth(5),
                                    paddingBottom: responsiveHeight(5),
                                    paddingTop: responsiveHeight(2),
                                }}
                                ListFooterComponent={() => (
                                    loadingMore ? (
                                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                            <ActivityIndicator color={colors.royalBlue} size="small" />
                                            <Text style={{ color: colors.blackOpacity(0.5), fontSize: 12, marginTop: 8 }}>
                                                {t('loadingMore') || 'Loading more...'}
                                            </Text>
                                        </View>
                                    ) : currentPage < lastPage ? (
                                        <TouchableOpacity
                                            onPress={_loadMoreJobs}
                                            style={{
                                                paddingVertical: 12,
                                                alignItems: 'center',
                                                backgroundColor: colors.blueOpacity(0.1),
                                                borderRadius: 10,
                                                marginHorizontal: 10,
                                                marginBottom: 20,
                                            }}
                                        >
                                            <Text style={{ color: colors.royalBlue, fontWeight: '600' }}>
                                                {t('loadMore') || 'Load More'} ({currentPage}/{lastPage})
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                        //  : totalCount > 0 ? (
                                        //     <Text style={{ textAlign: 'center', color: colors.blackOpacity(0.4), paddingVertical: 16, fontSize: 12 }}>
                                        //         {t('showingAll') || 'Showing all'} {totalCount} {t('applications') || 'applications'}
                                        //     </Text>
                                        // ) 
                                        : null
                                )}
                                renderSectionHeader={({ section: job }) => (
                                    <View style={{ marginBottom: job.isExpanded ? 0 : responsiveFontSize(3) }}>
                                        {/* ================= JOB DROPDOWN HEADER ================= */}
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => toggleJob(job.job_id)}
                                            style={{
                                                backgroundColor: colors.royalBlue,
                                                borderRadius: 10,
                                                padding: responsiveFontSize(1.6),
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                ...shadow,
                                                shadowColor: colors.blackOpacity(0.3),
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    numberOfLines={1}
                                                    style={{
                                                        color: colors.white,
                                                        fontSize: responsiveFontSize(2),
                                                        fontWeight: '700',
                                                    }}
                                                >
                                                    {job.job_title}
                                                </Text>

                                                <Text
                                                    style={{
                                                        color: colors.whiteOpacity(0.9),
                                                        fontSize: responsiveFontSize(1.6),
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    {t('jobId')}: {job.job_id} • {job.displayCount} {t('applicants')}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name={job.isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={24}
                                                color={colors.white}
                                            />
                                        </TouchableOpacity>

                                        {/* FILTER CHIPS (Visible only when expanded) */}
                                        {job.isExpanded && (
                                            <View style={{ marginTop: responsiveFontSize(1.5), marginBottom: 12 }}>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                                    {['All', 'Accepted', 'Rejected'].map((filter) => {
                                                        const isSelected = job.activeFilter === filter;
                                                        return (
                                                            <TouchableOpacity
                                                                key={filter}
                                                                onPress={() => setFilter(job.job_id, filter)}
                                                                style={{
                                                                    paddingHorizontal: 16,
                                                                    paddingVertical: 6,
                                                                    borderRadius: 20,
                                                                    backgroundColor: isSelected ? colors.royalBlue : '#F3F4F6',
                                                                    marginRight: 10,
                                                                    borderWidth: 1,
                                                                    borderColor: isSelected ? colors.royalBlue : '#E5E7EB',
                                                                }}
                                                            >
                                                                <Text style={{
                                                                    color: isSelected ? colors.white : '#4B5563',
                                                                    fontSize: responsiveFontSize(1.5),
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {filter}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                )}
                                renderItem={({ item, index }) => (
                                    <DriverApplicationCard item={item} index={index} />
                                )}
                            />

                        </View>
            }
            <ConfirmationModal
                visible={acceptJobId !== -1}
                title={t(`acceptThisApplication`)}
                subtitle={t(`byAcceptingThisApplicationYouWillBeContactedSoon`)}
                confirmText={t(`accept`)}
                loader={accpetRejectLoading}
                onCancel={() => setacceptJobId(-1)}
                onAccept={_onPressAcceptApplication}
            />
            <ConfirmationModal
                visible={rejectJobId !== -1}
                title={t(`rejectThisApplication`)}
                subtitle={t(`noWorriesYouWillGetMoreApplications`)}
                confirmText={t(`reject`)}
                loader={accpetRejectLoading}
                onCancel={() => setrejectJobId(-1)}
                onAccept={_onPressRejectApplication}
                confirmStyle={{ backgroundColor: colors.roseRed }}
            />
            <Modal
                visible={showScheduleModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowScheduleModal(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: '88%',
                            backgroundColor: '#fff',
                            borderRadius: 14,
                            padding: 18,
                        }}
                    >
                        {/* HEADER */}
                        <Text
                            style={{
                                fontSize: 17,
                                fontWeight: '600',
                                textAlign: 'center',
                                color: '#111',
                            }}
                        >
                            {t('scheduleInterview')}
                        </Text>

                        <Text
                            style={{
                                fontSize: 13,
                                textAlign: 'center',
                                color: '#777',
                                marginTop: 4,
                                marginBottom: 20,
                            }}
                        >
                            {t('selectInterviewDateTime')}
                        </Text>

                        {/* DATE CARD */}
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 14,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                marginBottom: 12,
                            }}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#1E5EFF" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.5),
                                    color: '#777'
                                }}>
                                    {t('date')}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: responsiveFontSize(1.5),
                                        fontWeight: '500',
                                        color: tempIsDateSelected ? '#111' : '#9CA3AF',
                                    }}
                                >
                                    {tempIsDateSelected
                                        ? moment(tempInterviewDate).format('DD MMM YYYY')
                                        : t('clickToSelectDate')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* TIME CARD */}
                        <TouchableOpacity
                            disabled={!tempIsDateSelected}
                            onPress={() => setShowTimePicker(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 14,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                opacity: tempIsDateSelected ? 1 : 0.5,
                                marginBottom: 22,
                            }}
                        >
                            <Ionicons name="time-outline" size={20} color="#1E5EFF" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.5),
                                    color: '#777'
                                }}>
                                    {t('time')}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: responsiveFontSize(1.5),
                                        fontWeight: '500',
                                        color: tempIsTimeSelected ? '#111' : '#9CA3AF',
                                    }}
                                >
                                    {tempIsTimeSelected
                                        ? moment(tempInterviewDate).format('h:mm A')
                                        : t('clickToSelectTime')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* ACTIONS */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            {/* CANCEL */}
                            <TouchableOpacity
                                onPress={() => {
                                    // ❌ clear temp (modal) values
                                    setTempInterviewDate(null);
                                    setTempIsDateSelected(false);
                                    setTempIsTimeSelected(false);

                                    // ❌ clear saved (final) values
                                    setSelectedInterviewDate(null);
                                    setIsDateSelected(false);
                                    setIsTimeSelected(false);

                                    // ❌ close modal
                                    setShowScheduleModal(false);
                                }}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 8,
                                    backgroundColor: '#F3F4F6',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: '#333', fontWeight: '500' }}>
                                    {t('cancel')}
                                </Text>
                            </TouchableOpacity>

                            {/* CONFIRM */}
                            <TouchableOpacity
                                disabled={!tempIsDateSelected || !tempIsTimeSelected}
                                activeOpacity={0.8}
                                onPress={onConfirm}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 8,
                                    overflow: 'hidden', // ⭐ VERY IMPORTANT
                                }}
                            >
                                <LinearGradient
                                    colors={
                                        !tempIsDateSelected || !tempIsTimeSelected
                                            ? ['#9BB3FF', '#9BB3FF']
                                            : ['#1E3A8A', '#3B82F6']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        opacity: !tempIsDateSelected || !tempIsTimeSelected ? 0.7 : 1,
                                    }}
                                >
                                    {scheduleLoading ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>
                                            {t('confirm')}
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        {/* DATE PICKER */}
                        {showDatePicker && (
                            <DateTimePicker
                                value={tempInterviewDate ?? moment().add(15, 'minutes').toDate()}
                                mode="date"
                                minimumDate={new Date()}
                                onChange={(event, date) => {
                                    setShowDatePicker(false);

                                    // ✅ IMPORTANT: user pressed Cancel
                                    if (event.type === 'dismissed') {
                                        return;
                                    }

                                    if (!date) return;

                                    setTempInterviewDate(
                                        moment(date).set({ hour: 9, minute: 0 }).toDate()
                                    );
                                    setTempIsDateSelected(true);
                                    setTempIsTimeSelected(false); // reset time
                                }}
                            />
                        )}

                        {/* TIME PICKER */}
                        {showTimePicker && (
                            <DateTimePicker
                                value={tempInterviewDate ?? moment().add(15, 'minutes').toDate()}
                                mode="time"
                                minimumDate={getMinimumTime()}
                                onChange={(event, time) => {
                                    setShowTimePicker(false);

                                    // ✅ IMPORTANT: user pressed Cancel
                                    if (event.type === 'dismissed') {
                                        return;
                                    }

                                    if (!time || !tempInterviewDate) return;

                                    setTempInterviewDate(
                                        moment(tempInterviewDate)
                                            .set({
                                                hour: time.getHours(),
                                                minute: time.getMinutes(),
                                            })
                                            .toDate()
                                    );
                                    setTempIsTimeSelected(true);
                                }}
                            />
                        )}

                    </View>
                </View>
            </Modal>

            {/* DRIVER PROFILE BOTTOM SHEET MODAL */}
            {/* <BottomSheetModal */}

            {/* > */}
            <BottomSheet
                ref={bottomSheetModalRef}
                index={-1}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={true}
                enableOverDrag={false}   // 🔒 IMPORTANT
                enableContentPanningGesture={false} // 🔒 IMPORTANT
                // onDismiss={() => setSelectedDriverForModal(null)}
                onChange={setSheetIndex}
            >
                {/* <BottomSheetView

                    style={{ flex: 1, paddingBottom: safeAreaInsets.bottom + 16 }}> */}
                <BottomSheetScrollView
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                >
                    {selectedDriverForModal && (() => {
                        const driver = selectedDriverForModal?.driver_details;
                        if (!driver) return null;

                        // Basic Info
                        const driverName = driver?.driver_name || driver?.name || 'Driver';
                        const tmId = driver?.unique_id || 'N/A';
                        const rating = Number(driver?.rating) || 0;
                        const reviewCount = driver?.review_count || 0;

                        // Contact Info (masked)
                        const email = driver?.driver_email || driver?.email || '';
                        const mobile = driver?.driver_mobile || driver?.mobile || '';

                        // Personal Info
                        const fatherName = driver?.father_name || driver?.Father_Name || 'N/A';
                        const dob = driver?.driver_DOB || driver?.dob || driver?.date_of_birth || driver?.DOB
                            ? moment(driver?.driver_DOB || driver?.dob || driver?.date_of_birth || driver?.DOB).format('DD MMM YYYY')
                            : 'N/A';
                        const gender = driver?.gender || driver?.Gender || 'N/A';
                        const maritalStatus = driver?.marital_status || driver?.Marital_Status || 'N/A';
                        const education = driver?.education || driver?.Education || driver?.qualification || 'N/A';

                        // Address Details
                        const address = driver?.address || driver?.Address || driver?.permanent_address || 'N/A';
                        const pincode = driver?.pincode || driver?.Pincode || driver?.pin_code || 'N/A';
                        const district = driver?.district || driver?.District || driver?.city || 'N/A';
                        const state = driver?.state || driver?.State || driver?.states || 'N/A';

                        // Work Info
                        const vehicleType = driver?.vehicle_type || driver?.Vehicle_Type || driver?.preferred_vehicle || 'N/A';
                        const drivingExp = driver?.Driver_Experience || driver?.driving_exp || driver?.driving_experience || 'N/A';
                        const preferredLocation = driver?.Preferred_Location || driver?.preferred_location || driver?.preferred_city || 'N/A';
                        const licenseEndorsement = driver?.licence_endorsement || driver?.license_endorsement || 'N/A';

                        // License/Documents Info
                        const licenseType = driver?.Type_of_License || driver?.license_type || 'N/A';
                        const aadharNo = driver?.Aadhar_Number || driver?.aadhar_number || driver?.aadhar_no || '';
                        const licenseNo = driver?.License_number || driver?.license_no || '';
                        const licenseExpiry = driver?.Expiry_date_of_license || driver?.license_expiry
                            ? moment(driver?.Expiry_date_of_license || driver?.license_expiry).format('DD MMM YYYY')
                            : 'N/A';
                        const panNo = driver?.PAN_Number || driver?.pan_number || driver?.Pan_Number || driver?.pan_no || '';

                        const profileImage =
                            driver?.driver_picture
                                ? `${BASE_URL}public/${driver.driver_picture}`
                                : driver?.images
                                    ? `${BASE_URL}public/${driver.images}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=0D8ABC&color=fff&size=128`;

                        const tag = getDriverTag(selectedDriverForModal);

                        // Section Header Component
                        const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
                                <Ionicons name={icon as any} size={20} color={colors.royalBlue} style={{ marginRight: 10 }} />
                                <Text style={{ fontSize: responsiveFontSize(2.0), fontWeight: '700', color: colors.royalBlue }}>
                                    {title}
                                </Text>
                            </View>
                        );

                        // Detail Item Component
                        const DetailItem = ({ label, value }: { label: string; value: string }) => (
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.blackOpacity(0.05)
                            }}>
                                <Text style={{ fontSize: responsiveFontSize(1.7), color: colors.blackOpacity(0.6), flex: 1 }}>
                                    {label}
                                </Text>
                                <Text style={{
                                    fontSize: responsiveFontSize(1.8),
                                    color: value === 'N/A' ? colors.blackOpacity(0.4) : colors.black,
                                    fontWeight: '500',
                                    flex: 1.5,
                                    textAlign: 'right'
                                }}>
                                    {value}
                                </Text>
                            </View>
                        );

                        return (
                            <>
                                {/* Profile Header */}
                                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                    <View style={{ position: 'relative' }}>
                                        <Image
                                            source={{ uri: profileImage }}
                                            style={{
                                                height: 100,
                                                width: 100,
                                                borderRadius: 50,
                                                borderWidth: 3,
                                                borderColor: tag.color,
                                            }}
                                        />
                                        {/* Name Tag Badge */}
                                        <View style={{
                                            position: 'absolute',
                                            bottom: -6,
                                            alignSelf: 'center',
                                            backgroundColor: tag.color,
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                            borderRadius: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                            <Ionicons
                                                name={
                                                    tag.label === 'Trusted Driver'
                                                        ? 'shield-checkmark'
                                                        : tag.label === 'Verified Driver'
                                                            ? 'checkmark-circle'
                                                            : 'briefcase'
                                                }
                                                size={12}
                                                color={colors.white}
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>
                                                {tag.label}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: '700', color: colors.black, marginTop: 16 }}>
                                        {driverName}
                                    </Text>
                                    <Text style={{ fontSize: responsiveFontSize(1.5), color: colors.blackOpacity(0.6), marginTop: 4 }}>
                                        {tmId}
                                    </Text>

                                    {/* Rating */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 }}>
                                            <FontAwesome name="star" size={14} color="#F59E0B" />
                                            <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#92400E' }}>
                                                {rating.toFixed(1)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Contact Information */}
                                <View style={{
                                    backgroundColor: colors.blackOpacity(0.02),
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 16,
                                }}>
                                    <SectionHeader title={t('contactInfo') || 'Contact Information'} icon="call-outline" />
                                    <DetailItem label={t('email') || 'Email'} value={maskEmail(email)} />
                                    <DetailItem label={t('mobile') || 'Mobile'} value={maskMobile(mobile)} />
                                </View>

                                {/* Personal Information */}
                                <View style={{
                                    backgroundColor: colors.blackOpacity(0.02),
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 16,
                                }}>
                                    <SectionHeader title={t('personalInfo') || 'Personal Information'} icon="person-outline" />
                                    <DetailItem label={t('fatherName') || 'Father Name'} value={fatherName} />
                                    <DetailItem label={t('dateOfBirth') || 'Date of Birth'} value={dob} />
                                    <DetailItem label={t('gender') || 'Gender'} value={gender} />
                                    <DetailItem label={t('maritalStatus') || 'Marital Status'} value={maritalStatus} />
                                    <DetailItem label={t('education') || 'Education'} value={education} />
                                </View>

                                {/* Address Details */}
                                <View style={{
                                    backgroundColor: colors.blackOpacity(0.02),
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 16,
                                }}>
                                    <SectionHeader title={t('addressDetails') || 'Address Details'} icon="location-outline" />
                                    <DetailItem label={t('address') || 'Address'} value={address} />
                                    <DetailItem label={t('pincode') || 'Pincode'} value={pincode} />
                                    <DetailItem label={t('district') || 'District'} value={district} />
                                    <DetailItem label={t('state') || 'State'} value={state} />
                                </View>

                                {/* Work Information */}
                                <View style={{
                                    backgroundColor: colors.blackOpacity(0.02),
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 16,
                                }}>
                                    <SectionHeader title={t('workInfo') || 'Driving Details'} icon="briefcase-outline" />
                                    <DetailItem label={t('vehicleType') || 'Vehicle Type'} value={vehicleType} />
                                    <DetailItem label={t('drivingExperience') || 'Driving Experience'} value={drivingExp !== 'N/A' ? `${drivingExp} years` : 'N/A'} />
                                    <DetailItem label={t('preferredLocation') || 'Preferred Location'} value={preferredLocation} />
                                    <DetailItem label={t('licenseEndorsement') || 'License Endorsement'} value={licenseEndorsement} />
                                </View>

                                {/* License & Documents */}
                                <View style={{
                                    backgroundColor: colors.blackOpacity(0.02),
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 20,
                                }}>
                                    <SectionHeader title={t('licenseDocuments') || 'License & Documents'} icon="document-text-outline" />
                                    <DetailItem label={t('licenseType') || 'License Type'} value={licenseType} />
                                    {/* <DetailItem label={t('aadharNumber') || 'Aadhar No.'} value={maskAadhar(aadharNo)} /> */}
                                    <DetailItem label={t('licenseNo') || 'License No.'} value={maskLicense(licenseNo)} />
                                    <DetailItem label={t('licenseExpiry') || 'License Expiry'} value={licenseExpiry} />
                                    <DetailItem label={t('panNumber') || 'PAN No.'} value={maskPan(panNo)} />
                                </View>

                                {/* Call Driver & Interview CTAs */}
                                {(() => {
                                    const interviewAt = selectedDriverForModal?.interview_at;
                                    const isInterviewScheduled = !!interviewAt;
                                    const isTimeForInterview = interviewAt && moment().isSameOrAfter(moment(interviewAt));
                                    const formattedInterviewDate = interviewAt
                                        ? moment(interviewAt).format('DD MMM YYYY, h:mm A')
                                        : null;

                                    return (
                                        <>
                                            {/* Call Driver Button - Always visible */}
                                            <TouchableOpacity
                                                onPress={() => callToDriver(selectedDriverForModal)}
                                                style={{ marginBottom: 12 }}
                                                disabled={callLoading}
                                            >
                                                <LinearGradient
                                                    colors={callLoading ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1D4ED8']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={{
                                                        height: 48,
                                                        borderRadius: 12,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                    }}
                                                >
                                                    {callLoading ? (
                                                        <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
                                                    ) : (
                                                        <Ionicons name="call" size={18} color={colors.white} style={{ marginRight: 8 }} />
                                                    )}
                                                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.5) }}>
                                                        {callLoading ? (t('calling') || 'Calling...') : (t('callDriver') || 'Call Driver')}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            {/* Interview Section - Conditional */}
                                            {isInterviewScheduled ? (
                                                // Interview is scheduled - Show info or Start button
                                                isTimeForInterview ? (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setSelectedDriver(selectedDriverForModal);
                                                            setShowVideoInterviewModal(true);
                                                        }}
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        <LinearGradient
                                                            colors={['#8B5CF6', '#6D28D9']}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={{
                                                                height: 54,
                                                                borderRadius: 12,
                                                                alignItems: 'center',
                                                                paddingHorizontal: 16,
                                                                flexDirection: 'row',
                                                            }}
                                                        >
                                                            <View style={{
                                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                                borderRadius: 20,
                                                                padding: 8,
                                                                marginRight: 12,
                                                            }}>
                                                                <Ionicons name="videocam" size={22} color={colors.white} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: responsiveFontSize(1.4), color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                                                                    {t('interviewTime') || 'Interview Time'}
                                                                </Text>
                                                                <Text style={{ fontSize: responsiveFontSize(1.8), color: colors.white, fontWeight: '700' }}>
                                                                    {t('startVideoInterview') || 'Start Video Interview'}
                                                                </Text>
                                                            </View>
                                                            <Ionicons name="chevron-forward" size={24} color={colors.white} />
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <View style={{
                                                        backgroundColor: '#ECFDF5',
                                                        borderRadius: 12,
                                                        padding: 14,
                                                        marginBottom: 12,
                                                        borderWidth: 1,
                                                        borderColor: '#10B981',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}>
                                                        <View style={{
                                                            backgroundColor: '#10B981',
                                                            borderRadius: 20,
                                                            padding: 8,
                                                            marginRight: 12,
                                                        }}>
                                                            <Ionicons name="videocam" size={20} color={colors.white} />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontSize: responsiveFontSize(1.4), color: '#059669', fontWeight: '600' }}>
                                                                {t('interviewScheduled') || 'Interview Scheduled'}
                                                            </Text>
                                                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#047857', fontWeight: '700', marginTop: 2 }}>
                                                                {formattedInterviewDate}
                                                            </Text>
                                                        </View>
                                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                                    </View>
                                                )
                                            ) : (
                                                // Interview not scheduled - Show schedule button
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (selectedDriverForModal?.current_status === 'Rejected') {
                                                            showToast(t('youAlreadyRejectedThisDriver') || 'You already rejected this driver');
                                                            return;
                                                        }
                                                        if (selectedDriverForModal?.current_status !== 'Accepted') {
                                                            showToast(t('youHaveToAcceptThisApplicationFirst') || 'You have to accept this application first');
                                                            return;
                                                        }
                                                        setScheduleJob(selectedDriverForModal);
                                                        // closeDriverProfileModal();
                                                        closeDriverProfileModal();
                                                        setTimeout(() => openScheduleModal(), 300);
                                                    }}
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <LinearGradient
                                                        colors={['#8B5CF6', '#6D28D9']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={{
                                                            height: 48,
                                                            borderRadius: 12,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexDirection: 'row',
                                                        }}
                                                    >
                                                        <Ionicons name="videocam" size={18} color={colors.white} style={{ marginRight: 8 }} />
                                                        <Text style={{ color: colors.white, fontWeight: '600', fontSize: responsiveFontSize(1.5) }}>
                                                            {t('scheduleVideoInterview') || 'Schedule Video Interview'}
                                                        </Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Accept / Reject CTAs */}
                                {/* <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            closeDriverProfileModal();
                                            setTimeout(() => setrejectJobId(selectedDriverForModal.application_id), 300);
                                        }}
                                        style={{ flex: 1, marginRight: 8 }}
                                    >
                                        <LinearGradient
                                            colors={['#FF6B6B', '#E63946']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                height: 52,
                                                borderRadius: 14,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Ionicons name="close-circle" size={20} color={colors.white} style={{ marginRight: 8 }} />
                                            <Text style={{ color: colors.white, fontWeight: '700', fontSize: responsiveFontSize(1.7) }}>
                                                {t('reject')}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            closeDriverProfileModal();
                                            setTimeout(() => setacceptJobId(selectedDriverForModal.application_id), 300);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        <LinearGradient
                                            colors={['#10B981', '#059669']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                height: 52,
                                                borderRadius: 14,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Ionicons name="checkmark-circle" size={20} color={colors.white} style={{ marginRight: 8 }} />
                                            <Text style={{ color: colors.white, fontWeight: '700', fontSize: responsiveFontSize(1.7) }}>
                                                {t('accept')}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View> */}

                                <Space height={100} />
                            </>
                        );
                    })()}
                </BottomSheetScrollView>
                {/* </BottomSheetView> */}
            </BottomSheet>


            {/* </BottomSheetModal> */}




            {/* VIDEO INTERVIEW CONFIRMATION MODAL */}
            <Modal
                visible={showVideoInterviewModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowVideoInterviewModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20
                }}>
                    <View style={{
                        width: '100%',
                        backgroundColor: colors.white,
                        borderRadius: 24,
                        padding: 24,
                        alignItems: 'center',
                        ...shadow,
                        elevation: 10
                    }}>
                        {/* ICON / IMAGE */}
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: '#F3E8FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20
                        }}>
                            <Ionicons name="videocam" size={40} color="#8B5CF6" />
                        </View>

                        <Text style={{
                            fontSize: responsiveFontSize(2.2),
                            fontWeight: '700',
                            color: colors.black,
                            textAlign: 'center',
                            marginBottom: 12
                        }}>
                            {t('videoCallConfirmationTitle') || 'Confirm Video Interview'}
                        </Text>

                        <Text style={{
                            fontSize: responsiveFontSize(1.7),
                            color: colors.blackOpacity(0.6),
                            textAlign: 'center',
                            marginBottom: 24,
                            lineHeight: 22
                        }}>
                            {t('videoCallConfirmationMessage') || 'Do you want to start the video interview?'}
                        </Text>

                        {/* DRIVER MINI CARD */}
                        {selectedDriver && (
                            <View style={{
                                width: '100%',
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.blackOpacity(0.04),
                                padding: 12,
                                borderRadius: 16,
                                marginBottom: 24
                            }}>
                                <Image
                                    source={{ uri: selectedDriver?.driver_details?.images ? `${BASE_URL}public/${selectedDriver?.driver_details.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: '600', color: colors.black }} numberOfLines={1}>
                                        {selectedDriver?.driver_details?.driver_name}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: colors.blackOpacity(0.5) }}>
                                        {selectedDriver?.driver_details?.unique_id}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* ACTION BUTTONS */}
                        <View style={{ width: '100%', alignItems: 'center', gap: 24 }}>
                            {/* <ZegoSendCallInvitationButton
                                invitees={[{
                                    userID: selectedDriver?.driver_details?.unique_id || selectedDriver?.driver_details?.driver_id?.toString(),
                                    userName: selectedDriver?.driver_details?.driver_name || 'Driver'
                                }]}
                                isVideoCall={true}
                                resourceID={"TruckMitr"}
                                renderNormal={(onPress: any) => (
                                    <TouchableOpacity
                                        onPress={() => initiateVideoCall(selectedDriver, onPress)}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 40,
                                            ...shadow,
                                            elevation: 5
                                        }}
                                        disabled={videoCallLoading}
                                    >
                                        <LinearGradient
                                            colors={videoCallLoading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6D28D9']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                flex: 1,
                                                borderRadius: 40,
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {videoCallLoading ? (
                                                <ActivityIndicator size="large" color={colors.white} />
                                            ) : (
                                                <Ionicons name="videocam" size={36} color={colors.white} />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            /> */}

                            <ZegoSendCallInvitationButton
                                invitees={[{
                                    userID:
                                        selectedDriver?.driver_details?.unique_id ||
                                        selectedDriver?.driver_details?.driver_id?.toString(),
                                    userName: selectedDriver?.driver_details?.driver_name || 'Driver',
                                }]}
                                isVideoCall={true}
                                resourceID={"TruckMitr"}
                                onPressed={(code: any, message: any, invitees: any) => {
                                    // console.log('🎥 ZegoCloud onPressed callback triggered');
                                    // console.log('🎥 Code:', code, 'Message:', message, 'Invitees:', invitees);
                                    // console.log('🎥 Selected driver for API call:', selectedDriver?.driver_details?.driver_name);

                                    // Log the video call when ZegoCloud button is actually pressed
                                    if (selectedDriver) {
                                        logVideoCallStart(selectedDriver);
                                    } else {
                                        console.log('🎥 ERROR: selectedDriver is null/undefined');
                                    }

                                    // Close modal
                                    setShowVideoInterviewModal(false);
                                }}
                                renderNormal={(onPress: any) => {
                                    console.log('🎥 ZegoCloud renderNormal called, onPress function:', typeof onPress);
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                console.log('🎥 Video call button pressed - calling onPress');
                                                onPress();
                                            }}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 40,
                                                ...shadow,
                                                elevation: 5,
                                            }}
                                        >
                                            <LinearGradient
                                                colors={['#8B5CF6', '#6D28D9']}
                                                style={{
                                                    flex: 1,
                                                    borderRadius: 40,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ionicons name="videocam" size={36} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                }}
                            />


                            <TouchableOpacity
                                onPress={() => setShowVideoInterviewModal(false)}
                                style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 24,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: colors.royalBlue, fontSize: 16, fontWeight: '600' }}>
                                    {t('cancel') || 'Cancel'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Driver Badge Info Modal */}
            <Modal
                transparent={true}
                visible={infoModalType !== null}
                animationType="fade"
                onRequestClose={() => setInfoModalType(null)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <View style={{
                        width: '90%',
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        elevation: 5,
                    }}>
                        {infoModalType === 'trusted' && (
                            <>
                                {/* Header */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <Ionicons name="ellipse" size={12} color="#7C3AED" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1 }}>
                                        Trusted Driver – What does it mean?
                                    </Text>
                                    <TouchableOpacity onPress={() => setInfoModalType(null)}>
                                        <Ionicons name="close" size={24} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
                                    Trusted Driver is a 100% verified and highly reliable driver on TruckMitr.
                                </Text>

                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
                                    Why this driver is Trusted?
                                </Text>

                                {/* List */}
                                {[
                                    'Government ID verified',
                                    'Face verification completed',
                                    'Court / criminal record check done',
                                    'Digital address verified',
                                    'Driving license verified',
                                    'High verification score & trust rating'
                                ].map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <MaterialCommunityIcons
                                            name={index === 5 ? "star" : "check-circle"}
                                            size={18}
                                            color={index === 5 ? "#F59E0B" : "#10B981"}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={{ fontSize: 14, color: '#374151', fontWeight: index === 5 ? '600' : '400' }}>{item}</Text>
                                    </View>
                                ))}

                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                                    <Text style={{ fontWeight: '700' }}>Best for: </Text>
                                    Transporters who want maximum safety, zero risk, and peace of mind while hiring drivers.
                                </Text>

                                <Text style={{ fontSize: 14, color: '#374151' }}>
                                    <Text style={{ fontWeight: '700' }}>👉 Recommended for </Text>
                                    long trips, high-value goods, and critical assignments.
                                </Text>
                            </>
                        )}

                        {infoModalType === 'verified' && (
                            <>
                                {/* Header */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <Ionicons name="ellipse" size={12} color="#2563EB" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1 }}>
                                        Verified Driver – What does it mean?
                                    </Text>
                                    <TouchableOpacity onPress={() => setInfoModalType(null)}>
                                        <Ionicons name="close" size={24} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
                                    Verified Driver is a background-checked driver with essential verifications completed.
                                </Text>

                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
                                    What is verified?
                                </Text>

                                {['Government ID verified', 'Driving license verified'].map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 14, color: '#374151' }}>{item}</Text>
                                    </View>
                                ))}

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <MaterialCommunityIcons name="alert" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 14, color: '#374151', fontStyle: 'italic' }}>Some advanced checks may be pending or optional</Text>
                                </View>

                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                                    <Text style={{ fontWeight: '700' }}>Best for: </Text>
                                    Transporters looking for quick hiring with basic safety assurance.
                                </Text>

                                <Text style={{ fontSize: 14, color: '#374151' }}>
                                    <Text style={{ fontWeight: '700' }}>👉 Suitable for </Text>
                                    short routes, local trips, or urgent driver requirements.
                                </Text>
                            </>
                        )}

                        {infoModalType === 'job_ready' && (
                            <>
                                {/* Header */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <Ionicons name="ellipse" size={12} color="#F97316" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1 }}>
                                        Job Ready Driver – What does it mean?
                                    </Text>
                                    <TouchableOpacity onPress={() => setInfoModalType(null)}>
                                        <Ionicons name="close" size={24} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
                                    Job Ready Drivers are drivers who have completed their profile and are ready to work, but verification is not completed yet.
                                </Text>

                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
                                    What this means for you:
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 14, color: '#374151' }}>Profile details filled (personal & driving info)</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 14, color: '#374151' }}>Actively looking for jobs</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 14, color: '#374151' }}>Background verification not completed yet</Text>
                                </View>

                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                                    <Text style={{ fontWeight: '700' }}>Best for: </Text>
                                    Transporters who need immediate driver availability and are comfortable proceeding without full verification.
                                </Text>

                                <Text style={{ fontSize: 14, color: '#374151' }}>
                                    <Text style={{ fontWeight: '700' }}>👉 You may choose to </Text>
                                    verify documents manually before hiring.
                                </Text>
                            </>
                        )}

                        {infoModalType === 'legacy' && (
                            <>
                                {/* Header */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <Ionicons name="ellipse" size={12} color="#EAB308" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1 }}>
                                        Legacy Driver – What does it mean?
                                    </Text>
                                    <TouchableOpacity onPress={() => setInfoModalType(null)}>
                                        <Ionicons name="close" size={24} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
                                    Legacy Drivers are drivers who joined TruckMitr at a very early stage and have been part of the platform since the beginning.
                                </Text>

                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
                                    Why they are called Legacy Drivers:
                                </Text>

                                {['Early subscribers of TruckMitr', 'Familiar with the app and its processes', 'Long-term association with the platform'].map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 14, color: '#374151' }}>{item}</Text>
                                    </View>
                                ))}

                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

                                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                                    <Text style={{ fontWeight: '700' }}>Best for: </Text>
                                    Transporters who value experience, platform familiarity, and early trust built over time.
                                </Text>

                                <Text style={{ fontSize: 14, color: '#374151' }}>
                                    <Text style={{ fontWeight: '700' }}>👉 Legacy status </Text>
                                    reflects loyalty, not verification level.
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </Modal>


        </View >
    )
}
