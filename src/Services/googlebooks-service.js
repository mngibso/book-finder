import axios from "axios";
import get from "lodash/get";
import uniqWith from "lodash/uniqWith";

/**
 * return the isbn13 for the book
 * @param {Object} b book returned from google books api
 * @returns {string} isbn13 or empty string
 */
const _getISBN13 = b => {
  const isbn13 = get(b, 'volumeInfo.industryIdentifiers', [])
  .filter(i => {
    console.log(i)
    return i.type === 'ISBN_13'
  })
  console.log(isbn13)
  if (isbn13.length) {
    return isbn13[0].identifier
  }
  return ''
}

class GooglebooksService {
  getBook(isbn13) {
    const url = `${process.env.API_URI}/googlebooks/isbn/${isbn13}`
    console.log(url)
    return axios.get(url)
    .then(res => {
      console.log('return from api call')
      console.log(res)
      return res.data
    })
  }

  findBook(bookTitle) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=title:${bookTitle}`
    return axios.get(url)
    .then(res => {
      const sb = res.data.items.map(b => {
        return {
          thumbnail: get(b, 'volumeInfo.imageLinks.smallThumbnail', 'images/default_book_cover.jpg'),
          title: get(b, 'volumeInfo.title', 'unknown'),
          authors: get(b, 'volumeInfo.authors', []).join(', '),
          isbn13: _getISBN13(b)
        }
      })
      .filter(i => {
        return i.isbn13 !== '';
      })

      // Don't include > 1 book with same title and author
      return uniqWith(sb, (a, b) =>
        a.title === b.title && a.authors === b.authors
      )
    })
    // .finally(() => setFindLoading(false))
    // console.log(`Submitting Title ${bookTitle}`)
  }
}
export default new GooglebooksService()
