/** A judge-sized path through one real family collaboration. Reads the projection; writes nothing. */
import { useState } from 'react';
import { StoryCard } from '../panels/StoryCard';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { SpreadNavigation } from './useSpreadNavigation';

function copy(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function GuidedStory({ nav, onLeave }: { nav: SpreadNavigation; onLeave: () => void }): JSX.Element {
  const { t } = useTranslation();
  const model = useStore((s) => s.model);
  const webmcp = useStore((s) => s.webmcp);
  const setOpenQuestion = useStore((s) => s.setOpenQuestion);
  const [copiedPrompt, setCopiedPrompt] = useState('');
  const [reviewedCard, setReviewedCard] = useState<string | null>(null);

  const grandma = model?.people.find((person) => person.display_name === 'Bà ngoại');
  const claims = model?.claims.filter(
    (claim) => claim.subject_id === grandma?.id && claim.predicate === 'moved_to',
  ) ?? [];
  const conflict = model?.conflicts.find(
    (item) => item.subject_id === grandma?.id && item.predicate === 'moved_to' && item.status === 'open',
  );
  const questions = model?.questions.filter(
    (question) =>
      question.claim_id !== null && claims.some((claim) => claim.id === question.claim_id),
  ) ?? [];
  const openQuestion = questions.find((question) => question.status === 'open');
  const answered = questions.find((question) => question.status === 'answered');
  const card = model?.cards.find(
    (item) => item.subject_person_id === grandma?.id &&
      item.claim_ids.some((id) => claims.some((claim) => claim.id === id)),
  );
  const storyIndex = nav.spreads.findIndex(
    (spread) => spread.subjectId === grandma?.id && spread.predicate === 'moved_to',
  );

  const prompt = answered && !card
    ? t('journey.promptDraft')
    : !conflict
      ? t('journey.promptFlag')
      : !openQuestion
        ? t('journey.promptAsk')
        : t('journey.promptRead');
  const stage = card ? 4 : answered ? 3 : openQuestion ? 2 : conflict ? 2 : 1;

  return (
    <aside className="guided-story" aria-labelledby="guided-title">
      <button type="button" className="guided-leave" onClick={onLeave}>
        {t('journey.leave')}
      </button>
      <p className="guided-kicker">{t('journey.kicker', { stage })}</p>
      <h2 id="guided-title">{t('journey.title')}</h2>
      <p>{t(`journey.stage${stage}`)}</p>

      {openQuestion && (
        <button type="button" className="guided-primary" onClick={() => setOpenQuestion(openQuestion.id)}>
          {t('journey.answerFor', {
            name: model?.people.find((person) => person.id === openQuestion.ask_person_id)?.display_name ??
              t('journey.family'),
          })}
        </button>
      )}

      {!card && !openQuestion && (
        <div className="guided-prompt">
          <p>{webmcp.status === 'ready' ? t('journey.askAssistant') : t('journey.manualFallback')}</p>
          <blockquote>{prompt}</blockquote>
          <button
            type="button"
            onClick={() => void copy(prompt).then(() => setCopiedPrompt(prompt)).catch(() => setCopiedPrompt(''))}
          >
            {copiedPrompt === prompt ? t('journey.copied') : t('journey.copy')}
          </button>
        </div>
      )}

      {card && (
        <div className="guided-keepsake">
          <p className="draft-label">{t('journey.draft')}</p>
          <StoryCard card={card} />
          <label className="review-draft">
            <input type="checkbox" checked={reviewedCard === card.id}
              onChange={(event) => setReviewedCard(event.target.checked ? card.id : null)} />
            {t('journey.reviewed')}
          </label>
          <button type="button" disabled={reviewedCard !== card.id} onClick={() => window.print()}>
            {t('journey.print')}
          </button>
        </div>
      )}

      {conflict && !answered && !openQuestion && (
        <button type="button" onClick={() => nav.openAt(storyIndex)}>{t('journey.openEvidence')}</button>
      )}
      {answered && conflict && <p className="guided-honest">{t('journey.unknownIsOkay')}</p>}
    </aside>
  );
}
