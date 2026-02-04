import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';

export const MandatoryLabel = ({ text, style }: { text: string, style?: any }) => (
    <Text style={[styles.classicLabel, style]}>
        {text} <Text style={{ color: 'red' }}>*</Text>
    </Text>
);

export const InputItem = ({ label, icon, placeholder, value, onChangeText, keyboardType, maxLength, optional, onPress, editable = true }: any) => {
    const { t } = useTranslation();
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={[styles.classicLabel, { marginLeft: 4, marginBottom: 6 }]}>
                {label} {optional && <Text style={styles.optionalText}>{t('puncture_optional')}</Text>}
                {!optional && <Text style={{ color: 'red' }}>*</Text>}
            </Text>
            <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
                <View style={styles.inputWrapper}>
                    <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                    <TextInput
                        style={styles.cleanInput}
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChangeText}
                        keyboardType={keyboardType}
                        maxLength={maxLength}
                        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                        editable={editable}
                        pointerEvents={editable ? 'auto' : 'none'}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
};
