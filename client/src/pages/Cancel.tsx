

import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Cancel() {
  return (
    <div className="bg-[#0B0F1A] min-h-screen flex items-center justify-center px-6">
      <Card className="bg-[#121826] border-gray-700 rounded-2xl max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#FF5D5D]/20 rounded-full">
              <XCircle className="w-12 h-12 text-[#FF5D5D]" />
            </div>
          </div>
          <CardTitle className="text-[#E6E8EC] text-2xl mb-2">
            Subscription Cancelled
          </CardTitle>
          <p className="text-[#94A3B8]">
            No worries! You can try again anytime.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-[#0B0F1A] p-4 rounded-xl">
            <h3 className="text-[#E6E8EC] font-medium mb-2">Why choose AUTOMATOR AI?</h3>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li>• Save 10+ hours per week with automation</li>
              <li>• AI-powered lead management</li>
              <li>• Seamless integrations with your tools</li>
              <li>• 14-day free trial, cancel anytime</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/pricing" className="flex-1">
              <Button className="w-full bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white py-3 rounded-xl">
                Try Again
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="flex-1 border-[#94A3B8] text-[#E6E8EC] hover:bg-[#94A3B8]/10 py-3 rounded-xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Us
            </Button>
          </div>
          
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className="w-full text-[#94A3B8] hover:text-[#E6E8EC] py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
