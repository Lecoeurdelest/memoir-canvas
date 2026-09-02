/**
 * FROZEN CONTRACT — see docs/_arch_map.md.
 *
 * Changing this file requires a new task and a heads-up to the whole team, and
 * docs/API_SCHEMA.md must be updated in the same PR.
 *
 * The `description` strings are read by the agent, not by humans. They shape which
 * tool the model reaches for, so they say what a tool does AND what it refuses to do.
 */

export type ToolName =
  | 'read_memory_graph'
  | 'add_person'
  | 'add_memory_claim'
  | 'link_claim_to_source'
  | 'flag_conflict'
  | 'propose_followup_question'
  | 'resolve_claim'
  | 'generate_story_card';

export interface ToolDescriptor {
  name: ToolName;
  description: string;
  inputSchema: Record<string, unknown>;
}

const str = (description: string) => ({ type: 'string', description });
const int = (description: string) => ({ type: 'integer', description });

export const DESCRIPTORS: Record<ToolName, ToolDescriptor> = {
  read_memory_graph: {
    name: 'read_memory_graph',
    description:
      'Read the whole family memory graph: people, places, claims, evidence, open conflicts ' +
      'and family questions, including attributed answers. Every claim carries a certainty label — never present a claim ' +
      'to the user as settled fact unless its certainty is "confirmed".',
    inputSchema: {
      type: 'object',
      properties: {
        subject_id: str('Optional. Restrict the read to one person or place.'),
      },
      additionalProperties: false,
    },
  },

  add_person: {
    name: 'add_person',
    description:
      'Add a person to the memory graph. Only a display name is required. This tool does NOT ' +
      'accept a birth year: a birth year is a claim about a person, not a property of one, so ' +
      'record it with add_memory_claim instead.',
    inputSchema: {
      type: 'object',
      required: ['display_name'],
      properties: {
        display_name: str('How the family refers to this person, e.g. "Bà ngoại" (Grandma).'),
        aka: { type: 'array', items: { type: 'string' }, description: 'Other names used.' },
        note: str('Free-text context the family gave you.'),
      },
      additionalProperties: false,
    },
  },

  add_memory_claim: {
    name: 'add_memory_claim',
    description:
      'Record one assertion about the past — a move, an occupation, a family relationship, a ' +
      'year. Claims you create are capped at certainty "oral": you may not mark anything ' +
      'confirmed. If the speaker was vague ("around 1972"), set year_precision to "circa" ' +
      'rather than rounding to an exact year.',
    inputSchema: {
      type: 'object',
      required: ['subject_kind', 'subject_id', 'predicate'],
      properties: {
        subject_kind: { enum: ['person', 'place', 'claim'], description: 'What the claim is about.' },
        subject_id: str('Id of the subject.'),
        predicate: str('e.g. "moved_to", "opened_business", "relation", "born_in_year".'),
        object_person_id: str('Optional. The other person, for relationship claims.'),
        object_place_id: str('Optional. The place involved.'),
        object_text: str('Optional. Free-text object, e.g. an occupation.'),
        year_value: int('Optional. The year, if the claim carries one.'),
        year_min: int('Optional. Lower bound when the claim is a range.'),
        year_max: int('Optional. Upper bound when the claim is a range.'),
        year_precision: {
          enum: ['exact', 'circa', 'decade', 'range'],
          description: 'How precise the speaker actually was. Do not upgrade vagueness.',
        },
      },
      additionalProperties: false,
    },
  },

  link_claim_to_source: {
    name: 'link_claim_to_source',
    description:
      'Attach evidence to a claim. A source may CONTRADICT a claim, not only support it — use ' +
      'stance "contradicts" when a photo or document disagrees with what was said. ' +
      'Contradictions are recorded, never silently discarded. Quote the source verbatim; do ' +
      'not paraphrase it.',
    inputSchema: {
      type: 'object',
      required: ['claim_id', 'source', 'stance'],
      properties: {
        claim_id: str('Claim this evidence bears on.'),
        stance: {
          enum: ['supports', 'contradicts', 'mentions'],
          description: 'How the source relates to the claim.',
        },
        excerpt: str('The exact words or marking that matter, e.g. "mặt sau ghi 1974" (1974 written on the back).'),
        source: {
          type: 'object',
          required: ['kind', 'title'],
          properties: {
            kind: { enum: ['oral_account', 'photo', 'document', 'external_record'] },
            title: str('Short label, e.g. "Ảnh tiệm may" (tailor shop photograph).'),
            uri: str('Optional. Where the artefact lives.'),
            verbatim: str('For oral accounts: the words exactly as spoken.'),
            contributor_id: str('Required for oral_account: whose recollection this is.'),
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },

  flag_conflict: {
    name: 'flag_conflict',
    description:
      'Record that two or more active claims about the same subject and predicate cannot both ' +
      'be true. This tool only succeeds when the disagreement already exists in the data — you ' +
      'cannot invent one. It records the conflict and marks the claims as conflicting. It does ' +
      'NOT decide which claim is right, and no tool available to you does.',
    inputSchema: {
      type: 'object',
      required: ['subject_kind', 'subject_id', 'predicate'],
      properties: {
        subject_kind: { enum: ['person', 'place', 'claim'] },
        subject_id: str('Subject the claims disagree about.'),
        predicate: str('Predicate the claims disagree about.'),
      },
      additionalProperties: false,
    },
  },

  propose_followup_question: {
    name: 'propose_followup_question',
    description:
      'Turn an uncertainty into something the family can actually act on: a specific question ' +
      'for a specific relative. Use this when you have found a conflict and cannot resolve it ' +
      'yourself — which is always. Include claim_id so the family can answer on its blank page. ' +
      'Write the question in Vietnamese; add an English version too.',
    inputSchema: {
      type: 'object',
      required: ['question_vi'],
      properties: {
        conflict_id: str('Conflict this question would help settle.'),
        claim_id: str('Claim this question would help verify.'),
        question_vi: str('The question, in Vietnamese.'),
        question_en: str('The same question in English.'),
        ask_person_id: str('Who in the family is most likely to know.'),
      },
      additionalProperties: false,
    },
  },

  resolve_claim: {
    name: 'resolve_claim',
    description:
      'Close an open conflict by recording which claim the FAMILY decided is correct. This is ' +
      'not your judgement to make: the call requires a named person, and the database rejects ' +
      'the write without one. Only call this after a person has explicitly told you their ' +
      'decision in this conversation. This tool is only registered while the user is looking ' +
      'at that conflict.',
    inputSchema: {
      type: 'object',
      required: ['conflict_id', 'winning_claim_id', 'resolved_by'],
      properties: {
        conflict_id: str('The open conflict.'),
        winning_claim_id: str('The claim the family accepted.'),
        resolved_by: str('Id of the person who made the call. Required.'),
        resolution_note: str('Why they decided that, in their words.'),
      },
      additionalProperties: false,
    },
  },

  generate_story_card: {
    name: 'generate_story_card',
    description:
      'Compose a short bilingual story from existing claims. The card inherits the WEAKEST ' +
      'certainty among the claims it stands on — you do not choose that label, and a well ' +
      'written story does not make shaky evidence stronger. Do not add facts that are not in ' +
      'the claims you cite.',
    inputSchema: {
      type: 'object',
      required: ['subject_person_id', 'claim_ids', 'title_vi', 'title_en', 'body_vi', 'body_en'],
      properties: {
        subject_person_id: str('Person the story is about.'),
        claim_ids: { type: 'array', items: { type: 'string' }, description: 'Claims the story rests on.' },
        title_vi: str('Title in Vietnamese.'),
        title_en: str('Title in English.'),
        body_vi: str('Body in Vietnamese.'),
        body_en: str('Body in English.'),
      },
      additionalProperties: false,
    },
  },
};

/** Always available, regardless of what the user is looking at. */
export const BASE_TOOLS: ToolName[] = [
  'read_memory_graph',
  'add_person',
  'add_memory_claim',
  'link_claim_to_source',
  'generate_story_card',
];

export const ALL_TOOL_NAMES = Object.keys(DESCRIPTORS) as ToolName[];
