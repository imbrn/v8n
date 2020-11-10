import {
  AsyncRuleValidator,
  RuleDefinition,
  SimpleRuleValidator,
} from '../types/v8n';
import Modifier from './Modifier';
import ValidationError from './ValidationError';

class Rule {
  name: string;
  fn: RuleDefinition;
  args: any[];
  modifiers: Modifier[];

  constructor(
    name: string,
    fn: RuleDefinition,
    args: any[] = [],
    modifiers: Modifier[] = [],
  ) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  }

  _test(value: unknown): boolean {
    let fn = this.fn;

    try {
      testAux(this.modifiers.slice(), fn)(value);
    } catch (ex) {
      fn = () => false;
    }

    try {
      return testAux(this.modifiers.slice(), fn)(value);
    } catch (ex) {
      return false;
    }
  }

  _check(value: unknown): void {
    try {
      testAux(this.modifiers.slice(), this.fn)(value);
    } catch (ex) {
      if (testAux(this.modifiers.slice(), it => it)(false)) {
        return;
      }
    }

    if (!testAux(this.modifiers.slice(), this.fn)(value)) {
      throw null;
    }
  }

  _testAsync(value: unknown): Promise<unknown | ValidationError> {
    return new Promise((resolve, reject) => {
      testAsyncAux(
        this.modifiers.slice(),
        this.fn,
      )(value)
        .then((valid: any) => {
          if (valid) {
            resolve(value);
          } else {
            reject(null);
          }
        })
        .catch((ex: ValidationError) => reject(ex));
    });
  }
}

function pickSimpleFn(fn: RuleDefinition) {
  return 'simple' in fn ? fn.simple : (fn as SimpleRuleValidator);
}

function pickAsyncFn(fn: RuleDefinition) {
  return 'async' in fn ? fn.async : fn;
}

function testAux(
  modifiers: Modifier[],
  fn: RuleDefinition,
): SimpleRuleValidator {
  if (modifiers.length) {
    const modifier = modifiers.shift()!;
    const nextFn = testAux(modifiers, fn);
    return modifier.perform(nextFn);
  } else {
    return pickSimpleFn(fn);
  }
}

function testAsyncAux(
  modifiers: Modifier[],
  fn: RuleDefinition,
): AsyncRuleValidator {
  if (modifiers.length) {
    const modifier = modifiers.shift()!;
    const nextFn = testAsyncAux(modifiers, fn);
    return modifier.performAsync(nextFn);
  } else {
    return value => Promise.resolve(pickAsyncFn(fn)(value));
  }
}

export default Rule;
