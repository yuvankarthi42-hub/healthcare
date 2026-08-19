/**
 * Thin, generic client for the Zoho Projects v3 "Custom Module Records" API.
 *
 * CareFlow's frontend NEVER talks to Zoho directly and NEVER sees Zoho
 * OAuth credentials or access tokens - all privileged calls happen here,
 * inside the Catalyst serverless function, per the security requirements.
 *
 * Auth model: a long-lived OAuth "self client" refresh token (generated
 * once via https://api-console.zoho.com) is exchanged for short-lived
 * access tokens on demand and cached in memory for their lifetime.
 *
 * Endpoint reference (Zoho Projects v3 API docs, "Custom Module Records"):
 *   GET    /api/v3/portal/{portalId}/module/{moduleApiName}/entities
 *   GET    /api/v3/portal/{portalId}/module/{moduleApiName}/entities/{id}
 *   POST   /api/v3/portal/{portalId}/module/{moduleApiName}/entities
 *   PATCH  /api/v3/portal/{portalId}/module/{moduleApiName}/entities/{id}
 *   POST   /api/v3/portal/{portalId}/module/{moduleApiName}/entities/{id}/trash
 * List/Get/Create/Update all return either a plain JSON object (single
 * record) or a plain JSON array (list) - NOT wrapped in a `{moduleName: []}`
 * envelope like some other Zoho v3 APIs.
 */

const axios = require("axios");
const { PORTAL_ID } = require("./zohoSchema");

const ACCOUNTS_DC = process.env.ZOHO_ACCOUNTS_DC || "https://accounts.zoho.com";
const API_DC = process.env.ZOHO_API_DC || "https://projectsapi.zoho.com";

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60000) {
    return cachedToken;
  }

  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error(
      "Missing Zoho OAuth credentials. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and " +
        "ZOHO_REFRESH_TOKEN as environment variables (see README > Zoho Projects OAuth Setup)."
    );
  }

  const resp = await axios.post(`${ACCOUNTS_DC}/oauth/v2/token`, null, {
    params: {
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    },
  });

  cachedToken = resp.data.access_token;
  cachedTokenExpiry = now + (resp.data.expires_in || 3600) * 1000;
  return cachedToken;
}

async function zohoRequest(method, path, { params, data } = {}) {
  const token = await getAccessToken();
  try {
    const resp = await axios({
      method,
      url: `${API_DC}${path}`,
      params,
      data,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
    });
    return resp.data;
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    const message = body?.error_description || body?.title || body?.message || err.message;
    const wrapped = new Error(`Zoho Projects API error (${status || "network"}): ${message}`);
    wrapped.status = status;
    wrapped.zohoBody = body;
    throw wrapped;
  }
}

function entitiesPath(moduleApiName, suffix = "") {
  return `/api/v3/portal/${PORTAL_ID}/module/${moduleApiName}/entities${suffix}`;
}

/** List records for a custom module, with optional pagination. */
async function listRecords(moduleApiName, { page = 1, perPage = 200, index, range } = {}) {
  const params = { page, per_page: perPage };
  if (index !== undefined) params.index = index;
  if (range !== undefined) params.range = range;
  const data = await zohoRequest("get", entitiesPath(moduleApiName), { params });
  return Array.isArray(data) ? data : data?.entities || [];
}

/** Fetch a single record by Zoho record id. */
async function getRecord(moduleApiName, recordId) {
  return zohoRequest("get", entitiesPath(moduleApiName, `/${recordId}`));
}

/** Create a record. `body` should already be in Zoho field_name form. */
async function createRecord(moduleApiName, body) {
  return zohoRequest("post", entitiesPath(moduleApiName), { data: body });
}

/** Update a record. `body` should already be in Zoho field_name form. */
async function updateRecord(moduleApiName, recordId, body) {
  return zohoRequest("patch", entitiesPath(moduleApiName, `/${recordId}`), { data: body });
}

/** Soft-delete: move a custom-module record to the Zoho recycle bin (not a hard delete). */
async function trashRecord(moduleApiName, recordId) {
  try {
    return await zohoRequest("post", entitiesPath(moduleApiName, `/${recordId}/trash`));
  } catch (err) {
    if (![400, 404, 405].includes(err.status)) throw err;
    return zohoRequest("post", `/api/v3/portal/${PORTAL_ID}/trash`, {
      data: { module: moduleApiName, items: [String(recordId)] },
    });
  }
}

module.exports = {
  PORTAL_ID,
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  trashRecord,
};
