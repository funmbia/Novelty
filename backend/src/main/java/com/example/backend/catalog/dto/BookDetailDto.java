package com.example.backend.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public record BookDetailDto(Long id, String title, String author, String description,
                            BigDecimal price, Integer stock, List<String> categories, String imageUrl) {}

