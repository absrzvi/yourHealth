/**
 * OpenAI function calling schemas for AI-powered visualizations
 * This file defines the JSON schemas that OpenAI uses to determine when to generate
 * structured visualization data in response to user requests.
 */

import { ChatCompletionCreateParams } from 'openai/resources/chat';

/**
 * Types of charts supported by our visualization system
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  RADAR = 'radar',
  SCATTER = 'scatter',
}

/**
 * Data source options for retrieving health data
 */
export enum DataSource {
  HEALTH_METRICS = 'health_metrics',
  BLOOD_TEST = 'blood_test',
  WEIGHT_LOG = 'weight_log',
  SLEEP_DATA = 'sleep_data',
  EXERCISE_LOG = 'exercise_log',
  NUTRITION_LOG = 'nutrition_log',
  MICROBIOME = 'microbiome',
}

/**
 * Time range options for data visualization
 */
export enum TimeRange {
  LAST_WEEK = 'last_week',
  LAST_MONTH = 'last_month',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * Function schema for generating a single chart visualization
 */
export const generateChartFunction: ChatCompletionCreateParams.Function = {
  name: 'generate_chart',
  description: 'Generate a chart visualization based on user health data',
  parameters: {
    type: 'object',
    required: ['chartType', 'title', 'dataSource', 'metrics', 'timeRange'],
    properties: {
      chartType: {
        type: 'string',
        enum: Object.values(ChartType),
        description: 'The type of chart to generate',
      },
      title: {
        type: 'string',
        description: 'A descriptive title for the chart',
      },
      subtitle: {
        type: 'string',
        description: 'Optional subtitle providing additional context',
      },
      dataSource: {
        type: 'string',
        enum: Object.values(DataSource),
        description: 'The data source to use for chart data',
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of metrics to include in the chart (e.g., "LDL Cholesterol", "HDL Cholesterol")',
      },
      timeRange: {
        type: 'string',
        enum: Object.values(TimeRange),
        description: 'Time range for the data',
      },
      customStartDate: {
        type: 'string',
        format: 'date',
        description: 'Start date for custom time range (ISO format: YYYY-MM-DD). Only required if timeRange is "custom"',
      },
      customEndDate: {
        type: 'string',
        format: 'date',
        description: 'End date for custom time range (ISO format: YYYY-MM-DD). Only required if timeRange is "custom"',
      },
      xAxisLabel: {
        type: 'string',
        description: 'Label for the x-axis',
      },
      yAxisLabel: {
        type: 'string',
        description: 'Label for the y-axis',
      },
      includeReferenceRanges: {
        type: 'boolean',
        description: 'Whether to include normal reference ranges for the metrics (when available)',
        default: true,
      },
      colorScheme: {
        type: 'string',
        enum: ['default', 'blue', 'green', 'red', 'purple', 'orange', 'monochrome'],
        description: 'Color scheme for the chart',
        default: 'default',
      },
    },
  },
};

/**
 * Function schema for generating a health dashboard with multiple visualizations
 */
export const generateDashboardFunction: ChatCompletionCreateParams.Function = {
  name: 'generate_dashboard',
  description: 'Generate a dashboard with multiple health visualizations',
  parameters: {
    type: 'object',
    required: ['title', 'panels'],
    properties: {
      title: {
        type: 'string',
        description: 'A descriptive title for the dashboard',
      },
      subtitle: {
        type: 'string',
        description: 'Optional subtitle providing additional context',
      },
      panels: {
        type: 'array',
        items: {
          type: 'object',
          required: ['chartType', 'title', 'dataSource', 'metrics', 'timeRange'],
          properties: {
            chartType: {
              type: 'string',
              enum: Object.values(ChartType),
              description: 'The type of chart to generate for this panel',
            },
            title: {
              type: 'string',
              description: 'A descriptive title for this panel',
            },
            subtitle: {
              type: 'string',
              description: 'Optional subtitle for this panel',
            },
            dataSource: {
              type: 'string',
              enum: Object.values(DataSource),
              description: 'The data source to use for this panel',
            },
            metrics: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of metrics to include in this panel',
            },
            timeRange: {
              type: 'string',
              enum: Object.values(TimeRange),
              description: 'Time range for the data in this panel',
            },
            customStartDate: {
              type: 'string',
              format: 'date',
              description: 'Start date for custom time range (ISO format: YYYY-MM-DD)',
            },
            customEndDate: {
              type: 'string',
              format: 'date',
              description: 'End date for custom time range (ISO format: YYYY-MM-DD)',
            },
            width: {
              type: 'integer',
              enum: [1, 2, 3, 4],
              description: 'Width of panel in the grid (1-4), where 4 is full width',
              default: 2,
            },
            height: {
              type: 'integer',
              enum: [1, 2, 3],
              description: 'Height of panel in the grid (1-3)',
              default: 1,
            },
            includeReferenceRanges: {
              type: 'boolean',
              description: 'Whether to include normal reference ranges for the metrics',
              default: true,
            },
          },
        },
        description: 'Array of visualization panels to include in the dashboard',
      },
      layout: {
        type: 'string',
        enum: ['grid', 'stack', 'auto'],
        description: 'Layout style for the dashboard',
        default: 'grid',
      },
      refreshInterval: {
        type: 'integer',
        description: 'Auto-refresh interval in seconds (0 means no auto-refresh)',
        default: 0,
      },
      colorScheme: {
        type: 'string',
        enum: ['default', 'blue', 'green', 'red', 'purple', 'orange', 'monochrome'],
        description: 'Overall color scheme for the dashboard',
        default: 'default',
      },
    },
  },
};

/**
 * Function schema for providing health insights based on data
 */
export const generateHealthInsightsFunction: ChatCompletionCreateParams.Function = {
  name: 'generate_health_insights',
  description: 'Generate health insights and recommendations based on user data',
  parameters: {
    type: 'object',
    required: ['dataSource', 'metrics', 'timeRange'],
    properties: {
      dataSource: {
        type: 'string',
        enum: Object.values(DataSource),
        description: 'The data source to analyze',
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of metrics to analyze for insights',
      },
      timeRange: {
        type: 'string',
        enum: Object.values(TimeRange),
        description: 'Time range for the data analysis',
      },
      customStartDate: {
        type: 'string',
        format: 'date',
        description: 'Start date for custom time range (ISO format: YYYY-MM-DD)',
      },
      customEndDate: {
        type: 'string',
        format: 'date',
        description: 'End date for custom time range (ISO format: YYYY-MM-DD)',
      },
      insightTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['trends', 'anomalies', 'correlations', 'recommendations', 'risks'],
        },
        description: 'Types of insights to generate',
        default: ['trends', 'recommendations'],
      },
      includeVisualization: {
        type: 'boolean',
        description: 'Whether to include a supporting visualization with the insights',
        default: true,
      },
    },
  },
};

/**
 * All available functions for OpenAI function calling
 */
export const availableFunctions = [
  generateChartFunction,
  generateDashboardFunction,
  generateHealthInsightsFunction,
];

/**
 * Map of function names to their implementations
 */
export const functionImplementations: Record<string, (args: any, userId: string) => Promise<any>> = {
  generate_chart: async (args: any, userId: string) => {
    // Simply return the args as the actual implementation is in visualizationService
    // This is just a passthrough for OpenAI function calling
    return args;
  },
  generate_dashboard: async (args: any, userId: string) => {
    // Simply return the args as the actual implementation is in visualizationService
    // This is just a passthrough for OpenAI function calling
    return args;
  },
  generate_health_insights: async (args: any, userId: string) => {
    // Simply return the args as the actual implementation is in visualizationService
    // This is just a passthrough for OpenAI function calling
    return args;
  },
};

// The availableFunctions array is already defined above
