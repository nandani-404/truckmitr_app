import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { resetUpload } from '@truckmitr/redux/slices/uploadSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UploadProgressHeader: React.FC = () => {
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const { isUploading, progress, status, postMetadata, error } = useSelector((state: any) => state.upload);
    
    const anim = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isUploading || status === 'success' || status === 'error') {
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: false, // Height/Opacity need false
            }).start();
        } else {
            Animated.timing(anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
            }).start();
        }
    }, [isUploading, status]);

    useEffect(() => {
        Animated.timing(progressWidth, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    if (status === 'idle') return null;

    const getStatusText = () => {
        if (status === 'compressing') return 'Preparing your post...';
        if (status === 'uploading') return `Uploading... ${progress}%`;
        if (status === 'success') return 'Post shared successfully! ✅';
        if (status === 'error') return 'Upload failed ❌';
        return 'Preparing your post...';
    };

    const handleDismiss = () => {
        dispatch(resetUpload());
    };

    const thumbnailUri = postMetadata?.thumbnailUri || postMetadata?.mediaUri;
    const hasMedia = postMetadata?.type === 'IMAGE' || postMetadata?.type === 'VIDEO';

    return (
        <Animated.View style={[
            styles.container, 
            { 
                opacity: anim,
                height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, insets.top + (Platform.OS === 'ios' ? 60 : 70)]
                }),
                overflow: 'visible' // Allow shadow to show
            }
        ]}>
            <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === 'ios' ? 5 : 10) }]}>
                {hasMedia && thumbnailUri ? (
                    <FastImage
                        source={{ uri: thumbnailUri }}
                        style={styles.thumbnail}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                ) : (
                    <View style={styles.iconPlaceholder}>
                        <Ionicons 
                            name={postMetadata?.type === 'VIDEO' ? 'videocam' : 'document-text'} 
                            size={18} 
                            color="#3B82F6" 
                        />
                    </View>
                )}
                
                <View style={styles.textContainer}>
                    <Text style={styles.statusText} numberOfLines={1}>
                        {getStatusText()}
                    </Text>
                    {status === 'success' && (
                        <Text style={styles.subText}>Your voice is now live on the feed.</Text>
                    )}
                    {error && (
                        <Text style={[styles.subText, { color: '#EF4444' }]} numberOfLines={1}>
                            {error}
                        </Text>
                    )}
                </View>

                {/* Always allow dismiss per user request */}
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={26} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Progress Bar (at bottom of header) */}
            {status === 'uploading' && (
                <View style={styles.progressTrack}>
                    <Animated.View 
                        style={[
                            styles.progressBar, 
                            { 
                                width: progressWidth.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%']
                                }) 
                            }
                        ]} 
                    />
                </View>
            )}
            
            {/* Bottom divider for success/error states */}
            {(status === 'success' || status === 'error') && (
                <View style={styles.divider} />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 10000,
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 60,
    },
    thumbnail: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    subText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    progressTrack: {
        height: 3,
        backgroundColor: '#F1F5F9',
        width: '100%',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 1.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
    }
});

export default UploadProgressHeader;
