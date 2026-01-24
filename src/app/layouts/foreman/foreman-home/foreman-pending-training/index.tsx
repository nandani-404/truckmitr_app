import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    StatusBar,
    Share,
    Clipboard,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

interface PendingTrainingDriver {
    name: string;
    images: string | null;
    unique_id: string;
    last_watch_video_topic: string;
}

const TrainingCard = ({ driver }: { driver: PendingTrainingDriver }) => {
    const { t } = useTranslation();

    const handleRemind = () => {
        const msg = `Hi ${driver.name}, please complete your pending training on TruckMitr app to get verified!\n\nTM ID: ${driver.unique_id}`;
        Share.share({ message: msg });
    };

    const handleCopy = () => {
        Clipboard.setString(`TM ID: ${driver.unique_id}`);
        showToast(t('copiedToClipboard', 'Copied!'));
    };

    const profileImage = driver.images
        ? `${BASE_URL}public/${driver.images}`
        : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: profileImage }} style={styles.avatar} />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{driver.name}</Text>
                    <Text style={styles.tmId}>{driver.unique_id}</Text>
                    {/* <Text style={styles.lastActive}>Last Topic: {driver.last_watch_video_topic}</Text> */}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.remindBtn} onPress={handleRemind}>
                        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* <View style={styles.divider} /> */}

            {/* Training Status Section */}
            {/* <View style={styles.trainingStatusSection}>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Training Status:</Text>
                    <View style={[
                        styles.statusChip,
                        driver.last_watch_video_topic === 'Not Started'
                            ? styles.statusNotStarted
                            : styles.statusInProgress
                    ]}>
                        <Ionicons
                            name={driver.last_watch_video_topic === 'Not Started' ? 'time-outline' : 'play-circle-outline'}
                            size={14}
                            color={driver.last_watch_video_topic === 'Not Started' ? '#DC2626' : '#F59E0B'}
                        />
                        <Text style={[
                            styles.statusChipText,
                            driver.last_watch_video_topic === 'Not Started'
                                ? styles.statusTextNotStarted
                                : styles.statusTextInProgress
                        ]}>
                            {driver.last_watch_video_topic}
                        </Text>
                    </View>
                </View>
            </View> */}
        </View>
    );
};

export default function ForemanPendingTraining() {
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { t } = useTranslation();

    const { user } = useSelector((state: RootState) => state.user);
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<PendingTrainingDriver[]>([]);
    const [pendingCount, setPendingCount] = useState(0);

    const fetchPendingTraining = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await axiosInstance.get(`${END_POINTS.PENDING_TRAINING(user.id)}`);
            console.log('pending training response', JSON.stringify(response.data, null, 2));

            if (response.data?.success) {
                setDrivers(response.data.drivers || []);
                setPendingCount(response.data.pending_training_count || 0);
            } else {
                setDrivers([]);
                setPendingCount(0);
            }
        } catch (error) {
            console.error('Error fetching pending training:', error);
            showToast(t('errorFetchingData', 'Error fetching data'));
            setDrivers([]);
            setPendingCount(0);
        } finally {
            setLoading(false);
        }
    }, [user?.id, t]);

    useFocusEffect(
        useCallback(() => {
            fetchPendingTraining();
        }, [fetchPendingTraining])
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{t('pendingTraining')}</Text>
                        <Text style={styles.headerSubtitle}>{t('loading')}</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{t('pendingTraining')}</Text>
                    <Text style={styles.headerSubtitle}>{t('driversIncompleteTraining', { count: pendingCount })}</Text>
                </View>
            </View>

            <FlatList
                data={drivers}
                keyExtractor={(item, index) => item.unique_id || index.toString()}
                renderItem={({ item }) => <TrainingCard driver={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={64} color="#22C55E" />
                        <Text style={styles.emptyTitle}>{t('allCaughtUp')}</Text>
                        <Text style={styles.emptySubtitle}>{t('noDriversPendingTraining')}</Text>
                    </View>
                }
            />
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
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
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
    lastActive: {
        fontSize: 11,
        color: '#94A3B8',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    remindBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
        marginBottom: 12,
    },
    trainingStatusSection: {
        gap: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 5,
    },
    statusNotStarted: {
        backgroundColor: '#FEE2E2',
    },
    statusInProgress: {
        backgroundColor: '#FEF3C7',
    },
    statusChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextNotStarted: {
        color: '#DC2626',
    },
    statusTextInProgress: {
        color: '#B45309',
    },
    // Progress bar styles - kept for future use
    progressSection: {
        gap: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moduleText: {
        fontSize: 12,
        color: '#64748B',
    },
    moduleName: {
        fontWeight: '600',
        color: '#475569',
    },
    percentageText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    modulesCount: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
