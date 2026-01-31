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
    success: '#22C55E',
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

export default function ForemanAddDriver() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    useStatusBarStyle('dark-content');

    // Debug: Get entire Redux state
    const reduxState = useSelector((state: any) => state);

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
                        title: t('contactPermissionTitle'),
                        message: t('contactPermissionMessage'),
                        buttonPositive: t('allow'),
                        buttonNegative: t('notNow'),
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

        // Use getAllWithoutPhotos if available for better performance, else getAll
        Contacts.getAll()
            .then((contacts) => {
                // First Phase: Filter invalid contacts
                const validContacts = contacts.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);

                // Second Phase: Advanced Deduplication
                // We'll use a Map to keep unique contacts based on a composite key or phone number
                const uniqueContactsMap = new Map();

                validContacts.forEach((contact) => {
                    const displayName = `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Unknown';

                    // Normalize phone numbers for this contact
                    const uniquePhonesForContact = new Set(
                        contact.phoneNumbers.map((p: any) => p.number.replace(/[^0-9]/g, '').slice(-10))
                    );

                    // If we haven't seen this name yet, add it
                    if (!uniqueContactsMap.has(displayName)) {
                        uniqueContactsMap.set(displayName, {
                            ...contact,
                            displayName,
                            phoneNumbers: contact.phoneNumbers, // Keep original structure
                            uniqueId: contact.recordID || `${displayName}-${Math.random()}`
                        });
                    } else {
                        // If we HAVE seen this name, we should check if we can merge phone numbers
                        // This handles the case where "John Doe" has 2 entries: one with mobile, one with home
                        const existingContact = uniqueContactsMap.get(displayName);

                        const existingPhones = new Set(
                            existingContact.phoneNumbers.map((p: any) => p.number.replace(/[^0-9]/g, '').slice(-10))
                        );

                        // Add new phones that aren't in the existing contact
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

                // Convert Map back to array and sort
                const contactsWithPhones = Array.from(uniqueContactsMap.values())
                    .sort((a, b) => a.displayName.localeCompare(b.displayName));

                setAllContacts(contactsWithPhones);
                setFilteredContacts(contactsWithPhones);
                setLoadingContacts(false);

                if (contactsWithPhones.length === 0) {
                    showToast(t('noContactsWithPhone'));
                }
            })
            .catch((e) => {
                console.log('Error getting contacts:', e);
                setLoadingContacts(false);
                showToast(t('errorAccessingContacts'));
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

                // Use map to find state code for bulk upload too if needed
                let stateCode = driver.state;
                const foundCode = Object.keys(STATE_ID_MAP).find(key => STATE_ID_MAP[key] === driver.stateName);
                if (foundCode) stateCode = foundCode;

                formData.append('states', stateCode);

                await axiosInstance.post(END_POINTS.ASSOCIATION_ADD_DRIVER, formData);
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

    // Navigate to My Pilots after success
    const handleViewDrivers = () => {
        setShowSuccessScreen(false);
        // navigation.navigate(STACKS.FOREMAN_MY_PILOTS as any);
    };

    const handleAddMoreDrivers = () => {
        setShowSuccessScreen(false);
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
            showToast(t('noPhoneNumber'));
        }
    };

    const applyContactData = (name: string, phone: string, emailAddr: string) => {
        setFullName(name);
        setMobileNumber(phone);
        // if (emailAddr) setEmail(emailAddr); // User requested only Name and Mobile
        setIsImportedFromContacts(true);
        setIsOtpVerified(phone.length > 0);
        setErrors({});
        showToast(t('contactImported'));
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
            newErrors.fullName = t('nameRequired');
            valid = false;
        }
        if (!mobileNumber.trim()) {
            newErrors.mobileNumber = t('mobileNumberRequired');
            valid = false;
        } else if (mobileNumber.length < 10) {
            newErrors.mobileNumber = t('mobileNumber_10_digits');
            valid = false;
        }
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = t('invalidEmailFormat');
                valid = false;
            }
        }
        if (!state) {
            newErrors.state = t('stateRequired');
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
            formData.append('role', 'driver');

            const response = await axiosInstance.post(END_POINTS.FOREMAN_ADD_DRIVER, formData);

            if (response?.data?.status || response?.data?.success) {
                console.log("response", response);

                // Check if OTP was sent (common patterns: "otp sent", "OTP has been sent", etc.)
                const message = response?.data?.message?.toLowerCase() || '';
                if (message.includes('otp')) {
                    // Save driver data locally for OTP verification
                    setPendingDriverData({
                        name: fullName,
                        mobile: mobileNumber,
                        email: email,
                        states: state || '',
                        stateName: selectedStateName,
                    });
                    // Show OTP modal
                    setShowOtpModal(true);
                    showToast(response?.data?.message || t('otpSent'));
                } else {
                    // Driver added successfully without OTP
                    const successMessage = response?.data?.message || t('driverAddedSuccessfully');
                    showToast(`${successMessage}`);
                    console.log('Driver added successfully:', response?.data);

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
                // Backend returned status: false
                const errorMessage = response?.data?.message || t('failedToAddDriver');
                showToast(`${errorMessage}`);
            }
        } catch (error: any) {
            console.log('Error adding driver:', error);
            // Show error toast with backend message or fallback
            const errorMessage = error?.response?.data?.message || error?.message || t('oopsSomethingWentWrong');
            showToast(`${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // OTP Verification Handler
    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setOtpError(t('pleaseEnterValidOtp'));
            return;
        }

        if (!pendingDriverData) {
            setOtpError(t('oopsSomethingWentWrong'));
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const formData = new FormData();
            formData.append('mobile', pendingDriverData.mobile);
            formData.append('otp', otp);

            // Use same OTP verify endpoint as auth
            const response = await axiosInstance.post(END_POINTS.OTP_VERIFY, formData);
            console.log("response of otp verify", response);

            if (response?.data?.status || response?.data?.success) {
                // OTP verified - driver was already added when OTP was sent
                const successMessage = response?.data?.message || t('driverAddedSuccessfully');
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
                const errorMessage = response?.data?.message || t('invalidOtp');
                setOtpError(errorMessage);
            }
        } catch (error: any) {
            console.log('Error verifying OTP:', error);
            const errorMessage = error?.response?.data?.message || error?.message || t('otpVerificationFailed');
            setOtpError(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    // Close OTP Modal
    const handleCloseOtpModal = () => {
        setShowOtpModal(false);
        setOtp('');
        setOtpError('');
        // Keep pendingDriverData so user can retry later if needed
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
                <Text style={styles.headerTitle}>{t('addDriver')}</Text>
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
                    <Text style={styles.stepTitle}>{t('basicDetails')}</Text>
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
                                {t('addDriversFromContacts')}
                            </Text>
                            <Text style={styles.contactImportSubtitle}>
                                {t('bulkImportSubtitle')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.selectContactButton}>
                        <MaterialCommunityIcons name="contacts" size={16} color={COLORS.primary} />
                        <Text style={styles.selectContactButtonText}>
                            {t('selectContacts')}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    {/* Full Name Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="person-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('fullName')}<Text style={styles.required}>*</Text></Text>
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
                                placeholder={t('driverFullName')}
                                placeholderTextColor={COLORS.textLight}
                                style={styles.textInput}
                            />
                        </View>
                        {isImportedFromContacts && fullName && (
                            <Text style={styles.importedLabel}>{t('importedFromContacts')}</Text>
                        )}
                        {errors.fullName && (
                            <Text style={styles.errorText}>{errors.fullName}</Text>
                        )}
                    </View>

                    {/* Mobile Number Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="phone-portrait-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('mobileNo')}<Text style={styles.required}>*</Text></Text>
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
                                placeholder={t('driverMobileNumber')}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={[styles.textInput, { flex: 1, paddingRight: 12 }]}
                            />
                        </View>
                        {isImportedFromContacts && mobileNumber && (
                            <Text style={styles.importedLabel}>{t('importedFromContacts')}</Text>
                        )}
                        {errors.mobileNumber && (
                            <Text style={styles.errorText}>{errors.mobileNumber}</Text>
                        )}
                    </View>

                    {/* Email ID Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabelRow}>
                            <Ionicons name="mail-outline" size={14} color={COLORS.textMuted} style={styles.fieldIcon} />
                            <Text style={styles.fieldLabel}>{t('emailId')} <Text style={styles.optional}>({t('optional')})</Text></Text>
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
                                placeholder={t('enterEmailAddress')}
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
                            <Text style={styles.fieldLabel}>{t('state')}<Text style={styles.required}>*</Text></Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsStateModalVisible(true)}
                            style={[styles.stateSelector, errors.state && styles.inputWrapperError]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.stateSelectorLeft}>
                                <Ionicons name="location" size={16} color={COLORS.textLight} />
                                <Text style={selectedStateName ? styles.stateSelectorText : styles.stateSelectorPlaceholder}>
                                    {selectedStateName || t('selectState')}
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
                {/* <TouchableOpacity
                    onPress={() => {
                        if (!validate()) return;
                        navigation.navigate(STACKS.FOREMAN_DRIVER_DETAILS as any, {
                            driver: {
                                id: '',
                                name: fullName,
                                tmId: '',
                                mobile: mobileNumber,
                                status: 'Pending',
                                image: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
                                isNew: true,
                                state: selectedStateName,
                                addedDate: new Date().toLocaleDateString(),
                                completion: 25,
                                subscriptionPlan: 0,
                                training: 0,
                                healthHygiene: 0,
                                jobsApplied: 0,
                                dob: '',
                                gender: '',
                                education: '',
                                vehicleType: '',
                                drivingExp: '',
                                licenseType: '',
                                licenseEndorsement: '',
                                currentSalary: '',
                                expectedSalary: '',
                                aadharNo: '',
                                licenseNo: '',
                                licenseExpiry: '',
                                amount: 0,
                                email: email,
                            }
                        });
                    }}
                    style={[styles.additionalDetailsContainer, shadow]}
                    activeOpacity={0.8}
                >
                    <View style={styles.addDetailsIconContainer}>
                        <Ionicons name="add" size={16} color="#fff" />
                    </View>
                    <Text style={styles.additionalDetailsTitle}>
                        {t('addMoreDetails')}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={COLORS.primary}
                    />
                </TouchableOpacity> */}

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
                        <Text style={styles.submitButtonText}>{t('submit')}</Text>
                    )}
                </TouchableOpacity>
                <Space height={responsiveHeight(10)} />
            </KeyboardAwareScrollView>

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
                            {t('verifyOtp')}
                        </Text>

                        {/* Subtitle with phone number */}
                        <Text style={styles.otpSubtitle}>
                            {t('pleaseEnterOtpFor')}{'\n'}
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
                                placeholder={t('enterOtp')}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="number-pad"
                                maxLength={6}
                                style={[
                                    styles.otpInput,
                                    otpError ? styles.otpInputError : null
                                ]}
                                autoFocus={true}
                            />
                            {otpError ? (
                                <Text style={styles.otpErrorText}>{otpError}</Text>
                            ) : null}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            onPress={handleVerifyOtp}
                            disabled={otpLoading || otp.length < 4}
                            style={[
                                styles.otpVerifyButton,
                                (otpLoading || otp.length < 4) && styles.otpVerifyButtonDisabled
                            ]}
                            activeOpacity={0.8}
                        >
                            {otpLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.otpVerifyButtonText}>
                                    {t('verifyAndAdd')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend OTP */}
                        <TouchableOpacity
                            onPress={() => {
                                // Close modal and resubmit form to resend OTP
                                setShowOtpModal(false);
                                setOtp('');
                                handleSubmit();
                            }}
                            style={styles.resendOtpButton}
                            disabled={loading}
                        >
                            <Text style={styles.resendOtpText}>
                                {t('didntReceiveOtp')} <Text style={styles.resendOtpLink}>{t('resend')}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
                            {t('selectState')}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
                            <TextInput
                                value={stateSearchText}
                                onChangeText={setStateSearchText}
                                placeholder={t('searchState')}
                                placeholderTextColor={COLORS.textLight}
                                style={styles.searchInput}
                                autoFocus={false}
                            />
                            {stateSearchText.length > 0 && (
                                <TouchableOpacity onPress={() => setStateSearchText('')} hitSlop={hitSlop(10)}>
                                    <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* State List */}
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
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                                        size={22}
                                        color={isSelected ? COLORS.primary : "#CBD5E1"}
                                        style={{ marginRight: 12 }}
                                    />
                                    <Text style={[
                                        styles.stateItemText,
                                        isSelected && styles.stateItemTextSelected
                                    ]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="location-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyStateText}>
                                    {t('noStatesFound')}
                                </Text>
                            </View>
                        }
                    />
                </View>
            </Modal>

            {/* Contact Permission Bottom Sheet */}
            <Modal
                visible={showPermissionSheet}
                animationType="slide"
                transparent
                onRequestClose={() => setShowPermissionSheet(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity
                        style={styles.bottomSheetBackdrop}
                        onPress={() => setShowPermissionSheet(false)}
                    />
                    <View style={styles.bottomSheetContainer}>
                        <View style={styles.bottomSheetHandle} />
                        <View style={styles.permissionIconContainer}>
                            <MaterialCommunityIcons name="contacts" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.permissionTitle}>
                            {t('allowContactAccess')}
                        </Text>
                        <Text style={styles.permissionMessage}>
                            {t('contactPermissionReason')}
                        </Text>
                        <View style={styles.permissionButtonsRow}>
                            <TouchableOpacity
                                onPress={() => setShowPermissionSheet(false)}
                                style={styles.permissionSecondaryButton}
                            >
                                <Text style={styles.permissionSecondaryButtonText}>{t('notNow')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    setShowPermissionSheet(false);
                                    const granted = await requestContactPermission();
                                    if (granted) openContactPicker();
                                }}
                                style={styles.permissionPrimaryButton}
                            >
                                <Text style={styles.permissionPrimaryButtonText}>{t('allow')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Multiple Numbers Bottom Sheet */}
            <Modal
                visible={showMultipleNumbersSheet}
                animationType="slide"
                transparent
                onRequestClose={() => setShowMultipleNumbersSheet(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity
                        style={styles.bottomSheetBackdrop}
                        onPress={() => setShowMultipleNumbersSheet(false)}
                    />
                    <View style={styles.bottomSheetContainer}>
                        <View style={styles.bottomSheetHandle} />
                        <Text style={styles.multipleNumbersTitle}>
                            {t('chooseMobileNumber')}
                        </Text>
                        {contactPhoneNumbers.map((phone, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handlePhoneNumberSelected(phone)}
                                style={styles.phoneNumberOption}
                            >
                                <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.phoneNumberText}>+91 {phone}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Contact List Modal with Checkboxes */}
            <Modal
                visible={showContactListModal}
                animationType="slide"
                onRequestClose={() => setShowContactListModal(false)}
            >
                <View style={[styles.contactModalContainer]}>
                    <Space height={safeAreaInsets.top} />

                    {/* Minimal Header */}
                    <View style={styles.contactModalHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowContactListModal(false);
                                setContactSearchText('');
                                setSelectedContactIds([]);
                            }}
                            hitSlop={hitSlop(10)}
                            style={styles.contactModalCloseBtn}
                        >
                            <Ionicons name="close" size={22} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.contactModalTitle}>
                            {t('selectContacts')}
                        </Text>
                        <View style={{ width: 32 }} />
                    </View>

                    {/* Clean Search Bar */}
                    <View style={styles.contactSearchContainer}>
                        <View style={styles.contactSearchBox}>
                            <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
                            <TextInput
                                value={contactSearchText}
                                onChangeText={setContactSearchText}
                                placeholder={t('searchContact')}
                                placeholderTextColor={COLORS.textLight}
                                style={styles.contactSearchInput}
                                autoFocus={false}
                            />
                            {contactSearchText.length > 0 && (
                                <TouchableOpacity onPress={() => setContactSearchText('')} hitSlop={hitSlop(10)}>
                                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Contact Count - Minimal */}
                    <View style={styles.contactCountRow}>
                        <Text style={styles.contactCountLabel}>
                            {filteredContacts.length} {t('contacts')}
                        </Text>
                        {selectedContactIds.length > 0 && (
                            <View style={styles.selectedBadge}>
                                <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                                <Text style={styles.selectedBadgeText}>
                                    {selectedContactIds.length} {t('selected')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Contact List - Minimal */}
                    {loadingContacts ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>{t('loadingContacts')}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => item.uniqueId}
                            contentContainerStyle={styles.contactListMinimal}
                            ItemSeparatorComponent={() => <View style={styles.contactDivider} />}
                            renderItem={({ item }) => {
                                const isSelected = selectedContactIds.includes(item.uniqueId);
                                const primaryPhone = item.phoneNumbers?.[0]?.number || '';
                                return (
                                    <TouchableOpacity
                                        onPress={() => handleContactSelected(item)}
                                        style={styles.contactRowMinimal}
                                        activeOpacity={0.6}
                                    >
                                        {/* Compact Avatar */}
                                        <View style={[
                                            styles.contactAvatarMinimal,
                                            // isSelected && styles.contactAvatarMinimalSelected 
                                        ]}>
                                            <Text style={[
                                                styles.contactAvatarLetterMinimal,
                                                // isSelected && styles.contactAvatarLetterMinimalSelected
                                            ]}>
                                                {item.displayName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>

                                        {/* Contact Info */}
                                        <View style={styles.contactDetailsMinimal}>
                                            <Text style={styles.contactNameMinimal} numberOfLines={1}>
                                                {item.displayName}
                                            </Text>
                                            <Text style={styles.contactPhoneMinimal} numberOfLines={1}>
                                                {primaryPhone}
                                            </Text>
                                        </View>

                                        {/* Selection Circle - Removed for single select */}
                                        {/* <View style={[
                                            styles.selectionCircle,
                                            isSelected && styles.selectionCircleActive
                                        ]}>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={14} color={COLORS.white} />
                                            )}
                                        </View> */}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyStateContainer}>
                                    <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyStateText}>
                                        {t('noContactsFound')}
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    {/* Bottom Add Button - Removed for single select */}
                    {/* {!loadingContacts && filteredContacts.length > 0 && (
                        <View style={[styles.addButtonWrapper, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
                            <TouchableOpacity
                                onPress={handleConfirmBulkSelection}
                                disabled={selectedContactIds.length === 0}
                                style={[
                                    styles.addButtonMinimal,
                                    selectedContactIds.length === 0 && styles.addButtonMinimalDisabled
                                ]}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="people" size={18} color={COLORS.white} />
                                <Text style={styles.addButtonText}>
                                    {selectedContactIds.length > 0
                                        ? t('addDrivers', `Add ${selectedContactIds.length} Driver${selectedContactIds.length > 1 ? 's' : ''}`)
                                        : t('selectContacts', 'Select Contacts')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )} */}
                </View>
            </Modal>

            {/* Review Drivers Screen Modal */}
            <Modal
                visible={showReviewScreen}
                animationType="slide"
                onRequestClose={() => setShowReviewScreen(false)}
            >
                <View style={styles.reviewModalContainer}>
                    <Space height={safeAreaInsets.top} />

                    {/* Minimal Header */}
                    <View style={styles.reviewModalHeader}>
                        <TouchableOpacity
                            onPress={() => setShowReviewScreen(false)}
                            hitSlop={hitSlop(10)}
                            style={styles.reviewBackBtn}
                        >
                            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <View style={styles.reviewHeaderText}>
                            <Text style={styles.reviewModalTitle}>{t('reviewDrivers')}</Text>
                            <Text style={styles.reviewModalSubtitle}>{t('verifyDetails')}</Text>
                        </View>
                    </View>

                    {/* Driver List - Minimal */}
                    <FlatList
                        data={bulkDrivers}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.reviewListMinimal}
                        ItemSeparatorComponent={() => <View style={styles.reviewDivider} />}
                        renderItem={({ item, index }) => (
                            <View style={styles.reviewDriverRow}>
                                <View style={styles.reviewDriverMain}>
                                    {/* Compact Avatar */}
                                    <View style={[
                                        styles.reviewAvatarMinimal,
                                        item.isValid ? styles.reviewAvatarValid : styles.reviewAvatarWarning
                                    ]}>
                                        <Text style={styles.reviewAvatarLetter}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>

                                    {/* Driver Info */}
                                    <View style={styles.reviewDriverInfo}>
                                        <View style={styles.reviewNameRow}>
                                            <Text style={styles.reviewDriverName} numberOfLines={1}>{item.name}</Text>
                                            {/* Status Indicator */}
                                            {item.isValid ? (
                                                <View style={styles.reviewStatusDot}>
                                                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                                                    <Text style={styles.reviewStatusText}>{t('ready')}</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.reviewStatusDotWarning}>
                                                    <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.reviewDriverPhone}>+91 {item.phone}</Text>
                                        {!item.isValid && (
                                            <Text style={styles.reviewMissingText}>
                                                {!item.state ? t('stateRequired') : t('incompleteDetails')}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Inline Actions */}
                                    <View style={styles.reviewInlineActions}>
                                        <TouchableOpacity
                                            style={styles.reviewIconBtn}
                                            onPress={() => openEditDriver(index)}
                                            hitSlop={hitSlop(10)}
                                        >
                                            <Ionicons name="create-outline" size={18} color={COLORS.textMuted} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.reviewIconBtn}
                                            onPress={() => removeDriverFromBulk(index)}
                                            hitSlop={hitSlop(10)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyStateContainer}>
                                <MaterialCommunityIcons name="account-group" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>{t('noDriversSelected')}</Text>
                            </View>
                        }
                    />

                    {/* Modern Footer */}
                    {bulkDrivers.length > 0 && (
                        <View style={[styles.reviewFooterMinimal, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
                            <Text style={styles.reviewFooterCount}>
                                {validDriverCount}/{bulkDrivers.length} {t('ready')}
                            </Text>
                            <TouchableOpacity
                                onPress={handleBulkSubmit}
                                disabled={!allDriversValid || bulkSubmitting}
                                style={[
                                    styles.reviewSubmitBtn,
                                    (!allDriversValid || bulkSubmitting) && styles.reviewSubmitBtnDisabled
                                ]}
                                activeOpacity={0.8}
                            >
                                {bulkSubmitting ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="people" size={16} color={COLORS.white} />
                                        <Text style={styles.reviewSubmitText}>
                                            {t('addAllDrivers', { count: bulkDrivers.length })}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Edit Driver Bottom Sheet */}
            <Modal
                visible={showEditDriverSheet}
                animationType="slide"
                transparent
                onRequestClose={() => setShowEditDriverSheet(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity style={styles.bottomSheetBackdrop} onPress={() => setShowEditDriverSheet(false)} />
                    <View style={[styles.bottomSheetContainer, { paddingBottom: safeAreaInsets.bottom + 16 }]}>
                        <View style={styles.bottomSheetHandle} />
                        <Text style={styles.editSheetTitle}>{t('editDriverDetails')}</Text>

                        {/* Name */}
                        <View style={styles.editFieldContainer}>
                            <Text style={styles.editFieldLabel}>{t('fullName')}</Text>
                            <TextInput
                                value={editDriverName}
                                onChangeText={setEditDriverName}
                                style={styles.editFieldInput}
                                placeholder={t('enterName')}
                            />
                        </View>

                        {/* Phone */}
                        <View style={styles.editFieldContainer}>
                            <Text style={styles.editFieldLabel}>{t('mobileNo')}</Text>
                            <TextInput
                                value={editDriverPhone}
                                onChangeText={setEditDriverPhone}
                                style={styles.editFieldInput}
                                placeholder={t('enterPhone')}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.editFieldContainer}>
                            <Text style={styles.editFieldLabel}>{t('email')} ({t('optional')})</Text>
                            <TextInput
                                value={editDriverEmail}
                                onChangeText={setEditDriverEmail}
                                style={styles.editFieldInput}
                                placeholder={t('enterEmail')}
                                keyboardType="email-address"
                            />
                        </View>

                        {/* State */}
                        <View style={styles.editFieldContainer}>
                            <Text style={styles.editFieldLabel}>{t('state')} <Text style={{ color: COLORS.error }}>*</Text></Text>
                            <TouchableOpacity
                                style={styles.editStateSelector}
                                onPress={() => { setIsEditingDriverState(true); setIsStateModalVisible(true); }}
                            >
                                <Text style={editDriverStateName ? styles.editStateSelectorText : styles.editStateSelectorPlaceholder}>
                                    {editDriverStateName || t('selectState')}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>

                        {/* Buttons */}
                        <View style={styles.editSheetButtons}>
                            <TouchableOpacity style={styles.editCancelButton} onPress={() => setShowEditDriverSheet(false)}>
                                <Text style={styles.editCancelButtonText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editSaveButton} onPress={saveEditedDriver}>
                                <Text style={styles.editSaveButtonText}>{t('save')}</Text>
                            </TouchableOpacity>
                        </View>
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

                    {/* Animated Success Icon */}
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
                            {successCount > 1 ? t('driversAdded') : t('driverAdded')}
                        </Text>
                        <Text style={styles.successSubtitleMinimal}>
                            {successCount} {successCount > 1 ? t('driversText') : t('driverText')} {t('addedSuccessfully')}
                            {failCount > 0 ? ` · ${failCount} ${t('failed')}` : ''}
                        </Text>
                    </Animated.View>

                    {/* Animated Drivers List */}
                    <Animated.View style={[
                        styles.successListContainer,
                        {
                            opacity: successListOpacity,
                            transform: [{ translateY: successListTranslate }],
                        }
                    ]}>
                        <Text style={styles.successListTitle}>
                            {t('newlyAddedDrivers')}
                        </Text>
                        <FlatList
                            data={successDrivers}
                            keyExtractor={(item, index) => `success-${index}`}
                            contentContainerStyle={styles.successListContent}
                            ItemSeparatorComponent={() => <View style={styles.successListDivider} />}
                            renderItem={({ item, index }) => (
                                <View style={styles.successDriverRowMinimal}>
                                    <View style={styles.successAvatarMinimal}>
                                        <Text style={styles.successAvatarLetter}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.successDriverDetails}>
                                        <Text style={styles.successDriverNameMinimal} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.successDriverPhoneMinimal}>+91 {item.phone}</Text>
                                    </View>
                                    <View style={styles.successCheckMinimal}>
                                        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                    </View>
                                </View>
                            )}
                        />
                    </Animated.View>

                    {/* Animated Action Buttons */}
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
                                {t('viewMyPilots')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.successSecondaryBtn}
                            onPress={handleAddMoreDrivers}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.successSecondaryBtnText}>
                                {t('addMoreDrivers')}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
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
    // Step Header
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
    // Contact Import Card
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
    // Form Container
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
    inlineContactButton: {
        padding: 12,
        marginRight: 4,
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
    // State Selector
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
    // Additional Details
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
    // Submit Button
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
    // Modal styles
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
        justifyContent: 'flex-start',
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
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 12,
    },
    // Bottom Sheet
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    bottomSheetBackdrop: {
        flex: 1,
    },
    bottomSheetContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 32,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    permissionIconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 8,
    },
    permissionMessage: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    permissionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    permissionSecondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    permissionSecondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    permissionPrimaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    permissionPrimaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },
    multipleNumbersTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 16,
    },
    phoneNumberOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        marginBottom: 10,
        gap: 12,
    },
    phoneNumberText: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    // Contact List Modal Styles - Minimal Design
    contactModalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    contactModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    contactModalCloseBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
        letterSpacing: 0.3,
    },
    contactSearchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    contactSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    contactSearchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textDark,
        paddingVertical: 0,
    },
    contactCountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    contactCountLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    selectedBadgeText: {
        fontSize: 12,
        color: COLORS.success,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 12,
    },
    contactListMinimal: {
        paddingTop: 4,
        paddingBottom: 100,
    },
    contactDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 68,
    },
    contactRowMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    contactAvatarMinimal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactAvatarMinimalSelected: {
        backgroundColor: COLORS.primary,
    },
    contactAvatarLetterMinimal: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    contactAvatarLetterMinimalSelected: {
        color: COLORS.white,
    },
    contactDetailsMinimal: {
        flex: 1,
    },
    contactNameMinimal: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    contactPhoneMinimal: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    selectionCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionCircleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    addButtonWrapper: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: COLORS.white,
    },
    addButtonMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    addButtonMinimalDisabled: {
        backgroundColor: '#C7D2FE',
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Legacy styles kept for other modals
    contactCountBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.cardBg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactCountText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    selectedContactLabel: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: '600',
    },
    contactListContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 100,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    contactItemSelected: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    contactAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactAvatarSelected: {
        backgroundColor: COLORS.primary,
    },
    contactAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    contactAvatarTextSelected: {
        color: COLORS.white,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    contactNameSelected: {
        color: COLORS.primary,
    },
    contactPhone: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    confirmButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        gap: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
    // Review Screen Styles - Minimal Design
    reviewModalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    reviewModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    reviewBackBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    reviewHeaderText: {
        flex: 1,
    },
    reviewModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
        letterSpacing: 0.2,
    },
    reviewModalSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    reviewListMinimal: {
        paddingTop: 4,
        paddingBottom: 100,
    },
    reviewDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 68,
    },
    reviewDriverRow: {
        backgroundColor: COLORS.white,
    },
    reviewDriverMain: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    reviewAvatarMinimal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    reviewAvatarValid: {
        backgroundColor: '#ECFDF5',
    },
    reviewAvatarWarning: {
        backgroundColor: '#FEF3C7',
    },
    reviewAvatarLetter: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    reviewDriverInfo: {
        flex: 1,
    },
    reviewNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewDriverName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textDark,
        flexShrink: 1,
    },
    reviewStatusDot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    reviewStatusText: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.success,
    },
    reviewStatusDotWarning: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewDriverPhone: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    reviewMissingText: {
        fontSize: 11,
        color: COLORS.warning,
        marginTop: 2,
    },
    reviewInlineActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    reviewIconBtn: {
        padding: 4,
    },
    reviewFooterMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: COLORS.white,
    },
    reviewFooterCount: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    reviewSubmitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 6,
    },
    reviewSubmitBtnDisabled: {
        backgroundColor: '#C7D2FE',
    },
    reviewSubmitText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Legacy Review styles (kept for backward compatibility)
    reviewSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    reviewListContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 120,
    },
    driverCard: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    driverCardWarning: {
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warningBg,
    },
    driverCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    driverAvatarValid: {
        backgroundColor: COLORS.successBg,
    },
    driverAvatarWarning: {
        backgroundColor: COLORS.warningBg,
    },
    driverAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    driverCardInfo: {
        flex: 1,
    },
    driverCardName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    driverCardPhone: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusReady: {
        backgroundColor: COLORS.successBg,
    },
    statusMissing: {
        backgroundColor: COLORS.warningBg,
    },
    statusReadyText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.success,
    },
    statusMissingText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.warning,
    },
    missingDetailText: {
        fontSize: 12,
        color: COLORS.warning,
        marginTop: 8,
        marginLeft: 56,
    },
    driverCardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 8,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        gap: 4,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
        gap: 4,
    },
    removeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.error,
    },
    bulkFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
    bulkFooterInfo: {
        flex: 1,
    },
    bulkFooterCount: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    bulkSubmitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 6,
    },
    bulkSubmitButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    bulkSubmitText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
    // Edit Driver Sheet Styles
    editSheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 20,
    },
    editFieldContainer: {
        marginBottom: 16,
    },
    editFieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    editFieldInput: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textDark,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    editStateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.cardBg,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    editStateSelectorText: {
        fontSize: 15,
        color: COLORS.textDark,
    },
    editStateSelectorPlaceholder: {
        fontSize: 15,
        color: COLORS.textLight,
    },
    editSheetButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    editCancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    editCancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    editSaveButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
    },
    editSaveButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
    // Success Screen Styles - Modern Minimal
    successModalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    successHeaderMinimal: {
        alignItems: 'center',
        paddingHorizontal: 32,
        marginBottom: 32,
    },
    successIconMinimal: {
        marginBottom: 24,
    },
    successIconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    successTitleMinimal: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    successSubtitleMinimal: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    successListContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    successListTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    successListContent: {
        paddingBottom: 16,
    },
    successListDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 56,
    },
    successDriverRowMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    successAvatarMinimal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    successAvatarLetter: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.success,
    },
    successDriverDetails: {
        flex: 1,
    },
    successDriverNameMinimal: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    successDriverPhoneMinimal: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    successCheckMinimal: {
        padding: 2,
    },
    successActionsMinimal: {
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },
    successPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    successPrimaryBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },
    successSecondaryBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    successSecondaryBtnText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    // Legacy Success Styles (kept for backward compatibility)
    successHeader: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    successIconContainer: {
        marginBottom: 20,
    },
    successIconGradient: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    successDriversContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    successDriversTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    successDriversList: {
        paddingBottom: 16,
    },
    successDriverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    successDriverAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.successBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    successDriverAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.success,
    },
    successDriverInfo: {
        flex: 1,
    },
    successDriverName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    successDriverPhone: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    successBadge: {
        padding: 4,
    },
    successActionsContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 10,
    },
    viewDriversButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        gap: 8,
    },
    viewDriversButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryLight,
        borderRadius: 14,
        paddingVertical: 16,
        gap: 8,
    },
    addMoreButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
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
    resendOtpButton: {
        marginTop: 16,
        paddingVertical: 8,
    },
    resendOtpText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    resendOtpLink: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    otpInputError: {
        borderColor: COLORS.error,
    },
    otpErrorText: {
        fontSize: 13,
        color: COLORS.error,
        marginTop: 8,
        textAlign: 'center',
    },
});
