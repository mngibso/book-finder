import React, {useState, useEffect} from "react";
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'
import find from 'lodash/find'
import Card from 'react-bootstrap/Card';
import '../Routes/Bookfinder/bookfinder.css';

const MaxRating = 100
const MinRating = 5

const _float = value => {
  const f = parseFloat(value)
  if (isNaN(f)) {
    return 0.0
  }
  return f
}

// newvalue = multiplier * value + adder.
const _scoreField = (value, multiplier, adder) => {
  const v = parseFloat(value)
  const m = parseFloat(multiplier)
  const a = parseFloat(adder)
  if (isNaN(v) || isNaN(m) || isNaN(a)) {
    return 0.0
  }
  return m * v + a
}

// calculate total score for book
const Weight = 1
const _scoreTotal = (book, stats) => {
  const total = _scoreField(book.goodreadsBook.averageRating, stats.goodreadsBook.avgMultiplier, stats.goodreadsBook.avgAdder) +
    _scoreField(book.goodreadsBook.ratingsCount, stats.goodreadsBook.countMultiplier, stats.goodreadsBook.countAdder) +
    _scoreField(book.googleBook.averageRating, stats.googleBook.avgMultiplier, stats.googleBook.avgAdder) * Weight +
    _scoreField(book.googleBook.ratingsCount, stats.googleBook.countMultiplier, stats.googleBook.countAdder) * Weight +
    _scoreField(book.idreambook.averageRating, stats.idreambook.avgMultiplier, stats.idreambook.avgAdder)   * Weight +
    _scoreField(book.idreambook.ratingsCount, stats.idreambook.countMultiplier, stats.idreambook.countAdder) * Weight
  return total
}

/**
 * Compare books and return `true` if they are essentially the same book.
 * @param {Object} b1 - book to compare
 * @param {Object} b2 - book to compare
 * @return {boolean} returns true if books
 * @private
 */
const _sameBook = (b1, b2) => {
  if (b1.isbn13 && b1.isbn13 === b2.isbn13) {
    return true
  }
  if (!b1.title || !b2.title) {
    return false
  }
  let a1 = ''
  let a2 = ''

  try {
    a1 = get(b1, 'authors', [])
    .map( auth => {
      return auth.split(' ')
      .join('')
    }).sort().join(':').toLowerCase()
  } catch(e) {}

  try {
    a2 = get(b2, 'authors', [])
    .map( auth => {
      if (!auth) {
        return ''
      }
      return auth.split(' ')
      .join('')
    }).sort().join(':').toLowerCase()
  } catch (e) {}
  const authorsMatch = a1 && a2 ? a1 === a2 : true
  const b1Title = b1.title.toLowerCase().split('(')[0].trim()
  const b2Title = b2.title.toLowerCase().split('(')[0].trim()
  let titlesMatch
  if (b1Title.length > b2Title.length) {
      titlesMatch = b1Title.includes(b2Title)
  } else {
    titlesMatch = b2Title.includes(b1Title)
  }
  return titlesMatch && authorsMatch
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
    _scoreBooks(sims)
    const sorted = sortBy(sims, ['score'])
    sorted.reverse()
    setSimilarBooks(sorted)
  }

  // calculate book stats to obtain score
  const _statsReducer = (stats, book) => {
    _statsTypeReducer(stats.goodreadsBook, book.goodreadsBook)
    _statsTypeReducer(stats.googleBook, book.googleBook)
    _statsTypeReducer(stats.idreambook, book.idreambook)
    return stats
  }

  // set stats for each book type
  const _statsTypeReducer = (stats, book) => {
    if (book) {
      let v = _float(book.averageRating)
      if ( v > stats.maxAvg) {
        stats.maxAvg = v
      }
      if (v < stats.minAvg) {
        stats.minAvg = v
      }
      v = _float(book.ratingsCount)
      if (v > stats.maxCount) {
        stats.maxCount = v
      }
      if (v < stats.minCount) {
        stats.minCount = v
      }
      if (stats.maxCount !== stats.minCount && stats.maxAvg !== stats.minAvg) {
        stats.avgMultiplier = (MaxRating - MinRating) / (stats.maxAvg - stats.minAvg)
        stats.avgAdder = MaxRating - (stats.avgMultiplier * stats.maxAvg)

        stats.countMultiplier = (MaxRating - MinRating) / (stats.maxCount - stats.minCount)
        stats.countAdder = MaxRating - (stats.countMultiplier * stats.maxCount)
      }
    }
  }

  /**
   * calculate a relative score for each book
   * @param {Object[]} books array of similar books
   * @private
   * @return {undefined}
   */
  const _scoreBooks = (books) => {
    // first step is to get the min and max values for each "book type"
    const stats = {
      googleBook: {
        minAvg : Number.MAX_SAFE_INTEGER,
        maxAvg : Number.MIN_SAFE_INTEGER,
        minCount : Number.MAX_SAFE_INTEGER,
        maxCount : Number.MIN_SAFE_INTEGER,
        avgAdder: 0,
        avgMultiplier: 0,
        countAdder: 0,
        countMultiplier: 0,
      },
      idreambook: {
        minAvg : Number.MAX_SAFE_INTEGER,
        maxAvg : Number.MIN_SAFE_INTEGER,
        minCount : Number.MAX_SAFE_INTEGER,
        maxCount : Number.MIN_SAFE_INTEGER,
        avgAdder: 0,
        avgMultiplier: 0,
        countAdder: 0,
        countMultiplier: 0,
      },
      goodreadsBook: {
        minAvg : Number.MAX_SAFE_INTEGER,
        maxAvg : Number.MIN_SAFE_INTEGER,
        minCount : Number.MAX_SAFE_INTEGER,
        maxCount : Number.MIN_SAFE_INTEGER,
        avgAdder: 0,
        avgMultiplier: 0,
        countAdder: 0,
        countMultiplier: 0,
      },
    }

    // set values in stats
    books.reduce(_statsReducer, stats)

    // only use a book type in the calculation if there is at least one value in the book type
    let divisor = 0
    if (stats.goodreadsBook.maxMultiplier !== 0) {
      divisor++
    }
    if (stats.goodreadsBook.countMultiplier !== 0) {
      divisor++
    }
    if (stats.googleBook.maxMultiplier !== 0) {
      divisor++
    }
    if (stats.googleBook.countMultiplier !== 0) {
      divisor++
    }
    if (stats.idreambook.maxMultiplier !== 0) {
      divisor++
    }
    if (stats.idreambook.countMultiplier !== 0) {
      divisor++
    }

    // set the score for each book
    for (const book of books) {
      if (divisor !== 0) {
        book.score = _scoreTotal(book, stats) / divisor
      } else {
        book.score = 0
      }
    }
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
              <th rowSpan="2">Score</th>
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
            {similarBooks.map( (book,idx) => (
              <tr key={book.count}>
                <td>{idx+1}</td>
                <td><span className="comp-score">{Math.ceil(book.score)}</span></td>
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
