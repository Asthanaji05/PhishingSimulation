const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

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

async function getRecipientByEmail(email) {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('email', email)
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

module.exports = {
  supabase,
  supabaseAnon,
  addRecipient,
  getRecipientByEmail,
  getAllRecipients,
  createCampaign,
  updateCampaignStatus,
  getCampaign,
  getAllCampaigns,
  logClickEvent,
  getClickEventByToken,
  getClickEventsByCampaign,
  getAllClickEvents,
  getCampaignStats
};
