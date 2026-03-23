
import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
    size?: number;
    color?: string;
}

export const DriverIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G fill={color}>
            <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
            <Path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            <Path d="M7 6.5C7 5.5 9.5 4 12 4s5 1.5 5 2.5v1.5H7v-1.5z" opacity={0.8} />
        </G>
    </Svg>
);

export const ShipperIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 4h18v16H3V4z" fill={color} />
        <Path d="M10 4h4v16h-4V4z" fill="#FFFFFF" opacity={0.2} />
        <Path d="M3 9h18v2H3V9z" fill="#FFFFFF" opacity={0.2} />
        <Path d="M7 14h2v2H7v-2zm8 0h2v2h-2v-2z" fill="#FFFFFF" />
    </Svg>
);

export const TransporterIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G fill={color}>
            <Path d="M3 13h13V6H3v7zm15-4v2h2v-2h-2z" />
            <Path d="M17 13h4v-3l-3-3h-1v6z" />
            <Path d="M3 14h18v1H3v-1z" />
            <Circle cx="6" cy="17" r="2" />
            <Circle cx="16" cy="17" r="2" />
        </G>
    </Svg>
);

export const ForemanIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G fill={color}>
            <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
            <Path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            <Path d="M10.5 14.5l1.5 3 1.5-3h-3z" fill="#FFFFFF" />
        </G>
    </Svg>
);

export const AssociationIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G fill={color}>
            <Circle cx="12" cy="7" r="3" />
            <Path d="M12 11c-2.33 0-7 1.17-7 3.5V17h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            <Circle cx="7" cy="10" r="2" opacity={0.7} />
            <Path d="M7 13c-1.5 0-4.5.75-4.5 2.25V17h4v-2c0-.7.3-1.3.8-1.8-.1-.1-.1-.2-.3-.2z" opacity={0.7} />
            <Circle cx="17" cy="10" r="2" opacity={0.7} />
            <Path d="M17 13c.2 0 .2.1.3.2.5.5.8 1.1.8 1.8v2h4v-1.75c0-1.5-3-2.25-4.5-2.25z" opacity={0.7} />
        </G>
    </Svg>
);

export const PunctureIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G stroke={color} strokeWidth="2" fill="none">
            <Circle cx="12" cy="12" r="8" />
            <Circle cx="12" cy="12" r="3" />
        </G>
        <Path d="M17 5l2 2-8 8-2-2 8-8z" fill={color} />
        <Path d="M19 3l2 2-3 3-2-2 3-3z" fill={color} />
    </Svg>
);

export const DhabaIcon = ({ size = 36, color = '#3B82F6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G fill={color}>
            <Path d="M12 5C7 5 4 7 4 10v2h16v-2c0-3-3-5-8-5z" />
            <Path d="M3 12h18v2H3z" />
            <Path d="M5 14v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4" />
            <Path d="M14 3l2 3h1l-1-3h-2z" />
        </G>
    </Svg>
);
