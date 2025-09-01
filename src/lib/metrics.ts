/**
 * Simple metrics system for tracking V2 summary operations
 * Uses console logging for now - can be enhanced with proper metrics service later
 */

class Metrics {
  private counters: Map<string, number> = new Map();

  increment(metric: string, value: number = 1): void {
    const current = this.counters.get(metric) || 0;
    this.counters.set(metric, current + value);
    
    // Log to console for now
    console.log(`METRIC: ${metric} = ${current + value}`);
  }

  get(metric: string): number {
    return this.counters.get(metric) || 0;
  }

  getAll(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.counters.entries()) {
      result[key] = value;
    }
    return result;
  }

  reset(): void {
    this.counters.clear();
  }
}

export const metrics = new Metrics();

// V2 Summary specific metrics
export const V2_METRICS = {
  SUMMARY_V2_ATTEMPT_TOTAL: 'summary_v2_attempt_total',
  SUMMARY_V2_SUCCESS_TOTAL: 'summary_v2_success_total',
  SUMMARY_V2_SCHEMA_MISMATCH_TOTAL: 'summary_v2_schema_mismatch_total',
  SUMMARY_V2_LINTER_BLOCK_TOTAL: 'summary_v2_linter_block_total',
  SUMMARY_V2_API_ERROR_TOTAL: 'summary_v2_api_error_total',
} as const;
