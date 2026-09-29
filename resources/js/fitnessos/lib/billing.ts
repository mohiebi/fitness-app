export type PaymentStatus =
    | 'pending'
    | 'submitted'
    | 'paid'
    | 'rejected'
    | 'canceled';

export type BillingPayment = {
    id: number;
    plan: string;
    amount: number;
    period_days: number;
    status: PaymentStatus;
    method: 'telegram' | 'manual';
    reference: string;
    created_at: string | null;
    paid_at: string | null;
};

export type Subscription = {
    plan: string;
    on_trial: boolean;
    active: boolean;
    ends_at: string | null;
    max_trainees: number | null;
};

export type Billing = {
    subscription: Subscription;
    active_trainees: number;
    plans: {
        key: string;
        name: string;
        price: number;
        max_trainees: number | null;
    }[];
    period_days: number;
    telegram_enabled: boolean;
    open_payment: (BillingPayment & { telegram_url: string | null }) | null;
    payments: BillingPayment[];
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
    pending: 'Waiting for receipt',
    submitted: 'Receipt under review',
    paid: 'Paid',
    rejected: 'Rejected',
    canceled: 'Canceled',
};

/** Whole days until the date (0 once it has passed). */
export function daysLeft(endsAt: string | null): number {
    if (!endsAt) return 0;

    return Math.max(
        0,
        Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000),
    );
}
