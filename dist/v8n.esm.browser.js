class Rule {
  constructor(name, fn, args, modifiers) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  }

  _test(value) {
    let fn = this.fn;

    try {
      testAux(this.modifiers.slice(), fn)(value);
    } catch (ex) {
      fn = () => false;
    }

    try {
      return testAux(this.modifiers.slice(), fn)(value);
    } catch (ex) {
      return false;
    }
  }

  _check(value) {
    try {
      testAux(this.modifiers.slice(), this.fn)(value);
    } catch (ex) {
      if (testAux(this.modifiers.slice(), it => it)(false)) {
        return;
      }
    }

    if (!testAux(this.modifiers.slice(), this.fn)(value)) {
      throw null;
    }
  }

  _testAsync(value) {
    return new Promise((resolve, reject) => {
      testAsyncAux(
        this.modifiers.slice(),
        this.fn,
      )(value)
        .then(valid => {
          if (valid) {
            resolve(value);
          } else {
            reject(null);
          }
        })
        .catch(ex => reject(ex));
    });
  }
}

function pickFn(fn, variant = 'simple') {
  return typeof fn === 'object' ? fn[variant] : fn;
}

function testAux(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAux(modifiers, fn);
    return modifier.perform(nextFn);
  } else {
    return pickFn(fn);
  }
}

function testAsyncAux(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAsyncAux(modifiers, fn);
    return modifier.performAsync(nextFn);
  } else {
    return value => Promise.resolve(pickFn(fn, 'async')(value));
  }
}

class Modifier {
  constructor(name, perform, performAsync) {
    this.name = name;
    this.perform = perform;
    this.performAsync = performAsync;
  }
}

class ValidationError extends Error {
  constructor(rule, value, cause, target, ...remaining) {
    super(remaining);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
    this.rule = rule;
    this.value = value;
    this.cause = cause;
    this.target = target;
  }
}

class Context {
  constructor(chain = [], nextRuleModifiers = []) {
    this.chain = chain;
    this.nextRuleModifiers = nextRuleModifiers;
  }

  _applyRule(ruleFn, name) {
    return (...args) => {
      this.chain.push(
        new Rule(name, ruleFn.apply(this, args), args, this.nextRuleModifiers),
      );
      this.nextRuleModifiers = [];
      return this;
    };
  }

  _applyModifier(modifier, name) {
    this.nextRuleModifiers.push(
      new Modifier(name, modifier.simple, modifier.async),
    );
    return this;
  }

  _clone() {
    return new Context(this.chain.slice(), this.nextRuleModifiers.slice());
  }

  test(value) {
    return this.chain.every(rule => rule._test(value));
  }

  testAll(value) {
    const err = [];
    this.chain.forEach(rule => {
      try {
        rule._check(value);
      } catch (ex) {
        err.push(new ValidationError(rule, value, ex));
      }
    });
    return err;
  }

  check(value) {
    this.chain.forEach(rule => {
      try {
        rule._check(value);
      } catch (ex) {
        throw new ValidationError(rule, value, ex);
      }
    });
  }

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
        reject(new ValidationError(rule, value, cause));
      },
    );
  } else {
    resolve(value);
  }
}

function v8n() {
  return typeof Proxy !== undefined
    ? proxyContext(new Context())
    : proxylessContext(new Context());
}

// Custom rules
let customRules = {};

v8n.extend = function(newRules) {
  Object.assign(customRules, newRules);
};

v8n.clearCustomRules = function() {
  customRules = {};
};

function proxyContext(context) {
  return new Proxy(context, {
    get(obj, prop) {
      if (prop in obj) {
        return obj[prop];
      }

      const newContext = proxyContext(context._clone());

      if (prop in availableModifiers) {
        return newContext._applyModifier(availableModifiers[prop], prop);
      }
      if (prop in customRules) {
        return newContext._applyRule(customRules[prop], prop);
      }
      if (prop in availableRules) {
        return newContext._applyRule(availableRules[prop], prop);
      }
    },
  });
}

function proxylessContext(context) {
  const addRuleSet = (ruleSet, targetContext) => {
    Object.keys(ruleSet).forEach(prop => {
      targetContext[prop] = (...args) => {
        const newContext = proxylessContext(targetContext._clone());
        const contextWithRuleApplied = newContext._applyRule(
          ruleSet[prop],
          prop
        )(...args);
        return contextWithRuleApplied;
      };
    });
    return targetContext;
  };

  const contextWithAvailableRules = addRuleSet(availableRules, context);
  const contextWithAllRules = addRuleSet(
    customRules,
    contextWithAvailableRules
  );

  Object.keys(availableModifiers).forEach(prop => {
    Object.defineProperty(contextWithAllRules, prop, {
      get: () => {
        const newContext = proxylessContext(contextWithAllRules._clone());
        return newContext._applyModifier(availableModifiers[prop], prop);
      }
    });
  });

  return contextWithAllRules;
}

const availableModifiers = {
  not: {
    simple: fn => value => !fn(value),
    async: fn => value =>
      Promise.resolve(fn(value))
        .then(result => !result)
        .catch(() => true),
  },

  some: {
    simple: fn => value => {
      return split(value).some(item => {
        try {
          return fn(item);
        } catch (ex) {
          return false;
        }
      });
    },
    async: fn => value => {
      return Promise.all(
        split(value).map(item => {
          try {
            return fn(item).catch(() => false);
          } catch (ex) {
            return false;
          }
        }),
      ).then(result => result.some(Boolean));
    },
  },

  every: {
    simple: fn => value => value !== false && split(value).every(fn),
    async: fn => value =>
      Promise.all(split(value).map(fn)).then(result => result.every(Boolean)),
  },
};

function split(value) {
  if (typeof value === 'string') {
    return value.split('');
  }
  return value;
}

const availableRules = {
  // Value

  equal: expected => value => value == expected,

  exact: expected => value => value === expected,

  // Types

  number: (allowInfinite = true) => value =>
    typeof value === 'number' && (allowInfinite || isFinite(value)),

  integer: () => value => {
    const isInteger = Number.isInteger || isIntegerPolyfill;
    return isInteger(value);
  },

  numeric: () => value => !isNaN(parseFloat(value)) && isFinite(value),

  string: () => testType('string'),

  boolean: () => testType('boolean'),

  undefined: () => testType('undefined'),

  null: () => testType('null'),

  array: () => testType('array'),

  object: () => testType('object'),

  instanceOf: instance => value => value instanceof instance,

  // Pattern

  pattern: expected => value => expected.test(value),

  lowercase: () => value => /^([a-z]+\s*)+$/.test(value),

  uppercase: () => value => /^([A-Z]+\s*)+$/.test(value),

  vowel: () => value => /^[aeiou]+$/i.test(value),

  consonant: () => value => /^(?=[^aeiou])([a-z]+)$/i.test(value),

  // Value at

  first: expected => value => value[0] == expected,

  last: expected => value => value[value.length - 1] == expected,

  // Length

  empty: () => value => value.length === 0,

  length: (min, max) => value =>
    value.length >= min && value.length <= (max || min),

  minLength: min => value => value.length >= min,

  maxLength: max => value => value.length <= max,

  // Range

  negative: () => value => value < 0,

  positive: () => value => value >= 0,

  between: (a, b) => value => value >= a && value <= b,

  range: (a, b) => value => value >= a && value <= b,

  lessThan: n => value => value < n,

  lessThanOrEqual: n => value => value <= n,

  greaterThan: n => value => value > n,

  greaterThanOrEqual: n => value => value >= n,

  // Divisible

  even: () => value => value % 2 === 0,

  odd: () => value => value % 2 !== 0,

  includes: expected => value => ~value.indexOf(expected),

  schema: schema => testSchema(schema),

  // branching

  passesAnyOf: (...validations) => value =>
    validations.some(validation => validation.test(value)),

  optional: (validation, considerTrimmedEmptyString = false) => value => {
    if (
      considerTrimmedEmptyString &&
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return true;
    }

    if (value !== undefined && value !== null) validation.check(value);
    return true;
  },
};

function testType(expected) {
  return value => {
    return (
      (Array.isArray(value) && expected === 'array') ||
      (value === null && expected === 'null') ||
      typeof value === expected
    );
  };
}

function isIntegerPolyfill(value) {
  return (
    typeof value === 'number' && isFinite(value) && Math.floor(value) === value
  );
}

function testSchema(schema) {
  return {
    simple: value => {
      const causes = [];
      Object.keys(schema).forEach(key => {
        const nestedValidation = schema[key];
        try {
          nestedValidation.check((value || {})[key]);
        } catch (ex) {
          ex.target = key;
          causes.push(ex);
        }
      });
      if (causes.length > 0) {
        throw causes;
      }
      return true;
    },
    async: value => {
      const causes = [];
      const nested = Object.keys(schema).map(key => {
        const nestedValidation = schema[key];
        return nestedValidation.testAsync((value || {})[key]).catch(ex => {
          ex.target = key;
          causes.push(ex);
        });
      });
      return Promise.all(nested).then(() => {
        if (causes.length > 0) {
          throw causes;
        }

        return true;
      });
    },
  };
}

export default v8n;
