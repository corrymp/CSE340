const { Pool } = require('pg');
require('dotenv').config();

// Connection Pool: SSL Object needed for local testing of app, but will cause problems in production environment. if else will make determination which to use
let pool;

if (process.env.NODE_ENV === 'development') {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    // for troubleshooting queries during dev
    module.exports = {
        async query(text, params) {
            try {
                const res = await pool.query(text, params);
                console.log('executed query with params', { params }, { text });
                return res;
            }
            catch (err) {
                console.error('error in query', { text });
                throw err;
            }
        }
    }
}

else {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    module.exports = pool;
}
