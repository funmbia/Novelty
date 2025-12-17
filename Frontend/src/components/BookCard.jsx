import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button,
  Box,
} from "@mui/material";

export default function BookCard({ book, onAddToCart, onViewDetails }) {
  const isOutOfStock = book.quantity === 0;
  const isLowStock = book.quantity > 0 && book.quantity <= 5;

  return (
    <Card
      onClick={() => onViewDetails(book.bookId)}
      sx={{
        width: { xs: 170, sm: 200, md: 240, lg: 260, xl: 300 },
        height: { xs: 330, sm: 360, md: 420, lg: 450, xl: 500 },
        m: 1,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "12px",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <CardMedia
          component="img"
          image={book.imageUrl}
          alt={book.title}
          sx={{
            height: { xs: 160, sm: 180, md: 220, lg: 250, xl: 280 },
            objectFit: "cover",
            filter: isOutOfStock ? "grayscale(60%)" : "none",
          }}
        />

        <CardContent sx={{ flexGrow: 1, px: 2 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            noWrap
            sx={{ fontSize: { xs: "0.9rem", md: "1.05rem", lg: "1.15rem" } }}
          >
            {book.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontSize: { xs: "0.75rem", md: "0.9rem" } }}
          >
            {book.author}
          </Typography>

          <Typography
            variant="body1"
            sx={{ mt: 1, fontSize: { xs: "0.9rem", md: "1rem" } }}
          >
            ${book.price.toFixed(2)}
          </Typography>

          {/* STOCK LABEL */}
          {isOutOfStock && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 0.5, display: "block", fontWeight: 600 }}
            >
              Out of stock
            </Typography>
          )}

          {isLowStock && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{ mt: 0.5, display: "block", fontWeight: 600 }}
            >
              Only {book.quantity} left
            </Typography>
          )}
        </CardContent>
      </Box>

      <CardActions sx={{ justifyContent: "center", pb: 2, px: 2 }}>
        <Button
          size="small"
          variant="contained"
          fullWidth
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(book);
          }}
          sx={{
            borderRadius: "20px",
            backgroundColor: isOutOfStock ? "#9e9e9e" : "#3f51b5",
            textTransform: "none",
            fontWeight: "bold",
            py: 1,
            fontSize: { xs: "0.75rem", md: "0.9rem" },
            "&:hover": {
              backgroundColor: isOutOfStock ? "#9e9e9e" : "#303f9f",
              transform: isOutOfStock ? "none" : "scale(1.03)",
            },
            transition: "0.2s ease",
          }}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardActions>
    </Card>
  );
}
