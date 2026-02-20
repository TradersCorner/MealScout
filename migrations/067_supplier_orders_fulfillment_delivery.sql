-- Bring supplier_orders up to date for fulfillment + delivery support.
-- Older databases may be missing these columns even though the app expects them.

ALTER TABLE supplier_orders
  ADD COLUMN IF NOT EXISTS requested_fulfillment varchar NOT NULL DEFAULT 'pickup';

ALTER TABLE supplier_orders
  ADD COLUMN IF NOT EXISTS delivery_fee_cents integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_supplier_orders_fulfillment
  ON supplier_orders(requested_fulfillment);

