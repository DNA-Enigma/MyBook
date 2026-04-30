import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './navbar';

let mockUser: { name: string; email: string } | null = null;
let mockIsAdmin = false;
const mockLogout = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/notes',
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAdmin: mockIsAdmin,
    logout: mockLogout,
  }),
}));

describe('Navbar', () => {
  beforeEach(() => {
    mockUser = null;
    mockIsAdmin = false;
    mockLogout.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders login button when user is not logged in', () => {
    render(<Navbar />);
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.queryByText('退出')).not.toBeInTheDocument();
  });

  it('renders user name and logout button when logged in', () => {
    mockUser = { name: 'Alice', email: 'alice@example.com' };
    render(<Navbar />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('退出')).toBeInTheDocument();
    expect(screen.queryByText('登录')).not.toBeInTheDocument();
  });

  it('renders admin badge for admin users', () => {
    mockUser = { name: 'Admin', email: 'admin@example.com' };
    mockIsAdmin = true;
    render(<Navbar />);
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    mockUser = { name: 'Bob', email: 'bob@example.com' };
    render(<Navbar />);
    fireEvent.click(screen.getByText('退出'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('笔记')).toBeInTheDocument();
    expect(screen.getByText('作品')).toBeInTheDocument();
    expect(screen.getByText('资源库')).toBeInTheDocument();
    expect(screen.getByText('关于我')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUser = { name: 'Alice', email: 'alice@example.com' };
    render(<Navbar />);
    const notesLink = screen.getByText('笔记').closest('a');
    expect(notesLink).toHaveClass('bg-primary/10');
  });
});
