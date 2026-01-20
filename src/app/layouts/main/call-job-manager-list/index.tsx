import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert, Modal, Image, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import moment from 'moment';
import { getUserTier } from '@truckmitr/src/utils/global/userBadge';
import LinearGradient from 'react-native-linear-gradient';
import { FlatList } from 'react-native';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';

const CallJobManagerList = () => {
    const navigation = useNavigation<any>();
    const colors = useColor();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { shadow } = useShadow();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    // Redux State
    const { user, subscriptionDetails } = useSelector((state: any) => state?.user);
    const isDriver = user?.role === 'driver';

    // Local State
    const [jobs, setJobs] = useState<any[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [callingLoading, setCallingLoading] = useState(false);

    // Verification Status Check
    const userTier = getUserTier({ user, subscriptionDetails, isDriver });
    const isVerifiedOrTrusted = true; // userTier === 'VERIFIED' || userTier === 'TRUSTED';

    const _goBack = () => navigation.goBack();

    // Fetch Jobs
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            let fetchedJobs: any[] = [];

            if (isDriver) {
                // Driver: Fetch accepted jobs with job manager details
                const response: any = await axiosInstance.get(END_POINTS.ACCEPTED_JOBS_DRIVERS);
                if (response?.data?.status) {
                    const acceptedJobs = response.data.data?.data || response.data.data || [];
                    // Map API response to component's expected structure
                    fetchedJobs = acceptedJobs
                        .filter((item: any) => {
                            // Only include jobs where a job manager is assigned
                            return item.assigned_admin_name && item.assigned_admin_mobile;
                        })
                        .map((item: any) => ({
                            id: item.job_id,
                            accept_reject_status: item.status?.toLowerCase() || 'accepted',
                            job: {
                                id: item.job_id,
                                job_id: item.job_id,
                                job_title: item.job_title,
                                job_location: item.route || 'N/A',
                                destination: null,
                                vehicle_type: item.vehicle_type,
                                // Use transporter_payment_status for job type
                                subscription_plan_name: item.transporter_payment_status || 'premium_job',
                                Created_at: item.applied,
                                // Job Manager details - this is who the driver can call
                                job_manager_name: item.assigned_admin_name,
                                job_manager_phone: item.assigned_admin_mobile,
                                job_manager_id: item.assigned_admin_mobile,
                                // Transporter info (for display)
                                transport_name: item.transport_name,
                                // Driver payment status (verified/trusted)
                                payment_type: item.payment_status,
                            },
                        }));
                }
            } else {
                // Transporter: Fetch accepted jobs
                const response: any = await axiosInstance.get(END_POINTS.ACCEPTED_JOBS);
                if (response?.data?.status) {
                    const acceptedJobs = response.data.data?.data || response.data.data || [];
                    // Map API response to component's expected structure
                    // Transporter can only call job manager (assigned_admin), NOT drivers
                    fetchedJobs = acceptedJobs
                        .filter((item: any) => {
                            // Only include jobs where a job manager is assigned
                            return item.assigned_admin_name && item.assigned_admin_mobile;
                        })
                        .map((item: any) => ({
                            id: item.driver_id,
                            accept_reject_status: item.status?.toLowerCase() || 'accepted',
                            job: {
                                id: item.job_id,
                                job_id: item.job_id,
                                job_title: item.job_title,
                                job_location: item.route || 'N/A',
                                destination: null,
                                vehicle_type: item.vehicle_type,
                                // Use transporter_payment_status for job type
                                subscription_plan_name: item.transporter_payment_status || 'premium_job',
                                Created_at: item.applied,
                                // Job Manager details - this is who the transporter can call
                                job_manager_name: item.assigned_admin_name,
                                job_manager_phone: item.assigned_admin_mobile,
                                job_manager_id: item.assigned_admin_mobile,
                                // Store driver info but NOT for calling
                                driver_name: item.driver_name,
                                driver_mobile: item.driver_mobile,
                                driver_id: item.driver_id,
                                // Transporter info
                                transport_name: item.transport_name,
                                transport_mobile: item.transport_mobile,
                                // Driver payment status (verified/trusted)
                                payment_type: item.payment_status,
                            },
                        }));
                }
            }

            setJobs(fetchedJobs);
            setFilteredJobs(fetchedJobs);

        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    }, [isDriver]);

    useFocusEffect(
        useCallback(() => {
            if (isVerifiedOrTrusted) {
                fetchJobs();
            } else {
                setLoading(false);
            }
        }, [isVerifiedOrTrusted, fetchJobs])
    );

    // Search Logic
    useEffect(() => {
        if (!searchText) {
            setFilteredJobs(jobs);
            return;
        }
        const lowerSearch = searchText.toLowerCase();
        const filtered = jobs.filter((item: any) => {
            const jobData = item.job || {};
            const title = jobData.job_title?.toLowerCase() || '';
            const jobId = (jobData.job_id || '').toString().toLowerCase();
            return title.includes(lowerSearch) || jobId.includes(lowerSearch);
        });
        setFilteredJobs(filtered);
    }, [searchText, jobs]);

    const openManagerModal = (item: any) => {
        setSelectedJob(item);
        setModalVisible(true);
    };

    const closeManagerModal = () => {
        setModalVisible(false);
        setSelectedJob(null);
    };

    const checkAvailabilityAndCall = async () => {
        if (!selectedJob || callingLoading) return;

        const jobData = selectedJob.job || {};

        const now = moment();
        const startWork = moment().set({ hour: 9, minute: 30, second: 0 });
        const endWork = moment().set({ hour: 18, minute: 0, second: 0 });
        const isWorkingHours = now.isBetween(startWork, endWork);

        if (!isWorkingHours) {
            Alert.alert(
                t('unavailable', 'Job Manager Unavailable'),
                t('availableAtNextWorkingTime', 'Job Manager is available between 9:30 AM - 6:00 PM. Please call during working hours.')
            );
            return;
        }

        try {
            setCallingLoading(true);

            // Build call log payload based on role
            const callLogPayload: any = {
                job_id: jobData.job_id || jobData.id || '',
                call_to_name: jobData.job_manager_name || '',
                call_to_mobile: jobData.job_manager_phone || '',
                call_initiated_by: user?.role || (isDriver ? 'driver' : 'transporter')
            };

            if (isDriver) {
                // Driver login: Send driver details only
                callLogPayload.driver_name = user?.name || '';
                callLogPayload.driver_mobile = user?.mobile || '';
                callLogPayload.driver_unique_id = user?.unique_id || user?.id || '';
            } else {
                // Transporter login: Send transporter details only
                callLogPayload.transporter_name = user?.name || '';
                callLogPayload.transporter_mobile = user?.mobile || '';
                callLogPayload.transporter_unique_id = user?.unique_id || user?.id || '';
            }

            // Call API first to get DID number
            const response: any = await axiosInstance.post(END_POINTS.CALL_LOGS_INITIATED, callLogPayload);
            console.log('Call log response:', response?.data);

            if (response?.data?.success && response?.data?.phone) {
                // Use the DID phone number from API response
                const didPhoneNumber = response.data.phone;
                const url = `tel:${didPhoneNumber}`;

                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                    closeManagerModal();
                } else {
                    Alert.alert(t('error'), t('callingNotSupported'));
                }
            } else {
                Alert.alert(t('error'), response?.data?.message || t('contactDetailsUnavailable', 'Unable to initiate call. Please try again.'));
            }
        } catch (err: any) {
            console.error('Call initiation error:', err);
            Alert.alert(t('error'), err?.response?.data?.message || t('somethingWentWrong', 'Something went wrong. Please try again.'));
        } finally {
            setCallingLoading(false);
        }
    };

    // Access Denied View
    if (!isVerifiedOrTrusted) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: responsiveWidth(5), justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', top: responsiveHeight(6), left: responsiveWidth(4) }}>
                    <TouchableOpacity onPress={_goBack} style={{ padding: 5 }}>
                        <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                    </TouchableOpacity>
                </View>
                <View style={{ width: responsiveFontSize(12), height: responsiveFontSize(12), borderRadius: responsiveFontSize(6), backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <MaterialCommunityIcons name="shield-lock" size={responsiveFontSize(6)} color="#EF4444" />
                </View>
                <Text style={{ fontSize: responsiveFontSize(2.5), fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 10 }}>
                    {t('featureLocked', 'Feature Locked')}
                </Text>
                <Text style={{ fontSize: responsiveFontSize(1.6), color: '#64748B', textAlign: 'center', lineHeight: responsiveFontSize(2.4) }}>
                    {t('verifiedDriverOnly', 'This feature is exclusively for Verified and Trusted drivers. Please complete your verifications to access Job Manager calls.')}
                </Text>
            </View>
        );
    }

    const JobCard = ({ item }: { item: any }) => {
        const jobData = item.job || {};
        const status = item.accept_reject_status?.toLowerCase();
        const planName = jobData.subscription_plan_name;
        const isSuperPremium = planName === 'super_premium_job';
        const isPremiumJob = planName === 'premium_job';

        const title = jobData.job_title || 'Job Title';
        const location = jobData.job_location || 'Location';
        const destination = jobData.destination;
        const route = destination ? `${location} → ${destination}` : location;
        const vehicle = jobData.vehicle_type || 'Vehicle Type';
        const jobId = jobData.job_id || jobData.id;
        const appliedDate = moment(item.created_at || item.Created_at).format("DD MMM YYYY");

        return (
            <View style={{
                backgroundColor: colors.white,
                borderRadius: 16,
                padding: responsiveWidth(4),
                marginBottom: responsiveHeight(2),
                ...shadow,
                shadowColor: 'rgba(0,0,0,0.06)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Premium / Super Premium Corner Chip */}
                {(isSuperPremium || isPremiumJob) && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isSuperPremium ? '#7C3AED' : '#2563EB',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderBottomLeftRadius: 10,
                        zIndex: 10
                    }}>
                        <Ionicons
                            name={isSuperPremium ? "diamond" : "star"}
                            size={12}
                            color="#FFFFFF"
                            style={{ marginRight: 4 }}
                        />
                        <Text style={{
                            color: '#FFFFFF',
                            fontWeight: '700',
                            fontSize: responsiveFontSize(1.1),
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            {isSuperPremium ? t('superPremium', 'Super Premium') : t('premium', 'Premium')}
                        </Text>
                    </View>
                )}

                {/* Header: Title & Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, marginTop: (isSuperPremium || isPremiumJob) ? 8 : 0 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>
                            {title}
                        </Text>
                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B', fontWeight: '500' }}>
                            {t('jobId')}: {jobId}
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: status === 'accepted' ? '#DCFCE7' : '#FEF3C7',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                        marginTop: (isSuperPremium || isPremiumJob) ? 20 : 0
                    }}>
                        <Text style={{
                            color: status === 'accepted' ? '#166534' : '#B45309',
                            fontWeight: '700',
                            fontSize: responsiveFontSize(1.2),
                            textTransform: 'uppercase'
                        }}>
                            {status === 'accepted' ? t('accepted') : t('pending')}
                        </Text>
                    </View>
                </View>

                {/* Details Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                    <View style={{ width: '50%', marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: '#94A3B8', marginBottom: 2 }}>{t('route', 'Route / Location')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="map-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.4), color: '#334155', fontWeight: '600' }} numberOfLines={1}>
                                {route}
                            </Text>
                        </View>
                    </View>

                    <View style={{ width: '50%', marginBottom: 12 }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: '#94A3B8', marginBottom: 2 }}>{t('vehicleType')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="truck-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.4), color: '#334155', fontWeight: '600' }} numberOfLines={1}>
                                {vehicle}
                            </Text>
                        </View>
                    </View>

                    {/* Show Driver Name for Transporter */}
                    {!isDriver && jobData.driver_name && (
                        <View style={{ width: '50%', marginBottom: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.2), color: '#94A3B8', marginBottom: 2 }}>{t('driverName', 'Driver Name')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="person-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#334155', fontWeight: '600' }} numberOfLines={1}>
                                    {jobData.driver_name}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Show Transporter Name for Driver */}
                    {isDriver && jobData.transport_name && (
                        <View style={{ width: '50%', marginBottom: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.2), color: '#94A3B8', marginBottom: 2 }}>{t('transporterName', 'Transporter Name')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="business-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: responsiveFontSize(1.4), color: '#334155', fontWeight: '600' }} numberOfLines={1}>
                                    {jobData.transport_name}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Show Payment Type Badge for both roles */}
                    {jobData.payment_type && (
                        <View style={{ width: '50%', marginBottom: 12 }}>
                            <Text style={{ fontSize: responsiveFontSize(1.2), color: '#94A3B8', marginBottom: 2 }}>{isDriver ? t('yourStatus', 'Your Status') : t('driverType', 'Driver Type')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: jobData.payment_type === 'verified' ? '#DCFCE7' : '#DBEAFE',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 12
                                }}>
                                    <Ionicons
                                        name={jobData.payment_type === 'verified' ? "shield-checkmark" : "checkmark-circle"}
                                        size={12}
                                        color={jobData.payment_type === 'verified' ? '#16A34A' : '#2563EB'}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={{
                                        fontSize: responsiveFontSize(1.3),
                                        color: jobData.payment_type === 'verified' ? '#16A34A' : '#2563EB',
                                        fontWeight: '600',
                                        textTransform: 'capitalize'
                                    }}>
                                        {jobData.payment_type === 'verified' ? t('verified', 'Verified') : t('trusted', 'Trusted')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ width: '100%' }}>
                        <Text style={{ fontSize: responsiveFontSize(1.2), color: '#94A3B8', marginBottom: 2 }}>{t('acceptedOn', 'Accepted On')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: responsiveFontSize(1.4), color: '#334155', fontWeight: '600' }}>
                                {appliedDate}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 }} />

                <TouchableOpacity
                    onPress={() => openManagerModal(item)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.royalBlue,
                        paddingVertical: 12,
                        borderRadius: 12
                    }}
                >
                    <Ionicons name="call" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: responsiveFontSize(1.6), fontWeight: 'bold' }}>
                        {t('callJobManager', 'Call Job Manager')}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <ScreenHeader
                title={t('callJobManager', 'Call Job Manager')}
                subtitle={t('premiumSupport', 'Premium Support Channel')}
                onBackPress={_goBack}
            />

            <View style={{ paddingHorizontal: responsiveWidth(4), marginTop: responsiveHeight(2) }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: responsiveHeight(6), borderWidth: 1, borderColor: '#E2E8F0'
                }}>
                    <Feather name="search" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder={t('searchJobIdOrTitle', 'Search Job ID or Title')}
                        placeholderTextColor="#94A3B8"
                        style={{ flex: 1, marginLeft: 10, color: '#334155', fontSize: responsiveFontSize(1.6) }}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.royalBlue} />
                </View>
            ) : (
                <FlatList
                    data={filteredJobs}
                    renderItem={({ item }) => <JobCard item={item} />}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ padding: responsiveWidth(4), paddingBottom: responsiveHeight(4) }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: responsiveHeight(10) }}>
                            <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
                            <Text style={{ marginTop: 12, fontSize: responsiveFontSize(1.6), color: '#64748B', textAlign: 'center', lineHeight: responsiveFontSize(2.4), paddingHorizontal: 40 }}>
                                {searchText
                                    ? t('noJobsFound', 'No jobs found matching your search')
                                    : t('noPremiumJobs', 'No active Premium Job applications found. Apply to Premium jobs to access this feature.')
                                }
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={closeManagerModal}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={closeManagerModal}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: responsiveWidth(6), paddingBottom: responsiveHeight(5) }}
                    >
                        <View style={{ alignSelf: 'center', width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 20 }} />

                        {selectedJob && (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <MaterialCommunityIcons name="face-agent" size={28} color={colors.royalBlue} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: responsiveFontSize(2), fontWeight: 'bold', color: '#0F172A' }}>
                                            {selectedJob.job?.job_manager_name || selectedJob.job?.manager_name || 'Job Manager'}
                                        </Text>
                                        <Text style={{ fontSize: responsiveFontSize(1.4), color: '#64748B' }}>
                                            {t('assignedManager', 'Assigned Manager')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ marginBottom: 24, gap: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="time-outline" size={20} color="#64748B" style={{ width: 32 }} />
                                        <View>
                                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '600' }}>
                                                09:30 AM - 06:00 PM
                                            </Text>
                                            <Text style={{ fontSize: responsiveFontSize(1.3), color: '#94A3B8' }}>
                                                {t('workingHours', 'Working Hours')}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="language-outline" size={20} color="#64748B" style={{ width: 32 }} />
                                        <View>
                                            <Text style={{ fontSize: responsiveFontSize(1.6), color: '#334155', fontWeight: '600' }}>
                                                Hindi, English
                                            </Text>
                                            <Text style={{ fontSize: responsiveFontSize(1.3), color: '#94A3B8' }}>
                                                {t('languageSupport', 'Language Support')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Availability Status Indicator */}
                                {(() => {
                                    const now = moment();
                                    const startWork = moment().set({ hour: 9, minute: 30, second: 0 });
                                    const endWork = moment().set({ hour: 18, minute: 0, second: 0 });
                                    const isWorkingHours = now.isBetween(startWork, endWork);

                                    return (
                                        <>
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: 16,
                                                paddingVertical: 8,
                                                paddingHorizontal: 12,
                                                backgroundColor: isWorkingHours ? '#DCFCE7' : '#FEE2E2',
                                                borderRadius: 8
                                            }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: isWorkingHours ? '#16A34A' : '#EF4444',
                                                    marginRight: 8
                                                }} />
                                                <Text style={{
                                                    fontSize: responsiveFontSize(1.4),
                                                    color: isWorkingHours ? '#16A34A' : '#EF4444',
                                                    fontWeight: '600'
                                                }}>
                                                    {isWorkingHours
                                                        ? t('available', 'Available Now')
                                                        : t('unavailableNow', 'Unavailable - Outside Working Hours')}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={checkAvailabilityAndCall}
                                                disabled={callingLoading || !isWorkingHours}
                                                style={{
                                                    backgroundColor: !isWorkingHours ? '#94A3B8' : (callingLoading ? '#86EFAC' : '#16A34A'),
                                                    borderRadius: 12,
                                                    paddingVertical: 14,
                                                    alignItems: 'center',
                                                    flexDirection: 'row',
                                                    justifyContent: 'center',
                                                    shadowColor: isWorkingHours ? '#16A34A' : '#94A3B8',
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.3,
                                                    elevation: 8,
                                                    opacity: (callingLoading || !isWorkingHours) ? 0.8 : 1
                                                }}
                                            >
                                                {callingLoading ? (
                                                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                                                ) : (
                                                    <Ionicons name="call" size={20} color="white" style={{ marginRight: 8 }} />
                                                )}
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: responsiveFontSize(1.8) }}>
                                                    {callingLoading
                                                        ? t('connecting', 'Connecting...')
                                                        : (!isWorkingHours
                                                            ? t('callUnavailable', 'Call Unavailable')
                                                            : t('callNow', 'Call Now'))}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default CallJobManagerList;