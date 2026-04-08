cmake_minimum_required(VERSION 3.16)
project(catenary CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ─── Options ──────────────────────────────────────────────────────────────────
# Set OFF for server-only / Docker builds (skips raylib download & compile).
option(BUILD_CLI "Build the desktop CLI viewer (requires raylib + display)" ON)

include(FetchContent)

# ── raylib (only needed for the CLI viewer) ────────────────────────────────────
if(BUILD_CLI)
  FetchContent_Declare(
      raylib
      URL https://github.com/raysan5/raylib/archive/refs/tags/5.0.tar.gz
  )
  FetchContent_MakeAvailable(raylib)
endif()

# ── nlohmann/json ──────────────────────────────────────────────────────────────
FetchContent_Declare(
    json
    URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_MakeAvailable(json)

# ── cpp-httplib ────────────────────────────────────────────────────────────────
FetchContent_Declare(
    httplib
    URL https://github.com/yhirose/cpp-httplib/archive/refs/tags/v0.15.3.tar.gz
)
FetchContent_MakeAvailable(httplib)

# ─── Core library ─────────────────────────────────────────────────────────────
add_library(catenary_lib STATIC
    src/math/Vec3.cpp
    src/math/MathUtils.cpp
    src/components/Pole3D.cpp
    src/components/Pole.cpp
    src/components/CantileverFrame.cpp
    src/assemblies/StayTube.cpp
    src/assemblies/BracketTube.cpp
    src/assemblies/RegisterArm.cpp
    src/assemblies/SteadyArm.cpp
    src/assemblies/Reinforcement.cpp
    src/CantileverBuilder.cpp
    src/VaneBuilder.cpp
)
target_include_directories(catenary_lib PUBLIC include)

# ─── REST server (always built) ───────────────────────────────────────────────
add_executable(catenary_server src/server.cpp)
target_include_directories(catenary_server PUBLIC include)
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
target_link_libraries(catenary_server PRIVATE catenary_lib nlohmann_json::nlohmann_json httplib Threads::Threads)

# ─── CLI viewer (optional, requires raylib + display) ─────────────────────────
if(BUILD_CLI)
  add_executable(catenary_cli src/main.cpp src/viewer/Viewer3D.cpp)
  target_include_directories(catenary_cli PUBLIC include)
  target_link_libraries(catenary_cli PRIVATE catenary_lib raylib nlohmann_json::nlohmann_json)
endif()

# ─── Tests ────────────────────────────────────────────────────────────────────
add_executable(test_brazilian tests/test_brazilian.cpp)
target_link_libraries(test_brazilian PRIVATE catenary_lib)
