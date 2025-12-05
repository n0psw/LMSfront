import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/api';
import type { User, UserListResponse, CreateUserRequest, UpdateUserRequest, Group } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  GraduationCap,
  UserCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';

interface UserFormData {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'curator' | 'admin';
  student_id?: string;
  password?: string;
  is_active: boolean;
  group_ids?: number[];  // Changed to array for multiple groups
}

interface GroupFormData {
  name: string;
  description?: string;
  teacher_id: number;
  curator_id?: number;
  student_ids: number[];
  is_active: boolean;
}

interface GroupWithDetails extends Group {
  teacher_name?: string;
  curator_name?: string;
  students?: User[];
}

interface TeacherGroup {
  teacher_name: string;
  teacher_id?: number;
  students: User[];
  total_students: number;
  is_expanded?: boolean;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'student');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group_id') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('is_active') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  // Teacher groups for student grouping
  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([]);
  
  // Teachers and curators for group creation
  const [teachers, setTeachers] = useState<User[]>([]);
  const [curators, setCurators] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'student',
    student_id: '',
    password: '',
    is_active: true,
    group_ids: []  // Initialize as empty array
  });

  const [groupFormData, setGroupFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    teacher_id: 0,
    curator_id: undefined,
    student_ids: [],
    is_active: true
  });

  const [editGroupFormData, setEditGroupFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    teacher_id: 0,
    curator_id: undefined,
    student_ids: [],
    is_active: true
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [groupFormErrors, setGroupFormErrors] = useState<{ [key: string]: string }>({});
  const [editGroupFormErrors, setEditGroupFormErrors] = useState<{ [key: string]: string }>({});
  
  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
    loadGroups();
    loadTeachersAndCurators();
  }, [currentPage, roleFilter, groupFilter, statusFilter, searchQuery]);

  // Force refresh when component mounts or when data changes
  useEffect(() => {
    const refreshData = () => {
      loadUsers();
      loadGroups();
      loadTeachersAndCurators();
    };
    
    // Refresh data every 30 seconds to ensure we have latest data
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Update URL params when role filter changes to student by default
  useEffect(() => {
    if (!searchParams.get('role') && roleFilter === 'student') {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('role', 'student');
      setSearchParams(newParams);
    }
  }, [roleFilter, searchParams, setSearchParams]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
        group_id: groupFilter && groupFilter !== 'all' ? parseInt(groupFilter) : undefined,
        is_active: statusFilter && statusFilter !== 'all' ? statusFilter === 'true' : undefined,
        search: searchQuery || undefined
      };
      
      const response = await apiClient.getUsers(params);
      
      // Проверяем структуру ответа
      if (Array.isArray(response)) {
        // API возвращает массив пользователей напрямую
        console.log('Users data (array):', response);
        console.log('Students in users data:', response.filter((u: User) => u.role === 'student'));
        setUsers(response);
        setTotalUsers(response.length);
      } else if (response && typeof response === 'object' && response.users) {
        // API возвращает объект с полем users
        console.log('Users data (object):', response.users);
        console.log('Students in users data:', response.users.filter((u: User) => u.role === 'student'));
        setUsers(response.users);
        setTotalUsers(response.total || response.users.length);
      } else {
        // Неожиданный формат
        console.log('Unexpected response format:', response);
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
      setUsers([]);
      setTotalUsers(0);
      showToast('error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groupsData = await apiClient.getGroups();
      console.log('Groups data:', groupsData);
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const loadTeachersAndCurators = async () => {
    try {
      const response = await apiClient.getUsers({ limit: 1000 });
      const allUsers = Array.isArray(response) ? response : response.users || [];
      const teachersList = allUsers.filter((user: User) => user.role === 'teacher' && user.is_active);
      const curatorsList = allUsers.filter((user: User) => user.role === 'curator' && user.is_active);
      const studentsList = allUsers.filter((user: User) => user.role === 'student' && user.is_active);
      
      setTeachers(teachersList);
      setCurators(curatorsList);
      setStudents(studentsList);
    } catch (error) {
      console.error('Failed to load teachers and curators:', error);
      setTeachers([]);
      setCurators([]);
      setStudents([]);
    }
  };

  // Group students by teacher when role filter is student and users are loaded
  useEffect(() => {
    if (users.length > 0 && roleFilter === 'student') {
      console.log('Grouping students after users loaded...');
      groupStudentsByTeacher();
    } else if (roleFilter !== 'student') {
      console.log('Clearing teacher groups - not student filter');
      setTeacherGroups([]);
    }
  }, [users, roleFilter]);

  // Function to group students by teacher
  const groupStudentsByTeacher = () => {
    const students = users.filter(user => user.role === 'student');
    console.log('Students for grouping:', students);
    console.log('All users:', users);
    const groupsMap = new Map<string, TeacherGroup>();
    
    students.forEach(student => {
      const teacherName = student.teacher_name || 'No Teacher Assigned';
      console.log(`Student ${student.name} has teacher: ${teacherName}`);
      console.log(`Student ${student.name} full data:`, student);
      
      if (!groupsMap.has(teacherName)) {
        groupsMap.set(teacherName, {
          teacher_name: teacherName,
          teacher_id: undefined,
          students: [],
          total_students: 0,
          is_expanded: false
        });
      }
      
      const group = groupsMap.get(teacherName)!;
      group.students.push(student);
      group.total_students = group.students.length;
    });
    
    const teacherGroupsArray = Array.from(groupsMap.values());
    console.log('Teacher groups:', teacherGroupsArray);
    setTeacherGroups(teacherGroupsArray);
  };

  const handleFilterChange = (filter: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(filter, value);
    } else {
      newParams.delete(filter);
    }
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const validateForm = (): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      // Простая валидация email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    return errors;
  };

  const validateGroupForm = (): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    if (!groupFormData.name.trim()) {
      errors.name = 'Group name is required';
    }
    if (!groupFormData.teacher_id) {
      errors.teacher_id = 'Teacher is required';
    }
    
    return errors;
  };

  const validateEditGroupForm = (): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    if (!editGroupFormData.name.trim()) {
      errors.name = 'Group name is required';
    }
    if (!editGroupFormData.teacher_id) {
      errors.teacher_id = 'Teacher is required';
    }
    
    return errors;
  };

  const handleCreateUser = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Please fix the form errors');
      return;
    }
    setFormErrors({});

    try {
      const userData: CreateUserRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        student_id: formData.student_id || undefined,
        password: formData.password || undefined,
        is_active: formData.is_active,
        group_ids: formData.group_ids && formData.group_ids.length > 0 ? formData.group_ids : undefined
      };
      
      const newUser = await apiClient.createUser(userData);
      
      // Groups are now assigned in backend during user creation
      const groupCount = formData.group_ids?.length || 0;
      if (groupCount > 0) {
        showToast('success', `User created successfully and added to ${groupCount} group(s)`);
      } else {
        showToast('success', 'User created successfully');
      }
      
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      showToast('error', 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Please fix the form errors');
      return;
    }
    setFormErrors({});
    
    try {
      const userData: UpdateUserRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        student_id: formData.student_id || undefined,
        password: formData.password || undefined,
        is_active: formData.is_active,
        group_ids: formData.role === 'student' ? formData.group_ids : undefined
      };
      
      await apiClient.updateUser(Number(selectedUser.id), userData);
      
      const groupCount = formData.group_ids?.length || 0;
      if (formData.role === 'student' && groupCount > 0) {
        showToast('success', `User updated successfully with ${groupCount} group(s)`);
      } else {
        showToast('success', 'User updated successfully');
      }
      
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      showToast('error', 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiClient.deactivateUser(Number(selectedUser.id));
      showToast('success', 'User deactivated successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      showToast('error', 'Failed to deactivate user');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await apiClient.deleteGroup(selectedGroup.id);
      showToast('success', 'Group deleted successfully');
      setShowDeleteModal(false);
      setSelectedGroup(null);
      loadGroups();
      loadUsers(); // Reload users to update group information
    } catch (error) {
      console.error('Failed to delete group:', error);
      showToast('error', 'Failed to delete group');
    }
  };

  const handleCreateGroup = async () => {
    const errors = validateGroupForm();
    if (Object.keys(errors).length > 0) {
      setGroupFormErrors(errors);
      showToast('error', 'Please fix the form errors');
      return;
    }
    setGroupFormErrors({});

    try {
      const groupData = {
        name: groupFormData.name.trim(),
        description: groupFormData.description?.trim() || undefined,
        teacher_id: groupFormData.teacher_id,
        curator_id: groupFormData.curator_id || undefined,
        is_active: groupFormData.is_active
      };
      
      const newGroup = await apiClient.createGroup(groupData);
      showToast('success', 'Group created successfully');
      
      // Add students to the group if any are selected
      if (groupFormData.student_ids.length > 0) {
        try {
          await apiClient.bulkAddStudentsToGroup(newGroup.id, groupFormData.student_ids);
          showToast('success', `Group created and ${groupFormData.student_ids.length} students added`);
        } catch (error) {
          console.error('Failed to add students to group:', error);
          showToast('error', 'Group created but failed to add students');
        }
      }
      
      setShowCreateGroupModal(false);
      resetGroupForm();
      loadGroups();
      loadUsers(); // Reload users to update group information
    } catch (error) {
      console.error('Failed to create group:', error);
      showToast('error', 'Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    
    const errors = validateEditGroupForm();
    if (Object.keys(errors).length > 0) {
      setEditGroupFormErrors(errors);
      showToast('error', 'Please fix the form errors');
      return;
    }
    setEditGroupFormErrors({});

    try {
      const groupData = {
        name: editGroupFormData.name.trim(),
        description: editGroupFormData.description?.trim() || undefined,
        teacher_id: editGroupFormData.teacher_id,
        curator_id: editGroupFormData.curator_id || undefined,
        is_active: editGroupFormData.is_active,
        student_ids: editGroupFormData.student_ids  // Include student list
      };
      
      await apiClient.updateGroup(selectedGroup.id, groupData);
      showToast('success', 'Group updated successfully');
      
      setShowEditGroupModal(false);
      resetEditGroupForm();
      loadGroups();
      loadUsers(); // Reload users to update group information
    } catch (error) {
      console.error('Failed to update group:', error);
      showToast('error', 'Failed to update group');
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const result = await apiClient.resetUserPassword(userId);
      showToast('success', `Password reset. New password: ${result.new_password}`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      showToast('error', 'Failed to reset password');
    }
  };

  const openEditModal = async (user: User) => {
    setSelectedUser(user);
    
    // Fetch user's current groups if student
    let userGroupIds: number[] = [];
    if (user.role === 'student') {
      try {
        const groupsData = await apiClient.getUserGroups(Number(user.id));
        userGroupIds = groupsData.group_ids || [];
      } catch (error) {
        console.error('Failed to load user groups:', error);
      }
    }
    
    setFormData({
      name: user.name || user.full_name || '',
      email: user.email,
      role: user.role,
      student_id: user.student_id || '',
      password: '',
      is_active: user.is_active ?? true,
      group_ids: userGroupIds
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      student_id: '',
      password: '',
      is_active: true,
      group_ids: []
    });
    setSelectedUser(null);
    setFormErrors({});
  };

  const resetGroupForm = () => {
    setGroupFormData({
      name: '',
      description: '',
      teacher_id: 0,
      curator_id: undefined,
      student_ids: [],
      is_active: true
    });
    setGroupFormErrors({});
  };

  const openEditGroupModal = (group: GroupWithDetails) => {
    setSelectedGroup(group);
    setEditGroupFormData({
      name: group.name,
      description: group.description || '',
      teacher_id: group.teacher_id,
      curator_id: group.curator_id || undefined,
      student_ids: group.students?.map(s => Number(s.id)) || [],
      is_active: group.is_active
    });
    setShowEditGroupModal(true);
  };

  const resetEditGroupForm = () => {
    setEditGroupFormData({
      name: '',
      description: '',
      teacher_id: 0,
      curator_id: undefined,
      student_ids: [],
      is_active: true
    });
    setSelectedGroup(null);
    setEditGroupFormErrors({});
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            onClick={() => navigate('/admin/dashboard')}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={() => setShowCreateGroupModal(true)}
            variant="outline"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search users"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange('search', e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  handleFilterChange('role', value);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="curator">Curator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="group" className="text-sm font-medium">Group</Label>
              <Select
                value={groupFilter}
                onValueChange={(value) => {
                  setGroupFilter(value);
                  handleFilterChange('group_id', value);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  handleFilterChange('is_active', value);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={searchParams.get('tab') || '0'}
        onValueChange={(value) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set('tab', value);
          setSearchParams(newParams);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="0">Users</TabsTrigger>
          <TabsTrigger value="1">Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="0">
          {/* Users Tab Content */}
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {roleFilter === 'student' ? 
                  `Students (${totalUsers})` : 
                  `Users (${totalUsers})`
                }
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={loadUsers}
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader size="lg" animation="spin" color="#2563eb" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800">Error loading users</h3>
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={loadUsers}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleFilter === 'student' && teacherGroups.length > 0 ? (
                      // Show grouped students by teacher
                      teacherGroups.map((teacherGroup) => (
                        <React.Fragment key={teacherGroup.teacher_name}>
                          {/* Teacher group header */}
                          <tr className="hover:bg-gray-50 bg-blue-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTeacherGroups(prev => prev.map(group => 
                                      group.teacher_name === teacherGroup.teacher_name 
                                        ? { ...group, is_expanded: !group.is_expanded }
                                        : group
                                    ));
                                  }}
                                  className="p-0 h-6 w-6"
                                >
                                  {teacherGroup.is_expanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {teacherGroup.teacher_name}
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                      {teacherGroup.total_students} students
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                                Teacher Group
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500">-</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Expand/Collapse"
                                  onClick={() => {
                                    setTeacherGroups(prev => prev.map(group => 
                                      group.teacher_name === teacherGroup.teacher_name 
                                        ? { ...group, is_expanded: !group.is_expanded }
                                        : group
                                    ));
                                  }}
                                >
                                  {teacherGroup.is_expanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Student rows when expanded */}
                          {teacherGroup.is_expanded && teacherGroup.students.map((student) => (
                            <tr key={student.id || student.email} className="hover:bg-gray-50 bg-gray-25">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="ml-8">
                                  <div className="text-sm font-medium text-gray-900">{student.name || student.full_name}</div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                  {student.student_id && (
                                    <div className="text-xs text-gray-400">ID: {student.student_id}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                  student
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.teacher_name || student.curator_name ? (
                                  <div className="text-sm">
                                    {student.teacher_name && (
                                      <div className="text-xs text-gray-500">👨‍🏫 {student.teacher_name}</div>
                                    )}
                                    {student.curator_name && (
                                      <div className="text-xs text-gray-500">👨‍💼 {student.curator_name}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No group</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  student.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {student.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    onClick={() => openEditModal(student)}
                                    variant="ghost"
                                    size="sm"
                                    title="Edit User"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => openDeleteModal(student)}
                                    variant="ghost"
                                    size="sm"
                                    title="Deactivate User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
                      // Show regular user list for non-student roles
                      users?.map((user) => (
                        <tr key={user.id || user.email} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name || user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.student_id && (
                                <div className="text-xs text-gray-400">ID: {user.student_id}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-700' :
                              user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'curator' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.teacher_name || user.curator_name ? (
                              <div className="text-sm">
                                {user.teacher_name && (
                                  <div className="text-xs text-gray-500">👨‍🏫 {user.teacher_name}</div>
                                )}
                                {user.curator_name && (
                                  <div className="text-xs text-gray-500">👨‍💼 {user.curator_name}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No group</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleResetPassword(Number(user.id))}
                                variant="ghost"
                                size="sm"
                                title="Reset Password"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => openEditModal(user)}
                                variant="ghost"
                                size="sm"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => openDeleteModal(user)}
                                variant="ghost"
                                size="sm"
                                title="Deactivate User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      {roleFilter === 'student' ? 
                        `Showing ${teacherGroups.length} teacher groups with ${totalUsers} students` :
                        `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalUsers)} of ${totalUsers} results`
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
        </TabsContent>
        <TabsContent value="1">
          {/* Groups Tab Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-6 h-6 mr-2 text-blue-600" />
                  Groups Management ({groups.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={loadGroups}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Curator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups?.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-gray-500">{group.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                          {group.teacher_name || 'No Teacher'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {group.curator_name ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {group.curator_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">No Curator</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          {group.student_count || 0} students
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          group.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {group.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => openEditGroupModal(group)}
                            variant="ghost"
                            size="sm"
                            title="Edit Group"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedGroup(group);
                              setShowDeleteModal(true);
                            }}
                            variant="ghost"
                            size="sm"
                            title="Delete Group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        onSubmit={handleCreateUser}
        submitText="Create User"
      >
        <UserForm
          formData={formData}
          setFormData={setFormData}
          groups={groups}
          onSubmit={handleCreateUser}
          submitText="Create User"
          errors={formErrors}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        onSubmit={handleUpdateUser}
        submitText="Update User"
      >
        <UserForm
          formData={formData}
          setFormData={setFormData}
          groups={groups}
          onSubmit={handleUpdateUser}
          submitText="Update User"
          errors={formErrors}
        />
      </Modal>

      {/* Create Group Modal */}
      <Modal
        open={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create New Group"
        onSubmit={handleCreateGroup}
        submitText="Create Group"
      >
        <GroupForm
          formData={groupFormData}
          setFormData={setGroupFormData}
          teachers={teachers}
          curators={curators}
          students={students}
          errors={groupFormErrors}
        />
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        open={showEditGroupModal}
        onClose={() => {
          setShowEditGroupModal(false);
          resetEditGroupForm();
        }}
        title="Edit Group"
        onSubmit={handleUpdateGroup}
        submitText="Update Group"
      >
        <GroupForm
          formData={editGroupFormData}
          setFormData={setEditGroupFormData}
          teachers={teachers}
          curators={curators}
          students={students}
          errors={editGroupFormErrors}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
          setSelectedGroup(null);
        }}
        title={selectedUser ? "Deactivate User" : "Delete Group"}
        onSubmit={selectedUser ? handleDeleteUser : handleDeleteGroup}
        submitText={selectedUser ? "Deactivate" : "Delete"}
      >
        <div>
          <p className="text-gray-600 mb-4">
            {selectedUser ? (
              <>Are you sure you want to deactivate <strong>{selectedUser.name}</strong>? This action can be undone later.</>
            ) : (
              <>Are you sure you want to delete <strong>{selectedGroup?.name}</strong>? This action cannot be undone.</>
            )}
          </p>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-card z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
          <button 
            onClick={() => setToast(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// User Form Component
interface UserFormProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  groups: GroupWithDetails[];
  onSubmit: () => void;
  submitText: string;
  errors?: { [key: string]: string };
}

function UserForm({ formData, setFormData, groups, onSubmit, submitText, errors = {} }: UserFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-1">
          <Label htmlFor="name" className="text-sm font-medium">Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>
        
        <div className="p-1">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
      </div>
      
        <div className="p-1">
          <Label htmlFor="role" className="text-sm font-medium">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => {
              const newRole = value as any;
              setFormData({ 
                ...formData, 
                role: newRole,
                // Очищаем выбор групп если роль не student
                group_ids: newRole === 'student' ? formData.group_ids : []
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="curator">Curator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Multiple groups selection - only for students */}
        {formData.role === 'student' && (
          <div className="p-1">
            <Label className="text-sm font-medium">Groups (Multiple Selection)</Label>
            <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
              {groups.length === 0 ? (
                <p className="text-gray-500 text-sm">No groups available</p>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={formData.group_ids?.includes(Number(group.id)) || false}
                      onCheckedChange={(checked) => {
                        const currentGroups = formData.group_ids || [];
                        const groupId = Number(group.id);
                        if (checked) {
                          setFormData({ 
                            ...formData, 
                            group_ids: [...currentGroups, groupId] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            group_ids: currentGroups.filter(id => id !== groupId) 
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                      {group.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {formData.group_ids && formData.group_ids.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Selected {formData.group_ids.length} group(s)
              </p>
            )}
          </div>
        )}
      
      <div className="p-1">
        <Label htmlFor="student_id" className="text-sm font-medium">Student ID</Label>
        <Input
          id="student_id"
          type="text"
          value={formData.student_id || ''}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
          placeholder="Optional"
        />
      </div>
      
      <div className="p-1">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password || ''}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Leave empty for auto-generation"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
        />
        <Label htmlFor="is_active" className="text-sm">
          Active
        </Label>
      </div>
    </div>
  );
}

// Group Form Component
interface GroupFormProps {
  formData: GroupFormData;
  setFormData: (data: GroupFormData) => void;
  teachers: User[];
  curators: User[];
  students: User[];
  errors?: { [key: string]: string };
}

function GroupForm({ formData, setFormData, teachers, curators, students, errors = {} }: GroupFormProps) {
  // Функция для генерации названия группы
  const generateGroupName = (teacherName: string, description?: string) => {
    const firstName = teacherName.split(" ")[0]; // Берем только первое имя
    const suffix = description?.trim() || 'Group';
    return `${firstName} - ${suffix}`;
  };

  // Автоматически обновляем название группы при изменении учителя или описания
  React.useEffect(() => {
    if (formData.teacher_id) {
      const selectedTeacher = teachers.find(t => Number(t.id) === formData.teacher_id);
      if (selectedTeacher) {
        const teacherName = selectedTeacher.name || selectedTeacher.full_name;
        const newName = generateGroupName(teacherName, formData.description);
        setFormData({ ...formData, name: newName });
      }
    }
  }, [formData.teacher_id, formData.description]);

  return (
    <div className="space-y-4">
      {/* Сначала выбор учителя и куратора */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-1">
          <Label htmlFor="teacher" className="text-sm font-medium">Teacher</Label>
          <Select
            value={formData.teacher_id?.toString() || ''}
            onValueChange={(value) => setFormData({ ...formData, teacher_id: parseInt(value) })}
          >
            <SelectTrigger className={errors.teacher_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.name || teacher.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.teacher_id && (
            <p className="text-red-500 text-xs mt-1">{errors.teacher_id}</p>
          )}
        </div>
        
        <div className="p-1">
          <Label htmlFor="curator" className="text-sm font-medium">Curator</Label>
          <Select
            value={formData.curator_id?.toString() || 'none'}
            onValueChange={(value) => setFormData({ ...formData, curator_id: value && value !== 'none' ? parseInt(value) : undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="No curator" />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="none">No curator</SelectItem>
              {curators.map((curator) => (
                <SelectItem key={curator.id} value={curator.id.toString()}>
                  {curator.name || curator.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Затем название группы с автогенерацией */}
      <div className="p-1">
        <Label htmlFor="group_name" className="text-sm font-medium">Group Name</Label>
        <Input
          id="group_name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className={errors.name ? 'border-red-500' : ''}
          placeholder="Group name will be auto-generated when teacher is selected"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Format: "First Name - Description". You can edit this field.
        </p>
      </div>
      
      {/* Описание группы */}
      <div className="p-1">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Input
          id="description"
          type="text"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description (will be used in group name)"
        />
        <p className="text-xs text-gray-500 mt-1">
          This description will be used in the group name format: "Teacher - Description"
        </p>
      </div>
      
      <div className="p-1">
        <Label className="text-sm font-medium">Students (Optional)</Label>
        <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
          {students.length === 0 ? (
            <p className="text-gray-500 text-sm">No students available</p>
          ) : (
            students.map((student) => (
              <div key={student.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`student-${student.id}`}
                  checked={formData.student_ids.includes(Number(student.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        student_ids: [...formData.student_ids, Number(student.id)]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        student_ids: formData.student_ids.filter(id => id !== Number(student.id))
                      });
                    }
                  }}
                />
                <Label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer">
                  {student.name || student.full_name} ({student.email})
                </Label>
              </div>
            ))
          )}
        </div>
        {formData.student_ids.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {formData.student_ids.length} student(s)
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="group_is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
        />
        <Label htmlFor="group_is_active" className="text-sm">
          Active
        </Label>
      </div>
    </div>
  );
}
