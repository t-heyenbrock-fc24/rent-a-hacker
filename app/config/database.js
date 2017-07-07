'use strict';

// user credentials
const username = 'admin';
const password = 'aewofnvaonq934evbna93fqenq320fnve0wcn230gfq0enc034gnvdsjn39fnwea';

// export connection string
module.exports = {
    database: `mongodb://${username}:${password}@localhost:27017/rentahacker`
}
