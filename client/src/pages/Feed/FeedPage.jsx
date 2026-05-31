import { useState, useEffect, useCallback } from 'react';
import { useNavigate }                       from 'react-router-dom';
import { useAuth }                           from '../../context/AuthContext';
import { postAPI, userAPI }                  from '../../api';
import Spinner from '../../components/common/Spinner';
import toast   from 'react-hot-toast';

const PostCard = ({ post, currentUser, onLike, onComment, onDelete }) => {
    const [showComments,  setShowComments]  = useState(false);
    const [commentText,   setCommentText]   = useState('');
    const [submitting,    setSubmitting]    = useState(false);
    const navigate                          = useNavigate();
    const isLiked = post.likes?.some((l) => l._id === currentUser._id);

    const handleComment = async () => {
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            await onComment(post._id, commentText);
            setCommentText('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">

            {/* Post Header */}
            <div className="flex items-center justify-between">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.user?._id}`)}
                >
                    {post.user?.profilePicture ? (
                        <img
                            src={post.user.profilePicture}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {post.user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-white font-medium">{post.user?.name}</p>
                        <p className="text-slate-500 text-xs">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        {post.postType}
                    </span>
                    {post.user?._id === currentUser._id && (
                        <button
                            onClick={() => onDelete(post._id)}
                            className="text-slate-500 hover:text-red-400 transition"
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>

            {/* Workout Details */}
            {post.workout && (
                <div className="bg-dark border border-border rounded-xl p-4">
                    <p className="text-white font-semibold">
                        💪 {post.workout.title}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                        ⏱ {post.workout.durationMinutes} min ·
                        🏋️ {post.workout.exercises?.length} exercises
                    </p>
                </div>
            )}

            {/* Caption */}
            {post.caption && (
                <p className="text-slate-300">{post.caption}</p>
            )}

            {/* Like + Comment Bar */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
                <button
                    onClick={() => onLike(post._id)}
                    className={`flex items-center gap-2 text-sm transition ${
                        isLiked
                            ? 'text-red-400'
                            : 'text-slate-400 hover:text-red-400'
                    }`}
                >
                    {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                >
                    💬 {post.comments?.length || 0}
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="space-y-3">
                    {post.comments?.map((comment) => (
                        <div key={comment._id} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {comment.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="bg-dark rounded-xl px-3 py-2 flex-1">
                                <p className="text-white text-xs font-medium">
                                    {comment.user?.name}
                                </p>
                                <p className="text-slate-300 text-sm">{comment.text}</p>
                            </div>
                        </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex gap-2">
                        <input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            placeholder="Write a comment..."
                            className="flex-1 bg-dark border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={handleComment}
                            disabled={submitting}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
                        >
                            {submitting ? '...' : 'Post'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeedPage = () => {
    const { user }                          = useAuth();
    const [posts,       setPosts]           = useState([]);
    const [loading,     setLoading]         = useState(true);
    const [loadingMore, setLoadingMore]     = useState(false);
    const [page,        setPage]            = useState(1);
    const [hasMore,     setHasMore]         = useState(true);
    const [caption,     setCaption]         = useState('');
    const [posting,     setPosting]         = useState(false);
    const [searchQ,     setSearchQ]         = useState('');
    const [searchRes,   setSearchRes]       = useState([]);

    useEffect(() => {
        fetchFeed(1, true);
    }, []);

    const fetchFeed = async (pageNum = 1, reset = false) => {
        try {
            reset ? setLoading(true) : setLoadingMore(true);
            const res = await postAPI.getFeed(pageNum, 10);
            setPosts((prev) => reset ? res.data.posts : [...prev, ...res.data.posts]);
            setHasMore(pageNum < res.data.totalPages);
            setPage(pageNum);
        } catch {
            toast.error('Failed to load feed');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handlePost = async () => {
        if (!caption.trim()) return toast.error('Write something first');
        setPosting(true);
        try {
            const res = await postAPI.create({ caption, postType: 'status' });
            setPosts([res.data, ...posts]);
            setCaption('');
            toast.success('Posted!');
        } catch {
            toast.error('Failed to post');
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            await postAPI.toggleLike(postId);
            setPosts((prev) =>
                prev.map((p) => {
                    if (p._id !== postId) return p;
                    const liked = p.likes.some((l) => l._id === user._id);
                    return {
                        ...p,
                        likes: liked
                            ? p.likes.filter((l) => l._id !== user._id)
                            : [...p.likes, { _id: user._id }],
                    };
                })
            );
        } catch {
            toast.error('Action failed');
        }
    };

    const handleComment = async (postId, text) => {
        try {
            const res = await postAPI.addComment(postId, { text });
            setPosts((prev) =>
                prev.map((p) => (p._id === postId ? res.data : p))
            );
        } catch {
            toast.error('Failed to comment');
        }
    };

    const handleDelete = async (postId) => {
        try {
            await postAPI.delete(postId);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
            toast.success('Post deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleSearch = async () => {
        if (!searchQ.trim()) return;
        try {
            const res = await userAPI.search(searchQ);
            setSearchRes(res.data);
        } catch {
            toast.error('Search failed');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">📰 Activity Feed</h1>

            {/* Search Users */}
            <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex gap-2">
                    <input
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search athletes..."
                        className="flex-1 bg-dark border border-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
                    >
                        Search
                    </button>
                </div>
                {searchRes.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {searchRes.map((u) => (
                            <div
                                key={u._id}
                                onClick={() => {
                                    setSearchRes([]);
                                    setSearchQ('');
                                    window.location.href = `/profile/${u._id}`;
                                }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark cursor-pointer transition"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-white text-sm">{u.name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Post */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-3">
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Share your fitness update..."
                            rows={3}
                            className="w-full bg-dark border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary resize-none"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handlePost}
                                disabled={posting}
                                className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {posting ? <Spinner size="sm" /> : 'Post Update'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-lg">No posts yet</p>
                    <p className="text-slate-600 text-sm mt-2">
                        Follow other athletes to see their activity here
                    </p>
                </div>
            ) : (
                <>
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={user}
                            onLike={handleLike}
                            onComment={handleComment}
                            onDelete={handleDelete}
                        />
                    ))}

                    {hasMore && (
                        <button
                            onClick={() => fetchFeed(page + 1)}
                            disabled={loadingMore}
                            className="w-full py-3 border border-border rounded-xl text-slate-400 hover:border-primary hover:text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loadingMore ? <Spinner size="sm" /> : 'Load More'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default FeedPage;