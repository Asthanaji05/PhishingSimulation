const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

if (!config.supabase.url) {
  throw new Error('REACT_APP_SUPABASE_URL is required in .env file');
}

if (!config.supabase.serviceRoleKey) {
  throw new Error('REACT_APP_SUPABASE_SERVICE_ROLE_KEY is required in .env file');
}

if (!config.supabase.anonKey) {
  throw new Error('REACT_APP_SUPABASE_ANON_KEY is required in .env file');
}

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

async function addRecipient(email, name = null, department = null) {
  const { data, error } = await supabase
    .from('recipients')
    .insert({ email, name, department })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateRecipient(id, payload) {
  const updateData = {
    email: payload.email,
    name: payload.name,
    department: payload.department,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('recipients')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteRecipient(id) {
  const { error } = await supabase
    .from('recipients')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

async function getRecipientByEmail(email) {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getRecipientById(id) {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getAllRecipients() {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function createCampaign(name, subject, body) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, subject, body, status: 'draft' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateCampaign(id, payload) {
  const updateData = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.subject !== undefined) updateData.subject = payload.subject;
  if (payload.body !== undefined) updateData.body = payload.body;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteCampaign(id) {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

async function updateCampaignStatus(campaignId, status, sentAt = null) {
  const updateData = { status };
  if (sentAt) updateData.sent_at = sentAt;

  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', campaignId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getCampaign(campaignId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getAllCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function logClickEvent(recipientId, campaignId, trackingToken, ipAddress, userAgent) {
  const { data, error } = await supabaseAnon
    .from('click_events')
    .insert({
      recipient_id: recipientId,
      campaign_id: campaignId,
      tracking_token: trackingToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      clicked_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getClickEventByToken(trackingToken) {
  const { data, error } = await supabase
    .from('click_events')
    .select('*, recipients(*), campaigns(*)')
    .eq('tracking_token', trackingToken)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getClickEventsByCampaign(campaignId) {
  const { data, error } = await supabase
    .from('click_events')
    .select('*, recipients(*)')
    .eq('campaign_id', campaignId)
    .order('clicked_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getAllClickEvents() {
  const { data, error } = await supabase
    .from('click_events')
    .select('*, recipients(*), campaigns(*)')
    .order('clicked_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getCampaignStats(campaignId) {
  const { data: recipients } = await supabase
    .from('recipients')
    .select('id');

  const { data: clicks } = await supabase
    .from('click_events')
    .select('recipient_id')
    .eq('campaign_id', campaignId);

  const totalRecipients = recipients?.length || 0;
  const totalClicks = clicks?.length || 0;
  const uniqueClickers = new Set(clicks?.map(c => c.recipient_id)).size;

  return {
    totalRecipients,
    totalClicks,
    uniqueClickers,
    clickRate: totalRecipients > 0 ? (uniqueClickers / totalRecipients * 100).toFixed(2) : 0
  };
}

async function checkSupabaseHealth() {
  try {
    const { error } = await supabase.from('recipients').select('id').limit(1);
    if (error) {
      return { status: 'error', message: error.message };
    }
    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

module.exports = {
  supabase,
  supabaseAnon,
  addRecipient,
  getRecipientByEmail,
  getRecipientById,
  getAllRecipients,
  updateRecipient,
  deleteRecipient,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  getCampaign,
  getAllCampaigns,
  logClickEvent,
  getClickEventByToken,
  getClickEventsByCampaign,
  getAllClickEvents,
  getCampaignStats,
  checkSupabaseHealth
};
