import API_BASE_URL from "./api";
import axios from "axios";

export async function getGenres() {
    return axios.get(`${API_BASE_URL}/catalog/genres`, {
        auth: {
            username: "admin@test.com",
            password: "Pass123!"
        }
    })
        .then(res => res.data)
        .catch(err => { throw err; });
}


export async function listBooks({ page = 0, size = 20, sort = "title", search = "", genre = "" }) {
  return axios.get(`${API_BASE_URL}/catalog/books`, {
    params: { page, size, sort, search, genre },
    auth: {
      username: "admin@test.com",
      password: "Pass123!"
    }
  })
  .then(res => res.data)
  .catch(err => { throw err; });
}


export async function fetchBookById(id) {
  return axios.get(`${API_BASE_URL}/catalog/books/${id}`, {
    auth: {
      username: "admin@test.com",
      password: "Pass123!"
    }
  }).then(res => res.data);
}