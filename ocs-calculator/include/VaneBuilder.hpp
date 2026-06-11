#pragma once
#include "math/Vec3.hpp"
#include "viewer/Viewer3D.hpp"
#include <vector>

namespace catenary {

struct DropperResult {
    int index;
    double dropper_length;
    double distance_eye_to_eye;
    double distance_cw;
    double distance_pole_dropper;
    double distance_dropper_dropper;
    double distance_cw_h;
    double dropper_inclination;
};

class VaneBuilder {
private:
    math::Vec3 cw_start;
    math::Vec3 sw_start;
    math::Vec3 cw_end;
    math::Vec3 sw_end;

    double cw_weight;
    double cw_tension;
    double sw_weight;
    double sw_tension;

    double initial_separation;
    int qty_droppers;
    double dropper_weight;

    bool arrow;
    double arrow_length;
    bool lifting;
    double lifting_start_distance;
    double step_size; // mm between sample points for 3D rendering (0 = dropper-only points)

    // Computed properties
    double vane_length;
    double dropper_separation;
    double reaction_ax;
    double reaction_ay;
    double reaction_bx;
    double reaction_by;
    math::Vec3 startPoint;
    math::Vec3 endPoint;

    std::vector<math::Vec3> diffElementsPositions;
    std::vector<double> diffElementsWeights;
    std::vector<double> diffHeights;
    std::vector<double> diffElementsLifting;
    std::vector<double> diffElementsArrow;
    std::vector<int> dropper_indexes;
    std::vector<double> dropper_weights;

    // Helpers
    double getSystemHeightA() const;
    double getSystemHeightB() const;
    math::Vec3 getPointAlongVector(const math::Vec3& start, const math::Vec3& end, double distance) const;
    double getDistance3D(const math::Vec3& p1, const math::Vec3& p2) const;
    
    double getRelDiffMoments(size_t n) const;
    double getAbsDiffMoments() const;

    void generateDiffElements();
    void generateLifting();
    void generateDiffWeights();
    void generateReactions();
    void generateContactWireArrow();
    void generateHeights();

public:
    VaneBuilder(
        const math::Vec3& cw_start, const math::Vec3& sw_start,
        const math::Vec3& cw_end, const math::Vec3& sw_end,
        double cw_weight, double cw_tension,
        double sw_weight, double sw_tension,
        double initial_separation, int qty_droppers, double dropper_weight,
        bool arrow, double arrow_length, bool lifting,
        double step_size = 0.0,
        double lifting_start_distance = -1.0
    );

    void build();

    std::vector<DropperResult> generateResults() const;
    std::vector<viewer::Line3D> getAssemblyLines() const;
};

} // namespace catenary
