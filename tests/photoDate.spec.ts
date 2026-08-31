/**
 * TASK-032 — the date reader, tested on bytes this file builds itself.
 *
 * EXIF is a byte walk with an endianness trap and an offset that is relative to the TIFF header
 * rather than to the file. Both mistakes produce a plausible-looking wrong answer rather than a
 * crash, which is exactly the kind of bug that ships. So the fixtures are assembled here, in both
 * byte orders, and the parser is run against them.
 */
import { describe, expect, it } from 'vitest';
import {
  exifDateTaken,
  sniff,
  stanceFor,
  takeoutYear,
  yearOfExifDate,
} from '../src/lib/photoDate';

/**
 * A minimal but *real* JPEG head: SOI, an APP1 holding a TIFF header, IFD0 with a pointer to a
 * sub-IFD, and DateTimeOriginal in the sub-IFD as a 20-byte ASCII value at an offset.
 */
function jpegWithExif(date: string, little: boolean): Uint8Array {
  const u16 = (v: number): number[] => (little ? [v & 0xff, v >> 8] : [v >> 8, v & 0xff]);
  const u32 = (v: number): number[] =>
    little
      ? [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]
      : [(v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];

  const value = [...`${date}\0`].map((c) => c.charCodeAt(0));

  // Offsets are from the start of the TIFF header.
  const ifd0At = 8;
  const ifd0 = [...u16(1), ...u16(0x8769), ...u16(4), ...u32(1), ...u32(0), ...u32(0)];
  const subAt = ifd0At + ifd0.length;
  const sub = [...u16(1), ...u16(0x9003), ...u16(2), ...u32(value.length), ...u32(0), ...u32(0)];
  const valueAt = subAt + sub.length;

  // Patch the two offsets now that the layout is known. Byte 10, not 8: an IFD entry is
  // tag(2) type(2) count(4) value(4), and the array starts with the 2-byte entry count.
  ifd0.splice(10, 4, ...u32(subAt));
  sub.splice(10, 4, ...u32(valueAt));

  const tiff = [
    ...(little ? [0x49, 0x49] : [0x4d, 0x4d]),
    ...u16(0x002a),
    ...u32(ifd0At),
    ...ifd0,
    ...sub,
    ...value,
  ];

  const app1 = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff];
  const size = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, size >> 8, size & 0xff, ...app1, 0xff, 0xd9]);
}

describe('sniffing a file by what it is, not what it is called', () => {
  it('knows a JPEG, a PNG and a JSON sidecar', () => {
    expect(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(sniff(new Uint8Array([0x7b, 0x22, 0x61]))).toBe('json');
  });

  it('sees past leading whitespace and a BOM on a sidecar', () => {
    expect(sniff(new Uint8Array([0xef, 0xbb, 0xbf, 0x7b]))).toBe('json');
    expect(sniff(new Uint8Array([0x0a, 0x20, 0x7b]))).toBe('json');
  });

  it('says nothing rather than guessing', () => {
    expect(sniff(new Uint8Array([0x00, 0x01, 0x02]))).toBe('unknown');
    expect(sniff(new Uint8Array([]))).toBe('unknown');
  });
});

describe('reading the shutter time out of a JPEG', () => {
  it('reads it in little-endian, which is what a phone writes', () => {
    expect(exifDateTaken(jpegWithExif('2019:07:14 18:02:11', true))).toBe('2019:07:14 18:02:11');
  });

  it('reads it in big-endian too — the byte-order mark is not decoration', () => {
    expect(exifDateTaken(jpegWithExif('1974:03:02 09:15:00', false))).toBe('1974:03:02 09:15:00');
  });

  it('returns nothing for a JPEG that carries no EXIF', () => {
    expect(exifDateTaken(new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x04, 0x00, 0x00]))).toBeNull();
  });

  it('refuses a file that is not a JPEG at all', () => {
    expect(exifDateTaken(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull();
  });

  it('does not walk off the end of a truncated file', () => {
    const whole = jpegWithExif('2001:01:01 00:00:00', true);
    for (const cut of [6, 12, 20, whole.length - 4]) {
      expect(() => exifDateTaken(whole.slice(0, cut))).not.toThrow();
    }
  });
});

describe('the year', () => {
  it('comes out of EXIF’s own colon-separated date', () => {
    expect(yearOfExifDate('2019:07:14 18:02:11')).toBe(2019);
  });

  it('is nothing when the string is not a date', () => {
    for (const bad of [null, '', 'yesterday', '19:07:14 18:02:11', '0001:01:01 00:00:00']) {
      expect(yearOfExifDate(bad)).toBeNull();
    }
  });

  it('comes out of a Takeout sidecar’s attested capture time', () => {
    expect(takeoutYear({ photoTakenTime: { timestamp: '142992000' } })).toBe(1974);
    expect(takeoutYear({ photoTakenTime: { timestamp: 142992000 } })).toBe(1974);
  });

  it('is nothing when the sidecar has no capture time', () => {
    for (const bad of [null, {}, { photoTakenTime: {} }, { photoTakenTime: { timestamp: 'x' } }]) {
      expect(takeoutYear(bad)).toBeNull();
    }
  });
});

describe('what a photograph is allowed to say', () => {
  it('supports a claim whose year it matches', () => {
    expect(stanceFor(1974, 1974)).toBe('supports');
  });

  it('contradicts one it does not — which is the archive working, not breaking', () => {
    expect(stanceFor(1974, 1972)).toBe('contradicts');
  });

  it('says only that it was mentioned when either year is unknown', () => {
    expect(stanceFor(null, 1972)).toBe('mentions');
    expect(stanceFor(1974, null)).toBe('mentions');
  });
});
