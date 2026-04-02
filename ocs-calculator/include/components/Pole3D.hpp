#pragma once
#include "math/Vec3.hpp"
#include "components/PoleData.hpp" // For the structs PoleModel, etc.
#include "components/Model.hpp" // For Pov, etc.
#include "viewer/Viewer3D.hpp"
#include <optional>

namespace catenary {

class Pole3D {
public:
    components::PoleModel model;
    math::Vec3 globalPosition;
    components::Pov pov;

    // Derived anchor points
    math::Vec3 polePosition;

    Pole3D(const std::optional<components::PoleProperties>& poleProps, components::Pov pov);

    // Calculates and updates the internal pole position based on POV 
    void calculateGeometries(const math::Vec3& globalPv);
    
    // Returns adjusted PV based on POV
    math::Vec3 getAdjustedPv(const math::Vec3& globalPv) const;
    
    // Returns the normalized direction from Pole to PV in XZ plane
    math::Vec3 getDirectionToPv(const math::Vec3& globalPv) const;

    // Fixed points offsets
    math::Vec3 getBottomFixedPoint(double bottomFixedHeight, double supportOffset, const math::Vec3& directionPv) const;
    math::Vec3 getUpperFixedPoint(const math::Vec3& bottomFixedPoint, double fixingDistance) const;
    
    std::vector<viewer::Line3D> getRenderLines() const;
};

} // namespace catenary
