# Implementation details

> This documentation section is aimed at people who want to learn more about the
> v8n's implementation details either for contributing or learning purposes.

## Rule decoration algorithm

In this section, we're going to see the implementation details of the algorithm
used to apply modifiers over rules.

This algorithm is what allows us to have that great syntax for chaining rules
and modifiers together when building validation strategies.

> For the sake of simplicity, we'll keep the explanation of this algorithm just
> for synchronous validations. For asynchronous validations, we just need to
> work with promises instead of functions calls.

### Rule functions

A rule function is just a function which returns another function. The returned
function is what is executed by the library core when it's performing
validations.

See the implementation of the `equal` rule function, for example:

```javascript
function equal(expected) {
  return value => value == expected;
}
```

A rule function cannot provide too much flexibility by itself, but it becomes
really powerful when used together with modifiers.

### Modifiers

Modifiers are used to decorate (change) the meaning of a rule:

> Actually, modifiers will change the meaning only of the next rule, that is the
> rule applied right after it.

```javascript
v8n()
  .not.equal(5)
  .not.exact(10);
```

In this example, we see the modifier `not` being applied two times: one for the
`equal` rule and other for the `exact` rule.

A modifier is just a function which gets a rule function as an argument and
returns another function which will apply some modifications over the return of
the prior rule function.

Take a look at the `not` modifier implementation logic, for example:

```javascript
function not(ruleFunction) {
  return value => !ruleFunction(value);
}
```

Notice that the `not` modifier is just returning a function which will execute
the passed rule function, but will invert its return before returning the final
result.

### Applying modifiers to a rule

For that rules-and-modifiers chaining language to work as expected, we need some
kind of processing to apply those modifiers over rules. And for this purpose,
we're going to use an algorithm I called the `rule decoration algorithm`.

When executed, the `rule decoration algorithm` transforms a rule function
applying all modifiers before it to generate a decorated rule function. This
process uses a recursive approach and we're going to see now how it works.

### The `rule decoration algorithm`

If we have the following definition:

`v8n().some.not.equal(3)`

It states that, for an array (or string) which we're going to validate, we
expect that this array contains some value that is not equal 3. So, it's going
to fail only for an array that contains only the value 3: `[3, 3, 3]`. But it's
going to pass if at least one element is not equal 3: `[3, 1, 3, 3]`.

When this validation is executed, the v8n's core performs the _rule decoration
algorithm_ in order to produce a decorated rule, so it can be executed to get
the correct final result.

Let's see this process step by step:

#### Step 1

The first thing that our algorithm needs to do is to guarantee that the
validated value is compatible with the rule function that is been applied.

> This step is important because it allows us to perform irregular validations
> and get the most suitable results.

So, the algorithm checks if the rule function (`equal`, in our example) is
compatible with the type being validated:

```javascript
let fn = this.fn;
try {
  fn(value);
} catch (ex) {
  fn = () => false;
}
```

It tries to execute the rule function directly on the validated value. If it
throws an exception, that implies that the rule function is not compatible with
the value, and then it will consider the rule function as something that will
always return false for that value.

But, if it doesn't throw an exception, it implies that our value can be checked
by that rule function, so we can keep it as it is.

An example where we're going to get this kind of incompatibility is when we use
the rule function `includes` to validate a number value:

```javascript
// the value 123 surely does not include the "hello" string, so it' valid!
v8n()
  .not.includes("hello")
  .test(123);
```

The `includes` rule function expects that the validated value have an `indexOf`
method. But this is not what happens with a `number`. So it's going to throw an
exception.

So, in order to get a suitable result, we must consider `includes` to return
`false`, so that we can apply the modifiers to it and get what we expect.

#### Step 2

After normalizing the rule function, the algorithm is safe to apply the
modifiers over it.

And this is what it's going to do here:

```javascript
try {
  return decorateFn(this.modifiers.slice(), fn)(value);
} catch (ex) {
  return false;
}
```

There are two steps here. First, we need to perform the `decorateFn` function in
order to get our decorated rule function, and then execute it to obtain our the
final result for our validation.

#### Step 2.1

The `decorateFn` function is where the recursive decoration of the rule function
really happens:

```javascript
function decorateFn(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = decorateFn(modifiers, fn);
    return modifier.perform(nextFn);
  } else {
    return fn;
  }
}
```

This function gets a list of modifiers and a rule function (`fn`) to be
decorated with those.

Here is where the process gets a little tricky, but not that much. We just need
to understand what the validation is supposed to do, so we can easily understand
how the recursive algorithm is working.

In our example:

`v8n().some.not.equal(3)`

It's telling us that for some validated (array or string) value, it expects that
there's nothing equals to 3 inside that value. Right?

So, if the validated value is: `[0, 2, 4, 6]`, the validation is supposed to
pass. We expect this! There's no 3 inside that.

But how can we do that?

If we just execute the process backward, it's not going to work. The rule
function `equal` does not expect an array to be validated, but a single value.
We also can't do the validation forwards, as the `some` modifier cannot do its
job without a rule function.

So our recursive approach comes it.

First, the `decorateFn` function will get the first modifier of the list and
will recursively call itself with the remaining modifiers. This recursive call
will produce a function which we can now be attached to the current modifier.

> The recursive calls continue until we get an empty list of modifiers. So we
> get our initial rule function (`equal`, in our example).

So instead of expecting a value for executing against, the modifier expects a
function. So it can execute that function against the validated value as it
should do. For the modifier `some`, for example, it will do the following:

```javascript
function some(fn) {
  return value => value.some(fn);
}
```

Notice that it's not executing anything but it's returning a function that when
executed will call the `some` method of `array` using that `fn` as the function
for testing the values at all.

For our example, this `fn` that's being passed to the `some` modifier is
actually the result of the same recursive process applied to the remaining
validation declaration: `not.equal(3)`.

And the `not` modifier will also get a function (with the remaining portion of
the validation) which in our example will be in fact the `equal` rule function
itself.

So if we come back to the `rule decoration algorithm`, we can see now that it
does exactly what we have talked about:

```javascript
function decorateFn(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = decorateFn(modifiers, fn);
    return modifier.perform(nextFn);
  } else {
    return fn;
  }
}
```

It recursively iterates over the modifiers building a next rule function which
is decorated by the remaining modifiers. And then that decorated rule function
can be now decorated by the current modifier. And so on.

And this is how we build our final decorated rule function which we can be
executed against the validated value to produce the correct result.

#### Step 2.2

Now that the "hard" part is done. We just need to execute the decorated rule
function.

If some exception occurs during this final step, it means that something went
wrong with the modifiers, so our validation doesn't pass. Otherwise, it returns
the value returned by calling the decorated function.

```javascript
try {
  return decorateFn(this.modifiers.slice(), fn)(value);
} catch (ex) {
  return;
  false;
}
```

### Other validation functions

> With other validation functions, like `check` and `testAll`, we perform almost
> the same process, except that instead of returning `false` when we get an
> exception, we fallback that exception as the failure cause.
