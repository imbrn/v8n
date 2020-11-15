import { Modifier } from './modifier';

export type SimpleValidator = (value?: any) => boolean;

export type AsyncValidator = (value?: any) => Promise<boolean>;

export interface ObjectValidator {
  simple: SimpleValidator;
  async: AsyncValidator;
}

export type Validator = SimpleValidator | AsyncValidator | ObjectValidator;

export type RuleDefinition = (...args: any[]) => Validator;

export class Rule {
  constructor(name: string, fn: Validator, args: any[], modifiers: Modifier[]);
  name: string;
  fn: Validator;
  args: any[];
  modifiers: Modifier[];
}
