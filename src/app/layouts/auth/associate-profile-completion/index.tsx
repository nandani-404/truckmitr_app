import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    StatusBar,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useColor, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { userAction, userEditAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Associate Steps - Similar to Foreman but can be customized
const ASSOCIATE_STEPS = [
    { id: 'personal_details', title: 'personalDetails', subtitle: 'enterPersonalDetails', required: true },
    { id: 'pan_details', title: 'panDetails', subtitle: 'enterPanDetails', required: true },
    { id: 'bank_details', title: 'bankDetails', subtitle: 'enterBankDetails', required: true },
    { id: 'referral_info', title: 'referralInfo', subtitle: 'enterReferralInfo', required: false },
];

export default function ProfileCompletionAssociate() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { userEdit, user } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);
    const [finishing, setFinishing] = useState(false);

    // Pickers
    const [yearPickerOpen, setYearPickerOpen] = useState(false);

    // Fade animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);

    const STEPS = ASSOCIATE_STEPS;
    const progressPercent = ((currentStep + 1) / STEPS.length) * 100;
    const progressWidth = useSharedValue(progressPercent);

    useEffect(() => {
        const newProgress = ((currentStep + 1) / STEPS.length) * 100;
        progressWidth.value = withSpring(newProgress, { damping: 15, stiffness: 90 });
    }, [currentStep]);

    useEffect(() => {
        contentOpacity.value = 0;
        contentTranslateX.value = 20;
        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateX.value = withSpring(0, { damping: 12 });
    }, [currentStep]);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));
    const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

    const handleNext = async () => {
        const step = STEPS[currentStep];

        if (currentStep < STEPS.length - 1) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev + 1), 200);
        } else {
            submitProfile();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev - 1), 200);
        }
    };

    const submitProfile = async () => {
        setFinishing(true);
        try {
            const formData = new FormData();
            formData.append('name', userEdit?.name || user?.name || '');
            formData.append('mobile', userEdit?.mobile || user?.mobile || '');
            formData.append('email', userEdit?.email || user?.email || '');

            if (userEdit?.DOB) formData.append('dob', moment(userEdit.DOB).format('DD-MM-YYYY'));
            if (userEdit?.pan_number) formData.append('pan_number', userEdit?.pan_number);

            // Bank Details
            if (userEdit?.account_number) formData.append('bank_account_number', userEdit.account_number);
            if (userEdit?.ifsc_code) formData.append('ifsc_code', userEdit.ifsc_code);
            if (userEdit?.account_holder_name) formData.append('account_holder_name', userEdit.account_holder_name);

            // Referral Info
            if (userEdit?.referral_target) formData.append('referral_target', userEdit.referral_target);
            if (userEdit?.preferred_area) formData.append('preferred_area', userEdit.preferred_area);

            console.log('Associate Profile Submission:', formData);

            const endpoint = END_POINTS?.EDIT_PROFILE;
            const response = await axiosInstance.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response?.data?.status || response?.data?.success) {
                setFinishing(false);
                showToast(t('profileSubmittedSuccessfully') || "Profile Submitted Successfully");

                // Update redux user data
                dispatch(userAction({ ...user, ...response?.data?.data }));
                dispatch(userAuthenticatedAction(true));
            } else {
                throw new Error(response?.data?.message || 'Failed');
            }

        } catch (error: any) {
            setFinishing(false);
            showToast(error?.message || "Failed to update profile");
        }
    };

    const renderStepContent = () => {
        const step = STEPS[currentStep];
        switch (step.id) {
            case 'personal_details':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('selectDateOfBirth')}</Text>
                        <TouchableOpacity onPress={() => setYearPickerOpen(true)} style={styles.classicBox}>
                            <Text style={{ color: userEdit?.DOB ? '#333' : '#999' }}>
                                {userEdit?.DOB ? moment(userEdit.DOB).format('DD MMM YYYY') : 'Select DOB'}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.royalBlue} />
                        </TouchableOpacity>

                        {/* DOB DatePicker Modal */}
                        <Modal visible={yearPickerOpen} transparent animationType="fade">
                            <View style={styles.yearPickerOverlay}>
                                <View style={[styles.yearPickerContainer, { alignItems: 'center' }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('selectDateOfBirth')}</Text>
                                        <TouchableOpacity onPress={() => setYearPickerOpen(false)}>
                                            <Ionicons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    <DatePicker
                                        date={userEdit?.DOB ? new Date(userEdit.DOB) : new Date(moment().subtract(25, 'years').format())}
                                        onDateChange={(date) => dispatch(userEditAction({ ...userEdit, DOB: date }))}
                                        mode="date"
                                        maximumDate={new Date(moment().subtract(18, 'years').format())}
                                        minimumDate={new Date(moment().subtract(100, 'years').format())}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setYearPickerOpen(false)}
                                        style={{ backgroundColor: '#246BFD', borderRadius: 12, paddingVertical: 14, marginTop: 20, alignItems: 'center', width: '100%' }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('done') || 'Done'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </View>
                );
            case 'pan_details':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('panNumber')}</Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="ABCDE1234F"
                            autoCapitalize="characters"
                            maxLength={10}
                            value={userEdit?.pan_number}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, pan_number: text }))}
                        />
                        <Text style={styles.helperText}>{t('panRequiredForCommission') || "PAN is required for commission payouts"}</Text>
                    </View>
                );
            case 'bank_details':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('bankAccountNumber')}</Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="Account Number"
                            keyboardType="number-pad"
                            value={userEdit?.account_number}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, account_number: text }))}
                        />
                        <Space height={20} />
                        <Text style={styles.classicLabel}>{t('ifscCode')}</Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="IFSC Code"
                            autoCapitalize="characters"
                            value={userEdit?.ifsc_code}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, ifsc_code: text }))}
                        />
                        <Space height={20} />
                        <Text style={styles.classicLabel}>{t('accountHolderName')}</Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="Name on Account"
                            value={userEdit?.account_holder_name}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, account_holder_name: text }))}
                        />
                    </View>
                );
            case 'referral_info':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.classicLabel}>{t('monthlyReferralTarget') || "Monthly Referral Target"}</Text>
                        <View style={styles.experienceGrid}>
                            {['5-10', '10-25', '25-50', '50+'].map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    style={[styles.experienceCard, userEdit?.referral_target === range && styles.experienceCardSelected]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, referral_target: range }))}
                                >
                                    <Text style={[styles.experienceCardText, userEdit?.referral_target === range && styles.experienceCardTextSelected]}>{range}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Space height={20} />
                        <Text style={styles.classicLabel}>{t('preferredArea') || "Preferred Area"}</Text>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="e.g. Delhi NCR, Mumbai"
                            value={userEdit?.preferred_area}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, preferred_area: text }))}
                        />
                    </View>
                );
            default:
                return null;
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F7FE" />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                {currentStep > 0 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                )}
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
                </View>
                <Text style={styles.stepCount}>{currentStep + 1} / {STEPS.length}</Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{t(STEPS[currentStep].title)}</Text>
                <Text style={styles.subtitle}>{t(STEPS[currentStep].subtitle)}</Text>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
                    {renderStepContent()}
                </Animated.View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom || 20 }]}>
                <TouchableOpacity onPress={handleNext} style={styles.nextButton} disabled={finishing}>
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {currentStep === STEPS.length - 1 ? t('submitProfile') : t('next')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FE' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, height: 50 },
    backButton: { marginRight: 15 },
    progressContainer: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#246BFD', borderRadius: 3 },
    stepCount: { marginLeft: 15, fontSize: 14, fontWeight: '600', color: '#666' },
    titleContainer: { paddingHorizontal: 20, marginTop: 15, marginBottom: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
    stepContainer: { paddingHorizontal: 20, paddingTop: 10 },
    contentContainer: { paddingBottom: 20 },
    classicLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    classicInput: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#eee', marginBottom: 5 },
    classicBox: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee', marginBottom: 5 },
    helperText: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 16 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', elevation: 10 },
    nextButton: { backgroundColor: '#246BFD', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#246BFD', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    nextButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
    experienceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
    experienceCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    experienceCardSelected: {
        borderColor: '#246BFD',
        backgroundColor: '#F5F9FF',
    },
    experienceCardText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    experienceCardTextSelected: {
        color: '#246BFD',
        fontWeight: '600',
    },
    yearPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    yearPickerContainer: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '80%', maxHeight: '60%' },
});
