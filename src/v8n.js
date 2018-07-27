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

  number: makeTestType("number"),

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

  empty: makeTestLength(0, 0),

  length: makeTestLength(),

  minLength: makeTestLength(undefined, Infinity),

  maxLength: makeTestLength(-Infinity),

  // Range

  negative: makeTestRange(-Infinity, 0),

  positive: makeTestRange(-1, Infinity),

  between: makeTestRange(undefined, undefined, true, true),

  range: makeTestRange(undefined, undefined, true, true),

  lessThan: makeTestRange(-Infinity),

  lessThanOrEqual: makeTestRange(-Infinity, undefined, undefined, true),

  greaterThan: makeTestRange(undefined, Infinity),

  greaterThanOrEqual: makeTestRange(undefined, Infinity, true),

  // Divisible

  even: makeTestDivisible(2, true),

  odd: makeTestDivisible(2, false),

  includes(expected) {
    return testIncludes(expected);
  },

  integer: () => value => Number.isInteger(value) || testIntegerPolyfill(value),

  schema: schema => testSchema(schema),

  // branching

  any: (...validations) => value => validations.some(it => it.test(value))
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

function makeTestLength(overriddenMin, overriddenMax) {
  return (min, max) => value => {
    return (
      value.length >= firstDefined([overriddenMin, min]) &&
      value.length <= firstDefined([overriddenMax, max, min])
    );
  };
}

function makeTestRange(
  overriddenLower,
  overriddenUpper,
  inclusiveLower,
  inclusiveUpper
) {
  return (lower, upper) => value => {
    upper = firstDefined([overriddenUpper, upper, lower]);
    lower = firstDefined([overriddenLower, lower]);
    return (
      (inclusiveLower ? value >= lower : value > lower) &&
      (inclusiveUpper ? value <= upper : value < upper)
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
  };
}

function firstDefined(values) {
  return values.find(it => it !== undefined);
}

export default v8n;
