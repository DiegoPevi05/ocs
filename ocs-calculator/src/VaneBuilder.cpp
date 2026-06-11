#include "VaneBuilder.hpp"
#include <cmath>
#include <algorithm>

namespace catenary {

VaneBuilder::VaneBuilder(
    const math::Vec3& cw_start, const math::Vec3& sw_start,
    const math::Vec3& cw_end, const math::Vec3& sw_end,
    double cw_weight, double cw_tension,
    double sw_weight, double sw_tension,
    double initial_separation, int qty_droppers, double dropper_weight,
    bool arrow, double arrow_length, bool lifting,
    double step_size,
    double lifting_start_distance
) : 
    cw_start(cw_start), sw_start(sw_start),
    cw_end(cw_end), sw_end(sw_end),
    cw_weight(cw_weight), cw_tension(cw_tension),
    sw_weight(sw_weight), sw_tension(sw_tension),
    initial_separation(initial_separation), qty_droppers(qty_droppers), dropper_weight(dropper_weight),
    arrow(arrow), arrow_length(arrow_length), lifting(lifting), 
    lifting_start_distance(lifting_start_distance), step_size(step_size)
{
    startPoint = cw_start;
    endPoint = cw_end;
    vane_length = getDistance3D(startPoint, endPoint);

    double totalDist2d = std::sqrt(std::pow(endPoint.x - startPoint.x, 2) + std::pow(endPoint.z - startPoint.z, 2));

    if (this->lifting_start_distance < 0) {
        this->lifting_start_distance = totalDist2d / 2.0;
    }
    this->lifting_start_distance = std::max(0.0, std::min(this->lifting_start_distance, totalDist2d));

    if (qty_droppers == 0) {
        if (totalDist2d <= 20000) this->qty_droppers = 4;
        else if (totalDist2d < 30000) this->qty_droppers = 4;
        else if (totalDist2d < 34000) this->qty_droppers = 6;
        else if (totalDist2d < 38000) this->qty_droppers = 6;
        else if (totalDist2d < 40000) this->qty_droppers = 7;
        else if (totalDist2d < 60000) this->qty_droppers = 7;
        else this->qty_droppers = 11;
    }

    if (this->qty_droppers > 1) {
        dropper_separation = (totalDist2d - 2.0 * this->initial_separation) / (this->qty_droppers - 1);
    } else {
        dropper_separation = 0;
    }

    reaction_ax = 0;
    reaction_ay = 0;
    reaction_bx = 0;
    reaction_by = 0;
}

double VaneBuilder::getDistance3D(const math::Vec3& p1, const math::Vec3& p2) const {
    return math::distanceBetween(p1, p2);
}

double VaneBuilder::getSystemHeightA() const {
    return std::abs(cw_start.y - sw_start.y);
}

double VaneBuilder::getSystemHeightB() const {
    return std::abs(cw_end.y - sw_end.y);
}

math::Vec3 VaneBuilder::getPointAlongVector(const math::Vec3& start, const math::Vec3& end, double distance) const {
    double totalLength = getDistance3D(start, end);
    if (totalLength == 0) return start;
    double ratio = std::max(0.0, std::min(distance / totalLength, 1.0));
    return math::add(start, math::scale(math::subtract(end, start), ratio));
}

void VaneBuilder::generateDiffElements() {
    double totalDist2d = std::sqrt(std::pow(endPoint.x - startPoint.x, 2) + std::pow(endPoint.z - startPoint.z, 2));

    // 1. Collect all dropper distances (horizontal positions)
    std::vector<double> distances2d;
    distances2d.push_back(0.0); // pole A
    for (int i = 0; i < qty_droppers; i++) {
        distances2d.push_back(initial_separation + i * dropper_separation);
    }
    distances2d.push_back(totalDist2d); // pole B

    // 2. If step_size requested, merge a dense rendering grid
    if (step_size > 0.0) {
        double d = step_size;
        while (d < totalDist2d) {
            distances2d.push_back(d);
            d += step_size;
        }
        std::sort(distances2d.begin(), distances2d.end());
        distances2d.erase(
            std::unique(distances2d.begin(), distances2d.end(),
                [](double a, double b){ return std::abs(a - b) < 0.1; }),
            distances2d.end()
        );
    }

    // 3. Build position array
    diffElementsPositions.clear();
    dropper_indexes.clear();
    for (double d2d : distances2d) {
        double ratio = (totalDist2d > 0) ? d2d / totalDist2d : 0.0;
        math::Vec3 p;
        p.x = startPoint.x + (endPoint.x - startPoint.x) * ratio;
        p.z = startPoint.z + (endPoint.z - startPoint.z) * ratio;
        
        // Apply lifting start distance to Y coordinate
        if (totalDist2d > 0) {
            if (d2d < lifting_start_distance) {
                p.y = startPoint.y;
            } else {
                double denom = totalDist2d - lifting_start_distance;
                double t = (denom > 0) ? (d2d - lifting_start_distance) / denom : 1.0;
                p.y = startPoint.y * (1.0 - t) + endPoint.y * t;
            }
        } else {
            p.y = startPoint.y;
        }
        
        diffElementsPositions.push_back(p);
    }

    // 4. Find dropper indexes
    for (int i = 0; i < qty_droppers; i++) {
        double target = initial_separation + i * dropper_separation;
        for (size_t j = 0; j < distances2d.size(); j++) {
            if (std::abs(distances2d[j] - target) < 0.1) {
                dropper_indexes.push_back(j);
                break;
            }
        }
    }

    diffElementsArrow.assign(diffElementsPositions.size(), 0.0);
    diffHeights.assign(diffElementsPositions.size(), 0.0);
    diffElementsWeights.assign(diffElementsPositions.size(), 0.0);
    dropper_weights.assign(qty_droppers, 0.0);
    diffElementsLifting.assign(diffElementsPositions.size(), 0.0);
}

void VaneBuilder::generateLifting() {
    // simplified or not implemented for now since lifting=false in Normal configuration
}

double VaneBuilder::getRelDiffMoments(size_t n) const {
    double sum = 0;
    double rel_len = std::sqrt(std::pow(diffElementsPositions[n].x - startPoint.x, 2) + std::pow(diffElementsPositions[n].z - startPoint.z, 2));
    for (size_t x = 1; x < n; x++) {
        double el_len = std::sqrt(std::pow(diffElementsPositions[x].x - startPoint.x, 2) + std::pow(diffElementsPositions[x].z - startPoint.z, 2));
        sum += diffElementsWeights[x] * (rel_len - el_len);
    }
    return sum;
}

double VaneBuilder::getAbsDiffMoments() const {
    double sum = 0;
    double totalDist2d = std::sqrt(std::pow(endPoint.x - startPoint.x, 2) + std::pow(endPoint.z - startPoint.z, 2));
    if (diffElementsPositions.size() <= 2) return 0;
    for (size_t x = 1; x <= diffElementsPositions.size() - 2; x++) {
        double el_len = std::sqrt(std::pow(diffElementsPositions[x].x - startPoint.x, 2) + std::pow(diffElementsPositions[x].z - startPoint.z, 2));
        sum += diffElementsWeights[x] * (totalDist2d - el_len);
    }
    return sum;
}

void VaneBuilder::generateDiffWeights() {
    double totalWeight = cw_weight;
    for (size_t x = 0; x < diffElementsPositions.size() - 1; x++) {
        if (x == 0 || x == diffElementsPositions.size() - 1) {
            diffElementsWeights[x] = 0;
        } else {
            double drop_weight = 0;
            auto it = std::find(dropper_indexes.begin(), dropper_indexes.end(), x);
            if (it != dropper_indexes.end()) {
                int drop_idx = std::distance(dropper_indexes.begin(), it);
                drop_weight = dropper_weights[drop_idx];
            }

            double prevHalf = getDistance3D(diffElementsPositions[x - 1], diffElementsPositions[x]) / 2.0;
            double nextHalf = getDistance3D(diffElementsPositions[x + 1], diffElementsPositions[x]) / 2.0;
            
            diffElementsWeights[x] = (prevHalf + nextHalf) * totalWeight + drop_weight;
        }
    }
}

void VaneBuilder::generateReactions() {
    double totalDist2d = std::sqrt(std::pow(endPoint.x - startPoint.x, 2) + std::pow(endPoint.z - startPoint.z, 2));
    double L = totalDist2d;
    double p = sw_weight;
    double MB = getAbsDiffMoments() + (p * L * L / 2.0);
    double h_val = sw_start.y - sw_end.y; // Actual elevation difference of messenger wire
    double Ta = sw_tension;

    double numerator = MB * h_val + std::sqrt(std::max(0.0, (Ta * Ta * L * L * (L * L + h_val * h_val)) - MB * MB * L * L));
    double denominator = L * L + h_val * h_val;

    if (denominator > 0) {
        reaction_ax = numerator / denominator;
    } else {
        reaction_ax = Ta;
    }

    if (L > 0) {
        reaction_by = (MB - h_val * reaction_ax) / L;
    } else {
        reaction_by = 0;
    }

    double total_weight = p * L;
    for (double w : diffElementsWeights) {
        total_weight += w;
    }
    reaction_ay = total_weight - reaction_by;
    reaction_bx = reaction_ax;
}

void VaneBuilder::generateContactWireArrow() {
    if (!arrow) return;

    double maximumArrow = (arrow_length > 0) ? arrow_length : (0.068 / 60.0) * vane_length;
    if (dropper_indexes.empty()) return;

    // Parabola parameterised by distance along the vane (not by array index),
    // so the shape is correct regardless of how many rendering-grid points were inserted.
    double d_start = initial_separation;
    double d_end   = vane_length - initial_separation;
    if (d_start >= d_end) return;

    double d_mid    = (d_start + d_end) * 0.5;
    double half_span = d_mid - d_start;
    if (half_span == 0.0) return;

    double a = -maximumArrow / (half_span * half_span);

    for (size_t x = 0; x < diffElementsPositions.size(); x++) {
        double dist = getDistance3D(startPoint, diffElementsPositions[x]);
        if (dist >= d_start && dist <= d_end) {
            diffElementsArrow[x] = a * std::pow(dist - d_mid, 2) + maximumArrow;
        } else {
            diffElementsArrow[x] = 0.0;
        }
    }
}

void VaneBuilder::generateHeights() {
    for (size_t x = 0; x < diffElementsPositions.size(); x++) {
        if (x == 0) {
            diffHeights[x] = getSystemHeightA();
        } else if (x == diffElementsPositions.size() - 1) {
            diffHeights[x] = getSystemHeightB();
        } else {
            double elem_len = getDistance3D(startPoint, diffElementsPositions[x]);

            // Correct cable sag formula, valid for all x with no left/right split:
            //
            //   diffHeights(x) = baseline(x) − M_beam(x)/H
            //
            // where M_beam(x) = R_A_beam·x − getRelDiffMoments(x) − p·x²/2
            // and   R_A_beam  = MB/L  (pure-beam reaction at A, from moment
            //                          equilibrium about B, independent of geometry).
            //
            // MB = reaction_by·L + h·reaction_ax  (from generateReactions), so:
            //   R_A_beam = reaction_by + h_messenger·H/L
            //
            // This guarantees M_beam(0)=0 and M_beam(L)=0, giving exactly heightA
            // at x=0 and heightB at x=L with a smooth parabola in between.
            double totalDist2d = std::sqrt(std::pow(endPoint.x - startPoint.x, 2) + std::pow(endPoint.z - startPoint.z, 2));
            double h_messenger = sw_start.y - sw_end.y;
            double R_A_beam = reaction_by + (totalDist2d > 0.0 ? h_messenger * reaction_ax / totalDist2d : 0.0);
            double support_wire_arrow = 0;
            if (reaction_ax != 0) {
                support_wire_arrow = (R_A_beam * elem_len
                                      - getRelDiffMoments(x)
                                      - sw_weight * elem_len * elem_len / 2.0)
                                     / reaction_ax;
            }

            // Linearly interpolated chord: correct for asymmetric spans (heightA ≠ heightB).
            double baseline;
            double dist2d = std::sqrt(std::pow(diffElementsPositions[x].x - startPoint.x, 2) + std::pow(diffElementsPositions[x].z - startPoint.z, 2));
            double totalDist2d = std::sqrt(std::pow(endPoint.x - startPoint.x, 2) + std::pow(endPoint.z - startPoint.z, 2));

            if (totalDist2d > 0 && dist2d > lifting_start_distance) {
                double denom = totalDist2d - lifting_start_distance;
                double t = (denom > 0) ? (dist2d - lifting_start_distance) / denom : 1.0;
                baseline = getSystemHeightA() * (1.0 - t) + getSystemHeightB() * t;
            } else {
                baseline = getSystemHeightA();
            }
            diffHeights[x] = baseline - support_wire_arrow;

            auto it = std::find(dropper_indexes.begin(), dropper_indexes.end(), x);
            if (it != dropper_indexes.end()) {
                int drop_idx = std::distance(dropper_indexes.begin(), it);
                dropper_weights[drop_idx] = (diffHeights[x] + diffElementsArrow[x]) * dropper_weight;
            }
        }
    }
}


void VaneBuilder::build() {
    generateDiffElements();
    generateLifting();

    // Iterator to reach steady state
    for (int i = 0; i < 2; i++) {
        generateDiffWeights();
        generateReactions();
        generateContactWireArrow();
        generateHeights();
    }
}

std::vector<DropperResult> VaneBuilder::generateResults() const {
    std::vector<DropperResult> results;
    for (size_t i = 0; i < dropper_indexes.size(); i++) {
        int idx = dropper_indexes[i];
        
        math::Vec3 point1 = diffElementsPositions[idx];
        point1.y = point1.y - diffElementsArrow[idx] + diffElementsLifting[idx];
        
        math::Vec3 point2 = diffElementsPositions[idx];
        point2.y = point2.y + diffHeights[idx];

        double dropper_length = getDistance3D(point1, point2);
        
        DropperResult r;
        r.index = i;
        r.dropper_length = dropper_length / 1000.0 - 0.112 + 0.705;
        r.distance_eye_to_eye = dropper_length / 1000.0 - 0.112;
        r.distance_cw = dropper_length / 1000.0;
        r.distance_pole_dropper = getDistance3D(diffElementsPositions[0], diffElementsPositions[idx]) / 1000.0;
        r.distance_dropper_dropper = (i == 0) ? (initial_separation / 1000.0) : (dropper_separation / 1000.0);
        r.distance_cw_h = point1.y / 1000.0;
        
        // Approximation for inclination if needed
        r.dropper_inclination = 0; 

        results.push_back(r);
    }
    return results;
}

std::vector<viewer::Line3D> VaneBuilder::getAssemblyLines() const {
    std::vector<viewer::Line3D> lines;
    
    // Support wire curve
    for (size_t i = 0; i < diffElementsPositions.size() - 1; i++) {
        math::Vec3 p1 = diffElementsPositions[i];
        p1.y += diffHeights[i];
        
        math::Vec3 p2 = diffElementsPositions[i+1];
        p2.y += diffHeights[i+1];
        
        lines.push_back(viewer::Line3D("SupportWire", p1, p2, 147, 51, 234, 255));
    }
    
    // Contact wire curve
    for (size_t i = 0; i < diffElementsPositions.size() - 1; i++) {
        math::Vec3 p1 = diffElementsPositions[i];
        p1.y = p1.y - diffElementsArrow[i] + diffElementsLifting[i];
        
        math::Vec3 p2 = diffElementsPositions[i+1];
        p2.y = p2.y - diffElementsArrow[i+1] + diffElementsLifting[i+1];
        
        lines.push_back(viewer::Line3D("ContactWire", p1, p2, 147, 51, 234, 255));
    }
    
    // Droppers
    for (size_t i = 0; i < dropper_indexes.size(); i++) {
        int idx = dropper_indexes[i];
        math::Vec3 point1 = diffElementsPositions[idx];
        point1.y = point1.y - diffElementsArrow[idx] + diffElementsLifting[idx];
        
        math::Vec3 point2 = diffElementsPositions[idx];
        point2.y = point2.y + diffHeights[idx];
        
        std::string name = "Dropper_" + std::to_string(i);
        lines.push_back(viewer::Line3D(name, point1, point2, 147, 51, 234, 255));
    }
    
    return lines;
}

} // namespace catenary
