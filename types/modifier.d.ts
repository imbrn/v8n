import { AsyncValidator, SimpleValidator } from './rule';

export type Performer<T> = (fn: T) => T;

export interface Modifier {
  name: string;
  perform: Performer<SimpleValidator>;
  performAsync: Performer<AsyncValidator>;
}
