import Rule from "./Rule";
import Modifier from "./Modifier";
import ValidationException from "./ValidationException";

/**
 * Represents an instance of a validation object. This is created by the entry
 * point function {@link v8n}.
 *
 * **rules:**
 *
 * A validation strategy is defined by calling `rules` functions on the
 * validation object. Each call to a `rule` function will add that rule to the
 * validation strategy chain and return the validation object instance for
 * chaining `rules` functions calls together.
 *
 * All the rules functions that are available for use by a {@link Validation}
 * object instance are actually declared  in the {@link rules} object. Those
 * `rules` functions are injected into each Validation object instance.
 *
 * Look at the {@link rules} object to see all the available `rules`.
 *
 * **The `not` modifier**
 *
 * To invert a `rule` meaning, the modifier {@link modifiers.not not} must be
 * invoked before the `rule` function call. It will invert the next `rule`
 * call meaning.
 *
 * **Validating**
 *
 * There are two way to perform a validation: synchronous and asynchronous.
 *
 * When you have a validation strategy with promise-based rules, like a rule
 * that performs an API check or any other kind of asynchronous test, you
 * should use the {@link core.testAsync testAsync} function. This function
 * produces a promise based validation.
 *
 * But, if your validation strategy contains **only** synchronous rules, like
 * `.string()`, `.minLength(2)`, whatever, you'd better use the functions
 * {@link core.test test} or {@link core.check check}.
 *
 * > Look at these functions documentation to know more about them.
 *
 * @example
 * // Synchronous validation
 *
 * v8n() // Creates a validation object instance
 *  .not.null()   // Inverting the `null` rule call to `not null`
 *  .minLength(3) // Chaining `rules` to the validation strategy
 *  .test("some value");  // Executes the validation test function
 *
 * @example
 * // Asynchronous validation
 *
 * v8n()
 *   .not.null()
 *   .someAsyncRule() // some asynchronous rule
 *   .testAsync("some value")
 *   .then(value => {
 *     // valid
 *   }).catch(ex => {
 *     // invalid!
 *   });
 *
 * @module Validation
 */
class Context {
  constructor(chain = [], nextRuleModifiers = []) {
    this.chain = chain;
    this.nextRuleModifiers = nextRuleModifiers;
  }

  _applyRule(ruleFn, name) {
    return (...args) => {
      this.chain.push(
        new Rule(name, ruleFn.apply(this, args), args, this.nextRuleModifiers)
      );
      this.nextRuleModifiers = [];
      return this;
    };
  }

  _applyModifier(modifier, name) {
    this.nextRuleModifiers.push(
      new Modifier(name, modifier.simple, modifier.async)
    );
    return this;
  }

  _clone() {
    return new Context(this.chain.slice(), this.nextRuleModifiers.slice());
  }

  /**
   * Performs boolean based validation.
   *
   * When this function is executed it performs the validation process and
   * returns a `boolean` result.
   *
   * @param {any} value the value to be validated
   * @returns {boolean} true for valid and false for invalid
   */
  test(value) {
    return this.chain.every(rule => rule._test(value));
  }

  /**
   * Performs array based validation.
   *
   * When this function is executed it performs the validation process and
   * returns an array containing all failed rules. This will perform every
   * validation regardless of failures.
   *
   * @param {any} value the value to be validated
   * @returns {array} empty for successful validation
   */
  testAll(value) {
    const err = [];
    this.chain.forEach(rule => {
      if (!rule._test(value)) err.push(rule);
    });
    return err;
  }

  /**
   * Performs exception based validation.
   *
   * When this function is executed it performs the validation process and
   * throws a {@link ValidationException} when the value is not valid.
   *
   * > The exception thrown by this validation function contains a reference to
   * > the performed {@link Rule}.
   *
   * @throws {ValidationException} exception thrown when the validation fails
   * @param {any} value the value to be validated
   */
  check(value) {
    this.chain.forEach(rule => {
      try {
        if (!rule._check(value)) {
          throw new ValidationException(rule, value, null);
        }
      } catch (cause) {
        throw new ValidationException(rule, value, cause);
      }
    });
  }

  /**
   * Performs asynchronous validation.
   *
   * When this function is used it performs the validation process
   * asynchronously, and it returns a promise that resolves to the validated
   * value when it's valid and rejects with a {@link ValidationException} when
   * it's invalid or when an exception occurs.
   *
   * > To learn more about asynchronous validation, look at the
   * > {@link Validation} documentation section.
   *
   * > For a validation strategy with non promise-based rules, you'd better use
   * > the {@link core.test test} and {@link core.check check} functions.
   *
   * @see ValidationException
   * @param {any} value the value to be validated
   * @returns {Promise} promise that resolves to the validated value or rejects
   * with a {@link ValidationException}
   */
  testAsync(value) {
    return new Promise((resolve, reject) => {
      executeAsyncRules(value, this.chain.slice(), resolve, reject);
    });
  }
}

function executeAsyncRules(value, rules, resolve, reject) {
  if (rules.length) {
    const rule = rules.shift();
    rule._testAsync(value).then(
      () => {
        executeAsyncRules(value, rules, resolve, reject);
      },
      cause => {
        reject(new ValidationException(rule, value, cause));
      }
    );
  } else {
    resolve(value);
  }
}

export default Context;
