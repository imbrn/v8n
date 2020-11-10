import Rule from './Rule';

class ValidationError extends Error {
  rule: Rule;
  value: any;
  cause: ValidationError[];
  target?: string;

  constructor(
    rule: Rule,
    value: unknown,
    cause: ValidationError[] = [],
    target?: string,
    message?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
    this.rule = rule;
    this.value = value;
    this.cause = cause;
    this.target = target;
  }
}

export default ValidationError;
