/**
 * Determines if a color is light or dark
 * Returns true if the color is light (should use dark text)
 * Returns false if the color is dark (should use light text)
 */
export function isLightColor(color) {
  if (!color) return false

  // Handle hex colors
  let hex = color.replace('#', '')

  // Handle shorthand hex (e.g., #fff)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance using sRGB formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return true if light (luminance > 0.5)
  return luminance > 0.5
}

/**
 * Returns the appropriate text color class based on background color
 */
export function getContrastTextColor(bgColor) {
  return isLightColor(bgColor) ? 'text-gray-900' : 'text-white'
}
