"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FileText, Image, FolderOpen, User, LogOut, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/notes", label: "笔记", icon: FileText },
  { href: "/works", label: "作品", icon: Image },
  { href: "/resources", label: "资源库", icon: FolderOpen },
  { href: "/profile", label: "关于我", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-serif text-2xl font-bold text-primary">
          个人门户
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.name || user.email}
                {isAdmin && (
                  <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    管理员
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
                <LogOut className="h-4 w-4" />
                退出
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild className="gap-1">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                登录
              </Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-border pt-3">
            {user ? (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <LogIn className="h-4 w-4" />
                登录
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
