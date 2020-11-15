import v8n, { RuleDefinition } from '../index';

declare module '../v8n' {
  interface V8nValidator {
    isOne(): V8nValidator;
  }
}

const isOne: RuleDefinition = () => value => value === 1;

v8n.extend({ isOne });

const result = v8n()
  .isOne()
  .test(2);
