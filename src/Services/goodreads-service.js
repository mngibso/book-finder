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
  }
}
export default new GoodreadsService()
