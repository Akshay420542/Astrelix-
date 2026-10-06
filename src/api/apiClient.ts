/**
 * Service API Client & Hybrid Execution Gateway
 * Connects to Java Spring Boot & Python FastAPI when available,
 * or routes calculations to the local high-fidelity physics engine with explicit status.
 */
import { Mission, SpacecraftConfig, TrajectoryPoint, TransferResult } from '../types/mission';
import { calculateHohmannTransfer } from '../physics/transfers';
import { propagateNumericalRK4 } from '../physics/propagator';

export interface SystemStatus {
  javaBackend: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  pythonEngine: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  database: 'ONLINE' | 'OFFLINE' | 'LOCAL_PERSISTED';
  orbitalData: 'ONLINE' | 'CACHED';
  webGlEngine: 'ONLINE' | 'FALLBACK';
  latencyMs: number;
}

class ApiGateway {
  private javaBase = '/api';
  private pythonBase = 'http://localhost:8000';

  public async getSystemStatus(): Promise<SystemStatus> {
    try {
      const start = performance.now();
      const res = await fetch(`${this.javaBase}/satellites/status`, {
        signal: AbortSignal.timeout(600)
      });
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        return {
          javaBackend: 'ONLINE',
          pythonEngine: 'ONLINE',
          database: 'ONLINE',
          orbitalData: 'ONLINE',
          webGlEngine: 'ONLINE',
          latencyMs: latency
        };
      }
    } catch {
      // Local client mode
    }

    return {
      javaBackend: 'STANDBY',
      pythonEngine: 'STANDBY',
      database: 'LOCAL_PERSISTED',
      orbitalData: 'ONLINE',
      webGlEngine: 'ONLINE',
      latencyMs: 1
    };
  }

  public async runSimulation(
    mission: Mission,
    durationSec = 21600,
    timestepSec = 20
  ): Promise<{ trajectory: TrajectoryPoint[]; computationTimeMs: number; source: string }> {
    const t0 = performance.now();

    // 1. Try Java -> Python API
    try {
      const res = await fetch(`${this.javaBase}/simulations/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_orbit: mission.initialOrbit,
          spacecraft: mission.spacecraft,
          duration_sec: durationSec,
          timestep_sec: timestepSec,
          fidelity: mission.fidelity
        }),
        signal: AbortSignal.timeout(1200)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.trajectory && data.trajectory.length > 0) {
          return {
            trajectory: data.trajectory,
            computationTimeMs: Math.round(performance.now() - t0),
            source: 'PYTHON_NUMERICAL_SERVICE'
          };
        }
      }
    } catch {
      // Graceful fallback to client numerical RK4 engine
    }

    // 2. Client-side Runge-Kutta 4th order propagator
    const trajectory = propagateNumericalRK4(
      mission.initialOrbit,
      mission.spacecraft,
      mission.maneuvers,
      durationSec,
      timestepSec,
      mission.fidelity,
      mission.enableAtmosphericDrag !== false
    );

    return {
      trajectory,
      computationTimeMs: Math.round(performance.now() - t0),
      source: 'EMBEDDED_RK4_PHYSICS_ENGINE'
    };
  }

  public calculateTransfer(
    r1Km: number,
    r2Km: number,
    spacecraft: SpacecraftConfig
  ): TransferResult {
    return calculateHohmannTransfer(r1Km, r2Km, spacecraft);
  }
}

export const apiClient = new ApiGateway();
