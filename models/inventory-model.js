//#region dependencies
const pool = require('../database/');
const verbose = false;
const extraDetails = false;
//#endregion dependencies

//#region classification

/**
 * @param {String} classification_name - name of new classification
 * @returns {Object[]} newly created row in classification table
 * @description takes a string for the classification_name field and creates an entry in the classification table if not already present.
 */
const addClassification = async classification_name => {
    try {
        return await pool.query(
            `INSERT 
                INTO classification (classification_name) 
                VALUES ($1) 
                RETURNING *`,
            [classification_name], verbose, extraDetails
        );
    }
    catch (e) { return e.message; }
}

/**
 * @returns {Object[]} all rows in classification table
 */
const getAllClassifications = async () => await pool.query(
    `SELECT * 
        FROM classification 
        ORDER BY classification_name`,
        verbose, extraDetails
);

/**
 * @param {String} classification_id - classification table primary key
 * @returns {Object[]} resulting classification table rows
 */
const getClassificationById = async (classification_id) => await pool.query(
    `SELECT * 
        FROM classification 
        WHERE classification_id = $1`,
    [classification_id], verbose, extraDetails
);

/**
 * @param {String} classification_name - classification table row name field
 * @returns {Object[]} resulting classification table rows
 */
const getClassificationByName = async (classification_name) => await pool.query(
    `SELECT * 
        FROM classification 
        WHERE classification_name = $1`,
    [classification_name], verbose, extraDetails
);

/**
 * @param {String} classification_id - classification table primary key
 * @param {String} classification_name - name for classification to use
 * @returns {Object} resulting data from SQL query
 * @description updates an existing row in the classification table
 */
const updateClassificationById = async (classification_id, classification_name) => {
    try {
        return (await pool.query(
            `UPDATE classification
                SET classification_name = $1
                WHERE classification_id = $2
                RETURNING *`,
            [classification_name, classification_id], verbose, extraDetails
        )).rows[0];
    }
    catch (e) { console.error('inventory model error: ' + e); }
}

/**
 * @param {String} classification_id - classification table primary key
 * @returns {Object} resulting data from SQL query
 * @description deletes a row in the classification table along with all inventory under that classification
 */
const deleteClassificationById = async classification_id => {
    try {
        await bulkDeleteAllInventoryByClassificationId(classification_id);

        return await pool.query(
            `DELETE FROM classification
                WHERE classification_id = $1`,
            [classification_id], verbose, extraDetails
        );
    }
    catch (e) { console.error('classification deletion error: ' + e); }
}
//#endregion classification

//#region inventory

/**
 * @param {String} classification_id - Database primary key
 * @returns {Object[]} all rows from inventory table under a given classification
 */
const getAllInventoryByClassificationId = async classification_id => {
    try {
        const data = await pool.query(
            `SELECT * 
                FROM inventory AS i 
                JOIN classification AS c 
                    ON i.classification_id = c.classification_id 
                WHERE i.classification_id = $1`,
            [classification_id], verbose, extraDetails
        );

        return await data.rows;
    }
    catch (err) { console.error('getClassificationsById error: ' + err); }
}

/**
 * @param {Number} inv_id - Database primary key
 * @returns {Object[]} resulting rows from inventory table
 * @description get inventory item using the inv_id
 */
const getInventoryById = async inv_id => await pool.query(
    `SELECT * 
        FROM inventory 
        WHERE inv_id = $1`,
    [inv_id], verbose, extraDetails
);

/**
 * @param {Number} classification_id - primary key of classification to use
 * @param {String} inv_make          - vehicle make to be used
 * @param {String} inv_model         - vehicle model to be used
 * @param {String} inv_image         - vehicle image to be used
 * @param {String} inv_thumbnail     - vehicle thumbnail to be used
 * @param {Number} inv_price         - vehicle price to be used
 * @param {Number} inv_year          - vehicle year to be used
 * @param {Number} inv_miles         - vehicle miles to be used
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
                VALUES (                       $1,       $2,        $3,        $4,            $5,        $6,       $7,        $8,        $9,             $10) 
                RETURNING *`,
            [classification_id, inv_make, inv_model, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, inv_description], verbose, extraDetails
        );
    }
    catch (e) { return e.message; }
}

/**
 * @param {Number} inv_id            - primary key of inventory to update
 * @param {String} inv_make          - vehicle make to be used
 * @param {String} inv_model         - vehicle model to be used
 * @param {String} inv_description   - vehicle description to be used
 * @param {String} inv_image         - vehicle image to be used
 * @param {String} inv_thumbnail     - vehicle thumbnail to be used
 * @param {Number} inv_price         - vehicle price to be used
 * @param {Number} inv_year          - vehicle year to be used
 * @param {Number} inv_miles         - vehicle miles to be used
 * @param {String} inv_color         - vehicle color to be used
 * @param {Number} classification_id - primary key of classification to use
 * @returns {Object[]} updates database row
 * @description updates an entry in the inventory table using the given params
 */
const updateInventoryById = async (inv_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id) => {
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
            [inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id, inv_id], verbose, extraDetails
        )).rows[0];
    }
    catch (e) { console.error('model error: ' + e); }
}

/**
 * @param {Number} inv_id - primary key of inventory item to delete
 * @returns results of SQL query
 */
const deleteInventoryById = async inv_id => {
    try {
        return await pool.query(
            `DELETE
                FROM inventory
                WHERE inv_id = $1`,
            [inv_id], verbose, extraDetails
        );
    }
    catch (e) {console.error('Inventory deletion error: ' + e);}
}

/**
 * @param {Number} classification_id - primary key of the classification to delete all inventory from
 * @returns results of SQL query
 */
const bulkDeleteAllInventoryByClassificationId = async classification_id => {
    try {
        return await pool.query(
            `DELETE
                FROM inventory
                WHERE classification_id = $1`,
            [classification_id], verbose, extraDetails
        );
    }
    catch (e) { console.error('Bulk inventory deletion error: ' + e); }
}
//#endregion inventory

module.exports = {
    getAllClassifications,
    getClassificationById,
    getClassificationByName,
    addClassification,
    updateClassificationById,
    deleteClassificationById,
    getAllInventoryByClassificationId,
    getInventoryById,
    addInventory,
    updateInventoryById,
    deleteInventoryById
};
