import { AsyncModifierFunction, SimpleModifierFunction } from '../types/v8n';

class Modifier {
  name: string;
  perform: SimpleModifierFunction;
  performAsync: AsyncModifierFunction;

  constructor(
    name: string,
    perform: SimpleModifierFunction,
    performAsync: AsyncModifierFunction,
  ) {
    this.name = name;
    this.perform = perform;
    this.performAsync = performAsync;
  }
}

export default Modifier;
