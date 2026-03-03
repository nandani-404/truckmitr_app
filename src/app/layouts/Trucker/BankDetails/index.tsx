import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback,
    Pressable,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const COLORS = {
    primary: '#6467f2',
    primaryLight: 'rgba(100, 103, 242, 0.08)',
    primaryShadow: 'rgba(100, 103, 242, 0.3)',
    bg: '#f6f6f8',
    surface: '#FFFFFF',
    inputBg: '#f8f8fa',
    border: '#E8E8EF',
    borderLight: '#F0F0F5',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    textPlaceholder: '#b0b5c3',
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    white: '#FFFFFF',
    danger: '#ef4444',
};

// ─────────────────────────────────────────────
// Icons (SVG inline for consistency)
// ─────────────────────────────────────────────
const BackArrowIcon = ({ color = COLORS.textPrimary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
);

const ChevronDownIcon = ({ color = COLORS.textTertiary }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M7 10l5 5 5-5" />
    </Svg>
);

const ChevronUpDownIcon = ({ color = COLORS.textTertiary }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
    </Svg>
);

const ShieldCheckIcon = ({ color = COLORS.textTertiary }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M9 12l2 2 4-4" />
    </Svg>
);

const ChevronRightIcon = ({ color = COLORS.white }: { color?: string }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
    </Svg>
);

const CheckIcon = ({ color = COLORS.primary }: { color?: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 6L9 17l-5-5" />
    </Svg>
);

const CloseIcon = ({ color = COLORS.textPrimary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const TruckerBankDetails = () => {
    const navigation = useNavigation();
    const safeAreaInsets = useSafeAreaInsets();
    const user = useSelector((state: RootState) => state.user?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);

    const [bankData, setBankData] = useState({
        account_number: '',
        account_holder_name: '',
        bank_name: '',
        branch_name: '',
        ifsc_code: '',
        account_type: '',
    });

    // Fetch bank details from API
    const fetchBankDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.TRUCKER_BANK_DETAILS_FETCH);

            if (response?.data?.status) {
                const dataArray = response?.data?.data || [];
                if (dataArray.length > 0) {
                    const data = dataArray[0];
                    setBankData({
                        account_number: data?.account_number || '',
                        account_holder_name: data?.account_holder_name || '',
                        bank_name: data?.bank_name || '',
                        branch_name: data?.branch_name || '',
                        ifsc_code: data?.ifsc_code || '',
                        account_type: data?.account_type || '',
                    });
                } else {
                    // No bank details yet, allow adding
                    setIsEditing(true);
                }
            } else {
                showToast(response?.data?.message || 'Failed to fetch bank details');
            }
        } catch (err: any) {
            console.error('Error fetching bank details:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
            showToast(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBankDetails();
    }, [fetchBankDetails]);

    const handleSave = async () => {
        // Validation
        const requiredFields = {
            account_holder_name: 'Account Holder Name',
            account_number: 'Account Number',
            bank_name: 'Bank Name',
            branch_name: 'Branch Name',
            ifsc_code: 'IFSC Code',
            account_type: 'Account Type',
        };

        for (const [key, label] of Object.entries(requiredFields)) {
            if (!bankData[key as keyof typeof bankData]) {
                showToast(`Please fill the ${label}`);
                return;
            }
        }

        try {
            setSaving(true);
            const response = await axiosInstance.post(END_POINTS.TRUCKER_BANK_DETAILS_UPDATE, bankData);

            if (response?.data?.status) {
                showToast(response?.data?.message || 'Details saved successfully!');
                setIsEditing(false);
                fetchBankDetails(); // Refresh data
            } else {
                showToast(response?.data?.message || 'Failed to update details. Please try again.');
            }
        } catch (err: any) {
            console.error('Error saving details:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
            showToast(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────
    // Render Input Field
    // ─────────────────────────────────────────────
    const renderInput = (
        label: string,
        value: string,
        key: keyof typeof bankData,
        placeholder: string,
        keyboardType: any = 'default',
        autoCapitalize: any = 'words',
        secureTextEntry: boolean = false,
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label.toUpperCase()}</Text>
            {isEditing ? (
                key === 'account_type' ? (
                    <Pressable
                        style={styles.input}
                        onPress={() => setShowAccountTypeModal(true)}
                    >
                        <Text style={[
                            styles.inputText,
                            !value && styles.placeholderText,
                        ]}>
                            {value || `Select ${label}`}
                        </Text>
                        <ChevronUpDownIcon color={COLORS.textTertiary} />
                    </Pressable>
                ) : (
                    <TextInput
                        style={[styles.input, styles.inputText]}
                        value={value}
                        onChangeText={(text) => setBankData({ ...bankData, [key]: text })}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        placeholder={placeholder}
                        placeholderTextColor={COLORS.textPlaceholder}
                        secureTextEntry={secureTextEntry}
                    />
                )
            ) : (
                <View style={styles.valueContainer}>
                    <Text style={styles.value}>{value || '-'}</Text>
                </View>
            )}
        </View>
    );

    // ─────────────────────────────────────────────
    // Render Two-Column Row
    // ─────────────────────────────────────────────
    const renderTwoColumnRow = () => (
        <View style={styles.twoColumnRow}>
            <View style={styles.halfColumn}>
                <Text style={styles.label}>{'BRANCH NAME'}</Text>
                {isEditing ? (
                    <TextInput
                        style={[styles.input, styles.inputText]}
                        value={bankData.branch_name}
                        onChangeText={(text) => setBankData({ ...bankData, branch_name: text })}
                        placeholder="City center"
                        placeholderTextColor={COLORS.textPlaceholder}
                    />
                ) : (
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{bankData.branch_name || '-'}</Text>
                    </View>
                )}
            </View>
            <View style={styles.halfColumn}>
                <Text style={styles.label}>{'IFSC CODE'}</Text>
                {isEditing ? (
                    <TextInput
                        style={[styles.input, styles.inputText]}
                        value={bankData.ifsc_code}
                        onChangeText={(text) => setBankData({ ...bankData, ifsc_code: text })}
                        placeholder="SBIN000123"
                        placeholderTextColor={COLORS.textPlaceholder}
                        autoCapitalize="characters"
                    />
                ) : (
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{bankData.ifsc_code || '-'}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    // ─────────────────────────────────────────────
    // Account Type Modal
    // ─────────────────────────────────────────────
    const renderAccountTypeModal = () => (
        <Modal
            visible={showAccountTypeModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAccountTypeModal(false)}
        >
            <TouchableWithoutFeedback onPress={() => setShowAccountTypeModal(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Account Type</Text>
                                <TouchableOpacity
                                    onPress={() => setShowAccountTypeModal(false)}
                                    style={styles.modalCloseBtn}
                                >
                                    <CloseIcon color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {['Savings Account', 'Current Account', 'Salary Account'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.optionItem,
                                        bankData.account_type === type && styles.optionItemActive,
                                    ]}
                                    onPress={() => {
                                        setBankData({ ...bankData, account_type: type });
                                        setShowAccountTypeModal(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        bankData.account_type === type && styles.optionTextActive,
                                    ]}>
                                        {type}
                                    </Text>
                                    {bankData.account_type === type && (
                                        <CheckIcon color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    // ─────────────────────────────────────────────
    // Loading State
    // ─────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading bank details...</Text>
            </View>
        );
    }

    // ─────────────────────────────────────────────
    // Main Render
    // ─────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* ── Top App Bar ── */}
            <View style={[styles.header, { paddingTop: safeAreaInsets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <BackArrowIcon color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Bank Details</Text>

                    <TouchableOpacity
                        onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
                        style={styles.saveButton}
                        disabled={saving}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'SAVING...' : isEditing ? 'SAVE' : 'EDIT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Form Content ── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        {renderInput(
                            'Account Holder Name',
                            bankData.account_holder_name,
                            'account_holder_name',
                            'Enter full name as per bank records',
                        )}
                        {renderInput(
                            'Account Number',
                            bankData.account_number,
                            'account_number',
                            'Enter account number',
                            'numeric',
                            'none',
                            true,
                        )}
                        {renderInput(
                            'Account Type',
                            bankData.account_type,
                            'account_type',
                            'Select account type',
                        )}
                        {renderInput(
                            'Bank Name',
                            bankData.bank_name,
                            'bank_name',
                            'e.g. JPMorgan Chase',
                        )}
                        {renderTwoColumnRow()}
                    </View>

                    {/* ── Save Button ── */}
                    {isEditing && (
                        <TouchableOpacity
                            onPress={handleSave}
                            activeOpacity={0.85}
                            style={styles.ctaButton}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <View style={styles.ctaContent}>
                                    <Text style={styles.ctaText}>Save Bank Account</Text>
                                    <ChevronRightIcon color={COLORS.white} />
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* ── Secure Storage Notice ── */}
                    <View style={styles.secureNotice}>
                        <View style={styles.secureIconRow}>
                            <ShieldCheckIcon color={COLORS.textTertiary} />
                            <Text style={styles.secureTitle}>SECURE 256-BIT ENCRYPTION</Text>
                        </View>
                        <Text style={styles.secureDescription}>
                            Your bank details are encrypted and stored securely. We never share your sensitive information with third parties.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderAccountTypeModal()}
        </View>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    // ── Header ──
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    saveButton: {
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    saveButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.8,
    },

    // ── Scroll & Form ──
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 40,
    },
    formContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },

    // ── Input Group ──
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 1.5,
        marginBottom: 8,
        paddingLeft: 4,
    },
    input: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 16 : 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textPrimary,
        flex: 1,
    },
    placeholderText: {
        color: COLORS.textPlaceholder,
    },
    valueContainer: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    },
    value: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },

    // ── Two Column ──
    twoColumnRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    halfColumn: {
        flex: 1,
    },

    // ── CTA Button ──
    ctaButton: {
        marginHorizontal: 24,
        marginTop: 12,
        marginBottom: 32,
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    ctaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },

    // ── Secure Notice ──
    secureNotice: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        alignItems: 'center',
    },
    secureIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    secureTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textTertiary,
        letterSpacing: 1.2,
    },
    secureDescription: {
        fontSize: 11,
        lineHeight: 17,
        color: COLORS.textTertiary,
        textAlign: 'center',
        maxWidth: 280,
    },

    // ── Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    optionItemActive: {
        backgroundColor: COLORS.primaryLight,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    optionTextActive: {
        color: COLORS.primary,
    },
});

export default TruckerBankDetails;
