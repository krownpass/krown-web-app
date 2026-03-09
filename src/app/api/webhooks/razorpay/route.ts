import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body) as {
      event: string;
      payload: { payment: { entity: { id: string; order_id: string; status: string } } };
    };

    // Handle payment events
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      // Forward to backend API for processing
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': webhookSecret },
        body: JSON.stringify({ payment_id: payment.id, order_id: payment.order_id, status: 'captured' }),
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
