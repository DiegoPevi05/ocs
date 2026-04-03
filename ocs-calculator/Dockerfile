# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM ubuntu:22.04 AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    g++ \
    make \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy CMakeLists first so dependency fetching is cached unless it changes
COPY CMakeLists.txt .
COPY include ./include
COPY src ./src
COPY tests ./tests

# BUILD_CLI=OFF skips raylib download entirely
RUN cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_CLI=OFF -B build . \
    && cmake --build build --target catenary_server -j$(nproc)

# ─── Stage 2: minimal runtime ─────────────────────────────────────────────────
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/build/catenary_server .

EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -sf http://localhost:8081/health || exit 1

CMD ["./catenary_server"]
