import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '笔记 - 个人门户',
  description: '浏览和管理个人笔记，支持 Markdown 格式与标签分类',
};

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
