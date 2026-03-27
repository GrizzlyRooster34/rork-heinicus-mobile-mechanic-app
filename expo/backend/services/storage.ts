import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../../lib/prisma';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export interface PhotoUploadData {
  jobId: string;
  uploaderId: string;
  base64Data: string;
  type?: 'BEFORE' | 'AFTER' | 'DIAGNOSTIC' | 'PARTS' | 'GENERAL';
  description?: string;
}

export async function uploadPhoto(data: PhotoUploadData) {
  try {
    const { jobId, uploaderId, base64Data, type = 'GENERAL', description } = data;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `heinicus/jobs/${jobId}`,
      resource_type: 'image',
    });

    // Create database record
    const photo = await prisma.jobPhoto.create({
      data: {
        jobId,
        uploaderId,
        url: result.secure_url,
        thumbnailUrl: result.secure_url.replace('/upload/', '/upload/w_200,h_200,c_fill/'),
        type,
        description,
        fileSize: result.bytes,
        mimeType: `image/${result.format}`,
      },
    });

    return { success: true, photo };
  } catch (error) {
    console.error('Photo upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

export async function getJobPhotos(jobId: string) {
  const photos = await prisma.jobPhoto.findMany({
    where: { jobId },
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return photos;
}

export async function deletePhoto(photoId: string, userId: string) {
  try {
    const photo = await prisma.jobPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.uploaderId !== userId) return { success: false };

    await prisma.jobPhoto.delete({ where: { id: photoId } });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
