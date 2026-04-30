import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '注册 - 个人门户',
  description: '注册个人综合服务门户账号，开始记录与分享',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
