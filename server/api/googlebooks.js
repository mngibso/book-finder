const router = require('express').Router()
const get = require('lodash/get')
const axios = require('axios')
const convert = require('xml-js');
let lastCalledMS = Date.now()
const ThrottleMS = 1000

const _getISBN13 = (book) => {
  const identifiers = get(book, 'volumeInfo.industryIdentifiers',[])
  return identifiers.reduce((a, c) => {
    let isbn13 = ''
    if (c.type === 'ISBN_13') {
      isbn13 = c.identifier
    }
    return a + isbn13
  }, '')
}

const _toBook = (book) => {
  return {
    averageRating: get(book, 'volumeInfo.averageRating',''),
    ratingsCount: get(book, 'volumeInfo.averageRating',''),
    title:  get(book, 'volumeInfo.title',''),
    isbn13:  _getISBN13(book),
    authors:  get(book, 'volumeInfo.authors',[]),
  }
}

const _getUrl = (isbn13) => {
  const key = process.env.GOOGLE_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "GOOGLE_API_KEY" not defined in env')
  }
  return `https://www.googleapis.com/books/v1/volumes?q=isbn13:${isbn13}&key=${key}`
}

const _getBook = async (isbn13) => {
  const url = _getUrl(isbn13)
  console.log(`googlebooks getBook ${url}`)
  return axios.get(url)
  .then(gRes => {
    console.log(gRes.data)
    //const json = JSON.parse(convert.xml2json(gRes.data, {compact: true}))
    // res.json(json)
    const book = _toBook(get(gRes, 'data.items[0]', {}))
    console.log(`resolveBook`)
    console.log(book)
    return book
  })
  .catch(e => {
    console.log(e)
    reject(`Error: ${e.message || e}`);
  })
}

const _getSimilarBooks = (url, res) => {
  console.log('_getSimilarBooks ' + url)
  return function() {
    const d = Date.now()
    console.log('call _getSimilarBooks function ' + url)
    console.log(`--Called ${d}`)
    let book
  axios.get(url)
    .then(gRes => {
      // console.log(gRes.data)
      const json = JSON.parse(convert.xml2json(gRes.data, {compact: true}))
      // res.json(json)
      const sims = _toSimilars(get(json,'GoodreadsResponse.book.similar_books.book',[]))
      book = _toBook(get(json, 'GoodreadsResponse.book', {}))
      const similarPromises = sims.filter(b => b.isbn13).map( b => _getBook(b.isbn13))
      // const similarPromises = sims.map( (b) => {
        // return _getBook(b.isbn13)
      // } )
      return Promise.all(similarPromises)
      // .then( s => {
        // res.json( {
          // book,
          // similars
        // })
      // })
      })
      .then(similars => {
        console.log('then values')
        console.log(similars)
        console.log('book')
        console.log(book)
        res.json( {
          book,
          similars
        })
        console.log('then values')
      })
    .catch(e => {
      console.log('ERRROR!!!')
      console.log(e)
      return res.status(500).json(`Error: ${e.message || e}`);
    })
    .finally( () => {
      console.log('finally')
    })
  }
}

/**
 * Allow fn to be called no more than every `ThrottleMS` milliseconds
 * @param fn - function to be called
 * @private
 */
const _throttleCall = (fn) => {
  const now = Date.now()
  const diff = now - lastCalledMS
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

}

// Get similar books to isbn13 book
router.route('/isbn/:isbn13').get( async (req, res) => {
  const isbn13 = req.params.isbn13
  if(!isbn13) {
    return res.status(400).json('Error: required isbn13 not contained in request');
  }
  try {
    const b = await _getBook(isbn13)
    res.json(b)
  } catch (e) {
    return res.status(500).json(`Error: ${e.message || e}`);
  }
});

module.exports = router
