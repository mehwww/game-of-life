/* tslint:disable */
/* eslint-disable */
/**
*/
export enum Cell {
  Dead,
  Alive,
}
/**
*/
export class Universe {
  free(): void;
/**
* @param {string} canvas
* @param {number} width
* @param {number} height
* @returns {Universe}
*/
  static new(canvas: string, width: number, height: number): Universe;
/**
*/
  tick(): void;
/**
*/
  paint(): void;
/**
*/
  destroy(): void;
/**
* @returns {Array<any>}
*/
  getOffset(): Array<any>;
/**
* @param {number} x
* @param {number} y
*/
  setOffset(x: number, y: number): void;
/**
* @returns {number}
*/
  getZoom(): number;
/**
* @param {number} zoom
*/
  setZoom(zoom: number): void;
}
