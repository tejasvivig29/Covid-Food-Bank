const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

// homepage 
app.get('/', function(req, res) {
    res.render('pages/homepage');
});

app.get('/API735/getPackages', function(req, res) {
    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackages')
        .then(function (response) {
            //console.log(response);
            let allJobs = response.data.Items;
            let jobsArr = [];
            allJobs = allJobs.filter(job => {
                if (jobsArr.includes(job.jobId)) {
                    return false;
                } else {
                    jobsArr.push(job.jobId);
                    return true;
                }
            });
            console.log(allJobs);
            res.send(allJobs);
        })
        .catch(function (error) {
            console.log(error);
            res.status(400).send('Error in fetching jobs');
        });
});

app.post('/deleteData/:packageId/:itemId', function(req, res) {
    const packageId = req.params.packageId;
    const itemId = req.params.itemId;

    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackageinfo', {
        params: {
            packageId: packageId,
            itemId: itemId
        }
    })
    .then(function(response) {
        let job = JSON.parse(response.data);
        if (Object.keys(job).length === 0 && job.constructor === Object) {
            return res.send(`Package not found for deletion`);
        } else {
            axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/deletepackage', {
                packageId: packageId,
                itemId: itemId    
            })
            .then(function(response) {

                if (response) {
                    console.log("dfg");
                    return res.redirect('/viewData');
                } else {
                    return res.status(400).send(`Error in deleting package`);
                }
            })
            .catch(function(error) {
                console.log(error);
                return res.status(400).send('Error in deleting package')
            });
        }
    })
    .catch(function (error) {
        console.log(error);
        return res.status(400).send('Error in fetching package and item');
    });
});


app.post('/editPackage/:packageId/:itemId', function(req, res) {
    const packageId = req.params.packageId;
    const itemId = req.params.itemId;

    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackageinfo', {
        params: {
            packageId: packageId,
            itemId: itemId
        }
    })
    .then(function(response) {
        let job = response.data;
        //Check for empty object
        if (Object.keys(job).length === 0 && job.constructor === Object) {
            return res.status(404).send(`Package not found...`);
        } else {
            res.render('pages/edit', {packageId: packageId, itemId: itemId});
        }
    })
    .catch(function (error) {
        console.log(error);
        res.status(400).send('Error in fetching Package and item');
    });
});

app.post('/updateData/:packageId/:itemId', function(req, res) {
    const packageId = req.params.packageId;
    const itemId = req.params.itemId;
    const qty=parseInt(req.body.qty);

    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackageinfo', {
        params: {
            packageId: packageId,
            itemId: itemId
        }
    })
    .then(function (response) {
        console.log(response);
        let job = JSON.parse(response.data);
        //Check for empty object
        if (Object.keys(job).length === 0 && job.constructor === Object) {
            return res.status(404).send(`Job with given packageId:${packageId} and itemId:${itemId} does not exist`);
        } else {
            axios.put('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/updatepackage', {
                packageId: packageId,
                itemId: itemId,
                qty: qty
            })
            .then(function(response) {
                if (response) {
                    return res.redirect('/viewData');
                } else {
                    return res.status (404).send(`Error in updating package`);
                }
            })
            .catch(function(error) {
                console.log(error);
                return res.status(400).send('Error in updating package');
            });
        }
    })
    .catch(function (error) {
        console.log(error);
        res.status(400).send('Error in fetching package and item');
    });
});

//not tested for empty jobs table
app.get('/viewData', function(req, res) {
    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackages')
        .then(function (response) {
            //console.log(response);
            let packages735 = JSON.parse(response.data);
            console.log(packages735);
            //Check for empty object
            if (Object.keys(packages735).length === 0 && packages735.constructor === Object) {
                res.send('Cannot find anything to show!');
            } else {
                res.render('pages/viewData', {packages735});
            }
        })
        .catch(function (error) {
            console.log(error);
            res.status(400).send('Error in fetching jobs');
        });
});

app.get('/addData', function(req, res) {
    res.render('pages/addData');
});

app.post('/addData', function(req, res) {
    const packageId = req.body.packageId;
    const itemId = req.body.itemId;
    const qty = parseInt(req.body.qty);

    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackageinfo', {
        params: {
            packageId: packageId,
            itemId: itemId
        }
    })
    .then(function(response) {
        let package = JSON.parse(response.data);
        console.log(package);
        //Check for empty object
        if (package.length !== 0) {
            return res.status(400).send(`Package with given packageId:${packageId} and itemId:${itemId} already exists`);
        } else {

            axios.get('https://ulg6sx1952.execute-api.us-east-1.amazonaws.com/api541/getitembyname', {
                params: {
                    item_name: itemId
                }
            })
            .then(function(response) {
                let itemDetail = JSON.parse(response.data);
                console.log(itemDetail);

                if (itemDetail.length === 0 ) {
                    return res.status(404).send(`Given item:${itemId} is not valid`);
                } else {
                    axios.post('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/createpackage', {
                        packageId: packageId,
                        itemId: itemId,
                        qty: qty
                    })
                    .then(function(response) {
                       // console.log(response);
                        if (response) {
                            // return res.send(`New job with jobId:${jobId} and partId:${partId} created successfully`);
                            return res.redirect('/viewData');
                        } else {

                            return res.status(400).send(`Error in creating package`);
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                        return res.status(400).send(`Error in creating package`);
                    });
                }
            })
            .catch(function(error) {
                // console.log(error);
                return res.status(400).send('Error in fetching part details');
            });
        }
    })
    .catch(function(error) {
        console.log(error);
        res.status(400).send('Error in fetching job details');
    });
});

app.get('/searchPackages', function(req, res) {
    res.render('pages/searchPackages');
});

app.post('/searchOrders', function(req, res) {
    const packageId = req.body.packageId;
    console.log("PackageId: "+packageId);

    axios.get('https://s7wobsx2wf.execute-api.us-east-1.amazonaws.com/Dev/getpackagebypackagename', {
        params: {
            packageId: packageId
        }
    })
    .then(function(response) {
        console.log(response);
        let orders = JSON.parse(response.data);
        //Check for empty object
        if (orders.Count === 0) {
            return res.send(`No packages for given packageName:${packageId} found`);
        } else {
            console.log(orders);
            return res.render('pages/ordersInfo', {packages735: orders});
        }
    })
    .catch(function(error) {
        console.log(error);
        res.status(400).send('Error in searching for package');
    });
});

app.listen(3000, function () {
    console.log('Listening on port 3000');
});