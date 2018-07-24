import Rule from "./Rule";

class ValidationException extends Error {
  constructor(rule, value, cause, target, ...remaining) {
    super(remaining);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationException);
    }
    this.rule = rule;
    this.value = value;
    this.cause = cause;
    this.target = target;
  }
}

export default ValidationException;
