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
  FormControlLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

// Dummy saved account info
const dummySavedProfile = {
  name: "John Doe",
  address: "123 Maple Street",
  city: "Toronto",
  postal: "M3J 1P3",
  cardNumber: "4242 4242 4242 4242",
  expiry: "12/28",
  cvv: "123",
};

// Dummy inventory to validate stock
const dummyInventory = {
  1: 5,
  2: 7,
  3: 12,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();

  const [useSavedInfo, setUseSavedInfo] = useState(true);
  const [saveNewInfo, setSaveNewInfo] = useState(false);
  const [error, setError] = useState("");

  // Form state (only used when useSavedInfo = false)
  const [shipping, setShipping] = useState({
    name: "",
    address: "",
    city: "",
    postal: ""
  });

  const [billing, setBilling] = useState({
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { redirectTo: "/checkout" } });
    }
  }, [user]);

  if (!user) return null;

  // Validate stock
  const validateStock = () => {
    for (const item of cartItems) {
      const stock = dummyInventory[item.bookId] ?? 0;
      if (item.quantity > stock) {
        setError(`Not enough stock for ${item.title}. Only ${stock} left.`);
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = () => {
    if (!validateStock()) return;

    setError("");

    const finalShipping = useSavedInfo ? dummySavedProfile : shipping;
    const finalBilling = useSavedInfo ? dummySavedProfile : billing;

    // Fake delay to simulate payment processing
    setTimeout(() => {
      clearCart();

      const orderId = Math.floor(Math.random() * 900000 + 100000).toString();

      // temporary storage (mock DB)
      localStorage.setItem("lastOrder", JSON.stringify({
        id: orderId,
        shipping: finalShipping,
        billing: finalBilling,
        items: cartItems,
      }));

      navigate(`/order-success/${orderId}`);

    }, 1000);
  };

  return (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
      px: { xs: 2, md: 6 },
      py: 4,
    }}
  >
    <Paper
      elevation={4}
      sx={{
        width: "100%",
        maxWidth: "1200px",
        p: { xs: 3, md: 5 },
        borderRadius: 4,
        backgroundColor: "white",
      }}
    >
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          mb: 4,
          textAlign: "center",
        }}
      >
        Checkout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* TWO-COLUMN LAYOUT */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 4,
        }}
      >
        {/* LEFT COLUMN — SHIPPING + BILLING */}
        <Box>
          {/* SAVED INFO TOGGLE */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              backgroundColor: "#f8f9fa",
            }}
            elevation={1}
          >
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

          {/* SAVED INFO SUMMARY */}
          {useSavedInfo ? (
            <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
              <Typography variant="h6">Saved Information</Typography>
              <Divider sx={{ my: 2 }} />

              <Typography fontWeight="bold" sx={{ mb: 1 }}>
                Shipping:
              </Typography>
              <Typography>{dummySavedProfile.name}</Typography>
              <Typography>{dummySavedProfile.address}</Typography>
              <Typography>{dummySavedProfile.city}</Typography>
              <Typography>{dummySavedProfile.postal}</Typography>

              <Typography fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                Billing:
              </Typography>
              <Typography>Card ending in 4242</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
              {/* SHIPPING FORM */}
              <Typography variant="h6">Shipping Information</Typography>
              <Divider sx={{ my: 2 }} />

              <TextField
                label="Full Name"
                fullWidth
                sx={{ mb: 2 }}
                value={shipping.name}
                onChange={(e) =>
                  setShipping({ ...shipping, name: e.target.value })
                }
              />

              <TextField
                label="Address"
                fullWidth
                sx={{ mb: 2 }}
                value={shipping.address}
                onChange={(e) =>
                  setShipping({ ...shipping, address: e.target.value })
                }
              />

              <TextField
                label="City"
                fullWidth
                sx={{ mb: 2 }}
                value={shipping.city}
                onChange={(e) =>
                  setShipping({ ...shipping, city: e.target.value })
                }
              />

              <TextField
                label="Postal Code"
                fullWidth
                sx={{ mb: 3 }}
                value={shipping.postal}
                onChange={(e) =>
                  setShipping({ ...shipping, postal: e.target.value })
                }
              />

              {/* BILLING FORM */}
              <Typography variant="h6" sx={{ mt: 3 }}>
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
                label="Expiry"
                fullWidth
                sx={{ mb: 2 }}
                value={billing.expiry}
                onChange={(e) =>
                  setBilling({ ...billing, expiry: e.target.value })
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
                label="Save this information to my account"
              />
            </Paper>
          )}
        </Box>

        {/* RIGHT COLUMN — ORDER REVIEW */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
            <Typography variant="h6">Order Summary</Typography>
            <Divider sx={{ my: 2 }} />

            {cartItems.map((item) => (
              <Box
                key={item.bookId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography>{item.title}</Typography>
                <Typography>
                  {item.quantity} × ${item.price.toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h5" sx={{ textAlign: "right", fontWeight: "bold" }}>
              Total: $
              {cartItems
                .reduce((sum, item) => sum + item.price * item.quantity, 0)
                .toFixed(2)}
            </Typography>
          </Paper>

          {/* PLACE ORDER BUTTON */}
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
              fontSize: "1.1rem",
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



