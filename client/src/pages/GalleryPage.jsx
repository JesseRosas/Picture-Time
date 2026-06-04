import { useEffect, useState, useRef } from "react";
import NavBar from "../components/NavBar";
import { getPhotos, deletePhoto, reorderPhotos, toggleLike, getComments, postComment, deleteComment } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function GalleryPage() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Drag state — use refs so values are always current inside event handlers
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const photosRef = useRef([]); // mirrors photos state, always current
  const [dragging, setDragging] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    getPhotos()
      .then(data => { setPhotos(data); photosRef.current = data; })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Keep photosRef in sync whenever photos state changes
  useEffect(() => { photosRef.current = photos; }, [photos]);

  // Load comments when a photo is selected
  useEffect(() => {
    if (!selected) { setComments([]); return; }
    getComments(selected._id).then(setComments).catch(console.error);
  }, [selected]);

  // ── Drag & Drop (admin only) ──────────────────────────────
  function handleDragStart(e, index) {
    dragItem.current = index;
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox
    e.dataTransfer.setData("text/plain", index);
  }

  function handleDragEnter(e, index) {
    e.preventDefault();
    dragOver.current = index;
    if (dragItem.current === null || dragItem.current === index) return;

    // Reorder in state — read from photosRef so we always have current list
    const next = [...photosRef.current];
    const dragged = next.splice(dragItem.current, 1)[0];
    next.splice(index, 0, dragged);
    dragItem.current = index; // update ref to new position
    setPhotos(next);
  }

  async function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    // Save order to backend using photosRef which has the latest order
    try {
      await reorderPhotos(photosRef.current.map(p => p._id));
    } catch (err) {
      console.error("Reorder failed:", err);
    }
    dragItem.current = null;
    dragOver.current = null;
  }

  function handleDragEnd() {
    // Fallback if drop didn't fire (e.g. dropped outside)
    setDragging(false);
    dragItem.current = null;
    dragOver.current = null;
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete(e, photoId) {
    e.stopPropagation();
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setDeleting(photoId);
    try {
      await deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p._id !== photoId));
      if (selected?._id === photoId) setSelected(null);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
    }
  }

  // ── Likes ─────────────────────────────────────────────────
  async function handleLike(e, photoId) {
    e.stopPropagation();
    try {
      const { liked } = await toggleLike(photoId);
      setPhotos(prev => prev.map(p => {
        if (p._id !== photoId) return p;
        const updatedLikes = liked
          ? [...(p.likes || []), user.id]
          : (p.likes || []).filter(id => id !== user.id);
        return { ...p, likes: updatedLikes };
      }));
      if (selected?._id === photoId) {
        setSelected(prev => ({
          ...prev,
          likes: liked
            ? [...(prev.likes || []), user.id]
            : (prev.likes || []).filter(id => id !== user.id)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ── Comments ──────────────────────────────────────────────
  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !selected) return;
    setCommentLoading(true);
    try {
      const newComment = await postComment(selected._id, commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText("");
      setPhotos(prev => prev.map(p =>
        p._id === selected._id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
      ));
    } catch (err) {
      alert(err.message);
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteComment(selected._id, commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setPhotos(prev => prev.map(p =>
        p._id === selected._id ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p
      ));
    } catch (err) {
      alert(err.message);
    }
  }

  const isLiked = (photo) => (photo.likes || []).includes(user?.id);

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10 flex items-end gap-6">
          <div>
            <h1 className="font-display text-5xl font-light text-stone-50 mb-2">Picture Time</h1>
            <p className="text-stone-500 text-sm">
              <span className="font-extrabold">{photos.length}</span> Privately Shared Photo{photos.length !== 1 ? "s" : ""}
              {user?.isAdmin && " · Drag to reorder"}
            </p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent mb-3" />
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-8 h-8 border border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32 text-stone-600">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p className="font-display text-xl font-light">No photos yet</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                className={`break-inside-avoid mb-3 group relative overflow-hidden bg-stone-900 select-none
                  ${user?.isAdmin ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                  ${dragging && dragItem.current === index ? "opacity-40 ring-2 ring-gold-400" : "opacity-100"}`}
                draggable={!!user?.isAdmin}
                onDragStart={user?.isAdmin ? (e) => handleDragStart(e, index) : undefined}
                onDragEnter={user?.isAdmin ? (e) => handleDragEnter(e, index) : undefined}
                onDragOver={e => e.preventDefault()}
                onDrop={user?.isAdmin ? handleDrop : undefined}
                onDragEnd={user?.isAdmin ? handleDragEnd : undefined}
                onClick={() => !dragging && setSelected(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Gallery photo"}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                  loading="lazy"
                  draggable={false}
                />

                {/* Bottom overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-3
                                translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {photo.caption && (
                    <p className="text-stone-200 text-sm font-light mb-2">{photo.caption}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleLike(e, photo._id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${isLiked(photo) ? "text-red-400" : "text-stone-400 hover:text-red-400"}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={isLiked(photo) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      {(photo.likes || []).length}
                    </button>
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      {photo.commentCount || 0}
                    </span>
                  </div>
                </div>

                {/* Drag handle */}
                {user?.isAdmin && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-70 transition-opacity pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow">
                      <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                    </svg>
                  </div>
                )}

                {/* Delete button */}
                {user?.isAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, photo._id)}
                    disabled={deleting === photo._id}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center
                               bg-black/70 hover:bg-red-900/90 text-stone-400 hover:text-white
                               opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    {deleting === photo._id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox with comments */}
      {selected && (
        <div className="fixed inset-0 z-50 flex bg-black/95" onClick={() => setSelected(null)}>
          {/* Photo side */}
          <div className="flex-1 flex items-center justify-center p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 text-sm tracking-widest uppercase"
              onClick={() => setSelected(null)}
            >
              Close ✕
            </button>

            {user?.isAdmin && (
              <button
                className="absolute top-4 left-4 flex items-center gap-2 text-stone-500 hover:text-red-400 text-xs tracking-widest uppercase transition-colors"
                onClick={(e) => handleDelete(e, selected._id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            )}

            <div className="max-w-3xl w-full">
              <img src={selected.url} alt={selected.caption || ""} className="max-h-[75vh] w-full object-contain" />
              {selected.caption && (
                <p className="text-stone-400 text-sm text-center mt-3 font-light">{selected.caption}</p>
              )}
              <div className="flex justify-center mt-4">
                <button
                  onClick={(e) => handleLike(e, selected._id)}
                  className={`flex items-center gap-2 px-4 py-2 border transition-colors text-sm
                    ${isLiked(selected)
                      ? "border-red-500/50 text-red-400"
                      : "border-stone-700 text-stone-400 hover:border-red-500/50 hover:text-red-400"}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked(selected) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  {(selected.likes || []).length} {(selected.likes || []).length === 1 ? "like" : "likes"}
                </button>
              </div>
            </div>
          </div>

          {/* Comments sidebar */}
          <div className="w-80 border-l border-stone-800 flex flex-col bg-stone-950" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-stone-800">
              <h3 className="font-display text-lg font-light text-stone-200">Comments</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-stone-600 text-sm">No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className="group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-gold-400 text-xs font-medium">{comment.user?.name}</span>
                        <span className="text-stone-600 text-xs ml-2">
                            {(() => {
                                    const diff = Date.now() - new Date(comment.createdAt);
                                    const mins = Math.floor(diff / 60000);
                                    if (mins < 1) return "just now";
                                    if (mins < 60) return `${mins}m ago`;
                                    const hrs = Math.floor(mins / 60);
                                    if (hrs < 24) return `${hrs}h ago`;
                                    return new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                  })()}
                        </span>
                      </div>
                      {(user?.isAdmin || comment.user?._id === user?.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 transition-all"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-stone-300 text-sm mt-1">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-4 border-t border-stone-800">
              <form onSubmit={handleComment} className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 focus:border-gold-400
                             text-stone-100 placeholder-stone-600 px-3 py-2 text-sm resize-none
                             focus:outline-none transition-colors"
                  placeholder="Add a comment…"
                  rows={2}
                  maxLength={500}
                />
                <button type="submit" disabled={commentLoading || !commentText.trim()} className="btn-primary w-full text-xs py-2">
                  {commentLoading ? "Posting…" : "Post Comment"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
