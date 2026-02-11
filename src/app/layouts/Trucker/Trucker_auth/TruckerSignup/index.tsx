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
const UserIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>);
const PhoneIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>);
const MailIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><Path d="M22 6l-10 7L2 6" /></Svg>);
const TruckIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><Path d="M1 3h15v13H1z" /><Path d="M16 8h4l3 3v5h-7V8z" /><Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" /></Svg>);
const IdCardIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="M6 8h.01M2 12h20M6 16h.01" /></Svg>);
const CheckCircle = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Path d="M22 4L12 14.01l-3-3" /></Svg>);

interface Props { onBack?: () => void; onNext?: (data: any) => void; }

const TruckerSignupScreen: React.FC<Props> = ({ onBack, onNext }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [formData, setFormData] = useState({
        name: '', mobile: '', email: '',
        vehicleType: '', capacity: '', companyName: '',
        licenseNumber: '',
    });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const vehicleTypes = ['20ft Container', '32ft Multi-axle', 'Open Body', 'Tanker', 'Trailer', 'Mini Truck'];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, [step]);

    const handleNext = () => {
        if (step === 1) {
            if (!formData.name || !formData.mobile) {
                Alert.alert('Required', 'Please fill in Name and Mobile number'); return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.vehicleType) {
                Alert.alert('Required', 'Please select a vehicle type'); return;
            }
            setStep(3);
        } else {
            if (!formData.licenseNumber) {
                Alert.alert('Required', 'Please enter your driving license number'); return;
            }
            onNext?.(formData);
        }
    };

    const renderStep1 = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.stepTitle}>👋 Basic Details</Text>
            <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

            <View style={styles.inputGroup}>
                <View style={styles.inputIcon}><UserIcon /></View>
                <TextInput style={styles.input} placeholder="Full Name *" placeholderTextColor="#9CA3AF"
                    value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.inputIcon}><PhoneIcon /></View>
                <TextInput style={styles.input} placeholder="Mobile Number *" placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad" maxLength={10}
                    value={formData.mobile} onChangeText={(text) => setFormData({ ...formData, mobile: text })} />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.inputIcon}><MailIcon /></View>
                <TextInput style={styles.input} placeholder="Email (Optional)" placeholderTextColor="#9CA3AF"
                    keyboardType="email-address" autoCapitalize="none"
                    value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} />
            </View>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.stepTitle}>🚚 Vehicle Information</Text>
            <Text style={styles.stepSubtitle}>Details about your truck</Text>

            <Text style={styles.label}>Select Vehicle Type *</Text>
            <View style={styles.vehicleGrid}>
                {vehicleTypes.map((type) => (
                    <TouchableOpacity key={type}
                        style={[styles.vehicleChip, formData.vehicleType === type && styles.vehicleChipActive]}
                        onPress={() => setFormData({ ...formData, vehicleType: type })}>
                        <Text style={[styles.vehicleChipText, formData.vehicleType === type && styles.vehicleChipTextActive]}>{type}</Text>
                        {formData.vehicleType === type && <CheckCircle />}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.inputIcon}><TruckIcon /></View>
                <TextInput style={styles.input} placeholder="Vehicle Capacity (e.g., 10 Tons)" placeholderTextColor="#9CA3AF"
                    value={formData.capacity} onChangeText={(text) => setFormData({ ...formData, capacity: text })} />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.inputIcon}><UserIcon /></View>
                <TextInput style={styles.input} placeholder="Company Name (Optional)" placeholderTextColor="#9CA3AF"
                    value={formData.companyName} onChangeText={(text) => setFormData({ ...formData, companyName: text })} />
            </View>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.stepTitle}>🪪 License Details</Text>
            <Text style={styles.stepSubtitle}>Your driving credentials</Text>

            <View style={styles.inputGroup}>
                <View style={styles.inputIcon}><IdCardIcon /></View>
                <TextInput style={styles.input} placeholder="Driving License Number *" placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    value={formData.licenseNumber} onChangeText={(text) => setFormData({ ...formData, licenseNumber: text.toUpperCase() })} />
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>📋 Next Steps</Text>
                <Text style={styles.infoText}>After registration, you'll need to upload:</Text>
                <View style={styles.infoItem}><Text style={styles.infoBullet}>•</Text><Text style={styles.infoItemText}>Driving License Photo</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoBullet}>•</Text><Text style={styles.infoItemText}>Vehicle RC (Registration Certificate)</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoBullet}>•</Text><Text style={styles.infoItemText}>Insurance & Permits</Text></View>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2)}>
                        <BackIcon />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Trucker Registration</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map((s) => (
                        <View key={s} style={styles.progressItem}>
                            <View style={[styles.progressDot, s <= step && styles.progressDotActive]}>
                                {s < step ? <CheckCircle /> : <Text style={[styles.progressNum, s <= step && styles.progressNumActive]}>{s}</Text>}
                            </View>
                            <Text style={[styles.progressLabel, s <= step && styles.progressLabelActive]}>
                                {s === 1 ? 'Basic' : s === 2 ? 'Vehicle' : 'License'}
                            </Text>
                        </View>
                    ))}
                    <View style={styles.progressLine}><View style={[styles.progressLineFill, { width: `${((step - 1) / 2) * 100}%` }]} /></View>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Bottom Button */}
                <View style={styles.bottomAction}>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.nextBtnGradient}>
                            <Text style={styles.nextBtnText}>{step === 3 ? 'Continue to Documents' : 'Next'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    progressContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 20, position: 'relative' },
    progressItem: { alignItems: 'center', zIndex: 1 },
    progressDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    progressDotActive: { backgroundColor: '#3B82F6' },
    progressNum: { fontSize: 16, fontWeight: '700', color: '#9CA3AF' },
    progressNumActive: { color: '#FFF' },
    progressLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
    progressLabelActive: { color: '#3B82F6' },
    progressLine: { position: 'absolute', top: 38, left: 60, right: 60, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
    progressLineFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
    stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, marginBottom: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937' },
    vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    vehicleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', gap: 8 },
    vehicleChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
    vehicleChipText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    vehicleChipTextActive: { color: '#3B82F6' },
    infoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    infoTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    infoText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
    infoItem: { flexDirection: 'row', marginBottom: 8 },
    infoBullet: { color: '#3B82F6', marginRight: 8, fontWeight: '700' },
    infoItemText: { fontSize: 14, color: '#374151' },
    bottomAction: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    nextBtn: { borderRadius: 14, overflow: 'hidden' },
    nextBtnGradient: { paddingVertical: 16, alignItems: 'center' },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default TruckerSignupScreen;
