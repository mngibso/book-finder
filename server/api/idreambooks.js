const router = require('express').Router()
const get = require('lodash/get')
const axios = require('axios')

// https://idreambooks.com/api

/**
 * simplify book format
 * @param {Object} book GR book representation
 * @return {{averageRating: *, link: *, ratingsCount: *, title: *, authors: *}} simple book representation
 * @private
 */
const _toBook = (book, title) => {
  let authors = get(book, 'author',[])
  if (authors && !Array.isArray(authors)) {
    authors = [authors]
  }
  return {
    averageRating: get(book, 'rating',0),
    ratingsCount: get(book, 'review_count',0),
    title:  get(book, 'title',title),
    authors,
    link:  get(book, 'detail_link',''),
  }
}

/**
 * return a idreambooks api url
 * @param {string} title book title
 * @return {string} url api url
 * @private
 */
const _getUrl = (title) => {
  const key = process.env.IDREAMBOOKS_API_KEY || null;
  if (key === null) {
    throw new Error('Error: required "IDREAMBOOKS_API_KEY" not defined in env')
  }
  let q = `${encodeURIComponent(title)}`
  let url = `https://idreambooks.com/api/books/reviews.json?q=${q}&key=${key}`
  return url
}


/**
 * googlebooks api can return multiple books.  Find and return the best fit
 * @param {string} url - api call url
 * @param {string} title - book title
 * @return {Promise<AxiosResponse<any>>} - promise to return book
 * @private
 */
const _getBook = async (title) => {
  const url = _getUrl(title)
  return axios.get(url)
  .then(gRes => {
    const book = get(gRes,'data.book', {})
    console.log(title)
    return _toBook(book, title)
  })
}

// get googlebook by title
router.route('/title/:title').get( async (req, res) => {
  const title = req.params.title
  if(!title) {
    return res.status(400).json('Error: required title not contained in request');
  }
  try {
    const b = await _getBook(title)
    console.log(b)
    res.json(b)
  } catch (e) {
    return res.status(500).json(`Error: ${e.message || e}`);
  }
});

module.exports = router
