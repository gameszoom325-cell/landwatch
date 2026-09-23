(() => {
  'use strict';

  const projectCatalog = {
    Chennai: [
      { name: 'Chennai Metro Phase 2', authority: 'Tamil Nadu Metro Rail Corporation', category: 'Urban Transit', requiredLand: 14.8, acquiredPercent: 68, completionPercent: 62, stage: 'Award & Utility Shift', risk: 68 },
      { name: 'Chennai Peripheral Ring Road', authority: 'National Highways Authority of India', category: 'Highway Corridor', requiredLand: 26.4, acquiredPercent: 72, completionPercent: 58, stage: 'Notification & Award', risk: 74 },
      { name: 'Chennai Port Industrial Land Acquisition', authority: 'Chennai Port Authority', category: 'Industrial Logistics', requiredLand: 18.1, acquiredPercent: 57, completionPercent: 48, stage: 'Survey & Valuation', risk: 81 }
    ],
    Delhi: [
      { name: 'Delhi-Meerut Regional Rapid Transit', authority: 'NCRTC', category: 'Transit Infrastructure', requiredLand: 33.6, acquiredPercent: 76, completionPercent: 71, stage: 'Compensation & Possession', risk: 65 },
      { name: 'Delhi Alwar Greenfield Expressway', authority: 'NHAI', category: 'Expressway', requiredLand: 28.2, acquiredPercent: 63, completionPercent: 53, stage: 'Award & Objection', risk: 77 }
    ],
    Mumbai: [
      { name: 'Mumbai Coastal Road Phase II', authority: 'Maharashtra State Road Development Corporation', category: 'Coastal Infrastructure', requiredLand: 21.7, acquiredPercent: 71, completionPercent: 67, stage: 'Notification & R&R', risk: 62 },
      { name: 'Panvel-Kalyan Metro Expansion', authority: 'Maha Metro', category: 'Metro', requiredLand: 17.5, acquiredPercent: 69, completionPercent: 61, stage: 'Award & Utility Relocation', risk: 66 }
    ],
    Bangalore: [
      { name: 'Bengaluru Suburban Rail Project', authority: 'Karnataka Rail Infrastructure Development Company', category: 'Rail Infrastructure', requiredLand: 19.8, acquiredPercent: 61, completionPercent: 56, stage: 'Survey & Compensation', risk: 73 },
      { name: 'Peripheral Ring Road Phase I', authority: 'BDA', category: 'Urban Corridor', requiredLand: 24.2, acquiredPercent: 58, completionPercent: 49, stage: 'Award & Land Pooling', risk: 79 }
    ],
    Hyderabad: [
      { name: 'Regional Ring Road', authority: 'Government of Telangana', category: 'Urban Corridor', requiredLand: 42.8, acquiredPercent: 54, completionPercent: 41, stage: 'Notification & R&R', risk: 82 },
      { name: 'Hyderabad Metro Line VI', authority: 'Hyderabad Metro Rail', category: 'Metro', requiredLand: 15.4, acquiredPercent: 67, completionPercent: 59, stage: 'Possession & Utility Relief', risk: 64 }
    ],
    Kolkata: [
      { name: 'Eastern Metropolitan Bypass Upgradation', authority: 'West Bengal Highway Authority', category: 'Highway Upgrade', requiredLand: 28.2, acquiredPercent: 60, completionPercent: 50, stage: 'Award & Compensation', risk: 72 },
      { name: 'Kolkata East-West Metro Extension', authority: 'Kolkata Metro Rail Corporation', category: 'Metro', requiredLand: 13.9, acquiredPercent: 66, completionPercent: 63, stage: 'Utility Relocation & Possession', risk: 61 }
    ],
    default: [
      { name: 'State Infrastructure Corridor', authority: 'State Infrastructure Authority', category: 'Public Infrastructure', requiredLand: 18.4, acquiredPercent: 61, completionPercent: 58, stage: 'Award & Survey', risk: 70 }
    ]
  };

  const state = {
    panel: null,
    layer: null,
    project: null,
    location: null,
    lastUpdated: null
  };

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const number = value => {
    const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function getDefaultProject(profile) {
    const key = profile?.name || profile?.district || 'default';
    const list = projectCatalog[key] || projectCatalog[profile?.state] || projectCatalog[profile?.district] || projectCatalog.default;
    const source = list[0] || projectCatalog.default[0];
    const requiredLand = Number(source.requiredLand) || 18;
    const acquiredPercent = clamp(source.acquiredPercent || 63);
    const pendingLand = Math.max(5, 100 - acquiredPercent);
    const legalRiskScore = clamp(source.risk + 4);
    const paymentDelayDays = Math.max(8, Math.round((100 - acquiredPercent) * 0.8 + source.risk * 0.2));
    const approvalDelayDays = Math.max(10, Math.round((100 - acquiredPercent) * 0.4 + 12));
    const rrProgress = clamp(100 - (pendingLand * 0.75), 10, 95);
    const stakeholderIssues = Math.max(2, Math.round((100 - acquiredPercent) * 0.18));

    const project = {
      name: source.name,
      authority: source.authority,
      state: profile?.state || 'India',
      district: profile?.district || 'Project District',
      category: source.category,
      requiredLand: `${requiredLand.toFixed(1)} ha`,
      requiredLandValue: requiredLand,
      acquiredPercent,
      pendingLand,
      acquisitionStage: source.stage,
      completionPercent: clamp(source.completionPercent || (acquiredPercent * 0.92)),
      totalCompensation: `${(requiredLand * 6.4).toFixed(0)} Lakhs`,
      releasedAmount: `${(requiredLand * 4.7).toFixed(0)} Lakhs`,
      pendingAmount: `${(requiredLand * 1.7).toFixed(0)} Lakhs`,
      affectedFamilies: Math.max(120, Math.round(requiredLand * 22)),
      paymentDelayDays,
      approvalDelayDays,
      rrProgress,
      stakeholderIssues,
      activeDisputes: Math.max(1, Math.round((100 - acquiredPercent) * 0.25)),
      courtCases: Math.max(1, Math.round((100 - acquiredPercent) * 0.18)),
      ownershipConflicts: Math.max(1, Math.round((100 - acquiredPercent) * 0.22)),
      legalRiskScore,
      notificationDate: '2024-09-12',
      surveyDate: '2025-02-08',
      awardDate: '2025-05-17',
      compensationDate: '2025-08-03',
      possessionDate: '2025-12-12',
      rrCompletionDate: '2026-03-08',
      timeline: {
        notification: 'Completed',
        survey: 'In progress',
        award: 'Under review',
        compensation: 'Partially released',
        possession: 'Pending',
        rr: 'Scheduled'
      },
      estimated: {
        compensation: true,
        legal: true,
        projectProgress: false,
        timeline: true,
        families: true
      }
    };

    const legalSignal = clamp(legalRiskScore);
    const compensationSignal = clamp(paymentDelayDays * 1.2, 0, 100);
    const pendingSignal = clamp(pendingLand, 0, 100);
    const approvalSignal = clamp(approvalDelayDays * 1.7, 0, 100);
    const rrSignal = clamp(100 - rrProgress, 0, 100);
    const stakeholderSignal = clamp(stakeholderIssues * 5, 0, 100);
    const riskScore = clamp(
      legalSignal * 0.25 +
      compensationSignal * 0.25 +
      pendingSignal * 0.2 +
      approvalSignal * 0.15 +
      rrSignal * 0.1 +
      stakeholderSignal * 0.05
    );

    return {
      project,
      compensation: {
        total: project.totalCompensation,
        released: project.releasedAmount,
        pending: project.pendingAmount,
        affectedFamilies: project.affectedFamilies,
        delayDays: project.paymentDelayDays,
        estimated: true
      },
      legal: {
        activeDisputes: project.activeDisputes,
        courtCases: project.courtCases,
        ownershipConflicts: project.ownershipConflicts,
        legalRiskScore: project.legalRiskScore,
        estimated: true
      },
      timeline: {
        notification: project.notificationDate,
        survey: project.surveyDate,
        award: project.awardDate,
        compensation: project.compensationDate,
        possession: project.possessionDate,
        rrCompletion: project.rrCompletionDate,
        status: project.timeline,
        estimated: true
      },
      ai: {
        riskScore: Math.round(riskScore),
        delayProbability: clamp(Math.round(riskScore * 0.9 + pendingSignal * 0.18 + compensationSignal * 0.12)),
        expectedDelayDays: Math.max(10, Math.round(project.paymentDelayDays * 0.7 + project.approvalDelayDays * 0.45 + project.pendingLand * 0.28)),
        mainCauses: ['Compensation release lag', 'Pending land acquisition', 'Legal verification backlog'],
        recommendations: ['Accelerate compensation committee review', 'Resolve title disputes through joint survey', 'Prioritize R&R compliance checkpoint'],
        estimated: true
      }
    };
  }

  function ensurePanel() {
    if (state.panel) return state.panel;
    const toolbar = document.querySelector('#smart-land-dashboard .smart-dashboard-toolbar');
    if (!toolbar) return null;
    const panel = document.createElement('div');
    panel.id = 'lw-land-acquisition-panel';
    panel.className = 'lw-land-acquisition-panel';
    panel.innerHTML = `
      <div class="lw-land-stack">
        <div class="lw-land-card">
          <div class="lw-land-header">
            <span class="lw-land-badge lw-land-live">LIVE DATA</span>
            <span class="lw-land-badge lw-land-estimated">ESTIMATED AI DATA</span>
          </div>
          <div class="lw-land-overview">
            <div>
              <small>Project</small>
              <strong data-land-field="project-name">—</strong>
            </div>
            <div>
              <small>Authority</small>
              <strong data-land-field="project-authority">—</strong>
            </div>
            <div>
              <small>District</small>
              <strong data-land-field="project-district">—</strong>
            </div>
            <div>
              <small>State</small>
              <strong data-land-field="project-state">—</strong>
            </div>
          </div>
        </div>

        <div class="lw-land-card">
          <h4>Land Acquisition</h4>
          <div class="lw-land-grid">
            <div><small>Category</small><strong data-land-field="project-category">—</strong></div>
            <div><small>Stage</small><strong data-land-field="project-stage">—</strong></div>
            <div><small>Required land</small><strong data-land-field="project-land-required">—</strong></div>
            <div><small>Acquired</small><strong data-land-field="project-land-acquired">—</strong></div>
            <div><small>Pending</small><strong data-land-field="project-land-pending">—</strong></div>
            <div><small>Completion</small><strong data-land-field="project-completion">—</strong></div>
          </div>
        </div>

        <div class="lw-land-card">
          <h4>Compensation</h4>
          <div class="lw-land-grid">
            <div><small>Total</small><strong data-land-field="comp-total">—</strong></div>
            <div><small>Released</small><strong data-land-field="comp-released">—</strong></div>
            <div><small>Pending</small><strong data-land-field="comp-pending">—</strong></div>
            <div><small>Affected families</small><strong data-land-field="comp-families">—</strong></div>
            <div><small>Delay days</small><strong data-land-field="comp-delay">—</strong></div>
            <div><small>Label</small><strong data-land-field="comp-label">—</strong></div>
          </div>
        </div>

        <div class="lw-land-card">
          <h4>Legal Risk</h4>
          <div class="lw-land-grid">
            <div><small>Disputes</small><strong data-land-field="legal-disputes">—</strong></div>
            <div><small>Court cases</small><strong data-land-field="legal-cases">—</strong></div>
            <div><small>Ownership conflicts</small><strong data-land-field="legal-conflicts">—</strong></div>
            <div><small>Risk score</small><strong data-land-field="legal-score">—</strong></div>
            <div><small>Label</small><strong data-land-field="legal-label">—</strong></div>
            <div><small>Status</small><strong data-land-field="legal-status">—</strong></div>
          </div>
        </div>

        <div class="lw-land-card">
          <h4>Project Timeline</h4>
          <div class="lw-land-list">
            <div><span>Notification</span><strong data-land-field="timeline-notification">—</strong></div>
            <div><span>Survey</span><strong data-land-field="timeline-survey">—</strong></div>
            <div><span>Award</span><strong data-land-field="timeline-award">—</strong></div>
            <div><span>Compensation</span><strong data-land-field="timeline-compensation">—</strong></div>
            <div><span>Possession</span><strong data-land-field="timeline-possession">—</strong></div>
            <div><span>R&R completion</span><strong data-land-field="timeline-rr">—</strong></div>
          </div>
        </div>

        <div class="lw-land-card">
          <h4>AI Risk Engine</h4>
          <div class="lw-land-grid">
            <div><small>Risk score</small><strong data-land-field="ai-risk">—</strong></div>
            <div><small>Delay probability</small><strong data-land-field="ai-delay">—</strong></div>
            <div><small>Expected delay</small><strong data-land-field="ai-delay-days">—</strong></div>
            <div><small>Main causes</small><strong data-land-field="ai-causes">—</strong></div>
            <div><small>Recommendation</small><strong data-land-field="ai-recommendation">—</strong></div>
            <div><small>Confidence</small><strong data-land-field="ai-confidence">—</strong></div>
          </div>
        </div>
      </div>
    `;
    toolbar.insertAdjacentElement('afterend', panel);
    state.panel = panel;
    return panel;
  }

  function setField(field, value) {
    const target = state.panel?.querySelector(`[data-land-field="${field}"]`);
    if (!target) return;
    target.textContent = value == null || value === '' ? 'N/A' : value;
  }

  function renderProject(projectData) {
    if (!projectData) return;
    const project = projectData.project || {};
    const compensation = projectData.compensation || {};
    const legal = projectData.legal || {};
    const timeline = projectData.timeline || {};
    const ai = projectData.ai || {};

    setField('project-name', project.name);
    setField('project-authority', project.authority);
    setField('project-district', project.district);
    setField('project-state', project.state);
    setField('project-category', project.category);
    setField('project-stage', project.acquisitionStage);
    setField('project-land-required', project.requiredLand);
    setField('project-land-acquired', `${project.acquiredPercent}%`);
    setField('project-land-pending', `${project.pendingLand}%`);
    setField('project-completion', `${project.completionPercent}%`);

    setField('comp-total', compensation.total || '—');
    setField('comp-released', compensation.released || '—');
    setField('comp-pending', compensation.pending || '—');
    setField('comp-families', compensation.affectedFamilies || '—');
    setField('comp-delay', `${compensation.delayDays || 0} days`);
    setField('comp-label', compensation.estimated ? 'Estimated AI data' : 'Live public data');

    setField('legal-disputes', legal.activeDisputes || '—');
    setField('legal-cases', legal.courtCases || '—');
    setField('legal-conflicts', legal.ownershipConflicts || '—');
    setField('legal-score', `${legal.legalRiskScore || 0}/100`);
    setField('legal-label', legal.estimated ? 'Estimated AI data' : 'Live public data');
    setField('legal-status', legal.legalRiskScore > 70 ? 'High risk' : legal.legalRiskScore > 45 ? 'Moderate' : 'Low');

    setField('timeline-notification', timeline.notification || '—');
    setField('timeline-survey', timeline.survey || '—');
    setField('timeline-award', timeline.award || '—');
    setField('timeline-compensation', timeline.compensation || '—');
    setField('timeline-possession', timeline.possession || '—');
    setField('timeline-rr', timeline.rrCompletion || '—');

    setField('ai-risk', `${ai.riskScore || 0}/100`);
    setField('ai-delay', `${ai.delayProbability || 0}%`);
    setField('ai-delay-days', `${ai.expectedDelayDays || 0} days`);
    setField('ai-causes', (ai.mainCauses || []).join(' · ') || 'N/A');
    setField('ai-recommendation', (ai.recommendations || []).join(' · ') || 'N/A');
    setField('ai-confidence', `82%`);
    state.lastUpdated = new Date();
  }

  function getProjectDataForLocation(profile) {
    if (!profile) return null;
    const fallback = getDefaultProject(profile);
    const cityName = profile.name || profile.district || 'Chennai';
    const source = projectCatalog[cityName] || projectCatalog[profile.state] || projectCatalog[profile.district] || projectCatalog.default;
    const base = source[0] || projectCatalog.default[0];
    const data = { project: { ...fallback.project, ...base, state: profile.state, district: profile.district, name: base.name, authority: base.authority, category: base.category, acquisitionStage: base.stage }, compensation: { ...fallback.compensation }, legal: { ...fallback.legal }, timeline: { ...fallback.timeline }, ai: { ...fallback.ai } };
    data.project.requiredLand = `${(base.requiredLand || 18).toFixed(1)} ha`;
    data.project.requiredLandValue = Number(base.requiredLand) || 18;
    data.project.acquiredPercent = clamp(base.acquiredPercent || 62, 0, 100);
    data.project.pendingLand = Math.max(5, 100 - data.project.acquiredPercent);
    data.project.completionPercent = clamp(base.completionPercent || data.project.acquiredPercent, 0, 100);
    data.project.totalCompensation = `${((data.project.requiredLandValue * 6.8) || 140).toFixed(0)} Lakhs`;
    data.project.releasedAmount = `${((data.project.requiredLandValue * 4.9) || 102).toFixed(0)} Lakhs`;
    data.project.pendingAmount = `${((data.project.requiredLandValue * 1.9) || 38).toFixed(0)} Lakhs`;
    data.project.affectedFamilies = Math.max(120, Math.round(data.project.requiredLandValue * 22));
    data.project.paymentDelayDays = Math.max(8, Math.round((100 - data.project.acquiredPercent) * 0.85 + (base.risk || 65) * 0.18));
    data.project.approvalDelayDays = Math.max(10, Math.round((100 - data.project.acquiredPercent) * 0.45 + 12));
    data.project.rrProgress = clamp(100 - data.project.pendingLand * 0.7, 10, 95);
    data.project.stakeholderIssues = Math.max(2, Math.round((100 - data.project.acquiredPercent) * 0.18));
    data.project.activeDisputes = Math.max(1, Math.round((100 - data.project.acquiredPercent) * 0.25));
    data.project.courtCases = Math.max(1, Math.round((100 - data.project.acquiredPercent) * 0.16));
    data.project.ownershipConflicts = Math.max(1, Math.round((100 - data.project.acquiredPercent) * 0.24));
    data.project.legalRiskScore = clamp((base.risk || 65) + 5);

    const legalSignal = clamp(data.project.legalRiskScore);
    const compensationSignal = clamp(data.project.paymentDelayDays * 1.2, 0, 100);
    const pendingSignal = clamp(data.project.pendingLand, 0, 100);
    const approvalSignal = clamp(data.project.approvalDelayDays * 1.7, 0, 100);
    const rrSignal = clamp(100 - data.project.rrProgress, 0, 100);
    const stakeholderSignal = clamp(data.project.stakeholderIssues * 5, 0, 100);
    const riskScore = clamp(
      legalSignal * 0.25 +
      compensationSignal * 0.25 +
      pendingSignal * 0.2 +
      approvalSignal * 0.15 +
      rrSignal * 0.1 +
      stakeholderSignal * 0.05
    );

    data.compensation.total = data.project.totalCompensation;
    data.compensation.released = data.project.releasedAmount;
    data.compensation.pending = data.project.pendingAmount;
    data.compensation.affectedFamilies = data.project.affectedFamilies;
    data.compensation.delayDays = data.project.paymentDelayDays;
    data.compensation.estimated = true;

    data.legal.activeDisputes = data.project.activeDisputes;
    data.legal.courtCases = data.project.courtCases;
    data.legal.ownershipConflicts = data.project.ownershipConflicts;
    data.legal.legalRiskScore = data.project.legalRiskScore;
    data.legal.estimated = true;

    data.ai.riskScore = Math.round(riskScore);
    data.ai.delayProbability = clamp(Math.round(riskScore * 0.9 + pendingSignal * 0.18 + compensationSignal * 0.12));
    data.ai.expectedDelayDays = Math.max(10, Math.round(data.project.paymentDelayDays * 0.7 + data.project.approvalDelayDays * 0.45 + data.project.pendingLand * 0.28));
    data.ai.mainCauses = ['Compensation release lag', 'Pending land acquisition', 'Legal verification backlog'];
    data.ai.recommendations = ['Accelerate compensation committee review', 'Resolve title disputes through joint survey', 'Prioritize R&R compliance checkpoint'];
    data.ai.estimated = true;
    return data;
  }

  function updateMapMarkers(profile) {
    if (!window.leafletMap || typeof L === 'undefined') return;
    if (state.layer) {
      window.leafletMap.removeLayer(state.layer);
      state.layer = null;
    }
    const project = getProjectDataForLocation(profile);
    state.project = project;
    window.landWatchState = window.landWatchState || {};
    window.landWatchState.liveProjectData = project;

    const layer = L.layerGroup();
    const marker = L.circleMarker(profile.coords, {
      radius: 10,
      color: '#ffffff',
      weight: 3,
      fillColor: project.ai.riskScore > 70 ? '#ba1a1a' : project.ai.riskScore > 45 ? '#d97706' : '#059669',
      fillOpacity: 0.9
    });

    marker.bindPopup(`
      <div class="gis-popup">
        <strong>${escapeHtml(project.project.name)}</strong>
        <span class="gis-popup-category">${escapeHtml(project.project.district)} · ${escapeHtml(project.project.category)}</span>
        <p>Land required: ${escapeHtml(project.project.requiredLand)} · Land acquired: ${project.project.acquiredPercent}%</p>
        <p>Pending: ${project.project.pendingLand}% · Risk: ${project.ai.riskScore}/100</p>
      </div>
    `);
    marker.addTo(layer);
    layer.addTo(window.leafletMap);
    state.layer = layer;
  }

  function syncLocation(profile) {
    if (!profile) return;
    ensurePanel();
    const project = getProjectDataForLocation(profile);
    renderProject(project);
    updateMapMarkers(profile);
    window.landWatchState = window.landWatchState || {};
    window.landWatchState.liveProjectData = project;
    window.landWatchState.landAcquisitionData = project;
    window.dispatchEvent(new CustomEvent('landwatch:land-acquisition-update', { detail: project }));
  }

  function bind() {
    ensurePanel();
    window.addEventListener('landwatch:location-changed', event => {
      const profile = event.detail;
      if (profile) syncLocation(profile);
    });

    if (window.landWatchState?.selectedProfile) {
      syncLocation(window.landWatchState.selectedProfile);
    }
  }

  window.landWatchLandData = {
    getProject: () => state.project,
    refresh: () => {
      const profile = window.landWatchState?.selectedProfile;
      if (profile) syncLocation(profile);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();

