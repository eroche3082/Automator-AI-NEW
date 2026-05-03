import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Login() {
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "oauth_failed") {
      toast({
        title: "No se pudo iniciar sesión",
        description: "Hubo un problema al autenticarte con Google. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#151515] flex items-center justify-center p-4">
      {/* Background gradient blobs to match brand identity */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#0047FF]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#D100FF]/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#00E5A8]/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0047FF] flex items-center justify-center mr-3 shadow-lg shadow-[#0047FF]/30">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            <span>AUTOMATOR</span>
            <span className="gradient-text"> AI</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[#151515]/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#E6E8EC] mb-2">Bienvenido de nuevo</h2>
            <p className="text-sm text-[#94A3B8]">
              Inicia sesión con tu cuenta de Google para continuar
            </p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 hover:scale-[1.02] transition-all duration-200 font-medium"
            size="lg"
            data-testid="button-google-login"
          >
            <SiGoogle className="w-5 h-5 mr-3" />
            Continuar con Google
          </Button>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-800" />
            <span className="px-4 text-xs uppercase text-gray-500 tracking-wider">
              Acceso seguro
            </span>
            <div className="flex-1 border-t border-gray-800" />
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-[#00E5A8]" />
              <p className="text-[10px] text-gray-400">OAuth 2.0</p>
            </div>
            <div className="space-y-1">
              <Zap className="w-5 h-5 mx-auto text-[#0047FF]" />
              <p className="text-[10px] text-gray-400">Sesión cifrada</p>
            </div>
            <div className="space-y-1">
              <Sparkles className="w-5 h-5 mx-auto text-[#D100FF]" />
              <p className="text-[10px] text-gray-400">Sin contraseñas</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Al continuar aceptas nuestros{" "}
          <a href="#" className="text-[#0047FF] hover:underline">términos</a>
          {" "}y{" "}
          <a href="#" className="text-[#0047FF] hover:underline">política de privacidad</a>.
        </p>
      </div>
    </div>
  );
}
