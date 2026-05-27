"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
};

export default function NavItem({ href, icon, label, collapsed }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
        ${collapsed ? "justify-center" : ""}
        ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}