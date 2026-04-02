#include "math/MathUtils.hpp"
#include <cmath>

namespace catenary {
namespace math {

double roundToDecimals(double value, int qtyDecimals) {
    double factor = std::pow(10.0, qtyDecimals);
    return std::round(value * factor) / factor;
}

} // namespace math
} // namespace catenary
