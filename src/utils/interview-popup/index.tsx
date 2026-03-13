import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { TFunction } from 'i18next';
import axiosInstance from '../config/axiosInstance';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OnlineInterviewData {
    type: 'online';
    interview_id: string;
    job_id: string;
    timing: string;
}

export interface PhysicalInterviewData {
    type: 'physical';
    interview_id: string;
    start_date: string;
    end_date: string;
    location?: string;
    current_action?: string;
}

export type InterviewData = OnlineInterviewData | PhysicalInterviewData;

interface InterviewPopupModalProps {
    visible: boolean;
    data: InterviewData[];
    onDismiss: () => void;
    t: TFunction;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_OFFSET_X = 16;     // horizontal offset (more pronounced)
const CARD_OFFSET_Y = 0;
const CARD_SCALE_STEP = 0.06; // slightly more scale difference
const MAX_VISIBLE_STACK = 2;

// ─── Sub-components ──────────────────────────────────────────────────────────

const OnlineContent = ({ data, t }: { data: OnlineInterviewData; t: TFunction }) => (
    <>
        <LinearGradient
            colors={['#056CE2', '#084489']}
            style={styles.iconGradient}
        >
            <View style={styles.iconInner}>
                <Ionicons name="videocam" size={30} color="#fff" />
            </View>
        </LinearGradient>

        <Text style={styles.title}>
            {t('onlineInterview', 'Online Interview')}
        </Text>
        <Text style={styles.subtitle}>
            {t('onlineInterviewSubtitle', 'You have been scheduled for an online video interview.')}
        </Text>

        <View style={styles.infoCard}>
            <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                    <Ionicons name="time-outline" size={16} color="#056CE2" />
                </View>
                <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>
                        {t('interviewTiming', 'Interview Timing')}
                    </Text>
                    <Text style={styles.infoValue}>
                        {moment(data.timing).format('DD MMM YYYY, hh:mm A')}
                    </Text>
                </View>
            </View>
        </View>
    </>
);

const PhysicalContent = ({ data, t }: { data: PhysicalInterviewData; t: TFunction }) => (
    <View style={{ width: '100%', alignItems: 'center' }}>
        <LinearGradient
            colors={['#056CE2', '#084489']}
            style={styles.iconGradient}
        >
            <View style={styles.iconInner}>
                <MaterialCommunityIcons name="map-marker" size={30} color="#fff" />
            </View>
        </LinearGradient>

        <Text style={styles.title}>
            {t('physicalInterview', 'Walk-in Interview')}
        </Text>
        <Text style={styles.subtitle}>
            {t('physicalInterviewSubtitle', 'Congratulations! You\'ve been selected for a walk-in interview. Please reach the location at the time given below.')}
        </Text>

        <View style={[styles.infoCard, { maxHeight: 200 }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
                <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                        <Ionicons name="calendar-outline" size={16} color="#056CE2" />
                    </View>
                    <View style={styles.infoTextWrap}>
                        <Text style={styles.infoLabel}>
                            {t('visitBetween', 'Visit Between')}
                        </Text>
                        <Text style={styles.infoValue}>
                            {moment(data.start_date).format('DD MMM')} - {moment(data.end_date).format('DD MMM YYYY')}
                        </Text>
                    </View>
                </View>

                {(data.current_action?.toLowerCase() === 'accepted' || !data.current_action) && data.location && (
                    <View style={[styles.infoRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', alignItems: 'flex-start' }]}>
                        <View style={styles.infoIconWrap}>
                            <Ionicons name="location-outline" size={16} color="#056CE2" />
                        </View>
                        <View style={styles.infoTextWrap}>
                            <Text style={styles.infoLabel}>
                                {t('location', 'Location')}
                            </Text>
                            <Text style={[styles.infoValue, { fontSize: 13, lineHeight: 18, fontWeight: '600' }]}>
                                {data.location}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const InterviewPopupModal = ({ visible, data, onDismiss, t }: InterviewPopupModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localData, setLocalData] = useState<InterviewData[]>([]);
    const indexRef = useRef(0);
    const animatingRef = useRef(false);
    const transitionAnim = useRef(new Animated.Value(0)).current;

    // Initialize session when modal opens
    useEffect(() => {
        if (visible && data.length > 0) {
            console.log('🎤 Starting Interview Popup Session:', data.length, 'interviews');
            setLocalData(data);
            indexRef.current = 0;
            setCurrentIndex(0);
            animatingRef.current = false;
            transitionAnim.setValue(0);
        } else if (!visible) {
            setLocalData([]);
        }
    }, [visible]);

    useEffect(() => {
        if (visible && localData.length > 0 && currentIndex >= localData.length) {
            console.log('🎤 Session complete, dismissing modal');
            onDismiss();
        }
    }, [currentIndex, visible, localData.length]);

    const handleAction = async (action: 'confirm' | 'reschedule', interview: InterviewData) => {
        if (animatingRef.current || !interview) return;
        
        animatingRef.current = true;
        const apiAction = action === 'confirm' ? 'accepted' : 'schedule_requested';

        // 1. Start Slide-out Animation Immediately for better UX
        Animated.timing(transitionAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.poly(4)),
            useNativeDriver: true,
        }).start(async () => {
            // 2. Call API while card is sliding/fading
            try {
                const payload = {
                    interview_id: interview.interview_id,
                    type: interview.type,
                    action: apiAction,
                };
                console.log('🚀 Sending Interview Action Payload:', payload);
                await axiosInstance.post('api/transporter/interview/action', payload);
            } catch (error: any) {
                console.error('❌ Interview Action Error:', error?.message);
            } finally {
                // 3. Move to next card or dismiss
                const nextIndex = indexRef.current + 1;
                console.log(`🎤 Moving to next card: ${nextIndex + 1}/${localData.length}`);
                if (nextIndex >= localData.length) {
                    onDismiss();
                } else {
                    indexRef.current = nextIndex;
                    setCurrentIndex(nextIndex);
                    transitionAnim.setValue(0);
                    animatingRef.current = false;
                }
            }
        });
    };

    const remaining = localData.length - currentIndex;
    const currentItem = currentIndex < localData.length ? localData[currentIndex] : null;

    return (
        <Modal
            key={`interview-modal-${visible}`} // Force refresh modal state when visible changes
            visible={visible && currentIndex < localData.length}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            {currentItem ? (
                <View style={styles.overlay}>
                    {/* ── Stacked Cards ── */}
                    <View style={styles.stackContainer}>
                        {/* Background cards */}
                        {Array.from({ length: Math.min(remaining - 1, MAX_VISIBLE_STACK) })
                            .reverse()
                            .map((_, i) => {
                                const depth = i + 1;
                                return (
                                    <Animated.View
                                        key={`bg-${currentIndex + depth}`}
                                        pointerEvents="none"
                                        style={[
                                            styles.card,
                                            styles.bgCard,
                                            {
                                                transform: [
                                                    {
                                                        translateX: transitionAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [depth * CARD_OFFSET_X, (depth - 1) * CARD_OFFSET_X],
                                                        })
                                                    },
                                                    {
                                                        scale: transitionAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [1 - depth * CARD_SCALE_STEP, 1 - (depth - 1) * CARD_SCALE_STEP],
                                                        })
                                                    },
                                                ],
                                                opacity: transitionAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [depth === 1 ? 0.6 : 0.3, depth === 1 ? 1 : 0.6],
                                                }),
                                                zIndex: -depth,
                                            },
                                        ]}
                                    />
                                );
                            })}

                        {/* Front card */}
                        <Animated.View
                            pointerEvents={animatingRef.current ? "none" : "auto"}
                            style={[
                                styles.card,
                                {
                                    zIndex: 10,
                                    opacity: transitionAnim.interpolate({
                                        inputRange: [0, 0.4, 1],
                                        outputRange: [1, 0.3, 0],
                                    }),
                                    transform: [
                                        {
                                            translateX: transitionAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, SCREEN_WIDTH],
                                            })
                                        },
                                        {
                                            rotate: transitionAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '15deg'],
                                            })
                                        },
                                    ]
                                },
                            ]}
                        >
                            {/* Card counter */}
                            {localData.length > 1 && (
                                <View style={styles.cardBadge}>
                                    <Text style={styles.badgeText}>
                                        {currentIndex + 1} / {localData.length}
                                    </Text>
                                </View>
                            )}

                            {currentItem.type === 'online' ? (
                                <OnlineContent data={currentItem} t={t} />
                            ) : (
                                <PhysicalContent data={currentItem} t={t} />
                            )}

                            {/* Action buttons */}
                            <View style={styles.actionRow}>
                                {/* Reschedule */}
                                <TouchableOpacity
                                    onPress={() => {
                                        if (currentItem) handleAction('reschedule', currentItem);
                                    }}
                                    activeOpacity={0.8}
                                    style={[styles.actionBtn, styles.rescheduleBtn]}
                                >
                                    <MaterialCommunityIcons
                                        name="calendar-remove"
                                        size={18}
                                        color="#DC2626"
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={styles.rescheduleBtnText}>
                                        {t('reschedule', 'Reschedule')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Confirm */}
                                <TouchableOpacity
                                    onPress={() => {
                                        if (currentItem) handleAction('confirm', currentItem);
                                    }}
                                    activeOpacity={0.8}
                                    style={styles.confirmBtnWrap}
                                >
                                    <LinearGradient
                                        colors={['#056CE2', '#084489']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.confirmBtn}
                                    >
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={18}
                                            color="#fff"
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={styles.confirmBtnText}>
                                            {t('confirm', 'Confirm')}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Close button – below the card stack */}
                    <TouchableOpacity
                        onPress={onDismiss}
                        activeOpacity={0.7}
                        style={styles.closeBtn}
                    >
                        <View style={styles.closeBtnInner}>
                            <Ionicons name="close" size={22} color="#fff" />
                        </View>
                        <Text style={styles.closeBtnText}>{t('close', 'Close')}</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </Modal>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    // Counter inside card
    cardBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '700',
    },

    // Stack
    stackContainer: {
        width: SCREEN_WIDTH * 0.88,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Cards
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: '100%',
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 22,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    bgCard: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        opacity: 0.6,
    },

    // Icon
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    iconInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Text
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 16,
        paddingHorizontal: 4,
    },

    // Info card
    infoCard: {
        width: '100%',
        backgroundColor: '#EFF6FF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    infoTextWrap: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#1E3A5F',
        fontWeight: '700',
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#DBEAFE',
        marginVertical: 10,
    },

    // Action row
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    rescheduleBtn: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1.5,
        borderColor: '#FECACA',
    },
    rescheduleBtnText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
    },
    confirmBtnWrap: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#084489',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    // Close button
    closeBtn: {
        marginTop: 24,
        alignItems: 'center',
    },
    closeBtnInner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    closeBtnText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default InterviewPopupModal;
