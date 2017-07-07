mongod --fork --logpath ~/log --dbpath /data/db/
mongo /usr/src/app/setup/mongo_create_user.js
pkill mongod
sleep 5
mongod --auth --fork --logpath ~/log --dbpath /data/db/
mongo /usr/src/app/setup/mongo_setup_db.js
