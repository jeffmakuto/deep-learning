/**
 * Monitoring Page - Dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { monitoringAPI } from '../services/api';

export default function MonitoringPage() {
  const [health, setHealth] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [healthData, integrationsData] = await Promise.all([
        monitoringAPI.getHealth(),
        monitoringAPI.getIntegrations()
      ]);
      setHealth(healthData.data);
      setIntegrations(integrationsData.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !health) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Monitoring Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {health && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    System Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {health.status === 'healthy' ? (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <ErrorIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h5">
                      {health.status.toUpperCase()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {Object.entries(health.services).map(([service, data]) => (
              <Grid item xs={12} md={6} lg={3} key={service}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {service.toUpperCase()}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={data.status}
                        color={data.status === 'up' || data.status === 'configured' ? 'success' : 'error'}
                        size="small"
                      />
                      {data.latency !== undefined && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Latency: {data.latency}ms
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {integrations && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Integration Status
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {Object.entries(integrations.integrations).map(([key, integration]) => (
                  <Grid item xs={12} sm={6} md={3} key={key}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {integration.name}
                      </Typography>
                      <Chip
                        label={integration.status}
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      {integration.uptime && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Uptime: {integration.uptime}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
