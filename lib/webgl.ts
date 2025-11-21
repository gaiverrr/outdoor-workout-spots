/**
 * Utility functions for WebGL feature detection
 */

/**
 * Check if WebGL is available in the current browser
 *
 * @returns {boolean} true if WebGL is supported, false otherwise
 */
export function isWebGLAvailable(): boolean {
  try {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');

    // Try to get WebGL context (both standard and experimental)
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl') ||
      canvas.getContext('webgl2');

    return !!gl;
  } catch (e) {
    // WebGL might be disabled or not available
    console.warn('WebGL detection failed:', e);
    return false;
  }
}

/**
 * Get WebGL context information for debugging
 *
 * @returns {object | null} WebGL renderer info or null if not available
 */
export function getWebGLInfo(): { vendor: string; renderer: string } | null {
  try {
    if (!isWebGLAvailable()) return null;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl || !(gl instanceof WebGLRenderingContext)) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return {
        vendor: 'Unknown',
        renderer: 'Unknown',
      };
    }

    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  } catch (e) {
    console.warn('Failed to get WebGL info:', e);
    return null;
  }
}
