/**
 * Driver Ki Awaz - Types and Interfaces
 * @format
 */

// Post Categories
export type PostCategory =
    | 'DRIVER_LIFE'
    | 'RTO_CHALLAN'
    | 'WELFARE_RIGHTS'
    | 'GOVT_DEMAND'
    | 'ROAD_ISSUES';

// Post Types
export type PostType = 'VIDEO' | 'VOICE' | 'TEXT';

// Post Status
export type PostStatus = 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

// Category Data
export const CATEGORIES: { id: PostCategory; label: string; labelHi: string; icon: string; color: string }[] = [
    { id: 'DRIVER_LIFE', label: 'Driver Life', labelHi: 'ड्राइवर लाइफ', icon: 'car', color: '#3B82F6' },
    { id: 'RTO_CHALLAN', label: 'RTO / Challan', labelHi: 'RTO / चालान', icon: 'document-text', color: '#EF4444' },
    { id: 'WELFARE_RIGHTS', label: 'Welfare & Rights', labelHi: 'कल्याण और अधिकार', icon: 'shield-checkmark', color: '#10B981' },
    { id: 'GOVT_DEMAND', label: 'Govt Demand', labelHi: 'सरकार से मांग', icon: 'business', color: '#F59E0B' },
    { id: 'ROAD_ISSUES', label: 'Road Issues', labelHi: 'सड़क समस्याएं', icon: 'warning', color: '#8B5CF6' },
];

// User Interface
export interface User {
    id: string;
    name: string;
    avatar: string;
    state: string;
    tmId: string;
}

// Comment Interface
export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
}

// Base Post Interface
export interface BasePost {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userState: string;
    category: PostCategory;
    hashtags: string[];
    supportCount: number;
    commentCount: number;
    shareCount: number;
    isSupported: boolean;
    status: PostStatus;
    rejectionReason?: string;
    createdAt: string;
}

// Video Post (Reel)
export interface VideoPost extends BasePost {
    type: 'VIDEO';
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
}

// Voice Post
export interface VoicePost extends BasePost {
    type: 'VOICE';
    audioUrl: string;
    duration: number;
    waveform?: number[];
}

// Text Post
export interface TextPost extends BasePost {
    type: 'TEXT';
    content: string;
}

// Union Type for all Posts
export type Post = VideoPost | VoicePost | TextPost;

// Feed Post (Voice or Text)
export type FeedPost = VoicePost | TextPost;

// Action Types
export type ActionType = 'SUPPORT' | 'COMMENT' | 'SHARE';
