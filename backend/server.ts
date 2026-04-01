import { getRequestListener } from '@hono/node-server';
import { createServer } from 'node:http';
import { Hono } from 'hono';
import apiApp from './hono';
import { createRealtimeServer } from './websocket/server';
import { verifyWebhookSignature } from './services/stripe';
import { prisma } from '@/lib/prisma';
import { sendJobStatusNotification } from './services/notifications';

const app = new Hono();

app.route('/api', apiApp);

// Stripe Webhook
app.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.text('No signature', 400);
  }

  try {
    const body = await c.req.text();
    const event = verifyWebhookSignature(body, signature);

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log(`Payment succeeded: ${paymentIntent.id}`);

        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'SUCCEEDED' },
        });

        const quoteId = paymentIntent.metadata?.quoteId;
        let jobId = paymentIntent.metadata?.jobId;

        if (quoteId) {
          const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            select: { jobId: true },
          });

          if (quote) {
            await prisma.quote.update({
              where: { id: quoteId },
              data: { status: 'ACCEPTED' },
            });

            if (quote.jobId && !jobId) {
              jobId = quote.jobId;
            }
          }
        }

        if (jobId) {
          await prisma.job.update({
            where: { id: jobId },
            data: { status: 'COMPLETED' }, // Lifecycle fix: Part D says AWAITING_PAYMENT -> CLOSED
            // But Part B.2 says AWAITING_PAYMENT -> CLOSED and Quote status to PAID.
            // Let's use what Part B.2 says.
          });
          
          // Actually Part B.2 says: update Job status to AWAITING_PAYMENT -> CLOSED and Quote status to PAID
          // Let's re-read: "update Job status to AWAITING_PAYMENT -> CLOSED and Quote status to PAID"
          
          await prisma.job.update({
            where: { id: jobId },
            data: { status: 'COMPLETED' }, // COMPLETED is the closest to CLOSED in current schema
          });
          
          if (quoteId) {
            await prisma.quote.update({
              where: { id: quoteId },
              data: { status: 'PAID' },
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as any;
        console.log(`Payment failed: ${failedPayment.id}`);

        const paymentRecord = await prisma.payment.findUnique({
          where: { stripePaymentId: failedPayment.id },
        });

        if (paymentRecord) {
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: 'FAILED' },
          });

          await sendJobStatusNotification(
            paymentRecord.customerId,
            paymentRecord.jobId,
            'Payment Failed'
          );
        }
        break;
      }
    }

    return c.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`);
    return c.text(`Webhook Error: ${err.message}`, 400);
  }
});

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Heinicus backend server is running',
    apiBasePath: '/api',
    timestamp: new Date().toISOString(),
  });
});

const port = Number(process.env.PORT || 3000);
const requestListener = getRequestListener(app.fetch);
const server = createServer(requestListener);

createRealtimeServer(server);

server.listen(port, () => {
  console.log(`Heinicus API listening on http://localhost:${port}`);
  console.log(`Heinicus realtime server ready on ws://localhost:${port}`);
});
