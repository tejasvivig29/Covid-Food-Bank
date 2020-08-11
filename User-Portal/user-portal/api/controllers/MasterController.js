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

  myorders: async function(req, res) {
    if(!req.session.userId) return res.redirect('/login');
    let myorders = await Orders.find({
      userId: req.session.userId,
      result: true
    }).intercept((err) => {
      err.message = 'Uh oh: '+err.message;
      return res.status(400).send(err.message);
    });
    return res.view('pages/myorders', {orders: myorders});
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
    let itemOrders = [];
    let itemOrdersX = [], itemOrdersY = [];

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
      itemOrdersX.push({
        packageName: postData.packageId,
        userId: username,
        itemId: element.itemId,
        qty: parseInt(element.qty),
      });
      itemOrdersY.push({
        packageName: postData.packageId,
        userId: username,
        itemId: element.itemId,
        qty: element.qty,
      });
    });

    let trxnDetailX = {
      xaid: 1,
      orders: itemOrdersX
    };
    console.log("Order sent to X: ");
    console.log(trxnDetailX);
    let trxnDetailY = {
      xaid: "1",
      orders: itemOrdersY
    };
    console.log("Order sent to Y: ");
    console.log(trxnDetailY);

    let phase2successX = { xaid: 1, status: "true" }, phase2failureX = { xaid: 1, status: "false" };
    let phase2successY = { xaid: "1", status: "True" }, phase2failureY = { xaid: "1", status: "False" };

    axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/createorder', trxnDetailX)
    .then(response => {

        if(response.data == "Success") {
            console.log("X successful with phase 1");
            axios.post('https://zl1tn7nsl8.execute-api.us-east-1.amazonaws.com/api541/updateorders', trxnDetailY)
            .then(response => {

                if(response.data == 200) {
                    console.log("Y successful with phase 1");
                    axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/commitorder', phase2successX)
                    .then(response => {
                        
                        if(response.data == "Success") {
                            console.log("X successful with phase 2");
                            axios.post('https://35dz539u31.execute-api.us-east-1.amazonaws.com/api541/commitorders', phase2successY)
                            .then(response => {

                                if(response.data == 0) {
                                    console.log("Y successful with phase 2");
                                    
                                    //write to our db
                                    let datetime = new Date().toISOString();
                                    postData.tableData.forEach(element => {
                                      partOrders.push({
                                        packageName: postData.packageId,
                                        userId: username,
                                        itemId: element.partId,
                                        qty: parseInt(element.qty),
                                        date: datetime.slice(0,10),
                                        time: datetime.slice(11,19),
                                        result: true
                                      });
                                    });
                                    let orders = Orders.createEach(partOrders).fetch().intercept((err) => {
                                      err.message = 'Uh oh: '+err.message;
                                      return res.status(400).send(err.message);
                                    });

                                    console.log("order rows pushed: " + orders.length);

                                    return res.view('pages/order', {
                                      result: 'success',
                                      message: 'Order Placed Successfully!'
                                    });
                                }
                                else {
                                    // Y failed with phase 2
                                }
                            })
                            .catch(error => {
                                console.log(error);
                            });
                        }

                        else {
                          console.log("X failed during phase 2");
                          axios.post('https://35dz539u31.execute-api.us-east-1.amazonaws.com/api541/commitorders', phase2failureY)
                            .then(response => {
                              console.log("Y rollback response");
                            })
                            .catch(error => {
                                console.log(error);
                            });
                        }
                    })
                    .catch(error => {
                        console.log(error);
                        res.view('pages/order', {
                          result: 'failure',
                          message: 'An error occurred while sending order details to Package management company'
                        });
                    });
                }

                else if(response.data == 404) {
                    console.log("Y failed during phase 1 due to insufficient quantities");
                    axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/commitorder', phase2failureX)
                    .then(response => {
                        console.log("X rollback successful");
                    })
                    .catch(error => {
                        console.log(error);
                    });

                    axios.post('https://35dz539u31.execute-api.us-east-1.amazonaws.com/api541/commitorders', phase2failureY)
                    .then(response => {
                        console.log("Y rollback successful");
                    })
                    .catch(error => {
                        console.log(error);
                    });

                    return res.view('pages/order', {
                      result: 'failure',
                      message: 'Could not place order due to insufficient quantities in the inventory'
                    });
                }

            })
            .catch(error => {
                console.log(error);
                res.view('pages/order', {
                  result: 'failure',
                  message: 'An error occurred while sending order details to Inventory management company'
                });
            });
        }

        else if(response.data == null) {
          console.log("X failed during phase 1");
          axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/commitorder', phase2failureX)
          .then(response => {
              console.log("X rollback successful");
          })
          .catch(error => {
              console.log(error);
          });
        }
    })
    .catch(error => {
        console.log(error);
        return res.view('pages/order', {
          result: 'failure',
          message: 'An error occurred while sending order details to Package management company'
        });
    });

    res.view('pages/order', {
      result: 'failure',
      message: 'An error has occurred'
    });
    // res.send("Hello");

    // axios.post('https://35dz539u31.execute-api.us-east-1.amazonaws.com/api541/commitorders', phase2successY)
    // .then(response => {

    // })
    // .catch(error => {

    // });

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
