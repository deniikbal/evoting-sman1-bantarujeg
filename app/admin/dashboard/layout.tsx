import { getAdminSession } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await getAdminSession();

    if (!admin) {
        redirect("/admin/login");
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar admin={admin} />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
