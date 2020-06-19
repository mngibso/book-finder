const router = require('express').Router()
const get = require('lodash/get')
const axios = require('axios')
const convert = require('xml-js');
let lastCalledMS = Date.now()
// Goodreads calls are throttled to run only every second
const ThrottleMS = 1000

/**
 * return authors as an array of strings
 * @param {Object[]} authors - authors from goodreads book
 * @return {string[]} array of author names
 * @private
 */
const _toAuthors = (authors) => {
  if(!Array.isArray(authors)) {
    authors = [authors]
  }
  const author = []
  for (const auth of authors) {
    const auth2 = get(auth,'author',null)
    if (Array.isArray(auth2)) {
      for (const a of auth2) {
        const role = get(a, 'role._text', null)
        // if there's no role, it's the author
        if(!role) {
          author.push(get(a, 'name._text'))
        }
      }
    } else {
      author.push(get(auth, 'author.name._text'))
    }
  }
  return author
}

/**
 * Return a more useful book representation given a goodreads book.
 * @param {Object} book - A book representation returned from goodreads call
 * @return {{thumbnail: *, subTitle: *, averageRating: *, isbn13: *, link: *, ratingsCount: *, id: *, title: *, authors: []}} book representation
 * @private
 */
const _toBook = (book) => {
  const title = get(book, 'title_without_series._text','')
    || get(book, 'title_without_series._cdata','')
    || get(book, 'title._text','')
    || get(book, 'title._cdata','')
  const authors = _toAuthors(get(book, 'authors', []))
  return {
    id: get(book,'id._text', '') || get(book,'id._cdata', '') ,
    thumbnail: get(book, 'image_url._text','') || get(book, 'image_url._cdata','') ,
    averageRating: get(book, 'average_rating._text','') || get(book, 'average_rating._cdata',''),
    ratingsCount: get(book, 'ratings_count._text','') || get(book, 'ratings_count._cdata',''),
    link: get(book, 'link._cdata','') || get(book, 'link._text',''),
    title,
    subTitle:  get(book, 'subTitle._text','') || get(book, 'subTitle._cdata',''),
    isbn13:  get(book, 'isbn13._text','') || get(book, 'isbn13._cdata',''),
    authors: authors
  }
}

/**
 * Return an api url to get book by isbn13
 * @param {string} isbn13 - book identifier
 * @return {string} goodreads api url
 * @private
 */
const _getUrl = (isbn13) => {
  const key = process.env.GOODREADS_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "GOODREADS_API_KEY" not defined in env')
  }
  return `https://www.goodreads.com/book/isbn/${isbn13}?key=${key}`
}

/**
 * Return an api url to get book by title
 * @param {string} title book title
 * @return {string} goodreads api url
 * @private
 */
const _getTitleUrl = (title) => {
  const key = process.env.GOODREADS_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "GOODREADS_API_KEY" not defined in env')
  }
  return `https://www.goodreads.com/book/title?key=${key}&title=${encodeURIComponent(title)}`
}

/**
 * Return an api url to get book by goodreads id
 * @param {string} id goodreads book identifier
 * @return {string} goodreads api url
 * @private
 */
const _getIdUrl = (id) => {
  const key = process.env.GOODREADS_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "GOODREADS_API_KEY" not defined in env')
  }
  // https://www.goodreads.com/book/show/10210?key=...
  return `https://www.goodreads.com/book/show/${id}?key=${key}`
}


/**
 * Convert array of GR books to a simpler structure
 * @param {Object[]} books returned by GR api call
 * @return {Object[]} array of book representations
 * @private
 */
const _toSimilars = (books) => {
  return books.map( b => _toBook(b))
}

/**
 * Call the GR api to get a book
 * @param {string} url - api url
 * @return {Promise<unknown>} promise to return a book from GR
 * @private
 */
const _getBook = (url) => {
  if(!url) {
    throw "No url for _getBook call"
  }
  return new Promise( (resolve, reject) => {
    _throttleCall(() => {
      const d = Date.now()
      axios.get(url)
      .then(gRes => {
        const json = JSON.parse(convert.xml2json(gRes.data, {compact: true}))
        const book = _toBook(get(json, 'GoodreadsResponse.book', {}))
        resolve(book)
      })
      .catch(e => {
        console.error(e)
        reject(`Error: ${e.message || e}`);
      })
    })
  })
}

/**
 * Return a function to get get an array of books similar to that obtained by the url
 * @param {string} url - api url
 * @param {Object} res - response object
 * @return {function(...[*]=)} a function that uses GR api to obtain books
 * @private
 */
const _getSimilarBooks = (url, res) => {
  return function() {
    const d = Date.now()
    let book
    axios.get(url)
    .then(gRes => {
      const json = JSON.parse(convert.xml2json(gRes.data, {compact: true}))
      // res.json(json)
      const similars = _toSimilars(get(json,'GoodreadsResponse.book.similar_books.book',[]))
      book = _toBook(get(json, 'GoodreadsResponse.book', {}))
      // const similarPromises = sims.filter(b => b.id).map( b => _getBook(_getIdUrl(b.id)))
      // return Promise.all(similarPromises)
      res.json( {
        book,
        similars
      })
    })
    // .then(similars => {
      // res.json( {
        // book,
        // similars
      // })
    // })
    .catch(e => {
      console.error(e)
      return res.status(500).json(`Error: ${e.message || e}`);
    })
  }
}

/**
 * Any function that takes no parameters
 * @name AnyFunction
 * @function
 */

/**
 * Allow fn to be called no more than every `ThrottleMS` milliseconds
 * @param {AnyFunction} fn - function to be called
 * @return {undefined}
 * @private
 */
const _throttleCall = (fn) => {
  const now = Date.now()
  const diff = now - lastCalledMS
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

// Get similar books to title book
router.route('/gid/:id').get((req, res) => {
  const id = req.params.id
  let url
  try {
    url = _getIdUrl(id)
  } catch (e) {
    return res.status(500).json('Error: required "GOODREADS_API_KEY" not defined in env');
  }
  _getBook(url)
  .then(book => {
    return res.json( {
      book
    })
  })
});

module.exports = router
