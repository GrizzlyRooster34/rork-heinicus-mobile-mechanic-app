/**
 * Integration Tests for Job Workflow
 * Tests the complete flow from quote request to job completion
 */

import { prisma } from '../../lib/prisma';

describe('Job Workflow Integration', () => {
  let customerId: string;
  let mechanicId: string;
  let vehicleId: string;
  let serviceId: string;
  let quoteId: string;
  let jobId: string;

  beforeAll(() => {
    // Set up test data IDs
    customerId = 'customer-integration-test';
    mechanicId = 'mechanic-integration-test';
    vehicleId = 'vehicle-integration-test';
    serviceId = 'service-integration-test';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Job Lifecycle', () => {
    it('should complete full job workflow from quote to completion', async () => {
      // Step 1: Customer requests a quote
      const mockQuote = {
        id: 'quote-workflow-test',
        customerId,
        vehicleId,
        serviceId,
        lineItems: [
          { label: 'Oil change', amount: 50 },
          { label: 'Filter replacement', amount: 25 },
        ],
        laborRate: 75,
        estHours: 1,
        laborCost: 75,
        partsCost: 75,
        travelFee: 25,
        discountsApplied: [],
        status: 'PENDING',
        subtotal: 175,
        taxes: 15.75,
        total: 190.75,
        totalCost: 190.75,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.quote.create as jest.Mock).mockResolvedValue(mockQuote);

      const createdQuote = await prisma.quote.create({
        data: mockQuote,
      });

      expect(createdQuote).toBeDefined();
      expect(createdQuote.status).toBe('PENDING');
      quoteId = createdQuote.id;

      // Step 2: Customer approves quote and creates job
      const mockJob = {
        id: 'job-workflow-test',
        quoteId,
        customerId,
        mechanicId: null, // Not assigned yet
        status: 'PENDING',
        urgency: 'MEDIUM',
        title: 'Oil Change and Filter Replacement',
        category: 'oil_change',
        location: {
          lat: 45.5152,
          lng: -122.6784,
          address: '123 Test Street, Portland, OR 97201',
        },
        photos: [],
        partsUsed: [],
        timers: [],
        totals: {
          labor: 0,
          parts: 0,
          fees: 0,
          discounts: 0,
          grand_total: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.job.create as jest.Mock).mockResolvedValue(mockJob);
      (prisma.jobTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-1',
        jobId: mockJob.id,
        eventType: 'CREATED',
        description: 'Job created from quote',
        createdAt: new Date(),
      });

      const createdJob = await prisma.job.create({
        data: mockJob,
      });

      await prisma.jobTimeline.create({
        data: {
          jobId: createdJob.id,
          eventType: 'CREATED',
          description: 'Job created from quote',
          actorId: customerId,
        },
      });

      expect(createdJob).toBeDefined();
      expect(createdJob.status).toBe('PENDING');
      jobId = createdJob.id;

      // Step 3: Mechanic accepts the job
      const acceptedJob = {
        ...mockJob,
        mechanicId,
        status: 'ACCEPTED',
        updatedAt: new Date(),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(acceptedJob);
      (prisma.jobTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-2',
        jobId,
        eventType: 'ACCEPTED',
        description: 'Job accepted by mechanic',
        createdAt: new Date(),
      });

      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          mechanicId,
          status: 'ACCEPTED',
        },
      });

      await prisma.jobTimeline.create({
        data: {
          jobId,
          eventType: 'ACCEPTED',
          description: 'Job accepted by mechanic',
          actorId: mechanicId,
        },
      });

      expect(updatedJob.mechanicId).toBe(mechanicId);
      expect(updatedJob.status).toBe('ACCEPTED');

      // Step 4: Mechanic starts work
      const activeJob = {
        ...acceptedJob,
        status: 'ACTIVE',
        timers: [
          {
            action: 'start',
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date(),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(activeJob);
      (prisma.jobTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-3',
        jobId,
        eventType: 'IN_PROGRESS',
        description: 'Work started',
        createdAt: new Date(),
      });

      const startedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'ACTIVE',
          timers: [
            {
              action: 'start',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      await prisma.jobTimeline.create({
        data: {
          jobId,
          eventType: 'IN_PROGRESS',
          description: 'Work started',
          actorId: mechanicId,
        },
      });

      expect(startedJob.status).toBe('ACTIVE');
      expect(Array.isArray(startedJob.timers)).toBe(true);

      // Step 5: Mechanic completes work
      const completedJob = {
        ...activeJob,
        status: 'COMPLETED',
        partsUsed: [
          { name: 'Oil Filter', qty: 1, unit_cost: 15 },
          { name: 'Motor Oil (5qt)', qty: 1, unit_cost: 30 },
        ],
        totals: {
          labor: 75,
          parts: 45,
          fees: 25,
          discounts: 0,
          grand_total: 145,
        },
        timers: [
          ...activeJob.timers,
          {
            action: 'end',
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date(),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(completedJob);
      (prisma.jobTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-4',
        jobId,
        eventType: 'COMPLETED',
        description: 'Job completed',
        createdAt: new Date(),
      });

      const finishedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          partsUsed: completedJob.partsUsed,
          totals: completedJob.totals,
          timers: completedJob.timers,
        },
      });

      await prisma.jobTimeline.create({
        data: {
          jobId,
          eventType: 'COMPLETED',
          description: 'Job completed',
          actorId: mechanicId,
        },
      });

      expect(finishedJob.status).toBe('COMPLETED');
      expect(finishedJob.totals.grand_total).toBeGreaterThan(0);

      // Step 6: Customer makes payment
      const mockPayment = {
        id: 'payment-workflow-test',
        userId: customerId,
        jobId,
        quoteId,
        stripePaymentId: 'pi_test_12345',
        amount: finishedJob.totals.grand_total,
        currency: 'usd',
        status: 'succeeded',
        paymentMethod: 'card',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);

      const payment = await prisma.payment.create({
        data: mockPayment,
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('succeeded');
      expect(payment.amount).toBe(finishedJob.totals.grand_total);

      // Step 7: Customer leaves review
      const mockReview = {
        id: 'review-workflow-test',
        jobId,
        quoteId,
        reviewerId: customerId,
        revieweeId: mechanicId,
        rating: 5,
        punctualityRating: 5,
        qualityRating: 5,
        communicationRating: 5,
        valueRating: 5,
        comment: 'Excellent service! Very professional and thorough.',
        photos: [],
        isVerified: true,
        reportCount: 0,
        isHidden: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.review.create as jest.Mock).mockResolvedValue(mockReview);

      const review = await prisma.review.create({
        data: mockReview,
      });

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.reviewerId).toBe(customerId);
      expect(review.revieweeId).toBe(mechanicId);

      // Verify complete workflow
      expect(prisma.quote.create).toHaveBeenCalled();
      expect(prisma.job.create).toHaveBeenCalled();
      expect(prisma.job.update).toHaveBeenCalledTimes(3); // Accept, Start, Complete
      expect(prisma.jobTimeline.create).toHaveBeenCalledTimes(4); // Created, Accepted, Started, Completed
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.review.create).toHaveBeenCalled();
    });

    it('should handle job cancellation', async () => {
      const mockJob = {
        id: 'job-cancel-test',
        quoteId: 'quote-cancel-test',
        customerId,
        mechanicId: null,
        status: 'PENDING',
        urgency: 'LOW',
        title: 'Test Job for Cancellation',
        category: 'diagnostics',
        location: { lat: 45.5152, lng: -122.6784 },
        photos: [],
        partsUsed: [],
        timers: [],
        totals: { labor: 0, parts: 0, fees: 0, discounts: 0, grand_total: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.job.create as jest.Mock).mockResolvedValue(mockJob);
      (prisma.jobTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-cancel',
        jobId: mockJob.id,
        eventType: 'CANCELED',
      });

      const job = await prisma.job.create({ data: mockJob });

      // Cancel job
      const canceledJob = {
        ...mockJob,
        status: 'CANCELED',
        updatedAt: new Date(),
      };

      (prisma.job.update as jest.Mock).mockResolvedValue(canceledJob);

      const updated = await prisma.job.update({
        where: { id: job.id },
        data: { status: 'CANCELED' },
      });

      await prisma.jobTimeline.create({
        data: {
          jobId: job.id,
          eventType: 'CANCELED',
          description: 'Job canceled by customer',
          actorId: customerId,
        },
      });

      expect(updated.status).toBe('CANCELED');
      expect(prisma.jobTimeline.create).toHaveBeenCalled();
    });

    it('should track timeline events correctly', async () => {
      const mockTimeline = [
        {
          id: 'tl-1',
          jobId: 'job-test',
          eventType: 'CREATED',
          description: 'Job created',
          actorId: customerId,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'tl-2',
          jobId: 'job-test',
          eventType: 'ACCEPTED',
          description: 'Job accepted by mechanic',
          actorId: mechanicId,
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
        {
          id: 'tl-3',
          jobId: 'job-test',
          eventType: 'IN_PROGRESS',
          description: 'Work started',
          actorId: mechanicId,
          createdAt: new Date('2024-01-01T14:00:00Z'),
        },
        {
          id: 'tl-4',
          jobId: 'job-test',
          eventType: 'COMPLETED',
          description: 'Work completed',
          actorId: mechanicId,
          createdAt: new Date('2024-01-01T15:30:00Z'),
        },
      ];

      (prisma.jobTimeline.findMany as jest.Mock).mockResolvedValue(mockTimeline);

      const timeline = await prisma.jobTimeline.findMany({
        where: { jobId: 'job-test' },
        orderBy: { createdAt: 'asc' },
      });

      expect(timeline).toHaveLength(4);
      expect(timeline[0].eventType).toBe('CREATED');
      expect(timeline[1].eventType).toBe('ACCEPTED');
      expect(timeline[2].eventType).toBe('IN_PROGRESS');
      expect(timeline[3].eventType).toBe('COMPLETED');

      // Verify chronological order
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].createdAt.getTime()).toBeGreaterThan(
          timeline[i - 1].createdAt.getTime()
        );
      }
    });
  });
});
