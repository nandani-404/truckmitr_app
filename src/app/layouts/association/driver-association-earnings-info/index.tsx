import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParams } from '@truckmitr/stacks/stacks';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { Space } from '@truckmitr/src/app/components';
import { hitSlop } from '@truckmitr/src/app/functions';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type NavigatorProp = NativeStackNavigationProp<NavigatorParams, keyof NavigatorParams>;

export default function DriverAssociationEarningsInfo() {
    const { t } = useTranslation();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation<NavigatorProp>();
    const colors = useColor();
    const { shadow } = useShadow();
    const { responsiveFontSize, responsiveHeight } = useResponsiveScale();

    const goBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Space height={safeAreaInsets.top} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    hitSlop={hitSlop(10)}
                    onPress={goBack}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.royalBlue }]}>
                    {t('earningsChart') || 'Earnings Chart'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: responsiveHeight(4) }}
            >
                {/* Section 1: Hiring Commission */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                            <MaterialCommunityIcons name="briefcase-check" size={22} color="#EA580C" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                {t('hiringCommission')}
                            </Text>
                            <Text style={styles.sectionSubtitle}>
                                {t('premiumAndSuperPremiumJobs')}
                            </Text>
                        </View>
                    </View>

                    {/* Job Pricing Table */}
                    <View style={styles.tableContainer}>
                        <Text style={styles.tableTitle}>{t('jobPricing')}</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>{t('jobType')}</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>{t('price')}</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.badge, { backgroundColor: '#F3E8FF' }]}>
                                        <Text style={[styles.badgeText, { color: '#9333EA' }]}>{t('premiumLabel')}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.tableValue, { flex: 1, textAlign: 'right' }]}>₹1,999</Text>
                            </View>
                            <View style={styles.tableDivider} />
                            <View style={styles.tableRow}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                                        <MaterialCommunityIcons name="crown" size={12} color="#D97706" />
                                        <Text style={[styles.badgeText, { color: '#D97706', marginLeft: 4 }]}>{t('superPremiumLabel')}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.tableValue, { flex: 1, textAlign: 'right', color: '#D97706', fontWeight: '700' }]}>₹2,999</Text>
                            </View>
                        </View>
                    </View>

                    {/* Commission Rates Table */}
                    <View style={styles.tableContainer}>
                        <Text style={styles.tableTitle}>{t('yourCommissionHighMotivation')}</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>{t('jobType')}</Text>
                                <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'center' }]}>{t('rate')}</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>{t('commission')}</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableValue, { flex: 1.2 }]}>{t('premiumJobType')}</Text>
                                <View style={{ flex: 0.8, alignItems: 'center' }}>
                                    <View style={[styles.rateBadge, { backgroundColor: '#DCFCE7' }]}>
                                        <Text style={[styles.rateBadgeText, { color: '#16A34A' }]}>15%</Text>
                                    </View>
                                </View>
                                <Text style={[styles.tableValue, { flex: 1, textAlign: 'right', color: '#16A34A', fontWeight: '700' }]}>₹300</Text>
                            </View>
                            <View style={styles.tableDivider} />
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableValue, { flex: 1.2 }]}>{t('superPremium')}</Text>
                                <View style={{ flex: 0.8, alignItems: 'center' }}>
                                    <View style={[styles.rateBadge, { backgroundColor: '#FEF3C7' }]}>
                                        <Text style={[styles.rateBadgeText, { color: '#D97706' }]}>20%</Text>
                                    </View>
                                </View>
                                <Text style={[styles.tableValue, { flex: 1, textAlign: 'right', color: '#D97706', fontWeight: '700' }]}>₹600</Text>
                            </View>
                        </View>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>📌</Text>
                            <Text style={styles.benefitText}>{t('paidWhenSuccessful')}</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.checkIcon}>✔️</Text>
                            <Text style={styles.benefitText}>{t('preventsFakePostings')}</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.checkIcon}>✔️</Text>
                            <Text style={styles.benefitText}>{t('encouragesQualityMatchmaking')}</Text>
                        </View>
                    </View>
                </View>

                {/* Section 2: Association Motivation System (Gamification) */}


                {/* Section 3: Driver Subscription Commission */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                            <MaterialCommunityIcons name="account-cash" size={22} color="#16A34A" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                {t('driverSubscriptionCommission')}
                            </Text>
                            <Text style={styles.sectionSubtitle}>
                                {t('automatedPaymentLogic')}
                            </Text>
                        </View>
                    </View>

                    {/* Commission Table */}
                    <View style={styles.tableContainer}>
                        <Text style={styles.tableTitle}>{t('commissionRecommendation')}</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>{t('plan')}</Text>
                                <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'center' }]}>{t('price')}</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>{t('yourCommission')}</Text>
                            </View>

                            {/* Job Ready */}
                            <View style={styles.tableRow}>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={[styles.planDot, { backgroundColor: '#22C55E' }]} />
                                    <Text style={styles.tableValue}>{t('jobReady')}</Text>
                                </View>
                                <Text style={[styles.tableValue, { flex: 0.8, textAlign: 'center' }]}>₹99</Text>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                    <Text style={[styles.percentText, { color: '#22C55E' }]}>20%</Text>
                                    <Text style={[styles.tableValue, { color: '#22C55E', fontWeight: '700' }]}>(₹20)</Text>
                                </View>
                            </View>
                            <View style={styles.tableDivider} />

                            {/* Verified */}
                            <View style={styles.tableRow}>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={[styles.planDot, { backgroundColor: '#3B82F6' }]} />
                                    <Text style={styles.tableValue}>{t('verified')}</Text>
                                </View>
                                <Text style={[styles.tableValue, { flex: 0.8, textAlign: 'center' }]}>₹199</Text>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                    <Text style={[styles.percentText, { color: '#3B82F6' }]}>25%</Text>
                                    <Text style={[styles.tableValue, { color: '#3B82F6', fontWeight: '700' }]}>(₹50)</Text>
                                </View>
                            </View>
                            <View style={styles.tableDivider} />

                            {/* Trusted */}
                            <View style={styles.tableRow}>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={[styles.planDot, { backgroundColor: '#8B5CF6' }]} />
                                    <Text style={styles.tableValue}>{t('trusted')}</Text>
                                </View>
                                <Text style={[styles.tableValue, { flex: 0.8, textAlign: 'center' }]}>₹499</Text>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                    <Text style={[styles.percentText, { color: '#8B5CF6' }]}>30%</Text>
                                    <Text style={[styles.tableValue, { color: '#8B5CF6', fontWeight: '700' }]}>(₹150)</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Why Increasing % */}
                    {/* <View style={styles.whyContainer}>
                        <View style={styles.whyHeader}>
                            <Text style={styles.whyIcon}>�</Text>
                            <Text style={styles.whyTitle}>{t('whyIncreasingPercent')}</Text>
                        </View>
                        <View style={styles.whyContent}>
                            <View style={styles.whyItem}>
                                <View style={styles.whyBullet} />
                                <Text style={styles.whyText}>{t('pushesTowardsHigherQuality')}</Text>
                            </View>
                            <View style={styles.whyItem}>
                                <View style={styles.whyBullet} />
                                <Text style={styles.whyText}>{t('betterPlatformReputation')}</Text>
                            </View>
                            <View style={styles.whyItem}>
                                <View style={styles.whyBullet} />
                                <Text style={styles.whyText}>{t('lowerChurn')}</Text>
                            </View>
                        </View>
                    </View> */}
                </View>

                <Space height={responsiveHeight(2)} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    sectionContainer: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    tableContainer: {
        marginBottom: 16,
    },
    tableTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    table: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 8,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    tableValue: {
        fontSize: 14,
        color: '#374151',
    },
    tableDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    rateBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    rateBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    levelIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bonusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    bonusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    planDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    percentText: {
        fontSize: 12,
        fontWeight: '600',
    },
    benefitsContainer: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    benefitIcon: {
        fontSize: 14,
    },
    checkIcon: {
        fontSize: 14,
    },
    benefitText: {
        fontSize: 14,
        color: '#166534',
        flex: 1,
    },
    whyContainer: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    whyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    whyIcon: {
        fontSize: 14,
    },
    whyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
    },
    whyContent: {
        gap: 6,
    },
    whyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    whyBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D97706',
    },
    whyText: {
        fontSize: 13,
        color: '#92400E',
        flex: 1,
    },
});
