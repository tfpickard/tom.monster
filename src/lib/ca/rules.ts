import { RuleDefinition } from "./types";

const RULE_REGEX = /^B(\d*)\/S(\d*)$/i;

export const DEFAULT_SQUARE_RULE = "B3/S23";
export const DEFAULT_HEX_RULE = "B2/S34";

export function parseRule(input: string): RuleDefinition {
  const normalized = input.trim().toUpperCase();
  const match = RULE_REGEX.exec(normalized);
  if (!match) {
    throw new Error(`Invalid rule: ${input}`);
  }

  const [, birthDigits, survivalDigits] = match;
  const birth = new Set([...birthDigits].map((d) => Number(d)));
  const survival = new Set([...survivalDigits].map((d) => Number(d)));

  return {
    birth,
    survival,
    code: `B${[...birth].sort().join("")}/S${[...survival].sort().join("")}`,
  };
}

export function stringifyRule(rule: RuleDefinition): string {
  return rule.code;
}

export function safeParseRule(input: string, fallback = DEFAULT_SQUARE_RULE) {
  try {
    return parseRule(input);
  } catch {
    return parseRule(fallback);
  }
}

export function isSurvival(rule: RuleDefinition, neighbors: number) {
  return rule.survival.has(neighbors);
}

export function isBirth(rule: RuleDefinition, neighbors: number) {
  return rule.birth.has(neighbors);
}
