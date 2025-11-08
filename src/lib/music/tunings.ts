export type TuningId = "12-TET" | "19-TET" | "31-TET" | "bohlen-pierce" | "custom";

export interface TuningDefinition {
  id: TuningId;
  name: string;
  description: string;
  frequencies: (opts?: { base?: number; octaves?: number }) => number[];
}

const DEFAULT_BASE = 440;

function equalTemperament(steps: number, ratio = 2) {
  return ({ base = DEFAULT_BASE, octaves = 3 } = {}) => {
    const scale: number[] = [];
    const total = steps * octaves;
    for (let i = 0; i <= total; i++) {
      const exponent = i / steps;
      scale.push(base * ratio ** (exponent - octaves / 2));
    }
    return scale;
  };
}

function bohlenPierce() {
  const ratio = 3;
  const steps = 13;
  return ({ base = DEFAULT_BASE, octaves = 2 } = {}) => {
    const scale: number[] = [];
    const total = steps * octaves;
    for (let i = 0; i <= total; i++) {
      const exponent = i / steps;
      scale.push(base * ratio ** (exponent - octaves / 2));
    }
    return scale;
  };
}

export const tunings: Record<TuningId, TuningDefinition> = {
  "12-TET": {
    id: "12-TET",
    name: "12-TET",
    description: "Standard concert tuning",
    frequencies: equalTemperament(12),
  },
  "19-TET": {
    id: "19-TET",
    name: "19-TET",
    description: "Even temperament with 19 notes per octave",
    frequencies: equalTemperament(19),
  },
  "31-TET": {
    id: "31-TET",
    name: "31-TET",
    description: "Microtonal temperament with near-just intervals",
    frequencies: equalTemperament(31),
  },
  "bohlen-pierce": {
    id: "bohlen-pierce",
    name: "Bohlen–Pierce",
    description: "Non-octave scale spanning a tritave",
    frequencies: bohlenPierce(),
  },
  custom: {
    id: "custom",
    name: "Custom",
    description: "Provide explicit Hz values or cents",
    frequencies: ({ base = DEFAULT_BASE } = {}) => [base],
  },
};

export function parseCustomScale(input: string, base = DEFAULT_BASE) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const freqs: number[] = [];
  for (const line of lines) {
    if (line.startsWith("!")) continue;
    const centsMatch = line.match(/^([-+]?\d+(?:\.\d+)?)c$/i);
    if (centsMatch) {
      const cents = Number(centsMatch[1]);
      freqs.push(base * 2 ** (cents / 1200));
      continue;
    }
    const value = Number(line);
    if (Number.isFinite(value) && value > 0) {
      freqs.push(value > 20 ? value : base * 2 ** (value / 1200));
    }
  }
  return freqs.length ? freqs : tunings["12-TET"].frequencies();
}
