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
        async query(text, params, verbose = false, showRes = false) {
            try {
                const res = await pool.query(text, params);
                if(verbose) console.log('executed query' + (params ? 'with params' : ''), (params ? { params } : ''), ':\n', { text }, (showRes ? '\n' : ''), (showRes ? res : ''));
                return res;
            }
            catch (err) {
                console.error('error in query' + (params ? 'with params' : ''), (params ? { params } : ''), ':\n', { text });
                console.trace();
                throw err;
            }
        }
    }
}

else {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    module.exports = pool;
}
