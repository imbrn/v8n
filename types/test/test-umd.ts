const result = v8n()
  .string()
  .check('hello');

v8n.extend({ rule: () => () => true });

v8n.clearCustomRules();
