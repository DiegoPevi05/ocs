#pragma once
#include <cmath>

namespace catenary {
namespace math {

struct Vec3 {
    double x;
    double y;
    double z;

    Vec3 operator+(const Vec3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    Vec3 operator-(const Vec3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    Vec3 operator*(double s) const { return {x * s, y * s, z * s}; }
    
    double magnitude() const { return std::sqrt(x*x + y*y + z*z); }
    Vec3 normalize() const {
        double m = magnitude();
        if (m == 0) return {0,0,0};
        return {x/m, y/m, z/m};
    }
    Vec3 cross(const Vec3& o) const {
        return {
            y * o.z - z * o.y,
            z * o.x - x * o.z,
            x * o.y - y * o.x
        };
    }
};

inline Vec3 add(const Vec3& a, const Vec3& b) {
    return { a.x + b.x, a.y + b.y, a.z + b.z };
}

inline Vec3 subtract(const Vec3& a, const Vec3& b) {
    return { a.x - b.x, a.y - b.y, a.z - b.z };
}

inline Vec3 scale(const Vec3& v, double s) {
    return { v.x * s, v.y * s, v.z * s };
}

inline double dot(const Vec3& a, const Vec3& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

inline Vec3 cross(const Vec3& a, const Vec3& b) {
    return {
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    };
}

inline double length(const Vec3& v) {
    return std::sqrt(dot(v, v));
}

Vec3 normalize(const Vec3& v);

inline Vec3 invert(const Vec3& v) {
    return { -v.x, -v.y, -v.z };
}

Vec3 getDirectionVector(const Vec3& from, const Vec3& to);

inline Vec3 getPointFromDirection(const Vec3& origin, const Vec3& direction, double magnitude) {
    return add(origin, scale(direction, magnitude));
}

inline double distanceBetween(const Vec3& p1, const Vec3& p2) {
    return length(subtract(p2, p1));
}

} // namespace math
} // namespace catenary
