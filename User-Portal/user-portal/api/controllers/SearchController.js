/**
 * SearchController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const axios = require('axios');

module.exports = {
  search: async function (req, res) {
    var packageName = req.body.jobName;
    console.log("pacjage name:"+packageName)
    let datetime = new Date().toISOString();
    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackagebypackagename', {
        params: {
          packageId: packageName
        }
    })
    .then(response => {
      itemDetails = JSON.parse(response.data);
      if (itemDetails.length === 0) {
          return res.view('pages/order', {
          result: 'failure',
          message: 'No such package exists'
        });
      }
      else {
        Search.create({packageId: packageName, date: datetime.slice(0,10), time: datetime.slice(11, 19)}).exec((err) => {
          if (err) {
            res.status(500).send("Database Error");
          }
          res.view('pages/parts', {items: itemDetails, packageId: packageName});
        });
      }
    })
    .catch(error => {
      console.log(error);
      res.view('pages/order', {
        result: 'failure',
        message: 'Error occurred while searching for job'
      });
    });
    // await Search.create({jobName: job, date: datetime.slice(0,10), time: datetime.slice(11, 19)}).intercept((err)=>{
    //   err.message = 'Uh oh: '+err.message;
    //   return res.status(400).send(err.message);
    // });
  },
};
