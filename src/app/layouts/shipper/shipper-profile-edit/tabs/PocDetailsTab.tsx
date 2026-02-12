import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShipperProfile } from '../ShipperProfileContext';
import { RenderInputField } from '../components/FormComponents';
import { styles } from '../styles';

const PocDetailsTab = () => {
    const { profileData, setProfileData, saveProfile, loading } = useShipperProfile();
    const navigation = useNavigation();

    const handleSave = async () => {
        const success = await saveProfile();
        if (success) {
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Secondary Point of Contact (Optional)</Text>

                    <RenderInputField
                        label="Name"
                        value={profileData.secondContactName}
                        onChange={(text) => setProfileData(prev => ({ ...prev, secondContactName: text }))}
                        placeholder="Enter Name"
                    />

                    <RenderInputField
                        label="Mobile Number"
                        value={profileData.secondMobile}
                        maxLength={10}
                        onChange={(text) => setProfileData(prev => ({ ...prev, secondMobile: text }))}
                        placeholder="Enter Mobile Number"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Save Button */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default PocDetailsTab;
