import React, {useState, useEffect} from "react";
import get from 'lodash/get'
import find from 'lodash/find'
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
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
  if (!b1.title || !b2.title) {
    return false
  }
  const a1 = get(b1, 'authors', [])
  .map( auth => {
    return auth.split(' ')
    .join('')
  }).sort().join(':').toLowerCase()
  const a2 = get(b2, 'authors', [])
  .map( auth => {
    return auth.split(' ')
    .join('')
  }).sort().join(':').toLowerCase()
  const b1Title = b1.title.toLowerCase().split('(')[0].trim()
  const b2Title = b2.title.toLowerCase().split('(')[0].trim()
  let titlesMatch
  if (b1Title.length > b2Title.length) {
      titlesMatch = b1Title.includes(b2Title)
  } else {
    titlesMatch = b2Title.includes(b1Title)
  }
  //return titlesMatch && a1.join(':') === a2.join(':')
  return titlesMatch && a1 === a2
}


/**
 * Display table of books similar to the select book
 * @param {Object} props - arrays of books to display
 * @return {*} page displaying form
 * @constructor
 */
function SimilarBooks(props) {
  const {goodreadsBooks = [], googleBooks = [], idreambooks = []} = props
  const [similarBooks, setSimilarBooks] = useState([]);

  // merge incoming books arrays
  useEffect(() => {
    console.log(`merge  ${goodreadsBooks.length} ${googleBooks.length} ${idreambooks.length}`)
    if (goodreadsBooks.length || googleBooks.length || idreambooks.length) {
      _merge()
    } else {
      setSimilarBooks([])
    }
  },[goodreadsBooks, googleBooks, idreambooks]);

  // given the books arrays, merge them as best as possible to give ratings in table
  const _merge = () => {
    const sims = []
    let count = 0
    for (const gr of goodreadsBooks) {
      count++
      const googleBook = find(googleBooks, gb => {
        return _sameBook(gb, gr)
      }) || {averageRating: 'N/A', ratingsCount: 'N/A'}
      const idreambook = find(idreambooks, ib => {
        return _sameBook(ib, gr)
      }) || {averageRating: '0', ratingsCount: '0'}
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
        idreambook,
        goodreadsBook: gr,
      })
    }
    setSimilarBooks(sims)
  }
  return (
    <div className="container-fluid" style={similarBooks.length > 0 ? {} : {display: "none"}} >
      <Card className="mb-3">
        <div className="card-body">
          <table className="dataTable book-comparison-table">
            <colgroup>
              <col span="2" className="goodreads"/>
              <col/>
              <col span="2" />
              <col span="2" className="goodreads"/>
              <col className="google"/>
              <col className="google last"/>
            </colgroup>
            <thead>
            <tr>
              <th rowSpan="2">Rank</th>
              <th rowSpan="2">Comp Score</th>
              <th rowSpan="2" className="book-info">Title</th>
              <th colSpan="2"><img src="images/idreambooks-logo.png" alt="Logo: Idreambooks" className="th-logo"/>
                <div className="idreambooks">iDreamBooks : Book Reviews from Critics</div></th>
              <th colSpan="2"><img src="images/logo_goodreads2.png" alt="Logo: GoodReads" className="th-logo"/></th>
              <th colSpan="2"><img src="images/logo_google.png" alt="Logo: Google" className="th-logo"/></th>
            </tr>
            <tr>
              <th>Reviews</th>
              <th>Average Score</th>
              <th>Ratings Count</th>
              <th>Avg. Rating</th>
              <th>Ratings Count</th>
              <th>Avg. Rating</th>
            </tr>
            </thead>
            { similarBooks.length > 0 &&
            <tbody>
            {similarBooks.map(book => (
              <tr key={book.count}>
                <td>{book.count}</td>
                <td><span className="comp-score">?</span></td>
                <td className="book-info">
                  <img src={book.googleBook.thumbnail || book.goodreadsBook.thumbnail}/>
                  <div>
                    <strong>{book.title.split('(')[0]}</strong>
                    {book.authors}
                  </div>
                </td>
                <td>{book.idreambook.ratingsCount}</td>
                <td>{parseInt(book.idreambook.averageRating) === 0 ? "N/A" : `${book.idreambook.averageRating}/100`}</td>
                <td>{parseInt(book.goodreadsBook.ratingsCount).toLocaleString()}</td>
                <td>{book.goodreadsBook.averageRating}</td>
                <td>{isNaN(parseInt(book.googleBook.ratingsCount)) ?
                  book.googleBook.ratingsCount : parseInt(book.googleBook.ratingsCount).toLocaleString()}</td>
                <td>{book.googleBook.averageRating}</td>
              </tr>
            ))}
            </tbody>
            }
          </table>
        </div>
      </Card>
    </div>
  );
}
export default SimilarBooks;
