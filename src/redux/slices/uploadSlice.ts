import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error';

interface UploadState {
  isUploading: boolean;
  progress: number;
  status: UploadStatus;
  error: string | null;
  postMetadata: {
    type: string;
    category: string;
    caption: string;
    mediaUri?: string;
    thumbnailUri?: string;
  } | null;
}

const initialState: UploadState = {
  isUploading: false,
  progress: 0,
  status: 'idle',
  error: null,
  postMetadata: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    startUpload: (state, action: PayloadAction<{ 
      type: string; 
      category: string; 
      caption: string;
      mediaUri?: string;
      thumbnailUri?: string;
    }>) => {
      state.isUploading = true;
      state.progress = 0;
      state.status = 'compressing';
      state.error = null;
      state.postMetadata = action.payload;
    },
    updateProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    updateStatus: (state, action: PayloadAction<UploadStatus>) => {
      state.status = action.payload;
      if (action.payload === 'success' || action.payload === 'error') {
        state.isUploading = false;
      }
    },
    setUploadError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
      state.isUploading = false;
    },
    resetUpload: (state) => {
      state.isUploading = false;
      state.progress = 0;
      state.status = 'idle';
      state.error = null;
      state.postMetadata = null;
    },
  },
});

export const { startUpload, updateProgress, updateStatus, setUploadError, resetUpload } = uploadSlice.actions;
export default uploadSlice.reducer;
