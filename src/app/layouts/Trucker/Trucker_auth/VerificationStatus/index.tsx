import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons
const ClockIcon = () => (<Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" /></Svg>);
const CheckCircle = () => (<Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Path d="M22 4L12 14.01l-3-3" /></Svg>);
const XCircle = () => (<Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5"><Circle cx="12" cy="12" r="10" /><Path d="M15 9l-6 6M9 9l6 6" /></Svg>);
const RefreshIcon = () => (<Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><Path d="M23 4v6h-6M1 20v-6h6" /><Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Svg>);

type VerificationStatus = 'new' | 'pending' | 'verified' | 'rejected';

interface Props { status?: VerificationStatus; onContinue?: () => void; onRetry?: () => void; }

const VerificationStatusScreen: React.FC<Props> = ({ status = 'pending', onContinue, onRetry }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();

        if (status === 'pending') {
            const pulse = Animated.loop(Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ]));
            pulse.start();
            return () => pulse.stop();
        }
    }, [status]);

    const statusConfig = {
        new: { icon: <ClockIcon />, title: 'Documents Submitted', subtitle: 'Your documents are being prepared for review', color: '#F59E0B', bg: '#FFFBEB' },
        pending: { icon: <ClockIcon />, title: 'Verification Pending', subtitle: 'Our team is reviewing your documents. This usually takes 24-48 hours.', color: '#F59E0B', bg: '#FFFBEB' },
        verified: { icon: <CheckCircle />, title: 'Verified! 🎉', subtitle: 'Congratulations! Your account is now active. Start finding loads.', color: '#22C55E', bg: '#F0FDF4' },
        rejected: { icon: <XCircle />, title: 'Verification Failed', subtitle: 'Some documents need to be re-uploaded. Please check and retry.', color: '#EF4444', bg: '#FEF2F2' },
    };

    const config = statusConfig[status];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            <View style={styles.content}>
                {/* Status Icon */}
                <Animated.View style={[styles.iconContainer, { backgroundColor: config.bg, transform: [{ scale: scaleAnim }, { scale: status === 'pending' ? pulseAnim : 1 }] }]}>
                    {config.icon}
                </Animated.View>

                {/* Status Text */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
                    <Text style={styles.subtitle}>{config.subtitle}</Text>
                </Animated.View>

                {/* Status Steps */}
                {status === 'pending' && (
                    <Animated.View style={[styles.stepsCard, { opacity: fadeAnim }]}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepDot, styles.stepDotComplete]} /><View style={styles.stepLine} />
                            <Text style={styles.stepText}>Documents Submitted</Text>
                            <Text style={styles.stepStatus}>✓ Done</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepDot, styles.stepDotActive]} /><View style={styles.stepLine} />
                            <Text style={styles.stepText}>Under Review</Text>
                            <Text style={[styles.stepStatus, { color: '#F59E0B' }]}>In Progress</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={styles.stepDot} />
                            <Text style={styles.stepText}>Verification Complete</Text>
                            <Text style={[styles.stepStatus, { color: '#9CA3AF' }]}>Pending</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Rejection Reasons */}
                {status === 'rejected' && (
                    <Animated.View style={[styles.rejectionCard, { opacity: fadeAnim }]}>
                        <Text style={styles.rejectionTitle}>Issues Found:</Text>
                        <View style={styles.rejectionItem}><Text style={styles.rejectionBullet}>•</Text><Text style={styles.rejectionText}>Driving License image is blurry</Text></View>
                        <View style={styles.rejectionItem}><Text style={styles.rejectionBullet}>•</Text><Text style={styles.rejectionText}>RC document expired</Text></View>
                    </Animated.View>
                )}
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomAction}>
                {status === 'verified' && (
                    <TouchableOpacity style={styles.primaryBtn} onPress={onContinue}>
                        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.primaryBtnGradient}>
                            <Text style={styles.primaryBtnText}>Start Finding Loads</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                {status === 'rejected' && (
                    <TouchableOpacity style={styles.primaryBtn} onPress={onRetry}>
                        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.primaryBtnGradient}>
                            <RefreshIcon /><Text style={styles.primaryBtnText}>Re-upload Documents</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                {status === 'pending' && (
                    <View style={styles.pendingInfo}>
                        <Text style={styles.pendingText}>We'll notify you once verification is complete</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    iconContainer: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
    stepsCard: { marginTop: 40, width: '100%', backgroundColor: '#FFF', borderRadius: 18, padding: 24, elevation: 2 },
    stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, position: 'relative' },
    stepDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB', marginRight: 14 },
    stepDotComplete: { backgroundColor: '#22C55E' },
    stepDotActive: { backgroundColor: '#F59E0B' },
    stepLine: { position: 'absolute', left: 7, top: 20, width: 2, height: 28, backgroundColor: '#E5E7EB' },
    stepText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },
    stepStatus: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
    rejectionCard: { marginTop: 30, width: '100%', backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#FECACA' },
    rejectionTitle: { fontSize: 14, fontWeight: '700', color: '#991B1B', marginBottom: 12 },
    rejectionItem: { flexDirection: 'row', marginBottom: 8 },
    rejectionBullet: { color: '#EF4444', marginRight: 8 },
    rejectionText: { fontSize: 13, color: '#7F1D1D' },
    bottomAction: { padding: 24 },
    primaryBtn: { borderRadius: 14, overflow: 'hidden' },
    primaryBtnGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    pendingInfo: { alignItems: 'center', padding: 16, backgroundColor: '#FFFBEB', borderRadius: 14 },
    pendingText: { fontSize: 14, color: '#92400E', textAlign: 'center' },
});

export default VerificationStatusScreen;
