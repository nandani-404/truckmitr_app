import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import FeedScreen from './FeedScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ProfileFeedScreen = () => {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const params = route.params as { userId: string, userName?: string };
    const { userId, userName } = params || {};

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>{userName ? `${userName}'s Posts` : 'Profile Feed'}</Text>
            </View>
            {userId ? (
                <FeedScreen userId={userId} />
            ) : (
                <View style={styles.error}>
                    <Text>User not found</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    backButton: { marginRight: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    error: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default ProfileFeedScreen;
