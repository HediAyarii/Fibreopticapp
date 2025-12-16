'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReclamationsTechniques from '@/components/ReclamationsTechniques';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function ReclamationsTechniquesPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
          setIsAuthorized(false);
          setCheckingAuth(false);
          return;
        }

        const user = JSON.parse(userStr);
        const isAdmin = user.role === 'superadmin' || user.role === 'admin' || user.is_superuser === true;
        
        setIsAuthorized(isAdmin);
        setCheckingAuth(false);
      } catch (error) {
        setIsAuthorized(false);
        setCheckingAuth(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-red-100 rounded-full w-fit">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-base">
              Cette page est réservée aux administrateurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Vous devez être connecté en tant qu'administrateur pour accéder à cette section.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
              >
                Retour à l'accueil
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('currentUser');
                  router.push('/');
                }}
              >
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ReclamationsTechniques />;
}
