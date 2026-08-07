# OCS (Overhead Contact System) AI Guidance & Engineering Rules

This document outlines the engineering rules, spacing requirements, and design constraints for the Overhead Contact System (OCS) project. Use these guidelines to inform automated design decisions, clash detection, and layout generation.

## 1. Track & Alignment Rules
*   **Track Centerline:** All OCS structures must be referenced from the adjacent track centerline.
*   **Superelevation (Cant):** Structure locations must account for track superelevation. Minimum clearances must be maintained assuming maximum vehicle sway at maximum superelevation.
*   **Curve Radii:** Maximum span lengths must be reduced on curves to maintain contact wire stagger within allowable limits.

## 2. Spacing Requirements (Span Lengths)
*   **Maximum Span Length (Tangent):** 200 feet (61 meters).
*   **Typical Span Length:** 150-180 feet (45-55 meters) depending on wind loading and system tension.
*   **Span Reduction on Curves:** Span length is determined based on allowable stagger and curve radius.

## 3. Clearances and Contact Wire Parameters
*   **Nominal Contact Wire Height:** 21 feet 6 inches (6.55 meters) above Top of Rail (TOR).
*   **Minimum Contact Wire Height:** 18 feet 6 inches (5.64 meters) (e.g., under bridges or overpasses).
*   **Maximum Contact Wire Height:** 23 feet 0 inches (7.01 meters).
*   **Maximum System Gradient:** 1% (change in height per span relative to span length).
*   **Maximum Stagger:** +/- 12 inches (300 mm) from pantograph center on tangent track. +/- 15 inches (380 mm) on curves.
*   **Minimum Electrical Clearance (Static):** 10 inches (254 mm) to grounded structures.
*   **Minimum Electrical Clearance (Dynamic):** 8 inches (200 mm).

## 4. Component Design Constraints

### 4.1 Poles (Masts)
*   **Minimum Along-Track Distance:** Poles should be spaced evenly where possible, avoiding track features like turnouts or level crossings.
*   **Minimum Across-Track Distance (System Offset):** Minimum face of pole to track centerline is 8 feet 6 inches (2.60 meters), typically 10 feet (3.05 meters) to allow for walkways.
*   **Deflection Limits:** Maximum pole tip deflection under maximum wind and ice load must not exceed 2% of pole height above foundation.

### 4.2 Foundations
*   **Type:** Drilled shaft (caisson) or spread footing, depending on geotechnical data.
*   **Top of Foundation (TOF):** Typically 2-6 inches (50-150 mm) above adjacent grade, or level with Top of Rail (TOR) in ballast sections.
*   **Clearance:** Must not foul underground utilities or track drainage systems.

### 4.3 Cantilevers
*   **Type:** Tubular steel or aluminum depending on system design.
*   **Registration Assembly:** Must provide vertical uplift allowance for pantograph passage (typically 2-4 inches).

### 4.4 Vanes / Registration Arms
*   **Clearances:** Ensure registration arms, vanes, and steady arms do not clash with the passing pantograph envelope under all operating conditions (uplift, sway, wind).

## 5. Environmental & Loading Assumptions
*   **Wind Load:** Base wind speed of 90 mph (145 km/h).
*   **Ice Load:** 0.5 inches (12.7 mm) radial ice thickness.
*   **Temperature Range:** -20°F to 120°F (-29°C to 49°C) ambient.

## 6. Document Control
*   **Status:** Draft / Placeholder (Update with project-specific requirements once finalized).
