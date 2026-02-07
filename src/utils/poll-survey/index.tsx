import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
    Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import axiosInstance from '../config/axiosInstance';
import { END_POINTS } from '../config';
import { useColor, useResponsiveScale } from '../../app/hooks';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

interface Option {
    id: string;
    question_id: string;
    option_text: string;
}

interface Question {
    id: string;
    survey_id: string;
    question: string;
    type: string;
    is_required: string;
    created_at: string;
    options: Option[];
}

interface SurveyData {
    survey: {
        id: string;
        title: string;
        description: string | null;
        poll_image: string;
        start_date: string;
        end_date: string;
        status: string;
    };
    roles: string[];
    questions: Question[];
    user_has_responded: boolean;
}

const PollSurveyModal = () => {
    const { user } = useSelector((state: any) => state?.user) || {};
    const [isVisible, setIsVisible] = useState(false);
    const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();

    useEffect(() => {
        if (user?.role) {
            fetchSurvey();
        }
    }, [user?.role]);

    const fetchSurvey = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.GET_ACTIVE_SURVEY(user.role));
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                if (!data.user_has_responded && data.survey?.status === 'active') {
                    setSurveyData(data);
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.log('Error fetching survey:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId: string, optionText: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionText
        }));
    };

    const handleSubmit = async () => {
        if (!surveyData) return;

        // Validation
        const missingRequired = surveyData.questions.some(q =>
            q.is_required === '1' && !selectedAnswers[q.id]
        );

        if (missingRequired) {
            Alert.alert('Required', 'Please answer all required questions.');
            return;
        }

        try {
            setSubmitting(true);
            const answers = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
                question_id: parseInt(questionId),
                answer: answer
            }));

            const payload = {
                survey_id: parseInt(surveyData.survey.id),
                answers
            };

            const response = await axiosInstance.post(END_POINTS.SUBMIT_SURVEY_RESPONSE, payload);

            if (response.data.success) {
                setSubmitted(true);
                // Close modal after a short delay or immediately
                setTimeout(() => {
                    setIsVisible(false);
                }, 2000);
            } else {
                Alert.alert('Error', response.data.message || 'Submission failed');
            }
        } catch (error) {
            console.log('Error submitting survey:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isVisible || !surveyData) return null;

    if (submitted) {
        return (
            <Modal
                transparent
                visible={isVisible}
                animationType="fade"
                statusBarTranslucent
            >
                <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.contentContainer, { padding: responsiveWidth(8) }]}>
                        <View style={styles.successIconContainer}>
                            <MaterialCommunityIcons name="check-circle" size={responsiveFontSize(8)} color="#4CAF50" />
                        </View>
                        <Text style={[styles.successTitle, { fontSize: responsiveFontSize(2.5) }]}>Thank You!</Text>
                        <Text style={[styles.successMessage, { fontSize: responsiveFontSize(1.8) }]}>
                            Your response has been submitted successfully.
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() => { }} // Not closeable
        >
            <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <View style={[styles.contentContainer, { maxHeight: responsiveHeight(80) }]}>
                    {/* Header */}
                    <View
                        style={[styles.header, { backgroundColor: colors.royalBlue }]}
                    >
                        <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(2.2) }]}>
                            Feedback Survey
                        </Text>
                        <Text style={[styles.headerSubtitle, { fontSize: responsiveFontSize(1.6) }]}>
                            We value your opinion
                        </Text>
                    </View>

                    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        {surveyData.survey.poll_image ? (
                            <Image
                                source={{ uri: surveyData.survey.poll_image }}
                                style={[styles.pollImage, { height: responsiveHeight(20) }]}
                                resizeMode="cover"
                            />
                        ) : null}

                        <Text style={[styles.surveyTitle, { fontSize: responsiveFontSize(2.2), color: colors.text }]}>
                            {surveyData.survey.title}
                        </Text>

                        {surveyData.survey.description ? (
                            <Text style={[styles.surveyDescription, { fontSize: responsiveFontSize(1.6), color: '#666666' }]}>
                                {surveyData.survey.description}
                            </Text>
                        ) : null}

                        {surveyData.questions.map((q, index) => (
                            <View key={q.id} style={styles.questionContainer}>
                                <Text style={[styles.questionText, { fontSize: responsiveFontSize(1.9), color: colors.text }]}>
                                    {q.question} {q.is_required === '1' && <Text style={styles.required}>*</Text>}
                                </Text>
                                <View style={styles.optionsContainer}>
                                    {q.options.map((opt) => {
                                        const isSelected = selectedAnswers[q.id] === opt.option_text;
                                        return (
                                            <TouchableOpacity
                                                key={opt.id}
                                                style={[
                                                    styles.optionButton,
                                                    isSelected && styles.optionButtonSelected,
                                                    { borderColor: isSelected ? colors.royalBlue : '#E0E0E0' }
                                                ]}
                                                onPress={() => handleOptionSelect(q.id, opt.option_text)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    { borderColor: isSelected ? colors.royalBlue : '#BDBDBD' }
                                                ]}>
                                                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.royalBlue }]} />}
                                                </View>
                                                <Text style={[
                                                    styles.optionText,
                                                    { fontSize: responsiveFontSize(1.8), color: isSelected ? colors.royalBlue : colors.text }
                                                ]}>
                                                    {opt.option_text}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={[
                                styles.submitButton,
                                { opacity: submitting ? 0.7 : 1 }
                            ]}
                        >
                            <View
                                style={[styles.submitGradient, { backgroundColor: colors.royalBlue }]}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={[styles.submitText, { fontSize: responsiveFontSize(2) }]}>
                                        Submit Response
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View >
        </Modal >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    contentContainer: {
        width: width * 0.9,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    pollImage: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 12,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 10,
    },
    surveyTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    surveyDescription: {
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    questionContainer: {
        marginBottom: 24,
    },
    questionText: {
        fontWeight: '600',
        marginBottom: 12,
    },
    required: {
        color: '#FF4444',
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: '#FAFAFA',
    },
    optionButtonSelected: {
        backgroundColor: '#F0F4FF',
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioDot: {
        height: 10,
        width: 10,
        borderRadius: 5,
    },
    optionText: {
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#234ACC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    successIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    successMessage: {
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default PollSurveyModal;
