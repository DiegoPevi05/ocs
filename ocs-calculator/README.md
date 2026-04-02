# C++ Catenary Modular Library

A modular C++ Entity-Component library designed to geometrically calculate the cuts and structural placements of monolithic 3D Cantilevers and Poles.

## Requirements

### Basic Dependencies (CLI Math Only)
To build the math/CLI portion, you simply require `CMake` and a modern `g++` (C++17) compiler. No external libraries are needed.
```bash
sudo apt update
sudo apt install build-essential cmake
```

### Viewer Dependencies (3D Graphic Subsystem)
If you wish to build the interactive 3D graphical viewer, the engine relies on the **Raylib** framework. Raylib builds instantly as part of your `CMake` process (`FetchContent`), but your Linux machine must have basic windowing and desktop graphics packages installed natively to compile it:

**Mandatory Linux Libraries for 3D Viewer:**
```bash
sudo apt install libasound2-dev libx11-dev libxrandr-dev libxi-dev libgl1-mesa-dev libglu1-mesa-dev libxcursor-dev libxinerama-dev libwayland-dev libxkbcommon-dev
```

## How to Build

Configure and compile the application:
```bash
mkdir build && cd build
cmake ..
make -j$(nproc)
```

## How to Run

**1. Headless CLI Mode (Calculates output cuts matrix string):**
```bash
./catenary
```

**2. Visualizer Mode (Opens Interactive 3D Orbit Camera Window):**
```bash
./catenary --viewer
```

### Automated Tests
Run the monolithic backwards-compatibility check:
```bash
./test_brazilian
```
