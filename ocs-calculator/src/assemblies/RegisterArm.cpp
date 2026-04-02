#include "assemblies/RegisterArm.hpp"
#include "math/MathUtils.hpp"
#include <cmath>

namespace catenary {
namespace assemblies {

RegisterArm::RegisterArm(const RegisterArmParams& params) : params(params) {}

void RegisterArm::injectSteadyArmHooks(const std::vector<math::Vec3>& hooks) {
    steadyArmHookFixedPoint = hooks;
}

void RegisterArm::injectIntersectionPoint(const math::Vec3& intersection) {
    intersectionRegisterArmFixedPoint = intersection;
    double length = params.hook_end_fitting.L - params.hook_end_fitting.a;
    hookEndFittingPoint = math::add(intersectionRegisterArmFixedPoint, math::scale(dir, length));
}

void RegisterArm::calculateGeometry(const CantileverFrame& frame) {
    math::Vec3 dirXZ = frame.directionPv;
    double cosAlpha = std::cos(math::degreesToRadians(params.alpha));
    double sinAlpha = std::sin(math::degreesToRadians(params.alpha));

    dir = { dirXZ.x * cosAlpha, sinAlpha, dirXZ.z * cosAlpha };
    math::Vec3 normalPlane = math::normalize(math::cross(dir, frame.directionPv));
    perpK = math::invert(normalPlane);
    perpV = math::normalize(math::cross(dir, perpK));

    // Calculate bracketBottomPoint
    if (!steadyArmHookFixedPoint.empty()) {
        double AngleModified = 360.0 + params.alpha;
        if (components::isTdpGt2_2(frame.model.type.configuration)) {
            AngleModified = 180.0 + params.alpha;
        }

        double cosA = std::cos(math::degreesToRadians(AngleModified));
        double sinA = std::sin(math::degreesToRadians(AngleModified));
        math::Vec3 CwXYDir = { frame.directionPv.x * cosA, sinA, frame.directionPv.z * cosA };

        // For simplicity, we port the exact same logic.
        // Assumes steady arm hook clamp is active.
        if (components::isTdpGt2_2(frame.model.type.configuration) || components::isCai(frame.model.type.configuration)) {
            math::Vec3 V0 = math::add(steadyArmHookFixedPoint[0], math::scale(CwXYDir, params.drop_bracket.x1));
            
            if (frame.model.type.contactWireConfiguration == components::ContactWireConfiguration::DOUBLE && steadyArmHookFixedPoint.size() > 1) {
                math::Vec3 V1 = math::add(steadyArmHookFixedPoint[1], math::scale(CwXYDir, params.drop_bracket.x1 + params.drop_bracket.double_wire_separation_x));
                math::Vec3 V2 = math::subtract(V1, V0);
                double V2len = math::length(V2);
                math::Vec3 n2V2 = math::normalize(V2);
                math::Vec3 V3 = math::getPointFromDirection(V0, n2V2, V2len / 2.0);
                bracketBottomPoint.push_back(V3);
                bracketBottomPoint.push_back(V0);
                bracketBottomPoint.push_back(V1);
            } else {
                bracketBottomPoint.push_back(V0);
            }
        }
    }

    if (!bracketBottomPoint.empty()) {
        if (components::isTdpGt2_2(frame.model.type.configuration)) {
            bracketUpperFixedPoint = math::add(bracketBottomPoint[0], math::scale(math::invert(perpV), params.drop_bracket.h));
        } else {
            bracketUpperFixedPoint = math::add(bracketBottomPoint[0], math::scale(perpV, params.drop_bracket.h));
        }

        if (components::isTdpGt2_2(frame.model.type.configuration)) {
            double distance_eye_clamp = params.drop_bracket_distance - params.eye_clamp_distance;
            eyeClampPoint = math::add(bracketUpperFixedPoint, math::scale(dir, distance_eye_clamp));
            eyeClampFixedPoint = math::add(eyeClampPoint, math::scale(math::invert(perpV), params.eye_clamp.h));
        } else if (components::isCai(frame.model.type.configuration)) {
            double distance_eye_clamp = params.eye_clamp_distance;
            eyeClampPoint = math::subtract(bracketUpperFixedPoint, math::scale(dir, distance_eye_clamp));
            eyeClampFixedPoint = math::add(eyeClampPoint, math::scale(perpV, params.eye_clamp.h));
        }
        
        if (components::isTdpGt2_2(frame.model.type.configuration) || components::isCai(frame.model.type.configuration)) {
            endPoint = math::add(bracketUpperFixedPoint, math::scale(dir, params.drop_bracket_distance));
        }
    }
}

std::vector<TubeDimension> RegisterArm::generateResults(const CantileverFrame& frame) const {
    if (endPoint.x == 0 && endPoint.y == 0 && endPoint.z == 0) return {};
    double ra = math::distanceBetween(hookEndFittingPoint, endPoint);
    return {
        {"register_arm", params.tube.d, params.tube.s, std::round(ra), std::round(ra) + 10.0}
    };
}

std::vector<viewer::Line3D> RegisterArm::getRenderLines() const {
    if (endPoint.x == 0 && endPoint.y == 0 && endPoint.z == 0) return {};
    // Purple for register arm
    return { viewer::Line3D("Register Arm", hookEndFittingPoint, endPoint, 153, 50, 204, 255) };
}

} // namespace assemblies
} // namespace catenary
