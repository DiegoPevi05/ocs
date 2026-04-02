#pragma once
#include "CantileverBuilder.hpp"
#include "components/Pole3D.hpp"
#include "math/Vec3.hpp"
#include <vector>
#include <memory>
#include <optional>

namespace catenary {
namespace components {

#include "components/PoleData.hpp"

class Pole {
public:
    Pole3D pole3D;
    double catSeparation;
    double supportOffset;
    double bottomFixedHeight;
    double fixingDistance;
    double esc;
    math::Vec3 pv;

    std::vector<std::shared_ptr<CantileverBuilder>> cantilevers;

    Pole(
        Pole3D pole_3d,
        double cat_separation,
        double support_offset,
        double bottom_fixed_height,
        double fixing_distance,
        double esc_val,
        const math::Vec3& pv_base
    );

    // Adds a fully-configured cantilever builder to the pole. 
    // Note: The builder's `pv` and offset arguments will be overridden sequentially during buildAll()
    Pole& addCantilever(std::shared_ptr<CantileverBuilder> builder);

    // Calculates the symmetrical multi-cantilever offset mathematical projections 
    // along the perpendicular vector of the track
    void buildAll();

    // Fetches all the resulting hardware geometry parameters (cut lengths, diameters)
    std::vector<assemblies::TubeDimension> getAllResults() const;

    // Fetches solid 3D cylinder representation of all Cantilever frames + Pole
    std::vector<viewer::Line3D> getAllRenderLines() const;

private:
    math::Vec3 calculatePolePosition() const;
    math::Vec3 calculatePvPosition() const;
};

} // namespace components
} // namespace catenary
