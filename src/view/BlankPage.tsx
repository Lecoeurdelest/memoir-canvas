/**
 * TASK-038 · TASK-048 — the page nobody has written yet.
 *
 * The forest opens this when a reader presses an empty place. The owner stripped it back to the
 * one thing it is for: a ruled page and an invitation to write on it. No heading, no folio, no
 * explanation, no buttons — what is left is the paper, the words, and the name they go under.
 *
 * The line this view exists to hold, from the design canvas:
 *
 *   *Trợ lý đặt câu hỏi; chữ là của người kể.* — the assistant asks; the words are the family's.
 *
 * It is no longer written on the page, because the page now demonstrates it instead: the only
 * prose here is whatever the assistant asked, and the only writing is the family's.
 *
 * Postgres has enforced that since the schema froze. `GRANT UPDATE (status, answer_text,
 * answered_at) ON followup_question` names `app_human` and no agent, so an assistant that tried to
 * answer its own question would be refused exactly as it is at `resolve_claim`.
 *
 * A firefly does not become a page. It becomes a CLOSED book, and the book opens when it is
 * pressed — the same beat `Cover` gives a memory, because arriving at an empty page you are
 * about to write on deserves the same pause as arriving at one somebody already filled.
 *
 * Leaving is a gesture, not a button: press off THE BOOK — not merely off the paper, so the
 * boards and the fore-edge are still the book — or move focus out of it, and the page resolves
 * itself: nothing written closes it, something written and signed is filed. Escape does the
 * same, because a mouse-only exit would lock out the readers NFR-A11Y-03 exists for.
 *
 * R5: reads the projection, writes only through `commands.answerFollowupQuestion` / `tellMemory`.
 */

import { useEffect, useRef, useState } from 'react';
import * as commands from '../domain/commands';
import { Cover } from './Cover';
import { fold } from './bookSearch';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { FollowupQuestion } from '../domain/types';

export function BlankPage({
  question,
  year,
  onClose,
}: {
  /** A question the agent asked. Absent when the reader opened a silent year instead. */
  question?: FollowupQuestion;
  /** A stretch of years the archive holds nothing for. */
  year?: number;
  onClose: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];
  const refresh = useStore((s) => s.refresh);

  // Only a person a human entered may put their name to an account — the same rule the database
  // enforces in source_oral_needs_a_voice, offered rather than discovered by refusal.
  const tellers = people.filter((p) => p.created_by === 'human');

  // The book arrives shut. Nothing is written until a hand opens it.
  const [opened, setOpened] = useState(false);
  // An empty page asks for nothing: the name line appears only once there are words to sign.
  const [written, setWritten] = useState(false);
  const paper = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = useRef<HTMLDivElement>(null);

  /**
   * Who signed it. An entry is signed in the writer's own hand, and the name has to be a person
   * this family already entered — the archive may not invent one, and two people answering to
   * the same written name is not a choice a program gets to make either.
   */
  function signedBy(): string | null {
    const written = fold(name.current?.innerText.trim() ?? '');
    if (written.length === 0) return null;
    const matches = tellers.filter((p) => fold(p.display_name) === written);
    return matches.length === 1 ? matches[0].id : null;
  }

  const asked = question
    ? lang === 'vi'
      ? question.question_vi
      : (question.question_en ?? question.question_vi)
    : null;

  async function write(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const text = paper.current?.innerText ?? '';
      const teller = signedBy() ?? '';
      if (question) {
        await commands.answerFollowupQuestion(
          { question_id: question.id, answer_text: text.trim(), told_by: teller },
          { actor: 'human', registeredBecause: 'a person wrote on the blank page' },
        );
      } else if (year !== undefined) {
        await commands.tellMemory(
          { told_by: teller, year_value: year, story: text.trim() },
          { actor: 'human', registeredBecause: 'a person filled a year nobody had told' },
        );
      }
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  /**
   * What leaving the paper means. Written but unsigned is the one case that must NOT resolve:
   * filing an account under a guessed name is the very thing this archive refuses to do, so the
   * page stays open and puts the cursor where the answer is missing.
   */
  async function leave(): Promise<void> {
    if (busy) return;
    if ((paper.current?.innerText ?? '').trim().length === 0) return onClose();
    if (signedBy() === null) {
      // After this handler the browser finishes its own focus move for the press that got us
      // here, which would take the cursor straight back off the line. Ask once it has.
      window.setTimeout(() => name.current?.focus(), 0);
      return;
    }
    await write();
  }

  // The listener needs the CURRENT draft, and re-binding on every keystroke would be silly.
  const latest = useRef(leave);
  latest.current = leave;

  useEffect(() => {
    const onDown = (e: PointerEvent): void => {
      // The whole volume counts as inside — boards, fore-edge and all, shut or open.
      if ((e.target as HTMLElement | null)?.closest('.book-body, .cover-stage')) return;
      void latest.current();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!opened) {
    return (
      <section className="blank-page blank-shut" aria-label={t('blank.name')}>
        <Cover label={t('blank.name')} onOpen={() => setOpened(true)} />
      </section>
    );
  }

  return (
    <section className="blank-page" aria-label={t('blank.name')}>
      <div
        className="book-body"
        onBlur={(e) => {
          // Focus going NOWHERE — a press on the boards, on the paper's margin — is not
          // leaving the book; only focus landing on something outside it is. Presses that
          // land off the book entirely are the pointer listener's business, not this one's.
          const next = e.relatedTarget as Node | null;
          if (!next || e.currentTarget.contains(next)) return;
          void latest.current();
        }}
      >
        <div className="page-block" aria-hidden="true">
          <span className="block-under" />
          <span className="gutter" />
        </div>

        <article className="spread blank-entry">
          <div className="paper-flow" onPointerDown={() => paper.current?.focus()}>
            {asked && (
              <p className="entry-year" lang={lang}>
                {asked}
              </p>
            )}

            {/* Contenteditable, not a textarea: a textarea is a box with its own scrollbar, and
                the owner asked for a page — words that outgrow the near leaf continue on the far
                one. Uncontrolled on purpose; re-rendering it on every keystroke is what makes a
                caret jump. What was written is read off the paper when the book is left. */}
            <div
              ref={paper}
              className="write-on"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              role="textbox"
              aria-multiline="true"
              aria-label={t('blank.writeHere')}
              data-placeholder={t('blank.writeHere')}
              lang={lang}
              onInput={() => setWritten((paper.current?.innerText ?? '').trim().length > 0)}
            />
          </div>

          <div className="signing-row" hidden={!written}>
            {/* A ruled line at the foot of a written page, signed in the same hand. No list to
                pick from and nothing written on it: what a diary asks for here is obvious, and
                the cursor is put on it at the moment it is wanted. */}
            <div
              ref={name}
              className="signing-name"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              role="textbox"
              aria-label={t('blank.whoTells')}
              lang={lang}
            />

            {error && (
              <p className="result refused-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
