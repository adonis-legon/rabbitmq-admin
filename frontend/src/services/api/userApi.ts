import apiClient from './apiClient';
import { User, CreateUserRequest, UpdateUserRequest } from '../../types/user';

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  }
};