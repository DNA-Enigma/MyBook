import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '个人简介 - 个人门户',
  description: '了解作者背景、技能与联系方式',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
