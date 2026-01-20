/**
 * Driver Ki Awaz - Context for State Management
 * @format
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Post, VideoPost, VoicePost, TextPost, Comment, PostStatus } from './types';

// State Interface
interface DriverKiAwazState {
    reels: VideoPost[];
    feedPosts: (VoicePost | TextPost)[];
    myPosts: Post[];
    currentReel: VideoPost | null;
    isLoading: boolean;
    error: string | null;
}

// Action Types
type Action =
    | { type: 'SET_REELS'; payload: VideoPost[] }
    | { type: 'SET_FEED_POSTS'; payload: (VoicePost | TextPost)[] }
    | { type: 'SET_MY_POSTS'; payload: Post[] }
    | { type: 'SET_CURRENT_REEL'; payload: VideoPost | null }
    | { type: 'TOGGLE_SUPPORT'; payload: { postId: string; postType: 'reel' | 'feed' } }
    | { type: 'ADD_POST'; payload: Post }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

// Initial State
const initialState: DriverKiAwazState = {
    reels: [],
    feedPosts: [],
    myPosts: [],
    currentReel: null,
    isLoading: false,
    error: null,
};

// Reducer
const driverKiAwazReducer = (state: DriverKiAwazState, action: Action): DriverKiAwazState => {
    switch (action.type) {
        case 'SET_REELS':
            return { ...state, reels: action.payload };
        case 'SET_FEED_POSTS':
            return { ...state, feedPosts: action.payload };
        case 'SET_MY_POSTS':
            return { ...state, myPosts: action.payload };
        case 'SET_CURRENT_REEL':
            return { ...state, currentReel: action.payload };
        case 'TOGGLE_SUPPORT':
            if (action.payload.postType === 'reel') {
                return {
                    ...state,
                    reels: state.reels.map(reel =>
                        reel.id === action.payload.postId
                            ? {
                                ...reel,
                                isSupported: !reel.isSupported,
                                supportCount: reel.isSupported
                                    ? reel.supportCount - 1
                                    : reel.supportCount + 1,
                            }
                            : reel
                    ),
                };
            } else {
                return {
                    ...state,
                    feedPosts: state.feedPosts.map(post =>
                        post.id === action.payload.postId
                            ? {
                                ...post,
                                isSupported: !post.isSupported,
                                supportCount: post.isSupported
                                    ? post.supportCount - 1
                                    : post.supportCount + 1,
                            }
                            : post
                    ),
                };
            }
        case 'ADD_POST':
            return { ...state, myPosts: [action.payload, ...state.myPosts] };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

// Context
interface DriverKiAwazContextType {
    state: DriverKiAwazState;
    dispatch: React.Dispatch<Action>;
    toggleSupport: (postId: string, postType: 'reel' | 'feed') => void;
    fetchReels: () => Promise<void>;
    fetchFeedPosts: () => Promise<void>;
    submitPost: (post: Post) => Promise<void>;
}

const DriverKiAwazContext = createContext<DriverKiAwazContextType | null>(null);

// Provider
export const DriverKiAwazProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(driverKiAwazReducer, initialState);

    const toggleSupport = (postId: string, postType: 'reel' | 'feed') => {
        dispatch({ type: 'TOGGLE_SUPPORT', payload: { postId, postType } });
        // TODO: API call to update support status
    };

    const fetchReels = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // TODO: Replace with actual API call
            // const response = await api.getReels();
            // dispatch({ type: 'SET_REELS', payload: response.data });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch reels' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const fetchFeedPosts = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // TODO: Replace with actual API call
            // const response = await api.getFeedPosts();
            // dispatch({ type: 'SET_FEED_POSTS', payload: response.data });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch posts' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const submitPost = async (post: Post) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // TODO: Replace with actual API call
            // await api.submitPost(post);
            dispatch({ type: 'ADD_POST', payload: post });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to submit post' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <DriverKiAwazContext.Provider
            value={{
                state,
                dispatch,
                toggleSupport,
                fetchReels,
                fetchFeedPosts,
                submitPost,
            }}
        >
            {children}
        </DriverKiAwazContext.Provider>
    );
};

// Hook
export const useDriverKiAwaz = () => {
    const context = useContext(DriverKiAwazContext);
    if (!context) {
        throw new Error('useDriverKiAwaz must be used within a DriverKiAwazProvider');
    }
    return context;
};
