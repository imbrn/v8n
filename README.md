<p align="center">
  <img src="./docs/assets/logo.png" alt="v8n" />
</p>

<p align="center">
The ultimate JavaScript validation library you've ever needed.<br/>
Dead simple fluent API. Customizable. Reusable.
</p>

<p align="center">
<a href="#usage">Usage</a> -
<a href="#installation">Installation</a> -
<a href="#api">Documentation</a>
</p>

```javascript
v8n()
  .number()
  .between(0, 100)
  .even()
  .not.equal(32)
  .test(74); // true
```

## Installation

```shell
# Using npm
npm install v8n

# or yarn
yarn add v8n
```

### Or using a `script` tag:

```html
<!-- From unpkg -->
<script src="https://unpkg.com/v8n/dist/v8n.min.js"></script>

<!-- or from jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/v8n/dist/v8n.min.js"></script>
```

## Usage

### Boolean based validation

We use the function [test](#test) to perform boolean based validations:

```javascript
import v8n from "v8n";

v8n()
  .not.null()
  .string()
  .first("H")
  .last("o")
  .test("Hello"); // true
```

### Array based validation

We use the function [testAll](#testAll) to perform array based validations. The
returned array will contain all failed rules or none if the validation passes:

```javascript
import v8n from "v8n";

v8n()
  .number()
  .testAll("Hello"); // [Rule{ name: 'number', ... }]
```

### Exception based validation

We can also use the [check](#check) function to perform exception based
validations. This is going to throw an exception when the validation fails:

```javascript
import v8n from "v8n";

try {
  v8n()
    .number()
    .between(10, 20)
    .check(25);
} catch (ex) {
  console.log(ex.rule.name); // "between"
  console.log(ex.rule.args); // [10, 20]
  console.log(ex.value); // 25
  console.log(ex.cause); // Rule failed!
}
```

> The exception thrown by the `check` function contains useful information about
> the rule which caused the validation fail, and it also has information about
> the validation process. Look and the [ValidationException
> docs](#validationexception) section to learn more about it.

### Asynchronous validation

If your validation strategy includes some asynchronous rule, you must use the
[testAsync](#testasync) function, so that the validation process will execute
asynchronously. It will return a promise that will resolve with the validated
value when it's valid and rejects with a
[ValidationException](#validationexception) when it's invalid.

> Look at the [testAsync](#testasync) documentation to learn more about it.
>
> To learn how you can define your custom asynchronous rules, check out [this
> documentation](#extend) section.

```javascript
v8n()
  .number()
  .between(10, 100)
  .someAsyncRule()
  .testAsync(50)
  .then(value => {
    // It's valid!!!
  })
  .catch(exception => {
    // It's invalid!
  });
```

> The `exception` object caught by the failure callback contains information
> about the rule which caused the validation fail, and about the validation
> process. Look at [its documentation](#validationexception) to learn more about
> it.

### And more...

There are a lot of useful standard rules for you to use already implemented in
the core. Look at the [API section](#api) of this document.

You can also [implement your own rules](#extend), and share them between your
projects, or even with the community.

## Custom validation rules

To create custom validation rules, you just need to call the `v8n.extend`
function passing an object with your custom rules:

```javascript
import v8n from "v8n";

v8n.extend({
  myCustomRule: function(expected) {
    return value => value === expected;
  }
});
```

And now you can use your custom rule in a validation as you do with standard
rules:

```javascript
v8n()
  .string()
  .myCustomRule("Hello")
  .test("Olá"); // false
```

> To learn more about custom rules and how to implement them, look at the
> [extend](#extend) documentation section.

## The `not` modifier

The `not` modifier can be used to invert a validation rule meaning. Suppose we
have a validation like that:

```javascript
v8n()
  .includes("World")
  .test("Hello World!"); // true
```

Here, we're declaring a validation to check if the validated value includes a
`"World"` string. And the test returns `true`.

But we could want a validation with the inverse meaning. With the `not`
modifier, we can do that:

```javascript
v8n()
  .not.includes("World")
  .test("Hello World!"); // false
```

Now, we have a validation to check if the value **does not** include a `"World"`
string. And the test returns `false`.

> The `not` modifier inverts the meaning only of the next `rule`, the rule
> declared right after it. So for each rule you want to invert its meaning, you
> should use the `not` modifier before it.
>
> To learn more about the `not` modifier, look at [its documentation](#not).

## Why another validation library?

Although we have a lot of validation libraries, almost all of them are about
input fields validation. That's great sometimes, but we often need something
independent of the way we're going to use it.

We usually need some kind of in-code validation, so that we can use that same
validation in an input field, in a function call, in the server logic, whatever.
Actually almost everytime, we need the same validation, that same logic, even
between different projects.

That's all about the `v8n` validation library. This is **not** another input field
validation library.

This is a powerful engine for validation creation, reuse, and in-code validation
execution.

With the `v8n` we can write our validation strategies and reuse them whenever we
need. Actually, we can reuse validation from other people, and in a really
simple way.

## Features

- Fluent and chainable API;
- Useful standard validation rules;
- Custom validations rules;
- Asynchronous validation;
- Reusability;

## Fluent and chainable API

The `v8n` library has a fluent chainable API. This help us to easily create
validation objects.

```javascript
v8n()
  .not.null()
  .between(100, 200)
  .even()
  .not.between(40, 60);
```

## Reusing validations

To reuse a validation strategy, you just need to declare it, export it in
someway, and import it from your code:

_myValidation.js_

```javascript
import v8n from "v8n";

// Export the validation object
export default v8n()
  .array()
  .not.empty()
  .minLength(3)
  .maxLength(10)
  .includes("Hello");
```

_myApp.js_

```javascript
// Import the validation object somewhere
import myValidation from "./myValidation";

myValidation.test(["Hello", "World", "!"]); // true
myValidation.check(["Hello", "Hi", "How is it going?"]); // No exception thrown!
```

## Sharing custom validation rules

You can write custom validation rules and reuse them in other projects. You
can also use rules from other people.

To export validation rules, create a `.js` file contain a call to the v8n static
[extend](#extend) function with your custom rules declared in a object, and then
export this file someway. So you can import this file from another source code,
and your custom validation rules will be available like the standard ones:

_myCustomRules.js_

```javascript
import v8n from "v8n";

v8n.extend({
  // "one" is a custom rule
  one() {
    return value => value == 1;
  },

  // "two" is another custom rule
  two() {
    return value => value == 2;
  }
});
```

And in another file or even another project, import the file with the custom
rules and use them like you do with standard rules:

```javascript
import v8n from "v8n";
import "myExternalProject/myCustomRules.js";

v8n()
  .number()
  .one()
  .test(1); // true

v8n()
  .string()
  .two()
  .test("2"); // true
```

> You can mix custom and standard rules as you want.

## Contribute

Contributions of any kind are welcome!

## License

[MIT License](https://opensource.org/licenses/MIT)
