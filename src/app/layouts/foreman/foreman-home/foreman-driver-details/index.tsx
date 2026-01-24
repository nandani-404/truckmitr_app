import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/utils/config/index';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

// Reusing definition for clarity
type Driver = {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    status: string;
    image: string;
    isNew: boolean;
    state: string;
    addedDate: string;
    completion: number;
    subscriptionPlan: number;
    training: number;
    healthHygiene: number;
    jobsApplied: number;
    dob: string;
    gender: string;
    education: string;
    vehicleType: string;
    drivingExp: string;
    licenseType: string;
    licenseEndorsement: string;
    currentSalary: string;
    expectedSalary: string;
    aadharNo: string;
    licenseNo: string;
    licenseExpiry: string;
    amount: number;
    email: string;
};

type Params = {
    driver: Driver;
};

type FullDriver = {
    id: string;
    name: string;
    tmId: string;
    mobile: string;
    email: string;
    dob: string;
    gender: string;
    education: string;
    vehicleType: string;
    drivingExp: string;
    licenseNo: string;
    licenseExpiry: string;
    licenseEndorsement: string;
    currentSalary: string;
    expectedSalary: string;
    state: string;
    status: string;
    image: string;
    completion: number;
    subscriptionEndDate: string;
    addedDate?: string;
};

// Vehicle Type ID to Name mapping
const VEHICLE_TYPE_MAP: Record<string, string> = {
    '1': 'Container Trucks',
    '2': 'Heavy Commercial Vehicles',
    '3': 'Heavy Open Body Trucks',
    '4': 'Light Commercial Vehicles',
    '5': 'Light Open Body Trucks',
    '6': 'Medium Commercial Vehicles',
    '7': 'Multi-Axle Trucks',
    '8': 'Refrigerated Trucks',
    '9': 'Special Purpose Trucks',
    '10': 'Tankers',
    '11': 'Tippers',
    '13': 'Crane Mounted Lorries',
    '14': 'Curtainsiders',
    '15': 'Flatbeds',
    '16': 'Light Commercial Vehicles (LCVs)',
    '17': 'Medium and Heavy Commercial Vehicles (MHCVs)',
    '18': 'Mini Trucks',
    '19': 'Moffett Lorries',
    '20': 'Pickups',
    '21': 'Three-Wheelers',
    '22': 'Trailer Trucks',
    '23': 'Transporters',
    '24': 'Trucks',
    '25': 'Walking Floor Lorries',
    '26': 'Car Carrier',
};

// Helper function to parse JSON array string and return formatted string
const parseJsonArrayField = (value: string | null | undefined, isVehicleType: boolean = false): string => {
    if (!value || value === 'N/A') return 'N/A';

    try {
        // Check if the value is a JSON array string
        if (value.startsWith('[') && value.endsWith(']')) {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                if (isVehicleType) {
                    // Map vehicle type IDs to names
                    const names = parsed.map((id: string) => VEHICLE_TYPE_MAP[id] || id);
                    return names.join(', ');
                }
                // For license endorsement or other arrays, just join the values
                return parsed.join(', ');
            }
        }
        // Return as-is if not a JSON array
        return value;
    } catch {
        // If parsing fails, return the original value
        return value;
    }
};

const ForemanDriverDetails = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: Params }, 'params'>>();
    const driverParam = route.params?.driver;
    const insets = useSafeAreaInsets();

    const [details, setDetails] = useState<FullDriver | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        if (!driverParam?.id) {
            setError(t('driverIdMissing'));
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(END_POINTS.DRIVER_PROFILE(driverParam.id));

            if (response?.data?.success) {
                const apiData = response.data.driver;
                setDetails({
                    id: String(apiData.driver_id),
                    name: apiData.name || 'N/A',
                    tmId: apiData.unique_id || 'N/A',
                    mobile: apiData.mobile || 'N/A',
                    email: apiData.email || 'N/A',
                    dob: apiData.DOB || 'N/A',
                    gender: apiData.Sex || 'N/A',
                    education: apiData.Highest_Education || 'N/A',
                    vehicleType: parseJsonArrayField(apiData.vehicle_type, true),
                    drivingExp: apiData.driving_experience || 'N/A',
                    licenseNo: apiData.licence_number || 'N/A',
                    licenseExpiry: apiData.licence_expiry || 'N/A',
                    licenseEndorsement: parseJsonArrayField(apiData.licence_endorsement, false),
                    currentSalary: apiData.Current_Monthly_Income || 'N/A',
                    expectedSalary: apiData.Expected_Monthly_Income || 'N/A',
                    state: apiData.state_name || 'N/A',
                    status: driverParam.status || 'N/A',
                    image: apiData.images || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                    completion: response.data.profile_completion_percentage || 0,
                    subscriptionEndDate: apiData.subscription_end_date || 'N/A',
                    addedDate: driverParam.addedDate
                });

                console.log("Full Image URL:", `${BASE_URL}public/${apiData.images}`);

            } else {
                setError(response?.data?.message || t('failedToFetchDriverDetails'));
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || t('somethingWentWrong'));
        } finally {
            setLoading(false);
        }
    }, [driverParam?.id, driverParam?.status, driverParam?.addedDate]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const renderDetailItem = (label: string, value: string, icon: string, iconColor: string, iconBgColor: string) => {
        let content: React.ReactNode = value;

        if (label.includes('Salary')) {
            content = value.split(',').map((part, index, arr) => (
                <Text key={index}>
                    {part}
                    {index < arr.length - 1 && <Text style={{ fontFamily: 'serif' }}>,</Text>}
                </Text>
            ));
        } else if (label === 'License Number') {
            // Unmasked: "1234 5678 9012" -> Masked: "XXXX XXXX 9012"
            const visibleCount = 4;
            const len = value.length;
            if (len > visibleCount) {
                const maskedPart = value.substring(0, len - visibleCount).replace(/[A-Za-z0-9]/g, 'X');
                const visiblePart = value.substring(len - visibleCount);
                content = maskedPart + visiblePart;
            }
        }

        return (
            <View style={styles.detailItem}>
                <View style={[styles.detailIconContainer, { backgroundColor: iconBgColor }]}>
                    <Ionicons name={icon} size={18} color={iconColor} />
                </View>
                <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{content}</Text>
                </View>
            </View>
        );
    };

    const renderSectionHeader = (title: string, icon: string, color: string, bgColor: string) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: bgColor }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('driverProfile')}</Text>
                <View style={{ width: 24 }}>
                    {details && (
                        <TouchableOpacity onPress={fetchDetails}>
                            <Ionicons name="refresh" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>{t('fetchingDetails')}</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorTitle}>Error</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchDetails}>
                        <Text style={styles.retryText}>{t('tryAgain', 'Try Again')}</Text>
                    </TouchableOpacity>
                </View>
            ) : !details ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
                    <Text style={styles.errorTitle}>{t('noDataFound')}</Text>
                    <Text style={styles.errorText}>{t('noDriverDetailsFound')}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileHeader}>
                            <View style={styles.profileImageContainer}>
                                <Svg width={80} height={80} viewBox="0 0 80 80">
                                    <Circle cx="40" cy="40" r="38" stroke="#E2E8F0" strokeWidth="4" fill="none" />
                                    <Circle
                                        cx="40"
                                        cy="40"
                                        r="38"
                                        stroke={
                                            details.status.toLowerCase().includes('verified') ? "#22C55E" :
                                                details.status.toLowerCase().includes('trusted') ? "#7E22CE" :
                                                    (details.status.toLowerCase().includes('job ready') || details.status.toLowerCase().includes('job_ready')) ? "#1D4ED8" :
                                                        "#3B82F6"
                                        }
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 38}`}
                                        strokeDashoffset={`${2 * Math.PI * 38 * (1 - details.completion / 100)}`}
                                        strokeLinecap="round"
                                        rotation="90"
                                        origin="40, 40"
                                    />
                                </Svg>
                                <View style={styles.profileImageInner}>
                                    <Image
                                        source={{
                                            uri: details.image && details.image !== 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'
                                                ? (details.image.startsWith('http') ? details.image : `${BASE_URL}public/${details.image}`)
                                                : DEFAULT_AVATAR
                                        }}
                                        style={styles.profileImage}
                                        defaultSource={{ uri: DEFAULT_AVATAR }}
                                    />
                                </View>
                                <View style={[
                                    styles.completionPercentBadge,
                                    details.status.toLowerCase().includes('verified') && { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
                                    details.status.toLowerCase().includes('trusted') && { borderColor: '#E9D5FF', backgroundColor: '#F3E8FF' },
                                    (details.status.toLowerCase().includes('job ready') || details.status.toLowerCase().includes('job_ready')) && { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }
                                ]}>
                                    <Text style={[
                                        styles.completionPercentText,
                                        details.status.toLowerCase().includes('verified') && { color: '#166534' },
                                        details.status.toLowerCase().includes('trusted') && { color: '#7E22CE' },
                                        (details.status.toLowerCase().includes('job ready') || details.status.toLowerCase().includes('job_ready')) && { color: '#1D4ED8' }
                                    ]}>
                                        {details.completion}%
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.driverName}>{details.name}</Text>
                                <Text style={styles.driverTmId}>{details.tmId}</Text>
                                <View style={styles.tagRow}>
                                    {details.status === 'No Subscription' ? (
                                        <View style={styles.noSubscriptionBadge}>
                                            <Ionicons name="alert-circle-outline" size={12} color="#64748B" />
                                            <Text style={styles.noSubscriptionText}>{t('noSubscription')}</Text>
                                        </View>
                                    ) : details.status === 'Pending' ? (
                                        <View style={styles.pendingBadge}>
                                            <Ionicons name="time" size={12} color="#92400E" />
                                            <Text style={styles.pendingText}>{t('pending')}</Text>
                                        </View>
                                    ) : details.status === 'Rejected' ? (
                                        <View style={styles.rejectedBadge}>
                                            <Ionicons name="close-circle" size={12} color="#991B1B" />
                                            <Text style={styles.rejectedText}>{t('rejected')}</Text>
                                        </View>
                                    ) : details.status.toLowerCase().includes('trusted') ? (
                                        <View style={styles.trustedBadge}>
                                            <Ionicons name="shield-checkmark" size={12} color="#7E22CE" />
                                            <Text style={styles.trustedText}>{t('trustedDriver')}</Text>
                                        </View>
                                    ) : details.status.toLowerCase().includes('verified') ? (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                            <Text style={styles.verifiedText}>{t('verifiedDriver')}</Text>
                                        </View>
                                    ) : (details.status.toLowerCase().includes('job ready') || details.status.toLowerCase().includes('job_ready')) ? (
                                        <View style={styles.jobReadyBadge}>
                                            <Ionicons name="briefcase" size={12} color="#1D4ED8" />
                                            <Text style={styles.jobReadyText}>{t('jobReadyDriver')}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                            <Text style={styles.verifiedText}>{details.status}</Text>
                                        </View>
                                    )}
                                    <View style={styles.stateBadge}>
                                        <Ionicons name="location-outline" size={12} color="#475569" />
                                        <Text style={styles.stateText}>{details.state}</Text>
                                    </View>
                                </View>
                                {details.addedDate && <Text style={styles.addedDate}>{t('addedOn')}{details.addedDate}</Text>}
                            </View>
                        </View>
                        <View style={styles.contactRow}>
                            <View style={styles.contactItem}>
                                <Ionicons name="call" size={16} color="#0F172A" />
                                <Text style={styles.contactText}>{details.mobile}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Personal Details */}
                    <View style={styles.sectionContainer}>
                        {renderSectionHeader(t('personalDetails'), 'person', '#3B82F6', '#EFF6FF')}
                        <View style={styles.detailsGrid}>
                            {renderDetailItem(t('email'), details.email, 'mail-outline', '#3B82F6', '#EFF6FF')}
                            {renderDetailItem(t('dateOfBirth'), details.dob, 'calendar-outline', '#3B82F6', '#EFF6FF')}
                            {renderDetailItem(t('gender'), details.gender, 'male-female-outline', '#3B82F6', '#EFF6FF')}
                            {renderDetailItem(t('highestEducation'), details.education, 'school-outline', '#3B82F6', '#EFF6FF')}
                        </View>
                    </View>

                    {/* Professional Details */}
                    <View style={styles.sectionContainer}>
                        {renderSectionHeader(t('professionalDetails'), 'ribbon-outline', '#8B5CF6', '#F5F3FF')}
                        <View style={styles.detailsGrid}>
                            {renderDetailItem(t('vehicleType'), details.vehicleType, 'car-sport-outline', '#8B5CF6', '#F5F3FF')}
                            {renderDetailItem(t('drivingExperience'), details.drivingExp, 'time-outline', '#8B5CF6', '#F5F3FF')}
                            {renderDetailItem(t('licenseNumber'), details.licenseNo, 'card-outline', '#8B5CF6', '#F5F3FF')}
                            {renderDetailItem(t('expiryDateOfLicense'), details.licenseExpiry, 'calendar-number-outline', '#EF4444', '#FEF2F2')}
                            {renderDetailItem(t('endorsements'), details.licenseEndorsement, 'alert-circle-outline', '#8B5CF6', '#F5F3FF')}
                        </View>
                    </View>

                    {/* Financial Details */}
                    <View style={styles.sectionContainer}>
                        {renderSectionHeader(t('monthlyIncomeDetails'), 'cash-outline', '#10B981', '#ECFDF5')}
                        <View style={styles.detailsGrid}>
                            {renderDetailItem(t('currentSalary'), details.currentSalary, 'wallet-outline', '#10B981', '#ECFDF5')}
                            {renderDetailItem(t('expectedSalary'), details.expectedSalary, 'trending-up-outline', '#10B981', '#ECFDF5')}
                        </View>
                    </View>

                    {/* Subscription Details */}
                    <View style={styles.sectionContainer}>
                        {renderSectionHeader(t('subscriptionStatus'), 'card-outline', '#F59E0B', '#FFFBEB')}
                        <View style={styles.detailsGrid}>
                            {renderDetailItem(t('subscriptionEnd'), details.subscriptionEndDate, 'calendar-outline', '#F59E0B', '#FFFBEB')}
                        </View>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    scrollContent: {
        padding: 16,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImageContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
        marginTop: -20, // Shift image up drastically
    },
    profileImageInner: {
        position: 'absolute',
        width: 66,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        top: 7,
        left: 7,
    },
    profileImage: {
        width: 66,
        height: 66,
    },
    completionPercentBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#F0FDF4',
        borderRadius: 4,
        paddingHorizontal: 4, // Restore slight padding for readability if it shrinks
        paddingVertical: 0,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        alignSelf: 'center', // Centers without stretching
        height: 15,
        justifyContent: 'center',
    },
    completionPercentText: {
        fontSize: 7, // Smallest readable text
        fontWeight: '700',
        color: '#166534',
        alignSelf: 'center',
        lineHeight: 10,
    },
    profileInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 0,
        lineHeight: 24, // Control vertical flow
    },
    driverTmId: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 8,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    trustedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#7E22CE',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#166534',
    },
    noSubscriptionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    noSubscriptionText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    jobReadyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    jobReadyText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1D4ED8',
    },
    defaultBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },
    stateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 4,
    },
    stateText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    pendingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#92400E',
    },
    rejectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    rejectedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#991B1B',
    },
    addedDate: {
        fontSize: 12,
        color: '#94A3B8',
    },
    contactRow: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    contactText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    progressGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    progressCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9', // Subtle border
        // elevation: 1, // Removed to avoid grey corners on Android
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.05,
        // shadowRadius: 1,
        alignItems: 'center',
        overflow: 'hidden', // Ensure content respects border radius
    },
    progressLabel: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 4,
        textAlign: 'center',
    },
    progressValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    progressValueLarge: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3B82F6',
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    detailsGrid: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sectionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ForemanDriverDetails;
