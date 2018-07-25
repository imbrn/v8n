<p align="center">
  <img src="./docs/assets/logo.png" alt="v8n" />
</p>

<p align="center">
The ultimate JavaScript validation library you've ever needed.<br/>
Dead simple fluent API. Customizable. Reusable.
</p>

<p align="center">
<a href="#installation">Installation</a> -
<a href="#usage">Usage</a> -
<a href="https://imbrn.github.io/v8n">Documentation</a>
</p>

```javascript
v8n()
  .string()
  .not.every.vowel()
  .not.every.consonant()
  .first("H")
  .last("o")
  .test("Hello"); // true
```

## What is it?

The `v8n` is a validation library which provides you an easy and incredibly
fluent way to build and run validations. With this, you can construct validation
strategies as easy as you'd do in the English language.

The main goal of this library is to be used to validate any kind of data with
any validation type. There are a lot of useful built-in-rules for you to use,
and you also can build (and share) your own.

By mixing rules and modifiers, you can build a ton of different validation
strategies, using its incredible fluent API.

The `v8n` is not intended to be used in a specific application scope, like an
input input or data model validation.

Actually, it's designed to be used in any scope, and to reuse validation
strategies between scopes. So, you can define your validation and use it in your
input field, in your pre-request logic, in your server-side model, whatever.
Pretty cool, huh?

## Features

- Incredible fluent and chainable API;
- Useful standard validation rules;
- Custom validations rules;
- Asynchronous validation;
- Reusability;

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

There is a much better place for you to check out how this library works and to
get information about its API. Access our
[documentation](https://imbrn.github.io/v8n) page.

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

## Rules

Rules are the heart of the `v8n` ecosystem. You use them to build your
validation strategies:

```javascript
v8n()
  .string()
  .minLength(3)
  .test("Hello"); // true
```

In this code snippet, we're using two rules (`string` and `minLenght`) to build
our validation strategy. So our validated value (`"Hello"`) is valid because
it's a string and it is at least 3 characters long.

There are a lot of built-in validation rules to be used. Check them all in in
the [documentation]("https://imbrn.github.io/v8n/api/#built-in-rules")

> Rules can be more powerful if used along with _modifiers_. Learn about them in
> the next section.

## Modifiers

Modifiers can be used to change rules meaning. For example, you can use the
`not` modifier to expect the reversed result from your rule:

```javascript
v8n()
  .not.equal(5)
  .test(5); // false
```

> There are some others modifiers, you can check all of them in the
> documentation page.

Modifiers can also be used together to build incredible fluent validations. Take
a look:

```javascript
v8n()
  .some.not.lowercase()
  .test("Hello"); // true
```

Here, we're declaring a validation which expects that the validated value have
**at least one** item that is not lowercase.

But in this next validation snippet, just by changing the order of the
modifiers, our validation now expects that **none** of the items to be
lowercase:

```javascript
v8n()
  .not.some.lowercase()
  .test("Hello"); // false
```

## Contribute

Contributions of any kind are welcome!

## License

[MIT License](https://opensource.org/licenses/MIT)
