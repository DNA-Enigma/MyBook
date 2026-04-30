import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '资源库 - 个人门户',
  description: '下载软件、文档、图片和 Docker 镜像等综合资源',
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
