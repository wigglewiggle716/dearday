import { MigrationPlaceholder } from "../../../components/migration-preview";

export default async function ArabicPreviewPage({ params }) {
  const { slug } = await params;
  return <MigrationPlaceholder locale="ar" slug={slug} />;
}
