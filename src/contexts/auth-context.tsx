
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Combina o usuário do Auth com os dados do Firestore
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: 'producer' | 'supplier' | 'service_provider';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta mudanças no estado de autenticação do Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Se o usuário está logado, busca os dados do Firestore
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        // Escuta atualizações em tempo real no documento do usuário
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: userData.role, // Adiciona o role do Firestore
            });
          } else {
             // Se o documento não existe, usa apenas os dados do Auth.
             // Isso pode acontecer brevemente durante o cadastro.
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            });
          }
          setLoading(false);
        });

        // Retorna a função para cancelar a escuta do Firestore quando o usuário deslogar
        return () => unsubscribeFirestore();
      } else {
        // Se não há usuário logado
        setUser(null);
        setLoading(false);
      }
    });

    // Retorna a função para cancelar a escuta do Auth quando o componente desmontar
    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
