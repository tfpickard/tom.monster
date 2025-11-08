import { render } from "@testing-library/react";
import { describe, it } from "vitest";

import { SimulationCanvas } from "@/components/canvas/SimulationCanvas";

describe("SimulationCanvas", () => {
  it("renders canvas", () => {
    render(
      <SimulationCanvas
        cells={new Uint8Array(100)}
        width={10}
        height={10}
        lattice="square"
      />,
    );
  });
});
