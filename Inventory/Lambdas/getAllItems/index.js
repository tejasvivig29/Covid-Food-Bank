const AWS = require("aws-sdk");
const connection = require("./connection");

connection.connect();
exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let result = "";
  const sql = `select * from items`;

  connection.query(sql, (error, rows) => {
    if (error) {
      console.log("Error found : " + error);
    } else {
      result = JSON.stringify(rows);
      callback(error, result);
    }
  });
};
