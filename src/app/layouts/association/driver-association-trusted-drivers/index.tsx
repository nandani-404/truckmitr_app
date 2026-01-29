
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    StatusBar,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import Svg, { Circle } from 'react-native-svg';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams>;

// Driver data interface from API
interface Driver {
    driver_id: string;
    driver_name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    state_name: string;
    end_at_ist: string;
    remaining_days: string;
    payment_type: string;
    profile_completion_percentage: number;
}

const getSubscriptionBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
        case 'trusted':
            return { bg: '#F3E8FF', text: '#9333EA', label: 'Trusted Driver' };
        case 'verified':
            return { bg: '#DBEAFE', text: '#2563EB', label: 'Verified Driver' };
        case 'job_ready':
            return { bg: '#DCFCE7', text: '#16A34A', label: 'Job Ready Driver' };
        default:
            return { bg: '#F1F5F9', text: '#64748B', label: type };
    }
};

const DriverCard = ({ driver }: { driver: Driver }) => {
    const navigation = useNavigation<NavigatorProp>();
    const badgeStyle = getSubscriptionBadgeStyle(driver.payment_type);

    const handleViewDetails = () => {
        // @ts-ignore
        navigation.navigate(STACKS.DRIVER_ASSOCIATION_DRIVER_DETAILS, {
            driver: {
                id: driver.driver_id,
                name: driver.driver_name,
                tmId: driver.unique_id,
                mobile: driver.mobile,
                image: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                status: badgeStyle.label,
                state: driver.state_name,
                completion: driver.profile_completion_percentage,
                amount: 499,
                profile_completion_percentage: String(driver.profile_completion_percentage),
            }
        });
    };

    // Completion ring parameters for small card
    const size = 50;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (driver.profile_completion_percentage / 100) * circumference;

    return (
        <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Svg width={size} height={size} style={{ position: 'absolute' }}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#E5E7EB"
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={driver.payment_type.toLowerCase() === 'trusted' ? "#7E22CE" : "#3B82F6"}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            rotation={-90}
                            origin={`${size / 2}, ${size / 2}`}
                        />
                    </Svg>
                    <Image
                        source={{ uri: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                        style={styles.avatar}
                    />
                    <View style={styles.completionBadge}>
                        <Text style={styles.completionText}>{driver.profile_completion_percentage}%</Text>
                    </View>
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{driver.driver_name}</Text>
                    <Text style={styles.tmId}>{driver.unique_id}</Text>
                </View>
                <View style={[styles.subscriptionBadge, { backgroundColor: badgeStyle.bg }]}>
                    <Text style={[styles.subscriptionBadgeText, { color: badgeStyle.text }]}>
                        {badgeStyle.label}
                    </Text>
                </View>
            </View>

            {/* Driver Details */}
            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>{driver.mobile}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>{driver.state_name}</Text>
                    </View>
                </View>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>Expiry: {driver.end_at_ist}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={14} color="#7E22CE" />
                        <Text style={[styles.detailText, { color: '#7E22CE', fontWeight: '600' }]}>{driver.remaining_days} days left</Text>
                    </View>
                </View>
            </View>

            {/* View Details Button */}
            <TouchableOpacity style={styles.viewDetailsBtn} onPress={handleViewDetails}>
                <Text style={styles.viewDetailsBtnText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
            </TouchableOpacity>
        </View>
    );
};

export default function DriverAssociationTrustedDrivers() {
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { user } = useSelector((state: any) => state?.user) || {};

    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTrustedDrivers = useCallback(async (isRefreshing = false) => {
        if (!user?.id) return;

        try {
            if (!isRefreshing) setLoading(true);
            const response = await axiosInstance.get(END_POINTS.GET_TRUSTED_ASSOCIATION_DRIVER(user.id));
            if (response.data) {
                setDrivers(response.data.drivers || []);
            }
        } catch (error) {
            console.error('Error fetching trusted drivers:', error);
            Alert.alert('Error', 'Failed to fetch trusted drivers. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchTrustedDrivers();
    }, [fetchTrustedDrivers]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTrustedDrivers(true);
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Trusted Drivers</Text>
            <Text style={styles.emptySubtitle}>
                Trusted drivers will appear here
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trusted Drivers</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={drivers}
                    keyExtractor={(item) => item.driver_id}
                    renderItem={({ item }) => (
                        <DriverCard driver={item} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366F1']} />
                    }
                    ListEmptyComponent={renderEmptyState}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    completionBadge: {
        position: 'absolute',
        bottom: -4,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    completionText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#22C55E',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    tmId: {
        fontSize: 11,
        color: '#6366F1',
        fontWeight: '600',
    },
    subscriptionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    subscriptionBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    detailsContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: '#475569',
    },
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        paddingVertical: 10,
        gap: 4,
    },
    viewDetailsBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366F1',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
        textAlign: 'center',
    },
});
