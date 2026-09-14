#include "components/Pole.hpp"

namespace catenary {
namespace components {

Pole::Pole(
    Pole3D pole_3d, double cat_sep, double sup_off,
    double bfh, double fd, double esc_val, const math::Vec3& pv_base
) : pole3D(pole_3d), catSeparation(cat_sep), supportOffset(sup_off),
    bottomFixedHeight(bfh), fixingDistance(fd), esc(esc_val), pv(pv_base)
{
}

Pole& Pole::addCantilever(std::shared_ptr<CantileverBuilder> builder) {
    cantilevers.push_back(builder);
    return *this;
}

void Pole::buildAll(int slotIndexOverride, int slotCountOverride) {
    int builderCount = cantilevers.size();
    if (builderCount == 0) return;

    int quantity = (slotCountOverride >= 1) ? slotCountOverride : builderCount;

    // A working cantilever never "rotates" to reach its wire target: it lives entirely in
    // the track-perpendicular plane through the pole center. With multiple cantilevers on
    // one pole, each arm is a rigid parallel copy of that same plane, translated sideways
    // (along the track-tangent direction) by its own slot offset — mount point AND wire
    // pickup point (cwAxis/mwAxis) shift together by the identical vector, so the arm's own
    // direction/geometry is completely unchanged, just relocated.
    //
    // That's achieved by shifting `pv` and this arm's OWN local `polePosition` (used only for
    // this arm's geometry) by the exact same vector: since directionPv is derived from
    // (pv - polePosition), an equal shift leaves it, and everything computed from it, unrotated.
    //
    // Offsets are symmetric about the true pole center (startDist..+startDist), so with 2
    // cantilevers both sit equidistant from the pole, not one on-center and one fully offset.
    // The pole/mast itself is rendered separately by the caller from the Pole's own always-
    // unshifted `pole3D` (see Pole::pole3D / getRenderLines), never from any arm's own shifted
    // frame, so it stays exactly at its true configured position regardless of this spacing.
    pole3D.calculateGeometries(pv);
    math::Vec3 polePos = pole3D.polePosition;

    math::Vec3 pvDir = polePos - pv;
    pvDir.y = 0.0;
    if (pvDir.magnitude() > 0.0) {
        pvDir = pvDir.normalize();
    } else {
        pvDir = {1.0, 0.0, 0.0};
    }
    math::Vec3 perpViaDir = pvDir.cross({0.0, 1.0, 0.0}).normalize();

    double startDist = -(catSeparation * (quantity - 1)) / 2.0;

    for (size_t i = 0; i < builderCount; ++i) {
        int slot = (slotIndexOverride >= 0) ? slotIndexOverride : (int)i;
        double shiftOffset = (quantity == 1) ? 0.0 : (startDist + slot * catSeparation);

        math::Vec3 shiftedPv = pv + (perpViaDir * shiftOffset);
        math::Vec3 shiftedPolePos = polePos + (perpViaDir * shiftOffset);

        // As per Pole.server.ts, single cantilevers have NO support offset. Multiple have standard support offset.
        double currentSupportOffset = (quantity == 1) ? 0.0 : supportOffset;

        cantilevers[i]->updatePoleContext(
            shiftedPv,
            shiftedPolePos,
            currentSupportOffset,
            fixingDistance,
            bottomFixedHeight
        );
        cantilevers[i]->build();
    }
}

std::vector<assemblies::TubeDimension> Pole::getAllResults() const {
    std::vector<assemblies::TubeDimension> allResults;
    for (const auto& builder : cantilevers) {
        auto res = builder->generateResults();
        allResults.insert(allResults.end(), res.begin(), res.end());
    }
    return allResults;
}

std::vector<viewer::Line3D> Pole::getAllRenderLines() const {
    std::vector<viewer::Line3D> allLines;
    
    // 1. Get the Pole rendering geometry.
    // If we have cantilevers, just extract it from the first built builder. 
    // Otherwise, calculate manually if we want empty poles.
    if (!cantilevers.empty()) {
        auto poleLines = cantilevers[0]->getPoleLines();
        allLines.insert(allLines.end(), poleLines.begin(), poleLines.end());
    }

    // 2. Get all Hardware Assembly geometries
    for (size_t i = 0; i < cantilevers.size(); ++i) {
        auto cLines = cantilevers[i]->getAssemblyLines();
        // Label the cantilever parts distinctively in viewer UI
        for (auto& line : cLines) {
            line.name = "Cantilever " + std::to_string(i + 1) + " | " + line.name;
        }
        allLines.insert(allLines.end(), cLines.begin(), cLines.end());
    }
    
    return allLines;
}

} // namespace components
} // namespace catenary
