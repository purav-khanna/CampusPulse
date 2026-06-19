// CampusPulse Workspace Root Gemini & Avatar Helper Utilities
// This file resolves editor file-not-found issues for src/utils/gemini.js

/**
 * Generates initials from a full name (e.g., "Priya Sharma" -> "PS")
 * @param {string} name 
 * @returns {string}
 */
export function getAvatarInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Generates a consistent background gradient based on a name string
 * @param {string} name 
 * @returns {string}
 */
export function getAvatarGradient(name) {
  if (!name) return 'linear-gradient(135deg, #3b82f6, #8b5cf6)'; // Default Blue -> Purple
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    'linear-gradient(135deg, #3b82f6, #8b5cf6)', // Blue -> Purple
    'linear-gradient(135deg, #14b8a6, #3b82f6)', // Teal -> Blue
    'linear-gradient(135deg, #6366f1, #8b5cf6)', // Indigo -> Violet
    'linear-gradient(135deg, #06b6d4, #3b82f6)', // Cyan -> Blue
    'linear-gradient(135deg, #a855f7, #6366f1)', // Purple -> Indigo
    'linear-gradient(135deg, #22c55e, #14b8a6)', // Green -> Teal
  ];
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
