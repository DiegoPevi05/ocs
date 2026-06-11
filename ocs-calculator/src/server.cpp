#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>
#include <chrono>
#include "httplib.h"
#include "nlohmann/json.hpp"

#include "CantileverBuilder.hpp"
#include "VaneBuilder.hpp"
#include "assemblies/StayTube.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/SteadyArm.hpp"
#include "assemblies/RegisterArm.hpp"
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
    
    int numCantilevers = j.value("cantileversQuantity", 1);
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

    auto stayTubeParams = assemblies::StayTubeParams{
        0.0, { 55.0, 3.5 }, { 60.0, 400.0, 350.0 }, 
        { { 100.0, 200.0, 50.0, 50.0, 150.0 }, 100.0, 80.0 },
        { 50.0 }, { 30.0 }, { 40.0 }
    };
    auto bracketTubeParams = assemblies::BracketTubeParams{
        { 70.0, 4.0 }, { 60.0, 400.0, 350.0 }, { 30.0 }, { 40.0 }, 
        { 150.0, 50.0, 100.0 }, { 50.0 }
    };
    auto steadyArmParams = assemblies::SteadyArmParams{
        steadyArmAlpha, steadyArmLength, 100.0, std::nullopt, std::nullopt,
        { 33.7, 2.5 }, 
        components::HookEndFitting{100.0, 20.0},
        components::HookEndClamp{50.0, 40.0, 10.0, 10.0},
        components::SwivelClip{40.0, 30.0, 15.0},
        std::nullopt,
        components::ClampHolderContactWire{50, 40, 30, 0}
    };
    
    assemblies::RegisterArmParams regParams;
    regParams.alpha = registerArmAlpha;
    regParams.drop_bracket_distance = 150.0;
    regParams.eye_clamp_distance = 250.0;
    regParams.tube = { 33.7, 3.2 };
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

    for (int i=0; i < numCantilevers; ++i) {
        auto builder = std::make_shared<CantileverBuilder>(
            model, track, curveDir, pv, pole3D,
            u, supportOffset, contactWireHeight, contactWireVerticalOffset, systemHeight,
            (i % 2 == 0) ? zigzag : -zigzag,
            fixingDistance, bottomFixedHeight
        );
        
        auto stayTube = std::make_shared<assemblies::StayTube>(stayTubeParams);
        auto bracketTube = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube);
        
        if (model.type.configuration == components::ConfigurationType::TDP_GT_2_2 || 
            model.type.configuration == components::ConfigurationType::CAI) {
            
            assemblies::RegisterArmParams iterRegParams = regParams;
            if (i % 2 != 0) {
                iterRegParams.alpha = -registerArmAlpha;
                iterRegParams.drop_bracket_distance = 200.0;
            }
            auto regArm = std::make_shared<assemblies::RegisterArm>(iterRegParams);
            
            assemblies::SteadyArmParams iterSteady = steadyArmParams;
            if (i % 2 != 0) iterSteady.alpha = -steadyArmAlpha;
            auto steadyArm = std::make_shared<assemblies::SteadyArm>(iterSteady, bracketTube, regArm);
            builder->addAssembly(stayTube).addAssembly(bracketTube).addAssembly(regArm).addAssembly(steadyArm);
        } else {
            auto steadyArm = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube, nullptr);
            builder->addAssembly(stayTube).addAssembly(bracketTube).addAssembly(steadyArm);
        }
        poleOrchestrator.addCantilever(builder);
    }
    
    auto t1 = std::chrono::high_resolution_clock::now();
    poleOrchestrator.buildAll();
    auto t2 = std::chrono::high_resolution_clock::now();
    calcTimeMs = std::chrono::duration<double, std::milli>(t2 - t1).count();
    
    json jsonPoles = json::array();
    json poleObj = json::object();
    
    json poleLinesJson = json::array();
    if (!poleOrchestrator.cantilevers.empty()) {
        auto poleLines = poleOrchestrator.cantilevers[0]->getPoleLines();
        for (const auto& line : poleLines) poleLinesJson.push_back(line3dToJson(line));
    }
    poleObj["lines"] = poleLinesJson;
    
    json cantileversJson = json::array();
    int cIndex = 0;
    for (const auto& builder : poleOrchestrator.cantilevers) {
        json cObj = json::object();
        cObj["index"] = cIndex++;
        json cResults = json::array();
        for (const auto& r : builder->generateResults()) cResults.push_back(resultToJson(r));
        cObj["results"] = cResults;
        json cLines = json::array();
        for (const auto& line : builder->getAssemblyLines()) cLines.push_back(line3dToJson(line));
        cObj["lines"] = cLines;
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

    std::cout << "Starting C++ Catenary REST API on port 8080..." << std::endl;
    svr.listen("0.0.0.0", 8080);

    return 0;
}
