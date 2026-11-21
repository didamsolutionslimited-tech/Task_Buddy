import { Request, Response } from 'express';
import pool from '../config/db';
import dotenv from 'dotenv';
import { computeQuote } from '../services/pricingService';

dotenv.config();

/** POST /api/bookings/pay/quote  { amount, urgent?, urgency_fee? } -> billing breakdown */
export const quotePayment = async (req: Request, res: Response) => {
  const { amount, urgent, urgency_fee } = req.body || {};
  const q = computeQuote(amount, { urgent, urgencyFee: urgency_fee });
  if (q.task_amount <= 0 && !urgent) {
    return res.status(400).json({ error: 'A task amount is required' });
  }
  res.json({ quote: q });
};

export const initializePayment = async (req: Request, res: Response) => {
  const { booking_id, amount, urgent, urgency_fee } = req.body;

  if (!booking_id || !amount) {
    return res.status(400).json({ error: 'booking_id and amount are required' });
  }

  try {
    const q = computeQuote(amount, { urgent, urgencyFee: urgency_fee });

    // In a real African context, we integrate Paystack or Flutterwave here
    // Example: Paystack Initialize Transaction API
    const paymentGatewayUrl = 'https://api.paystack.co/transaction/initialize';

    console.log(`[Payment] Calling Paystack for booking ${booking_id} with amount ${q.total_charged}`);

    // Mocking a successful payment initialization response
    const mockPaymentResponse = {
      status: true,
      data: {
        authorization_url: `https://checkout.paystack.com/pay/mock_${booking_id}`,
        reference: `TB_${Date.now()}`,
      }
    };

    // Save pending payment to DB with the full billing breakdown
    await pool.query(
      `INSERT INTO payments (booking_id, amount, platform_fee, vat, urgency_fee, tasker_payout, transaction_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [booking_id, q.total_charged, q.service_fee, q.vat, q.urgency_fee, q.tasker_payout, mockPaymentResponse.data.reference, 'pending']
    );

    res.json({ quote: q, ...mockPaymentResponse });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { reference } = req.body;

  try {
    // INTEGRATION: Call Paystack/Flutterwave to verify reference
    console.log(`[Payment] Verifying reference ${reference}`);

    // Mocking a successful verification
    await pool.query('UPDATE payments SET status = $1 WHERE transaction_ref = $2', ['paid', reference]);

    // Also update the booking status to 'confirmed'
    const paymentResult = await pool.query('SELECT booking_id FROM payments WHERE transaction_ref = $1', [reference]);
    const bookingId = paymentResult.rows[0].booking_id;
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', bookingId]);

    res.json({ status: 'success', message: 'Payment verified successfully' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};
