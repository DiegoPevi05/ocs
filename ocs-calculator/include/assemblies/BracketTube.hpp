#pragma once
#include "assemblies/HardwareAssembly.hpp"
#include "assemblies/StayTube.hpp"
#include <memory>

namespace catenary {
namespace assemblies {

struct BracketTubeParams {
    components::SteelTube tube;
    components::Isolator isolator;
    components::SwivelBracket swivel_bracket;
    components::SwivelClevis swivel_clevis;
    components::ClevisEndFitting clevis_end_fitting;
    components::EyeClamp eye_clamp;
};

class BracketTube : public HardwareAssembly {
public:
    BracketTubeParams params;
    std::shared_ptr<StayTube> stayTube; // dependency

public:
    math::Vec3 dir;
    math::Vec3 perp;
    math::Vec3 bottomFixedPoint;
    math::Vec3 bottomIsolatorPoint;
    math::Vec3 upperEyeClampClevisFixedPoint;
    math::Vec3 upperEyeClampClevisStainlessSteelPoint;

    BracketTube(const BracketTubeParams& params, std::shared_ptr<StayTube> stayTube);
    
    void calculateGeometry(const CantileverFrame& frame) override;
    std::vector<TubeDimension> generateResults(const CantileverFrame& frame) const override;
    std::vector<viewer::Line3D> getRenderLines() const override;
};

} // namespace assemblies
} // namespace catenary
