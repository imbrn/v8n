import v8n from "./v8n";

describe("rules chain", () => {
  const validation = v8n()
    .string()
    .lowercase()
    .first("a")
    .last("e")
    .length(3, 5);

  it("should chain rules", () => {
    expect(debugRules(validation)).toEqual([
      "string()",
      "lowercase()",
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
});

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
});

describe("rules", () => {
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

  test("boolean", () => {
    const validation = v8n().boolean();
    expect(validation.test(true)).toBeTruthy();
    expect(validation.test(false)).toBeTruthy();
    expect(validation.test(1)).toBeFalsy();
    expect(validation.test(0)).toBeFalsy();
    expect(validation.test(null)).toBeFalsy();
    expect(validation.test(undefined)).toBeFalsy();
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

  test("between", () => {
    const number = v8n().between(3, 5);
    expect(number.test(2)).toBeFalsy();
    expect(number.test(3)).toBeTruthy();
    expect(number.test(4)).toBeTruthy();
    expect(number.test(5)).toBeTruthy();
    expect(number.test(6)).toBeFalsy();

    const text = v8n().between("b", "d");
    expect(text.test("a")).toBeFalsy();
    expect(text.test("b")).toBeTruthy();
    expect(text.test("c")).toBeTruthy();
    expect(text.test("d")).toBeTruthy();
    expect(text.test("e")).toBeFalsy();
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
});

describe("custom rules", () => {
  // Defines the custom rule
  v8n.customRules.myCustomRule = function myCustomRule(a, b) {
    return value => {
      return value === a || value === b;
    };
  };

  const validation = v8n()
    .string()
    .myCustomRule("abc", "cba")
    .lowercase();

  it("should be chainable", () => {
    expect(debugRules(validation)).toEqual([
      "string()",
      'myCustomRule("abc", "cba")',
      "lowercase()"
    ]);
  });

  it("should be use in validation", () => {
    expect(validation.test("hello")).toBeFalsy();
    expect(validation.test("cba")).toBeTruthy();
  });

  it("should be inverted by 'not' modifier", () => {
    const validation = v8n().not.myCustomRule("abc", "cba");
    expect(validation.test("abc")).toBeFalsy();
    expect(validation.test("cba")).toBeFalsy();
    expect(validation.test("hello")).toBeTruthy();
    expect(validation.test(123)).toBeTruthy();
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
