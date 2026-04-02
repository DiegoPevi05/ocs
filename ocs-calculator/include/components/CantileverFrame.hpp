#pragma once
#include "components/Pole3D.hpp"
#include "components/Track.hpp"
#include "components/Hardware.hpp"
#include "components/Model.hpp"
#include "math/Vec3.hpp"
#include <memory>

namespace catenary {

class CantileverFrame {
public:
    components::ModelInterface model;
    components::Track track;
    components::CurveRadiusDirection curveRadiusDirection;
    math::Vec3 pv; // Initial PV
    
    Pole3D pole;
    
    // Core Parameters
    double u;
    double supportOffset;
    double contactWireHeight;
    double contactWireVerticalOffset;
    double systemHeight;
    double zigZag;
    double fixingDistance;
    double bottomFixedHeight;

    // Derived Spatial Reference Points
    math::Vec3 cwAxis;
    math::Vec3 mwAxis;
    math::Vec3 viaAxis;
    math::Vec3 viaDirection;
    math::Vec3 directionPv;
    double trackInclination;

    // Pole Attachments
    math::Vec3 bottomPoleFixedPoint;
    math::Vec3 upperPoleFixedPoint;

    // Track if this frame's PV has already been relocated by Pole Orchestrator
    bool isRelocated = false;

    CantileverFrame(
        components::ModelInterface model,
        const components::Track& track,
        components::CurveRadiusDirection curveRadiusDirection,
        const math::Vec3& pv,
        const Pole3D& pole,
        double u,
        double supportOffset,
        double contactWireHeight,
        double contactWireVerticalOffset,
        double systemHeight,
        double zigZag,
        double fixingDistance,
        double bottomFixedHeight
    );

    void calculateGeometry();

    // Utility methods for component calculation
    double getIsolatorUtilLength(const components::Isolator& isolator) const;
    double getClevisEndFittingUtilLength(const components::ClevisEndFitting& clevis) const;
    double getSwivelClevisUtilLength(const components::SwivelBracket& bracket, const components::SwivelClevis& clevis) const;
};

} // namespace catenary
