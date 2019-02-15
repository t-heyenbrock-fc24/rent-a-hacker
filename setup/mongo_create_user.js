// connect to mongo
conn = new Mongo();

// select database
db = conn.getDB("rentahacker");

// create new user
db.createUser({
  user: "admin",
  pwd: "aewofnvaonq934evbna93fqenq320fnve0wcn230gfq0enc034gnvdsjn39fnwea",
  roles: [{ role: "readWrite", db: "rentahacker" }]
});
