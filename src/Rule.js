class Rule {
  constructor(name, fn, args, modifiers) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  }

  _test(value) {
    let fn = this.fn;

    try {
      testAux(this.modifiers.slice(), fn, this)(value);
    } catch (ex) {
      fn = () => false;
    }

    try {
      return testAux(this.modifiers.slice(), fn, this)(value);
    } catch (ex) {
      return false;
    }
  }

  _check(value) {
    try {
      testAux(this.modifiers.slice(), this.fn, this)(value);
    } catch (ex) {
      if (testAux(this.modifiers.slice(), it => it, this)(false)) {
        return;
      }
    }

    if (!testAux(this.modifiers.slice(), this.fn, this)(value)) {
      throw null;
    }
  }

  _testAsync(value) {
    return new Promise((resolve, reject) => {
      testAsyncAux(
        this.modifiers.slice(),
        this.fn,
        this,
      )(value)
        .then(valid => {
          if (valid) {
            resolve(value);
          } else {
            reject(null);
          }
        })
        .catch(ex => reject(ex));
    });
  }
}

function pickFn(fn, variant = 'simple') {
  return typeof fn === 'object' ? fn[variant] : fn;
}

function testAux(modifiers, fn, rule) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAux(modifiers, fn, rule);
    return modifier.perform(nextFn, rule);
  } else {
    return pickFn(fn);
  }
}

function testAsyncAux(modifiers, fn, rule) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = testAsyncAux(modifiers, fn, rule);
    return modifier.performAsync(nextFn, rule);
  } else {
    return value => Promise.resolve(pickFn(fn, 'async')(value));
  }
}

export default Rule;
