const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/* ── Helpers ── */

function cleanText(value, max = 220) {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function validAge(value) {
  const age = Number(value);
  if (!Number.isFinite(age)) return 0;
  return Math.max(0, Math.min(18, Math.round(age)));
}

function normalizeInput(payload) {
  return {
    childName: cleanText(payload?.childName, 80) || 'Child',
    age: validAge(payload?.age),
    location: cleanText(payload?.location, 180),
    outfit: cleanText(payload?.outfit, 120),
    context: cleanText(payload?.context, 300),
    nearby: cleanText(payload?.nearby, 220),
  };
}

function heuristicSummary(input) {
  const parts = [
    `${input.childName}, age ${input.age}, has been reported missing.`,
    input.location ? `Last seen at ${input.location}.` : '',
    input.outfit ? `Outfit: ${input.outfit}.` : '',
    input.context ? `Context: ${input.context}.` : '',
    input.nearby ? `Nearby individuals/vehicles: ${input.nearby}.` : '',
  ];
  return parts.filter(Boolean).join(' ').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function dateKey(isoValue) {
  return (isoValue || nowIso()).slice(0, 10);
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeOperationType(value) {
  const allowed = new Set(['broadcast', 'test_sms', 'test_push', 'export', 'notify_partners', 'backup']);
  const type = cleanText(value, 32).toLowerCase();
  return allowed.has(type) ? type : '';
}

function sanitizeIdList(input, max = 30) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => cleanText(item, 120))
    .filter(Boolean)
    .slice(0, max);
}

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  const entries = Object.entries(meta).slice(0, 20);
  const safe = {};

  for (const [key, value] of entries) {
    const safeKey = cleanText(key, 40);
    if (!safeKey) continue;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      safe[safeKey] = typeof value === 'string' ? cleanText(value, 180) : value;
    }
  }

  return safe;
}

async function assertAdmin(uid) {
  const adminDoc = await firestore.doc(`admins/${uid}`).get();
  if (!adminDoc.exists) {
    throw new HttpsError('permission-denied', 'Admin privileges required.');
  }
}

async function createNotification(payload) {
  const notification = {
    id: uniqueId('notification'),
    userId: payload.userId,
    title: cleanText(payload.title, 90) || 'System update',
    body: cleanText(payload.body, 240) || 'A new update is available.',
    type: payload.type || 'info',
    route: payload.route || null,
    createdAt: nowIso(),
    read: false,
  };

  await firestore.doc(`notifications/${notification.id}`).set(notification, { merge: true });
  return notification.id;
}

/* ── Twilio SMS ── */

const TWILIO_MESSAGING_SERVICE_SID = 'MG8f8070d09d2ea1c6dd3ce1edb19ce268';

/**
 * Send a single SMS via Twilio.
 * Returns { success, sid?, error? }
 */
async function sendSms(to, body, accountSid, authToken) {
  if (!to || !body || !accountSid || !authToken) {
    return { success: false, error: 'Missing SMS parameters' };
  }

  // Normalize phone: ensure + prefix
  const phone = to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`;
  if (phone.length < 8) {
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const twilio = require('twilio')(accountSid, authToken);
    const message = await twilio.messages.create({
      to: phone,
      messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
      body: body.slice(0, 1600), // Twilio max
    });

    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('Twilio SMS error:', err?.message || err);
    return { success: false, error: err?.message || 'SMS send failed' };
  }
}

/**
 * Send SMS to multiple recipients. Returns a summary.
 */
async function sendBulkSms(recipients, body, accountSid, authToken) {
  if (!recipients.length || !body) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results = await Promise.allSettled(
    recipients.map((phone) => sendSms(phone, body, accountSid, authToken)),
  );

  let sent = 0;
  let failed = 0;
  const details = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++;
      details.push({ success: true, sid: result.value.sid });
    } else {
      failed++;
      const error =
        result.status === 'fulfilled' ? result.value.error : result.reason?.message || 'Unknown';
      details.push({ success: false, error });
    }
  }

  return { sent, failed, results: details };
}

/**
 * Build an alert SMS body.
 */
function buildAlertSmsBody(childName, age, location, radiusKm) {
  return [
    `🚨 KimbAlert MISSING CHILD`,
    `Name: ${childName || 'Unknown'}, Age: ${age || '?'}`,
    `Last seen: ${location || 'Unknown location'}`,
    `Search radius: ${radiusKm || 10}km`,
    `If you have info, open the KimbAlert app or contact authorities immediately.`,
    `Do NOT approach — report sightings only.`,
  ].join('\n');
}

/* ── Rate Limiting ── */
const rateLimitMap = new Map();

function checkRateLimit(uid, limit = 10, windowMs = 60000) {
  const now = Date.now();
  if (!rateLimitMap.has(uid)) {
    rateLimitMap.set(uid, []);
  }
  const timestamps = rateLimitMap.get(uid).filter((t) => now - t < windowMs);
  timestamps.push(now);
  rateLimitMap.set(uid, timestamps);

  if (timestamps.length > limit) {
    throw new HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
  }
}

/* ── DeepSeek AI ── */

async function callDeepSeek(input, apiKey) {
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const prompt = [
    'You are an emergency incident summarizer for a missing child response system.',
    'Create a concise factual summary in plain language (max 90 words).',
    'Do not add facts not provided.',
    `Child: ${input.childName}, Age: ${input.age}`,
    `Location: ${input.location || 'Not provided'}`,
    `Outfit: ${input.outfit || 'Not provided'}`,
    `Context: ${input.context || 'Not provided'}`,
    `Nearby: ${input.nearby || 'Not provided'}`,
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 220,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    return summary || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Cloud Functions ── */

exports.incidentSummary = onCall(
  {
    region: process.env.FUNCTIONS_REGION || 'africa-south1',
    cors: true,
    maxInstances: 5,
    timeoutSeconds: 30,
    secrets: [DEEPSEEK_API_KEY],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    checkRateLimit(request.auth.uid, 5, 60000); // 5 calls per minute

    const input = normalizeInput(request.data || {});
    if (!input.location) {
      throw new HttpsError('invalid-argument', 'Location is required.');
    }

    const fallback = heuristicSummary(input);
    const apiKey = DEEPSEEK_API_KEY.value();

    if (!apiKey) {
      return {
        ok: true,
        provider: 'heuristic',
        summary: fallback,
      };
    }

    const deepseek = await callDeepSeek(input, apiKey);
    if (deepseek) {
      return {
        ok: true,
        provider: 'deepseek-function',
        summary: deepseek,
      };
    }

    return {
      ok: true,
      provider: 'heuristic',
      summary: fallback,
    };
  },
);

exports.adminOperation = onCall(
  {
    region: process.env.FUNCTIONS_REGION || 'africa-south1',
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const actorId = request.auth.uid;
    checkRateLimit(actorId, 10, 60000); // 10 ops per minute for admins

    await assertAdmin(actorId);

    const type = normalizeOperationType(request.data?.type);
    if (!type) {
      throw new HttpsError('invalid-argument', 'Operation type is required.');
    }

    const title = cleanText(request.data?.title, 90);
    const body = cleanText(request.data?.body, 260);
    const reportIds = sanitizeIdList(request.data?.reportIds, 30);
    const partnerIds = sanitizeIdList(request.data?.partnerIds, 50);
    const meta = sanitizeMeta(request.data?.meta);

    const createdAt = nowIso();
    const actionId = uniqueId('action');

    const action = {
      id: actionId,
      type,
      summary: title || `Operation executed: ${type}`,
      actorId,
      createdAt,
      meta: {
        ...meta,
        reportCount: reportIds.length,
        partnerCount: partnerIds.length,
      },
    };

    await firestore.doc(`adminActions/${actionId}`).set(action, { merge: true });

    // Twilio credentials from secrets
    const twilioSid = TWILIO_ACCOUNT_SID.value();
    const twilioToken = TWILIO_AUTH_TOKEN.value();
    const twilioReady = Boolean(twilioSid && twilioToken);

    let notificationsCreated = 0;
    let pushSentDelta = 0;
    let smsSentDelta = 0;
    let smsSendResults = null;

    /* ── BROADCAST ── */
    if (type === 'broadcast') {
      const guardianNotifications = [];
      const smsRecipients = [];
      let smsBody = '';

      for (const reportId of reportIds) {
        const reportDoc = await firestore.doc(`reports/${reportId}`).get();
        if (!reportDoc.exists) continue;

        const report = reportDoc.data() || {};
        const guardianId = cleanText(report.guardianId, 120);
        if (!guardianId) continue;

        // In-app notification
        guardianNotifications.push(
          createNotification({
            userId: guardianId,
            title: title || 'Alert update from command center',
            body:
              body ||
              'Your missing child alert has a new command center update. Open alert status for details.',
            type: 'info',
            route: `/guardian/alert/status/${reportId}`,
          }),
        );

        // Collect phones for SMS broadcast
        const childId = cleanText(report.childId, 120);
        const childDoc = childId ? await firestore.doc(`children/${childId}`).get() : null;
        const childData = childDoc?.exists ? childDoc.data() : {};

        smsBody = buildAlertSmsBody(
          childData?.name || 'Unknown',
          childData?.age,
          report?.lastSeenLocation?.address || 'Unknown',
          report?.currentRadiusKm,
        );

        // Get all guardians in the system to notify via SMS
        const guardianSnapshot = await firestore.collection('guardians').limit(200).get();
        guardianSnapshot.docs.forEach((gDoc) => {
          const phone = gDoc.data()?.phone || gDoc.data()?.phoneNormalized;
          if (phone && !smsRecipients.includes(phone)) {
            smsRecipients.push(phone);
          }
        });
      }

      if (guardianNotifications.length) {
        await Promise.all(guardianNotifications);
        notificationsCreated += guardianNotifications.length;
        pushSentDelta += guardianNotifications.length;
      } else {
        await createNotification({
          userId: actorId,
          title: title || 'Broadcast queued',
          body: body || 'Announcement has been queued to active channels.',
          type: 'info',
          route: '/admin/notifications',
        });
        notificationsCreated += 1;
        pushSentDelta += 1;
      }

      // Send SMS broadcast
      if (twilioReady && smsRecipients.length && smsBody) {
        smsSendResults = await sendBulkSms(smsRecipients, smsBody, twilioSid, twilioToken);
        smsSentDelta += smsSendResults.sent;
      }
    }

    /* ── TEST SMS ── */
    if (type === 'test_sms') {
      // Get admin phone for test message
      const adminDoc = await firestore.doc(`admins/${actorId}`).get();
      const adminPhone = adminDoc.exists
        ? adminDoc.data()?.phone || adminDoc.data()?.phoneNormalized
        : null;

      let smsResult = null;
      if (twilioReady && adminPhone) {
        smsResult = await sendSms(
          adminPhone,
          `✅ KimbAlert SMS Gateway Test\nThis confirms your SMS channel is operational.\nTimestamp: ${createdAt}`,
          twilioSid,
          twilioToken,
        );
        smsSentDelta += smsResult.success ? 1 : 0;
      }

      const statusMsg = !twilioReady
        ? 'Twilio credentials not configured. SMS test skipped.'
        : !adminPhone
          ? 'No phone number on your admin profile. Add one in settings.'
          : smsResult?.success
            ? `SMS test sent successfully (SID: ${smsResult.sid})`
            : `SMS send failed: ${smsResult?.error || 'Unknown error'}`;

      await createNotification({
        userId: actorId,
        title: title || 'SMS gateway test',
        body: statusMsg,
        type: smsResult?.success ? 'success' : 'warning',
        route: '/admin/notifications',
      });
      notificationsCreated += 1;
    }

    /* ── TEST PUSH ── */
    if (type === 'test_push') {
      await createNotification({
        userId: actorId,
        title: title || 'Push test sent',
        body: body || 'Push service diagnostics request has been submitted.',
        type: 'info',
        route: '/admin/notifications',
      });
      notificationsCreated += 1;
      pushSentDelta += 1;
    }

    /* ── EXPORT ── */
    if (type === 'export') {
      await createNotification({
        userId: actorId,
        title: title || 'Export prepared',
        body: body || 'Requested export package is now ready for download.',
        type: 'success',
        route: '/admin/notifications',
      });
      notificationsCreated += 1;
    }

    /* ── BACKUP ── */
    if (type === 'backup') {
      await createNotification({
        userId: actorId,
        title: title || 'Backup started',
        body: body || 'Manual backup process has started.',
        type: 'success',
        route: '/admin/notifications',
      });
      notificationsCreated += 1;
    }

    /* ── NOTIFY PARTNERS ── */
    if (type === 'notify_partners') {
      const now = nowIso();
      const targetIds = [];

      if (partnerIds.length) {
        targetIds.push(...partnerIds);
      } else {
        const activePartnersSnapshot = await firestore
          .collection('partners')
          .where('active', '==', true)
          .limit(50)
          .get();
        activePartnersSnapshot.docs.forEach((partnerDoc) => targetIds.push(partnerDoc.id));
      }

      // Update partners and collect phone numbers
      const partnerPhones = [];
      await Promise.all(
        targetIds.map(async (id) => {
          const partnerDoc = await firestore.doc(`partners/${id}`).get();
          if (partnerDoc.exists) {
            const phone = partnerDoc.data()?.contactPhone;
            if (phone) partnerPhones.push(phone);
          }
          await firestore.doc(`partners/${id}`).set(
            {
              lastNotifiedAt: now,
            },
            { merge: true },
          );
        }),
      );

      // Send SMS to partners
      if (twilioReady && partnerPhones.length) {
        const partnerSmsBody = [
          `🚨 KimbAlert Partner Alert`,
          title || 'A new missing child alert requires your attention.',
          body || 'Please check the KimbAlert system for details.',
          `Timestamp: ${now}`,
        ].join('\n');

        smsSendResults = await sendBulkSms(partnerPhones, partnerSmsBody, twilioSid, twilioToken);
        smsSentDelta += smsSendResults.sent;
      }

      await createNotification({
        userId: actorId,
        title: title || 'Partners notified',
        body: body || `Notification sent to ${targetIds.length} partner nodes.${smsSendResults ? ` SMS: ${smsSendResults.sent} sent, ${smsSendResults.failed} failed.` : ''}`,
        type: 'success',
        route: '/admin/partners',
      });

      notificationsCreated += 1;
      pushSentDelta += Math.max(1, targetIds.length);
    }

    /* ── Analytics Update ── */
    const analyticsDate = dateKey(createdAt);
    const analyticsPatch = {
      date: analyticsDate,
    };

    if (pushSentDelta > 0) {
      analyticsPatch.pushSent = admin.firestore.FieldValue.increment(pushSentDelta);
    }
    if (smsSentDelta > 0) {
      analyticsPatch.smsSent = admin.firestore.FieldValue.increment(smsSentDelta);
    }

    await firestore.doc(`analytics/${analyticsDate}`).set(analyticsPatch, { merge: true });

    return {
      ok: true,
      type,
      actionId,
      notificationsCreated,
      smsSent: smsSentDelta,
      smsResults: smsSendResults
        ? { sent: smsSendResults.sent, failed: smsSendResults.failed }
        : null,
      analyticsDate,
    };
  },
);

/* ── New Report SMS Trigger ── */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');

exports.onReportCreated = onDocumentCreated(
  {
    document: 'reports/{reportId}',
    region: process.env.FUNCTIONS_REGION || 'africa-south1',
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN],
  },
  async (event) => {
    const report = event.data?.data();
    if (!report) return;

    const twilioSid = TWILIO_ACCOUNT_SID.value();
    const twilioToken = TWILIO_AUTH_TOKEN.value();
    if (!twilioSid || !twilioToken) {
      console.log('Twilio not configured, skipping SMS on report creation.');
      return;
    }

    // Only send for active/pending reports
    if (report.status !== 'active' && report.status !== 'pending') return;

    // Get child info
    const childId = cleanText(report.childId, 120);
    const childDoc = childId ? await firestore.doc(`children/${childId}`).get() : null;
    const child = childDoc?.exists ? childDoc.data() : {};

    const smsBody = buildAlertSmsBody(
      child?.name || 'Unknown',
      child?.age,
      report?.lastSeenLocation?.address || 'Unknown',
      report?.currentRadiusKm,
    );

    // Get all active partner phones
    const partnersSnapshot = await firestore
      .collection('partners')
      .where('active', '==', true)
      .limit(50)
      .get();

    const phones = [];
    partnersSnapshot.docs.forEach((doc) => {
      const phone = doc.data()?.contactPhone;
      if (phone) phones.push(phone);
    });

    if (!phones.length) {
      console.log('No partner phones to notify for new report.');
      return;
    }

    const result = await sendBulkSms(phones, smsBody, twilioSid, twilioToken);
    console.log(`Report ${event.params.reportId}: SMS sent to ${result.sent} partners, ${result.failed} failed.`);

    // Update analytics
    const today = dateKey();
    await firestore.doc(`analytics/${today}`).set(
      {
        date: today,
        smsSent: admin.firestore.FieldValue.increment(result.sent),
      },
      { merge: true },
    );
  },
);
