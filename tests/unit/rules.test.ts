import { describe, expect, it } from "vitest";

import { parseRule } from "@/lib/ca/rules";

describe("rule parsing", () => {
  it("parses valid rule", () => {
    const rule = parseRule("B36/S23");
    expect(rule.birth.has(3)).toBe(true);
    expect(rule.birth.has(6)).toBe(true);
    expect(rule.survival.has(2)).toBe(true);
  });

  it("throws on invalid rule", () => {
    expect(() => parseRule("invalid")).toThrow();
  });
});
