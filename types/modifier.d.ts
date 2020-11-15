import { AsyncValidator, SimpleValidator } from './rule';

export type Performer<T> = (fn: T) => T;

export class Modifier {
  constructor(
    name: string,
    perform: Performer<SimpleValidator>,
    performAsync: Performer<AsyncValidator>,
  );
  name: string;
  perform: Performer<SimpleValidator>;
  performAsync: Performer<AsyncValidator>;
}
