// Mock expo-crypto before importing password utils
jest.mock('expo-crypto', () => {
  const crypto = require('crypto');
  return {
    getRandomValues: (buffer: Uint8Array) => {
      const randomBuffer = crypto.randomBytes(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = randomBuffer[i];
      }
      return buffer;
    }
  };
});

import { generateSecurePassword } from '../../../utils/password';

describe('password utils', () => {
  it('should generate secure passwords using a cryptographically secure random number generator instead of Math.random', () => {
    // Math.random has been mocked to 0.5 below to test what happens if Math.random is used
    const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const pw1 = generateSecurePassword(16);
    mathRandomSpy.mockRestore();

    expect(pw1.length).toBe(16);
    // if math.random was used, the string will be completely deterministic
    const mathRandomSpy2 = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const pw2 = generateSecurePassword(16);
    mathRandomSpy2.mockRestore();

    // We expect the function to NOT use Math.random, so the passwords shouldn't be identical
    expect(pw1).not.toBe(pw2);
  });

  it('should throw an error if password length is less than 4', () => {
    expect(() => generateSecurePassword(3)).toThrow('Password length must be between 4 and 256');
  });

  it('should throw an error if password length is greater than 256', () => {
    expect(() => generateSecurePassword(257)).toThrow('Password length must be between 4 and 256');
  });
});
