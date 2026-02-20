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
    FlatList,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import Svg, { Path, Circle } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '@truckmitr/stacks/stacks';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS, BASE_URL } from '@truckmitr/utils/config';

// ==========================================
// INTERFACES
// ==========================================

interface TimelineItem {
    status_code: number;
    label: string;
    timestamp: string;
    description: string;
}

interface ApiLoad {
    id: number;
    load_id: string;
    loading_city_state: string;
    unloading_city_state: string;
    price: string;
    setteled_price: string | null;
    adv_price: string | null;
    meterial: string;
    material?: {
        name: string;
    };
    vehicle_length?: {
        length_label: string;
    };
    driver_info: {
        is_assigned: boolean;
        driver_name: string | null;
        driver_phone: string | null;
        vehicle_number: string | null;
        driver_image: string | null;
    };
    transporter_info: {
        name: string;
        mobile: string;
        profile_image: string | null;
    };
    tracking?: {
        timeline: TimelineItem[];
        current_status_code: number;
    };
    agent_info?: {
        name: string;
        profile_img: string;
        number: string;
    };
    payment_settlement?: {
        shipper_total_amount: string;
        shipper_paid_amount: string;
        shipper_partial_paid_at: string | null;
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
    const [activeTab, setActiveTab] = useState('unassigned');

    const tabs = [
        { id: 'unassigned', label: 'Unassigned', icon: 'person-add-outline' },
        { id: 'assigned', label: 'Assigned', icon: 'checkmark-circle-outline' },
        { id: 'reached_pickup', label: 'Reached Pickup', icon: 'location-outline' },
        { id: 'loaded', label: 'Loaded', icon: 'cube-outline' },
    ];

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

    const getFilteredLoads = useCallback(() => {
        return loads.filter(load => {
            const statusCode = load.tracking?.current_status_code || 0;
            const isAssigned = load.driver_info.is_assigned;

            if (activeTab === 'unassigned') {
                return !isAssigned || !load.tracking?.timeline?.length;
            }
            if (activeTab === 'assigned') {
                return statusCode === 1;
            }
            if (activeTab === 'reached_pickup') {
                return statusCode === 2;
            }
            if (activeTab === 'loaded') {
                return statusCode === 3;
            }
            return false;
        });
    }, [loads, activeTab]);

    const filteredLoads = getFilteredLoads();

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
        const statusCode = load.tracking?.current_status_code || 0;
        const isAssigned = load.driver_info.is_assigned;

        const getStatusConfig = () => {
            if (!isAssigned) return { label: 'Assigning Driver', color: '#f59e0b', bg: '#fff7ed' };
            switch (statusCode) {
                case 1: return { label: 'Vehicle Assigned', color: '#3b82f6', bg: '#eff6ff' };
                case 2: return { label: 'Reached Pickup', color: '#8b5cf6', bg: '#f5f3ff' };
                case 3: return { label: 'Material Loaded', color: '#10b981', bg: '#ecfdf5' };
                default: return { label: 'In Progress', color: '#64748b', bg: '#f8fafc' };
            }
        };

        const status = getStatusConfig();
        const negotiatedAmount = parseFloat(load.payment_settlement?.shipper_total_amount || load.setteled_price || load.price || '0');
        const paidAmount = parseFloat(load.payment_settlement?.shipper_paid_amount || load.adv_price || '0');
        const dueAmount = negotiatedAmount - paidAmount;
        const isPartiallyPaid = (load.payment_settlement?.shipper_partial_paid_at || load.adv_price) ? true : false;

        return (
            <TouchableOpacity
                key={load.id}
                style={[styles.loadCard, { borderLeftColor: status.color }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate(STACKS.SHIPPER_TRACK_DETAIL, { load })}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.loadId}>{load.load_id}</Text>
                        <Text style={styles.cardTimestamp}>
                            {moment(load.created_at).fromNow()}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                        <View style={[styles.badgeDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.label}
                        </Text>
                    </View>
                </View>

                {/* Route Section */}
                <View style={styles.routeSection}>
                    <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: '#22c55e' }]} />
                        <View style={styles.routeTextContainer}>
                            <Text style={styles.routeLabel}>Loading Point</Text>
                            <Text style={styles.routeCity} numberOfLines={1}>{extractCity(load.loading_city_state)}</Text>
                            <Text style={styles.routeState}>{extractState(load.loading_city_state)}</Text>
                        </View>
                    </View>
                    <View style={styles.routeLineBox}>
                        <View style={styles.line} />
                        <View style={styles.truckIconBox}>
                            <Ionicons name="bus" size={14} color={status.color} />
                        </View>
                    </View>
                    <View style={[styles.routePoint, { alignItems: 'flex-start' }]}>
                        <View style={[styles.routeTextContainer, { alignItems: 'flex-end' }]}>
                            <Text style={[styles.routeLabel, { textAlign: 'right' }]}>Unloading Point</Text>
                            <Text style={[styles.routeCity, { textAlign: 'right' }]} numberOfLines={1}>{extractCity(load.unloading_city_state)}</Text>
                            <Text style={[styles.routeState, { textAlign: 'right' }]}>{extractState(load.unloading_city_state)}</Text>
                        </View>
                        <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
                    </View>
                </View>

                {/* Load Details Strip */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="cube-outline" size={14} color="#64748b" />
                        <Text style={styles.metaText} numberOfLines={1}>
                            {load.material?.name || load.meterial}
                        </Text>
                    </View>
                    <View style={styles.metaDividerDot} />
                    <View style={styles.metaItem}>
                        <Ionicons name="resize-outline" size={13} color="#64748b" />
                        <Text style={styles.metaText}>
                            {load.vehicle_length?.length_label || 'NA'}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Detailed Payment Info */}
                <View style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                        <Text style={styles.paymentTitle}>Payment Summary</Text>
                        {isPartiallyPaid && <Text style={styles.paymentStatus}>90% PAID</Text>}
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Negotiated Amount</Text>
                        <Text style={styles.paymentValue}>₹{negotiatedAmount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Payment Made</Text>
                        <Text style={[styles.paymentValue, { color: '#059669' }]}>₹{paidAmount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.paymentDivider} />

                    <View style={styles.dueRow}>
                        <Text style={styles.dueLabel}>Balance Due</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.dueValue}>₹{dueAmount.toLocaleString()}</Text>
                            <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>Payable after delivery</Text>
                        </View>
                    </View>
                </View>

                {/* Assignment Details */}
                <View style={[styles.assignmentBox, { marginTop: 16 }]}>
                    {isAssigned ? (
                        <View style={styles.assignmentInfo}>
                            <View style={styles.partyRow}>
                                <Image
                                    source={{ uri: load.transporter_info.profile_image ? `${BASE_URL}public/${load.transporter_info.profile_image}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                                    style={styles.partyAvatar}
                                />
                                <View style={styles.partyText}>
                                    <Text style={styles.partyName}>{load.transporter_info.name}</Text>
                                    <Text style={styles.partyRole}>Transporter</Text>
                                </View>
                            </View>

                            <View style={styles.partyRow}>
                                <Image
                                    source={{ uri: load.driver_info.driver_image ? `${BASE_URL}public/${load.driver_info.driver_image}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                                    style={styles.partyAvatar}
                                />
                                <View style={styles.partyText}>
                                    <Text style={styles.partyName}>{load.driver_info.driver_name}</Text>
                                    <Text style={styles.partyRole}>Driver • {load.driver_info.vehicle_number}</Text>
                                </View>
                            </View>

                            {load.agent_info && (
                                <TouchableOpacity
                                    style={[styles.supportBtn, { marginTop: 8, backgroundColor: '#fff7ed', borderColor: '#ffedd5', borderWidth: 1 }]}
                                    activeOpacity={0.8}
                                    onPress={() => Alert.alert('Call Agent', `Calling ${load.agent_info?.name}`)}
                                >
                                    <Ionicons name="headset-outline" size={16} color="#9a3412" style={{ marginRight: 8 }} />
                                    <Text style={styles.supportBtnText}>Contact Sales Agent ({load.agent_info.name})</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.pendingContainer}>
                            <View style={styles.pendingInfo}>
                                <View style={styles.pendingTextStack}>
                                    <Text style={styles.pendingTitle}>Driver Assignment Pending</Text>
                                    <Text style={styles.pendingSub}>
                                        The trucker is currently finalising the driver and vehicle details.
                                    </Text>
                                </View>
                            </View>
                            {load.agent_info && (
                                <TouchableOpacity
                                    style={styles.supportBtn}
                                    activeOpacity={0.8}
                                    onPress={() => Alert.alert('Call Agent', `Calling ${load.agent_info?.name}`)}
                                >
                                    <Ionicons name="headset-outline" size={16} color="#9a3412" style={{ marginRight: 8 }} />
                                    <Text style={styles.supportBtnText}>Contact Sales Agent ({load.agent_info.name})</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* View Details Action */}
                <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => navigation.navigate(STACKS.SHIPPER_TRACK_DETAIL, { load })}
                >
                    <Text style={styles.viewDetailsText}>View Shipment Details</Text>
                </TouchableOpacity>
            </TouchableOpacity>
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

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loaderText}>Fetching your shipments...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredLoads}
                    renderItem={({ item }) => renderLoadCard(item)}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
                    }
                    ListHeaderComponent={
                        <View>
                            {/* Tab Bar */}
                            <View style={styles.tabBarContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
                                    {tabs.map(tab => {
                                        const isActive = activeTab === tab.id;
                                        const count = loads.filter(l => {
                                            const sc = l.tracking?.current_status_code || 0;
                                            if (tab.id === 'unassigned') return !l.driver_info.is_assigned || !l.tracking?.timeline?.length;
                                            if (tab.id === 'assigned') return sc === 1;
                                            if (tab.id === 'reached_pickup') return sc === 2;
                                            if (tab.id === 'loaded') return sc === 3;
                                            return false;
                                        }).length;

                                        return (
                                            <TouchableOpacity
                                                key={tab.id}
                                                style={[styles.tabItem, isActive && styles.activeTabItem]}
                                                onPress={() => setActiveTab(tab.id)}
                                            >
                                                <Ionicons
                                                    name={tab.icon as any}
                                                    size={18}
                                                    color={isActive ? '#3b82f6' : '#64748b'}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                                                    {tab.label}
                                                </Text>
                                                {count > 0 && (
                                                    <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
                                                        <Text style={[styles.tabBadgeText, isActive && styles.activeTabBadgeText]}>
                                                            {count}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <View style={styles.alertBoxContainer}>
                                <View style={styles.alertBox}>
                                    <Ionicons name="information-circle" size={20} color="#3b82f6" />
                                    <Text style={styles.alertText}>Track your shipments from loading to delivery in real-time.</Text>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="cube-outline" size={48} color="#94a3b8" />
                            </View>
                            <Text style={styles.emptyTitle}>No {tabs.find(t => t.id === activeTab)?.label} Shipments</Text>
                            <Text style={styles.emptySubtitle}>You don't have any shipments in this stage currently.</Text>
                            {activeTab === 'unassigned' && (
                                <TouchableOpacity style={styles.postLoadBtn} onPress={() => navigation.navigate(STACKS.SHIPPER_POST_LOAD)}>
                                    <Text style={styles.postLoadBtnText}>Post a New Load</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    ListFooterComponent={
                        filteredLoads.length > 0 ? (
                            <View style={styles.footerInfo}>
                                <Text style={styles.footerText}>Only showing loads assigned within the last 30 days.</Text>
                            </View>
                        ) : null
                    }
                />
            )}
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
        marginBottom: 20,
        paddingHorizontal: 12, // Increased from 4
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
    tabBarContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    tabBarScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
    },
    activeTabItem: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    activeTabLabel: {
        color: '#3b82f6',
    },
    tabBadge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
    },
    activeTabBadge: {
        backgroundColor: '#3b82f6',
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
    },
    activeTabBadgeText: {
        color: '#fff',
    },
    flatListContent: {
        padding: 16,
        paddingBottom: 60,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: '#f8fafc',
        paddingVertical: 8,
        borderRadius: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginLeft: 4,
    },
    metaDividerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 10,
    },
    metaPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    assignmentInfo: {
        gap: 12,
    },
    partyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    partyAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
    },
    partyText: {
        flex: 1,
        marginLeft: 10,
    },
    partyName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
    },
    partyRole: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 1,
    },
    actionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBoxContainer: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    paymentCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    paymentStatus: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6366f1',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    paymentValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },
    paymentDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    dueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
    },
    dueValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#ef4444',
    },
    viewDetailsBtn: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#3b82f6',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    viewDetailsText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '800',
    },
});

export default ShipperInProgressLoads;
