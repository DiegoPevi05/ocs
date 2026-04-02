#pragma once
#include <string>

namespace catenary {
namespace components {

enum class ConfigurationType {
    TDP_LT_2_2,
    TDP_GT_2_2,
    SBA,
    CAI
};

enum class ContactWireConfiguration {
    SINGLE,
    DOUBLE
};

struct ModelType {
    ConfigurationType configuration;
    ContactWireConfiguration contactWireConfiguration;
};

struct ModelInterface {
    ModelType type;
};

enum class CurveRadiusDirection {
    INSIDE,
    OUTSIDE
};

enum class Pov {
    LOCAL,
    GLOBAL
};

// Help functions for strings
inline bool isTdpLt2_2(ConfigurationType c) { return c == ConfigurationType::TDP_LT_2_2; }
inline bool isTdpGt2_2(ConfigurationType c) { return c == ConfigurationType::TDP_GT_2_2; }
inline bool isSba(ConfigurationType c) { return c == ConfigurationType::SBA; }
inline bool isCai(ConfigurationType c) { return c == ConfigurationType::CAI; }

inline std::string configToString(ConfigurationType c) {
    if (c == ConfigurationType::TDP_LT_2_2) return "TDP<2.2";
    if (c == ConfigurationType::TDP_GT_2_2) return "TDP>2.2";
    if (c == ConfigurationType::SBA) return "SBA";
    if (c == ConfigurationType::CAI) return "CAI";
    return "UNKNOWN";
}

} // namespace components
} // namespace catenary
