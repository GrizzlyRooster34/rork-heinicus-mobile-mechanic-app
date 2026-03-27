import { Server, Socket } from 'socket.io';
import { prisma } from '../../../lib/prisma';

/**
 * Job Tracking Event Handlers
 *
 * Handles real-time job updates:
 * - Job status changes
 * - Mechanic location updates
 * - ETA updates
 * - Job start/completion
 */

export function registerJobTrackingEvents(io: Server, socket: Socket) {
  const user = socket.data.user;

  /**
   * Join a job room
   * Allows users to receive real-time updates for a specific job
   */
  socket.on('job:join', async (data: { jobId: string }) => {
    try {
      const { jobId } = data;

      // Verify user has access to this job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          customerId: true,
          mechanicId: true,
        },
      });

      if (!job) {
        socket.emit('error', { message: 'Job not found', code: 'JOB_NOT_FOUND' });
        return;
      }

      // Check if user is authorized (customer or assigned mechanic)
      const isAuthorized =
        job.customerId === user.userId ||
        job.mechanicId === user.userId ||
        user.role === 'ADMIN';

      if (!isAuthorized) {
        socket.emit('error', { message: 'Not authorized to join this job', code: 'UNAUTHORIZED' });
        return;
      }

      // Join the job room
      const roomName = `job-${jobId}`;
      await socket.join(roomName);

      console.log(`WebSocket: ${user.email} joined room ${roomName}`);

      socket.emit('job:joined', {
        jobId,
        message: 'Successfully joined job room',
        timestamp: new Date().toISOString(),
      });

      // Notify others in the room
      socket.to(roomName).emit('job:user-joined', {
        userId: user.userId,
        role: user.role,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error joining job room:', error);
      socket.emit('error', { message: 'Failed to join job room', code: 'JOIN_ERROR' });
    }
  });

  /**
   * Leave a job room
   */
  socket.on('job:leave', async (data: { jobId: string }) => {
    try {
      const { jobId } = data;
      const roomName = `job-${jobId}`;

      await socket.leave(roomName);

      console.log(`WebSocket: ${user.email} left room ${roomName}`);

      socket.emit('job:left', {
        jobId,
        message: 'Successfully left job room',
        timestamp: new Date().toISOString(),
      });

      // Notify others in the room
      socket.to(roomName).emit('job:user-left', {
        userId: user.userId,
        role: user.role,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error leaving job room:', error);
      socket.emit('error', { message: 'Failed to leave job room', code: 'LEAVE_ERROR' });
    }
  });

  /**
   * Update job status
   * Only mechanics can update job status
   */
  socket.on('job:update-status', async (data: {
    jobId: string;
    status: string;
    notes?: string;
  }) => {
    try {
      const { jobId, status, notes } = data;

      // Verify mechanic is assigned to this job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          mechanicId: true,
          customerId: true,
        },
      });

      if (!job) {
        socket.emit('error', { message: 'Job not found', code: 'JOB_NOT_FOUND' });
        return;
      }

      if (job.mechanicId !== user.userId && user.role !== 'ADMIN') {
        socket.emit('error', { message: 'Not authorized to update this job', code: 'UNAUTHORIZED' });
        return;
      }

      // Update job status in database
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: status as any,
          ...(status === 'IN_PROGRESS' && !job ? { startedAt: new Date() } : {}),
          ...(status === 'COMPLETED' && !job ? { completedAt: new Date() } : {}),
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          mechanic: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Broadcast status update to all in the room
      const roomName = `job-${jobId}`;
      io.to(roomName).emit('job:status-updated', {
        jobId,
        status,
        notes,
        job: updatedJob,
        updatedBy: {
          userId: user.userId,
          email: user.email,
          role: user.role,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(`WebSocket: Job ${jobId} status updated to ${status} by ${user.email}`);

    } catch (error) {
      console.error('Error updating job status:', error);
      socket.emit('error', { message: 'Failed to update job status', code: 'UPDATE_ERROR' });
    }
  });

  /**
   * Update mechanic location
   * Only mechanics can update their location during an active job
   */
  socket.on('job:update-location', async (data: {
    jobId: string;
    latitude: number;
    longitude: number;
    eta?: number; // ETA in minutes
  }) => {
    try {
      const { jobId, latitude, longitude, eta } = data;

      // Verify mechanic is assigned to this job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          mechanicId: true,
          status: true,
        },
      });

      if (!job) {
        socket.emit('error', { message: 'Job not found', code: 'JOB_NOT_FOUND' });
        return;
      }

      if (job.mechanicId !== user.userId) {
        socket.emit('error', { message: 'Not authorized to update location for this job', code: 'UNAUTHORIZED' });
        return;
      }

      // Only update location for active jobs
      if (job.status !== 'ACCEPTED' && job.status !== 'IN_PROGRESS') {
        socket.emit('error', { message: 'Can only update location for active jobs', code: 'INVALID_STATUS' });
        return;
      }

      // Update job location in database
      const etaDate = eta ? new Date(Date.now() + eta * 60 * 1000) : null;

      await prisma.job.update({
        where: { id: jobId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          ...(etaDate && { eta: etaDate }),
        },
      });

      // Broadcast location update to all in the room
      const roomName = `job-${jobId}`;
      io.to(roomName).emit('job:location-updated', {
        jobId,
        location: {
          latitude,
          longitude,
        },
        eta: etaDate,
        mechanicId: user.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`WebSocket: Location updated for job ${jobId} by ${user.email}`);

    } catch (error) {
      console.error('Error updating location:', error);
      socket.emit('error', { message: 'Failed to update location', code: 'LOCATION_ERROR' });
    }
  });

  /**
   * Update ETA
   * Mechanics can update estimated time of arrival
   */
  socket.on('job:update-eta', async (data: {
    jobId: string;
    etaMinutes: number;
  }) => {
    try {
      const { jobId, etaMinutes } = data;

      // Verify mechanic is assigned to this job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          mechanicId: true,
        },
      });

      if (!job) {
        socket.emit('error', { message: 'Job not found', code: 'JOB_NOT_FOUND' });
        return;
      }

      if (job.mechanicId !== user.userId && user.role !== 'ADMIN') {
        socket.emit('error', { message: 'Not authorized to update ETA for this job', code: 'UNAUTHORIZED' });
        return;
      }

      // Calculate ETA
      const etaDate = new Date(Date.now() + etaMinutes * 60 * 1000);

      // Update job ETA in database
      await prisma.job.update({
        where: { id: jobId },
        data: { eta: etaDate },
      });

      // Broadcast ETA update to all in the room
      const roomName = `job-${jobId}`;
      io.to(roomName).emit('job:eta-updated', {
        jobId,
        eta: etaDate,
        etaMinutes,
        updatedBy: {
          userId: user.userId,
          email: user.email,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(`WebSocket: ETA updated for job ${jobId} to ${etaMinutes} minutes`);

    } catch (error) {
      console.error('Error updating ETA:', error);
      socket.emit('error', { message: 'Failed to update ETA', code: 'ETA_ERROR' });
    }
  });
}
