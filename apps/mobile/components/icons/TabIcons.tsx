import React from "react";
import Svg, { Path, Rect, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 22, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ListChecksIcon({ size = 22, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 5h8M13 12h8M13 19h8M3 17l2 2l4-4M3 7l2 2l4-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StickyNoteIcon({ size = 22, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 9a2.4 2.4 0 00-.706-1.706l-3.588-3.588A2.4 2.4 0 0015 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" />
        <Path d="M15 3v5a1 1 0 001 1h5" />
      </G>
    </Svg>
  );
}
