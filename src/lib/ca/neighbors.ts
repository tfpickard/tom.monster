const squareOffsets = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const hexOffsetsEven = [
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];

const hexOffsetsOdd = [
  [-1, -1],
  [0, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
];

export function countNeighborsSquare(
  cells: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  toroidal: boolean,
) {
  let total = 0;
  for (const [dx, dy] of squareOffsets) {
    let nx = x + dx;
    let ny = y + dy;
    if (toroidal) {
      nx = (nx + width) % width;
      ny = (ny + height) % height;
    }
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
      continue;
    }
    total += cells[ny * width + nx];
  }
  return total;
}

export function countNeighborsHex(
  cells: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  toroidal: boolean,
) {
  let total = 0;
  const parity = y & 1;
  const offsets = parity === 0 ? hexOffsetsEven : hexOffsetsOdd;
  for (const [dx, dy] of offsets) {
    let nx = x + dx;
    let ny = y + dy;
    if (toroidal) {
      nx = (nx + width) % width;
      ny = (ny + height) % height;
    }
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
      continue;
    }
    total += cells[ny * width + nx];
  }
  return total;
}
