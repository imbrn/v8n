// Type definitions for v8n
// Project: v8n
// Definitions by:
//        Sebastian Barfurth <https://github.com/sebastianbarfurth>

export as namespace v8n;

declare function v8n(): v8n.Validation;

declare namespace v8n {
  export interface Validation {
    chain: Rule[];
    invert?: boolean;
    extend(newRules: object): void;
    test(value: any): boolean;
    check(value: any): never;
    pattern(pattern: RegExp): Validation;
    equal(expected: any): Validation;
    exact(expected: any): Validation;
    string(): Validation;
    number(): Validation;
    boolean(): Validation;
    undefined(): Validation;
    null(): Validation;
    array(): Validation;
    lowercase(): Validation;
    vowel(): Validation;
    consonant(): Validation;
    first(item: any): Validation;
    last(item: any): Validation;
    empty(): Validation;
    length(min: number, max?: number): Validation;
    minLength(min: number): Validation;
    maxLength(max: number): Validation;
    negative(): Validation;
    positive(): Validation;
    between(min: number, max: number): Validation;
    range(min: number, max: number): Validation;
    lessThan(bound: number): Validation;
    lessThanOrEqual(bound: number): Validation;
    greaterThan(bound: number): Validation;
    greaterThanOrEqual(bound: number): Validation;
    even(): Validation;
    odd(): Validation;
    includes(expected: any): Validation;
    integer(): Validation;
  }
  export interface Rule {
    name: string;
    fn: Function;
    args?: any;
    invert?: boolean;
  }
  export interface ValidationException extends Error {
    rule: Rule;
    value: any;
  }
}

export = v8n;
