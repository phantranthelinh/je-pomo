'use client';

import { cn } from '@/lib/utils';
import { Timer, BarChart3, LogIn, LogOut, User } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Timer', icon: <Timer size={20} /> },
  { href: '/dashboard', label: 'Stats', icon: <BarChart3 size={20} /> },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-brand-text">
        JeFocus
      </Link>

      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all',
              pathname === item.href
                ? 'glass-strong text-brand-text font-medium'
                : 'text-brand-text/60 hover:text-brand-text hover:bg-brand-light/30'
            )}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {session?.user ? (
          <div className="flex items-center gap-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ''}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <User size={20} className="text-brand-text/60" />
            )}
            <button
              onClick={() => signOut()}
              className="text-brand-text/60 hover:text-brand-text transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-brand-text/60 hover:text-brand-text hover:bg-brand-light/30 transition-all"
          >
            <LogIn size={18} />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>
    </nav>
  );
}
