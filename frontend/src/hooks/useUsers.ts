import { useState, useEffect, useCallback } from 'react';
import { User, CreateUserRequest, UpdateUserRequest } from '../types/user';
import { userApi } from '../services/api/userApi';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<User>;
  updateUser: (id: string, userData: UpdateUserRequest) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  getUser: (id: string) => Promise<User>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userApi.getUsers();
      setUsers(usersData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserRequest): Promise<User> => {
    try {
      setError(null);
      const newUser = await userApi.createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      return newUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateUser = useCallback(async (id: string, userData: UpdateUserRequest): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await userApi.updateUser(id, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === id ? updatedUser : user)
      );
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await userApi.deleteUser(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getUser = useCallback(async (id: string): Promise<User> => {
    try {
      setError(null);
      return await userApi.getUser(id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  return {
    users,
    loading,
    error,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser
  };
};