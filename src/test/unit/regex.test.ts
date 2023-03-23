import { expect } from 'chai';
import { defaultBranchRegEx } from '../../utils';

describe('defaultBranchRegEx', () => {
  const testCases = [
    { input: 'feature/EN-11520-feature-name', expected: 'EN-11520' },
    { input: 'feature/LA-11520feature-name', expected: 'LA-11520' },
    { input: 'feature/SI-11520_feature-name', expected: 'SI-11520' },
    { input: 'feature/en-11520890feature-name', expected: 'en-11520890' },
    { input: 'feature/PDDO014-11520890feature-name', expected: 'PDDO014-11520890' },
    { input: 'hotfix/CD-11520890feature_name15145', expected: 'CD-11520890' },
    { input: 'notgitflow/CD-11520890feature-name', expected: null },
    { input: 'feature/AB-12345-some-feature', expected: 'AB-12345' },
    { input: 'hotfix/XYZ-98765-hotfix-description', expected: 'XYZ-98765' },
    { input: 'release/R1-11111-release-name', expected: 'R1-11111' },
    { input: 'custom/CUST-22222-custom-branch', expected: 'CUST-22222' },
    { input: 'bugfix/BF-33333-fixing-bug', expected: 'BF-33333' },
    { input: 'feature/LL-1155660_logic-part-2', expected: 'LL-1155660' },
    { input: 'feature/EN-11111/test', expected: 'EN-11111' },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should ${expected ? 'match' : 'not match'} for '${input}'`, () => {
      const match = input.match(defaultBranchRegEx);
      if (expected) {
        expect(match).not.to.be.null;
        expect(match![1]).to.equal(expected);
      } else {
        expect(match).to.be.null;
      }
    });
  });
});