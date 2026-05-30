/**
 * 纯 JavaScript 内存数据库
 * 不依赖任何原生模块，适配 Vercel Serverless 环境
 */

// 内存数据存储
const data = {
  admins: [
    { id: 1, username: 'admin', password_hash: 'admin123', created_at: new Date().toISOString() }
  ],
  assessments: [
    {
      id: 1,
      title: '你的焦虑类型测试',
      subtitle: '你在为什么焦虑？',
      description: '通过5道题目了解你当前的焦虑程度',
      question_count: 5,
      created_at: new Date().toISOString()
    }
  ],
  questions: [
    { id: 1, assessment_id: 1, question_text: '当你经历一段感情的结束时，你通常会有怎样的感受？', sort_order: 0 },
    { id: 2, assessment_id: 1, question_text: '面对就业压力或职业发展不确定性时，你的反应是？', sort_order: 1 },
    { id: 3, assessment_id: 1, question_text: '在社交场合中，你的内心体验通常是怎样的？', sort_order: 2 },
    { id: 4, assessment_id: 1, question_text: '想到自己的未来规划时，你的感受是？', sort_order: 3 },
    { id: 5, assessment_id: 1, question_text: '你如何评价自己最近的整体心理状态？', sort_order: 4 }
  ],
  options: [
    // 问题1的选项
    { id: 1, question_id: 1, option_text: '虽然难过，但很快就能调整过来，生活照常继续', score: 1, sort_order: 0 },
    { id: 2, question_id: 1, option_text: '会有一段时间情绪低落，但能通过朋友倾诉或兴趣爱好慢慢恢复', score: 2, sort_order: 1 },
    { id: 3, question_id: 1, option_text: '长时间无法释怀，反复回忆过去的细节，影响日常生活和工作', score: 3, sort_order: 2 },
    { id: 4, question_id: 1, option_text: '感到世界崩塌，产生强烈的自我怀疑，甚至对未来的感情失去信心', score: 4, sort_order: 3 },
    // 问题2的选项
    { id: 5, question_id: 2, option_text: '相信车到山前必有路，按部就班地准备，心态比较平和', score: 1, sort_order: 0 },
    { id: 6, question_id: 2, option_text: '偶尔会感到紧张，但能通过制定计划来缓解不安', score: 2, sort_order: 1 },
    { id: 7, question_id: 2, option_text: '经常失眠，反复比较自己和他人的差距，感到前途渺茫', score: 3, sort_order: 2 },
    { id: 8, question_id: 2, option_text: '极度恐慌，觉得自己一无是处，害怕永远找不到合适的工作', score: 4, sort_order: 3 },
    // 问题3的选项
    { id: 9, question_id: 3, option_text: '享受与人交流的过程，能自然地表达自己的想法', score: 1, sort_order: 0 },
    { id: 10, question_id: 3, option_text: '在陌生环境中会有些拘谨，但熟悉之后就能放松下来', score: 2, sort_order: 1 },
    { id: 11, question_id: 3, option_text: '总是担心自己说错话或做错事，社交后反复回想每个细节', score: 3, sort_order: 2 },
    { id: 12, question_id: 3, option_text: '尽可能回避社交场合，即使参加也会感到心跳加速、手心出汗', score: 4, sort_order: 3 },
    // 问题4的选项
    { id: 13, question_id: 4, option_text: '对未来充满期待，有清晰的目标和实现路径', score: 1, sort_order: 0 },
    { id: 14, question_id: 4, option_text: '偶尔会迷茫，但总体上相信事情会朝着好的方向发展', score: 2, sort_order: 1 },
    { id: 15, question_id: 4, option_text: '经常感到困惑和不安，觉得计划赶不上变化，难以做出决定', score: 3, sort_order: 2 },
    { id: 16, question_id: 4, option_text: '完全看不到方向，被无力感包围，觉得无论怎么努力都没有意义', score: 4, sort_order: 3 },
    // 问题5的选项
    { id: 17, question_id: 5, option_text: '状态很好，精力充沛，对生活充满热情', score: 1, sort_order: 0 },
    { id: 18, question_id: 5, option_text: '整体还不错，偶尔有小波动但都能自行调节', score: 2, sort_order: 1 },
    { id: 19, question_id: 5, option_text: '经常感到疲惫和烦躁，注意力难以集中，对以前喜欢的事物也提不起兴趣', score: 3, sort_order: 2 },
    { id: 20, question_id: 5, option_text: '非常糟糕，几乎每天都感到压抑、焦虑，甚至影响了饮食和睡眠', score: 4, sort_order: 3 }
  ],
  results: [
    { id: 1, assessment_id: 1, title: '低焦虑水平', description: '你的焦虑水平较低，能够较好地应对生活中的压力。你拥有良好的情绪调节能力，即使遇到困难也能保持相对平和的心态。继续保持这种积极的生活态度，适当关注自己的心理健康即可。', min_score: 5, max_score: 9 },
    { id: 2, assessment_id: 1, title: '中度焦虑', description: '你目前存在一定程度的焦虑情绪，这在现代社会中是比较常见的。你可能在某些特定情境下会感到紧张或不安，但总体上还能维持正常的生活节奏。建议你尝试一些放松技巧，如深呼吸、正念冥想或适度运动。如果焦虑感持续加重，可以考虑寻求专业心理咨询的帮助。', min_score: 10, max_score: 14 },
    { id: 3, assessment_id: 1, title: '高焦虑水平', description: '你的焦虑水平较高，可能已经对你的日常生活产生了一定影响。你可能经常感到紧张、担忧，甚至伴有身体上的不适（如失眠、心悸等）。建议你认真对待自己的心理健康，尝试与信任的朋友或家人倾诉，必要时寻求专业心理咨询师的帮助。记住，寻求帮助是勇敢的表现，你值得被关心和支持。', min_score: 15, max_score: 20 }
  ],
  share_links: []
};

// 自增 ID
let nextIds = {
  admins: 2,
  assessments: 2,
  questions: 6,
  options: 21,
  results: 4,
  share_links: 1
};

/**
 * 获取数据库实例
 */
function getDb() {
  return {
    prepare: (sql) => {
      // 解析 SQL 语句类型
      const sqlType = sql.trim().split(' ')[0].toUpperCase();
      
      return {
        run: (...params) => {
          const table = getTableFromSql(sql);
          if (!table) return { changes: 0 };
          
          if (sqlType === 'INSERT') {
            const id = nextIds[table]++;
            const newRow = { id, ...paramsToObject(sql, params) };
            data[table].push(newRow);
            return { lastInsertRowid: id, changes: 1 };
          }
          if (sqlType === 'UPDATE') {
            const updates = paramsToObject(sql, params);
            const whereMatch = sql.match(/WHERE\s+(\w+)\s+=\s*\?/);
            if (whereMatch) {
              const whereField = whereMatch[1];
              const whereValue = params[params.length - 1];
              let changes = 0;
              data[table].forEach(row => {
                if (row[whereField] == whereValue) {
                  Object.assign(row, updates);
                  changes++;
                }
              });
              return { changes };
            }
            return { changes: 0 };
          }
          if (sqlType === 'DELETE') {
            const whereMatch = sql.match(/WHERE\s+(\w+)\s+=\s*\?/);
            if (whereMatch) {
              const whereField = whereMatch[1];
              const whereValue = params[0];
              const before = data[table].length;
              data[table] = data[table].filter(row => row[whereField] != whereValue);
              return { changes: before - data[table].length };
            }
            return { changes: 0 };
          }
          return { changes: 0 };
        },
        get: (...params) => {
          const table = getTableFromSql(sql);
          if (!table) return undefined;
          
          if (sqlType === 'SELECT') {
            const whereMatch = sql.match(/WHERE\s+(\w+)\s+=\s*\?/);
            if (whereMatch) {
              const whereField = whereMatch[1];
              const whereValue = params[0];
              return data[table].find(row => row[whereField] == whereValue);
            }
            // 无 WHERE 条件，返回第一条
            return data[table][0];
          }
          return undefined;
        },
        all: (...params) => {
          const table = getTableFromSql(sql);
          if (!table) return [];
          
          if (sqlType === 'SELECT') {
            const whereMatch = sql.match(/WHERE\s+(\w+)\s+=\s*\?/);
            const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)/);
            
            let results = data[table];
            
            if (whereMatch) {
              const whereField = whereMatch[1];
              const whereValue = params[0];
              results = results.filter(row => row[whereField] == whereValue);
            }
            
            if (orderMatch) {
              const orderField = orderMatch[1];
              results.sort((a, b) => (a[orderField] || 0) - (b[orderField] || 0));
            }
            
            return results;
          }
          return [];
        }
      };
    },
    exec: () => {}
  };
}

// 从 SQL 提取表名
function getTableFromSql(sql) {
  const tableMatch = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
  return tableMatch ? tableMatch[1] : null;
}

// 将 SQL 参数转换为对象
function paramsToObject(sql, params) {
  const fieldsMatch = sql.match(/\(([^)]+)\)/);
  if (fieldsMatch) {
    const fields = fieldsMatch[1].split(',').map(f => f.trim());
    const obj = {};
    params.forEach((val, i) => {
      if (fields[i]) obj[fields[i]] = val;
    });
    return obj;
  }
  // UPDATE 语句: SET field = ?, field = ?
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
  if (setMatch) {
    const sets = setMatch[1].split(',').map(s => s.trim());
    const obj = {};
    sets.forEach((set, i) => {
      const field = set.split('=')[0].trim();
      obj[field] = params[i];
    });
    return obj;
  }
  return {};
}

module.exports = { getDb };