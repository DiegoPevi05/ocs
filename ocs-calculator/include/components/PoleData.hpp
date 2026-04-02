#pragma once

namespace catenary {
namespace components {

struct PoleMeasures {
    double width;
};

struct PoleModel {
    PoleMeasures measures;
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
