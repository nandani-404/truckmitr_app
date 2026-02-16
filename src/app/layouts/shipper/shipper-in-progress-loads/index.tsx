import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '@truckmitr/stacks/stacks';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config';

// ==========================================
// INTERFACES
// ==========================================

interface ApiLoad {
    id: number;
    load_id: string;
    loading_city_state: string;
    unloading_city_state: string;
    driver_info: {
        is_assigned: boolean;
        driver_name: string | null;
        driver_phone: string | null;
        vehicle_number: string | null;
    };
    transporter_info: {
        name: string;
    };
    created_at: string;
}

// ==========================================
// COMPONENT
// ==========================================

const ShipperInProgressLoads: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loads, setLoads] = useState<ApiLoad[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLoads = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await axiosInstance.post(END_POINTS.GET_LOAD_BY_STATUS, {
                status: 'in_progress'
            });

            if (response.data.success) {
                setLoads(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching in-progress loads:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLoads();
    }, []);

    const onRefresh = useCallback(() => {
        fetchLoads(true);
    }, []);

    const extractCity = (location: string) => {
        if (!location) return '';
        return location.split(',')[0].trim();
    };

    const extractState = (location: string) => {
        if (!location) return '';
        const parts = location.split(',');
        return parts.length > 1 ? parts[1].trim() : '';
    };

    const renderLoadCard = (load: ApiLoad) => {
        const isTransit = load.driver_info.is_assigned;

        return (
            <View key={load.id} style={[styles.loadCard, { borderLeftColor: isTransit ? '#10b981' : '#f59e0b' }]}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.loadId}>{load.load_id}</Text>
                        <Text style={styles.cardTimestamp}>Active Step</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: isTransit ? '#ecfdf5' : '#fff7ed' }]}>
                        <View style={[styles.badgeDot, { backgroundColor: isTransit ? '#10b981' : '#f59e0b' }]} />
                        <Text style={[styles.badgeText, { color: isTransit ? '#065f46' : '#9a3412' }]}>
                            {isTransit ? 'In Transit' : 'Assigning Driver'}
                        </Text>
                    </View>
                </View>

                {/* Route Section */}
                <View style={styles.routeSection}>
                    <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: '#22c55e' }]} />
                        <View style={styles.routeTextContainer}>
                            <Text style={styles.routeLabel}>Origin</Text>
                            <Text style={styles.routeCity}>{extractCity(load.loading_city_state)}</Text>
                            <Text style={styles.routeState}>{extractState(load.loading_city_state)}</Text>
                        </View>
                    </View>
                    <View style={styles.routeLineBox}>
                        <View style={styles.line} />
                        <View style={styles.truckIconBox}>
                            <Ionicons name="bus" size={14} color="#94a3b8" />
                        </View>
                    </View>
                    <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
                        <View style={[styles.routeTextContainer, { alignItems: 'flex-end' }]}>
                            <Text style={[styles.routeLabel, { textAlign: 'right' }]}>Destination</Text>
                            <Text style={[styles.routeCity, { textAlign: 'right' }]}>{extractCity(load.unloading_city_state)}</Text>
                            <Text style={[styles.routeState, { textAlign: 'right' }]}>{extractState(load.unloading_city_state)}</Text>
                        </View>
                        <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Assignment Details */}
                <View style={styles.assignmentBox}>
                    <View style={styles.detailRow}>
                        <View style={styles.labelCol}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="business" size={12} color="#64748b" />
                            </View>
                            <Text style={styles.label}>Transporter</Text>
                        </View>
                        <Text style={styles.value}>{load.transporter_info.name}</Text>
                    </View>

                    {isTransit ? (
                        <>
                            <View style={styles.detailRow}>
                                <View style={styles.labelCol}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="person" size={12} color="#64748b" />
                                    </View>
                                    <Text style={styles.label}>Driver</Text>
                                </View>
                                <Text style={styles.value}>{load.driver_info.driver_name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <View style={styles.labelCol}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="barcode" size={12} color="#64748b" />
                                    </View>
                                    <Text style={styles.label}>Vehicle</Text>
                                </View>
                                <Text style={[styles.value, styles.highlightValue]}>{load.driver_info.vehicle_number}</Text>
                            </View>

                            <View style={styles.transitInfoBox}>
                                <View style={styles.transitInfoIcon}>
                                    <Ionicons name="information-circle" size={18} color="#0369a1" />
                                </View>
                                <Text style={styles.transitInfoText}>Your load will be in transit after loading starts</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.pendingContainer}>
                            <View style={styles.pendingInfo}>
                                <View style={styles.pendingTextStack}>
                                    <Text style={styles.pendingTitle}>Driver Assignment Pending</Text>
                                    <Text style={styles.pendingSub}>The trucker is currently finalising the driver and vehicle details. Once assigned, you'll be able to see the vehicle details here.</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.supportBtn} activeOpacity={0.8}>
                                <Ionicons name="headset-outline" size={16} color="#9a3412" style={{ marginRight: 8 }} />
                                <Text style={styles.supportBtnText}>Contact Assigned Sales Partner</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>In Progress Loads</Text>
                    {!isLoading && <Text style={styles.subtitle}>{loads.length} Shipments Active</Text>}
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
                }
            >
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loaderText}>Fetching your shipments...</Text>
                    </View>
                ) : loads.length > 0 ? (
                    <>
                        <View style={styles.alertBox}>
                            <Ionicons name="information-circle" size={20} color="#3b82f6" />
                            <Text style={styles.alertText}>Track your shipments from loading to delivery in real-time.</Text>
                        </View>

                        {loads.map(load => renderLoadCard(load))}

                        <View style={styles.footerInfo}>
                            <Text style={styles.footerText}>Only showing loads assigned within the last 30 days.</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="cube-outline" size={48} color="#94a3b8" />
                        </View>
                        <Text style={styles.emptyTitle}>No Shipments in Progress</Text>
                        <Text style={styles.emptySubtitle}>You don't have any shipments currently in transit. Your accepted loads will appear here once they start moving.</Text>
                        <TouchableOpacity style={styles.postLoadBtn} onPress={() => navigation.navigate(STACKS.SHIPPER_POST_LOAD)}>
                            <Text style={styles.postLoadBtnText}>Post a New Load</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    alertText: {
        flex: 1,
        fontSize: 12,
        color: '#1e40af',
        fontWeight: '500',
    },
    loadCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderLeftWidth: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    loadId: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.2,
    },
    cardTimestamp: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
        fontWeight: '500',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    routeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    routePoint: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    routeTextContainer: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 3,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    routeCity: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
    },
    routeLineBox: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    line: {
        position: 'absolute',
        height: 2,
        width: '100%',
        backgroundColor: '#f1f5f9',
    },
    truckIconBox: {
        backgroundColor: '#fff',
        padding: 4,
    },
    divider: {
        height: 1.5,
        backgroundColor: '#f8fafc',
        marginBottom: 20,
    },
    assignmentBox: {
        gap: 14,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    labelCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    label: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    value: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '700',
    },
    highlightValue: {
        color: '#3b82f6',
    },
    transitInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0f2fe',
        marginTop: 6,
    },
    transitInfoIcon: {
        marginRight: 10,
    },
    transitInfoText: {
        flex: 1,
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '600',
        lineHeight: 18,
    },
    pendingContainer: {
        backgroundColor: '#fffbeb',
        borderRadius: 20,
        padding: 16,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    pendingInfo: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    pendingTextStack: {
        flex: 1,
    },
    pendingTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#92400e',
        marginBottom: 4,
    },
    pendingSub: {
        fontSize: 12,
        color: '#b45309',
        lineHeight: 18,
        fontWeight: '500',
    },
    supportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#fcd34d',
        borderRadius: 14,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    supportBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#92400e',
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    routeState: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '500',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    loaderText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    postLoadBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    postLoadBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default ShipperInProgressLoads;
