#pragma once
#include <cmath>

namespace catenary {
namespace math {

constexpr double PI = 3.14159265358979323846;

inline double degreesToRadians(double degrees) {
    return degrees * (PI / 180.0);
}

inline double radiansToDegrees(double radians) {
    return radians * (180.0 / PI);
}

inline double distanceBetween2D(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return std::sqrt(dx * dx + dy * dy);
}

inline double angleBetween2D(double x1, double y1, double x2, double y2) {
    return radiansToDegrees(std::atan2(y2 - y1, x2 - x1));
}

double roundToDecimals(double value, int qtyDecimals);

} // namespace math
} // namespace catenary
