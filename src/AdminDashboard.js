import React, { useState } from 'react';
import { Users, TrendingUp, DollarSign, Award, Mail, MapPin, Globe, Languages as LanguagesIcon } from 'lucide-react';

const AdminDashboard = ({ allUsers, currentUser }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  const stats = {
    totalUsers: allUsers.length,
    verifiedUsers: allUsers.filter(u => u.verified).length,
    premiumUsers: allUsers.filter(u => u.premium).length,
    totalBalance: allUsers.reduce((sum, u) => sum + (u.balance || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Administrador</h1>
          <p className="text-gray-600">Bienvenida, {currentUser.name}</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={32} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Usuarios</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="text-green-600" size={32} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Verificados</p>
                <p className="text-3xl font-bold">{stats.verifiedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="text-purple-600" size={32} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Premium</p>
                <p className="text-3xl font-bold">{stats.premiumUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <DollarSign className="text-teal-600" size={32} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Balance Total</p>
                <p className="text-3xl font-bold">€{stats.totalBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Todos los Usuarios</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Usuario</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Edad</th>
                  <th className="text-left py-3 px-4">Nacionalidad</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-left py-3 px-4">Balance</th>
                  <th className="text-left py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.photo || 'https://via.placeholder.com/40'} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">{user.age}</td>
                    <td className="py-3 px-4">{user.nationality}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {user.verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            Verificado
                          </span>
                        )}
                        {user.premium && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            Premium
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">€{(user.balance || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de detalles de usuario */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">Detalles del Usuario</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedUser.photo || 'https://via.placeholder.com/100'} 
                    alt={selectedUser.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-bold">{selectedUser.name}</h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <p className="text-sm text-gray-500">Código de referido: {selectedUser.referralCode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Edad</p>
                    <p className="font-medium">{selectedUser.age} años</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nacionalidad</p>
                    <p className="font-medium">{selectedUser.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-medium">{selectedUser.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Educación</p>
                    <p className="font-medium">{selectedUser.education || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Biografía</p>
                  <p className="text-gray-800">{selectedUser.bio}</p>
                </div>

                {selectedUser.languages && selectedUser.languages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <LanguagesIcon size={16} />
                      Idiomas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.languages.map((lang, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.hobbies && selectedUser.hobbies.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Hobbies e intereses</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.hobbies.map((hobby, i) => (
                        <span key={i} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.wantsToVisit && selectedUser.wantsToVisit.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Quiere visitar</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.wantsToVisit.map((dest, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.placesVisited && selectedUser.placesVisited.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Ya ha visitado</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.placesVisited.map((place, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Usuario creado: {new Date(selectedUser.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;