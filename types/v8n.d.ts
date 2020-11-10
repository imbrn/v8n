import Context from '../src/Context';

type SimpleRuleValidator<T = any> = (value: T) => boolean;
type AsyncRuleValidator<T = any> = (value: T) => Promise<boolean>;

interface ObjectRuleDefinition<T = any> {
  simple: SimpleRuleValidator<T>;
  async: AsyncRuleValidator<T>;
}

export type RuleDefinition<T = any> =
  | SimpleRuleValidator<T>
  | AsyncRuleValidator<T>
  | ObjectRuleDefinition<T>;

type RuleFunction<T = any> = (...args: any[]) => RuleDefinition<T>;

export type SimpleModifierFunction = (
  fn: SimpleRuleValidator,
) => SimpleRuleValidator;

export type AsyncModifierFunction = (
  fn: AsyncRuleValidator,
) => AsyncRuleValidator;

export interface ModifierDefinition {
  simple: SimpleModifierFunction;
  async: AsyncModifierFunction;
}

export interface V8nDefaultModifiers {
  [name: string]: ModifierDefinition;
  not: ModifierDefinition;
  some: ModifierDefinition;
  every: ModifierDefinition;
}

export interface V8nRules {
  [name: string]: (...args: any[]) => RuleDefinition;
}

export interface V8nDefaultRules extends V8nRules {
  // Equality
  equal: (expected: any) => RuleDefinition;
  exact: (expected: any) => RuleDefinition;

  // Types
  number: (allowInfinite?: boolean) => RuleDefinition;
  integer: () => RuleDefinition;
  numeric: () => RuleDefinition;
  string: () => RuleDefinition;
  boolean: () => RuleDefinition;
  undefined: () => RuleDefinition;
  null: () => RuleDefinition;
  array: () => RuleDefinition;
  object: () => RuleDefinition;
  instanceOf: (instance: any) => RuleDefinition;

  // Pattern
  pattern: (pattern: RegExp) => RuleDefinition<string>;
  lowercase: () => RuleDefinition<string>;
  uppercase: () => RuleDefinition<string>;
  vowel: () => RuleDefinition<string>;
  consonant: () => RuleDefinition<string>;

  // Value at positions
  first: (expected: any) => RuleDefinition<string | Array<any>>;
  last: (expected: any) => RuleDefinition<string | Array<any>>;

  // Length
  empty: () => RuleDefinition<string | Array<any>>;
  length: (min: number, max?: number) => RuleDefinition<string | Array<any>>;
  minLength: (min: number) => RuleDefinition<string | Array<any>>;
  maxLength: (max: number) => RuleDefinition<string | Array<any>>;

  // Range
  negative: () => RuleDefinition<number>;
  positive: () => RuleDefinition<number>;
  between: (a: number, b: number) => RuleDefinition<number>;
  range: (a: number, b: number) => RuleDefinition<number>;
  lessThan: (n: number) => RuleDefinition<number>;
  lessThanOrEqual: (n: number) => RuleDefinition<number>;
  greaterThan: (n: number) => RuleDefinition<number>;
  greaterThanOrEqual: (n: number) => RuleDefinition<number>;

  // Divisible
  even: () => RuleDefinition<number>;
  odd: () => RuleDefinition<number>;

  // Misc
  includes: (expected: any) => RuleDefinition<string | Array<any>>;
  schema: (schema: Object) => RuleDefinition<{ [key in string | number]: any }>;

  // Branching
  passesAnyOf: (...validations: Context[]) => RuleDefinition;
  optional: (
    validation: Context,
    considerTrimmedEmptyString?: boolean,
  ) => RuleDefinition;
}

type V8nRulesValidator = {
  [K in keyof V8nDefaultRules]: (
    ...args: Parameters<V8nDefaultRules[K]>
  ) => V8nValidator;
};
type V8nModifiersValidator = {
  [K in keyof V8nDefaultModifiers]: V8nValidator;
};

type V8nValidator = V8nRulesValidator & V8nModifiersValidator & Context;
