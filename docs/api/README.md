---
sidebar: auto
---

# API Reference

## Core

### Rule

- **Properties:**

  - `name: any`
  - `fn: Function`
  - `args: any[]`
  - `modifiers: Modifier[]`

- **Details:**

  This class represents a rule. It is returned from
  [array-based validation](#testall) and is contained in the rule property of a
  [`ValidationException`](#validationexception). The `fn` property contains the
  actual function the validation strategy uses to validate the value.

- **See also:** [Modifier](#modifier), [ValidationException](#validationexception)

### Modifier

- **Properties:**

  - `fork: Function`
  - `exec: Function`

- **Details:**

  This class represents a modifier. It is contained in an array within the
  `modifiers` property of a [`Rule`](#rule). `fork` is a helper function for
  mapping the value to the function correctly. `exec` performs the actual
  modification of the modifier.

- **See also:** [Rule](#rule)

### ValidationException

- **Extends:** [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

- **Properties:**

  - `rule: Rule`
  - `value: any`
  - `cause: Error`
  - `[target: string]`

- **Details:**

  This Exception is an extension of the native JavaScript `Error`. It's thrown
  when validation fails during [exception-based validation](#check) and is
  rejected to when [asynchronous validation](#testAsync) fails. It contains the
  `rule` that failed, the tested `value` and the `cause` of the exception. For
  certain rules it might also have a `target` which would usually represent a
  key in an object.

- **See also:** [Rule](#rule), [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

## Validation strategies

### test

- **Signature:** `test(value)`

- **Arguments:**

  - `value: any`

- **Returns:** `boolean`

- **Usage:**

  This function is used for boolean-based validation. It is chained at the end
  of all the rules and will return either true if all of them passed or false if
  any of them failed. It accepts only the value to be validated.

  ```js
  v8n()
    .string()
    .test("Test"); // True

  v8n()
    .number()
    .test(2); // True

  v8n()
    .null()
    .test([true, false]); // False
  ```

### testAll

- **Signature:** `testAll(value)`

- **Arguments:**

  - `value: any`

- **Returns:** [`Rule[]`](#rule)

- **Usage:**

  This function is used for array-based validation. It is chained at the end
  of all the rules and will return an array containing all rules that failed.
  The array is empty if the validation succeeded.

  ```js
  v8n()
    .string()
    .first("T")
    .testAll("Test"); // []

  v8n()
    .number()
    .min(4)
    .test(3); // [Rule{name: "min", ...}]
  ```

- **See also:** [Rule](#rule)

### check

- **Signature:** `check(value)`

- **Arguments:**

  - `value: any`

- **Returns:** `void`

- **Throws:** [`ValidationException`](#validationexception)

- **Usage:**

  This function is used for exception-based validation. It is chained at the end
  of all the rules and will return nothing if the validation passed. If any rule
  fails a [`ValidationException`](#validationexception) is thrown that contains
  the failed rule.

  ```js
  v8n()
    .string()
    .check("Test"); // (no return value)

  v8n()
    .string()
    .test(3); // ValidationException is thrown
  ```

- **See also:** [ValidationException](#validationexception)

### testAsync

- **Signature:** `testAsync(value)`

- **Arguments:**

  - `value: any`

- **Returns:** `Promise<any>`

- **Usage:**

  This function is used for asynchronous validation. It is chained at the end
  of all the rules and will return a `Promise` that will resolve to the
  validated value if validation passes or reject to a
  [`ValidationException`](#validationexception) if it fails. This strategy must
  be used if any asynchronous rules are used. It allows for the use of regular
  rules next to asynchronous ones.

  ::: danger
  All other validation strategies won't work for asynchronous rules.
  :::

  ```js
  v8n()
    .myAsyncRule()
    .testAsync("Test") // Promise
    .then(validatedValue => {
      // Validation passed
    })
    .catch(exception => {
      // Validation failed
    });

  v8n()
    .myAsyncRule()
    .test("Test"); // Unexpected result because the async rule is not resolved

  v8n()
    .string() // This works even though it's not async
    .myAsyncRule()
    .first("T") // This also works
    .testAsync("Test"); // Promise
  ```

- **See also:** [ValidationException](#validationexception)

## Built-in rules

### pattern

### equal

### exact

### string

### number

### boolean

### undefined

### null

### array

### object

### lowercase

### uppercase

### vowel

### consonant

### first

### last

### empty

### length

### minLength

### maxLength

### negative

### positive

### between

### range

### lessThan

### lessThanOrEqual

### greaterThan

### greaterThanOrEqual

### even

### odd

### includes

### integer

### schema

## Built-in modifiers

### not

### some

### every
