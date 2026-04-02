#pragma once
#include <vector>
#include <string>
#include "viewer/Viewer3D.hpp"

namespace catenary {

// Forward declare the frame that holds the Cantilever's global properties.
class CantileverFrame;

namespace assemblies {

struct TubeDimension {
    std::string name;
    double diameter;
    double thickness;
    double length_tube;
    double cut_length;
};

class HardwareAssembly {
public:
    virtual ~HardwareAssembly() = default;

    // This method will be called sequentially to calculate intersection logics.
    virtual void calculateGeometry(const CantileverFrame& frame) = 0;

    // Extract length/tube info
    virtual std::vector<TubeDimension> generateResults(const CantileverFrame& frame) const = 0;

    // GUI Visualizer Rendering extraction
    virtual std::vector<viewer::Line3D> getRenderLines() const = 0;
};

} // namespace assemblies
} // namespace catenary
