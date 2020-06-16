/*
 * TBD - Need sales to use amazon's api.  This is a placeholder for now.
 * See https://github.com/jorgerosal/amazon-paapi
 */
/*
const router = require('express').Router()
const amazonPaapi = require('amazon-paapi');
const get = require('lodash/get')
const axios = require('axios')
const convert = require('xml-js');
let lastCalledMS = Date.now()
// Amazon calls are throttled to run only every second
const ThrottleMS = 1000



const commonParameters = {
  'AccessKey' : '<YOUR  ACCESS  KEY>',
  'SecretKey' : '<YOUR  SECRET  KEY>',
  'PartnerTag' : '<YOUR  PARTNER  TAG>', // yourtag-20
  'PartnerType': 'Associates', // Optional. Default value is Associates.
  'Marketplace': 'www.amazon.com' // Optional. Default value is US.
};

const requestParameters = {
  'ItemIds' : ['B00X4WHP5E', 'B00ZV9RDKK'],
  'ItemIdType': 'ASIN',
  'Condition' : 'New',
  'Resources' : [
    'Images.Primary.Medium',
    'ItemInfo.Title',
    'Offers.Listings.Price'
  ]
};

amazonPaapi.GetItems(commonParameters, requestParameters)
.then(data => {
  // do something with the success response.
  console.log(data);
})
.catch(error => {
  // catch an error.
  console.log(error)
});

// Get similar books to title book
router.route('/title/:title').get((req, res) => {
  const title = req.params.title
  let url
  try {
    url = _getTitleUrl(title)
  } catch (e) {
    return res.status(500).json('Error: required "GOODREADS_API_KEY" not defined in env');
  }
  const fn = _getSimilarBooks(url,res)
  _throttleCall(fn)
});

module.exports = router
*/
