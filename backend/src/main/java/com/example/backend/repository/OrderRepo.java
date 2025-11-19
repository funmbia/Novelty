package com.example.backend.repository;

import com.example.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;


public interface OrderRepo extends JpaRepository<Order, Long> {

    Page<Order> findByUser_UserId(Long userId, Pageable pageable);

    Page<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Order> findByUser_UserIdAndCreatedAtBetween(
            Long userId,
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable
    );

    @Query("""
           SELECT DISTINCT o 
           FROM Order o 
           JOIN o.orderItemList oi 
           WHERE oi.book.bookId = :bookId
           """)
    Page<Order> findByProduct(@Param("bookId") Long bookId, Pageable pageable);

    @Query("""
           SELECT DISTINCT o 
           FROM Order o 
           JOIN o.orderItemList oi 
           WHERE oi.book.bookId = :bookId 
           AND o.createdAt BETWEEN :start AND :end
           """)
    Page<Order> findByProductAndDateRange(
            @Param("bookId") Long bookId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );

}
