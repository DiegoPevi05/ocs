#pragma once
#include "assemblies/HardwareAssembly.hpp"
#include "assemblies/BracketTube.hpp"
#include "assemblies/RegisterArm.hpp"
#include <memory>
#include <optional>

namespace catenary {
namespace assemblies {

struct SteadyArmParams {
    double alpha;
    double length;
    double end_distance;
    std::optional<double> eye_clamp_distance;
    std::optional<components::StainlessSteelWireRope> stainless_steel_wire_rope;
    components::SteelTube tube;
    std::optional<components::HookEndFitting> hook_end_fitting;
    std::optional<components::HookEndClamp> hook_end_clamp;
    std::optional<components::SwivelClip> swivel_clip;
    std::optional<components::EyeClamp> eye_clamp;
    std::optional<components::ClampHolderContactWire> eye_clamp_contact_wire;
};

class SteadyArm : public HardwareAssembly {
public:
    SteadyArmParams params;
    std::shared_ptr<BracketTube> bracketTube;
    std::shared_ptr<RegisterArm> registerArm; // Optional dependency for math

public:
    math::Vec3 dir;
    math::Vec3 perpV;
    math::Vec3 perpK;

    std::vector<math::Vec3> points;
    std::vector<math::Vec3> yAxisCwPoint;
    std::vector<math::Vec3> fixedPoint;
    math::Vec3 eyeClampPoint;
    math::Vec3 eyeClampFixedPoint;
    std::vector<math::Vec3> endPoint;
    std::vector<math::Vec3> hookClampPointClamp;
    std::vector<math::Vec3> hookClampPoint;
    std::vector<math::Vec3> hookClampIntersectionSupport;
    std::vector<math::Vec3> hookFixedPoint;
    math::Vec3 intersectionFixedPoint;
    math::Vec3 hookEndFittingPoint;
    
    // Core math points for intersection
    math::Vec3 intersectionPoint;
    math::Vec3 intersectionTubeFixedPoint;
    math::Vec3 intersectionRegisterArmFixedPoint;

    SteadyArm(const SteadyArmParams& params, 
              std::shared_ptr<BracketTube> bracketTube, 
              std::shared_ptr<RegisterArm> registerArm = nullptr);

    void calculateGeometry(const CantileverFrame& frame) override;
    std::vector<TubeDimension> generateResults(const CantileverFrame& frame) const override;
    std::vector<viewer::Line3D> getRenderLines() const override;

private:
    void calculateIntersections(const CantileverFrame& frame);
};

} // namespace assemblies
} // namespace catenary
