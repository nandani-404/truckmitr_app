import axiosInstance from '@truckmitr/src/utils/config/axiosInstance';
import axios from 'axios';
import { END_POINTS } from '@truckmitr/src/utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to get User ID
const getUserId = async () => {
    try {
        // ALWAYS fetch profile to ensure we have the correct user ID corresponding to the current Auth Token.
        // Previously, we returned storedId immediately, which caused issues when switching accounts.
        console.log('[DriverKiAwaz] Fetching profile for UserID to ensure freshness...');

        // Remove the early return for storedId
        // const storedId = await AsyncStorage.getItem('user_id');
        // if (storedId) ...
        const response = await axiosInstance.get(END_POINTS.GET_PROFILE);

        // Check various locations for user ID in the response
        // Response structure: {status: true, user: {id: 92}, profile_of: 92, ...}
        let id = null;

        if (response.data?.user?.id) {
            id = response.data.user.id.toString();
        } else if (response.data?.profile_of) {
            id = response.data.profile_of.toString();
        } else if (response.data?.data?.id) {
            id = response.data.data.id.toString();
        }

        if (id) {
            await AsyncStorage.setItem('user_id', id);
            console.log('[DriverKiAwaz] Fetched and stored UserID:', id);
            return id;
        }

        console.error('[DriverKiAwaz] Could not find user ID in response:', response.data);
    } catch (error) {
        console.error('[DriverKiAwaz] Error fetching user ID:', error);
    }
    return ''; // Handle gracefully
};

export const DriverKiAwazService = {
    uploadPost: async (formData: FormData): Promise<{ data: any }> => {
        const userId = await getUserId();

        // Validate userId before upload
        if (!userId || userId.length === 0) {
            console.error('[DriverKiAwaz] No user ID available for upload');
            throw new Error('Please login to upload posts');
        }

        console.log('[DriverKiAwaz] Uploading post with userId:', userId);
        console.log('[DriverKiAwaz] Upload URL:', END_POINTS.DKA_POST);

        try {
            const response = await axios.post(END_POINTS.DKA_POST, formData, {
                headers: {
                    'x-user-id': userId,
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 60 second timeout for large files
            });

            console.log('[DriverKiAwaz] Upload success:', response.status, response.data);
            return { data: response.data };
        } catch (error: any) {
            console.error('[DriverKiAwaz] Upload error:', error?.response?.status, error?.response?.data || error.message);
            throw new Error(error?.response?.data?.message || error.message || 'Upload failed');
        }
    },

    getFeed: async (cursor?: string, lastId?: string) => {
        const userId = await getUserId();
        let url = END_POINTS.DKA_FEED;
        if (cursor && lastId) {
            url += `?cursor=${cursor}&id=${lastId}`;
        }
        return axios.get(url, { headers: { 'x-user-id': userId } });
    },

    getUserFeed: async (targetUserId: string, cursor?: string, lastId?: string) => {
        const currentUserId = await getUserId();
        let url = END_POINTS.DKA_USER_FEED(targetUserId);
        if (cursor && lastId) {
            url += `?cursor=${cursor}&id=${lastId}`;
        }
        return axios.get(url, { headers: { 'x-user-id': currentUserId } });
    },

    getUserDashboard: async (targetUserId?: string) => {
        const currentUserId = await getUserId();
        const uid = targetUserId || currentUserId;
        console.log('[DriverKiAwaz] Getting dashboard for user:', uid);

        const response = await fetch(END_POINTS.DKA_USER_DASHBOARD(uid), {
            method: 'GET',
            headers: {
                'x-user-id': currentUserId,
            }
        });

        if (!response.ok) {
            console.error('getUserDashboard failed', response.status);
            return { data: { posts: [] } };
        }
        return { data: await response.json() };
    },

    likePost: async (id: string) => {
        const userId = await getUserId();
        console.log('[DriverKiAwaz] Liking post:', id, 'User:', userId);

        const response = await fetch(END_POINTS.DKA_LIKE(id), {
            method: 'POST',
            headers: {
                'x-user-id': userId,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({})
        });

        const text = await response.text();
        console.log('[DriverKiAwaz] Like response:', response.status, text);

        if (!response.ok) {
            throw new Error(`Like failed with status ${response.status}: ${text}`);
        }

        try {
            return { data: JSON.parse(text) }; // Mock axios response structure
        } catch (e) {
            return { data: { success: true } };
        }
    },

    commentPost: async (id: string, comment: string) => {
        const userId = await getUserId();
        console.log('[DriverKiAwaz] Commenting:', id, comment);

        const response = await fetch(END_POINTS.DKA_COMMENT(id), {
            method: 'POST',
            headers: {
                'x-user-id': userId,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ comment })
        });

        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Comment failed: ${response.status} ${text}`);
        }
        return { data: JSON.parse(text) };
    },

    // deleteComment: async (id: string) => {
    //     const userId = await getUserId();
    //     console.log('[DriverKiAwaz] Deleting comment:', id);

    //     const response = await fetch(END_POINTS.DKA_DELETE_COMMENT(id), {
    //         method: 'DELETE',
    //         headers: {
    //             'x-user-id': userId,
    //             'Accept': 'application/json'
    //         }
    //     });

    //     if (!response.ok) {
    //         const text = await response.text();
    //         throw new Error(`Delete comment failed with status ${response.status}: ${text}`);
    //     }
    //     return { data: { success: true } };
    // },

    getComments: async (id: string) => {
        const userId = await getUserId();
        const response = await fetch(END_POINTS.DKA_GET_COMMENTS(id), {
            method: 'GET',
            headers: {
                'x-user-id': userId,
            }
        });
        if (!response.ok) {
            console.error('getComments failed', response.status);
            return { data: [] };
        }
        return { data: await response.json() };
    },

    sharePost: async (id: string) => {
        const userId = await getUserId();
        const response = await fetch(END_POINTS.DKA_SHARE(id), {
            method: 'POST',
            headers: {
                'x-user-id': userId,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({})
        });
        if (!response.ok) {
            throw new Error(`Share failed: ${response.status}`);
        }
        return { data: await response.json() };
    },

    editPost: async (id: string, caption: string) => {
        const userId = await getUserId();
        console.log('[DriverKiAwaz] Editing post:', id, 'Caption:', caption);

        const response = await fetch(END_POINTS.DKA_EDIT_POST(id), {
            method: 'PUT',
            headers: {
                'x-user-id': userId,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ caption })
        });

        const text = await response.text();
        console.log('[DriverKiAwaz] Edit response:', response.status, text);

        if (!response.ok) {
            throw new Error(`Edit failed with status ${response.status}: ${text}`);
        }

        try {
            return { data: JSON.parse(text) };
        } catch (e) {
            return { data: { success: true } };
        }
    },

    deletePost: async (id: string) => {
        const userId = await getUserId();
        console.log('[DriverKiAwaz] Deleting post:', id);

        const response = await fetch(END_POINTS.DKA_DELETE_POST(id), {
            method: 'DELETE',
            headers: {
                'x-user-id': userId,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Delete failed with status ${response.status}: ${text}`);
        }

        return { data: { success: true } };
    }
};
