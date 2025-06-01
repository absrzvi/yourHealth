export interface PerformanceMetrics {
  phase: string;
  duration: number; // in milliseconds
  memoryUsed: number; // in bytes
  inputSize?: number; // e.g., characters or items
  outputSize?: number; // e.g., characters or items
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private enabled: boolean;

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
    if (this.enabled) {
      console.log('[PerformanceMonitor] Monitoring enabled.');
    }
  }

  startPhase(phaseName: string, inputSize?: number): (outputSize?: number) => void {
    if (!this.enabled) return () => {};

    const startTime = Date.now();
    // process.memoryUsage() is Node.js specific. For broader compatibility or browser, consider alternatives.
    // For now, assuming Node.js environment as per typical backend/CLI tool usage.
    const startMemory = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;

    return (outputSize?: number) => {
      const duration = Date.now() - startTime;
      const endMemory = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryUsed = endMemory - startMemory;

      const metric: PerformanceMetrics = {
        phase: phaseName,
        duration,
        memoryUsed,
        timestamp: new Date()
      };
      if (inputSize !== undefined) metric.inputSize = inputSize;
      if (outputSize !== undefined) metric.outputSize = outputSize;
      
      this.metrics.push(metric);

      // Optional detailed logging for significant phases
      if (duration > 1000 || Math.abs(memoryUsed) > 1024 * 1024) { // Log if >1s or >1MB change
        console.warn(
          `[PerformanceMonitor] Phase '${phaseName}': Duration=${duration}ms, MemoryChange=${(memoryUsed / (1024 * 1024)).toFixed(2)}MB, InputSize=${inputSize ?? 'N/A'}, OutputSize=${outputSize ?? 'N/A'}`
        );
      }
    };
  }

  getReport(): PerformanceMetrics[] {
    return [...this.metrics]; // Return a copy
  }

  logReport(): void {
    if (!this.enabled || this.metrics.length === 0) return;

    console.log('\n--- Performance Report ---');
    this.metrics.forEach(metric => {
      console.log(
        `Phase: ${metric.phase}, Duration: ${metric.duration}ms, Memory: ${(metric.memoryUsed / (1024 * 1024)).toFixed(2)}MB, Input: ${metric.inputSize ?? 'N/A'}, Output: ${metric.outputSize ?? 'N/A'}, Timestamp: ${metric.timestamp.toISOString()}`
      );
    });
    console.log('------------------------\n');
  }

  reset(): void {
    this.metrics = [];
  }
}
