import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const isAllowedPhotoUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export interface CreateJobPhotoInput {
  jobId: string;
  mechanicId: string;
  photoUrl: string;
  description?: string;
}

export async function createJobPhotoRecord(input: CreateJobPhotoInput) {
  if (!isAllowedPhotoUrl(input.photoUrl)) {
    throw new Error('Photo URL must be an http or https URL');
  }

  return prisma.jobPhoto.create({
    data: {
      jobId: input.jobId,
      mechanicId: input.mechanicId,
      url: input.photoUrl,
      description: input.description,
    },
  });
}

export async function getJobPhotos(jobId: string) {
  return prisma.jobPhoto.findMany({
    where: { jobId },
    orderBy: { timestamp: 'desc' },
  });
}

export async function deleteJobPhoto(photoId: string, actorId: string, actorRole: UserRole) {
  const photo = await prisma.jobPhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      mechanicId: true,
    },
  });

  if (!photo) {
    throw new Error('Photo not found');
  }

  if (actorRole !== UserRole.ADMIN && photo.mechanicId !== actorId) {
    throw new Error('You do not have permission to delete this photo');
  }

  await prisma.jobPhoto.delete({
    where: { id: photoId },
  });

  return { success: true };
}
