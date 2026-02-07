import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DriverKiAwazService } from '../services';
import { AWAZ_URL } from '@truckmitr/src/utils/config';

interface Comment {
    id: string | number;
    comment: string;
    user_id: string | number;
    created_at: string;
    name?: string;       // User's name from API
    images?: string;     // User's profile image path from API
    can_edit?: number;
    user?: {
        name: string;
        avatar: string;
    };
}

interface CommentsModalProps {
    visible: boolean;
    postId: string | null;
    onClose: () => void;
    onCommentAdded?: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ visible, postId, onClose, onCommentAdded }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [visible, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const response = await DriverKiAwazService.getComments(postId);
            if (response.data && Array.isArray(response.data)) {
                setComments(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                setComments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching comments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!postId || !newComment.trim()) return;

        setSubmitting(true);
        try {
            await DriverKiAwazService.commentPost(postId, newComment);
            setNewComment('');
            fetchComments(); // Refresh list
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error('Error posting comment', error);
            Alert.alert('Error', 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: Comment }) => {
        // Construct avatar URL from images field - use AWAZ_URL + public/ as base
        const avatarUrl = item.images
            ? (item.images.startsWith('http') ? item.images : `${AWAZ_URL}public/${item.images}`)
            : item.user?.avatar || 'https://via.placeholder.com/150';

        const userName = item.name || item.user?.name || `User ${item.user_id}`;

        return (
            <View style={styles.commentItem}>
                {avatarUrl && avatarUrl !== 'https://via.placeholder.com/150' ? (
                    <Image
                        source={{ uri: avatarUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={20} color="#9CA3AF" />
                    </View>
                )}
                <View style={styles.commentContent}>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.commentText}>{item.comment}</Text>
                    <Text style={styles.timeAgo}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('comments')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={styles.loading} color="#3B82F6" />
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={renderItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No comments yet. Be the first to say something!</Text>
                            }
                        />
                    )}

                    <View style={styles.inputContainer}>
                        <View style={[styles.inputAvatar, { backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="person" size={18} color="#9CA3AF" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a comment..."
                            placeholderTextColor="#9CA3AF"
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!newComment.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={[styles.postText, !newComment.trim() && styles.postTextDisabled]}>Post</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        backgroundColor: '#1C1C1E', // Dark background like Instagram dark mode
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        height: '70%',
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#4B5563',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2D2D2D',
        position: 'relative',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    loading: {
        marginTop: 20,
    },
    listContent: {
        padding: 16,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    userName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#F3F4F6',
        marginBottom: 4,
        lineHeight: 18,
    },
    timeAgo: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#2D2D2D',
        backgroundColor: '#1C1C1E',
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        maxHeight: 100,
        color: '#FFFFFF',
        fontSize: 14,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    sendButtonDisabled: {
        // No background change needed for text button
    },
    postText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 15,
    },
    postTextDisabled: {
        color: 'rgba(59, 130, 246, 0.5)',
    },
});

export default CommentsModal;
