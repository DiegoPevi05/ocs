#include "viewer/Viewer3D.hpp"
#include <raylib.h>
#include <algorithm>
#include <iostream>
#include <stdio.h> // for snprintf

namespace catenary {
namespace viewer {

void Viewer3D::Show(const std::vector<Line3D>& poleLines, const std::vector<Line3D>& assemblyLines) {
    InitWindow(1280, 720, "Catenary C++ Modular 3D Viewer");
    
    Camera3D camera = { 0 };
    camera.up = (Vector3){ 0.0f, 1.0f, 0.0f };
    camera.fovy = 45.0f;
    camera.projection = CAMERA_PERSPECTIVE;
    
    // Auto-focus camera on the assemblies 
    // We scale coordinates by 1000.0f (to meters) so raylib's 1000.0 default far clipping plane does not hide them!
    Vector3 center = { 0, 0, 0 };
    int count = 0;
    for (const auto& line : assemblyLines) {
        center.x += (line.start.x + line.end.x) / 1000.0f;
        center.y += (line.start.y + line.end.y) / 1000.0f;
        center.z += (line.start.z + line.end.z) / 1000.0f;
        count += 2;
    }
    
    if (count > 0) {
        center.x /= count;
        center.y /= count;
        center.z /= count;
        camera.target = center;
    } else {
        camera.target = (Vector3){ 0.0f, 6.0f, 0.0f };
    }

    SetTargetFPS(60);

    float cameraAngleX = 45.0f;
    float cameraAngleY = 45.0f;
    float cameraDistance = 8.0f;

    while (!WindowShouldClose()) {
        // --- CUSTOM CAD CAMERA ---
        if (IsMouseButtonDown(MOUSE_BUTTON_LEFT) || IsMouseButtonDown(MOUSE_BUTTON_RIGHT)) {
            Vector2 delta = GetMouseDelta();
            cameraAngleX += delta.x * 0.5f;
            cameraAngleY -= delta.y * 0.5f;
            if (cameraAngleY > 89.0f) cameraAngleY = 89.0f;
            if (cameraAngleY < -89.0f) cameraAngleY = -89.0f;
        }
        
        float wheel = GetMouseWheelMove();
        if (wheel != 0) {
            cameraDistance -= wheel * 1.5f;
            if (cameraDistance < 0.5f) cameraDistance = 0.5f;
        }

        // Keyboard Panning (Arrow Keys or WSAD)
        float panSpeed = cameraDistance * 0.02f;
        float cosAx = cosf((cameraAngleX - 90.0f) * PI / 180.0f);
        float sinAx = sinf((cameraAngleX - 90.0f) * PI / 180.0f);
        
        if (IsKeyDown(KEY_UP) || IsKeyDown(KEY_W)) camera.target.y += panSpeed;
        if (IsKeyDown(KEY_DOWN) || IsKeyDown(KEY_S)) camera.target.y -= panSpeed;
        
        if (IsKeyDown(KEY_LEFT) || IsKeyDown(KEY_A)) {
            camera.target.x -= cosAx * panSpeed;
            camera.target.z += sinAx * panSpeed;
        }
        if (IsKeyDown(KEY_RIGHT) || IsKeyDown(KEY_D)) {
            camera.target.x += cosAx * panSpeed;
            camera.target.z -= sinAx * panSpeed;
        }

        camera.position.x = camera.target.x + cameraDistance * cosf(cameraAngleY * PI / 180.0f) * cosf(cameraAngleX * PI / 180.0f);
        camera.position.y = camera.target.y + cameraDistance * sinf(cameraAngleY * PI / 180.0f);
        camera.position.z = camera.target.z + cameraDistance * cosf(cameraAngleY * PI / 180.0f) * sinf(cameraAngleX * PI / 180.0f);
        
        UpdateCamera(&camera, CAMERA_CUSTOM);

        BeginDrawing();
        ClearBackground(RAYWHITE);

        BeginMode3D(camera);
        
        // Draw Grid at ground level (1 meter spacing)
        DrawGrid(100, 1.0f);

        // Draw Pole (Solid Thick Cylinder)
        for (const auto& line : poleLines) {
            Vector3 start = { (float)line.start.x / 1000.0f, (float)line.start.y / 1000.0f, (float)line.start.z / 1000.0f };
            Vector3 end = { (float)line.end.x / 1000.0f, (float)line.end.y / 1000.0f, (float)line.end.z / 1000.0f };
            DrawCylinderEx(start, end, 0.15f, 0.15f, 12, Color{line.r, line.g, line.b, line.a});
        }
        
        // Draw Assemblies (Colorful solid wires)
        for (const auto& line : assemblyLines) {
            Vector3 start = { (float)line.start.x / 1000.0f, (float)line.start.y / 1000.0f, (float)line.start.z / 1000.0f };
            Vector3 end = { (float)line.end.x / 1000.0f, (float)line.end.y / 1000.0f, (float)line.end.z / 1000.0f };
            DrawCylinderEx(start, end, 0.02f, 0.02f, 8, Color{line.r, line.g, line.b, line.a});
            
            // Draw anchors as joint spheres
            DrawSphere(start, 0.035f, RED);
            DrawSphere(end, 0.035f, RED);
        }

        EndMode3D();
        
        // --- 2D OVERLAY (UI) ---
        DrawText("Catenary Hardware Modeler", 10, 10, 20, DARKGRAY);
        DrawText("- Use MOUSE CLICK (Hold) to Orbit, SCROLL to Zoom, ARROWS or WSAD to Pan", 10, 40, 15, GRAY);
        
        // User Requested Coordinate Logging Table
        /*int yOffset = 80;
        DrawText("Assembly Coordinate Table (mm)", 10, yOffset, 18, BLACK);
        yOffset += 25;
        
        for (const auto& line : assemblyLines) {
            char buffer[256];
            snprintf(buffer, sizeof(buffer), "%s: Start(%.1f, %.1f, %.1f) -> End(%.1f, %.1f, %.1f)", 
                     line.name.c_str(), line.start.x, line.start.y, line.start.z, 
                     line.end.x, line.end.y, line.end.z);
            DrawText(buffer, 10, yOffset, 14, Color{line.r, line.g, line.b, 255});
            yOffset += 22;
        }*/
        
        EndDrawing();
    }

    CloseWindow();
}

} // namespace viewer
} // namespace catenary
