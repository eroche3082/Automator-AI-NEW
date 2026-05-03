import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "oauth_failed") {
      toast({
        title: "No se pudo iniciar sesión",
        description: "Hubo un problema con Google. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0E11] p-4">
      <Card className="w-full max-w-md bg-[#151515] border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#E6E8EC]">Iniciar sesión</CardTitle>
          <CardDescription className="text-[#94A3B8]">
            Accede a AUTOMATOR AI con tu cuenta de Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 hover:bg-gray-100"
            size="lg"
            data-testid="button-google-login"
          >
            <SiGoogle className="w-5 h-5 mr-2" />
            Continuar con Google
          </Button>
          <p className="text-xs text-center text-[#94A3B8]">
            Al continuar aceptas nuestros términos y la política de privacidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
