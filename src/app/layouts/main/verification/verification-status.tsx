import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Space } from "@truckmitr/src/app/components";
import { hitSlop } from "@truckmitr/src/app/functions";
import { useColor, useResponsiveScale } from "@truckmitr/src/app/hooks";
import { NavigatorParams } from "@truckmitr/src/stacks/stacks";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { END_POINTS } from '@truckmitr/src/utils/config';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

const VerificationStatusScreen = () => {
    const navigation = useNavigation<NavigatorProp>();
    const safeAreaInsets = useSafeAreaInsets();
    const { responsiveWidth, responsiveFontSize, responsiveHeight } = useResponsiveScale();
    const { t } = useTranslation();
    const colors = useColor();

    const [loading, setLoading] = useState(true);
    const [verificationData, setVerificationData] = useState<any>(null);

    const _goback = () => {
        navigation.goBack()
    }

    // Fetch verification status from API
    const fetchVerificationStatus = useCallback(async () => {
        try {
            const response: any = await axiosInstance.get(
                END_POINTS?.DRIVERVERIFICATIONSTATUS,
            );

            if (response?.data?.success && response?.data?.data) {
                const data = response.data.data;
                console.log('Verification API Response:', {
                    overall_status: data.overall_status,
                    verification_status: data.verification_status,
                    final_status: data.verification_status?.final_status,
                    is_started: data.verification_status?.is_started
                });
                setVerificationData(data);
            }
        } catch (error) {
            console.log('Error fetching verification status:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get verification status from API data
    const getVerificationStatus = () => {
        if (!verificationData?.verification_status) {
            return {
                status: 'pending',
                steps: [
                    { label: 'Pending', type: 'clock' as const, isActive: true },
                    { label: 'In Progress', type: 'clock' as const, isActive: false },
                    { label: 'Verified', type: 'check' as const, isActive: false },
                    { label: 'Discrepancy', type: 'x' as const, isActive: false },
                ],
            };
        }

        const status = verificationData.verification_status;
        const finalStatus = status.final_status;
        const overallStatus = verificationData.overall_status;

        // Check if verification is completed (check multiple conditions)
        const isCompleted = overallStatus === 'completed' ||
            overallStatus === 'verified' ||
            finalStatus === 'completed' ||
            finalStatus === 'verified';

        // Determine current status and active steps
        let activeStepIndex = 0;
        if (status.is_started) {
            activeStepIndex = 1; // In Progress
        }
        if (isCompleted) {
            activeStepIndex = 2; // Verified
        } else if (finalStatus === 'rejected' || finalStatus === 'discrepancy') {
            activeStepIndex = 3; // Discrepancy
        }

        const steps = [
            {
                label: 'Pending',
                type: 'clock' as const,
                isActive: activeStepIndex >= 0,
            },
            {
                label: 'In Progress',
                type: 'clock' as const,
                isActive: activeStepIndex >= 1,
            },
            {
                label: 'Verified',
                type: 'check' as const,
                isActive: activeStepIndex >= 2 && isCompleted,
            },
            {
                label: 'Discrepancy',
                type: 'x' as const,
                isActive:
                    activeStepIndex >= 3 &&
                    (finalStatus === 'rejected' || finalStatus === 'discrepancy'),
            },
        ];

        // Return the appropriate status
        let returnStatus = finalStatus || 'pending';
        if (isCompleted) {
            returnStatus = 'completed';
        }

        return { status: returnStatus, steps };
    };

    const { status, steps } = getVerificationStatus();

    // Debug logging to understand the verification data
    console.log('VerificationStatusScreen - verificationData:', {
        overall_status: verificationData?.overall_status,
        verification_status: verificationData?.verification_status,
        final_status: verificationData?.verification_status?.final_status,
        is_started: verificationData?.verification_status?.is_started,
        determined_status: status
    });

    useEffect(() => {
        fetchVerificationStatus();
    }, [fetchVerificationStatus]);

    useFocusEffect(
        useCallback(() => {
            fetchVerificationStatus();
        }, [fetchVerificationStatus])
    );

    // Helper functions for status display
    const getStatusDisplayText = (status: string) => {
        switch (status) {
            case 'verified':
            case 'completed':
                return t('verified');
            case 'pending':
                return t('pending');
            case 'rejected':
                return t('rejected');
            case 'in_progress':
                return t('inProgress');
            default:
                return status || t('pending');
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'verified':
            case 'completed':
                return {
                    backgroundColor: colors.greenOpacitiy(0.2),
                    borderColor: colors.greenOpacitiy(1),
                };
            case 'rejected':
                return {
                    backgroundColor: colors.blackOpacity(0.1),
                    borderColor: colors.blackOpacity(0.5),
                };
            case 'in_progress':
                return {
                    backgroundColor: colors.royalBlueOpacity(0.2),
                    borderColor: colors.royalBlue,
                };
            case 'pending':
            default:
                return {
                    backgroundColor: colors.blackOpacity(0.1),
                    borderColor: colors.blackOpacity(0.3),
                };
        }
    };

    const getStatusTextStyle = (status: string) => {
        switch (status) {
            case 'verified':
            case 'completed':
                return { color: colors.greenOpacitiy(1) };
            case 'rejected':
                return { color: colors.blackOpacity(0.8) };
            case 'in_progress':
                return { color: colors.royalBlue };
            case 'pending':
            default:
                return { color: colors.blackOpacity(0.7) };
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <Space height={safeAreaInsets.top} />
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', padding: responsiveWidth(3) }}>
                <TouchableOpacity hitSlop={hitSlop(10)} onPress={_goback} style={{ height: responsiveFontSize(4), width: responsiveFontSize(4), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 100, zIndex: 100 }}>
                    <Ionicons name={'chevron-back'} size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={{ width: responsiveWidth(100), fontSize: responsiveFontSize(2.2), color: colors.royalBlue, fontWeight: 'bold', textAlign: 'center', position: 'absolute', zIndex: 1 }}>{t(`verificationStatus`)}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(8) }}>
                {/* Status Tracker */}
                <Text style={styles.sectionTitle}>{t('statusTracker')}</Text>
                <View style={styles.statusWrapper}>
                    {steps.map((step, index) => (
                        <StatusStep
                            key={index}
                            label={step.label}
                            type={step.type}
                            isActive={step.isActive}
                            isLast={index === steps.length - 1}
                        />
                    ))}
                </View>

                {/* TAT */}
                <Text style={styles.sectionTitle}>
                    {t('estimatedTurnaroundTime')}
                </Text>
                <View style={styles.tatWrapper}>
                    <TatRow title={t('idVerification')} value="1-2 days" />
                    <TatRow title={t('addressVerification')} value="2-14 days" />
                    <TatRow title={t('courtVerification')} value="1-2 days" />
                </View>

                {/* Individual Verification Statuses */}
                {verificationData?.verification_status && (
                    <View style={styles.verificationDetailsCard}>
                        <Text style={styles.missingTitle}>
                            {t('verificationDetails')}
                        </Text>
                        <Text style={styles.missingHeader}>
                            {t('currentVerificationStatus')}
                        </Text>

                        {/* ID Verification Status */}
                        <View style={styles.statusRow}>
                            <Text style={styles.rowStatusLabel}>{t('idVerification')}</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    getStatusBadgeStyle(
                                        verificationData.verification_status
                                            .id_verification_status,
                                    ),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        getStatusTextStyle(
                                            verificationData.verification_status
                                                .id_verification_status,
                                        ),
                                    ]}
                                >
                                    {getStatusDisplayText(
                                        verificationData.verification_status
                                            .id_verification_status,
                                    )}
                                </Text>
                            </View>
                        </View>

                        {/* Address Verification Status */}
                        <View style={styles.statusRow}>
                            <Text style={styles.rowStatusLabel}>
                                {t('addressVerification')}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    getStatusBadgeStyle(
                                        verificationData.verification_status
                                            .address_verification_status,
                                    ),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        getStatusTextStyle(
                                            verificationData.verification_status
                                                .address_verification_status,
                                        ),
                                    ]}
                                >
                                    {getStatusDisplayText(
                                        verificationData.verification_status
                                            .address_verification_status,
                                    )}
                                </Text>
                            </View>
                        </View>

                        {/* Court Check Status */}
                        <View style={styles.statusRow}>
                            <Text style={styles.rowStatusLabel}>{t('courtVerification')}</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    getStatusBadgeStyle(
                                        verificationData.verification_status.court_check_status,
                                    ),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        getStatusTextStyle(
                                            verificationData.verification_status.court_check_status,
                                        ),
                                    ]}
                                >
                                    {getStatusDisplayText(
                                        verificationData.verification_status.court_check_status,
                                    )}
                                </Text>
                            </View>
                        </View>

                        {/* Notes */}
                        {verificationData.verification_status.notes && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.notesHeading}>{t('noteByAdmin')}</Text>
                                <Text style={styles.missingSub}>
                                    {verificationData.verification_status.notes}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Missing Documents */}
                {verificationData?.document_status?.missing_documents?.length > 0 && (
                    <View style={styles.verificationDetailsCard}>
                        <Text style={styles.missingTitle}>{t('missingDocuments')}</Text>
                        <Text style={styles.missingHeader}>
                            {t('pleaseUploadRequiredDocuments')}
                        </Text>
                        <Text style={styles.missingSub}>
                            {t('verificationOnHoldMissingDocuments')}
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    // onPress={}
                    activeOpacity={0.7}
                    style={{
                        height: responsiveHeight(5.8),
                        width: responsiveWidth(90),
                        backgroundColor: colors.royalBlue,
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center',
                        borderRadius: 8,
                    }}>
                    <Text style={{ color: colors.white, fontSize: responsiveFontSize(2), fontWeight: '500' }}>{t(`downloadReport`)}</Text>

                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

interface StatusStepProps {
    label: string;
    type: 'clock' | 'check' | 'x';
    isActive: boolean;
    isLast: boolean;
}

const StatusStep = ({ label, type, isActive, isLast }: StatusStepProps) => {
    const icons = {
        clock: (
            <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
        ),
        check: (
            <Path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
        ),
        x: (
            <Path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        ),
    };

    return (
        <View style={styles.statusItem}>
            <View style={styles.statusContent}>
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                    <Svg width={24} height={24} fill={isActive ? "#fff" : "#888"} viewBox="0 0 256 256">
                        {icons[type]}
                    </Svg>
                </View>
                <Text style={[styles.statusLabel, isActive && styles.activeStatusLabel]}>{label}</Text>
            </View>
            {!isLast && (
                <View style={[styles.connectorLine, isActive && styles.activeConnectorLine]} />
            )}
        </View>
    );
};

interface TatRowProps {
    title: string;
    value: string;
}

const TatRow = ({ title, value }: TatRowProps) => (
    <View style={styles.tatRow}>
        <Text style={styles.tatTitle}>{title}</Text>
        <Text style={styles.tatValue}>{value}</Text>
    </View>
);


export default VerificationStatusScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        justifyContent: "space-between",
    },
    iconButton: {
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    headerText: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        marginRight: 48, // balance arrow space
        color: "#111418",
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: 'black',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    statusWrapper: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "#fff",
        borderColor: "#e8e8e8",
    },
    statusItem: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        position: 'relative',
    },
    statusContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0f2f5",
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activeIconContainer: {
        backgroundColor: "green",
    },
    statusLabel: {
        fontSize: 14,
        color: "#888",
        fontWeight: '500',
    },
    activeStatusLabel: {
        color: "green",
        fontWeight: 'bold',
    },
    tatWrapper: {
        marginBottom: 16,
    },
    tatRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e8e8e8",
    },
    tatTitle: { fontSize: 14, color: "#60758a" },
    tatValue: { fontSize: 14, color: "#111418", fontWeight: "500" },
    card: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
    },
    missingTitle: { fontSize: 13, color: "#60758a", marginBottom: 4 },
    missingHeader: { fontSize: 16, fontWeight: "bold", color: "#111418", marginBottom: 8 },
    missingSub: { fontSize: 14, color: "#60758a", lineHeight: 20 },
    documentImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginLeft: 8,
        backgroundColor: "#f0f2f5"
    },
    downloadBtn: {
        paddingVertical: 12,
        marginHorizontal: 16,
        borderRadius: 24,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 50,
    },
    downloadText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    connectorLine: {
        position: 'absolute',
        left: 28,
        top: 48,
        width: 2,
        height: 32,
        backgroundColor: "#E0E0E0",
    },
    activeConnectorLine: {
        backgroundColor: "green",
    },
    verificationDetailsCard: {
        flexDirection: "column",
        padding: 16,
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e8e8e8",
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    rowStatusLabel: {
        fontSize: 14,
        color: "#111418",
        fontWeight: "500",
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 80,
        alignItems: "center",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    notesHeading: {
        fontSize: 13,
        color: "#60758a",
        fontWeight: "600",
        marginBottom: 4,
    },
});