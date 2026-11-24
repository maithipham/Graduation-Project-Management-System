import type { TestDetailsAnnotation } from '@playwright/test';

export type CoverageTechnique =
  | 'EP'
  | 'BVA'
  | 'DECISION_TABLE'
  | 'STATE_TRANSITION'
  | 'USE_CASE'
  | 'ERROR_GUESSING'
  | 'BRANCH_CONDITION'
  | 'INPUT_DOMAIN';

export interface ItcSpec {
  id: string;
  feature: string;
  module: string;
  sheet: string;
  fn: string;
  description: string;
  procedure: string;
  expected: string;
  precondition?: string;
}

export interface ItcSecSpec {
  id: string;
  feature: string;
  module: string;
  sheet: string;
  scenario: string;
  roleSession: string;
  technique: CoverageTechnique;
  given: string;
  when: string;
  then: string;
}

export interface DefinedItc extends ItcSpec {
  title: string;
  annotation: TestDetailsAnnotation;
}

export interface DefinedItcSec extends ItcSecSpec {
  title: string;
  annotation: TestDetailsAnnotation;
}

export function defineItc(spec: ItcSpec): DefinedItc {
  return {
    ...spec,
    precondition: spec.precondition ?? 'N/A',
    title: `${spec.id} - ${spec.description}`,
    annotation: {
      type: 'ITC',
      description: JSON.stringify({
        ...spec,
        precondition: spec.precondition ?? 'N/A',
      }),
    },
  };
}

export function defineItcSec(spec: ItcSecSpec): DefinedItcSec {
  return {
    ...spec,
    title: `${spec.id} - ${spec.scenario}`,
    annotation: {
      type: 'ITC-SEC',
      description: JSON.stringify(spec),
    },
  };
}
