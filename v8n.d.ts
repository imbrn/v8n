// Type definitions for v8n
// Project: v8n
// Definitions by:
//        Sebastian Barfurth <https://github.com/sebastianbarfurth>

export as namespace v8n;

declare function v8n(): v8n.Validation;

declare namespace v8n {
  export interface Validation {
    chain: Rule[];
    invert?: boolean;
  }
  export interface Rule {
    name: string,
    fn: Function,
    args?: any,
    invert?: boolean
  }
}

export = v8n;
