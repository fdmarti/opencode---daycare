
import type { CSSProperties } from "react";

// Tailwind has no stroke-linecap/linejoin utilities; SVG attributes it.
const iconProps = {
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

/** Shared size prop for every icon in this file. */
export interface IconProps {
    /** Rendered width and height in pixels. Defaults to 20. */
    size?: number;
    /** Clockwise rotation in degrees. Defaults to 0. */
    rotate?: number;
}

/** Builds the inline rotation style shared by every icon. */
function rotateStyle(rotate: number): CSSProperties {
    return { transform: `rotate(${rotate}deg)` };
}

export function SunIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" style={rotateStyle(rotate)} {...iconProps}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    );
}

export function PlusIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" style={rotateStyle(rotate)} {...iconProps}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function FeedIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} {...iconProps}>
            <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
    );
}

export function NinosIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} {...iconProps}>
            <circle cx="9" cy="7" r="3" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
        </svg>
    );
}

export function AvisosIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} {...iconProps}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
    );
}

export function CuentaIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} {...iconProps}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

export function LogoutIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} {...iconProps}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
    );
}

export function CameraIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}

/**
 * Single chevron for every direction: 0 down, 90 left, -90 right, 180 up.
 * The color comes from the call site, so the stroke is `currentColor`.
 */
export function ChevronIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            style={rotateStyle(rotate)}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function MegaphoneIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
    );
}

export function ImagePlaceholderIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={rotateStyle(rotate)} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
        </svg>
    );
}

export function HeartIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#E0654A" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
    );
}

export function CommentIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={rotateStyle(rotate)} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
    );
}


export function SearchIcon({ size = 20, rotate = 0 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B0A290"
            strokeWidth="2"
            style={rotateStyle(rotate)}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
