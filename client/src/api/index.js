import axiosInstance from './axiosConfig';

// ── Auth ───────────────────────────────────────────────────────
export const authAPI = {
    register: (data)   => axiosInstance.post('/auth/register', data),
    login:    (data)   => axiosInstance.post('/auth/login', data),
    getMe:    ()       => axiosInstance.get('/auth/me'),
};

// ── Users ──────────────────────────────────────────────────────
export const userAPI = {
    getProfile:   (id)       => axiosInstance.get(`/users/${id}`),
    updateProfile:(id, data) => axiosInstance.put(`/users/${id}`, data),
    uploadPicture:(id, data) => axiosInstance.post(`/users/${id}/upload`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    follow:       (id)       => axiosInstance.post(`/users/${id}/follow`),
    unfollow:     (id)       => axiosInstance.delete(`/users/${id}/unfollow`),
    search:       (query)    => axiosInstance.get(`/users/search?q=${query}`),
};

// ── Workouts ───────────────────────────────────────────────────
export const workoutAPI = {
    create:       (data)     => axiosInstance.post('/workouts', data),
    getUserWorkouts:(userId) => axiosInstance.get(`/workouts/user/${userId}`),
    getById:      (id)       => axiosInstance.get(`/workouts/${id}`),
    update:       (id, data) => axiosInstance.put(`/workouts/${id}`, data),
    delete:       (id)       => axiosInstance.delete(`/workouts/${id}`),
    getHeatmap:   (userId)   => axiosInstance.get(`/workouts/heatmap/${userId}`),
};

// ── Exercises ──────────────────────────────────────────────────
export const exerciseAPI = {
    getAll:    (muscleGroup) => axiosInstance.get(
        muscleGroup ? `/exercises?muscleGroup=${muscleGroup}` : '/exercises'
    ),
    getById:   (id)          => axiosInstance.get(`/exercises/${id}`),
    create:    (data)        => axiosInstance.post('/exercises', data),
    delete:    (id)          => axiosInstance.delete(`/exercises/${id}`),
};

// ── Nutrition ──────────────────────────────────────────────────
export const nutritionAPI = {
    search:     (query)               => axiosInstance.get(`/nutrition/search?q=${query}`),
    logFood:    (data)                => axiosInstance.post('/nutrition/log', data),
    getDailyLog:(userId, date)        => axiosInstance.get(`/nutrition/log/${userId}/${date}`),
    deleteEntry:(entryId)             => axiosInstance.delete(`/nutrition/log/${entryId}`),
    getSummary: (userId, start, end)  => axiosInstance.get(
        `/nutrition/summary/${userId}?startDate=${start}&endDate=${end}`
    ),
};

// ── Posts ──────────────────────────────────────────────────────
export const postAPI = {
    create:        (data)        => axiosInstance.post('/posts', data),
    getFeed:       (page, limit) => axiosInstance.get(`/posts/feed?page=${page}&limit=${limit}`),
    getUserPosts:  (userId)      => axiosInstance.get(`/posts/user/${userId}`),
    getById:       (id)          => axiosInstance.get(`/posts/${id}`),
    toggleLike:    (id)          => axiosInstance.put(`/posts/${id}/like`),
    addComment:    (id, data)    => axiosInstance.post(`/posts/${id}/comment`, data),
    deleteComment: (id, commentId) => axiosInstance.delete(`/posts/${id}/comment/${commentId}`),
    delete:        (id)          => axiosInstance.delete(`/posts/${id}`),
};

// ── Challenges ─────────────────────────────────────────────────
export const challengeAPI = {
    create:       (data)  => axiosInstance.post('/challenges', data),
    getAll:       (status)=> axiosInstance.get(
        status ? `/challenges?status=${status}` : '/challenges'
    ),
    getById:      (id)    => axiosInstance.get(`/challenges/${id}`),
    join:         (id)    => axiosInstance.post(`/challenges/${id}/join`),
    leave:        (id)    => axiosInstance.delete(`/challenges/${id}/leave`),
    submit:       (id, data) => axiosInstance.post(`/challenges/${id}/submit`, data),
    getLeaderboard:(id)   => axiosInstance.get(`/challenges/${id}/leaderboard`),
    delete:       (id)    => axiosInstance.delete(`/challenges/${id}`),
};

// ── Notifications ──────────────────────────────────────────────
export const notificationAPI = {
    getAll:      () => axiosInstance.get('/notifications'),
    getUnreadCount:() => axiosInstance.get('/notifications/unread-count'),
    markAsRead:  (id) => axiosInstance.put(`/notifications/${id}/read`),
    markAllRead: () => axiosInstance.put('/notifications/read-all'),
    delete:      (id) => axiosInstance.delete(`/notifications/${id}`),
};