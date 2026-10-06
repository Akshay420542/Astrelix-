package com.orbital.planner.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMissions() {
        List<Map<String, Object>> missions = new ArrayList<>();
        
        Map<String, Object> mission1 = new HashMap<>();
        mission1.put("id", "mission-leo-geo");
        mission1.put("name", "LEO to GEO Transfer");
        mission1.put("objective", "ORBIT_TRANSFER");
        mission1.put("centralBody", "Earth");
        mission1.put("status", "ACTIVE");
        mission1.put("fidelity", "ADVANCED_J2_DRAG");
        mission1.put("spacecraft", "Orbital Pioneer-1");
        mission1.put("deltaVRequired", 3935.2);
        missions.add(mission1);

        Map<String, Object> mission2 = new HashMap<>();
        mission2.put("id", "mission-iss-tracking");
        mission2.put("name", "ISS Orbital Station-Keeping");
        mission2.put("objective", "STATION_KEEPING");
        mission2.put("centralBody", "Earth");
        mission2.put("status", "ACTIVE");
        mission2.put("fidelity", "ADVANCED_J2_DRAG");
        mission2.put("spacecraft", "ISS Zarya");
        mission2.put("deltaVRequired", 24.5);
        missions.add(mission2);

        return ResponseEntity.ok(missions);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createMission(@RequestBody Map<String, Object> payload) {
        payload.put("id", "mission-" + UUID.randomUUID().toString().substring(0, 8));
        payload.put("status", "PLANNED");
        payload.put("createdAt", new Date());
        return ResponseEntity.ok(payload);
    }
}
