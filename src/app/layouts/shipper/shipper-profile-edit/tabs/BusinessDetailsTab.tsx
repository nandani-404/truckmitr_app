import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShipperProfile } from '../ShipperProfileContext';
import { RenderInputField, RenderDropdown } from '../components/FormComponents';
import { styles } from '../styles';

const yearsInBusinessOptions = [
    { label: '0-1 Years', value: '0-1' },
    { label: '1-3 Years', value: '1-3' },
    { label: '3-5 Years', value: '3-5' },
    { label: '5-10 Years', value: '5-10' },
    { label: '10-20 Years', value: '10-20' },
    { label: '20+ Years', value: '20+' },
];

const monthlyLoadsOptions = [
    { label: '1-100 T', value: '1-100 T' },
    { label: '101-200 T', value: '101-200 T' },
    { label: '201-300 T', value: '201-300 T' },
    { label: '301-400 T', value: '301-400 T' },
    { label: '401-500 T', value: '401-500 T' },
    { label: '501-600 T', value: '501-600 T' },
    { label: '601-700 T', value: '601-700 T' },
    { label: '701-800 T', value: '701-800 T' },
    { label: '801-900 T', value: '801-900 T' },
    { label: '901-1000 T', value: '901-1000 T' },
    { label: '1000+ T', value: '1000+ T' },
];

const BusinessDetailsTab = () => {
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
                    <Text style={styles.sectionTitle}>Business Info</Text>


                    <RenderDropdown
                        label="Year in Business"
                        value={profileData.yearInBusiness}
                        data={yearsInBusinessOptions}
                        onChange={(item) => setProfileData(prev => ({ ...prev, yearInBusiness: item.value }))}
                    />

                    <RenderDropdown
                        label="Monthly Loads"
                        value={profileData.monthlyLoads}
                        data={monthlyLoadsOptions}
                        onChange={(item) => setProfileData(prev => ({ ...prev, monthlyLoads: item.value }))}
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

export default BusinessDetailsTab;
