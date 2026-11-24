// Standard, freely available screening questionnaires.
// They support (not replace) a clinician's judgement.

export const OPTIONS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];

export const DEFINITIONS = {
  PHQ9: {
    type: 'PHQ9',
    name: 'PHQ-9 Depression Screening',
    short: 'Depression',
    prompt: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself, or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading or watching television',
      'Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual',
      'Thoughts that you would be better off dead, or of hurting yourself in some way',
    ],
    max: 27,
    bands: [
      { min: 0, label: 'Minimal' },
      { min: 5, label: 'Mild' },
      { min: 10, label: 'Moderate' },
      { min: 15, label: 'Moderately severe' },
      { min: 20, label: 'Severe' },
    ],
  },
  GAD7: {
    type: 'GAD7',
    name: 'GAD-7 Anxiety Screening',
    short: 'Anxiety',
    prompt: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid, as if something awful might happen',
    ],
    max: 21,
    bands: [
      { min: 0, label: 'Minimal' },
      { min: 5, label: 'Mild' },
      { min: 10, label: 'Moderate' },
      { min: 15, label: 'Severe' },
    ],
  },
};

/** Validates answers and returns { score, severity, riskFlag }. Throws on bad input. */
export function scoreAssessment(type, answers) {
  const def = DEFINITIONS[type];
  if (!def) throw new Error('Unknown assessment type');
  if (!Array.isArray(answers) || answers.length !== def.questions.length || answers.some((a) => ![0, 1, 2, 3].includes(a))) {
    throw new Error(`Please answer all ${def.questions.length} questions`);
  }
  const score = answers.reduce((s, a) => s + a, 0);
  const severity = [...def.bands].reverse().find((b) => score >= b.min).label;
  const riskFlag = type === 'PHQ9' && answers[8] > 0;
  return { score, severity, riskFlag };
}
