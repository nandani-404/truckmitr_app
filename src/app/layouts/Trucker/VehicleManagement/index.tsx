import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import axiosInstance from 'src/utils/config/axiosInstance';
import { END_POINTS } from 'src/utils/config';
import { useNavigation } from '@react-navigation/native';
import { TRUCKER_STACKS } from 'src/stacks/stacks';

// ── Icons ──
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const TruckIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" /></Svg>);
const ChevronRightIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><Path d="M9 18l6-6-6-6" /></Svg>);

interface Props {
    onBack?: () => void;
}

const VehicleManagementScreen: React.FC<Props> = ({ onBack }) => {
    const navigation = useNavigation<any>();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.TRUCKER_GET_VEHICLES);
            if (response.data.status === 'success') {
                setVehicles(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVehiclePress = (vehicle: any) => {
        navigation.navigate(TRUCKER_STACKS.VEHICLE_DETAILS, { vehicle });
    };

    if (loading) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
                    <BackIcon />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Vehicles</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent}>
                {vehicles.length === 0 ? (
                    <View style={s.emptyState}>
                        <Text style={s.emptyText}>No vehicles found.</Text>
                        <Text style={s.emptySub}>Add a vehicle to get started.</Text>
                    </View>
                ) : (
                    vehicles.map((v, i) => (
                        <TouchableOpacity
                            key={v.id || i}
                            style={s.card}
                            activeOpacity={0.9}
                            onPress={() => handleVehiclePress(v)}
                        >
                            <View style={s.cardHeader}>
                                <View style={s.iconBox}>
                                    <TruckIcon />
                                </View>
                                <View style={s.cardInfo}>
                                    <Text style={s.regNum}>{v.registration_number}</Text>
                                    <Text style={s.model}>{v.manufacturer} {v.model}</Text>
                                </View>
                                <ChevronRightIcon />
                            </View>

                            <View style={s.divider} />

                            <View style={s.cardFooter}>
                                <View style={s.tag}>
                                    <Text style={s.tagLabel}>Body Type</Text>
                                    <Text style={s.tagValue}>{v.body_type || 'N/A'}</Text>
                                </View>
                                <View style={s.tag}>
                                    <Text style={s.tagLabel}>Fuel</Text>
                                    <Text style={s.tagValue}>{v.fuel_type || 'N/A'}</Text>
                                </View>
                                {/* <View style={[s.statusTag, v.rc_status === 'ACTIVE' ? s.statusActive : s.statusInactive]}>
                                    <Text style={[s.statusText, v.rc_status === 'ACTIVE' ? { color: '#059669' } : { color: '#D97706' }]}>
                                        {v.rc_status || 'Pending'}
                                    </Text>
                                </View> */}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
    },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    scrollContent: { padding: 16 },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
    emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },

    // Card
    card: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: {
        width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    cardInfo: { flex: 1 },
    regNum: { fontSize: 16, fontWeight: '700', color: '#111827' },
    model: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tag: { flex: 1 },
    tagLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
    tagValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: '#F3F4F6' },
    statusActive: { backgroundColor: '#ECFDF5' },
    statusInactive: { backgroundColor: '#FEF3C7' },
    statusText: { fontSize: 11, fontWeight: '700' },
});

export default VehicleManagementScreen;
