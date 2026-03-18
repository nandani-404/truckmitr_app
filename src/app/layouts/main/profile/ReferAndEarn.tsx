import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Share, Modal, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Space } from '@truckmitr/src/app/components';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import FastImage from 'react-native-fast-image';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-simple-toast';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReferAndEarn = () => {
    const { t } = useTranslation();
    const colors = useColor();
    const { responsiveFontSize, responsiveWidth, responsiveHeight } = useResponsiveScale();
    const safeAreaInsets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { shadow } = useShadow();
    const { user } = useSelector((state: any) => state.user);

    const [loading, setLoading] = useState(true);
    const [referData, setReferData] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const STORAGE_BASE_URL = 'https://devtruckmitr.in/storage/app/public/';

    useEffect(() => {
        fetchReferData();
    }, []);

    const fetchReferData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/refer-earn');
            if (response.data.success) {
                setReferData(response.data.data);
            }
        } catch (error) {
            console.log('Error fetching refer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchReferData();
        setRefreshing(false);
    }, []);

    // Calculate dynamic stats and progress
    const summary = referData?.summary || { total_earned: 0, successful_referrals: 0 };
    const offer = referData?.offer || { reward_per_milestone: 100, milestone_referrals: 5 };
    const earnedRewards = referData?.earned_rewards || [];
    const referralProgress = referData?.referral_progress || [];

    const totalReferrals = summary.successful_referrals;
    const milestoneSize = offer.milestone_referrals;
    const currentProgress = totalReferrals % milestoneSize;
    const awayCount = milestoneSize - currentProgress;
    const progressPercentage = (currentProgress / milestoneSize) * 100;

    const milestoneMessage = awayCount === milestoneSize && totalReferrals > 0 
        ? t('milestoneReached', { amount: offer.reward_per_milestone, count: milestoneSize, defaultValue: `Milestone reached! Refer ${milestoneSize} more to earn another ₹${offer.reward_per_milestone}` })
        : t('referralsAway', { count: awayCount, amount: offer.reward_per_milestone, defaultValue: `You are ${awayCount} more referral away to get your another ₹${offer.reward_per_milestone}` });

    // Merged Rewards list: only show paid + pending (no locked)
    const milestonesReachedCount = Math.floor(totalReferrals / milestoneSize);
    const mergedRewards: any[] = [];
    
    // 1. Add all PAID rewards from earned_rewards
    earnedRewards.forEach((r: any, idx: number) => {
        const milestoneNum = parseInt(r.milestone) / milestoneSize;
        mergedRewards.push({
            id: `reward-paid-${idx}`,
            title: t('milestoneNth', { n: milestoneNum, defaultValue: `Milestone ${milestoneNum}` }),
            amount: parseInt(r.reward_amount),
            status: 'CLAIMED',
            screenshot: r.payment_screenshot,
            date: r.paid_at
        });
    });

    // 2. Check if there are milestones reached but NOT yet paid → show ONE pending card
    const paidMilestoneValues = earnedRewards.map((r: any) => parseInt(r.milestone));
    for (let i = 1; i <= milestonesReachedCount; i++) {
        const milestoneVal = i * milestoneSize;
        if (!paidMilestoneValues.includes(milestoneVal)) {
            mergedRewards.push({
                id: `reward-pending-${milestoneVal}`,
                title: t('milestoneNth', { n: i, defaultValue: `Milestone ${i}` }),
                amount: offer.reward_per_milestone,
                status: 'PENDING',
                message: t('paymentPending', 'Payment will shortly come to your account')
            });
        }
    }

    const handleReferNow = async () => {
        try {
            const referralCode = user?.mobile || '';
            const referralLink = `https://truckmitr.com/signup?referralCode=${referralCode}`;
            const shareMessage = t('shareReferralMessage', {
                code: referralCode,
                link: referralLink,
                defaultValue: `Hi! Join TruckMitr today and grow your trucking business. Use my referral code: ${referralCode}\n\nDownload and Register here: ${referralLink}`
            });
            
            await Share.share({
                message: shareMessage,
                title: t('referralShareTitle', 'TruckMitr Referral'),
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const copyToClipboard = () => {
        const referralCode = user?.mobile || '';
        Clipboard.setString(referralCode);
        Toast.show(t('codeCopied', 'Referral code copied!'), Toast.SHORT);
    };

    const openReceipt = (screenshot: string) => {
        setSelectedReceipt(`${STORAGE_BASE_URL}${screenshot}`);
        setShowReceiptModal(true);
    };

    const ZoomableImage = ({ uri }: { uri: string }) => {
        const scale = useSharedValue(1);
        const savedScale = useSharedValue(1);
        const translateX = useSharedValue(0);
        const translateY = useSharedValue(0);
        const savedTranslateX = useSharedValue(0);
        const savedTranslateY = useSharedValue(0);

        const pinchGesture = Gesture.Pinch()
            .onUpdate((e) => {
                scale.value = savedScale.value * e.scale;
            })
            .onEnd(() => {
                if (scale.value < 1) {
                    scale.value = withSpring(1);
                    savedScale.value = 1;
                } else {
                    savedScale.value = scale.value;
                }
            });

        const panGesture = Gesture.Pan()
            .onUpdate((e) => {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            })
            .onEnd(() => {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            });

        const resetGesture = Gesture.Tap().numberOfTaps(2).onEnd(() => {
            scale.value = withSpring(1);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedScale.value = 1;
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        });

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value }
            ],
        }));

        const composed = Gesture.Simultaneous(pinchGesture, panGesture, resetGesture);

        return (
            <GestureDetector gesture={composed}>
                <Animated.View style={[{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 }, animatedStyle]}>
                    <FastImage
                        source={{ uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode={FastImage.resizeMode.contain}
                    />
                </Animated.View>
            </GestureDetector>
        );
    };

    const renderRewardItem = ({ item }: { item: any }) => (
        <View style={[styles.rewardCard, { backgroundColor: colors.white, ...shadow, marginHorizontal: responsiveWidth(2) }]}>
            <View style={[styles.rewardIconContainer, { backgroundColor: item.status === 'CLAIMED' ? colors.greenOpacitiy(0.12) : item.status === 'PENDING' ? colors.royalBlueOpacity(0.1) : colors.blackOpacity(0.05) }]}>
                <Ionicons 
                    name={item.status === 'CLAIMED' ? "checkmark-circle" : item.status === 'PENDING' ? "time-outline" : "lock-closed"} 
                    size={28} 
                    color={item.status === 'CLAIMED' ? colors.green : item.status === 'PENDING' ? colors.royalBlue : colors.blackOpacity(0.4)} 
                />
            </View>
            <Text style={[styles.rewardTitle, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.4) }]}>
                {item.title}
            </Text>
            <Text style={[styles.rewardAmount, { color: colors.black, fontSize: responsiveFontSize(2.2) }]}>
                ₹{item.amount}
            </Text>
            {item.status === 'CLAIMED' ? (
                <TouchableOpacity 
                    onPress={() => openReceipt(item.screenshot)}
                    style={[styles.viewReceiptButton, { borderColor: colors.blackOpacity(0.1) }]}
                >
                    <Text style={[styles.viewReceiptText, { color: colors.royalBlue, fontSize: responsiveFontSize(1.4) }]}>
                        {t('viewReceipt', 'VIEW RECEIPT')}
                    </Text>
                </TouchableOpacity>
            ) : item.status === 'PENDING' ? (
                <View style={{ paddingHorizontal: 5 }}>
                    <Text style={{ color: colors.royalBlue, fontSize: responsiveFontSize(1.1), textAlign: 'center', fontWeight: 'bold' }}>
                        {item.message}
                    </Text>
                </View>
            ) : null}
        </View>
    );

    const renderProgressItem = ({ item }: { item: any }) => {
        const initials = item.name ? item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';
        return (
            <View style={[styles.progressItem, { backgroundColor: colors.white, ...shadow }]}>
                <View style={styles.progressHeader}>
                    <View style={[styles.avatar, { backgroundColor: '#F1F5F9' }]}>
                        <Text style={[styles.avatarText, { color: colors.royalBlue, fontSize: responsiveFontSize(1.6) }]}>
                            {initials}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.black, fontSize: responsiveFontSize(1.8) }]}>
                            {item.name}
                        </Text>
                        <Text style={[styles.userDate, { color: colors.blackOpacity(0.4), fontSize: responsiveFontSize(1.4) }]}>
                            {item.date}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'qualified' ? colors.greenOpacitiy(0.1) : colors.royalBlueOpacity(0.08) }]}>
                        {item.status === 'qualified' && <Ionicons name="checkmark" size={12} color={colors.green} />}
                        <Text style={[styles.statusText, { color: item.status === 'qualified' ? colors.green : colors.royalBlue, fontSize: responsiveFontSize(1.2) }]}>
                            {item.status === 'qualified' 
                                ? t('statusQualified', 'QUALIFIED') 
                                : item.status === 'in_progress' 
                                    ? t('statusInProgress', 'IN PROGRESS') 
                                    : t('statusPending', 'PENDING')}
                        </Text>
                    </View>
                </View>
                <View style={styles.stepContainer}>
                    <View style={[styles.stepItem, { backgroundColor: colors.blackOpacity(0.03) }]}>
                        <Ionicons 
                            name={item.registered ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={item.registered ? colors.green : colors.blackOpacity(0.2)} 
                        />
                        <Text style={[styles.stepText, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.4) }]}>
                            {t('registered', 'Registered')}
                        </Text>
                    </View>
                    <View style={[styles.stepItem, { backgroundColor: colors.blackOpacity(0.03) }]}>
                        <Ionicons 
                            name={item.profile_done ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={item.profile_done ? colors.green : colors.blackOpacity(0.2)} 
                        />
                        <Text style={[styles.stepText, { color: colors.blackOpacity(0.6), fontSize: responsiveFontSize(1.4) }]}>
                            {t('profileDone', 'Profile Done')}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Space height={safeAreaInsets.top} />
            
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: responsiveWidth(4) }]}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.royalBlue} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.royalBlue, fontSize: responsiveFontSize(2.2) }]}>
                    {t('referEarn', 'Refer & Earn')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.royalBlue} />
                    <Text style={{ marginTop: 10, color: colors.blackOpacity(0.5) }}>
                        {t('loadingReferData', 'Loading referral data...')}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.royalBlue]}
                            tintColor={colors.royalBlue}
                        />
                    }
                >
                    {/* Stats Card */}
                    <View style={{ paddingHorizontal: responsiveWidth(4), marginTop: 10 }}>
                        <LinearGradient
                            colors={[colors.royalBlue, colors.royalBlueOpacity(0.8)]}
                            style={[styles.statsCard]}
                        >
                            <View style={styles.statColumn}>
                                <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(1.5) }]}>
                                    {t('totalEarned', 'Total Earned')}
                                </Text>
                                <Text style={[styles.statValue, { color: '#fff', fontSize: responsiveFontSize(3) }]}>
                                    ₹{summary.total_earned}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statColumn}>
                                <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(1.5) }]}>
                                    {t('successfulReferrals', 'Successful Referrals')}
                                </Text>
                                <Text style={[styles.statValue, { color: '#fff', fontSize: responsiveFontSize(3) }]}>
                                    {summary.successful_referrals}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Promotion Banner */}
                    <View style={{ paddingHorizontal: responsiveWidth(4), marginTop: 20 }}>
                        <View style={[styles.promoCard, { backgroundColor: colors.royalBlueOpacity(0.05), borderColor: colors.royalBlueOpacity(0.1) }]}>
                            <View style={styles.promoHeader}>
                                <View style={[styles.promoIconContainer, { backgroundColor: colors.royalBlue }]}>
                                    <MaterialCommunityIcons name="currency-usd" size={20} color="#fff" />
                                </View>
                                <View style={styles.promoTextContainer}>
                                    <Text style={[styles.promoTitle, { color: colors.black, fontSize: responsiveFontSize(1.8) }]}>
                                        {t('earnRewardPerMilestone', { amount: offer.reward_per_milestone, count: offer.milestone_referrals, defaultValue: `Earn ₹${offer.reward_per_milestone} for every ${offer.milestone_referrals} Referrals` })}
                                    </Text>
                                </View>
                            </View>

                            {/* Progress Bar Container */}
                            <View style={styles.progressBarWrapper}>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
                                    <Text style={[styles.progressLabelText, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.4) }]}>
                                        {currentProgress} / {milestoneSize}
                                    </Text>
                                </View>
                                <View style={[styles.progressBarBackground, { backgroundColor: colors.royalBlueOpacity(0.1) }]}>
                                    <View 
                                        style={[
                                            styles.progressBarFill, 
                                            { 
                                                backgroundColor: colors.royalBlue, 
                                                width: `${progressPercentage}%` 
                                            }
                                        ]} 
                                    />
                                </View>
                                <Text style={[styles.promoMessage, { color: colors.blackOpacity(0.5), fontSize: responsiveFontSize(1.3), marginTop: 4 }]}>
                                    {milestoneMessage}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleReferNow} activeOpacity={0.8} style={styles.referButton}>
                                <LinearGradient
                                    colors={[colors.royalBlue, colors.royalBlueOpacity(0.8)]}
                                    style={styles.referButtonGradient}
                                >
                                    <Ionicons name="share-social" size={18} color="#fff" />
                                    <Text style={[styles.referButtonText, { fontSize: responsiveFontSize(1.8) }]}>
                                        {t('referNow', 'Refer Now')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Earned Rewards Section */}
                    <View style={{ marginTop: 24 }}>
                        <View style={[styles.sectionTitleRow, { paddingHorizontal: responsiveWidth(4) }]}>
                            <Text style={[styles.sectionTitle, { color: colors.black, fontSize: responsiveFontSize(2) }]}>
                                {t('earnedRewards', 'Earned Rewards')}
                            </Text>
                        </View>
                        <FlatList
                            data={mergedRewards}
                            renderItem={renderRewardItem}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingHorizontal: responsiveWidth(4), paddingTop: 10, paddingBottom: 10 }}
                        />
                    </View>

                    {/* Referral Progress Section */}
                    <View style={{ marginTop: 10 }}>
                        <View style={[styles.sectionTitleRow, { paddingHorizontal: responsiveWidth(4) }]}>
                            <Text style={[styles.sectionTitle, { color: colors.black, fontSize: responsiveFontSize(2) }]}>
                                {t('referralProgress', 'Referral Progress')}
                            </Text>
                        </View>
                        <View style={{ paddingHorizontal: responsiveWidth(4), marginTop: 10 }}>
                            {referralProgress.map((item: any, index: number) => (
                                <View key={index}>
                                    {renderProgressItem({ item })}
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Receipt Modal */}
            <Modal
                visible={showReceiptModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowReceiptModal(false)}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
                        <TouchableOpacity 
                            style={styles.closeModalButton}
                            onPress={() => setShowReceiptModal(false)}
                        >
                            <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.modalContent}>
                            {selectedReceipt && (
                                <ZoomableImage uri={selectedReceipt} />
                            )}
                        </View>
                        <Text style={styles.zoomHint}>
                            {t('zoomHint', 'Pinch to zoom • Double tap to reset')}
                        </Text>
                    </View>
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statsCard: {
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statColumn: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        fontWeight: '800',
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    promoCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    promoHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    promoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    promoTextContainer: {
        flex: 1,
    },
    promoTitle: {
        fontWeight: '700',
        marginBottom: 2,
    },
    promoMessage: {
        fontWeight: '600',
        lineHeight: 16,
    },
    progressBarWrapper: {
        marginBottom: 12,
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabelText: {
        fontWeight: '600',
    },
    referButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    referButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    referButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontWeight: '800',
    },
    viewAllText: {
        fontWeight: '700',
    },
    rewardCard: {
        width: 160,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    rewardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    rewardTitle: {
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    rewardAmount: {
        fontWeight: '800',
        marginBottom: 16,
    },
    viewReceiptButton: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        width: '100%',
        alignItems: 'center',
    },
    viewReceiptText: {
        fontWeight: '700',
    },
    progressItem: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontWeight: '800',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontWeight: '700',
        marginBottom: 2,
    },
    userDate: {
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontWeight: '700',
    },
    stepContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    stepItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        gap: 8,
    },
    stepText: {
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    modalContent: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptImage: {
        width: '100%',
        height: '100%',
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 16,
    },
    codeLabel: {
        fontWeight: '600',
        marginBottom: 4,
    },
    codeText: {
        fontWeight: '800',
        letterSpacing: 1,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 6,
    },
    copyButtonText: {
        fontWeight: '700',
    },
    zoomHint: {
        color: 'rgba(255,255,255,0.6)',
        position: 'absolute',
        bottom: 40,
        fontSize: 12,
        fontWeight: '600',
    }
});

export default ReferAndEarn;
