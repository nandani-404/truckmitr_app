import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, TextInput, RefreshControl, ActivityIndicator, Dimensions, Modal, Keyboard, Linking, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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


// Format salary range
const formatSalary = (salaryRange: string, t: any): string => {
    if (!salaryRange) return t('notSpecified');
    const parts = salaryRange.split('-');
    if (parts.length === 2) {
        return `₹${parseInt(parts[0]).toLocaleString('en-IN')} - ₹${parseInt(parts[1]).toLocaleString('en-IN')}`;
    }
    return `₹${parseInt(salaryRange).toLocaleString('en-IN')}`;
};

// Format date
const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    // Handle format like "31-01-2026"
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length <= 2) {
            // Check if it matches expected DD-MM-YYYY format or similar
            // For general date formatting, using a library or simple logic is fine
            // Returning dateStr or formatted for now, localization of months is better handled with library but simple map works
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${parts[0]} ${months[parseInt(parts[1]) - 1]} ${parts[2]}`;
        }
    }
    return dateStr;
};

// Calculate time ago
const getTimeAgo = (dateStr: string, t: any): string => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return t('justNow');
        if (diffHours < 24) return t('hoursAgo', { count: diffHours });
        if (diffDays === 1) return t('dayAgo');
        if (diffDays < 7) return t('daysAgo', { count: diffDays });
        if (diffDays < 30) return t('weeksAgo', { count: Math.floor(diffDays / 7) });
        return t('monthsAgo', { count: Math.floor(diffDays / 30) });
    } catch {
        return '';
    }
};

// Parse skills from JSON string to array
const parseSkills = (skillsStr: string): string[] => {
    if (!skillsStr) return [];
    try {
        // Handle JSON array string like "[\"skill1\",\"skill2\"]"
        const parsed = JSON.parse(skillsStr);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [skillsStr];
    } catch {
        // If parsing fails, try splitting by comma or return as single item
        if (skillsStr.includes(',')) {
            return skillsStr.split(',').map(s => s.trim());
        }
        return [skillsStr];
    }
};

// Detail Item Component for Job Details grid
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <View style={styles.detailItemContainer}>
        <View style={styles.detailItemLabel}>
            {icon}
            <Text style={styles.detailItemLabelText}>{label}</Text>
        </View>
        <Text style={styles.detailItemValue}>{value || '-'}</Text>
    </View>
);

// Shimmer Job Card Placeholder
const ShimmerJobCard = () => (
    <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
            <View style={styles.jobInfo}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{ width: '80%', height: 20, borderRadius: 4, marginBottom: 8 }}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{ width: '50%', height: 14, borderRadius: 4 }}
                />
            </View>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 36, height: 36, borderRadius: 8 }}
            />
        </View>

        <View style={styles.jobDetailsRow}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 120, height: 24, borderRadius: 6, marginRight: 8 }}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 100, height: 24, borderRadius: 6 }}
            />
        </View>

        <View style={styles.salaryRow}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 140, height: 18, borderRadius: 4 }}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 70, height: 14, borderRadius: 4 }}
            />
        </View>

        <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={{ width: '100%', height: 36, borderRadius: 8, marginTop: 8 }}
        />
    </View>
);

const DriverAssociationJobs = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Job Details Modal State
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Bottom Sheet State
    const shareSheetRef = useRef<BottomSheet>(null);
    const shareSnapPoints = useMemo(() => ['70%', '90%'], []);

    const { allPilots } = useSelector((state: RootState) => state.pilots);

    // Share state
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Jobs
    const fetchJobs = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const response = await axiosInstance.get(END_POINTS.ALL_JOBS_AND_SEARCH(''));
            console.log('Jobs API Response:', response?.data);

            if (response?.data?.status) {
                setJobs(response.data.data || []);
            } else {
                setError(response?.data?.message || t('errorFetchingData'));
                setJobs([]);
            }
        } catch (err: any) {
            console.error('Error fetching jobs:', err);
            console.error('Error fetching jobs:', err);
            setError(err?.response?.data?.message || err?.message || t('somethingWentWrong'));
            setJobs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchJobs();
        }, [fetchJobs])
    );

    const onRefresh = () => {
        fetchJobs(true);
    };

    const handleViewDetails = (job: Job) => {
        setSelectedJob(job);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedJob(null);
    };

    const handleSharePress = (job: Job) => {
        setSelectedJob(job);
        setSelectedDrivers([]);
        setSearchQuery('');
        shareSheetRef.current?.expand();
    };

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

        // Construct the share message
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

        shareSheetRef.current?.close();

        try {
            if (selectedDrivers.length === 1) {
                // Direct share to specific driver
                const driver = allPilots.find(p => p.id === selectedDrivers[0]);
                if (driver) {
                    const phone = driver.mobile;
                    // Ensure 91 prefix for India if not present
                    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
                    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                        await Linking.openURL(url);
                    } else {
                        // Fallback to general sharing
                        await RNShare.open({
                            message: message,
                            title: selectedJob.job_title,
                        });
                    }
                }
            } else {
                // Multiple drivers selected - Open share sheet
                // This allows the user to select WhatsApp and then pick multiple recipients
                await RNShare.open({
                    message: message,
                    title: selectedJob.job_title,
                });
            }
            showToast(t('jobShared', { count: selectedDrivers.length }));
        } catch (error: any) {
            console.error('Error sharing to WhatsApp:', error);
            if (!error?.message?.includes('User did not share')) {
                showToast(t('errorOpeningWhatsApp'));
            }
        }
    };

    const handleAddDriver = () => {
        shareSheetRef.current?.close();
        navigation.navigate(STACKS.FOREMAN_ADD_DRIVER as never);
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
            />
        ),
        []
    );


    const renderJobItem = ({ item }: { item: Job }) => {
        const plan = item.subscription_plan_name;

        // Define interface for config to avoid type inference locking
        interface PlanConfig {
            text: string;
            icon: string;
            colors: string[];
            textColor: string;
            borderColor: string;
            iconColor: string;
        }

        let badgeConfig: PlanConfig = {
            text: 'Standard Job',
            icon: 'shield-check-outline',
            colors: ['#F1F5F9', '#F8FAFC'],
            textColor: '#64748B',
            borderColor: '#E2E8F0',
            iconColor: '#64748B'
        };

        if (plan === 'super_premium_job') {
            badgeConfig = {
                text: 'Super Premium',
                icon: 'crown',
                colors: ['#FFF7ED', '#FFEDD5'],
                textColor: '#B45309',
                borderColor: '#FCD34D',
                iconColor: '#B45309'
            };
        } else if (plan === 'premium_job') {
            badgeConfig = {
                text: 'Premium Job',
                icon: 'star',
                colors: ['#EFF6FF', '#DBEAFE'],
                textColor: '#1D4ED8',
                borderColor: '#93C5FD',
                iconColor: '#1D4ED8'
            };
        }

        return (
            <View style={[styles.jobCard, { borderColor: badgeConfig.borderColor }]}>
                {/* Plan Badge Header */}
                <View style={[styles.planHeader, { backgroundColor: badgeConfig.colors[1] }]}>
                    <View style={styles.planBadgeContainer}>
                        <MaterialCommunityIcons name={badgeConfig.icon} size={14} color={badgeConfig.iconColor} />
                        <Text style={[styles.planBadgeText, { color: badgeConfig.textColor }]}>
                            {badgeConfig.text}
                        </Text>
                    </View>
                    <View style={styles.jobIdContainer}>
                        <Text style={styles.jobIdText}>ID: {item.job_id}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.jobHeader}>
                        <View style={styles.jobInfo}>
                            <Text style={styles.jobTitle} numberOfLines={2}>{item.job_title}</Text>
                            <Text style={styles.jobDateTime}>{moment(item.Created_at).format('DD MMM YYYY')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => handleSharePress(item)}
                            style={styles.shareButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.jobDetailsRow}>
                        <View style={styles.detailBadge}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={styles.detailText}>{item.job_location}</Text>
                        </View>
                        <View style={styles.detailBadge}>
                            <Ionicons name="calendar-outline" size={14} color="#64748B" />
                            <Text style={styles.detailText}>{t('deadline')}: {formatDate(item.Application_Deadline)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoTagsRow}>
                        <View style={styles.infoTag}>
                            <Ionicons name="car-outline" size={12} color="#6366F1" />
                            <Text style={styles.infoTagText}>{item.vehicle_type}</Text>
                        </View>
                        <View style={styles.infoTag}>
                            <Ionicons name="time-outline" size={12} color="#6366F1" />
                            <Text style={styles.infoTagText}>{t('experience')}: {item.Required_Experience} years</Text>
                        </View>
                        <View style={styles.infoTag}>
                            <Ionicons name="card-outline" size={12} color="#6366F1" />
                            <Text style={styles.infoTagText}>{item.Type_of_License}</Text>
                        </View>
                    </View>

                    <View style={styles.salaryRow}>
                        <Text style={styles.salaryText}>{formatSalary(item.Salary_Range, t)}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.viewDetailsButton}
                        onPress={() => handleViewDetails(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewDetailsText}>{t('viewDetails')}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                    </TouchableOpacity>
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
                <View style={styles.driverInfoLeft}>
                    <Image
                        source={{
                            uri: item.images
                                ? (item.images.startsWith('http') ? item.images : `${BASE_URL}public/${item.images}`)
                                : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'
                        }}
                        style={styles.driverImage}
                    />
                    <View style={styles.driverTextContainer}>
                        <View style={styles.nameStatusRow}>
                            <Text style={styles.driverName}>{item.name}</Text>
                            <View style={[styles.statusBadge, {
                                backgroundColor: status.toLowerCase().includes('trusted') ? '#F3E8FF' :
                                    status.toLowerCase().includes('verified') ? '#DCFCE7' :
                                        status.toLowerCase().includes('job_ready') ? '#DBEAFE' : '#F1F5F9'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: status.toLowerCase().includes('trusted') ? '#7E22CE' :
                                        status.toLowerCase().includes('verified') ? '#166534' :
                                            status.toLowerCase().includes('job_ready') ? '#1E40AF' : '#64748B'
                                }]}>
                                    {status.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.driverTmId}>{item.unique_id}</Text>
                    </View>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

    const renderShimmerList = () => (
        <View style={styles.listContent}>
            {[1, 2, 3, 4].map((_, index) => (
                <ShimmerJobCard key={index} />
            ))}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t('noJobsAvailable')}</Text>
            <Text style={styles.emptySubtitle}>{t('checkBackLater')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobs()}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryText}>{t('refresh')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>{t('somethingWentWrong')}</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobs()}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryText}>{t('tryAgain')}</Text>
            </TouchableOpacity>
        </View>
    );

    // Render Job Details Bottom Sheet Content
    const renderJobDetailsSheet = () => {
        if (!selectedJob) return null;

        const isSuperPremium = selectedJob?.subscription_plan_name === 'super_premium_job';
        const isPremium = selectedJob?.subscription_plan_name === 'premium_job';

        return (
            <ScrollView
                style={styles.sheetContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Title and Close Button */}
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetHeaderTitle}>{t('jobDetails')}</Text>
                    <TouchableOpacity style={styles.closeSheetButton} onPress={handleCloseDetailsModal}>
                        <Ionicons name="close-circle" size={28} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Premium Badge */}
                {isSuperPremium && (
                    <View style={styles.superPremiumBadge}>
                        <LinearGradient
                            colors={['#4A90D9', '#1a5fb4', '#0d47a1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumGradient}
                        >
                            <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
                            <Text style={styles.superPremiumText}>{t('superPremiumJob')}</Text>
                        </LinearGradient>
                    </View>
                )}
                {isPremium && !isSuperPremium && (
                    <View style={styles.premiumBadge}>
                        <LinearGradient
                            colors={['#FFE066', '#FFD700', '#DAA520']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumGradient}
                        >
                            <MaterialCommunityIcons name="crown" size={16} color="#5C4300" />
                            <Text style={styles.premiumText}>{t('premiumJob')}</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Job Title Section */}
                <View style={styles.sheetTitleSection}>
                    <Text style={styles.sheetJobEmoji}>🚚</Text>
                    <View style={styles.sheetTitleContainer}>
                        <Text style={styles.sheetJobTitle}>{selectedJob.job_title}</Text>
                        <Text style={styles.sheetVehicleType}>{selectedJob.vehicle_type}</Text>
                    </View>
                </View>

                {/* Salary Section */}
                <View style={styles.sheetSalarySection}>
                    <Text style={styles.sheetSalaryLabel}>{t('monthlySalary')}</Text>
                    <Text style={styles.sheetSalaryValue}>{formatSalary(selectedJob.Salary_Range, t)}</Text>
                    {selectedJob.Additional_Benefits && (
                        <Text style={styles.sheetBenefits}>{t('benefits')}: {selectedJob.Additional_Benefits}</Text>
                    )}
                </View>

                {/* Job Details Grid */}
                <View style={styles.sheetDetailsSection}>
                    <View style={styles.sheetSectionHeader}>
                        <MaterialCommunityIcons name="briefcase-outline" size={20} color="#3B82F6" />
                        <Text style={styles.sheetSectionTitle}>{t('jobDetails')}</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailsRow}>
                            <DetailItem
                                icon={<MaterialCommunityIcons name="card-account-details-outline" size={16} color="#3B82F6" />}
                                label={t('jobIdLabel')}
                                value={selectedJob.job_id}
                            />
                            <DetailItem
                                icon={<FontAwesome name="calendar" size={14} color="#3B82F6" />}
                                label={t('postedOn')}
                                value={moment(selectedJob.Created_at).format("DD MMM YYYY")}
                            />
                        </View>

                        <View style={styles.detailsRow}>
                            <DetailItem
                                icon={<FontAwesome6 name="location-dot" size={14} color="#3B82F6" />}
                                label={t('location')}
                                value={selectedJob.job_location}
                            />
                            <DetailItem
                                icon={<FontAwesome6 name="users" size={14} color="#3B82F6" />}
                                label={t('openPositions')}
                                value={selectedJob.number_of_drivers_required || '-'}
                            />
                        </View>

                        <View style={styles.detailsRow}>
                            <DetailItem
                                icon={<FontAwesome name="star" size={14} color="#3B82F6" />}
                                label={t('experienceRequired')}
                                value={`${selectedJob.Required_Experience} ${t('yearsSuffix')}`}
                            />
                            <DetailItem
                                icon={<MaterialCommunityIcons name="license" size={16} color="#3B82F6" />}
                                label={t('licenseType')}
                                value={selectedJob.Type_of_License?.toUpperCase()}
                            />
                        </View>

                        <View style={styles.detailsRow}>
                            <DetailItem
                                icon={<MaterialCommunityIcons name="truck" size={16} color="#3B82F6" />}
                                label={t('vehicleType')}
                                value={selectedJob.vehicle_type}
                            />
                            <DetailItem
                                icon={<FontAwesome name="calendar-check-o" size={14} color="#3B82F6" />}
                                label={t('applicationDeadline')}
                                value={formatDate(selectedJob.Application_Deadline)}
                            />
                        </View>

                        {selectedJob.Industry && (
                            <View style={styles.detailsRow}>
                                <DetailItem
                                    icon={<MaterialCommunityIcons name="domain" size={16} color="#3B82F6" />}
                                    label={t('industry')}
                                    value={selectedJob.Industry}
                                />
                                <View style={{ flex: 1 }} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Job Description */}
                {selectedJob.Job_Description && (
                    <View style={styles.sheetDescriptionSection}>
                        <Text style={styles.sheetDescriptionTitle}>{t('jobDescription')}</Text>
                        <Text style={styles.sheetDescriptionText}>{selectedJob.Job_Description}</Text>
                    </View>
                )}

                {/* Preferred Skills */}
                {selectedJob.Preferred_Skills && parseSkills(selectedJob.Preferred_Skills).length > 0 && (
                    <View style={styles.sheetSkillsSection}>
                        <Text style={styles.sheetSkillsTitle}>{t('preferredSkills')}</Text>
                        <View style={styles.skillsTagsContainer}>
                            {parseSkills(selectedJob.Preferred_Skills).map((skill, index) => (
                                <View key={index} style={styles.skillTag}>
                                    <Text style={styles.skillTagText}>{skill}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Share Button */}
                <TouchableOpacity
                    style={styles.shareJobButton}
                    onPress={() => {
                        handleCloseDetailsModal();
                        setTimeout(() => handleSharePress(selectedJob), 300);
                    }}
                >
                    <Ionicons name="share-social-outline" size={20} color="#fff" />
                    <Text style={styles.shareJobButtonText}>{t('shareWithDrivers')}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        );
    };

    // Render Share Sheet Content
    const renderShareSheet = () => {
        return (
            <View style={[styles.sheetContent, { flex: 1 }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('shareJob')}</Text>
                    <TouchableOpacity onPress={() => shareSheetRef.current?.close()}>
                        <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>{t('selectDriversToShare')}</Text>

                <View style={styles.searchRow}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#64748B" />
                        <TextInput
                            placeholder={t('searchDrivers')}
                            style={styles.searchInput}
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
                        <Text style={styles.selectAllText}>
                            {selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0 ? t('deselectAll') : t('selectAll')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <BottomSheetFlatList
                    data={filteredDrivers}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => renderDriverItem(item)}
                    style={styles.driverListContainer}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptySearchContainer}>
                            <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptySearchTitle}>
                                {allPilots.length === 0
                                    ? t('noDriversAddedYet', { defaultValue: 'No drivers added by you' })
                                    : searchQuery
                                        ? t('noMatchingDrivers')
                                        : t('noDriversAvailable')}
                            </Text>
                            <Text style={styles.emptySearchSubtitle}>
                                {allPilots.length === 0
                                    ? t('pleaseAddFirst', { defaultValue: 'Please add first' })
                                    : searchQuery
                                        ? t('tryDifferentSearch')
                                        : t('checkBackLater')}
                            </Text>
                            {allPilots.length === 0 && (
                                <TouchableOpacity
                                    style={styles.addDriverButtonSmall}
                                    onPress={handleAddDriver}
                                >
                                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                                    <Text style={styles.addDriverButtonTextSmall}>{t('addDriver')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    ListFooterComponent={<View style={{ height: 20 }} />}
                />

                {allPilots.length > 0 && (
                    <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 10 }]}>
                        <TouchableOpacity
                            style={[styles.shareConfirmButton, selectedDrivers.length === 0 && styles.disabledButton]}
                            onPress={handleShareConfirm}
                            disabled={selectedDrivers.length === 0}
                        >
                            <Text style={styles.shareConfirmText}>{t('shareAction')} ({selectedDrivers.length})</Text>
                            <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('availableJobs')}</Text>
                    <View style={styles.headerRight}>
                        <Text style={styles.jobCount}>{jobs.length} {t('jobsLowercase')}</Text>
                    </View>
                </View>

                {loading ? (
                    renderShimmerList()
                ) : error && jobs.length === 0 ? (
                    renderErrorState()
                ) : jobs.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={jobs}
                        renderItem={renderJobItem}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        initialNumToRender={5}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#3B82F6']}
                            />
                        }
                    />
                )}


                {/* Share Driver Selection Bottom Sheet */}
                <BottomSheet
                    ref={shareSheetRef}
                    index={-1}
                    snapPoints={shareSnapPoints}
                    enablePanDownToClose={true}
                    backdropComponent={renderBackdrop}
                    backgroundStyle={styles.sheetBackground}
                    handleIndicatorStyle={styles.sheetIndicator}
                    onChange={(index) => {
                        if (index === -1) {
                            Keyboard.dismiss();
                        }
                    }}
                >
                    {renderShareSheet()}
                </BottomSheet>

                {/* Job Details Modal */}
                <Modal
                    visible={showDetailsModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={handleCloseDetailsModal}
                    statusBarTranslucent={true}
                >
                    <View style={styles.detailsModalOverlay}>
                        <View style={styles.detailsModalContent}>
                            {renderJobDetailsSheet()}
                        </View>
                    </View>
                </Modal>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerRight: {
        minWidth: 60,
        alignItems: 'flex-end',
    },
    jobCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    listContent: {
        padding: 16,
    },
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobInfo: {
        flex: 1,
        marginRight: 12,
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        lineHeight: 22,
    },
    jobId: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
    },
    jobIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    jobDateTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    shareButton: {
        padding: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    jobDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    detailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    detailText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    infoTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    infoTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    infoTagText: {
        fontSize: 10,
        color: '#6366F1',
        fontWeight: '600',
    },
    salaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    salaryText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#059669',
    },
    postedText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        gap: 4,
    },
    viewDetailsText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
    // Details Modal Styles
    detailsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    detailsModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        width: '100%',
        paddingBottom: 20,
        maxHeight: '75%',
    },
    // Bottom Sheet Styles
    sheetBackground: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    sheetIndicator: {
        backgroundColor: '#CBD5E1',
        width: 40,
    },
    sheetContainer: {
        flex: 1,
    },
    sheetContent: {
        paddingHorizontal: 20,
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 4,
    },
    sheetHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeSheetButton: {
        padding: 4,
    },
    superPremiumBadge: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    premiumBadge: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    superPremiumText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFD700',
        letterSpacing: 1,
    },
    premiumText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#5C4300',
        letterSpacing: 1,
    },
    sheetTitleSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sheetJobEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    sheetTitleContainer: {
        flex: 1,
    },
    sheetJobTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: 26,
    },
    sheetVehicleType: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    sheetSalarySection: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sheetSalaryLabel: {
        fontSize: 13,
        color: '#166534',
        fontWeight: '600',
        marginBottom: 4,
    },
    sheetSalaryValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#059669',
    },
    sheetBenefits: {
        fontSize: 13,
        color: '#166534',
        marginTop: 8,
    },
    sheetDetailsSection: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sheetSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sheetSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3B82F6',
    },
    detailsGrid: {
        gap: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    detailItemContainer: {
        flex: 1,
    },
    detailItemLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    detailItemLabelText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
    },
    detailItemValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
        paddingLeft: 22,
    },
    sheetDescriptionSection: {
        marginBottom: 16,
    },
    sheetDescriptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3B82F6',
        marginBottom: 8,
    },
    sheetDescriptionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    sheetSkillsSection: {
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sheetSkillsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6366F1',
        marginBottom: 12,
    },
    skillsTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillTag: {
        backgroundColor: '#C7D2FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    skillTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4338CA',
    },
    shareJobButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    shareJobButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    // Empty & Error States
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1E293B',
    },
    selectAllButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    selectAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    driverListContainer: {
        flex: 1,
        marginBottom: 10,
    },
    driverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    driverItemSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    driverInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    driverImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    driverTextContainer: {
        flex: 1,
    },
    nameStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    driverName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    driverTmId: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    modalFooter: {
        paddingTop: 10,
    },
    shareConfirmButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    shareConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // New Card Styles
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderTopLeftRadius: 15, // matching card radius - 1
        borderTopRightRadius: 15,
    },
    planBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    planBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    jobIdContainer: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    jobIdText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },
    cardBody: {
        padding: 16,
    },
    viewDetailsButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    viewDetailsTextSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
    },
    // Empty Search Styles
    emptySearchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptySearchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
        marginTop: 12,
        textAlign: 'center',
    },
    emptySearchSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
        textAlign: 'center',
    },
    addDriverButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 20,
        gap: 8,
    },
    addDriverButtonTextSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DriverAssociationJobs;
