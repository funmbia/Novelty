package com.example.backend.services;

import com.example.backend.dto.OrderDto;
import com.example.backend.dto.OrderItemDto;
import com.example.backend.dto.BookDto;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

// Service for order management - creating orders, viewing order history
@Service
@Transactional
public class OrderService {

    private final OrderRepo orderRepo;
    private final UserRepo userRepo;
    private final CartRepo cartRepo;

    public OrderService(OrderRepo orderRepo, UserRepo userRepo, CartRepo cartRepo) {
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
        this.cartRepo = cartRepo;
    }

    // Get all orders (admin function)
    public List<OrderDto> getAllOrders() {
        return orderRepo.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Get specific order by ID
    public OrderDto getOrderById(Long id) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return convertToDto(order);
    }

    // Create order from user's cart
    public OrderDto createOrderFromCart(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Cart cart = cartRepo.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        if (cart.getCartItemList().isEmpty()) {
            throw new RuntimeException("Cannot create order from empty cart");
        }

        // Create new order
        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING");

        // Convert cart items to order items and calculate total
        BigDecimal totalPrice = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getCartItemList()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setBook(cartItem.getBook());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getBook().getPrice());

            order.getOrderItemList().add(orderItem);

            // Calculate total: price * quantity
            BigDecimal itemTotal = cartItem.getBook().getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalPrice = totalPrice.add(itemTotal);
        }

        order.setTotalPrice(totalPrice);

        // Save order and clear cart
        Order savedOrder = orderRepo.save(order);
        cart.getCartItemList().clear();
        cartRepo.save(cart);

        return convertToDto(savedOrder);
    }

    // Update order status
    public OrderDto updateOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        order.setStatus(status);
        Order updatedOrder = orderRepo.save(order);
        return convertToDto(updatedOrder);
    }

    // Cancel order (if still pending)
    public void cancelOrder(Long orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Only pending orders can be cancelled");
        }

        orderRepo.delete(order);
    }

    // Get the sales history based on the user, products, and time frame
    public Page<OrderDto> getSalesHistory(
            int page,
            int size,
            Long customerId,
            Long productId,
            LocalDate from,
            LocalDate to
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (from != null && to != null) {
            startDateTime = from.atStartOfDay();
            endDateTime = to.atTime(LocalTime.MAX);
        }

        Page<Order> ordersPage;

        // Decide which repo method to call based on what filters are provided
        if (customerId != null && startDateTime != null && productId == null) {
            ordersPage = orderRepo.findByUser_UserIdAndCreatedAtBetween(customerId, startDateTime, endDateTime, pageable);
        } else if (customerId != null && productId == null) {
            ordersPage = orderRepo.findByUser_UserId(customerId, pageable);
        } else if (productId != null && startDateTime != null) {
            ordersPage = orderRepo.findByProductAndDateRange(productId, startDateTime, endDateTime, pageable);
        } else if (productId != null) {
            ordersPage = orderRepo.findByProduct(productId, pageable);
        } else if (startDateTime != null) {
            ordersPage = orderRepo.findByCreatedAtBetween(startDateTime, endDateTime, pageable);
        } else {
            // No filters, return all orders
            ordersPage = orderRepo.findAll(pageable);
        }
        return ordersPage.map(this::convertToDto);
    }



    // Convert Order entity to OrderDto
    private OrderDto convertToDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setOrderId(order.getOrderId());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());

        // Convert order items without circular references
        if (order.getOrderItemList() != null) {
            dto.setOrderItemList(order.getOrderItemList().stream()
                    .map(this::convertOrderItemToDto)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // Convert OrderItem to OrderItemDto
    private OrderItemDto convertOrderItemToDto(OrderItem orderItem) {
        OrderItemDto dto = new OrderItemDto();
        dto.setOrderItemId(orderItem.getOrderItemId());
        dto.setQuantity(orderItem.getQuantity());
        dto.setPrice(orderItem.getPrice());

        // Include book info
        if (orderItem.getBook() != null) {
            dto.setBook(convertBookToDto(orderItem.getBook()));
        }

        return dto;
    }

    // Convert Book to BookDto
    private BookDto convertBookToDto(Book book) {
        BookDto dto = new BookDto();
        dto.setBookId(book.getBookId());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setPrice(book.getPrice());
        dto.setDescription(book.getDescription());
        dto.setIsbn(book.getIsbn());
        dto.setImageUrl(book.getImageUrl());
        dto.setQuantity(book.getQuantity());
        dto.setYear(book.getYear());
        dto.setGenres(book.getGenres());
        return dto;
    }
}

