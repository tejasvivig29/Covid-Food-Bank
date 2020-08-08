var express = require("express");
var app = express();
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.set("view engine", "ejs");

const axios = require("axios");

// homepage
app.get("/", function (req, res) {
  res.render("pages/homepage");
});

// parts information
app.get("/items", function (req, res, next) {
  // axios.get('https://70y7hvmtm2.execute-api.us-east-1.amazonaws.com/Dev/getallpartsdetails')
  axios
    .get(
      "https://ogmpjma143.execute-api.us-east-1.amazonaws.com/api541/getallitems"
    )
    .then(function (apiData) {
      let items = JSON.parse(apiData.data);
      res.render("pages/items", { items: items });
    })
    .catch(function (error) {
      console.log(error);
    });
});

// get specific part details
app.get("/items/:itemId", function (req, res, next) {
  const itemId = req.params.itemId;
  axios
    .get(
      "https://4e050dbh1j.execute-api.us-east-1.amazonaws.com/api541/getitembyid",
      { params: { item_id: itemId } }
    )
    .then(function (apiData) {
      if (Object.entries(apiData.data).length === 0) {
        return res.render("pages/message", {
          message: "Error: Invalid Item ID",
        });
      }
      console.log(
        "api data : " + apiData.data + "  data item " + apiData.data.Item
      );
      items = [apiData.data];
      res.render("pages/parts", { items: JSON.parse(items) });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/addItem", function (req, res, next) {
  res.render("pages/addItem");
});

app.get("/editItem/:itemId", function (req, res, next) {
  const item_id = req.params.itemId;
  axios
    .get(
      "https://4e050dbh1j.execute-api.us-east-1.amazonaws.com/api541/getitembyid",
      { params: { item_id } }
    )
    .then(function (apiData) {
      if (apiData.data === "[]") {
        return res.render("pages/message", { message: "Invalid Item ID" });
      }
      item = JSON.parse(apiData.data);
      res.render("pages/editItem", { item: item[0] });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/items/addItem", (req, res) => {
  const item_id = parseInt(req.body.itemId);
  const item_name = req.body.itemName;
  const qty = parseInt(req.body.quantity);

  if (qty <= 0) {
    return res.render("pages/message", {
      message: "Error: Quantity cannot be zero or negative",
    });
  }

  axios
    .get(
      "https://4e050dbh1j.execute-api.us-east-1.amazonaws.com/api541/getitembyid",
      { params: { item_id: item_id } }
    )
    .then(function (apiData) {
      if (apiData.data === "[]") {
        axios
          .post(
            "https://1sevtevxgh.execute-api.us-east-1.amazonaws.com/api/createitem",
            { item_id: item_id, item_name: item_name, quantity: qty }
          )
          .then(function (apiData) {
            res.render("pages/message", { message: "Part Added Successfully" });
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        res.render("pages/message", {
          message: "Error: Item ID already exists. Try with a different one",
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/items/editItem", (req, res) => {
  const item_id = parseInt(req.body.itemId);
  const item_name = req.body.itemName;
  const quantity = parseInt(req.body.quantity);

  if (quantity <= 0) {
    return res.render("pages/message", {
      message: "Error: Quantity cannot be zero or negative",
    });
  }

  axios
    .put(
      "https://bojt5bx5j8.execute-api.us-east-1.amazonaws.com/api/updateitem",
      { item_id, quantity }
    )
    .then(function (apiData) {
      res.render("pages/message", { message: "Part Edited Successfully" });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/searchorder", (req, res) => {
  res.render("pages/searchorder");
});

app.get("/searchitem", (req, res) => {
  res.render("pages/searchitem");
});

app.post("/order/search", (req, res) => {
  axios
    .get(
      "https://3k0dt7hoaj.execute-api.us-east-1.amazonaws.com/Dev/getpartorders",
      { params: { jobName: req.body.jobName } }
    )
    .then(function (apiData) {
      if (Object.entries(apiData.data.Items).length === 0) {
        res.render("pages/message", { message: "Error: No such Job Exists" });
      } else {
        res.render("pages/orders.ejs", { orders: apiData.data.Items });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/item/search", (req, res) => {
  axios
    .get(
      "https://4e050dbh1j.execute-api.us-east-1.amazonaws.com/api541/getitembyid",
      { params: { item_id: req.body.itemId } }
    )

    .then(function (apiData) {
      if (apiData.data === "[]") {
        res.render("pages/message", { message: "Error: No such Job Exists" });
      } else {
        res.render("pages/items.ejs", { items: JSON.parse(apiData.data) });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

// listen on the port
app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
