#include "CantileverBuilder.hpp"
#include "assemblies/StayTube.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/SteadyArm.hpp"
#include "assemblies/RegisterArm.hpp"
#include "components/Pole3D.hpp"
#include "components/Pole.hpp"
#include "viewer/Viewer3D.hpp"
#include <iostream>
#include <iomanip>

using namespace catenary;

int main(int argc, char** argv) {
    std::cout << "C++ Catenary Modular Assembly Builder\n";
    std::cout << "=======================================\n";

    components::ModelInterface model = { { components::ConfigurationType::TDP_GT_2_2, components::ContactWireConfiguration::SINGLE } };
    components::PoleModel poleModel = { { 300.0 } };
    components::Track track = { 1435.0, { 50.0 } };
    
    // Use GLOBAL POV for spatial rendering separation
    Pole3D pole(std::nullopt, components::Pov::GLOBAL);
    pole.model = poleModel; 
    pole.globalPosition = { 0.0, 0.0, 0.0 };

    Pole3D pole2Template = pole;
    pole2Template.globalPosition = { 0.0, 0.0, -10000.0 }; // Global maps Z negatively -> (0,0,-(-10000)) = 10000 Z

    math::Vec3 pv = { 3000.0, 0.0, 0.0 };
    math::Vec3 pv2 = { 3000.0, 0.0, 10000.0 };

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
        -2.0, 1200.0, 100.0, std::nullopt, std::nullopt,
        { 33.7, 2.5 }, 
        components::HookEndFitting{100.0, 20.0},        // hook_end_fitting
        components::HookEndClamp{50.0, 40.0, 10.0, 10.0}, // hook_end_clamp
        components::SwivelClip{40.0, 30.0, 15.0},         // swivel_clip
        std::nullopt,
        components::ClampHolderContactWire{50, 40, 30, 0}
    };

    try {
        auto builder1 = std::make_shared<CantileverBuilder>(
            model, track, components::CurveRadiusDirection::INSIDE, pv, pole,
            0.0, 150.0, 5400.0, 120.0, 1000.0, 200.0, 1500.0, 800.0
        );
        // Assemble Hardware for Builder 1
        auto stayTube1 = std::make_shared<assemblies::StayTube>(stayTubeParams);
        auto bracketTube1 = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube1);
        auto steadyArm1 = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube1, nullptr);
        builder1->addAssembly(stayTube1).addAssembly(bracketTube1).addAssembly(steadyArm1);
        
        // Builder 2 removed per user request for only one cantilever on Pole 1

        // --- SECOND POLE DEMONSTRATION ---
        
        // Define PV for the second pole (10,000 meters / mm along Z axis)
        math::Vec3 pv2 = { 3000.0, 0.0, 10000.0 };

        auto builder3 = std::make_shared<CantileverBuilder>(
            model, track, components::CurveRadiusDirection::INSIDE, pv2, pole2Template,
            0.0, 150.0, 5400.0, 120.0, 1000.0, 200.0, 1500.0, 800.0
        );
        auto builder4 = std::make_shared<CantileverBuilder>(
            model, track, components::CurveRadiusDirection::INSIDE, pv2, pole2Template,
            0.0, 150.0, 5400.0, 120.0, 1000.0, 200.0, 1500.0, 800.0
        );

        // Parameters specifically for the Register Arm
        assemblies::RegisterArmParams regParams;
        regParams.alpha = 2.0;
        regParams.drop_bracket_distance = 150.0;
        regParams.eye_clamp_distance = 250.0;
        regParams.tube = { 33.7, 3.2 };
        regParams.stainless_steel_wire_rope = { 6.0 };
        regParams.drop_bracket = { 50.0, 100.0, 20.0, 30.0 };
        regParams.eye_clamp = { 35.0 };
        regParams.hook_end_fitting = { 100.0, 20.0 };

        // Assemble Hardware for Builder 3 (With Register Arm)
        auto stayTube3 = std::make_shared<assemblies::StayTube>(stayTubeParams);
        auto bracketTube3 = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube3);
        auto regArm3 = std::make_shared<assemblies::RegisterArm>(regParams);
        auto steadyArm3 = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube3, regArm3);
        builder3->addAssembly(stayTube3).addAssembly(bracketTube3).addAssembly(regArm3).addAssembly(steadyArm3);

        // Customize second cantilever for pole 2
        assemblies::RegisterArmParams regParams2 = regParams;
        regParams2.alpha = -2.0;
        regParams2.drop_bracket_distance = 200.0;

        assemblies::SteadyArmParams steadyArmParams2 = steadyArmParams;
        steadyArmParams2.alpha = -2.0; // Mirror the steady arm angle

        // Assemble Hardware for Builder 4
        auto stayTube4 = std::make_shared<assemblies::StayTube>(stayTubeParams);
        auto bracketTube4 = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube4);
        auto regArm4 = std::make_shared<assemblies::RegisterArm>(regParams2);
        auto steadyArm4 = std::make_shared<assemblies::SteadyArm>(steadyArmParams2, bracketTube4, regArm4);
        builder4->addAssembly(stayTube4).addAssembly(bracketTube4).addAssembly(regArm4).addAssembly(steadyArm4);

        // Orchestrate using our new Pole logic
        components::Pole poleOrchestrator(pole, 500.0, 150.0, 4500.0, 1440.0, 720.0, pv);
        poleOrchestrator.addCantilever(builder1);
        
        components::Pole poleOrchestrator2(pole2Template, 500.0, 150.0, 4500.0, 1440.0, 720.0, pv2);
        poleOrchestrator2.addCantilever(builder3)
                         .addCantilever(builder4);
        
        poleOrchestrator.buildAll();
        poleOrchestrator2.buildAll();

        auto results = poleOrchestrator.getAllResults();
        auto results2 = poleOrchestrator2.getAllResults();
        results.insert(results.end(), results2.begin(), results2.end());
        
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
        
        bool useViewer = false;
        for (int i = 1; i < argc; ++i) {
            if (std::string(argv[i]) == "--viewer") useViewer = true;
        }
        
        if (useViewer) {
            std::cout << "\nLaunching 3D Orbit Viewer (Multitenant Pole Mode)...\n";
            // Grab the Pole lines from the first configured builder of each pole
            std::vector<viewer::Line3D> poleLines = builder1->getPoleLines();
            auto poleLines2 = builder3->getPoleLines();
            poleLines.insert(poleLines.end(), poleLines2.begin(), poleLines2.end());

            auto allLines = poleOrchestrator.getAllRenderLines();
            auto allLines2 = poleOrchestrator2.getAllRenderLines();
            allLines.insert(allLines.end(), allLines2.begin(), allLines2.end());

            viewer::Viewer3D::Show(poleLines, allLines);
        }

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
