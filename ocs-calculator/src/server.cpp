#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>
#include <chrono>
#include <map>
#include <unordered_map>
#include <algorithm>
#include <cctype>
#include <cmath>
#include "math/TrussSolver.hpp"
#include "httplib.h"
#include "nlohmann/json.hpp"

#include "CantileverBuilder.hpp"
#include "VaneBuilder.hpp"
#include "assemblies/StayTube.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/SteadyArm.hpp"
#include "assemblies/RegisterArm.hpp"
#include "assemblies/Reinforcement.hpp"
#include "components/Pole3D.hpp"
#include "components/Pole.hpp"
#include "viewer/Viewer3D.hpp"

using json = nlohmann::json;
using namespace catenary;

// Helpers
json vec3ToJson(const math::Vec3& v) {
    return json::array({v.x, v.y, v.z});
}

json line3dToJson(const viewer::Line3D& line) {
    return json{
        {"name", line.name},
        {"start", vec3ToJson(line.start)},
        {"end", vec3ToJson(line.end)},
        {"color", json::array({line.r, line.g, line.b, line.a})},
        {"radius", line.radius}
    };
}

json resultToJson(const assemblies::TubeDimension& r) {
    return json{
        {"name", r.name},
        {"diameter", r.diameter},
        {"thickness", r.thickness},
        {"length", r.length_tube},
        {"cut_length", r.cut_length}
    };
}

json dropperToJson(const DropperResult& d) {
    return json{
        {"index", d.index},
        {"dropper_length", d.dropper_length},
        {"distance_eye_to_eye", d.distance_eye_to_eye},
        {"distance_cw", d.distance_cw},
        {"distance_pole_dropper", d.distance_pole_dropper},
        {"distance_dropper_dropper", d.distance_dropper_dropper},
        {"distance_cw_h", d.distance_cw_h},
        {"dropper_inclination", d.dropper_inclination}
    };
}

components::ConfigurationType getConfigType(const std::string& type) {
    if (type == "TDP<2.2") return components::ConfigurationType::TDP_LT_2_2;
    if (type == "TDP>2.2") return components::ConfigurationType::TDP_GT_2_2;
    if (type == "CAI") return components::ConfigurationType::CAI;
    if (type == "SBA") return components::ConfigurationType::SBA;
    return components::ConfigurationType::TDP_GT_2_2;
}

json buildCantileversLogic(const json& j, double& calcTimeMs) {
    std::string configType = j.value("configuration", "TDP>2.2");
    std::string cwConfig = j.value("contactWireConfiguration", "SINGLE");
    components::ContactWireConfiguration wireConfig =
        (cwConfig == "DOUBLE") ? components::ContactWireConfiguration::DOUBLE
                               : components::ContactWireConfiguration::SINGLE;
    components::ModelInterface model = { { getConfigType(configType), wireConfig } };
    double poleWidth  = j.value("poleWidth",  300.0);  // along-track
    double poleLength = j.value("poleLength", 300.0);  // perpendicular-to-track (face toward arm)
    components::PoleModel poleModel = { { poleWidth, poleLength } };
    
    math::Vec3 polePos = {0.0, 0.0, 0.0};
    if (j.contains("polePosition")) {
        auto arr = j["polePosition"];
        polePos = {arr[0].get<double>(), arr[1].get<double>(), arr[2].get<double>()};
    }
    
    math::Vec3 pv = {3000.0, 0.0, 0.0};
    if (j.contains("pv")) {
        auto arr = j["pv"];
        pv = {arr[0].get<double>(), arr[1].get<double>(), arr[2].get<double>()};
    }
    
    Pole3D pole3D(std::nullopt, components::Pov::GLOBAL);
    pole3D.model = poleModel; 
    pole3D.globalPosition = polePos;
    
    // A pole's cantilevers are now each solved independently (their own request), and
    // positioned as slot `poleSlotIndex` of `poleSlotCount` siblings on the pole — see
    // Pole::buildAll(slotIndexOverride, slotCountOverride). Defaults (0, 1) reproduce the
    // old single-cantilever-per-pole behavior exactly.
    int poleSlotIndex = j.value("poleSlotIndex", 0);
    int poleSlotCount = j.value("poleSlotCount", 1);
    double catSeparation = j.value("catSeparation", 720.0);
    double supportOffset = j.value("supportOffset", 1440.0);
    double contactWireHeight = j.value("contactWireHeight", 5400.0);
    double systemHeight = j.value("systemHeight", 1000.0);
    double zigzag = j.value("zigzag", 200.0);
    double contactWireVerticalOffset = j.value("contactWireVerticalOffset", 120.0);
    double fixingDistance = j.value("fixingDistance", 1500.0);
    double bottomFixedHeight = j.value("bottomFixedHeight", 5440.0);
    double u = j.value("u", 0.0);
    double trackGauge = j.value("trackGauge", 1435.0);
    double steadyArmAlpha = j.value("steadyArmAlpha", -2.0);
    double defaultRegisterAlpha = (configType == "CAI") ? -2.0 : 2.0;
    double registerArmAlpha = j.value("registerArmAlpha", defaultRegisterAlpha);
    double steadyArmLength = j.value("steadyArmLength", 1200.0);

    // Wire/dropper loads carried by this cantilever, auto-derived by the frontend from the
    // Vane(s) attached to it (half of each attached span's length, weight, and droppers).
    // Falls back to typical single-span defaults if no vane is attached on a side.
    double halfSpanLeft = j.value("halfSpanLeft", 30000.0);   // mm
    double halfSpanRight = j.value("halfSpanRight", 30000.0); // mm
    double cwTension = j.value("cwTension", 1600.0);   // N
    double swTension = j.value("swTension", 2000.0);   // N
    double cwWeight = j.value("cwWeight", 0.0019);      // kg/mm (matches VaneBuilder's own convention)
    double swWeight = j.value("swWeight", 0.0024);      // kg/mm
    double dropperWeightKg = j.value("dropperWeight", 0.0006); // kg
    double dropperCountLeft = j.value("dropperCountLeft", 3.0);
    double dropperCountRight = j.value("dropperCountRight", 3.0);
    double curveRadius = j.value("curveRadius", 0.0); // mm, 0 = straight track

    // Per-tube structural properties (cross-section + allowable stress), user-configurable
    // from the Cantilever panel's "Structural" section. Defaults match the tube stock
    // previously hardcoded here.
    double stayTubeDiameter = j.value("stayTubeDiameter", 55.0);
    double stayTubeThickness = j.value("stayTubeThickness", 3.5);
    double stayTubeYield = j.value("stayTubeYield", 215.0);
    double bracketTubeDiameter = j.value("bracketTubeDiameter", 70.0);
    double bracketTubeThickness = j.value("bracketTubeThickness", 4.0);
    double bracketTubeYield = j.value("bracketTubeYield", 215.0);
    double steadyArmDiameter = j.value("steadyArmDiameter", 33.7);
    double steadyArmThickness = j.value("steadyArmThickness", 2.5);
    double steadyArmYield = j.value("steadyArmYield", 215.0);
    double registerArmDiameter = j.value("registerArmDiameter", 33.7);
    double registerArmThickness = j.value("registerArmThickness", 3.2);
    double registerArmYield = j.value("registerArmYield", 215.0);
    double reinforcementDiameter = j.value("reinforcementDiameter", 55.0);
    double reinforcementThickness = j.value("reinforcementThickness", 6.0);
    double reinforcementYield = j.value("reinforcementYield", 215.0);

    auto stayTubeParams = assemblies::StayTubeParams{
        0.0, { stayTubeDiameter, stayTubeThickness, stayTubeYield }, { 60.0, 400.0, 350.0 },
        { { 100.0, 200.0, 50.0, 50.0, 150.0 }, 100.0, 80.0 },
        { 50.0 }, { 30.0 }, { 40.0 }
    };
    auto bracketTubeParams = assemblies::BracketTubeParams{
        { bracketTubeDiameter, bracketTubeThickness, bracketTubeYield }, { 60.0, 400.0, 350.0 }, { 30.0 }, { 40.0 },
        { 150.0, 50.0, 100.0 }, { 50.0 }
    };
    auto steadyArmParams = assemblies::SteadyArmParams{
        steadyArmAlpha, steadyArmLength, 100.0,
        250.0, // eye_clamp_distance (for SBA)
        components::StainlessSteelWireRope{6.0}, // stainless_steel_wire_rope (for SBA)
        { steadyArmDiameter, steadyArmThickness, steadyArmYield }, // tube
        components::HookEndFitting{100.0, 20.0},
        components::HookEndClamp{50.0, 40.0, 10.0, 10.0},
        components::SwivelClip{40.0, 30.0, 15.0},
        components::EyeClamp{35.0}, // eye_clamp (for SBA)
        components::ClampHolderContactWire{50, 40, 30, 0}
    };
    assemblies::RegisterArmParams regParams;
    regParams.alpha = registerArmAlpha;
    regParams.drop_bracket_distance = 150.0;
    regParams.eye_clamp_distance = 250.0;
    regParams.tube = { registerArmDiameter, registerArmThickness, registerArmYield };
    regParams.stainless_steel_wire_rope = { 6.0 };
    regParams.drop_bracket = { 50.0, 100.0, 20.0, 30.0 };
    regParams.eye_clamp = { 35.0 };
    regParams.hook_end_fitting = { 100.0, 20.0 };

    std::string crvDir = j.value("curveRadiusDirection", "inside");
    components::CurveRadiusDirection curveDir =
        (crvDir == "outside") ? components::CurveRadiusDirection::OUTSIDE
                               : components::CurveRadiusDirection::INSIDE;

    components::Track track = { trackGauge, { 50.0 } };
    components::Pole poleOrchestrator(pole3D, catSeparation, supportOffset, bottomFixedHeight, fixingDistance, 0.0, pv);

    // Each cantilever is now solved independently (own config, own request) — no more
    // even/odd mirroring of zigzag/arm-angle sign. The frontend is responsible for
    // setting each cantilever's own zigzag/steadyArmAlpha/registerArmAlpha directly.
    // Declared here (not block-local) so its geometry — populated by build(), called
    // inside poleOrchestrator.buildAll() below — is still readable afterward, for the
    // support-offset dimension annotations.
    std::shared_ptr<assemblies::BracketTube> bracketTube;
    {
        auto builder = std::make_shared<CantileverBuilder>(
            model, track, curveDir, pv, pole3D,
            u, supportOffset, contactWireHeight, contactWireVerticalOffset, systemHeight,
            zigzag,
            fixingDistance, bottomFixedHeight
        );

        auto stayTube = std::make_shared<assemblies::StayTube>(stayTubeParams);
        bracketTube = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube);

        if (model.type.configuration == components::ConfigurationType::TDP_GT_2_2 ||
            model.type.configuration == components::ConfigurationType::CAI) {

            auto regArm = std::make_shared<assemblies::RegisterArm>(regParams);

            auto steadyArm = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube, regArm);
            builder->addAssembly(stayTube).addAssembly(bracketTube).addAssembly(regArm).addAssembly(steadyArm);

            bool enableReinforcement = j.value("enableReinforcement", false);
            if (enableReinforcement) {
                double reinfUpperOffset = j.value("reinforcementUpperOffset", 150.0);
                double reinfBottomOffset = j.value("reinforcementBottomOffset", 150.0);
                assemblies::ReinforcementParams reinfParams;
                reinfParams.tube = { reinforcementDiameter, reinforcementThickness, reinforcementYield };
                reinfParams.upper_distance_offset = reinfUpperOffset;
                reinfParams.upper_eye_clamp = { 79.0 };
                reinfParams.upper_hook_end_fitting = { 132.0, 65.0 };
                reinfParams.bottom_distance_offset = reinfBottomOffset;
                reinfParams.bottom_eye_clamp = { 79.0 };
                reinfParams.bottom_hook_end_fitting = { 132.0, 65.0 };

                auto reinf = std::make_shared<assemblies::Reinforcement>(reinfParams, stayTube, bracketTube, steadyArm);
                builder->addAssembly(reinf);
            }
        } else {
            auto steadyArm = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube, nullptr);
            builder->addAssembly(stayTube).addAssembly(bracketTube).addAssembly(steadyArm);

            bool enableReinforcement = j.value("enableReinforcement", false);
            if (enableReinforcement) {
                double reinfUpperOffset = j.value("reinforcementUpperOffset", 150.0);
                double reinfBottomOffset = j.value("reinforcementBottomOffset", 150.0);
                assemblies::ReinforcementParams reinfParams;
                reinfParams.tube = { reinforcementDiameter, reinforcementThickness, reinforcementYield };
                reinfParams.upper_distance_offset = reinfUpperOffset;
                reinfParams.upper_eye_clamp = { 79.0 };
                reinfParams.upper_hook_end_fitting = { 132.0, 65.0 };
                reinfParams.bottom_distance_offset = reinfBottomOffset;
                reinfParams.bottom_eye_clamp = { 79.0 };
                reinfParams.bottom_hook_end_fitting = { 132.0, 65.0 };

                auto reinf = std::make_shared<assemblies::Reinforcement>(reinfParams, stayTube, bracketTube, steadyArm);
                builder->addAssembly(reinf);
            }
        }
        poleOrchestrator.addCantilever(builder);
    }

    auto t1 = std::chrono::high_resolution_clock::now();
    poleOrchestrator.buildAll(poleSlotIndex, poleSlotCount);
    auto t2 = std::chrono::high_resolution_clock::now();
    calcTimeMs = std::chrono::duration<double, std::milli>(t2 - t1).count();
    
    json jsonPoles = json::array();
    json poleObj = json::object();
    
    // The mast is rendered from the Pole's own always-true, never-shifted pole3D — never from
    // any individual arm's own (possibly symmetrically-offset) frame — so it stays exactly at
    // its true configured position no matter how many cantilevers share the pole or how they're
    // spaced. Only slot 0 sends it, so the frontend draws exactly one mast per physical pole
    // (every request would otherwise emit an identical duplicate).
    json poleLinesJson = json::array();
    if (poleSlotIndex == 0) {
        auto poleLines = poleOrchestrator.pole3D.getRenderLines();
        for (const auto& line : poleLines) poleLinesJson.push_back(line3dToJson(line));
    }
    poleObj["lines"] = poleLinesJson;
    
    json cantileversJson = json::array();
    int cIndex = 0;
    for (const auto& builder : poleOrchestrator.cantilevers) {
        json cObj = json::object();
        int thisIndex = cIndex++;
        cObj["index"] = thisIndex;
        // Set up Truss Solver
        math::TrussSolver solver;
        std::vector<math::Vec3> node_pos;
        auto getOrAddNode = [&](const math::Vec3& p, bool isFixed) {
            for (size_t i = 0; i < node_pos.size(); ++i) {
                if (math::distanceBetween(node_pos[i], p) < 1.0) return (int)i;
            }
            node_pos.push_back(p);
            return solver.addNode(p, isFixed);
        };

        getOrAddNode(builder->getUpperPoleFixedPoint(), true);
        getOrAddNode(builder->getBottomPoleFixedPoint(), true);

        // Cross-section (diameter, thickness, yield) per named tube type, sourced from the
        // per-cantilever Structural configuration parsed above. Anything else (fittings,
        // cables) falls back to a generic steel value below.
        struct TubeProps { double d; double s; double yield; };
        auto tubeProps = [&](const std::string& name) -> TubeProps {
            if (name == "Bracket Tube") return { bracketTubeDiameter, bracketTubeThickness, bracketTubeYield };
            if (name == "Stay Tube") return { stayTubeDiameter, stayTubeThickness, stayTubeYield };
            if (name == "Steady Arm") return { steadyArmDiameter, steadyArmThickness, steadyArmYield };
            if (name == "Register Arm") return { registerArmDiameter, registerArmThickness, registerArmYield };
            if (name == "Reinforcement") return { reinforcementDiameter, reinforcementThickness, reinforcementYield };
            return { 50.0, 4.0, 215.0 };
        };

        const double ALU_DENSITY = 2.7e-6; // kg/mm^3
        const double GRAV = 9.81; // m/s^2

        json cForces = json::array();
        auto pushForce = [&](const std::string& label, const std::string& kind, const math::Vec3& point, const math::Vec3& dir, double magnitude) {
            if (magnitude <= 1e-6) return;
            cForces.push_back(json{
                {"label", label}, {"kind", kind},
                {"point", vec3ToJson(point)},
                {"direction", vec3ToJson(dir)},
                {"magnitude", magnitude}
            });
        };

        auto assemblyLines = builder->getAssemblyLines();
        std::vector<int> lineToElement(assemblyLines.size(), -1);
        int el_id = 0;
        for (size_t i = 0; i < assemblyLines.size(); ++i) {
            const auto& line = assemblyLines[i];
            int nA = getOrAddNode(line.start, false);
            int nB = getOrAddNode(line.end, false);
            if (nA == nB) continue;

            double E = 70000.0; // Aluminum
            double A = 1000.0;
            double yieldStress = 500.0; // generic rigid-fitting steel
            if (line.radius > 0) {
                TubeProps tp = tubeProps(line.name);
                double s = std::max(0.1, std::min(tp.s, line.radius - 0.5));
                A = 3.14159265 * s * (2.0 * line.radius - s);
                yieldStress = tp.yield;
            } else if (line.name.find("Cable") != std::string::npos || line.name.find("Wire") != std::string::npos) {
                E = 200000.0; // Steel
                A = 28.27; // 6mm diam
                yieldStress = 400.0; // hard-drawn conductor alloy
            } else {
                E = 2000000.0; // Rigid link
            }
            solver.addElement(el_id, line.name, nA, nB, E, A, yieldStress);
            lineToElement[i] = el_id;

            // Self-weight of the tube body itself, lumped half at each end node.
            if (line.radius > 0) {
                double L = math::distanceBetween(line.start, line.end);
                double weightN = ALU_DENSITY * A * L * GRAV;
                if (weightN > 1e-6) {
                    solver.addLoad(nA, {0.0, -weightN / 2.0, 0.0});
                    solver.addLoad(nB, {0.0, -weightN / 2.0, 0.0});
                    math::Vec3 mid = math::scale(math::add(line.start, line.end), 0.5);
                    pushForce(line.name + " Self-Weight", "tube-weight", mid, {0.0, -1.0, 0.0}, weightN);
                }
            }
            el_id++;
        }

        int nCW = getOrAddNode(builder->getCwAxis(), false);
        int nMW = getOrAddNode(builder->getMwAxis(), false);

        // External wire/dropper loads: span data (halfSpanLeft/Right, weights, tensions,
        // dropper counts) is auto-derived by the frontend from the Vane(s) actually
        // attached to this cantilever. Zigzag/curve produce lateral force at the CW node;
        // wire/dropper self-weight produce vertical force at the CW/MW nodes.
        double halfSpanTotal = halfSpanLeft + halfSpanRight; // mm
        double halfSpanAvg = halfSpanTotal / 2.0;
        // Each cantilever now carries its own already-signed zigzag value directly
        // (no more even/odd sign alternation across a pole's siblings).
        double F_zigzag = (halfSpanAvg > 1e-6) ? cwTension * (zigzag / halfSpanAvg) : 0.0;
        double curveSign = (curveDir == components::CurveRadiusDirection::OUTSIDE) ? -1.0 : 1.0;
        double F_curve = (curveRadius > 1e-6) ? curveSign * cwTension * (halfSpanTotal / curveRadius) : 0.0;
        double F_cwWeight = cwWeight * halfSpanTotal * GRAV;
        double F_swWeight = swWeight * halfSpanTotal * GRAV
                           + (dropperCountLeft + dropperCountRight) * dropperWeightKg * GRAV;

        math::Vec3 cwPoint = builder->getCwAxis();
        math::Vec3 mwPoint = builder->getMwAxis();
        solver.addLoad(nCW, {F_zigzag + F_curve, -F_cwWeight, 0.0});
        solver.addLoad(nMW, {0.0, -F_swWeight, 0.0});

        pushForce("Zigzag", "zigzag", cwPoint, {F_zigzag >= 0 ? 1.0 : -1.0, 0.0, 0.0}, std::abs(F_zigzag));
        pushForce("Curve Radius", "curve", cwPoint, {F_curve >= 0 ? 1.0 : -1.0, 0.0, 0.0}, std::abs(F_curve));
        pushForce("Contact Wire Weight", "wire-weight", cwPoint, {0.0, -1.0, 0.0}, F_cwWeight);
        pushForce("Support Wire + Dropper Weight", "wire-weight", mwPoint, {0.0, -1.0, 0.0}, F_swWeight);

        auto trussResults = solver.solve();
        std::unordered_map<int, math::TrussResult> resultById;
        for (const auto& tr : trussResults) resultById[tr.element_id] = tr;

        // Map max utilization per tube name to cResults
        std::map<std::string, math::TrussResult> maxResultByName;
        for (size_t i = 0; i < assemblyLines.size(); ++i) {
            int eId = lineToElement[i];
            auto it = (eId >= 0) ? resultById.find(eId) : resultById.end();
            if (it != resultById.end()) {
                std::string name = assemblyLines[i].name;
                std::string key = name;
                std::transform(key.begin(), key.end(), key.begin(), ::tolower);
                for (char& c : key) if (c == ' ') c = '_';

                if (maxResultByName.find(key) == maxResultByName.end() || it->second.utilization > maxResultByName[key].utilization) {
                    maxResultByName[key] = it->second;
                }
            }
        }

        json cResults = json::array();
        for (const auto& r : builder->generateResults()) {
            json rJson = resultToJson(r);
            if (maxResultByName.count(r.name)) {
                rJson["axial_force"] = maxResultByName[r.name].axial_force;
                rJson["stress"] = maxResultByName[r.name].stress;
                rJson["utilization"] = maxResultByName[r.name].utilization;
            }
            cResults.push_back(rJson);
        }
        cObj["results"] = cResults;

        json cLines = json::array();
        for (size_t i = 0; i < assemblyLines.size(); ++i) {
            json lJson = line3dToJson(assemblyLines[i]);
            int eId = lineToElement[i];
            auto it = (eId >= 0) ? resultById.find(eId) : resultById.end();
            if (it != resultById.end()) {
                lJson["utilization"] = it->second.utilization;
            }
            cLines.push_back(lJson);
        }
        cObj["lines"] = cLines;
        cObj["forces"] = cForces;
        
        // Build dimension annotations from assembly lines grouped by name.
        // For each unique name group, find the overall bounding start/end
        // (the two points with the greatest distance) and produce a dimension.
        {
            std::map<std::string, std::vector<const viewer::Line3D*>> groups;
            for (const auto& line : assemblyLines) {
                if (line.radius > 0) // only measure tube segments
                    groups[line.name].push_back(&line);
            }
            json dims = json::array();
            for (const auto& [name, lineGroup] : groups) {
                if (lineGroup.empty()) continue;
                // Find the two endpoints furthest apart
                math::Vec3 bestStart = lineGroup[0]->start;
                math::Vec3 bestEnd = lineGroup[0]->end;
                double maxDist = math::distanceBetween(bestStart, bestEnd);
                // Collect all endpoints
                std::vector<math::Vec3> pts;
                for (const auto* l : lineGroup) {
                    pts.push_back(l->start);
                    pts.push_back(l->end);
                }
                for (size_t a = 0; a < pts.size(); ++a) {
                    for (size_t b = a + 1; b < pts.size(); ++b) {
                        double d = math::distanceBetween(pts[a], pts[b]);
                        if (d > maxDist) {
                            maxDist = d;
                            bestStart = pts[a];
                            bestEnd = pts[b];
                        }
                    }
                }
                dims.push_back(json{
                    {"name", name},
                    {"start", vec3ToJson(bestStart)},
                    {"end", vec3ToJson(bestEnd)},
                    {"length", std::round(maxDist)}
                });
            }

            // Support-offset dimensions: only meaningful when this pole actually has
            // multiple cantilevers (matches Pole::buildAll()'s own (quantity==1)?0:supportOffset
            // rule) — shows the two halves of supportOffset either side of the support's
            // center: pole-face-to-center, and center-to-cantilever-attachment.
            if (poleSlotCount > 1 && supportOffset > 1e-6 && bracketTube) {
                math::Vec3 bottomAttach = bracketTube->bottomPoleFixedPoint;
                math::Vec3 bottomTubeStart = bracketTube->bottomFixedPoint;
                math::Vec3 dir = math::normalize(math::subtract(bottomTubeStart, bottomAttach));
                math::Vec3 upperAttach = poleOrchestrator.cantilevers[0]->getUpperPoleFixedPoint();

                // Visual support collar radius — noticeably thicker than the tubes so it
                // reads as a distinct bracket/collar fixture, not another tube segment.
                double collarRadius = std::max(40.0, std::min(150.0, supportOffset * 0.15));

                auto addSupportDims = [&](const math::Vec3& attach, const std::string& label) {
                    math::Vec3 poleFace = math::subtract(attach, math::scale(dir, supportOffset));
                    math::Vec3 center = math::subtract(attach, math::scale(dir, supportOffset / 2.0));
                    dims.push_back(json{
                        {"name", "Support Offset (Pole Face) - " + label},
                        {"start", vec3ToJson(poleFace)},
                        {"end", vec3ToJson(center)},
                        {"length", std::round(supportOffset / 2.0)}
                    });
                    dims.push_back(json{
                        {"name", "Support Offset (Cantilever) - " + label},
                        {"start", vec3ToJson(center)},
                        {"end", vec3ToJson(attach)},
                        {"length", std::round(supportOffset / 2.0)}
                    });
                    // The support hardware itself — a solid gray collar/bracket spanning the
                    // full pole-face-to-attachment distance, rendered as a 3D cylinder via
                    // the existing radius>0 tube rendering path (no new frontend code needed).
                    viewer::Line3D supportLine("Support (" + label + ")", poleFace, attach, 128, 128, 128, 255, collarRadius);
                    cObj["lines"].push_back(line3dToJson(supportLine));
                };
                addSupportDims(bottomAttach, "Bottom");
                addSupportDims(upperAttach, "Upper");
            }

            cObj["dimensions"] = dims;
        }
        
        // Real attachment points (post tilt/elevation solve) — consumers (e.g. vane
        // wiring) should anchor to these instead of re-deriving an approximation.
        cObj["cwAxis"] = vec3ToJson(builder->getCwAxis());
        cObj["mwAxis"] = vec3ToJson(builder->getMwAxis());
        cantileversJson.push_back(cObj);
    }
    
    poleObj["cantilevers"] = cantileversJson;
    jsonPoles.push_back(poleObj);
    return jsonPoles;
}

json buildVaneLogic(const json& j, double& calcTimeMs) {
    auto parseVec = [](const json& jVec, math::Vec3 def) -> math::Vec3 {
        if (!jVec.is_null() && jVec.is_array() && jVec.size() >= 3) {
            return {jVec[0].get<double>(), jVec[1].get<double>(), jVec[2].get<double>()};
        }
        return def;
    };

    math::Vec3 cw_start = parseVec(j["cw_start"], {0, 5500, 0});
    math::Vec3 sw_start = parseVec(j["sw_start"], {0, 5500 + 1400, 0});
    math::Vec3 cw_end   = parseVec(j["cw_end"], {30000, 5500, 0});
    math::Vec3 sw_end   = parseVec(j["sw_end"], {30000, 5500 + 1400, 0});

    double cw_weight = j.value("cw_weight", 0.0019);
    double cw_tension = j.value("cw_tension", 1600.0);
    double sw_weight = j.value("sw_weight", 0.0024);
    double sw_tension = j.value("sw_tension", 2000.0);
    double initial_separation = j.value("initial_separation", 5000.0);
    int qty_droppers = j.value("qty_droppers", 0); 
    double dropper_weight = j.value("dropper_weight", 0.0006);
    bool arrow = j.value("arrow", false);
    double arrow_length = j.value("arrow_length", 0.0);
    bool lifting = j.value("lifting", false);
    double lifting_start_distance = j.value("lifting_start_distance", -1.0);
    double step_size = j.value("step_size", 0.0);

    VaneBuilder builder(
        cw_start, sw_start, cw_end, sw_end,
        cw_weight, cw_tension, sw_weight, sw_tension,
        initial_separation, qty_droppers, dropper_weight,
        arrow, arrow_length, lifting, step_size, lifting_start_distance
    );
    
    auto t1 = std::chrono::high_resolution_clock::now();
    builder.build();
    auto t2 = std::chrono::high_resolution_clock::now();
    calcTimeMs = std::chrono::duration<double, std::milli>(t2 - t1).count();

    json vaneObj = json::object();
    json vResults = json::array();
    for (const auto& r : builder.generateResults()) {
        vResults.push_back(dropperToJson(r));
    }
    vaneObj["results"] = vResults;
    
    json vLines = json::array();
    for (const auto& line : builder.getAssemblyLines()) {
        vLines.push_back(line3dToJson(line));
    }
    vaneObj["lines"] = vLines;

    return vaneObj;
}


int main() {
    httplib::Server svr;

    auto set_cors = [](httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
    };

    auto handle_cantilever = [&](const httplib::Request& req, httplib::Response& res) {
        set_cors(res);
        try {
            auto j = json::parse(req.body);
            double calcTimeMs = 0;
            json polesJson = buildCantileversLogic(j, calcTimeMs);
            json response = {
                {"status", "success"},
                {"calculation_time_ms", calcTimeMs},
                {"poles", polesJson}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json err = {{"status", "error"}, {"message", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    };

    // Maintain backwards compatibility
    svr.Post("/calculate", handle_cantilever);
    svr.Post("/cantilever", handle_cantilever);

    svr.Post("/batch", [&](const httplib::Request& req, httplib::Response& res) {
        set_cors(res);
        try {
            auto jArray = json::parse(req.body);
            json responseArray = json::array();
            double totalTime = 0;
            if (jArray.is_array()) {
                for (const auto& j : jArray) {
                    double calcTime = 0;
                    json polesJson = buildCantileversLogic(j, calcTime);
                    totalTime += calcTime;
                    for (const auto& p : polesJson) {
                        responseArray.push_back(p);
                    }
                }
            } else {
                double calcTime = 0;
                json polesJson = buildCantileversLogic(jArray, calcTime);
                totalTime += calcTime;
                for (const auto& p : polesJson) {
                    responseArray.push_back(p);
                }
            }
            json response = {
                {"status", "success"},
                {"calculation_time_ms", totalTime},
                {"poles", responseArray}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json err = {{"status", "error"}, {"message", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    svr.Post("/vane", [&](const httplib::Request& req, httplib::Response& res) {
        set_cors(res);
        try {
            auto j = json::parse(req.body);
            double calcTimeMs = 0;
            json vaneJson = buildVaneLogic(j, calcTimeMs);
            json response = {
                {"status", "success"},
                {"calculation_time_ms", calcTimeMs},
                {"vane", vaneJson}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json err = {{"status", "error"}, {"message", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    svr.Post("/combine", [&](const httplib::Request& req, httplib::Response& res) {
        set_cors(res);
        try {
            auto j = json::parse(req.body);
            double calcTimeC = 0, calcTimeV = 0;

            json polesJson = buildCantileversLogic(j, calcTimeC);
            json vaneJson = buildVaneLogic(j, calcTimeV);

            json response = {
                {"status", "success"},
                {"calculation_time_ms", calcTimeC + calcTimeV},
                {"poles", polesJson},
                {"vane", vaneJson}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json err = {{"status", "error"}, {"message", e.what()}};
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });
    
    svr.Options(".*", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    });

    svr.Get("/health", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("{\"status\":\"UP\"}", "application/json");
    });

    std::cout << "Starting C++ Catenary REST API on port 8081..." << std::endl;
    svr.listen("0.0.0.0", 8081);

    return 0;
}
