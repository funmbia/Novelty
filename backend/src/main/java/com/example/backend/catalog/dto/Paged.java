package com.example.backend.catalog.dto;

import java.util.List;

public record Paged<T>(List<T> items, int page, int size, long totalItems, int totalPages) {}

