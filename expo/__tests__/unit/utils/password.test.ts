import { generateSecurePassword } from '../../../utils/password';

describe('generateSecurePassword', () => {
  it('generates a password of default length 16', () => {
    const pwd = generateSecurePassword();
    expect(pwd.length).toBe(16);
  });

  it('generates a password with expected character types', () => {
    const pwd = generateSecurePassword();
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/\d/.test(pwd)).toBe(true);
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pwd)).toBe(true);
  });

  it('generates unique passwords', () => {
    const pwd1 = generateSecurePassword();
    const pwd2 = generateSecurePassword();
    expect(pwd1).not.toBe(pwd2);
  });
});
