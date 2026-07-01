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
    config = frame.model.type.configuration;
    contactWireConfig = frame.model.type.contactWireConfiguration;
    // Store the frame's track-tangent for use in getRenderLines
    trackTangentDir = frame.trackTangentDir;
    wireSupportStainlessSteelPoint = bracketTube->stayTube->wireSupportStainlessSteelPoint;

    double angle = math::degreesToRadians(params.alpha);
    double cosAlpha = std::cos(angle);
    double sinAlpha = std::sin(angle);
    dir = { frame.directionPv.x * cosAlpha, sinAlpha, frame.directionPv.z * cosAlpha };

    math::Vec3 normalPlane = math::normalize(math::cross(dir, frame.directionPv));
    perpK = math::invert(normalPlane);
    perpV = math::normalize(math::cross(dir, perpK));

    // Points (CW Axis)
    if (contactWireConfig == components::ContactWireConfiguration::DOUBLE) {
        if (components::isTdpLt2_2(config) || components::isSba(config)) {
             if (components::isSba(config) && params.eye_clamp_contact_wire) {
                double sep = (params.eye_clamp_contact_wire->A + params.eye_clamp_contact_wire->double_separation) - params.eye_clamp_contact_wire->C;
                points.push_back(math::add(frame.cwAxis, math::scale(dir, sep)));
                points.push_back(math::subtract(frame.cwAxis, math::scale(dir, sep)));
            } else {
                points.push_back(math::add(frame.cwAxis, math::scale(perpK, bracketTube->params.eye_clamp.h)));
                points.push_back(math::subtract(frame.cwAxis, math::scale(perpK, bracketTube->params.eye_clamp.h)));
            }
        } else if (params.swivel_clip && registerArm) {
            // Separate the two CW points along the track-tangent direction (XZ only, Y=0).
            // frame.trackTangentDir = cross(Y_up, XZ-normalized directionPv) — computed once
            // in CantileverFrame from the horizontal projection of the pole→foot direction.
            // This correctly handles straight lines and polyline curves without elevation.
            math::Vec3 v1 = math::add(frame.cwAxis, math::scale(frame.trackTangentDir, registerArm->params.drop_bracket.double_wire_separation_x / 2.0));
            points.push_back(math::add(v1, math::scale(perpK, registerArm->params.drop_bracket.double_wire_separation_z / 2.0)));
            math::Vec3 v2 = math::subtract(frame.cwAxis, math::scale(frame.trackTangentDir, registerArm->params.drop_bracket.double_wire_separation_x / 2.0));
            points.push_back(math::subtract(v2, math::scale(perpK, registerArm->params.drop_bracket.double_wire_separation_z / 2.0)));
        }
    } else {
        points.push_back(frame.cwAxis);
    }

    // YAxisCWPoint
    if (!components::isSba(config) && params.swivel_clip) {
        double angleDeg = 90.0 + params.alpha - params.swivel_clip->B;
        if (components::isTdpGt2_2(config) || components::isTdpLt2_2(config)) angleDeg = 90.0 - params.alpha - params.swivel_clip->B;
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };
        for (const auto& pt : points) yAxisCwPoint.push_back(math::add(pt, math::scale(CwXYDir, params.swivel_clip->A)));
    }

    // Fixed Point
    if (components::isSba(config) && params.eye_clamp_contact_wire) {
        double angleDeg = math::radiansToDegrees(std::atan(params.eye_clamp_contact_wire->B / params.eye_clamp_contact_wire->C)) + params.alpha;
        double length = std::sqrt(std::pow(params.eye_clamp_contact_wire->B, 2) + std::pow(params.eye_clamp_contact_wire->C, 2));
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };
        fixedPoint.push_back(math::add(points[0], math::scale(CwXYDir, length)));
        if (points.size() > 1) {
            double angleDeg2 = 180.0 - math::radiansToDegrees(std::atan(params.eye_clamp_contact_wire->B / params.eye_clamp_contact_wire->C)) + params.alpha;
            math::Vec3 CwXYDir2 = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg2)), std::sin(math::degreesToRadians(angleDeg2)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg2)) };
            fixedPoint.push_back(math::add(points[1], math::scale(CwXYDir2, length)));
        }
    } else if (params.swivel_clip && !yAxisCwPoint.empty()) {
        double angleDeg = params.alpha;
        if (components::isTdpLt2_2(config) || components::isTdpGt2_2(config)) angleDeg = 180.0 + params.alpha;
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleDeg)), std::sin(math::degreesToRadians(angleDeg)), frame.directionPv.z * std::cos(math::degreesToRadians(angleDeg)) };
        for (const auto& pt : yAxisCwPoint) fixedPoint.push_back(math::add(pt, math::scale(CwXYDir, params.swivel_clip->B)));
    }

    // End Points
    if (!fixedPoint.empty()) {
        double dist = params.end_distance;
        for (const auto& pt : fixedPoint) {
            if (components::isCai(config)) endPoint.push_back(math::subtract(pt, math::scale(dir, dist)));
            else endPoint.push_back(math::add(pt, math::scale(dir, dist)));
        }
    }

    if (components::isSba(config) && params.eye_clamp_distance && !fixedPoint.empty()) {
        eyeClampPoint = math::add(fixedPoint[0], math::scale(math::invert(dir), *params.eye_clamp_distance));
        if (params.eye_clamp) eyeClampFixedPoint = math::add(eyeClampPoint, math::scale(perpV, params.eye_clamp->h));
    }

    // Hook Clamps
    if ((components::isTdpGt2_2(config) || components::isCai(config)) && params.hook_end_clamp && params.swivel_clip) {
        double cvd = params.hook_end_clamp->H / std::cos(math::degreesToRadians(params.alpha));
        double scid = params.swivel_clip->A - cvd;
        double AngleB = 90.0 + params.swivel_clip->C;
        double AngleA = std::asin((scid * std::sin(math::degreesToRadians(AngleB))) / params.length);
        double AngleC = 180.0 - math::radiansToDegrees(AngleA) - AngleB;
        double finalAngle = (90.0 - AngleC) + (params.alpha - params.swivel_clip->C);
        if (components::isTdpGt2_2(config)) finalAngle = (90.0 - AngleC) + (-params.alpha - params.swivel_clip->C);
        double AngleModified = components::isTdpGt2_2(config) ? 180.0 - finalAngle : finalAngle;
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(AngleModified)), std::sin(math::degreesToRadians(AngleModified)), frame.directionPv.z * std::cos(math::degreesToRadians(AngleModified)) };
        for (const auto& pt : points) hookClampPointClamp.push_back(math::add(pt, math::scale(CwXYDir, params.length)));
        
        double a = math::radiansToDegrees(std::atan(params.hook_end_clamp->Y / params.hook_end_clamp->H));
        double dist = std::hypot(params.hook_end_clamp->Y, params.hook_end_clamp->H);
        double Amp = components::isTdpGt2_2(config) ? (90.0 - a + params.alpha) : (90.0 + a + params.alpha);
        math::Vec3 Cxp = { frame.directionPv.x * std::cos(math::degreesToRadians(Amp)), std::sin(math::degreesToRadians(Amp)), frame.directionPv.z * std::cos(math::degreesToRadians(Amp)) };
        for (const auto& pt : hookClampPointClamp) hookClampPoint.push_back(math::add(pt, math::scale(Cxp, dist)));
    }

    if (registerArm && !hookClampPoint.empty() && params.hook_end_clamp) {
        double angleBetweenClampAndSupport = 270.0 + params.alpha;
        double extension_rotation = params.hook_end_clamp->A * std::tan(math::degreesToRadians(params.alpha - registerArm->params.alpha));
        if (components::isTdpGt2_2(config)) extension_rotation *= -1.0;
        math::Vec3 CwXYDir = { frame.directionPv.x * std::cos(math::degreesToRadians(angleBetweenClampAndSupport)), std::sin(math::degreesToRadians(angleBetweenClampAndSupport)), frame.directionPv.z * std::cos(math::degreesToRadians(angleBetweenClampAndSupport)) };
        for (const auto& pt : hookClampPoint) hookClampIntersectionSupport.push_back(math::add(pt, math::scale(CwXYDir, params.hook_end_clamp->H + extension_rotation)));
        
        double angleModified = components::isTdpGt2_2(config) ? 180.0 + registerArm->params.alpha : registerArm->params.alpha;
        math::Vec3 CwXYDir2 = { frame.directionPv.x * std::cos(math::degreesToRadians(angleModified)), std::sin(math::degreesToRadians(angleModified)), frame.directionPv.z * std::cos(math::degreesToRadians(angleModified)) };
        for (const auto& pt : hookClampIntersectionSupport) hookFixedPoint.push_back(math::add(pt, math::scale(CwXYDir2, params.hook_end_clamp->B)));
    }

    if (registerArm) {
        registerArm->injectSteadyArmHooks(!hookFixedPoint.empty() ? hookFixedPoint : hookClampPoint);
        registerArm->injectWireSupportStainlessSteelPoint(wireSupportStainlessSteelPoint);
        registerArm->calculateGeometry(frame);
    }

    calculateIntersections(frame);
}

void SteadyArm::calculateIntersections(const CantileverFrame& frame) {
    // Returns midpoint of closest approach on two skew lines (used for intersectionPoint).
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
    // Returns only the point on line 1 (matches TS reference getIntersectionTubeFixedPoint).
    auto solveLinesPt1 = [](math::Vec3 P1, math::Vec3 D1, math::Vec3 P2, math::Vec3 D2) {
        math::Vec3 r = math::subtract(P1, P2);
        double a = math::dot(D1, D1), b = math::dot(D1, D2), c = math::dot(D2, D2), d = math::dot(D1, r), e = math::dot(D2, r);
        double denom = a*c - b*b;
        if (std::abs(denom) < 1e-6) throw std::runtime_error("Lines parallel");
        double t1 = (b*e - c*d) / denom;
        return math::getPointFromDirection(P1, D1, t1);
    };

    if (components::isSba(config) || components::isTdpLt2_2(config)) {
        if (!endPoint.empty()) {
            math::Vec3 P1 = bracketTube->bottomFixedPoint;
            math::Vec3 D1 = math::getDirectionVector(bracketTube->upperEyeClampClevisFixedPoint, P1);
            intersectionPoint = solveLines(P1, D1, endPoint[0], dir);
            math::Vec3 P2_shift = math::subtract(endPoint[0], math::scale(bracketTube->perp, bracketTube->params.eye_clamp.h));
            // P1 must be a known point ON the bracket tube line; bottomFixedPoint qualifies.
            intersectionTubeFixedPoint = solveLinesPt1(bracketTube->bottomFixedPoint, bracketTube->dir, P2_shift, dir);
            intersectionRegisterArmFixedPoint = math::add(intersectionTubeFixedPoint, math::scale(bracketTube->perp, bracketTube->params.eye_clamp.h));
            if (params.hook_end_fitting) hookEndFittingPoint = math::add(intersectionRegisterArmFixedPoint, math::scale(dir, params.hook_end_fitting->L - params.hook_end_fitting->a));
            if (registerArm) {
                registerArm->injectIntersectionPoint(intersectionRegisterArmFixedPoint);
                registerArm->injectIntersectionTubePoint(intersectionTubeFixedPoint);
            }
        }
    } else if (registerArm) {
        math::Vec3 P1 = bracketTube->bottomFixedPoint;
        math::Vec3 D1 = math::getDirectionVector(bracketTube->upperEyeClampClevisFixedPoint, P1);
        intersectionPoint = solveLines(P1, D1, registerArm->bracketUpperFixedPoint, registerArm->dir);
        math::Vec3 P2_shift = math::subtract(registerArm->bracketUpperFixedPoint, math::scale(bracketTube->perp, bracketTube->params.eye_clamp.h));
        // P1 must be a known point ON the bracket tube line; bottomFixedPoint qualifies.
        intersectionTubeFixedPoint = solveLinesPt1(bracketTube->bottomFixedPoint, bracketTube->dir, P2_shift, registerArm->dir);
        intersectionRegisterArmFixedPoint = math::add(intersectionTubeFixedPoint, math::scale(bracketTube->perp, bracketTube->params.eye_clamp.h));
        if (params.hook_end_fitting) hookEndFittingPoint = math::add(registerArm->eyeClampFixedPoint, math::scale(dir, params.hook_end_fitting->L - params.hook_end_fitting->a));
        registerArm->injectIntersectionPoint(intersectionRegisterArmFixedPoint);
        registerArm->injectIntersectionTubePoint(intersectionTubeFixedPoint);
    }
}

std::vector<TubeDimension> SteadyArm::generateResults(const CantileverFrame& frame) const {
    const bool isDouble = (contactWireConfig == components::ContactWireConfiguration::DOUBLE);
    std::vector<TubeDimension> res;

    if (!components::isCai(config) && !components::isTdpGt2_2(config) && !endPoint.empty()) {
        // TDP<2.2 and SBA: arm tube measured from endPoint[0] to hookEndFittingPoint
        double d = math::distanceBetween(endPoint[0], hookEndFittingPoint);
        res.push_back({"steady_arm", params.tube.d, params.tube.s, std::round(d), std::round(d) + 10.0});
        // DOUBLE wire: second arm has same geometry → same length
        if (isDouble)
            res.push_back({"steady_arm", params.tube.d, params.tube.s, std::round(d), std::round(d) + 10.0});
        // SBA only: stainless-steel cable from eye-clamp to wire-support point
        if (components::isSba(config) && params.stainless_steel_wire_rope) {
            double dc = math::distanceBetween(eyeClampFixedPoint, wireSupportStainlessSteelPoint);
            res.push_back({"steel_cable", params.stainless_steel_wire_rope->d, 0.0, std::round(dc), std::round(dc) + 10.0});
        }
    } else if (!fixedPoint.empty() && !hookClampPoint.empty()) {
        // TDP>2.2 and CAI: arm tube measured per wire from fixedPoint to hookClampPoint
        double d0 = math::distanceBetween(fixedPoint[0], hookClampPoint[0]);
        res.push_back({"steady_arm", params.tube.d, params.tube.s, std::round(d0), std::round(d0) + 10.0});
        if (isDouble && fixedPoint.size() > 1 && hookClampPoint.size() > 1) {
            double d1 = math::distanceBetween(fixedPoint[1], hookClampPoint[1]);
            res.push_back({"steady_arm", params.tube.d, params.tube.s, std::round(d1), std::round(d1) + 10.0});
        }
    }
    return res;
}

std::vector<viewer::Line3D> SteadyArm::getRenderLines() const {
    if (fixedPoint.empty() && endPoint.empty()) return {};
    const double tubeR = params.tube.d / 2.0;
    std::vector<viewer::Line3D> lines;
    if (components::isSba(config)) {
        // Shared fittings (emit only when eye_clamp_distance is set, which enables eyeClampPoint)
        if (params.eye_clamp_distance) {
            lines.push_back(viewer::Line3D("Steady Arm", hookEndFittingPoint, eyeClampPoint, 34, 197, 94, 255));
            lines.push_back(viewer::Line3D("Steady Arm", eyeClampPoint, eyeClampFixedPoint, 34, 197, 94, 255));
            lines.push_back(viewer::Line3D("Steady Arm", intersectionTubeFixedPoint, intersectionRegisterArmFixedPoint, 34, 197, 94, 255));
            // Steel cable: eye-clamp fixed point → wire-support stainless-steel point
            if (params.stainless_steel_wire_rope)
                lines.push_back(viewer::Line3D("Steel Cable", eyeClampFixedPoint, wireSupportStainlessSteelPoint, 100, 180, 255, 255));
        }
        // Per-wire: link to CW clamp + main tube body
        for (size_t i = 0; i < fixedPoint.size(); ++i) {
            if (i < points.size())
                lines.push_back(viewer::Line3D("Steady Arm", fixedPoint[i], points[i], 34, 197, 94, 255));
            if (i < endPoint.size())
                lines.push_back(viewer::Line3D("Steady Arm", fixedPoint[i], endPoint[i], 34, 197, 94, 255, tubeR));
            if (params.eye_clamp_distance)
                lines.push_back(viewer::Line3D("Steady Arm", fixedPoint[i], eyeClampPoint, 34, 197, 94, 255));
        }
    } else {
        // Per-wire: swivel-clip link + arm tube + fittings
        size_t n = points.size();
        for (size_t i = 0; i < n; ++i) {
            if (i < yAxisCwPoint.size()) {
                lines.push_back(viewer::Line3D("Steady Arm", yAxisCwPoint[i], points[i], 34, 197, 94, 255));
                if (i < fixedPoint.size())
                    lines.push_back(viewer::Line3D("Steady Arm", yAxisCwPoint[i], fixedPoint[i], 34, 197, 94, 255));
            }
            if (i < hookClampPoint.size() && i < fixedPoint.size()) {
                // Main tube body: CW clamp → bracket connection
                lines.push_back(viewer::Line3D("Steady Arm", hookClampPoint[i], fixedPoint[i], 34, 197, 94, 255, tubeR));
                // Fittings
                if (i < hookClampIntersectionSupport.size()) {
                    lines.push_back(viewer::Line3D("Steady Arm", hookClampIntersectionSupport[i], hookClampPoint[i], 34, 197, 94, 255));
                    if (i < hookFixedPoint.size())
                        lines.push_back(viewer::Line3D("Steady Arm", hookClampIntersectionSupport[i], hookFixedPoint[i], 34, 197, 94, 255));
                }
            }
        }
        // TDP<2.2: main arm tube uses endPoint → bracketTube intersection (hookClampPoint not computed for this type)
        if (components::isTdpLt2_2(config) && !endPoint.empty()) {
            if (contactWireConfig == components::ContactWireConfiguration::DOUBLE && endPoint.size() > 1) {
                // Offset the two bracket-tube attachment points along the track-tangent direction
                // (XZ only, Y=0) — sign must match the CW-end ordering so the arms don't cross.
                // points[0] = cwAxis + trackTangentDir*sep  →  pt0 must also be on the + side.
                // points[1] = cwAxis - trackTangentDir*sep  →  pt1 must also be on the - side.
                const double halfSep = bracketTube->params.eye_clamp.h;
                math::Vec3 pt0 = math::add(intersectionTubeFixedPoint,      math::scale(trackTangentDir, halfSep));
                math::Vec3 pt1 = math::subtract(intersectionTubeFixedPoint, math::scale(trackTangentDir, halfSep));
                lines.push_back(viewer::Line3D("Steady Arm", endPoint[0], pt0, 34, 197, 94, 255, tubeR));
                lines.push_back(viewer::Line3D("Steady Arm", endPoint[1], pt1, 34, 197, 94, 255, tubeR));
                // Crossbar along the track direction
                lines.push_back(viewer::Line3D("Steady Arm", pt0, pt1, 34, 197, 94, 255));
            } else {
                for (size_t i = 0; i < endPoint.size(); ++i)
                    lines.push_back(viewer::Line3D("Steady Arm", endPoint[i], intersectionTubeFixedPoint, 34, 197, 94, 255, tubeR));
            }
            lines.push_back(viewer::Line3D("Steady Arm", intersectionTubeFixedPoint, intersectionRegisterArmFixedPoint, 34, 197, 94, 255));
            if (params.hook_end_fitting)
                lines.push_back(viewer::Line3D("Steady Arm", intersectionRegisterArmFixedPoint, hookEndFittingPoint, 34, 197, 94, 255));
        }
    }
    return lines;
}

} // namespace assemblies
} // namespace catenary
