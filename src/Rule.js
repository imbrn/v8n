import ValidationException from "./ValidationException";

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
    try {
      const result = testAux(this.modifiers.slice(), this.fn)(value);
      if (typeof result !== "boolean") {
        throw result;
      }
      return result;
    } catch (ex) {
      return testAux(this.modifiers.slice(), () => false)(false);
    }
  }

  _check(value) {
    if (!testAux(this.modifiers.slice(), this.fn)(value)) {
      throw new ValidationException(this, value);
    }
  }

  _testAsync(value) {
    return new Promise((resolve, reject) => {
      try {
        testAsyncAux(this.modifiers.slice(), this.fn)(value).then(valid => {
          if (valid) {
            resolve(value);
          } else {
            reject(new ValidationException(this, value));
          }
        });
      } catch (ex) {
        reject(new ValidationException(this, value, ex));
      }
    });
  }
}

function testAux(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAux(modifiers, fn);
    return applyModifier(modifier, nextFn);
  } else {
    return fn;
  }
}

function applyModifier(modifier, fn) {
  return value => {
    try {
      return modifier.perform(fn)(value);
    } catch (ex) {
      return value;
    }
  };
}

function testAsyncAux(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAsyncAux(modifiers, fn);
    return modifier.performAsync(nextFn);
  } else {
    return value => Promise.resolve(fn(value));
  }
}

export default Rule;
