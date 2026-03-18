/**
 * Driver Ki Awaz - Main Entry Point
 * @format
 */

import React from 'react';
import DriverKiAwazHome from './DriverKiAwazHome';

// Main component that wraps the feature
const DriverKiAwazInfo: React.FC = () => {
    return <DriverKiAwazHome />;
};

export default DriverKiAwazInfo;

// Export screens for navigation
export { default as CreatePostScreen } from './screens/CreatePostScreen';
export { default as PostStatusScreen } from './screens/PostStatusScreen';
export { default as MyPostsScreen } from './screens/MyPostsScreen';
export { default as PostDetailScreen } from './screens/PostDetailScreen';
export { default as ReelsScreen } from './screens/ReelsScreen';
export { default as FeedScreen } from './screens/FeedScreen';
export { default as ProfileFeedScreen } from './screens/ProfileFeedScreen';
export { default as SingleReelScreen } from './screens/SingleReelScreen';
