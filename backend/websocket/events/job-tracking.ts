import { JobStatus, UserRole } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { prisma } from '../../../lib/prisma';
import { updateJobETA, validateCoordinates } from '../../services/location';

const isAuthorizedForJob = async (jobId: string, userId: string, role: UserRole) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
      select: {
        id: true,
        customerId: true,
        mechanicId: true,
        status: true,
        timeStarted: true,
      },
    });

  if (!job) {
    return { ok: false as const, error: 'Job not found', code: 'JOB_NOT_FOUND' };
  }

  const isAuthorized =
    job.customerId === userId || job.mechanicId === userId || role === UserRole.ADMIN;

  if (!isAuthorized) {
    return { ok: false as const, error: 'Not authorized for this job', code: 'UNAUTHORIZED' };
  }

  return { ok: true as const, job };
};

const isValidJobStatus = (status: string): status is JobStatus =>
  Object.values(JobStatus).includes(status as JobStatus);

export function registerJobTrackingEvents(io: Server, socket: Socket) {
  const user = socket.data.user as { userId: string; email: string; role: UserRole };

  socket.on('job:join', async (data: { jobId: string }) => {
    const result = await isAuthorizedForJob(data.jobId, user.userId, user.role);
    if (!result.ok) {
      socket.emit('error', { message: result.error, code: result.code });
      return;
    }

    const roomName = `job-${data.jobId}`;
    await socket.join(roomName);

    socket.emit('job:joined', {
      jobId: data.jobId,
      timestamp: new Date().toISOString(),
    });

    socket.to(roomName).emit('job:user-joined', {
      userId: user.userId,
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('job:leave', async (data: { jobId: string }) => {
    const roomName = `job-${data.jobId}`;
    await socket.leave(roomName);
    socket.to(roomName).emit('job:user-left', {
      userId: user.userId,
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('job:update-status', async (data: { jobId: string; status: string; notes?: string }) => {
    const result = await isAuthorizedForJob(data.jobId, user.userId, user.role);
    if (!result.ok) {
      socket.emit('error', { message: result.error, code: result.code });
      return;
    }

    if (result.job.mechanicId !== user.userId && user.role !== UserRole.ADMIN) {
      socket.emit('error', { message: 'Only the assigned mechanic can update status', code: 'UNAUTHORIZED' });
      return;
    }

    if (!isValidJobStatus(data.status)) {
      socket.emit('error', { message: 'Invalid job status', code: 'INVALID_STATUS' });
      return;
    }

    const updatedJob = await prisma.job.update({
      where: { id: data.jobId },
      data: {
        status: data.status,
        ...(data.status === JobStatus.IN_PROGRESS && !result.job.timeStarted
          ? { timeStarted: new Date() }
          : {}),
        ...(data.status === JobStatus.COMPLETED ? { timeEnded: new Date() } : {}),
        activityLog: {
          create: {
            mechanicId: user.userId,
            activity: `Status changed to ${data.status}`,
            notes: data.notes,
          },
        },
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        mechanic: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    io.to(`job-${data.jobId}`).emit('job:status-updated', {
      jobId: data.jobId,
      status: data.status,
      notes: data.notes,
      job: updatedJob,
      updatedBy: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    });
  });

  socket.on(
    'job:update-location',
    async (data: { jobId: string; latitude: number; longitude: number; eta?: number }) => {
      const result = await isAuthorizedForJob(data.jobId, user.userId, user.role);
      if (!result.ok) {
        socket.emit('error', { message: result.error, code: result.code });
        return;
      }

      if (result.job.mechanicId !== user.userId) {
        socket.emit('error', {
          message: 'Only the assigned mechanic can update location',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      if (!validateCoordinates({ latitude: data.latitude, longitude: data.longitude })) {
        socket.emit('error', { message: 'Invalid coordinates', code: 'INVALID_COORDINATES' });
        return;
      }

      if (
        result.job.status !== JobStatus.ACCEPTED &&
        result.job.status !== JobStatus.IN_PROGRESS
      ) {
        socket.emit('error', {
          message: 'Can only update location for active jobs',
          code: 'INVALID_STATUS',
        });
        return;
      }

      const eta = await updateJobETA(
        data.jobId,
        { latitude: data.latitude, longitude: data.longitude },
        data.eta
      );

      io.to(`job-${data.jobId}`).emit('job:location-updated', {
        jobId: data.jobId,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        eta,
        mechanicId: user.userId,
        timestamp: new Date().toISOString(),
      });
    }
  );

  socket.on('job:update-eta', async (data: { jobId: string; etaMinutes: number }) => {
    const result = await isAuthorizedForJob(data.jobId, user.userId, user.role);
    if (!result.ok) {
      socket.emit('error', { message: result.error, code: result.code });
      return;
    }

    if (result.job.mechanicId !== user.userId && user.role !== UserRole.ADMIN) {
      socket.emit('error', { message: 'Only the assigned mechanic can update ETA', code: 'UNAUTHORIZED' });
      return;
    }

    const eta = new Date(Date.now() + data.etaMinutes * 60 * 1000);
    await prisma.job.update({
      where: { id: data.jobId },
      data: { eta },
    });

    io.to(`job-${data.jobId}`).emit('job:eta-updated', {
      jobId: data.jobId,
      eta,
      etaMinutes: data.etaMinutes,
      updatedBy: {
        userId: user.userId,
        email: user.email,
      },
      timestamp: new Date().toISOString(),
    });
  });
}
