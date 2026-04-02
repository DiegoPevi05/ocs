#pragma once
#include "assemblies/HardwareAssembly.hpp"
#include "components/CantileverFrame.hpp"

namespace catenary {
namespace assemblies {

struct StayTubeParams {
    double alpha; // populated logically
    components::SteelTube tube;
    components::Isolator isolator;
    struct MwSupport {
        components::BrazilianWireSupport wireSupport;
        double end_distance;
        double eye_clamp_distance;
    } mw_support;
    components::EyeClamp eye_clamp;
    components::SwivelBracket swivel_bracket;
    components::SwivelClevis swivel_clevis;
};

class StayTube : public HardwareAssembly {
public:
    StayTubeParams params;
    
public:
    // Core geometry outcomes expected by other arms
    math::Vec3 dir;
    math::Vec3 perp;
    math::Vec3 upperFixedPoint;
    math::Vec3 upperTubeEyeClampTubeFixedPoint;
    math::Vec3 upperIsolatorPoint;
    math::Vec3 upperTubeEndPoint;
    math::Vec3 wireSupportStainlessSteelPoint;
    math::Vec3 upperTubeEyeClampFixedPoint;

    StayTube(const StayTubeParams& params);
    
    void calculateGeometry(const CantileverFrame& frame) override;
    std::vector<TubeDimension> generateResults(const CantileverFrame& frame) const override;
    std::vector<viewer::Line3D> getRenderLines() const override;
};

} // namespace assemblies
} // namespace catenary
