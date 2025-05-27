const pool = require('../database/');

/**
 * @returns {Object} results of SQL query
 * @description get classification data
 */
const getClassifications = async () => await pool.query(
    `SELECT * 
        FROM public.classification 
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
                FROM public.inventory AS i
                JOIN public.classification AS c 
                    ON i.classification_id = c.classification_id
                WHERE i.classification_id = $1`,
            [classification_id]
        );
        
        return data.rows;
    }
    catch (err) { console.error('getClassificationsById error: ' + err); }
}

/**
 * @param {String} classification_id - Database primary key
 * @returns {Object[]} resulting rows of SQL query
 * @description get classification by classification_id
 */
const getClassificationById = async (classification_id) => await pool.query(
    `SELECT * 
        FROM public.classification 
        WHERE classification_id = $1`,
    [classification_id]
).rows;

/**
 * @param {String} inv_id - Database primary key
 * @returns {Object[]} resulting data from SQL query
 * @description get inventory item using the inv_id
 */
const getInventoryById = async (inv_id) => await pool.query(
    `SELECT *
        FROM public.inventory
        WHERE inv_id = $1`,
    [inv_id]
);

module.exports = {
    getClassifications,
    getClassificationById,
    getInventoryByClassificationId,
    getInventoryById
};
