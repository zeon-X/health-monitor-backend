// Utility functions
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleString();
}

export function formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString();
}

export function getStatusColor(severity: 'critical' | 'warning' | 'normal'): string {
    switch (severity) {
        case 'critical':
            return 'text-red-500';
        case 'warning':
            return 'text-amber-500';
        default:
            return 'text-green-500';
    }
}

export function getStatusBgColor(severity: 'critical' | 'warning' | 'normal'): string {
    switch (severity) {
        case 'critical':
            return 'bg-red-500';
        case 'warning':
            return 'bg-amber-500';
        default:
            return 'bg-green-500';
    }
}

export function getStatusBadgeColor(severity: 'critical' | 'warning' | 'normal'): string {
    switch (severity) {
        case 'critical':
            return 'bg-red-100 text-red-800 border-red-300';
        case 'warning':
            return 'bg-amber-100 text-amber-800 border-amber-300';
        default:
            return 'bg-green-100 text-green-800 border-green-300';
    }
}
