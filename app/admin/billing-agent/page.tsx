'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Stack, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField, 
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
// Import only what we need
import { useRouter } from 'next/navigation';

// Define task types as string literals to match the backend
const TASK_TYPES = [
  'CREATE_CLAIM',
  'CHECK_ELIGIBILITY',
  'GENERATE_EDI',
  'SUBMIT_CLAIM',
  'CHECK_STATUS',
  'FILE_APPEAL'
];

// Define task statuses as string literals to match the backend
const TASK_STATUSES = [
  'PENDING',
  'SCHEDULED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'RETRYING'
];

// Type definitions for the UI
interface TaskWithMetadata {
  id: string;
  taskType: string;
  status: string;
  entityId: string;
  entityType: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledFor: string;
  createdAt: string;
  updatedAt: string;
  error?: string | null;
  result?: Record<string, unknown> | null;
}

interface AgentStatus {
  isRunning: boolean;
  queueSize: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  averageProcessingTime: number;
}

// Helper function to get color based on task status
const getStatusColor = (status: string): 'info' | 'warning' | 'success' | 'error' | 'secondary' | 'default' => {
  switch (status) {
    case 'PENDING':
      return 'info';
    case 'PROCESSING':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'RETRYING':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function BillingAgentAdmin() {
  // State for task creation form
  const [taskType, setTaskType] = useState<string>('CREATE_CLAIM');
  const [entityId, setEntityId] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('REPORT');
  const [priority, setPriority] = useState<number>(1);
  
  // State for task list
  const [tasks, setTasks] = useState<TaskWithMetadata[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // State for agent status
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  const router = useRouter();

  // Fetch tasks and agent status
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks with optional status filter
      const tasksResponse = await fetch(`/api/admin/billing-agent/tasks${statusFilter ? `?status=${statusFilter}` : ''}`);
      if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      
      // Fetch agent status
      const statusResponse = await fetch('/api/admin/billing-agent/status');
      if (!statusResponse.ok) throw new Error('Failed to fetch agent status');
      const statusData = await statusResponse.json();
      setAgentStatus(statusData);
      
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new task
  const createTask = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/billing-agent/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskType,
          entityId,
          entityType,
          priority: Number(priority)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }
      
      const data = await response.json();
      setSuccess(`Task created successfully with ID: ${data.id}`);
      
      // Reset form
      setEntityId('');
      
      // Refresh data
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start/stop the agent
  const toggleAgentStatus = async () => {
    try {
      setLoading(true);
      
      const action = agentStatus?.isRunning ? 'stop' : 'start';
      const response = await fetch(`/api/admin/billing-agent/${action}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} agent`);
      }
      
      setSuccess(`Agent ${action}ed successfully`);
      
      // Refresh data
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle agent status');
      console.error('Error toggling agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process queue manually
  const processQueue = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/billing-agent/process', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process queue');
      }
      
      setSuccess('Queue processed successfully');
      
      // Refresh data
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process queue');
      console.error('Error processing queue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retry a failed task
  const retryTask = async (taskId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/billing-agent/tasks/${taskId}/retry`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to retry task');
      }
      
      setSuccess('Task scheduled for retry');
      
      // Refresh data
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retry task');
      console.error('Error retrying task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/billing-agent/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }
      
      setSuccess('Task deleted successfully');
      
      // Refresh data
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchData();
    
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchData, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [statusFilter, autoRefresh, refreshInterval]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Billing Agent Admin
      </Typography>
      
      {/* Agent Status Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Agent Status
              </Typography>
              {agentStatus && typeof agentStatus === 'object' ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={agentStatus.isRunning ? 'Running' : 'Stopped'} 
                      color={agentStatus.isRunning ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Queue Size</Typography>
                    <Typography variant="body1">{agentStatus.queueSize}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Pending</Typography>
                    <Typography variant="body1">{agentStatus.pendingTasks}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Processing</Typography>
                    <Typography variant="body1">{agentStatus.processingTasks}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Completed</Typography>
                    <Typography variant="body1">{agentStatus.completedTasks}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Failed</Typography>
                    <Typography variant="body1">{agentStatus.failedTasks}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                    <Typography variant="body1">{agentStatus.successRate !== null ? agentStatus.successRate.toFixed(2) : '0.00'}%</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Avg. Processing Time</Typography>
                    <Typography variant="body1">{agentStatus.averageProcessingTime !== null ? agentStatus.averageProcessingTime.toFixed(2) : '0.00'}ms</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">Loading status...</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={4}>
              <Stack direction="column" spacing={2}>
                <Button 
                  variant="contained" 
                  color={agentStatus?.isRunning ? 'error' : 'success'}
                  onClick={toggleAgentStatus}
                  disabled={loading}
                >
                  {agentStatus?.isRunning ? 'Stop Agent' : 'Start Agent'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={processQueue}
                  disabled={loading || !agentStatus?.isRunning}
                >
                  Process Queue Now
                </Button>
                <FormControl size="small">
                  <InputLabel>Auto-refresh</InputLabel>
                  <Select
                    value={autoRefresh ? refreshInterval.toString() : 'off'}
                    label="Auto-refresh"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'off') {
                        setAutoRefresh(false);
                      } else {
                        setAutoRefresh(true);
                        setRefreshInterval(Number(value));
                      }
                    }}
                  >
                    <MenuItem value="off">Off</MenuItem>
                    <MenuItem value="2000">2 seconds</MenuItem>
                    <MenuItem value="5000">5 seconds</MenuItem>
                    <MenuItem value="10000">10 seconds</MenuItem>
                    <MenuItem value="30000">30 seconds</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Create Task Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Task
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Task Type</InputLabel>
                <Select
                  value={taskType}
                  label="Task Type"
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  {TASK_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Entity ID"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                helperText="Report ID, Claim ID, etc."
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                inputProps={{ min: 1, max: 10 }}
                helperText="1-10, higher is more important"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={entityType}
                  label="Entity Type"
                  onChange={(e) => setEntityType(e.target.value)}
                >
                  <MenuItem value="REPORT">Report</MenuItem>
                  <MenuItem value="CLAIM">Claim</MenuItem>
                  <MenuItem value="PATIENT">Patient</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={createTask}
                disabled={loading || !entityId}
                sx={{ height: '56px' }}
              >
                Create Task
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Task List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Tasks
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {TASK_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Scheduled For</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.id.substring(0, 8)}...</TableCell>
                      <TableCell>{task.taskType}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{task.entityType}</Typography>
                        <Typography variant="caption" color="text.secondary">{task.entityId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.status} 
                          color={getStatusColor(task.status)}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{task.priority}</TableCell>
                      <TableCell>{task.attempts}/{task.maxAttempts}</TableCell>
                      <TableCell>
                        {new Date(task.scheduledFor).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {new Date(task.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button 
                            size="small" 
                            onClick={() => router.push(`/admin/billing-agent/tasks/${task.id}`)}
                          >
                            View
                          </Button>
                          {task.status === 'FAILED' && (
                            <Button 
                              size="small" 
                              color="warning" 
                              onClick={() => retryTask(task.id)}
                            >
                              Retry
                            </Button>
                          )}
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => deleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      {loading ? 'Loading tasks...' : 'No tasks found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* Loading indicator */}
      {loading && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '50%',
            p: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
}
