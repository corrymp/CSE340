-- 1. Insert the following new record to the account table:
-- Tony, Stark, tony@starkent.com, Iam1ronM@n
INSERT INTO account VALUES (
	DEFAULT,
	'Tony',
	'Stark',
	'tony@starkent.com',
	'Iam1ronM@n');
-- check: SELECT * FROM account;


-- 2. Modify the Tony Stark record to change the account_type to "Admin".
UPDATE account
    SET account_type = 'Admin'
    WHERE account_id = 1;
-- check: SELECT * FROM account;


-- 3. Delete the Tony Stark record from the database.
DELETE
    FROM account
    WHERE account_id = 1;
-- check: SELECT * FROM account;


-- 4. Modify the "GM Hummer" record to read "a huge interior" rather than "small interiors" using a single query.
UPDATE inventory 
    SET inv_description = REPLACE(
	    inv_description,
	    'the small interiors',
	    'a huge interior')
    WHERE inv_make = 'GM'
    AND inv_model = 'Hummer';
-- check: SELECT * FROM inventory;
-- NOTE: The original text reads: 'Do you have 6 kids and like to go offroading? The Hummer gives you the small interiors with an engine to get you out of any muddy or rocky situation.'
--                                   Changing '...gives you the small interiors with an...' 
--                                         to '...gives you the a huge interior with an...' does not make gramatical sense,
-- and I therefore went with the more correct '...gives you a huge interior with an...'


-- 5. Use an inner join to select the make and model fields from the inventory table and the classification name field from the classification table for inventory items that belong to the "Sport" category.
SELECT inv_make, inv_model
	FROM inventory
	JOIN classification
	ON inventory.classification_id = classification.classification_id
	WHERE classification_name = 'Sport';
-- compare with: SELECT * FROM classification; & SELECT * FROM inventory;


-- 6. Update all records in the inventory table to add "/vehicles" to the middle of the file path in the inv_image and inv_thumbnail columns using a single query.
UPDATE inventory SET
	inv_image = REPLACE(
        inv_image,
        '/images',
        '/images/vehicles'),
	inv_thumbnail  = REPLACE(
        inv_thumbnail,
        '/images',
        '/images/vehicles');
-- check: SELECT inv_image, inv_thumbnail FROM inventory;

