/**
 * Function used to produce a {@link Validation} object. The Validation object
 * is used to configure a validation strategy and perform the validation tests.
 *
 * @function
 * @returns {Validation}
 */
function v8n() {
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
   * // TODO: write about `modifiers` abstraction instead
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
  const context = {
    chain: [],
    modifiers: []
  };

  return new Proxy(context, contextProxyHandler);
}

// Custom rules
let customRules = {};

/**
 * Extends the available rules with developer specified custom rules.
 *
 * **Custom rules:**
 *
 * Custom rules are rules functions defined by the developer.
 *
 * A rule function works exactly the same way as a standard rule, and it can be
 * called as a member function in a validation object instance.
 *
 * > The validation engine will inject custom rules into validation object
 * instances when needed.
 *
 * > The new added rules can be used like any standard rule when building
 * > validations.
 *
 * > To understand how validations works, see {@link Validation} and
 * > {@link rules} sections.
 *
 * **Basic (synchronous) custom rule structure:**
 *
 * A custom rule is a function that returns another function. The custom rule
 * function can take parameters for its own configuration, and should return a
 * function which takes only a `value` as parameter. This `value` must be
 * validated by this function and return `true` for valid value and `false` for
 * invalid value.
 *
 * **Asynchronous custom rule structure:***
 *
 * A asynchronous custom rule looks like a basic custom rule, but instead of
 * returning a function which returns `true` or `false`, it should return a
 * function that returns a promise which resolves to `true` when the value is
 * valid and to `false` when the value is invalid.
 *
 * @param {object} newRules an object containing named custom `rule functions`
 * @example
 *
 * // A basic (synchronous) rule
 * function myCustomRule(expected) {
 *   return value => value === expected;
 * }
 *
 * // An asynchronous rule
 * function myAsyncCustomRule(expected) {
 *   return value => {
 *     // fetches data from an api, for example, and resolves with the result
 *     const result = fetch("some API call")
 *     return Promise.resolve(result == expected);
 *   };
 * }
 *
 * // Adding a custom rule
 * v8n.extend({
 *   myCustomRule,
 *   myAsyncCustomRule
 * });
 *
 * // Using the custom rule in validation
 * v8n()
 *  .string()
 *  .myCustomRule("Awesome")                   // Used like any other rule
 *  .myAsyncCustomRule("Async is awesome too") // Asynchronous rules!
 *  .testAsync("Awesome"); // Promise
 */
v8n.extend = function(newRules) {
  Object.assign(customRules, newRules);
};

const contextProxyHandler = {
  get: function(obj, prop, receiver) {
    if (prop in obj) {
      return obj[prop];
    }
    if (prop in modifiers) {
      receiver.modifiers.push(modifiers[prop]);
      return receiver;
    }
    if (prop in customRules) {
      return applyRule.call(receiver, customRules[prop], prop);
    }
    if (prop in rules) {
      return applyRule.call(receiver, rules[prop], prop);
    }
    if (prop in core) {
      return core[prop];
    }
  }
};

function applyRule(rule, name) {
  return (...args) => {
    this.chain.push(
      new Rule(name, rule.apply(this, args), args, this.modifiers)
    );
    this.modifiers = [];
    return this;
  };
}

/**
 * A Rule object instance stores information about a rule inside the validation
 * process.
 *
 * > It's mostly used by the developer to handle validation results. It's
 * > instantiated automatically by the library engine during the validation
 * > process and this should not be done directly by the developer.
 */
class Rule {
  /**
   * Constructs a Rule object instance.
   *
   * @param {string} name rule name
   * @param {function} fn rule function used to perform the validation
   * @param {*} args arguments used by the rule
   * @param {Array} modifiers list of modifiers to be applied on the Rule
   */
  constructor(name, fn, args, modifiers) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  }

  _test(value) {
    const modifiers = this.modifiers.slice();
    const fn = this.fn;

    if (modifiers.length) {
      const first = modifiers.pop();
      value = first.fork(fn, value);
      value = first.exec(value);

      while (modifiers.length) {
        const modifier = modifiers.pop();
        value = modifier.fork(passThrough, value);
        value = modifier.exec(value);
      }
      return value;
    } else {
      return fn(value);
    }
  }

  _testAsync(value) {
    const modifiers = this.modifiers.slice();
    const fn = this.fn;

    if (modifiers.length) {
      const first = modifiers.pop();
      value = first.fork(val => Promise.resolve(fn(val)), value);

      const isArray = Array.isArray(value);

      return Promise.all(isArray ? value : [value])
        .then(result => {
          let value = first.exec(isArray ? result : result[0]);

          while (modifiers.length) {
            const modifier = modifiers.pop();
            value = modifier.fork(passThrough, value);
            value = modifier.exec(value);
          }

          return value;
        })
        .catch(ex => {
          return false;
        });
    } else {
      return Promise.resolve(fn(value));
    }
  }
}

/**
 * Group of functionalities that can be performed on a validation object.
 *
 * > This object should not be used directly. All of its functionalities will be
 * injected into the {@link Validation} object instance when a validation is
 * performed.
 *
 * > To know more about the validation process, look at {@link Validation} docs.
 */
const core = {
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
    return this.chain.every(rule => {
      try {
        return rule._test(value);
      } catch (ex) {
        return rule.modifiers.reduce((val, modifier) => {
          try {
            val = modifier.fork(passThrough, val);
            val = modifier.exec(val);
            return val;
          } catch (ex) {
            return val;
          }
        }, false);
      }
    });
  },

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
  },

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
        if (!rule._test(value)) {
          throw null;
        }
      } catch (ex) {
        throw new ValidationException(rule, value, ex);
      }
    });
  },

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
    return executeAsyncRules(value, this.chain);
  }
};

function executeAsyncRules(value, rules) {
  return new Promise((resolve, reject) => {
    executeAsyncRulesAux(value, rules.slice(), resolve, reject);
  });
}

function executeAsyncRulesAux(value, rules, resolve, reject) {
  if (rules.length > 0) {
    const rule = rules.shift();
    try {
      const result = rule._testAsync(value);
      result.then(valid => {
        if (valid) {
          executeAsyncRulesAux(value, rules, resolve, reject);
        } else {
          reject(new ValidationException(rule, value, null));
        }
      });
    } catch (cause) {
      reject(new ValidationException(rule, value, cause));
    }
  } else {
    resolve(value);
  }
}

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

/**
 * Group of modifiers to be used along with `rules` to compose a validation
 * strategy.
 *
 * > This object should not be used directly. All of its functionalities will be
 * injected into the validation object during the validation process.
 *
 * > Look at {@link Validation} and {@link rules} to know more about the
 * > validation process.
 *
 * @namespace
 */
const modifiers = {
  /**
   * TODO: fix docs
   * Modifier for inverting of a rule meaning.
   *
   * It's used before a `rule` function call and will invert that `rule`
   * meaning, making it to expect the opposite result.
   *
   * @property
   * @example
   *
   * // This call will make the `equal` rule to be inverted, so that it now
   * // expect the validated value to be everything but "three".
   * v8n()
   *  .not.equal("three");
   */
  not: {
    fork: (fn, value) => fn(value),
    exec: value => !value
  },

  // TODO: write docs
  some: {
    fork: (fn, value) => value.map(fn),
    exec: value => value.some(passThrough)
  },

  // TODO: write docs
  every: {
    fork: (fn, value) => value.map(fn),
    exec: value => value.every(passThrough)
  }
};

/**
 * Group of standard rules that can be used to build a validation strategy.
 *
 * > This object should not be used directly. Instead, its functions will be
 * injected as `rule` functions instance members of each {@link Validation}
 * object instance.
 *
 * See more about how to use validation `rules` at {@link Validation}.
 *
 * // TODO: write about 'modifiers' abstraction instead
 * Also, each `rule` can have its meaning inverted by using the
 * {@link modifiers.not not} modifier before it.
 */
const rules = {
  /**
   * Rule function for regular expression based validation.
   *
   * A regular expression validation is used to check if the validated value
   * matches an specified pattern.
   *
   * @param {RegExp} pattern the regular expression pattern
   * @function
   * @example
   *
   * v8n()
   *    .pattern(/[a-z]+/)
   *    .test("hello"); // true
   *
   * v8n()
   *  .pattern(/[0-9]/)
   *  .test("hello"); // false
   */
  pattern: testPattern,

  // Value

  /**
   * Rule function for equality validation.
   *
   * It's used to check if the validated value is coercive the same as the
   * specified expected value.
   *
   * > It works with any data type
   *
   * > It uses the double equal (==) operator for comparison. For comparison
   * > without coercion of types, use the {@link rules.exact exact} rule.
   *
   * @param {any} expected the expected value
   * @function
   * @example
   *
   * v8n()
   *  .equal(10)
   *  .test("10"); // true
   *
   * v8n()
   *  .equal("Hello")
   *  .test("Another"); // false
   */
  equal(expected) {
    return value => value == expected;
  },

  /**
   * Rule function for equality validation.
   *
   * It's used to check if the validated value is exact the same as the
   * specified expected value.
   *
   * > It works with any data type
   *
   * > It uses the triple equal (===) operator for comparison. For comparison
   * > with coercion of types, use the {@link rules.equal equal} rule.
   *
   * @param {any} expected the expected value
   * @function
   * @example
   *
   * v8n()
   *  .exact(10)
   *  .test("10"); // false
   *
   * v8n()
   *  .exact("Hello")
   *  .test("Hello"); // true
   */
  exact(expected) {
    return value => value === expected;
  },

  // Types

  /**
   * Rule function for "string" type validation.
   *
   * This is used to check if the validated value is of type `string`.
   *
   * @function
   * @example
   *
   * v8n()
   *    .string()
   *    .test("Hello"); // true
   *
   * v8n()
   *    .string()
   *    .test(123); // false
   */
  string: makeTestType("string"),

  /**
   * Rule function for "number" type validation.
   *
   * This is used to check if the validated value is of type "number".
   *
   * @function
   * @example
   *
   * v8n()
   *    .number()
   *    .test(123); // true
   *
   * v8n()
   *    .number()
   *    .test("Hello"); // false
   */
  number: makeTestType("number"),

  /**
   * Rule function for "boolean" type validation.
   *
   * This is used to check if the validated value is of type "boolean".
   *
   * @function
   * @example
   *
   * v8n()
   *    .boolean()
   *    .test(22); // false
   *
   * v8n()
   *    .boolean()
   *    .test(false); // true
   */
  boolean: makeTestType("boolean"),

  /**
   * Rule function for undefined value validation.
   *
   * This is used to check if the validated value is undefined.
   *
   * @function
   * @example
   *
   * v8n()
   *    .undefined()
   *    .test("something"); // false
   *
   * v8n()
   *    .undefined()
   *    .test(undefined); // true
   *
   * v8n()
   *    .undefined()
   *    .test(); // true
   */
  undefined: makeTestType("undefined"),

  /**
   * Rule function for null value validation.
   *
   * This is used to check if the validated value is null.
   *
   * @function
   * @example
   *
   * v8n()
   *    .null()
   *    .test(123); // false
   *
   * v8n()
   *    .null()
   *    .test(null); // true
   */
  null: makeTestType("null"),

  /**
   * Rule function for array value validation.
   *
   * This is used to check if the validated value is an array.
   *
   * @function
   * @example
   *
   * v8n()
   *    .array()
   *    .test("hello"); // false
   *
   * v8n()
   *    .array()
   *    .test([1, 2, 3]); // true
   */
  array: makeTestType("array"),

  /**
   * Rule function for object value validation.
   *
   * This is used to check if the validated value is an object.
   *
   * @function
   * @example
   *
   * v8n()
   *    .object()
   *    .test("hello"); // false
   *
   * v8n()
   *    .object()
   *    .test({ key: "value" }); // true
   */
  object: makeTestType("object"),

  // Pattern

  /**
   * Rule function for lowercase string validation.
   *
   * It's used to check if the validated value is a complete lowercase string.
   * An empty string does not match.
   *
   * @function
   * @example
   *
   * v8n()
   *  .lowercase()
   *  .test("hello"); // true
   *
   * v8n()
   *  .lowercase()
   *  .test("Hello"); // false
   */
  lowercase: makeTestPattern(/^([a-z]+\s*)+$/),

  /**
   * Rule function for uppercase string validation.
   *
   * It's used to check if the validated value is a complete uppercase string.
   * An empty string does not match.
   *
   * @function
   * @example
   *
   * v8n()
   *  .uppercase()
   *  .test("HELLO"); // true
   *
   * v8n()
   *  .uppercase()
   *  .test("Hello"); // false
   */
  uppercase: makeTestPattern(/^([A-Z]+\s*)+$/),

  /**
   * Rule function for vowel-only string validation.
   *
   * It's used to check if the validated value is a vowel-only string. An empty
   * string does not match.
   *
   * > Note: Only vowels of the "words" characters set defined by the JavaScript
   * language are valid:
   * http://www.ecma-international.org/ecma-262/5.1/#sec-15.10.2.6
   *
   * @function
   * @example
   *
   * v8n()
   *  .vowel()
   *  .test("UE"); // true
   *
   * v8n()
   *  .vowel()
   *  .test("Me"); // false
   */
  vowel: makeTestPattern(/^[aeiou]+$/i),

  /**
   * Rule function for consonant-only string validation.
   *
   * It's used to check if the validated value is a consonant-only string. An
   * empty string does not match.
   *
   * > Note: Only consonants of the "words" characters set defined by the
   * JavaScript language are valid:
   * http://www.ecma-international.org/ecma-262/5.1/#sec-15.10.2.6
   *
   * @function
   * @example
   *
   * v8n()
   *  .consonant()
   *  .test("vn"); // true
   *
   * v8n()
   *  .consonant()
   *  .test("me"); // false
   */
  consonant: makeTestPattern(/^(?=[^aeiou])([a-z]+)$/i),

  // Value at

  /**
   * Rule function for first item validation.
   *
   * It's used to check if the first item of the validated value matches the
   * specified item.
   *
   * It can be used with strings and arrays.
   *
   * @param {any} item the expected first item
   *
   * @function
   * @example
   *
   * // With strings
   *
   * v8n()
   *  .first("H")
   *  .test("Hello"); // true
   *
   * v8n()
   *  .first("A")
   *  .test("Hello"); // false
   *
   * // With arrays
   *
   * v8n()
   *  .first("One")
   *  .test(["One", "Two", "Three"]); // true
   *
   * v8n()
   *  .first(10)
   *  .test([0, 10, 20]); // false
   */
  first: makeTestValueAt(0),

  /**
   * Rule function for last item validation.
   *
   * It's used to check if the last item of the validated value matches the
   * specified item.
   *
   * > It can be used with string and arrays.
   *
   * @param {any} item the expected last item
   * @function
   * @example
   *
   * v8n()
   *  .last("o")
   *  .test("Hello"); // true
   *
   * v8n()
   *  .last(3)
   *  .test([1, 2, 3, 4]); // false
   */
  last: makeTestValueAt(-1),

  // Length

  /**
   * Rule function for emptiness validation.
   *
   * It's used to check if the validated value is empty.
   *
   * > It works with strings, arrays and any kind of object that contains a
   * `length` property.
   *
   * @function
   * @example
   *
   * v8n()
   *  .empty()
   *  .test(""); // true
   *
   * v8n()
   *  .empty()
   *  .test([1, 2]); // false
   */
  empty: makeTestLength(true, true),

  /**
   * Rule function for length validation.
   *
   * It's used to check if the validated value length is between the specified
   * length (inclusive).
   *
   * When only the first parameter is passed, the length must be
   * exact as this parameter.
   *
   * > It works with strings, arrays and any kind of object that contains a
   * > `length` property.
   *
   * @param {number} min the min length expected
   * @param {number} [max=min] the max length expected
   * @function
   * @example
   *
   * v8n()
   *  .length(3, 5)
   *  .test([1, 2, 3, 4]); // true
   *
   * v8n()
   *  .length(3)
   *  .test([1, 2, 3, 4]); // false
   */
  length: makeTestLength(true, true),

  /**
   * Rule function for minimum length validation.
   *
   * It's used to check if the validated value length is at least as the
   * specified minimum length.
   *
   * > It works with strings, arrays and any kind of object that have a `length`
   * property.
   *
   * @param {number} min the minimum expected length
   * @function
   * @example
   *
   * v8n()
   *  .minLength(3)
   *  .test([1, 2, 3, 4]); // true
   *
   * v8n()
   *  .minLength(3)
   *  .test([1, 2]); // false
   */
  minLength: makeTestLength(true, false),

  /**
   * Rule function for maximum length validation.
   *
   * It's used to check if the validated value length is at most as the
   * specified maximum length.
   *
   * > It works with strings, arrays and any kind of object that have a `length`
   * property.
   *
   * @param {number} max the maximum expected length
   * @function
   * @example
   *
   * v8n()
   *  .maxLength(3)
   *  .test([1, 2]); // true
   *
   * v8n()
   *  .maxLength(3)
   *  .test([1, 2, 3, 4]); // false
   */
  maxLength: makeTestLength(false, true),

  // Range

  /**
   * Rule function for negative number validation.
   *
   * It's used to check if the validated value is a negative number.
   *
   * @function
   * @example
   *
   * v8n()
   *  .negative()
   *  .test(-1); // true
   *
   * v8n()
   *  .negative()
   *  .test(0); // false
   */
  negative: makeTestRange(false, false, undefined, -1),

  /**
   * Rule function for positive number validation.
   *
   * It's used to check if the validated value is a positive number, including
   * zero.
   *
   * @function
   * @example
   *
   * v8n()
   *  .positive()
   *  .test(1); // true
   *
   * v8n()
   *  .position()
   *  .test(-1); // false
   */
  positive: makeTestRange(false, false, 0, undefined),

  /**
   * Rule function  for range validation.
   *
   * It's used to check if the validated value is between (inclusive) the
   * specified range.
   *
   * > It works only with numbers.
   *
   * > It's a synonym of the {@link #range range} rule.
   *
   * @param {number} min the lower bound of the range
   * @param {number} max the upper bound of the range
   * @function
   * @example
   *
   * v8n()
   *  .between(1, 3)
   *  .test(2); // true
   *
   * v8n()
   *  .between(1, 3)
   *  .test(4); // false
   */
  between: makeTestRange(true, true),

  /**
   * Rule function for range validation.
   *
   * It's used to check if the validated value is between (inclusive) the
   * specified range.
   *
   * > It works only with numbers.
   *
   * > It's a synonym of the {@link #between between} rule.
   *
   * @param {number} min the lower bound of the range
   * @param {number} max the upper bound of the range
   * @function
   * @example
   *
   * v8n()
   *  .range(1, 3)
   *  .test(2); // true
   *
   * v8n()
   *  .range(1, 3)
   *  .test(4); // false
   */
  range: makeTestRange(true, true),

  /**
   * Rule function for upper bound validation.
   *
   * It's used to check if the validated value is less than the specified upper
   * bound value.
   *
   * > It works only with numbers.
   *
   * @param {number} bound the upper bound (not inclusive)
   * @function
   * @example
   *
   * v8n()
   *  .lessThan(10)
   *  .test(9); // true
   *
   * v8n()
   *  .lessThan(10)
   *  .test(10); // false
   */
  lessThan: makeTestRange(false, true, undefined, 0, 0, -1),

  /**
   * Rule function for upper bound validation.
   *
   * It's used to check if the validated value is less than or equal to the
   * specified upper bound value.
   *
   * > It works only with numbers.
   *
   * @param {number} bound the upper bound (inclusive)
   * @function
   * @example
   *
   * v8n()
   *  .lessThanOrEqual(10)
   *  .test(10); // true
   *
   * v8n()
   *  .lessThanOrEqual(10)
   *  .test(11); // false
   */
  lessThanOrEqual: makeTestRange(false, true, undefined, 0),

  /**
   * Rule function for lower bound validation.
   *
   * It's used to check if the validated value is greater than the specified
   * lower bound value.
   *
   * > It works only with numbers.
   *
   * @param {number} bound the lower bound (not inclusive)
   * @function
   * @example
   *
   * v8n()
   *  .greaterThan(10)
   *  .test(11); // true
   *
   * v8n()
   *  .greaterThan(10)
   *  .test(10); // false
   */
  greaterThan: makeTestRange(true, false, 0, undefined, 1),

  /**
   * Rule function for lower bound validation.
   *
   * It's used to check if the validated value is greater than or equal to the
   * specified lower bound value.
   *
   * > It works only with numbers.
   *
   * @param {number} bound the lower bound (inclusive)
   * @function
   * @example
   *
   * v8n()
   *  .greaterThanOrEqual(10)
   *  .test(10); // true
   *
   * v8n()
   *  .greaterThanOrEqual(10)
   *  .test(9); // false
   */
  greaterThanOrEqual: makeTestRange(true, false, 0, undefined),

  // Divisible

  /**
   * Rule function for even number validation.
   *
   * It's used to check if the validated value is even (divisible by 2).
   *
   * @function
   * @example
   *
   * v8n()
   *  .even()
   *  .test(40); // true
   *
   * v8n()
   *  .even()
   *  .test(21); // false
   */
  even: makeTestDivisible(2, true),

  /**
   * Rule function for odd number validation.
   *
   * It's used to check if the validated value is odd (not divisible by 2).
   *
   * @function
   * @example
   *
   * v8n()
   *  .odd()
   *  .test(20); // false
   *
   * v8n()
   *  .odd()
   *  .test(9); // true
   */
  odd: makeTestDivisible(2, false),

  /**
   * Rule function for inclusion validation.
   *
   * It's used to check if the validated value contains the specified item.
   *
   * > It works for strings and arrays.
   *
   * @param {any} expected the expected item to be found
   * @function
   * @example
   *
   * v8n()
   *  .includes(2)
   *  .test([1, 2, 3]); // true
   *
   * v8n()
   *  .includes("a")
   *  .test("Hello"); // false
   */
  includes(expected) {
    return testIncludes(expected);
  },

  /**
   * Rule function for integer validation.
   *
   * It's used to check if the validated value is an integer (not a decimal).
   *
   * @function
   * @example
   *
   * v8n()
   *  .integer()
   *  .test(20); // true
   *
   * v8n()
   *  .integer()
   *  .test(2.2); // false
   */
  integer: () => value => Number.isInteger(value) || testIntegerPolyfill(value),

  /**
   * Rule function for object schema validation.
   *
   * It's used to check if the validated value matches the specified object
   * schema.
   *
   * > An object schema is defined by recursively declaring the validation
   * > strategy for each key of the schema.
   *
   * @function
   * @example
   *
   * const validation = v8n()
   *   .schema({
   *     id: v8n().number().positive(),
   *     name: v8n().string().minLength(4)
   *   });
   *
   * validation.test({
   *   id: 1,
   *   name: "Luke"
   * }); // true
   *
   * validation.test({
   *   id: -1,
   *   name: "Luke"
   * }); // false
   *
   */
  schema: schema => testSchema(schema)
};

function testPattern(pattern) {
  return value => pattern.test(value);
}

function makeTestPattern(pattern) {
  return () => testPattern(pattern);
}

function makeTestType(type) {
  return () => value => {
    return (
      typeof value === type ||
      (value === null && type === "null") ||
      (Array.isArray(value) && type === "array")
    );
  };
}

function makeTestValueAt(index) {
  return expected => value => {
    const i = index < 0 ? value.length + index : index;
    return value[i] == expected;
  };
}

function makeTestLength(useMin, useMax) {
  return (min, max) => value => {
    let valid = true;
    if (useMin) valid = valid && value.length >= (min || 0);
    if (useMax) valid = valid && value.length <= (max || min || 0);
    return valid;
  };
}

function makeTestRange(
  useMin,
  useMax,
  defaultMin,
  defaultMax,
  adjustMin,
  adjustMax
) {
  return (min, max) => value => {
    const finalMin = useMin ? min : defaultMin;
    const finalMax = useMax ? max || min : defaultMax;
    return (
      (finalMin === undefined || value >= finalMin + (adjustMin || 0)) &&
      (finalMax === undefined || value <= finalMax + (adjustMax || 0))
    );
  };
}

function makeTestDivisible(by, expected) {
  return () => value => (value % by === 0) === expected;
}

function testIncludes(expected) {
  return value => value.indexOf(expected) !== -1;
}

function testIntegerPolyfill(value) {
  return (
    typeof value === "number" && isFinite(value) && Math.floor(value) === value
  );
}

function testSchema(schema) {
  return value => {
    const causes = [];
    Object.keys(schema).forEach(key => {
      const nestedValidation = schema[key];
      try {
        nestedValidation.check(value[key]);
      } catch (ex) {
        ex.target = key;
        ex.cause = null;
        causes.push(ex);
      }
    });
    if (causes.length > 0) {
      throw causes;
    }
    return true;
  };
}

function passThrough(value) {
  return value;
}

export default v8n;
