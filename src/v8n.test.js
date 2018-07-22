import v8n from "./v8n";

describe("rules chain", () => {
  // TODO: make sure '.not' is included in debug
  const validation = v8n()
    .string()
    .lowercase()
    .null()
    .first("a")
    .last("e")
    .length(3, 5);

  it("should chain rules", () => {
    expect(debugRules(validation)).toEqual([
      "string()",
      "lowercase()",
      "null()",
      'first("a")',
      'last("e")',
      "length(3, 5)"
    ]);
  });
});

describe("execution functions", () => {
  const args = [1, 3];
  const validation = v8n().length(...args);

  describe("the 'test' function", () => {
    it("should return false for invalid value", () => {
      expect(validation.test("abcd")).toBeFalsy();
    });

    it("should return true for valid value", () => {
      expect(validation.test("ab")).toBeTruthy();
    });
  });

  describe("the 'testAll' function", () => {
    const validation2 = v8n()
      .number()
      .between(5, 10)
      .not.even();

    it("should return an array of rules that failed", () => {
      expect(Array.isArray(validation2.testAll("test"))).toBeTruthy();
      expect(validation2.testAll("11")).toHaveLength(2);
      expect(validation2.testAll(11)).toHaveLength(1);
    });

    it("should return an empty array if all rules passed", () => {
      expect(validation2.testAll(7)).toHaveLength(0);
    });
  });

  describe("the 'check' function", () => {
    it("should throw exception for invalid value", () => {
      expect(() => validation.check("abcd")).toThrow();
    });

    it("should pass through for valid value", () => {
      expect(() => validation.check("abc")).not.toThrow();
    });

    describe("the thrown exception", () => {
      const value = "abcd";
      let exception;

      beforeEach(() => {
        try {
          validation.check(value);
        } catch (ex) {
          exception = ex;
        }
      });

      it("should have rule object", () => {
        expect(exception.rule).toMatchObject({
          name: "length",
          args
        });
      });

      it("should have the validated value", () => {
        expect(exception.value).toBe(value);
      });
    });
  });

  describe("the 'testAsync' function", () => {
    function asyncRule(expected, delay = 50, exception) {
      return value =>
        new Promise(resolve => {
          setTimeout(() => {
            if (exception) throw exception;
            resolve(value == expected);
          }, delay);
        });
    }

    beforeEach(() => {
      v8n.extend({
        asyncRule
      });
    });

    it("should return a promise", () => {
      expect(
        v8n()
          .minLength(2)
          .asyncRule("Hello")
          .testAsync("Hello")
      ).toBeInstanceOf(Promise);
    });

    it("should execute rules in sequence", async () => {
      const validation = v8n()
        .minLength(2)
        .asyncRule("Hi")
        .asyncRule("Hello");

      await expect(validation.testAsync("Hello")).rejects.toMatchObject({
        rule: validation.chain[1]
      });

      await expect(validation.testAsync("Hi")).rejects.toMatchObject({
        rule: validation.chain[2]
      });
    });

    it("should work with the 'not' modifier", () => {
      const validation = v8n()
        .minLength(2)
        .not.asyncRule("Hello");

      return expect(validation.testAsync("Hello")).rejects.toMatchObject({
        rule: validation.chain[1],
        value: "Hello"
      });
    });

    describe("the returned Promise", () => {
      function asyncRule(expected, delay, exception) {
        return value =>
          new Promise(resolve => {
            setTimeout(() => {
              if (exception) throw exception;
              resolve(value == expected);
            }, delay);
          });
      }

      it("should resolves when valid", () => {
        return expect(
          v8n()
            .minLength(2)
            .asyncRule("Hello")
            .testAsync("Hello")
        ).resolves.toBe("Hello");
      });

      it("should rejects with ValidationException when invalid", () => {
        const validation = v8n()
          .minLength(2)
          .asyncRule("Hello");

        return expect(validation.testAsync("Hi")).rejects.toMatchObject({
          rule: validation.chain[1],
          value: "Hi"
        });
      });

      it("should rejects with with ValidationException when exception occurs", () => {
        const validation = v8n()
          .number()
          .between(0, 50)
          .includes("a");

        return expect(validation.testAsync(10)).rejects.toMatchObject({
          rule: validation.chain[2],
          value: 10
        });
      });
    });
  });
});

describe("modifiers", () => {
  describe("the 'not' modifier", () => {
    it("should invert the next rule meaning", () => {
      const validation = v8n()
        .number()
        .not.between(2, 8)
        .not.even();

      expect(validation.test(4)).toBeFalsy();
      expect(validation.test(6)).toBeFalsy();
      expect(validation.test(11)).toBeTruthy();

      expect(() => validation.check(4)).toThrow();
      expect(() => validation.check(6)).toThrow();
      expect(() => validation.check(11)).not.toThrow();
    });

    test("double negative", async () => {
      const validation = v8n()
        .not.not.number()
        .not.not.positive();

      expect(validation.test(1)).toBeTruthy();
      expect(() => validation.check(12)).not.toThrow();
      expect(validation.test("12")).toBeFalsy();
      expect(() => validation.check(-1)).toThrow();
      await expect(validation.testAsync(4)).resolves.toEqual(4);
      await expect(validation.testAsync(-4)).rejects.toBeDefined();
    });
  });
});

describe("rules", () => {
  test("equal", () => {
    const is = v8n().equal("123");
    expect(is.test("123")).toBeTruthy();
    expect(is.test(123)).toBeTruthy();
    expect(is.test("Hello")).toBeFalsy();

    const not = v8n().not.equal(123);
    expect(not.test("123")).toBeFalsy();
    expect(not.test(123)).toBeFalsy();
    expect(not.test("Hello")).toBeTruthy();
  });

  test("exact", () => {
    const is = v8n().exact("123");
    expect(is.test("123")).toBeTruthy();
    expect(is.test(123)).toBeFalsy();
    expect(is.test("Hello")).toBeFalsy();

    const not = v8n().not.exact(123);
    expect(not.test(123)).toBeFalsy();
    expect(not.test("123")).toBeTruthy();
    expect(not.test("Hello")).toBeTruthy();
  });

  test("pattern", () => {
    const validation = v8n().pattern(/^[a-z]+$/);
    expect(validation.test("a")).toBeTruthy();
    expect(validation.test("ab")).toBeTruthy();
    expect(validation.test(" ")).toBeFalsy();
    expect(validation.test("A")).toBeFalsy();
    expect(validation.test("Ab")).toBeFalsy();
  });

  test("string", () => {
    const validation = v8n().string();
    expect(validation.test("hello")).toBeTruthy();
    expect(validation.test("")).toBeTruthy();
    expect(validation.test(" ")).toBeTruthy();
    expect(validation.test(123)).toBeFalsy();
    expect(validation.test(true)).toBeFalsy();
    expect(validation.test(false)).toBeFalsy();
    expect(validation.test(undefined)).toBeFalsy();
    expect(validation.test()).toBeFalsy();
    expect(validation.test(null)).toBeFalsy();
  });

  test("undefined", () => {
    const is = v8n().undefined();
    expect(is.test()).toBeTruthy();
    expect(is.test(undefined)).toBeTruthy();
    expect(is.test(null)).toBeFalsy();
    expect(is.test("")).toBeFalsy();
    expect(is.test(0)).toBeFalsy();
    expect(is.test(false)).toBeFalsy();

    const not = v8n().not.undefined();
    expect(not.test()).toBeFalsy();
    expect(not.test(undefined)).toBeFalsy();
    expect(not.test(null)).toBeTruthy();
    expect(not.test("")).toBeTruthy();
    expect(not.test(0)).toBeTruthy();
    expect(not.test(false)).toBeTruthy();
  });

  test("null", () => {
    const is = v8n().null();
    expect(is.test(null)).toBeTruthy();
    expect(is.test()).toBeFalsy();
    expect(is.test(undefined)).toBeFalsy();
    expect(is.test("")).toBeFalsy();
    expect(is.test(0)).toBeFalsy();
    expect(is.test(false)).toBeFalsy();

    const not = v8n().not.null();
    expect(not.test(null)).toBeFalsy();
    expect(not.test()).toBeTruthy();
    expect(not.test(undefined)).toBeTruthy();
    expect(not.test("")).toBeTruthy();
    expect(not.test(0)).toBeTruthy();
    expect(not.test(false)).toBeTruthy();
  });

  test("array", () => {
    const validation = v8n().array();
    expect(validation.test([])).toBeTruthy();
    expect(validation.test([1, 2])).toBeTruthy();
    expect(validation.test(new Array())).toBeTruthy();
    expect(validation.test(null)).toBeFalsy();
    expect(validation.test(undefined)).toBeFalsy();
    expect(validation.test("string")).toBeFalsy();
  });

  test("number", () => {
    const validation = v8n().number();
    expect(validation.test(34)).toBeTruthy();
    expect(validation.test(-10)).toBeTruthy();
    expect(validation.test("1")).toBeFalsy();
    expect(validation.test(null)).toBeFalsy();
    expect(validation.test(undefined)).toBeFalsy();
  });

  test("boolean", () => {
    const validation = v8n().boolean();
    expect(validation.test(true)).toBeTruthy();
    expect(validation.test(false)).toBeTruthy();
    expect(validation.test(1)).toBeFalsy();
    expect(validation.test(0)).toBeFalsy();
    expect(validation.test(null)).toBeFalsy();
    expect(validation.test(undefined)).toBeFalsy();
  });

  test("lowercase", () => {
    const validation = v8n().lowercase();
    expect(validation.test("")).toBeFalsy();
    expect(validation.test(" ")).toBeFalsy();
    expect(validation.test("aBc")).toBeFalsy();
    expect(validation.test("abc")).toBeTruthy();
    expect(validation.test("abc def g")).toBeTruthy();
    expect(validation.test(true)).toBeTruthy();
    expect(validation.test(1)).toBeFalsy();
  });

  test("uppercase", () => {
    const validation = v8n().uppercase();
    expect(validation.test("")).toBeFalsy();
    expect(validation.test(" ")).toBeFalsy();
    expect(validation.test("A")).toBeTruthy();
    expect(validation.test("ABC")).toBeTruthy();
    expect(validation.test("ABC DEF G")).toBeTruthy();
    expect(validation.test("abc")).toBeFalsy();
    expect(validation.test("Abc")).toBeFalsy();
  });

  test("first", () => {
    const letter = v8n().first("n");
    expect(letter.test("n")).toBeTruthy();
    expect(letter.test("nice")).toBeTruthy();
    expect(letter.test(null)).toBeFalsy();
    expect(letter.test("N")).toBeFalsy();
    expect(letter.test("wrong")).toBeFalsy();
    expect(letter.test(undefined)).toBeFalsy();
    expect(letter.test(["n", "i", "c", "e"])).toBeTruthy();
    expect(letter.test(["a", "b", "c"])).toBeFalsy();

    const number = v8n().first(2);
    expect(number.test(20)).toBeFalsy();
    expect(number.test(12)).toBeFalsy();
    expect(number.test([2, 3])).toBeTruthy();
    expect(number.test([1, 2])).toBeFalsy();
  });

  test("last", () => {
    const letter = v8n().last("d");
    expect(letter.test("d")).toBeTruthy();
    expect(letter.test("old")).toBeTruthy();
    expect(letter.test(undefined)).toBeFalsy();
    expect(letter.test("D")).toBeFalsy();
    expect(letter.test("don't")).toBeFalsy();
    expect(letter.test(null)).toBeFalsy();

    const number = v8n().last(2);
    expect(number.test(32)).toBeFalsy();
    expect(number.test(23)).toBeFalsy();
    expect(number.test([3, 2])).toBeTruthy();
    expect(number.test([2, 3])).toBeFalsy();
  });

  test("vowel", () => {
    const validation = v8n().vowel();
    expect(validation.test("aeiou")).toBeTruthy();
    expect(validation.test("AEIOU")).toBeTruthy();
    expect(validation.test("abcde")).toBeFalsy();
    expect(validation.test("ABCDE")).toBeFalsy();
  });

  test("consonant", () => {
    const validation = v8n().consonant();
    expect(validation.test("abcde")).toBeFalsy();
    expect(validation.test("bcdf")).toBeTruthy();
    expect(validation.test("^")).toBeFalsy();
    expect(validation.test("ç")).toBeFalsy();
  });

  test("empty", () => {
    const validation = v8n().empty();
    expect(validation.test("")).toBeTruthy();
    expect(validation.test(" ")).toBeFalsy();
    expect(validation.test("ab")).toBeFalsy();
    expect(validation.test([])).toBeTruthy();
    expect(validation.test([, ,])).toBeFalsy();
    expect(validation.test([1, 2])).toBeFalsy();
  });

  test("length", () => {
    const minAndMax = v8n().length(3, 4);
    expect(minAndMax.test("ab")).toBeFalsy();
    expect(minAndMax.test("abc")).toBeTruthy();
    expect(minAndMax.test("abcd")).toBeTruthy();
    expect(minAndMax.test("abcde")).toBeFalsy();
    expect(minAndMax.test([1, 2])).toBeFalsy();
    expect(minAndMax.test([1, 2, 3])).toBeTruthy();
    expect(minAndMax.test([1, 2, 3, 4])).toBeTruthy();
    expect(minAndMax.test([1, 2, 3, 4, 5])).toBeFalsy();

    const exact = v8n().length(3);
    expect(exact.test("ab")).toBeFalsy();
    expect(exact.test("abc")).toBeTruthy();
    expect(exact.test("abcd")).toBeFalsy();
    expect(exact.test([1, 2])).toBeFalsy();
    expect(exact.test([1, 2, 3])).toBeTruthy();
    expect(exact.test([1, 2, 3, 4])).toBeFalsy();
  });

  test("minLength", () => {
    const validation = v8n().minLength(2);
    expect(validation.test("a")).toBeFalsy();
    expect(validation.test("ab")).toBeTruthy();
    expect(validation.test("abc")).toBeTruthy();
    expect(validation.test("abcd")).toBeTruthy();
  });

  test("maxLength", () => {
    const validation = v8n().maxLength(3);
    expect(validation.test("a")).toBeTruthy();
    expect(validation.test("ab")).toBeTruthy();
    expect(validation.test("abc")).toBeTruthy();
    expect(validation.test("abcd")).toBeFalsy();
  });

  test("negative", () => {
    const validation = v8n().negative();
    expect(validation.test(-1)).toBeTruthy();
    expect(validation.test(0)).toBeFalsy();
    expect(validation.test(1)).toBeFalsy();
  });

  test("positive", () => {
    const validation = v8n().positive();
    expect(validation.test(-1)).toBeFalsy();
    expect(validation.test(0)).toBeTruthy();
    expect(validation.test(1)).toBeTruthy();
  });

  test("lessThan", () => {
    const is = v8n().lessThan(3);
    expect(is.test(1)).toBeTruthy();
    expect(is.test(2)).toBeTruthy();
    expect(is.test(-4)).toBeTruthy();
    expect(is.test(3)).toBeFalsy();
    expect(is.test(4)).toBeFalsy();

    const not = v8n().not.lessThan(3);
    expect(not.test(1)).toBeFalsy();
    expect(not.test(2)).toBeFalsy();
    expect(not.test(-4)).toBeFalsy();
    expect(not.test(3)).toBeTruthy();
    expect(not.test(4)).toBeTruthy();
  });

  test("lessThanOrEqualTo", () => {
    const is = v8n().lessThanOrEqual(3);
    expect(is.test(-4)).toBeTruthy();
    expect(is.test(-3)).toBeTruthy();
    expect(is.test(1)).toBeTruthy();
    expect(is.test(2)).toBeTruthy();
    expect(is.test(3)).toBeTruthy();
    expect(is.test(4)).toBeFalsy();

    const not = v8n().not.lessThanOrEqual(3);
    expect(not.test(-4)).toBeFalsy();
    expect(not.test(-3)).toBeFalsy();
    expect(not.test(1)).toBeFalsy();
    expect(not.test(2)).toBeFalsy();
    expect(not.test(3)).toBeFalsy();
    expect(not.test(4)).toBeTruthy();
  });

  test("greaterThan", () => {
    const is = v8n().greaterThan(3);
    expect(is.test(2)).toBeFalsy();
    expect(is.test(-3)).toBeFalsy();
    expect(is.test(3)).toBeFalsy();
    expect(is.test(4)).toBeTruthy();

    const not = v8n().not.greaterThan(3);
    expect(not.test(2)).toBeTruthy();
    expect(not.test(-3)).toBeTruthy();
    expect(not.test(3)).toBeTruthy();
    expect(not.test(4)).toBeFalsy();
  });

  test("greaterThanOrEqual", () => {
    const is = v8n().greaterThanOrEqual(3);
    expect(is.test(2)).toBeFalsy();
    expect(is.test(-3)).toBeFalsy();
    expect(is.test(3)).toBeTruthy();
    expect(is.test(4)).toBeTruthy();

    const not = v8n().not.greaterThanOrEqual(3);
    expect(not.test(2)).toBeTruthy();
    expect(not.test(-3)).toBeTruthy();
    expect(not.test(3)).toBeFalsy();
    expect(not.test(4)).toBeFalsy();
  });

  test("range", () => {
    const is = v8n().range(2, 4);
    expect(is.test(1)).toBeFalsy();
    expect(is.test(5)).toBeFalsy();
    expect(is.test(2)).toBeTruthy();
    expect(is.test(3)).toBeTruthy();
    expect(is.test(4)).toBeTruthy();

    const not = v8n().not.range(2, 4);
    expect(not.test(1)).toBeTruthy();
    expect(not.test(5)).toBeTruthy();
    expect(not.test(2)).toBeFalsy();
    expect(not.test(3)).toBeFalsy();
    expect(not.test(4)).toBeFalsy();
  });

  test("even", () => {
    const validation = v8n().even();
    expect(validation.test(-2)).toBeTruthy();
    expect(validation.test(-1)).toBeFalsy();
    expect(validation.test(0)).toBeTruthy();
    expect(validation.test(1)).toBeFalsy();
    expect(validation.test(2)).toBeTruthy();
  });

  test("odd", () => {
    const validation = v8n().odd();
    expect(validation.test(-2)).toBeFalsy();
    expect(validation.test(-1)).toBeTruthy();
    expect(validation.test(0)).toBeFalsy();
    expect(validation.test(1)).toBeTruthy();
    expect(validation.test(2)).toBeFalsy();
  });

  test("between", () => {
    const is = v8n().between(3, 5);
    expect(is.test(2)).toBeFalsy();
    expect(is.test(3)).toBeTruthy();
    expect(is.test(4)).toBeTruthy();
    expect(is.test(5)).toBeTruthy();
    expect(is.test(6)).toBeFalsy();

    const not = v8n().not.between(3, 5);
    expect(not.test(2)).toBeTruthy();
    expect(not.test(3)).toBeFalsy();
    expect(not.test(4)).toBeFalsy();
    expect(not.test(5)).toBeFalsy();
    expect(not.test(6)).toBeTruthy();
  });

  test("includes", () => {
    const is = v8n().includes("2");
    expect(is.test(["1", "2", "3"])).toBeTruthy();
    expect(is.test(["1", "3"])).toBeFalsy();
    expect(is.test(["1", "2"])).toBeTruthy();
    expect(is.test("123")).toBeTruthy();
    expect(is.test("13")).toBeFalsy();
    expect(is.test([1, 2, 3])).toBeFalsy();
    expect(is.test(2)).toBeFalsy();

    const not = v8n().not.includes("2");
    expect(not.test(["1", "2", "3"])).toBeFalsy();
    expect(not.test(["1", "3"])).toBeTruthy();
    expect(not.test(["1", "2"])).toBeFalsy();
    expect(not.test("123")).toBeFalsy();
    expect(not.test("13")).toBeTruthy();
    expect(not.test([1, 2, 3])).toBeTruthy();
    expect(not.test(2)).toBeTruthy();
  });

  test("integer", () => {
    const is = v8n().integer();
    expect(is.test(0)).toBeTruthy();
    expect(is.test(12)).toBeTruthy();
    expect(is.test(99999999999)).toBeTruthy();
    expect(is.test(-100000)).toBeTruthy();
    expect(is.test("12")).toBeFalsy();
    expect(is.test(3.14)).toBeFalsy();
    expect(is.test(NaN)).toBeFalsy();
    expect(is.test(Infinity)).toBeFalsy();

    const not = v8n().not.integer();
    expect(not.test(0)).toBeFalsy();
    expect(not.test(12)).toBeFalsy();
    expect(not.test(99999999999)).toBeFalsy();
    expect(not.test(-100000)).toBeFalsy();
    expect(not.test("12")).toBeTruthy();
    expect(not.test(3.14)).toBeTruthy();
    expect(not.test(NaN)).toBeTruthy();
    expect(not.test(Infinity)).toBeTruthy();
  });

  test("schema", () => {
    const is = v8n().schema({
      one: v8n()
        .string()
        .minLength(3),
      two: v8n()
        .number()
        .between(5, 10)
    });

    expect(is.test({ one: "Hello", two: 8 })).toBeTruthy();
    expect(is.test({ one: "Hi", two: 8 })).toBeFalsy();
    expect(is.test({ one: "Hello", two: 12 })).toBeFalsy();
    expect(is.test({ one: 1, two: "Two" })).toBeFalsy();
    expect(is.test({ one: "Hello" })).toBeFalsy();
    expect(is.test({ two: 8 })).toBeFalsy();
    expect(is.test({})).toBeFalsy();
    expect(() => is.test({ one: "Hello", two: 8 })).not.toThrow();
    expect(() => is.check({ one: "Hello", two: 12 })).toThrow();

    try {
      is.check({ one: "Hi", two: 12 });
    } catch (ex) {
      expect(ex).toMatchObject({
        cause: [
          { target: "one", value: "Hi", rule: { name: "minLength" } },
          { target: "two", value: 12, rule: { name: "between" } }
        ]
      });
    }

    const not = v8n().not.schema({
      one: v8n()
        .string()
        .minLength(3),
      two: v8n()
        .number()
        .between(5, 10)
    });

    expect(not.test({ one: "Hello", two: 8 })).toBeFalsy();
    expect(not.test({ one: "Hi", two: 8 })).toBeTruthy();
    expect(not.test({ one: "Hello", two: 12 })).toBeTruthy();
    expect(not.test({ one: 1, two: "Two" })).toBeTruthy();
    expect(not.test({ one: "Hello" })).toBeTruthy();
    expect(not.test({ two: 8 })).toBeTruthy();
    expect(not.test({})).toBeTruthy();
  });
});

describe("custom rules", () => {
  beforeEach(() => {
    // Reset custom rules
    v8n.customRules = {};
  });

  it("should be chainable", () => {
    v8n.extend({
      newRule: () => value => true
    });

    const validation = v8n()
      .string()
      .newRule()
      .lowercase();

    expect(debugRules(validation)).toEqual([
      "string()",
      "newRule()",
      "lowercase()"
    ]);
  });

  it("should be used in validation", () => {
    v8n.extend({
      or: (a, b) => value => value === a || value === b
    });

    const validation = v8n()
      .string()
      .or("one", "two");

    expect(validation.test("one")).toBeTruthy();
    expect(validation.test("two")).toBeTruthy();
    expect(validation.test("three")).toBeFalsy();
  });

  it("should be inverted by 'not' modifier", () => {
    v8n.extend({
      exact: it => value => value === it
    });

    const validation = v8n()
      .string()
      .not.exact("hello");

    expect(validation.test("hi")).toBeTruthy();
    expect(validation.test("nice")).toBeTruthy();
    expect(validation.test("hello")).toBeFalsy();
  });

  test("extend should be able to call multiple times", () => {
    v8n.extend({
      one: () => value => true
    });

    v8n.extend({
      two: () => value => true
    });

    const validation = v8n()
      .one()
      .two();

    expect(debugRules(validation)).toEqual(["one()", "two()"]);
  });
});

describe("random tests", () => {
  test("random test 1", () => {
    const validation = v8n()
      .number()
      .even()
      .positive();

    expect(validation.test(-2)).toBeFalsy();
    expect(validation.test(-1)).toBeFalsy();
    expect(validation.test(0)).toBeTruthy();
    expect(validation.test(1)).toBeFalsy();
    expect(validation.test(2)).toBeTruthy();
  });

  test("random test 2", () => {
    const validation = v8n()
      .string()
      .minLength(2)
      .maxLength(5)
      .lowercase()
      .first("b")
      .last("o");

    expect(validation.test("bruno")).toBeTruthy();
    expect(validation.test("bruna")).toBeFalsy();
    expect(validation.test("druno")).toBeFalsy();
    expect(validation.test("Bruno")).toBeFalsy();
    expect(validation.test("Bruno")).toBeFalsy();
    expect(validation.test("brunno")).toBeFalsy();
  });

  test("random test 3", () => {
    const validation = v8n()
      .array()
      .minLength(3)
      .maxLength(4)
      .first(2)
      .last("o");

    expect(validation.test([2, "tree", "four", "lo"])).toBeFalsy();
    expect(validation.test([2, "tree", "four", "o"])).toBeTruthy();
    expect(validation.test([2, "tree", "four", "five", "o"])).toBeFalsy();
    expect(validation.test([2, "o"])).toBeFalsy();
    expect(validation.test("234o")).toBeFalsy();
  });

  test("random test 4", () => {
    const validation = v8n()
      .between(10, 20)
      .not.between(12, 14)
      .not.between(16, 18);

    expect(validation.test(9)).toBeFalsy();
    expect(validation.test(10)).toBeTruthy();
    expect(validation.test(11)).toBeTruthy();
    expect(validation.test(12)).toBeFalsy();
    expect(validation.test(13)).toBeFalsy();
    expect(validation.test(14)).toBeFalsy();
    expect(validation.test(15)).toBeTruthy();
    expect(validation.test(16)).toBeFalsy();
    expect(validation.test(17)).toBeFalsy();
    expect(validation.test(18)).toBeFalsy();
    expect(validation.test(19)).toBeTruthy();
    expect(validation.test(20)).toBeTruthy();
    expect(validation.test(21)).toBeFalsy();
  });

  test("random test 5", () => {
    const validation = v8n()
      .number()
      .not.maxLength(5) // Have no max length
      .not.minLength(3); // Have no min length

    expect(validation.test(2)).toBeTruthy();
    expect(validation.test(3)).toBeTruthy();
    expect(validation.test(4)).toBeTruthy();
    expect(validation.test(5)).toBeTruthy();
    expect(validation.test(6)).toBeTruthy();
  });

  test("random test 6", () => {
    const validation = v8n()
      .not.number()
      .not.string();

    expect(validation.test(1)).toBeFalsy();
    expect(validation.test("hello")).toBeFalsy();
    expect(validation.test(undefined)).toBeTruthy();
    expect(validation.test(null)).toBeTruthy();
    expect(validation.test(true)).toBeTruthy();
    expect(validation.test(false)).toBeTruthy();
    expect(validation.test({})).toBeTruthy();
    expect(validation.test([])).toBeTruthy();
    expect(validation.test(Symbol())).toBeTruthy();
  });

  test("random test 7", () => {
    const validation = v8n()
      .array()
      .not.empty()
      .minLength(3)
      .not.includes("a")
      .not.includes("b");

    expect(validation.test(["a", "b", "d"])).toBeFalsy();
    expect(validation.test(["a", "c", "d"])).toBeFalsy();
    expect(validation.test([])).toBeFalsy();
    expect(validation.test(["d", "e"])).toBeFalsy();
    expect(validation.test(["d", "e", "f"])).toBeTruthy();
  });

  test("random test 8", () => {
    const validation = v8n()
      .not.null()
      .between(10, 20)
      .not.equal(15);

    expect(validation.test(9)).toBeFalsy();
    expect(validation.test(21)).toBeFalsy();
    expect(validation.test(15)).toBeFalsy();
    expect(validation.test(10)).toBeTruthy();
    expect(validation.test(12)).toBeTruthy();
    expect(validation.test(17)).toBeTruthy();
    expect(validation.test(20)).toBeTruthy();
  });

  test("random test 9", async () => {
    v8n.extend({
      asyncRule(min, max, delay = 50) {
        return value =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve(value >= min && value <= max);
            }, delay);
          });
      }
    });

    const validation = v8n()
      .number()
      .asyncRule(10, 20)
      .not.even();

    await expect(validation.testAsync("12")).rejects.toBeDefined();
    await expect(validation.testAsync(12)).rejects.toBeDefined();
    await expect(validation.testAsync(10)).rejects.toBeDefined();
    await expect(validation.testAsync(20)).rejects.toBeDefined();
    await expect(validation.testAsync(13)).resolves.toBe(13);
  });
});

function debugRules(validation) {
  return validation.chain.map(ruleId);
}

function ruleId({ name, args }) {
  return `${name}(${args.map(parseArg).join(", ")})`;
}

function parseArg(arg) {
  return typeof arg === "string" ? `"${arg}"` : `${arg}`;
}
