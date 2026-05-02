import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Success() {
  return (
    <div className="bg-[#0B0F1A] min-h-screen flex items-center justify-center px-6">
      <Card className="bg-[#121826] border-gray-700 rounded-2xl max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#00E5A8]/20 rounded-full">
              <CheckCircle className="w-12 h-12 text-[#00E5A8]" />
            </div>
          </div>
          <CardTitle className="text-[#E6E8EC] text-2xl mb-2">
            Welcome to AUTOMATOR AI!
          </CardTitle>
          <p className="text-[#94A3B8]">
            Your subscription has been activated successfully.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-[#0B0F1A] p-4 rounded-xl">
            <h3 className="text-[#E6E8EC] font-medium mb-2">What's next?</h3>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li>• Set up your first automation workflow</li>
              <li>• Import your contacts and leads</li>
              <li>• Explore AI-powered features</li>
              <li>• Connect your favorite tools</li>
            </ul>
          </div>

          <Link href="/dashboard">
            <Button className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#00E5A8] hover:opacity-90 text-white py-3 rounded-xl">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <p className="text-center text-xs text-[#94A3B8]">
            Need help? Contact our support team anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}