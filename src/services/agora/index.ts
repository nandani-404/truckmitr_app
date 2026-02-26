import {
  ChannelMediaOptions,
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngineEventHandler,
  IRtcEngine,
  VideoSourceType,
} from 'react-native-agora';

type InitializeAgoraParams = {
  appId: string;
  userId?: string;
  userName?: string;
};

class AgoraService {
  private engine: IRtcEngine | null = null;
  private initialized = false;
  private initializedForUserId: string | null = null;

  initialize(params: InitializeAgoraParams): boolean {
    console.log('[Agora][Init] Initialization requested.', {
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      hasAppId: Boolean(params.appId?.trim()),
      alreadyInitialized: this.initialized,
      initializedForUserId: this.initializedForUserId,
    });

    const appId = params.appId?.trim();
    if (!appId) {
      console.warn('[Agora][Init] Missing App ID. Skipping Agora initialization.');
      return false;
    }

    if (this.initialized) {
      console.log('[Agora][Init] Skipped because engine is already initialized.');
      if (params.userId && this.initializedForUserId !== params.userId) {
        console.log(
          `[Agora][Init] Already initialized for ${this.initializedForUserId}. Current session user: ${params.userId}`
        );
      }
      return true;
    }

    try {
      console.log('[Agora][Init] Creating RTC engine instance...');
      const rtcEngine = createAgoraRtcEngine();
      console.log('[Agora][Init] RTC engine instance created.');

      const initializeCode = rtcEngine.initialize({ appId });
      console.log('[Agora][Init] rtcEngine.initialize result:', initializeCode);
      if (initializeCode !== 0) {
        console.error('[Agora][Init] rtcEngine.initialize failed with code:', initializeCode);
        rtcEngine.release();
        return false;
      }

      const enableVideoCode = rtcEngine.enableVideo();
      console.log('[Agora][Init] rtcEngine.enableVideo result:', enableVideoCode);

      const setProfileCode = rtcEngine.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication
      );
      console.log('[Agora][Init] rtcEngine.setChannelProfile result:', setProfileCode);

      const setRoleCode = rtcEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      console.log('[Agora][Init] rtcEngine.setClientRole result:', setRoleCode);

      this.engine = rtcEngine;
      this.initialized = true;
      this.initializedForUserId = params.userId ?? null;

      console.log(
        `[Agora][Init] Initialized successfully for userId=${params.userId ?? 'unknown'} name=${params.userName ?? 'unknown'}`
      );
      return true;
    } catch (error) {
      console.error('[Agora][Init] Initialization failed with exception:', error);
      this.engine = null;
      this.initialized = false;
      this.initializedForUserId = null;
      return false;
    }
  }

  getEngine(): IRtcEngine | null {
    return this.engine;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  registerEventHandler(handler: IRtcEngineEventHandler): boolean {
    if (!this.engine) {
      console.warn('[Agora][Events] Cannot register event handler. Engine is null.');
      return false;
    }
    const ok = this.engine.registerEventHandler(handler);
    console.log('[Agora][Events] registerEventHandler:', ok);
    return ok;
  }

  unregisterEventHandler(handler: IRtcEngineEventHandler): boolean {
    if (!this.engine) {
      console.warn('[Agora][Events] Cannot unregister event handler. Engine is null.');
      return false;
    }
    const ok = this.engine.unregisterEventHandler(handler);
    console.log('[Agora][Events] unregisterEventHandler:', ok);
    return ok;
  }

  getNumericUidFromString(rawUid?: string): number {
    const clean = String(rawUid ?? '').trim();
    if (!clean) return 0;

    // Prefer direct numeric UID when available.
    const directNum = Number(clean);
    if (Number.isInteger(directNum) && directNum > 0 && directNum <= 2147483647) {
      return directNum;
    }

    // Deterministic hash for alphanumeric IDs like "TM2602DLDR29494".
    let hash = 0;
    for (let i = 0; i < clean.length; i += 1) {
      hash = ((hash << 5) - hash + clean.charCodeAt(i)) | 0;
    }
    const uid = Math.abs(hash) || 1;
    return uid;
  }

  startPreview(sourceType: VideoSourceType = VideoSourceType.VideoSourceCameraPrimary): number {
    if (!this.engine) {
      console.warn('[Agora][Preview] Cannot start preview. Engine is null.');
      return -7;
    }
    const code = this.engine.startPreview(sourceType);
    console.log('[Agora][Preview] startPreview result:', code);
    return code;
  }

  stopPreview(sourceType: VideoSourceType = VideoSourceType.VideoSourceCameraPrimary): number {
    if (!this.engine) {
      console.warn('[Agora][Preview] Cannot stop preview. Engine is null.');
      return -7;
    }
    const code = this.engine.stopPreview(sourceType);
    console.log('[Agora][Preview] stopPreview result:', code);
    return code;
  }

  joinVideoCall(params: {
    channelName: string;
    token?: string;
    uid?: number;
  }): number {
    if (!this.engine) {
      console.warn('[Agora][Join] Cannot join channel. Engine is null.');
      return -7;
    }

    const channelName = params.channelName?.trim();
    const token = params.token?.trim() || '';
    const uid = params.uid ?? 0;

    if (!channelName) {
      console.warn('[Agora][Join] channelName is required.');
      return -2;
    }

    const options: ChannelMediaOptions = {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      publishCameraTrack: true,
      publishMicrophoneTrack: true,
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
    };

    console.log('[Agora][Join] Attempting joinChannel...', {
      channelName,
      uid,
      hasToken: Boolean(token),
    });
    const code = this.engine.joinChannel(token, channelName, uid, options);
    console.log('[Agora][Join] joinChannel result:', code);
    return code;
  }

  leaveVideoCall(): number {
    if (!this.engine) {
      console.warn('[Agora][Leave] Cannot leave channel. Engine is null.');
      return -7;
    }

    const code = this.engine.leaveChannel();
    console.log('[Agora][Leave] leaveChannel result:', code);
    return code;
  }

  muteLocalAudio(muted: boolean): number {
    if (!this.engine) {
      console.warn('[Agora][Audio] Cannot mute/unmute audio. Engine is null.');
      return -7;
    }
    const code = this.engine.muteLocalAudioStream(muted);
    console.log('[Agora][Audio] muteLocalAudioStream result:', code, 'muted:', muted);
    return code;
  }

  muteLocalVideo(muted: boolean): number {
    if (!this.engine) {
      console.warn('[Agora][Video] Cannot mute/unmute video. Engine is null.');
      return -7;
    }
    const code = this.engine.muteLocalVideoStream(muted);
    console.log('[Agora][Video] muteLocalVideoStream result:', code, 'muted:', muted);
    return code;
  }

  switchCamera(): number {
    if (!this.engine) {
      console.warn('[Agora][Video] Cannot switch camera. Engine is null.');
      return -7;
    }
    const code = this.engine.switchCamera();
    console.log('[Agora][Video] switchCamera result:', code);
    return code;
  }

  destroy(): void {
    console.log('[Agora][Destroy] Destroy requested.', {
      hasEngine: Boolean(this.engine),
      initialized: this.initialized,
      initializedForUserId: this.initializedForUserId,
    });

    if (!this.engine) {
      this.initialized = false;
      this.initializedForUserId = null;
      console.log('[Agora][Destroy] No engine instance found. State reset only.');
      return;
    }

    try {
      this.engine.release();
      console.log('[Agora][Destroy] Engine released.');
    } catch (error) {
      console.error('[Agora][Destroy] Failed to release engine:', error);
    } finally {
      this.engine = null;
      this.initialized = false;
      this.initializedForUserId = null;
      console.log('[Agora][Destroy] Internal state cleared.');
    }
  }
}

export const agoraService = new AgoraService();
