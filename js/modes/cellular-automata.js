/**
 * CELLULAR AUTOMATA MODE
 * A modified Game of Life that responds to biometric rhythms
 */

export default class CellularAutomata {
    constructor(ctx) {
        this.ctx = ctx;
        this.cellSize = 8;
        this.grid = [];
        this.nextGrid = [];
        this.cols = 0;
        this.rows = 0;
        this.generation = 0;
        this.hue = 0;
    }

    init(width, height) {
        this.resize(width, height);
        this.randomize(0.25);
        this.generation = 0;
    }

    resize(width, height) {
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);

        // Initialize grids
        this.grid = Array(this.rows).fill(null).map(() =>
            Array(this.cols).fill(0)
        );

        this.nextGrid = Array(this.rows).fill(null).map(() =>
            Array(this.cols).fill(0)
        );
    }

    randomize(density) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() < density ? 1 : 0;
            }
        }
    }

    update(dataStream) {
        const { heartRate, variance } = dataStream;

        // Heart rate affects evolution speed and rules
        const normalizedBpm = (heartRate - 40) / 140; // Normalize to 0-1
        const skipFrames = Math.max(1, Math.floor(10 - normalizedBpm * 8));

        // Only update every N frames based on heart rate
        if (this.generation % skipFrames !== 0) {
            this.generation++;
            return;
        }

        // Variance affects mutation rate
        const mutationRate = variance / 100;

        // Apply Conway's Game of Life rules with biometric modifications
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                const cell = this.grid[row][col];

                // Modified rules based on heart rate
                const starvation = heartRate < 60 ? 1 : 2;
                const overpopulation = heartRate > 90 ? 4 : 3;
                const birth = heartRate > 80 ? [2, 3] : [3];

                if (cell === 1) {
                    // Cell survival
                    this.nextGrid[row][col] = (neighbors >= starvation && neighbors <= overpopulation) ? 1 : 0;
                } else {
                    // Cell birth
                    this.nextGrid[row][col] = birth.includes(neighbors) ? 1 : 0;
                }

                // Random mutations based on variance
                if (Math.random() < mutationRate) {
                    this.nextGrid[row][col] = Math.random() > 0.5 ? 1 : 0;
                }
            }
        }

        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];

        // Periodically inject life if grid becomes too static
        if (this.generation % 100 === 0) {
            this.injectLife(Math.floor(normalizedBpm * 50));
        }

        this.generation++;
    }

    countNeighbors(row, col) {
        let count = 0;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const newRow = (row + i + this.rows) % this.rows;
                const newCol = (col + j + this.cols) % this.cols;

                count += this.grid[newRow][newCol];
            }
        }

        return count;
    }

    injectLife(amount) {
        for (let i = 0; i < amount; i++) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            // Create small glider or pattern
            this.grid[row][col] = 1;
            if (row + 1 < this.rows) this.grid[row + 1][col] = 1;
            if (col + 1 < this.cols) this.grid[row][col + 1] = 1;
        }
    }

    render(width, height) {
        const { ctx, cellSize } = this;

        // Animate hue based on time
        this.hue = (this.hue + 0.5) % 360;

        // Dark cosmic background
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, width, height);

        // Render cells with glow effect
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    const x = col * cellSize;
                    const y = row * cellSize;

                    // Calculate age/intensity (simplified - just use position for variation)
                    const intensity = 0.5 + Math.sin((row + col + this.generation) * 0.1) * 0.5;

                    // Create gradient glow
                    const gradient = ctx.createRadialGradient(
                        x + cellSize / 2, y + cellSize / 2, 0,
                        x + cellSize / 2, y + cellSize / 2, cellSize
                    );

                    gradient.addColorStop(0, `hsla(${this.hue}, 80%, ${50 + intensity * 30}%, 0.9)`);
                    gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 40%, 0.4)`);
                    gradient.addColorStop(1, `hsla(${this.hue}, 60%, 20%, 0)`);

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x - 2, y - 2, cellSize + 4, cellSize + 4);
                }
            }
        }
    }
}
