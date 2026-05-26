package com.cinemabooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "movie_list_entries",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_movie_list_entry_category_movie",
                columnNames = {"category", "movie_id"}
        )
)
public class MovieListEntry extends BaseEntity {

    @Column(nullable = false, length = 80)
    private String category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
