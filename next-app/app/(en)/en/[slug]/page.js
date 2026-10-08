import "../../../home.css";
import { MigrationPlaceholder } from "../../../../components/migration-preview";
import { CartPage } from "../../../../components/cart-provider";
import { CategoryCatalogPage } from "../../../../components/live-catalog";
import OccasionsPage from "../../../../components/occasions-page";
import "../../../occasions.css";

export default async function EnglishPreviewPage({ params }) {
  const { slug } = await params;
  if (slug === "occasions") return <OccasionsPage locale="en" />;
  if (slug === "cart") return <CartPage locale="en" />;
  if (["gifts","cake","flowers"].includes(slug)) return <CategoryCatalogPage locale="en" slug={slug} />;
  return <MigrationPlaceholder locale="en" slug={slug} />;
}
