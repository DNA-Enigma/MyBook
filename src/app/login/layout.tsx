import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登录 - 个人门户',
  description: '登录个人综合服务门户，管理你的笔记、作品和资源',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
