import Modifier from './Modifier';

export = Rule;

declare class Rule {
  constructor(
    name: string,
    fn: Rule.Function,
    args: any[],
    modifiers: Modifier[],
  );
  name: string;
  fn: Rule.Function;
  args: any[];
  modifiers: Modifier[];
}

declare namespace Rule {
  type SimpleValidator = (value?: any) => boolean;

  type AsyncValidator = (value?: any) => Promise<boolean>;

  export interface ObjectDefinition {
    simple: SimpleValidator;
    async: AsyncValidator;
  }

  type Function = SimpleValidator | AsyncValidator | ObjectDefinition;
}
