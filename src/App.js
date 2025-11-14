import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Auth from './Auth';
import ProfileSetup from './ProfileSetup';
import GlobeMateApp from './GlobeMateApp';
import AdminDashboard from './AdminDashboard';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  // Email del administrador (tu email)
  const ADMIN_EMAIL = 'iam.rosa18@gmail.com'; // CAMBIA ESTO A TU EMAIL

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Cargar perfil del usuario
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
          // Cargar todos los perfiles
          loadAllProfiles();
        }
      } else {
        setProfile(null);
        setAllProfiles([]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadAllProfiles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const profiles = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser?.uid) {
          profiles.push({ id: doc.id, ...doc.data() });
        }
      });
      setAllProfiles(profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setAllProfiles([]);
      setShowAdmin(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleProfileUpdate = () => {
    setLoading(true);
    // Recargar perfil después de actualizar
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-teal-600">Cargando...</div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login/registro
  if (!user) {
    return <Auth onAuthSuccess={() => setLoading(true)} />;
  }

  // Si hay usuario pero no tiene perfil, mostrar creación de perfil
  if (!profile) {
    return <ProfileSetup onProfileComplete={handleProfileUpdate} />;
  }

  // Verificar si es administrador
  const isAdmin = user.email === ADMIN_EMAIL;

  // Si el admin quiere ver el dashboard
  if (showAdmin && isAdmin) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setShowAdmin(false)}
            className="bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition"
          >
            Volver a la App
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 shadow-lg"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
        <AdminDashboard 
          allUsers={[...allProfiles, { id: user.uid, ...profile }]}
          currentUser={profile}
        />
      </div>
    );
  }

  // Si hay usuario y perfil, mostrar la app principal
  return (
    <div>
      {/* Botones superiores */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-lg"
          >
            <Shield size={20} />
            Admin
          </button>
        )}
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <UserIcon size={20} className="text-teal-600" />
          <span className="font-medium">{profile.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 shadow-lg"
        >
          <LogOut size={20} />
          Salir
        </button>
      </div>
      
      <GlobeMateApp 
        userProfile={profile} 
        allProfiles={allProfiles}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default App;