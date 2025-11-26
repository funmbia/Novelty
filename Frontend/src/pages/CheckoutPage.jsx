import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Divider,
  Button,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import { fetchBookById } from "../api/catalogAPI";

import { detectCardBrand } from "../utils/validation";

import { getAddressForUser } from "../api/addressApi";
import { getUserDefaultPaymentMethod } from "../api/paymentApi";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [savedAddress, setSavedAddress] = useState(null);
  const [savedPayment, setSavedPayment] = useState(null);

  const [useSavedInfo, setUseSavedInfo] = useState(true);
  const [saveNewInfo, setSaveNewInfo] = useState(false);
  const [error, setError] = useState("");

  // Temporary info (UI only for now)
  const [shipping, setShipping] = useState({
    name: "",
    address: "",
    city: "",
    postal: ""
  });

  const [billing, setBilling] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: ""
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { redirectTo: "/checkout" } });
      return;
    }

    const loadData = async () => {
      try {
        // Load saved address
        const addrRes = await getAddressForUser(user.userId, user.authToken);
        if (addrRes.address) {
          setSavedAddress(addrRes.address);
        }

        // Load saved default payment method
        const payRes = await getUserDefaultPaymentMethod(user.userId, user.authToken);
        if (payRes) {
          setSavedPayment(payRes);
        }
      } catch (err) {
        console.error("Failed to load checkout info:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }


  const validateStock = async () => {
    for (const item of cartItems) {
      const freshData = await fetchBookById(item.book.bookId);
      const freshBook = freshData.book;

      if (!freshBook) {
        setError(`Book "${item.book.title}" no longer exists.`);
        return false;
      }
      console.log(freshBook.quantity)
      console.log(item.quantity)
      if (freshBook.quantity < item.quantity) {
        setError(
          `Not enough stock for "${freshBook.title}". Only ${freshBook.quantity} left.`
        );
        return false;
      }
    }
    return true;
  };


  const handlePlaceOrder = async () => {
    console.log("PLACE ORDER CLICKED");

    setError("");

    const ok = await validateStock();
    console.log("validateStock returned:", ok);
    if (!ok) return;

    // Require saved address & payment for now
    if (!savedAddress) {
      setError("No saved address found. Please add one in your Account.");
      return;
    }

    if (useSavedInfo && !savedPayment) {
      setError("You must have a saved payment method to use this option.");
      return;
    }

    // Build payload
    let payload = {
      userId: user.userId,
      addressId: savedAddress.addressId
    };

    if (useSavedInfo) {
      payload.paymentMethodId = savedPayment.paymentMethodId;
    } else {
      // TEMPORARY PAYMENT ONLY (no temp address yet)
      payload.temporaryPayment = {
        cardNumber: billing.cardNumber.replace(/\s+/g, ""),
        cardBrand: detectCardBrand(billing.cardNumber),
        cvv: billing.cvv,
        expiryMonth: billing.expiryMonth,
        expiryYear: billing.expiryYear,
        cardholderName: shipping.name
      };
      payload.savePaymentMethod = saveNewInfo;
    }

    try {
      const res = await fetch("http://localhost:2424/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + user.authToken
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 200 && data.order) {
        clearCart();
        navigate(`/order-success/${data.order.orderId}`, {
          state: {
            shipping: useSavedInfo
              ? {
                street: savedAddress.street,
                city: savedAddress.city,
                postal: savedAddress.postalCode,
              }
              : shipping,
            billing: useSavedInfo
              ? { last4: savedPayment.cardLast4 }
              : {
                last4: billing.cardNumber.slice(-4),
                expiryMonth: billing.expiryMonth,
                expiryYear: billing.expiryYear,
              }
          }
        });
      } else {
        setError(data.message || "Checkout failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        px: { xs: 2, md: 6 },
        py: 4
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: "1200px",
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          backgroundColor: "white"
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={4} textAlign="center">
          Checkout
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4
          }}
        >
          {/* LEFT COLUMN */}
          <Box>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }} elevation={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useSavedInfo}
                    onChange={(e) => setUseSavedInfo(e.target.checked)}
                  />
                }
                label="Use saved shipping & billing information"
              />
            </Paper>

            {useSavedInfo ? (
              <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
                <Typography variant="h6">Saved Information</Typography>
                <Divider sx={{ my: 2 }} />

                <Typography fontWeight="bold">Shipping:</Typography>
                <Typography>{savedAddress.street}</Typography>
                <Typography>{savedAddress.city}</Typography>
                <Typography>{savedAddress.postalCode}</Typography>

                <Typography fontWeight="bold" mt={3}>
                  Billing:
                </Typography>
                {savedPayment ? (
                  <Typography>Card ending in {savedPayment.cardLast4}</Typography>
                ) : (
                  <Typography color="error">No saved payment method</Typography>
                )}
              </Paper>
            ) : (
              <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
                <Typography variant="h6">Shipping Information</Typography>
                <Divider sx={{ my: 2 }} />

                <TextField
                  label="Full Name"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                />

                <TextField
                  label="Address"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                />

                <TextField
                  label="City"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                />

                <TextField
                  label="Postal Code"
                  fullWidth
                  sx={{ mb: 3 }}
                  value={shipping.postal}
                  onChange={(e) => setShipping({ ...shipping, postal: e.target.value })}
                />

                <Typography variant="h6" mt={3}>
                  Billing Information
                </Typography>
                <Divider sx={{ my: 2 }} />

                <TextField
                  label="Card Number"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={billing.cardNumber}
                  onChange={(e) =>
                    setBilling({ ...billing, cardNumber: e.target.value })
                  }
                />

                <TextField
                  label="Expiry Month (MM)"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={billing.expiryMonth}
                  onChange={(e) =>
                    setBilling({ ...billing, expiryMonth: e.target.value })
                  }
                />

                <TextField
                  label="Expiry Year (YYYY)"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={billing.expiryYear}
                  onChange={(e) =>
                    setBilling({ ...billing, expiryYear: e.target.value })
                  }
                />

                <TextField
                  label="CVV"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={billing.cvv}
                  onChange={(e) =>
                    setBilling({ ...billing, cvv: e.target.value })
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveNewInfo}
                      onChange={(e) => setSaveNewInfo(e.target.checked)}
                    />
                  }
                  label="Save this payment method"
                />
              </Paper>
            )}
          </Box>

          {/* RIGHT COLUMN — ORDER SUMMARY */}
          <Box>
            <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
              <Typography variant="h6">Order Summary</Typography>
              <Divider sx={{ my: 2 }} />

              {cartItems.map((item) => (
                <Box
                  key={item.cartItemId}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2
                  }}
                >
                  <Typography>{item.book.title}</Typography>
                  <Typography>
                    {item.quantity} × ${item.book.price.toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Typography
                variant="h5"
                sx={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total: $
                {cartItems
                  .reduce((sum, item) => sum + item.book.price * item.quantity, 0)
                  .toFixed(2)}
              </Typography>
            </Paper>

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: "bold",
                fontSize: "1.1rem"
              }}
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}


