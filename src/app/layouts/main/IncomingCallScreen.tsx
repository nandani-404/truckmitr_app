import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    NativeModules,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IRtcEngineEventHandler, RenderModeType, RtcSurfaceView, VideoSourceType } from 'react-native-agora';
import { useSelector } from 'react-redux';
import { STATICS } from '../../../utils/config';
import { agoraService } from '../../../services/agora';

const requestCallPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
        const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const hasCamera = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const hasMic = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        return hasCamera && hasMic;
    } catch (error) {
        console.error('[Agora][Permissions] Request failed:', error);
        return false;
    }
};

const IncomingCallScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { IncomingCallModule } = NativeModules;
    const { user } = useSelector((state: any) => state?.user);

    const { callerName, callId, channelName, agoraToken } = (route.params as any) || {};
    const resolvedChannelName = String(channelName || STATICS.AGORA_TEST_CHANNEL || '').trim();
    const resolvedToken = String(agoraToken || STATICS.AGORA_TEMP_TOKEN || '').trim();

    const localUid = useMemo(() => {
        const rawId = String(user?.unique_id || user?.id || user?.data?.id || '');
        return agoraService.getNumericUidFromString(rawId);
    }, [user?.unique_id, user?.id, user?.data?.id]);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [remoteUids, setRemoteUids] = useState<number[]>([]);
    const [joined, setJoined] = useState(false);
    const [statusText, setStatusText] = useState('Connecting...');
    const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);
    const participantCount = remoteUids.length + 1;

    useEffect(() => {
        if (!joined) return;
        const interval = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [joined]);

    useEffect(() => {
        let active = true;

        const setupCall = async () => {
            console.log('[Agora][Call] IncomingCallScreen setup started.', {
                channel: resolvedChannelName,
                hasToken: Boolean(resolvedToken),
                localUid,
                callId,
            });

            const hasPermissions = await requestCallPermissions();
            if (!active) return;
            if (!hasPermissions) {
                setStatusText('Camera/Microphone permission denied');
                return;
            }

            if (!agoraService.isInitialized()) {
                const initOk = agoraService.initialize({
                    appId: STATICS.AGORA_APP_ID,
                    userId: String(user?.unique_id || user?.id || user?.data?.id || ''),
                    userName: String(user?.name || user?.data?.name || 'Driver'),
                });
                if (!initOk) {
                    setStatusText('Agora initialization failed');
                    return;
                }
            }

            const handler: IRtcEngineEventHandler = {
                onJoinChannelSuccess: (connection) => {
                    console.log('[Agora][Call] onJoinChannelSuccess:', connection);
                    setJoined(true);
                    setStatusText('Connected');
                },
                onUserJoined: (_connection, uid) => {
                    console.log('[Agora][Call] onUserJoined:', uid);
                    setRemoteUids(prev => (prev.includes(uid) ? prev : [...prev, uid]));
                    setStatusText('Connected');
                },
                onUserOffline: (_connection, uid, reason) => {
                    console.log('[Agora][Call] onUserOffline:', uid, reason);
                    setRemoteUids(prev => prev.filter(item => item !== uid));
                    setStatusText('Participant left');
                },
                onError: (err, msg) => {
                    console.error('[Agora][Call] onError:', err, msg);
                    setStatusText(`Agora error: ${err}`);
                },
                onConnectionStateChanged: (_connection, state, reason) => {
                    console.log('[Agora][Call] onConnectionStateChanged:', state, reason);
                },
            };

            eventHandlerRef.current = handler;
            agoraService.registerEventHandler(handler);

            agoraService.startPreview(VideoSourceType.VideoSourceCameraPrimary);
            const joinCode = agoraService.joinVideoCall({
                channelName: resolvedChannelName,
                token: resolvedToken,
                uid: localUid,
            });

            if (joinCode !== 0) {
                console.error('[Agora][Call] joinVideoCall failed code:', joinCode);
                setStatusText(`Join failed: ${joinCode}`);
            } else {
                setStatusText('Joining...');
            }
        };

        setupCall();

        return () => {
            active = false;
            if (eventHandlerRef.current) {
                agoraService.unregisterEventHandler(eventHandlerRef.current);
                eventHandlerRef.current = null;
            }
            setRemoteUids([]);
            agoraService.stopPreview(VideoSourceType.VideoSourceCameraPrimary);
            agoraService.leaveVideoCall();
        };
    }, [resolvedChannelName, resolvedToken, localUid, callId, user?.unique_id, user?.id, user?.data?.id, user?.name, user?.data?.name]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleMute = () => {
        const next = !isMuted;
        const code = agoraService.muteLocalAudio(next);
        if (code === 0) {
            setIsMuted(next);
        }
    };

    const handleToggleVideo = () => {
        const next = !isVideoMuted;
        const code = agoraService.muteLocalVideo(next);
        if (code === 0) {
            setIsVideoMuted(next);
        }
    };

    const handleSwitchCamera = () => {
        agoraService.switchCamera();
    };

    const handleEndCall = () => {
        if (eventHandlerRef.current) {
            agoraService.unregisterEventHandler(eventHandlerRef.current);
            eventHandlerRef.current = null;
        }
        setRemoteUids([]);
        agoraService.stopPreview(VideoSourceType.VideoSourceCameraPrimary);
        agoraService.leaveVideoCall();
        IncomingCallModule.dismissIncomingCallActivity();
        IncomingCallModule.clearCallData();
        navigation.goBack();
    };

    useEffect(() => {
        if (!joined) return;
        if (remoteUids.length === 0) {
            setStatusText('Waiting for remote user...');
            return;
        }
        setStatusText(`Connected (${participantCount} participants)`);
    }, [joined, remoteUids.length, participantCount]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {remoteUids.length > 0 ? (
                <View style={styles.remoteGridContainer}>
                    {remoteUids.map((uid) => (
                        <View
                            key={uid}
                            style={[
                                styles.remoteTile,
                                remoteUids.length === 1
                                    ? styles.remoteTileSingle
                                    : remoteUids.length === 2
                                        ? styles.remoteTileDouble
                                        : styles.remoteTileMulti,
                            ]}
                        >
                            <RtcSurfaceView
                                style={styles.remoteVideo}
                                canvas={{
                                    uid,
                                    renderMode: RenderModeType.RenderModeHidden,
                                }}
                            />
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.waitingContainer}>
                    <Ionicons name="person" size={80} color="#fff" />
                    <Text style={styles.waitingText}>
                        {callerName || 'Unknown Caller'}
                    </Text>
                    <Text style={styles.subText}>Waiting for remote user...</Text>
                </View>
            )}

            <RtcSurfaceView
                style={styles.localVideo}
                zOrderMediaOverlay
                canvas={{
                    uid: 0,
                    sourceType: VideoSourceType.VideoSourceCameraPrimary,
                    renderMode: RenderModeType.RenderModeHidden,
                }}
            />

            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <Text style={styles.callerText}>{callerName || 'Video Call'}</Text>
                    <Text style={styles.statusText}>
                        {statusText} {joined ? `• ${formatTime(seconds)}` : ''}
                    </Text>
                </View>

                <View style={styles.controlsRow}>
                    <TouchableOpacity onPress={handleToggleMute} style={[styles.controlButton, isMuted && styles.disabledButton]}>
                        <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleEndCall} style={[styles.controlButton, styles.endCallButton]}>
                        <MaterialIcons name="call-end" size={28} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleToggleVideo} style={[styles.controlButton, isVideoMuted && styles.disabledButton]}>
                        <Ionicons name={isVideoMuted ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSwitchCamera} style={styles.controlButton}>
                        <Ionicons name="camera-reverse" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteGridContainer: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#000',
    },
    remoteTile: {
        borderWidth: 1,
        borderColor: '#000',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
    },
    remoteTileSingle: {
        width: '100%',
        height: '100%',
    },
    remoteTileDouble: {
        width: '100%',
        height: '50%',
    },
    remoteTileMulti: {
        width: '50%',
        height: '50%',
    },
    remoteVideo: {
        width: '100%',
        height: '100%',
    },
    localVideo: {
        position: 'absolute',
        right: 16,
        top: 90,
        width: 120,
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    header: {
        marginTop: 14,
        alignItems: 'center',
    },
    callerText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    statusText: {
        color: '#d1d5db',
        marginTop: 6,
        fontSize: 14,
    },
    waitingContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090909',
    },
    waitingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 22,
        fontWeight: '700',
    },
    subText: {
        color: '#9ca3af',
        marginTop: 6,
        fontSize: 14,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    endCallButton: {
        backgroundColor: '#ef4444',
    },
    disabledButton: {
        backgroundColor: 'rgba(75,85,99,0.9)',
    },
});

export default IncomingCallScreen;
