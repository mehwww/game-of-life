import React, { useEffect } from 'react';
import { Universe } from 'js-game-of-life';
import { useUniverse } from '../../hooks/use-universe';

const JS = () => {
  const { containerRef } = useUniverse(Universe);

  return <div ref={containerRef} />;
};

export default JS;
