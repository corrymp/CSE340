-- removes all added inventory
DELETE FROM inventory WHERE inv_id > 15;
SELECT * FROM inventory;

-- removes all added classifications
DELETE FROM classification WHERE classification_id > 5;
SELECT * FROM classification;

-- removes all accounts
DELETE FROM account;
SELECT * FROM account;
