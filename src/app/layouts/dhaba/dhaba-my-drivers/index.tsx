import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';
import LinearGradient from 'react-native-linear-gradient';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams>;

// Driver data interface from API
interface Driver {
    id: number;
    name: string;
    unique_id: string;
    mobile: string;
    images: string | null;
    created_at: string;
}

// Helper to format date and time: 28 Jan 2026, 10:30 AM
const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const DriverCard = ({ driver, t }: { driver: Driver; t: any }) => {
    const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    const avatarUri = driver.images ? `${BASE_URL}public/${driver.images}` : defaultAvatar;

    return (
        <View style={styles.card}>
            {/* Card Header with Avatar and Info */}
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={['#FF6B35', '#FF8E53']}
                        style={styles.avatarBorder}
                    >
                        <Image
                            source={{ uri: avatarUri }}
                            style={styles.avatar}
                        />
                    </LinearGradient>
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.name} numberOfLines={1}>{driver.name}</Text>
                    <View style={styles.tmIdContainer}>
                        <Ionicons name="id-card-outline" size={12} color="#FF6B35" />
                        <Text style={styles.tmId}>{driver.unique_id}</Text>
                    </View>
                </View>
            </View>

            {/* Driver Details */}
            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons name="call-outline" size={14} color="#FF6B35" />
                    </View>
                    <View>
                        <Text style={styles.detailLabel}>{t('dhaba_driver_mobile')}</Text>
                        <Text style={styles.detailText}>{driver.mobile}</Text>
                    </View>
                </View>
                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#FF6B35" />
                    </View>
                    <View>
                        <Text style={styles.detailLabel}>{t('dhaba_driver_added_on')}</Text>
                        <Text style={styles.detailText}>{formatDateTime(driver.created_at)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function DhabaMyDrivers() {
    const navigation = useNavigation<NavigatorProp>();
    const { user } = useSelector((state: any) => state?.user) || {};
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([
        {
            id: 1,
            name: 'राजेश कुमार',
            unique_id: 'TM123456',
            mobile: '9876543210',
            images: null,
            created_at: '2026-02-05T10:30:00Z',
        },
    ]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDrivers = useCallback(async (isRefreshing = false) => {
        if (!user?.id) return;

        try {
            if (!isRefreshing) setLoading(true);
            const response = await axiosInstance.get(END_POINTS.DHABA_DRIVERS);
            if (response.data && response.data.success) {
                setDrivers(response.data.drivers || []);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    React.useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDrivers(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <ScreenHeader
                title={t('dhaba_my_drivers')}
                titleCount={drivers.length > 0 ? drivers.length : undefined}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                </View>
            ) : (
                <FlatList
                    data={drivers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <DriverCard driver={item} t={t} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B35']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="people-outline" size={48} color="#FF6B35" />
                            </View>
                            <Text style={styles.emptyTitle}>{t('dhaba_no_drivers_title')}</Text>
                            <Text style={styles.emptyText}>{t('dhaba_no_drivers_desc')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFE5D9',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatarBorder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    tmIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    tmId: {
        fontSize: 12,
        color: '#FF6B35',
        fontWeight: '600',
        marginLeft: 4,
    },
    detailsContainer: {
        backgroundColor: '#FFFBF8',
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFF0E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
        marginBottom: 1,
    },
    detailText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF0E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});
