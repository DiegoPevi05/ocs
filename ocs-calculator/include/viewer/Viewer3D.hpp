#pragma once
#include <vector>
#include <string>
#include "math/Vec3.hpp"

namespace catenary {
namespace viewer {

struct Line3D {
    std::string name;
    math::Vec3 start;
    math::Vec3 end;
    // RGBA colors (0-255)
    unsigned char r, g, b, a;
    // Outer radius in mm. 0 = render as a wire/line; >0 = render as a 3D cylinder tube.
    double radius;

    Line3D(std::string name, math::Vec3 start, math::Vec3 end,
           unsigned char r=200, unsigned char g=200, unsigned char b=200, unsigned char a=255,
           double radius=0.0)
        : name(name), start(start), end(end), r(r), g(g), b(b), a(a), radius(radius) {}
};

class Viewer3D {
public:
    static void Show(const std::vector<Line3D>& poleLines, const std::vector<Line3D>& assemblyLines);
};

} // namespace viewer
} // namespace catenary
