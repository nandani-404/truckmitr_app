import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    StatusBar, Dimensions, Animated, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const BackIcon = () => (<Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2"><Path d="M19 12H5" /><Path d="M12 19l-7-7 7-7" /></Svg>);
const TruckIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" /></Svg>);
const IdCardIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="M6 8h.01M2 12h20M6 16h.01" /></Svg>);
const BuildingIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><Path d="M10 6h4M10 10h4M10 14h4M10 18h4" /></Svg>);
const HashIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><Path d="M4 9h16M4 15h16M10 3v18M14 3v18" /></Svg>);
const UsersIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg>);
const GiftIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"><Rect x="3" y="8" width="18" height="4" rx="1" /><Path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><Path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></Svg>);
const CheckIcon = () => (<Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><Path d="M20 6L9 17l-5-5" /></Svg>);

interface Props { onBack?: () => void; onComplete?: (data: any) => void; }

const vehicleTypes = ['20ft Container', '32ft Multi-axle', 'Open Body', 'Tanker', 'Trailer', 'Mini Truck', 'Pickup', 'LCV'];
const capacityOptions = ['1-5 Tons', '5-10 Tons', '10-15 Tons', '15-20 Tons', '20-25 Tons', '25+ Tons'];

const VehicleInfoScreen: React.FC<Props> = ({ onBack, onComplete }) => {
    const [ownerType, setOwnerType] = useState<'individual' | 'fleet'>('individual');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [capacity, setCapacity] = useState('');
    const [fleetSize, setFleetSize] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [transporterId, setTransporterId] = useState('');
    const [referralCode, setReferralCode] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const handleContinue = () => {
        if (!vehicleNumber || !vehicleType) {
            Alert.alert('Required', 'Please enter Vehicle Number and select Vehicle Type');
            return;
        }
        if (ownerType === 'individual' && !licenseNumber) {
            Alert.alert('Required', 'Please enter your Driving License Number');
            return;
        }
        onComplete?.({
            ownerType, vehicleNumber, vehicleType, capacity,
            fleetSize, companyName, licenseNumber, transporterId, referralCode
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={onBack}><BackIcon /></TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Complete Your Profile</Text>
                        <Text style={styles.headerSubtitle}>Step 1 of 2</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <TruckIcon />
                            <Text style={styles.sectionTitle}>Vehicle Information</Text>
                        </View>

                        {/* Owner Type Toggle */}
                        <Text style={styles.inputLabel}>Are you an?</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, ownerType === 'individual' && styles.toggleBtnActive]}
                                onPress={() => setOwnerType('individual')}>
                                <TruckIcon />
                                <Text style={[styles.toggleText, ownerType === 'individual' && styles.toggleTextActive]}>Individual Owner</Text>
                                {ownerType === 'individual' && <CheckIcon />}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, ownerType === 'fleet' && styles.toggleBtnActive]}
                                onPress={() => setOwnerType('fleet')}>
                                <BuildingIcon />
                                <Text style={[styles.toggleText, ownerType === 'fleet' && styles.toggleTextActive]}>Fleet Owner</Text>
                                {ownerType === 'fleet' && <CheckIcon />}
                            </TouchableOpacity>
                        </View>

                        {/* Fleet Company Name */}
                        {ownerType === 'fleet' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Company Name</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputIcon}><BuildingIcon /></View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your company name"
                                        placeholderTextColor="#9CA3AF"
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Vehicle Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                Vehicle Number <Text style={styles.requiredAsterisk}>*</Text>
                            </Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputIcon}><HashIcon /></View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., MH 12 AB 1234"
                                    placeholderTextColor="#9CA3AF"
                                    value={vehicleNumber}
                                    onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        {/* Vehicle Type */}
                        <Text style={styles.inputLabel}>
                            Vehicle Type <Text style={styles.requiredAsterisk}>*</Text>
                        </Text>
                        <View style={styles.chipGrid}>
                            {vehicleTypes.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.chip, vehicleType === type && styles.chipActive]}
                                    onPress={() => setVehicleType(type)}>
                                    <Text style={[styles.chipText, vehicleType === type && styles.chipTextActive]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Capacity */}
                        <Text style={styles.inputLabel}>Capacity (Tonnage)</Text>
                        <View style={styles.chipGrid}>
                            {capacityOptions.map((cap) => (
                                <TouchableOpacity
                                    key={cap}
                                    style={[styles.chip, capacity === cap && styles.chipActive]}
                                    onPress={() => setCapacity(cap)}>
                                    <Text style={[styles.chipText, capacity === cap && styles.chipTextActive]}>{cap}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Fleet Size (for fleet owners) */}
                        {ownerType === 'fleet' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Fleet Size</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputIcon}><UsersIcon /></View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Number of vehicles"
                                        placeholderTextColor="#9CA3AF"
                                        value={fleetSize}
                                        onChangeText={setFleetSize}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Driver License (for individual) */}
                        {ownerType === 'individual' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    Driving License Number <Text style={styles.requiredAsterisk}>*</Text>
                                </Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputIcon}><IdCardIcon /></View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., MH01-12345678901"
                                        placeholderTextColor="#9CA3AF"
                                        value={licenseNumber}
                                        onChangeText={(text) => setLicenseNumber(text.toUpperCase())}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Transporter ID */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Transporter ID <Text style={styles.optionalText}>(Optional)</Text></Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputIcon}><IdCardIcon /></View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Transport company registration number"
                                    placeholderTextColor="#9CA3AF"
                                    value={transporterId}
                                    onChangeText={setTransporterId}
                                />
                            </View>
                        </View>

                        {/* Referral Code */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Referral Code <Text style={styles.optionalText}>(Optional)</Text></Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputIcon}><GiftIcon /></View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter referral code if any"
                                    placeholderTextColor="#9CA3AF"
                                    value={referralCode}
                                    onChangeText={(text) => setReferralCode(text.toUpperCase())}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <View style={styles.bottomSpacer} />
                    </Animated.View>
                </ScrollView>

                {/* Sticky Footer */}
                <View style={styles.stickyFooter}>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleContinue}>
                        <LinearGradient colors={['#F97316', '#EA580C']} style={styles.nextBtnGradient}>
                            <Text style={styles.nextBtnText}>Continue to Documents</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { padding: 8, marginLeft: -8 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    headerSpacer: { width: 40 },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#E5E7EB', gap: 8 },
    toggleBtnActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
    toggleText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    toggleTextActive: { color: '#F97316' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
    requiredAsterisk: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
    optionalText: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937' },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
    chipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    chipTextActive: { color: '#F97316' },
    bottomSpacer: { height: 100 },
    stickyFooter: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    nextBtn: { borderRadius: 12, overflow: 'hidden' },
    nextBtnGradient: { paddingVertical: 16, alignItems: 'center' },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default VehicleInfoScreen;
