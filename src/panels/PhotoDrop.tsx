/**
 * TASK-032 — drop a photograph on a memory and it dates itself.
 *
 * Why there is no Google Photos here, researched rather than assumed: Google withdrew the broad
 * Photos Library scopes after 2025-03-31, and — decisively for this project — it blocks its OAuth
 * consent screen inside embedded webviews, which is exactly the browser `NFR-PORT-01` names. A
 * plain file input has none of those problems and is not a lesser substitute: on Android it opens
 * the system picker whose backing provider IS Google Photos, and on iOS it transcodes HEIC to JPEG
 * on the way in for free.
 *
 * **A photograph is a date, not a story.** It never confirms what happened. If its year disagrees
 * with the claim it is dropped on, the evidence is recorded as `contradicts` — and the archive
 * starts an argument with itself, which is it working rather than breaking.
 *
 * The pixels never enter the archive. Only the date, the filename and the stance are written;
 * the image is shown from a blob URL for as long as the tab is open. Nothing leaves the machine.
 *
 * R5: reads the projection, writes only through `commands.linkClaimToSource`.
 */

import { useEffect, useRef, useState } from 'react';
import * as commands from '../domain/commands';
import { useTranslation } from 'react-i18next';
import { exifDateTaken, sniff, stanceFor, takeoutYear, yearOfExifDate } from '../lib/photoDate';
import { useStore } from '../store/store';
import type { Claim } from '../domain/types';

/** Enough of the head for the EXIF block; a whole photograph does not need reading. */
const HEAD_BYTES = 256 * 1024;

interface Landed {
  name: string;
  year: number | null;
  stance: 'supports' | 'contradicts' | 'mentions';
  preview: string | null;
}

async function yearOf(file: File): Promise<number | null> {
  const head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  const kind = sniff(head);

  if (kind === 'json') {
    // A Takeout sidecar: Google's own attested capture time, and better evidence than EXIF
    // because it survives an editor stripping the header.
    try {
      return takeoutYear(JSON.parse(new TextDecoder().decode(head)) as unknown);
    } catch {
      return null;
    }
  }
  return yearOfExifDate(exifDateTaken(head));
}

export function PhotoDrop({ claim }: { claim: Claim }): JSX.Element {
  const { t } = useTranslation();
  const refresh = useStore((s) => s.refresh);
  const input = useRef<HTMLInputElement>(null);

  const zone = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [landed, setLanded] = useState<Landed[]>([]);
  const [error, setError] = useState<string | null>(null);

  // A blob URL is a live handle to memory, not a string. Left unrevoked, dropping a folder of
  // photographs leaks every one of them for the life of the tab.
  useEffect(
    () => () => landed.forEach((l) => l.preview && URL.revokeObjectURL(l.preview)),
    [landed],
  );

  async function take(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const seen: Landed[] = [];

    try {
      for (const file of Array.from(files)) {
        const year = await yearOf(file);
        const stance = stanceFor(year, claim.year_value);

        await commands.linkClaimToSource(
          {
            claim_id: claim.id,
            stance,
            excerpt: year === null ? undefined : String(year),
            source: {
              kind: 'photo',
              title: file.name,
              // What the FILE says, kept as the file said it. Not a conclusion about the memory.
              verbatim: year === null ? t('photo.noDate') : t('photo.fileSays', { year }),
            },
            // A photograph dates a claim; it does not vouch for the story. Raising certainty on
            // a matching year would be exactly the guess-into-fact this project refuses.
            upgrade_to_document_supported: false,
          },
          { actor: 'human', registeredBecause: 'a person added a photograph to this memory' },
        );

        seen.push({
          name: file.name,
          year,
          stance,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        });
      }
      setLanded((was) => [...was, ...seen]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // TASK-048 — a photograph pasted from the clipboard is the same act as one dropped on the
  // page, so it lands the same way. A spread can carry several claims and therefore several of
  // these; the press decides which — the zone under the pointer takes the paste, and when the
  // page has only one there is nothing to decide.
  const latest = useRef(take);
  latest.current = take;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent): void => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const mine = zone.current;
      const zones = document.querySelectorAll('.photo-drop');
      const target = document.querySelector('.photo-drop:hover') ?? (zones.length === 1 ? zones[0] : null);
      if (!mine || target !== mine) return;
      e.preventDefault();
      void latest.current(files);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div
      ref={zone}
      className={`photo-drop${over ? ' over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void take(e.dataTransfer.files);
      }}
    >
      {/* The input is the whole mechanism on a phone, where there is no drag. */}
      <input
        ref={input}
        type="file"
        accept="image/*,application/json"
        multiple
        hidden
        onChange={(e) => {
          void take(e.target.files);
          e.target.value = '';
        }}
      />
      <button type="button" className="photo-add" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? t('photo.reading') : t('photo.add')}
      </button>

      {landed.length > 0 && (
        <ul className="photo-landed">
          {landed.map((l) => (
            <li key={l.name} className={`landed stance-${l.stance}`}>
              {l.preview && <img src={l.preview} alt="" />}
              <span className="landed-name">{l.name}</span>
              <span className="landed-year">
                {l.year === null ? t('photo.noDate') : t('photo.fileSays', { year: l.year })}
              </span>
              {l.stance === 'contradicts' && (
                <span className="landed-clash">{t('photo.disagrees')}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="result refused-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
