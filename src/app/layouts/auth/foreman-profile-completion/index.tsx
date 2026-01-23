import React, { useState, useEffect, memo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    interpolate,
    Easing,
    ZoomIn,
    cancelAnimation,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import Svg, { Path, G, Circle, LinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { useColor, useShadow, useResponsiveScale } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { userAction, userEditAction, userAuthenticatedAction } from '@truckmitr/src/redux/actions/user.action';
import { useTranslation } from 'react-i18next';
import { Space } from '@truckmitr/src/app/components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import ImagePicker from 'react-native-image-crop-picker';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@truckmitr/src/utils/permissions/imagePermissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;



// Foreman Steps
const FOREMAN_STEPS = [
    { id: 'personal_details', title: 'personalDetails', subtitle: 'enterPersonalDetails', required: true },
    { id: 'license_details', title: 'licenseDetails', subtitle: 'enterLicenseDetails', required: true },
    { id: 'pan_details', title: 'panDetails', subtitle: 'enterPanDetails', required: true },
    // { id: 'work_details', title: 'workDetails', subtitle: 'enterWorkDetails', required: true },
];

export default function ProfileCompletionForeman() {
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
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [licenseExpiryModal, setLicenseExpiryModal] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(moment().subtract(18, 'years').format('YYYY-MM-DD'));
    const [yearPickerOpen, setYearPickerOpen] = useState(false);
    const [yearSelectorOpen, setYearSelectorOpen] = useState(false);

    // Fade animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);

    const STEPS = FOREMAN_STEPS;
    const progressPercent = ((currentStep + 1) / STEPS.length) * 100;
    const progressWidth = useSharedValue(progressPercent);

    useEffect(() => {
        const newProgress = ((currentStep + 1) / STEPS.length) * 100;
        progressWidth.value = withSpring(newProgress, { damping: 15, stiffness: 90 });
    }, [currentStep]);

    // Initialize userEdit with existing user data from Redux
    useEffect(() => {
        if (user) {
            // Map API numeric values to internal values
            const experienceFromApiMap: { [key: string]: string } = {
                '0': 'less_than_1',
                '1': '1-2',
                '2': '1-2',
                '3': '3-5',
                '4': '3-5',
                '5': '3-5',
                '6': '6-10',
                '7': '6-10',
                '8': '6-10',
                '9': '6-10',
                '10': '10+',
            };
            const drivingExp = user?.Driving_Experience;
            let mappedExperience = '';
            if (drivingExp) {
                const expNum = parseInt(drivingExp, 10);
                if (expNum > 10) {
                    mappedExperience = '10+';
                } else {
                    mappedExperience = experienceFromApiMap[drivingExp] || '';
                }
            }

            dispatch(userEditAction({
                ...userEdit,
                DOB: user?.DOB ? (typeof user.DOB === 'string' ? user.DOB : new Date(user.DOB).toISOString()) : null,
                driving_experience: mappedExperience || userEdit?.driving_experience,
                license_number: user?.License_Number || userEdit?.license_number,
                expiry_date: user?.Expiry_date_of_License ? (typeof user.Expiry_date_of_License === 'string' ? user.Expiry_date_of_License : new Date(user.Expiry_date_of_License).toISOString()) : null,
                pan_number: user?.PAN_Number || userEdit?.pan_number,
            }));
        }
    }, [user?.id]);

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
        // Validation logic can be added here
        const step = STEPS[currentStep];

        // Basic check for empty fields (simplified)
        if (step.id === 'personal_details' && (!userEdit?.DOB || !userEdit?.driving_experience)) {
            showToast(t('pleaseEnterAllRequiredDetails'));
            return;
        }

        if (step.id === 'license_details' && (!userEdit?.license_number || !userEdit?.expiry_date)) {
            showToast(t('pleaseEnterAllRequiredDetails'));
            return;
        }

        if (step.id === 'pan_details' && !userEdit?.pan_number) {
            showToast(t('pleaseEnterAllRequiredDetails'));
            return;
        }

        // if (step.id === 'work_details' && (!userEdit?.driver_count || !userEdit?.area_knowledge)) {
        //     showToast(t('pleaseEnterAllRequiredDetails'));
        //     return;
        // }

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

            // Map internal experience values to numeric strings for API
            if (userEdit?.driving_experience) {
                const expToApiMap: { [key: string]: string } = {
                    'less_than_1': '0',
                    '1-2': '1',
                    '3-5': '3',
                    '6-10': '6',
                    '10+': '10'
                };
                const numericExp = expToApiMap[userEdit.driving_experience] || userEdit.driving_experience;
                formData.append('driving_experience', numericExp);
            }

            if (userEdit?.license_number) formData.append('license_number', userEdit?.license_number);
            if (userEdit?.expiry_date) formData.append('expiry_date_of_license', moment(userEdit.expiry_date).format('DD-MM-YYYY'));
            if (userEdit?.pan_number) formData.append('pan_number', userEdit?.pan_number);

            // Work Details
            // if (userEdit?.driver_count) formData.append('drivers_managed', userEdit.driver_count);
            // if (userEdit?.area_knowledge) formData.append('area_knowledge', userEdit.area_knowledge);

            console.log('Foreman Profile Submission:', formData);

            const endpoint = END_POINTS?.UPDATE_PROFILE_FOREMAN;
            const response = await axiosInstance.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response?.data?.status || response?.data?.success) {
                // Fetch complete user profile to ensure Redux has all fields
                try {
                    const profileResponse = await axiosInstance.get(END_POINTS?.GET_PROFILE);
                    if (profileResponse?.data?.status && profileResponse?.data?.data) {
                        dispatch(userAction(profileResponse.data.data));
                        console.log('✅ Complete user profile fetched and dispatched to Redux');
                    } else {
                        // Fallback to partial update if GET_PROFILE fails
                        dispatch(userAction({ ...user, ...response?.data?.data }));
                    }
                } catch (profileError) {
                    console.warn('Failed to fetch complete profile, using partial update:', profileError);
                    dispatch(userAction({ ...user, ...response?.data?.data }));
                }

                dispatch(userAuthenticatedAction(true));
                setFinishing(false);
                showToast(t('profileSubmittedSuccessfully'));
            } else {
                throw new Error(response?.data?.message || 'Failed');
            }

        } catch (error: any) {
            setFinishing(false);
            showToast(error?.message || t('failedToUpdateProfile'));
        }
    };

    const renderStepContent = () => {
        const step = STEPS[currentStep];
        switch (step.id) {
            case 'personal_details':
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('selectDateOfBirth')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <TouchableOpacity onPress={() => setYearPickerOpen(true)} style={styles.classicBox}>
                            <Text style={{ color: userEdit?.DOB ? '#333' : '#999' }}>{userEdit?.DOB ? moment(userEdit.DOB).format('DD MMM YYYY') : t('selectDateOfBirth')}</Text>
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
                                        theme="light"
                                        date={userEdit?.DOB ? new Date(userEdit.DOB) : new Date(moment().subtract(25, 'years').format())}
                                        onDateChange={(date) => dispatch(userEditAction({ ...userEdit, DOB: date.toISOString() }))}
                                        mode="date"
                                        maximumDate={new Date(moment().subtract(18, 'years').format())}
                                        minimumDate={new Date(moment().subtract(100, 'years').format())}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setYearPickerOpen(false)}
                                        style={{ backgroundColor: '#246BFD', borderRadius: 12, paddingVertical: 14, marginTop: 20, alignItems: 'center', width: '100%' }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                        <Space height={20} />
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('yearsOfExperience')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <View style={styles.experienceGrid}>
                            {[
                                { value: 'less_than_1', label: '< 1 Year' },
                                { value: '1-2', label: '1-2 Years' },
                                { value: '3-5', label: '3-5 Years' },
                                { value: '6-10', label: '6-10 Years' },
                                { value: '10+', label: '10+ Years' }
                            ].map((exp) => {
                                const isSelected = userEdit?.driving_experience === exp.value;
                                return (
                                    <TouchableOpacity
                                        key={exp.value}
                                        style={[styles.experienceCard, isSelected && styles.experienceCardSelected]}
                                        onPress={() => dispatch(userEditAction({ ...userEdit, driving_experience: exp.value }))}
                                    >
                                        <Text style={[styles.experienceCardText, isSelected && styles.experienceCardTextSelected]}>
                                            {exp.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );
            case 'license_details':
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('drivingLicenseNumber')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <TextInput
                            maxLength={16}
                            style={styles.classicInput}
                            placeholder="MH01 20230000000"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                            value={userEdit?.license_number}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, license_number: text }))}
                        />
                        <Space height={20} />
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('expiryDate')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <TouchableOpacity style={[styles.classicInput, { justifyContent: 'center' }]} onPress={() => setLicenseExpiryModal(true)}>
                            <Text style={{ color: userEdit?.expiry_date ? '#333' : '#999', fontSize: 16 }}>{userEdit?.expiry_date ? moment(userEdit.expiry_date).format('DD-MM-YYYY') : 'DD-MM-YYYY'}</Text>
                        </TouchableOpacity>
                        <Modal visible={licenseExpiryModal} transparent animationType="fade">
                            <View style={styles.yearPickerOverlay}>
                                <View style={[styles.yearPickerContainer, { alignItems: 'center' }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('selectExpiryDate')}</Text>
                                        <TouchableOpacity onPress={() => setLicenseExpiryModal(false)}>
                                            <Ionicons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    <DatePicker
                                        mode="date"
                                        theme="light"
                                        date={userEdit?.expiry_date ? new Date(userEdit.expiry_date) : new Date()}
                                        onDateChange={(d) => dispatch(userEditAction({ ...userEdit, expiry_date: d.toISOString() }))}
                                        minimumDate={new Date()}
                                        maximumDate={new Date(moment().add(20, 'years').format())}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setLicenseExpiryModal(false)}
                                        style={{ backgroundColor: '#246BFD', borderRadius: 12, paddingVertical: 14, marginTop: 20, alignItems: 'center', width: '100%' }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </View>
                );
            case 'pan_details':
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('panNumber')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <TextInput
                            style={styles.classicInput}
                            placeholder="ABCDE1234F"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                            maxLength={10}
                            value={userEdit?.pan_number}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, pan_number: text }))}
                        />
                        <Text style={styles.helperText}>{t('panRequiredForCommission')}</Text>
                    </View>
                );

            case 'work_details':
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('numberOfDriversManaged')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <View style={styles.experienceGrid}>
                            {['1-10', '11-25', '26-50', '50+'].map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    style={[styles.experienceCard, userEdit?.driver_count === range && styles.experienceCardSelected]}
                                    onPress={() => dispatch(userEditAction({ ...userEdit, driver_count: range }))}
                                >
                                    <Text style={[styles.experienceCardText, userEdit?.driver_count === range && styles.experienceCardTextSelected]}>{range}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Space height={20} />
                        <View style={styles.labelContainer}>
                            <Text style={styles.classicLabel}>{t('areaRouteKnowledge')}</Text>
                            <Text style={styles.asterisk}>*</Text>
                        </View>
                        <TextInput
                            style={styles.classicInput}
                            placeholder={t('exampleAreaKnowledge')}
                            placeholderTextColor="#999"
                            value={userEdit?.area_knowledge}
                            onChangeText={(text) => dispatch(userEditAction({ ...userEdit, area_knowledge: text }))}
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
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'left', flexShrink: 1 },
    subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
    animationContainer: { height: 120, width: '100%', overflow: 'hidden', marginBottom: 10, backgroundColor: '#E3F2FD' },
    backgroundStrip: { position: 'absolute', top: 0, left: 0, width: '300%', height: '100%' },
    truckWrapper: { position: 'absolute', bottom: 22, left: 20, width: 100, height: 60, zIndex: 10 },
    wheelContainer: { position: 'absolute', bottom: -5 },
    rearWheel: { left: 15 },
    frontWheel: { left: 75 },
    roadSurface: { position: 'absolute', bottom: 0, width: '100%', height: 26, backgroundColor: '#444' },
    roadMarkings: { position: 'absolute', top: '50%', width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderStyle: 'dashed', borderWidth: 1, borderColor: 'white' },
    stepContainer: { paddingHorizontal: 20, paddingTop: 10 },
    contentContainer: { paddingBottom: 20 },
    classicLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
    classicInput: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#eee', marginBottom: 5 },
    classicBox: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee', marginBottom: 5 },
    helperText: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 16 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', elevation: 10 },
    nextButton: { backgroundColor: '#246BFD', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#246BFD', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    nextButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    experienceTile: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 8, marginRight: 8 },
    experienceTileSelected: { backgroundColor: '#EDF5FF', borderColor: '#246BFD' },
    experienceTileText: { fontSize: 14, color: '#666' },
    experienceTileTextSelected: { color: '#246BFD', fontWeight: '600' },
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
    asterisk: { color: 'red', marginLeft: 2 },
    labelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
