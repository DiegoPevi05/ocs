#include "assemblies/BracketTube.hpp"
#include "math/MathUtils.hpp"
#include <cmath>

namespace catenary {
namespace assemblies {

BracketTube::BracketTube(const BracketTubeParams& params, std::shared_ptr<StayTube> stayTube) 
    : params(params), stayTube(stayTube) {}

void BracketTube::calculateGeometry(const CantileverFrame& frame) {
    bottomPoleFixedPoint = frame.bottomPoleFixedPoint;
    double distance = params.swivel_clevis.pin_eye + params.swivel_bracket.x_pin;
    bottomFixedPoint = math::getPointFromDirection(frame.bottomPoleFixedPoint, frame.directionPv, distance);

    math::Vec3 H = math::subtract(stayTube->upperTubeEyeClampFixedPoint, bottomFixedPoint);
    dir = math::normalize(H);

    math::Vec3 normalPlane = math::normalize(math::cross(dir, frame.directionPv));
    perp = math::normalize(math::cross(dir, math::invert(normalPlane)));

    bottomIsolatorPoint = math::add(bottomFixedPoint, math::scale(dir, frame.getIsolatorUtilLength(params.isolator)));
    
    math::Vec3 invVec = math::invert(math::scale(dir, frame.getClevisEndFittingUtilLength(params.clevis_end_fitting)));
    upperEyeClampClevisFixedPoint = math::add(stayTube->upperTubeEyeClampFixedPoint, invVec);

    if (components::isSba(frame.model.type.configuration) || 
        components::isTdpGt2_2(frame.model.type.configuration) || 
        components::isCai(frame.model.type.configuration)) {
        upperEyeClampClevisStainlessSteelPoint = math::add(upperEyeClampClevisFixedPoint, math::scale(perp, params.clevis_end_fitting.hook_x_distance));
    } else {
        upperEyeClampClevisStainlessSteelPoint = {0,0,0};
    }
}

std::vector<TubeDimension> BracketTube::generateResults(const CantileverFrame& frame) const {
    double d2 = math::distanceBetween(bottomIsolatorPoint, upperEyeClampClevisFixedPoint);
    return {
        {"bracket_tube", params.tube.d, params.tube.s, std::round(d2), std::round(d2) + 10.0}
    };
}

std::vector<viewer::Line3D> BracketTube::getRenderLines() const {
    if (bottomIsolatorPoint.x == 0 && bottomIsolatorPoint.y == 0 && bottomIsolatorPoint.z == 0) return {};
    
    std::vector<viewer::Line3D> lines;
    // Green for bracket tube links
    lines.push_back(viewer::Line3D("Bracket Tube", bottomPoleFixedPoint, bottomFixedPoint, 0, 228, 48, 255));
    lines.push_back(viewer::Line3D("Bracket Tube", upperEyeClampClevisFixedPoint, stayTube->upperTubeEyeClampFixedPoint, 0, 228, 48, 255));
    lines.push_back(viewer::Line3D("Bracket Tube", bottomFixedPoint, bottomIsolatorPoint, 0, 228, 48, 255));
    lines.push_back(viewer::Line3D("Bracket Tube", bottomIsolatorPoint, upperEyeClampClevisFixedPoint, 0, 228, 48, 255));

    return lines;
}

} // namespace assemblies
} // namespace catenary
