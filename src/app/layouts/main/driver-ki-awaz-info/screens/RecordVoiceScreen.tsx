/**
 * Driver Ki Awaz - Record Voice Screen
 * Clean, simple voice recording interface
 * @format
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { STACKS } from '@truckmitr/src/stacks/stacks';

interface RouteParams {
    category?: string;
}

const RecordVoiceScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const params = route.params as RouteParams | undefined;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Animation
    const scale = useSharedValue(1);

    useEffect(() => {
        if (isRecording && !isPaused) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            scale.value = withTiming(1);
        }
    }, [isRecording, isPaused]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = () => {
        setIsRecording(true);
        setIsPaused(false);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => {
                if (prev >= 120) {
                    stopRecording();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);
    };

    const pauseRecording = () => {
        setIsPaused(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        setIsPaused(false);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        setIsRecording(false);
        setIsPaused(false);
        setHasRecording(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const discardRecording = () => {
        Alert.alert(
            'Discard Recording?',
            'Are you sure you want to delete this recording?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => {
                        setRecordingTime(0);
                        setHasRecording(false);
                    },
                },
            ]
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            navigation.navigate(STACKS.DRIVER_KI_AWAZ_POST_STATUS as any, {
                status: 'UNDER_REVIEW',
                postType: 'VOICE',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Record Voice</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Recording Area */}
            <View style={styles.recordingArea}>
                {/* Timer */}
                <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
                <Text style={styles.maxDuration}>Max 2:00 minutes</Text>

                {/* Mic Button with Pulse */}
                <View style={styles.micContainer}>
                    {isRecording && (
                        <>
                            <Animated.View style={[styles.pulse, styles.pulse1, pulseStyle]} />
                            <Animated.View style={[styles.pulse, styles.pulse2, pulseStyle]} />
                        </>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.micButton,
                            isRecording && styles.micButtonRecording,
                        ]}
                        onPress={() => {
                            if (!isRecording) {
                                startRecording();
                            } else if (isPaused) {
                                resumeRecording();
                            } else {
                                pauseRecording();
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isRecording && !isPaused ? 'pause' : 'mic'}
                            size={40}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                </View>

                {/* Status Text */}
                <Text style={styles.statusText}>
                    {isRecording
                        ? isPaused
                            ? 'Paused - Tap to Resume'
                            : '🔴 Recording...'
                        : hasRecording
                            ? '✅ Recording Complete'
                            : 'Tap the mic to start'}
                </Text>

                {/* Stop Button (when recording) */}
                {isRecording && (
                    <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                        <View style={styles.stopIcon} />
                        <Text style={styles.stopText}>Stop</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Actions */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {hasRecording && !isRecording ? (
                    <View style={styles.recordingActions}>
                        <TouchableOpacity
                            style={styles.discardButton}
                            onPress={discardRecording}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={styles.discardText}>Discard</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.submitWrapper}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={isSubmitting ? ['#CBD5E1', '#94A3B8'] : ['#3B82F6', '#1D4ED8']}
                                style={styles.submitButton}
                            >
                                <Ionicons name="send" size={18} color="#FFFFFF" />
                                <Text style={styles.submitText}>
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.tipBox}>
                        <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                        <Text style={styles.tipText}>
                            Record in a quiet place for best quality
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    placeholder: {
        width: 40,
    },
    recordingArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    timer: {
        fontSize: 64,
        fontWeight: '200',
        color: '#1E293B',
        fontVariant: ['tabular-nums'],
    },
    maxDuration: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
        marginBottom: 48,
    },
    micContainer: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        borderRadius: 100,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    pulse1: {
        width: 140,
        height: 140,
    },
    pulse2: {
        width: 120,
        height: 120,
    },
    micButton: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    micButtonRecording: {
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 32,
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 24,
        gap: 8,
    },
    stopIcon: {
        width: 12,
        height: 12,
        backgroundColor: '#EF4444',
        borderRadius: 2,
    },
    stopText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    footer: {
        padding: 20,
    },
    recordingActions: {
        flexDirection: 'row',
        gap: 12,
    },
    discardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
    },
    discardText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    submitWrapper: {
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    submitText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
    },
    tipText: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '500',
    },
});

export default RecordVoiceScreen;
