import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from '../styles';

export const RenderInputField = ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
    editable = true,
    maxLength,
    loading = false,
    error = null,
    success = false,
    multiline = false,
}: {
    label: string,
    value: string,
    onChange?: (val: string) => void,
    placeholder?: string,
    keyboardType?: any,
    editable?: boolean,
    maxLength?: number,
    loading?: boolean,
    error?: string | null,
    success?: boolean,
    multiline?: boolean
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={{ position: 'relative' }}>
            <TextInput
                style={[
                    styles.input,
                    !editable && { backgroundColor: '#F3F4F6', color: '#6B7280' },
                    error ? { borderColor: '#EF4444' } : null,
                    success ? { borderColor: '#10B981', backgroundColor: '#F0FDF4' } : null
                ]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboardType}
                editable={editable}
                maxLength={maxLength}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                selection={!editable ? { start: 0 } : undefined}
                autoCapitalize={label.includes('PAN') || label.includes('GST') ? 'characters' : 'none'}
            />
            {loading && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                    <ActivityIndicator size="small" color="#2563EB" />
                </View>
            )}
            {success && !loading && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
            )}
        </View>
        {error ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 4 }}>{error}</Text> : null}
    </View>
);

export const RenderDropdown = ({ label, value, data, onChange, placeholder, disable = false }: { label: string, value: string, data: any[], onChange: (item: any) => void, placeholder?: string, disable?: boolean }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Dropdown
            style={[styles.dropdown, disable && { backgroundColor: '#F3F4F6' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={[styles.selectedTextStyle, disable && { color: '#6B7280' }]}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={data}
            disable={disable}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={placeholder || `Select ${label}`}
            value={value}
            onChange={onChange}
        />
    </View>
);

export const RenderSwitch = ({ label, value, onValueChange, color, disabled = false }: { label: string, value: boolean, onValueChange: (val: boolean) => void, color: string, disabled?: boolean }) => (
    <View style={styles.switchContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
            onPress={() => !disabled && onValueChange(!value)}
            disabled={disabled}
            style={[styles.switchTrack, value && { backgroundColor: disabled ? '#D1D5DB' : color }]}
        >
            <View style={[styles.switchThumb, value && { transform: [{ translateX: 20 }] }]} />
        </TouchableOpacity>
    </View>
);

export const RenderFileUpload = ({ label, onUpload, imageUri, onDelete, onImagePress }: { label: string, onUpload: () => void, imageUri?: string | null, onDelete?: () => void, onImagePress?: () => void }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {imageUri ? (
            <View style={{ position: 'relative', width: 100, height: 100 }}>
                <TouchableOpacity activeOpacity={0.8} onPress={onImagePress}>
                    <Image
                        source={{ uri: imageUri || undefined }}
                        style={{ width: '100%', height: '100%', borderRadius: 8 }}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
                {onDelete && <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                    <Ionicons name="close-circle" size={20} color="red" />
                </TouchableOpacity>}
            </View>
        ) : (
            <TouchableOpacity style={styles.emptyPhotoState} onPress={onUpload}>
                <Ionicons name="cloud-upload-outline" size={24} color="#9CA3AF" />
                <Text style={styles.emptyPhotoText}>Upload {label}</Text>
            </TouchableOpacity>
        )}
    </View>
);
