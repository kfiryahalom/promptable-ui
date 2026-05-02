export const mockTasks = [
  { id: 1, title: 'Setup CI/CD pipeline', status: 'done', priority: 'high', category: 'DevOps', assignee: 'Alice', dueDate: '2024-01-15' },
  { id: 2, title: 'Design database schema', status: 'done', priority: 'high', category: 'Backend', assignee: 'Bob', dueDate: '2024-01-20' },
  { id: 3, title: 'Implement user auth', status: 'in-progress', priority: 'high', category: 'Backend', assignee: 'Alice', dueDate: '2024-02-01' },
  { id: 4, title: 'Create API endpoints', status: 'in-progress', priority: 'medium', category: 'Backend', assignee: 'Charlie', dueDate: '2024-02-10' },
  { id: 5, title: 'Build dashboard UI', status: 'in-progress', priority: 'medium', category: 'Frontend', assignee: 'Diana', dueDate: '2024-02-15' },
  { id: 6, title: 'Write unit tests', status: 'todo', priority: 'medium', category: 'Testing', assignee: 'Bob', dueDate: '2024-02-20' },
  { id: 7, title: 'Mobile responsiveness', status: 'todo', priority: 'low', category: 'Frontend', assignee: 'Diana', dueDate: '2024-03-01' },
  { id: 8, title: 'Performance optimization', status: 'todo', priority: 'low', category: 'Backend', assignee: 'Charlie', dueDate: '2024-03-10' },
  { id: 9, title: 'Security audit', status: 'todo', priority: 'high', category: 'Security', assignee: 'Eve', dueDate: '2024-02-28' },
  { id: 10, title: 'Deploy to production', status: 'todo', priority: 'high', category: 'DevOps', assignee: 'Alice', dueDate: '2024-03-15' },
  { id: 11, title: 'User documentation', status: 'todo', priority: 'low', category: 'Docs', assignee: 'Frank', dueDate: '2024-03-20' },
  { id: 12, title: 'API documentation', status: 'in-progress', priority: 'medium', category: 'Docs', assignee: 'Frank', dueDate: '2024-02-25' },
];

export const mockSummaryMetrics = [
  { metric: 'Total Tasks', value: 12 },
  { metric: 'Done', value: 2 },
  { metric: 'In Progress', value: 4 },
  { metric: 'Todo', value: 6 },
  { metric: 'High Priority', value: 5 },
  { metric: 'Completion Rate %', value: 17 },
];
