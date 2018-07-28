<p align="center">
  <img src="./docs/assets/logo.png" alt="v8n" />
</p>

<p align="center">
The ultimate JavaScript validation library you've ever needed.<br/>
Dead simple fluent API. Customizable. Reusable.
</p>

<p align="center">
  <a href="https://circleci.com/gh/imbrn/v8n/tree/master">
    <img src="https://circleci.com/gh/imbrn/v8n/tree/master.svg?style=svg" alt="CircleCI" />
  </a>
  <img src="https://img.shields.io/npm/v/v8n.svg" alt="npm version" />
  <img src="https://img.shields.io/bundlephobia/minzip/v8n.svg" alt="npm bundle size (minified + gzip)" />
</p>

<p align="center">
<a href="#installation">Installation</a> -
<a href="#usage">Usage</a> -
<a href="https://imbrn.github.io/v8n">Documentation</a> -
<a href="https://imbrn.github.io/v8n/api/">API</a>
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

> **v8n** is an acronym for **v**_alidatio_**n**. Notice that it has exactly
eight letters between **v** and **n** in the _"validation"_ word. This is the
same pattern we are used to seeing in _i18n_, _a11y_, _l10n_ ...

The `v8n` is a validation library which provides you an easy and incredibly
fluent way to build and run validations. With this, you can construct validation
strategies as easy as you'd do in the English language.

The main goal of this library is to be used to validate any kind of data with
any validation type. There are a lot of useful built-in-rules for you to use,
and you also can build (and share) your own.

By mixing rules and modifiers, you can build a ton of different validation
strategies, using its incredible fluent API.

The `v8n` is not intended to be used in a specific application scope, like an
input field or data model validation.

Actually, it's designed to be used with any scope, and to aid reusability of
validation strategies between scopes. So, you can define your validation and use
it in your input field, in your pre-request logic, in your server-side model,
whatever. Pretty cool, huh?

## Features

- Incredible fluent and chainable API;
- Useful standard validation rules;
- Custom validations rules;
- Asynchronous validation;
- Reusability;
- Validation composition;

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

> Access our [documentation page](https://imbrn.github.io/v8n) to learn more
about the library and its API.

### Boolean based validation

We use the function `test` to perform boolean based validations:

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

We use the function `testAll` to perform array based validations. The returned
array will contain a ValidationException object for each fail that has occurred,
and an empty array if the validation passes:

```javascript
import v8n from "v8n";

v8n()
  .number()
  .testAll("Hello"); // [ValidationException{ rule:{ name: 'number', ... } ...}]
```

### Exception based validation

We can also use the `check` function to perform exception based validations.
This is going to throw an exception when the validation fails:

```javascript
import v8n from "v8n";

try {
  v8n()
    .number()
    .between(10, 20)
    .check(25);
} catch (ex) {
  // ex is a ValidationException object
}
```

> A `ValidationException` object contains a lot of useful information about the
validation process and its fail cause.

### Asynchronous validation

If your validation strategy includes some asynchronous rule, you must use the
'testAsync' function, so that the validation process will execute
asynchronously. It will return a promise that will resolve with the validated
value when it's valid and rejects with a `ValidationException` when it's
invalid.

```javascript
v8n()
  .number()
  .between(10, 100)
  .someAsyncRule()
  .testAsync(50)
  .then(value => { /* valid */ })
  .catch(exception => { /* invalid */ });
```

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

Contributions of any kind are welcome! Read our
[CONTRIBUTING](./.github/CONTRIBUTING.md) guide.

## License

[MIT License](https://opensource.org/licenses/MIT)
