/**
 * TASK-038 — the assistant asks; the words are the family's.
 *
 * That is not a convention this component follows. `schema.sql` froze it into a GRANT, and the
 * most valuable assertion in this file is the one proving the GRANT still bites — because the
 * component could be rewritten tomorrow and the guarantee would survive.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';

const HUMAN = { actor: 'human' as const, registeredBecause: 'a person wrote on the blank page' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has conflict open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

async function agentAsks(): Promise<string> {
  return commands.proposeFollowupQuestion(
    { claim_id: seed.claim1972, question_vi: 'Hồi đó tiệm ra sao ạ?' },
    AGENT,
  );
}

describe('only a person may answer', () => {
  it('refuses the agent at the database, not in the component', async () => {
    const questionId = await agentAsks();

    await expect(
      commands.answerFollowupQuestion(
        { question_id: questionId, answer_text: 'Tiệm đông lắm.', told_by: seed.motherId },
        AGENT,
      ),
    ).rejects.toThrow(/permission denied/i);

    const { questions } = await buildReadModel();
    expect(questions[0].status, 'the question must still be open').toBe('open');
    expect(questions[0].answer_text).toBeNull();
  });

  it('lets a person answer, and keeps their words exactly', async () => {
    const questionId = await agentAsks();
    const told = 'Khoảng 85 tiệm đông lắm, bà nhận thêm hai đứa học việc.';

    await commands.answerFollowupQuestion(
      { question_id: questionId, answer_text: told, told_by: seed.motherId },
      HUMAN,
    );

    const { questions, sources } = await buildReadModel();
    expect(questions[0].status).toBe('answered');
    expect(questions[0].answer_text, 'verbatim, not summarised').toBe(told);

    const account = sources.find((s) => s.verbatim === told);
    expect(account?.kind).toBe('oral_account');
    expect(account?.contributor_id, 'in the teller’s name').toBe(seed.motherId);
  });
});

describe('what the page refuses before Postgres has to', () => {
  it('will not record an answer with no words in it', async () => {
    const questionId = await agentAsks();
    await expect(
      commands.answerFollowupQuestion(
        { question_id: questionId, answer_text: '   ', told_by: seed.motherId },
        HUMAN,
      ),
    ).rejects.toThrow();
  });

  it('will not record an oral account with nobody behind it', async () => {
    const questionId = await agentAsks();
    await expect(
      commands.answerFollowupQuestion(
        { question_id: questionId, answer_text: 'Có chuyện này.', told_by: '' },
        HUMAN,
      ),
    ).rejects.toThrow();
  });

  it('will not let the same question be answered twice', async () => {
    const questionId = await agentAsks();
    await commands.answerFollowupQuestion(
      { question_id: questionId, answer_text: 'Lần một.', told_by: seed.motherId },
      HUMAN,
    );
    await expect(
      commands.answerFollowupQuestion(
        { question_id: questionId, answer_text: 'Lần hai.', told_by: seed.motherId },
        HUMAN,
      ),
    ).rejects.toThrow();
  });

  it('records every refusal, so a blocked answer is still an event', async () => {
    const questionId = await agentAsks();
    const before = (await buildReadModel()).audit.length;
    await commands
      .answerFollowupQuestion({ question_id: questionId, answer_text: '', told_by: '' }, HUMAN)
      .catch(() => undefined);
    expect((await buildReadModel()).audit.length).toBeGreaterThan(before);
  });
});

describe('the ring goes out', () => {
  it('is a gap while the question is open, and not one afterwards', async () => {
    const questionId = await agentAsks();
    expect((await buildReadModel()).questions.filter((q) => q.status === 'open')).toHaveLength(1);

    await commands.answerFollowupQuestion(
      { question_id: questionId, answer_text: 'Bà nhận hai đứa học việc.', told_by: seed.motherId },
      HUMAN,
    );
    expect((await buildReadModel()).questions.filter((q) => q.status === 'open')).toHaveLength(0);
  });

  it('leaves the answer attached to the memory it was asked about', async () => {
    const questionId = await agentAsks();
    await commands.answerFollowupQuestion(
      { question_id: questionId, answer_text: 'Bà may tới giao thừa.', told_by: seed.motherId },
      HUMAN,
    );

    const { evidence, sources } = await buildReadModel();
    const account = sources.find((s) => s.verbatim === 'Bà may tới giao thừa.');
    const row = evidence.find((e) => e.source_id === account?.id);
    expect(row?.claim_id, 'attached to the claim the question was about').toBe(seed.claim1972);
    // A recollection prompted by a question is not a verdict on the year it was asked about.
    expect(row?.stance).toBe('mentions');
  });
});
