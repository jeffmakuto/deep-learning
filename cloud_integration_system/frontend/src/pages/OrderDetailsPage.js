/**
 * Order Details Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { orderAPI } from '../services/api';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.get(id);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box>
        <Alert severity="error">{error || 'Order not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 2 }}>
        Back to Orders
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Order Details</Typography>
          <Chip label={order.status} color="primary" />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Order Information</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Order ID" secondary={order.id} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Status" secondary={order.status} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Payment Status" secondary={order.paymentStatus} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Created"
                  secondary={new Date(order.createdAt).toLocaleString()}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Name" secondary={order.customerName} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Email" secondary={order.customerEmail} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Customer ID" secondary={order.customerId} />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Items</Typography>
            <List>
              {order.items.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${item.name} x${item.quantity}`}
                    secondary={`$${item.price.toFixed(2)} each`}
                  />
                  <Typography variant="body1">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h5">
                Total: ${order.totalAmount.toFixed(2)} {order.currency.toUpperCase()}
              </Typography>
            </Box>
          </Grid>

          {order.shippingAddress && (
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Shipping Address</Typography>
              <Typography variant="body2">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                {order.shippingAddress.country}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
