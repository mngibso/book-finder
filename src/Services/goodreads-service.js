import axios from "axios";
class GoodreadsService {
  /**
   * Call GR api to get similar books
   * @param {string} title - book title
   * @return {Promise<AxiosResponse<any>>} promise returns similar books
   */
  getSimilars(title) {
    const url = `${process.env.API_URI}/goodreads/title/${encodeURIComponent(title)}`
    return axios.get(url)
    .then(res => {
      return res.data
    })
  }
}
export default new GoodreadsService()
