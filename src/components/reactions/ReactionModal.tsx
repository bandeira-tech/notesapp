import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useCreateReaction, useReactions } from "../../hooks/useReactions";
import { Heart, MessageCircle, Image, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Visibility } from "../../types";

interface ReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookPubkey: string;
  postPubkey: string;
  visibility?: Visibility;
  password?: string;
}

export function ReactionModal({
  isOpen,
  onClose,
  notebookPubkey,
  postPubkey,
  visibility = "public",
  password,
}: ReactionModalProps) {
  const [activeTab, setActiveTab] = useState<"likes" | "comments">("comments");
  const [comment, setComment] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "emoji" | "image">("text");
  const [mediaData, setMediaData] = useState("");

  const { data: reactions } = useReactions(notebookPubkey, postPubkey, visibility);
  const createReaction = useCreateReaction();

  const filteredReactions = reactions?.filter((r) =>
    activeTab === "likes" ? r.type === "like" : r.type === "comment"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createReaction.mutateAsync({
      postPubkey,
      notebookPubkey,
      type: "comment",
      content: comment,
      visibility,
      password,
      media: mediaData
        ? {
            type: mediaType,
            data: mediaData,
          }
        : undefined,
    });

    setComment("");
    setMediaData("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaData(reader.result as string);
      setMediaType("image");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reactions" size="lg">
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "comments"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              Comments
            </div>
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "likes"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart size={18} />
              Likes
            </div>
          </button>
        </div>

        {activeTab === "comments" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a reaction..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Image size={20} className="text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Smile size={20} className="text-gray-600" />
                </button>
              </div>

              <Button type="submit" size="sm" disabled={!comment.trim()}>
                Post Reaction
              </Button>
            </div>

            {mediaData && mediaType === "image" && (
              <div className="relative w-32 h-32">
                <img
                  src={mediaData}
                  alt="Upload preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setMediaData("")}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
          </form>
        )}

        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredReactions?.map((reaction) => (
            <div
              key={reaction.id}
              className="p-3 bg-gray-50 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {reaction.author.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {reaction.author.name || "Anonymous"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {reaction.createdAt
                        ? formatDistanceToNow(new Date(reaction.createdAt), {
                            addSuffix: true,
                          })
                        : "recently"}
                    </div>
                  </div>
                </div>
              </div>

              {reaction.content && (
                <p className="text-sm text-gray-700">{reaction.content}</p>
              )}

              {reaction.media?.type === "image" && (
                <img
                  src={reaction.media.data}
                  alt=""
                  className="rounded-lg max-w-xs"
                />
              )}
            </div>
          ))}

          {filteredReactions?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No {activeTab} yet
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
