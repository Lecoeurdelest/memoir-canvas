/**
 * TASK-038 — the page nobody has written yet.
 *
 * The forest already draws an unlit ring for every question nobody has answered. This is what a
 * ring opens: a ruled page, with the assistant's question written in the margin in faint ink, and
 * room for the family to write the answer straight onto it.
 *
 * The line this view exists to hold, from the design canvas:
 *
 *   *Trợ lý đặt câu hỏi; chữ là của người kể.* — the assistant asks; the words are the family's.
 *
 * Postgres has enforced that since the schema froze. `GRANT UPDATE (status, answer_text,
 * answered_at) ON followup_question` names `app_human` and no agent, so an assistant that tried to
 * answer its own question would be refused exactly as it is at `resolve_claim`.
 *
 * R5: reads the projection, writes only through `commands.answerFollowupQuestion`.
 */

import { useState } from 'react';
import * as commands from '../domain/commands';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { FollowupQuestion } from '../domain/types';

export function BlankPage({
  question,
  onClose,
}: {
  question: FollowupQuestion;
  onClose: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];
  const claims = useStore((s) => s.model?.claims) ?? [];
  const refresh = useStore((s) => s.refresh);

  // Only a person a human entered may put their name to an account — the same rule the database
  // enforces in source_oral_needs_a_voice, offered rather than discovered by refusal.
  const tellers = people.filter((p) => p.created_by === 'human');

  const [text, setText] = useState('');
  const [teller, setTeller] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const about = claims.find((c) => c.id === question.claim_id);
  const asked = lang === 'vi' ? question.question_vi : (question.question_en ?? question.question_vi);
  const ready = text.trim().length > 0 && teller !== '' && !busy;

  async function write(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await commands.answerFollowupQuestion(
        { question_id: question.id, answer_text: text.trim(), told_by: teller },
        { actor: 'human', registeredBecause: 'a person wrote on the blank page' },
      );
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="blank-page" aria-label={t('blank.name')}>
      <div className="book-body">
        <div className="page-block" aria-hidden="true">
          <span className="block-under" />
          <span className="gutter" />
        </div>

        <article className="spread">
          {/* The recto: ruled, empty, and honest about being empty. */}
          <div className="page page-left ruled">
            <p className="page-label">
              {about?.year_value ? t('evidence.circa', { year: about.year_value }) : t('blank.someYear')}
            </p>
            <h3>{t('blank.stillBlank')}</h3>

            <label className="write-on">
              <span className="visually-hidden">{t('blank.writeHere')}</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                lang={lang}
                placeholder={t('blank.writeHere')}
              />
            </label>

            <p className="folio">— {t('blank.page')} —</p>
          </div>

          {/* The verso: the assistant's note, in the margin, in the assistant's own voice. */}
          <div className="page page-right">
            <p className="page-label">{t('blank.margin')}</p>
            <p className="margin-note" lang={lang}>
              {asked}
            </p>

            <div className="signing">
              <label>
                <span>{t('blank.whoTells')}</span>
                <select value={teller} onChange={(e) => setTeller(e.target.value)}>
                  <option value="">{t('tear.pick')}</option>
                  {tellers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className="write-it" disabled={!ready} onClick={() => void write()}>
                {busy ? t('tear.working') : t('blank.writeIt')}
              </button>
            </div>

            <p className="hint whose-words">{t('blank.whoseWords')}</p>

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
