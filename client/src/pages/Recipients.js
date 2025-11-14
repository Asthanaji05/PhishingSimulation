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
  Badge
} from 'reactstrap';
import { recipientsAPI } from '../services/api';

const Recipients = () => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [formData, setFormData] = useState({ email: '', name: '', department: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const response = await recipientsAPI.getAll();
      setRecipients(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load recipients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => {
    setModal(!modal);
    if (!modal) {
      setEditingRecipient(null);
      setFormData({ email: '', name: '', department: '' });
    }
  };

  const handleEdit = (recipient) => {
    setEditingRecipient(recipient);
    setFormData({
      email: recipient.email,
      name: recipient.name || '',
      department: recipient.department || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingRecipient) {
        await recipientsAPI.update(editingRecipient.id, formData);
      } else {
        await recipientsAPI.create(formData);
      }
      toggleModal();
      loadRecipients();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save recipient');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipient?')) {
      return;
    }

    try {
      await recipientsAPI.delete(id);
      loadRecipients();
    } catch (err) {
      setError('Failed to delete recipient');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner color="primary" />
        <p className="mt-2">Loading recipients...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Recipients</h1>
        <Button color="primary" onClick={toggleModal}>
          + Add Recipient
        </Button>
      </div>

      {error && <Alert color="danger">{error}</Alert>}

      <Card>
        <CardBody>
          <CardTitle tag="h5">Recipient List</CardTitle>
          {recipients.length === 0 ? (
            <p className="text-muted">No recipients found. Add your first recipient above.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.id}>
                    <td>{recipient.email}</td>
                    <td>{recipient.name || <Badge color="secondary">N/A</Badge>}</td>
                    <td>{recipient.department || <Badge color="secondary">N/A</Badge>}</td>
                    <td>{new Date(recipient.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        color="info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(recipient)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(recipient.id)}
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

      <Modal isOpen={modal} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>
          {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label for="email">Email *</Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="department">Department</Label>
              <Input
                type="text"
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggleModal} disabled={submitting}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : editingRecipient ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default Recipients;

