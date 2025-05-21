const pool = require('../database/');

/**
 * @returns {Object} results of SQL query
 * @description get classification data
 */
const getClassifications = async () => await pool.query(
    `SELECT * 
        FROM public.classification 
        ORDER BY classification_name
    `);

/**
 * @param {String} classification_id - Database primary key
 * @returns {Object[]} resulting rows of SQL query
 * @description get all inventory items and classification_name by classification_id
 */
const getInventoryByClassificationId = async (classification_id) => {
    try {
        const data = await pool.query(
            `SELECT * 
                FROM public.inventory AS i
                JOIN public.classification AS c 
                    ON i.classification_id = c.classification_id
                WHERE i.classification_id = $1
            `,
            [classification_id]
        );
        return data.rows;
    }
    catch (err) { console.error('getClassificationsById error: ' + err); }
}

const getClassificationById = async (classification_id) => await pool.query(
    `SELECT * 
        FROM public.classification 
        WHERE classification_id = $1
    `,
    [classification_id]
).rows;

module.exports = {
    getClassifications,
    getClassificationById,
    getInventoryByClassificationId
};
