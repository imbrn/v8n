class Rule {
  constructor(name, fn, args, modifiers) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  }

  _test(value) {
    try {
      const result = testAux(this.modifiers.slice(), this.fn)(value);
      if (typeof result !== "boolean") {
        throw result;
      }
      return result;
    } catch (ex) {
      return testAux(this.modifiers.slice(), () => false)(false);
    }
  }

  _check(value) {
    return testAux(this.modifiers.slice(), this.fn)(value);
  }

  _testAsync(value) {
    return new Promise((resolve, reject) => {
      testAsyncAux(this.modifiers.slice(), this.fn)(value).then(valid => {
        if (valid) {
          resolve(value);
        } else {
          reject(this);
        }
      });
    });
  }
}

function testAux(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAux(modifiers, fn);
    return applyModifier(modifier, nextFn);
  } else {
    return fn;
  }
}

function applyModifier(modifier, fn) {
  return value => {
    try {
      return modifier.perform(fn)(value);
    } catch (ex) {
      return value;
    }
  };
}

function testAsyncAux(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAsyncAux(modifiers, fn);
    return modifier.performAsync(nextFn);
  } else {
    return value => Promise.resolve(fn(value));
  }
}

export default Rule;
