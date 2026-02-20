-- Allow supplier orders to be placed by an individual user (no restaurant/truck).
-- Adds buyer_user_id and makes truck_restaurant_id nullable for supplier_orders.

ALTER TABLE supplier_orders
  ADD COLUMN IF NOT EXISTS buyer_user_id varchar REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE supplier_orders
  ALTER COLUMN truck_restaurant_id DROP NOT NULL;

-- Backfill buyer_user_id from the owning user of the linked restaurant/truck, when present.
UPDATE supplier_orders o
SET buyer_user_id = r.owner_id
FROM restaurants r
WHERE o.truck_restaurant_id = r.id
  AND o.buyer_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_orders_buyer_user
  ON supplier_orders(buyer_user_id);

CREATE INDEX IF NOT EXISTS idx_supplier_orders_buyer_user_created_at
  ON supplier_orders(buyer_user_id, created_at DESC);

