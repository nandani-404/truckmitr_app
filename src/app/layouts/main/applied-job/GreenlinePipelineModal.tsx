import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import axiosInstance from '../../../../utils/config/axiosInstance';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GreenlinePipelineModalProps {
    visible: boolean;
    onClose: () => void;
    data: any;
    loading: boolean;
    onRefresh?: () => void;
}

const GreenlinePipelineModal: React.FC<GreenlinePipelineModalProps> = ({
    visible,
    onClose,
    data,
    loading,
    onRefresh
}) => {
    const colors = useColor();
    const { responsiveFontSize, responsiveHeight, responsiveWidth } = useResponsiveScale();
    const { t } = useTranslation();

    const [isActionLoading, setIsActionLoading] = React.useState(false);

    const handleInterviewAction = async (action: 'accepted' | 'schedule_requested', interviewType: 'online' | 'physical' = 'online') => {
        if (!data?.interview?.id) return;

        try {
            setIsActionLoading(true);
            const res = await axiosInstance.post('api/transporter/interview/action', {
                interview_id: data.interview.id,
                type: interviewType,
                action: action,
            });

            if (res.data?.status) {
                onRefresh?.();
            }
        } catch (error) {
            console.error('Interview Action Error:', error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const renderStep = (
        title: string,
        status: string | null | undefined,
        date: string | null | undefined,
        icon: string,
        isLast: boolean = false,
        isActive: boolean = false,
        isCompleted: boolean = false,
        description: string | null = null,
        descriptionColor: string = '#F39C12',
        actions?: React.ReactNode
    ) => {
        return (
            <View style={styles.stepContainer}>
                <View style={styles.leftColumn}>
                    <View style={[
                        styles.iconCircle,
                        {
                            backgroundColor: isCompleted ? '#10B981' : (isActive ? colors.royalBlue + '20' : colors.blackOpacity(0.05)),
                        }
                    ]}>
                        {isCompleted ? (
                            <Ionicons name="checkmark" size={responsiveFontSize(2)} color={colors.white} />
                        ) : (
                            <MaterialCommunityIcons
                                name={icon as any}
                                size={responsiveFontSize(2.2)}
                                color={isActive ? colors.royalBlue : colors.blackOpacity(0.3)}
                            />
                        )}
                    </View>
                    {!isLast && (
                        <View style={[
                            styles.line,
                            { backgroundColor: isCompleted ? '#10B981' : colors.blackOpacity(0.1) }
                        ]} />
                    )}
                </View>
                <View style={[styles.rightColumn, { paddingBottom: isLast ? 0 : responsiveHeight(4) }]}>
                    <Text style={[
                        styles.stepTitle,
                        { color: colors.black, fontSize: responsiveFontSize(1.9) }
                    ]}>
                        {title}
                    </Text>
                    <Text style={[
                        styles.stepStatus,
                        {
                            color: isCompleted ? colors.blackOpacity(0.4) : colors.blackOpacity(0.3),
                            fontSize: responsiveFontSize(1.5)
                        }
                    ]}>
                        {date || status || t('pending', 'Pending')}
                    </Text>
                    {description && (
                        <Text style={[
                            styles.stepDescription,
                            {
                                color: descriptionColor,
                                fontSize: responsiveFontSize(1.35),
                                marginTop: 4,
                                fontWeight: '600'
                            }
                        ]}>
                            {description}
                        </Text>
                    )}
                    {actions && (
                        <View style={styles.actionsContainer}>
                            {actions}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={{ flex: 1 }}
                />
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.white }
                    ]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, paddingHorizontal: 16 }}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.handle} />
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <Ionicons name="close" size={responsiveFontSize(2.8)} color={colors.blackOpacity(0.4)} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled bounces contentContainerStyle={styles.scrollContent}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.royalBlue} />
                            </View>
                        ) : data ? (
                            <>
                                <View style={styles.header}>
                                    <View style={[styles.headerIcon, { backgroundColor: '#10B981' + '15' }]}>
                                        <Feather name="git-pull-request" size={responsiveFontSize(2.5)} color="#10B981" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            numberOfLines={1}
                                            style={[styles.title, { color: colors.black, fontSize: responsiveFontSize(2.1) }]}
                                        >
                                            {data?.job_info?.job_title || t('greenlinePipeline', 'Greenline Pipeline')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.statusBox, { backgroundColor: '#10B981' + '08', borderColor: '#10B981' + '20' }]}>
                                    <Text style={[styles.statusLabel, { color: '#10B981', fontSize: responsiveFontSize(1.4) }]}>
                                        {t('currentStatus', 'CURRENT STATUS')}
                                    </Text>
                                    <View style={styles.statusRow}>
                                        <View style={styles.statusDot} />
                                        <Text style={[styles.statusValue, { color: colors.black, fontSize: responsiveFontSize(2) }]}>
                                            {data.pipeline_status || 'Applied'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.pipelineContainer}>
                                    {renderStep(
                                        t('applicationSubmitted', 'Application Submitted'),
                                        null,
                                        data.applied_at,
                                        'file-document-outline',
                                        false,
                                        false,
                                        true
                                    )}

                                    {(() => {
                                        const screening = data.screening;
                                        const isScreeningObject = typeof screening === 'object' && screening !== null;

                                        // Screening is green if pipeline has moved past screening or interview data exists
                                        const isDone = data.pipeline_status !== 'Applied' &&
                                            data.pipeline_status !== 'Screening' &&
                                            data.pipeline_status !== 'Pending' ||
                                            (typeof data.interview === 'object' && data.interview !== null);

                                        let statusText = t('pending', 'Pending');
                                        let description = null;

                                        if (isScreeningObject) {
                                            statusText = `${screening.result}% ${screening.telecaller_status}`;
                                            if (screening.status === 'pending') {
                                                description = t('waitingForTransporter', 'Waiting for transporter to accept');
                                            } else if (screening.status === 'accepted') {
                                                description = t('transporterAccepted', 'transporter accepted you on the basis of your screening questions');
                                            } else if (screening.status === 'shortlisted') {
                                                description = t('transporterBuffer', 'The transporter has saved your profile in their candidate pool for potential future opportunities.');
                                            } else if (screening.status === 'rejected') {
                                                description = t('transporterRejected', 'The transporter has moved on with other applications for now, but they may reach out to you again in the future.');
                                            }
                                        } else if (data.pipeline_status === 'Screening Done') {
                                            statusText = t('screeningDone', 'Screening Done');
                                            description = t('waitingForApproval', 'Results Pending Approval');
                                        } else if (typeof screening === 'string') {
                                            statusText = screening;
                                        }

                                        const statusDate = isScreeningObject ? screening.screened_at : null;
                                        const descriptionColor = screening?.status === 'accepted' ? '#10B981' :
                                            (screening?.status === 'rejected' ? '#EF4444' :
                                                (screening?.status === 'shortlisted' ? colors.royalBlue : '#F39C12'));

                                        return renderStep(
                                            t('screening', 'Screening'),
                                            statusText,
                                            statusDate,
                                            'clipboard-check-outline',
                                            false,
                                            data.pipeline_status === 'Screening',
                                            isDone,
                                            description,
                                            descriptionColor
                                        );
                                    })()}

                                    {(() => {
                                        const interview = data.interview;
                                        const isObject = typeof interview === 'object' && interview !== null;
                                        const currentAction = isObject ? interview.online_current_action : null;

                                        let statusText = t('pending', 'Pending');
                                        let description = null;
                                        let descriptionColor = '#F39C12';
                                        let actions = null;

                                        const isStepActive = data.pipeline_status?.startsWith('Online Interview');
                                        const isStepCompleted = data.pipeline_status?.startsWith('Physical Interview') ||
                                            data.pipeline_status === 'Interview' ||
                                            data.pipeline_status === 'Hired' ||
                                            (isObject && interview.online_interview_status === 'accepted') ||
                                            (isObject && interview.online_interview_status === 'completed');

                                        if (isObject) {
                                            statusText = interview.online_interview_timing || t('scheduled', 'Scheduled');

                                            // First check interview result (transporter's decision after interview)
                                            if (interview.online_interview_status === 'accepted') {
                                                description = t('onlineInterviewSelected', 'Selected! Transporter has approved your online interview.');
                                                descriptionColor = '#10B981';
                                            } else if (interview.online_interview_status === 'rejected') {
                                                description = t('onlineInterviewRejected', 'Transporter has moved forward with other candidates for this round.');
                                                descriptionColor = '#EF4444';
                                            } else if (interview.online_interview_status === 'shortlisted') {
                                                description = t('onlineInterviewShortlisted', 'You are in the pipeline. Transporter may reach out to you soon.');
                                                descriptionColor = colors.royalBlue;
                                            }
                                            // Then check driver's action on the schedule (only if no result yet)
                                            else if (currentAction === 'pending') {
                                                actions = (
                                                    <>
                                                        <View style={styles.timingCard}>
                                                            <View style={styles.timingIconWrap}>
                                                                <Ionicons name="time" size={responsiveFontSize(2.2)} color={colors.royalBlue} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={[styles.timingLabel, { fontSize: responsiveFontSize(1.3), color: colors.blackOpacity(0.5) }]}>
                                                                    {t('scheduledAt', 'Scheduled At')}
                                                                </Text>
                                                                <Text style={[styles.timingValue, { fontSize: responsiveFontSize(1.8), color: colors.black }]}>
                                                                    {interview.online_interview_timing}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={[styles.buttonRow, { marginTop: 12 }]}>
                                                            <TouchableOpacity
                                                                style={[styles.smallButton, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}
                                                                onPress={() => handleInterviewAction('schedule_requested')}
                                                                disabled={isActionLoading}
                                                            >
                                                                <Text style={[styles.buttonText, { color: '#DC2626' }]}>
                                                                    {isActionLoading ? '...' : t('reschedule', 'Reschedule')}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.smallButton, { backgroundColor: '#10B981' }]}
                                                                onPress={() => handleInterviewAction('accepted')}
                                                                disabled={isActionLoading}
                                                            >
                                                                <Text style={[styles.buttonText, { color: '#fff' }]}>
                                                                    {isActionLoading ? '...' : t('confirm', 'Confirm')}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </>
                                                );
                                            } else if (currentAction === 'schedule_requested') {
                                                description = t('rescheduleApplied', 'Reschedule applied. Waiting for update.');
                                                descriptionColor = colors.blackOpacity(0.5);
                                            } else if (currentAction === 'accepted') {
                                                description = t('interviewReady', 'Be ready for the video call interview.');
                                                descriptionColor = '#10B981';
                                                actions = (
                                                    <View style={styles.timingCard}>
                                                        <View style={styles.timingIconWrap}>
                                                            <Ionicons name="time" size={responsiveFontSize(2.2)} color={colors.royalBlue} />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={[styles.timingLabel, { fontSize: responsiveFontSize(1.3), color: colors.blackOpacity(0.5) }]}>
                                                                {t('scheduledAt', 'Scheduled At')}
                                                            </Text>
                                                            <Text style={[styles.timingValue, { fontSize: responsiveFontSize(1.8), color: colors.black }]}>
                                                                {interview.online_interview_timing}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            }
                                        }

                                        return renderStep(
                                            t('onlineInterview', 'Online Interview'),
                                            statusText,
                                            null,
                                            'video-outline',
                                            false,
                                            isStepActive,
                                            isStepCompleted,
                                            description,
                                            descriptionColor,
                                            actions
                                        );
                                    })()}
                                    {(() => {
                                        const interview = data.interview;
                                        const isObject = typeof interview === 'object' && interview !== null;
                                        const physicalAction = isObject ? interview.physical_current_action : null;

                                        let statusText = t('pending', 'Pending');
                                        let description: string | null = null;
                                        let descriptionColor = '#F39C12';
                                        let actions: React.ReactNode = null;

                                        const isStepActive = data.pipeline_status?.startsWith('Physical Interview') || data.pipeline_status === 'Interview';
                                        const isStepCompleted = data.pipeline_status === 'Hired' ||
                                            (isObject && interview.physical_interview_status === 'accepted') ||
                                            (isObject && interview.physical_interview_status === 'completed');

                                        if (isObject && isStepActive) {
                                            // Build timing text from start/end dates
                                            const hasStart = interview.physical_interview_start;
                                            const hasEnd = interview.physical_interview_end;
                                            const hasTime = hasStart || hasEnd;
                                            const timingText = hasStart && hasEnd
                                                ? `${hasStart} - ${hasEnd}`
                                                : hasStart || t('pending', 'Pending');
                                            statusText = hasTime ? timingText : t('pending', 'Pending');

                                            // First check interview result (transporter's decision)
                                            if (interview.physical_interview_status === 'accepted') {
                                                description = t('physicalInterviewSelected', 'Selected! Transporter has approved your walk-in interview.');
                                                descriptionColor = '#10B981';
                                            } else if (interview.physical_interview_status === 'rejected') {
                                                description = t('physicalInterviewRejected', 'Transporter has moved forward with other candidates.');
                                                descriptionColor = '#EF4444';
                                            } else if (interview.physical_interview_status === 'shortlisted') {
                                                description = t('physicalInterviewShortlisted', 'You are in the pipeline. Transporter may reach out to you soon.');
                                                descriptionColor = colors.royalBlue;
                                            }
                                            // No time scheduled yet — just show waiting message
                                            else if (!hasTime) {
                                                description = t('physicalNotScheduled', 'Physical interview not yet scheduled. Transporter will share timing soon.');
                                                descriptionColor = colors.blackOpacity(0.5);
                                            }
                                            // Time is scheduled — show actions based on driver's response
                                            else if (physicalAction === 'pending') {
                                                actions = (
                                                    <>
                                                        <View style={styles.timingCard}>
                                                            <View style={styles.timingIconWrap}>
                                                                <Ionicons name="location" size={responsiveFontSize(2.2)} color={colors.royalBlue} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={[styles.timingLabel, { fontSize: responsiveFontSize(1.3), color: colors.blackOpacity(0.5) }]}>
                                                                    {t('visitBetween', 'Visit Between')}
                                                                </Text>
                                                                <Text style={[styles.timingValue, { fontSize: responsiveFontSize(1.8), color: colors.black }]}>
                                                                    {timingText}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={[styles.buttonRow, { marginTop: 12 }]}>
                                                            <TouchableOpacity
                                                                style={[styles.smallButton, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}
                                                                onPress={() => handleInterviewAction('schedule_requested', 'physical')}
                                                                disabled={isActionLoading}
                                                            >
                                                                <Text style={[styles.buttonText, { color: '#DC2626' }]}>
                                                                    {isActionLoading ? '...' : t('reschedule', 'Reschedule')}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.smallButton, { backgroundColor: '#10B981' }]}
                                                                onPress={() => handleInterviewAction('accepted', 'physical')}
                                                                disabled={isActionLoading}
                                                            >
                                                                <Text style={[styles.buttonText, { color: '#fff' }]}>
                                                                    {isActionLoading ? '...' : t('confirm', 'Confirm')}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </>
                                                );
                                            } else if (physicalAction === 'schedule_requested') {
                                                description = t('rescheduleApplied', 'Reschedule applied. Waiting for update.');
                                                descriptionColor = colors.blackOpacity(0.5);
                                            } else if (physicalAction === 'accepted') {
                                                description = t('physicalInterviewReady', 'Be ready for the walk-in interview.');
                                                descriptionColor = '#10B981';
                                                if (hasTime) {
                                                    actions = (
                                                        <View style={styles.timingCard}>
                                                            <View style={styles.timingIconWrap}>
                                                                <Ionicons name="location" size={responsiveFontSize(2.2)} color={colors.royalBlue} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={[styles.timingLabel, { fontSize: responsiveFontSize(1.3), color: colors.blackOpacity(0.5) }]}>
                                                                    {t('visitBetween', 'Visit Between')}
                                                                </Text>
                                                                <Text style={[styles.timingValue, { fontSize: responsiveFontSize(1.8), color: colors.black }]}>
                                                                    {timingText}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    );
                                                }
                                            }
                                        }

                                        return renderStep(
                                            t('physicalInterview', 'Physical Interview'),
                                            statusText,
                                            null,
                                            'handshake-outline',
                                            true,
                                            isStepActive,
                                            isStepCompleted,
                                            description,
                                            descriptionColor,
                                            actions
                                        );
                                    })()}
                                </View>

                            </>
                        ) : (
                            <View style={styles.errorContainer}>
                                <Text style={{ color: colors.blackOpacity(0.5) }}>{t('failedToFetchStatus', 'Failed to fetch status')}</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        minHeight: SCREEN_HEIGHT * 0.6,
        maxHeight: SCREEN_HEIGHT * 0.9,
        paddingBottom: 20,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    title: {
        fontWeight: '700',
    },
    subTitle: {
        fontWeight: '500',
    },
    statusBox: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 30,
    },
    statusLabel: {
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#F39C12',
        marginRight: 10,
    },
    statusValue: {
        fontWeight: '700',
    },
    pipelineContainer: {
        paddingLeft: 5,
        marginBottom: 30,
    },
    stepContainer: {
        flexDirection: 'row',
    },
    leftColumn: {
        alignItems: 'center',
        marginRight: 15,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: -2,
    },
    rightColumn: {
        flex: 1,
    },
    stepTitle: {
        fontWeight: '600',
        marginBottom: 4,
    },
    stepStatus: {
        fontWeight: '500',
    },
    stepDescription: {
        lineHeight: 18,
    },
    closeButtonWrapper: {
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
    },
    actionsContainer: {
        marginTop: 12,
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    smallButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    timingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    timingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    timingLabel: {
        fontWeight: '500',
        marginBottom: 2,
    },
    timingValue: {
        fontWeight: '800',
    },
    closeButton: {
        height: 55,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: '700',
    },
    loadingContainer: {
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default GreenlinePipelineModal;
