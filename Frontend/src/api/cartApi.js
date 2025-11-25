import axios from "axios";
import API_BASE_URL from "./api";

// Helper
function authConfig(username, password) {
  return {
    auth: {
      username,
      password
    }
  };
}


export function getCartByUserId(userId, username, password) {
  return axios
    .get(`${API_BASE_URL}/cart/user/${userId}`, authConfig(username, password))
    .then(res => res.data);
}


export function createCart(userId, username, password) {
  return axios
    .post(`${API_BASE_URL}/cart/user/${userId}`, {}, authConfig(username, password))
    .then(res => res.data);
}


export function addItemToCart(userId, bookId, quantity, username, password) {
  return axios
    .post(
      `${API_BASE_URL}/cart/user/${userId}/items`,
      null, 
      {
        ...authConfig(username, password),
        params: { bookId, quantity }
      }
    )
    .then(res => res.data);
}

export function updateCartItemQuantity(
  userId,
  cartItemId,
  quantity,
  username,
  password
) {
  return axios
    .put(
      `${API_BASE_URL}/cart/user/${userId}/items/${cartItemId}`,
      null,
      {
        ...authConfig(username, password),
        params: { quantity }
      }
    )
    .then(res => res.data);
}

export function removeItemFromCart(userId, cartItemId, username, password) {
  return axios
    .delete(
      `${API_BASE_URL}/cart/user/${userId}/items/${cartItemId}`,
      authConfig(username, password)
    )
    .then(res => res.data);
}

export function clearCart(userId, username, password) {
  return axios
    .delete(`${API_BASE_URL}/cart/user/${userId}`, authConfig(username, password))
    .then(res => res.data);
}
