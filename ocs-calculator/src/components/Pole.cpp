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

void Pole::buildAll() {
    int quantity = cantilevers.size();
    if (quantity == 0) return;

    // The pole geometric position in world space
    pole3D.calculateGeometries(pv);
    math::Vec3 polePos = pole3D.polePosition; 
    
    // Direction vector from Pole pointing to track center (PV)
    math::Vec3 pvDir = polePos - pv;
    
    // Project to the ground plane (y=0) to find the flat track orientation
    pvDir.y = 0; 
    
    if (pvDir.magnitude() > 0.0) {
        pvDir = pvDir.normalize();
    } else {
        pvDir = {1.0, 0.0, 0.0}; // Default direction if exactly overlapping
    }
    
    // The vector perpendicular to the Track (used for shifting multiple cantilevers apart)
    math::Vec3 perpViaDir = pvDir.cross({0.0, 1.0, 0.0}).normalize();

    // The starting mathematical offset based on total quantity
    double startDist = -(catSeparation * (quantity - 1)) / 2.0;

    for (size_t i = 0; i < quantity; ++i) {
        double shiftOffset = startDist + (i * catSeparation);
        
        math::Vec3 shiftedPv = pv + (perpViaDir * shiftOffset);
        math::Vec3 shiftedPolePos = polePos + (perpViaDir * shiftOffset);
        
        // As per Pole.server.ts, single cantilevers have NO support offset. Multiple have standard support offset.
        double currentSupportOffset = (quantity == 1) ? 0.0 : supportOffset;

        // Contextualize the cantilever with math spacing and build it
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
