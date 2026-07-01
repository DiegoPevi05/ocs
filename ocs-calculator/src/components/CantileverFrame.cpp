#include "components/CantileverFrame.hpp"
#include "math/MathUtils.hpp"
#include <cmath>

namespace catenary {

CantileverFrame::CantileverFrame(
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
) : model(model), track(track), curveRadiusDirection(curveRadiusDirection), pv(pv), 
    pole(pole), u(u), supportOffset(supportOffset), contactWireHeight(contactWireHeight), 
    contactWireVerticalOffset(contactWireVerticalOffset), systemHeight(systemHeight), 
    zigZag(zigZag), fixingDistance(fixingDistance), bottomFixedHeight(bottomFixedHeight) {}

void CantileverFrame::calculateGeometry() {
    // Determine PV and direction from pole
    math::Vec3 adjustedPv;
    if (isRelocated) {
        // PV is already shifted in world space, just use it directly
        // because relocatedPolePos also has world space coordinates.
        adjustedPv = pv;
    } else {
        adjustedPv = pole.getAdjustedPv(pv);
    }
    directionPv = pole.getDirectionToPv(pv);
    
    // Override directionPv if relocated to avoid recomputing with getAdjustedPv inside getDirectionToPv
    if (isRelocated) {
        directionPv = math::getDirectionVector(
            { pole.polePosition.x, 0, pole.polePosition.z },
            { adjustedPv.x, 0, adjustedPv.z }
        );
    }
    
    // Track inclination
    double ratio = u / (track.gauge + track.skate.hw);
    trackInclination = std::asin(ratio);

    // Horizontal track-tangent direction (XZ only, Y=0).
    // directionPv may carry a tiny Y from floating-point or inclined surfaces;
    // zero it out and renormalize before crossing to guarantee a purely horizontal result.
    {
        math::Vec3 dvXZ = math::normalize({ directionPv.x, 0.0, directionPv.z });
        trackTangentDir = math::normalize(math::cross({0.0, 1.0, 0.0}, dvXZ));
    }

    // Update via direction based on track inclination and curve direction
    double cosAlpha = std::cos(trackInclination);
    double sinAlpha = std::sin(trackInclination);
    
    math::Vec3 cwXYDir = { -directionPv.x * sinAlpha, cosAlpha, -directionPv.z * sinAlpha };
    if (curveRadiusDirection == components::CurveRadiusDirection::OUTSIDE) {
        cwXYDir = { directionPv.x * sinAlpha, cosAlpha, directionPv.z * sinAlpha };
    }
    viaDirection = cwXYDir;
    
    // Offset PV by via shift
    if (u != 0.0) {
        double r = track.gauge / 2.0 + track.skate.hw / 2.0;
        double xL = r - r * cosAlpha;
        double yL = r * sinAlpha;
        double len = std::sqrt(xL * xL + yL * yL);
        pv = math::add(adjustedPv, math::scale(cwXYDir, len));
    } else {
        pv = adjustedPv;
    }

    // Anchor geometry points
    viaAxis = math::add(pv, math::scale(viaDirection, contactWireHeight));

    math::Vec3 realPvDir = math::getDirectionVector(pole.polePosition, pv);
    math::Vec3 perpPlane = math::normalize(math::cross(realPvDir, {0, 1, 0}));
    math::Vec3 viaDir = math::normalize(math::cross(realPvDir, perpPlane));
    
    math::Vec3 v1 = math::add(viaAxis, math::scale(realPvDir, zigZag));
    cwAxis = math::add(v1, math::scale(math::invert(viaDir), contactWireVerticalOffset));
    
    mwAxis = math::add(cwAxis, math::scale({0, 1, 0}, systemHeight));

    // Pole fixes
    bottomPoleFixedPoint = pole.getBottomFixedPoint(bottomFixedHeight, supportOffset, directionPv);
    upperPoleFixedPoint = pole.getUpperFixedPoint(bottomPoleFixedPoint, fixingDistance);
}

double CantileverFrame::getIsolatorUtilLength(const components::Isolator& isolator) const {
    return isolator.eye_length - isolator.tube_length; // Extracted directly from original math
}

double CantileverFrame::getClevisEndFittingUtilLength(const components::ClevisEndFitting& clevis) const {
    return clevis.L - clevis.a;
}

double CantileverFrame::getSwivelClevisUtilLength(const components::SwivelBracket& bracket, const components::SwivelClevis& clevis) const {
    return bracket.x_pin + clevis.pin_eye;
}

} // namespace catenary
