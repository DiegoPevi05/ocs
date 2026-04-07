#include "assemblies/Reinforcement.hpp"
#include "math/MathUtils.hpp"
#include <cmath>

namespace catenary {
namespace assemblies {

Reinforcement::Reinforcement(const ReinforcementParams& params,
                             std::shared_ptr<StayTube> stayTube,
                             std::shared_ptr<BracketTube> bracketTube,
                             std::shared_ptr<SteadyArm> steadyArm)
    : params(params), stayTube(stayTube), bracketTube(bracketTube), steadyArm(steadyArm) {}

void Reinforcement::calculateGeometry(const CantileverFrame& frame) {
    upperEyeClampPoint = math::add(stayTube->upperIsolatorPoint, math::scale(stayTube->dir, params.upper_distance_offset));
    upperHookEndPoint = math::subtract(upperEyeClampPoint, math::scale(stayTube->perp, params.upper_eye_clamp.h));
    
    bottomEyeClampPoint = math::subtract(steadyArm->intersectionTubeFixedPoint, math::scale(bracketTube->dir, params.bottom_distance_offset));
    bottomHookEndPoint = math::subtract(bottomEyeClampPoint, math::scale(bracketTube->perp, params.bottom_eye_clamp.h));

    math::Vec3 reinfDir = math::getDirectionVector(upperHookEndPoint, bottomHookEndPoint);

    double distance = params.bottom_hook_end_fitting.L - params.bottom_hook_end_fitting.a;
    bottomFixedPoint = math::subtract(bottomHookEndPoint, math::scale(reinfDir, distance));
    upperFixedPoint = math::add(upperHookEndPoint, math::scale(reinfDir, distance));
}

std::vector<TubeDimension> Reinforcement::generateResults(const CantileverFrame& frame) const {
    double re = math::distanceBetween(upperFixedPoint, bottomFixedPoint);
    return {
        {"reinforcement", params.tube.d, params.tube.s, std::round(re), std::round(re) + 10.0}
    };
}

std::vector<viewer::Line3D> Reinforcement::getRenderLines() const {
    if (upperFixedPoint.x == 0 && upperFixedPoint.y == 0 && upperFixedPoint.z == 0) return {};
    
    std::vector<viewer::Line3D> lines;
    // Red for reinforcement links (255, 0, 0)
    lines.push_back(viewer::Line3D("Reinforcement", upperEyeClampPoint, upperHookEndPoint, 255, 0, 0, 255));
    lines.push_back(viewer::Line3D("Reinforcement", bottomEyeClampPoint, bottomHookEndPoint, 255, 0, 0, 255));
    lines.push_back(viewer::Line3D("Reinforcement", upperHookEndPoint, upperFixedPoint, 255, 0, 0, 255));
    lines.push_back(viewer::Line3D("Reinforcement", bottomFixedPoint, bottomHookEndPoint, 255, 0, 0, 255));
    lines.push_back(viewer::Line3D("Reinforcement", upperFixedPoint, bottomFixedPoint, 255, 0, 0, 255));

    return lines;
}

} // namespace assemblies
} // namespace catenary
