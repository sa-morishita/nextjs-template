/**
 * テストファクトリー
 * Fishery を使用した型安全な実装
 */

export {
  createTestDiaryInDB as createTestDiary,
  createTestTodoInDB as createTestTodo,
  createTestUserInDB as createTestUser,
  diaryFactory,
  todoFactory,
  userFactory,
} from './fishery-factory';
