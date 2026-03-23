import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeTrustedUploadThingFileUrl } from "@/lib/trusted-resource-url";
import { createTrustedUploadToken } from "@/lib/trusted-upload-token";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        const session = await auth.api.getSession({
          headers: await headers(),
        });

        if (!session) {
          console.error("UploadThing: No session found");
          throw new Error("Unauthorized");
        }

        console.log("UploadThing: Session verified for user:", session.user.id);
        return { userId: session.user.id };
      } catch (error) {
        console.error("UploadThing middleware error:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const trustedFile = normalizeTrustedUploadThingFileUrl(file.ufsUrl ?? file.url);

      if (!trustedFile) {
        throw new Error("UploadThing returned an unexpected file host");
      }

      return {
        fileKey: trustedFile.fileKey,
        fileUrl: trustedFile.fileUrl,
        uploadToken: createTrustedUploadToken({
          fileKey: trustedFile.fileKey,
          fileUrl: trustedFile.fileUrl,
          userId: metadata.userId,
        }),
      };
    }),

  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      return {
        fileUrl: file.ufsUrl ?? file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
