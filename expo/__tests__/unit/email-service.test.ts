import { sendEmail } from '../../backend/services/email';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('Email Service', () => {
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.EMAIL_FROM_ADDRESS = 'from@test.com';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send an email successfully', async () => {
    const result = await sendEmail('to@test.com', 'Subject', '<p>Hello</p>');

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'from@test.com',
      to: 'to@test.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
    });
  });

  it('should return false if sending fails', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Send failed'));

    const result = await sendEmail('to@test.com', 'Subject', '<p>Hello</p>');

    expect(result).toBe(false);
  });
});
