import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useCreateNotebook } from "../../hooks/useNotebooks";
import type { Visibility } from "../../types";
import { Lock, Globe, Shield } from "lucide-react";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateNotebookModal({
  isOpen,
  onClose,
}: CreateNotebookModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [password, setPassword] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const createNotebook = useCreateNotebook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createNotebook.mutateAsync({
      title,
      description,
      coverImage,
      visibility,
      password: visibility === "protected" ? password : undefined,
    });

    // Reset and close
    setTitle("");
    setDescription("");
    setVisibility("public");
    setPassword("");
    setCoverImage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Notebook" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Notebook Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Thoughts..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this notebook about?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <Input
          label="Cover Image URL (optional)"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://..."
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="public"
                checked={visibility === "public"}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="mr-3"
              />
              <Globe className="mr-2 text-green-600" size={20} />
              <div>
                <div className="font-medium">Public</div>
                <div className="text-sm text-gray-600">
                  Anyone can discover and read
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="protected"
                checked={visibility === "protected"}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="mr-3"
              />
              <Shield className="mr-2 text-yellow-600" size={20} />
              <div>
                <div className="font-medium">Protected</div>
                <div className="text-sm text-gray-600">
                  Password required to view
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="private"
                checked={visibility === "private"}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="mr-3"
              />
              <Lock className="mr-2 text-red-600" size={20} />
              <div>
                <div className="font-medium">Private</div>
                <div className="text-sm text-gray-600">Only you can access</div>
              </div>
            </label>
          </div>
        </div>

        {visibility === "protected" && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a password"
            required
          />
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createNotebook.isPending}
            className="flex-1"
          >
            {createNotebook.isPending ? "Creating..." : "Create Notebook"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
