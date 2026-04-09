#include "components/Pole3D.hpp"

namespace catenary {

Pole3D::Pole3D(const std::optional<components::PoleProperties>& poleProps, components::Pov pov)
    : pov(pov), polePosition{0, 0, 0}
{
    if (poleProps.has_value()) {
        model = poleProps->model;
        globalPosition = {poleProps->position.x, poleProps->position.y, poleProps->position.z};
    } else {
        model = { {300.0, 300.0} }; // Default: 300mm width (along-track), 300mm length (to-track)
        globalPosition = {0, 0, 0};
    }
}

void Pole3D::calculateGeometries(const math::Vec3& globalPv) {
    if (pov == components::Pov::GLOBAL) {
        polePosition = { globalPosition.x, 0, -globalPosition.z };
    } else {
        polePosition = { 0, 0, globalPosition.z };
    }
}

math::Vec3 Pole3D::getAdjustedPv(const math::Vec3& globalPv) const {
    if (pov == components::Pov::GLOBAL) {
        return { globalPv.x, 0, -globalPv.z };
    } else {
        double pvL = math::distanceBetween({globalPosition.x, globalPosition.y, globalPosition.z}, globalPv);
        return { pvL, 0, 0 };
    }
}

math::Vec3 Pole3D::getDirectionToPv(const math::Vec3& globalPv) const {
    math::Vec3 adjustedPv = getAdjustedPv(globalPv);
    return math::getDirectionVector(
        { polePosition.x, 0, polePosition.z },
        { adjustedPv.x, 0, adjustedPv.z }
    );
}

math::Vec3 Pole3D::getBottomFixedPoint(double bottomFixedHeight, double supportOffset, const math::Vec3& directionPv) const {
    math::Vec3 newPoleHeightModified = { polePosition.x, polePosition.y + bottomFixedHeight, polePosition.z };
    // length is the pole dimension in the directionPv direction (perpendicular to track, facing the arm)
    double distance = supportOffset + model.measures.length / 2.0;
    return math::getPointFromDirection(newPoleHeightModified, directionPv, distance);
}

math::Vec3 Pole3D::getUpperFixedPoint(const math::Vec3& bottomFixedPoint, double fixingDistance) const {
    return math::getPointFromDirection(bottomFixedPoint, {0, 1, 0}, fixingDistance);
}

std::vector<viewer::Line3D> Pole3D::getRenderLines() const {
    // Generate a simple mast visualization spanning from 0 to 12000 height mm
    math::Vec3 base = { polePosition.x, 0.0, polePosition.z };
    math::Vec3 top = { polePosition.x, 12000.0, polePosition.z };
    // Gray color for Pole
    return { viewer::Line3D("Pole", base, top, 100, 100, 100, 255) };
}

} // namespace catenary
