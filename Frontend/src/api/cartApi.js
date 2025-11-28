import axios from "axios";
import API_BASE_URL from "./api";

function authHeader(authToken) {
  return {
    headers: {
      Authorization: `Basic ${authToken}`,
    },
  };
}

export function getCartByUserId(userId, authToken) {
  return axios
    .get(`${API_BASE_URL}/cart/user/${userId}`, authHeader(authToken))
    .then((res) => res.data);
}

export function createCart(userId, authToken) {
  return axios
    .post(`${API_BASE_URL}/cart/user/${userId}`, {}, authHeader(authToken))
    .then((res) => res.data);
}

export function addItemToCart(userId, bookId, quantity, authToken) {
  return axios
    .post(
      `${API_BASE_URL}/cart/user/${userId}/items`,
      null,
      {
        ...authHeader(authToken),
        params: { bookId, quantity },
      }
    )
    .then((res) => res.data);
}


export function updateCartItemQuantity(
  userId,
  cartItemId,
  quantity,
  authToken
) {
  return axios
    .put(
      `${API_BASE_URL}/cart/user/${userId}/items/${cartItemId}`,
      null,
      {
        ...authHeader(authToken),
        params: { quantity },
      }
    )
    .then((res) => res.data);
}

export function removeItemFromCart(userId, cartItemId, authToken) {
  return axios
    .delete(
      `${API_BASE_URL}/cart/user/${userId}/items/${cartItemId}`,
      authHeader(authToken)
    )
    .then((res) => res.data);
}

export function clearCart(userId, authToken) {
  return axios
    .delete(`${API_BASE_URL}/cart/user/${userId}`, authHeader(authToken))
    .then((res) => res.data);
}
