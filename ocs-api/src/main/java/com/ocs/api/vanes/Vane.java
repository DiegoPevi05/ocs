package com.ocs.api.vanes;

import com.ocs.api.poles.Pole;
import com.ocs.api.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vanes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vane extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pole_a_id", nullable = false)
    private Pole poleA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pole_b_id", nullable = false)
    private Pole poleB;

    @Column(nullable = false)
    private String configuration;

    private Double cwWeight;
    private Double cwTension;
    private Double swWeight;
    private Double swTension;
    private Double initialSeparation;
    private Integer qtyDroppers;
    private Double dropperWeight;
    private Double stepSize;

    @Column(columnDefinition = "jsonb")
    private String calcResultJson;
}
