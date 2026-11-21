import { Request, Response } from 'express';
import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

export const initializePayment = async (req: Request, res: Response) => {
  const { booking_id, amount } = req.body;

  try {
    // In a real African context, we integrate Paystack or Flutterwave here
    // Example: Paystack Initialize Transaction API
    const paymentGatewayUrl = 'https://api.paystack.co/transaction/initialize';

    console.log(`[Payment] Calling Paystack for booking ${booking_id} with amount ${amount}`);

    // Mocking a successful payment initialization response
    const mockPaymentResponse = {
      status: true,
      data: {
        authorization_url: `https://checkout.paystack.com/pay/mock_${booking_id}`,
        reference: `TB_${Date.now()}`,
      }
    };

    // Save pending payment to DB
    await pool.query(
      'INSERT INTO payments (booking_id, amount, platform_fee, transaction_ref, status) VALUES ($1, $2, $3, $4, $5)',
      [booking_id, amount, amount * 0.1, mockPaymentResponse.data.reference, 'pending']
    );

    res.json(mockPaymentResponse);
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
