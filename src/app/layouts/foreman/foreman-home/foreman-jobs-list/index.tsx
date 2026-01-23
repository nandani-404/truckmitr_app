import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, TextInput, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { STACKS } from '@truckmitr/stacks/stacks';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
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

// Mock Data for Drivers (Pilots)
const DRIVERS_DATA = [
    { id: '1', name: 'Ramesh Kumar', tmId: 'TM2301DR0012', status: 'Trusted Driver', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: '2', name: 'Vikas Verma', tmId: 'TM2301DR0045', status: 'Verified Driver', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: '3', name: 'Suresh Singh', tmId: 'TM2301DR0089', status: 'Job Ready Driver', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
    { id: '4', name: 'Rajesh Yadav', tmId: 'TM2301DR0112', status: 'Verified Driver', image: 'https://randomuser.me/api/portraits/men/67.jpg' },
    { id: '5', name: 'Amit Sharma', tmId: 'TM2301DR0156', status: 'Job Ready Driver', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
];

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

const ForemanJobsList = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Bottom Sheet State
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const snapPoints = useMemo(() => ['80%'], []);

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
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
        bottomSheetRef.current?.expand();
    };

    const handleCloseBottomSheet = () => {
        bottomSheetRef.current?.close();
        setSelectedJob(null);
    };

    const handleSharePress = (job: Job) => {
        setSelectedJob(job);
        setSelectedDrivers([]);
        setSearchQuery('');
        setShowShareModal(true);
    };

    const filteredDrivers = DRIVERS_DATA.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedDrivers.length === filteredDrivers.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(filteredDrivers.map(d => d.id));
        }
    };

    const toggleDriverSelection = (driverId: string) => {
        if (selectedDrivers.includes(driverId)) {
            setSelectedDrivers(prev => prev.filter(id => id !== driverId));
        } else {
            setSelectedDrivers(prev => [...prev, driverId]);
        }
    };

    const handleShareConfirm = () => {
        if (selectedDrivers.length === 0) {
            showToast(t('pleaseSelectDriver'));
            return;
        }
        setShowShareModal(false);
        showToast(t('jobShared', { count: selectedDrivers.length }));
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const renderJobItem = ({ item }: { item: Job }) => (
        <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle} numberOfLines={2}>{item.job_title}</Text>
                    <Text style={styles.jobId}>{item.job_id}</Text>
                </View>
                <TouchableOpacity onPress={() => handleSharePress(item)} style={styles.shareButton}>
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
                    <Text style={styles.infoTagText}>{item.Required_Experience} {t('yearsSuffix')}</Text>
                </View>
                <View style={styles.infoTag}>
                    <Ionicons name="card-outline" size={12} color="#6366F1" />
                    <Text style={styles.infoTagText}>{item.Type_of_License}</Text>
                </View>
            </View>

            <View style={styles.salaryRow}>
                <Text style={styles.salaryText}>{formatSalary(item.Salary_Range, t)}</Text>
                <Text style={styles.postedText}>{getTimeAgo(item.Created_at, t)}</Text>
            </View>

            <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => handleViewDetails(item)}
            >
                <Text style={styles.viewDetailsText}>{t('viewDetails')}</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
        </View>
    );

    const renderDriverItem = (item: typeof DRIVERS_DATA[0]) => {
        const isSelected = selectedDrivers.includes(item.id);
        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.driverItem, isSelected && styles.driverItemSelected]}
                onPress={() => toggleDriverSelection(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.driverInfoLeft}>
                    <Image source={{ uri: item.image }} style={styles.driverImage} />
                    <View style={styles.driverTextContainer}>
                        <View style={styles.nameStatusRow}>
                            <Text style={styles.driverName}>{item.name}</Text>
                            <View style={[styles.statusBadge, {
                                backgroundColor: item.status === 'Trusted Driver' ? '#F3E8FF' :
                                    item.status === 'Verified Driver' ? '#DCFCE7' :
                                        item.status === 'Job Ready Driver' ? '#DBEAFE' : '#F1F5F9'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: item.status === 'Trusted Driver' ? '#7E22CE' :
                                        item.status === 'Verified Driver' ? '#166534' :
                                            item.status === 'Job Ready Driver' ? '#1E40AF' : '#64748B'
                                }]}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.driverTmId}>{item.tmId}</Text>
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
            <BottomSheetScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
                {/* Header with Title and Close Button */}
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetHeaderTitle}>{t('jobDetails')}</Text>
                    <TouchableOpacity style={styles.closeSheetButton} onPress={handleCloseBottomSheet}>
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
                        handleCloseBottomSheet();
                        setTimeout(() => handleSharePress(selectedJob), 300);
                    }}
                >
                    <Ionicons name="share-social-outline" size={20} color="#fff" />
                    <Text style={styles.shareJobButtonText}>{t('shareWithDrivers')}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </BottomSheetScrollView>
        );
    };

    return (
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']}
                        />
                    }
                />
            )}

            {/* Job Details Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.sheetIndicator}
            >
                {renderJobDetailsSheet()}
            </BottomSheet>

            {/* Share Driver Selection Modal - kept as simple overlay */}
            {showShareModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('shareJob')}</Text>
                            <TouchableOpacity onPress={() => setShowShareModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{t('selectDriversToShare')}</Text>

                        {/* Search and Select All Row */}
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

                        <ScrollView style={styles.driverListContainer}>
                            {filteredDrivers.map(renderDriverItem)}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.shareConfirmButton, selectedDrivers.length === 0 && styles.disabledButton]}
                                onPress={handleShareConfirm}
                                disabled={selectedDrivers.length === 0}
                            >
                                <Text style={styles.shareConfirmText}>{t('shareAction')} ({selectedDrivers.length})</Text>
                                <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
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
        flex: 1,
        paddingHorizontal: 20,
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        marginBottom: 20,
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
});

export default ForemanJobsList;
