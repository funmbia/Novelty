package com.example.backend.catalog.dto;

import java.math.BigDecimal;

public record BookSummaryDto(Long id, String title, String author, BigDecimal price, String thumbnailUrl) {}

