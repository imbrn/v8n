import Rule from './Rule';

export = Modifier;

declare class Modifier {
  constructor(
    name: string,
    perform: Modifier.SimpleFunction,
    performAsync: Modifier.AsyncFunction,
  );
  name: string;
  perform: Modifier.SimpleFunction;
  performAsync: Modifier.AsyncFunction;
}

declare namespace Modifier {
  type SimpleFunction = (fn: Rule.SimpleValidator) => Rule.SimpleValidator;

  type AsyncFunction = (fn: Rule.AsyncValidator) => Rule.AsyncValidator;
}
