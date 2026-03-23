-- Fix any existing rows with negative balances before adding constraints.
-- This can happen due to the race conditions this migration accompanies.
UPDATE wallets SET balance_mnt = 0 WHERE balance_mnt < 0;
UPDATE wallets SET held_balance_mnt = 0 WHERE held_balance_mnt < 0;

ALTER TABLE wallets ADD CONSTRAINT wallet_balance_non_negative CHECK (balance_mnt >= 0);
ALTER TABLE wallets ADD CONSTRAINT wallet_held_balance_non_negative CHECK (held_balance_mnt >= 0);
