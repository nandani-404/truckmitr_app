import { Image, Text, View, FlatList, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop } from '@truckmitr/src/app/functions';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { useSelector } from 'react-redux';



export default function ForemanApplications() {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content');
    const colors = useColor();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation();
    const { shadow } = useShadow();
    const user = useSelector((state: any) => state.user.user);
    const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
    const [jobs, setJobs] = useState<any[]>([]); // Initialize with empty array
    const [loading, setLoading] = useState(false); // Add loading state

    const [driverModalVisible, setDriverModalVisible] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);

    const openDriverDetails = (driver: any) => {
        setSelectedDriver(driver);
        setDriverModalVisible(true);
    };

    useEffect(() => {
        if (user?.id) {
            fetchAppliedDrivers();
        }
    }, [user?.id]);

    const fetchAppliedDrivers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.FOREMAN_APPLIED_DRIVERS(user?.id));
            if (response.data && response.data.success) {
                const mappedJobs = response.data.jobs.map((job: any) => ({
                    job_id: job.job_id,
                    job_unique_id: job.job_unique_id,
                    job_title: job.job_title,
                    applicants: job.drivers.map((driver: any, index: number) => ({
                        application_id: driver.unique_id, // Use unique_id as application_id since API doesn't provide one
                        driver_name: driver.name,
                        unique_id: driver.unique_id,
                        mobile: driver.mobile || t('notAvailable'),
                        rating: driver.rating || 0,
                        driver_type: driver.driver_type || t('driver'),
                        city: driver.city || t('notAvailable'),
                        states: driver.state_name || t('notAvailable'),
                        driving_exp: driver.Driving_Experience ? `${driver.Driving_Experience} ${driver.Driving_Experience === '1' ? t('year') : t('years')}` : t('notAvailable'),
                        license_type: driver.Type_of_License || t('notAvailable'),
                        license_no: driver.License_Number || t('notAvailable'),
                        license_expiry: driver.Expiry_date_of_License,
                        payment_type: driver.subscription_type || driver.payment_type || 'job_ready',
                        driver_picture: driver.images,
                        current_status: driver.status || 'Pending',
                        email: driver.email || ''
                    }))
                }));
                // Auto expand if there are jobs
                if (mappedJobs.length > 0) {
                    // Optionally expand first job
                }
                setJobs(mappedJobs);
            }
        } catch (error) {
            console.error('Error fetching applied drivers:', error);
            // showToast('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const toggleJob = (jobId: string) => {
        setExpandedJobIds(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    const getDriverTag = (type: string) => {
        if (type?.toLowerCase() === 'trusted') return { label: t('trusted'), color: '#7C3AED', bgColor: '#F3E8FF' }; // Purple
        if (type?.toLowerCase() === 'verified') return { label: t('verified'), color: '#2563EB', bgColor: '#DBEAFE' }; // Blue
        if (type?.toLowerCase() === 'legacy') return { label: t('legacy'), color: '#D97706', bgColor: '#FEF3C7' }; // Amber
        return { label: t('jobReady'), color: '#16A34A', bgColor: '#DCFCE7' }; // Green
    };

    const maskLicense = (license: string) => {
        if (!license || license.length < 4) return '****';
        return `${'X'.repeat(Math.max(0, license.length - 4))}${license.slice(-4)}`;
    };



    const DetailRow = ({ label, value }: { label: string, value: string }) => (
        <View style={{ marginBottom: 8, width: '50%' }}>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{value}</Text>
        </View>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />
            {/* Header */}
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={() => navigation.goBack()} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t('applicationTitle')}</Text>
            </View>

            <FlatList
                data={jobs}
                keyExtractor={item => item.job_id ? item.job_id.toString() : Math.random().toString()} // Ensure key is string
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.royalBlue} />
                        ) : (
                            <Text style={{ color: '#64748B', fontSize: 16 }}>{t('noApplicationsFound')}</Text>
                        )}
                    </View>
                )}
                renderItem={({ item: job }) => {
                    const isExpanded = expandedJobIds.includes(job.job_id);
                    return (
                        <View style={{ marginBottom: 16 }}>
                            {/* Job Card (Horizontal & Expandable) */}
                            <TouchableOpacity
                                onPress={() => toggleJob(job.job_id)}
                                activeOpacity={0.9}
                                style={{
                                    backgroundColor: '#1E3A8A', // Modern Deep Royal Blue
                                    borderRadius: 12,
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    shadowColor: '#1E3A8A',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4,
                                    marginBottom: 4
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>{job.job_title}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                                            <Text style={{ fontSize: 11, color: '#E0F2FE', fontWeight: '600' }}>{job.job_unique_id || job.job_id}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="people-outline" size={13} color="#93C5FD" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 13, color: '#BFDBFE', fontWeight: '500' }}>
                                                {job.applicants.length} {job.applicants.length === 1 ? t('applicant') : t('applicants')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 6, borderRadius: 16 }}>
                                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>

                            {/* Expanded Content: Driver Cards */}
                            {isExpanded && (
                                <View style={{ marginTop: 12, paddingLeft: 8 }}>
                                    {job.applicants.map((driver: any) => {
                                        const tag = getDriverTag(driver.payment_type);
                                        const profileImage = driver.driver_picture ? { uri: `${BASE_URL}public/${driver.driver_picture}` } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' };

                                        return (
                                            <View key={driver.application_id} style={{
                                                backgroundColor: '#fff',
                                                borderRadius: 12,
                                                padding: 16,
                                                marginBottom: 12,
                                                borderWidth: 1,
                                                borderColor: '#E2E8F0',
                                                ...shadow
                                            }}>
                                                {/* Header Portion: Icon + Basic Info */}
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                                                    {/* Profile Icon with Badge */}
                                                    <View style={{ alignItems: 'center', marginRight: 16 }}>
                                                        <View style={{ position: 'relative' }}>
                                                            <Image source={profileImage} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: tag.color }} />
                                                            <View style={{
                                                                position: 'absolute',
                                                                bottom: -6,
                                                                backgroundColor: tag.color,
                                                                paddingHorizontal: 6,
                                                                paddingVertical: 2,
                                                                borderRadius: 8,
                                                                alignSelf: 'center'
                                                            }}>
                                                                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>{tag.label}</Text>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    {/* Basic Info */}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>{driver.driver_name}</Text>
                                                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{driver.unique_id}</Text>

                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                <FontAwesome name="star" size={12} color="#D97706" />
                                                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706', marginLeft: 4 }}>{driver.rating}</Text>
                                                            </View>
                                                            <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>{driver.driver_type}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>

                                                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 }} />

                                                {/* Details Grid */}
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                    <DetailRow label={t('mobileNumber')} value={driver.mobile} />
                                                    <DetailRow label={t('city')} value={driver.city} />
                                                    <DetailRow label={t('state')} value={driver.states} />
                                                    <DetailRow label={t('experience')} value={driver.driving_exp} />
                                                    <DetailRow label={t('licenseType')} value={driver.license_type} />
                                                    <DetailRow label={t('licenseNumber')} value={maskLicense(driver.license_no)} />
                                                    <DetailRow label={t('expiryDateOfLicense')} value={driver.license_expiry ? moment(driver.license_expiry).format('DD MMM YYYY') : t('notAvailable')} />
                                                </View>

                                                {/* Actions */}
                                                {driver.current_status !== 'Pending' && (
                                                    <View style={{ marginTop: 8 }}>
                                                        <View style={{
                                                            width: '100%',
                                                            backgroundColor: driver.current_status === 'Accepted' ? '#DCFCE7' : driver.current_status === 'Rejected' ? '#FEE2E2' : '#F1F5F9',
                                                            paddingVertical: 10,
                                                            borderRadius: 8,
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Text style={{
                                                                color: driver.current_status === 'Accepted' ? '#166534' : driver.current_status === 'Rejected' ? '#991B1B' : '#64748B',
                                                                fontWeight: '700'
                                                            }}>
                                                                {driver.current_status}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}

                                                <TouchableOpacity onPress={() => openDriverDetails(driver)} style={{ marginTop: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, alignItems: 'center', backgroundColor: '#EFF6FF' }}>
                                                    <Text style={{ color: '#2563EB', fontWeight: '600' }}>{t('viewDriverDetail')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                }}
            />

            {/* Driver Detail Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={driverModalVisible}
                onRequestClose={() => setDriverModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: safeAreaInsets.top }}>
                        <TouchableOpacity onPress={() => setDriverModalVisible(false)} style={{ padding: 8, marginLeft: -8 }}>
                            <Ionicons name="arrow-back" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginLeft: 8 }}>{t('driverDetails')}</Text>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {selectedDriver && (
                            <View>
                                {/* Profile Card */}
                                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                    <View style={{ position: 'relative', marginBottom: 16 }}>
                                        <Image
                                            source={selectedDriver.driver_picture ? { uri: `${BASE_URL}public/${selectedDriver.driver_picture}` } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                                            style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: getDriverTag(selectedDriver.payment_type).color }}
                                        />
                                        <View style={{ position: 'absolute', bottom: -8, alignSelf: 'center', backgroundColor: getDriverTag(selectedDriver.payment_type).color, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
                                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{getDriverTag(selectedDriver.payment_type).label}</Text>
                                        </View>
                                    </View>

                                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 4 }}>{selectedDriver.driver_name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                                        <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedDriver.unique_id}</Text>
                                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1', marginHorizontal: 8 }} />
                                        <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedDriver.driver_type}</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 }}>
                                        <FontAwesome name="star" size={12} color="#D97706" />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706', marginLeft: 4 }}>{selectedDriver.rating} {t('rating')}</Text>
                                    </View>
                                </View>

                                {/* Personal & License Details */}
                                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 14 }}>{t('personalAndLicenseDetails')}</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
                                        <DetailRow label={t('city')} value={selectedDriver.city} />
                                        <DetailRow label={t('state')} value={selectedDriver.states} />
                                        <DetailRow label={t('drivingExperience')} value={selectedDriver.driving_exp} />
                                        <DetailRow label={t('licenseType')} value={selectedDriver.license_type} />
                                        <DetailRow label={t('licenseNumber')} value={maskLicense(selectedDriver.license_no)} />
                                        <DetailRow label={t('expiryDateOfLicense')} value={selectedDriver.license_expiry ? moment(selectedDriver.license_expiry).format('DD MMM YYYY') : t('notAvailable')} />
                                    </View>
                                </View>

                                {/* Contact Information */}
                                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 14 }}>{t('contactInformation')}</Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Ionicons name="call" size={18} color={colors.royalBlue} />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 12, color: '#64748B' }}>{t('mobileNumber')}</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>+91 {selectedDriver.mobile}</Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Ionicons name="mail" size={18} color={colors.royalBlue} />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 12, color: '#64748B' }}>{t('emailID')}</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{selectedDriver.email || 'driver@truckmitr.com'}</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${selectedDriver.mobile}`)}
                                        style={{ backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        <Ionicons name="call" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{t('callDriver')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
}
