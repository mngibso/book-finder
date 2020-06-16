import axios from "axios";

class IdreambooksService {
  /**
   * Call Idreambooks api to get critics reviews
   * @param {string} title - book title
   * @return {Promise<AxiosResponse<any>>} promise returns similar books
   */
  getSimilars(title) {
    const url = `${process.env.API_URI}/idreambooks/title/${encodeURIComponent(title)}`
    return axios.get(url)
    .then(res => {
      return res.data
    })
  }
}
export default new IdreambooksService()
