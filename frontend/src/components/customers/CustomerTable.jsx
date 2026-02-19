function CustomerTable({ 
  customers, 
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">City</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Vehicles</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-lg">📭 No customers found</div>
                  <p className="text-gray-500 text-sm mt-2">Add your first customer to get started</p>
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-800">{customer.name}</div>
                      {customer.company_name && (
                        <div className="text-sm text-gray-500">{customer.company_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{customer.phone}</td>
                  <td className="px-6 py-4 text-gray-700">{customer.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      customer.customer_type === 'business' 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{customer.city || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {customer.vehicles?.length || 0} vehicle{customer.vehicles?.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      customer.is_active 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canUpdate && (
                        <button
                          onClick={() => onEdit(customer)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(customer.id)}
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

export default CustomerTable