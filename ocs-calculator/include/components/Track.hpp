#pragma once

namespace catenary {
namespace components {

struct Skate {
    double hw;
};

struct Track {
    double gauge;
    Skate skate;
};

} // namespace components
} // namespace catenary
