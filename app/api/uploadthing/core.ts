import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
  // a "pdfUploader" endpoint
  pdfUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        // Use Better Auth to protect the route
        const session = await auth.api.getSession({
          headers: await headers()
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
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File name:", file.name);
      console.log("File size:", file.size);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;