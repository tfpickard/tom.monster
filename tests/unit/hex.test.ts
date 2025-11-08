import { describe, expect, it } from "vitest";

import { countNeighborsHex, countNeighborsSquare } from "@/lib/ca/neighbors";

describe("neighbor counts", () => {
  it("counts square neighbors", () => {
    const cells = new Uint8Array(9);
    cells[0] = 1;
    cells[1] = 1;
    cells[3] = 1;
    expect(countNeighborsSquare(cells, 3, 3, 1, 1, false)).toBe(3);
  });

  it("counts hex neighbors", () => {
    const width = 4;
    const height = 4;
    const cells = new Uint8Array(width * height);
    cells[1 * width + 1] = 1;
    cells[2 * width + 2] = 1;
    expect(countNeighborsHex(cells, width, height, 2, 2, false)).toBe(1);
  });
});
