# Paddle quantity guard — manual review runbook

Our catalog is **fixed products at quantity 1**. Packs (e.g. `kr_relationship_triple`)
are their own product, still bought at quantity 1. `process_us_purchase` /
`process_kr_purchase` grant a fixed amount per plan and have no quantity concept.

Since this change, both fulfillment paths (`app/api/webhooks/paddle` and
`app/api/pricing/checkout/complete`) check the **final** Paddle transaction.
If its total quantity is not exactly 1, **nothing is granted**. Instead:

- one row is written to `payment_manual_reviews` (unique per transaction),
- a server log line `quantity_<N>_held_for_manual_review` is emitted,
- the buyer sees "payment received, under review, don't pay again".

## 1. Lock quantity in Paddle (dashboard → Catalog → Prices → each price → Quantity: min 1, max 1)

| Plan | Price ID |
|---|---|
| us_personal_premium | `pri_01m1xm9wvkbshger1xywdsd4rc` |
| us_relationship_premium | `pri_01m1xm9xyg6yw4bcxz5nq36trt` |
| us_insight_pass_30d | `pri_01m346b8d0hysn7h2m7cd9fjcf` |
| us_annual_membership | `pri_01m1xm9ycep8n9b5w01dkrh4pz` |
| us_additional_relationship | `pri_01m3469c0zse3kdmd7fkr3s6x4` |
| kr_personal_premium | `pri_01m346g11a6ndbvzdkbh06jtdc` |
| kr_relationship_premium | `pri_01m346hk3xedppb5969h58q1e2` |
| kr_insight_pass_30d | `pri_01m346m608kkkjsw8786j6b6k0` |
| kr_relationship_triple | `pri_01m346qtbw408b5nnqgw9bmbj8` |
| (legacy beta, no UI) personal_premium | `pri_01m24ybdvr53kc9fvf91y9s6bt` |
| (legacy beta, no UI) relationship_premium | `pri_01m24ycpwf5cq713z463tqf1he` |
| (legacy beta, no UI) membership_beta | `pri_01m24yejnkaf61jw42jek47ejb` |
| (legacy beta, no UI) additional_relationship | `pri_01m24yfrgt87dph6caewbjajky` |

## 2. Resolving a held transaction

```sql
select * from payment_manual_reviews where resolved_at is null order by created_at;
```

Either refund in Paddle, or grant exactly the quantity paid for (N × the plan's
fixed grant) with the existing function, then mark the row resolved:

```sql
select grant_credit('<clerk_user_id>', '<personal|relationship>', <N>, 'admin', null, now() + interval '1 year');
update payment_manual_reviews set resolved_at = now(), resolution_note = 'granted N / refunded'
 where provider_transaction_id = '<txn_id>';
```

## 3. Pre-guard transaction to recover: `us_purchase_grants.id = dce0eb61-7e3f-433e-9745-440807a68316`

Not backfilled automatically. Only if Paddle confirms **quantity = 2** and a charge for 2
(Paddle → Transactions → the `txn_…` from the query below → line item quantity and total):

```sql
-- a) the Paddle transaction id for this grant
select plan_id, paddle_transaction_id, paddle_price_id, currency_code, created_at
  from us_purchase_grants where id = 'dce0eb61-7e3f-433e-9745-440807a68316';

-- b) must return ONLY the original lot (amount 1) -- i.e. not already restored
select * from credit_lots where reference_id = 'dce0eb61-7e3f-433e-9745-440807a68316';

-- c) restore the one missing Relationship credit (same 1-year expiry as the original lot)
select grant_credit('<clerk_user_id>', 'relationship', 1, 'admin',
                    'dce0eb61-7e3f-433e-9745-440807a68316',
                    '2027-09-28 07:19:36+00');
```

Run (c) once. Re-running (b) afterwards shows two lots for that reference (1 original + 1 admin).
