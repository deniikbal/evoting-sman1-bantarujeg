"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Vote,
  Shield,
  UserCircle,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="text-center py-12 sm:py-16 relative px-4">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center justify-center mb-8">
          <Vote className="w-20 h-20 text-green-600 dark:text-green-400 mb-4" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-green-400 bg-clip-text text-transparent mb-4">
            E-Voting SMAN 1 Bantarujeg
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 mb-8">
            Sistem Pemilihan Ketua OSIS secara elektronik yang aman dan transparan
          </p>
        </div>

        {/* Login Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
          <Link href="/student/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              <UserCircle className="mr-2 h-5 w-5" />
              Login Siswa
            </Button>
          </Link>
          <Link href="/admin/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Shield className="mr-2 h-5 w-5" />
              Login Admin
            </Button>
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-8 max-w-5xl">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aman & Terenkripsi</h3>
            <p className="text-sm text-muted-foreground">
              Setiap suara dienkripsi dan tersimpan dengan aman
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Vote className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Mudah Digunakan</h3>
            <p className="text-sm text-muted-foreground">
              Interface sederhana dan mudah dipahami
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Transparan</h3>
            <p className="text-sm text-muted-foreground">
              Sistem audit yang jelas dan dapat dipertanggungjawabkan
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
