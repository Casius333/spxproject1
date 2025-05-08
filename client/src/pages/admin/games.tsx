import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AdminLayout } from './index';
import { Gamepad2, Plus, Pencil, Trash2, MoreHorizontal, Search } from 'lucide-react';
import { Game } from '@shared/schema';

export default function AdminGames() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();
  
  // Fetch all games
  const { data: games, isLoading, error } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  // Filter games based on search query
  const filteredGames = games?.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Game Management">
      <div className="rounded-lg border border-primary/20 bg-dark-card shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Gamepad2 className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-xl font-semibold">Game Management</h2>
          </div>
          
          <button className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-md flex items-center transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add New Game
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search games by title or provider..."
              className="w-full pl-10 pr-4 py-2 bg-dark rounded-md border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Games Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Image</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Provider</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center text-gray-400">Loading games...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center text-red-500">Error loading games</td>
                </tr>
              ) : filteredGames?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-center text-gray-400">No games found</td>
                </tr>
              ) : (
                filteredGames?.map((game) => (
                  <tr key={game.id} className="border-b border-primary/10 hover:bg-dark/50">
                    <td className="px-4 py-4 text-sm">{game.id}</td>
                    <td className="px-4 py-4">
                      <img src={game.image} alt={game.title} className="w-16 h-16 object-cover rounded" />
                    </td>
                    <td className="px-4 py-4 font-medium">{game.title}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">{game.provider}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">{game.category || 'None'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        game.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
                      }`}>
                        {game.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button className="text-primary hover:text-primary-light transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}