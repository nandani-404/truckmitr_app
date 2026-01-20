/**
 * Driver Ki Awaz - Post Status Screen
 * Clean, simple status display
 * @format
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { STACKS } from '@truckmitr/src/stacks/stacks';

type PostStatus = 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
type PostType = 'VIDEO' | 'VOICE' | 'TEXT';

interface RouteParams {
    status: PostStatus;
    postType: PostType;
    rejectionReason?: string;
}

const PostStatusScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const params = route.params as RouteParams;

    const { status, postType, rejectionReason } = params;

    const statusConfig = {
        UNDER_REVIEW: {
            emoji: '⏳',
            title: 'Under Review',
            subtitle: 'समीक्षा में है',
            description: 'Admin approval ke baad sab drivers dekh payenge. Usually 24 hours mein review ho jata hai.',
            color: '#F59E0B',
            bgColor: '#FFFBEB',
        },
        APPROVED: {
            emoji: '✅',
            title: 'Approved!',
            subtitle: 'स्वीकृत',
            description: 'Badhai ho! Aapka post ab live hai aur sab drivers dekh sakte hain.',
            color: '#10B981',
            bgColor: '#ECFDF5',
        },
        REJECTED: {
            emoji: '❌',
            title: 'Rejected',
            subtitle: 'अस्वीकृत',
            description: rejectionReason || 'Aapka post community guidelines ke anusaar nahi hai.',
            color: '#EF4444',
            bgColor: '#FEF2F2',
        },
    };

    const config = statusConfig[status];

    const postTypeLabels = {
        VIDEO: { label: 'Video', icon: 'videocam' },
        VOICE: { label: 'Voice', icon: 'mic' },
        TEXT: { label: 'Text', icon: 'create' },
    };

    const handleGoHome = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_INFO as any);
    };

    const handleCreateAnother = () => {
        navigation.navigate(STACKS.DRIVER_KI_AWAZ_CREATE_POST as any);
    };

    return (
        <View style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity
                style={[styles.closeButton, { top: insets.top + 16 }]}
                onPress={handleGoHome}
            >
                <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Status Display */}
                <View style={[styles.statusCard, { backgroundColor: config.bgColor }]}>
                    <Text style={styles.emoji}>{config.emoji}</Text>
                    <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
                    <Text style={styles.subtitle}>{config.subtitle}</Text>

                    {/* Post Type Badge */}
                    <View style={styles.badge}>
                        <Ionicons
                            name={postTypeLabels[postType].icon as any}
                            size={14}
                            color="#64748B"
                        />
                        <Text style={styles.badgeText}>{postTypeLabels[postType].label} Post</Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionBox}>
                    <Text style={styles.description}>{config.description}</Text>
                </View>

                {/* Timeline for Under Review */}
                {status === 'UNDER_REVIEW' && (
                    <View style={styles.timeline}>
                        <View style={styles.timelineItem}>
                            <View style={[styles.dot, styles.dotActive]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Post Submitted</Text>
                                <Text style={styles.timelineDesc}>Aapka post receive ho gaya</Text>
                            </View>
                        </View>
                        <View style={styles.line} />
                        <View style={styles.timelineItem}>
                            <View style={[styles.dot, styles.dotPending]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitlePending}>Admin Review</Text>
                                <Text style={styles.timelineDesc}>Review mein 24 hours lagte hain</Text>
                            </View>
                        </View>
                        <View style={styles.line} />
                        <View style={styles.timelineItem}>
                            <View style={[styles.dot, styles.dotPending]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitlePending}>Go Live</Text>
                                <Text style={styles.timelineDesc}>Sab drivers ko dikhega</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Bottom Buttons */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleCreateAnother}>
                    <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.secondaryText}>Create Another Post</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleGoHome} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#3B82F6', '#1D4ED8']}
                        style={styles.primaryButton}
                    >
                        <Ionicons name="home-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryText}>Go to Driver Ki Awaz</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    statusCard: {
        alignItems: 'center',
        padding: 32,
        borderRadius: 24,
        width: '100%',
        marginBottom: 20,
    },
    emoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    descriptionBox: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        width: '100%',
    },
    description: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        textAlign: 'center',
    },
    timeline: {
        width: '100%',
        paddingHorizontal: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 12,
        marginTop: 3,
    },
    dotActive: {
        backgroundColor: '#10B981',
    },
    dotPending: {
        backgroundColor: '#E2E8F0',
    },
    line: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginLeft: 6,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 8,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    timelineTitlePending: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
    },
    timelineDesc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    footer: {
        padding: 20,
        gap: 12,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3B82F6',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    primaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default PostStatusScreen;
