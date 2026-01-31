
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Modal,
    FlatList,
    PermissionsAndroid,
    Platform,
    Alert,
    Animated,
    Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Contacts from 'react-native-contacts';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams, STACKS } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale, useShadow, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useTranslation } from 'react-i18next';
import { showToast } from '@truckmitr/src/app/hooks/toast';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop } from '@truckmitr/src/app/functions';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

// Colors
const COLORS = {
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    background: '#F8FAFC',
    white: '#FFFFFF',
    textDark: '#0F172A',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    success: '#10B981', // Emerald 500
    successBg: '#F0FDF4',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    error: '#EF4444',
    cardBg: '#F1F5F9',
    contactCardBg: '#EFF6FF',
    contactCardBorder: '#BFDBFE',
};

// State ID Map
const STATE_ID_MAP: Record<string, string> = {
    '1': 'Andaman and Nicobar Islands',
    '2': 'Andhra Pradesh',
    '3': 'Arunachal Pradesh',
    '4': 'Assam',
    '5': 'Bihar',
    '6': 'Chandigarh',
    '7': 'Chhattisgarh',
    '8': 'Dadra and Nagar Haveli',
    '9': 'Delhi',
    '10': 'Goa',
    '11': 'Gujarat',
    '12': 'Haryana',
    '13': 'Himachal Pradesh',
    '14': 'Jammu and Kashmir',
    '15': 'Jharkhand',
    '16': 'Karnataka',
    '17': 'Kerala',
    '18': 'Ladakh',
    '19': 'Lakshadweep',
    '20': 'Madhya Pradesh',
    '21': 'Maharashtra',
    '22': 'Manipur',
    '23': 'Meghalaya',
    '24': 'Mizoram',
    '25': 'Nagaland',
    '26': 'Odisha',
    '27': 'Others',
    '28': 'Puducherry',
    '29': 'Punjab',
    '30': 'Rajasthan',
    '31': 'Sikkim',
    '32': 'Tamil Nadu',
    '33': 'Telangana',
    '34': 'Tripura',
    '35': 'Uttar Pradesh',
    '36': 'Uttarakhand',
    '37': 'West Bengal',
    '38': 'Daman and Diu'
};

export default function DriverAssociationAddDriver() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const reduxState = useSelector((state: any) => state);
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    useStatusBarStyle('dark-content');

    // Form state
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [state, setState] = useState<string | undefined>(undefined);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);

    // Contact import state
    const [isImportedFromContacts, setIsImportedFromContacts] = useState(false);
    const [showPermissionSheet, setShowPermissionSheet] = useState(false);
    const [showMultipleNumbersSheet, setShowMultipleNumbersSheet] = useState(false);
    const [contactPhoneNumbers, setContactPhoneNumbers] = useState<string[]>([]);
    const [pendingContactName, setPendingContactName] = useState('');
    const [pendingContactEmail, setPendingContactEmail] = useState('');

    // Contact List Modal - Multi-select for bulk import
    const [showContactListModal, setShowContactListModal] = useState(false);
    const [allContacts, setAllContacts] = useState<any[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
    const [contactSearchText, setContactSearchText] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);

    // Bulk Import - Review Screen
    const [showReviewScreen, setShowReviewScreen] = useState(false);
    const [bulkDrivers, setBulkDrivers] = useState<Array<{
        id: string;
        name: string;
        phone: string;
        email: string;
        state: string;
        stateName: string;
        isValid: boolean;
    }>>([]);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // Success Screen
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [successDrivers, setSuccessDrivers] = useState<Array<{ name: string; phone: string }>>([]);
    const [successCount, setSuccessCount] = useState(0);
    const [failCount, setFailCount] = useState(0);

    // Success Screen Animations
    const successIconScale = useRef(new Animated.Value(0)).current;
    const successIconRotate = useRef(new Animated.Value(0)).current;
    const successTitleOpacity = useRef(new Animated.Value(0)).current;
    const successTitleTranslate = useRef(new Animated.Value(20)).current;
    const successListOpacity = useRef(new Animated.Value(0)).current;
    const successListTranslate = useRef(new Animated.Value(30)).current;
    const successButtonsOpacity = useRef(new Animated.Value(0)).current;
    const successButtonsTranslate = useRef(new Animated.Value(40)).current;

    // Edit Driver Bottom Sheet
    const [showEditDriverSheet, setShowEditDriverSheet] = useState(false);
    const [editingDriverIndex, setEditingDriverIndex] = useState<number | null>(null);
    const [editDriverName, setEditDriverName] = useState('');
    const [editDriverPhone, setEditDriverPhone] = useState('');
    const [editDriverEmail, setEditDriverEmail] = useState('');
    const [editDriverState, setEditDriverState] = useState('');
    const [editDriverStateName, setEditDriverStateName] = useState('');

    // State Selection Modal
    const [isStateModalVisible, setIsStateModalVisible] = useState(false);
    const [stateSearchText, setStateSearchText] = useState('');
    const [selectedStateName, setSelectedStateName] = useState('');
    const [isEditingDriverState, setIsEditingDriverState] = useState(false);

    // Form errors
    const [errors, setErrors] = useState<{
        fullName?: string;
        mobileNumber?: string;
        email?: string;
        state?: string;
    }>({});

    // OTP Verification State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [pendingDriverData, setPendingDriverData] = useState<{
        name: string;
        mobile: string;
        email: string;
        states: string;
        stateName: string;
    } | null>(null);

    useEffect(() => {
        fetchLocations();
    }, []);

    // Trigger success screen animations
    useEffect(() => {
        if (showSuccessScreen) {
            // Reset all animations
            successIconScale.setValue(0);
            successIconRotate.setValue(0);
            successTitleOpacity.setValue(0);
            successTitleTranslate.setValue(20);
            successListOpacity.setValue(0);
            successListTranslate.setValue(30);
            successButtonsOpacity.setValue(0);
            successButtonsTranslate.setValue(40);

            // Staggered animations
            Animated.sequence([
                // Icon pop in with bounce
                Animated.parallel([
                    Animated.spring(successIconScale, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(successIconRotate, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.out(Easing.back(1.5)),
                        useNativeDriver: true,
                    }),
                ]),
                // Title fade in with slide
                Animated.parallel([
                    Animated.timing(successTitleOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(successTitleTranslate, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]),
                // List fade in with slide
                Animated.parallel([
                    Animated.timing(successListOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(successListTranslate, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]),
                // Buttons fade in with slide
                Animated.parallel([
                    Animated.timing(successButtonsOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(successButtonsTranslate, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        }
    }, [showSuccessScreen]);

    const fetchLocations = async () => {
        try {
            const response = await axiosInstance.get(END_POINTS.GETSTATES);
            if (response?.data?.status) {
                setLocations(response?.data?.data);
            }
        } catch (error) {
            console.log('Error fetching locations:', error);
        }
    };

    // Contact Permission & Import Logic
    const requestContactPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                    {
                        title: t('contactPermissionTitle', 'Allow access to contacts?'),
                        message: t('contactPermissionMessage', 'We only use this to add driver details faster.'),
                        buttonPositive: t('allow', 'Allow'),
                        buttonNegative: t('notNow', 'Not now'),
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.log('Permission error:', err);
                return false;
            }
        }
        return true; // iOS handles permissions differently
    };

    const handleSelectFromContacts = async () => {
        const hasPermission = await requestContactPermission();
        if (!hasPermission) {
            setShowPermissionSheet(true);
            return;
        }
        openContactPicker();
    };

    const openContactPicker = () => {
        setLoadingContacts(true);
        setShowContactListModal(true);
        setSelectedContactIds([]);
        setContactSearchText('');

        Contacts.getAll()
            .then((contacts) => {
                // First Phase: Filter invalid contacts
                const validContacts = contacts.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);

                // Second Phase: Advanced Deduplication
                const uniqueContactsMap = new Map();

                validContacts.forEach((contact) => {
                    const displayName = `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Unknown';

                    // Normalize phone numbers for this contact
                    const uniquePhonesForContact = new Set(
                        contact.phoneNumbers.map((p: any) => p.number.replace(/[^0-9]/g, '').slice(-10))
                    );

                    if (!uniqueContactsMap.has(displayName)) {
                        uniqueContactsMap.set(displayName, {
                            ...contact,
                            displayName,
                            phoneNumbers: contact.phoneNumbers,
                            uniqueId: contact.recordID || `${displayName}-${Math.random()}`
                        });
                    } else {
                        const existingContact = uniqueContactsMap.get(displayName);
                        const existingPhones = new Set(
                            existingContact.phoneNumbers.map((p: any) => p.number.replace(/[^0-9]/g, '').slice(-10))
                        );

                        let hasNewPhones = false;
                        const mergedPhoneNumbers = [...existingContact.phoneNumbers];

                        contact.phoneNumbers.forEach((p: any) => {
                            const normalized = p.number.replace(/[^0-9]/g, '').slice(-10);
                            if (!existingPhones.has(normalized)) {
                                existingPhones.add(normalized);
                                mergedPhoneNumbers.push(p);
                                hasNewPhones = true;
                            }
                        });

                        if (hasNewPhones) {
                            uniqueContactsMap.set(displayName, {
                                ...existingContact,
                                phoneNumbers: mergedPhoneNumbers
                            });
                        }
                    }
                });

                const contactsWithPhones = Array.from(uniqueContactsMap.values())
                    .sort((a, b) => a.displayName.localeCompare(b.displayName));

                setAllContacts(contactsWithPhones);
                setFilteredContacts(contactsWithPhones);
                setLoadingContacts(false);

                if (contactsWithPhones.length === 0) {
                    showToast(t('noContactsWithPhone', 'No contacts with phone numbers found'));
                }
            })
            .catch((e) => {
                console.log('Error getting contacts:', e);
                setLoadingContacts(false);
                showToast(t('errorAccessingContacts', 'Error accessing contacts'));
            });
    };

    // Filter contacts based on search
    useEffect(() => {
        if (contactSearchText.trim() === '') {
            setFilteredContacts(allContacts);
        } else {
            const searchLower = contactSearchText.toLowerCase();
            const filtered = allContacts.filter(c =>
                c.displayName.toLowerCase().includes(searchLower) ||
                c.phoneNumbers?.some((p: any) => p.number.includes(contactSearchText))
            );
            setFilteredContacts(filtered);
        }
    }, [contactSearchText, allContacts]);

    // Multi-select toggle for contacts
    const handleContactCheckboxSelect = (contact: any) => {
        setSelectedContactIds(prev => {
            if (prev.includes(contact.uniqueId)) {
                return prev.filter(id => id !== contact.uniqueId);
            } else {
                return [...prev, contact.uniqueId];
            }
        });
    };

    // Confirm bulk selection and go to review screen
    const handleConfirmBulkSelection = () => {
        const selectedContacts = allContacts.filter(c => selectedContactIds.includes(c.uniqueId));

        const drivers = selectedContacts.map(contact => {
            const name = `${contact.givenName || ''} ${contact.familyName || ''}`.trim();
            const email = contact.emailAddresses?.[0]?.email || '';
            const phone = contact.phoneNumbers?.[0]?.number?.replace(/[^0-9]/g, '').slice(-10) || '';

            return {
                id: contact.uniqueId,
                name,
                phone,
                email,
                state: '',
                stateName: '',
                isValid: name.length > 0 && phone.length >= 10
            };
        });

        setBulkDrivers(drivers);
        setShowContactListModal(false);
        setShowReviewScreen(true);
    };

    // Edit driver in bulk list
    const openEditDriver = (index: number) => {
        const driver = bulkDrivers[index];
        setEditingDriverIndex(index);
        setEditDriverName(driver.name);
        setEditDriverPhone(driver.phone);
        setEditDriverEmail(driver.email);
        setEditDriverState(driver.state);
        setEditDriverStateName(driver.stateName);
        setShowEditDriverSheet(true);
    };

    // Save edited driver
    const saveEditedDriver = () => {
        if (editingDriverIndex === null) return;

        setBulkDrivers(prev => prev.map((driver, index) => {
            if (index === editingDriverIndex) {
                const isValid = editDriverName.trim().length > 0 &&
                    editDriverPhone.length >= 10 &&
                    editDriverState.length > 0;
                return {
                    ...driver,
                    name: editDriverName,
                    phone: editDriverPhone,
                    email: editDriverEmail,
                    state: editDriverState,
                    stateName: editDriverStateName,
                    isValid
                };
            }
            return driver;
        }));

        setShowEditDriverSheet(false);
        setEditingDriverIndex(null);
    };

    // Remove driver from bulk list
    const removeDriverFromBulk = (index: number) => {
        setBulkDrivers(prev => prev.filter((_, i) => i !== index));
    };

    // Check if all drivers are valid
    const allDriversValid = bulkDrivers.length > 0 && bulkDrivers.every(d => d.isValid);
    const validDriverCount = bulkDrivers.filter(d => d.isValid).length;

    // Submit all drivers
    const handleBulkSubmit = async () => {
        if (!allDriversValid) return;

        setBulkSubmitting(true);
        let localSuccessCount = 0;
        let localFailCount = 0;
        const addedDrivers: Array<{ name: string; phone: string }> = [];

        for (const driver of bulkDrivers) {
            try {
                const formData = new FormData();
                formData.append('name', driver.name);
                formData.append('mobile', driver.phone);
                formData.append('email', driver.email);

                // Use map to find state code for bulk upload
                let stateCode = driver.state;
                const foundCode = Object.keys(STATE_ID_MAP).find(key => STATE_ID_MAP[key] === driver.stateName);
                if (foundCode) stateCode = foundCode;

                formData.append('states', stateCode);
                formData.append('role', 'driver');

                await axiosInstance.post(END_POINTS.TRANSPORTER_DRIVER_CREATE, formData);
                localSuccessCount++;
                addedDrivers.push({ name: driver.name, phone: driver.phone });
            } catch (error) {
                localFailCount++;
            }
        }

        setBulkSubmitting(false);

        // Show success screen
        setSuccessCount(localSuccessCount);
        setFailCount(localFailCount);
        setSuccessDrivers(addedDrivers);
        setShowReviewScreen(false);
        setShowSuccessScreen(true);
        setBulkDrivers([]);
    };

    // Navigate to My Drivers after success
    const handleViewDrivers = () => {
        setShowSuccessScreen(false);
        // Navigate to Driver Association My Drivers
        // navigation.navigate(STACKS.DRIVER_ASSOCIATION_MY_DRIVERS as any);
    };

    const handleAddMoreDrivers = () => {
        setShowSuccessScreen(false);
        setFullName('');
        setMobileNumber('');
        setEmail('');
        setState(undefined);
        setSelectedStateName('');
        setErrors({});
    };

    const handleContactSelected = (contact: any) => {
        const name = `${contact.givenName || ''} ${contact.familyName || ''}`.trim();
        const emailAddress = contact.emailAddresses && contact.emailAddresses.length > 0
            ? contact.emailAddresses[0].email
            : '';

        // Extract and clean phone numbers
        const phoneNumbers = contact.phoneNumbers
            ? contact.phoneNumbers.map((p: any) => p.number.replace(/[^0-9]/g, '').slice(-10))
            : [];

        // Filter for valid 10-digit numbers and get unique ones
        const validNumbers = [...new Set(phoneNumbers.filter((n: string) => n.length === 10))];

        if (validNumbers.length > 0) {
            // "Pick only one unique no" - Automatically select the first valid number
            applyContactData(name, validNumbers[0] as string, emailAddress);
            setShowContactListModal(false);
        } else {
            showToast(t('noPhoneNumber', 'Contact has no phone number'));
        }
    };

    const applyContactData = (name: string, phone: string, emailAddr: string) => {
        setFullName(name);
        setMobileNumber(phone);
        // if (emailAddr) setEmail(emailAddr); // Replicating FAD behavior: user requested Name and Mobile priority, FAD comments out email apply
        setIsImportedFromContacts(true);
        setIsOtpVerified(phone.length > 0);
        setErrors({});
        showToast(t('contactImported', '✔ Contact imported successfully'));
    };

    const handlePhoneNumberSelected = (phone: string) => {
        applyContactData(pendingContactName, phone, pendingContactEmail);
        setShowMultipleNumbersSheet(false);
        setPendingContactName('');
        setPendingContactEmail('');
        setContactPhoneNumbers([]);
    };

    const validate = (): boolean => {
        let valid = true;
        const newErrors: { [key: string]: string } = {};

        if (!fullName.trim()) {
            newErrors.fullName = t('nameRequired', 'Name is required');
            valid = false;
        }
        if (!mobileNumber.trim()) {
            newErrors.mobileNumber = t('mobileNumberRequired', 'Mobile number is required');
            valid = false;
        } else if (mobileNumber.length < 10) {
            newErrors.mobileNumber = t('mobileNumber_10_digits', 'Mobile must be 10 digits');
            valid = false;
        }
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = t('invalidEmailFormat', 'Invalid email format');
                valid = false;
            }
        }
        if (!state) {
            newErrors.state = t('stateRequired', 'State is required');
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const isFormValid = () => {
        return fullName.trim() && mobileNumber.trim() && mobileNumber.length >= 10 && state;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', fullName);
            formData.append('mobile', mobileNumber);
            if (email) formData.append('email', email);

            // Resolve State Code
            let finalStateCode = state;
            if (selectedStateName) {
                const foundCode = Object.keys(STATE_ID_MAP).find(key => STATE_ID_MAP[key] === selectedStateName);
                if (foundCode) {
                    finalStateCode = foundCode;
                }
            }
            formData.append('states', finalStateCode);
            formData.append('role', 'association');

            const response = await axiosInstance.post(END_POINTS.ASSOCIATION_ADD_DRIVER, formData);

            if (response?.data?.status || response?.data?.success) {
                // Check if OTP was sent
                const message = response?.data?.message?.toLowerCase() || '';
                if (message.includes('otp')) {
                    setPendingDriverData({
                        name: fullName,
                        mobile: mobileNumber,
                        email: email,
                        states: state || '',
                        stateName: selectedStateName,
                    });
                    setShowOtpModal(true);
                    showToast(response?.data?.message || t('otpSent', 'OTP Sent'));
                } else {
                    const successMessage = response?.data?.message || t('driverAddedSuccessfully', 'Driver added successfully');
                    showToast(`${successMessage}`);

                    // Reset form
                    setFullName('');
                    setMobileNumber('');
                    setEmail('');
                    setState(undefined);
                    setSelectedStateName('');
                    setIsImportedFromContacts(false);
                    setIsOtpVerified(false);
                    setErrors({});
                }
            } else {
                const errorMessage = response?.data?.message || t('failedToAddDriver', 'Failed to add driver');
                showToast(`${errorMessage}`);
            }
        } catch (error: any) {
            console.log('Error adding driver:', error);
            const errorMessage = error?.response?.data?.message || error?.message || t('oopsSomethingWentWrong', 'Something went wrong');
            showToast(`${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // OTP Verification Handler
    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setOtpError(t('pleaseEnterValidOtp', 'Please enter a valid OTP'));
            return;
        }

        if (!pendingDriverData) {
            setOtpError(t('oopsSomethingWentWrong', 'Something went wrong'));
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const formData = new FormData();
            formData.append('mobile', pendingDriverData.mobile);
            formData.append('otp', otp);

            const response = await axiosInstance.post(END_POINTS.OTP_VERIFY, formData);

            if (response?.data?.status || response?.data?.success) {
                const successMessage = response?.data?.message || t('driverAddedSuccessfully', 'Driver added successfully');
                showToast(`${successMessage}`);

                // Reset everything
                setShowOtpModal(false);
                setOtp('');
                setOtpError('');
                setPendingDriverData(null);
                setFullName('');
                setMobileNumber('');
                setEmail('');
                setState(undefined);
                setSelectedStateName('');
                setIsImportedFromContacts(false);
                setIsOtpVerified(false);
                setErrors({});
            } else {
                const errorMessage = response?.data?.message || t('invalidOtp', 'Invalid OTP');
                setOtpError(errorMessage);
            }
        } catch (error: any) {
            console.log('Error verifying OTP:', error);
            const errorMessage = error?.response?.data?.message || error?.message || t('otpVerificationFailed', 'OTP verification failed');
            setOtpError(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleCloseOtpModal = () => {
        setShowOtpModal(false);
        setOtp('');
        setOtpError('');
    };

    const goBack = () => {
        navigation.goBack();
    };

    // India Flag Component
    const IndiaFlag = () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginRight: 4 }}>🇮🇳</Text>
            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600' }}>+91</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} hitSlop={hitSlop(10)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('addDriver', 'Add Driver')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={responsiveHeight(15)}
            >
                {/* Step Header - BASIC DETAILS */}
                {/* <LinearGradient
                    colors={['#FEF3C7', '#FDE68A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.stepHeader}
                >
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepTitle}>{t('basicDetails', 'BASIC DETAILS')}</Text>
                </LinearGradient> */}

                {/* Contact Import Card - Primary CTA */}
                <TouchableOpacity
                    onPress={handleSelectFromContacts}
                    style={styles.contactImportCard}
                    activeOpacity={0.8}
                >
                    <View style={styles.contactImportLeft}>
                        <View style={styles.contactIconContainer}>
                            <MaterialCommunityIcons name="card-account-phone" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.contactImportTextContainer}>
                            <Text style={styles.contactImportTitle}>
                                {t('addDriversFromContacts', 'Add Drivers from Contacts')}
                            </Text>
                            <Text style={styles.contactImportSubtitle}>
                                {t('bulkImportSubtitle', 'Quickly add multiple drivers from phone contacts')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.selectContactButton}>
                        <MaterialCommunityIcons name="contacts" size={16} color={COLORS.primary} />
                        <Text style={styles.selectContactButtonText}>
                            {t('selectContacts', 'Select Contacts')}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    {/* Full Name Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="person-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('fullName', 'Full Name')}<Text style={styles.required}>*</Text></Text>
                        </View>
                        <View style={[styles.inputWrapper, errors.fullName && styles.inputWrapperError]}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="person" size={16} color={COLORS.textLight} />
                            </View>
                            <TextInput
                                value={fullName}
                                onChangeText={(text) => {
                                    setFullName(text);
                                    setErrors(prev => ({ ...prev, fullName: undefined }));
                                    if (isImportedFromContacts && text !== fullName) {
                                        setIsImportedFromContacts(false);
                                    }
                                }}
                                placeholder={t('driverFullName', 'Driver full name')}
                                placeholderTextColor={COLORS.textLight}
                                style={styles.textInput}
                            />
                        </View>
                        {isImportedFromContacts && fullName && (
                            <Text style={styles.importedLabel}>{t('importedFromContacts', 'Imported from Contacts')}</Text>
                        )}
                        {errors.fullName && (
                            <Text style={styles.errorText}>{errors.fullName}</Text>
                        )}
                    </View>

                    {/* Mobile Number Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="phone-portrait-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('mobileNo', 'Mobile No.')}<Text style={styles.required}>*</Text></Text>
                        </View>
                        <View style={[styles.inputWrapper, errors.mobileNumber && styles.inputWrapperError]}>
                            <View style={[styles.countryCodeContainer, { borderRightWidth: 1, borderRightColor: COLORS.border }]}>
                                <IndiaFlag />
                            </View>
                            <TextInput
                                value={mobileNumber}
                                onChangeText={(text) => {
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setMobileNumber(numericText);
                                    setErrors(prev => ({ ...prev, mobileNumber: undefined }));
                                    if (numericText.length > 0) {
                                        setIsOtpVerified(true);
                                    } else {
                                        setIsOtpVerified(false);
                                    }
                                    if (isImportedFromContacts && numericText !== mobileNumber) {
                                        setIsImportedFromContacts(false);
                                    }
                                }}
                                placeholder={t('driverMobileNumber', 'Driver mobile number')}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={[styles.textInput, { flex: 1, paddingRight: 12 }]}
                            />
                        </View>
                        {isImportedFromContacts && mobileNumber && (
                            <Text style={styles.importedLabel}>{t('importedFromContacts', 'Imported from Contacts')}</Text>
                        )}
                        {errors.mobileNumber && (
                            <Text style={styles.errorText}>{errors.mobileNumber}</Text>
                        )}
                    </View>

                    {/* Email ID Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="mail-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('emailId', 'Email ID')} <Text style={styles.optional}>({t('optional', 'Optional')})</Text></Text>
                        </View>
                        <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="mail" size={16} color={COLORS.textLight} />
                            </View>
                            <TextInput
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text.toLowerCase());
                                    setErrors(prev => ({ ...prev, email: undefined }));
                                }}
                                placeholder={t('enterEmailAddress', 'Enter email address')}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.textInput}
                            />
                        </View>
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                    </View>

                    {/* State Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('state', 'State')}<Text style={styles.required}>*</Text></Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsStateModalVisible(true)}
                            style={[styles.stateSelector, errors.state && styles.inputWrapperError]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.stateSelectorLeft}>
                                <Ionicons name="location" size={16} color={COLORS.textLight} />
                                <Text style={selectedStateName ? styles.stateSelectorText : styles.stateSelectorPlaceholder}>
                                    {selectedStateName || t('selectState', 'Select State')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                        </TouchableOpacity>
                        {errors.state && (
                            <Text style={styles.errorText}>{errors.state}</Text>
                        )}
                    </View>
                </View>

                {/* Add More Details Section */}


                <Space height={responsiveHeight(4)} />

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading || !isFormValid()}
                    style={[
                        styles.submitButton,
                        (!isFormValid() || loading) && styles.submitButtonDisabled
                    ]}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t('submit', 'Submit')}</Text>
                    )}
                </TouchableOpacity>



                <Space height={responsiveHeight(10)} />
            </KeyboardAwareScrollView>

            {/* State Selection Modal */}
            <Modal
                visible={isStateModalVisible}
                animationType="slide"
                onRequestClose={() => setIsStateModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: COLORS.white }]}>
                    <Space height={safeAreaInsets.top} />

                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setIsStateModalVisible(false);
                                setStateSearchText('');
                            }}
                            hitSlop={hitSlop(10)}
                            style={styles.modalBackButton}
                        >
                            <Ionicons name="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {t('selectState', 'Select State')}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Simplified State List Implementation */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
                            <TextInput
                                value={stateSearchText}
                                onChangeText={setStateSearchText}
                                placeholder={t('searchState', 'Search State')}
                                placeholderTextColor={COLORS.textLight}
                                style={styles.searchInput}
                                autoFocus={false}
                            />
                        </View>
                    </View>

                    <FlatList
                        data={locations.filter(item =>
                            item.name.toLowerCase().includes(stateSearchText.toLowerCase())
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.stateListContent}
                        renderItem={({ item }) => {
                            const isSelected = isEditingDriverState
                                ? editDriverState === item.id.toString()
                                : state === item.id.toString();
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (isEditingDriverState) {
                                            setEditDriverState(item.id.toString());
                                            setEditDriverStateName(item.name);
                                        } else {
                                            setState(item.id.toString());
                                            setSelectedStateName(item.name);
                                            setErrors(prev => ({ ...prev, state: undefined }));
                                        }
                                        setIsStateModalVisible(false);
                                        setStateSearchText('');
                                        setIsEditingDriverState(false);
                                    }}
                                    style={[
                                        styles.stateItem,
                                        isSelected && styles.stateItemSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.stateItemText,
                                        isSelected && styles.stateItemTextSelected
                                    ]}>
                                        {item.name}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>

            {/* OTP Verification Modal */}
            <Modal
                visible={showOtpModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseOtpModal}
            >
                <View style={styles.otpModalOverlay}>
                    <View style={styles.otpModalContainer}>
                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={handleCloseOtpModal}
                            style={styles.otpCloseButton}
                            hitSlop={hitSlop(10)}
                        >
                            <Ionicons name="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>

                        {/* OTP Icon */}
                        <View style={styles.otpIconContainer}>
                            <MaterialCommunityIcons name="message-text-lock" size={48} color={COLORS.primary} />
                        </View>

                        {/* Title */}
                        <Text style={styles.otpTitle}>
                            {t('verifyOtp', 'Verify OTP')}
                        </Text>

                        {/* Subtitle with phone number */}
                        <Text style={styles.otpSubtitle}>
                            {t('pleaseEnterOtpFor', 'Please enter the 6-digit code sent to')}{'\n'}
                            <Text style={styles.otpPhoneNumber}>+91 {pendingDriverData?.mobile}</Text>
                        </Text>

                        {/* OTP Input */}
                        <View style={styles.otpInputContainer}>
                            <TextInput
                                value={otp}
                                onChangeText={(text) => {
                                    setOtp(text.replace(/[^0-9]/g, ''));
                                    if (otpError) setOtpError('');
                                }}
                                placeholder={t('enterOtp', 'Enter 6-digit OTP')}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="number-pad"
                                maxLength={6}
                                style={styles.otpInput}
                                autoFocus={true}
                            />
                        </View>

                        {/* Error Message */}
                        {otpError ? (
                            <Text style={styles.otpErrorText}>{otpError}</Text>
                        ) : null}

                        {/* Verify Button */}
                        <TouchableOpacity
                            onPress={handleVerifyOtp}
                            disabled={otpLoading || otp.length < 6}
                            style={[
                                styles.otpVerifyButton,
                                (otpLoading || otp.length < 6) && styles.otpVerifyButtonDisabled
                            ]}
                            activeOpacity={0.8}
                        >
                            {otpLoading ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <Text style={styles.otpVerifyButtonText}>
                                    {t('verifyAndAdd', 'Verify & Add Driver')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend OTP */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={otpLoading}
                            style={styles.resendButton}
                        >
                            <Text style={styles.resendText}>
                                {t('didntReceiveCode', "Didn't receive code?")}{' '}
                                <Text style={styles.resendLink}>{t('resendOtp', 'Resend OTP')}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Success Screen Modal - Modern Minimal */}
            <Modal
                visible={showSuccessScreen}
                animationType="none"
                onRequestClose={() => setShowSuccessScreen(false)}
            >
                <View style={styles.successModalContainer}>
                    <Space height={safeAreaInsets.top + 40} />

                    <Animated.View style={[
                        styles.successHeaderMinimal,
                        {
                            opacity: successTitleOpacity,
                            transform: [{ translateY: successTitleTranslate }],
                        }
                    ]}>
                        <Animated.View style={[
                            styles.successIconMinimal,
                            {
                                transform: [
                                    { scale: successIconScale },
                                    {
                                        rotate: successIconRotate.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['-180deg', '0deg'],
                                        })
                                    }
                                ],
                            }
                        ]}>
                            <View style={styles.successIconInner}>
                                <Ionicons name="checkmark" size={36} color={COLORS.white} />
                            </View>
                        </Animated.View>

                        <Text style={styles.successTitleMinimal}>
                            {successCount > 1 ? t('driversAdded', 'Drivers Added!') : t('driverAdded', 'Driver Added!')}
                        </Text>
                        <Text style={styles.successSubtitleMinimal}>
                            {successCount} {successCount > 1 ? t('driversText', 'drivers') : t('driverText', 'driver')} {t('addedSuccessfully', 'added successfully')}
                        </Text>
                    </Animated.View>

                    <Animated.View style={[
                        styles.successActionsMinimal,
                        {
                            paddingBottom: safeAreaInsets.bottom + 20,
                            opacity: successButtonsOpacity,
                            transform: [{ translateY: successButtonsTranslate }],
                        }
                    ]}>
                        <TouchableOpacity
                            style={styles.successPrimaryBtn}
                            onPress={handleViewDrivers}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="people" size={18} color={COLORS.white} />
                            <Text style={styles.successPrimaryBtnText}>
                                {t('viewMyDrivers', 'View My Drivers')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.successSecondaryBtn}
                            onPress={handleAddMoreDrivers}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.successSecondaryBtnText}>
                                {t('addMoreDrivers', 'Add More Drivers')}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Contact List Modal */}
            <Modal
                visible={showContactListModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowContactListModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: COLORS.white }]}>
                    <Space height={safeAreaInsets.top} />
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowContactListModal(false)} style={styles.modalBackButton}>
                            <Ionicons name="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('selectContacts', 'Select Contacts')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
                            <TextInput
                                value={contactSearchText}
                                onChangeText={setContactSearchText}
                                placeholder={t('searchContacts', 'Search contacts...')}
                                placeholderTextColor={COLORS.textLight}
                                style={styles.searchInput}
                            />
                        </View>
                    </View>

                    {loadingContacts ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => item.uniqueId}
                            contentContainerStyle={styles.stateListContent}
                            renderItem={({ item }) => {
                                const isSelected = selectedContactIds.includes(item.uniqueId);
                                const hasPhone = item.phoneNumbers && item.phoneNumbers.length > 0;
                                return (
                                    <TouchableOpacity
                                        onPress={() => hasPhone && handleContactSelected(item)}
                                        style={[
                                            styles.stateItem,
                                            // isSelected && styles.stateItemSelected,
                                            !hasPhone && { opacity: 0.5 }
                                        ]}
                                        disabled={!hasPhone}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                                                    {item.displayName.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.stateItemText]}>
                                                    {item.displayName}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                                                    {hasPhone ? item.phoneNumbers[0].number : 'No phone number'}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', padding: 40 }}>
                                    <Text style={{ color: COLORS.textMuted }}>{t('noContactsFound', 'No contacts found')}</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>

            {/* Review Screen Modal */}
            <Modal
                visible={showReviewScreen}
                animationType="slide"
                onRequestClose={() => setShowReviewScreen(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
                    <Space height={safeAreaInsets.top} />
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowReviewScreen(false)} style={styles.modalBackButton}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('reviewDrivers', 'Review Drivers')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <FlatList
                        data={bulkDrivers}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.scrollContent}
                        renderItem={({ item, index }) => (
                            <View style={[
                                styles.contactImportCard,
                                { backgroundColor: COLORS.white, borderColor: item.isValid ? COLORS.border : COLORS.error }
                            ]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textDark }}>{item.name}</Text>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity onPress={() => openEditDriver(index)}>
                                            <Ionicons name="pencil" size={20} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => removeDriverFromBulk(index)}>
                                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="call-outline" size={14} color={COLORS.textLight} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 14, color: COLORS.textDark }}>{item.phone}</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => openEditDriver(index)}
                                    style={{
                                        borderWidth: 1, borderColor: item.state ? COLORS.border : COLORS.error,
                                        borderRadius: 8, padding: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: item.stateName ? COLORS.textDark : COLORS.error, fontSize: 14 }}>
                                        {item.stateName || t('selectStateRequired', 'Select State (Required)')}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                                </TouchableOpacity>

                                {!item.isValid && <Text style={styles.errorText}>{t('fieldsMissing', 'Please fix missing fields')}</Text>}
                            </View>
                        )}
                        ListHeaderComponent={
                            <Text style={{ marginVertical: 12, marginHorizontal: 4, color: COLORS.textMuted, fontSize: 13 }}>
                                {t('reviewInstructions', 'Please review driver details and ensure state is selected for each driver.')}
                            </Text>
                        }
                    />

                    <View style={{ padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: safeAreaInsets.bottom }}>
                        <TouchableOpacity
                            onPress={handleBulkSubmit}
                            disabled={bulkSubmitting || !allDriversValid}
                            style={[styles.submitButton, { marginHorizontal: 0 }, (!allDriversValid || bulkSubmitting) && styles.submitButtonDisabled]}
                        >
                            {bulkSubmitting ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {t('submitAll', 'Add All Drivers')} ({validDriverCount}/{bulkDrivers.length})
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Driver Modal */}
            <Modal
                visible={showEditDriverSheet}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditDriverSheet(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: COLORS.white }]}>
                    <Space height={safeAreaInsets.top} />
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowEditDriverSheet(false)} style={styles.modalBackButton}>
                            <Ionicons name="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('editDriver', 'Edit Driver')}</Text>
                        <TouchableOpacity onPress={saveEditedDriver}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                                {t('save', 'Save')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Fields similar to main form */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('fullName', 'Full Name')}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={editDriverName}
                                    onChangeText={setEditDriverName}
                                    style={styles.textInput}
                                    placeholder={t('driverName', 'Driver Name')}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('mobile', 'Mobile')}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={editDriverPhone}
                                    onChangeText={(t) => setEditDriverPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                                    style={styles.textInput}
                                    keyboardType="number-pad"
                                    placeholder={t('mobile', 'Mobile')}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('email', 'Email')}</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={editDriverEmail}
                                    onChangeText={setEditDriverEmail}
                                    style={styles.textInput}
                                    keyboardType="email-address"
                                    placeholder={t('email', 'Email')}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('state', 'State')}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsEditingDriverState(true);
                                    setIsStateModalVisible(true);
                                }}
                                style={styles.stateSelector}
                            >
                                <Text style={editDriverStateName ? styles.stateSelectorText : styles.stateSelectorPlaceholder}>
                                    {editDriverStateName || t('selectState', 'Select State')}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </Modal>

            {/* Permission Sheet (as a simple View/Modal) */}
            <Modal
                visible={showPermissionSheet}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPermissionSheet(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Ionicons name="people" size={30} color={COLORS.error} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' }}>
                            {t('contactsAccessNeeded', 'Contacts Access Needed')}
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 }}>
                            {t('contactsAccessDesc', 'TruckMitr needs access to your contacts to help you add drivers quickly. Please enable it in settings.')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowPermissionSheet(false)}
                            style={[styles.submitButton, { width: '100%', marginHorizontal: 0 }]}
                        >
                            <Text style={styles.submitButtonText}>{t('close', 'Close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    stepNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        elevation: 2,
    },
    stepNumberText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.warning,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
        letterSpacing: 0.5,
    },
    contactImportCard: {
        backgroundColor: COLORS.contactCardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.contactCardBorder,
        flexDirection: 'column',
        gap: 14,
    },
    contactImportLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    contactIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactImportTextContainer: {
        flex: 1,
    },
    contactImportTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    contactImportSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    selectContactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: 6,
    },
    selectContactButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    fieldContainer: {
        marginBottom: 18,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    fieldIcon: {
        marginRight: 6,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    required: {
        color: COLORS.error,
        fontWeight: 'bold',
    },
    optional: {
        color: COLORS.textLight,
        fontWeight: '400',
        fontSize: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    inputWrapperError: {
        borderColor: COLORS.error,
    },
    inputIconContainer: {
        paddingHorizontal: 12,
    },
    countryCodeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textDark,
        paddingVertical: 12,
        paddingRight: 12,
    },
    importedLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 4,
        marginLeft: 4,
        fontStyle: 'italic',
    },
    errorText: {
        color: COLORS.error,
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4,
    },
    stateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    stateSelectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stateSelectorText: {
        fontSize: 14,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    stateSelectorPlaceholder: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    additionalDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
    },
    addDetailsIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    additionalDetailsTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#A5B4FC',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalBackButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textDark,
        paddingVertical: 4,
    },
    stateListContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
    },
    stateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    stateItemSelected: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    stateItemText: {
        fontSize: 14,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    stateItemTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    successModalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successHeaderMinimal: {
        alignItems: 'center',
        marginBottom: 40,
    },
    successIconMinimal: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    successIconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#ffffff50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitleMinimal: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitleMinimal: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    successActionsMinimal: {
        width: '100%',
        gap: 12,
    },
    successPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    successPrimaryBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    successSecondaryBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
    },
    successSecondaryBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // New Styles for Added Modals
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactItemSelected: {
        backgroundColor: COLORS.primaryLight,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contactAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    contactPhone: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.textLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    reviewCardError: {
        borderColor: COLORS.error,
        borderWidth: 1.5,
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    reviewDetail: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    reviewStateBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        backgroundColor: COLORS.cardBg,
    },
    // OTP Modal Styles
    otpModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    otpModalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    otpCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 1,
    },
    otpIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    otpTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    otpSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    otpPhoneNumber: {
        fontWeight: '700',
        color: COLORS.textDark,
    },
    otpInputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    otpInput: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textDark,
        textAlign: 'center',
        letterSpacing: 8,
    },
    otpVerifyButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpVerifyButtonDisabled: {
        backgroundColor: COLORS.textLight,
    },
    otpVerifyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    resendButton: {
        marginTop: 16,
        paddingVertical: 8,
    },
    resendText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    resendLink: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    otpErrorText: {
        fontSize: 13,
        color: COLORS.error,
        marginTop: 8,
        textAlign: 'center',
    },
});
