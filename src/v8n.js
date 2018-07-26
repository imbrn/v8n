import Context from "./Context";

function v8n() {
  return proxyContext(new Context());
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
    }
  });
}

const availableModifiers = {
  not: {
    simple: fn => value => !fn(value),
    async: fn => value => Promise.resolve(fn(value)).then(result => !result)
  },

  some: {
    simple: fn => value => split(value).some(fn),
    async: fn => value =>
      Promise.all(split(value).map(fn)).then(result => result.some(Boolean))
  },

  every: {
    simple: fn => value => split(value).every(fn),
    async: fn => value =>
      Promise.all(split(value).map(fn)).then(result => result.every(Boolean))
  }
};

function split(value) {
  if (typeof value === "string") {
    return value.split("");
  }
  return value;
}

const availableRules = {
  pattern: testPattern,

  // Value

  equal(expected) {
    return value => value == expected;
  },

  exact(expected) {
    return value => value === expected;
  },

  // Types

  string: makeTestType("string"),

  number: () => value => typeof value === "number" && Number.isFinite(value),

  boolean: makeTestType("boolean"),

  undefined: makeTestType("undefined"),

  null: makeTestType("null"),

  array: makeTestType("array"),

  object: makeTestType("object"),

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
  },

  integer: () => value => Number.isInteger(value) || testIntegerPolyfill(value),

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

export default v8n;
