package com.ocs.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Contains all AI-callable tool methods for modifying OCS location sceneData.
 * These methods are invoked by AiService after the AI model requests a tool call.
 */
@Component
@RequiredArgsConstructor
public class OcsAiTools {

    private final ObjectMapper mapper;

    public ObjectNode createTrack(ObjectNode sceneData, ObjectNode trackData) {
        getOrCreateArray(sceneData, "tracks").add(trackData);
        return sceneData;
    }

    /**
     * Standard across-track offset (mm) applied when snapping a foundation/pole to the track —
     * matches the design-criteria guidance's "typically 10 feet (3.05m)" system offset, rounded.
     */
    private static final double TRACK_OFFSET_MM = 3000.0;

    /**
     * The AI cannot reliably compute "perpendicular to the track, including through curves" —
     * that needs the same closest-point-on-polyline + tangent math the frontend does when a
     * human places one of these by clicking near the track (see EditorPage.tsx,
     * closestPointOnTracks). Left to the AI, foundations/poles ended up on the track centerline
     * itself instead of offset to the side, and badly off on curved segments. So: take whatever
     * approximate x/z the AI gives (roughly where along the alignment, and which side), find the
     * true closest point + local tangent on the actual track geometry, and snap to exactly
     * TRACK_OFFSET_MM perpendicular to that tangent, preserving which side the AI leaned toward.
     */
    public ObjectNode createFoundation(ObjectNode sceneData, ObjectNode foundationData) {
        snapToTrackOffset(foundationData, sceneData.path("tracks"));
        getOrCreateArray(sceneData, "foundations").add(foundationData);
        return sceneData;
    }

    public ObjectNode createPole(ObjectNode sceneData, ObjectNode poleData, JsonNode poleDefaults) {
        snapToTrackOffset(poleData, sceneData.path("tracks"));
        // "h" (mast height) isn't in the tool schema, so the AI never sets it — different parts
        // of the frontend then fall back to different defaults for a missing "h" (the edit form
        // uses the project's configured height, the 3D/2D viewer independently falls back to a
        // hardcoded 3000mm), which is exactly the 8500-vs-3000 mismatch this backfill prevents.
        resolveExact(poleData, "h", poleDefaults, "height", 8500);
        getOrCreateArray(sceneData, "poles").add(poleData);
        return sceneData;
    }

    private record TrackFoot(double x, double z, double y, double tx, double tz) {}

    private void snapToTrackOffset(ObjectNode entityData, JsonNode tracks) {
        if (!entityData.has("x") || !entityData.has("z")) return;
        if (tracks == null || !tracks.isArray() || tracks.isEmpty()) return;

        double px = entityData.path("x").asDouble();
        double pz = entityData.path("z").asDouble();
        TrackFoot foot = closestPointOnTracks(tracks, px, pz);

        // Rotate the tangent 90 degrees to get the perpendicular (across-track) direction,
        // then keep whichever side the AI's original point already leaned toward.
        double perpX = -foot.tz();
        double perpZ = foot.tx();
        double dot = (px - foot.x()) * perpX + (pz - foot.z()) * perpZ;
        double sign = dot >= 0 ? 1 : -1;

        entityData.put("x", foot.x() + perpX * sign * TRACK_OFFSET_MM);
        entityData.put("z", foot.z() + perpZ * sign * TRACK_OFFSET_MM);
        entityData.put("y", foot.y());
    }

    /**
     * Ported 1:1 from the frontend's closestPointOnTracks (EditorPage.tsx) so foundations/poles
     * snap to the exact same geometry the viewer itself uses, including curved segments (a track
     * point's "r" field draws an arc into that point, same convention as the viewer).
     */
    private TrackFoot closestPointOnTracks(JsonNode tracks, double px, double pz) {
        double footX = px, footZ = pz, footY = 0, minDist = Double.MAX_VALUE, tx = 1, tz = 0;

        for (JsonNode track : tracks) {
            JsonNode points = track.path("points");
            if (!points.isArray() || points.size() < 2) continue;

            for (int i = 1; i < points.size(); i++) {
                JsonNode prev = points.get(i - 1);
                JsonNode curr = points.get(i);
                double prevX = prev.path("x").asDouble(), prevZ = prev.path("z").asDouble(), prevY = prev.path("y").asDouble(0);
                double currX = curr.path("x").asDouble(), currZ = curr.path("z").asDouble(), currY = curr.path("y").asDouble(0);
                double r = curr.path("r").asDouble(0);

                if (Math.abs(r) > 1) {
                    double chord = Math.hypot(currX - prevX, currZ - prevZ);
                    double R = Math.abs(r);
                    if (R > chord / 2) {
                        double mx = (prevX + currX) / 2, mz = (prevZ + currZ) / 2;
                        double ux = (currX - prevX) / chord, uz = (currZ - prevZ) / chord;
                        double h = Math.sqrt(R * R - (chord / 2) * (chord / 2));
                        double sign = r > 0 ? 1 : -1;
                        double cx = mx - uz * h * sign, cz = mz + ux * h * sign;
                        double sa = Math.atan2(prevZ - cz, prevX - cx);
                        double ea = Math.atan2(currZ - cz, currX - cx);
                        double sweep = ea - sa;
                        if (r > 0 && sweep < 0) sweep += 2 * Math.PI;
                        if (r < 0 && sweep > 0) sweep -= 2 * Math.PI;

                        for (int s = 0; s <= 64; s++) {
                            double a = sa + sweep * s / 64.0;
                            double qx = cx + R * Math.cos(a), qz = cz + R * Math.sin(a);
                            double d = Math.hypot(px - qx, pz - qz);
                            if (d < minDist) {
                                minDist = d; footX = qx; footZ = qz;
                                double tDirX = -Math.sin(a) * (r < 0 ? -1 : 1);
                                double tDirZ = Math.cos(a) * (r < 0 ? -1 : 1);
                                double tLen = Math.hypot(tDirX, tDirZ);
                                tx = tLen > 0 ? tDirX / tLen : 1;
                                tz = tLen > 0 ? tDirZ / tLen : 0;
                                footY = prevY + (currY - prevY) * (s / 64.0);
                            }
                        }
                        continue;
                    }
                }

                double dx = currX - prevX, dz = currZ - prevZ;
                double len2 = dx * dx + dz * dz;
                if (len2 == 0) continue;
                double t = Math.max(0, Math.min(1, ((px - prevX) * dx + (pz - prevZ) * dz) / len2));
                double qx = prevX + t * dx, qz = prevZ + t * dz;
                double d = Math.hypot(px - qx, pz - qz);
                if (d < minDist) {
                    minDist = d; footX = qx; footZ = qz;
                    double len = Math.sqrt(len2);
                    tx = len > 0 ? dx / len : 1;
                    tz = len > 0 ? dz / len : 0;
                    footY = prevY + (currY - prevY) * t;
                }
            }
        }

        return new TrackFoot(footX, footZ, footY, tx, tz);
    }

    /**
     * The design-criteria text and project-defaults block tell the model the right numbers, but
     * it repeatedly writes them at the wrong scale anyway (6.55 instead of 6550mm, 0.2 or even a
     * plausible-looking-but-still-wrong 12 instead of 250mm zigzag) — a unit/decimal confusion,
     * not a missing-information problem, so no amount of clearer prompting reliably fixes it, and
     * a loose plausibility range isn't tight enough either (12 technically "looks" plausible).
     * These fields should essentially always equal the project's real configuration, so force
     * them to it exactly rather than just validating.
     */
    public ObjectNode createCantilever(ObjectNode sceneData, ObjectNode cantileverData, JsonNode cantileverDefaults) {
        resolveExact(cantileverData, "contactWireHeight", cantileverDefaults, "contactWireHeight", 5400);
        resolveExact(cantileverData, "systemHeight", cantileverDefaults, "systemHeight", 1000);
        resolveExactSigned(cantileverData, "zigzag", cantileverDefaults, "zigzag", 250);
        snapToNearestPole(cantileverData, sceneData.path("poles"));
        computeCantileverTrackFoot(cantileverData, sceneData.path("tracks"));
        getOrCreateArray(sceneData, "cantilevers").add(cantileverData);
        return sceneData;
    }

    /**
     * x2/z2 (contact wire point) and x2raw/z2raw/tx/tz (track foot + tangent) are derived from
     * the pole position and the track's actual geometry — the same closest-point-on-polyline
     * projection used for foundations/poles, followed by the frontend's own formula for applying
     * zigzag (EditorPage.tsx, handleCreateFromPanel: x2 = trackFoot + zigzag along the
     * pole-to-track axis). Left for the AI to compute, cantilevers ended up on the wrong side of
     * the track (same root cause as the earlier foundation/pole curve-offset bug) — so this is
     * computed here instead, using the pole position snapToNearestPole() already corrected.
     */
    private void computeCantileverTrackFoot(ObjectNode cantileverData, JsonNode tracks) {
        if (!cantileverData.has("x1") || !cantileverData.has("z1")) return;
        if (tracks == null || !tracks.isArray() || tracks.isEmpty()) return;

        double x1 = cantileverData.path("x1").asDouble();
        double z1 = cantileverData.path("z1").asDouble();
        TrackFoot foot = closestPointOnTracks(tracks, x1, z1);

        double dx = foot.x() - x1, dz = foot.z() - z1;
        double len = Math.hypot(dx, dz);
        double ux = len > 0 ? dx / len : 1;
        double uz = len > 0 ? dz / len : 0;
        double zigzag = cantileverData.path("zigzag").asDouble(250);

        cantileverData.put("x2raw", foot.x());
        cantileverData.put("z2raw", foot.z());
        cantileverData.put("tx", foot.tx());
        cantileverData.put("tz", foot.tz());
        cantileverData.put("x2", foot.x() + ux * zigzag);
        cantileverData.put("z2", foot.z() + uz * zigzag);
    }

    /**
     * The frontend associates a cantilever with its pole purely by proximity — x1/z1 (the
     * cantilever's own "pole position" fields) must land within 500mm of a real pole's x/z (see
     * EditorPage.tsx, cantileverMatchesPole/POLE_MATCH_DIST) — there is no explicit id linking
     * them. The AI's independent guess at the pole's position routinely misses that tolerance,
     * especially now that createPole() snaps poles to an exact perpendicular offset the AI has
     * no way to predict. Snap x1/z1 to whichever real pole is actually closest so the two always
     * line up, instead of trusting two separate tool calls to agree on the same coordinates.
     */
    private void snapToNearestPole(ObjectNode cantileverData, JsonNode poles) {
        if (!cantileverData.has("x1") || !cantileverData.has("z1")) return;
        if (poles == null || !poles.isArray() || poles.isEmpty()) return;

        double px = cantileverData.path("x1").asDouble();
        double pz = cantileverData.path("z1").asDouble();
        double bestDist = Double.MAX_VALUE;
        double bestX = px, bestZ = pz;

        for (JsonNode pole : poles) {
            double x = pole.path("x").asDouble();
            double z = pole.path("z").asDouble();
            double d = Math.hypot(px - x, pz - z);
            if (d < bestDist) {
                bestDist = d; bestX = x; bestZ = z;
            }
        }

        cantileverData.put("x1", bestX);
        cantileverData.put("z1", bestZ);
    }

    /**
     * Forces a field to exactly the project's configured value (or a hard-coded engineering
     * fallback if unconfigured), discarding whatever the AI supplied. Used for fields that should
     * essentially always match the project's real configuration — a plausibility range isn't
     * tight enough, since the model can land inside a wide range while still being wrong.
     */
    private void resolveExact(ObjectNode data, String field, JsonNode defaults, String defaultsKey, double hardFallback) {
        double fallback = (defaults != null && defaults.has(defaultsKey))
                ? defaults.path(defaultsKey).asDouble(hardFallback)
                : hardFallback;
        data.put(field, fallback);
    }

    /** Same as resolveExact but keeps the AI's intended sign (e.g. zigzag alternates +/- for TDP/CAI). */
    private void resolveExactSigned(ObjectNode data, String field, JsonNode defaults, String defaultsKey, double hardFallback) {
        double aiValue = data.path(field).asDouble(0);
        double magnitude = Math.abs((defaults != null && defaults.has(defaultsKey))
                ? defaults.path(defaultsKey).asDouble(hardFallback)
                : hardFallback);
        data.put(field, aiValue < 0 ? -magnitude : magnitude);
    }

    /**
     * x1/z1/x2/z2 on a vane are derived render/calculation positions (each end sits at the
     * linked cantilever's track-foot point, x2/z2 on that cantilever) — never something the AI
     * can reasonably invent, since it would need the exact same lookup this method does. The
     * frontend computes them the same way when a human draws a vane (see EditorPage.tsx,
     * setVaneModal at the two-cantilever click handler). Leaving them for the AI to guess left
     * them undefined, which propagated as NaN into the cantilever calculation payload for every
     * cantilever with a vane attached, breaking rendering — so we always (re)compute them here,
     * ignoring whatever the AI may or may not have supplied.
     */
    public ObjectNode createVane(ObjectNode sceneData, ObjectNode vaneData, JsonNode vaneDefaults) {
        JsonNode cantilevers = sceneData.path("cantilevers");
        if (cantilevers.isArray()) {
            int idx1 = vaneData.path("cantileverIdx1").asInt(-1);
            if (idx1 >= 0 && idx1 < cantilevers.size()) {
                JsonNode c1 = cantilevers.get(idx1);
                vaneData.put("x1", c1.path("x2").asDouble());
                vaneData.put("z1", c1.path("z2").asDouble());
            }
            JsonNode idx2Node = vaneData.path("cantileverIdx2");
            if (idx2Node.isIntegralNumber()) {
                int idx2 = idx2Node.asInt(-1);
                if (idx2 >= 0 && idx2 < cantilevers.size()) {
                    JsonNode c2 = cantilevers.get(idx2);
                    vaneData.put("x2", c2.path("x2").asDouble());
                    vaneData.put("z2", c2.path("z2").asDouble());
                }
            }
        }
        // Same off-scale problem as cantilever heights (e.g. cwWeight written as 1.35 instead of
        // the real ~0.0019 kg/mm convention) — force to the project's real configuration.
        resolveExact(vaneData, "cwWeight", vaneDefaults, "cwWeight", 0.0019);
        resolveExact(vaneData, "swWeight", vaneDefaults, "swWeight", 0.0024);
        resolveExact(vaneData, "cwTension", vaneDefaults, "cwTension", 1600);
        resolveExact(vaneData, "swTension", vaneDefaults, "swTension", 2000);
        getOrCreateArray(sceneData, "vanes").add(vaneData);
        return sceneData;
    }

    private ArrayNode getOrCreateArray(ObjectNode node, String field) {
        if (!node.has(field) || !node.get(field).isArray()) {
            node.set(field, mapper.createArrayNode());
        }
        return (ArrayNode) node.get(field);
    }
}
