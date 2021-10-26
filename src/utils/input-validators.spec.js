import sut from './input-validators.js';

describe.only('input-validators', () => {

  describe('isValidPassword', () => {
    let result;

    const testCases = [
      { password: null, minLength: 4, expectedResult: false },
      { password: 'abc', minLength: 4, expectedResult: false },
      { password: 'abcd', minLength: 4, expectedResult: false },
      { password: '1234', minLength: 4, expectedResult: false },
      { password: 'abc1', expectedResult: false },
      { password: 'abc1', minLength: 4, expectedResult: true },
      { password: 'abc1d', minLength: 4, expectedResult: true },
      { password: 'a__1', minLength: 4, expectedResult: true },
      { password: '!!ä1', minLength: 4, expectedResult: false },
      { password: 'abcd123', expectedResult: false },
      { password: 'abcd1234', expectedResult: true }
    ];

    testCases.forEach(({ password, minLength, expectedResult }) => {
      describe(`with password='${password}' and minLength=${minLength}`, () => {
        beforeEach(() => {
          result = sut.isValidPassword({ password, minLength });
        });
        it(`should return ${expectedResult}`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('isValidTag', () => {
    let result;

    const testCases = [
      { tag: null, expectedResult: false },
      { tag: 'ta', expectedResult: false },
      { tag: 'tag', expectedResult: true },
      { tag: ' tag ', expectedResult: true },
      { tag: 't a g', expectedResult: false },
      { tag: 't\tag', expectedResult: false },
      { tag: '  ', expectedResult: false },
      { tag: 'tag2', allTags: ['tag1', 'tag2'], expectedResult: true },
      { tag: 'tag2', allTags: ['tag1', 'tag2', 'tag2'], expectedResult: false },
      { tag: 'aPrettyLongTagToConsiderValid?', expectedResult: true },
      { tag: 'anEvenLongerTagToConsiderValid?', expectedResult: false }
    ];

    testCases.forEach(({ tag, allTags, expectedResult }) => {
      describe(`when validating tag='${tag}'`, () => {
        beforeEach(() => {
          result = sut.isValidTag({ tag, allTags });
        });
        it(`should return ${expectedResult}`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

});
