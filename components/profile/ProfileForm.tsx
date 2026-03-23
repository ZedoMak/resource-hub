"use client";

import { useMemo, useState } from "react";
import { ImagePlus, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/lib/uploadthing";
import {
  createProfileAvatarDataUrl,
  findMatchingProfileAvatarPreset,
  getProfileAvatarPresets,
  getProfileInitials,
  type ProfileAvatarPresetId,
} from "@/lib/profile-avatar";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null | undefined;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const initialPreset = findMatchingProfileAvatarPreset(user.name, user.image);
  const [name, setName] = useState(user.name);
  const [uploadedImage, setUploadedImage] = useState(initialPreset ? null : user.image ?? null);
  const [avatarMode, setAvatarMode] = useState<"preset" | "upload" | "none">(
    initialPreset ? "preset" : user.image ? "upload" : "none",
  );
  const [selectedPresetId, setSelectedPresetId] = useState<ProfileAvatarPresetId>(initialPreset ?? "violet");
  const [avatarTab, setAvatarTab] = useState<"avatars" | "upload">(initialPreset || !user.image ? "avatars" : "upload");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const avatarOptions = useMemo(
    () => getProfileAvatarPresets().map((preset) => ({
      ...preset,
      preview: createProfileAvatarDataUrl(name, preset.id),
    })),
    [name],
  );

  const previewImage = useMemo(() => {
    if (avatarMode === "preset") {
      return createProfileAvatarDataUrl(name, selectedPresetId);
    }

    if (avatarMode === "upload") {
      return uploadedImage;
    }

    return null;
  }, [avatarMode, name, selectedPresetId, uploadedImage]);

  const initials = getProfileInitials(name);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: previewImage }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-full border-zinc-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Profile
        </Badge>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Personalize your account</h2>
          <p className="text-sm leading-6 text-zinc-500">
            Keep your public identity polished with a display name and a profile image that looks consistent everywhere in the app.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="rounded-3xl border-zinc-200/80 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-6 text-center">
            <Avatar className="h-28 w-28 border border-white/80 shadow-lg shadow-zinc-200/80">
              <AvatarImage src={previewImage ?? ""} alt={name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-zinc-900">{name || "Your profile"}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm leading-6 text-zinc-600">
              <div className="flex items-center gap-2 font-medium text-zinc-900">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Live preview
              </div>
              <p className="mt-1">Your avatar updates here first, then appears in navigation, comments, and uploads after saving.</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-zinc-200/80 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle>Profile picture</CardTitle>
              <CardDescription>Upload your own image or choose a polished generated avatar.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={avatarTab} onValueChange={(value) => setAvatarTab(value as "avatars" | "upload")} className="space-y-4">
                <TabsList className="rounded-full bg-zinc-100 p-1">
                  <TabsTrigger value="avatars" className="rounded-full px-4">Choose avatar</TabsTrigger>
                  <TabsTrigger value="upload" className="rounded-full px-4">Upload image</TabsTrigger>
                </TabsList>

                <TabsContent value="avatars" className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {avatarOptions.map((option) => {
                      const isSelected = avatarMode === "preset" && selectedPresetId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedPresetId(option.id);
                            setAvatarMode("preset");
                            setAvatarTab("avatars");
                          }}
                          className={cn(
                            "rounded-3xl border bg-white p-3 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm",
                            isSelected && "border-violet-400 ring-2 ring-violet-100",
                          )}
                        >
                          <Avatar className="mx-auto h-14 w-14">
                            <AvatarImage src={option.preview} alt={`${option.id} avatar`} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-zinc-500">Generated avatars stay crisp across the app and automatically update their initials when your display name changes.</p>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-900">
                      <ImagePlus className="h-4 w-4 text-violet-500" />
                      Upload a square image for the cleanest result
                    </div>
                    <UploadDropzone
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          setUploadedImage(res[0].url);
                          setAvatarMode("upload");
                          setAvatarTab("upload");
                          toast.success("Profile image uploaded! Save changes to apply it everywhere.");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`Upload failed: ${error.message}`);
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAvatarMode("preset");
                    setSelectedPresetId("violet");
                    setAvatarTab("avatars");
                  }}
                >
                  Use default avatar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAvatarMode("none");
                    setUploadedImage(null);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Remove image
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-200/80 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle>Account details</CardTitle>
              <CardDescription>Update how your name appears on resources, comments, and your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-zinc-700">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-2xl border-zinc-200 bg-white"
                  />
                  <p className="text-xs text-zinc-500">This name is visible on your uploaded resources and comments.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-zinc-700">Email address</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="h-11 rounded-2xl border-zinc-200 bg-zinc-50 text-zinc-500"
                    title="Email cannot be changed"
                  />
                  <p className="text-xs text-zinc-500">Your sign-in email is locked to keep account ownership stable.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm text-zinc-600">Save when you&apos;re happy with the preview to update your account everywhere.</p>
                <Button onClick={handleSave} disabled={isSaving} size="lg" className="h-11 rounded-2xl px-6">
                  {isSaving ? "Saving changes..." : "Save profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
