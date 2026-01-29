
import { ActivityIndicator, Image, Text, View, Linking, Platform, UIManager, FlatList, Vibration, Modal, ScrollView, TouchableOpacity } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { BASE_URL } from '@truckmitr/src/utils/config';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import ScreenHeader from '@truckmitr/src/app/components/screen-header';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Recruitment Status Types
type RecruitmentStatus = 'Selected' | 'Joined' | 'Active' | 'Completed' | 'Dropped';

// Mock Recruitment Data
const MOCK_RECRUITMENTS = [
    {
        id: 'REC001',
        driver: {
            id: 'DRV001',
            name: 'Amit Patel',
            unique_id: 'TM-DRV-2024-101',
            mobile: '9123456789',
            rating: 4.6,
            review_count: 32,
            is_trusted: true,
            is_verified: true,
            profile_image: null,
        },
        job: {
            title: 'Heavy Truck Driver - Delhi to Mumbai',
            route: 'Delhi → Mumbai',
            truck_type: 'Container Truck',
            salary: '₹45,000/month',
        },
        status: 'Active' as RecruitmentStatus,
        joining_date: '2024-01-15',
        contract_duration: '6 months',
        current_trip: 'Trip #12 - Mumbai',
    },
    {
        id: 'REC002',
        driver: {
            id: 'DRV002',
            name: 'Rajesh Verma',
            unique_id: 'TM-DRV-2024-102',
            mobile: '9234567890',
            rating: 4.9,
            review_count: 56,
            is_trusted: true,
            is_verified: true,
            profile_image: null,
        },
        job: {
            title: 'Container Truck Driver - Chennai Route',
            route: 'Bangalore → Chennai',
            truck_type: 'Trailer Truck',
            salary: '₹50,000/month',
        },
        status: 'Selected' as RecruitmentStatus,
        joining_date: '2024-01-20',
        contract_duration: '3 months',
        current_trip: null,
    },
    {
        id: 'REC004',
        driver: {
            id: 'DRV004',
            name: 'Manoj Kumar',
            unique_id: 'TM-DRV-2024-104',
            mobile: '9456789012',
            rating: 4.7,
            review_count: 28,
            is_trusted: true,
            is_verified: true,
            profile_image: null,
        },
        job: {
            title: 'Long Haul Driver - North India',
            route: 'Delhi → Kolkata',
            truck_type: 'Heavy Truck',
            salary: '₹55,000/month',
        },
        status: 'Completed' as RecruitmentStatus,
        joining_date: '2023-10-01',
        contract_duration: '3 months',
        current_trip: null,
    },
];

export default function DriverAssociationRecruitments() {
    const { t } = useTranslation();
    useStatusBarStyle('dark-content');
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const navigation = useNavigation<NavigatorProp>();

    // States
    const [loading, setLoading] = useState(true);
    const [recruitments, setRecruitments] = useState<any[]>([]);
    const [lastPressTime, setLastPressTime] = useState(0);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRecruitment, setSelectedRecruitment] = useState<any>(null);

    // Fetch Recruitments
    useFocusEffect(useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            setRecruitments(MOCK_RECRUITMENTS);
            setLoading(false);
        }, 500);
    }, []));

    // Summary Stats
    const stats = useMemo(() => {
        const total = recruitments.length;
        const active = recruitments.filter(r => r.status === 'Active' || r.status === 'Joined').length;
        const completed = recruitments.filter(r => r.status === 'Completed').length;
        return { total, active, completed };
    }, [recruitments]);

    // Debounced Press Handler
    const handlePress = (callback: () => void) => {
        const now = Date.now();
        if (now - lastPressTime < 300) return;
        setLastPressTime(now);
        Vibration.vibrate(10);
        callback();
    };

    // Action Handlers
    const handleCall = (phone: string) => {
        handlePress(() => {
            Linking.openURL(`tel:${phone}`);
        });
    };

    const handleMessage = (phone: string, name: string) => {
        handlePress(() => {
            Linking.openURL(`whatsapp://send?phone=91${phone}&text=${encodeURIComponent(`Hi ${name}`)}`);
        });
    };

    const openProfileModal = (recruitment: any) => {
        handlePress(() => {
            setSelectedRecruitment(recruitment);
            setModalVisible(true);
        });
    };

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            console.log('Cannot go back');
            // Optionally navigate to Home if can't go back, but usually goBack is fine.
            navigation.goBack();
        }
    };

    // Status Chip Colors
    const getStatusStyle = (status: RecruitmentStatus) => {
        switch (status) {
            case 'Selected':
                return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
            case 'Joined':
                return { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' };
            case 'Active':
                return { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' };
            case 'Completed':
                return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
            case 'Dropped':
                return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
            default:
                return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
        }
    };

    // Summary Pill Component
    const SummaryPill = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <View style={{
            flex: 1,
            backgroundColor: `${color}10`,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: `${color}20`,
        }}>
            <Text style={{ fontSize: responsiveFontSize(2.4), fontWeight: '700', color }}>{value}</Text>
            <Text style={{ fontSize: responsiveFontSize(1.2), color: colors.blackOpacity(0.6), marginTop: 2 }}>{label}</Text>
        </View>
    );

    // Recruitment Card Component
    const RecruitmentCard = ({ item, index }: { item: any; index: number }) => {
        const driver = item.driver;
        const job = item.job;
        const statusStyle = getStatusStyle(item.status);

        const profileImage = driver?.profile_image
            ? `${BASE_URL}${driver.profile_image}`
            : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

        return (
            <View
                style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                }}
            >
                {/* TOP ROW - Driver Identity */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    {/* Avatar with verified ring */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => openProfileModal(item)}>
                        <View style={{ position: 'relative' }}>
                            <Image
                                source={{ uri: profileImage }}
                                style={{
                                    height: 56,
                                    width: 56,
                                    borderRadius: 28,
                                    borderWidth: 2,
                                    borderColor: driver.is_verified ? '#2563EB' : '#E2E8F0',
                                }}
                            />
                            {driver.is_verified && (
                                <View style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    backgroundColor: '#2563EB',
                                    borderRadius: 10,
                                    width: 20,
                                    height: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: colors.white,
                                }}>
                                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Name and ID */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                                        {driver.name}
                                    </Text>
                                    {driver.is_trusted && (
                                        <View style={{
                                            marginLeft: 6,
                                            backgroundColor: '#7C3AED',
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 6
                                        }}>
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>TRUSTED</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ fontSize: responsiveFontSize(1.3), color: '#64748B', marginTop: 2 }}>
                                    {driver.unique_id}
                                </Text>
                            </View>

                            {/* Status Chip */}
                            <View style={{
                                backgroundColor: statusStyle.bg,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: statusStyle.border,
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: statusStyle.text }}>{item.status}</Text>
                            </View>
                        </View>

                        {/* Rating */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <FontAwesome name="star" size={11} color="#D97706" />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', marginLeft: 4 }}>{driver.rating}</Text>
                        </View>
                    </View>
                </View>

                {/* DIVIDER */}
                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 12 }} />

                {/* MIDDLE ROW - Job Assignment */}
                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: responsiveFontSize(1.6), fontWeight: '600', color: '#1E293B', marginBottom: 8 }}>
                        {job.title}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={{ fontSize: 12, color: '#475569', marginLeft: 4 }}>{job.route}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Ionicons name="car-outline" size={14} color="#64748B" />
                            <Text style={{ fontSize: 12, color: '#475569', marginLeft: 4 }}>{job.truck_type}</Text>
                        </View>
                    </View>
                </View>

                {/* META INFO ROW */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
                            Joined: {moment(item.joining_date).format('DD MMM YYYY')}
                        </Text>
                    </View>
                </View>

                {/* ACTION BUTTONS */}
                <View style={{ marginTop: 8 }}>
                    <TouchableOpacity
                        onPress={() => openProfileModal(item)}
                        activeOpacity={0.7}
                        style={{
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: '#EFF6FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: '#BFDBFE',
                        }}
                    >
                        <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: responsiveFontSize(1.6) }}>
                            View Recruitment Details
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Empty State
    const EmptyState = () => (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: responsiveHeight(15) }}>
            <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.blueOpacity(0.1),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
            }}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.royalBlue} />
            </View>
            <Text style={{ fontSize: responsiveFontSize(2), fontWeight: '600', color: colors.black, textAlign: 'center', marginBottom: 8 }}>
                No Recruitments Yet
            </Text>
            <Text style={{ fontSize: responsiveFontSize(1.5), color: colors.blackOpacity(0.6), textAlign: 'center', lineHeight: 22 }}>
                Select drivers from Applications to start hiring.
            </Text>
        </View>
    );

    // RENDER
    if (loading) {
        return (
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                <ScreenHeader title={t('association_recruitments')} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.royalBlue} />
                </View>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <ScreenHeader
                title={t('association_recruitments')}
                titleCount={recruitments.length > 0 ? recruitments.length : undefined}
            />

            {/* Summary Section */}
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: responsiveWidth(4), marginBottom: 16 }}>
                <SummaryPill label="Total" value={stats.total} color="#2563EB" />
                <SummaryPill label="Active" value={stats.active} color="#16A34A" />
                <SummaryPill label="Completed" value={stats.completed} color="#6B7280" />
            </View>

            {/* Recruitment List */}
            {recruitments.length === 0 ? (
                <EmptyState />
            ) : (
                <FlatList
                    data={recruitments}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: responsiveWidth(4), paddingBottom: responsiveHeight(4) }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => <RecruitmentCard item={item} index={index} />}
                />
            )}

            {/* Full Screen Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                        paddingTop: Platform.OS === 'android' ? 10 : 50,
                        paddingBottom: 16,
                        paddingHorizontal: 16
                    }}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={{
                                padding: 8,
                                marginRight: 8,
                                marginLeft: -4,
                                zIndex: 10
                            }}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="chevron-back" size={26} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Recruitment Details</Text>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {selectedRecruitment && (() => {
                            const driver = selectedRecruitment.driver;
                            const job = selectedRecruitment.job;
                            const statusStyle = getStatusStyle(selectedRecruitment.status);

                            const profileImage = driver?.profile_image
                                ? `${BASE_URL}${driver.profile_image}`
                                : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

                            return (
                                <View>
                                    {/* Profile Header Block */}
                                    <View style={{ alignItems: 'center', marginBottom: 24, paddingVertical: 10 }}>
                                        <View style={{ position: 'relative' }}>
                                            <Image
                                                source={{ uri: profileImage }}
                                                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: driver.is_verified ? '#2563EB' : '#fff' }}
                                            />
                                            {driver.is_verified && (
                                                <View style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    backgroundColor: '#2563EB',
                                                    borderRadius: 14,
                                                    width: 28,
                                                    height: 28,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 3,
                                                    borderColor: '#F8FAFC',
                                                }}>
                                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                </View>
                                            )}
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                                            <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>{driver.name}</Text>
                                            {driver.is_trusted && (
                                                <View style={{ marginLeft: 8, backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>TRUSTED</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>{driver.unique_id}</Text>

                                        {/* Status Chip */}
                                        <View style={{
                                            marginTop: 12,
                                            backgroundColor: statusStyle.bg,
                                            paddingHorizontal: 16,
                                            paddingVertical: 6,
                                            borderRadius: 20,
                                        }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: statusStyle.text }}>{selectedRecruitment.status}</Text>
                                        </View>
                                    </View>

                                    {/* Job Details Section */}
                                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 }}>Job Assignment</Text>
                                        <View style={{ gap: 16 }}>
                                            {[
                                                ['Job Title', job.title],
                                                ['Route', job.route],
                                                ['Truck Type', job.truck_type],
                                                ['Salary', job.salary],
                                                ['Joining Date', moment(selectedRecruitment.joining_date).format('DD MMM YYYY')],
                                                ['Contract', selectedRecruitment.contract_duration || 'Open-ended'],
                                            ].map(([label, value]) => (
                                                <View key={label as string} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <Text style={{ fontSize: 14, color: '#64748B' }}>{label}</Text>
                                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Contact Actions */}
                                    <View style={{ gap: 12 }}>
                                        <TouchableOpacity onPress={() => handleCall(driver.mobile)} style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: '#16A34A', paddingVertical: 14, borderRadius: 12, gap: 8
                                        }}>
                                            <Ionicons name="call" size={20} color="#FFFFFF" />
                                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Call Driver</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => handleMessage(driver.mobile, driver.name)} style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, gap: 8,
                                            borderWidth: 1, borderColor: '#25D366'
                                        }}>
                                            <FontAwesome name="whatsapp" size={20} color="#25D366" />
                                            <Text style={{ color: '#25D366', fontWeight: '700', fontSize: 15 }}>WhatsApp</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })()}
                    </ScrollView>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
}
