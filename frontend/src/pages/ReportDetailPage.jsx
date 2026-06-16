import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, ThumbsUp, Trash2, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../lib/authStore';

const STATUS_STYLES = {
  OPEN: 'bg-crimson-soft text-crimson',
  ASSIGNED: 'bg-saffron-soft text-saffron',
  IN_PROGRESS: 'bg-teal-soft text-teal',
  RESOLVED: 'bg-teal-soft text-teal',
  CLOSED: 'bg-closed-soft text-closed',
};

const CATEGORY_LABELS = {
  INFRASTRUCTURE: '🏗️ Infrastructure',
  SANITATION: '🧹 Sanitation',
  PUBLIC_SAFETY: '👮 Public Safety',
  UTILITIES: '⚡ Utilities',
  ENVIRONMENT: '🌱 Environment',
  OTHER: '📋 Other',
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.role);
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/${id}`);
      setReport(res.data);
    } catch (err) {
      setError('Report not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!token) return;
    setUpvoting(true);
    try {
      await api.post(`/reports/${id}/upvote`);
      setReport((r) => ({ ...r, upvoteCount: (r.upvoteCount || 0) + 1 }));
    } catch (err) {
      // Already upvoted or error — ignore
    } finally {
      setUpvoting(false);
    }
  };

  const handleComment = async () => {
    if (!commentBody.trim()) return;
    setCommenting(true);
    setCommentError('');
    try {
      const res = await api.post(`/reports/${id}/comments`, { body: commentBody });
      setReport((r) => ({
        ...r,
        comments: [...(r.comments || []), res.data],
      }));
      setCommentBody('');
    } catch (err) {
      setCommentError('Failed to post comment. Please try again.');
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setReport((r) => ({
        ...r,
        comments: r.comments.filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      // ignore
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    setStatusError('');
    try {
      const payload = { status: newStatus };
      if (newStatus === 'RESOLVED' && resolutionNote.trim()) {
        payload.resolutionNote = resolutionNote;
      }
      const res = await api.patch(`/reports/${id}/status`, payload);
      setReport(res.data);
      setShowStatusModal(false);
      setNewStatus('');
      setResolutionNote('');
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-6 bg-bg-warm rounded w-1/2" />
        <div className="h-4 bg-bg-warm rounded w-1/4" />
        <div className="h-32 bg-bg-warm rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <div className="bg-crimson-soft text-crimson text-sm px-4 py-3 rounded-[10px] mb-4">
          {error}
        </div>
        <Link to="/home" className="text-indigo text-sm font-medium hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  const isAuthority = role === 'AUTHORITY';
  const isReporter = report.reporterId === userId;
  const canUpdateStatus = isAuthority && !isReporter;

  return (
    <div className="max-w-2xl">
      <Link
        to="/home"
        className="flex items-center gap-2 text-muted text-sm mb-6 hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      {/* Report card */}
      <div className="bg-surface border border-line rounded-[16px] p-6 mb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[report.status] || 'bg-bg text-muted'}`}>
            {report.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-muted">
            {CATEGORY_LABELS[report.category] || report.category}
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink mb-3">
          {report.title}
        </h1>

        <p className="text-ink-soft text-sm leading-relaxed mb-4">
          {report.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted mb-4">
          <MapPin size={14} />
          <span>{report.address || `${report.latitude}, ${report.longitude}`}</span>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-line flex-wrap">
          <button
            onClick={handleUpvote}
            disabled={upvoting || !token}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-line text-sm font-medium text-ink hover:bg-crimson-soft hover:text-crimson hover:border-crimson transition-colors disabled:opacity-50"
          >
            <ThumbsUp size={16} />
            {report.upvoteCount || 0} Upvotes
          </button>

          {canUpdateStatus && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-indigo bg-indigo-soft text-indigo text-sm font-medium hover:bg-indigo hover:text-white transition-colors"
            >
              <ChevronDown size={16} />
              Update Status
            </button>
          )}

          <span className="text-xs text-muted">
            Reported on {new Date(report.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Resolution note */}
      {report.resolutionNote && (
        <div className="bg-teal-soft border border-teal rounded-[16px] p-5 mb-4">
          <h3 className="text-sm font-semibold text-teal mb-2">✓ Resolution Note</h3>
          <p className="text-sm text-ink-soft">{report.resolutionNote}</p>
        </div>
      )}

      {/* Comments */}
      <div className="bg-surface border border-line rounded-[16px] p-5">
        <h3 className="font-semibold text-ink text-sm mb-4">
          Comments ({report.comments?.length || 0})
        </h3>

        {/* Comment form */}
        {token && (
          <div className="mb-4">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-[10px] border border-line bg-bg text-ink text-sm outline-none focus:border-crimson transition-colors resize-none mb-2"
            />
            {commentError && (
              <p className="text-crimson text-xs mb-2">{commentError}</p>
            )}
            <button
              onClick={handleComment}
              disabled={commenting || !commentBody.trim()}
              className="px-4 py-2 bg-crimson text-white rounded-[10px] text-sm font-semibold hover:bg-crimson-dark transition-colors disabled:opacity-50"
            >
              {commenting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        )}

        {/* Comment list */}
        {!report.comments || report.comments.length === 0 ? (
          <p className="text-muted text-sm">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {report.comments.map((comment) => (
              <div key={comment.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo text-white flex items-center justify-center text-xs font-semibold">
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-medium text-ink">{comment.user?.name || 'Unknown'}</span>
                    <span className="text-xs text-muted">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {token && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-subtle hover:text-crimson transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-ink-soft ml-9">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-[16px] p-6 max-w-sm w-full border border-line">
            <h2 className="text-lg font-semibold text-ink mb-4">Update Report Status</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-[10px] border border-line bg-bg text-ink text-sm outline-none focus:border-indigo transition-colors"
              >
                <option value="">Select a status</option>
                {report.status === 'OPEN' && <option value="ASSIGNED">Assigned</option>}
                {report.status === 'ASSIGNED' && <option value="IN_PROGRESS">In Progress</option>}
                {report.status === 'IN_PROGRESS' && <option value="RESOLVED">Resolved</option>}
                {report.status === 'RESOLVED' && <option value="CLOSED">Closed</option>}
              </select>
            </div>

            {newStatus === 'RESOLVED' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink mb-2">Resolution Note (optional)</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-line bg-bg text-ink text-sm outline-none focus:border-indigo transition-colors resize-none"
                />
              </div>
            )}

            {statusError && (
              <p className="text-crimson text-xs mb-4">{statusError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus('');
                  setResolutionNote('');
                  setStatusError('');
                }}
                className="flex-1 px-4 py-2 rounded-[10px] border border-line text-ink text-sm font-medium hover:bg-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus || !newStatus}
                className="flex-1 px-4 py-2 bg-indigo text-white rounded-[10px] text-sm font-semibold hover:bg-indigo-dark transition-colors disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}