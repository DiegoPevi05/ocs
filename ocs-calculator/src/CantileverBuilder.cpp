#include "CantileverBuilder.hpp"

namespace catenary {

CantileverBuilder::CantileverBuilder(
    components::ModelInterface model,
    const components::Track& track,
    components::CurveRadiusDirection curveRadiusDirection,
    const math::Vec3& pv,
    const Pole3D& pole,
    double u,
    double supportOffset,
    double contactWireHeight,
    double contactWireVerticalOffset,
    double systemHeight,
    double zigZag,
    double fixingDistance,
    double bottomFixedHeight
) {
    frame = std::make_shared<CantileverFrame>(
        model, track, curveRadiusDirection, pv, pole, u, supportOffset,
        contactWireHeight, contactWireVerticalOffset, systemHeight, zigZag,
        fixingDistance, bottomFixedHeight
    );
}

void CantileverBuilder::updatePoleContext(
    const math::Vec3& newPv,
    const math::Vec3& relocatedPolePos,
    double newSupportOffset,
    double newFixingDistance,
    double newBottomFixedHeight
) {
    if (frame) {
        frame->pv = newPv;
        frame->pole.polePosition = relocatedPolePos;
        frame->isRelocated = true;
        
        frame->supportOffset = newSupportOffset;
        frame->fixingDistance = newFixingDistance;
        frame->bottomFixedHeight = newBottomFixedHeight;
    }
}

CantileverBuilder& CantileverBuilder::addAssembly(std::shared_ptr<assemblies::HardwareAssembly> assembly) {
    assemblies.push_back(assembly);
    return *this;
}

std::shared_ptr<CantileverFrame> CantileverBuilder::build() {
    frame->calculateGeometry();
    for (auto& assembly : assemblies) {
        assembly->calculateGeometry(*frame);
    }
    return frame;
}

std::vector<assemblies::TubeDimension> CantileverBuilder::generateResults() const {
    std::vector<assemblies::TubeDimension> allResults;
    for (const auto& assembly : assemblies) {
        auto res = assembly->generateResults(*frame);
        allResults.insert(allResults.end(), res.begin(), res.end());
    }
    return allResults;
}

std::vector<viewer::Line3D> CantileverBuilder::getPoleLines() const {
    if (frame) return frame->pole.getRenderLines();
    return {};
}

std::vector<viewer::Line3D> CantileverBuilder::getAssemblyLines() const {
    std::vector<viewer::Line3D> allLines;
    for (const auto& assembly : assemblies) {
        auto lines = assembly->getRenderLines();
        allLines.insert(allLines.end(), lines.begin(), lines.end());
    }
    return allLines;
}

math::Vec3 CantileverBuilder::getCwAxis() const {
    if (frame) return frame->cwAxis;
    return {0, 0, 0};
}

math::Vec3 CantileverBuilder::getMwAxis() const {
    if (frame) return frame->mwAxis;
    return {0, 0, 0};
}

} // namespace catenary
