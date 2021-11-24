import { useEffect, useRef, WheelEvent } from 'react';
import { EMPTY, fromEvent } from 'rxjs';
import { useObservable } from 'rxjs-hooks';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import * as stats from '../utils/stats';

interface Universe {
  tick(): void;
  paint(): void;
  destroy(): void;
  setOffset(x: number, y: number): void;
  getOffset(): [number, number];
  setZoom(zoom: number): void;
  getZoom(): number;
}

export const useUniverse = (UniverseFactory: {
  new: (canvas: string, width: number, height: number) => Universe;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>();
  const gameRef = useRef<Universe | null>();
  if (typeof window === 'undefined') {
    return { containerRef };
  }

  const width = Math.pow(2, 9);
  const height = Math.pow(2, 8);
  const id = 'universe';

  useEffect(() => {
    stats.enable();
    return () => {
      stats.disable();
    };
  }, []);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) {
      return;
    }
    const canvasEl = document.createElement('canvas');
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    canvasEl.style.width = '100vw';
    canvasEl.style.height = '100vh';
    canvasEl.id = id;
    containerEl.appendChild(canvasEl);
    canvasElRef.current = canvasEl;
    return () => {
      canvasElRef.current = null;
      containerEl.removeChild(canvasEl);
    };
  }, []);

  useEffect(() => {
    const game = UniverseFactory.new(`#${id}`, width, height);
    gameRef.current = game;
    let rafId: number;
    const loop = () => {
      game.tick();
      game.paint();
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(rafId);
      game.destroy();
    };
  }, []);

  useObservable(() => {
    const canvasEl = canvasElRef.current;
    const game = gameRef.current;
    if (!game || !canvasEl) {
      return EMPTY;
    }
    return fromEvent<MouseEvent>(canvasEl!, 'mousedown').pipe(
      switchMap((evt) => {
        const startOffset = game!.getOffset();
        const start = [evt.clientX, evt.clientY];
        return fromEvent<MouseEvent>(window, 'mousemove').pipe(
          takeUntil(fromEvent(window, 'mouseup')),
          map((evt) => {
            const curr = [evt.clientX - start[0], -evt.clientY + start[1]];
            return [startOffset[0] + curr[0], startOffset[1] + curr[1]];
          })
        );
      }),
      tap((offset) => {
        game!.setOffset(offset[0], offset[1]);
      })
    );
  }, null);

  useObservable(() => {
    const canvasEl = canvasElRef.current;
    const game = gameRef.current;
    if (!game || !canvasEl) {
      return EMPTY;
    }
    return fromEvent<WheelEvent>(canvasEl, 'wheel').pipe(
      tap((evt) => {
        evt.preventDefault();
        let next = game.getZoom() - evt.deltaY * 0.01;
        next = Math.min(Math.max(next, 0.5), 2);
        game.setZoom(next);
      })
    );
  }, null);

  useObservable(
    () =>
      fromEvent(window, 'resize').pipe(
        tap(() => {
          const canvasEl = canvasElRef.current;
          if (canvasEl) {
            canvasEl.width = window.innerWidth;
            canvasEl.height = window.innerHeight;
          }
        })
      ),
    null
  );

  useEffect(() => {
    const canvasEl = canvasElRef.current;
    const game = gameRef.current;
    if (!canvasEl || !game) {
      return;
    }
  }, []);

  return { containerRef };
};
