import React, { useState, useEffect } from 'react';
const [showEditProfile, setShowEditProfile] = useState(false);
import { Globe, User, Search, MessageCircle, CheckCircle, Star, MapPin, Heart, X, Menu, Settings, Camera, Shield, Languages, Download, Wallet, Gift, DollarSign, Copy, Share2, Bitcoin } from 'lucide-react';
import EditProfile from './EditProfile';
const GlobeMateApp = ({ userProfile, allProfiles, onProfileUpdate }) => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
 const [userBalance, setUserBalance] = useState(userProfile.balance || 0);
const [referralCode] = useState(userProfile.referralCode || 'CODIGO');
  const [withdrawMethod, setWithdrawMethod] = useState('paypal');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const translations = {
    es: {
      appName: 'GlobeMate',
      explore: 'Explorar',
      myWallet: 'Mi Billetera',
      referFriend: 'Invitar Amigos',
      balance: 'Balance disponible',
      withdraw: 'Retirar',
      withdrawMoney: 'Retirar Dinero',
      withdrawDesc: 'Retira tus ganancias a tu cuenta bancaria o PayPal',
      minimumWithdraw: 'Mínimo €10 para retirar',
      withdrawMethod: 'Método de retiro',
      bankTransfer: 'Transferencia Bancaria',
      paypal: 'PayPal',
      crypto: 'Criptomonedas',
      walletAddress: 'Dirección de wallet',
      selectCrypto: 'Selecciona criptomoneda',
      accountDetails: 'Detalles de cuenta',
      amount: 'Cantidad a retirar',
      requestWithdraw: 'Solicitar Retiro',
      referralProgram: 'Programa de Referidos',
      referralDesc: 'Invita amigos y gana €1 por cada uno que se suscriba a Premium',
      yourCode: 'Tu código único',
      copyCode: 'Copiar código',
      shareLink: 'Compartir link',
      howItWorks: 'Cómo funciona',
      step1Ref: '1. Comparte tu código único con amigos',
      step2Ref: '2. Tu amigo se registra usando tu código',
      step3Ref: '3. Cuando se hace Premium, ganas €1',
      step4Ref: '4. Tu amigo recibe 20% descuento',
      totalReferred: 'Amigos referidos',
      totalEarned: 'Total ganado',
      availableToWithdraw: 'Disponible para retirar',
      findTravelMate: 'Encuentra tu compañero de viaje perfecto',
      connectVerified: 'Conecta con viajeros verificados y comparte experiencias inolvidables',
      startNow: 'Comenzar ahora',
      verifyProfile: 'Verificar perfil',
      searchDestination: 'Buscar destino...',
      search: 'Buscar',
      wantsToVisit: 'Quiere visitar:',
      aboutMe: 'Sobre mí',
      education: 'Educación',
      hobbiesInterests: 'Hobbies e intereses',
      sendMessage: 'Enviar mensaje',
      premium: 'Premium',
      verified: 'Verificado',
    },
    en: {
      appName: 'GlobeMate',
      explore: 'Explore',
      findTravelMate: 'Find your perfect travel companion',
      connectVerified: 'Connect with verified travelers',
      startNow: 'Start now',
      verifyProfile: 'Verify profile',
      searchDestination: 'Search destination...',
      search: 'Search',
    }
  };

  const t = translations[currentLanguage];

  const travelers = allProfiles.length > 0 ? allProfiles : [
    {
      id: 1,
      name: "Sofia Martinez",
      age: 28,
      verified: true,
      premium: true,
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      location: "Madrid, España",
      wantsToVisit: ["Japón", "Tailandia", "Bali"],
      hobbies: ["Fotografía", "Senderismo", "Yoga"],
      education: "Arquitectura",
      bio: "Amante de la naturaleza y culturas asiáticas."
    },
    {
      id: 2,
      name: "Carlos Rodriguez",
      age: 32,
      verified: true,
      premium: false,
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      location: "Buenos Aires, Argentina",
      wantsToVisit: ["Italia", "Grecia", "Francia"],
      hobbies: ["Gastronomía", "Historia", "Buceo"],
      education: "Ingeniero",
      bio: "Explorador urbano y foodie."
    },
  ];

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="text-teal-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">{t.appName}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReferral(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
            >
              <Gift size={20} />
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Wallet size={20} />
              <span className="hidden sm:inline">€{userBalance.toFixed(2)}</span>
            </button>
            <button onClick={() => setCurrentView('search')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
              <Search size={20} />
              <button
  onClick={() => setShowEditProfile(true)}
  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
>
  <Settings size={20} />
  <span className="hidden sm:inline">Editar Perfil</span>
</button>
              {t.explore}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">
          {t.findTravelMate}
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          {t.connectVerified}
        </p>
        <button onClick={() => setCurrentView('search')} className="px-8 py-4 bg-teal-600 text-white rounded-lg text-lg font-semibold hover:bg-teal-700 transition">
          {t.startNow}
        </button>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-gray-100 rounded-lg">
            <Globe className="text-teal-600" size={28} />
          </button>
          <h1 className="text-xl font-bold">{t.appName}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {travelers.map(traveler => (
            <div key={traveler.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img src={traveler.photo} alt={traveler.name} className="w-full h-64 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-bold">{traveler.name}, {traveler.age}</h3>
                <p className="text-gray-600 text-sm flex items-center gap-1">
                  <MapPin size={16} />
                  {traveler.location}
                </p>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">{t.wantsToVisit}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {traveler.wantsToVisit && traveler.wantsToVisit.map((dest, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{dest}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => setShowWithdraw(false)}>
            <X size={24} />
          </button>
          <h1 className="text-xl font-bold">{t.myWallet}</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow-lg p-8 text-white mb-6">
          <p className="text-teal-100 text-sm">{t.balance}</p>
          <h2 className="text-4xl font-bold">€{userBalance.toFixed(2)}</h2>
          <button className="w-full mt-4 bg-white text-teal-600 py-3 rounded-lg font-semibold">
            {t.withdraw}
          </button>
        </div>
      </div>
    </div>
  );

  const renderReferral = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => setShowReferral(false)}>
            <X size={24} />
          </button>
          <h1 className="text-xl font-bold">{t.referFriend}</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl shadow-lg p-8 text-white text-center mb-6">
          <Gift size={64} className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">{t.referralProgram}</h2>
          <p className="text-lg">{t.referralDesc}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">{t.yourCode}</h3>
          <div className="bg-gray-100 px-6 py-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-teal-600">{referralCode}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (showWithdraw) return renderWithdraw();
  if (showReferral) return renderReferral();
  if (currentView === 'search') return renderSearch();
  return renderHome();
};

export default GlobeMateApp;
