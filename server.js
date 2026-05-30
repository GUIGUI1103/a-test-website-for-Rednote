/**
 * 心理测评网站 - 主服务器
 * 基于 Express + 内存数据库的后端服务（适配 Vercel）
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');

const app = express();
const PORT = 3000;

// ========================================
// 中间件配置
// ========================================

app.use(express.json());
app.use(cookieParser());

// 提供静态文件（前端页面）
app.use(express.static(path.join(__dirname, 'public')));

// 管理后台页面路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 用户端 SPA fallback
app.get('/quiz/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// 挂载路由
// ========================================

app.use('/api/admin', adminRouter);
app.use('/api/quiz', userRouter);

// ========================================
// Vercel Serverless 适配
// ========================================

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`心理测评网站服务已启动: http://localhost:${PORT}`);
    console.log(`管理后台: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;