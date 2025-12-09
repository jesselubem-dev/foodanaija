import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, ArrowLeft, Search, Store, Calendar, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SuperAdminMessages() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list('-created_date'),
    enabled: !!user,
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: !!user,
  });

  const getRestaurantById = (id) => {
    return restaurants.find(r => r.id === id);
  };

  const filteredMessages = messages.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sent Messages</h1>
            <p className="text-gray-500 mt-1">Track all messages sent to restaurants</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-sm text-gray-500">Total Messages</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">
                {messages.filter(m => m.is_read).length}
              </p>
              <p className="text-sm text-gray-500">Read</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-600">
                {messages.filter(m => !m.is_read).length}
              </p>
              <p className="text-sm text-gray-500">Unread</p>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => {
              const restaurant = getRestaurantById(message.restaurant_id);
              return (
                <Card key={message.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {restaurant?.logo_url ? (
                            <img 
                              src={restaurant.logo_url} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Store className="w-5 h-5 text-orange-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-gray-900">{message.title}</h3>
                            <p className="text-sm text-gray-500">To: {message.restaurant_name}</p>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">{message.content}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(message.created_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            Sent by: {message.sent_by}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={message.is_read ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                          {message.is_read ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Read</>
                          ) : (
                            'Unread'
                          )}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMessage(message)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Message Details Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Restaurant</p>
                  <p className="font-medium text-gray-900">{selectedMessage.restaurant_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium text-gray-900">{selectedMessage.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Content</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Sent By</p>
                    <p className="font-medium text-gray-900">{selectedMessage.sent_by}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedMessage.created_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={selectedMessage.is_read ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                      {selectedMessage.is_read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}