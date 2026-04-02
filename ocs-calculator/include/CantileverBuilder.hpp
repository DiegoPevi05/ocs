#pragma once
#include "components/CantileverFrame.hpp"
#include "assemblies/HardwareAssembly.hpp"
#include "viewer/Viewer3D.hpp"
#include <memory>
#include <vector>

namespace catenary {

class CantileverBuilder {
private:
    std::shared_ptr<CantileverFrame> frame;
    std::vector<std::shared_ptr<assemblies::HardwareAssembly>> assemblies;

public:
    CantileverBuilder(
        components::ModelInterface model,
        const components::Track& track,
        components::CurveRadiusDirection curveRadiusDirection,
        const math::Vec3& pv,
        const Pole3D& pole,
        double u,
        double supportOffset,
        double contactWireHeight,
        double contactWireVerticalOffset,
        double systemHeight,
        double zigZag,
        double fixingDistance,
        double bottomFixedHeight
    );

    // Dynamic Parameter Update for Multi-Cantilever Math Orchestration
    void updatePoleContext(
        const math::Vec3& newPv,
        const math::Vec3& relocatedPolePos,
        double newSupportOffset,
        double newFixingDistance,
        double newBottomFixedHeight
    );

    CantileverBuilder& addAssembly(std::shared_ptr<assemblies::HardwareAssembly> assembly);

    std::shared_ptr<CantileverFrame> build();

    std::vector<assemblies::TubeDimension> generateResults() const;
    
    std::vector<viewer::Line3D> getPoleLines() const;
    std::vector<viewer::Line3D> getAssemblyLines() const;
};

} // namespace catenary
