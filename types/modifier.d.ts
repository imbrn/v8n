import { AsyncValidator, SimpleValidator, Rule } from './rule';

export type Performer<T> = (fn: T, rule?: Rule) => T;

export interface Modifier {
  name: string;
  perform: Performer<SimpleValidator>;
  performAsync: Performer<AsyncValidator>;
}
