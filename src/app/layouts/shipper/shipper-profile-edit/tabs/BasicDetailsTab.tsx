import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShipperProfile } from '../ShipperProfileContext';
import { RenderInputField } from '../components/FormComponents';
import { styles } from '../styles';

const STATE_ID_MAP: Record<string, string> = {
    '1': 'Andaman and Nicobar Islands',
    '2': 'Andhra Pradesh',
    '3': 'Arunachal Pradesh',
    '4': 'Assam',
    '5': 'Bihar',
    '6': 'Chandigarh',
    '7': 'Chhattisgarh',
    '8': 'Dadra and Nagar Haveli',
    '9': 'Delhi',
    '10': 'Goa',
    '11': 'Gujarat',
    '12': 'Haryana',
    '13': 'Himachal Pradesh',
    '14': 'Jammu and Kashmir',
    '15': 'Jharkhand',
    '16': 'Karnataka',
    '17': 'Kerala',
    '18': 'Ladakh',
    '19': 'Lakshadweep',
    '20': 'Madhya Pradesh',
    '21': 'Maharashtra',
    '22': 'Manipur',
    '23': 'Meghalaya',
    '24': 'Mizoram',
    '25': 'Nagaland',
    '26': 'Odisha',
    '27': 'Others',
    '28': 'Puducherry',
    '29': 'Punjab',
    '30': 'Rajasthan',
    '31': 'Sikkim',
    '32': 'Tamil Nadu',
    '33': 'Telangana',
    '34': 'Tripura',
    '35': 'Uttar Pradesh',
    '36': 'Uttarakhand',
    '37': 'West Bengal',
    '38': 'Daman and Diu',
};

// Reverse map: state name → state ID
const STATE_NAME_TO_ID: Record<string, string> = Object.fromEntries(
    Object.entries(STATE_ID_MAP).map(([id, name]) => [name.toLowerCase(), id])
);

const getStateIdByName = (stateName: string): string => {
    return STATE_NAME_TO_ID[stateName.toLowerCase()] || '27'; // '27' = Others
};

const getStateNameById = (stateId: string): string => {
    return STATE_ID_MAP[stateId] || '';
};

const BasicDetailsTab = () => {
    const { profileData, setProfileData, saveProfile, loading } = useShipperProfile();
    const navigation = useNavigation();
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [stateName, setStateName] = useState('');

    const fetchPincodeData = async (pincode: string) => {
        if (pincode.length !== 6) return;
        try {
            setPincodeLoading(true);
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();
            if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
                const postOffices = data[0].PostOffice;
                const district = postOffices[0]?.District || '';
                const apiStateName = postOffices[0]?.State || '';
                const stateId = getStateIdByName(apiStateName);
                setStateName(apiStateName);
                setProfileData(prev => ({
                    ...prev,
                    state: stateId,
                    city: district,
                }));
            }
        } catch (error) {
            console.error('Pincode API error:', error);
        } finally {
            setPincodeLoading(false);
        }
    };

    const handlePincodeChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
        setProfileData(prev => ({ ...prev, pincode: cleaned }));
        if (cleaned.length === 6) {
            fetchPincodeData(cleaned);
        }
    };

    // Fetch pincode data on mount if pincode already exists
    useEffect(() => {
        if (profileData.pincode?.length === 6) {
            fetchPincodeData(profileData.pincode);
        } else if (profileData.state) {
            // If state ID already exists (from API), resolve its name
            setStateName(getStateNameById(profileData.state));
        }
    }, []);

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
                    <Text style={styles.sectionTitle}>Contact Info</Text>

                    <RenderInputField
                        label="Email"
                        value={profileData.email}
                        onChange={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                        placeholder="Enter Email"
                        keyboardType="email-address"
                    />

                    <RenderInputField
                        label="Phone"
                        value={profileData.phone}
                        onChange={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                        placeholder="Enter Phone"
                        keyboardType="phone-pad"
                        editable={false}
                    />
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Address Info</Text>

                    <View>
                        <RenderInputField
                            label="Pincode"
                            value={profileData.pincode}
                            onChange={handlePincodeChange}
                            placeholder="Enter 6-digit Pincode"
                            keyboardType="number-pad"
                        />
                        {pincodeLoading && (
                            <View style={{ position: 'absolute', right: 12, top: 38 }}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                            </View>
                        )}
                    </View>

                    <RenderInputField
                        label="District"
                        value={profileData.pincode?.length === 6 ? profileData.city : ''}
                        placeholder={profileData.pincode?.length === 6 ? 'Auto-filled from Pincode' : 'Fill pincode first'}
                        editable={false}
                    />

                    <RenderInputField
                        label="State"
                        value={profileData.pincode?.length === 6 ? stateName : ''}
                        placeholder={profileData.pincode?.length === 6 ? 'Auto-filled from Pincode' : 'Fill pincode first'}
                        editable={false}
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

export default BasicDetailsTab;

