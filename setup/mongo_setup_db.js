/*
userdata for all hackers:
    hacker1:
        username: neo
        password: i'm>an§hacker!and/i)use$many<special)chars´in-my+password:):):-)
    hacker2:
        username: v
        password: sa2G34dfb4F5dvsa389fhoh4c4oae78u0wb2oIVUBSC34RWbdsjfb23ucbscwidn
    hacker3:
        username: r2-d2
        password: 34S5DFdsoDp4dKf2sj546T8toqX9blBa4ASAc423GG3q4wdBc1b42rn34BtBqoMj
*/

// connect to mongo
conn = new Mongo();

// select database
db = conn.getDB('rentahacker');

// authenticate
db.auth('admin', 'aewofnvaonq934evbna93fqenq320fnve0wcn230gfq0enc034gnvdsjn39fnwea');

// create user collection
db.createCollection('users');

// insert hackers as users
db.users.insert({
    'username': 'neo',
    'password': '$2a$16$KPAZ.M560VNNMou6opTsJO45ykCCdbgO.uotnZ25cciMLmfIx5e7i'
});
db.users.insert({
    'username': 'v',
    'password': '$2a$16$LJAGh.V5PqfU0YIfwet8ruYk4ZV9cUdzpmvbCZkmIm2spoI9/3x2C'
});
db.users.insert({
    'username': 'r2-d2',
    'password': '$2a$16$dx041g2bTItBZP6hbvkQgOXxETOlqqzh70ty0GoUEo2seH7jBWEMG'
});

// create hacker collection
db.createCollection('hackers');

// insert hackers as hackers
db.hackers.insert({
    'username': 'neo',
    'skills': ['matrix decoding', 'kung fu fighting', 'beeing the chosen one']
});
db.hackers.insert({
    'username': 'v',
    'skills': ['blowing up buildings', 'wearing fancy masks']
});
db.hackers.insert({
    'username': 'r2-d2',
    'skills': ['hacking terminals', 'master of disguise', 'rolling toolbox']
});

// create request collection
db.createCollection('requests');

// create contact collection
db.createCollection('contacts');
