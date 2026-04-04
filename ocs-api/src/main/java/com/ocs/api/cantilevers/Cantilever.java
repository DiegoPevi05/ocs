package com.ocs.api.cantilevers;

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
@Table(name = "cantilevers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cantilever extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pole_id", nullable = false)
    private Pole pole;

    @Column(nullable = false)
    private String configuration;

    // ── Heights ──────────────────────────────────────────────────────────────
    private Double contactWireHeight;
    private Double systemHeight;
    private Double contactWireVerticalOffset;

    // ── Offsets & distances ───────────────────────────────────────────────────
    private Double zigzag;
    private Double supportOffset;
    private Double fixingDistance;
    private Double bottomFixedHeight;

    // ── Track geometry at this pole installation ──────────────────────────────
    // trackGauge is NOT duplicated here — resolved via pole.track.gaugeMm
    private Double u;                       // superelevation (cant) in mm
    private String curveRadiusDirection;    // "inside" | "outside"

    @Column(columnDefinition = "jsonb")
    private String calcResultJson;
}
