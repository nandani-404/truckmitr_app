
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useColor, useResponsiveScale, useStatusBarStyle } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Space } from '@truckmitr/src/app/components';
import { useSelector, useDispatch } from 'react-redux';
import { userAction } from '@truckmitr/src/redux/actions/user.action';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Dropdown } from 'react-native-element-dropdown';

export default function PunctureBankDetailsEdit() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const colors = useColor();
    const { responsiveFontSize, responsiveWidth } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    useStatusBarStyle('dark-content');
    const { user } = useSelector((state: any) => state.user);
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);
    const [bankDetails, setBankDetails] = useState({
        accountHolderName: user?.bank_details?.account_holder_name || '',
        accountNumber: user?.bank_details?.account_number || '',
        bankName: user?.bank_details?.bank_name || '',
        branchName: user?.bank_details?.branch_name || '',
        ifscCode: user?.bank_details?.ifsc_code || '',
        accountType: user?.bank_details?.account_type || '',
        upiId: user?.bank_details?.upi_id || '',
    });

    const accountTypes = [
        { label: 'Savings', value: 'savings' },
        { label: 'Current', value: 'current' },
    ];

    const handleUpdate = async () => {
        setLoading(true);
        try {
            // Construct updated bank details object
            const updatedBankDetails = {
                account_holder_name: bankDetails.accountHolderName,
                account_number: bankDetails.accountNumber,
                bank_name: bankDetails.bankName,
                branch_name: bankDetails.branchName,
                ifsc_code: bankDetails.ifscCode,
                account_type: bankDetails.accountType,
                upi_id: bankDetails.upiId,
            };

            // Update user object in Redux
            const updatedUser = {
                ...user,
                bank_details: updatedBankDetails
            };

            dispatch(userAction({ user: updatedUser }));

            // Allow a brief delay for visual feedback
            setTimeout(() => {
                setLoading(false);
                navigation.goBack();
            }, 500);
        } catch (error) {
            console.error('Error updating bank details:', error);
            setLoading(false);
        }
    };

    const renderInput = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        placeholder: string,
        isDropdown: boolean = false
    ) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t(label)?.toUpperCase()}</Text>
            {isDropdown ? (
                <Dropdown
                    style={[styles.textInput, styles.dropdown]}
                    data={accountTypes}
                    labelField="label"
                    valueField="value"
                    placeholder={t(placeholder) || 'Select Account Type'}
                    placeholderStyle={{ color: '#999', fontSize: 13 }}
                    selectedTextStyle={{ fontSize: 13, color: '#212529' }}
                    value={value}
                    onChange={item => onChangeText(item.value)}
                    renderRightIcon={() => (
                        <Ionicons name="chevron-down" size={20} color="#999" />
                    )}
                />
            ) : (
                <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={t(placeholder)}
                    placeholderTextColor="#999"
                />
            )}
            <View style={styles.divider} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>
                    {t('bankDetails') || 'Bank Details'}
                </Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                    <Text style={[styles.saveButtonText, { color: colors.royalBlue }]}>
                        {t('save') || 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
            >
                <Space height={10} />
                {renderInput('accountHolderName', bankDetails.accountHolderName, (text) => setBankDetails({ ...bankDetails, accountHolderName: text }), 'enterAccountHolderName')}
                {renderInput('accountNumber', bankDetails.accountNumber, (text) => setBankDetails({ ...bankDetails, accountNumber: text }), 'enterAccountNumber')}
                {renderInput('bankName', bankDetails.bankName, (text) => setBankDetails({ ...bankDetails, bankName: text }), 'enterBankName')}
                {renderInput('branchName', bankDetails.branchName, (text) => setBankDetails({ ...bankDetails, branchName: text }), 'enterBranchName')}
                {renderInput('ifscCode', bankDetails.ifscCode, (text) => setBankDetails({ ...bankDetails, ifscCode: text }), 'enterIfscCode')}
                {/* Account Type Dropdown */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('accountType')?.toUpperCase()}</Text>
                    <Dropdown
                        style={[styles.textInput, styles.dropdown]}
                        data={accountTypes}
                        labelField="label"
                        valueField="value"
                        placeholder={t('selectAccountType') || 'Select Account Type'}
                        placeholderStyle={{ color: '#999', fontSize: 13 }}
                        selectedTextStyle={{ fontSize: 13, color: '#212529' }}
                        value={bankDetails.accountType}
                        onChange={item => setBankDetails({ ...bankDetails, accountType: item.value })}
                        renderRightIcon={() => (
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        )}
                    />
                    <View style={styles.divider} />
                </View>

                {/* UPI ID Input (Optional) */}
                {renderInput('upiIdOptional', bankDetails.upiId, (text) => setBankDetails({ ...bankDetails, upiId: text.replace(/\s/g, '') }), 'enterUpiId')}

                <Space height={20} />

                {/* Update Button */}
                <TouchableOpacity
                    style={[styles.updateButton, { backgroundColor: '#004aad' }]}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.updateButtonText}>{t('updateBankAccount') || 'Update Bank Account'}</Text>
                    )}
                </TouchableOpacity>

                <Space height={20} />

                {/* Security Message Banner */}
                <View style={[styles.securityBanner, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                    <View style={styles.securityIconContainer}>
                        <MaterialCommunityIcons name="shield-check" size={20} color="#15803D" />
                    </View>
                    <Text style={[styles.securityText, { color: '#166534' }]}>
                        {t('bankDetailsEncryptionMessage') || 'Your bank details are encrypted and stored securely for payout purposes only.'}
                    </Text>
                </View>

                <Space height={20} />
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        padding: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        color: '#999', // Matches screenshot gray label
        letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: '#EAEAEA', // Light gray background matching screenshot
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 13,
        color: '#212529',
    },
    dropdown: {
        borderWidth: 0,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: 'transparent',
    },
    updateButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    updateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    securityBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    securityIconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    securityText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
    }
});
