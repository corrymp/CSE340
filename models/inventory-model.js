const pool = require('../database/');
const verbose = false;
const extraDetails = false;

/**
 * @returns {Object} results of SQL query
 * @description get classification data
 */
const getClassifications = async () => await pool.query(
    `SELECT * 
        FROM classification 
        ORDER BY classification_name`
);

/**
 * @param {String} classification_id - Database primary key
 * @returns {Object[]} resulting rows of SQL query
 * @description get all inventory items of a given classification by classification_id
 */
const getInventoryByClassificationId = async (classification_id) => {
    try {
        const data = await pool.query(
            `SELECT * 
                FROM inventory AS i 
                JOIN classification AS c 
                    ON i.classification_id = c.classification_id 
                WHERE i.classification_id = $1`,
            [classification_id],
            verbose, extraDetails
        );

        return await data.rows;
    }
    catch (err) {
        console.error('getClassificationsById error: ' + err);
    }
}

/**
 * @param {String} classification_id - Database primary key
 * @returns {Object[]} resulting rows of SQL query
 * @description get classification by classification_id
 */
const getClassificationById = async (classification_id) => await pool.query(
    `SELECT * 
        FROM classification 
        WHERE classification_id = $1`,
    [classification_id],
    verbose, extraDetails
);

/**
 * @param {String} classification_name - classification table field name
 * @returns {Object[]} resulting rows of SQL query
 * @description get classification by classification_id
 */
const getClassificationByName = async (classification_name) => await pool.query(
    `SELECT * 
        FROM classification 
        WHERE classification_name = $1`,
    [classification_name],
    verbose, extraDetails
);

/**
 * @param {String} inv_id - Database primary key
 * @returns {Object[]} resulting data from SQL query
 * @description get inventory item using the inv_id
 */
const getInventoryById = async (inv_id) => await pool.query(
    `SELECT * 
        FROM inventory 
        WHERE inv_id = $1`,
    [inv_id],
    verbose, extraDetails
);

/**
 * @param {String} classification_name - name to use in database
 * @returns {Object[]} newly created database row
 * @description takes a string for the classification_name field and creates an entry in the classification table if not already present.
 */
const addClassification = async classification_name => {
    try {
        return await pool.query(
            `INSERT 
                INTO classification (classification_name) 
                VALUES ($1) 
                RETURNING *`,
            [classification_name],
            verbose, extraDetails
        );
    }
    catch (e) { return e.message; }
}

/**
 * @param {String} classification_id - primary key of classification to use
 * @param {String} inv_make          - vehicle make to be used
 * @param {String} inv_model         - vehicle model to be used
 * @param {String} inv_image         - vehicle image to be used
 * @param {String} inv_thumbnail     - vehicle thumbnail to be used
 * @param {String} inv_price         - vehicle price to be used
 * @param {String} inv_year          - vehicle year to be used
 * @param {String} inv_miles         - vehicle miles to be used
 * @param {String} inv_color         - vehicle color to be used
 * @param {String} inv_description   - vehicle description to be used
 * @returns {Object[]} newly created database row
 * @description creates an entry in the inventory table if not already present using the given params
 */
const addInventory = async (classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description) => {
    try {
        return await pool.query(
            `INSERT 
                INTO inventory (classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`,
            [classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description],
            verbose, extraDetails
        );
    }
    catch (e) {
        return e.message;
    }
}

/**
 * @param {String} inv_id            - primary key of inventory to update
 * @param {String} inv_make          - vehicle make to be used
 * @param {String} inv_model         - vehicle model to be used
 * @param {String} inv_description   - vehicle description to be used
 * @param {String} inv_image         - vehicle image to be used
 * @param {String} inv_thumbnail     - vehicle thumbnail to be used
 * @param {String} inv_price         - vehicle price to be used
 * @param {String} inv_year          - vehicle year to be used
 * @param {String} inv_miles         - vehicle miles to be used
 * @param {String} inv_color         - vehicle color to be used
 * @param {String} classification_id - primary key of classification to use
 * @returns {Object[]} updates database row
 * @description updates an entry in the inventory table using the given params
 */
const updateInventory = async (inv_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id) => {
    try {
        return (await pool.query(
            `UPDATE inventory
                SET inv_make          = $1,
                    inv_model         = $2,
                    inv_description   = $3,
                    inv_image         = $4,
                    inv_thumbnail     = $5,
                    inv_price         = $6,
                    inv_year          = $7,
                    inv_miles         = $8,
                    inv_color         = $9,
                    classification_id = $10
                WHERE inv_id          = $11
                RETURNING *`,
            [inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id, inv_id]
        )).rows[0];
    }
    catch (e) { console.error('model error: ' + e); }
}

const deleteInventoryItem = async inv_id => {
    try {
        return await pool.query(
            `DELETE
                FROM inventory
                WHERE inv_id = $1`,
            [inv_id],
            verbose, extraDetails
        );
    }
    catch (e) {
        console.error('Inventory deletion error: ' + e);
    }
}

module.exports = {
    getClassifications,
    getClassificationById,
    getClassificationByName,
    getInventoryByClassificationId,
    getInventoryById,
    addClassification,
    addInventory,
    updateInventory,
    deleteInventoryItem
};
