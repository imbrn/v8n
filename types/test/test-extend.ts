import v8n from '../index';

declare module '../v8n' {
  interface V8nValidator {
    isOne(): V8nValidator;
  }
}

const isOne = () => (value: any) => value === 1;

v8n.extend({ isOne });

const result = v8n()
  .isOne()
  .test(2);
