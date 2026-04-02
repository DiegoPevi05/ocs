#include "math/Vec3.hpp"
#include <stdexcept>

namespace catenary {
namespace math {

Vec3 normalize(const Vec3& v) {
    double len = length(v);
    if (len == 0.0) {
        throw std::runtime_error("Zero vector normalization");
    }
    return scale(v, 1.0 / len);
}

Vec3 getDirectionVector(const Vec3& from, const Vec3& to) {
    Vec3 diff = subtract(to, from);
    double len = length(diff);
    if (len == 0.0) {
        throw std::runtime_error("Points are the same; direction is undefined.");
    }
    return scale(diff, 1.0 / len);
}

} // namespace math
} // namespace catenary
