#pragma once
#include "assemblies/HardwareAssembly.hpp"
#include "assemblies/StayTube.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/SteadyArm.hpp"
#include <memory>

namespace catenary {
namespace assemblies {

struct ReinforcementParams {
    components::SteelTube tube;
    double upper_distance_offset;
    components::EyeClamp upper_eye_clamp;
    components::HookEndFitting upper_hook_end_fitting;
    double bottom_distance_offset;
    components::EyeClamp bottom_eye_clamp;
    components::HookEndFitting bottom_hook_end_fitting;
};

class Reinforcement : public HardwareAssembly {
public:
    ReinforcementParams params;
    std::shared_ptr<StayTube> stayTube;
    std::shared_ptr<BracketTube> bracketTube;
    std::shared_ptr<SteadyArm> steadyArm;

public:
    math::Vec3 upperEyeClampPoint;
    math::Vec3 upperHookEndPoint;
    math::Vec3 bottomEyeClampPoint;
    math::Vec3 bottomHookEndPoint;
    math::Vec3 upperFixedPoint;
    math::Vec3 bottomFixedPoint;

    Reinforcement(const ReinforcementParams& params,
                  std::shared_ptr<StayTube> stayTube,
                  std::shared_ptr<BracketTube> bracketTube,
                  std::shared_ptr<SteadyArm> steadyArm);

    void calculateGeometry(const CantileverFrame& frame) override;
    std::vector<TubeDimension> generateResults(const CantileverFrame& frame) const override;
    std::vector<viewer::Line3D> getRenderLines() const override;
};

} // namespace assemblies
} // namespace catenary
