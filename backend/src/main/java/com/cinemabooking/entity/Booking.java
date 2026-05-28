package com.cinemabooking.entity;

import java.math.BigDecimal;

import com.cinemabooking.enums.BookingStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "bookings")
public class Booking extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "ticket_amount", precision = 10, scale = 2)
    private BigDecimal ticketAmount = BigDecimal.ZERO;

    @Column(name = "food_amount", precision = 10, scale = 2)
    private BigDecimal foodAmount = BigDecimal.ZERO;

    @Column(name = "payment_method", length = 40)
    private String paymentMethod = "DEMO_CARD";

    @Column(name = "payment_status", length = 30)
    private String paymentStatus = "PENDING";

    @Column(name = "payment_reference", length = 80)
    private String paymentReference = "PAY-DEMO";

    @Column(name = "seat_summary", length = 250)
    private String seatSummary;
}
