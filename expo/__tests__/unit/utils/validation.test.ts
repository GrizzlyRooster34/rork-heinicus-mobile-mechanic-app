import { validateVIN } from '../../../utils/validation';

describe('validateVIN', () => {
  it('should return invalid for an empty string, null, or undefined', () => {
    expect(validateVIN('')).toEqual({ isValid: false, errors: ['VIN is required'] });
    expect(validateVIN('   ')).toEqual({ isValid: false, errors: ['VIN is required'] });
    // @ts-ignore - testing runtime behavior with invalid inputs
    expect(validateVIN(null)).toEqual({ isValid: false, errors: ['VIN is required'] });
    // @ts-ignore - testing runtime behavior with invalid inputs
    expect(validateVIN(undefined)).toEqual({ isValid: false, errors: ['VIN is required'] });
  });

  it('should return invalid if VIN is not exactly 17 characters long', () => {
    // Too short
    expect(validateVIN('1HGBH41JXMN10918')).toEqual({
      isValid: false,
      errors: ['VIN must be exactly 17 characters long'],
    });

    // Too long
    expect(validateVIN('1HGBH41JXMN1091861')).toEqual({
      isValid: false,
      errors: ['VIN must be exactly 17 characters long'],
    });
  });

  it('should return invalid if VIN contains letters I, O, or Q', () => {
    // Contains 'I'
    expect(validateVIN('1HGBH41JXMN10918I')).toEqual({
      isValid: false,
      errors: [
        'VIN cannot contain letters I, O, or Q',
        'VIN can only contain letters and numbers (excluding I, O, Q)'
      ],
    });

    // Contains 'O'
    expect(validateVIN('1HGBH41JXMN10918O')).toEqual({
      isValid: false,
      errors: [
        'VIN cannot contain letters I, O, or Q',
        'VIN can only contain letters and numbers (excluding I, O, Q)'
      ],
    });

    // Contains 'Q'
    expect(validateVIN('1HGBH41JXMN10918Q')).toEqual({
      isValid: false,
      errors: [
        'VIN cannot contain letters I, O, or Q',
        'VIN can only contain letters and numbers (excluding I, O, Q)'
      ],
    });

    // Lowercase should be caught too as function converts to uppercase
    expect(validateVIN('1hgbh41jxmn10918i')).toEqual({
      isValid: false,
      errors: [
        'VIN cannot contain letters I, O, or Q',
        'VIN can only contain letters and numbers (excluding I, O, Q)'
      ],
    });
  });

  it('should return invalid if VIN contains invalid characters (non-alphanumeric)', () => {
    expect(validateVIN('1HGBH41JXMN10918!')).toEqual({
      isValid: false,
      errors: ['VIN can only contain letters and numbers (excluding I, O, Q)'],
    });

    expect(validateVIN('1HGBH41JX-MN10918')).toEqual({
      isValid: false,
      errors: ['VIN can only contain letters and numbers (excluding I, O, Q)'],
    });

    expect(validateVIN('1HGBH41JX MN10918')).toEqual({
      isValid: false,
      errors: ['VIN can only contain letters and numbers (excluding I, O, Q)'],
    });
  });

  it('should handle multiple errors at once', () => {
    expect(validateVIN('1HGBH41JXMN10918!I')).toEqual({
      isValid: false,
      errors: [
        'VIN must be exactly 17 characters long',
        'VIN cannot contain letters I, O, or Q',
        'VIN can only contain letters and numbers (excluding I, O, Q)'
      ],
    });
  });

  it('should return valid for a correct VIN', () => {
    // Valid 17-character VIN with no I, O, Q, or symbols
    expect(validateVIN('1HGBH41JXMN109186')).toEqual({
      isValid: true,
      errors: [],
    });

    // Valid VIN, should trim and uppercase
    expect(validateVIN('  1hgbh41jxmn109186  ')).toEqual({
      isValid: true,
      errors: [],
    });
  });
});
