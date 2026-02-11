import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
    StatusBar,
    Switch,
    FlatList
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeIn,
    Layout
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import { Dropdown } from 'react-native-element-dropdown';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';

const { width } = Dimensions.get('window');

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const SHIPPER_STEPS = [
    { id: 'verification', title: 'KYC & Business Verification', subtitle: 'Mandatory PAN + Optional GST' },
    { id: 'business_details', title: 'Business Details', subtitle: 'Business scale and activity' },
];

const STATES = [
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'West Bengal', value: 'West Bengal' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    // Add more as needed
];

const YEARS_IN_BUSINESS = [
    { label: '0–1 Years', value: '0-1' },
    { label: '1–3 Years', value: '1-3' },
    { label: '3–5 Years', value: '3-5' },
    { label: '5+ Years', value: '5+' },
];

const LOAD_VOLUME = [
    { label: '1–5 Loads', value: '1-5' },
    { label: '6–15 Loads', value: '6-15' },
    { label: '16–30 Loads', value: '16-30' },
    { label: '30+ Loads', value: '30+' },
];

const COMPANY_TYPES = [
    { label: 'Proprietorship', value: 'Proprietorship' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'Private Limited', value: 'Private Limited' },
    { label: 'LLP', value: 'LLP' },
    { label: 'Public Limited', value: 'Public Limited' },
    { label: 'Other', value: 'Other' },
];

const MandatoryLabel = ({ text }: { text: string }) => (
    <Text style={styles.classicLabel}>
        {text} <Text style={{ color: 'red' }}>*</Text>
    </Text>
);

const PillOptions = ({ options, value, onSelect }: { options: any[], value: string, onSelect: (val: string) => void }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 10 }}>
        {options.map((option) => (
            <TouchableOpacity
                key={option.value}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.7}
                style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 30,
                    backgroundColor: value === option.value ? '#246BFD' : 'white',
                    borderWidth: 1.5,
                    borderColor: value === option.value ? '#246BFD' : '#E0E0E0',
                    elevation: 2, // Slight shadow for depth
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    minWidth: 100, // Ensure minimum width
                    alignItems: 'center',
                }}
            >
                <Text style={{
                    color: value === option.value ? 'white' : '#333',
                    fontSize: 16,
                    fontWeight: '600',
                }}>
                    {option.label}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

export default function ProfileCompletionShipper() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const colors = useColor();
    const { responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const { user, userEdit } = useSelector((state: any) => state?.user);

    const [currentStep, setCurrentStep] = useState(0);
    const [finishing, setFinishing] = useState(false);

    // Photo Modal
    const [photoModal, setPhotoModal] = useState<{ visible: boolean, field: string | null }>({ visible: false, field: null });

    // Local UI State
    const [showSecondaryContact, setShowSecondaryContact] = useState(false);
    const [showPOC, setShowPOC] = useState(false);
    const [gstApplicable, setGstApplicable] = useState(false);
    const [dobOpen, setDobOpen] = useState(false);

    // State Picker State
    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearchQuery, setStateSearchQuery] = useState('');

    // Filtered locations based on search query
    const filteredLocations = useMemo(() => {
        if (!stateSearchQuery.trim()) return STATES;
        return STATES.filter(item =>
            item.label.toLowerCase().includes(stateSearchQuery.toLowerCase())
        );
    }, [stateSearchQuery]);

    // Animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);
    const progressWidth = useSharedValue(0);

    const STEPS = SHIPPER_STEPS;

    useEffect(() => {
        if (currentStep >= STEPS.length) {
            setCurrentStep(0);
        }
    }, [STEPS.length]);

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

    // Prefill Data from Registration
    useEffect(() => {
        if (user) {
            const updates: any = {};
            if (user.mobile) updates.mobile = user.mobile;
            if (user.email && !userEdit?.email) updates.email = user.email;

            if (Object.keys(updates).length > 0) {
                updateUser(updates);
            }
        }
    }, [user]);

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));

    // Helper to update Redux safely
    const updateUser = (key: string | object, value?: any) => {
        const currentData = userEdit || {};
        if (typeof key === 'string') {
            dispatch(userEditAction({ ...currentData, [key]: value }));
        } else {
            dispatch(userEditAction({ ...currentData, ...key }));
        }
    };

    const handlePickImage = async (source: 'camera' | 'gallery') => {
        if (!photoModal.field) return;

        try {
            const options: any = {
                compressImageQuality: 0.8,
                mediaType: 'photo',
                cropping: false,
            };

            const image: any = source === 'camera'
                ? await ImagePicker.openCamera(options)
                : await ImagePicker.openPicker(options);

            if (image.path) {
                updateUser(photoModal.field, image.path);
                setPhotoModal({ visible: false, field: null });
            }
        } catch (error: any) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                showToast(error.message || 'Error picking image');
            }
            // Do not close immediately on error in case they want to try again? 
            // Actually usually we close modal on error or success to reset state.
            setPhotoModal({ visible: false, field: null });
        }
    };

    const handleNext = () => {
        const step = STEPS[currentStep];

        // Debugging
        console.log('Current Step:', step.id);
        console.log('UserEdit Data:', JSON.stringify(userEdit));


        if (step.id === 'business_details') {
            if (!userEdit?.yearsInBusiness || !userEdit?.monthlyLoadVolume) {
                showToast('Please select business details');
                return;
            }
        }
        if (step.id === 'verification') {
            if (!userEdit?.companyRegType) {
                showToast('Please select Company Registration Type');
                return;
            }
            if (!userEdit?.panNumber) {
                showToast('Please complete mandatory PAN details');
                return;
            }

            if (gstApplicable && (!userEdit?.gstNumber)) {
                showToast('Please complete GST details');
                return;
            }
        }



        if (currentStep < STEPS.length - 1) {
            contentOpacity.value = withTiming(0, { duration: 200 });
            setTimeout(() => setCurrentStep(prev => prev + 1), 200);
        } else {
            submitProfile();
        }
    };

    const submitProfile = () => {
        setFinishing(true);
        // Simulator API Call
        setTimeout(() => {
            setFinishing(false);
            showToast('Profile Submitted for Verification!');
            // navigation.navigate(STACKS.SHIPPER_HOME as any);
        }, 1500);
    };

    // --- Renderers ---

    const renderBasicDetails = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.classicLabel}>Email ID <Text style={styles.optionalText}>(Optional)</Text></Text>
            <TextInput
                style={styles.classicInput}
                placeholder="yourname@company.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={userEdit?.email}
                onChangeText={(text) => updateUser('email', text)}
            />

            <Space height={16} />
            <Space height={16} />
            <MandatoryLabel text="Mobile Number" />
            <View>
                <TextInput
                    style={[
                        styles.classicInput,
                        user?.mobile ? { backgroundColor: '#f0f0f0', color: '#666' } : {}
                    ]}
                    placeholder="9876543210"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={userEdit?.mobile}
                    onChangeText={!user?.mobile ? (text) => updateUser('mobile', text.replace(/[^0-9]/g, '')) : undefined}
                    editable={!user?.mobile}
                />
            </View>

            <Space height={16} />
            <MandatoryLabel text="Pincode" />
            <TextInput
                style={styles.classicInput}
                placeholder="Enter 6 digit Pincode"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                value={userEdit?.pincode}
                onChangeText={(text) => {
                    const pincode = text.replace(/[^0-9]/g, '');
                    const updates: any = { pincode };

                    // Mock Auto-fetch Logic
                    if (pincode.length === 6) {
                        let city = 'Mumbai';
                        let state = 'Maharashtra';

                        if (pincode.startsWith('11')) { city = 'New Delhi'; state = 'Delhi'; }
                        else if (pincode.startsWith('56')) { city = 'Bengaluru'; state = 'Karnataka'; }
                        else if (pincode.startsWith('60')) { city = 'Chennai'; state = 'Tamil Nadu'; }
                        else if (pincode.startsWith('70')) { city = 'Kolkata'; state = 'West Bengal'; }

                        updates.city = city;
                        updates.state = state;
                        showToast(`Location fetched: ${city}, ${state}`);
                    }
                    updateUser(updates);
                }}
            />

            <Space height={16} />
            <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                    <MandatoryLabel text="City" />
                    <TextInput
                        style={styles.classicInput}
                        placeholder="Enter City"
                        placeholderTextColor="#999"
                        value={userEdit?.city}
                        onChangeText={(text) => updateUser('city', text)}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <MandatoryLabel text="State" />
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setStateModalVisible(true)}
                        style={{
                            height: 50,
                            paddingHorizontal: 16,
                            borderRadius: 12,
                            borderColor: '#E0E0E0',
                            borderWidth: 1,
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 5,
                            elevation: 1
                        }}>
                        <Text style={{
                            fontSize: 16,
                            color: userEdit?.state ? '#333' : '#999',
                        }}>
                            {userEdit?.state || "Select State"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* POC Section Toggle */}
            <Space height={24} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Switch
                    value={showPOC}
                    onValueChange={setShowPOC}
                    trackColor={{ false: "#767577", true: "#246BFD" }}
                    thumbColor={showPOC ? "#fff" : "#f4f3f4"}
                />
                <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#333' }}>Add Point of Contact (Optional)</Text>
            </View>

            {showPOC && (
                <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <Text style={styles.sectionHeader}>Primary Contact Details</Text>
                    <Space height={12} />

                    <Text style={styles.classicLabel}>Contact Person Name</Text>
                    <TextInput
                        style={styles.classicInput}
                        placeholder="Enter Name"
                        placeholderTextColor="#999"
                        value={userEdit?.primaryContactName}
                        onChangeText={text => updateUser('primaryContactName', text)}
                    />
                    <Space height={12} />
                    <Text style={styles.classicLabel}>Mobile Number</Text>
                    <TextInput
                        style={styles.classicInput}
                        placeholder="Mobile Number"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={userEdit?.primaryMobile}
                        onChangeText={text => updateUser('primaryMobile', text.replace(/[^0-9]/g, ''))}
                    />
                    <Space height={12} />
                    <Text style={styles.classicLabel}>Email ID</Text>
                    <TextInput
                        style={styles.classicInput}
                        placeholder="Email ID"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={userEdit?.primaryEmail}
                        onChangeText={text => updateUser('primaryEmail', text)}
                    />
                </Animated.View>
            )}


        </View>
    );

    const renderBusinessDetails = () => (
        <View style={styles.stepContainer}>
            <MandatoryLabel text="Years in Business" />
            <PillOptions
                options={YEARS_IN_BUSINESS}
                value={userEdit?.yearsInBusiness}
                onSelect={val => updateUser('yearsInBusiness', val)}
            />

            <Space height={24} />
            <MandatoryLabel text="Average Monthly Load Volume" />
            <PillOptions
                options={LOAD_VOLUME}
                value={userEdit?.monthlyLoadVolume}
                onSelect={val => updateUser('monthlyLoadVolume', val)}
            />
        </View>
    );

    const renderVerification = () => (
        <View style={styles.stepContainer}>

            <MandatoryLabel text="Company Registration Type" />
            <PillOptions
                options={COMPANY_TYPES}
                value={userEdit?.companyRegType}
                onSelect={val => updateUser('companyRegType', val)}
            />

            <Space height={24} />
            <Text style={styles.sectionHeader}>PAN Details (Mandatory)</Text>
            <View style={styles.cardContainer}>
                <MandatoryLabel text="PAN Number" />
                <TextInput
                    style={styles.classicInput}
                    placeholder="ABCDE1234F"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    maxLength={10}
                    value={userEdit?.panNumber}
                    onChangeText={text => updateUser('panNumber', text)}
                />
            </View>

            <Space height={24} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionHeader}>{gstApplicable ? 'GST Details' : 'GST Details (Optional)'}</Text>
                <Switch
                    value={gstApplicable}
                    onValueChange={setGstApplicable}
                    trackColor={{ false: "#767577", true: "#246BFD" }}
                    thumbColor={gstApplicable ? "#fff" : "#f4f3f4"}
                />
            </View>

            {gstApplicable && (
                <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <MandatoryLabel text="GST Number" />
                    <TextInput
                        style={styles.classicInput}
                        placeholder="GST Number"
                        placeholderTextColor="#999"
                        autoCapitalize="characters"
                        value={userEdit?.gstNumber}
                        onChangeText={text => updateUser('gstNumber', text)}
                    />
                    <Space height={12} />
                    <Text style={[styles.classicLabel, { color: '#666' }]}>Company Name (Auto-fetched)</Text>
                    <TextInput style={[styles.classicInput, { backgroundColor: '#f5f5f5' }]} editable={false} value={userEdit?.gstNumber ? "TruckMitr Logistics Ltd" : ""} />

                    <Space height={12} />
                    <Text style={[styles.classicLabel, { color: '#666' }]}>Registered Address (Auto-fetched)</Text>
                    <TextInput style={[styles.classicInput, { backgroundColor: '#f5f5f5' }]} editable={false} value={userEdit?.gstNumber ? "123, Tech Park, Mumbai" : ""} />
                </Animated.View>
            )}
        </View>
    );



    const renderProfilePhoto = () => (
        <View style={styles.stepContainer}>
            <View style={{ alignItems: 'center', marginVertical: 40 }}>
                <TouchableOpacity onPress={() => setPhotoModal({ visible: true, field: 'profilePhoto' })}>
                    <View style={{
                        width: 150,
                        height: 150,
                        borderRadius: 75,
                        backgroundColor: '#F0F7FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#246BFD',
                        overflow: 'hidden'
                    }}>
                        {userEdit?.profilePhoto ? (
                            <FastImage source={{ uri: userEdit.profilePhoto }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Ionicons name="camera" size={50} color="#246BFD" />
                        )}
                    </View>
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: '#246BFD',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: 'white'
                    }}>
                        <Ionicons name="pencil" size={20} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '700', color: '#1E293B' }}>Upload Profile Image</Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: '#64748B', textAlign: 'center' }}>Company logo or representative photo</Text>
            </View>
        </View>
    );

    const renderCurrentStep = () => {
        const step = STEPS[currentStep];
        if (!step) return null;
        switch (step.id) {
            case 'verification': return renderVerification();
            case 'business_details': return renderBusinessDetails();
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F7FE" />
            <View style={[styles.header, { paddingTop: safeAreaInsets.top + 10 }]}>
                {currentStep > 0 && (
                    <TouchableOpacity onPress={() => setCurrentStep(prev => prev - 1)} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                )}
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, animatedContentStyle, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
                </View>
                <Text style={styles.stepCount}>{currentStep + 1}/{STEPS.length}</Text>
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>{t(STEPS[currentStep]?.title)}</Text>
                <Text style={styles.subtitle}>{t(STEPS[currentStep]?.subtitle)}</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
                        {renderCurrentStep()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom || 20 }]}>
                {/* Save Draft Button could go here if needed, but requirements focus on Next/Submit */}
                <TouchableOpacity
                    onPress={handleNext}
                    style={styles.nextButton}
                    disabled={finishing}
                    activeOpacity={0.8}
                >
                    {finishing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.nextButtonText}>
                                {currentStep === STEPS.length - 1 ? "Submit Profile" : "Next"}
                            </Text>
                            {currentStep !== STEPS.length - 1 && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <Modal visible={photoModal.visible} transparent animationType="fade" onRequestClose={() => setPhotoModal({ visible: false, field: null })}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPhotoModal({ visible: false, field: null })}
                >
                    <View style={[styles.modalContent, { width: '90%', padding: 20 }]}>
                        <Text style={[styles.modalTitle, { marginBottom: 10 }]}>Choose Photo Source</Text>
                        <View style={{ flexDirection: 'row', gap: 20, width: '100%' }}>
                            <TouchableOpacity style={styles.photoSourceBtn} onPress={() => handlePickImage('camera')}>
                                <View style={[styles.photoSourceIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Ionicons name="camera" size={30} color="#1976D2" />
                                </View>
                                <Text style={styles.photoSourceText}>Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoSourceBtn} onPress={() => handlePickImage('gallery')}>
                                <View style={[styles.photoSourceIcon, { backgroundColor: '#E8F5E9' }]}>
                                    <Ionicons name="images" size={30} color="#2E7D32" />
                                </View>
                                <Text style={styles.photoSourceText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                        <Space height={20} />
                        <TouchableOpacity onPress={() => setPhotoModal({ visible: false, field: null })} style={[styles.modalBtn, { backgroundColor: '#f0f0f0', elevation: 0 }]}>
                            <Text style={[styles.modalBtnText, { color: '#333' }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* State Picker Modal moved to root level */}
            <Modal
                visible={stateModalVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setStateModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'white' }}>
                    <StatusBar barStyle="dark-content" backgroundColor='white' />
                    {/* Modal Header */}
                    <View style={{
                        paddingTop: safeAreaInsets.top > 20 ? safeAreaInsets.top : 20,
                        backgroundColor: 'white',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(0,0,0,0.08)',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 15,
                        }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setStateModalVisible(false);
                                    setStateSearchQuery('');
                                }}
                                style={{
                                    height: 40,
                                    width: 40,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    borderRadius: 12,
                                }}>
                                <Ionicons name="close" size={24} color='#246BFD' />
                            </TouchableOpacity>
                            <Text style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: 18,
                                fontWeight: '700',
                                color: '#333',
                                marginRight: 40,
                            }}>
                                Select State
                            </Text>
                        </View>

                        {/* Search Bar */}
                        <View style={{
                            marginHorizontal: 20,
                            marginBottom: 10,
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 14,
                            height: 48,
                        }}>
                            <Ionicons name="search" size={20} color='rgba(0,0,0,0.4)' />
                            <TextInput
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                    fontSize: 16,
                                    color: '#333',
                                    padding: 0,
                                }}
                                placeholder={'Search state...'}
                                placeholderTextColor='rgba(0,0,0,0.4)'
                                value={stateSearchQuery}
                                onChangeText={setStateSearchQuery}
                                autoCorrect={false}
                            />
                            {stateSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setStateSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color='rgba(0,0,0,0.4)' />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* State List */}
                    <FlatList
                        data={filteredLocations}
                        keyExtractor={(item) => item.value}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingTop: 10,
                            paddingBottom: safeAreaInsets.bottom + 20,
                        }}
                        ListEmptyComponent={() => (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 100,
                            }}>
                                <Ionicons name="location-outline" size={48} color='rgba(0,0,0,0.2)' />
                                <Text style={{
                                    marginTop: 12,
                                    fontSize: 16,
                                    color: 'rgba(0,0,0,0.4)',
                                }}>
                                    No states found
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const isSelected = item.value === userEdit?.state;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        updateUser('state', item.value);
                                        setStateModalVisible(false);
                                        setStateSearchQuery('');
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 15,
                                        paddingHorizontal: 16,
                                        marginBottom: 8,
                                        backgroundColor: isSelected ? '#246BFD10' : 'white',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: isSelected ? '#246BFD' : 'rgba(0,0,0,0.08)',
                                    }}>
                                    <View style={{
                                        width: 24,
                                        height: 24,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 14,
                                    }}>
                                        <MaterialCommunityIcons
                                            name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24}
                                            color={isSelected ? '#246BFD' : 'rgba(0,0,0,0.3)'}
                                        />
                                    </View>
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 16,
                                        fontWeight: isSelected ? '600' : '500',
                                        color: isSelected ? '#246BFD' : '#333',
                                    }}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

// Helper Components
const UploadButton = ({ label, value, onPress, onRemove }: any) => (
    <View style={{ marginBottom: 10 }}>
        {value ? (
            <View style={styles.previewCard}>
                <FastImage source={{ uri: value }} style={styles.docPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
                    <Ionicons name="trash" size={18} color="white" />
                </TouchableOpacity>
                <View style={styles.uploadedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
            </View>
        ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={onPress}>
                <Feather name="upload-cloud" size={24} color="#246BFD" />
                <Text style={styles.uploadBtnText}>{label}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const ReviewSection = ({ title, children }: any) => (
    <View style={styles.reviewSection}>
        <Text style={styles.reviewHeader}>{title}</Text>
        <View style={styles.reviewContent}>{children}</View>
    </View>
);

const ReviewItem = ({ label, value }: any) => (
    <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>{label}:</Text>
        <Text style={styles.reviewValue}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FE' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { marginRight: 15, padding: 5 },
    progressContainer: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#246BFD', borderRadius: 3 },
    stepCount: { marginLeft: 15, fontSize: 14, fontWeight: '700', color: '#666' },
    titleContainer: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.5 },
    subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
    stepContainer: { paddingHorizontal: 20 },
    contentContainer: { paddingBottom: 20 },
    classicLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    optionalText: { fontSize: 12, fontWeight: '400', color: '#999' },
    classicInput: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 5, elevation: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', elevation: 20 },
    nextButton: { backgroundColor: '#246BFD', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#246BFD', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    nextButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
    rowGap: { flexDirection: 'row', gap: 12 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4EDDA', padding: 12, borderRadius: 8, borderColor: '#C3E6CB', borderWidth: 1 },
    infoBannerText: { marginLeft: 10, color: '#155724', fontSize: 13, flex: 1 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
    cardContainer: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
    dropdown: { height: 50, borderColor: '#E0E0E0', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, backgroundColor: 'white', elevation: 1 },
    placeholderStyle: { fontSize: 16, color: '#999' },
    selectedTextStyle: { fontSize: 16, color: '#333' },
    inputSearchStyle: { height: 40, fontSize: 16 },
    iconStyle: { width: 20, height: 20 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 1, borderColor: '#246BFD', borderStyle: 'dashed', borderRadius: 12, backgroundColor: '#EFF6FF' },
    uploadBtnText: { marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#246BFD' },
    previewCard: { height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    docPreview: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
    uploadedBadge: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
    uploadedText: { marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#059669' },
    reviewSection: { marginBottom: 20, backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0' },
    reviewHeader: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    reviewLabel: { fontSize: 14, color: '#666' },
    reviewValue: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'right', flex: 1, marginLeft: 20 },
    photoSourceBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
    photoSourceText: { fontSize: 16, fontWeight: '600', color: '#333' },
    photoSourceIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25, width: '85%', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 20 },
    modalBtn: { marginTop: 25, backgroundColor: '#246BFD', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
    modalBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    previewContainer: { marginTop: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    reviewContent: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
});
