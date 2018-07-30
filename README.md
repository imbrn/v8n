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
<a href="https://imbrn.github.io/v8n">Documentation</a> -
<a href="https://imbrn.github.io/v8n/api/">API</a>
</p>

## Introducing v8n

> **v8n** is an acronym for **v**_alidatio_**n**. Notice that it has exactly
> eight letters between **v** and **n** in the _"validation"_ word. This is the
> same pattern we are used to seeing with _i18n_, _a11y_, _l10n_ ...

### Chainable API

Create validations very easily with its chainable API:

```javascript
v8n()
  .string()
  .minLength(5)
  .first("H")
  .last("o")
  .test("Hello"); // true
```

### Incredibly fluent

Mix **rules** and **modifiers** together to create complex validations with
great ease and fluency:

```javascript
v8n()
  .some.vowel()
  .some.consonant()
  .not.every.lowercase()
  .not.every.uppercase()
  .not.some.number()
  .test("Foo5"); // false - no numbers (.not.some.number), please!
```

So fluent that it looks like English:

```javascript
v8n()
  .some.not.uppercase() // expects that some character is not uppercase
  .test("Hello"); // true

v8n()
  .not.some.uppercase() // expects that none character is uppercase
  .test("Hello"); // false
```

Notice how we made very different validation strategies just by changing the
order of the modifiers. It's so intuitive that seems to be impossible, but this
is v8n.

### Customizable

Create your own **custom validation rules** in a very intuitive way:

```javascript
function foo() {
  return value => value === "bar";
}

v8n.extend({ foo });
```

v8n will treat them as built-in ones:

```javascript
v8n()
  .string()
  .foo()
  .test("bar"); // true
```

### Reusable

Export validations just like you're used to do with your JavaScript modules:

_myValidation.js_

```javascript
import v8n from "v8n";

export default v8n()
  .number()
  .between(50, 100)
  .not.even();
```

and use them anywhere you want:

```javascript
import myValidation from "../myValidation";

myValidation.test(63); // true
```

### For any kind of data

Use v8n to validate your data regardless of its type. You can validate
primitives, arrays, objects and whatever you want! You can also use them
together!

```javascript
// numbers
v8n()
  .number()
  .between(5, 10)
  .test(7); //true

// strings
v8n()
  .string()
  .minLength(3)
  .test("foo"); // true

// arrays
v8n()
  .array()
  .every.even()
  .test([2, 4, 6]); // true

// objects
const myData = { id: "fe03" };

v8n()
  .schema({
    id: v8n().string()
  })
  .test(myData); // true
```

### For any kind of validation

Do simple validations with boolean based tests. Get more information about your
validation process with exception based tests. And of course, perform
asynchronous tests as well. All in one library.

#### Boolean based validation:

```javascript
v8n()
  .string()
  .first("H")
  .test("Hello"); // true
```

#### Exception based validation:

```javascript
try {
  v8n()
    .string()
    .first("b")
    .check("foo");
} catch (ex) {
  console.log(ex.rule.name); // first
}
```

#### Getting all failures:

```javascript
const failed = v8n()
  .string()
  .minLength(3)
  .testAll(10);

failed;
// [
//   ValidationException { rule: { name: "string", ... } },
//   ValidationException { rule: { name: "minLength", ... } }
// ]
```

#### Async validation:

If your validation strategy has some rule that performs time consuming
validation, like a back-end check validation, you should use asynchronous
validation:

```javascript
v8n()
  .somAsyncRule()
  .testAsync("foo") // returns a Promise
  .then(result => {
    /* valid! */
  })
  .catch(ex => {
    /* invalid! */
  });
```

### Shareable

Share your rules with the world, and use theirs as well.

Create useful validation rules and share them with the open source community,
and let people around the world to validate without reinventing the wheel.

### Ready to use!

There are a lot of built-in rules and modifiers for you to use already
implemented in `v8n`'s core. Take a look at all of them in our
[API](https://imbrn.github.io/v8n/api/) page. But if you can't find what you
need, go ahead and make it.

### Tiny!

All these incredible features for just a few bytes:

![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/v8n.svg)

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

## More about v8n

The `v8n` is a validation library which provides you an easy and incredibly
fluent way to build and run validations. With this, you can construct validation
strategies as easy as you'd do in the English language.

The main goal of this library is to be used to validate any kind of data with
any validation type. There are a lot of useful built-in-rules for you to use,
and you also can build (and share) your own.

The `v8n` is not intended to be used in a specific application scope, like an
input field or data model validation.

Actually, it's designed to be used with any scope, and to aid reusability of
validation strategies between scopes. So, you can define your validation and use
it in your input field, in your pre-request logic, in your server-side model,
whatever. Pretty cool, huh?

## Architecture

The **v8n** core is composed by `rules` and `modifiers`. They are used together
to build complex validations in a easy way.

### Rules

Rules are the heart of the `v8n` ecosystem. You use them to build your
validation strategies:

```javascript
v8n()
  .string()
  .minLength(3)
  .test("Hello"); // true
```

In this code snippet, we're using two rules (`string` and `minLength`) to build
our validation strategy. So our validated value (`"Hello"`) is valid because
it's a string and it is at least 3 characters long.

> Rules can be more powerful if used along with _modifiers_. Learn about them in
> the next section.

### Modifiers

Modifiers can be used to change rules meaning. For example, you can use the
`not` modifier to expect the reversed result from a rule:

```javascript
v8n()
  .not.equal(5)
  .test(5); // false
```

> You can check all available modifiers in our documentation page.

Modifiers are very powerful. They work as decorators for rules. When used
together, they allow you to build very complex validations.

## Contribute

Contributions of any kind are welcome! Read our
[CONTRIBUTING](./.github/CONTRIBUTING.md) guide.

## License

[MIT License](https://opensource.org/licenses/MIT)
