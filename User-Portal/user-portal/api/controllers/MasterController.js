/**
 * MasterController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const axios = require('axios');
const bcrypt = require("bcrypt");

module.exports = {

  login: async function (req, res) {

    const saltRounds = 10;
    const plainTextPassword = req.body.password;

      var job = await Users.findOne({id:req.body.username}).intercept((err)=>{
          err.message = 'Uh oh: '+err.message;
          return res.status(400).send(err.message);
        });
        if(job === undefined){
          res.status(404).send('Invalid Credentials');
        }
        else{
          bcrypt
            .compare(plainTextPassword, job.password)
            .then(result => {
              if (result == true){
                req.session.userId = req.body.username;
                return res.status(200).send('Valid Credentials');
              }
              else{
                return res.status(404).send('Invalid Credentials');
              }
            })
            .catch(err => console.error(err.message));

        }
  },

  logout: async function (req, res) {
    if(!req.session.userId) return res.redirect('/');
    req.session.userId = null;
    return res.redirect('/');
  },

  homepage: async function (req, res) {
    if(!req.session.userId) return res.redirect('/login');
    return res.view('pages/homepage');
  },

  list: function(req, res) {
    if(!req.session.userId) return res.redirect('/login');
    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getdistinctpackages')
    .then(response => {
      // console.log(response);
      let allPackages = JSON.parse(response.data);
      // let jobsArr = [];
      // allPackages = allPackages.filter(job => {
      //     if (jobsArr.includes(job.jobId)) {
      //         return false;
      //     } else {
      //         jobsArr.push(job.jobId);
      //         return true;
      //     }
      // });
      // console.log(allJobs);
      res.view('pages/list', {packages: allPackages});
    })
    .catch(error => {
      console.log(error);
      res.view('pages/order', {
        result: 'failure',
        message: 'Error in fetching jobs'
      });
    });
  },

  parts: function(req, res) {
    if(!req.session.userId) return res.redirect('/login');
    let packageName = req.params.jobName;

    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackagebypackagename', {
        params: {
            packageId: packageName
        }
    })
    .then(response => {
      itemDetails = JSON.parse(response.data);
      if (itemDetails.length === 0) {
        return res.status(404).send(`Package with given name:${packageId} not found...`)
      }
      else {
        // let partIds = [];
        // console.log(response.data);
        // response.data.Items.forEach(part => {
        //   partIds.push(parseInt(part.partId));
        // });

        // let parts = {partId: partIds};
        // console.log(parts);
        // let jobDetails = response.data.Items;

        // axios.post('https://5fhqcifq9d.execute-api.us-east-1.amazonaws.com/Dev/getspecificpartdetailsforjob', parts)
        //   .then(response => {
        //     console.log(response.data);
        //     let partDetails = response.data;
            res.view('pages/parts', {items: itemDetails, packageId: packageName});
          // })
          // .catch(error => {
          //   console.log(error);
          //   res.view('pages/order', {
          //     result: 'failure',
          //     message: 'Error in fetching parts'
          //   });
          // });
      }
    })
    .catch(error => {
      console.log(error);
      res.view('pages/order', {
        result: 'failure',
        message: 'Error in fetching job details'
      });
    });
  },

  validate: async function (req, res) {
    var job = await Users.findOne({id:req.body.username, password:req.body.password}).intercept((err)=>{
      err.message = 'Uh oh: '+err.message;
      return res.status(400).send(err.message);
    });
    if(job === undefined){
      res.status(404).send('Invalid Credentials');
      // res.view('pages/order', {message: 'Invalid Credentials'});
    }
    else{
      res.status(200).send('Valid Credentials');
      // res.view('pages/order', {message: 'Order Successful'});
    }
  },

  validateOrder: async function (req, res) {
    if(!req.session.userId) return res.redirect('/login');
    console.log(req.body);
    let username = req.session.userId;
    let postData = JSON.parse(req.body.parts);
    let partOrders = [];
    let itemOrders = [];

    let existingOrders = await Orders.find({
      packageId: postData.packageId,
      userId: username,
      result: true
    }).intercept((err) => {
      err.message = 'Uh oh: '+err.message;
      return res.status(400).send(err.message);
    });
    console.log(existingOrders);
    if (existingOrders.length > 0) {
        return res.view('pages/order', {
          result: 'failure',
          message: 'Sorry, we are allowing ordering of only one package per user'
        });
    }
    
    postData.tableData.forEach(element => {
      itemOrders.push({
        packageName: postData.packageId,
        userId: username,
        itemId: element.itemId,
        qty: parseInt(element.qty),
      });
    });

    let trxnDetail = {
      xaid: 1,
      orders: itemOrders
    };

    axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/createorder', trxnDetail)
    .then(response => {
        console.log("=================Company X success begin===================");
        // console.log(response);

        if(response.status === 200 && response.data === "Success") {
          console.log("yes, its successful!");

          axios.post('https://zl1tn7nsl8.execute-api.us-east-1.amazonaws.com/api541/updateorders', trxnDetail)
          .then(response => {
            console.log("=================Company Y success begin===================");
            console.log(response);
            console.log("=================Company Y success end===================");
          })
          .catch(error => {
            console.log("=================Company Y failed begin===================");
            console.log(error);
            console.log("=================Company Y failed end===================");
          });
        }

        
        console.log("=================Company X success end===================");
    })
    .catch(error => {
        console.log("=================Company X failed begin===================");
        console.log(error);
        console.log("=================Company X failed end===================");
    });
    res.send("Hello");

    //let orderSuccess = postData.tableData.every(element => parseInt(element.qoh) >= parseInt(element.qty));

    /*let datetime = new Date().toISOString();
    postData.tableData.forEach(element => {
      partOrders.push({
        jobName: postData.jobName,
        userId: username,
        partId: parseInt(element.partId),
        qty: parseInt(element.qty),
        date: datetime.slice(0,10),
        time: datetime.slice(11,19),
        result: orderSuccess
      });
    });

    let orders = await Orders.createEach(partOrders).fetch().intercept((err) => {
      err.message = 'Uh oh: '+err.message;
      return res.status(400).send(err.message);
    });

    console.log("order rows: " + orders.length);

    if (orderSuccess === true) {
      console.log({partOrders});

      //Inform company X about the successful order
      axios.post('https://eg1mx8iu96.execute-api.us-east-1.amazonaws.com/Dev/createPartsOrder', partOrders)
        .then(response => {
          console.log("=================Company X success begin===================");
          console.log(response);
          console.log("=================Company X success end===================");
        })
        .catch(error => {
          console.log("=================Company X failed begin===================");
          console.log(error);
          console.log("=================Company X failed end===================");
        });

      //Inform company Y about the successful order
      axios.post('https://ftwpcpljwe.execute-api.us-east-1.amazonaws.com/Dev/updatepartorders', partOrders)
        .then(response => {
          console.log("=================Company Y success begin===================");
          console.log(response);
          console.log("=================Company Y success end===================");
        })
        .catch(error => {
          console.log("=================Company Y failed begin===================");
          console.log(error);
          console.log("=================Company Y failed end===================");
        });

      res.view('pages/order', {
        result: 'success',
        message: 'Order Placed Successfully!'
      });
      // res.status(200).send("Order Placed Successfully!");
    } else {
      res.view('pages/order', {
        result: 'failure',
        message: 'Sorry, order could not be placed due to unavailability of parts :('
      });
      // res.status(400).send("Sorry, order could not be placed due to unavailability of parts");
    }*/
  }
};
