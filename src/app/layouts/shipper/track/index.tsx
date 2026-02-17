import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, RefreshControl, StatusBar, ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '@truckmitr/stacks/stacks';
import Svg, { Path } from 'react-native-svg';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config';

const TrackIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <Path d="M12 13a3 3 0 100-6 3 3 0 000 6z" />
    </Svg>
);

const ShipperTrack = () => {
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loads, setLoads] = useState<any[]>([]);

    const fetchLoads = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await axiosInstance.post(END_POINTS.GET_LOAD_BY_STATUS, {
                status: 'in-transit'
            });
            console.log('response', response);
            if (response?.data?.success) {
                setLoads(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching transit loads:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLoads();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLoads(false);
    };

    const renderLoadCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate(STACKS.SHIPPER_TRACK_DETAIL, { load: item })}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.loadId}>{item.load_id}</Text>
                    <Text style={styles.materialText}>
                        {item.material?.name || item.meterial} • {item.meterial_quantity} Tons
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.statusText, { color: '#166534' }]}>
                        In Transit
                    </Text>
                </View>
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.routeIconCol}>
                    <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
                    <View style={styles.routeLine} />
                    <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
                </View>
                <View style={styles.routeTextCol}>
                    <Text style={styles.routeText} numberOfLines={1}>{item.loading_city_state}</Text>
                    <View style={{ height: 16 }} />
                    <Text style={styles.routeText} numberOfLines={1}>{item.unloading_city_state}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.driverInfo}>
                    <Ionicons name="person-circle" size={24} color="#64748b" />
                    <Text style={styles.driverName}>{item.driver_info?.driver_name || 'N/A'}</Text>
                </View>
                <View style={styles.trackAction}>
                    <TrackIcon />
                    <Text style={styles.trackActionText}>Track Live</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Track Shipment</Text>
                <Text style={styles.headerSubtitle}>Monitor your ongoing loads in real-time</Text>
            </View>

            <FlatList
                data={loads}
                renderItem={renderLoadCard}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
                }
                ListHeaderComponent={isLoading && !refreshing ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} /> : null}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="location-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No active loads to track</Text>
                            <Text style={styles.emptySubtitle}>Ongoing shipments will appear here</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    listContent: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    loadId: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    materialText: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: { fontSize: 11, fontWeight: '700' },
    routeContainer: { flexDirection: 'row', marginBottom: 16 },
    routeIconCol: { alignItems: 'center', width: 20, marginRight: 12 },
    routeDot: { width: 8, height: 8, borderRadius: 4 },
    routeLine: { width: 2, flex: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
    routeTextCol: { flex: 1, justifyContent: 'space-between' },
    routeText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: { flexDirection: 'row', alignItems: 'center' },
    driverName: { fontSize: 13, color: '#475569', marginLeft: 8, fontWeight: '500' },
    trackAction: { flexDirection: 'row', alignItems: 'center' },
    trackActionText: { color: '#3b82f6', fontSize: 13, fontWeight: '600', marginLeft: 6 },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
});

export default ShipperTrack;
