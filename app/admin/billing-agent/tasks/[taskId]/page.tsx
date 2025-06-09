'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Divider, 
  Grid, 
  Paper, 
  Stack, 
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Replay as ReplayIcon
} from '@mui/icons-material';
import { AgentTaskStatus } from '@/lib/billing-agent/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

// Helper function to get color based on task status
const getStatusColor = (status: string) => {
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

// Helper function to get icon based on task status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <AccessTimeIcon />;
    case 'PROCESSING':
      return <CircularProgress size={20} />;
    case 'COMPLETED':
      return <CheckCircleIcon color="success" />;
    case 'FAILED':
      return <ErrorIcon color="error" />;
    case 'RETRYING':
      return <RefreshIcon color="secondary" />;
    default:
      return <InfoIcon />;
  }
};

export default function TaskDetail({ params }: { params: { taskId: string } }) {
  const { taskId } = params;
  const [task, setTask] = useState<TaskWithMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  const router = useRouter();

  // Fetch task data
  const fetchTask = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/billing-agent/tasks/${taskId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch task');
      }
      
      const taskData = await response.json();
      setTask(taskData);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retry a failed task
  const retryTask = async () => {
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
      fetchTask();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry task';
      setError(errorMessage);
      console.error('Error retrying task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async () => {
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
      
      // Redirect back to tasks list
      setTimeout(() => {
        router.push('/admin/billing-agent');
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchTask();
    
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh && task?.status !== AgentTaskStatus.COMPLETED && task?.status !== AgentTaskStatus.FAILED) {
      intervalId = setInterval(fetchTask, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, autoRefresh, refreshInterval, task?.status]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render JSON data in a readable format
  const renderJsonData = (data: Record<string, unknown> | null | undefined) => {
    if (!data) return <Typography color="text.secondary">No data</Typography>;
    
    return (
      <Box 
        component="pre" 
        sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          borderRadius: 1, 
          overflow: 'auto',
          maxHeight: '300px',
          fontSize: '0.875rem'
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/admin/billing-agent" passHref>
          <Typography 
            component="a" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />
            Billing Agent Admin
          </Typography>
        </Link>
        <Typography color="text.primary">Task Details</Typography>
      </Breadcrumbs>
      
      {/* Task Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          {loading && !task ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : task ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" component="h1">
                    {task.taskType}
                  </Typography>
                  <Chip 
                    icon={getStatusIcon(task.status)}
                    label={task.status} 
                    color={getStatusColor(task.status) as any}
                  />
                </Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  ID: {task.id}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Entity Type" 
                      secondary={task.entityType} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Entity ID" 
                      secondary={task.entityId} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Priority" 
                      secondary={task.priority} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <RefreshIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Attempts" 
                      secondary={`${task.attempts} / ${task.maxAttempts}`} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Created At" 
                      secondary={formatDate(task.createdAt)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Updated At" 
                      secondary={formatDate(task.updatedAt)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Scheduled For" 
                      secondary={formatDate(task.scheduledFor)} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={fetchTask}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant={autoRefresh ? "contained" : "outlined"}
                      color="info"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      size="small"
                    >
                      {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
                    </Button>
                    {autoRefresh && (
                      <select 
                        value={refreshInterval} 
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        style={{ padding: '8px', borderRadius: '4px' }}
                      >
                        <option value={2000}>2 seconds</option>
                        <option value={5000}>5 seconds</option>
                        <option value={10000}>10 seconds</option>
                        <option value={30000}>30 seconds</option>
                      </select>
                    )}
                  </Stack>
                  {task.status === AgentTaskStatus.FAILED && (
                    <Button 
                      variant="contained" 
                      color="warning" 
                      startIcon={<ReplayIcon />}
                      onClick={retryTask}
                    >
                      Retry Task
                    </Button>
                  )}
                  <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={deleteTask}
                  >
                    Delete Task
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="error">Task not found</Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Task Details */}
      {task && (
        <>
          {/* Error Details */}
          {task.error && (
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  Error Details
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff8f8' }}>
                  <Typography color="error.main" sx={{ whiteSpace: 'pre-wrap' }}>
                    {task.error}
                  </Typography>
                </Paper>
              </AccordionDetails>
            </Accordion>
          )}
          
          {/* Result Data */}
          <Accordion defaultExpanded={!!task.result} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Result Data
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderJsonData(task.result as Record<string, unknown>)}
            </AccordionDetails>
          </Accordion>
        </>
      )}
      
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
