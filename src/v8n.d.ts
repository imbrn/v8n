import Rule from './Rule';
import ValidationError from './ValidationError';

export = v8n;

declare function v8n(): v8n.Validator;

declare namespace v8n {
  type RuleDefinition = (...args: any[]) => Rule.Function;

  export interface Validator {
    chain: Rule[];
    test(value?: any): boolean;
    testAll(value?: any): ValidationError[];
    check(value?: any): boolean;
    testAsync(value?: any): boolean;
    not: Validator;
    some: Validator;
    every: Validator;
    equal(expected: any): Validator;
    exact(expected: any): Validator;
    number(allowInfinite?: boolean): Validator;
    integer(): Validator;
    numeric(): Validator;
    string(): Validator;
    boolean(): Validator;
    undefined(): Validator;
    null(): Validator;
    array(): Validator;
    object(): Validator;
    instanceOf(instance: any): Validator;
    pattern(pattern: RegExp): Validator;
    lowercase(): Validator;
    uppercase(): Validator;
    vowel(): Validator;
    consonant(): Validator;
    first(item: any): Validator;
    last(item: any): Validator;
    empty(): Validator;
    length(min: number, max?: number): Validator;
    minLength(min: number): Validator;
    maxLength(max: number): Validator;
    negative(): Validator;
    positive(): Validator;
    between(a: number, b: number): Validator;
    range(a: number, b: number): Validator;
    lessThan(n: number): Validator;
    lessThanOrEqual(n: number): Validator;
    greaterThan(n: number): Validator;
    greaterThanOrEqual(n: number): Validator;
    even(): Validator;
    odd(): Validator;
    includes(item: any): Validator;
    schema(schema: { [key in string | number]: any }): Validator;
    passesAnyOf(...validations: Validator[]): Validator;
    optional(
      validation: Validator,
      considerTrimmedEmptyString?: boolean,
    ): Validator;
  }

  export const extend: (newRules: { [name: string]: RuleDefinition }) => void;
  export const clearCustomRules: () => void;
}
