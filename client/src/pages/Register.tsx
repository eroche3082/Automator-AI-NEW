import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });

  const register = useMutation({
    mutationFn: async () =>
      apiRequest({
        url: "/api/auth/register",
        method: "POST",
        data: {
          name: form.name,
          email: form.email,
          password: form.password,
          company: form.company || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Cuenta creada", description: "Bienvenido a AUTOMATOR AI" });
      setLocation("/");
    },
    onError: (err: any) => {
      toast({
        title: "No se pudo crear la cuenta",
        description: err?.message || "Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0E11] p-4">
      <Card className="w-full max-w-md bg-[#151515] border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-[#E6E8EC]">Crear cuenta</CardTitle>
          <CardDescription className="text-[#94A3B8]">
            Empieza a automatizar tu negocio con IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.email || !form.password) {
                toast({ title: "Completa los campos obligatorios", variant: "destructive" });
                return;
              }
              if (form.password.length < 8) {
                toast({ title: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
                return;
              }
              register.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-gray-800 border-gray-700"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-gray-800 border-gray-700"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="bg-gray-800 border-gray-700"
                data-testid="input-company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (mín. 8 caracteres)</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-gray-800 border-gray-700"
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-btn"
              disabled={register.isPending}
              data-testid="button-register"
            >
              {register.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {register.isPending ? "Creando..." : "Crear cuenta"}
            </Button>
            <p className="text-sm text-center text-[#94A3B8]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#0047FF] hover:underline" data-testid="link-login">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
