import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
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
    Alert,
    useColorScheme,
} from 'react-native';
import FastImage from 'react-native-fast-image';
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

const THEME = {
    light: {
        bg: '#F8F9FA',
        card: '#FFFFFF',
        text: '#1F2937',
        subText: '#6B7280',
        border: '#E5E7EB',
        icon: '#374151',
        inputBg: '#F3F4F6',
        placeholder: '#9CA3AF',
        backdrop: 'rgba(0,0,0,0.4)',
    },
    dark: {
        bg: '#000000',
        card: '#1C1C1E',
        text: '#FFFFFF',
        subText: '#9CA3AF',
        border: '#2D2D2D',
        icon: '#FFFFFF',
        inputBg: '#2C2C2E',
        placeholder: '#9CA3AF',
        backdrop: 'rgba(0,0,0,0.6)',
    }
};

const CommentsModal: React.FC<CommentsModalProps> = ({ visible, postId, onClose, onCommentAdded }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user } = useSelector((state: any) => state.user);
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const theme = isDarkMode ? THEME.dark : THEME.light;

    const getAvatarUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${AWAZ_URL}public/${cleanPath}`;
    };

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
            Alert.alert(t('error'), t('failed_post_comment'));
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: Comment }) => {
        const avatarPath = item.user?.avatar || item.images;
        const avatarUrl = getAvatarUrl(avatarPath);
        const userName = item.user?.name || item.name || 'Anonymous';

        return (
            <View style={styles.commentItem}>
                {avatarUrl ? (
                    <FastImage
                        source={{ uri: avatarUrl, priority: FastImage.priority.normal }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={20} color={theme.subText} />
                    </View>
                )}
                <View style={styles.commentContent}>
                    <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
                    <Text style={[styles.commentText, { color: theme.text }]}>{item.comment}</Text>
                    <Text style={[styles.timeAgo, { color: theme.subText }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
            <View style={[styles.container, { backgroundColor: theme.backdrop }]}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.content, { backgroundColor: theme.card }]}
                >
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: theme.border }]} />
                    </View>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('comments')}</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={renderItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: theme.subText }]}>{t('no_comments')}</Text>
                            }
                        />
                    )}

                    <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                        {getAvatarUrl(user?.profile_image || user?.images) ? (
                            <FastImage
                                source={{ uri: getAvatarUrl(user?.profile_image || user?.images) as string, priority: FastImage.priority.low }}
                                style={[styles.inputAvatar, { borderRadius: 16 }]}
                            />
                        ) : (
                            <View style={[styles.inputAvatar, { backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }]}>
                                <Ionicons name="person" size={18} color={theme.subText} />
                            </View>
                        )}
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
                            placeholder={t('add_comment')}
                            placeholderTextColor={theme.placeholder}
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
                                <Text style={[styles.postText, !newComment.trim() && styles.postTextDisabled]}>{t('post_button')}</Text>
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
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        position: 'relative',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
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
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        maxHeight: 100,
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
