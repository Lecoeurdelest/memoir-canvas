/**
 * TASK-032 — reading the date out of a photograph, so nobody has to type it.
 *
 * Pure and dependency-free: bytes in, a year out. That is deliberate — this is byte-walking code
 * with an endianness trap in it, and the only way to trust it is to test it without a browser.
 *
 * No network, no library. `NFR-PRIV-01` is not merely satisfied here, it is unthreatened: the
 * file is read in the tab and the archive keeps its date, never its pixels.
 */

/** Sniffed from the first bytes, never the extension — a Takeout filename will lie to you. */
export type FileKind = 'jpeg' | 'png' | 'json' | 'unknown';

export function sniff(bytes: Uint8Array): FileKind {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return 'png';
  }
  // A JSON sidecar, allowing for whitespace or a BOM before the brace.
  for (let i = 0; i < Math.min(bytes.length, 8); i += 1) {
    const b = bytes[i];
    if (b === 0x7b) return 'json';
    if (b !== 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d && b !== 0xef && b !== 0xbb && b !== 0xbf) {
      break;
    }
  }
  return 'unknown';
}

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"

const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_DATE_TIME = 0x0132;
const TAG_EXIF_IFD_POINTER = 0x8769;

function readU16(bytes: Uint8Array, at: number, little: boolean): number {
  return little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1];
}

function readU32(bytes: Uint8Array, at: number, little: boolean): number {
  return little
    ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0
    : ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
}

function ascii(bytes: Uint8Array, at: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const c = bytes[at + i];
    if (c === 0 || c === undefined) break;
    out += String.fromCharCode(c);
  }
  return out;
}

/** Walk one IFD, returning the ASCII value of `tag`, or the pointer value when it is a pointer. */
function findTag(
  bytes: Uint8Array,
  tiff: number,
  ifd: number,
  little: boolean,
  tag: number,
): { text: string | null; pointer: number | null } {
  if (ifd + 2 > bytes.length) return { text: null, pointer: null };
  const count = readU16(bytes, ifd, little);

  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > bytes.length) break;
    if (readU16(bytes, entry, little) !== tag) continue;

    const type = readU16(bytes, entry + 2, little);
    const length = readU32(bytes, entry + 4, little);

    // ASCII. Values of four bytes or fewer sit inline; longer ones are an offset from the TIFF
    // header — not from the file, which is the mistake this code exists to not make.
    if (type === 2) {
      const at = length <= 4 ? entry + 8 : tiff + readU32(bytes, entry + 8, little);
      if (at + Math.min(length, 1) > bytes.length) return { text: null, pointer: null };
      return { text: ascii(bytes, at, length), pointer: null };
    }
    if (type === 4) return { text: null, pointer: tiff + readU32(bytes, entry + 8, little) };
  }
  return { text: null, pointer: null };
}

/**
 * `DateTimeOriginal` — when the shutter fired — falling back to `DateTime`, which is when the file
 * was last written. Returns EXIF's own `YYYY:MM:DD HH:MM:SS`, unparsed, so the caller decides what
 * to trust.
 */
export function exifDateTaken(bytes: Uint8Array): string | null {
  if (sniff(bytes) !== 'jpeg') return null;

  // Walk the JPEG marker chain to APP1. Scanning for "Exif\0\0" anywhere would find it inside a
  // thumbnail or a comment.
  let at = 2;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return null; // image data begins; no EXIF
    const size = readU16(bytes, at + 2, false);
    if (size < 2) return null;

    if (marker === 0xe1) {
      const head = at + 4;
      if (EXIF_HEADER.every((b, i) => bytes[head + i] === b)) {
        const tiff = head + 6;
        if (tiff + 8 > bytes.length) return null;

        const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
        const big = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d;
        if (!little && !big) return null;
        if (readU16(bytes, tiff + 2, little) !== 0x002a) return null;

        const ifd0 = tiff + readU32(bytes, tiff + 4, little);
        const sub = findTag(bytes, tiff, ifd0, little, TAG_EXIF_IFD_POINTER).pointer;
        const original = sub === null ? null : findTag(bytes, tiff, sub, little, TAG_DATE_TIME_ORIGINAL).text;
        return original ?? findTag(bytes, tiff, ifd0, little, TAG_DATE_TIME).text;
      }
    }
    at += 2 + size;
  }
  return null;
}

/** EXIF writes `2019:07:14 18:02:11`. Anything else is not a date this code will guess at. */
export function yearOfExifDate(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 1826 && year <= 2200 ? year : null;
}

/**
 * A Google Takeout export ships `*.supplemental-metadata.json` beside each file. It is better
 * evidence than EXIF for this project: it survives an editor stripping EXIF, and it is Google's
 * own attested capture time rather than whatever the file now claims.
 */
export function takeoutYear(json: unknown): number | null {
  if (typeof json !== 'object' || json === null) return null;
  const taken = (json as { photoTakenTime?: { timestamp?: unknown } }).photoTakenTime;
  const stamp = taken?.timestamp;
  const seconds = typeof stamp === 'string' ? Number(stamp) : typeof stamp === 'number' ? stamp : NaN;
  if (!Number.isFinite(seconds)) return null;
  const year = new Date(seconds * 1000).getUTCFullYear();
  return year >= 1826 && year <= 2200 ? year : null;
}

/**
 * What a dropped photograph says about a claim.
 *
 * A photograph is a **date**, not a story: it can agree with the year, disagree with it, or say
 * nothing at all. It never confirms what happened. Returning 'contradicts' is what lets a dropped
 * file start a family argument, which is the archive working rather than the archive breaking.
 */
export function stanceFor(photoYear: number | null, claimYear: number | null): 'supports' | 'contradicts' | 'mentions' {
  if (photoYear === null || claimYear === null) return 'mentions';
  return photoYear === claimYear ? 'supports' : 'contradicts';
}
