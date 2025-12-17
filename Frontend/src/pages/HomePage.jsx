import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Pagination,
} from "@mui/material";
import BookCard from "../components/BookCard";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import { useCart } from "../context/CartContext";
import { listBooks, getGenres } from "../api/catalogAPI";

const PAGE_SIZE = 12;

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  // Read genre from URL
  const urlGenre = new URLSearchParams(location.search).get("genre") || "All";

  // State
  const [genres, setGenres] = useState(["All"]);
  const [selectedGenre, setSelectedGenre] = useState(urlGenre);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // UI Sorting for descending
  const backendSortField = {
    priceLowHigh: "price",
    priceHighLow: "price",
    titleAZ: "title",
    titleZA: "title",
    none: "title",
  };

  // Load genres once
  useEffect(() => {
    getGenres().then((data) => {
      if (data.genres) {
        setGenres(["All", ...data.genres]);
      }
    });
  }, []);

  // Fetch books from backend
  const fetchBooks = () => {
    setLoading(true);

    listBooks({
      page: page - 1,
      size: PAGE_SIZE,
      sort: backendSortField[sortBy],
      search: searchQuery.trim() === "" ? null : searchQuery,
      genre: selectedGenre === "All" ? null : selectedGenre,
    })
      .then((data) => {
        let result = data.bookList || [];

        if (sortBy === "priceHighLow") {
          result = [...result].sort((a, b) => b.price - a.price);
        } else if (sortBy === "titleZA") {
          result = [...result].sort((a, b) =>
            b.title.localeCompare(a.title)
          );
        }

        setBooks(result);
        setTotalPages(data.totalPage || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading books:", err);
        setLoading(false);
      });
  };

  // Fetch whenever filters change
  useEffect(() => {
    setPage(1);
  }, [selectedGenre, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedGenre, sortBy]);

  // Update selected genre if user clicks genre in navbar
  useEffect(() => {
    setSelectedGenre(urlGenre);
  }, [urlGenre]);

  // Search submit
  const handleSearch = () => {
    setPage(1);
    fetchBooks();
  };

  const handleAddToCart = (book) => {
    addToCart(book);
  };

  const handleViewDetails = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Search Bar + Sort Dropdown */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minWidth: { xs: "100%", sm: "60%", md: "70%" },
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={handleSearch}
          />
        </Box>

        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-end" },
          }}
        >
          <FilterPanel sortBy={sortBy} setSortBy={setSortBy} />
        </Box>
      </Box>

      {/* Books Grid */}
      {loading ? (
        <Box textAlign="center" mt={5}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>Loading books...</Typography>
        </Box>
      ) : books.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          mt={4}
        >
          No books found.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2} justifyContent="center">
            {books.map((book) => (
              <Grid item key={book.bookId} xs={12} sm={6} md={3}>
                <BookCard
                  book={book}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
