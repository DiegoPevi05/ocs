#pragma once
#include "assemblies/HardwareAssembly.hpp"
#include "assemblies/BracketTube.hpp"

namespace catenary {
namespace assemblies {

struct RegisterArmParams {
    double alpha;
    double drop_bracket_distance;
    double eye_clamp_distance;
    components::SteelTube tube;
    components::StainlessSteelWireRope stainless_steel_wire_rope;
    components::DropBracket drop_bracket;
    components::EyeClamp eye_clamp;
    components::HookEndFitting hook_end_fitting;
};

class RegisterArm : public HardwareAssembly {
public:
    RegisterArmParams params;

public:
    math::Vec3 dir;
    math::Vec3 perpV;
    math::Vec3 perpK;
    std::vector<math::Vec3> bracketBottomPoint;
    math::Vec3 bracketUpperFixedPoint;
    math::Vec3 eyeClampPoint;
    math::Vec3 eyeClampFixedPoint;
    math::Vec3 endPoint;
    math::Vec3 hookEndFittingPoint;

    // Additional data to store from other assemblies (for calculation sequence)
    std::vector<math::Vec3> steadyArmHookFixedPoint;
    math::Vec3 intersectionRegisterArmFixedPoint; 

    RegisterArm(const RegisterArmParams& params);

    // Call after SteadyArm fills its data, OR let builder supply the points.
    void injectSteadyArmHooks(const std::vector<math::Vec3>& hooks);
    void injectIntersectionPoint(const math::Vec3& intersection);

    void calculateGeometry(const CantileverFrame& frame) override;
    std::vector<TubeDimension> generateResults(const CantileverFrame& frame) const override;
    std::vector<viewer::Line3D> getRenderLines() const override;
};

} // namespace assemblies
} // namespace catenary
