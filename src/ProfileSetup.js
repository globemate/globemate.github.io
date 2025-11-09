import React, { useState } from 'react';
import { db, storage, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, User, MapPin, Calendar, Heart, Briefcase, Globe as GlobeIcon, HelpCircle, Mail, Languages as LanguagesIcon } from 'lucide-react';

const ProfileSetup = ({ onProfileComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    nationality: '',
    location: '',
    education: '',
    bio: '',
    hobbies: [],
    wantsToVisit: [],
    languages: [],
    placesVisited: []
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSupport, setShowSupport] = useState(false);

  // Listas predefinidas
  const countries = [
    'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela',
    'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'República Dominicana', 'Honduras',
    'Paraguay', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panamá', 'Uruguay',
    'Puerto Rico', 'Estados Unidos', 'Brasil', 'Francia', 'Italia', 'Alemania',
    'Reino Unido', 'Canadá', 'Australia', 'Japón', 'China', 'India', 'Otro'
  ];

  const languagesOptions = [
    'Español', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán',
    'Chino Mandarín', 'Japonés', 'Coreano', 'Ruso', 'Árabe', 'Hindi',
    'Neerlandés', 'Sueco', 'Noruego', 'Danés', 'Polaco', 'Turco',
    'Griego', 'Hebreo', 'Tailandés', 'Vietnamita', 'Indonesio', 'Catalán'
  ];

  const hobbiesOptions = [
    'Fotografía', 'Senderismo', 'Yoga', 'Cocina', 'Lectura', 'Música',
    'Deportes', 'Arte', 'Cine', 'Baile', 'Natación', 'Ciclismo',
    'Videojuegos', 'Meditación', 'Voluntariado', 'Teatro', 'Surf',
    'Escalada', 'Camping', 'Pesca', 'Pintura', 'Escritura'
  ];

  const destinations = [
    'Japón', 'Tailandia', 'Bali (Indonesia)', 'Italia', 'Francia', 'España', 'Grecia',
    'Portugal', 'Marruecos', 'Egipto', 'Turquía', 'Islandia', 'Noruega',
    'Suecia', 'Suiza', 'Austria', 'Alemania', 'Reino Unido', 'Irlanda',
    'Nueva Zelanda', 'Australia', 'Estados Unidos', 'Canadá', 'México',
    'Perú', 'Argentina', 'Chile', 'Brasil', 'Colombia', 'Costa Rica',
    'Cuba', 'Maldivas', 'Dubai (EAU)', 'India', 'Vietnam', 'Camboya',
    'Indonesia', 'Filipinas', 'Singapur', 'Corea del Sur', 'China',
    'Nepal', 'Croacia', 'República Checa', 'Hungría', 'Polonia', 'Rusia'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMultiSelect = (field, value) => {
    const currentValues = formData[field];
    if (currentValues.includes(value)) {
      setFormData({
        ...formData,
        [field]: currentValues.filter(item => item !== value)
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentValues, value]
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La foto debe ser menor a 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!photoFile) {
      setError('Por favor sube una foto de perfil');
      return;
    }

    if (formData.hobbies.length === 0) {
      setError('Selecciona al menos un hobby o interés');
      return;
    }

    if (formData.wantsToVisit.length === 0) {
      setError('Selecciona al menos un destino que quieras visitar');
      return;
    }

    if (formData.languages.length === 0) {
      setError('Selecciona al menos un idioma que hables');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      let photoURL = '';

      // Subir foto
      const photoRef = ref(storage, `profiles/${user.uid}/photo_${Date.now()}`);
      await uploadBytes(photoRef, photoFile);
      photoURL = await getDownloadURL(photoRef);

      // Guardar perfil
      const profileData = {
        ...formData,
        age: parseInt(formData.age),
        photo: photoURL,
        userId: user.uid,
        email: user.email,
        verified: false,
        premium: false,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      onProfileComplete();
    } catch (err) {
      console.error('Error:', err);
      setError('Error al guardar el perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 my-8">
        <div className="flex items-center gap-2 mb-6">
          <GlobeIcon className="text-teal-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800">Crea tu Perfil</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de perfil */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-teal-500">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-teal-600 p-3 rounded-full cursor-pointer hover:bg-teal-700 transition shadow-lg">
                <Camera size={20} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  required
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">Haz clic en la cámara para subir tu foto *</p>
            <p className="text-xs text-gray-500">Máximo 5MB</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Tu nombre"
              required
            />
          </div>

          {/* Edad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edad *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Tu edad"
              min="18"
              max="100"
              required
            />
          </div>

          {/* Nacionalidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nacionalidad *
            </label>
            <select
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona tu nacionalidad</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación actual *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Ej: Madrid, España"
              required
            />
          </div>

          {/* Idiomas - Selección múltiple */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <LanguagesIcon size={18} />
              Idiomas que hablas * (Selecciona al menos uno)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-lg">
              {languagesOptions.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleMultiSelect('languages', lang)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    formData.languages.includes(lang)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            {formData.languages.length > 0 && (
              <p className="text-sm text-purple-600 mt-2">
                Seleccionados: {formData.languages.join(', ')}
              </p>
            )}
          </div>

          {/* Educación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Educación/Profesión
            </label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Ej: Arquitectura, Ingeniero"
            />
          </div>

          {/* Biografía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobre mí *
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Cuéntanos sobre ti..."
              rows="4"
              required
            />
          </div>

          {/* Hobbies - Selección múltiple */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Heart size={18} />
              Hobbies e intereses * (Selecciona al menos uno)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-lg">
              {hobbiesOptions.map(hobby => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => handleMultiSelect('hobbies', hobby)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    formData.hobbies.includes(hobby)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
            {formData.hobbies.length > 0 && (
              <p className="text-sm text-teal-600 mt-2">
                Seleccionados: {formData.hobbies.join(', ')}
              </p>
            )}
          </div>

          {/* Destinos que quiere visitar - Selección múltiple */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={18} className="text-blue-600" />
              Destinos que quieres visitar * (Selecciona al menos uno)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-lg">
              {destinations.map(dest => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => handleMultiSelect('wantsToVisit', dest)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    formData.wantsToVisit.includes(dest)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
            {formData.wantsToVisit.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                Seleccionados: {formData.wantsToVisit.join(', ')}
              </p>
            )}
          </div>

          {/* Lugares ya visitados - Selección múltiple */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={18} className="text-green-600" />
              Lugares donde ya he estado (Opcional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-lg">
              {destinations.map(dest => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => handleMultiSelect('placesVisited', dest)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    formData.placesVisited.includes(dest)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
            {formData.placesVisited.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                Seleccionados: {formData.placesVisited.join(', ')}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50 text-lg"
          >
            {loading ? 'Guardando...' : 'Crear Perfil'}
          </button>
        </form>

        {/* Área de Soporte Técnico */}
        <div className="mt-8 border-t pt-6">
          <button
            onClick={() => setShowSupport(!showSupport)}
            className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition"
          >
            <HelpCircle size={20} />
            <span className="font-medium">¿Problemas técnicos? Contáctanos</span>
          </button>

          {showSupport && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Soporte Técnico</h3>
              <p className="text-sm text-gray-600 mb-3">
                Si tienes problemas para crear tu perfil, subir tu foto, o cualquier otra dificultad técnica, contáctanos:
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:soporte@globemate.com"
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                >
                  <Mail size={16} />
                  soporte@globemate.com
                </a>
                <p className="text-xs text-gray-500">
                  Tiempo de respuesta: 24-48 horas
                </p>
                <div className="mt-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">Problemas comunes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>La foto no se sube: Verifica que sea menor a 5MB</li>
                    <li>No puedo guardar: Completa todos los campos obligatorios (*)</li>
                    <li>La página no carga: Intenta refrescar (F5)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;