import axios from "axios";
import get from "lodash/get";
import uniqWith from "lodash/uniqWith";

class GoodreadsService {
  getSimilars(isbn13) {
    const url = `${process.env.API_URI}/goodreads/isbn/${isbn13}`
    console.log(url)
    return axios.get(url)
    .then(res => {
      console.log('return from api call')
      console.log(res)
      return res.data
    })
    //.finally(() => setFindLoading(false))
  }
}
export default new GoodreadsService()
  /*
constructor() {}
async getSimilars(isbn13) {
const url = '/'
axios.get(url)
.then(res => {
  const sb = res.data.items.map(b => {
    return {
      thumbnail: get(b, 'volumeInfo.imageLinks.smallThumbnail', 'images/default_book_cover.jpg'),
      title: get(b, 'volumeInfo.title', 'unknown'),
      authors: get(b, 'volumeInfo.authors', []).join(', '),
      isbn13: getISBN13(b)
    }
  } )
  .filter(i => {
    return i.isbn13 !== '';
  })


  // Don't include > 1 book with same title and author
  setSelectBooks(uniqWith(sb, (a, b) =>
    a.title === b.title && a.authors === b.authors
  ))
    })
    //.finally(() => setFindLoading(false))
  }
}
   */
// const GRS = GoodreadsService
