"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    UserCircle,
    Settings,
    LogOut,
    Vote,
    GraduationCap,
} from "lucide-react";

interface AdminSidebarProps {
    admin: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        {
            href: "/admin/dashboard",
            icon: LayoutDashboard,
            label: "Dashboard",
        },
        {
            href: "/admin/dashboard/classes",
            icon: GraduationCap,
            label: "Kelas",
        },
        {
            href: "/admin/dashboard/students",
            icon: Users,
            label: "Siswa",
        },
        {
            href: "/admin/dashboard/tokens",
            icon: Vote,
            label: "Token",
        },
        {
            href: "/admin/dashboard/candidates",
            icon: UserCircle,
            label: "Kandidat",
        },
        {
            href: "/admin/dashboard/settings",
            icon: Settings,
            label: "Pengaturan",
        },
    ];

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <Vote className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <div>
                        <h2 className="font-bold text-lg">E-Voting</h2>
                        <p className="text-xs text-muted-foreground">Admin Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "default" : "ghost"}
                                className="w-full justify-start"
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-3 px-3">
                    <p className="text-sm font-medium">{admin.name}</p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                </Button>
            </div>
        </aside>
    );
}
