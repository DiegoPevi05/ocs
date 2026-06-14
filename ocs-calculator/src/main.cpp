#include "CantileverBuilder.hpp"
#include "VaneBuilder.hpp"
#include "assemblies/StayTube.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/SteadyArm.hpp"
#include "assemblies/RegisterArm.hpp"
#include "components/Pole3D.hpp"
#include "components/Pole.hpp"
#include "viewer/Viewer3D.hpp"
#include <nlohmann/json.hpp>
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <memory>

using namespace catenary;
using json = nlohmann::json;

// --- JSON Serialization Helpers ---
namespace catenary {
    namespace math {
        void to_json(json& j, const Vec3& v) {
            j = json{{"x", v.x}, {"y", v.y}, {"z", v.z}};
        }
    }
    namespace viewer {
        void to_json(json& j, const Line3D& l) {
            j = json{{"name", l.name}, {"start", l.start}, {"end", l.end}, 
                     {"color", {l.r, l.g, l.b, l.a}}};
        }
    }
    namespace assemblies {
        void to_json(json& j, const TubeDimension& t) {
            j = json{{"name", t.name}, {"diameter", t.diameter}, {"thickness", t.thickness}, 
                     {"length_tube", t.length_tube}, {"cut_length", t.cut_length}};
        }
    }
    void to_json(json& j, const DropperResult& d) {
        j = json{{"index", d.index}, {"dropper_length", d.dropper_length}, 
                 {"distance_eye_to_eye", d.distance_eye_to_eye}, {"distance_cw", d.distance_cw}, 
                 {"distance_pole_dropper", d.distance_pole_dropper}, 
                 {"distance_dropper_dropper", d.distance_dropper_dropper}, 
                 {"distance_cw_h", d.distance_cw_h}};
    }
}

void printCantileverResults(const std::vector<assemblies::TubeDimension>& results, const std::string& label, const std::string& modelName) {
    std::cout << "\n--- " << label << " Hardware Results (" << modelName << ") ---\n";
    std::cout << std::left << std::setw(35) << "Tube Name" 
              << std::setw(15) << "Diameter(mm)"
              << std::setw(15) << "Thickness(mm)" 
              << std::setw(15) << "Length(mm)"
              << std::setw(15) << "Cut Length" << "\n";
    std::cout << std::string(95, '-') << "\n";

    for (const auto& r : results) {
        std::cout << std::left << std::setw(35) << r.name 
                  << std::setw(15) << r.diameter
                  << std::setw(15) << r.thickness 
                  << std::setw(15) << r.length_tube
                  << std::setw(15) << r.cut_length << "\n";
    }
}

void printVaneResults(const std::vector<DropperResult>& results) {
    std::cout << "\n--- Vane Dropper Results (between Pole 1 and Pole 2) ---\n";
    std::cout << std::left << std::setw(10) << "Index" 
              << std::setw(20) << "Length(m)" 
              << std::setw(20) << "Pos from P1(m)" 
              << std::setw(20) << "Dist eye-to-eye(m)" << "\n";
    std::cout << std::string(75, '-') << "\n";

    for (const auto& r : results) {
        std::cout << std::left << std::setw(10) << r.index 
                  << std::setw(20) << std::fixed << std::setprecision(3) << r.dropper_length
                  << std::setw(20) << r.distance_pole_dropper
                  << std::setw(20) << r.distance_eye_to_eye << "\n";
    }
}

int main(int argc, char** argv) {
    int numPoles = 2;
    double spanDistance = 50000.0; // 50 meters
    bool useViewer = false;

    // Simple argument parsing
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--poles" && i + 1 < argc) {
            try {
                numPoles = std::stoi(argv[++i]);
            } catch (...) {
                std::cerr << "Invalid poles count.\n";
            }
        } else if (arg == "--span" && i + 1 < argc) {
            try {
                spanDistance = std::stod(argv[++i]) * 1000.0; // convert m to mm
            } catch (...) {
                std::cerr << "Invalid span distance.\n";
            }
        } else if (arg == "--viewer") {
            useViewer = true;
        } else if (arg == "--help") {
            std::cout << "Usage: catenary_cli [options]\n"
                      << "Options:\n"
                      << "  --poles <N>      Number of poles (default: 2)\n"
                      << "  --span <m>       Span distance between poles in meters (default: 50.0)\n"
                      << "  --viewer         Open 3D visualization window\n"
                      << "  --help           Show this message\n";
            return 0;
        }
    }

    if (useViewer) {
        std::cout << "Catenary CLI - OCS Infrastructure Builder\n";
        std::cout << "==========================================\n";
        std::cout << "Target: " << numPoles << " poles, " << spanDistance / 1000.0 << "m span.\n";
    }

    try {

        components::PoleModel poleModel = { { 300.0 } };
        components::Track track = { 1435.0, { 50.0 } };

        std::vector<std::shared_ptr<CantileverBuilder>> builders;
        std::vector<viewer::Line3D> allLines;
        json outputJson;

        // --- Pole & Cantilever Creation ---
        for (int i = 0; i < numPoles; ++i) {
            double zPos = -spanDistance * (numPoles - 1) / 2.0 +  i * spanDistance;
            bool isLeft = i % 2 == 0;
            components::ConfigurationType configurationType = isLeft ? components::ConfigurationType::TDP_GT_2_2 : components::ConfigurationType::CAI;
            components::ModelInterface model = { { configurationType, components::ContactWireConfiguration::SINGLE } };
            std::string modelName = components::configToString(configurationType);

            
            Pole3D poleTemplate(std::nullopt, components::Pov::GLOBAL);
            poleTemplate.model = poleModel;
            poleTemplate.globalPosition = { 0.0, 0.0, zPos };

            math::Vec3 pv = { 3000.0, 0.0, zPos };
            poleTemplate.calculateGeometries(pv);

            auto builder = std::make_shared<CantileverBuilder>(
                model, 
                track, 
                components::CurveRadiusDirection::INSIDE,
                pv, 
                poleTemplate,
                0.0, 
                150.0,
                5400.0, 
                0.0,
                1400.0,
                isLeft ? 250.0 : -250.0,
                1500.0,
                5550.0
            );

            // standard hardware setup
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
                -2.0, 1200.0, 100.0, 
                250.0, // eye_clamp_distance
                components::StainlessSteelWireRope{6.0}, // stainless_steel_wire_rope
                { 33.7, 2.5 },
                components::HookEndFitting{100.0, 20.0},
                components::HookEndClamp{50.0, 40.0, 10.0, 10.0},
                components::SwivelClip{40.0, 30.0, 15.0},
                components::EyeClamp{35.0}, // eye_clamp
                components::ClampHolderContactWire{50, 40, 30, 0}
            };
            // Register Arm setup
            assemblies::RegisterArmParams regParams;
            regParams.alpha = isLeft ? 2 : -7.98;
            regParams.drop_bracket_distance = 150.0;
            regParams.eye_clamp_distance = 250.0;
            regParams.tube = { 33.7, 3.2 };
            regParams.stainless_steel_wire_rope = { 6.0 };
            regParams.drop_bracket = { 50.0, 100.0, 20.0, 30.0 };
            regParams.eye_clamp = { 35.0 };
            regParams.hook_end_fitting = { 100.0, 20.0 };

            auto stayTube = std::make_shared<assemblies::StayTube>(stayTubeParams);
            auto bracketTube = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube);
            auto registerArm = std::make_shared<assemblies::RegisterArm>(regParams);
            auto steadyArm = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube, registerArm);
            
            builder->addAssembly(stayTube).addAssembly(bracketTube).addAssembly(registerArm).addAssembly(steadyArm);
            builder->build();

            builders.push_back(builder);
            
            auto results = builder->generateResults();
            if (useViewer) {
                printCantileverResults(results, "Pole " + std::to_string(i + 1), modelName);
            } else {
                outputJson["poles"].push_back({
                    {"index", i},
                    {"model", modelName},
                    {"position", {{"x", 0.0}, {"y", 0.0}, {"z", zPos}}},
                    {"hardware", results}
                });
            }

            // Collect rendering data
            auto pLines = builder->getPoleLines();
            auto aLines = builder->getAssemblyLines();
            allLines.insert(allLines.end(), pLines.begin(), pLines.end());
            allLines.insert(allLines.end(), aLines.begin(), aLines.end());
        }

        // --- Vane Calculation ---
        if (numPoles >= 2) {
            auto frame1 = builders[0]->build();
            auto frame2 = builders[1]->build();

            VaneBuilder vane(
                frame1->cwAxis, frame1->mwAxis,
                frame2->cwAxis, frame2->mwAxis,
                0.01177, 7500.0,
                0.01373, 10000.0,
                5000.0, 0, 0.005,
                true, 50.0, false,
                1000.0, -1.0
            );

            vane.build();
            auto vaneResults = vane.generateResults();
            
            if (useViewer) {
                printVaneResults(vaneResults);
            } else {
                outputJson["vane"] = {
                    {"droppers", vaneResults},
                    {"span", spanDistance / 1000.0}
                };
            }

            auto vLines = vane.getAssemblyLines();
            allLines.insert(allLines.end(), vLines.begin(), vLines.end());
        }

        // --- Output Decision ---
        if (useViewer) {
            std::cout << "\nOpening Orbit 3D Viewer...\n";
            viewer::Viewer3D::Show({}, allLines);
        } else {
            outputJson["links"] = allLines;
            std::cout << outputJson.dump(2) << std::endl;
        }

    } catch (const std::exception& e) {
        std::cerr << "\nCritical Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
