#include "assemblies/SteadyArm.hpp"
#include "math/MathUtils.hpp"
#include <cmath>
#include <stdexcept>

namespace catenary {
namespace assemblies {

SteadyArm::SteadyArm(const SteadyArmParams& params, 
                     std::shared_ptr<BracketTube> bracketTube, 
                     std::shared_ptr<RegisterArm> registerArm) 
    : params(params), bracketTube(bracketTube), registerArm(registerArm) {}

void SteadyArm::calculateGeometry(const CantileverFrame& frame) {
    double angle = math::degreesToRadians(params.alpha);
    double cosAlpha = std::cos(angle);
    double sinAlpha = std::sin(angle);
    dir = { frame.directionPv.x * cosAlpha, sinAlpha, frame.directionPv.z * cosAlpha };

    math::Vec3 normalPlane = math::normalize(math::cross(dir, frame.directionPv));
    perpK = math::invert(normalPlane);
    perpV = math::normalize(math::cross(dir, perpK));

    // Calculate CW points
    if (frame.model.type.contactWireConfiguration == components::ContactWireConfiguration::DOUBLE) {
        if (components::isTdpLt2_2(frame.model.type.configuration) || components::isSba(frame.model.type.configuration)) {
            if (components::isSba(frame.model.type.configuration) && params.eye_clamp_contact_wire) {
                double sep = (params.eye_clamp_contact_wire->A + params.eye_clamp_contact_wire->double_separation) - params.eye_clamp_contact_wire->C;
                points.push_back(math::add(frame.cwAxis, math::scale(dir, sep)));
                points.push_back(math::subtract(frame.cwAxis, math::scale(dir, sep)));
            } else {
                points.push_back(math::add(frame.cwAxis, math::scale(perpK, bracketTube->params.eye_clamp.h)));
                points.push_back(math::subtract(frame.cwAxis, math::scale(perpK, bracketTube->params.eye_clamp.h)));
            }
        } else if (params.swivel_clip && registerArm) {
            double angleDeg = params.alpha - params.swivel_clip->C;
            if (components::isTdpGt2_2(frame.model.type.configuration)) {
                angleDeg = 180.0 - (params.alpha + params.swivel_clip->C);
            }
            math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };
            math::Vec3 v1 = math::add(frame.cwAxis, math::scale(CwXYDir, registerArm->params.drop_bracket.double_wire_separation_x / 2.0));
            points.push_back(math::add(v1, math::scale(perpK, registerArm->params.drop_bracket.double_wire_separation_z / 2.0)));
            math::Vec3 v2 = math::subtract(frame.cwAxis, math::scale(CwXYDir, registerArm->params.drop_bracket.double_wire_separation_x / 2.0));
            points.push_back(math::subtract(v2, math::scale(perpK, registerArm->params.drop_bracket.double_wire_separation_z / 2.0)));
        }
    } else {
        points.push_back(frame.cwAxis);
    }

    // SteadyArm YAxis CW Point
    if (!components::isSba(frame.model.type.configuration) && params.swivel_clip) {
        double angleDeg = 90.0 + params.alpha - params.swivel_clip->B;
        if (components::isTdpGt2_2(frame.model.type.configuration) || components::isTdpLt2_2(frame.model.type.configuration)) {
            angleDeg = 90.0 - params.alpha - params.swivel_clip->B;
        }
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };

        if (!points.empty()) {
            yAxisCwPoint.push_back(math::add(points[0], math::scale(CwXYDir, params.swivel_clip->A)));
            if (points.size() > 1) {
                yAxisCwPoint.push_back(math::add(points[1], math::scale(CwXYDir, params.swivel_clip->A)));
            }
        }
    }

    // SteadyArm Fixed Point
    if (components::isSba(frame.model.type.configuration) && params.eye_clamp_contact_wire) {
        double angleDeg = math::radiansToDegrees(std::atan(params.eye_clamp_contact_wire->B / params.eye_clamp_contact_wire->C)) + params.alpha;
        double length = std::sqrt(std::pow(params.eye_clamp_contact_wire->B, 2) + std::pow(params.eye_clamp_contact_wire->C, 2));
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };
        if (!points.empty()) {
            fixedPoint.push_back(math::add(points[0], math::scale(CwXYDir, length)));
            if (points.size() > 1) {
                double angleDeg2 = 180.0 - math::radiansToDegrees(std::atan(params.eye_clamp_contact_wire->B / params.eye_clamp_contact_wire->C)) + params.alpha;
                math::Vec3 CwXYDir2 = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg2)), std::sin(math::degreesToRadians(angleDeg2)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg2)) };
                fixedPoint.push_back(math::add(points[1], math::scale(CwXYDir2, length)));
            }
        }
    } else if (params.swivel_clip && !yAxisCwPoint.empty()) {
        double angleDeg = params.alpha;
        if (components::isTdpLt2_2(frame.model.type.configuration) || components::isTdpGt2_2(frame.model.type.configuration)) {
            angleDeg = 180.0 + params.alpha;
        }
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };
        fixedPoint.push_back(math::add(yAxisCwPoint[0], math::scale(CwXYDir, params.swivel_clip->B)));
        if (yAxisCwPoint.size() > 1) {
            fixedPoint.push_back(math::add(yAxisCwPoint[1], math::scale(CwXYDir, params.swivel_clip->B)));
        }
    }

    // End points
    if (!fixedPoint.empty()) {
        if (components::isCai(frame.model.type.configuration)) {
            endPoint.push_back(math::subtract(fixedPoint[0], math::scale(dir, params.end_distance)));
            if (fixedPoint.size() > 1 && registerArm) {
                endPoint.push_back(math::subtract(fixedPoint[1], math::scale(dir, params.end_distance)));
            }
        } else {
            endPoint.push_back(math::add(fixedPoint[0], math::scale(dir, params.end_distance)));
            if (fixedPoint.size() > 1) {
                endPoint.push_back(math::add(fixedPoint[1], math::scale(dir, params.end_distance)));
            }
        }
    }

    if (components::isSba(frame.model.type.configuration) && params.eye_clamp_distance && !fixedPoint.empty()) {
        eyeClampPoint = math::add(fixedPoint[0], math::scale(math::invert(dir), *params.eye_clamp_distance));
        if (params.eye_clamp) {
            eyeClampFixedPoint = math::add(eyeClampPoint, math::scale(perpV, params.eye_clamp->h));
        }
    }

    // Optional calculations specific to clamps
    if ((components::isTdpGt2_2(frame.model.type.configuration) || components::isCai(frame.model.type.configuration)) && params.hook_end_clamp && params.swivel_clip) {
        double cvd = params.hook_end_clamp->H / std::cos(math::degreesToRadians(params.alpha));
        double scid = params.swivel_clip->A - cvd;
        double AngleB = 90.0 + params.swivel_clip->C;
        double AngleA = std::asin((scid * std::sin(math::degreesToRadians(AngleB))) / params.length);
        double AngleC = 180.0 - math::radiansToDegrees(AngleA) - AngleB;
        double finalAngle = (90.0 - AngleC) + (params.alpha - params.swivel_clip->C);
        if (components::isTdpGt2_2(frame.model.type.configuration)) {
            finalAngle = (90.0 - AngleC) + (-params.alpha - params.swivel_clip->C);
        }
        double AngleModified = components::isTdpGt2_2(frame.model.type.configuration) ? 180.0 - finalAngle : finalAngle;
        
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(AngleModified)), std::sin(math::degreesToRadians(AngleModified)), frame.directionPv.z * std::cos(math::degreesToRadians(AngleModified)) };
        if (!points.empty()) {
            hookClampPointClamp.push_back(math::add(points[0], math::scale(CwXYDir, params.length)));
            if (points.size() > 1) {
                hookClampPointClamp.push_back(math::add(points[1], math::scale(CwXYDir, params.length)));
            }
        }
        
        double a = math::radiansToDegrees(std::atan(params.hook_end_clamp->Y / params.hook_end_clamp->H));
        double dist = std::hypot(params.hook_end_clamp->Y, params.hook_end_clamp->H);
        double Amp = components::isTdpGt2_2(frame.model.type.configuration) ? (90.0 - a + params.alpha) : (90.0 + a + params.alpha);
        math::Vec3 Cxp = { frame.directionPv.x * std::cos(math::degreesToRadians(Amp)), std::sin(math::degreesToRadians(Amp)), frame.directionPv.z * std::cos(math::degreesToRadians(Amp)) };
        
        if (!hookClampPointClamp.empty()) {
            hookClampPoint.push_back(math::add(hookClampPointClamp[0], math::scale(Cxp, dist)));
            if (hookClampPointClamp.size() > 1 && registerArm) {
                hookClampPoint.push_back(math::add(hookClampPointClamp[1], math::scale(Cxp, dist)));
            }
        }
    }

    if (registerArm) {
        registerArm->injectSteadyArmHooks(hookClampPoint);
        registerArm->calculateGeometry(frame);
    }

    calculateIntersections(frame);
}

void SteadyArm::calculateIntersections(const CantileverFrame& frame) {
    
    auto solveLines = [](math::Vec3 P1, math::Vec3 D1, math::Vec3 P2, math::Vec3 D2) {
        math::Vec3 r = math::subtract(P1, P2);
        double a = math::dot(D1, D1), b = math::dot(D1, D2), c = math::dot(D2, D2), d = math::dot(D1, r), e = math::dot(D2, r);
        double denom = a*c - b*b;
        if (std::abs(denom) < 1e-6) throw std::runtime_error("Lines parallel");
        double t1 = (b*e - c*d) / denom;
        double t2 = (a*e - b*d) / denom;
        math::Vec3 pt1 = math::getPointFromDirection(P1, D1, t1);
        math::Vec3 pt2 = math::getPointFromDirection(P2, D2, t2);
        return math::Vec3{ 0.5*(pt1.x + pt2.x), 0.5*(pt1.y + pt2.y), 0.5*(pt1.z + pt2.z) };
    };

    if (components::isSba(frame.model.type.configuration)) {
        if (!endPoint.empty()) {
            math::Vec3 P1 = bracketTube->bottomFixedPoint;
            math::Vec3 D1 = math::getDirectionVector(bracketTube->upperEyeClampClevisFixedPoint, P1);
            intersectionPoint = solveLines(P1, D1, endPoint[0], dir);

            math::Vec3 D3 = bracketTube->perp;
            double h = bracketTube->params.eye_clamp.h;
            math::Vec3 P2_shift = math::subtract(endPoint[0], math::scale(D3, h));
            math::Vec3 ipt = solveLines(intersectionPoint, bracketTube->dir, P2_shift, dir);
            intersectionTubeFixedPoint = ipt;
            intersectionRegisterArmFixedPoint = math::add(ipt, math::scale(D3, h));
            intersectionFixedPoint = intersectionRegisterArmFixedPoint;

            if (params.hook_end_fitting) {
                double hl = params.hook_end_fitting->L - params.hook_end_fitting->a;
                hookEndFittingPoint = math::add(intersectionRegisterArmFixedPoint, math::scale(dir, hl));
            }
        }
    } else if ((components::isTdpGt2_2(frame.model.type.configuration) || components::isCai(frame.model.type.configuration)) && registerArm) {
        math::Vec3 P1 = bracketTube->bottomFixedPoint;
        math::Vec3 D1 = math::getDirectionVector(bracketTube->upperEyeClampClevisFixedPoint, P1);
        intersectionPoint = solveLines(P1, D1, registerArm->bracketUpperFixedPoint, registerArm->dir);

        math::Vec3 D3 = bracketTube->perp;
        double h = bracketTube->params.eye_clamp.h;
        math::Vec3 P2_shift = math::subtract(registerArm->bracketUpperFixedPoint, math::scale(D3, h));
        math::Vec3 ipt = solveLines(intersectionPoint, bracketTube->dir, P2_shift, registerArm->dir);
        intersectionTubeFixedPoint = ipt;
        intersectionRegisterArmFixedPoint = math::add(ipt, math::scale(D3, h));
        intersectionFixedPoint = intersectionRegisterArmFixedPoint;

        if (params.hook_end_fitting) {
            double hl = params.hook_end_fitting->L - params.hook_end_fitting->a;
            hookEndFittingPoint = math::add(registerArm->eyeClampFixedPoint, math::scale(dir, hl));
        }

        // Supply data back to registerArm if needed
        registerArm->injectIntersectionPoint(intersectionRegisterArmFixedPoint);
    }
}

std::vector<TubeDimension> SteadyArm::generateResults(const CantileverFrame& frame) const {
    std::vector<TubeDimension> res;
    if (!components::isCai(frame.model.type.configuration) && !endPoint.empty()) {
        double d3 = math::distanceBetween(endPoint[0], hookEndFittingPoint);
        res.push_back({"steady_arm", params.tube.d, params.tube.s, std::round(d3), std::round(d3) + 10.0});
    } else if (!fixedPoint.empty() && !hookClampPoint.empty()) {
        double d3 = math::distanceBetween(fixedPoint[0], hookClampPoint[0]);
        res.push_back({"steady_arm", params.tube.d, params.tube.s, std::round(d3), std::round(d3) + 10.0});
    }
    return res;
}

std::vector<viewer::Line3D> SteadyArm::getRenderLines() const {
    std::vector<viewer::Line3D> lines;
    // Orange for Steady Arm
    if (!endPoint.empty() && (hookEndFittingPoint.x != 0 || hookEndFittingPoint.y != 0 || hookEndFittingPoint.z != 0)) {
        lines.push_back(viewer::Line3D("Steady Arm", endPoint[0], hookEndFittingPoint, 255, 128, 0, 255));
    } else if (!fixedPoint.empty() && !hookClampPoint.empty()) {
        lines.push_back(viewer::Line3D("Steady Arm", fixedPoint[0], hookClampPoint[0], 255, 128, 0, 255));
    }
    return lines;
}

} // namespace assemblies
} // namespace catenary
