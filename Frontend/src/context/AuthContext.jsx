import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../api/authApi";
import { addItemToCart } from "../api/cartApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    try {
      const res = await loginUser(email, password);

      const loggedInUser = {
        ...res.user,
        email,
        password,
      };

      // LOGIN WORKED → SAVE USER
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      // -------------------------
      // MERGE GUEST CART INTO BACKEND
      // -------------------------
      const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (guestCart.length > 0) {
        for (const item of guestCart) {
          await addItemToCart(
            loggedInUser.userId,
            item.book.bookId,
            item.quantity,
            loggedInUser.email,
            loggedInUser.password
          );
        }

        // Remove guest cart
        localStorage.removeItem("cart");

        // FORCE CartContext to reload backend cart
        localStorage.setItem("forceReloadCart", "1");
      }

      return { success: true };

    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
  };

  const register = async (form) => {
    const res = await registerUser(form);

    if (!res.user) throw new Error("Registration failed");

    const storedUser = {
      ...res.user,
      email: form.email,
      password: form.password,
    };

    setUser(storedUser);
    localStorage.setItem("user", JSON.stringify(storedUser));

    return storedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

