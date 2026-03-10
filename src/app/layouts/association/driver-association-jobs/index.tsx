import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    RefreshControl,
    Dimensions,
    Modal,
    Keyboard,
    Linking,
    StatusBar,
    SafeAreaView,
    Platform,
    TouchableWithoutFeedback,
    Pressable,
    Share
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { STACKS } from '@truckmitr/stacks/stacks';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import { Driver as ReduxDriver } from '@truckmitr/redux/slices/pilotsSlice';
import { BASE_URL, END_POINTS } from '@truckmitr/utils/config/index';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import RNShare from 'react-native-share';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

// Job Interface matching API response
interface Job {
    id: number;
    transporter_id: string;
    job_id: string;
    job_title: string;
    job_location: string;
    Required_Experience: string;
    Salary_Range: string;
    Type_of_License: string;
    Preferred_Skills: string;
    Application_Deadline: string;
    number_of_drivers_required: string;
    Job_Description: string;
    vehicle_type: string;
    status: string;
    Created_at: string;
    subscription_plan_name: string | null;
    Industry?: string;
    Additional_Benefits?: string;
}

// ------------------- UTILS -------------------

const formatSalary = (salaryRange: string, t: any): string => {
    if (!salaryRange) return t('notSpecified');
    const parts = salaryRange.split('-');
    if (parts.length === 2) {
        return `₹${parseInt(parts[0]).toLocaleString('en-IN')} - ₹${parseInt(parts[1]).toLocaleString('en-IN')}`;
    }
    return `₹${parseInt(salaryRange).toLocaleString('en-IN')}`;
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length <= 2) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${parts[0]} ${months[parseInt(parts[1]) - 1]} ${parts[2]}`;
        }
    }
    return dateStr;
};

const parseSkills = (skillsStr: string): string[] => {
    if (!skillsStr) return [];
    try {
        const parsed = JSON.parse(skillsStr);
        if (Array.isArray(parsed)) return parsed;
        return [skillsStr];
    } catch {
        if (skillsStr.includes(',')) return skillsStr.split(',').map(s => s.trim());
        return [skillsStr];
    }
};

// ------------------- COMPONENTS -------------------

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <View style={styles.detailItemContainer}>
        <View style={styles.detailItemLabel}>
            {icon}
            <Text style={styles.detailItemLabelText}>{label}</Text>
        </View>
        <Text style={styles.detailItemValue}>{value || '-'}</Text>
    </View>
);

const ShimmerJobCard = () => (
    <View style={[styles.jobCard, { height: 230 }]}>
        {/* Header Strip Placeholder */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 80, height: 14, borderRadius: 4 }} />
            <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 40, height: 12, borderRadius: 4 }} />
        </View>

        <View style={{ padding: 16, flex: 1 }}>
            {/* Title & Location Placeholder */}
            <View style={{ marginBottom: 16 }}>
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '85%', height: 22, marginBottom: 10, borderRadius: 4 }} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '50%', height: 16, borderRadius: 4 }} />
            </View>

            {/* Meta Tags Row */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 70, height: 26, borderRadius: 6 }} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 80, height: 26, borderRadius: 6 }} />
                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 90, height: 26, borderRadius: 6 }} />
            </View>

            {/* Footer Placeholder */}
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 110, height: 20, borderRadius: 4 }} />
                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 100, height: 36, borderRadius: 8 }} />
                </View>
            </View>
        </View>
    </View>
);

// ------------------- MAIN COMPONENT -------------------

const DriverAssociationJobs = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // Data State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Share Selection State
    const { allPilots } = useSelector((state: RootState) => state.pilots);
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Data Fetching ---
    const fetchJobs = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const response = await axiosInstance.get(END_POINTS.ALL_JOBS_AND_SEARCH(''));

            if (response?.data?.status) {
                setJobs(response.data.data || []);
            } else {
                setJobs([]);
            }
        } catch (err: any) {
            console.error('Error fetching jobs:', err);
            setError(err?.response?.data?.message || err?.message || t('somethingWentWrong'));
            setJobs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            fetchJobs();
        }, [fetchJobs])
    );

    const onRefresh = () => fetchJobs(true);

    // --- Event Handlers ---

    const openDetails = (job: Job) => {
        setSelectedJob(job);
        setShowDetailsModal(true);
    };

    const closeDetails = () => {
        setShowDetailsModal(false);
        // Do not clear selectedJob immediately to prevent flicker during modal close animation
        setTimeout(() => {
            if (!showShareModal) setSelectedJob(null);
        }, 300);
    };

    const openShare = (job: Job) => {
        setSelectedJob(job);
        setSelectedDrivers([]);
        setSearchQuery('');
        setShowShareModal(true);
    };

    const closeShare = () => {
        setShowShareModal(false);
        setTimeout(() => setSelectedJob(null), 300);
    };

    // --- Share Logic ---

    const filteredDrivers = allPilots.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedDrivers.length === filteredDrivers.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(filteredDrivers.map(d => d.id));
        }
    };

    const toggleDriverSelection = (driverId: number) => {
        if (selectedDrivers.includes(driverId)) {
            setSelectedDrivers(prev => prev.filter(id => id !== driverId));
        } else {
            setSelectedDrivers(prev => [...prev, driverId]);
        }
    };

    const handleShareConfirm = async () => {
        if (selectedDrivers.length === 0) {
            showToast(t('pleaseSelectDriver'));
            return;
        }
        if (!selectedJob) return;

        const message = `*New Job Opportunity from TruckMitr!* \n\n` +
            `*Job:* ${selectedJob.job_title}\n` +
            `*Location:* ${selectedJob.job_location}\n` +
            `*Salary:* ${formatSalary(selectedJob.Salary_Range, t)}\n` +
            `*Experience:* ${selectedJob.Required_Experience || 'N/A'} years\n` +
            `*License:* ${selectedJob.Type_of_License || 'N/A'}\n` +
            `*Deadline:* ${formatDate(selectedJob.Application_Deadline)}\n\n` +
            `*Description:* ${selectedJob.Job_Description ? (selectedJob.Job_Description.substring(0, 150) + (selectedJob.Job_Description.length > 150 ? '...' : '')) : 'Check details in app'}\n\n` +
            `Interested? Apply now on the TruckMitr app!\n` +
            `👉 https://play.google.com/store/apps/details?id=com.truckmitr`;

        setShowShareModal(false);

        try {
            if (selectedDrivers.length === 1) {
                const driver = allPilots.find(p => p.id === selectedDrivers[0]);
                if (driver) {
                    const phone = driver.mobile;
                    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
                    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                        await Linking.openURL(url);
                    } else {
                        await RNShare.open({ message: message, title: selectedJob.job_title });
                    }
                }
            } else {
                await RNShare.open({ message: message, title: selectedJob.job_title });
            }
            showToast(t('jobShared', { count: selectedDrivers.length }));
        } catch (error: any) {
            console.error('Share Error:', error);
            if (!error?.message?.includes('User did not share')) {
                showToast(t('errorOpeningWhatsApp'));
            }
        }
    };

    // --- Native Share (via phone share sheet) ---
    const handleNativeShare = async (job: Job) => {
        const appLink = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/truckmitr/id123456789'
            : 'https://play.google.com/store/apps/details?id=com.truckmitr';

        const message =
            `🚛 *Job Opportunity – TruckMitr*\n\n` +
            `📌 *${job.job_title}*\n` +
            `📍 Location: ${job.job_location}\n` +
            `💰 Salary: ${formatSalary(job.Salary_Range, t)}\n` +
            `🏅 Experience: ${job.Required_Experience || 'N/A'} years\n` +
            `🪪 License: ${job.Type_of_License || 'N/A'}\n` +
            `🚗 Vehicle Type: ${job.vehicle_type || 'N/A'}\n` +
            `📅 Deadline: ${formatDate(job.Application_Deadline)}\n` +
            (job.Job_Description
                ? `\n📝 Description:\n${job.Job_Description.substring(0, 200)}${job.Job_Description.length > 200 ? '...' : ''}\n`
                : '') +
            `\n👉 Download TruckMitr & Apply Now:\n${appLink}`;

        try {
            await Share.share({
                message,
                title: job.job_title,
            });
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Share error:', error);
                showToast(t('somethingWentWrong'));
            }
        }
    };

    // --- Renderers ---

    const renderJobItem = ({ item }: { item: Job }) => {
        const plan = item.subscription_plan_name;
        let badgeConfig = {
            text: 'Standard',
            icon: 'shield-check-outline',
            colors: ['#F1F5F9', '#F8FAFC'],
            textColor: '#64748B',
            borderColor: '#E2E8F0',
            iconColor: '#64748B',
            bg: '#F1F5F9'
        };

        if (plan === 'super_premium_job') {
            badgeConfig = {
                text: 'Super Premium',
                icon: 'crown',
                colors: ['#FFF7ED', '#FFEDD5'],
                textColor: '#B45309',
                borderColor: '#FCD34D',
                iconColor: '#B45309',
                bg: '#FFEDD5'
            };
        } else if (plan === 'premium_job') {
            badgeConfig = {
                text: 'Premium',
                icon: 'star',
                colors: ['#EFF6FF', '#DBEAFE'],
                textColor: '#1D4ED8',
                borderColor: '#93C5FD',
                iconColor: '#1D4ED8',
                bg: '#DBEAFE'
            };
        }

        return (
            <View style={[styles.jobCard, { borderColor: badgeConfig.borderColor }]}>
                {/* Header Badge */}
                <View style={[styles.cardHeaderStrip, { backgroundColor: badgeConfig.bg }]}>
                    <View style={styles.badgeRow}>
                        <MaterialCommunityIcons name={badgeConfig.icon} size={14} color={badgeConfig.iconColor} />
                        <Text style={[styles.badgeText, { color: badgeConfig.textColor }]}>{badgeConfig.text}</Text>
                    </View>
                    <Text style={styles.jobIdText}>ID: {item.job_id}</Text>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.jobTitle} numberOfLines={2}>{item.job_title}</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color="#64748B" />
                                <Text style={styles.locationText}>{item.job_location}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.shareIconBtn} onPress={() => openShare(item)}>
                            <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaTag}>
                            <Ionicons name="time-outline" size={12} color="#6366F1" />
                            <Text style={styles.metaText}>Exp: {item.Required_Experience} yrs</Text>
                        </View>
                        <View style={styles.metaTag}>
                            <Ionicons name="card-outline" size={12} color="#6366F1" />
                            <Text style={styles.metaText}>License: {item.Type_of_License}</Text>
                        </View>
                        <View style={[styles.metaTag, { backgroundColor: '#FEF2F2' }]}>
                            <Ionicons name="calendar-outline" size={12} color="#EF4444" />
                            <Text style={[styles.metaText, { color: '#EF4444' }]}>Deadline: {formatDate(item.Application_Deadline)}</Text>
                        </View>
                    </View>

                    <View style={styles.footerRow}>
                        <Text style={styles.salaryText}>{formatSalary(item.Salary_Range, t)}</Text>
                        <TouchableOpacity style={styles.viewBtn} onPress={() => openDetails(item)}>
                            <Text style={styles.viewBtnText}>{t('viewDetails')}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderDriverItem = (item: ReduxDriver) => {
        const isSelected = selectedDrivers.includes(item.id);
        const status = item.payment_type || 'No Subscription';

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.driverItem, isSelected && styles.driverItemSelected]}
                onPress={() => toggleDriverSelection(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.driverItemLeft}>
                    <Image
                        source={{ uri: item.images ? (item.images.startsWith('http') ? item.images : `${BASE_URL}public/${item.images}`) : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                        style={styles.driverImage}
                    />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <Text style={styles.driverUniqueId}>{item.unique_id}</Text>
                    </View>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScreenHeader title={t('association_jobs')} titleCount={jobs.length} />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {[1, 2, 3].map(i => <ShimmerJobCard key={i} />)}
                    </ScrollView>
                </View>
            ) : error || jobs.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name={error ? "alert-circle-outline" : "briefcase-outline"} size={64} color="#CBD5E1" />
                    <Text style={styles.emptyText}>{error || t('noJobsAvailable')}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchJobs()}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryText}>{t('refresh')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                />
            )}

            {/* --- JOBS DETAIL MODAL (Bottom Sheet Style) --- */}
            <Modal
                visible={showDetailsModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closeDetails}
                statusBarTranslucent={true}
            >
                <View style={[styles.modalOverlay, { width: Dimensions.get('screen').width, height: Dimensions.get('screen').height }]}>
                    <TouchableWithoutFeedback onPress={closeDetails}>
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        {selectedJob && (
                            <View style={{ width: '100%', flexShrink: 1 }}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('jobDetails')}</Text>
                                    <TouchableOpacity onPress={closeDetails} style={styles.closeBtn}>
                                        <Ionicons name="close" size={24} color="#64748B" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    nestedScrollEnabled={true}
                                >
                                    <Pressable>
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailJobTitle}>{selectedJob.job_title}</Text>
                                            <Text style={styles.detailJobSalary}>{formatSalary(selectedJob.Salary_Range, t)}</Text>
                                            <Text style={styles.detailJobLoc}>{selectedJob.job_location} • {selectedJob.vehicle_type}</Text>
                                        </View>

                                        <View style={styles.gridContainer}>
                                            <DetailItem icon={<MaterialCommunityIcons name="card-account-details-outline" size={16} color="#3B82F6" />} label={t('jobIdLabel')} value={selectedJob.job_id} />
                                            <DetailItem icon={<FontAwesome name="calendar" size={14} color="#3B82F6" />} label={t('postedOn')} value={moment(selectedJob.Created_at).format("DD MMM YYYY")} />
                                            <DetailItem icon={<FontAwesome6 name="users" size={14} color="#3B82F6" />} label={t('openPositions')} value={selectedJob.number_of_drivers_required} />
                                            <DetailItem icon={<FontAwesome name="star" size={14} color="#3B82F6" />} label={t('experienceRequired')} value={selectedJob.Required_Experience + ' Yrs'} />
                                        </View>

                                        <View style={styles.descSection}>
                                            <Text style={styles.sectionHeader}>{t('jobDescription')}</Text>
                                            <Text style={styles.descText}>{selectedJob.Job_Description?.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}</Text>
                                        </View>

                                        <TouchableOpacity style={styles.shareFullBtn} onPress={() => handleNativeShare(selectedJob)}>
                                            <Ionicons name="share-social" size={18} color="#fff" />
                                            <Text style={styles.shareFullText}>{t('shareJobDetails')}</Text>
                                        </TouchableOpacity>
                                    </Pressable>
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* --- SHARE MODAL (Bottom Sheet Style) --- */}
            <Modal
                visible={showShareModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closeShare}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeShare}>
                    <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { height: '80%' }]} onPress={() => { }}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('shareJob')}</Text>
                            <TouchableOpacity onPress={closeShare} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('searchDrivers')}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                            <TouchableOpacity onPress={toggleSelectAll}>
                                <Text style={{ color: '#3B82F6', fontWeight: '600' }}>
                                    {selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0 ? t('deselectAll') : t('selectAll')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={filteredDrivers}
                            keyExtractor={item => String(item.id)}
                            renderItem={({ item }) => renderDriverItem(item)}
                            contentContainerStyle={{ paddingBottom: 80 }}
                            ListEmptyComponent={
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#94A3B8' }}>{t('noDriversAvailable')}</Text>
                                </View>
                            }
                        />

                        {/* Floating Bottom Button for Share */}
                        {selectedDrivers.length > 0 && (
                            <View style={[styles.floatingFooter, { paddingBottom: insets.bottom + 10 }]}>
                                <TouchableOpacity style={styles.confirmShareBtn} onPress={handleShareConfirm}>
                                    <Text style={styles.confirmShareText}>{t('shareAction')} ({selectedDrivers.length})</Text>
                                    <Ionicons name="send" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },

    // Cards
    jobCard: {
        backgroundColor: '#fff', borderRadius: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, overflow: 'hidden'
    },
    jobHeader: {
        flexDirection: 'row', justifyContent: 'space-between', padding: 16
    },
    jobInfo: {
        flex: 1, marginRight: 12
    },
    cardHeaderStrip: {
        flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6
    },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    jobIdText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
    cardContent: { padding: 16 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    jobTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12, color: '#64748B' },
    shareIconBtn: { padding: 4 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
    metaTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
    },
    metaText: { fontSize: 11, color: '#6366F1', fontWeight: '600' },
    footerRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9'
    },
    salaryText: { fontSize: 14, fontWeight: '700', color: '#059669' },
    viewBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8
    },
    viewBtnText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },

    // Empty State
    emptyText: { fontSize: 16, color: '#64748B', marginTop: 12, fontWeight: '600' },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 16, backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8
    },
    retryText: { color: '#fff', fontWeight: '600' },

    // Modals
    modalOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: Dimensions.get('screen').width, height: Dimensions.get('screen').height,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 9999
    },
    modalContent: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, width: '100%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    closeBtn: { padding: 4 },

    // Details Modal
    detailSection: { marginBottom: 20 },
    detailJobTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
    detailJobSalary: { fontSize: 18, fontWeight: '700', color: '#059669', marginBottom: 4 },
    detailJobLoc: { fontSize: 14, color: '#64748B' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    detailItemContainer: { width: '48%', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 12 },
    detailItemLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    detailItemLabelText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
    detailItemValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
    descSection: { marginBottom: 24 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
    descText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    shareFullBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 12
    },
    shareFullText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Share Modal
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9',
        borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1E293B' },
    driverItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0'
    },
    driverItemSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    driverItemLeft: { flexDirection: 'row', alignItems: 'center' },
    driverImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
    driverName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    driverUniqueId: { fontSize: 12, color: '#64748B' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    checkboxSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    floatingFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9'
    },
    confirmShareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 12
    },
    confirmShareText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});

export default DriverAssociationJobs;
