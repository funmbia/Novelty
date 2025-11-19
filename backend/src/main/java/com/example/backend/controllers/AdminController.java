package com.example.backend.controllers;

import com.example.backend.dto.BookDto;
import com.example.backend.dto.OrderDto;
import com.example.backend.dto.Response;
import com.example.backend.dto.UserDto;
import com.example.backend.services.CatalogService;
import com.example.backend.services.OrderService;
import com.example.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final OrderService orderService;
    private final CatalogService catalogService;

    @GetMapping("/health")
    public String health(){
        return "OK";
    }

    @GetMapping("/orders")
    public Response getSalesHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        Page<OrderDto> ordersPage =
                orderService.getSalesHistory(page, size, customerId, productId, from, to);

        return Response.builder()
                .status(200)
                .message("Sales history retrieved successfully")
                .orderList(ordersPage.getContent())
                .totalPage(ordersPage.getTotalPages())
                .totalElements(ordersPage.getTotalElements())
                .build();
    }

    @PostMapping("/create/book")
    public Response createBook(@RequestBody BookDto bookDto){
        BookDto createdBook = catalogService.createBook(bookDto);
        return Response.builder()
                .status(201)
                .message("User created successfully")
                .book(createdBook)
                .build();
    }

    @DeleteMapping("/{id}")
    public Response deleteBook(@PathVariable Long id){
        catalogService.deleteBook(id);
        return Response.builder()
                .status(200)
                .message("User deleted successfully")
                .build();
    }



}
