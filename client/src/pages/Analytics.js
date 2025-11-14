import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody
} from 'reactstrap';
import { campaignsAPI, clicksAPI, reportsAPI } from '../services/api';

const Analytics = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [campaignClicks, setCampaignClicks] = useState([]);
  const [statsModal, setStatsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, clicksRes] = await Promise.all([
        campaignsAPI.getAll(),
        clicksAPI.getAll(),
      ]);
      setCampaigns(campaignsRes.data);
      setClicks(clicksRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignDetails = async (campaignId) => {
    try {
      const [statsRes, clicksRes] = await Promise.all([
        campaignsAPI.getStats(campaignId),
        campaignsAPI.getClicks(campaignId),
      ]);
      setCampaignStats(statsRes.data);
      setCampaignClicks(clicksRes.data);
    } catch (err) {
      console.error('Failed to load campaign details:', err);
    }
  };

  const handleViewCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setStatsModal(true);
    await loadCampaignDetails(campaign.id);
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await reportsAPI.downloadCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'click_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download CSV report');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner color="primary" />
        <p className="mt-2">Loading analytics...</p>
      </div>
    );
  }

  const totalClicks = clicks.length;
  const uniqueClickers = new Set(clicks.map(c => c.recipient_id)).size;
  const totalRecipients = campaigns.reduce((acc, c) => {
    // This is approximate - actual recipient count should come from API
    return acc;
  }, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Analytics & Reports</h1>
        <Button color="primary" onClick={handleDownloadCSV}>
          Download CSV Report
        </Button>
      </div>

      {error && <Alert color="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total Clicks</CardTitle>
              <h2 className="text-primary">{totalClicks}</h2>
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <CardBody>
              <CardTitle tag="h5">Unique Clickers</CardTitle>
              <h2 className="text-success">{uniqueClickers}</h2>
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total Campaigns</CardTitle>
              <h2 className="text-info">{campaigns.length}</h2>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card>
        <CardBody>
          <CardTitle tag="h5">Campaign Performance</CardTitle>
          {campaigns.length === 0 ? (
            <p className="text-muted">No campaigns found.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Status</th>
                  <th>Sent Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>
                      <Badge color={
                        campaign.status === 'sent' ? 'success' :
                        campaign.status === 'draft' ? 'secondary' : 'info'
                      }>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <Button
                        color="info"
                        size="sm"
                        onClick={() => handleViewCampaign(campaign)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <CardTitle tag="h5">Recent Clicks</CardTitle>
          {clicks.length === 0 ? (
            <p className="text-muted">No clicks recorded yet.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Recipient</th>
                  <th>Email</th>
                  <th>IP Address</th>
                  <th>Clicked At</th>
                </tr>
              </thead>
              <tbody>
                {clicks.slice(0, 20).map((click) => (
                  <tr key={click.id}>
                    <td>{click.campaigns?.name || 'N/A'}</td>
                    <td>{click.recipients?.name || 'N/A'}</td>
                    <td>{click.recipients?.email || 'N/A'}</td>
                    <td>{click.ip_address || 'N/A'}</td>
                    <td>{click.clicked_at ? new Date(click.clicked_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Campaign Details Modal */}
      <Modal isOpen={statsModal} toggle={() => setStatsModal(false)} size="lg">
        <ModalHeader toggle={() => setStatsModal(false)}>
          Campaign Details: {selectedCampaign?.name}
        </ModalHeader>
        <ModalBody>
          {campaignStats && (
            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <CardBody>
                    <CardTitle tag="h6">Total Recipients</CardTitle>
                    <h4>{campaignStats.totalRecipients}</h4>
                  </CardBody>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <CardBody>
                    <CardTitle tag="h6">Unique Clickers</CardTitle>
                    <h4>{campaignStats.uniqueClickers}</h4>
                  </CardBody>
                </Card>
              </Col>
              <Col md={6} className="mt-3">
                <Card>
                  <CardBody>
                    <CardTitle tag="h6">Total Clicks</CardTitle>
                    <h4>{campaignStats.totalClicks}</h4>
                  </CardBody>
                </Card>
              </Col>
              <Col md={6} className="mt-3">
                <Card>
                  <CardBody>
                    <CardTitle tag="h6">Click Rate</CardTitle>
                    <h4>{campaignStats.clickRate}%</h4>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          <h6>Click Details</h6>
          {campaignClicks.length === 0 ? (
            <p className="text-muted">No clicks recorded for this campaign.</p>
          ) : (
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Email</th>
                  <th>IP Address</th>
                  <th>Clicked At</th>
                </tr>
              </thead>
              <tbody>
                {campaignClicks.map((click) => (
                  <tr key={click.id}>
                    <td>{click.recipients?.name || 'N/A'}</td>
                    <td>{click.recipients?.email || 'N/A'}</td>
                    <td>{click.ip_address || 'N/A'}</td>
                    <td>{click.clicked_at ? new Date(click.clicked_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default Analytics;

