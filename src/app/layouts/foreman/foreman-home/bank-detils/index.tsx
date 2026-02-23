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
    Alert,
    Modal,
    TouchableWithoutFeedback,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';
import { showToast } from '@truckmitr/src/app/hooks/toast';

const BankDetails = () => {
    const navigation = useNavigation();
    const safeAreaInsets = useSafeAreaInsets();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveFontSize } = useResponsiveScale();
    const userId = useSelector((state: RootState) => state.user?.user?.id);
    const user = useSelector((state: RootState) => state.user?.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
    const [bankData, setBankData] = useState({
        account_number: user?.account_number || '',
        account_holder_name: user?.account_holder_name || '',
        bank_name: user?.bank_name || '',
        branch_name: user?.branch_name || '',
        ifsc_code: user?.ifsc_code || '',
        account_type: user?.account_type || '',
    });

    // Fetch bank details from API
    const fetchBankDetails = useCallback(async () => {
        if (!userId) {
            setError('User not found. Please log in again.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(END_POINTS.FOREMAN_BANK_DETAILS_FETCH(userId));

            if (response?.data?.success) {
                const data = response?.data?.bank_details || response?.data?.user || response?.data;
                const workDetails = response?.data?.user || user;
                setBankData({
                    account_number: data?.account_number || '',
                    account_holder_name: data?.account_holder_name || '',
                    bank_name: data?.bank_name || '',
                    branch_name: data?.branch_name || '',
                    ifsc_code: data?.ifsc_code || '',
                    account_type: data?.account_type || '',
                });
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
    }, [userId]);

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
            const payload = {
                ...bankData,
                user_id: userId,
                unique_id: user?.unique_id || '',
            };
            const response = await axiosInstance.post(END_POINTS.FOREMAN_BANK_DETAILS_UPDATE, payload);

            if (response?.data?.success) {
                showToast('Details updated successfully!');
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

    const renderInput = (
        label: string,
        value: string,
        key: keyof typeof bankData,
        keyboardType: any = 'default',
        autoCapitalize: any = 'words'
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.4) }]}>
                {label.toUpperCase()}
            </Text>
            {isEditing ? (
                key === 'account_type' ? (
                    <Pressable
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.blackOpacity(0.04),
                                paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }
                        ]}
                        onPress={() => setShowAccountTypeModal(true)}
                    >
                        <Text style={{
                            color: value ? colors.black : colors.blackOpacity(0.3),
                            fontSize: responsiveFontSize(1.8),
                            fontWeight: '500',
                        }}>
                            {value || `Select ${label}`}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.blackOpacity(0.4)} />
                    </Pressable>
                ) : (
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.blackOpacity(0.04),
                                color: colors.black,
                                fontSize: responsiveFontSize(1.8),
                                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                            }
                        ]}
                        value={value}
                        onChangeText={(text) => setBankData({ ...bankData, [key]: text })}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        maxLength={20}
                        placeholder={`Enter ${label}`}
                        placeholderTextColor={colors.blackOpacity(0.3)}
                    />
                )
            ) : (
                <View style={styles.valueContainer}>
                    <Text style={[styles.value, { color: colors.black, fontSize: responsiveFontSize(1.9) }]}>
                        {value || '-'}
                    </Text>
                </View>
            )}
        </View>
    );

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
                        <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.black }]}>Select Account Type</Text>
                                <TouchableOpacity onPress={() => setShowAccountTypeModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.black} />
                                </TouchableOpacity>
                            </View>
                            {['Savings', 'Current'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.optionItem,
                                        bankData.account_type === type && { backgroundColor: colors.royalBlue + '10' }
                                    ]}
                                    onPress={() => {
                                        setBankData({ ...bankData, account_type: type });
                                        setShowAccountTypeModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        { color: bankData.account_type === type ? colors.royalBlue : colors.black }
                                    ]}>
                                        {type}
                                    </Text>
                                    {bankData.account_type === type && (
                                        <Ionicons name="checkmark" size={20} color={colors.royalBlue} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );


    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color={colors.royalBlue} />
                <Text style={[styles.loadingText, { color: colors.blackOpacity(0.5) }]}>
                    Loading bank details...
                </Text>
            </View>
        );
    }

    /** Skip error screen, use toasts instead as per requirement */

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingTop: safeAreaInsets.top, backgroundColor: colors.white }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.black} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.black, fontSize: responsiveFontSize(2.2) }]}>
                        Bank Details
                    </Text>
                    <TouchableOpacity
                        onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
                        style={styles.editButton}
                        disabled={saving}
                    >
                        <Text style={[styles.editButtonText, { color: colors.royalBlue, fontSize: responsiveFontSize(1.7) }]}>
                            {saving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.flatContainer}>
                        {renderInput('Account Holder Name', bankData.account_holder_name, 'account_holder_name')}
                        <View style={styles.divider} />
                        {renderInput('Account Number', bankData.account_number, 'account_number', 'numeric')}
                        <View style={styles.divider} />
                        {renderInput('Bank Name', bankData.bank_name, 'bank_name')}
                        <View style={styles.divider} />
                        {renderInput('Branch Name', bankData.branch_name, 'branch_name')}
                        <View style={styles.divider} />
                        {renderInput('IFSC Code', bankData.ifsc_code, 'ifsc_code', 'default', 'characters')}
                        <View style={styles.divider} />
                        {renderInput('Account Type', bankData.account_type, 'account_type')}
                    </View>

                    {isEditing && (
                        <TouchableOpacity
                            onPress={handleSave}
                            activeOpacity={0.8}
                            style={[styles.saveButton, { backgroundColor: colors.royalBlue, ...shadow }]}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={[styles.saveButtonText, { color: colors.white, fontSize: responsiveFontSize(2) }]}>
                                    Update Bank Account
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <View style={styles.noticeBox}>
                        <Ionicons name="shield-checkmark" size={18} color="#059669" />
                        <Text style={styles.noticeText}>
                            Your bank details are encrypted and stored securely for payout purposes only.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderAccountTypeModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontWeight: '700',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    editButton: {
        width: 70,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    editButtonText: {
        fontWeight: '600',
    },
    scrollContent: {
        paddingVertical: 10,
        paddingBottom: 40,
    },
    flatContainer: {
        backgroundColor: 'transparent',
        marginBottom: 24,
    },
    inputGroup: {
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    label: {
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    input: {
        borderRadius: 10,
        paddingHorizontal: 14,
        fontWeight: '500',
    },
    valueContainer: {
        minHeight: 30,
        justifyContent: 'center',
    },
    value: {
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 20,
    },
    saveButton: {
        height: 56,
        borderRadius: 14,
        marginHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    saveButtonText: {
        fontWeight: '700',
    },
    noticeBox: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginHorizontal: 20,
    },
    noticeText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        color: '#065F46',
        lineHeight: 18,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 30,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    goBackButton: {
        marginTop: 20,
        padding: 10,
    },
    goBackText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        borderRadius: 16,
        paddingTop: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default BankDetails;