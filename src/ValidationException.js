import Rule from "./Rule";

/**
 * Exception which represents a validation issue.
 *
 * It contains information about the {@link Rule} which was being performed when
 * the issue happened, and about the value which was being validated.
 *
 * > An exception object can be used as a chain for handling nested validation
 * > results. If some validation is composed by other validations, the `cause`
 * > property of the exception can be used to get the next deepest level in the
 * > error chain.
 */
class ValidationException extends Error {
  /**
   * Constructs a validation exception with the rule which caused the issue and
   * the value which was being validated when the issue happened.
   *
   * @param {Rule} rule the rule object which caused the validation
   * @param {any} value the validated value
   * @param {Error} cause indicates which problem ocurred during the validation;
   * it can be used as chain to detected deep validations
   * @param {string} target? indicates the target which was being validated, it
   * can be a key in a object validation, for example
   */
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
