/**
 * NFR-PORT-01 — decide once whether this browser can carry the road.
 *
 * Synchronous and memoised: the answer must be known before the first paint chooses a renderer,
 * and probing twice would cost a second context on a phone that is already short of them.
 *
 * MAX_TEXTURE_SIZE is checked, not just context creation, because a context that cannot hold the
 * text atlas would render the road with no words on it — worse than not rendering it at all.
 */

const ATLAS = 2048;

let cached: boolean | null = null;

export function hasWebGL(): boolean {
  if (cached !== null) return cached;

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null;

    cached = gl !== null && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= ATLAS;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cached = false;
  }

  return cached;
}

/** `?flat=1` and the flat-view toggle both land here: a deterministic way out for anyone. */
export function flatRequested(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('flat') === '1') return true;
    return window.localStorage.getItem('memoir:flat') === '1';
  } catch {
    return false;
  }
}
