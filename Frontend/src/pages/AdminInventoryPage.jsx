import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, Snackbar, Pagination,
  CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip,
  OutlinedInput, IconButton, Popover, Badge
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { primaryButton, secondaryButton, errorButton } from "../utils/buttonStyles";
import { useAuth } from "../context/AuthContext";
import { createBook, getBookById, updateBookStock, deleteBook } from "../api/adminApi";
import { listBooks, getGenres } from "../api/catalogAPI";

export default function AdminInventoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const authToken = user?.authToken;

  const [alert, setAlert] = useState({ open: false, severity: "success", message: "" });
  
  // book states
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // search states
  const [searchBookId, setSearchBookId] = useState("");
  const [searchTitleAuthor, setSearchTitleAuthor] = useState("");
  const [activeSearch, setActiveSearch] = useState({ type: null, value: "" });
  
  // filter and sort states
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState("title");
  
  // popover states
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  
  // book states
  const [selectedBook, setSelectedBook] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [newBookModalOpen, setNewBookModalOpen] = useState(false);
  const [newBookData, setNewBookData] = useState({
    title: "", author: "", isbn: "", price: "", description: "",
    imageUrl: "", thumbnailUrl: "", quantity: "", year: "", genres: []
  });

  // page states
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  
  // computed values
  const hasActiveFilters = selectedGenres.length > 0 || sortBy !== "title";
  const activeFilterCount = selectedGenres.length + (sortBy !== "title" ? 1 : 0);

  // ---------------------- ALERT HANDLERS ----------------------
  const showAlert = (severity, message) => {
    setAlert({ open: true, severity, message });
  };

  const closeAlert = () => {
    setAlert({ open: false, severity: "success", message: "" });
  };

  // ------------------- LOAD BOOKS -------------------
  async function loadBooks(pageNum = 0) {
    setLoading(true);
    try {
      const response = await listBooks({ 
        page: pageNum, 
        size: pageSize, 
        sort: sortBy,
        search: activeSearch.type === "titleAuthor" ? activeSearch.value : "",
        genre: selectedGenres.join(",")
      });
      
      setBooks(response.bookList || []);
      setTotalBooks(response.totalElements || 0);
      setTotalPages(response.totalPage || 0);
    } catch (err) {
      console.error(err);
      showAlert("error", "Failed to load books. Please try again.");
      setBooks([]);
      setTotalBooks(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------- LOAD GENRES ----------------------
  useEffect(() => {
    async function fetchGenres() {
      try {
        const response = await getGenres();
        setAvailableGenres(response.genres || []);
      } catch (err) {
        console.error("Failed to load genres:", err);
      }
    }
    fetchGenres();
  }, []);

  // ------------------- SEARCH BY BOOK ID -------------------
  async function searchByBookId() {
    if (!searchBookId.trim()) {
      showAlert("warning", "Please enter a Book ID");
      return;
    }

    setLoading(true);
    try {
      const book = await getBookById(searchBookId.trim());
      setBooks([book]);
      setTotalBooks(1);
      setTotalPages(1);
      setPage(0);
      setActiveSearch({ type: "bookId", value: searchBookId.trim() });
      
      // Clear filters AFTER setting active search to prevent useEffect interference
      setSelectedGenres([]);
      setSortBy("title");
    } catch (err) {
      console.error(err);
      setActiveSearch({ type: "bookId", value: searchBookId.trim() });
      setBooks([]);
      setTotalBooks(0);
      setTotalPages(0);
      
      // Clear filters even on error
      setSelectedGenres([]);
      setSortBy("title");
    } finally {
      setLoading(false);
    }
  }

  // ------------------- SEARCH BY TITLE/AUTHOR -------------------
  async function searchByTitleAuthor() {
    if (!searchTitleAuthor.trim()) {
      showAlert("warning", "Please enter a title or author name");
      return;
    }

    // Clear all filters when searching
    setSelectedGenres([]);
    setSortBy("title");

    setActiveSearch({ type: "titleAuthor", value: searchTitleAuthor.trim() });
    setPage(0);
  }

  // ------------------- CLEAR SEARCH -------------------
  function clearSearch() {
    setSearchBookId("");
    setSearchTitleAuthor("");
    setActiveSearch({ type: null, value: "" });
    setPage(0);
  }

  // ------------------- CLEAR ALL FILTERS -------------------
  function clearAllFilters() {
    setSelectedGenres([]);
    setSortBy("title");
    setFilterAnchor(null);
    setSortAnchor(null);
  }

  // ------------------- LOAD BOOKS WHEN SEARCH/PAGE/FILTERS CHANGE -------------------
  useEffect(() => {
    if (activeSearch.type === "bookId") {
      return;
    }
    loadBooks(page);
  }, [page, activeSearch, selectedGenres, sortBy]);

  // ------------------- PAGINATION HANDLER -------------------
  const handlePageChange = (event, value) => {
    setPage(value - 1);
  };

  // ------------------- GENRE FILTER HANDLER -------------------
  const handleGenreChange = (event) => {
    const value = event.target.value;
    setSelectedGenres(typeof value === 'string' ? value.split(',') : value);
    setPage(0);
  };

  // ------------------- SORT HANDLER -------------------
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(0);
    setSortAnchor(null);
  };

  // ------------------- ADJUST INVENTORY HANDLER -------------------
  async function handleSaveStock() {
    if (newStock === "") {
      showAlert("warning", "Enter a quantity.");
      return;
    }

    try {
      await updateBookStock(authToken, selectedBook.bookId, Number(newStock));
      showAlert("success", "Stock updated successfully!");
      setSelectedBook(null);
      setNewStock("");
      
      if (activeSearch.type === "bookId") {
        searchByBookId();
      } else {
        loadBooks(page);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error updating stock.");
    }
  }

  // ------------------- DELETE BOOK HANDLER -------------------
  async function handleDeleteBook() {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      await deleteBook(authToken, selectedBook.bookId);
      showAlert("success", "Book deleted successfully!");
      setSelectedBook(null);
      
      if (activeSearch.type === "bookId") {
        clearSearch();
      } else {
        loadBooks(page);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error deleting book.");
    }
  }

  // ------------------- ADD NEW BOOK HANDLER -------------------
  async function handleAddBook(e) {
    e.preventDefault();
    try {
      const payload = {
        title: newBookData.title,
        author: newBookData.author,
        isbn: newBookData.isbn,
        price: Number(newBookData.price),
        description: newBookData.description,
        imageUrl: newBookData.imageUrl,
        thumbnailUrl: newBookData.thumbnailUrl,
        quantity: Number(newBookData.quantity),
        year: Number(newBookData.year),
        genres: newBookData.genres.length ? newBookData.genres : []
      };

      await createBook(authToken, payload);
      showAlert("success", "Book created successfully!");
      
      setNewBookModalOpen(false);
      setNewBookData({
        title: "", author: "", isbn: "", price: "", description: "",
        imageUrl: "", thumbnailUrl: "", quantity: "", year: "", genres: []
      });
      
      if (activeSearch.type === "bookId") {
        clearSearch();
      } else {
        loadBooks(page);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error creating book.");
    }
  }

  return (
    <Box sx={{ ml: 0, px: { xs: 2, md: 5 }, py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", textAlign: "center" }}>
        Maintain Inventory
      </Typography>

      {/* SEARCH SECTION */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>Search</Typography>
        
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          {/* Book ID Search */}
          <Box>
            <TextField 
              label="Book ID" 
              value={searchBookId} 
              onChange={(e) => setSearchBookId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchByBookId()}
              placeholder="Enter exact Book ID..."
              fullWidth
              disabled={loading}
            />
            <Button 
              variant="outlined" 
              sx={{ ...secondaryButton, mt: 1 }} 
              onClick={searchByBookId}
              disabled={loading || !searchBookId.trim()}
              fullWidth
            >
              Search by ID
            </Button>
          </Box>

          {/* Title/Author Search */}
          <Box>
            <TextField 
              label="Title / Author" 
              value={searchTitleAuthor} 
              onChange={(e) => setSearchTitleAuthor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchByTitleAuthor()}
              placeholder="Search by title or author..."
              fullWidth
              disabled={loading}
            />
            <Button 
              variant="outlined" 
              sx={{ ...secondaryButton, mt: 1 }} 
              onClick={searchByTitleAuthor}
              disabled={loading || !searchTitleAuthor.trim()}
              fullWidth
            >
              Search by Title/Author
            </Button>
          </Box>
        </Box>

        {/* active search summary */}
        {activeSearch.type && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Active search: <strong>
                {activeSearch.type === "bookId" 
                  ? `Book ID: ${activeSearch.value}` 
                  : `Title/Author: "${activeSearch.value}"`}
              </strong>
              {books.length === 0 && !loading && (
                <span style={{ color: '#d32f2f', marginLeft: '8px' }}>
                  (no results)
                </span>
              )}
            </Typography>
            <Button 
              variant="outlined" 
              sx={secondaryButton} 
              onClick={clearSearch}
            >
              Clear Search
            </Button>
          </Box>
        )}
      </Paper>

      {/* COMPACT FILTER & SORT BAR */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        gap: 2, 
        mb: 3,
        flexWrap: "wrap"
      }}>
        {/* Filter Button */}
        <Button
          size="small"
          startIcon={
            <Badge badgeContent={selectedGenres.length} color="primary">
              <FilterListIcon />
            </Badge>
          }
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          disabled={loading || activeSearch.type === "bookId"}
          sx={{ 
            textTransform: "none", 
            color: "text.secondary",
            fontSize: "0.875rem"
          }}
        >
          Filter by Genre
        </Button>

        {/* Sort Button */}
        <Button
          size="small"
          startIcon={<SortIcon />}
          onClick={(e) => setSortAnchor(e.currentTarget)}
          disabled={loading || activeSearch.type === "bookId"}
          sx={{ 
            textTransform: "none", 
            color: "text.secondary",
            fontSize: "0.875rem"
          }}
        >
          Sort: {sortBy === "title" ? "Title" : sortBy === "author" ? "Author" : sortBy === "price" ? "Price" : sortBy === "year" ? "Year" : "Stock"}
        </Button>

        {/* Clear Filters Link */}
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={clearAllFilters}
            sx={{ 
              textTransform: "none", 
              color: "primary.main",
              fontSize: "0.875rem",
              textDecoration: "underline"
            }}
          >
            Clear filters
          </Button>
        )}
      </Box>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          gap: 1, 
          mb: 3,
          flexWrap: "wrap"
        }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            Active filters:
          </Typography>
          {selectedGenres.map((genre) => (
            <Chip
              key={genre}
              label={genre}
              size="small"
              onDelete={() => {
                setSelectedGenres(selectedGenres.filter(g => g !== genre));
                setPage(0);
              }}
              sx={{ fontSize: "0.75rem" }}
            />
          ))}
          {sortBy !== "title" && (
            <Chip
              label={`Sort: ${sortBy}`}
              size="small"
              onDelete={() => {
                setSortBy("title");
                setPage(0);
              }}
              sx={{ fontSize: "0.75rem" }}
            />
          )}
        </Box>
      )}

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Filter by Genre
            </Typography>
            <IconButton size="small" onClick={() => setFilterAnchor(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel id="genre-filter-popover-label">Select Genres</InputLabel>
            <Select
              labelId="genre-filter-popover-label"
              multiple
              value={selectedGenres}
              onChange={handleGenreChange}
              input={<OutlinedInput label="Select Genres" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableGenres.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Popover>

      {/* Sort Popover */}
      <Popover
        open={Boolean(sortAnchor)}
        anchorEl={sortAnchor}
        onClose={() => setSortAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Sort By
            </Typography>
            <IconButton size="small" onClick={() => setSortAnchor(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <FormControl fullWidth size="small">
            <Select
              value={sortBy}
              onChange={handleSortChange}
            >
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="author">Author</MenuItem>
              <MenuItem value="price">Price</MenuItem>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="quantity">Stock Quantity</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Popover>

      {/* ADD BOOK BUTTON & PAGINATION INFO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Button 
          variant="contained" 
          sx={primaryButton} 
          onClick={() => setNewBookModalOpen(true)}
        >
          Add New Book
        </Button>
        <Typography variant="body2" sx={{ color: "gray" }}>
          {loading ? "Loading..." : (
            books.length > 0 ? (
              <>
                {(activeSearch.type || hasActiveFilters) ? (
                  <>
                    <span style={{ fontWeight: "bold" }}>
                      {activeSearch.type ? "Search Results" : "Filtered Results"}:
                    </span> Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, page * pageSize + books.length)} of {totalBooks} books
                  </>
                ) : (
                  <>
                    Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, page * pageSize + books.length)} of {totalBooks} books
                  </>
                )}
              </>
            ) : "No books to display"
          )}
        </Typography>
      </Box>

      {/* PAGINATION */}
      {totalPages > 1 && !loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb:2 }}>
          <Pagination 
            count={totalPages} 
            page={page + 1} 
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* BOOK TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, position: "relative", minHeight: "400px" }}>
        {loading && (
          <Box sx={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 1
          }}>
            <CircularProgress size={60} />
          </Box>
        )}
        
        <Table>
          <TableHead sx={{ backgroundColor: "#f3f3f3" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Book ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Author</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>ISBN</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Stock</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {books.map((book) => (
              <TableRow key={book.bookId}>
                <TableCell>{book.bookId}</TableCell>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>{book.isbn}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {book.quantity}
                    {book.quantity < 5 && 
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "orange" }}>
                        <WarningAmberIcon sx={{ fontSize: "1.2rem" }} />
                      </Box>
                    }
                  </Box>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    sx={secondaryButton} 
                    onClick={() => { 
                      setSelectedBook(book); 
                      setNewStock(book.quantity ?? 0); 
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && books.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", color: "gray", py: 4 }}>
                  {activeSearch.type 
                    ? "No books found matching your search." 
                    : "No books available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* EDIT BOOK MODAL */}
      {selectedBook && (
        <Dialog open onClose={() => setSelectedBook(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: "bold" }}>
            Book #{selectedBook.bookId}: {selectedBook.title}
          </DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ mb: 1 }}>
              Current Stock: <strong>{selectedBook.quantity}</strong>
              {selectedBook.quantity < 5 && 
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "orange" }}>
                        <WarningAmberIcon sx={{ fontSize: "1.2rem" }} />
                        <span>Low Stock</span>
                </Box>
              // (
              //   <Chip 
              //     label="Low Stock" 
              //     color="warning" 
              //     size="small"
              //     sx={{ ml: 1, fontWeight: "bold" }}
              //   />
              // )
              }
            </Typography>
            <Divider sx={{ my: 2 }} />
            <TextField 
              label="Set Stock To:" 
              type="number" 
              fullWidth 
              value={newStock} 
              onChange={(e) => setNewStock(e.target.value)} 
            />
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between" }}>
            <Button 
              onClick={handleDeleteBook} 
              variant="contained" 
              sx={errorButton}
            >
              Delete Book
            </Button>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button 
                variant="outlined" 
                sx={secondaryButton} 
                onClick={() => setSelectedBook(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveStock} 
                variant="contained" 
                sx={primaryButton}
              >
                Save
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* NEW BOOK MODAL */}
      {newBookModalOpen && (
        <Dialog open onClose={() => setNewBookModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: "bold" }}>Add New Book</DialogTitle>
          <DialogContent dividers>
            <Box component="form" onSubmit={handleAddBook}>
              <TextField 
                required 
                label="Title" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.title} 
                onChange={e => setNewBookData({ ...newBookData, title: e.target.value })} 
              />
              <TextField 
                required 
                label="Author" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.author} 
                onChange={e => setNewBookData({ ...newBookData, author: e.target.value })} 
              />
              <TextField 
                required 
                label="ISBN" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.isbn} 
                onChange={e => setNewBookData({ ...newBookData, isbn: e.target.value })} 
              />
              <TextField 
                required 
                label="Price" 
                type="number" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.price} 
                onChange={e => setNewBookData({ ...newBookData, price: parseFloat(e.target.value) || 0.0 })} 
              />
              <TextField 
                required 
                label="Description" 
                fullWidth 
                multiline 
                rows={3} 
                sx={{ mb: 2 }} 
                value={newBookData.description} 
                onChange={e => setNewBookData({ ...newBookData, description: e.target.value })} 
              />
              <TextField 
                required 
                label="Image URL" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.imageUrl} 
                onChange={e => setNewBookData({ ...newBookData, imageUrl: e.target.value })} 
              />
              <TextField 
                required 
                label="Thumbnail URL" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.thumbnailUrl} 
                onChange={e => setNewBookData({ ...newBookData, thumbnailUrl: e.target.value })} 
              />
              <TextField 
                required 
                label="Quantity" 
                type="number" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.quantity} 
                onChange={e => setNewBookData({ ...newBookData, quantity: parseInt(e.target.value, 10) || 0 })} 
              />
              <TextField 
                required 
                label="Year" 
                type="number" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.year} 
                onChange={e => setNewBookData({ ...newBookData, year: parseInt(e.target.value, 10) })} 
              />
              <TextField 
                required 
                label="Genres (comma separated)" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={newBookData.genres.join(", ")} 
                onChange={e => setNewBookData({ ...newBookData, genres: e.target.value.split(",").map(g => g.trim()) })} 
              />
              
              <DialogActions>
                <Button 
                  onClick={() => setNewBookModalOpen(false)} 
                  variant="outlined" 
                  sx={secondaryButton}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  sx={primaryButton}
                >
                  Add Book
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* UNIFIED ALERT SNACKBAR */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={closeAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
