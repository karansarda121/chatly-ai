import api from './api.js';

export async function getUsersPage(cursor) {
  const { data } = await api.get('/api/users', { params: cursor ? { cursor } : {} });
  return data;
}

export async function searchUsersPage(query, cursor) {
  const { data } = await api.get('/api/users/search', { params: { query, ...(cursor && { cursor }) } });
  return data;
}

export async function getUsers() {
  const { users } = await getUsersPage();
  return users;
}

export async function searchUsers(query) {
  const { users } = await searchUsersPage(query);
  return users;
}

export async function addContactByEmail(email) {
  const { data } = await api.post('/api/users/contacts', { email });
  return data.user;
}

export async function getBlockedUsers() {
  const { data } = await api.get('/api/users/blocked');
  return data.users;
}

export async function blockUser(userId) {
  const { data } = await api.put(`/api/users/${userId}/block`);
  return data;
}

export async function unblockUser(userId) {
  const { data } = await api.delete(`/api/users/${userId}/block`);
  return data;
}
