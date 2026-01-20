/**
 * Driver Ki Awaz - Create Post Screen
 * Clean, simple post creation interface
 * @format
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { STACKS } from '@truckmitr/src/stacks/stacks';

type PostType = 'VIDEO' | 'VOICE' | 'TEXT';
type CategoryType = 'DRIVER_LIFE' | 'GOVT_DEMAND' | 'ROAD_ISSUES' | 'RTO_CHALLAN' | 'WELFARE_RIGHTS';

interface RouteParams {
    defaultType?: PostType;
}

const CATEGORIES = [
    { id: 'DRIVER_LIFE', label: '🚛 Driver Life', color: '#3B82F6' },
    { id: 'GOVT_DEMAND', label: '🏛️ Govt Demand', color: '#8B5CF6' },
    { id: 'ROAD_ISSUES', label: '🛣️ Road Issues', color: '#F59E0B' },
    { id: 'RTO_CHALLAN', label: '📋 RTO Issues', color: '#EF4444' },
    { id: 'WELFARE_RIGHTS', label: '⚖️ Welfare Rights', color: '#10B981' },
];

interface CreatePostProps {
    onClose?: () => void;
    defaultType?: PostType;
}

const CreatePostScreen: React.FC<CreatePostProps> = ({ onClose, defaultType }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();
    const insets = useSafeAreaInsets();

    // Safely get params if they exist, otherwise undefined
    const params = route?.params as RouteParams | undefined;

    const [selectedType, setSelectedType] = useState<PostType | null>(
        defaultType || params?.defaultType || null
    );
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
    const [textContent, setTextContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    const postTypes = [
        {
            type: 'VIDEO' as PostType,
            icon: 'videocam',
            label: 'Video',
            subtitle: 'Record short video',
            color: '#EF4444',
            bgColor: '#FEF2F2',
        },
        {
            type: 'VOICE' as PostType,
            icon: 'mic',
            label: 'Voice',
            subtitle: 'Record voice message',
            color: '#3B82F6',
            bgColor: '#EFF6FF',
        },
        {
            type: 'TEXT' as PostType,
            icon: 'create',
            label: 'Text',
            subtitle: 'Write your thoughts',
            color: '#10B981',
            bgColor: '#ECFDF5',
        },
    ];

    const handleTypeSelect = (type: PostType) => {
        setSelectedType(type);
        if (type === 'VIDEO') {
            Alert.alert('Coming Soon', 'Video recording will be available soon!');
        } else if (type === 'VOICE') {
            navigation.navigate(STACKS.DRIVER_KI_AWAZ_RECORD_VOICE as any, { category: selectedCategory });
        }
    };

    const handleSubmit = async () => {
        if (!selectedCategory) {
            Alert.alert('Category Required', 'Please select a category for your post.');
            return;
        }

        if (selectedType === 'TEXT' && !textContent.trim()) {
            Alert.alert('Content Required', 'Please write something to share.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));

            navigation.navigate(STACKS.DRIVER_KI_AWAZ_POST_STATUS as any, {
                status: 'UNDER_REVIEW',
                postType: selectedType,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                >
                    <Ionicons name="close" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Raise Your Awaz</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Post Type Selection */}
                    <Text style={styles.sectionTitle}>How do you want to share?</Text>
                    <View style={styles.typeContainer}>
                        {postTypes.map(item => (
                            <TouchableOpacity
                                key={item.type}
                                style={[
                                    styles.typeCard,
                                    selectedType === item.type && {
                                        backgroundColor: item.bgColor,
                                        borderColor: item.color,
                                    },
                                ]}
                                onPress={() => handleTypeSelect(item.type)}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.typeIcon,
                                        { backgroundColor: item.color },
                                    ]}
                                >
                                    <Ionicons name={item.icon as any} size={22} color="#FFFFFF" />
                                </View>
                                <Text style={[styles.typeLabel, { color: item.color }]}>
                                    {item.label}
                                </Text>
                                <Text style={styles.typeSubtitle}>{item.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Category Selection */}
                    <Text style={styles.sectionTitle}>Select Category *</Text>
                    <View style={styles.categoryContainer}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat.id && {
                                        backgroundColor: cat.color,
                                        borderColor: cat.color,
                                    },
                                ]}
                                onPress={() => setSelectedCategory(cat.id as CategoryType)}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        selectedCategory === cat.id && { color: '#FFFFFF' },
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Text Content (for TEXT type) */}
                    {selectedType === 'TEXT' && (
                        <View style={styles.textSection}>
                            <Text style={styles.sectionTitle}>Your Message</Text>
                            <TextInput
                                style={styles.textInput}
                                value={textContent}
                                onChangeText={setTextContent}
                                placeholder="Apni baat yahan likhein..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>{textContent.length}/500</Text>
                        </View>
                    )}

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text style={styles.infoText}>
                            Admin approval ke baad aapka post sab drivers ko dikhega
                        </Text>
                    </View>
                </ScrollView>

                {/* Submit Button */}
                {selectedType === 'TEXT' && (
                    <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            activeOpacity={0.9}
                            disabled={isSubmitting || !selectedCategory || !textContent.trim()}
                        >
                            <LinearGradient
                                colors={
                                    isSubmitting || !selectedCategory || !textContent.trim()
                                        ? ['#CBD5E1', '#94A3B8']
                                        : ['#3B82F6', '#1D4ED8']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButton}
                            >
                                {isSubmitting ? (
                                    <Text style={styles.submitText}>Submitting...</Text>
                                ) : (
                                    <>
                                        <Ionicons name="send" size={20} color="#FFFFFF" />
                                        <Text style={styles.submitText}>Submit for Approval</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    typeIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    typeSubtitle: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
        textAlign: 'center',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    textSection: {
        marginBottom: 24,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#1E293B',
        minHeight: 140,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    charCount: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 6,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 14,
        borderRadius: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        fontWeight: '500',
    },
    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default CreatePostScreen;
