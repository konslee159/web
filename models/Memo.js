import mongoose from 'mongoose';

const MemoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 ID는 필수입니다.']
  },
  date: {
    type: String, // YYYY-MM-DD 형식
    required: [true, '날짜는 필수입니다.'],
    match: [/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다.']
  },
  time: {
    type: String, // HH:MM 형식 (24시간)
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, '시간은 HH:MM 형식이어야 합니다.'],
    default: '00:00'
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, '제목은 100자를 초과할 수 없습니다.'],
    default: ''
  },
  content: {
    type: String,
    required: [true, '메모 내용은 필수입니다.'],
    trim: true,
    maxlength: [1000, '메모 내용은 1000자를 초과할 수 없습니다.']
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
    default: 'blue'
  },
  timezone: {
    type: String,
    default: 'Asia/Seoul',
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시간 자동 갱신
MemoSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// 복합 인덱스: 한 사용자가 같은 날짜에 하나의 메모만 가질 수 있도록
MemoSchema.index({ userId: 1, date: 1 }, { unique: true });

// 검색을 위한 인덱스
MemoSchema.index({ userId: 1, createdAt: -1 });
MemoSchema.index({ date: 1 });

if (mongoose.models.Memo) {
  try {
    // Ensure latest schema is used in dev/hot-reload environments
    mongoose.deleteModel('Memo');
  } catch (_) {}
}
const Memo = mongoose.model('Memo', MemoSchema);

export default Memo;
