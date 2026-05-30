/**
 * 管理端 API 路由
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/memory-db');

// ========================================
// 中间件：登录状态检查
// ========================================

function checkAuth(req, res, next) {
  // 简化版：直接放行（内存数据库无持久化登录）
  next();
}

// ========================================
// 登录接口
// ========================================

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (!admin) {
    return res.status(401).json({ error: '用户不存在' });
  }

  // 简化版：直接比较密码（内存数据库）
  if (password !== admin.password_hash) {
    return res.status(401).json({ error: '密码错误' });
  }

  res.json({ message: '登录成功', username: admin.username });
});

// ========================================
// 测评管理接口
// ========================================

router.get('/assessments', checkAuth, (req, res) => {
  const db = getDb();
  const assessments = db.prepare('SELECT * FROM assessments ORDER BY id DESC').all();
  res.json({ assessments });
});

router.post('/assessments', checkAuth, (req, res) => {
  const { title, subtitle, description, questions, results } = req.body;

  if (!title) {
    return res.status(400).json({ error: '测评标题不能为空' });
  }

  const db = getDb();
  const result = db.prepare('INSERT INTO assessments (title, subtitle, description, question_count) VALUES (?, ?, ?, ?)')
    .run(title, subtitle || '', description || '', questions ? questions.length : 0);

  res.json({ message: '测评创建成功', id: result.lastInsertRowid });
});

router.put('/assessments/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const { title, subtitle, description } = req.body;

  const db = getDb();
  db.prepare('UPDATE assessments SET title = ?, subtitle = ?, description = ? WHERE id = ?')
    .run(title, subtitle || '', description || '', id);

  res.json({ message: '测评更新成功' });
});

router.delete('/assessments/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  db.prepare('DELETE FROM assessments WHERE id = ?').run(id);
  res.json({ message: '测评删除成功' });
});

router.post('/assessments/import', checkAuth, (req, res) => {
  const { title, subtitle, description, questions, results } = req.body;

  if (!title) {
    return res.status(400).json({ error: '测评标题不能为空' });
  }

  const db = getDb();
  const result = db.prepare('INSERT INTO assessments (title, subtitle, description, question_count) VALUES (?, ?, ?, ?)')
    .run(title, subtitle || '', description || '', questions ? questions.length : 0);

  res.json({ message: '测评导入成功', id: result.lastInsertRowid });
});

// ========================================
// 分享链接接口
// ========================================

router.get('/share', checkAuth, (req, res) => {
  const db = getDb();
  const links = db.prepare('SELECT * FROM share_links ORDER BY id DESC').all();
  
  // 补充测评标题
  const linksWithTitle = links.map(link => {
    const assessment = db.prepare('SELECT title FROM assessments WHERE id = ?').get(link.assessment_id);
    return {
      ...link,
      assessment_title: assessment ? assessment.title : '未知测评',
      url: `/quiz/${link.token}`
    };
  });
  
  res.json({ links: linksWithTitle });
});

router.post('/share/:assessmentId', checkAuth, (req, res) => {
  const { assessmentId } = req.params;
  const token = uuidv4();

  const db = getDb();
  db.prepare('INSERT INTO share_links (assessment_id, token, used) VALUES (?, ?, 0)')
    .run(assessmentId, token);

  res.json({
    message: '分享链接生成成功',
    token,
    url: `/quiz/${token}`
  });
});

module.exports = router;