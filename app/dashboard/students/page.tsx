"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Download,
  Upload,
  Key,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";

interface Student {
  id: number;
  nis: string;
  name: string;
  grade: string;
  class: string;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenInfo {
  token: string;
  studentName: string;
  nis: string;
  isUsed: boolean;
  createdAt: string;
}

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingTokens, setIsGeneratingTokens] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nis: "",
    name: "",
    grade: "",
    class: "",
  });

  useEffect(() => {
    fetchStudents();
    fetchTokens();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/admin/tokens");
      if (response.ok) {
        const data = await response.json();
        setTokens(data);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  const handleAddStudent = async () => {
    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      });

      if (response.ok) {
        toast.success("Siswa berhasil ditambahkan");
        setNewStudent({ nis: "", name: "", grade: "", class: "" });
        setShowAddStudentDialog(false);
        fetchStudents();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menambahkan siswa");
      }
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Terjadi kesalahan saat menambahkan siswa");
    }
  };

  const handleGenerateTokens = async () => {
    setIsGeneratingTokens(true);
    try {
      const response = await fetch("/api/admin/tokens/generate", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Berhasil generate ${data.count} token baru`);
        fetchTokens();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal generate token");
      }
    } catch (error) {
      console.error("Error generating tokens:", error);
      toast.error("Terjadi kesalahan saat generate token");
    } finally {
      setIsGeneratingTokens(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentsWithVotingStatus = filteredStudents.map((student) => {
    const token = tokens.find((t) => t.nis === student.nis);
    return {
      ...student,
      tokenStatus: token ? (token.isUsed ? "used" : "available") : "none",
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Siswa</h1>
          <p className="text-gray-600">
            Kelola data siswa dan generate token voting
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan data siswa yang dapat melakukan voting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nis">NIS</Label>
                  <Input
                    id="nis"
                    value={newStudent.nis}
                    onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })}
                    placeholder="Masukkan NIS"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">Kelas</Label>
                    <Input
                      id="grade"
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                      placeholder="10, 11, 12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Jurusan</Label>
                    <Input
                      id="class"
                      value={newStudent.class}
                      onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                      placeholder="IPA 1, IPS 2"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddStudent}>Tambah Siswa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleGenerateTokens} disabled={isGeneratingTokens}>
            <Key className="h-4 w-4 mr-2" />
            {isGeneratingTokens ? "Generating..." : "Generate Token"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Data Siswa</TabsTrigger>
          <TabsTrigger value="tokens">Token Voting</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Siswa ({filteredStudents.length})
              </CardTitle>
              <CardDescription>
                Kelola data siswa dan status voting mereka
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Cari siswa berdasarkan nama, NIS, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Memuat data siswa...</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NIS</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Status Voting</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Dibuat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsWithVotingStatus.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-gray-500">
                              {searchTerm ? "Tidak ada siswa yang cocok dengan pencarian" : "Belum ada data siswa"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        studentsWithVotingStatus.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.nis}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.grade} {student.class}</TableCell>
                            <TableCell>
                              {student.hasVoted ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sudah Voting
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Belum Voting
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.tokenStatus === "available" && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <Key className="h-3 w-3 mr-1" />
                                  Tersedia
                                </Badge>
                              )}
                              {student.tokenStatus === "used" && (
                                <Badge variant="outline" className="text-gray-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Digunakan
                                </Badge>
                              )}
                              {student.tokenStatus === "none" && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Tidak Ada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(student.createdAt).toLocaleDateString("id-ID")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Token Voting ({tokens.length})
              </CardTitle>
              <CardDescription>
                Daftar token voting yang telah di-generate untuk siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Token digunakan untuk login siswa ke sistem voting. Setiap siswa hanya memiliki satu token yang bersifat rahasia.
                </AlertDescription>
              </Alert>

              {tokens.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada token yang di-generate</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Klik tombol "Generate Token" untuk membuat token voting untuk siswa
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>NIS</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.map((token) => (
                        <TableRow key={token.token}>
                          <TableCell className="font-mono text-sm">
                            {token.token}
                          </TableCell>
                          <TableCell>{token.studentName}</TableCell>
                          <TableCell>{token.nis}</TableCell>
                          <TableCell>
                            {token.isUsed ? (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Digunakan
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Tersedia
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(token.createdAt).toLocaleString("id-ID")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}