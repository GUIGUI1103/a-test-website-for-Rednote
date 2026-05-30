/**
 * 用户端 API 路由
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/memory-db');

// ========================================
// 获取测评内容
// ========================================

router.get('/:token', (req, res) => {
  const { token } = req.params;
  const db = getDb();

  // 查找分享链接
  const shareLink = db.prepare('SELECT * FROM share_links WHERE token = ?').get(token);

  if (!shareLink) {
    return res.status(404).json({ error: '链接不存在或已失效' });
  }

  // 获取测评基本信息
  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(shareLink.assessment_id);

  if (!assessment) {
    return res.status(404).json({ error: '测评不存在' });
  }

  // 获取题目列表
  const questions = db.prepare('SELECT * FROM questions WHERE assessment_id = ? ORDER BY sort_order').all(shareLink.assessment_id);

  // 获取每道题的选项（不包含分数）
  const questionsWithOptions = questions.map(q => {
    const options = db.prepare('SELECT id, option_text, sort_order FROM options WHERE question_id = ? ORDER BY sort_order').all(q.id);

    return {
      id: q.id,
      text: q.question_text,
      options: options.map(opt => ({
        id: opt.id,
        text: opt.option_text
      }))
    };
  });

  res.json({
    assessment: {
      title: assessment.title,
      subtitle: assessment.subtitle,
      description: assessment.description,
      questions: questionsWithOptions
    }
  });
});

// ========================================
// 提交答案并获取结果
// ========================================

router.post('/:token/submit', (req, res) => {
  const { token } = req.params;
  const { answers } = req.body;

  const db = getDb();

  // 查找分享链接
  const shareLink = db.prepare('SELECT * FROM share_links WHERE token = ?').get(token);

  if (!shareLink) {
    return res.status(404).json({ error: '链接不存在或已失效' });
  }

  // 计算总分
  let totalScore = 0;
  answers.forEach(answer => {
    const option = db.prepare('SELECT score FROM options WHERE id = ?').get(answer.optionId);
    if (option) {
      totalScore += option.score;
    }
  });

  // 获取对应结果
  const result = db.prepare('SELECT * FROM results WHERE assessment_id = ? AND min_score <= ? AND max_score >= ?')
    .get(shareLink.assessment_id, totalScore, totalScore);

  if (!result) {
    return res.status(404).json({ error: '无法计算结果' });
  }

  // 标记链接已使用
  db.prepare('UPDATE share_links SET used = 1 WHERE token = ?').run(token);

  res.json({
    result: {
      title: result.title,
      description: result.description,
      score: totalScore
    }
  });
});

module.exports = router;