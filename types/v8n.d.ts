import { Rule, RuleDefinition } from './rule';
import { ValidationError } from './validationerror';

export interface V8nValidator {
  chain: Rule[];
  test(value?: any): boolean;
  testAll(value?: any): ValidationError[];
  check(value?: any): void;
  testAsync(value?: any): Promise<boolean>;
  not: V8nValidator;
  some: V8nValidator;
  every: V8nValidator;
  strict: V8nValidator;
  equal(expected: any): V8nValidator;
  exact(expected: any): V8nValidator;
  number(allowInfinite?: boolean): V8nValidator;
  integer(): V8nValidator;
  numeric(): V8nValidator;
  string(): V8nValidator;
  boolean(): V8nValidator;
  undefined(): V8nValidator;
  null(): V8nValidator;
  array(): V8nValidator;
  object(): V8nValidator;
  instanceOf(constructor: new (...args: any[]) => {}): V8nValidator;
  pattern(pattern: RegExp): V8nValidator;
  lowercase(): V8nValidator;
  uppercase(): V8nValidator;
  vowel(): V8nValidator;
  consonant(): V8nValidator;
  first(item: any): V8nValidator;
  last(item: any): V8nValidator;
  empty(): V8nValidator;
  length(min: number, max?: number): V8nValidator;
  minLength(min: number): V8nValidator;
  maxLength(max: number): V8nValidator;
  negative(): V8nValidator;
  positive(): V8nValidator;
  between(a: number, b: number): V8nValidator;
  range(a: number, b: number): V8nValidator;
  lessThan(n: number): V8nValidator;
  lessThanOrEqual(n: number): V8nValidator;
  greaterThan(n: number): V8nValidator;
  greaterThanOrEqual(n: number): V8nValidator;
  even(): V8nValidator;
  odd(): V8nValidator;
  includes(item: any): V8nValidator;
  schema(schema: { [key in string | number]: any }): V8nValidator;
  passesAnyOf(...validations: V8nValidator[]): V8nValidator;
  optional(
    validation: V8nValidator,
    considerTrimmedEmptyString?: boolean,
  ): V8nValidator;
}

export type V8nExtend = (newRules: { [name: string]: RuleDefinition }) => void;

export interface V8nObject {
  (): V8nValidator;
  extend: V8nExtend;
  clearCustomRules: () => void;
}

export const v8n: V8nObject;
