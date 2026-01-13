import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    LayoutAnimation,
    PanResponder,
    Platform,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    UIManager,
    View
} from 'react-native';
import Video from 'react-native-video';
import Feather from 'react-native-vector-icons/Feather';
import { useColor, useResponsiveScale, useShadow } from '@truckmitr/src/app/hooks';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { BASE_URL, END_POINTS } from '@truckmitr/src/utils/config';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface MiniVideoPlayerProps {
    isVisible: boolean;
}

const MiniVideoPlayer: React.FC<MiniVideoPlayerProps> = ({ isVisible }) => {
    const colors = useColor();
    const { responsiveHeight, responsiveWidth, responsiveFontSize } = useResponsiveScale();
    const { shadow } = useShadow();

    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [videoUrls, setVideoUrls] = useState<string[]>([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [videoLoading, setVideoLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);

    // Pan Gesture
    const pan = useRef(new Animated.ValueXY()).current;

    // Keep track of isFullScreen for PanResponder
    const isFullScreenRef = useRef(isFullScreen);
    useEffect(() => {
        isFullScreenRef.current = isFullScreen;
    }, [isFullScreen]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                if (isFullScreenRef.current) {
                    // Fullscreen: Swipe down (dy positive and significant)
                    return gestureState.dy > 10;
                }
                // Mini mode: Drag
                return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
            },
            onPanResponderGrant: () => {
                if (!isFullScreenRef.current) {
                    pan.setOffset({
                        x: (pan.x as any)._value,
                        y: (pan.y as any)._value
                    });
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                if (isFullScreenRef.current) {
                    return;
                }
                return Animated.event(
                    [null, { dx: pan.x, dy: pan.y }],
                    { useNativeDriver: false }
                )(evt, gestureState);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (isFullScreenRef.current) {
                    // Swipe Down Detection
                    if (gestureState.dy > 50) {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        setIsFullScreen(false);
                    }
                } else {
                    pan.flattenOffset();
                }
            }
        })
    ).current;

    // Auto-hide controls
    useEffect(() => {
        let timeout: any;
        if (isFullScreen && isPlaying && showControls) {
            timeout = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [isFullScreen, isPlaying, showControls]);

    const LOCAL_VIDEO_URL = `${BASE_URL}public/videos/intro-video.mp4`;
    const videoUrl = videoUrls.length > 0 ? videoUrls[currentVideoIndex] : LOCAL_VIDEO_URL;

    const goToNextVideo = () => {
        if (videoUrls.length > 1) {
            setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
            setIsPlaying(true);
        }
    };

    const goToPreviousVideo = () => {
        if (videoUrls.length > 1) {
            setCurrentVideoIndex((prev) => (prev - 1 + videoUrls.length) % videoUrls.length);
            setIsPlaying(true);
        }
    };

    const fetchVideoUrl = async () => {
        try {
            setVideoLoading(true);
            const response: any = await axiosInstance.get(END_POINTS.TRUCKMITRBANNERS);

            if (response?.data?.status && response?.data?.data) {
                const videoBanners = response.data.data.filter((banner: any) => banner.media_type === 'video');

                if (videoBanners.length > 0) {
                    const urls = videoBanners.map((banner: any) => `${BASE_URL}public${banner.media_url}`);
                    setVideoUrls(urls);
                    setCurrentVideoIndex(0);
                } else {
                    setVideoUrls([LOCAL_VIDEO_URL]);
                }
            } else {
                setVideoUrls([LOCAL_VIDEO_URL]);
            }
        } catch (error: any) {
            console.log('Error fetching banners:', error);
            setVideoUrls([LOCAL_VIDEO_URL]);
        } finally {
            setVideoLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            fetchVideoUrl();
        }
    }, [isVisible]);

    if (!isVisible) return null;

    if (isMinimized) {
        return (
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    position: 'absolute',
                    right: 15,
                    bottom: 150,
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: colors.black,
                    zIndex: 999,
                    ...shadow,
                    shadowColor: colors.blackOpacity(.4),
                    elevation: 10,
                    overflow: 'hidden'
                }}
            >
                <TouchableOpacity
                    onPress={() => {
                        setIsMinimized(false);
                        setIsPlaying(true);
                    }}
                    activeOpacity={0.8}
                    style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: colors.white,
                        borderRadius: 25,
                        backgroundColor: colors.black
                    }}
                >
                    <Feather name="play" size={20} color={colors.white} style={{ marginLeft: 3 }} />
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={isFullScreen ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                backgroundColor: colors.black,
                zIndex: 9999,
            } : {
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                position: 'absolute',
                right: 15,
                bottom: 80,
                width: responsiveWidth(28),
                height: responsiveHeight(25),
                backgroundColor: colors.black,
                borderRadius: 16,
                ...shadow,
                shadowColor: colors.blackOpacity(.4),
                elevation: 10,
                zIndex: 999,
                overflow: 'hidden'
            }}>

            <Video
                source={{ uri: videoUrl }}
                muted={isMuted}
                style={{ width: '100%', height: '100%', backgroundColor: colors.black }}
                resizeMode={isFullScreen ? "contain" : "cover"}
                controls={false}
                repeat={true}
                paused={!isPlaying}
                onError={(e: any) => console.log('Video Error:', e)}
            />

            <TouchableWithoutFeedback onPress={() => {
                if (isFullScreen) {
                    setShowControls(!showControls);
                } else {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    setIsFullScreen(true);
                }
            }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>

                    {/* Dark Overlay using colors.blackOpacity */}
                    {(!isPlaying || (isFullScreen && showControls)) && <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)' // Fallback or use colors if available
                    }} />}

                    {(!isFullScreen || showControls) && (
                        <View style={{
                            position: 'absolute',
                            top: isFullScreen ? responsiveHeight(4) : 0,
                            left: 0,
                            right: 0,
                            flexDirection: 'row',
                            justifyContent: isFullScreen ? 'space-between' : 'flex-end',
                            padding: 8,
                            zIndex: 30
                        }}>
                            {isFullScreen && (
                                <TouchableOpacity
                                    onPress={() => setIsMuted(!isMuted)}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 5,
                                        zIndex: 1000
                                    }}
                                >
                                    <Feather name={isMuted ? "volume-x" : "volume-2"} size={24} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => {
                                    if (isFullScreen) {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setIsFullScreen(false);
                                    } else {
                                        setIsPlaying(false);
                                        setIsMinimized(true);
                                    }
                                }}
                                activeOpacity={0.7}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 5,
                                    zIndex: 1000
                                }}
                            >
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {isFullScreen && (showControls || !isPlaying) && (
                        <TouchableOpacity
                            onPress={() => setIsPlaying(!isPlaying)}
                            activeOpacity={0.8}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: [{ translateX: -20 }, { translateY: -20 }],
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: colors.white,
                                zIndex: 30
                            }}
                        >
                            <Feather name={isPlaying ? "pause" : "play"} size={18} color={colors.royalBlue} style={{ marginLeft: isPlaying ? 0 : 2 }} />
                        </TouchableOpacity>
                    )}

                    {isFullScreen && videoUrls.length > 1 && showControls && (
                        <>
                            <TouchableOpacity
                                onPress={goToPreviousVideo}
                                style={{
                                    position: 'absolute',
                                    left: 20,
                                    top: '50%',
                                    marginTop: -20,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 30
                                }}
                            >
                                <Feather name="chevron-left" size={24} color={colors.white} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={goToNextVideo}
                                style={{
                                    position: 'absolute',
                                    right: 20,
                                    top: '50%',
                                    marginTop: -20,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 30
                                }}
                            >
                                <Feather name="chevron-right" size={24} color={colors.white} />
                            </TouchableOpacity>

                            <View style={{
                                position: 'absolute',
                                bottom: 80,
                                left: 0,
                                right: 0,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 30
                            }}>
                                {videoUrls.map((_, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: currentVideoIndex === index ? colors.white : 'rgba(255,255,255,0.4)',
                                            marginHorizontal: 4
                                        }}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    <View />
                </View>
            </TouchableWithoutFeedback>
        </Animated.View>
    );
};

export default MiniVideoPlayer;
