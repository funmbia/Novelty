export function saveOrder(order) {
  const history = JSON.parse(localStorage.getItem("orders") || "[]");
  history.push(order);
  localStorage.setItem("orders", JSON.stringify(history));
}

export function getOrderHistory() {
  return JSON.parse(localStorage.getItem("orders") || "[]");
}
