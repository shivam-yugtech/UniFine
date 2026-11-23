require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000
});

client.connect()
  .then(() => client.query("SELECT NOW()"))
  .then(result => console.log("POOLED CONNECTION SUCCESS:", result.rows[0]))
  .catch(error => console.log("POOLED CONNECTION FAILED:", error.message))
  .finally(() => client.end());
