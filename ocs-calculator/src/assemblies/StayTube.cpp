#include "assemblies/StayTube.hpp"
#include "math/MathUtils.hpp"
#include <cmath>
#include <stdexcept>

namespace catenary {
namespace assemblies {

StayTube::StayTube(const StayTubeParams& params) : params(params) {}

void StayTube::calculateGeometry(const CantileverFrame& frame) {
    // Upper Fixed Point 
    double ufpDistance = frame.getSwivelClevisUtilLength(params.swivel_bracket, params.swivel_clevis);
    upperFixedPoint = math::getPointFromDirection(frame.upperPoleFixedPoint, frame.directionPv, ufpDistance);

    // Calculate angles and direction (getDirOfStayTube logic)
    math::Vec3 H = math::subtract(frame.mwAxis, upperFixedPoint);
    double Hlen = math::length(H);
    double Blen = params.mw_support.wireSupport.B;

    if (Blen > Hlen) throw std::runtime_error("B > hypotenuse");

    double Alen = std::sqrt(Hlen * Hlen - Blen * Blen);
    double az = std::atan2(H.z, H.x);
    double pxz = std::hypot(H.x, H.z);
    double elevH = std::atan2(H.y, pxz);
    double theta = std::acos(Alen / Hlen);
    double elevA = elevH - theta;

    dir = { std::cos(az) * std::cos(elevA), std::sin(elevA), std::sin(az) * std::cos(elevA) };
    
    math::Vec3 Avec = math::scale(dir, Alen);
    perp = math::normalize(math::subtract(H, Avec));
    params.alpha = math::radiansToDegrees(elevA);

    // Wire Support Point
    double dToFixPoint = Alen - params.mw_support.wireSupport.A;
    if (components::isTdpLt2_2(frame.model.type.configuration) || 
        components::isTdpGt2_2(frame.model.type.configuration) || 
        components::isSba(frame.model.type.configuration)) {
        dToFixPoint = Alen - (params.mw_support.wireSupport.A - params.mw_support.wireSupport.D);
    }
    wireSupportFixedPoint = math::add(upperFixedPoint, math::scale(dir, dToFixPoint));
    wireSupportFixedPointPpToMw = math::add(upperFixedPoint, math::scale(dir, Alen));
    mwAxis = frame.mwAxis; // Need to store this for rendering link_106

    wireSupportStainlessSteelPoint = math::add(wireSupportFixedPoint, math::invert(math::scale(perp, params.mw_support.wireSupport.C)));
    upperTubeEndPoint = math::add(wireSupportFixedPoint, math::scale(dir, params.mw_support.end_distance));
    upperTubeEyeClampTubeFixedPoint = math::add(wireSupportFixedPoint, math::invert(math::scale(dir, params.mw_support.eye_clamp_distance)));
    upperIsolatorPoint = math::add(upperFixedPoint, math::scale(dir, frame.getIsolatorUtilLength(params.isolator)));
    upperTubeEyeClampFixedPoint = math::add(upperTubeEyeClampTubeFixedPoint, math::invert(math::scale(perp, params.eye_clamp.h)));
}

std::vector<TubeDimension> StayTube::generateResults(const CantileverFrame& frame) const {
    double d1 = math::distanceBetween(upperIsolatorPoint, upperTubeEndPoint);
    return {
        {"stay_tube", params.tube.d, params.tube.s, std::round(d1), std::round(d1) + 10.0}
    };
}

std::vector<viewer::Line3D> StayTube::getRenderLines() const {
    if (upperIsolatorPoint.x == 0 && upperIsolatorPoint.y == 0 && upperIsolatorPoint.z == 0) return {};
    
    std::vector<viewer::Line3D> lines;
    // Blue for stay tube links
    lines.push_back(viewer::Line3D("Stay Tube", upperIsolatorPoint, upperTubeEyeClampTubeFixedPoint, 0, 121, 241, 255));
    lines.push_back(viewer::Line3D("Stay Tube", upperTubeEyeClampTubeFixedPoint, wireSupportFixedPoint, 0, 121, 241, 255));
    lines.push_back(viewer::Line3D("Stay Tube", upperTubeEyeClampTubeFixedPoint, upperTubeEyeClampFixedPoint, 0, 121, 241, 255));
    lines.push_back(viewer::Line3D("Stay Tube", wireSupportFixedPoint, upperTubeEndPoint, 0, 121, 241, 255));
    lines.push_back(viewer::Line3D("Stay Tube", wireSupportFixedPoint, wireSupportStainlessSteelPoint, 0, 121, 241, 255));
    lines.push_back(viewer::Line3D("Stay Tube", wireSupportFixedPointPpToMw, mwAxis, 0, 121, 241, 255));

    return lines;
}

} // namespace assemblies
} // namespace catenary
