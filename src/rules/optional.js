const consideredEmpty = (value, considerTrimmedEmptyString) => {
  if (
    considerTrimmedEmptyString &&
    typeof value === 'string' &&
    value.trim().length === 0
  ) {
    return true;
  }

  return value === undefined || value === null;
};

export default (validation, considerTrimmedEmptyString = false) => ({
  simple: value =>
    consideredEmpty(value, considerTrimmedEmptyString) ||
    validation.check(value) === undefined,
  async: value =>
    consideredEmpty(value, considerTrimmedEmptyString) ||
    validation.testAsync(value),
});
