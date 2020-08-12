var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "inventory.cwqt2saooiwz.us-east-1.rds.amazonaws.com",
  port: 3306,
  user: "group23",
  password: "cloud1234",
  database: "inventory",
});

module.exports = connection;