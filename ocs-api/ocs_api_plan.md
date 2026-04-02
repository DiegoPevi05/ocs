# OCS API — Architecture Plan

A backend API for a railway electrification design platform. Users model tracks, place poles, and compute catenary geometry in real time via the C++ `ocs-calculator` engine.

---

## Tech Stack Decision: Java (Spring Boot) vs Node.js

| Factor | Java Spring Boot | Node.js (Fastify/Express) |
|---|---|---|
| Auth ecosystem | Spring Security (mature, battle-tested) | Passport.js / jose (manual wiring) |
| Role/permission system | Method-level `@PreAuthorize` built-in | Hand-rolled middleware |
| DB integration | JPA/Hibernate → clean ORM | Prisma/TypeORM (good but less mature) |
| Performance | High throughput, thread-per-request | Great for I/O, single-threaded |
| You already built some | Likely Java given BeautyPos history | — |
| Dashboard (React) | REST or WebSocket (same as Node) | — |

**Recommendation: Java Spring Boot** — you have prior experience (BeautyPos is Java), Spring Security handles the role/permission system cleanly out of the box, and JPA models the hierarchy well.

---

## Repository Structure

```
ocs-api/
 ├── src/main/java/com/ocs/api/
 │   ├── auth/           ← JWT, roles, permissions
 │   ├── users/          ← User management
 │   ├── projects/       ← Project CRUD
 │   ├── locations/      ← Location CRUD
 │   ├── tracks/         ← Track + geometry path
 │   ├── poles/          ← Pole placement
 │   ├── cantilevers/    ← Cantilever config
 │   ├── vanes/          ← Vane config
 │   ├── calculator/     ← HTTP client → ocs-calculator (C++ :8081)
 │   └── shared/         ← DTOs, exceptions, base entities
 ├── src/main/resources/
 │   ├── application.yml
 │   └── db/migrations/  ← Liquibase changesets
 └── pom.xml
```

---

## Authentication & Roles

### JWT-based auth
- `POST /api/auth/login` → returns `access_token` + `refresh_token`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Roles (hierarchy)
```
ADMIN
 └── SUPERVISOR  (scoped to one or more Projects)
      └── USER   (scoped to one or more Projects)
```

| Role | Capabilities |
|---|---|
| `ADMIN` | Manage all users, all projects, system config |
| `SUPERVISOR` | Create/edit projects they own, manage USERs within those projects |
| `USER` | Read/write within projects they are assigned to |

### Permission enforcement
- Spring `@PreAuthorize("hasRole('ADMIN')")` on endpoints
- Project-scoped checks via a `ProjectSecurityService` that verifies the caller's membership before any resource access

---

## Data Hierarchy & Database Schema

```
User ──< ProjectMembership >── Project
                                   │
                               Location
                                   │
                    ┌──────────────┼──────────────┐
                  Track          Pole         (future)
                                   │
                    ┌──────────────┤
               Cantilever        Vane
```

### Key entities

**Project**
```
id, name, description, created_by, created_at, updated_at
```

**ProjectMembership**
```
id, project_id, user_id, role (SUPERVISOR|USER)
```

**Location**
```
id, project_id, name, geo_coordinates (PostGIS Point or JSON), created_at
```

**Track**
```
id, location_id, name, path_coordinates (GeoJSON LineString), gauge_mm, created_at
```

**Pole**
```
id, track_id, position_along_track_mm, geo_position (x,y,z), pole_type, created_at
```

**Cantilever**
```
id, pole_id, configuration, contact_wire_height, system_height, 
zigzag, support_offset, calc_result_json, updated_at
```

**Vane**
```
id, pole_a_id, pole_b_id, configuration, cw_weight, cw_tension, 
sw_weight, sw_tension, initial_separation, qty_droppers, dropper_weight,
step_size, calc_result_json, updated_at
```

> `calc_result_json` caches the last response from the C++ calculator.

---

## API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Users (ADMIN only)
```
GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Projects
```
GET    /api/projects              ← filtered by caller's memberships
POST   /api/projects              ← ADMIN or SUPERVISOR
GET    /api/projects/{id}
PUT    /api/projects/{id}
DELETE /api/projects/{id}         ← ADMIN only
POST   /api/projects/{id}/members ← assign user to project
```

### Locations
```
GET    /api/projects/{projectId}/locations
POST   /api/projects/{projectId}/locations
GET    /api/locations/{id}
PUT    /api/locations/{id}
DELETE /api/locations/{id}
```

### Tracks
```
GET    /api/locations/{locationId}/tracks
POST   /api/locations/{locationId}/tracks
GET    /api/tracks/{id}
PUT    /api/tracks/{id}
DELETE /api/tracks/{id}
```

### Poles
```
GET    /api/tracks/{trackId}/poles
POST   /api/tracks/{trackId}/poles
GET    /api/poles/{id}
PUT    /api/poles/{id}
DELETE /api/poles/{id}
```

### Cantilevers
```
GET    /api/poles/{poleId}/cantilevers
POST   /api/poles/{poleId}/cantilevers
GET    /api/cantilevers/{id}
PUT    /api/cantilevers/{id}
DELETE /api/cantilevers/{id}
POST   /api/cantilevers/{id}/calculate   ← triggers C++ /cantilever
```

### Vanes
```
GET    /api/poles/{poleId}/vanes         ← vanes where this pole is A or B
POST   /api/vanes                        ← body: { pole_a_id, pole_b_id, ...params }
GET    /api/vanes/{id}
PUT    /api/vanes/{id}
DELETE /api/vanes/{id}
POST   /api/vanes/{id}/calculate         ← triggers C++ /vane
POST   /api/vanes/{id}/combine           ← triggers C++ /combine (cantilever + vane)
```

---

## Calculator Integration

A `CalculatorClient` service wraps the C++ HTTP API:

```java
@Service
public class CalculatorClient {
    // POST http://ocs-calculator:8081/cantilever
    public JsonNode calculateCantilever(CantileverRequestDTO dto) { ... }
    
    // POST http://ocs-calculator:8081/vane
    public JsonNode calculateVane(VaneRequestDTO dto) { ... }
    
    // POST http://ocs-calculator:8081/combine
    public JsonNode combine(CombineRequestDTO dto) { ... }
}
```

- Configure `OCS_CALCULATOR_URL` via `application.yml` / env var
- Store result in `calc_result_json` on the entity after each call
- Optionally broadcast result via WebSocket for real-time dashboard updates

---

## Real-time Updates (optional, recommended)

Use **Spring WebSocket + STOMP** so the React dashboard updates live:
- Client subscribes to `/topic/projects/{projectId}/calculations`
- On `POST /calculate`, after C++ responds, server broadcasts the result
- Dashboard renders updated cantilever/vane geometry without polling

---

## Tech Checklist for the New Agent

- [ ] Spring Boot 3.x + Maven
- [ ] Spring Security 6 with JWT (use `jjwt` or `nimbus-jose-jwt`)
- [ ] Spring Data JPA + PostgreSQL
- [ ] Liquibase for migrations
- [ ] Spring WebSocket (STOMP) for real-time
- [ ] `RestTemplate` or `WebClient` for C++ calculator calls
- [ ] Docker Compose: `ocs-api` + `ocs-calculator` + `postgres`
- [ ] Role-scoped tests with `@WithMockUser`
