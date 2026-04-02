#pragma once

namespace catenary {
namespace components {

struct SteelTube {
    double d; // diameter
    double s; // thickness
};

struct Isolator {
    double d; // diameter
    double eye_length;
    double tube_length;
};

struct SwivelBracket {
    double x_pin;
};

struct SwivelClevis {
    double pin_eye;
};

struct ClevisEndFitting {
    double L;
    double a;
    double hook_x_distance;
};

struct EyeClamp {
    double h;
};

struct HookEndFitting {
    double L;
    double a;
};

struct HookEndClamp {
    double H;
    double Y;
    double A;
    double B;
};

struct SwivelClip {
    double A;
    double B;
    double C;
};

struct StainlessSteelWireRope {
    double d;
};

struct DropBracket {
    double x1;
    double h;
    double double_wire_separation_x;
    double double_wire_separation_z;
};

struct BrazilianWireSupport {
    double A;
    double B;
    double C;
    double D;
    double h;
};

struct ClampHolderContactWire {
    double A;
    double B;
    double C;
    double double_separation;
};

} // namespace components
} // namespace catenary
