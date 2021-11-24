import { Painter } from './painter';

export enum Cell {
  Dead = 0,
  Alive = 1,
}

export class Universe {
  cells: Array<Cell>;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  painter: Painter;

  static new(canvas: string, width: number, height: number): Universe {
    return new Universe(canvas, width, height);
  }

  private constructor(canvas: string, width: number, height: number) {
    this.canvas = document.querySelector(canvas)!;
    if (!this.canvas) {
      throw new Error(`Failed to find canvas element: ${canvas}`);
    }
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: this.width * this.height }).map((_, i) =>
      i % 2 === 0 || i % 7 === 0 ? Cell.Alive : Cell.Dead
    );
    this.painter = Painter.new(this.canvas);
  }

  getIndex(row: number, col: number): number {
    return row * this.width + col;
  }

  getLiveNeighborCount(row: number, col: number): number {
    let count = 0;
    for (const deltaRow of [this.height - 1, 0, 1]) {
      for (const deltaCol of [this.width - 1, 0, 1]) {
        if (deltaRow === 0 && deltaCol === 0) {
          continue;
        }
        const neighborRow = (row + deltaRow) % this.height;
        const neighborCol = (col + deltaCol) % this.width;
        const idx = this.getIndex(neighborRow, neighborCol);
        count += this.cells[idx];
      }
    }
    return count;
  }

  tick() {
    const next = this.cells.slice();

    for (let row = 0; row < this.height; row += 1) {
      for (let col = 0; col < this.width; col += 1) {
        const idx = this.getIndex(row, col);
        const cell = this.cells[idx];
        const liveNeighbors = this.getLiveNeighborCount(row, col);

        let nextCell = next[idx];
        if (cell === Cell.Alive && liveNeighbors < 2) {
          nextCell = Cell.Dead;
        } else if (
          cell === Cell.Alive &&
          (liveNeighbors === 2 || liveNeighbors === 3)
        ) {
          nextCell = Cell.Alive;
        } else if (cell === Cell.Alive && liveNeighbors > 3) {
          nextCell = Cell.Dead;
        } else if (cell === Cell.Dead && liveNeighbors === 3) {
          nextCell = Cell.Alive;
        }

        next[idx] = nextCell;
      }
    }

    this.cells = next;
  }

  setOffset(x: number, y: number) {
    this.painter.setOffset(x, y);
  }

  getOffset() {
    return this.painter.getOffset();
  }

  setZoom(zoom: number) {
    this.painter.setZoom(zoom);
  }

  getZoom() {
    return this.painter.getZoom();
  }

  paint() {
    this.painter.paint(this.cells, this.width, this.height);
  }

  destroy() {
    this.painter.dispose();
  }
}
