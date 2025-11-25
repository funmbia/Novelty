import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../api/authApi";
import { addItemToCart } from "../api/cartApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Load stored user
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });


  const login = async (email, password) => {
    try {
      const res = await loginUser(email, password);

      const authToken = btoa(`${email}:${password}`);

      const loggedInUser = {
        ...res.user,
        email,
        authToken,  
      };

      // Save user
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      // MERGE GUEST CART
      const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (guestCart.length > 0) {
        for (const item of guestCart) {
          await addItemToCart(
            loggedInUser.userId,
            item.book.bookId,
            item.quantity,
            loggedInUser.authToken 
          );
        }

        // Clear guest cart
        localStorage.removeItem("cart");

        // Tell CartContext to reload backend cart
        localStorage.setItem("forceReloadCart", "1");
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
  };

  // REGISTER
  const register = async (form) => {
    const res = await registerUser(form);

    if (!res.user) throw new Error("Registration failed");

    const authToken = btoa(`${form.email}:${form.password}`);

    const storedUser = {
      ...res.user,
      email: form.email,
      authToken,
    };

    setUser(storedUser);
    localStorage.setItem("user", JSON.stringify(storedUser));

    return storedUser;
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
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

