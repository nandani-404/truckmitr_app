import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Alert,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/src/utils/config';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams>;

interface PendingTrainingDriver {
    id: number;
    name: string;
    images: string | null;
    unique_id: string;
    mobile: string;
    state_name: string;
    profile_completion_percentage: number;
    last_watch_video_topic: string;
}

const TrainingCard = ({ driver }: { driver: PendingTrainingDriver }) => {
    const navigation = useNavigation<NavigatorProp>();
    const { t } = useTranslation();

    const handleShareWhatsApp = () => {
        const msg = `Hi ${driver.name}, please complete your pending training on TruckMitr app to get verified!\n\nTM ID: ${driver.unique_id}`;
        Share.share({ message: msg });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.unique_id}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    const handleViewProfile = () => {
        // @ts-ignore
        navigation.navigate(STACKS.DRIVER_ASSOCIATION_DRIVER_DETAILS, {
            driver: {
                id: driver.id,
                name: driver.name,
                tmId: driver.unique_id,
                mobile: driver.mobile,
                image: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                status: 'Training Pending',
                state: driver.state_name,
                completion: driver.profile_completion_percentage,
                amount: 0,
                profile_completion_percentage: String(driver.profile_completion_percentage),
            }
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: driver.images ? `${BASE_URL}public/${driver.images}` : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png' }}
                    style={styles.avatar}
                />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{driver.name}</Text>
                    <Text style={styles.tmId}>{driver.unique_id}</Text>
                    {/* <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                            {driver.last_watch_video_topic === 'Not Started'
                                ? 'Training Not Started'
                                : `Progress: Topic ${driver.last_watch_video_topic}`}
                        </Text>
                    </View> */}
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                    <Ionicons name="copy-outline" size={18} color="#64748B" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardActions}>
                {/* WhatsApp Share Button */}
                <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    <Text style={styles.whatsappBtnText}>Remind</Text>
                </TouchableOpacity>

                {/* View Profile Button */}
                <TouchableOpacity style={styles.viewProfileBtn} onPress={handleViewProfile}>
                    <Ionicons name="person-outline" size={18} color="#6366F1" />
                    <Text style={styles.viewProfileBtnText}>View Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function DriverAssociationPendingTraining() {
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { user } = useSelector((state: any) => state?.user) || {};

    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<PendingTrainingDriver[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingTraining = React.useCallback(async (isRefreshing = false) => {
        if (!user?.id) return;

        try {
            if (!isRefreshing) setLoading(true);
            const response = await axiosInstance.get(END_POINTS.ASSOCIATION_DRIVERS_PENDING_TRAINING(user.id));
            if (response.data && response.data.success) {
                setDrivers(response.data.drivers || []);
            }
        } catch (error) {
            console.error('Error fetching pending training:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    React.useEffect(() => {
        fetchPendingTraining();
    }, [fetchPendingTraining]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPendingTraining(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Training</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={drivers}
                    keyExtractor={(item) => item.unique_id}
                    renderItem={({ item }) => <TrainingCard driver={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366F1']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                            <Text style={styles.emptyText}>All drivers have completed training</Text>
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
    list: {
        flex: 1,
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
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    tmId: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 2,
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontSize: 10,
        color: '#D97706',
        fontWeight: '700',
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    whatsappBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22C55E',
        borderRadius: 10,
        paddingVertical: 10,
        gap: 6,
    },
    whatsappBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    viewProfileBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 10,
        paddingVertical: 10,
        gap: 6,
    },
    viewProfileBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366F1',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
    },
});
