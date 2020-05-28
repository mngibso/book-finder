import React, {useState, useEffect} from "react";
import get from 'lodash/get'
import find from 'lodash/find'
import '../Routes/Bookfinder/bookfinder.css';

/**
 * Compare books and return `true` if they are essentially the same book.
 * @param {Object} b1 - book to compare
 * @param {Object} b2 - book to compare
 * @return {boolean} returns true if books match
 * @private
 */
const _sameBook = (b1, b2) => {
  if (b1.isbn13 && b1.isbn13 === b2.isbn13) {
    return true
  }
  const a1 = get(b1, 'authors', []).sort()
  const a2 = get(b2, 'authors', []).sort()
  const b1Title = b1.title.toLowerCase().split('(')[0].trim()
  const b2Title = b2.title.toLowerCase().split('(')[0].trim()
  let titlesMatch
  if (b1Title.length > b2Title.length) {
      titlesMatch = b1Title.includes(b2Title)
  } else {
    titlesMatch = b2Title.includes(b1Title)
  }
  return titlesMatch && a1.join(':') === a2.join(':')
}


/**
 * Display table of books similar to the select book
 * @param {Object} props - arrays of books to display
 * @return {*} page displaying form
 * @constructor
 */
function SimilarBooks(props) {
  const {goodreadsBooks = [], googleBooks = [], amazonBooks = []} = props
  const [similarBooks, setSimilarBooks] = useState([]);

  // merge incoming books arrays
  useEffect(() => {
    // if (amazonBooks.length || goodreadsBooks.length || googleBooks.length) { _merge() }
    if (goodreadsBooks.length || googleBooks.length) {
      _merge()
    } else {
      setSimilarBooks([])
    }
  },[goodreadsBooks, googleBooks]);

  // given the books arrays, merge them as best as possible to give ratings in table
  const _merge = () => {
    const sims = []
    let count = 0
    for (const gr of goodreadsBooks) {
      count++
      const googleBook = find(googleBooks, gb => {
        return _sameBook(gb, gr)
      }) || { averageRating: 'N/A', ratingsCount: 'N/A'}
      const amazonBook = find(amazonBooks, ab => {
        return _sameBook(ab, gr)
      }) || { salesRank: 'TBD'}
      let title = gr.title
      if (gr.subTitle) {
        title = `${title} : ${gr.subTitle}`
      }
      sims.push( {
        authors: gr.authors.join(', '),
        count,
        title,
        isbn13: gr.isbn13,
        googleBook,
        amazonBook,
        goodreadsBook: gr,
      })
    }
    setSimilarBooks(sims)
  }
  return (
    <div>
      {similarBooks.length > 0 &&
      <table className="dataTable book-comparison-table">
        <colgroup>
          <col className="amazon"/>
          <col span="2" className="goodreads"/>
          <col className="google"/>
          <col className="google last"/>
        </colgroup>
        <thead>
        <tr>
          <th rowSpan="2">Rank</th>
          <th rowSpan="2">Comp Score</th>
          <th rowSpan="2" className="book-info">Title</th>
          <th><img src="images/logo_amazon.png" alt="Logo: Amazon" className="th-logo"/></th>
          <th colSpan="2"><img src="images/logo_goodreads2.png" alt="Logo: GoodReads" className="th-logo"/></th>
          <th colSpan="2"><img src="images/logo_google.png" alt="Logo: Google" className="th-logo"/></th>
        </tr>
        <tr>
          <th>Sales Rank</th>
          <th>Ratings Count</th>
          <th>Avg. Rating</th>
          <th>Ratings Count</th>
          <th>Avg. Rating</th>
        </tr>
        </thead>
        <tbody>
        {similarBooks.map(book => (
          <tr key={book.count}>
            <td>{book.count}</td>
            <td><span className="comp-score">?</span></td>
            <td className="book-info">
              <img src={book.googleBook.thumbnail || book.goodreadsBook.thumbnail}/>
              <div>
                <strong>{book.title}</strong>
                {book.authors}
              </div>
            </td>
            <td>{book.amazonBook.salesRank}</td>
            <td>{book.goodreadsBook.ratingsCount}</td>
            <td>{book.goodreadsBook.averageRating}</td>
            <td>{book.googleBook.ratingsCount}</td>
            <td>{book.googleBook.averageRating}</td>
          </tr>
        ))}
        </tbody>
      </table>
      }
    </div>
  );
}
export default SimilarBooks;
