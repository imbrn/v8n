import v8n from '../index';

v8n()
  .not.equal('test')
  .exact('test')
  .number()
  .integer()
  .numeric()
  .string()
  .some.boolean()
  .undefined()
  .null()
  .array()
  .object()
  .instanceOf(Error)
  .pattern(/[a-z]/)
  .every.lowercase()
  .uppercase()
  .vowel()
  .consonant()
  .first('t')
  .last('t')
  .empty()
  .length(4)
  .minLength(4)
  .maxLength(4)
  .negative()
  .positive()
  .between(4, 4)
  .range(4, 4)
  .lessThan(10)
  .lessThanOrEqual(10)
  .greaterThan(10)
  .greaterThanOrEqual(10)
  .even()
  .odd()
  .includes('test')
  .schema({ test: 2 })
  .passesAnyOf()
  .optional(v8n().string())
  .test(12);

v8n()
  .string()
  .test();

v8n()
  .string()
  .testAll();

v8n()
  .string()
  .check();

v8n()
  .string()
  .testAsync();
