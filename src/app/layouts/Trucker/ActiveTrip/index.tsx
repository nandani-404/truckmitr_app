import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions, Animated, Modal, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const PhoneIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>);
const NavigationIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M3 11l19-9-9 19-2-8-8-2z" /></Svg>);
const CameraIcon = () => (<Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></Svg>);
const CheckCircle = ({ color = "#22C55E" }: { color?: string }) => (<Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Path d="M22 4L12 14.01l-3-3" /></Svg>);
const TruckIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" /></Svg>);
const MapPinIcon = ({ color = "#FFF" }: { color?: string }) => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" /></Svg>);
const AlertCircle = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Path d="M12 8v4M12 16h.01" /></Svg>);

interface Props { onBack?: () => void; onComplete?: () => void; tripId?: string; }

const ActiveTripScreen: React.FC<Props> = ({ onBack, onComplete, tripId = 'LM-34921' }) => {
    const [currentStatus, setCurrentStatus] = useState<number>(2); // 0: Accepted, 1: Reached Pickup, 2: Loaded, 3: In Transit, 4: Reached Dest, 5: Delivered
    const [showPODModal, setShowPODModal] = useState(false);
    const [gpsEnabled, setGpsEnabled] = useState(true);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const trip = {
        id: tripId, origin: 'Andheri East, Mumbai', destination: 'Connaught Place, Delhi',
        shipper: { name: 'Reliance Industries', phone: '+91 98765 43210' },
        trackingAgent: { name: 'Amit Kumar', phone: '+91 98765 11111' },
        material: 'Electronics', weight: '10 Tons', vehicle: 'MH12 AB 1234',
        eta: 'Today 9:30 PM', distance: '1400 km', price: '₹15,000'
    };

    const statuses = [
        { id: 0, label: 'Accepted', icon: '📋', desc: 'Load confirmed' },
        { id: 1, label: 'Reached Pickup', icon: '📍', desc: 'Arrived at origin' },
        { id: 2, label: 'Loaded', icon: '📦', desc: 'Cargo loaded' },
        { id: 3, label: 'In Transit', icon: '🚚', desc: 'On the way' },
        { id: 4, label: 'Reached Destination', icon: '🏁', desc: 'Arrived at drop' },
        { id: 5, label: 'Delivered', icon: '✅', desc: 'POD uploaded' },
    ];

    useEffect(() => {
        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]));
        pulse.start();
        Animated.timing(progressAnim, { toValue: currentStatus / 5, duration: 500, useNativeDriver: false }).start();
        return () => pulse.stop();
    }, [currentStatus]);

    const updateStatus = () => {
        if (currentStatus === 4) { setShowPODModal(true); return; }
        if (currentStatus < 5) {
            Alert.alert('Update Status', `Mark as "${statuses[currentStatus + 1].label}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => { setCurrentStatus(currentStatus + 1); } }
            ]);
        }
    };

    const handlePODUpload = () => {
        setShowPODModal(false);
        setCurrentStatus(5);
        Alert.alert('Trip Completed! 🎉', 'POD uploaded successfully. Payment will be processed.', [{ text: 'OK', onPress: onComplete }]);
    };

    const openMaps = () => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(trip.destination)}`);
    const callShipper = () => Linking.openURL(`tel:${trip.shipper.phone}`);
    const callAgent = () => Linking.openURL(`tel:${trip.trackingAgent.phone}`);

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

            {/* Header */}
            <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Active Trip</Text>
                        <Text style={styles.tripId}>{trip.id}</Text>
                    </View>
                    <View style={[styles.gpsBadge, { backgroundColor: gpsEnabled ? '#22C55E' : '#EF4444' }]}>
                        <Text style={styles.gpsText}>{gpsEnabled ? '📡 GPS ON' : '📡 OFF'}</Text>
                    </View>
                </View>

                {/* Route Summary */}
                <View style={styles.routeBox}>
                    <View style={styles.routePoint}><View style={styles.dotGreen} /><Text style={styles.routeCity} numberOfLines={1}>{trip.origin.split(',')[0]}</Text></View>
                    <View style={styles.routeConnector}><View style={styles.routeLine} /><Animated.View style={[styles.truckIconBox, { transform: [{ scale: pulseAnim }] }]}><TruckIcon /></Animated.View></View>
                    <View style={styles.routePoint}><View style={styles.dotRed} /><Text style={styles.routeCity} numberOfLines={1}>{trip.destination.split(',')[0]}</Text></View>
                </View>

                {/* ETA Banner */}
                <View style={styles.etaBanner}>
                    <View style={styles.etaItem}><Text style={styles.etaLabel}>ETA</Text><Text style={styles.etaValue}>{trip.eta}</Text></View>
                    <View style={styles.etaDivider} />
                    <View style={styles.etaItem}><Text style={styles.etaLabel}>Distance</Text><Text style={styles.etaValue}>{trip.distance}</Text></View>
                    <View style={styles.etaDivider} />
                    <View style={styles.etaItem}><Text style={styles.etaLabel}>Fare</Text><Text style={styles.etaValue}>{trip.price}</Text></View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Status Timeline */}
                <View style={styles.timelineCard}>
                    <Text style={styles.cardTitle}>Trip Progress</Text>
                    <View style={styles.timeline}>
                        {statuses.map((status, index) => (
                            <View key={status.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.timelineDot, index <= currentStatus ? styles.timelineDotActive : null]}>
                                        {index < currentStatus ? <CheckCircle color="#FFF" /> : <Text style={styles.timelineIcon}>{status.icon}</Text>}
                                    </View>
                                    {index < 5 && <View style={[styles.timelineVertical, index < currentStatus ? styles.timelineVerticalActive : null]} />}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineLabel, index <= currentStatus && styles.timelineLabelActive]}>{status.label}</Text>
                                    <Text style={styles.timelineDesc}>{status.desc}</Text>
                                </View>
                                {index === currentStatus && currentStatus < 5 && (
                                    <View style={styles.currentBadge}><Text style={styles.currentText}>Current</Text></View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.cardTitle}>Quick Actions</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
                            <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}><NavigationIcon /></View>
                            <Text style={styles.actionText}>Navigate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={callShipper}>
                            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}><PhoneIcon /></View>
                            <Text style={styles.actionText}>Call Shipper</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={callAgent}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}><PhoneIcon /></View>
                            <Text style={styles.actionText}>Call Agent</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contacts */}
                <View style={styles.contactsCard}>
                    <Text style={styles.cardTitle}>Contacts</Text>
                    <TouchableOpacity style={styles.contactItem} onPress={callShipper}>
                        <View style={styles.contactAvatar}><Text style={styles.avatarText}>{trip.shipper.name.charAt(0)}</Text></View>
                        <View style={styles.contactInfo}><Text style={styles.contactName}>{trip.shipper.name}</Text><Text style={styles.contactRole}>Shipper</Text></View>
                        <View style={styles.callBtnSmall}><PhoneIcon /></View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactItem} onPress={callAgent}>
                        <View style={[styles.contactAvatar, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.avatarText, { color: '#D97706' }]}>{trip.trackingAgent.name.charAt(0)}</Text></View>
                        <View style={styles.contactInfo}><Text style={styles.contactName}>{trip.trackingAgent.name}</Text><Text style={styles.contactRole}>Tracking Agent</Text></View>
                        <View style={[styles.callBtnSmall, { backgroundColor: '#F59E0B' }]}><PhoneIcon /></View>
                    </TouchableOpacity>
                </View>

                {/* Trip Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Cargo Details</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Material</Text><Text style={styles.detailValue}>{trip.material}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Weight</Text><Text style={styles.detailValue}>{trip.weight}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Vehicle</Text><Text style={styles.detailValue}>{trip.vehicle}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Fare</Text><Text style={[styles.detailValue, { color: '#059669' }]}>{trip.price}</Text></View>
                    </View>
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action */}
            {currentStatus < 5 && (
                <View style={styles.bottomAction}>
                    <TouchableOpacity style={styles.updateBtn} onPress={updateStatus}>
                        {currentStatus === 4 ? <CameraIcon /> : null}
                        <Text style={styles.updateBtnText}>
                            {currentStatus === 4 ? 'Upload POD & Complete' : `Mark: ${statuses[currentStatus + 1]?.label}`}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* POD Modal */}
            <Modal visible={showPODModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>📸 Upload Proof of Delivery</Text>
                        <Text style={styles.modalSubtitle}>Take a clear photo of the signed delivery document</Text>
                        <TouchableOpacity style={styles.cameraBox}>
                            <CameraIcon /><Text style={styles.cameraText}>Tap to capture POD</Text>
                        </TouchableOpacity>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPODModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.uploadBtn} onPress={handlePODUpload}><Text style={styles.uploadBtnText}>Upload & Complete</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    tripId: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    gpsBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    gpsText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
    routeBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    routePoint: { alignItems: 'center', flex: 1 },
    dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', marginBottom: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F87171', marginBottom: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    routeCity: { fontSize: 13, fontWeight: '600', color: '#FFF' },
    routeConnector: { flex: 2, alignItems: 'center', justifyContent: 'center' },
    routeLine: { position: 'absolute', height: 3, width: '100%', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
    truckIconBox: { backgroundColor: '#1E40AF', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },
    etaBanner: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 },
    etaItem: { flex: 1, alignItems: 'center' },
    etaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    etaValue: { fontSize: 14, fontWeight: '700', color: '#FFF', marginTop: 2 },
    etaDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    timelineCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    timeline: {},
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
    timelineLeft: { alignItems: 'center', marginRight: 14 },
    timelineDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
    timelineDotActive: { backgroundColor: '#22C55E' },
    timelineIcon: { fontSize: 16 },
    timelineVertical: { width: 3, height: 30, backgroundColor: '#E5E7EB', marginVertical: 4 },
    timelineVerticalActive: { backgroundColor: '#22C55E' },
    timelineContent: { flex: 1, paddingBottom: 20 },
    timelineLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
    timelineLabelActive: { color: '#1F2937' },
    timelineDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    currentBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
    currentText: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },
    actionsCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    actionBtn: { alignItems: 'center' },
    actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    contactsCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3 },
    contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    contactAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#8B5CF6' },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    contactRole: { fontSize: 12, color: '#9CA3AF' },
    callBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
    detailsCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, elevation: 3 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    detailItem: { width: '50%', marginBottom: 14 },
    detailLabel: { fontSize: 11, color: '#9CA3AF' },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 2 },
    bottomAction: { padding: 20, paddingBottom: 30, backgroundColor: '#FFF', elevation: 10 },
    updateBtn: { flexDirection: 'row', backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 10 },
    updateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
    cameraBox: { backgroundColor: '#F3F4F6', borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 24 },
    cameraText: { fontSize: 14, color: '#6B7280', marginTop: 12 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 16, backgroundColor: '#F3F4F6', borderRadius: 14, alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    uploadBtn: { flex: 2, paddingVertical: 16, backgroundColor: '#22C55E', borderRadius: 14, alignItems: 'center' },
    uploadBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

export default ActiveTripScreen;
