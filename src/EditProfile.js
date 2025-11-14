import React, { useState } from 'react';
import { db, storage, auth } from './firebase';
import { doc, updateDoc } from 'firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, User, MapPin, Heart, Globe as GlobeIcon, HelpCircle, Mail, Languages as LanguagesIcon, X } from 'lucide-react';

const EditProfile = ({ currentProfile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: currentProfile.name || '',
    age: currentProfile.age || '',
    nationality: currentProfile.nationality || '',
    location: currentProfile.location || '',
    education: currentProfile.education || '',
    bio: currentProfile.bio || '',
    hobbies: currentProfile.hobbies || [],
    wantsToVisit: currentProfile.wantsToVisit || [],
    languages: currentProfile.languages || [],
    placesVisited: currentProfile.placesVisited || []
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(currentProfile.photo || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      let photoURL = currentProfile.photo;

      // Subir nueva foto si se seleccionó una
      if (photoFile) {
        const photoRef = ref(storage, `profiles/${user.uid}/photo_${Date.now()}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      // Actualizar perfil
      const updatedData = {
        ...formData,
        age: parseInt(formData.age),
        photo: photoURL
      };

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      onSave();
    } catch (err) {
      console.error('Error:', err);
      setError('Error al actualizar el perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GlobeIcon className="text-teal-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">Editar Perfil</h1>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
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
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">Haz clic en la cámara para cambiar tu foto</p>
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
              required
            />
          </div>

          {/* Idiomas */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <LanguagesIcon size={18} />
              Idiomas que hablas *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
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
              rows="4"
              required
            />
          </div>

          {/* Hobbies */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Heart size={18} />
              Hobbies e intereses *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
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
          </div>

          {/* Destinos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={18} className="text-blue-600" />
              Destinos que quieres visitar *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
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
          </div>

          {/* Lugares visitados */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={18} className="text-green-600" />
              Lugares donde ya he estado
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
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
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;