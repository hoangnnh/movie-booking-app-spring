package com.cinemabooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "cinemas")
public class Cinema extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 80)
    private String brand;

    @Column(nullable = false)
    private String address;

    @Column(length = 80)
    private String district;

    @Column(length = 80)
    private String city;

    @Column(length = 30)
    private String hotline;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 500)
    private String amenities;
}
