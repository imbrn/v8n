import {
  V8nDefaultModifiers,
  V8nDefaultRules,
  V8nRules,
  V8nValidator,
} from '../types/v8n';
import Context from './Context';
import ValidationError from './ValidationError';

function v8n(): V8nValidator {
  return proxyContext(new Context());
}

// Custom rules
let customRules: V8nRules = {};

v8n.extend = function(newRules: V8nRules) {
  Object.assign(customRules, newRules);
};

v8n.clearCustomRules = function() {
  customRules = {};
};

function proxyContext(context: Context): V8nValidator {
  return new Proxy(context, {
    get(obj, prop: string) {
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
  }) as Context & V8nValidator;
}

const availableModifiers: V8nDefaultModifiers = {
  not: {
    simple: fn => value => !fn(value),
    async: fn => value =>
      Promise.resolve(fn(value))
        .then(result => !result)
        .catch(() => true),
  },

  some: {
    simple: fn => value => {
      return split(value).some((item: any) => {
        try {
          return fn(item);
        } catch (ex) {
          return false;
        }
      });
    },
    async: fn => value => {
      return Promise.all(
        split(value).map((item: any) => {
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

function split(value: any) {
  if (typeof value === 'string') {
    return value.split('');
  }
  return value;
}

const availableRules: V8nDefaultRules = {
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

  includes: expected => value => value.indexOf(expected) >= 0,

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

function testType(expected: any) {
  return (value: any) => {
    return (
      (Array.isArray(value) && expected === 'array') ||
      (value === null && expected === 'null') ||
      typeof value === expected
    );
  };
}

function isIntegerPolyfill(value: any) {
  return (
    typeof value === 'number' && isFinite(value) && Math.floor(value) === value
  );
}

function testSchema(schema: { [key in string | number]: any }) {
  return {
    simple: (value: { [key in string | number]: any }) => {
      const causes: ValidationError[] = [];
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
    async: (value: { [key in string | number]: any }) => {
      const causes: ValidationError[] = [];
      const nested = Object.keys(schema).map(key => {
        const nestedValidation = schema[key];
        return nestedValidation
          .testAsync((value || {})[key])
          .catch((ex: ValidationError) => {
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
