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

const CHANNEL_ID = 'upload_channel';

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
      importance: AndroidImportance.HIGH,
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
          importance: AndroidImportance.HIGH,
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
        await notifee.displayNotification({
          id: this.currentNotificationId,
          title: 'Compressing Video...',
          body: 'We are making your video smaller for faster uploading.',
          android: {
            channelId: CHANNEL_ID,
            progress: { max: 100, current: 0, indeterminate: true },
          },
        });

        const compressedUri = await VideoCompressor.compress(
          mediaUri,
          {
            compressionMethod: 'auto',
            maxSize: 720,
            bitrate: 2500000,
          },
          (progress) => {
            // Update Redux if needed (can be too noisy, so maybe just status)
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

      await axiosInstance.post(END_POINTS.DKA_POST, formData, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for background
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 0;
          const loaded = progressEvent.loaded || 0;
          let percent = total > 0 ? Math.round((loaded * 100) / total) : 0;
          percent = Math.max(0, Math.min(100, percent));
          
          store.dispatch(updateProgress(percent));
          
          notifee.displayNotification({
            id: this.currentNotificationId!,
            title: `Uploading Post... ${percent}%`,
            body: metadata.caption || 'Sharing your post with the world',
            android: {
              channelId: CHANNEL_ID,
              progress: {
                max: 100,
                current: percent,
              },
            },
          });
        },
      });

      // 4. Success Handling
      store.dispatch(updateStatus('success'));
      await notifee.displayNotification({
        id: this.currentNotificationId,
        title: 'Post Shared Successfully! ✅',
        body: 'Your post is now visible in the feed.',
        android: {
          channelId: CHANNEL_ID,
        },
      });

      // Cleanup
      setTimeout(() => {
        store.dispatch(resetUpload());
        notifee.stopForegroundService();
      }, 3000);

    } catch (error: any) {
      console.error('[UploadManager] Upload Error:', error);
      store.dispatch(setUploadError(error.message || 'Failed to upload post'));
      
      await notifee.displayNotification({
        id: this.currentNotificationId!,
        title: 'Upload Failed ❌',
        body: 'Check your connection and try again.',
        android: {
          channelId: CHANNEL_ID,
        },
      });

      setTimeout(() => {
        notifee.stopForegroundService();
      }, 5000);
    }
  }
}

export default UploadManager.getInstance();
