import React, { useState } from 'react';
import { Button } from "@/component/common/ui/button";
import { Input } from "@/component/common/ui/input";
import { Label } from "@/component/common/ui/label";
import { CardContent } from "@/component/common/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginFormProps {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await onSubmit({ email, password });
    } catch (error) {
      console.error('Login form error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="h-12 px-4 bg-white/80 backdrop-blur-sm
                      border-gray-200/60 rounded-lg
                      transition-all duration-200
                      focus:border-[#F15B5B]/30 focus:ring-[#F15B5B]/30
                      hover:border-gray-300/60
                      placeholder:text-gray-400/70"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <button
              type="button"
              className="text-xs text-[#F15B5B] hover:text-[#F15B5B]/80 transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="h-12 px-4 bg-white/80 backdrop-blur-sm
                        border-gray-200/60 rounded-lg
                        transition-all duration-200
                        focus:border-[#F15B5B]/30 focus:ring-[#F15B5B]/30
                        hover:border-gray-300/60
                        placeholder:text-gray-400/70"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 
                        text-gray-400 hover:text-gray-600
                        transition-colors duration-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 bg-[#F15B5B] hover:bg-[#F15B5B]/90
                    text-white font-medium rounded-lg
                    transition-all duration-200
                    disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </CardContent>
    </form>
  );
}