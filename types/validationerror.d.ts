import { Rule } from './rule';

export class ValidationError extends Error {
  constructor(
    rule: Rule,
    value: any,
    cause: ValidationError[] | null,
    target?: string,
    ...remaining: any[]
  );
  rule: Rule;
  value: any;
  cause: ValidationError[] | null;
  target?: string;
}
