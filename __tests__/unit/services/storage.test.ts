const mockPrisma = {
  jobPhoto: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { UserRole } from '@prisma/client';
import { deletePhoto, uploadPhoto } from '@/backend/services/storage';

describe('storage service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploadPhoto returns the stored photo record with a URL', async () => {
    mockPrisma.jobPhoto.create.mockResolvedValue({
      id: 'photo-1',
      url: 'https://storage.example.com/job-1/after.jpg',
      jobId: 'job-1',
      mechanicId: 'mechanic-1',
    });

    const result = await uploadPhoto({
      jobId: 'job-1',
      mechanicId: 'mechanic-1',
      photoUrl: 'https://storage.example.com/job-1/after.jpg',
      description: 'after',
    });

    expect(result.url).toBe('https://storage.example.com/job-1/after.jpg');
    expect(mockPrisma.jobPhoto.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-1',
        mechanicId: 'mechanic-1',
        url: 'https://storage.example.com/job-1/after.jpg',
        description: 'after',
      },
    });
  });

  it('deletePhoto removes the stored reference', async () => {
    mockPrisma.jobPhoto.findUnique.mockResolvedValue({
      id: 'photo-1',
      mechanicId: 'mechanic-1',
    });
    mockPrisma.jobPhoto.delete.mockResolvedValue({ id: 'photo-1' });

    const result = await deletePhoto('photo-1', 'mechanic-1', UserRole.MECHANIC);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.jobPhoto.delete).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
    });
  });
});
