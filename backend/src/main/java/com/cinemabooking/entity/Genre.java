package com.cinemabooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "genres", uniqueConstraints = {
        @UniqueConstraint(name = "uk_genres_name", columnNames = "name")
})
public class Genre extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;
}