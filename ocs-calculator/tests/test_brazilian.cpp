#include "CantileverBuilder.hpp"
#include "assemblies/StayTube.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/SteadyArm.hpp"
#include "assemblies/RegisterArm.hpp"
#include "components/Pole3D.hpp"
#include <iostream>
#include <cassert>

using namespace catenary;

int main() {
    components::ModelInterface model = { { components::ConfigurationType::SBA, components::ContactWireConfiguration::SINGLE } };
    components::PoleModel poleModel = { { 300.0 } };
    components::Track track = { 1435.0, { 50.0 } };
    math::Vec3 pv = { 3000.0, 0.0, 0.0 };
    
    Pole3D pole(std::nullopt, components::Pov::LOCAL);
    pole.model = poleModel; 

    CantileverBuilder builder(
        model, track, components::CurveRadiusDirection::INSIDE, pv, pole,
        0.0, 150.0, 5400.0, 120.0, 1000.0, 200.0, 1500.0, 800.0
    );

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
        -5.0, 1200.0, 100.0, std::nullopt, std::nullopt,
        { 33.7, 2.5 }, std::nullopt, std::nullopt, std::nullopt, std::nullopt,
        components::ClampHolderContactWire{50, 40, 30, 0}
    };

    auto stayTube = std::make_shared<assemblies::StayTube>(stayTubeParams);
    auto bracketTube = std::make_shared<assemblies::BracketTube>(bracketTubeParams, stayTube);
    auto steadyArm = std::make_shared<assemblies::SteadyArm>(steadyArmParams, bracketTube, nullptr);

    builder.addAssembly(stayTube).addAssembly(bracketTube).addAssembly(steadyArm);
    builder.build();
    auto results = builder.generateResults();
    
    // We expect 3 geometry results: stay_tube, bracket_tube, steady_arm
    assert(results.size() >= 3);
    
    for (const auto& r : results) {
        if (r.name == "stay_tube") assert(std::abs(r.length_tube - 5077) < 5); // Allow small diff from original 5077
        if (r.name == "bracket_tube") assert(std::abs(r.length_tube - 6065) < 5);
        if (r.name == "steady_arm") assert(std::abs(r.length_tube - 6473) < 5);
    }
    std::cout << "All modular tests passed.\n";
    return 0;
}
