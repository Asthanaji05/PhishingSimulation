import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Row,
  Col,
  Spinner,
  Alert
} from 'reactstrap';
import { campaignsAPI, recipientsAPI, clicksAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRecipients: 0,
    totalClicks: 0,
    activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [campaignsRes, recipientsRes, clicksRes] = await Promise.all([
        campaignsAPI.getAll(),
        recipientsAPI.getAll(),
        clicksAPI.getAll(),
      ]);

      const campaigns = campaignsRes.data;
      const recipients = recipientsRes.data;
      const clicks = clicksRes.data;

      setStats({
        totalCampaigns: campaigns.length,
        totalRecipients: recipients.length,
        totalClicks: clicks.length,
        activeCampaigns: campaigns.filter(c => c.status === 'sent').length,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner color="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      {error && <Alert color="danger">{error}</Alert>}

      <Row>
        <Col md={3} className="mb-4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total Campaigns</CardTitle>
              <h2 className="text-primary">{stats.totalCampaigns}</h2>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total Recipients</CardTitle>
              <h2 className="text-success">{stats.totalRecipients}</h2>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total Clicks</CardTitle>
              <h2 className="text-info">{stats.totalClicks}</h2>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Active Campaigns</CardTitle>
              <h2 className="text-warning">{stats.activeCampaigns}</h2>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <CardBody>
          <CardTitle tag="h5">Quick Actions</CardTitle>
          <p className="text-muted">
            Use the navigation menu to manage recipients, create campaigns, and view analytics.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default Dashboard;

