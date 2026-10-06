package com.orbital.planner.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/satellites")
@CrossOrigin(origins = "*")
public class SatelliteController {

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDataSourceStatus() {
        Map<String, Object> sources = new HashMap<>();
        
        Map<String, Object> celestrak = new HashMap<>();
        celestrak.put("name", "CelesTrak");
        celestrak.put("status", "ONLINE");
        celestrak.put("latencyMs", 48);
        celestrak.put("dataType", "TLE / GP");
        celestrak.put("lastUpdateUtc", new Date());
        sources.put("celestrak", celestrak);

        Map<String, Object> horizons = new HashMap<>();
        horizons.put("name", "NASA/JPL Horizons");
        horizons.put("status", "ONLINE");
        horizons.put("latencyMs", 112);
        horizons.put("dataType", "Vector Ephemeris");
        horizons.put("lastUpdateUtc", new Date());
        sources.put("horizons", horizons);

        Map<String, Object> spacetrack = new HashMap<>();
        spacetrack.put("name", "Space-Track.org");
        spacetrack.put("status", "CONFIGURED_API_READY");
        spacetrack.put("latencyMs", 65);
        spacetrack.put("dataType", "Satellite Catalog");
        spacetrack.put("lastUpdateUtc", new Date());
        sources.put("spacetrack", spacetrack);

        return ResponseEntity.ok(sources);
    }
}
