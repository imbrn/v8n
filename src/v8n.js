function v8n() {
  const context = {
    rulesChain: []
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
    thisArg.rulesChain.push({
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
      return this.rulesChain.every(rule => rule.fn.call(this, value));
    } catch (e) {
      return false;
    }
  },

  check(value) {
    this.rulesChain.forEach(rule => {
      if (!rule.fn.call(this, value)) {
        throw new CheckException(rule, value);
      }
    });
  },

  rulesIds() {
    return this.rulesChain.map(ruleId);
  }
};

function ruleId({ name, args }) {
  return `${name}(${args.map(parseArg).join(", ")})`;
}

function parseArg(arg) {
  return typeof arg === "string" ? `"${arg}"` : `${arg}`;
}

const rules = {
  string() {
    return this.type("string");
  },

  lowercase() {
    return value => /^[a-z]+$/.test(value);
  },

  uppercase() {
    return value => /[A-Z]+$/.test(value);
  },

  first(expected) {
    return value => {
      if (isArray(value)) return isFirstItem(value, expected);
      return isFirstLetter(value, expected);
    };
  },

  last(expected) {
    return value => {
      if (isArray(value)) return isLastItem(value, expected);
      return isLastLetter(value, expected);
    };
  },

  vowel() {
    return value => /^[aeiou]+$/i.test(value);
  },

  consonant() {
    return value => /^(?=[^aeiou])([a-z]+)$/i.test(value);
  },

  array() {
    return value => Array.isArray(value);
  },

  number() {
    return this.type("number");
  },

  negative() {
    return value => value < 0;
  },

  positive() {
    return value => value >= 0;
  },

  even() {
    return value => value % 2 === 0;
  },

  odd() {
    return value => value % 2 !== 0;
  },

  boolean() {
    return this.type("boolean");
  },

  length(min, max = min) {
    return value => value.length >= min && value.length <= max;
  },

  minLength(min) {
    return value => value.length >= min;
  },

  maxLength(max) {
    return value => value.length <= max;
  },

  between(min, max) {
    return value => value >= min && value <= max;
  },

  type(type) {
    return value => typeof value === type;
  }
};

function isArray(value) {
  return Array.isArray(value);
}

function isFirstLetter(value, letter) {
  return new RegExp(`^${letter}`).test(value);
}

function isLastLetter(value, letter) {
  return new RegExp(`${letter}$`).test(value);
}

function isFirstItem(value, item) {
  return value[0] === item;
}

function isLastItem(value, item) {
  return value[value.length - 1] === item;
}

export class CheckException extends Error {
  constructor(rule, value) {
    super();
    this.rule = rule;
    this.value = value;
  }
}

export default v8n;
