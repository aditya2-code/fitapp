import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams }                                 from 'react-router-dom';
import { useAuth }                                   from '../../context/AuthContext';
import { userAPI, postAPI }                          from '../../api';
import Spinner                                       from '../../components/common/Spinner';
import toast                                         from 'react-hot-toast';

const FITNESS_GOALS = [
    'Strength','Endurance','Weight Loss',
    'Muscle Gain','Flexibility','Cardio','Muscle-Ups',
];

const ProfilePage = () => {
    const { id }                              = useParams();
    const { user: currentUser, updateUser }   = useAuth();
    const isOwnProfile                        = currentUser._id === id;
    const fileRef                             = useRef();

    const [profile,   setProfile]   = useState(null);
    const [posts,     setPosts]     = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [editing,   setEditing]   = useState(false);
    const [uploading, setUploading] = useState(false);
    const [following, setFollowing] = useState(false);
    const [formData,  setFormData]  = useState({
        name: '', fitnessGoals: [],
        metrics: { weight: '', height: '' },
    });

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, postsRes] = await Promise.all([
                userAPI.getProfile(id),
                postAPI.getUserPosts(id),
            ]);
            setProfile(profileRes.data);
            setPosts(postsRes.data);
            setFollowing(
                profileRes.data.followers.some(
                    (f) => f._id === currentUser._id
                )
            );
            setFormData({
                name:         profileRes.data.name,
                fitnessGoals: profileRes.data.fitnessGoals || [],
                metrics: {
                    weight: profileRes.data.metrics?.weight || '',
                    height: profileRes.data.metrics?.height || '',
                },
            });
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [id, currentUser._id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async () => {
        try {
            const res = await userAPI.updateProfile(id, formData);
            setProfile(res.data);
            if (isOwnProfile) updateUser(res.data);
            setEditing(false);
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const data = new FormData();
        data.append('profilePicture', file);
        setUploading(true);
        try {
            const res = await userAPI.uploadPicture(id, data);
            setProfile((p) => ({ ...p, profilePicture: res.data.profilePicture }));
            updateUser({ profilePicture: res.data.profilePicture });
            toast.success('Picture updated!');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (following) {
                await userAPI.unfollow(id);
                setProfile((p) => ({
                    ...p,
                    followers: p.followers.filter((f) => f._id !== currentUser._id),
                }));
                setFollowing(false);
                toast.success('Unfollowed');
            } else {
                await userAPI.follow(id);
                setProfile((p) => ({
                    ...p,
                    followers: [...p.followers, { _id: currentUser._id }],
                }));
                setFollowing(true);
                toast.success('Following!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    const toggleGoal = (goal) => {
        setFormData((prev) => ({
            ...prev,
            fitnessGoals: prev.fitnessGoals.includes(goal)
                ? prev.fitnessGoals.filter((g) => g !== goal)
                : [...prev.fitnessGoals, goal],
        }));
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Profile Header */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">

                    {/* Avatar */}
                    <div className="relative">
                        {profile?.profilePicture ? (
                            <img
                                src={profile.profilePicture}
                                alt="avatar"
                                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {isOwnProfile && (
                            <>
                                <button
                                    onClick={() => fileRef.current.click()}
                                    disabled={uploading}
                                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:opacity-90"
                                >
                                    {uploading ? '...' : '📷'}
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-white">
                            {profile?.name}
                        </h1>
                        <p className="text-slate-400">{profile?.email}</p>

                        {/* Stats */}
                        <div className="flex gap-6 mt-3 justify-center sm:justify-start">
                            <div className="text-center">
                                <p className="text-white font-bold">{posts.length}</p>
                                <p className="text-slate-400 text-xs">Posts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold">
                                    {profile?.followers?.length || 0}
                                </p>
                                <p className="text-slate-400 text-xs">Followers</p>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold">
                                    {profile?.following?.length || 0}
                                </p>
                                <p className="text-slate-400 text-xs">Following</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div>
                        {isOwnProfile ? (
                            <button
                                onClick={() => setEditing(!editing)}
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                            >
                                {editing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        ) : (
                            <button
                                onClick={handleFollow}
                                className={`px-6 py-2 rounded-lg font-medium transition ${
                                    following
                                        ? 'bg-dark border border-border text-white hover:border-red-400 hover:text-red-400'
                                        : 'bg-primary text-white hover:opacity-90'
                                }`}
                            >
                                {following ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                {editing && (
                    <div className="mt-6 border-t border-border pt-6 space-y-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Name
                            </label>
                            <input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">
                                    Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    value={formData.metrics.weight}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            metrics: {
                                                ...formData.metrics,
                                                weight: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    value={formData.metrics.height}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            metrics: {
                                                ...formData.metrics,
                                                height: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-2">
                                Fitness Goals
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {FITNESS_GOALS.map((goal) => (
                                    <button
                                        key={goal}
                                        type="button"
                                        onClick={() => toggleGoal(goal)}
                                        className={`px-3 py-1 rounded-full text-sm border transition ${
                                            formData.fitnessGoals.includes(goal)
                                                ? 'bg-primary border-primary text-white'
                                                : 'bg-dark border-border text-slate-400 hover:border-primary'
                                        }`}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="bg-primary text-white px-8 py-2 rounded-lg hover:opacity-90 transition"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Fitness Goals Display */}
            {profile?.fitnessGoals?.length > 0 && !editing && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-3">🎯 Fitness Goals</h2>
                    <div className="flex flex-wrap gap-2">
                        {profile.fitnessGoals.map((goal) => (
                            <span
                                key={goal}
                                className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-sm"
                            >
                                {goal}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Metrics */}
            {(profile?.metrics?.weight > 0 || profile?.metrics?.height > 0) && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-4">📊 Physical Metrics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-primary">
                                {profile.metrics.weight}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">kg</p>
                        </div>
                        <div className="bg-dark rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-secondary">
                                {profile.metrics.height}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">cm</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Posts */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">
                    🏋️ Activity ({posts.length} posts)
                </h2>
                {posts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No posts yet</p>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div
                                key={post._id}
                                className="bg-dark border border-border rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                        {post.postType}
                                    </span>
                                </div>
                                {post.workout && (
                                    <p className="text-white font-medium mt-1">
                                        💪 {post.workout.title}
                                    </p>
                                )}
                                {post.caption && (
                                    <p className="text-slate-300 text-sm mt-1">
                                        {post.caption}
                                    </p>
                                )}
                                <div className="flex gap-4 mt-2 text-slate-500 text-sm">
                                    <span>❤️ {post.likes?.length || 0}</span>
                                    <span>💬 {post.comments?.length || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;