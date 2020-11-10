import Rule from './Rule';
import Modifier from './Modifier';
import ValidationError from './ValidationError';
import { ModifierDefinition, RuleFunction } from '../types/v8n';

class Context {
  [key: string]: any;
  chain: Rule[];
  nextRuleModifiers: Modifier[];

  constructor(chain: Rule[] = [], nextRuleModifiers: Modifier[] = []) {
    this.chain = chain;
    this.nextRuleModifiers = nextRuleModifiers;
  }

  _applyRule(ruleFn: RuleFunction, name: string) {
    return (...args: any[]): Context => {
      this.chain.push(
        new Rule(name, ruleFn.apply(this, args), args, this.nextRuleModifiers),
      );
      this.nextRuleModifiers = [];
      return this;
    };
  }

  _applyModifier(modifier: ModifierDefinition, name: string): Context {
    this.nextRuleModifiers.push(
      new Modifier(name, modifier.simple, modifier.async),
    );
    return this;
  }

  _clone(): Context {
    return new Context(this.chain.slice(), this.nextRuleModifiers.slice());
  }

  test(value?: unknown): boolean {
    return this.chain.every(rule => rule._test(value));
  }

  testAll(value?: unknown): ValidationError[] {
    const err: ValidationError[] = [];
    this.chain.forEach(rule => {
      try {
        rule._check(value);
      } catch (ex) {
        err.push(new ValidationError(rule, value, ex));
      }
    });
    return err;
  }

  check(value?: unknown): void {
    this.chain.forEach(rule => {
      try {
        rule._check(value);
      } catch (ex) {
        throw new ValidationError(rule, value, ex);
      }
    });
  }

  testAsync(value?: unknown): Promise<unknown | ValidationError> {
    return new Promise((resolve, reject) => {
      executeAsyncRules(value, this.chain.slice(), resolve, reject);
    });
  }
}

function executeAsyncRules(
  value: any,
  rules: Rule[],
  resolve: (value?: unknown) => void,
  reject: (reason?: any) => void,
) {
  if (rules.length) {
    const rule = rules.shift()!;
    rule._testAsync(value).then(
      () => {
        executeAsyncRules(value, rules, resolve, reject);
      },
      cause => {
        reject(new ValidationError(rule, value, cause));
      },
    );
  } else {
    resolve(value);
  }
}

export default Context;
