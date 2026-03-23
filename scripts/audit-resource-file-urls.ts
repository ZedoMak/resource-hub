import { db } from "../db";
import { resources } from "../db/schema";
import { isTrustedUploadThingFileUrl } from "../lib/trusted-resource-url";

async function main() {
  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      fileUrl: resources.fileUrl,
      fileKey: resources.fileKey,
      createdAt: resources.createdAt,
    })
    .from(resources);

  const invalidRows = rows.filter((row) => !isTrustedUploadThingFileUrl(row.fileUrl));

  if (invalidRows.length === 0) {
    console.log("All resource file URLs are on approved UploadThing hosts.");
    return;
  }

  console.log(`Found ${invalidRows.length} resource file URL(s) on untrusted hosts:`);
  console.table(
    invalidRows.map((row) => ({
      id: row.id,
      title: row.title,
      fileKey: row.fileKey,
      fileUrl: row.fileUrl,
      createdAt: row.createdAt,
    })),
  );
}

main().catch((error) => {
  console.error("Failed to audit resource file URLs.");
  console.error(error);
  process.exit(1);
});
