#pragma once

#include <string>
#include <optional>

namespace catenary {
namespace components {


// Cross-section dimensions used for geometry (offset from pole face to bracket connection)
struct PoleMeasures {
    double width;   // along-track dimension (mm)
    double length;  // perpendicular-to-track dimension — the face the cantilever arm connects to (mm)
};

// Full structural/physical properties for analysis
struct PolePhysicalProperties {
    std::string profileType;  // SQUARE_HOLE | CIRCLE_HOLE | T_PROFILE | DOUBLE_T | CUSTOM
    double height;            // total pole height (mm)
    double density;           // kg/m³
    double inertia_x;         // mm⁴
    double inertia_y;         // mm⁴
    double inertia_z;         // mm⁴
    double cross_area_x;      // mm²
    double cross_area_y;      // mm²
    double cross_area_z;      // mm²
    double width;             // cross-section width mm (matches PoleMeasures::width)
    double length;            // cross-section depth mm (matches PoleMeasures::length)
};

struct PoleModel {
    PoleMeasures measures;
    std::optional<PolePhysicalProperties> physicalProps;
};

struct PolePosition {
    double x;
    double y;
    double z;
};

struct PoleProperties {
    PoleModel model;
    PolePosition position;
};

} // namespace components
} // namespace catenary
