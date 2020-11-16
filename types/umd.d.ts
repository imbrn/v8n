import * as _v8n from './index';

declare namespace v8n {
  // validationerror
  export type ValidationError = _v8n.ValidationError;

  // rule
  export type Rule = _v8n.Rule;
  export type RuleDefinition = _v8n.RuleDefinition;

  // modifier
  export type Modifier = _v8n.Modifier;

  // v8n
  export type V8nValidator = _v8n.V8nValidator;

  // object
  export var extend: _v8n.V8nExtend;
  export var clearCustomRules: () => void;
}

declare function v8n(): _v8n.V8nValidator;

export = v8n;

export as namespace v8n;
