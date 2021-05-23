import { Rule } from './rule';

export interface ValidationError extends Error {
  rule: Rule;
  value: any;
  cause: ValidationError[] | null;
  target?: string;
}
