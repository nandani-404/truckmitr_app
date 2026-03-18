import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    Animated,
    ActivityIndicator,
    PanResponder,
} from 'react-native';
import RNShare from 'react-native-share';
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
    BottomSheetBackdrop
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, useRoute, useIsFocused, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';
import Toast from 'react-native-toast-message';

import { useSelector } from 'react-redux';
import { STACKS } from '@truckmitr/src/stacks/stacks';
import { resolveTargetNavigation } from '@truckmitr/src/utils/navigation/resolver';
// import Header from '@truckmitr/src/components/Header'; // Wait, Header might not be needed as we have custom overlay
import CommentsModal from '../components/CommentsModal';
import { DriverKiAwazService } from '../services';
import { DRIVER_KI_AWAZ_BASE, AWAZ_URL } from '@truckmitr/src/utils/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock Data structure based on ReelsScreen
interface ReelData {
    id: string;
    userName: string;
    userAvatar: string;
    userState: string;
    category: string;
    categoryLabel: string;
    hashtags: string[];
    supportCount: number;
    commentCount: number;
    shareCount: number;
    isSupported: boolean;
    videoUrl: string;
    description: string;
    thumbnailUrl?: string;
    status?: string;
}

const SingleReelScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const { user, selectedModule } = useSelector((state: any) => state.user);
    const userRole = user?.role || 'driver';

    // Extract video data from params (or ID to fetch)
    const { post } = (route.params as any) || {};
    console.log(`post`, post);

    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [reelData, setReelData] = useState<ReelData | null>(null);
    const [loading, setLoading] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    useEffect(() => {
        if (!post && (route.params as any)?.id) {
            fetchReel((route.params as any).id);
        }
    }, [(route.params as any)?.id]);

    const fetchReel = async (id: string) => {
        try {
            setLoading(true);
            const response = await DriverKiAwazService.getPostById(id);
            if ((response.data?.status || response.data?.success) && response.data?.data) {
                // The post effect below will handle mapping if we set 'post' but since we have a separate state
                // let's just trigger the mapping logic by setting a temporary post object or call a common mapper.
                // For simplicity, I'll update the 'post' logic below to handle the fetched data.
                mapData(response.data.data);
            } else {
                Toast.show({ type: 'error', text1: t('reel_not_found') });
            }
        } catch (error) {
            console.error('Error fetching reel:', error);
            Toast.show({ type: 'error', text1: t('failed_load_reel') });
        } finally {
            setLoading(false);
        }
    };

    const mapData = (item: any) => {
        const rawUrl = item.media_url || item.mediaUrl || item.videoUrl || '';
        const hasHttp = rawUrl.startsWith('http');
        const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
        const finalVideoUrl = hasHttp ? rawUrl : (rawUrl ? `${DRIVER_KI_AWAZ_BASE}${cleanPath}` : '');

        const rawAvatar = item.user_avatar || item.user_profile_img || item.user?.avatar || item.avatar || item.userAvatar || '';
        const hasAvatarHttp = rawAvatar.startsWith('http');
        const cleanAvatarPath = rawAvatar.startsWith('/') ? rawAvatar.substring(1) : rawAvatar;
        const finalAvatarUrl = !rawAvatar ? 'https://via.placeholder.com/150' : (hasAvatarHttp ? rawAvatar : `${AWAZ_URL}public/${cleanAvatarPath}`);

        const rawThumb = item.thumbnail_url || item.thumbnail || '';
        const hasThumbHttp = rawThumb.startsWith('http');
        const cleanThumbPath = rawThumb.startsWith('/') ? rawThumb.substring(1) : rawThumb;
        let finalThumbUrl = '';
        if (rawThumb) {
            if (hasThumbHttp) {
                finalThumbUrl = rawThumb;
            } else if (cleanThumbPath.startsWith('uploads/thumbnails/')) {
                finalThumbUrl = `${DRIVER_KI_AWAZ_BASE}${cleanThumbPath}`;
            } else {
                finalThumbUrl = `${DRIVER_KI_AWAZ_BASE}uploads/thumbnails/${cleanThumbPath}`;
            }
        }

        setReelData({
            id: item.id?.toString(),
            userName: item.user_name || item.name || item.user?.name || item.userName || t('unknown_user'),
            userAvatar: finalAvatarUrl,
            userState: item.user?.state || item.userState || '',
            category: item.category || 'VIDEO',
            categoryLabel: item.category ? `#${item.category}` : `🎬 ${t('video')}`,
            hashtags: item.hashtags || [],
            supportCount: item.likes_count || item.supportCount || 0,
            commentCount: item.comments_count || item.commentCount || 0,
            shareCount: item.shares_count || item.shareCount || 0,
            isSupported: item.is_liked === 1 || item.isSupported || item.is_liked === true,
            videoUrl: finalVideoUrl,
            description: item.caption || item.description || '',
            thumbnailUrl: finalThumbUrl,
            status: Number(item.status) === 1 ? 'APPROVED' : 'PENDING',
        });
    };

    // Bottom Sheet Refs
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const infoBottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = React.useMemo(() => ['45%'], []);
    const infoSnapPoints = React.useMemo(() => ['50%'], []);

    // Mute Icon Animation State
    const muteOpacity = useRef(new Animated.Value(0)).current;

    // PanResponder for Swipe Detection
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only trigger if swipe distance is significant (e.g. > 20px)
                return Math.abs(gestureState.dy) > 20;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (Math.abs(gestureState.dy) > 50) {
                    handleSwipeAttempt();
                }
            },
        })
    ).current;

    useEffect(() => {
        Orientation.lockToPortrait();
        return () => {
            Orientation.unlockAllOrientations();
        };
    }, []);

    useEffect(() => {
        if (post) {
            mapData(post);
        }
    }, [post]);

    const handleSwipeAttempt = () => {
        // Instead of immediate Toast and Redirect, show the Bottom Sheet
        bottomSheetModalRef.current?.present();
    };

    const handleExploreNow = () => {
        bottomSheetModalRef.current?.dismiss();
        
        // Use role-aware navigation resolver to get the correct stack and screen
        const { stack, screen } = resolveTargetNavigation(STACKS.DRIVER_KI_AWAZ_INFO, userRole, selectedModule);
        
        // Reset navigation to the resolved Bottom Tab stack and DKA screen
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: stack || STACKS.BOTTOM_TAB,
                        params: {
                            screen: screen,
                        },
                    },
                ],
            })
        );
    };

    const handleInfoPress = () => {
        infoBottomSheetRef.current?.present();
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const handleShare = async () => {
        if (!reelData) return;
        try {
            const shareUrl = `https://truckmitr.com/reel/${reelData.id}`;
            const isHindi = i18n.language === 'hi' || i18n.language === 'hn';

            const message = isHindi
                ? `🚛 मैंने अपनी आवाज *Driver Ki Awaz!* पर शेयर की है!\n\nयह TruckMitr का खास प्लेटफॉर्म है जहाँ ड्राइवर अपनी समस्या, अनुभव और कहानी खुलकर बता सकते हैं।\n\nआप भी अपनी आवाज उठाइए।\nआज ही *TruckMitr ऐप डाउनलोड करें* और रजिस्टर करें。\n\n📲 *अभी जुड़ें:* ${shareUrl}`
                : `🚛 I have shared my voice on *Driver Ki Awaz!*\n\nThis is a special platform by TruckMitr where drivers can openly share their problems, experiences, and personal stories.\n\nNow it’s your turn to raise your voice.\n*Download the TruckMitr App* today and register to be part of the community.\n\n📲 *Join now:* ${shareUrl}`;

            const shareOptions: any = {
                title: 'Driver Ki Awaz',
                message: message,
            };

            await RNShare.open(shareOptions);
            await DriverKiAwazService.sharePost(reelData.id);
            setReelData(prev => prev ? { ...prev, shareCount: prev.shareCount + 1 } : null);
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const formatCount = (count: number): string => {
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return (count || 0).toString();
    };

    const handleLike = async () => {
        if (likeLoading || !reelData) return;
        setLikeLoading(true);
        const wasLiked = reelData.isSupported;
        // Optimistic update
        setReelData(prev => prev ? {
            ...prev,
            isSupported: !wasLiked,
            supportCount: wasLiked ? Math.max(0, prev.supportCount - 1) : prev.supportCount + 1,
        } : null);
        try {
            await DriverKiAwazService.likePost(reelData.id);
        } catch (error) {
            // Revert on error
            console.log('Like error:', error);
            setReelData(prev => prev ? {
                ...prev,
                isSupported: wasLiked,
                supportCount: wasLiked ? prev.supportCount + 1 : Math.max(0, prev.supportCount - 1),
            } : null);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleCommentAdded = () => {
        setReelData(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
    };

    const handleVideoTap = () => {
        setIsMuted(!isMuted);

        // Show icon
        muteOpacity.setValue(1);

        // Fade out after 1.5 seconds
        Animated.timing(muteOpacity, {
            toValue: 0,
            duration: 500,
            delay: 1500,
            useNativeDriver: true,
        }).start();
    };

    if (loading || !reelData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                {loading && <Text style={{ color: '#FFFFFF', marginTop: 10 }}>{t('loading_reel')}</Text>}
                {!loading && !reelData && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                        <Text style={{ color: '#3B82F6' }}>{t('reel_not_found')}. {t('go_back')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <View style={styles.container} {...panResponder.panHandlers}>
                    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

                    {/* Header Overlay */}
                    <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>{t('post')}</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        {reelData.status && reelData.status !== 'APPROVED' && (
                            <TouchableOpacity onPress={handleInfoPress} style={styles.infoIcon}>
                                <Ionicons name="information-circle-outline" size={26} color="#FBBF24" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Video Background */}
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.videoWrapper}
                        onPress={handleVideoTap}
                        onLongPress={() => setIsPaused(true)}
                        onPressOut={() => setIsPaused(false)}
                        delayLongPress={250}
                    >
                        {isFocused ? (
                            <Video
                                source={{ uri: reelData.videoUrl }}
                                style={[styles.video, { opacity: isBuffering ? 0 : 1 }]}
                                resizeMode="cover"
                                repeat
                                paused={isPaused || !isFocused}
                                muted={isMuted}
                                onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
                                onLoad={() => setIsBuffering(false)}
                                onReadyForDisplay={() => setIsBuffering(false)}
                                bufferConfig={{
                                    minBufferMs: 1000,
                                    maxBufferMs: 5000,
                                    bufferForPlaybackMs: 50,
                                    bufferForPlaybackAfterRebufferMs: 100,
                                }}
                                playInBackground={false}
                                playWhenInactive={false}
                                controls={false}
                            />
                        ) : (
                            <View style={[styles.video, { backgroundColor: '#000000' }]} />
                        )}

                        {/* Loading Indicator */}
                        {isBuffering && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                        )}

                        {/* Mute/Unmute Indicator */}
                        <Animated.View style={[styles.muteOverlay, { opacity: muteOpacity }]}>
                            <View style={styles.muteIconContainer}>
                                <Ionicons
                                    name={isMuted ? "volume-mute" : "volume-medium"}
                                    size={28}
                                    color="#FFFFFF"
                                />
                            </View>
                        </Animated.View>

                        {/* Dark Gradient Overlay */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                            style={styles.gradient}
                        />
                    </TouchableOpacity>

                    {/* Right Side Actions */}
                    <View style={[styles.actionsContainer, { bottom: insets.bottom + 80 }]}>
                        <TouchableOpacity style={styles.avatarContainer}>
                            {reelData.userAvatar && !reelData.userAvatar.includes('placeholder') ? (
                                <Image source={{ uri: reelData.userAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: '#333333', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Ionicons name="person" size={24} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleLike} disabled={likeLoading}>
                            <Ionicons name={reelData.isSupported ? 'heart' : 'heart-outline'} size={28} color={reelData.isSupported ? '#EF4444' : '#FFFFFF'} />
                            <Text style={styles.actionText}>{formatCount(reelData.supportCount)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)}>
                            <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
                            <Text style={styles.actionText}>{formatCount(reelData.commentCount)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={26} color="#FFFFFF" />
                            <Text style={styles.actionText}>{formatCount(reelData.shareCount)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Info */}
                    <View style={[styles.bottomInfo, { bottom: insets.bottom + 20 }]}>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>@{reelData.userName}</Text>
                            {reelData.userState ? <Text style={styles.userState}>{reelData.userState}</Text> : null}
                        </View>

                        {reelData.description ? (
                            <Text style={styles.description} numberOfLines={2}>
                                {reelData.description}
                            </Text>
                        ) : null}

                        <View style={styles.tagsContainer}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{reelData.categoryLabel}</Text>
                            </View>
                        </View>
                        {reelData.hashtags && reelData.hashtags.length > 0 && (
                            <Text style={styles.hashtags}>
                                {reelData.hashtags.map(tag => `#${tag}`).join(' ')}
                            </Text>
                        )}
                    </View>

                    <CommentsModal
                        visible={showComments}
                        postId={reelData.id}
                        onClose={() => setShowComments(false)}
                        onCommentAdded={handleCommentAdded}
                    />

                    {/* Redirection Bottom Sheet */}
                    <BottomSheetModal
                        ref={bottomSheetModalRef}
                        index={0}
                        snapPoints={snapPoints}
                        backdropComponent={renderBackdrop}
                        enablePanDownToClose={true}
                        backgroundStyle={styles.bottomSheet}
                        handleIndicatorStyle={styles.dragHandle}
                    >
                        <BottomSheetView style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                            <View style={styles.sheetIconContainer}>
                                <Ionicons name="people" size={40} color="#3B82F6" />
                            </View>

                            <Text style={styles.sheetTitle} numberOfLines={2}>{t('want_see_more_title')}</Text>

                            <Text style={styles.sheetSubtitle}>
                                {t('want_see_more_subtitle')}
                            </Text>

                            <TouchableOpacity style={styles.exploreButton} onPress={handleExploreNow}>
                                <Text style={styles.exploreButtonText}>{t('explore_now')}</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </BottomSheetView>
                    </BottomSheetModal>

                    {/* Status Info Bottom Sheet */}
                    <BottomSheetModal
                        ref={infoBottomSheetRef}
                        index={0}
                        snapPoints={infoSnapPoints}
                        backdropComponent={renderBackdrop}
                        enablePanDownToClose={true}
                        backgroundStyle={styles.bottomSheet}
                        handleIndicatorStyle={styles.dragHandle}
                    >
                        <BottomSheetView style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                            <View style={[styles.sheetIconContainer, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="shield-checkmark" size={40} color="#F59E0B" />
                            </View>
                            
                            <Text style={styles.sheetTitle} numberOfLines={2}>{t('under_verification_title')}</Text>
                            
                            <Text style={styles.sheetSubtitle}>
                                {t('under_verification_subtitle')}
                            </Text>
                            
                            <TouchableOpacity style={[styles.exploreButton, { backgroundColor: '#475569' }]} onPress={() => infoBottomSheetRef.current?.dismiss()}>
                                <Text style={styles.exploreButtonText}>{t('got_it')}</Text>
                            </TouchableOpacity>
                        </BottomSheetView>
                    </BottomSheetModal>
                </View>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 15,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight tint for readability
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
    },
    infoIcon: {
        padding: 4,
    },
    videoWrapper: {
        flex: 1,
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.4,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    muteOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -24 }, { translateY: -24 }], // Center the icon container
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none', // Allow taps to pass through to the video wrapper
    },
    muteIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionsContainer: {
        position: 'absolute',
        right: 12,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    actionButton: {
        alignItems: 'center',
        marginBottom: 16,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    bottomInfo: {
        position: 'absolute',
        left: 16,
        right: 80,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    userState: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginLeft: 8,
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    hashtags: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bottomSheet: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    dragHandle: {
        backgroundColor: '#E2E8F0',
        width: 40,
    },
    sheetContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    sheetIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
        includeFontPadding: false,
        width: '100%',
    },
    sheetSubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 10,
        includeFontPadding: false,
    },
    exploreButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 16,
        marginBottom: 20,
    },
    exploreButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default SingleReelScreen;
