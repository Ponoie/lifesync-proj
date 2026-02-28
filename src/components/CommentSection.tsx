import { useState } from 'react';
import type { Comment } from '../types/comment';

interface CommentSectionProps {
  comments: Comment[];
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(comment.replies || []);

  const hasReplies = replies.length > 0;
  const maxDepth = 5;
  const canReply = depth < maxDepth;

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;

    const newReply: Comment = {
      id: `${Date.now()}`,
      author: 'You',
      content: replyText,
      timestamp: new Date(),
      replies: [],
    };

    setReplies([...replies, newReply]);
    setReplyText('');
    setShowReplyForm(false);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={`${depth > 0 ? 'ml-6 mt-3' : 'mb-4'} border-l-2 ${
        depth === 0 ? 'border-gray-200 pl-4' : 'border-blue-200 pl-4'
      }`}
    >
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-800">{comment.author}</span>
              <span className="text-xs text-gray-500">{timeAgo(comment.timestamp)}</span>
            </div>
            <p className="text-gray-700 text-sm">{comment.content}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {canReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}
          {hasReplies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? `▼ Hide ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : `► Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {showReplyForm && (
          <div className="mt-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && hasReplies && (
        <div className="mt-2">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ comments }: CommentSectionProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const sortedComments = [...comments].sort((a, b) => {
    return sortBy === 'newest'
      ? b.timestamp.getTime() - a.timestamp.getTime()
      : a.timestamp.getTime() - b.timestamp.getTime();
  });

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Comments ({comments.length})</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {sortedComments.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div>
          {sortedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
