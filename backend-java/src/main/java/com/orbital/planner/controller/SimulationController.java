package com.orbital.planner.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/api/simulations")
@CrossOrigin(origins = "*")
public class SimulationController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String pythonEngineUrl = "http://localhost:8000";

    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runSimulation(@RequestBody Map<String, Object> simulationParams) {
        try {
            // Forward calculation payload to Python FastAPI scientific engine
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                pythonEngineUrl + "/propagate",
                simulationParams,
                Map.class
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Graceful fallback with metadata indicating engine bridge status
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("status", "SERVICE_DELEGATED");
            fallback.put("message", "Python microservice connection: " + e.getMessage());
            fallback.put("timestamp", new Date());
            return ResponseEntity.ok(fallback);
        }
    }
}
