-- Adds indexes on plate columns for faster lookup
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles (plate);
CREATE INDEX IF NOT EXISTS idx_authorized_plate ON authorized (plate);
