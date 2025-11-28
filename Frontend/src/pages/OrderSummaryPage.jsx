import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useEffect, useState } from "react";
import { getUserOrderById } from "../api/orderApi";
import { useAuth } from "../context/AuthContext";

export default function OrderSummaryPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
 const { user } = useAuth();
  const passed = location.state; // shipping + billing from checkout

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real order from backend
  useEffect(() => {
  if (!user) return;

  async function loadOrder() {
    try {
      const data = await getUserOrderById(orderId, user.authToken);
      if (data.order) {
        setOrder(data.order);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch order");
    }finally {
      setLoading(false); 
    }
  }

  loadOrder();
}, [orderId, user]);

  if (loading) {
    return (
      <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Order not found.</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2, borderRadius: "20px", textTransform: "none" }}
          onClick={() => navigate("/")}
        >
          Return Home
        </Button>
      </Box>
    );
  }

  // Shipping & billing passed from checkout
  const shipping = passed?.shipping;
  const billing = passed?.billing;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        px: { xs: 2, md: 6 },
        py: 4,
        ml: { sm: "240px" },
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: "900px",
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          backgroundColor: "white",
        }}
      >
        {/* Success Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: "green" }} />
          <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold" }}>
            Order Successful!
          </Typography>
          <Typography sx={{ color: "gray", mt: 1 }}>
            Thank you for your purchase.
          </Typography>
        </Box>

        {/* Order Summary */}
        <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
          Order #{order.orderId}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={4}>
          {/* SHIPPING INFO */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Shipping Information
            </Typography>

            {shipping ? (
              <>
                <Typography>{shipping.street}</Typography>
                <Typography>{shipping.city}</Typography>
                <Typography>{shipping.postal}</Typography>
              </>
            ) : (
              <Typography sx={{ fontStyle: "italic" }}>
                Shipping details unavailable
              </Typography>
            )}
          </Grid>

          {/* PAYMENT INFO */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Payment Details
            </Typography>

            {billing ? (
              <>
                <Typography>Card ending in {billing.last4}</Typography>

                {billing.expiryMonth && (
                  <Typography>
                    Exp: {billing.expiryMonth}/{billing.expiryYear}
                  </Typography>
                )}
              </>
            ) : (
              <Typography sx={{ fontStyle: "italic" }}>
                Payment details unavailable
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* ITEMS */}
        <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: "bold" }}>
          Books Purchased
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {order.orderItemList.map((item) => (
          <Box
            key={item.orderItemId}
            sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
          >
            <Typography>{item.book.title}</Typography>
            <Typography>
              {item.quantity} × ${item.price.toFixed(2)}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* TOTAL */}
        <Typography variant="h5" sx={{ textAlign: "right", fontWeight: "bold" }}>
          Total: ${order.totalPrice.toFixed(2)}
        </Typography>

        {/* ACTION BUTTONS */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: "bold",
              py: 1.2,
              px: 3,
              borderWidth: "2px",
              borderColor: "#3f51b5",
              color: "#3f51b5",
              "&:hover": {
                borderColor: "#303f9f",
                color: "#303f9f",
                transform: "scale(1.03)",
              },
            }}
            onClick={() => navigate("/orders")}
          >
            View Orders
          </Button>

          <Button
            variant="contained"
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: "bold",
              py: 1.2,
              px: 3,
              backgroundColor: "#3f51b5",
              "&:hover": {
                backgroundColor: "#303f9f",
                transform: "scale(1.03)",
              },
            }}
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
