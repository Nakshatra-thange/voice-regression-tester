// src/evaluation/types.ts
export interface AssertionEvalResult {
    passed: boolean;
    actualValue?: string;
    message?: string;
  }