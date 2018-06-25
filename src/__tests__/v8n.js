import v8n, { CheckException } from "../v8n";

describe("rules chain", () => {
  const validation = v8n()
    .string()
    .lowercase()
    .first("a")
    .last("e")
    .length(3, 5);

  it("should chain rules", () => {
    expect(validation.rulesIds()).toEqual([
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

describe("rules", () => {
  test("string", () => {
    const validation = v8n().string();
    expect(validation.test(123)).toBeFalsy();
    expect(validation.test(true)).toBeFalsy();
    expect(validation.test(false)).toBeFalsy();
    expect(validation.test(undefined)).toBeFalsy();
    expect(validation.test()).toBeFalsy();
    expect(validation.test(null)).toBeFalsy();
  });

  test("lowercase", () => {
    const validation = v8n().lowercase();
    expect(validation.test("aBc")).toBeFalsy();
    expect(validation.test("abc")).toBeTruthy();
    expect(validation.test(true)).toBeTruthy();
    expect(validation.test(1)).toBeFalsy();
  });

  test("first", () => {
    const letter = v8n().first("n");
    expect(letter.test("n")).toBeTruthy();
    expect(letter.test("nice")).toBeTruthy();
    expect(letter.test(null)).toBeTruthy();
    expect(letter.test("N")).toBeFalsy();
    expect(letter.test("wrong")).toBeFalsy();
    expect(letter.test(undefined)).toBeFalsy();
    expect(letter.test(["n", "i", "c", "e"])).toBeTruthy();
    expect(letter.test(["a", "b", "c"])).toBeFalsy();

    const number = v8n().first(2);
    expect(number.test(20)).toBeTruthy();
    expect(number.test(12)).toBeFalsy();
    expect(number.test([2, 3])).toBeTruthy();
    expect(number.test([1, 2])).toBeFalsy();
  });

  test("last", () => {
    const validation = v8n().last("d");
    expect(validation.test("d")).toBeTruthy();
    expect(validation.test("old")).toBeTruthy();
    expect(validation.test(undefined)).toBeTruthy();
    expect(validation.test("D")).toBeFalsy();
    expect(validation.test("don't")).toBeFalsy();
    expect(validation.test(null)).toBeFalsy();
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

  test("type", () => {
    expect(
      v8n()
        .type("number")
        .test(1)
    ).toBeTruthy();

    expect(
      v8n()
        .type("object")
        .test([])
    ).toBeTruthy();

    expect(
      v8n()
        .type("boolean")
        .test("hey")
    ).toBeFalsy();
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
    expect(validation.rulesIds()).toEqual([
      "string()",
      'myCustomRule("abc", "cba")',
      "lowercase()"
    ]);
  });

  it("should be use in validation", () => {
    expect(validation.test("hello")).toBeFalsy();
  });
});
