/**
 * A Rule object instance stores information about a rule inside the validation
 * process.
 *
 * > It's mostly used by the developer to handle validation results. It's
 * > instantiated automatically by the library engine during the validation
 * > process and this should not be done directly by the developer.
 */
class Rule {
  /**
   * Constructs a Rule object instance.
   *
   * @param {string} name rule name
   * @param {function} fn rule function used to perform the validation
   * @param {*} args arguments used by the rule
   * @param {Array} modifiers list of modifiers to be applied on the Rule
   */
  constructor(name, fn, args, modifiers) {
    this.name = name;
    this.fn = fn;
    this.args = args;
    this.modifiers = modifiers;
  }

  _test(value) {
    const modifiers = this.modifiers.slice();
    const fn = this.fn;

    if (modifiers.length) {
      const first = modifiers.pop();
      value = first.fork(fn, value);
      value = first.exec(value);

      while (modifiers.length) {
        const modifier = modifiers.pop();
        value = modifier.fork(it => it, value);
        value = modifier.exec(value);
      }
      return value;
    } else {
      return fn(value);
    }
  }

  _testAsync(value) {
    const modifiers = this.modifiers.slice();
    const fn = this.fn;

    if (modifiers.length) {
      const first = modifiers.pop();
      value = first.fork(val => Promise.resolve(fn(val)), value);

      const isArray = Array.isArray(value);

      return Promise.all(isArray ? value : [value])
        .then(result => {
          let value = first.exec(isArray ? result : result[0]);

          while (modifiers.length) {
            const modifier = modifiers.pop();
            value = modifier.fork(it => it, value);
            value = modifier.exec(value);
          }

          return value;
        })
        .catch(ex => {
          return false;
        });
    } else {
      return Promise.resolve(fn(value));
    }
  }
}

export default Rule;
