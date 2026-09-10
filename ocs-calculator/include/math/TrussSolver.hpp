#pragma once
#include "math/Vec3.hpp"
#include <vector>
#include <string>
#include <map>

namespace catenary {
namespace math {

struct TrussNode {
    int id;
    Vec3 pos;
    bool fixed; // If true, Ux=Uy=Uz=0
};

struct TrussElement {
    int id;
    std::string name;
    int nodeA;
    int nodeB;
    double E; // Young's Modulus (MPa = N/mm^2)
    double A; // Cross-sectional area (mm^2)
    double yield_stress; // Allowable stress for this element, MPa
};

struct TrussLoad {
    int node_id;
    Vec3 force; // Newtons
};

struct TrussResult {
    int element_id;
    double axial_force; // Newtons (+ tension, - comp)
    double stress; // MPa
    double utilization; // Ratio (Stress / Yield)
};

class TrussSolver {
private:
    std::vector<TrussNode> nodes;
    std::vector<TrussElement> elements;
    std::vector<TrussLoad> loads;
    
    // Gaussian elimination
    bool solveLinearSystem(std::vector<std::vector<double>>& A, std::vector<double>& b, std::vector<double>& x) const;

public:
    TrussSolver() = default;
    
    int addNode(const Vec3& pos, bool fixed = false);
    void addElement(int id, const std::string& name, int nodeA, int nodeB, double E, double A, double yield_stress = 215.0);
    void addLoad(int node_id, const Vec3& force);

    std::vector<TrussResult> solve() const;
};

} // namespace math
} // namespace catenary
