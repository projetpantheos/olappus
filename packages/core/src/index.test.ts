import { describe, expect, it } from 'vitest';

import { CORE_CONTRACT_VERSION, DB_SCHEMAS } from './index';

describe('@olappus/core', () => {
  it('expose une version de contrat', () => {
    expect(CORE_CONTRACT_VERSION).toBe(1);
  });

  it('déclare exactement les schémas fixés par ADR-0005', () => {
    expect([...DB_SCHEMAS]).toEqual([
      'identity',
      'core',
      'source',
      'extraction',
      'domain',
      'knowledge',
      'audit',
    ]);
  });
});
