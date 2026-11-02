/** Match D1's readable action windows; never squeeze multiple causal actions into one blink. */
export const LESSON_DURATIONS = {
  'der-step': [2200, 6200, 4600, 3400, 3200],
  augmentation: [3600, 2600, 3600, 3400],
  'der-plus': [4400, 4200, 4800],
} as const;
