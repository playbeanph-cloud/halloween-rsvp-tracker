(() => {
  const API_URL = String(window.HALLOWEEN_RSVP_CONFIG?.apiUrl || "https://pb-booking-server.onrender.com").replace(/\/$/, "");
  const ENDPOINT = "/admin/events/spooktacular-2026-10-25/rsvps";
  const TOKEN_KEY = "playbean-halloween-rsvp-token";
  const state = { responses: [], filter: "all", search: "", loading: false };

  const accessPanel = document.getElementById("access-panel");
  const responsePanel = document.getElementById("response-panel");
  const accessForm = document.getElementById("access-form");
  const accessInput = document.getElementById("access-code");
  const accessMessage = document.getElementById("access-message");
  const panelMessage = document.getElementById("panel-message");
  const responseList = document.getElementById("response-list");
  const searchInput = document.getElementById("response-search");
  const filterSelect = document.getElementById("response-filter");
  const refreshButton = document.getElementById("refresh-button");

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  function token() { return sessionStorage.getItem(TOKEN_KEY) || ""; }

  function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short",
    }).format(new Date(value));
  }

  function renderRows() {
    const query = state.search.trim().toLowerCase();
    const visible = state.responses.filter((record) => {
      const name = record.fullName || `${record.firstName || ""} ${record.lastName || ""}`.trim();
      return (state.filter === "all" || record.response === state.filter)
        && (!query || name.toLowerCase().includes(query) || String(record.email || "").toLowerCase().includes(query));
    });

    responseList.innerHTML = visible.length ? visible.map((record) => {
      const fullName = record.fullName || `${record.firstName || ""} ${record.lastName || ""}`.trim() || "Name not supplied";
      const label = record.response === "yes" ? "Attending" : "Not attending";
      return `<tr>
        <td data-label="Contact"><span class="contact-name">${escapeHtml(fullName)}</span><span class="contact-email">${escapeHtml(record.email)}</span></td>
        <td data-label="Response"><span class="response-badge ${escapeHtml(record.response)}">${label}</span></td>
        <td data-label="Responded"><span class="response-date">${escapeHtml(formatDate(record.respondedAt))}</span></td>
      </tr>`;
    }).join("") : '<tr class="empty-row"><td colspan="3">No responses match this view.</td></tr>';
  }

  function showTracker(report) {
    accessPanel.hidden = true;
    responsePanel.hidden = false;
    state.responses = Array.isArray(report.responses) ? report.responses : [];
    document.getElementById("yes-count").textContent = report.summary?.yes ?? 0;
    document.getElementById("no-count").textContent = report.summary?.no ?? 0;
    document.getElementById("total-count").textContent = report.summary?.total ?? 0;
    document.getElementById("last-updated").textContent = `Updated ${formatDate(new Date())}`;
    renderRows();
  }

  function lockTracker(message = "") {
    sessionStorage.removeItem(TOKEN_KEY);
    responsePanel.hidden = true;
    accessPanel.hidden = false;
    accessInput.value = "";
    accessMessage.textContent = message;
    accessInput.focus();
  }

  async function loadResponses(candidateToken = token()) {
    if (state.loading || !candidateToken) return false;
    state.loading = true;
    refreshButton.disabled = true;
    panelMessage.textContent = "";
    try {
      const response = await fetch(API_URL + ENDPOINT, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${candidateToken}` },
        signal: AbortSignal.timeout(30000),
      });
      const report = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(report.error || "Could not load responses"), { status: response.status });
      sessionStorage.setItem(TOKEN_KEY, candidateToken);
      showTracker(report);
      return true;
    } catch (error) {
      if (error.status === 401) lockTracker("That access code is not correct.");
      else if (error.status === 503) lockTracker("Add HALLOWEEN_RSVP_ADMIN_TOKEN to the Render server first.");
      else if (responsePanel.hidden) accessMessage.textContent = "The response list could not be reached. Please try again.";
      else panelMessage.textContent = "The latest responses could not be loaded. Check your connection and try again.";
      return false;
    } finally {
      state.loading = false;
      refreshButton.disabled = false;
    }
  }

  accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    accessMessage.textContent = "";
    const submit = accessForm.querySelector("button");
    submit.disabled = true;
    submit.textContent = "Opening…";
    await loadResponses(accessInput.value.trim());
    submit.disabled = false;
    submit.textContent = "View responses";
  });

  searchInput.addEventListener("input", (event) => { state.search = event.target.value; renderRows(); });
  filterSelect.addEventListener("change", (event) => { state.filter = event.target.value; renderRows(); });
  refreshButton.addEventListener("click", () => loadResponses());
  document.getElementById("sign-out-button").addEventListener("click", () => lockTracker());

  if (token()) loadResponses();
})();
