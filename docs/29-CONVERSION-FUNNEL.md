# Conversion funnel

How Estudisc measures the path from the sales page to paid access (ADR 0061). Two sources, no third-party tracker:

- **Structured logs** (`event: "funnel_event"`, field `funnelStep`) for steps that leave nothing in the database. Written by `logFunnelEvent` in `src/lib/funnel-events.ts`; the logger allowlist keeps personal data and owner ids out.
- **The database** for everything it already records. It is the source of truth for revenue.

Numbers below are definitions, not targets. No baseline exists yet; collect two weeks before comparing anything.

## Steps

| Step | Source | Meaning |
|---|---|---|
| `signin_completed` | log (`source: google`) | Google sign-in accepted. Not "new account": repeat sign-ins count too. |
| `free_home_viewed` | log | A signed-in account without full access opened `/`. |
| new owners | DB `owners.created_at` | First write for an owner (first answer, progress or purchase), so it lags sign-in. |
| first value | DB, queries below | Diagnostic finalized, or a free sample lesson with a submitted activity. |
| `paid_feature_blocked` | log (`operation: tutor`, `study_session`, `question`) | A free account asked for something in full access. Demand signal. |
| `paywall_viewed` | log (`reasonCode: lesson_locked`, `upgrade_page`) | Paywall shown. |
| `checkout_started` | log (`status: created`, `sandbox`, `already_entitled`) | Mercado Pago preference created. |
| `checkout_failed` | log (`reasonCode`) | Preference could not be created (configuration or upstream). |
| `checkout_returned` | log (`status: confirming`, `failure`) | The student came back from Mercado Pago. |
| `entitlement_granted` | log + DB `entitlements` | Approved payment recorded by the signed webhook. Only the DB row counts as revenue. |
| `mercadopago_duplicate_payment` | log (warn) | Second approved payment for an owner who already had access: refund by hand. |

## Queries

```sql
-- Paid access granted per day and payment type (revenue actually received)
select date_trunc('day', created_at) as day, source, metadata->>'paymentTypeId' as payment_type,
       count(*) as grants, sum(amount_cents) / 100.0 as brl
from entitlements where status = 'granted' group by 1, 2, 3 order by 1;

-- Refunds and chargebacks
select status, count(*) from entitlements where status in ('refunded', 'revoked') group by 1;

-- First value: Diagnostic finalized
select count(distinct i.owner_id) from assessment_instances i
join assessment_templates t on t.id = i.template_id
where t.kind in ('BROAD_DIAGNOSTIC', 'TARGETED_DIAGNOSTIC') and i.finalized_at is not null;

-- First value: a free sample lesson with at least one submitted activity
select l.stable_id, count(distinct p.owner_id) from lesson_progress p
join lessons l on l.id = p.lesson_id
where l.stable_id in ('MAT-07', 'CIE-01', 'POR-03', 'GH-51') and p.submitted_activities > 0
group by 1;
```

Activation rate = owners with first value / new owners. Conversion = owners with a `granted` row / owners with first value. Keep admin, allowlisted and code-account owners out of both (they never pay).

## Not measured yet

- Checkout abandonment inside Mercado Pago's page and the payment method chosen before abandoning: Checkout Pro does not report them to us. Approved payments carry `paymentTypeId`.
- Retention after payment: use `study_events` per owner after the grant date.
