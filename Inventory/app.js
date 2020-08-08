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
      res.render("pages/parts", { parts: items });
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

app.get("/addpart", function (req, res, next) {
  res.render("pages/addpart");
});

app.get("/editpart/:partId", function (req, res, next) {
  const partId = req.params.partId;
  axios
    .get(
      "https://zy9pj7prqf.execute-api.us-east-1.amazonaws.com/Dev/getspecificpartdetails",
      { params: { partId: partId } }
    )
    .then(function (apiData) {
      if (Object.entries(apiData.data).length === 0) {
        return res.render("pages/message", { message: "Invalid part ID" });
      }
      part = apiData.data.Item;
      res.render("pages/editpart", { part: part });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/parts/addpart", (req, res) => {
  const partId = parseInt(req.body.partId);
  const partName = req.body.partName;
  const qoh = parseInt(req.body.qoh);

  if (qoh <= 0) {
    return res.render("pages/message", {
      message: "Error: Quantity cannot be zero or negative",
    });
  }

  axios
    .get(
      "https://zy9pj7prqf.execute-api.us-east-1.amazonaws.com/Dev/getspecificpartdetails",
      { params: { partId: partId } }
    )
    .then(function (apiData) {
      if (Object.entries(apiData.data).length === 0) {
        axios
          .post(
            "https://msd18j9s0f.execute-api.us-east-1.amazonaws.com/Dev/savenewpartdetails",
            { partId: partId, partName: partName, qoh: qoh }
          )
          .then(function (apiData) {
            res.render("pages/message", { message: "Part Added Successfully" });
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        res.render("pages/message", {
          message: "Error: Part ID already exists. Try with a different one",
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/parts/editpart", (req, res) => {
  const partId = parseInt(req.body.partId);
  const partName = req.body.partName;
  const qoh = parseInt(req.body.qoh);

  if (qoh <= 0) {
    return res.render("pages/message", {
      message: "Error: Quantity cannot be zero or negative",
    });
  }

  axios
    .put(
      "https://6mrwuwx6t1.execute-api.us-east-1.amazonaws.com/Dev/updatepartdetails",
      { partId: partId, partName: partName, qoh: qoh }
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
      { params: { itemId: req.body.itemId } }
    )

    .then(function (apiData) {
      if (Object.entries(apiData.data).length === 0) {
        res.render("pages/message", { message: "Error: No such Job Exists" });
      } else {
        res.render("pages/parts.ejs", { items: apiData.data });
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
