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

  const urlGenre = new URLSearchParams(location.search).get("genre") || "All";

  const [genres, setGenres] = useState(["All"]);
  const [selectedGenre, setSelectedGenre] = useState(urlGenre);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  /* ----------------------------------------
     Backend sort + order mappings
     ---------------------------------------- */

  const backendSortField = {
    priceLowHigh: "price",
    priceHighLow: "price",
    titleAZ: "title",
    titleZA: "title",
    none: "title",
  };

  const backendSortOrder = {
    priceLowHigh: "asc",
    priceHighLow: "desc",
    titleAZ: "asc",
    titleZA: "desc",
    none: "asc",
  };

  /* ----------------------------------------
     Load genres once
     ---------------------------------------- */

  useEffect(() => {
    getGenres().then((data) => {
      if (data.genres) {
        setGenres(["All", ...data.genres]);
      }
    });
  }, []);

  /* ----------------------------------------
     Fetch books (backend handles sorting + pagination)
     ---------------------------------------- */

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await listBooks({
        page: page - 1, // backend is 0-based
        size: PAGE_SIZE,
        sort: backendSortField[sortBy],
        order: backendSortOrder[sortBy],
        search: searchQuery.trim() || null,
        genre: selectedGenre === "All" ? null : selectedGenre,
      });

      setBooks(data.bookList || []);
      setTotalPages(data.totalPage || 0);
    } catch (err) {
      console.error("Error loading books:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
     Reset page when filters change
     ---------------------------------------- */

  useEffect(() => {
    setPage(1);
  }, [selectedGenre, sortBy, searchQuery]);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedGenre, sortBy, searchQuery]);

  /* ----------------------------------------
     Navbar genre click handling
     ---------------------------------------- */

  useEffect(() => {
    setSelectedGenre(urlGenre);
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, [urlGenre]);

  /* ----------------------------------------
     Handlers
     ---------------------------------------- */

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleAddToCart = (book) => addToCart(book);

  const handleViewDetails = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  /* ----------------------------------------
     Render
     ---------------------------------------- */

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Search + Sort */}
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
            searchQuery={searchInput}
            setSearchQuery={setSearchInput}
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

      {/* Books */}
      {loading ? (
        <Box textAlign="center" mt={5}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Loading books...
          </Typography>
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
