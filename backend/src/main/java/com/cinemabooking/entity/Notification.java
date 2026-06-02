package com.cinemabooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
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
@Table(
        name = "notifications",
        indexes = {
                @Index(name = "idx_notifications_user_created_at", columnList = "user_id, created_at DESC"),
                @Index(name = "idx_notifications_user_read", columnList = "user_id, is_read")
        }
)
public class Notification extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "action_url", length = 250)
    private String actionUrl;

    @Column(name = "is_read", nullable = false)
    private boolean read;
}
