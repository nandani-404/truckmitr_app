import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps, Switch } from 'react-native';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from '../styles';
import { useTranslation } from 'react-i18next';

export const RenderInputField = ({ label, value, onChange, ...props }: { label: string, value: string, onChange?: (val: string) => void } & Omit<TextInputProps, 'onChange'>) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            style={[styles.input, props.editable === false && { backgroundColor: '#f0f0f0', color: '#666' }, props.style]}
            value={value}
            onChangeText={onChange}
            placeholderTextColor="#9CA3AF"
            {...props}
        />
    </View>
);

// Mandatory Label with red asterisk
export const MandatoryLabel = ({ text }: { text: string }) => (
    <Text style={styles.inputLabel}>
        {text} <Text style={{ color: '#EF4444' }}>*</Text>
    </Text>
);

// Optional Label with (optional) suffix
export const OptionalLabel = ({ text }: { text: string }) => {
    const { t } = useTranslation();
    return (
        <Text style={styles.inputLabel}>
            {text} <Text style={{ fontSize: 12, fontWeight: '400', color: '#999' }}>({t('optional').toLowerCase()})</Text>
        </Text>
    );
};

export const RenderDropdown = ({ label, value, data, onChange }: { label: string, value: string, data: any[], onChange: (item: any) => void }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={data}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={`Select ${label}`}
            value={value}
            onChange={onChange}
        />
    </View>
);

export const RenderMultiSelect = ({ label, value, data, onChange }: { label: string, value: string[], data: any[], onChange: (item: any) => void }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <MultiSelect
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            search
            data={data}
            labelField="label"
            valueField="value"
            placeholder={`Select ${label}`}
            searchPlaceholder="Search..."
            value={value}
            onChange={onChange}
            selectedStyle={styles.selectedStyle}
        />
    </View>
);

export const RenderFacilityCheckbox = ({ label, isChecked, onToggle, color }: { label: string, isChecked: boolean, onToggle: () => void, color: string }) => (
    <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={onToggle}
    >
        <View style={[
            styles.checkbox,
            isChecked && { backgroundColor: color, borderColor: color }
        ]}>
            {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
);

export const RenderRadioButton = ({ label, selected, onPress, color }: { label: string, selected: boolean, onPress: () => void, color: string }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
        <View style={[styles.radioCircle, selected && { borderColor: color }]}>
            {selected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
);

export const RenderSwitch = ({ label, value, onValueChange, color }: { label: string, value: boolean, onValueChange: (val: boolean) => void, color: string }) => (
    <View style={styles.switchContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
            onPress={() => onValueChange(!value)}
            style={[styles.switchTrack, value && { backgroundColor: color }]}
        >
            <View style={[styles.switchThumb, value && { transform: [{ translateX: 20 }] }]} />
        </TouchableOpacity>
    </View>
);
