function v8n() {
  const context = {
    chain: []
  };

  return buildProxy(context, contextProxyHandler);
}

// Storage for user defined rules
v8n.customRules = {};

const contextProxyHandler = {
  get: function(obj, prop, receiver) {
    if (prop in obj) {
      return obj[prop];
    }
    if (prop in modifiers) {
      modifiers[prop].call(receiver);
      return receiver;
    }
    if (prop in v8n.customRules) {
      return applyRule.call(receiver, v8n.customRules[prop], prop);
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
    this.chain.push({
      name,
      fn: rule.apply(this, args),
      args,
      invert: !!this.invert
    });
    this.invert = false;
    return this;
  };
}

function buildProxy(target, handler) {
  return new Proxy(target, handler);
}

const core = {
  test(value) {
    return this.chain.every(rule => {
      try {
        return rule.fn(value) !== rule.invert;
      } catch (ex) {
        return rule.invert;
      }
    });
  },

  check(value) {
    this.chain.forEach(rule => {
      try {
        if (rule.fn(value) === rule.invert) {
          throw "Rule failed";
        }
      } catch (ex) {
        throw { rule, value, cause: ex };
      }
    });
  }
};

const modifiers = {
  not() {
    this.invert = true;
  }
};

const rules = {
  pattern: testPattern,

  // Types
  string: makeTestType("string"),
  number: makeTestType("number"),
  boolean: makeTestType("boolean"),
  undefined: makeTestType("undefined"),
  null: makeTestType("null"),
  array: makeTestType("array"),

  // Pattern
  lowercase: makeTestPattern(/^([a-z]+\s*)+$/),
  uppercase: makeTestPattern(/^([A-Z]+\s*)+$/),
  vowel: makeTestPattern(/^[aeiou]+$/i),
  consonant: makeTestPattern(/^(?=[^aeiou])([a-z]+)$/i),

  // Value at
  first: makeTestValueAt(0),
  last: makeTestValueAt(-1),

  // Length
  empty: makeTestLength(true, true),
  length: makeTestLength(true, true),
  minLength: makeTestLength(true, false),
  maxLength: makeTestLength(false, true),

  // Range
  negative: makeTestRange(false, false, undefined, -1),
  positive: makeTestRange(false, false, 0, undefined),
  between: makeTestRange(true, true),
  range: makeTestRange(true, true),
  lessThan: makeTestRange(false, true, undefined, 0, 0, -1),
  lessThanOrEqual: makeTestRange(false, true, undefined, 0),
  greaterThan: makeTestRange(true, false, 0, undefined, 1),
  greaterThanOrEqual: makeTestRange(true, false, 0, undefined),

  // Divisible
  even: makeTestDivisible(2, true),
  odd: makeTestDivisible(2, false),

  includes(expected) {
    return testIncludes(expected);
  }
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

export default v8n;
