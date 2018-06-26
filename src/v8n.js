function v8n() {
  const context = {
    chain: []
  };

  return new Proxy(context, contextProxyHandler);
}

// Storage for user defined rules
v8n.customRules = {};

const contextProxyHandler = {
  get: function(obj, prop) {
    if (prop in v8n.customRules) {
      return new Proxy(v8n.customRules[prop], ruleProxyHandler);
    }
    if (prop in rules) {
      return new Proxy(rules[prop], ruleProxyHandler);
    }
    if (prop in core) {
      return core[prop];
    }
    if (prop in obj) {
      return obj[prop];
    }
  }
};

const ruleProxyHandler = {
  apply: function(target, thisArg, args) {
    const fn = target.apply(rules, args);
    thisArg.chain.push({
      name: target.name,
      fn,
      args
    });
    return thisArg;
  }
};

const core = {
  test(value) {
    try {
      return this.chain.every(rule => rule.fn(value));
    } catch (e) {
      return false;
    }
  },

  check(value) {
    this.chain.forEach(rule => {
      if (!rule.fn(value)) {
        throw { rule, value };
      }
    });
  }
};

const rules = {
  pattern: testPattern,

  string() {
    return testType("string");
  },

  lowercase() {
    return testPattern(/^([a-z]+\s*)+$/);
  },

  uppercase() {
    return testPattern(/^([A-Z]+\s*)+$/);
  },

  first(expected) {
    return testValueAt(0, expected);
  },

  last(expected) {
    return testValueAt(-1, expected);
  },

  vowel() {
    return testPattern(/^[aeiou]+$/i);
  },

  consonant() {
    return testPattern(/^(?=[^aeiou])([a-z]+)$/i);
  },

  notEmpty() {
    return testLength(0, 0, false);
  },

  array() {
    return value => Array.isArray(value);
  },

  number() {
    return testType("number");
  },

  negative() {
    return testRange(undefined, -1, true);
  },

  positive() {
    return testRange(0, undefined, true);
  },

  even() {
    return testDivisible(2, true);
  },

  odd() {
    return testDivisible(2, false);
  },

  boolean() {
    return testType("boolean");
  },

  length(min, max = min) {
    return testLength(min, max, 1);
  },

  minLength(min) {
    return testLength(min, undefined, true);
  },

  maxLength(max) {
    return testLength(undefined, max, true);
  },

  between(min, max) {
    return testRange(min, max, true);
  }
};

function testDivisible(num, result) {
  return value => (value % num === 0) == result;
}

function testValueAt(index, expectedValue) {
  return value => {
    const i = index < 0 ? value.length + index : index;
    return value[i] == expectedValue;
  };
}

function testPattern(pattern) {
  return value => pattern.test(value);
}

function testType(type) {
  return value => typeof value === type;
}

function testLength(min, max, result) {
  return value =>
    ((min === undefined || value.length >= min) &&
      (max === undefined || value.length <= max)) == result;
}

function testRange(a, b, result) {
  return value =>
    ((a === undefined || value >= a) && (b === undefined || value <= b)) ==
    result;
}

export default v8n;
