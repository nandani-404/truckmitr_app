import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';
import { Video as VideoCompressor } from 'react-native-compressor';

import store from '@truckmitr/redux/store';
import { updateProgress, updateStatus, setUploadError, resetUpload } from '@truckmitr/redux/slices/uploadSlice';
import { END_POINTS } from '@truckmitr/src/utils/config';
import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import { DriverKiAwazService } from './services';

export interface UploadMetadata {
  type: string;
  category: string;
  caption: string;
  mediaFile: {
    uri: string;
    type: string;
    name: string;
  } | null;
  thumbnail?: {
    uri: string;
    type: string;
    name: string;
  } | null;
}

const CHANNEL_ID = 'upload_channel_silent';

class UploadManager {
  private static instance: UploadManager;
  private currentNotificationId: string | null = null;

  private constructor() {
    this.createChannel();
  }

  public static getInstance(): UploadManager {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager();
    }
    return UploadManager.instance;
  }

  private async createChannel() {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Post Uploads',
      importance: AndroidImportance.LOW,
    });
  }

  public async startBackgroundUpload(metadata: UploadMetadata, userId: string) {
    console.log('[UploadManager] Starting background upload for:', metadata.caption);

    try {
      // 1. Initial Notification
      this.currentNotificationId = await notifee.displayNotification({
        title: 'Preparing Post...',
        body: 'Almost ready to share!',
        android: {
          channelId: CHANNEL_ID,
          asForegroundService: true,
          color: AndroidColor.BLUE,
          importance: AndroidImportance.LOW,
          progress: {
            max: 100,
            current: 0,
            indeterminate: true,
          },
        },
      });

      let mediaUri = metadata.mediaFile?.uri;

      // 2. Compression Phase (if video)
      if (metadata.type === 'VIDEO' && mediaUri) {
        store.dispatch(updateStatus('compressing'));
        
        let lastCompUpdate = 0;
        const compressedUri = await VideoCompressor.compress(
          mediaUri,
          {
            compressionMethod: 'auto',
            maxSize: 720,
            bitrate: 1000000, // Reduced from 1.5Mbps to 1Mbps for faster uploads
          },
          (progress) => {
            const percent = Math.round(progress * 100);
            const now = Date.now();
            if (percent - lastCompUpdate >= 5 || now - lastCompUpdate >= 2000 || percent === 100) {
              notifee.displayNotification({
                id: this.currentNotificationId!,
                title: 'Preparing Post...',
                body: `Optimizing video: ${percent}%`,
                android: {
                  channelId: CHANNEL_ID,
                  progress: { max: 100, current: percent },
                },
              });
              lastCompUpdate = now;
            }
          }
        );
        mediaUri = compressedUri;
      }

      // 3. Upload Phase
      store.dispatch(updateStatus('uploading'));
      const formData = new FormData();
      formData.append('category', metadata.category.toLowerCase());
      formData.append('caption', metadata.caption);
      
      if (metadata.type === 'TEXT') {
        formData.append('media_type', 'text');
      } else {
        formData.append('media_type', metadata.type.toLowerCase());
        formData.append('media', {
          uri: mediaUri,
          type: metadata.mediaFile?.type,
          name: metadata.mediaFile?.name,
        } as any);

        if (metadata.thumbnail) {
          formData.append('thumbnail', metadata.thumbnail as any);
        }
      }

      let lastReduxUpdate = 0;
      let lastNotifeeUpdate = 0;
      let lastPercent = -1;

      const response = await axiosInstance.post(END_POINTS.DKA_POST, formData, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // Reduced from 5 to 3 minutes for better responsiveness on slow networks
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 0;
          const loaded = progressEvent.loaded || 0;
          let percent = total > 0 ? Math.round((loaded * 100) / total) : 0;
          percent = Math.max(0, Math.min(100, percent));
          
          if (percent === lastPercent) return;
          lastPercent = percent;

          const now = Date.now();

          // 1. Update Redux (UI) - Throttle to 2% change or 500ms
          if (percent === 100 || percent - lastReduxUpdate >= 2 || now - lastReduxUpdate >= 500) {
            store.dispatch(updateProgress(percent));
            lastReduxUpdate = now;
          }
          
          // 2. Update Notification - Throttle to 5% change or 2000ms
          if (this.currentNotificationId && (percent === 100 || percent === 0 || percent - lastNotifeeUpdate >= 5 || now - lastNotifeeUpdate >= 2000)) {
            lastNotifeeUpdate = now;
            console.log(`[UploadManager] Updating notification progress: ${percent}%`);
            notifee.displayNotification({
              id: this.currentNotificationId,
              title: `Uploading Post... ${percent}%`,
              body: metadata.caption || 'Sharing your post with the world',
              android: {
                channelId: CHANNEL_ID,
                progress: {
                  max: 100,
                  current: percent,
                },
              },
            }).catch(e => console.error('[UploadManager] Progress notification failed', e));
          }
        },
      });

      console.log('[UploadManager] Upload request completed. Status:', response?.status);

      // 4. Success Handling - Check status (since axiosInstance returns error response)
      if (response && (response.status === 200 || response.status === 201)) {
        console.log('[UploadManager] Upload Successful, finalizing UI...');
        store.dispatch(updateStatus('success'));
        if (this.currentNotificationId) {
          await notifee.displayNotification({
            id: this.currentNotificationId,
            title: 'Post Shared Successfully! ✅',
            body: 'Your post is now visible in the feed.',
            android: {
              channelId: CHANNEL_ID,
              // Remove progress bar on success
              progress: {
                max: 100,
                current: 100,
                indeterminate: false
              }
            },
          });
        }
      } else {
        const errorMsg = response?.data?.message || 'Server returned an error';
        throw new Error(String(errorMsg));
      }

      // Cleanup
      setTimeout(() => {
        store.dispatch(resetUpload());
        notifee.stopForegroundService();
      }, 3000);

    } catch (error: any) {
      console.error('[UploadManager] Upload Error:', error);
      
      // CRASH FIX: Ensure error message is ALWAYS a string for React Native rendering
      const finalErrorMsg = String(error?.message || error || 'Failed to upload post');
      store.dispatch(setUploadError(finalErrorMsg));
      
      if (this.currentNotificationId) {
        await notifee.displayNotification({
          id: this.currentNotificationId,
          title: 'Upload Failed ❌',
          body: finalErrorMsg.length > 50 ? 'Check your connection and try again.' : finalErrorMsg,
          android: {
            channelId: CHANNEL_ID,
          },
        });
      }

      setTimeout(() => {
        notifee.stopForegroundService();
      }, 5000);
    }
  }
}

export default UploadManager.getInstance();
