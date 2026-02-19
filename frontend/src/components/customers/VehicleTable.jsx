function VehicleTable({ 
  vehicles, 
  onEdit, 
  onDelete, 
  canUpdate, 
  canDelete 
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">License Plate</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Make & Model</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Year</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Color</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Mileage</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-lg">📭 No vehicles found</div>
                  <p className="text-gray-500 text-sm mt-2">Register your first vehicle to get started</p>
                </td>
              </tr>
            ) : (
              vehicles.map(vehicle => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded">
                      {vehicle.license_plate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-800">{vehicle.make} {vehicle.model}</div>
                      {vehicle.fuel_type && (
                        <div className="text-sm text-gray-500">{vehicle.fuel_type} • {vehicle.transmission}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{vehicle.year}</td>
                  <td className="px-6 py-4 text-gray-700">{vehicle.customer?.name}</td>
                  <td className="px-6 py-4 text-gray-700">{vehicle.color || '-'}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.is_active 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canUpdate && (
                        <button
                          onClick={() => onEdit(vehicle)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(vehicle.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VehicleTable