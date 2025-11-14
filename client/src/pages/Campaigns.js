import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Spinner,
  Badge,
  UncontrolledTooltip
} from 'reactstrap';
import { campaignsAPI, recipientsAPI } from '../services/api';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(null);
  const [formData, setFormData] = useState({ name: '', subject: '', body: '' });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [smtpVerified, setSmtpVerified] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, recipientsRes] = await Promise.all([
        campaignsAPI.getAll(),
        recipientsAPI.getAll(),
      ]);
      setCampaigns(campaignsRes.data);
      setRecipients(recipientsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => {
    setModal(!modal);
    if (!modal) {
      setEditingCampaign(null);
      setFormData({ name: '', subject: '', body: '' });
    }
  };

  const toggleSendModal = () => {
    setSendModal(!sendModal);
    if (!sendModal) {
      setSendingCampaign(null);
      setSelectedRecipients([]);
      setSmtpVerified(null);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
    });
    setModal(true);
  };

  const handleSend = async (campaign) => {
    setSendingCampaign(campaign);
    setSelectedRecipients([]);
    setSmtpVerified(null);
    setSendModal(true);
    
    // Verify SMTP connection
    try {
      const verifyRes = await campaignsAPI.verifySMTP(campaign.id);
      setSmtpVerified(verifyRes.data.connected);
    } catch (err) {
      setSmtpVerified(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingCampaign) {
        await campaignsAPI.update(editingCampaign.id, formData);
      } else {
        await campaignsAPI.create(formData);
      }
      toggleModal();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save campaign');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCampaign = async () => {
    setSending(true);
    setError(null);

    try {
      const recipientEmails = selectedRecipients.length > 0 
        ? selectedRecipients 
        : null;
      
      const result = await campaignsAPI.send(sendingCampaign.id, recipientEmails);
      
      alert(`Campaign sent!\nTotal: ${result.data.total}\nSent: ${result.data.sent}\nFailed: ${result.data.failed}`);
      
      if (result.data.errors && result.data.errors.length > 0) {
        console.error('Send errors:', result.data.errors);
      }
      
      toggleSendModal();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send campaign');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await campaignsAPI.delete(id);
      loadData();
    } catch (err) {
      setError('Failed to delete campaign');
      console.error(err);
    }
  };

  const toggleRecipient = (email) => {
    setSelectedRecipients(prev => 
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner color="primary" />
        <p className="mt-2">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Campaigns</h1>
        <Button color="primary" onClick={toggleModal}>
          + Create Campaign
        </Button>
      </div>

      {error && <Alert color="danger">{error}</Alert>}

      <Card>
        <CardBody>
          <CardTitle tag="h5">Campaign List</CardTitle>
          {campaigns.length === 0 ? (
            <p className="text-muted">No campaigns found. Create your first campaign above.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>{campaign.subject}</td>
                    <td>
                      <Badge color={
                        campaign.status === 'sent' ? 'success' :
                        campaign.status === 'draft' ? 'secondary' : 'info'
                      }>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td>{new Date(campaign.created_at).toLocaleDateString()}</td>
                    <td>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <Button
                        color="info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(campaign)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="success"
                        size="sm"
                        className="me-2"
                        onClick={() => handleSend(campaign)}
                        disabled={campaign.status === 'sent'}
                        id={`send-${campaign.id}`}
                      >
                        Send
                      </Button>
                      {campaign.status === 'sent' && (
                        <UncontrolledTooltip target={`send-${campaign.id}`}>
                          Campaign already sent
                        </UncontrolledTooltip>
                      )}
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>
          {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label for="name">Campaign Name *</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="subject">Email Subject *</Label>
              <Input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="body">Email Body (HTML) *</Label>
              <Input
                type="textarea"
                id="body"
                rows="10"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
              />
              <small className="text-muted">
                Use placeholders: {'{{name}}'}, {'{{email}}'}, {'{{tracking_url}}'}
              </small>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggleModal} disabled={submitting}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : editingCampaign ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Send Campaign Modal */}
      <Modal isOpen={sendModal} toggle={toggleSendModal} size="lg">
        <ModalHeader toggle={toggleSendModal}>
          Send Campaign: {sendingCampaign?.name}
        </ModalHeader>
        <ModalBody>
          {smtpVerified === false && (
            <Alert color="danger">
              SMTP connection failed. Please check your email configuration.
            </Alert>
          )}
          {smtpVerified === true && (
            <Alert color="success">
              SMTP connection verified successfully.
            </Alert>
          )}
          
          <FormGroup>
            <Label>Select Recipients</Label>
            <small className="d-block text-muted mb-2">
              Leave all unchecked to send to all recipients
            </small>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recipients.map((recipient) => (
                <FormGroup check key={recipient.id}>
                  <Input
                    type="checkbox"
                    checked={selectedRecipients.includes(recipient.email)}
                    onChange={() => toggleRecipient(recipient.email)}
                  />
                  <Label check>
                    {recipient.name || recipient.email} ({recipient.email})
                    {recipient.department && ` - ${recipient.department}`}
                  </Label>
                </FormGroup>
              ))}
            </div>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleSendModal} disabled={sending}>
            Cancel
          </Button>
          <Button 
            color="success" 
            onClick={handleSendCampaign} 
            disabled={sending || smtpVerified === false}
          >
            {sending ? <Spinner size="sm" /> : 'Send Campaign'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Campaigns;

