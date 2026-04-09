package com.ocs.api.poles;

import com.ocs.api.shared.BaseEntity;
import com.ocs.api.tracks.Track;
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
@Table(name = "poles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pole extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    @Column(nullable = false)
    private Integer positionAlongTrackMm;

    @Column(columnDefinition = "jsonb")
    private String geoPosition;

    @Column(nullable = false)
    private String poleType;

    private Integer cantileversQuantity;
    private Double catSeparation;

    // Structural & Profile Properties
    private Double height;
    private Double density;
    private Double inertiaX;
    private Double inertiaY;
    private Double inertiaZ;
    private Double crossAreaX;
    private Double crossAreaY;
    private Double crossAreaZ;
    private String profileType;
    private Double width;    // cross-section width mm
    private Double length;   // cross-section depth mm
}
