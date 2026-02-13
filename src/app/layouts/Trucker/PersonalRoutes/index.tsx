import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    StatusBar, Dimensions, Animated, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const MapPinIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" /></Svg>);
const PlusIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><Path d="M12 5v14M5 12h14" /></Svg>);
const TrashIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>);
const StarIcon = ({ active }: { active: boolean }) => (<Svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>);
const NavigationIcon = () => (<Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><Path d="M3 11l19-9-9 19-2-8-8-2z" /></Svg>);

interface Props { onBack?: () => void; }

interface Route { id: string; origin: string; destination: string; distance: string; trips: number; isFavorite: boolean; }

const PersonalRoutesScreen: React.FC<Props> = ({ onBack }) => {
    const [routes, setRoutes] = useState<Route[]>([
        { id: '1', origin: 'Mumbai', destination: 'Delhi', distance: '1,420 km', trips: 45, isFavorite: true },
        { id: '2', origin: 'Pune', destination: 'Bangalore', distance: '840 km', trips: 32, isFavorite: true },
        { id: '3', origin: 'Chennai', destination: 'Hyderabad', distance: '630 km', trips: 28, isFavorite: false },
        { id: '4', origin: 'Ahmedabad', destination: 'Jaipur', distance: '520 km', trips: 18, isFavorite: false },
        { id: '5', origin: 'Kolkata', destination: 'Guwahati', distance: '595 km', trips: 12, isFavorite: false },
    ]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRoute, setNewRoute] = useState({ origin: '', destination: '' });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const favoriteRoutes = routes.filter(r => r.isFavorite);
    const otherRoutes = routes.filter(r => !r.isFavorite);

    const handleToggleFavorite = (id: string) => {
        setRoutes(routes.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Route', 'Remove this route from your preferences?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => setRoutes(routes.filter(r => r.id !== id)) },
        ]);
    };

    const handleAddRoute = () => {
        if (!newRoute.origin || !newRoute.destination) {
            Alert.alert('Required', 'Please enter both origin and destination');
            return;
        }
        setRoutes([...routes, { ...newRoute, id: Date.now().toString(), distance: '- km', trips: 0, isFavorite: false }]);
        setShowAddModal(false);
        setNewRoute({ origin: '', destination: '' });
    };

    const RouteCard = ({ route, index }: { route: Route; index: number }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(cardAnim, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }).start();
        }, []);

        return (
            <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
                <View style={styles.routeCard}>
                    <View style={styles.routeLeft}>
                        <View style={styles.routePoints}>
                            <View style={styles.originDot} />
                            <View style={styles.routeLine} />
                            <View style={styles.destDot} />
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeCity}>{route.origin}</Text>
                            <View style={styles.routeDistanceBox}><NavigationIcon /><Text style={styles.routeDistance}>{route.distance}</Text></View>
                            <Text style={styles.routeCity}>{route.destination}</Text>
                        </View>
                    </View>
                    <View style={styles.routeRight}>
                        <Text style={styles.tripCount}>{route.trips} trips</Text>
                        <View style={styles.routeActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleFavorite(route.id)}><StarIcon active={route.isFavorite} /></TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(route.id)}><TrashIcon /></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Routes</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Info Card */}
            <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
                <View style={styles.infoIcon}><MapPinIcon /></View>
                <View style={styles.infoText}>
                    <Text style={styles.infoTitle}>Preferred Routes</Text>
                    <Text style={styles.infoSubtitle}>Get notified for loads on your favorite routes</Text>
                </View>
            </Animated.View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Favorite Routes */}
                {favoriteRoutes.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>⭐ Favorite Routes</Text>
                        {favoriteRoutes.map((route, index) => <RouteCard key={route.id} route={route} index={index} />)}
                    </>
                )}

                {/* Other Routes */}
                <Text style={styles.sectionTitle}>📍 All Routes ({routes.length})</Text>
                {otherRoutes.map((route, index) => <RouteCard key={route.id} route={route} index={index} />)}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
                    <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.fabGradient}><PlusIcon /></LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Add Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Route</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Origin City</Text>
                            <TextInput style={styles.input} placeholder="e.g., Mumbai" placeholderTextColor="#9CA3AF"
                                value={newRoute.origin} onChangeText={(text) => setNewRoute({ ...newRoute, origin: text })} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Destination City</Text>
                            <TextInput style={styles.input} placeholder="e.g., Delhi" placeholderTextColor="#9CA3AF"
                                value={newRoute.destination} onChangeText={(text) => setNewRoute({ ...newRoute, destination: text })} />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.addBtn} onPress={handleAddRoute}>
                                <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.addBtnGradient}><Text style={styles.addBtnText}>Add Route</Text></LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    infoCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20, padding: 18, backgroundColor: '#EFF6FF', borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE' },
    infoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    infoText: { flex: 1 },
    infoTitle: { fontSize: 15, fontWeight: '700', color: '#1E40AF', marginBottom: 2 },
    infoSubtitle: { fontSize: 12, color: '#3B82F6' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 0 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 14, marginTop: 8 },
    routeCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    routeLeft: { flexDirection: 'row', flex: 1 },
    routePoints: { alignItems: 'center', marginRight: 14 },
    originDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E' },
    destDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' },
    routeLine: { width: 2, flex: 1, backgroundColor: '#D1D5DB', marginVertical: 4 },
    routeInfo: { flex: 1 },
    routeCity: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    routeDistanceBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 6 },
    routeDistance: { fontSize: 12, color: '#6B7280' },
    routeRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
    tripCount: { fontSize: 12, fontWeight: '600', color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    routeActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    fabContainer: { position: 'absolute', bottom: 30, right: 20 },
    fab: { borderRadius: 28, elevation: 6 },
    fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 24, textAlign: 'center' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#E5E7EB' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12 },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    addBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    addBtnGradient: { paddingVertical: 14, alignItems: 'center' },
    addBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

export default PersonalRoutesScreen;
