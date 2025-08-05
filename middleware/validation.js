const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: '输入数据验证失败',
      errors: errors.array() 
    });
  }
  next();
};

// Auth validations
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度应在2-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  body('mbti')
    .optional()
    .isIn(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 
           'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'])
    .withMessage('请选择有效的MBTI类型'),
  body('idealBuddy')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('理想伙伴描述不能超过100个字符'),
  body('interests')
    .optional()
    .isArray({ max: 10 })
    .withMessage('兴趣爱好最多选择10个'),
  body('interests.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('每个兴趣爱好不能超过20个字符'),
  body('whyJoin')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('加入理由不能超过200个字符'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
  handleValidationErrors
];

// Event validations
const validateCreateEvent = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('活动标题长度应在1-100个字符之间'),
  body('location')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('活动地点长度应在1-200个字符之间'),
  body('maxParticipants')
    .isInt({ min: 1, max: 1000 })
    .withMessage('参与人数应在1-1000之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('活动描述不能超过1000个字符'),
  body('startTime')
    .isISO8601({ strict: false })
    .withMessage('开始时间格式不正确'),
  body('durationMinutes')
    .isInt({ min: 15, max: 1440 })
    .withMessage('活动时长应在15分钟到24小时之间'),
  body('category')
    .isIn(['运动与户外', '音乐与影视', '美食与社交', '旅行与摄影', '学习与职业', '其他'])
    .withMessage('请选择有效的活动类别'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('标签最多选择5个'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('每个标签不能超过20个字符'),
  handleValidationErrors
];

const validateJoinEvent = [
  param('id')
    .isMongoId()
    .withMessage('无效的活动ID'),
  handleValidationErrors
];

const validateUpdateEvent = [
  param('id')
    .isMongoId()
    .withMessage('无效的活动ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('活动标题必须在1-50个字符之间'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('活动地点必须在1-100个字符之间'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('活动人数必须在2-50人之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('活动描述不能超过500个字符'),
  body('category')
    .optional()
    .isIn(['运动与户外', '音乐与影视', '美食与社交', '旅行与摄影', '学习与职业', '其他'])
    .withMessage('请选择有效的活动分类'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('标签不能超过5个'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('每个标签不能超过20个字符'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('请提供有效的开始时间'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage('活动时长必须在30分钟到8小时之间'),
  handleValidationErrors
];

const validateReviewParticipant = [
  param('id')
    .isMongoId()
    .withMessage('无效的活动ID'),
  body('userId')
    .isMongoId()
    .withMessage('无效的用户ID'),
  body('approve')
    .isBoolean()
    .withMessage('审核结果必须是布尔值'),
  handleValidationErrors
];

const validateMarkAttendance = [
  param('id')
    .isMongoId()
    .withMessage('无效的活动ID'),
  body('userId')
    .isMongoId()
    .withMessage('无效的用户ID'),
  body('attended')
    .isBoolean()
    .withMessage('出席状态必须是布尔值'),
  handleValidationErrors
];

// User validations
const validateUpdateProfile = [
  param('id')
    .isMongoId()
    .withMessage('无效的用户ID'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度应在2-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('mbti')
    .optional()
    .isIn(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 
           'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'])
    .withMessage('请选择有效的MBTI类型'),
  body('idealBuddy')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('理想伙伴描述不能超过100个字符'),
  body('interests')
    .optional()
    .isArray({ max: 10 })
    .withMessage('兴趣爱好最多选择10个'),
  body('whyJoin')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('加入理由不能超过200个字符'),
  handleValidationErrors
];

// Password reset validations
const validateRequestReset = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateEvent,
  validateJoinEvent,
  validateUpdateEvent,
  validateReviewParticipant,
  validateMarkAttendance,
  validateUpdateProfile,
  validateRequestReset,
  validateResetPassword
};