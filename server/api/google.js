const router = require('express').Router()
const get = require('lodash/get')
const axios = require('axios')
const convert = require('xml-js');
let lastCalledMS = Date.now()
const ThrottleMS = 1000

/*
   "GoodreadsResponse.book.image_url._text": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1441739388l/25990773._SX98_.jpg",
   "GoodreadsResponse.book.average_rating._text": "4.57",
   "GoodreadsResponse.book.ratings_count._cdata": "199",
   "GoodreadsResponse.book.authors.author.name._text": "Anthony Dorrer",
   "GoodreadsResponse.book.url._cdata": "https://www.goodreads.com/book/show/25990773-the-nightingale",

 */
const _toAuthors = (authors) => {
  if(!Array.isArray(authors)) {
    authors = [authors]
  }
  return authors.map( a => {
    return {
      name: get(a, 'author.name._text', '')
    }
  })
}

const _toBook = (book) => {
  return {
    thumbnail: get(book, 'image_url._text','') || get(book, 'image_url._cdata','') ,
    averageRating: get(book, 'average_rating._text','') || get(book, 'average_rating._cdata',''),
    ratingsCount: get(book, 'ratings_count._text','') || get(book, 'ratings_count._cdata',''),
    link: get(book, 'link._cdata','') || get(book, 'link._text',''),
    title:  get(book, 'title._text','') || get(book, 'title._cdata',''),
    isbn13:  get(book, 'isbn13._text','') || get(book, 'isbn13._cdata',''),
    authors: _toAuthors(get(book, 'authors', []))
  }
}

const _getUrl = (isbn13) => {
  const key = process.env.GOODREADS_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "GOODREADS_API_KEY" not defined in env')
  }
  return `https://www.goodreads.com/book/isbn/${isbn13}?key=${key}`
}

const _toSimilars = (books) => {
  return books.map( b => _toBook(b))
}

const _getBook = (isbn13) => {
  const url = _getUrl(isbn13)
  console.log('_getBook ' + url)
  return new Promise( (resolve, reject) => {
    _throttleCall(() => {
      const d = Date.now()
      console.log('call _getBook function ' + url)
      console.log(`--Call ${d}`)
      axios.get(url)
      .then(gRes => {
        //console.log(gRes.data)
        const json = JSON.parse(convert.xml2json(gRes.data, {compact: true}))
        // res.json(json)
        const book = _toBook(get(json, 'GoodreadsResponse.book', {}))
        console.log(`resolveBook`)
        console.log(book)
        resolve(book)
      })
      .catch(e => {
        console.log(e)
        reject(`Error: ${e.message || e}`);
      })
    })
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
router.route('/isbn/:isbn13').get((req, res) => {
  const isbn13 = req.params.isbn13
  let url
  try {
    url = _getUrl(isbn13)
  } catch (e) {
    return res.status(500).json('Error: required "GOODREADS_API_KEY" not defined in env');
  }
  const fn = _getSimilarBooks(url,res)
  _throttleCall(fn)

  /*
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

   */
});

module.exports = router
