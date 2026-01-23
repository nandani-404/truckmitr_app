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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import axiosInstance from '@truckmitr/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/utils/config/index';

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
        if (!userId) return;
        try {
            setLoading(true);
            const response = await axiosInstance.get(END_POINTS.GET_PROFILE);
            if (response?.data?.status) {
                const data = response.data.user;
                setBankData({
                    account_number: data?.account_number || '',
                    account_holder_name: data?.account_holder_name || '',
                    bank_name: data?.bank_name || '',
                    branch_name: data?.branch_name || '',
                    ifsc_code: data?.ifsc_code || '',
                    account_type: data?.account_type || '',
                });
            }
        } catch (error) {
            console.error('Error fetching bank details:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchBankDetails();
    }, [fetchBankDetails]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await axiosInstance.post(END_POINTS.UPDATE_PROFILE_FOREMAN, bankData);
            if (response?.data?.status) {
                console.log('Successfully saved bank data');
                setIsEditing(false);
                fetchBankDetails(); // Refresh data
            }
        } catch (error) {
            console.error('Error saving bank details:', error);
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
                    placeholder={`Enter ${label}`}
                    placeholderTextColor={colors.blackOpacity(0.3)}
                />
            ) : (
                <View style={styles.valueContainer}>
                    <Text style={[styles.value, { color: colors.black, fontSize: responsiveFontSize(1.9) }]}>
                        {value || '-'}
                    </Text>
                </View>
            )}
        </View>
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
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
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
});

export default BankDetails;