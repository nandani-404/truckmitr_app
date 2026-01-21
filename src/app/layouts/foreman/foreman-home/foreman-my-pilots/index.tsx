import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';

// API Response Driver Type
type ApiDriver = {
    id: number;
    name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    state_name: string;
    created_at: string;
    payment_type: string | null;
    profile_completion_percentage: number | string;
};

// Component Driver Type (mapped from API)
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
    profile_completion_percentage: string;
};

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

// Helper function to format date
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateString;
    }
};

// Helper function to check if driver is new (added within last 7 days)
const isNewDriver = (dateString: string): boolean => {
    try {
        const createdDate = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - createdDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
    } catch {
        return false;
    }
};

// Map API driver to component driver
const mapApiDriverToDriver = (apiDriver: ApiDriver): Driver => {
    const paymentType = apiDriver.payment_type;
    let status = 'Pending';
    let amount = 0;
    let subscriptionPlan = 0;

    if (paymentType) {
        status = paymentType;
        if (paymentType.toLowerCase().includes('trusted')) {
            amount = 499;
            subscriptionPlan = 499;
        } else if (paymentType.toLowerCase().includes('verified')) {
            amount = 199;
            subscriptionPlan = 199;
        } else if (paymentType.toLowerCase().includes('job ready') || paymentType.toLowerCase().includes('job_ready')) {
            amount = 99;
            subscriptionPlan = 99;
        }
    } else {
        status = 'No Subscription';
    }

    return {
        id: String(apiDriver.id),
        name: apiDriver.name || 'Unknown',
        tmId: apiDriver.unique_id || '',
        mobile: apiDriver.mobile || '',
        status: status,
        image: apiDriver.images || DEFAULT_AVATAR,
        isNew: isNewDriver(apiDriver.created_at),
        state: apiDriver.state_name || 'N/A',
        addedDate: formatDate(apiDriver.created_at),
        completion: Number(apiDriver.profile_completion_percentage) || 0,
        subscriptionPlan: subscriptionPlan,
        training: 0,
        healthHygiene: 0,
        jobsApplied: 0,
        dob: '',
        gender: '',
        education: '',
        vehicleType: '',
        drivingExp: '',
        licenseType: '',
        licenseEndorsement: '',
        currentSalary: '',
        expectedSalary: '',
        aadharNo: '',
        licenseNo: '',
        licenseExpiry: '',
        amount: amount,
        email: '',
        profile_completion_percentage: String(apiDriver.profile_completion_percentage || '0'),
    };
};

export default function ForemanMyPilots() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // State
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalDrivers, setTotalDrivers] = useState(0);

    // Fetch drivers from API
    const fetchDrivers = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await axiosInstance.get(END_POINTS.FOREMAN_MY_PILOTS);
            console.log('My Pilots API Response:', response?.data);

            if (response?.data?.success) {
                const apiDrivers: ApiDriver[] = response?.data?.drivers || [];
                // console.log('data-------------', apiDrivers);
                const mappedDrivers = apiDrivers.map(mapApiDriverToDriver);
                // console.log('data-------------', mappedDrivers);

                setDrivers(mappedDrivers);
                setTotalDrivers(response?.data?.total || 0);
            } else {
                const errorMessage = response?.data?.message || 'Failed to fetch drivers';
                setError(errorMessage);
                setDrivers([]);
                setTotalDrivers(0);
            }
        } catch (err: any) {
            console.log('Error fetching drivers:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Something went wrong';
            setError(errorMessage);
            setDrivers([]);
            setTotalDrivers(0);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        fetchDrivers(true);
    }, [fetchDrivers]);

    const renderDriverCard = ({ item: driver }: { item: Driver }) => (
        <View style={styles.driverCard}>
            <View style={styles.driverMainRow}>
                {/* Profile Image with Completion Circle */}
                <View style={styles.profileImageWrapper}>
                    <View style={styles.circularProgressContainer}>
                        <Svg width={74} height={74} viewBox="0 0 74 74">
                            <Circle
                                cx="37"
                                cy="37"
                                r="34"
                                stroke="#E2E8F0"
                                strokeWidth="4"
                                fill="none"
                            />
                            <Circle
                                cx="37"
                                cy="37"
                                r="34"
                                stroke={
                                    driver.status.toLowerCase().includes('verified') ? "#22C55E" :
                                        driver.status.toLowerCase().includes('trusted') ? "#7E22CE" :
                                            (driver.status.toLowerCase().includes('job ready') || driver.status.toLowerCase().includes('job_ready')) ? "#1D4ED8" :
                                                "#3B82F6"
                                }
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 34}`}
                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - driver.completion / 100)}`}
                                strokeLinecap="round"
                                rotation="90"
                                origin="37, 37"
                            />
                        </Svg>
                        <View style={styles.profileImageContainerInner}>
                            <Image source={{ uri: driver.image }} style={styles.profileImage} />
                        </View>
                        {/* Status Checkmark or Percentage Badge */}
                        <View style={[
                            styles.completionBadge,
                            driver.status.toLowerCase().includes('verified') && { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
                            driver.status.toLowerCase().includes('trusted') && { borderColor: '#E9D5FF', backgroundColor: '#F3E8FF' },
                            (driver.status.toLowerCase().includes('job ready') || driver.status.toLowerCase().includes('job_ready')) && { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }
                        ]}>
                            <Text style={[
                                styles.completionText,
                                driver.status.toLowerCase().includes('verified') && { color: '#166534' },
                                driver.status.toLowerCase().includes('trusted') && { color: '#7E22CE' },
                                (driver.status.toLowerCase().includes('job ready') || driver.status.toLowerCase().includes('job_ready')) && { color: '#1D4ED8' }
                            ]}>
                                {driver.profile_completion_percentage}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Info & Status */}
                <View style={styles.driverContent}>
                    <View style={styles.driverHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <Text style={styles.driverTmId} numberOfLines={1} adjustsFontSizeToFit>{driver.tmId}</Text>
                        </View>
                        {/* Status Badges based on Subscription Plan */}
                        <View style={styles.badgesColumn}>
                            {driver.status === 'No Subscription' ? (
                                <View style={styles.noSubscriptionBadge}>
                                    <Ionicons name="alert-circle-outline" size={12} color="#64748B" />
                                    <Text style={styles.noSubscriptionText}>No Subscription</Text>
                                </View>
                            ) : driver.status === 'Pending' ? (
                                <View style={styles.pendingBadge}>
                                    <Ionicons name="time" size={12} color="#92400E" />
                                    <Text style={styles.pendingText}>Pending</Text>
                                </View>
                            ) : driver.status === 'Rejected' ? (
                                <View style={styles.rejectedBadge}>
                                    <Ionicons name="close-circle" size={12} color="#991B1B" />
                                    <Text style={styles.rejectedText}>Rejected</Text>
                                </View>
                            ) : driver.status.toLowerCase().includes('trusted') ? (
                                <View style={styles.trustedBadge}>
                                    <Ionicons name="shield-checkmark" size={12} color="#7E22CE" />
                                    <Text style={styles.trustedText}>Trusted Driver • ₹{driver.amount}</Text>
                                </View>
                            ) : driver.status.toLowerCase().includes('verified') ? (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                    <Text style={styles.verifiedText}>Verified Driver • ₹{driver.amount}</Text>
                                </View>
                            ) : (driver.status.toLowerCase().includes('job ready') || driver.status.toLowerCase().includes('job_ready')) ? (
                                <View style={styles.jobReadyBadge}>
                                    <Ionicons name="briefcase" size={12} color="#1D4ED8" />
                                    <Text style={styles.jobReadyText}>Job Ready Driver • ₹{driver.amount}</Text>
                                </View>
                            ) : (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={12} color="#166534" />
                                    <Text style={styles.verifiedText}>{driver.status}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.infoText}>+91 {driver.mobile}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Additional Info Row: State & Date */}
            <View style={styles.additionalInfoContainer}>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoLabel}>State:</Text>
                    <Text style={styles.additionalInfoValue}>{driver.state}</Text>
                </View>
                <View style={styles.additionalInfoItem}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.additionalInfoLabel}>Added:</Text>
                    <Text style={styles.additionalInfoValue}>{driver.addedDate}</Text>
                </View>
            </View>

            {/* View Detail Button */}
            <TouchableOpacity
                style={styles.viewDetailButton}
                activeOpacity={0.8}
                onPress={() => (navigation as any).navigate(STACKS.FOREMAN_DRIVER_DETAILS, { driver })}
            >
                <Text style={styles.viewDetailText}>View Detail</Text>
                <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
            </TouchableOpacity>
        </View>
    );

    // Loading State

    // const renderDriverCard = (driver: Driver) => (
    //     <View key={driver.id} style={styles.driverCard}>
    //         <View style={styles.driverMainRow}>
    //             {/* Profile Image with Completion Circle */}
    //             <View style={styles.profileImageWrapper}>
    //                 <View style={styles.circularProgressContainer}>
    //                     <Svg width={74} height={74} viewBox="0 0 74 74">
    //                         <Circle
    //                             cx="37"
    //                             cy="37"
    //                             r="34"
    //                             stroke="#E2E8F0"
    //                             strokeWidth="4"
    //                             fill="none"
    //                         />
    //                         <Circle
    //                             cx="37"
    //                             cy="37"
    //                             r="34"
    //                             stroke={driver.status === 'Verified' ? "#22C55E" : "#3B82F6"}
    //                             strokeWidth="4"
    //                             fill="none"
    //                             strokeDasharray={`${2 * Math.PI * 34}`}
    //                             strokeDashoffset={`${2 * Math.PI * 34 * (1 - driver.completion / 100)}`}
    //                             strokeLinecap="round"
    //                             rotation="90"
    //                             origin="37, 37"
    //                         />
    //                     </Svg>
    //                     <View style={styles.profileImageContainerInner}>
    //                         <Image source={{ uri: driver.image }} style={styles.profileImage} />
    //                     </View>
    //                     {/* Status Checkmark or Percentage Badge */}
    //                     <View style={[
    //                         styles.completionBadge,
    //                         driver.status === 'Verified' && { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }
    //                     ]}>
    //                         <Text style={[
    //                             styles.completionText,
    //                             driver.status === 'Verified' && { color: '#166534' }
    //                         ]}>
    //                             {driver.completion}%
    //                         </Text>
    //                     </View>
    //                 </View>
    //             </View>

    //             {/* Info & Status */}
    //             <View style={styles.driverContent}>
    //                 <View style={styles.driverHeader}>
    //                     <View style={{ flex: 1, marginRight: 8 }}>
    //                         <Text style={styles.driverName}>{driver.name}</Text>
    //                         <Text style={styles.driverTmId} numberOfLines={1} adjustsFontSizeToFit>{driver.tmId}</Text>
    //                     </View>
    //                     {/* Status Badges based on Subscription Plan */}
    //                     <View style={styles.badgesColumn}>
    //                         {driver.status === 'Pending' ? (
    //                             <View style={styles.pendingBadge}>
    //                                 <Ionicons name="time" size={12} color="#92400E" />
    //                                 <Text style={styles.pendingText}>Pending</Text>
    //                             </View>
    //                         ) : driver.status === 'Rejected' ? (
    //                             <View style={styles.rejectedBadge}>
    //                                 <Ionicons name="close-circle" size={12} color="#991B1B" />
    //                                 <Text style={styles.rejectedText}>Rejected</Text>
    //                             </View>
    //                         ) : driver.subscriptionPlan === 499 ? (
    //                             <View style={styles.trustedBadge}>
    //                                 <Ionicons name="shield-checkmark" size={12} color="#7E22CE" />
    //                                 <Text style={styles.trustedText}>Trusted Driver • ₹{driver.amount}</Text>
    //                             </View>
    //                         ) : driver.subscriptionPlan === 199 ? (
    //                             <View style={styles.verifiedBadge}>
    //                                 <Ionicons name="checkmark-circle" size={12} color="#166534" />
    //                                 <Text style={styles.verifiedText}>Verified Driver • ₹{driver.amount}</Text>
    //                             </View>
    //                         ) : driver.subscriptionPlan === 99 ? (
    //                             <View style={styles.jobReadyBadge}>
    //                                 <Ionicons name="briefcase" size={12} color="#1D4ED8" />
    //                                 <Text style={styles.jobReadyText}>Job Ready Driver • ₹{driver.amount}</Text>
    //                             </View>
    //                         ) : (
    //                             <View style={styles.verifiedBadge}>
    //                                 <Ionicons name="checkmark-circle" size={12} color="#166534" />
    //                                 <Text style={styles.verifiedText}>Verified</Text>
    //                             </View>
    //                         )}
    //                     </View>
    //                 </View>

    //                 {/* Phone */}
    //                 <View style={styles.infoRow}>
    //                     <Ionicons name="call-outline" size={14} color="#64748B" />
    //                     <Text style={styles.infoText}>{driver.mobile}</Text>
    //                 </View>
    //             </View>
    //         </View>

    //         <View style={styles.divider} />

    //         {/* Additional Info Row: State & Date */}
    //         <View style={styles.additionalInfoContainer}>
    //             <View style={styles.additionalInfoItem}>
    //                 <Ionicons name="location-outline" size={14} color="#64748B" />
    //                 <Text style={styles.additionalInfoLabel}>State:</Text>
    //                 <Text style={styles.additionalInfoValue}>{driver.state}</Text>
    //             </View>
    //             <View style={styles.additionalInfoItem}>
    //                 <Ionicons name="calendar-outline" size={14} color="#64748B" />
    //                 <Text style={styles.additionalInfoLabel}>Added:</Text>
    //                 <Text style={styles.additionalInfoValue}>{driver.addedDate}</Text>
    //             </View>
    //         </View>

    //         {/* View Detail Button */}
    //         <TouchableOpacity
    //             style={styles.viewDetailButton}
    //             activeOpacity={0.8}
    //             onPress={() => (navigation as any).navigate(STACKS.FOREMAN_DRIVER_DETAILS, { driver })}
    //         >
    //             <Text style={styles.viewDetailText}>View Detail</Text>
    //             <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
    //         </TouchableOpacity>
    //     </View>
    // );

    const renderLoading = () => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading drivers...</Text>
        </View>
    );

    // Error State
    const renderError = () => (
        <View style={styles.centerContainer}>
            <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchDrivers()}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );

    // Empty State
    const renderEmpty = () => (
        <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Pilots Yet</Text>
            <Text style={styles.emptyMessage}>You haven't added any drivers yet. Start adding drivers to see them here.</Text>
            <TouchableOpacity
                style={styles.addDriverButton}
                onPress={() => (navigation as any).navigate(STACKS.FOREMAN_BOTTOM_TAB, { screen: STACKS.FOREMAN_ADD_DRIVER })}
            >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addDriverButtonText}>Add Driver</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Pilots {totalDrivers > 0 ? `(${totalDrivers})` : ''}</Text>
                <TouchableOpacity onPress={() => fetchDrivers()} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {loading ? (
                renderLoading()
            ) : error ? (
                renderError()
            ) : drivers.length === 0 ? (
                renderEmpty()
            ) : (
                <FlatList
                    data={drivers}
                    renderItem={renderDriverCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']}
                            tintColor="#3B82F6"
                        />
                    }
                />
            )}
        </View>
    );
}

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
        padding: 4,
    },
    refreshButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    // Center container for loading, error, empty states
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
    },
    // Error state
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Empty state
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    addDriverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    addDriverButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Driver card styles
    driverCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    driverMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    profileImageWrapper: {
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
    },
    circularProgressContainer: {
        width: 74,
        height: 74,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageContainerInner: {
        position: 'absolute',
        top: 7,
        left: 7,
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
    },
    completionBadge: {
        position: 'absolute',
        bottom: -4,
        backgroundColor: '#fff',
        paddingHorizontal: 1,
        paddingVertical: 0,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
    },
    completionText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#3B82F6',
    },
    driverContent: {
        flex: 1,
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
        marginTop: 6,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
        lineHeight: 20,
    },
    driverTmId: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#475569',
        marginLeft: 6,
        fontWeight: '500',
    },
    badgesColumn: {
        alignItems: 'flex-end',
        gap: 4,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#166534',
    },
    noSubscriptionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    noSubscriptionText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pendingText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#92400E',
    },
    rejectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    rejectedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#991B1B',
    },
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trustedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#7E22CE',
    },
    jobReadyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    jobReadyText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1D4ED8',
    },
    newBadge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    additionalInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    additionalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    additionalInfoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 6,
        marginRight: 4,
    },
    additionalInfoValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    viewDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        gap: 6,
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284C7',
    },
});
