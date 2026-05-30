/**
 * 心理测评管理后台 - JavaScript
 */

// ============================================
// 状态管理
// ============================================
const state = {
  isLoggedIn: false,
  assessments: [],
  shareLinks: [],
  deleteTargetId: null,
};

// ============================================
// DOM 元素引用
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  // 页面区域
  loginSection: $('#login-section'),
  dashboardSection: $('#dashboard-section'),

  // 登录表单
  loginForm: $('#login-form'),
  usernameInput: $('#username'),
  passwordInput: $('#password'),

  // 顶部栏
  adminName: $('#admin-name'),
  btnLogout: $('#btn-logout'),

  // 测评列表
  assessmentTbody: $('#assessment-tbody'),
  assessmentCount: $('#assessment-count'),
  emptyState: $('#empty-state'),

  // 操作按钮
  btnCreate: $('#btn-create'),
  btnImport: $('#btn-import'),
  btnRefreshShare: $('#btn-refresh-share'),

  // 分享链接列表
  shareTbody: $('#share-tbody'),
  shareCount: $('#share-count'),
  shareEmptyState: $('#share-empty-state'),

  // 弹窗
  modalAssessment: $('#modal-assessment'),
  modalImport: $('#modal-import'),
  modalShare: $('#modal-share'),
  modalDelete: $('#modal-delete'),

  // 新建/编辑表单
  formAssessment: $('#form-assessment'),
  assessmentIdInput: $('#assessment-id'),
  assessmentTitleInput: $('#assessment-title'),
  assessmentSubtitleInput: $('#assessment-subtitle'),
  assessmentDescInput: $('#assessment-description'),
  modalAssessmentTitle: $('#modal-assessment-title'),
  btnAddQuestion: $('#btn-add-question'),
  btnAddResult: $('#btn-add-result'),
  btnSaveAssessment: $('#btn-save-assessment'),
  questionsContainer: $('#questions-container'),
  resultsContainer: $('#results-container'),

  // 导入
  importJsonTextarea: $('#import-json'),
  btnConfirmImport: $('#btn-confirm-import'),

  // 分享
  shareLinkResult: $('#share-link-result'),
  shareLinkLoading: $('#share-link-loading'),
  shareLinkUrl: $('#share-link-url'),
  btnCopyShareLink: $('#btn-copy-share-link'),

  // 删除
  deleteAssessmentName: $('#delete-assessment-name'),
  btnConfirmDelete: $('#btn-confirm-delete'),

  // Toast
  toastContainer: $('#toast-container'),
};

// ============================================
// Toast 通知
// ============================================
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ============================================
// 弹窗管理
// ============================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// 关闭按钮绑定
$$('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    closeModal(modalId);
  });
});

// 点击遮罩关闭
$$('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

// ESC 关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.modal-overlay.active').forEach((modal) => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ============================================
// API 请求封装
// ============================================
const API_BASE = '/api/admin';

async function apiRequest(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
      handleLogout();
      showToast('登录已过期，请重新登录', 'error');
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败 (${response.status})`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showToast('网络连接失败，请检查网络设置', 'error');
    } else {
      showToast(error.message || '操作失败', 'error');
    }
    throw error;
  }
}

// ============================================
// 登录 / 登出
// ============================================
async function handleLogin(e) {
  e.preventDefault();

  const username = dom.usernameInput.value.trim();
  const password = dom.passwordInput.value.trim();

  if (!username || !password) {
    showToast('请输入用户名和密码', 'warning');
    return;
  }

  try {
    await apiRequest(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    state.isLoggedIn = true;
    dom.adminName.textContent = username;
    showDashboard();
    showToast('登录成功');
    await fetchAssessments();
    await fetchShareLinks();
  } catch (err) {
    // 错误已在 apiRequest 中处理
  }
}

function handleLogout() {
  state.isLoggedIn = false;
  state.assessments = [];
  state.shareLinks = [];
  dom.loginSection.style.display = '';
  dom.dashboardSection.style.display = 'none';
  dom.loginForm.reset();
}

async function handleLogoutClick() {
  try {
    await apiRequest(`${API_BASE}/logout`, { method: 'POST' });
  } catch (err) {
    // 忽略错误，仍然登出
  }
  handleLogout();
  showToast('已退出登录');
}

function showDashboard() {
  dom.loginSection.style.display = 'none';
  dom.dashboardSection.style.display = '';
}

// ============================================
// 测评 CRUD
// ============================================
async function fetchAssessments() {
  try {
    const data = await apiRequest(`${API_BASE}/assessments`);
    state.assessments = (data && data.assessments) ? data.assessments : (Array.isArray(data) ? data : []);
    renderAssessments();
  } catch (err) {
    // 错误已处理
  }
}

async function createAssessment(data) {
  try {
    await apiRequest(`${API_BASE}/assessments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    showToast('测评创建成功');
    closeModal('modal-assessment');
    await fetchAssessments();
  } catch (err) {
    // 错误已处理
  }
}

async function updateAssessment(id, data) {
  try {
    await apiRequest(`${API_BASE}/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    showToast('测评更新成功');
    closeModal('modal-assessment');
    await fetchAssessments();
  } catch (err) {
    // 错误已处理
  }
}

async function deleteAssessment(id) {
  try {
    await apiRequest(`${API_BASE}/assessments/${id}`, {
      method: 'DELETE',
    });
    showToast('测评已删除');
    closeModal('modal-delete');
    state.deleteTargetId = null;
    await fetchAssessments();
  } catch (err) {
    // 错误已处理
  }
}

async function importAssessment() {
  const jsonStr = dom.importJsonTextarea.value.trim();

  if (!jsonStr) {
    showToast('请粘贴 JSON 数据', 'warning');
    return;
  }

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    showToast('JSON 格式错误，请检查数据格式', 'error');
    return;
  }

  try {
    await apiRequest(`${API_BASE}/assessments/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    showToast('问卷导入成功');
    closeModal('modal-import');
    dom.importJsonTextarea.value = '';
    await fetchAssessments();
  } catch (err) {
    // 错误已处理
  }
}

// ============================================
// 分享链接
// ============================================
async function generateShareLink(assessmentId) {
  openModal('modal-share');
  dom.shareLinkResult.style.display = 'none';
  dom.shareLinkLoading.style.display = '';

  try {
    const data = await apiRequest(`${API_BASE}/share/${assessmentId}`, {
      method: 'POST',
    });

    if (data && data.url) {
      dom.shareLinkUrl.value = data.url;
      dom.shareLinkResult.style.display = '';
      dom.shareLinkLoading.style.display = 'none';
    }
  } catch (err) {
    closeModal('modal-share');
    // 错误已处理
  }
}

async function fetchShareLinks() {
  try {
    const data = await apiRequest(`${API_BASE}/share`);
    state.shareLinks = (data && data.links) ? data.links : (data && data.shareLinks) ? data.shareLinks : (Array.isArray(data) ? data : []);
    renderShareLinks();
  } catch (err) {
    // 错误已处理
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('链接已复制到剪贴板');
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('链接已复制到剪贴板');
    } catch (e) {
      showToast('复制失败，请手动复制', 'error');
    }
    document.body.removeChild(textarea);
  }
}

// ============================================
// 渲染函数
// ============================================
function renderAssessments() {
  const assessments = state.assessments;
  dom.assessmentCount.textContent = assessments.length;

  if (assessments.length === 0) {
    dom.assessmentTbody.innerHTML = '';
    dom.emptyState.style.display = '';
    return;
  }

  dom.emptyState.style.display = 'none';
  dom.assessmentTbody.innerHTML = assessments
    .map(
      (a) => `
    <tr>
      <td class="td-title" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</td>
      <td class="td-desc" title="${escapeHtml(a.description || '')}">${escapeHtml(a.description || '-')}</td>
      <td>${a.question_count || a.questionCount || (a.questions ? a.questions.length : 0)} 题</td>
      <td>${formatDate(a.created_at || a.createdAt)}</td>
      <td>
        <div class="td-actions">
          <button class="btn-icon" title="编辑" onclick="editAssessment('${a.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon" title="分享" onclick="handleShare('${a.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          <button class="btn-icon danger" title="删除" onclick="confirmDelete('${a.id}', '${escapeHtml(a.title)}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function renderShareLinks() {
  const links = state.shareLinks;
  dom.shareCount.textContent = links.length;

  if (links.length === 0) {
    dom.shareTbody.innerHTML = '';
    dom.shareEmptyState.style.display = '';
    return;
  }

  dom.shareEmptyState.style.display = 'none';
  dom.shareTbody.innerHTML = links
    .map(
      (link) => `
    <tr>
      <td class="td-title">${escapeHtml(link.assessment_title || link.assessmentTitle || '-')}</td>
      <td class="td-link" title="${escapeHtml(link.url || '')}">${escapeHtml(link.url || '-')}</td>
      <td>
        <span class="status-tag ${link.used ? 'used' : 'unused'}">
          ${link.used ? '已使用' : '未使用'}
        </span>
      </td>
      <td>${formatDate(link.created_at || link.createdAt)}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-secondary btn-xs" onclick="copyToClipboard('${escapeHtml(link.url || '')}')">
            复制链接
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

// ============================================
// 测评编辑弹窗 - 题目/结果动态表单
// ============================================
let questionCounter = 0;
let resultCounter = 0;

function resetFormCounters() {
  questionCounter = 0;
  resultCounter = 0;
}

function addQuestionBlock(question = null) {
  questionCounter++;
  const idx = questionCounter;
  const qText = question ? escapeHtml(question.text) : '';
  const options = question ? question.options : [];

  const block = document.createElement('div');
  block.className = 'question-block';
  block.dataset.questionIdx = idx;
  block.innerHTML = `
    <div class="question-block-header">
      <span>题目 ${idx}</span>
      <button type="button" class="btn-icon danger" onclick="this.closest('.question-block').remove()" title="删除题目">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="form-group">
      <input type="text" class="question-text" placeholder="请输入问题内容" value="${qText}">
    </div>
    <div class="form-group">
      <label>选项</label>
      <div class="options-list">
        ${options.length > 0
          ? options
              .map(
                (opt) => `
          <div class="option-row">
            <input type="text" class="option-text" placeholder="选项内容" value="${escapeHtml(opt.text)}">
            <input type="number" class="option-score" placeholder="分值" value="${opt.score}">
            <button type="button" class="btn-icon danger btn-remove-option" onclick="this.parentElement.remove()" title="删除选项">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `
              )
              .join('')
          : `
          <div class="option-row">
            <input type="text" class="option-text" placeholder="选项内容">
            <input type="number" class="option-score" placeholder="分值">
            <button type="button" class="btn-icon danger btn-remove-option" onclick="this.parentElement.remove()" title="删除选项">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `}
      </div>
      <button type="button" class="btn btn-secondary btn-xs" onclick="addOptionToBlock(this)" style="margin-top: 6px;">
        + 添加选项
      </button>
    </div>
  `;

  dom.questionsContainer.appendChild(block);
}

function addOptionToBlock(btn) {
  const optionsList = btn.previousElementSibling;
  const row = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `
    <input type="text" class="option-text" placeholder="选项内容">
    <input type="number" class="option-score" placeholder="分值">
    <button type="button" class="btn-icon danger btn-remove-option" onclick="this.parentElement.remove()" title="删除选项">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  optionsList.appendChild(row);
}

function addResultBlock(result = null) {
  resultCounter++;
  const idx = resultCounter;
  const rTitle = result ? escapeHtml(result.title) : '';
  const rDesc = result ? escapeHtml(result.description) : '';
  const minScore = result ? result.minScore : '';
  const maxScore = result ? result.maxScore : '';

  const block = document.createElement('div');
  block.className = 'result-block';
  block.dataset.resultIdx = idx;
  block.innerHTML = `
    <div class="result-block-header">
      <span>结果 ${idx}</span>
      <button type="button" class="btn-icon danger" onclick="this.closest('.result-block').remove()" title="删除结果">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="form-group">
      <input type="text" class="result-title" placeholder="结果标题" value="${rTitle}">
    </div>
    <div class="form-group">
      <textarea class="result-description" rows="2" placeholder="结果描述">${rDesc}</textarea>
    </div>
    <div class="score-row">
      <div class="form-group">
        <label>最低分</label>
        <input type="number" class="result-min-score" placeholder="最低分" value="${minScore}">
      </div>
      <div class="form-group">
        <label>最高分</label>
        <input type="number" class="result-max-score" placeholder="最高分" value="${maxScore}">
      </div>
    </div>
  `;

  dom.resultsContainer.appendChild(block);
}

function collectFormData() {
  const title = dom.assessmentTitleInput.value.trim();
  const subtitle = dom.assessmentSubtitleInput.value.trim();
  const description = dom.assessmentDescInput.value.trim();

  if (!title) {
    showToast('请输入测评标题', 'warning');
    return null;
  }

  // 收集题目
  const questions = [];
  dom.questionsContainer.querySelectorAll('.question-block').forEach((block) => {
    const text = block.querySelector('.question-text').value.trim();
    if (!text) return;

    const options = [];
    block.querySelectorAll('.option-row').forEach((row) => {
      const optText = row.querySelector('.option-text').value.trim();
      const optScore = parseInt(row.querySelector('.option-score').value, 10);
      if (optText && !isNaN(optScore)) {
        options.push({ text: optText, score: optScore });
      }
    });

    if (options.length > 0) {
      questions.push({ text, options });
    }
  });

  // 收集结果
  const results = [];
  dom.resultsContainer.querySelectorAll('.result-block').forEach((block) => {
    const rTitle = block.querySelector('.result-title').value.trim();
    const rDesc = block.querySelector('.result-description').value.trim();
    const minScore = parseInt(block.querySelector('.result-min-score').value, 10);
    const maxScore = parseInt(block.querySelector('.result-max-score').value, 10);

    if (rTitle && !isNaN(minScore) && !isNaN(maxScore)) {
      results.push({ title: rTitle, description: rDesc, minScore, maxScore });
    }
  });

  return { title, subtitle, description, questions, results };
}

// ============================================
// 操作处理函数
// ============================================
function openCreateModal() {
  dom.assessmentIdInput.value = '';
  dom.assessmentTitleInput.value = '';
  dom.assessmentSubtitleInput.value = '';
  dom.assessmentDescInput.value = '';
  dom.questionsContainer.innerHTML = '';
  dom.resultsContainer.innerHTML = '';
  dom.modalAssessmentTitle.textContent = '新建测评';
  resetFormCounters();

  // 默认添加一个题目和两个选项
  addQuestionBlock();
  addResultBlock();

  openModal('modal-assessment');
}

function editAssessment(id) {
  const assessment = state.assessments.find(
    (a) => String(a.id) === String(id)
  );
  if (!assessment) {
    showToast('未找到该测评', 'error');
    return;
  }

  dom.assessmentIdInput.value = assessment.id;
  dom.assessmentTitleInput.value = assessment.title || '';
  dom.assessmentSubtitleInput.value = assessment.subtitle || '';
  dom.assessmentDescInput.value = assessment.description || '';
  dom.questionsContainer.innerHTML = '';
  dom.resultsContainer.innerHTML = '';
  dom.modalAssessmentTitle.textContent = '编辑测评';
  resetFormCounters();

  // 填充已有题目
  if (assessment.questions && assessment.questions.length > 0) {
    assessment.questions.forEach((q) => addQuestionBlock(q));
  } else {
    addQuestionBlock();
  }

  // 填充已有结果
  if (assessment.results && assessment.results.length > 0) {
    assessment.results.forEach((r) => addResultBlock(r));
  } else {
    addResultBlock();
  }

  openModal('modal-assessment');
}

async function saveAssessment() {
  const data = collectFormData();
  if (!data) return;

  const id = dom.assessmentIdInput.value;
  if (id) {
    await updateAssessment(id, data);
  } else {
    await createAssessment(data);
  }
}

function confirmDelete(id, name) {
  state.deleteTargetId = id;
  dom.deleteAssessmentName.textContent = name;
  openModal('modal-delete');
}

async function executeDelete() {
  if (state.deleteTargetId) {
    await deleteAssessment(state.deleteTargetId);
  }
}

function handleShare(id) {
  generateShareLink(id);
}

// ============================================
// 工具函数
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  } catch (e) {
    return dateStr;
  }
}

// ============================================
// 事件绑定
// ============================================
dom.loginForm.addEventListener('submit', handleLogin);
dom.btnLogout.addEventListener('click', handleLogoutClick);
dom.btnCreate.addEventListener('click', openCreateModal);
dom.btnImport.addEventListener('click', () => {
  dom.importJsonTextarea.value = '';
  openModal('modal-import');
});
dom.btnConfirmImport.addEventListener('click', importAssessment);
dom.btnAddQuestion.addEventListener('click', () => addQuestionBlock());
dom.btnAddResult.addEventListener('click', () => addResultBlock());
dom.btnSaveAssessment.addEventListener('click', saveAssessment);
dom.btnConfirmDelete.addEventListener('click', executeDelete);
dom.btnCopyShareLink.addEventListener('click', () => {
  const url = dom.shareLinkUrl.value;
  if (url) copyToClipboard(url);
});
dom.btnRefreshShare.addEventListener('click', fetchShareLinks);

// ============================================
// 初始化 - 检查登录状态
// ============================================
async function init() {
  try {
    const data = await apiRequest(`${API_BASE}/assessments`);
    // 如果请求成功，说明已登录
    state.isLoggedIn = true;
    state.assessments = (data && data.assessments) ? data.assessments : (Array.isArray(data) ? data : []);
    dom.adminName.textContent = '管理员';
    showDashboard();
    renderAssessments();
    await fetchShareLinks();
  } catch (err) {
    // 请求失败（401 或网络错误），显示登录页面
    handleLogout();
  }
}

init();
