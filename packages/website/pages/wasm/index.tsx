import React from 'react';
import { Universe } from 'wasm-game-of-life';
import { useUniverse } from '../../hooks/use-universe';

const WASM = () => {
  const { containerRef } = useUniverse(Universe as any);

  return <div ref={containerRef} />;
};

export default WASM;
