import { previewPackageFile } from "@/lib/importer";

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: pnpm import:dry-run <path-to-package.json>");
    process.exit(1);
  }

  try {
    const preview = await previewPackageFile(inputPath);

    console.log(`\nPackage: ${preview.title}`);
    console.log(`ID: ${preview.packageId}`);
    console.log(`Version: ${preview.packageVersion}`);
    console.log(`Source: ${preview.sourcePath ?? "n/a"}`);

    console.log("\nCounts:");
    console.log(`Entities     create=${preview.counts.entities.create} update=${preview.counts.entities.update} skip=${preview.counts.entities.skip}`);
    console.log(`Media        create=${preview.counts.media.create} update=${preview.counts.media.update} skip=${preview.counts.media.skip}`);
    console.log(`Relationships create=${preview.counts.relationships.create} update=${preview.counts.relationships.update} skip=${preview.counts.relationships.skip}`);
    console.log(`EntityMedia  create=${preview.counts.entityMedia.create} update=${preview.counts.entityMedia.update} skip=${preview.counts.entityMedia.skip}`);

    if (preview.warnings.length > 0) {
      console.log("\nWarnings:");
      for (const warning of preview.warnings) {
        console.log(`- ${warning}`);
      }
    }

    console.log("\nPreview items:");
    for (const item of preview.items) {
      console.log(`[${item.kind}] ${item.action} :: ${item.title} :: ${item.reason}`);
    }

    console.log("");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();