const router = require('express').Router()
const axios = require('axios')
const throttle = require('lodash/throttle')
const convert = require('xml-js');
let lastCalledMS = Date.now()
const ThrottleMS = 1000

const _getSimilarBooks = (url, res) => {
  console.log('_getSimilarBooks ' + url)
  return function() {
    const d = Date.now()
    console.log('call _getSimilarBooks function ' + url)
    console.log(`--Called ${d}`)
  axios.get(url)
    .then(gRes => {
      const json = convert.xml2json(gRes.data, {compact: true});
      res.json(json)
    })
    .catch(e => {
      console.log('ERRROR!!!')
      console.log(e)
      return res.status(500).json(`Error: ${e.message || e}`);
    })
    .finally( () => {
    })
  }
}

// Get similar books to isbn13 book
router.route('/:isbn13').get((req, res) => {
  const isbn13 = req.params.isbn13
  const key = process.env.GOODREADS_API_KEY || null;
  if (key === null) {
    return res.status(500).json('Error: required "GOODREADS_API_KEY" not defined in env');
  }
  const url = `https://www.goodreads.com/book/isbn/${isbn13}?key=${key}`
  const now = Date.now()
  const diff = now - lastCalledMS
  const fn = _getSimilarBooks(url,res)
  console.log(`LCMS ${lastCalledMS}, ${now}, ${diff}`)
  // if the time since the last call is > throttle time
  if(diff > ThrottleMS) {
    lastCalledMS = now
    fn()
    return
  }
  const waitTimeMS = ThrottleMS - diff
  lastCalledMS = now + waitTimeMS
  setTimeout( fn, ThrottleMS - diff + 50 )

  //throttle(
    //_getSimilarBooks(url, res)
  //, 13000, { 'trailing': false })()


      // Exercise.findById(req.params.isbn13)
    // .then(exercise => res.json(exercise))
    // .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router
