const AWS = require("aws-sdk");
const connection = require("./connection");

connection.connect();

exports.handler = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  var requestBody = event;
  var pathParams = event.path;
  var httpMethod = event.httpMethod;
  
  var item_id;
  var item_name;
  var quantity;

  item_id = requestBody.item_id;
  item_name = requestBody.item_name;
  quantity = requestBody.quantity;

  const sql = "insert into items (item_id,item_name,quantity) values ?";

  const values = [[item_id,item_name,quantity]];

  connection.query(sql,[values], (error, rows) => {
    if (error) {
      console.log("Error found : " + error);
    } else {
      console.log("Inside else : " + JSON.stringify(rows));
      result = JSON.stringify(rows);
      context.succeed('Success');
    }
  });
};
