const pool = require('../database/');
const verbose = true;

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
            verbose
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
    verbose
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
    verbose
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
    verbose
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
            verbose
        ); 
    }
    catch (e) { return e.message; }
}

/**
 * @param {String} classification_name - name to use in database
 * @returns {Object[]} newly created database row
 * @description takes a string for the classification_name field and creates an entry in the classification table if not already present.
 */
const addInventory = async (classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description) => {
    try { 
        return await pool.query(
            `INSERT 
                INTO inventory (classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`, 
            [classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description], 
            verbose
        ); 
    }
    catch (e) { 
        return e.message; 
    }
}

module.exports = {
    getClassifications,
    getClassificationById,
    getClassificationByName,
    getInventoryByClassificationId,
    getInventoryById,
    addClassification,
    addInventory
};
