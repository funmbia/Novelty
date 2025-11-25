import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
    getCartByUserId,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart as apiClearCart,
} from "../api/cartApi";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Generate temporary ID for guest cart items
const generateId = () =>
    crypto?.randomUUID?.() || Math.floor(Math.random() * 1_000_000_000);

export function CartProvider({ children }) {
    const { user } = useAuth();

    const userId = user?.userId || null;
    const username = user?.email || null;
    const password = user?.password || null;

    const [cartItems, setCartItems] = useState([]);

    
    // ------------------------------------------
    // Load cart (backend if logged in, storage if guest)
    // ------------------------------------------
    useEffect(() => {
        if (userId) {
            // Logged-in → backend cart
            (async () => {
                try {
                    const res = await getCartByUserId(userId, username, password);
                    const items = res?.cart?.cartItemList ?? [];
                    setCartItems(items);
                } catch (err) {
                    console.error("Backend cart load failed:", err);
                }
            })();
        } else {
            // Guest → localStorage
            const stored = localStorage.getItem("cart");
            const items = stored ? JSON.parse(stored) : [];

            // Ensure guest items have unified structure
            const normalized = items.map((i) => ({
                cartItemId: i.cartItemId || generateId(),
                book: i.book, // already in unified structure
                quantity: i.quantity,
            }));

            setCartItems(normalized);
        }
    }, [userId]);

    useEffect(() => {
    const flag = localStorage.getItem("forceReloadCart");

    if (userId && flag === "1") {
        (async () => {
            try {
                const res = await getCartByUserId(userId, username, password);
                setCartItems(res?.cart?.cartItemList ?? []);
            } catch (err) {
                console.error("Forced reload failed:", err);
            }
            localStorage.removeItem("forceReloadCart");
        })();
    }
}, [userId]);

    // Save guest cart to localStorage
    useEffect(() => {
        if (!userId) {
            localStorage.setItem("cart", JSON.stringify(cartItems));
        }
    }, [cartItems, userId]);

    // ------------------------------------------
    // ADD TO CART
    // ------------------------------------------
    const addToCart = async (book, qty = 1) => {
        if (userId) {
            // Backend mode
            const res = await addItemToCart(userId, book.bookId, qty, username, password);
            setCartItems(res?.cart?.cartItemList ?? []);
        } else {
            // Guest mode (same structure as backend)
            setCartItems((prev) => {
                const existing = prev.find((i) => i.book.bookId === book.bookId);

                if (existing) {
                    return prev.map((i) =>
                        i.book.bookId === book.bookId
                            ? { ...i, quantity: i.quantity + qty }
                            : i
                    );
                }

                return [
                    ...prev,
                    {
                        cartItemId: generateId(),
                        book: {
                            bookId: book.bookId,
                            title: book.title,
                            author: book.author,
                            price: book.price,
                            imageUrl: book.imageUrl,
                        },
                        quantity: qty,
                    },
                ];
            });
        }
    };

    // ------------------------------------------
    // REMOVE ITEM
    // ------------------------------------------
    const removeFromCart = async (bookId, cartItemId) => {
        if (userId) {
            const res = await removeItemFromCart(userId, cartItemId, username, password);
            setCartItems(res?.cart?.cartItemList ?? []);
        } else {
            setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
        }
    };

    // ------------------------------------------
    // INCREASE QUANTITY
    // ------------------------------------------
    const increaseQty = async (bookId, cartItemId) => {
        const item = cartItems.find((i) => i.cartItemId === cartItemId);
        if (!item) return;

        if (userId) {
            const res = await updateCartItemQuantity(
                userId,
                cartItemId,
                item.quantity + 1,
                username,
                password
            );
            setCartItems(res?.cart?.cartItemList ?? []);
        } else {
            setCartItems((prev) =>
                prev.map((i) =>
                    i.cartItemId === cartItemId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            );
        }
    };

    // ------------------------------------------
    // DECREASE QUANTITY
    // ------------------------------------------
    const decreaseQty = async (bookId, cartItemId) => {
        const item = cartItems.find((i) => i.cartItemId === cartItemId);
        if (!item) return;

        const newQty = item.quantity - 1;

        if (userId) {
            if (newQty <= 0) {
                const res = await removeItemFromCart(
                    userId,
                    cartItemId,
                    username,
                    password
                );
                setCartItems(res?.cart?.cartItemList ?? []);
            } else {
                const res = await updateCartItemQuantity(
                    userId,
                    cartItemId,
                    newQty,
                    username,
                    password
                );
                setCartItems(res?.cart?.cartItemList ?? []);
            }
        } else {
            if (newQty <= 0) {
                setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
            } else {
                setCartItems((prev) =>
                    prev.map((i) =>
                        i.cartItemId === cartItemId ? { ...i, quantity: newQty } : i
                    )
                );
            }
        }
    };

    // ------------------------------------------
    // CLEAR CART
    // ------------------------------------------
    const clearCart = async () => {
        if (userId) {
            const res = await apiClearCart(userId, username, password);
            setCartItems(res?.cart?.cartItemList ?? []);
        } else {
            setCartItems([]);
        }
    };

    // ------------------------------------------
    // TOTALS
    // ------------------------------------------
    const cartTotal = cartItems
        .reduce((sum, item) => sum + (item.book.price ?? 0) * item.quantity, 0)
        .toFixed(2);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                increaseQty,
                decreaseQty,
                clearCart,
                cartTotal,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

