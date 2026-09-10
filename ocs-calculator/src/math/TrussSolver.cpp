#include "math/TrussSolver.hpp"
#include "math/MathUtils.hpp"
#include <cmath>
#include <stdexcept>
#include <iostream>

namespace catenary {
namespace math {

int TrussSolver::addNode(const Vec3& pos, bool fixed) {
    int id = nodes.size();
    nodes.push_back({id, pos, fixed});
    return id;
}

void TrussSolver::addElement(int id, const std::string& name, int nodeA, int nodeB, double E, double A, double yield_stress) {
    elements.push_back({id, name, nodeA, nodeB, E, A, yield_stress});
}

void TrussSolver::addLoad(int node_id, const Vec3& force) {
    loads.push_back({node_id, force});
}

bool TrussSolver::solveLinearSystem(std::vector<std::vector<double>>& A, std::vector<double>& b, std::vector<double>& x) const {
    int n = A.size();
    for (int i = 0; i < n; i++) {
        // Find pivot
        double maxEl = std::abs(A[i][i]);
        int maxRow = i;
        for (int k = i + 1; k < n; k++) {
            if (std::abs(A[k][i]) > maxEl) {
                maxEl = std::abs(A[k][i]);
                maxRow = k;
            }
        }
        if (maxEl < 1e-12) return false; // Singular matrix

        // Swap maximum row with current row
        for (int k = i; k < n; k++) std::swap(A[maxRow][k], A[i][k]);
        std::swap(b[maxRow], b[i]);

        // Eliminate
        for (int k = i + 1; k < n; k++) {
            double c = -A[k][i] / A[i][i];
            for (int j = i; j < n; j++) {
                if (i == j) A[k][j] = 0;
                else A[k][j] += c * A[i][j];
            }
            b[k] += c * b[i];
        }
    }

    // Back substitution
    x.assign(n, 0.0);
    for (int i = n - 1; i >= 0; i--) {
        x[i] = b[i];
        for (int k = i + 1; k < n; k++) {
            x[i] -= A[i][k] * x[k];
        }
        x[i] /= A[i][i];
    }
    return true;
}

std::vector<TrussResult> TrussSolver::solve() const {
    if (nodes.empty()) return {};

    int n = nodes.size();
    int ndof = 3 * n;
    std::vector<std::vector<double>> K(ndof, std::vector<double>(ndof, 0.0));
    std::vector<double> F(ndof, 0.0);

    // Apply loads
    for (const auto& load : loads) {
        F[3 * load.node_id + 0] += load.force.x;
        F[3 * load.node_id + 1] += load.force.y;
        F[3 * load.node_id + 2] += load.force.z;
    }

    // Assemble global stiffness matrix
    for (const auto& el : elements) {
        Vec3 pA = nodes[el.nodeA].pos;
        Vec3 pB = nodes[el.nodeB].pos;
        
        double L = distanceBetween(pA, pB);
        if (L < 1e-6) continue;

        double cx = (pB.x - pA.x) / L;
        double cy = (pB.y - pA.y) / L;
        double cz = (pB.z - pA.z) / L;

        double k_val = el.E * el.A / L;

        double T[3][3] = {
            {cx*cx, cx*cy, cx*cz},
            {cy*cx, cy*cy, cy*cz},
            {cz*cx, cz*cy, cz*cz}
        };

        int dofA[3] = {3 * el.nodeA, 3 * el.nodeA + 1, 3 * el.nodeA + 2};
        int dofB[3] = {3 * el.nodeB, 3 * el.nodeB + 1, 3 * el.nodeB + 2};

        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                double val = k_val * T[i][j];
                K[dofA[i]][dofA[j]] += val;
                K[dofB[i]][dofB[j]] += val;
                K[dofA[i]][dofB[j]] -= val;
                K[dofB[i]][dofA[j]] -= val;
            }
        }
    }

    // Apply boundary conditions (penalty method)
    double penalty = 1e15;
    for (const auto& node : nodes) {
        if (node.fixed) {
            K[3 * node.id + 0][3 * node.id + 0] += penalty;
            K[3 * node.id + 1][3 * node.id + 1] += penalty;
            K[3 * node.id + 2][3 * node.id + 2] += penalty;
        } else {
            // Add a small artificial stiffness to all free nodes.
            // Since we built the truss from visual lines, many nodes might be collinear
            // (e.g. isolator -> tube -> clevis) or act as free-spinning mechanisms.
            // A small 1.0 N/mm spring prevents the stiffness matrix from becoming singular
            // without significantly absorbing primary axial forces.
            K[3 * node.id + 0][3 * node.id + 0] += 1.0;
            K[3 * node.id + 1][3 * node.id + 1] += 1.0;
            K[3 * node.id + 2][3 * node.id + 2] += 1.0;
        }
    }

    std::vector<double> U;
    if (!solveLinearSystem(K, F, U)) {
        std::cerr << "Warning: Truss solver failed to solve the linear system." << std::endl;
        return {};
    }

    // Calculate element forces and stresses
    std::vector<TrussResult> results;
    for (const auto& el : elements) {
        Vec3 pA = nodes[el.nodeA].pos;
        Vec3 pB = nodes[el.nodeB].pos;
        double L = distanceBetween(pA, pB);
        if (L < 1e-6) continue;

        double cx = (pB.x - pA.x) / L;
        double cy = (pB.y - pA.y) / L;
        double cz = (pB.z - pA.z) / L;

        double uAx = U[3 * el.nodeA + 0];
        double uAy = U[3 * el.nodeA + 1];
        double uAz = U[3 * el.nodeA + 2];
        double uBx = U[3 * el.nodeB + 0];
        double uBy = U[3 * el.nodeB + 1];
        double uBz = U[3 * el.nodeB + 2];

        double du_x = uBx - uAx;
        double du_y = uBy - uAy;
        double du_z = uBz - uAz;

        double dl = du_x * cx + du_y * cy + du_z * cz; // elongation
        double force = (el.E * el.A / L) * dl; // positive = tension
        double stress = force / el.A;
        double utilization = std::abs(stress) / el.yield_stress;

        results.push_back({el.id, force, stress, utilization});
    }

    return results;
}

} // namespace math
} // namespace catenary
