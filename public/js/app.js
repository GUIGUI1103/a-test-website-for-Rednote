/* ========================================
   心理测评 - 前端逻辑
   单页应用 / 状态管理 / 丝滑过渡
   ======================================== */

(function () {
  'use strict';

  // --- State ---
  const state = {
    currentQuestion: 0,
    answers: {},          // { questionId: optionId }
    assessmentData: null,  // { title, questions: [{ id, text, options: [{ id, text }] }] }
    token: null,
    loading: false
  };

  // --- DOM References ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    welcomeScreen: $('#welcome-screen'),
    quizScreen: $('#quiz-screen'),
    resultScreen: $('#result-screen'),
    startBtn: $('#start-btn'),
    assessmentSubtitle: $('#assessment-subtitle'),
    assessmentMeta: $('#assessment-meta'),
    progressBar: $('#progress-bar'),
    progressText: $('#progress-text'),
    questionCard: $('#question-card'),
    questionText: $('#question-text'),
    optionsContainer: $('#options-container'),
    prevBtn: $('#prev-btn'),
    nextBtn: $('#next-btn'),
    resultTitle: $('#result-title'),
    resultCard: $('#result-card'),
    resultDescription: $('#result-description'),
    app: $('#app')
  };

  // --- Initialization ---
  async function init() {
    // 支持两种 URL 格式：
    // 1. /quiz/TOKEN (路径参数)
    // 2. /?token=TOKEN (查询参数)
    const pathMatch = window.location.pathname.match(/\/quiz\/([a-f0-9\-]+)/i);
    const params = new URLSearchParams(window.location.search);
    state.token = pathMatch ? pathMatch[1] : params.get('token');

    if (!state.token) {
      showMessage('👋', '找不到测评', '请确认你拥有有效的测评链接后再试一次。');
      return;
    }

    try {
      const res = await fetch(`/api/quiz/${state.token}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      state.assessmentData = json.assessment || json;
      showWelcome();
    } catch (err) {
      console.error('Failed to load assessment:', err);
      showMessage('😔', '加载失败', '无法获取测评内容，请检查网络或稍后再试。');
    }
  }

  // --- Show Welcome ---
  function showWelcome() {
    const data = state.assessmentData;
    const totalQuestions = data.questions ? data.questions.length : 0;
    const estimatedMinutes = Math.max(1, Math.ceil(totalQuestions * 0.5));

    // 显示副标题
    if (data.subtitle) {
      dom.assessmentSubtitle.textContent = data.subtitle;
      dom.assessmentSubtitle.style.display = '';
    } else {
      dom.assessmentSubtitle.style.display = 'none';
    }

    const title = data.title || '测评';
    dom.startBtn.textContent = `开始「${title}」`;
    dom.assessmentMeta.textContent =
      `共 ${totalQuestions} 题 · 预计 ${estimatedMinutes} 分钟`;

    switchScreen('welcome');
  }

  // --- Start Quiz ---
  function startQuiz() {
    state.currentQuestion = 0;
    state.answers = {};
    renderQuestion(0);
    switchScreen('quiz');
  }

  // --- Render Question ---
  function renderQuestion(index) {
    const questions = state.assessmentData.questions;
    const total = questions.length;
    const question = questions[index];

    // Update progress
    const percent = ((index + 1) / total) * 100;
    dom.progressBar.style.width = percent + '%';
    dom.progressText.textContent = `${index + 1}/${total}`;

    // Animate question transition
    dom.questionCard.classList.remove('visible');
    dom.optionsContainer.classList.remove('visible');
    dom.questionCard.classList.add('transitioning-in');
    dom.optionsContainer.classList.add('transitioning-in');

    // Use rAF to ensure the "in" class is painted before switching to visible
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dom.questionText.textContent = question.text;
        renderOptions(question);
        dom.questionCard.classList.remove('transitioning-in');
        dom.optionsContainer.classList.remove('transitioning-in');
        dom.questionCard.classList.add('visible');
        dom.optionsContainer.classList.add('visible');
      });
    });

    // Navigation button states
    dom.prevBtn.disabled = index === 0;

    // Last question: change next button text
    if (index === total - 1) {
      dom.nextBtn.textContent = '提交';
    } else {
      dom.nextBtn.textContent = '下一题';
    }

    // Disable next if current question not answered
    const answered = state.answers[question.id] !== undefined;
    dom.nextBtn.disabled = !answered;
  }

  // --- Render Options ---
  function renderOptions(question) {
    dom.optionsContainer.innerHTML = '';

    question.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = option.text;
      btn.dataset.questionId = question.id;
      btn.dataset.optionId = option.id;

      // Restore previous selection
      if (state.answers[question.id] === option.id) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => selectOption(question.id, option.id, btn));
      dom.optionsContainer.appendChild(btn);
    });
  }

  // --- Select Option ---
  function selectOption(questionId, optionId, clickedBtn) {
    // Deselect siblings
    const siblings = dom.optionsContainer.querySelectorAll('.option-btn');
    siblings.forEach((btn) => btn.classList.remove('selected'));

    // Select clicked
    clickedBtn.classList.add('selected');

    // Store answer
    state.answers[questionId] = optionId;

    // Enable next button
    dom.nextBtn.disabled = false;
  }

  // --- Next Question ---
  function nextQuestion() {
    const questions = state.assessmentData.questions;
    const current = questions[state.currentQuestion];

    // Validate
    if (state.answers[current.id] === undefined) {
      shakeElement(dom.nextBtn);
      return;
    }

    // If last question, submit
    if (state.currentQuestion === questions.length - 1) {
      submitQuiz();
      return;
    }

    // Animate out
    dom.questionCard.classList.remove('visible');
    dom.optionsContainer.classList.remove('visible');
    dom.questionCard.classList.add('transitioning-out');
    dom.optionsContainer.classList.add('transitioning-out');

    setTimeout(() => {
      state.currentQuestion++;
      renderQuestion(state.currentQuestion);
    }, 250);
  }

  // --- Previous Question ---
  function prevQuestion() {
    if (state.currentQuestion === 0) return;

    // Animate out (reverse direction via same class, could be enhanced)
    dom.questionCard.classList.remove('visible');
    dom.optionsContainer.classList.remove('visible');
    dom.questionCard.classList.add('transitioning-out');
    dom.optionsContainer.classList.add('transitioning-out');

    setTimeout(() => {
      state.currentQuestion--;
      renderQuestion(state.currentQuestion);
    }, 250);
  }

  // --- Submit Quiz ---
  async function submitQuiz() {
    if (state.loading) return;
    state.loading = true;

    // Show loading on next button
    const originalText = dom.nextBtn.textContent;
    dom.nextBtn.disabled = true;
    dom.nextBtn.innerHTML = '<span class="loading-spinner"></span>提交中...';

    try {
      // 将 { questionId: optionId } 格式转换为 [{ questionId, optionId }] 数组
      const answersArray = Object.entries(state.answers).map(([questionId, optionId]) => ({
        questionId: Number(questionId),
        optionId: Number(optionId)
      }));

      const payload = {
        answers: answersArray
      };

      const res = await fetch(`/api/quiz/${state.token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();
      showResult(result);
    } catch (err) {
      console.error('Submit failed:', err);
      dom.nextBtn.textContent = originalText;
      dom.nextBtn.disabled = false;
      state.loading = false;
      showMessage('😔', '提交失败', '网络异常，请稍后重试。');
    }
  }

  // --- Show Result ---
  function showResult(result) {
    const r = result.result || result;
    dom.resultTitle.textContent = r.title || '测评完成';
    dom.resultDescription.textContent = r.description || '感谢你的参与，你的测评结果已生成。';

    // Re-trigger animations by removing and re-adding active class
    dom.resultScreen.classList.remove('active');
    void dom.resultScreen.offsetWidth; // force reflow
    switchScreen('result');

    state.loading = false;
  }

  // --- Screen Switching ---
  function switchScreen(target) {
    const screens = {
      welcome: dom.welcomeScreen,
      quiz: dom.quizScreen,
      result: dom.resultScreen
    };

    Object.keys(screens).forEach((key) => {
      if (key === target) {
        screens[key].classList.add('active');
      } else {
        screens[key].classList.remove('active');
      }
    });
  }

  // --- Show Message (error / empty state) ---
  function showMessage(icon, title, text) {
    // Remove all screens
    dom.welcomeScreen.classList.remove('active');
    dom.quizScreen.classList.remove('active');
    dom.resultScreen.classList.remove('active');

    // Build message
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-screen';
    msgDiv.innerHTML = `
      <div class="message-icon">${icon}</div>
      <div class="message-title">${title}</div>
      <div class="message-text">${text}</div>
    `;
    dom.app.appendChild(msgDiv);
  }

  // --- Shake Animation (for validation feedback) ---
  function shakeElement(el) {
    el.style.transition = 'transform 0.08s ease';
    el.style.transform = 'translateX(-4px)';
    setTimeout(() => {
      el.style.transform = 'translateX(4px)';
      setTimeout(() => {
        el.style.transform = 'translateX(-2px)';
        setTimeout(() => {
          el.style.transform = 'translateX(0)';
        }, 80);
      }, 80);
    }, 80);
  }

  // --- Event Bindings ---
  dom.startBtn.addEventListener('click', startQuiz);
  dom.nextBtn.addEventListener('click', nextQuestion);
  dom.prevBtn.addEventListener('click', prevQuestion);

  // --- Boot ---
  document.addEventListener('DOMContentLoaded', init);

})();
