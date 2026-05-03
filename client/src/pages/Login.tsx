import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: async () =>
      apiRequest({ url: "/api/auth/login", method: "POST", data: { email, password } }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Sesión iniciada" });
      setLocation("/");
    },
    onError: (err: any) => {
      toast({
        title: "No se pudo iniciar sesión",
        description: err?.message || "Verifica tu correo y contraseña.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0E11] p-4">
      <Card className="w-full max-w-md bg-[#151515] border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-[#E6E8EC]">Iniciar sesión</CardTitle>
          <CardDescription className="text-[#94A3B8]">
            Accede a tu cuenta de AUTOMATOR AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email || !password) {
                toast({ title: "Completa todos los campos", variant: "destructive" });
                return;
              }
              login.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700"
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-btn"
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {login.isPending ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-center text-[#94A3B8]">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[#0047FF] hover:underline" data-testid="link-register">
                Crea una aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
