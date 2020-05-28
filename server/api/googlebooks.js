const router = require('express').Router()
const get = require('lodash/get')
const axios = require('axios')

/**
 * extract the isbn13 from a google book
 * @param {Object} book
 * @return {string} isbn13
 * @private
 */
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

/**
 * simplify book format
 * @param {Object} book
 * @return {{averageRating: *, isbn13: string, link: *, ratingsCount: *, title: *, authors: *}}
 * @private
 */
const _toBook = (book) => {
  return {
    averageRating: get(book, 'volumeInfo.averageRating',''),
    ratingsCount: get(book, 'volumeInfo.ratingsCount',''),
    title:  get(book, 'volumeInfo.title',''),
    isbn13:  _getISBN13(book),
    authors:  get(book, 'volumeInfo.authors',[]),
    link:  get(book, 'volumeInfo.infoLink',''),
    thumbnail:  get(book, 'volumeInfo.imageLinks.smallThumbnail',''),
  }
}

/**
 * return a googlebooks api url
 * @param {string} title
 * @param {string} author
 * @return {string} url
 * @private
 */
const _getUrl = (title, author) => {
  const key = process.env.GOOGLE_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "GOOGLE_API_KEY" not defined in env')
  }
  let q = `title:${encodeURIComponent(title)}`
  if (author) {
    const q2 = ` and authors:${author}`
    q += encodeURIComponent(q2)
  }
  let url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=40&key=${key}`
  return url
}


// sort books descending by ratings count
const _sortBooksFn = (b1, b2) => {
  let r1 = parseInt(get(b1, 'volumeInfo.ratingsCount','-1'))
  if (isNaN(r1)) {
    r1 = -1
  }
  let r2 = parseInt(get(b2, 'volumeInfo.ratingsCount','-1'))
  if (isNaN(r2)) {
    r2 = -1
  }
  // sort descending
  if (r1 < r2) {
    return 1
  }
  if (r1 > r2) {
    return -1
  }
  return 0
}

/**
 * googlebooks api can return multiple books.  Find and return the best fit
 * @param {string} url
 * @param {string} title
 * @return {Promise<AxiosResponse<any>>}
 * @private
 */
const _getBook = async (url, title) => {
  return axios.get(url)
  .then(gRes => {
    const books = get(gRes,'data.items', [])
    .filter( b => {
      const t = get(b, 'volumeInfo.title','').toLowerCase()
      if (!t.length) return false
      if(t.length < title.length) {
        return title.toLowerCase().includes(t.toLowerCase())
      }
      return t.toLowerCase().includes(title.toLowerCase())
    })
    if (!books.length) {
      return {}
    }
    books.sort(_sortBooksFn)
    return _toBook(books[0])
  })
}

// get googlebook by title
router.route('/title/:title').get( async (req, res) => {
  const title = req.params.title
  const author = req.query.author || ''
  if(!title) {
    return res.status(400).json('Error: required title not contained in request');
  }
  try {
    const b = await _getBook(_getUrl(title, author), title)
    res.json(b)
  } catch (e) {
    return res.status(500).json(`Error: ${e.message || e}`);
  }
});

module.exports = router
