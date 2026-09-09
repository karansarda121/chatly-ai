import api from './api.js';
export async function getWorkItems() { const { data } = await api.get('/api/work-items'); return data.items; }
export async function createWorkItem(item) { const { data } = await api.post('/api/work-items', item); return data.item; }
export async function updateWorkItem(itemId, status) { const { data } = await api.patch(`/api/work-items/${itemId}`, { status }); return data.item; }
