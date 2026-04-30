import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '作品 - 个人门户',
  description: '展示个人项目与作品集，涵盖设计、开发和创意作品',
};

export default function WorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
