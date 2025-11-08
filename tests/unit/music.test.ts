import { describe, expect, it } from "vitest";

import { parseCustomScale, tunings } from "@/lib/music/tunings";

describe("music tunings", () => {
  it("returns 31-TET scale", () => {
    const scale = tunings["31-TET"].frequencies();
    expect(scale.length).toBeGreaterThan(10);
    expect(scale[0]).toBeLessThan(scale[scale.length - 1]);
  });

  it("parses custom hz", () => {
    const freqs = parseCustomScale("440\n660\n880");
    expect(freqs[1]).toBe(660);
  });
});
