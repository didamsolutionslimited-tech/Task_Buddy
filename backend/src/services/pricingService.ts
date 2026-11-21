/**
 * Task Buddy billing model (decisions 2026-11-21):
 *
 *  - The client is charged: task amount + 10% service fee + 7.5% VAT on the
 *    service fee + an urgency surcharge for urgent/priority jobs.
 *  - The tasker receives the full task amount (the client pays fees on top).
 *  - VAT follows government tax law and is applied on the service fee.
 *  - Urgent/priority surcharge is at least ₦2,000; specific job types may
 *    charge more via the optional urgencyFee amount supplied by the caller.
 *
 * All amounts are in Naira (NGN, kobo-precision not used — rounded to naira).
 */

export const SERVICE_FEE_RATE = 0.10; // 10%
export const VAT_RATE = 0.075; // 7.5% VAT (government tax law)
export const MIN_URGENT_FEE = 2000; // ₦2,000 minimum for urgent/priority jobs

export interface Quote {
  task_amount: number;
  service_fee: number;
  vat: number;
  urgency_fee: number;
  total_charged: number;
  tasker_payout: number;
}

export const computeQuote = (
  taskAmountInput: unknown,
  opts?: { urgent?: unknown; urgencyFee?: unknown }
): Quote => {
  const task_amount = Math.max(0, Math.round(Number(taskAmountInput) || 0));
  const urgent = Boolean(opts?.urgent);

  const urgency_fee = urgent
    ? Math.max(MIN_URGENT_FEE, Math.round(Number(opts?.urgencyFee) || 0))
    : 0;

  const service_fee = Math.round(task_amount * SERVICE_FEE_RATE * 100) / 100;
  const vat = Math.round(service_fee * VAT_RATE * 100) / 100;
  const total_charged = task_amount + service_fee + vat + urgency_fee;

  return {
    task_amount,
    service_fee,
    vat,
    urgency_fee,
    total_charged,
    tasker_payout: task_amount,
  };
};
