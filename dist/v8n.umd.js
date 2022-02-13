(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.v8n = factory());
}(this, (function () { 'use strict';

  var Rule = function Rule(name, fn, args, modifiers) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  };

  Rule.prototype._test = function _test (value) {
    var fn = this.fn;

    try {
      testAux(this.modifiers.slice(), fn)(value);
    } catch (ex) {
      fn = function () { return false; };
    }

    try {
      return testAux(this.modifiers.slice(), fn)(value);
    } catch (ex$1) {
      return false;
    }
  };

  Rule.prototype._check = function _check (value) {
    try {
      testAux(this.modifiers.slice(), this.fn)(value);
    } catch (ex) {
      if (testAux(this.modifiers.slice(), function (it) { return it; })(false)) {
        return;
      }
    }

    if (!testAux(this.modifiers.slice(), this.fn)(value)) {
      throw null;
    }
  };

  Rule.prototype._testAsync = function _testAsync (value) {
      var this$1 = this;

    return new Promise(function (resolve, reject) {
      testAsyncAux(
        this$1.modifiers.slice(),
        this$1.fn
      )(value)
        .then(function (valid) {
          if (valid) {
            resolve(value);
          } else {
            reject(null);
          }
        })
        .catch(function (ex) { return reject(ex); });
    });
  };

  function pickFn(fn, variant) {
    if ( variant === void 0 ) variant = 'simple';

    return typeof fn === 'object' ? fn[variant] : fn;
  }

  function testAux(modifiers, fn) {
    if (modifiers.length) {
      var modifier = modifiers.shift();
      var nextFn = testAux(modifiers, fn);
      return modifier.perform(nextFn);
    } else {
      return pickFn(fn);
    }
  }

  function testAsyncAux(modifiers, fn) {
    if (modifiers.length) {
      var modifier = modifiers.shift();
      var nextFn = testAsyncAux(modifiers, fn);
      return modifier.performAsync(nextFn);
    } else {
      return function (value) { return Promise.resolve(pickFn(fn, 'async')(value)); };
    }
  }

  var Modifier = function Modifier(name, perform, performAsync) {
    this.name = name;
    this.perform = perform;
    this.performAsync = performAsync;
  };

  var ValidationError = /*@__PURE__*/(function (Error) {
    function ValidationError(rule, value, cause, target) {
      var remaining = [], len = arguments.length - 4;
      while ( len-- > 0 ) remaining[ len ] = arguments[ len + 4 ];

      Error.call(this, remaining);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ValidationError);
      }
      this.rule = rule;
      this.value = value;
      this.cause = cause;
      this.target = target;
    }

    if ( Error ) ValidationError.__proto__ = Error;
    ValidationError.prototype = Object.create( Error && Error.prototype );
    ValidationError.prototype.constructor = ValidationError;

    return ValidationError;
  }(Error));

  var Context = function Context(chain, nextRuleModifiers) {
    if ( chain === void 0 ) chain = [];
    if ( nextRuleModifiers === void 0 ) nextRuleModifiers = [];

    this.chain = chain;
    this.nextRuleModifiers = nextRuleModifiers;
  };

  Context.prototype._applyRule = function _applyRule (ruleFn, name) {
      var this$1 = this;

    return function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

      this$1.chain.push(
        new Rule(name, ruleFn.apply(this$1, args), args, this$1.nextRuleModifiers)
      );
      this$1.nextRuleModifiers = [];
      return this$1;
    };
  };

  Context.prototype._applyModifier = function _applyModifier (modifier, name) {
    this.nextRuleModifiers.push(
      new Modifier(name, modifier.simple, modifier.async)
    );
    return this;
  };

  Context.prototype._clone = function _clone () {
    return new Context(this.chain.slice(), this.nextRuleModifiers.slice());
  };

  Context.prototype.test = function test (value) {
    return this.chain.every(function (rule) { return rule._test(value); });
  };

  Context.prototype.testAll = function testAll (value) {
    var err = [];
    this.chain.forEach(function (rule) {
      try {
        rule._check(value);
      } catch (ex) {
        err.push(new ValidationError(rule, value, ex));
      }
    });
    return err;
  };

  Context.prototype.check = function check (value) {
    this.chain.forEach(function (rule) {
      try {
        rule._check(value);
      } catch (ex) {
        throw new ValidationError(rule, value, ex);
      }
    });
  };

  Context.prototype.testAsync = function testAsync (value) {
      var this$1 = this;

    return new Promise(function (resolve, reject) {
      executeAsyncRules(value, this$1.chain.slice(), resolve, reject);
    });
  };

  function executeAsyncRules(value, rules, resolve, reject) {
    if (rules.length) {
      var rule = rules.shift();
      rule._testAsync(value).then(
        function () {
          executeAsyncRules(value, rules, resolve, reject);
        },
        function (cause) {
          reject(new ValidationError(rule, value, cause));
        }
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
  var customRules = {};

  v8n.extend = function(newRules) {
    Object.assign(customRules, newRules);
  };

  v8n.clearCustomRules = function() {
    customRules = {};
  };

  function proxyContext(context) {
    return new Proxy(context, {
      get: function get(obj, prop) {
        if (prop in obj) {
          return obj[prop];
        }

        var newContext = proxyContext(context._clone());

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
    var addRuleSet = function (ruleSet, targetContext) {
      Object.keys(ruleSet).forEach(function (prop) {
        targetContext[prop] = function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          var newContext = proxylessContext(targetContext._clone());
          var contextWithRuleApplied = newContext._applyRule(
            ruleSet[prop],
            prop
          ).apply(void 0, args);
          return contextWithRuleApplied;
        };
      });
      return targetContext;
    };

    var contextWithAvailableRules = addRuleSet(availableRules, context);
    var contextWithAllRules = addRuleSet(
      customRules,
      contextWithAvailableRules
    );

    Object.keys(availableModifiers).forEach(function (prop) {
      Object.defineProperty(contextWithAllRules, prop, {
        get: function () {
          var newContext = proxylessContext(contextWithAllRules._clone());
          return newContext._applyModifier(availableModifiers[prop], prop);
        }
      });
    });

    return contextWithAllRules;
  }

  var availableModifiers = {
    not: {
      simple: function (fn) { return function (value) { return !fn(value); }; },
      async: function (fn) { return function (value) { return Promise.resolve(fn(value))
          .then(function (result) { return !result; })
          .catch(function () { return true; }); }; },
    },

    some: {
      simple: function (fn) { return function (value) {
        return split(value).some(function (item) {
          try {
            return fn(item);
          } catch (ex) {
            return false;
          }
        });
      }; },
      async: function (fn) { return function (value) {
        return Promise.all(
          split(value).map(function (item) {
            try {
              return fn(item).catch(function () { return false; });
            } catch (ex) {
              return false;
            }
          })
        ).then(function (result) { return result.some(Boolean); });
      }; },
    },

    every: {
      simple: function (fn) { return function (value) { return value !== false && split(value).every(fn); }; },
      async: function (fn) { return function (value) { return Promise.all(split(value).map(fn)).then(function (result) { return result.every(Boolean); }); }; },
    },
  };

  function split(value) {
    if (typeof value === 'string') {
      return value.split('');
    }
    return value;
  }

  var availableRules = {
    // Value

    equal: function (expected) { return function (value) { return value == expected; }; },

    exact: function (expected) { return function (value) { return value === expected; }; },

    // Types

    number: function (allowInfinite) {
      if ( allowInfinite === void 0 ) allowInfinite = true;

      return function (value) { return typeof value === 'number' && (allowInfinite || isFinite(value)); };
  },

    integer: function () { return function (value) {
      var isInteger = Number.isInteger || isIntegerPolyfill;
      return isInteger(value);
    }; },

    numeric: function () { return function (value) { return !isNaN(parseFloat(value)) && isFinite(value); }; },

    string: function () { return testType('string'); },

    boolean: function () { return testType('boolean'); },

    undefined: function () { return testType('undefined'); },

    null: function () { return testType('null'); },

    array: function () { return testType('array'); },

    object: function () { return testType('object'); },

    instanceOf: function (instance) { return function (value) { return value instanceof instance; }; },

    // Pattern

    pattern: function (expected) { return function (value) { return expected.test(value); }; },

    lowercase: function () { return function (value) { return /^([a-z]+\s*)+$/.test(value); }; },

    uppercase: function () { return function (value) { return /^([A-Z]+\s*)+$/.test(value); }; },

    vowel: function () { return function (value) { return /^[aeiou]+$/i.test(value); }; },

    consonant: function () { return function (value) { return /^(?=[^aeiou])([a-z]+)$/i.test(value); }; },

    // Value at

    first: function (expected) { return function (value) { return value[0] == expected; }; },

    last: function (expected) { return function (value) { return value[value.length - 1] == expected; }; },

    // Length

    empty: function () { return function (value) { return value.length === 0; }; },

    length: function (min, max) { return function (value) { return value.length >= min && value.length <= (max || min); }; },

    minLength: function (min) { return function (value) { return value.length >= min; }; },

    maxLength: function (max) { return function (value) { return value.length <= max; }; },

    // Range

    negative: function () { return function (value) { return value < 0; }; },

    positive: function () { return function (value) { return value >= 0; }; },

    between: function (a, b) { return function (value) { return value >= a && value <= b; }; },

    range: function (a, b) { return function (value) { return value >= a && value <= b; }; },

    lessThan: function (n) { return function (value) { return value < n; }; },

    lessThanOrEqual: function (n) { return function (value) { return value <= n; }; },

    greaterThan: function (n) { return function (value) { return value > n; }; },

    greaterThanOrEqual: function (n) { return function (value) { return value >= n; }; },

    // Divisible

    even: function () { return function (value) { return value % 2 === 0; }; },

    odd: function () { return function (value) { return value % 2 !== 0; }; },

    includes: function (expected) { return function (value) { return ~value.indexOf(expected); }; },

    schema: function (schema) { return testSchema(schema); },

    // branching

    passesAnyOf: function () {
      var validations = [], len = arguments.length;
      while ( len-- ) validations[ len ] = arguments[ len ];

      return function (value) { return validations.some(function (validation) { return validation.test(value); }); };
  },

    optional: function (validation, considerTrimmedEmptyString) {
      if ( considerTrimmedEmptyString === void 0 ) considerTrimmedEmptyString = false;

      return function (value) {
      if (
        considerTrimmedEmptyString &&
        typeof value === 'string' &&
        value.trim() === ''
      ) {
        return true;
      }

      if (value !== undefined && value !== null) { validation.check(value); }
      return true;
    };
  },
  };

  function testType(expected) {
    return function (value) {
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
      simple: function (value) {
        var causes = [];
        Object.keys(schema).forEach(function (key) {
          var nestedValidation = schema[key];
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
      async: function (value) {
        var causes = [];
        var nested = Object.keys(schema).map(function (key) {
          var nestedValidation = schema[key];
          return nestedValidation.testAsync((value || {})[key]).catch(function (ex) {
            ex.target = key;
            causes.push(ex);
          });
        });
        return Promise.all(nested).then(function () {
          if (causes.length > 0) {
            throw causes;
          }

          return true;
        });
      },
    };
  }

  return v8n;

})));
