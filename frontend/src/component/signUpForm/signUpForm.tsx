import React, { useState, useEffect } from 'react';
import { Button } from "@/component/common/ui/button";
import { Input } from "@/component/common/ui/input";
import { Label } from "@/component/common/ui/label";
import { CardContent } from "@/component/common/ui/card";
import { Alert } from "@/component/common/ui/alert";
import { AlertDescription } from "@/component/common/ui/alertDescription";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

interface SignupFormProps {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
}

interface ValidationState {
  email: {
    valid: boolean;
    message: string;
  };
  password: {
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
    length: boolean;
  };
}

export function SignUpForm({ onSubmit, isLoading = false }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    email: {
      valid: false,
      message: '',
    },
    password: {
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
      length: false,
    },
  });

  useEffect(() => {
    validateEmail(email);
  }, [email]);

  useEffect(() => {
    validatePassword(password);
  }, [password]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setValidation(prev => ({
      ...prev,
      email: {
        valid: emailRegex.test(email),
        message: emailRegex.test(email) ? '' : 'Please enter a valid email address',
      },
    }));
  };

  const validatePassword = (password: string) => {
    setValidation(prev => ({
      ...prev,
      password: {
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        length: password.length >= 8,
      },
    }));
  };

  const isPasswordValid = Object.values(validation.password).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validation.email.valid) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (error) {
      setError('An error occurred during sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationIcon = ({ valid }: { valid: boolean }) => (
    valid ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-gray-300" />
    )
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-12 px-4 bg-white/80 backdrop-blur-sm
                        border-gray-200/60 rounded-lg
                        transition-all duration-200
                        focus:border-[#F15B5B]/30 focus:ring-[#F15B5B]/30
                        hover:border-gray-300/60
                        placeholder:text-gray-400/70"
              aria-invalid={!validation.email.valid && email !== ''}
            />
            {email && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <ValidationIcon valid={validation.email.valid} />
              </div>
            )}
          </div>
          {!validation.email.valid && email && (
            <p className="text-sm text-[#F15B5B] mt-1">{validation.email.message}</p>
          )}
        </div>
  
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
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
  
          {/* Password requirements */}
          <div className="mt-3 space-y-2 bg-gray-50/80 backdrop-blur-sm 
                          p-4 rounded-lg border border-gray-200/60">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <ValidationIcon valid={validation.password.lowercase} />
                <span className="text-gray-600">Lowercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                <ValidationIcon valid={validation.password.uppercase} />
                <span className="text-gray-600">Uppercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                <ValidationIcon valid={validation.password.number} />
                <span className="text-gray-600">Number</span>
              </div>
              <div className="flex items-center gap-2">
                <ValidationIcon valid={validation.password.special} />
                <span className="text-gray-600">Special character</span>
              </div>
              <div className="flex items-center gap-2">
                <ValidationIcon valid={validation.password.length} />
                <span className="text-gray-600">8+ characters</span>
              </div>
            </div>
          </div>
        </div>
  
        {error && (
          <Alert variant="destructive" className="bg-[#F15B5B]/5 text-[#F15B5B]
                                                border-[#F15B5B]/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          type="submit" 
          className="w-full h-12 bg-[#F15B5B] hover:bg-[#F15B5B]/90
                    text-white font-medium rounded-lg
                    transition-all duration-200
                    disabled:opacity-50 mt-2"
          disabled={isLoading || isSubmitting || !isPasswordValid || 
                    !validation.email.valid}
        >
          {isLoading || isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </Button>
      </CardContent>
    </form>
  );
}