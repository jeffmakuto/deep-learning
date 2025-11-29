/**
 * Home Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Multi-Service Integration',
      description: 'Seamlessly connect with Stripe, SendGrid, Google Sheets, and AWS services.',
      icon: <IntegrationInstructionsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      title: 'Real-Time Synchronization',
      description: 'Keep data consistent across all systems with event-driven architecture.',
      icon: <ShoppingCartIcon sx={{ fontSize: 40, color: 'success.main' }} />
    },
    {
      title: 'Comprehensive Monitoring',
      description: 'Track integration status, metrics, and errors in real-time.',
      icon: <DashboardIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
    }
  ];

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Cloud-Based Integration System
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          A comprehensive solution for integrating e-commerce platforms with
          third-party services using cloud-based APIs
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/checkout')}
            sx={{ mr: 2 }}
          >
            Create Order
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/monitoring')}
          >
            View Dashboard
          </Button>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Key Features
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Integrated Services
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">✓ Stripe Payments</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">✓ SendGrid Email</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">✓ Google Sheets</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">✓ AWS Services</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
