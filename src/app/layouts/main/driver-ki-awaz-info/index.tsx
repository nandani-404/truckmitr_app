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
export {
    CreatePostScreen,
    RecordVoiceScreen,
    PostStatusScreen,
    MyPostsScreen,
    ReelsScreen,
    FeedScreen,
    ProfileFeedScreen
} from './screens';
