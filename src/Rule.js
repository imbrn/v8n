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
      fn(value);
    } catch (ex) {
      fn = () => false;
    }

    try {
      return decorateFn(this.modifiers.slice(), fn)(value);
    } catch (ex) {
      return false;
    }
  }

  _check(value) {
    try {
      this.fn(value);
    } catch (ex) {
      if (decorateFn(this.modifiers.slice(), it => it)(false)) {
        return;
      }
    }

    if (!decorateFn(this.modifiers.slice(), this.fn)(value)) {
      throw null;
    }
  }

  _testAsync(value) {
    return new Promise((resolve, reject) => {
      decorateFnAsync(this.modifiers.slice(), this.fn)(value)
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

function decorateFn(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = decorateFn(modifiers, fn);
    return modifier.perform(nextFn);
  } else {
    return fn;
  }
}

function decorateFnAsync(modifiers, fn) {
  if (modifiers.length) {
    const modifier = modifiers.shift();
    const nextFn = decorateFnAsync(modifiers, fn);
    return modifier.performAsync(nextFn);
  } else {
    return value => Promise.resolve(fn(value));
  }
}

export default Rule;
