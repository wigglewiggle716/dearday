import { MigrationPlaceholder } from "../../../../components/migration-preview";

export default async function EnglishPreviewPage({ params }) {
  const { slug } = await params;
  return <MigrationPlaceholder locale="en" slug={slug} />;
}
